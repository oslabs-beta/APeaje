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
        )`
    ];

    for (const sql of tables) {
        db.prepare(sql).run();
    }
    console.log('\n=== Tables created successfully ===');
};

const insertTiers = (db: Database): void => {
    const insertTier = db.prepare(`
    INSERT OR REPLACE INTO Tiers (api_name, tier_name, tier_config, thresholds, cost)
    VALUES (?, ?, ?, ?, ?)
  `);

    console.log('\n=== Inserting Tiers ===');
    for (const [tierName, tierConfig] of Object.entries(config.apis.openai.tiers)) {
        try {
            const thresholdData = config.apis.openai.thresholds[tierName];
            insertTier.run(
                'openai',
                tierName,
                JSON.stringify(tierConfig),
                JSON.stringify(thresholdData),
                (tierConfig as TierConfig).price
            );
            console.log(`✓ Inserted tier ${tierName}`);
        } catch (error) {
            console.error(`✗ Error inserting tier ${tierName}:`, error);
        }
    }
};

const initializeBudget = (db: Database): void => {
    const insertBudget = db.prepare(`
    INSERT OR IGNORE INTO Budget (api_name, budget)
    VALUES (?, ?)
  `);
    insertBudget.run('openai', config.apis.openai.initialBudget);
    console.log('\n=== Budget initialized ===');
};

function logDatabaseContent(db: Database): void {
    const tables = ['Users', 'Budget', 'Tiers', 'Queries', 'Api_settings'];

    console.log('\n======= Database Content =======');
    tables.forEach(table => {
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
            logDatabaseContent(db);
        },
        reset: () => {
            console.log('\n=== Resetting Database ===');
            const tables: string[] = ['Queries', 'Tiers', 'Budget', 'Users', 'Api_settings'];
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

export const databaseMiddleware = (controller: DatabaseController) => (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    res.locals.db = controller.db;
    next();
};

export const sqliteController = {
    query: (db: Database, sql: string, params: any[] = []) => db.prepare(sql).all(params),
    run: (db: Database, sql: string, params: any[] = []) => db.prepare(sql).run(params),
    get: (db: Database, sql: string, params: any[] = []) => db.prepare(sql).get(params),
};

const getAllUsers = (db: Database) => {
    return sqliteController.query(db, 'SELECT * FROM Users');
};

const addNewUser = (db: Database, username: string, password: string, role: string) => {
    return sqliteController.run(db, 'INSERT INTO Users (username, password, role) VALUES (?, ?, ?)', [username, password, role]);
};

const updateUserRole = (db: Database, userId: number, newRole: string) => {
    return sqliteController.run(db, 'UPDATE Users SET role = ? WHERE id = ?', [newRole, userId]);
};

const getUserById = (db: Database, userId: number) => {
    return sqliteController.get(db, 'SELECT * FROM Users WHERE id = ?', [userId]);
};

const deleteUser = (db: Database, userId: number) => {
    return sqliteController.run(db, 'DELETE FROM Users WHERE id = ?', [userId]);
};