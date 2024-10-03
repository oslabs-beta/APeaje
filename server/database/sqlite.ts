import Database from 'better-sqlite3';
import path from 'path';
import config from '../../config';

function setupDatabase(): any {
  const db = new Database(path.join(__dirname, config.database.filename), {
    verbose: console.log,
  });
  db.pragma('journal_mode = WAL');

  // if u need clean slate
  function dropTables(): void {
    const tables: string[] = ['Queries', 'Tiers', 'Budget', 'Users'];
    for (const table of tables) {
      db.prepare(`DROP TABLE IF EXISTS ${table}`).run();
    }
    console.log('Tables dropped successfully');
  }

  function createTables(): void {
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
    ];

    for (const sql of tables) {
      db.prepare(sql).run();
    }
    console.log('Tables created successfully');
  }

  function insertTiers(): void {
    // LEGACY CONFIG
    // type configType = { [key:string]: {
    //     model:string,
    //     quality: string,
    //     size: string,
    //     price: number,
    //   }
    // }
    // const config: configType = {
    //   A: { model: 'dall-e-3', quality: 'hd', size: '1024x1792', price: 0.120 },
    //   B: { model: 'dall-e-3', quality: 'hd', size: '1024x1024', price: 0.080 },
    //   C: { model: 'dall-e-3', quality: 'standard', size: '1024x1792', price: 0.080 },
    //   D: { model: 'dall-e-3', quality: 'standard', size: '1024x1024', price: 0.040 },
    //   E: { model: 'dall-e-2', quality: 'standard', size: '512x512', price: 0.018 },
    //   F: { model: 'dall-e-2', quality: 'standard', size: '256x256', price: 0.016 }
    // };

    const insertTier = db.prepare(`
      INSERT OR REPLACE INTO Tiers (api_name, tier_name, tier_config, thresholds, cost)
      VALUES (?, ?, ?, ?, ?)
    `);

    type configType = {
      model: string;
      quality: string;
      size: string;
      price: number;
    };

    for (const [tierName, tierConfig] of Object.entries(
      config.apis.openai.tiers
    ) as [tierName: string, tierConfig: configType][]) {
      try {
        insertTier.run(
          'openai',
          tierName,
          JSON.stringify(tierConfig),
          null,
          tierConfig.price
        );
        console.log(`inserted ${tierName} for openai`);
      } catch (error) {
        console.error(`error`, error);
      }
    }

    console.log('tiers insertion completed');
  }

  function initializeBudget(): void {
    const insertBudget = db.prepare(`
      INSERT OR IGNORE INTO Budget (api_name, budget)
      VALUES (?, ?)
    `);
    insertBudget.run('openai', config.apis.openai.initialBudget); //  initial budget set to $100
    console.log('Budget initialized');
  }

  function peekDatabase(): void {
    const tables: string[] = ['Users', 'Tiers', 'Queries', 'Budget'];
    const result: {} = {};

    for (const table of tables) {
      const rows = db.prepare(`SELECT * FROM ${table}`).all();
      return rows;
    }

    console.log('Current Database Contents:');
    console.log(JSON.stringify(result));
  }

  //  drop tables and start fresh
  dropTables();
  createTables();
  insertTiers();
  initializeBudget();
  //peekDatabase();
  return db;
}

export default setupDatabase;
