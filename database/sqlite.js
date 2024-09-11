const Database = require('better-sqlite3');
const path = require('path');

function setupDatabase() {
  const db = new Database(path.join(__dirname, 'test.db'), { verbose: console.log });
  db.pragma('journal_mode = WAL');

  // if u need clean slate 
  function dropTables() {
    const tables = ['Queries', 'Tiers', 'Budget', 'Users'];
    for (const table of tables) {
      db.prepare(`DROP TABLE IF EXISTS ${table}`).run();
    }
    console.log('Tables dropped successfully');
  }

  function createTables() {
    const tables = [
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
      )`
    ];

    for (const sql of tables) {
      db.prepare(sql).run();
    }
    console.log('Tables created successfully');
  }

  function insertTiers() {
    const config = {
      A: { model: 'dall-e-3', quality: 'hd', size: '1024x1792', price: 0.0120 },
      B: { model: 'dall-e-3', quality: 'hd', size: '1024x1024', price: 0.0080 },
      C: { model: 'dall-e-3', quality: 'Standard', size: '1024x1792', price: 0.0080 },
      D: { model: 'dall-e-3', quality: 'Standard', size: '1024x1024', price: 0.0040 },
      E: { model: 'dall-e-2', quality: 'Standard', size: '512x512', price: 0.0018 },
      F: { model: 'dall-e-2', quality: 'Standard', size: '256x256', price: 0.0016 }
    };

    const insertTier = db.prepare(`
      INSERT OR REPLACE INTO Tiers (api_name, tier_name, tier_config, thresholds, cost)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const [tierName, tierConfig] of Object.entries(config)) {
      try {
        insertTier.run('openai', tierName, JSON.stringify(tierConfig), null, tierConfig.price);
        console.log(`Inserted/updated tier ${tierName} for openai`);
      } catch (error) {
        console.error(`Error inserting tier ${tierName}:`, error);
      }
    }

    console.log('tiers insertion completed');
  }

  function peekDatabase() {
    const tables = ['Users', 'Tiers', 'Queries', 'Budget'];
    const result = {};
    
    for (const table of tables) {
      const rows = db.prepare(`SELECT * FROM ${table}`).all();
        return rows;
    }
    
    console.log('Current Database Contents:');
    console.log(JSON.stringify(result, null, 2));
  }

  //  drop tables and start fresh
  // dropTables();
  
  createTables();
  insertTiers();
  peekDatabase();  
  return db;
}

module.exports = setupDatabase;