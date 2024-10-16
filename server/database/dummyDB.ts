import DatabaseConstructor, { Database } from 'better-sqlite3';
import { DatabaseController } from './sqliteController';

export function setupDummyDatabase(): DatabaseController {
    const db: Database = new DatabaseConstructor(':memory:');

    function initialize(): void {
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
        console.log('Dummy tables created successfully');
        insertDummyData(db);
        logDatabaseContent(db);
    }

    function reset(): void {
        const tables: string[] = ['Queries', 'Tiers', 'Budget', 'Users'];
        for (const table of tables) {
            db.prepare(`DROP TABLE IF EXISTS ${table}`).run();
        }
        initialize();
    }

    function close(): void {
        db.close();
    }

    return { db, initialize, reset, close };
}

function logDatabaseContent(db: Database): void {
    const tables = ['Users', 'Budget', 'Tiers', 'Queries'];

    tables.forEach(table => {
        console.log(`\n--- ${table} Table Content ---`);
        const rows = db.prepare(`SELECT * FROM ${table}`).all();
        console.table(rows);
    });
}

export function insertDummyData(db: Database): void {
    // Users
    const users = [
        { username: 'admin', password: 'adminpass', role: 'admin' },
        { username: 'user1', password: 'pass1', role: 'user' },
        { username: 'user2', password: 'pass2', role: 'user' },
        { username: 'manager', password: 'managerpass', role: 'manager' },
        { username: 'developer', password: 'devpass', role: 'developer' },
    ];

    const insertUser = db.prepare('INSERT INTO Users (username, password, role) VALUES (?, ?, ?)');
    for (const user of users) {
        insertUser.run(user.username, user.password, user.role);
    }

    // Budget (using hardcoded values)
    const budgets = [
        { api_name: 'openai', budget: 1000, spent: 250, total_spent: 750 },
        { api_name: 'google', budget: 500, spent: 100, total_spent: 400 },
        { api_name: 'azure', budget: 750, spent: 200, total_spent: 550 },
    ];

    const insertBudget = db.prepare('INSERT INTO Budget (api_name, budget, spent, total_spent) VALUES (?, ?, ?, ?)');
    for (const budget of budgets) {
        insertBudget.run(budget.api_name, budget.budget, budget.spent, budget.total_spent);
    }

    // Tiers (using hardcoded values)
    const tiers = [
        { api_name: 'openai', tier_name: 'A', tier_config: { model: 'dall-e-3', quality: 'hd', size: '1024x1792' }, thresholds: { budget: [{ threshold: 80, tier: 'A' }] }, cost: 0.120 },
        { api_name: 'openai', tier_name: 'B', tier_config: { model: 'dall-e-3', quality: 'hd', size: '1024x1024' }, thresholds: { budget: [{ threshold: 50, tier: 'B' }] }, cost: 0.080 },
        { api_name: 'openai', tier_name: 'C', tier_config: { model: 'dall-e-3', quality: 'standard', size: '1024x1792' }, thresholds: { budget: [{ threshold: 30, tier: 'C' }] }, cost: 0.080 },
        { api_name: 'google', tier_name: 'Basic', tier_config: { model: 'basic-gen', quality: 'standard' }, thresholds: { budget: [{ threshold: 60, tier: 'Basic' }] }, cost: 0.050 },
        { api_name: 'google', tier_name: 'Premium', tier_config: { model: 'premium-gen', quality: 'high' }, thresholds: { budget: [{ threshold: 90, tier: 'Premium' }] }, cost: 0.100 },
        { api_name: 'azure', tier_name: 'Standard', tier_config: { model: 'azure-standard', resolution: '512x512' }, thresholds: { budget: [{ threshold: 70, tier: 'Standard' }] }, cost: 0.060 },
        { api_name: 'azure', tier_name: 'Advanced', tier_config: { model: 'azure-advanced', resolution: '1024x1024' }, thresholds: { budget: [{ threshold: 85, tier: 'Advanced' }] }, cost: 0.090 },
    ];

    const insertTier = db.prepare('INSERT INTO Tiers (api_name, tier_name, tier_config, thresholds, cost) VALUES (?, ?, ?, ?, ?)');
    for (const tier of tiers) {
        insertTier.run(tier.api_name, tier.tier_name, JSON.stringify(tier.tier_config), JSON.stringify(tier.thresholds), tier.cost);
    }

    // Queries (using hardcoded values)
    const queries = [
        { api_name: 'openai', prompt: 'A futuristic city skyline at sunset', tier_id: 1 },
        { api_name: 'openai', prompt: 'A cat wearing a space suit on the moon', tier_id: 2 },
        { api_name: 'openai', prompt: 'An underwater scene with bioluminescent creatures', tier_id: 3 },
        { api_name: 'google', prompt: 'A steampunk-inspired flying machine', tier_id: 4 },
        { api_name: 'google', prompt: 'A magical forest with glowing plants', tier_id: 5 },
        { api_name: 'azure', prompt: 'A cyberpunk street market at night', tier_id: 6 },
        { api_name: 'azure', prompt: 'A fantasy castle floating in the clouds', tier_id: 7 },
        { api_name: 'openai', prompt: 'A robot chef cooking in a futuristic kitchen', tier_id: 1 },
        { api_name: 'google', prompt: 'A time-traveling DeLorean car', tier_id: 4 },
        { api_name: 'azure', prompt: 'An alien landscape with multiple moons', tier_id: 7 },
    ];

    const insertQuery = db.prepare(`
    INSERT INTO Queries (api_name, prompt, tier_id, timestamp) 
    VALUES (?, ?, ?, datetime('now', '-' || ? || ' hours'))
    `);

    for (let i = 0; i < queries.length; i++) {
        const query = queries[i];
        const hoursAgo = Math.floor(Math.random() * 72); // Random timestamp within the last 3 days
        insertQuery.run(query.api_name, query.prompt, query.tier_id, hoursAgo);
    }

    console.log('Dummy data inserted successfully');
}