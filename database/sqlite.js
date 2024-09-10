const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'test.db'), { verbose: console.log });
db.pragma('journal_mode = WAL');



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
      price REAL NOT NULL,
      thresholds TEXT,
      UNIQUE(api_name, tier_name)
    )`,
    `CREATE TABLE IF NOT EXISTS Queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_name TEXT NOT NULL,
      prompt TEXT NOT NULL,
      tier_id INTEGER,
      dynamic_cost REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tier_id) REFERENCES Tiers(id)
    )`
  ];

  for (const sql of tables) {
    db.prepare(sql).run();
  }
  console.log('Tables created successfully');
}

createTables();

module.exports = db;


