// src/database/database.ts

import DatabaseConstructor, { Database } from 'better-sqlite3';
import path from 'path';
import config from '../../config';
import { Request, Response, NextFunction } from 'express';

// Interface for our database controller
interface DatabaseController {
    db: Database;
    initialize: () => void;
    reset: () => void;
    close: () => void;
}

// Function to create tables
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
    ];

    for (const sql of tables) {
        db.prepare(sql).run();
    }
    console.log('Tables created successfully');
};

// Function to insert tiers
const insertTiers = (db: Database): void => {
    const insertTier = db.prepare(`
    INSERT OR REPLACE INTO Tiers (api_name, tier_name, tier_config, thresholds, cost)
    VALUES (?, ?, ?, ?, ?)
  `);

    for (const [tierName, tierConfig] of Object.entries(config.apis.openai.tiers)) {
        try {
            insertTier.run(
                'openai',
                tierName,
                JSON.stringify(tierConfig),
                JSON.stringify(config.apis.openai.thresholds),
                tierConfig.price
            );
        } catch (error) {
            console.error(`Error inserting tier ${tierName}:`, error);
        }
    }
};

// Function to initialize budget
const initializeBudget = (db: Database): void => {
    const insertBudget = db.prepare(`
    INSERT OR IGNORE INTO Budget (api_name, budget)
    VALUES (?, ?)
  `);
    insertBudget.run('openai', config.apis.openai.initialBudget);
};

// Function to create database controller
const createDatabaseController = (dbPath: string): DatabaseController => {
    const db: Database = new DatabaseConstructor(dbPath, {
        verbose: console.log,
    });
    db.pragma('journal_mode = WAL');

    return {
        db,
        initialize: () => {
            createTables(db);
            insertTiers(db);
            initializeBudget(db);
        },
        reset: () => {
            const tables: string[] = ['Queries', 'Tiers', 'Budget', 'Users'];
            for (const table of tables) {
                db.prepare(`DROP TABLE IF EXISTS ${table}`).run();
            }
            createTables(db);
            insertTiers(db);
            initializeBudget(db);
        },
        close: () => {
            db.close();
        },
    };
};

// Function to initialize database from scratch
export const initializeDatabase = (): DatabaseController => {
    const dbPath = path.join(__dirname, config.database.filename);
    const controller = createDatabaseController(dbPath);
    controller.initialize();
    return controller;
};

// Function to connect to existing database
export const connectDatabase = (): DatabaseController => {
    const dbPath = path.join(__dirname, config.database.filename);
    return createDatabaseController(dbPath);
};

// Function to reset database
export const resetDatabase = (controller: DatabaseController): void => {
    controller.reset();
};

// Middleware to attach database to res.locals
export const databaseMiddleware = (controller: DatabaseController) => (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    res.locals.db = controller.db;
    next();
};

// SQLite controller for common operations
export const sqliteController = {
    query: (db: Database, sql: string, params: any[] = []) => db.prepare(sql).all(params),
    run: (db: Database, sql: string, params: any[] = []) => db.prepare(sql).run(params),
    get: (db: Database, sql: string, params: any[] = []) => db.prepare(sql).get(params),
};