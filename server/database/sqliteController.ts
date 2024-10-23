import DatabaseConstructor, { Database } from 'better-sqlite3';
import path from 'path';
import config from '../../config';
import { Request, Response, NextFunction } from 'express';

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
                config.apis.openai.tiers.price
            );
        } catch (error) {
            console.error(`Error inserting tier ${tierName}:`, error);
        }
    }
};

//   initialize budget
const initializeBudget = (db: Database): void => {
    const insertBudget = db.prepare(`
    INSERT OR IGNORE INTO Budget (api_name, budget)
    VALUES (?, ?)
  `);
    insertBudget.run('openai', config.apis.openai.initialBudget);
};

function logDatabaseContent(db: Database): void {
    const tables = ['Users', 'Budget', 'Tiers', 'Queries', 'Api_settings'];

    tables.forEach(table => {
        console.log(`\n--- ${table} Table Content ---`);
        const rows = db.prepare(`SELECT * FROM ${table}`).all();
        console.table(rows);
    });
}


//  function to create database controller
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
            logDatabaseContent(db);
        },
        reset: () => {
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
        },
    };
};

// initialize database from scratch
export const initializeDatabase = (): DatabaseController => {
    const dbPath = path.join(__dirname, config.database.filename);
    const controller = createDatabaseController(dbPath);
    controller.initialize();
    return controller;
};

//   connect to existing database
export const connectDatabase = (): DatabaseController => {
    const dbPath = path.join(__dirname, config.database.filename);
    return createDatabaseController(dbPath);
};

//  to reset database
export const resetDatabase = (controller: DatabaseController): void => {
    controller.reset();
};

//  attach database to res.locals
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
    // Executes a query and returns all results
    query: (db: Database, sql: string, params: any[] = []) => db.prepare(sql).all(params),

    // Executes a query that modifies the database (INSERT, UPDATE, DELETE)
    run: (db: Database, sql: string, params: any[] = []) => db.prepare(sql).run(params),

    // Executes a query and returns a single result
    get: (db: Database, sql: string, params: any[] = []) => db.prepare(sql).get(params),
};

//  examples:

// 1 querying multiple rows
const getAllUsers = (db: Database) => {
    return sqliteController.query(db, 'SELECT * FROM Users');
};

// 2 inserting a new record
const addNewUser = (db: Database, username: string, password: string, role: string) => {
    return sqliteController.run(db, 'INSERT INTO Users (username, password, role) VALUES (?, ?, ?)', [username, password, role]);
};

// 3 updating a record
const updateUserRole = (db: Database, userId: number, newRole: string) => {
    return sqliteController.run(db, 'UPDATE Users SET role = ? WHERE id = ?', [newRole, userId]);
};

// 4 getting a single record
const getUserById = (db: Database, userId: number) => {
    return sqliteController.get(db, 'SELECT * FROM Users WHERE id = ?', [userId]);
};

// 5 deleting a record
const deleteUser = (db: Database, userId: number) => {
    return sqliteController.run(db, 'DELETE FROM Users WHERE id = ?', [userId]);
};