const Database = require('better-sqlite3');
const path = require('path');
const config = require('../../config.js');

function setupDatabase() {
  //using config for db sett
  const db = new Database(path.join(__dirname, config.database.filename), { verbose: console.log });
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

    // 
    for (const sql of tables) {
      db.prepare(sql).run();
    }
    console.log('Tables created successfully');
  }


    function insertTiers() {
      // prepare SQL 
      const insertTier = db.prepare(`
        INSERT OR REPLACE INTO Tiers (api_name, tier_name, tier_config, cost)
        VALUES (?, ?, ?, ?)
      `);

      // iterate through each tier in the config
      for (const [tierName, tierConfig] of Object.entries(config.apis.openai.tiers)) {
        // insert each tier in the database
        insertTier.run(
          'openai',
          tierName,
          JSON.stringify(tierConfig),
          tierConfig.price
        );
      }

      // log completion message
      console.log('Tiers insertion completed');
    }


  
    function initializeBudget() {
      const insertBudget = db.prepare(`
        INSERT OR IGNORE INTO Budget (api_name, budget)
        VALUES (?, ?)
      `);
      insertBudget.run('openai', config.apis.openai.initialBudget);
      console.log('Budget initialized');
    }



    function peekDatabase() {
      const tables = ['Users', 'Tiers', 'Queries', 'Budget'];
      const result = {};
    
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
    initializeBudget()
    peekDatabase();
    return db;
  }


module.exports = setupDatabase;