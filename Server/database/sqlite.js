const Database = require('better-sqlite3');
const db = new Database('database/test.db', { verbose: console.log });
db.pragma('journal_mode = WAL');

const create = db.prepare(`CREATE TABLE queries (
    id SERIAL PRIMARY KEY,
    prompt TEXT NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    cost INTEGER NOT NULL,
    response TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)`)

create.run();

const stmt = db.prepare(
  "INSERT INTO queries (prompt, model_version, cost, response) VALUES (?, '2.5', 25, ?)"
);
const info = stmt.run('testing', 'test response');
const stmt2 = db.prepare('SELECT * from queries');
const info2 = stmt2.get();

console.log(info.changes);
console.log(info2);
