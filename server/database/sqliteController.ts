import DatabaseConstructor, { Database } from 'better-sqlite3';
import path from 'path';
import config from '../../config';
import { Request, Response, NextFunction } from 'express';

interface TierConfig {
  model: string;
  quality: string;
  size: string;
  price: number;
}

interface Row {
  id: number;
  api_name: string;
  tier_name: string;
  tier_config: string;
  thresholds: string;
  cost: number;
}

interface InitialAccount {
  type: 'username' | 'email';
  username?: string;
  email?: string;
  role: string;
}

export interface DatabaseController {
  db: Database;
  initialize: () => void;
  reset: () => void;
  close: () => void;
}

const createTables = (db: Database): void => {
  const tables: string[] = [
    `CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )`,
    `CREATE TABLE IF NOT EXISTS Budget (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            api_name TEXT UNIQUE NOT NULL,
            budget REAL NOT NULL,
            spent REAL NOT NULL DEFAULT 0,
            total_spent REAL NOT NULL DEFAULT 0
        )`,
    `CREATE TABLE IF NOT EXISTS Tiers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            api_name TEXT NOT NULL,
            tier_name TEXT NOT NULL,
            tier_config TEXT NOT NULL,
            thresholds TEXT,
            cost REAL,
            UNIQUE(api_name, tier_name)
        )`,
    `CREATE TABLE IF NOT EXISTS Queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            api_name TEXT NOT NULL,
            prompt TEXT NOT NULL,
            tier_id INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
    `CREATE TABLE IF NOT EXISTS Api_settings (
            api_name TEXT PRIMARY KEY,
            use_time_based_tier INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
  ];

  for (const sql of tables) {
    db.prepare(sql).run();
  }
  console.log('\n=== Tables created successfully ===');
};

const insertTiers = (db: Database): void => {
  // First check if tiers exist
  const existingTiers = db.prepare('SELECT COUNT(*) as count FROM Tiers WHERE api_name = ?')
    .get('openai') as { count: number };

  // Only insert if no tiers exist
  if (existingTiers.count === 0) {
    const insertTier = db.prepare(`
      INSERT INTO Tiers (api_name, tier_name, tier_config, thresholds, cost)
      VALUES (?, ?, ?, ?, ?)
    `);

    console.log('\n=== Inserting Initial Tiers ===');
    for (const [tierName, tierConfig] of Object.entries(config.apis.openai.tiers)) {
      try {
        const thresholdData = config.apis.openai.thresholds[tierName];
        insertTier.run(
          'openai',
          tierName,
          JSON.stringify(tierConfig),
          JSON.stringify({
            percentage: null,
            time: { start: "00:00", end: "00:00" }
          }), // Initialize with empty thresholds
          (tierConfig as TierConfig).price
        );
        console.log(`✓ Inserted tier ${tierName}`);
      } catch (error) {
        console.error(`✗ Error inserting tier ${tierName}:`, error);
      }
    }
  } else {
    console.log('\n=== Tiers already exist, skipping initialization ===');
  }
};

// Also let's add a function to update tier configs without touching thresholds
const updateTierConfig = (db: Database, apiName: string, tierName: string, config: TierConfig): void => {
  const updateStmt = db.prepare(`
    UPDATE Tiers 
    SET tier_config = ?, cost = ?
    WHERE api_name = ? AND tier_name = ?
  `);

  updateStmt.run(
    JSON.stringify({
      model: config.model,
      quality: config.quality,
      size: config.size
    }),
    config.price,
    apiName,
    tierName
  );
};

const initializeBudget = (db: Database): void => {
  // only insert if no budget exists
  const existingBudget = db.prepare('SELECT * FROM Budget WHERE api_name = ?').get('openai');
  if (!existingBudget) {
    const insertBudget = db.prepare(`
      INSERT INTO Budget (api_name, budget, spent, total_spent)
      VALUES (?, ?, 0, 0)
    `);
    insertBudget.run('openai', config.apis.openai.initialBudget);
    console.log('\n=== Budget initialized ===');
  }
};

const initializeAccounts = (db: Database): void => {
  try {
    const { initialAccounts } = config;
    initialAccounts.forEach((account: InitialAccount) => {
      account.type === 'username'
        ? addNewUser(db, account.username, account.username, 'pre', `pre-${account.role}`)
        : account.type === 'email'
        ? addNewUser(db, account.email, account.email, 'pre', `pre-${account.role}`)
        : account.type === 'both'
        ? addNewUser(db, account.username, account.email, 'pre', `pre-${account.role}`)
        : null;
    });
    console.log('\n=== Accounts initialized ===');
  } catch (error) {
    console.error('Error initializing accounts:', error);
  }
};

function logDatabaseContent(db: Database): void {
  const tables = ['Users', 'Budget', 'Tiers', 'Queries', 'Api_settings'];

  console.log('\n======= Database Content =======');
  tables.forEach((table) => {
    console.log(`\n=== ${table} Table ===`);
    const rows = db.prepare(`SELECT * FROM ${table}`).all() as Row[];
    if (rows.length === 0) {
      console.log('No records found');
      return;
    }

    if (table === 'Tiers') {
      rows.forEach((row: Row) => {
        console.log('\nTier Record:');
        console.log('ID:', row.id);
        console.log('API Name:', row.api_name);
        console.log('Tier Name:', row.tier_name);
        console.log('Config:', JSON.parse(row.tier_config));
        try {
          console.log('Thresholds:', JSON.parse(row.thresholds));
        } catch (e) {
          console.log('Thresholds: null');
        }
        console.log('Cost:', row.cost);
        console.log('-------------------');
      });
    } else {
      console.table(rows);
    }
  });
  console.log('\n===============================\n');
}

const createDatabaseController = (dbPath: string): DatabaseController => {
  const db: Database = new DatabaseConstructor(dbPath, {
    verbose: console.log,
  });
  db.pragma('journal_mode = WAL');

  return {
    db,
    initialize: () => {
      console.log('\n=== Initializing Database ===');
      createTables(db);
      insertTiers(db);
      initializeBudget(db);
      initializeAccounts(db);
      logDatabaseContent(db);
    },
    reset: () => {
      console.log('\n=== Resetting Database ===');
      const tables: string[] = [
        'Queries',
        'Tiers',
        'Budget',
        'Users',
        'Api_settings',
      ];
      for (const table of tables) {
        db.prepare(`DROP TABLE IF EXISTS ${table}`).run();
      }
      createTables(db);
      insertTiers(db);
      initializeBudget(db);
      logDatabaseContent(db);
    },
    close: () => {
      db.close();
      console.log('\n=== Database Connection Closed ===');
    },
  };
};

export const initializeDatabase = (): DatabaseController => {
  const dbPath = path.join(__dirname, config.database.filename);
  const controller = createDatabaseController(dbPath);
  controller.initialize();
  return controller;
};

export const connectDatabase = (): DatabaseController => {
  const dbPath = path.join(__dirname, config.database.filename);
  return createDatabaseController(dbPath);
};

export const resetDatabase = (controller: DatabaseController): void => {
  controller.reset();
};

export const databaseMiddleware =
  (controller: DatabaseController) =>
  (req: Request, res: Response, next: NextFunction) => {
    res.locals.db = controller.db;
    next();
  };

export const sqliteController = {
  query: (db: Database, sql: string, params: any[] = []) =>
    db.prepare(sql).all(params),
  run: (db: Database, sql: string, params: any[] = []) =>
    db.prepare(sql).run(params),
  get: (db: Database, sql: string, params: any[] = []): any =>
    db.prepare(sql).get(params),
  getAllUsers: (req: Request, res: Response, next: NextFunction) => {
    const db = res.locals.db;
    const users = sqliteController.query(db, 'SELECT * FROM Users');
    console.log(users);
    res.locals.users = users;
    return next();
  },
};

const addNewUser = (
  db: Database,
  username: string,
  email: string,
  password: string,
  role: string
) => {
  // first check if user exists
  const existingUser = sqliteController.get(
    db,
    'SELECT username FROM Users WHERE username = ? OR email = ?',
    [username, email]
  );

  if (existingUser) {
    console.log(`User ${username} already exists, skipping...`);
    return;
  }

  return sqliteController.run(
    db,
    'INSERT INTO Users (username, email, password, role) VALUES (?, ?, ?, ?)',
    [username, email, password, role]
  );
};

const updateUserRole = (db: Database, userId: number, newRole: string) => {
  return sqliteController.run(db, 'UPDATE Users SET role = ? WHERE id = ?', [
    newRole,
    userId,
  ]);
};

const updateInitialUser = (db: Database, userId: number, newUsername: string, newEmail: string, newRole: string) => {
    return sqliteController.run(db, 'UPDATE Users SET username = ?, email = ?, role = ? WHERE id = ?', [
      newUsername,
      newEmail,  
      newRole,
      userId,
    ]);
  };

const getUserById = (db: Database, userId: number) => {
  return sqliteController.get(db, 'SELECT * FROM Users WHERE id = ?', [userId]);
};

const deleteUser = (db: Database, userId: number) => {
  return sqliteController.run(db, 'DELETE FROM Users WHERE id = ?', [userId]);
};
