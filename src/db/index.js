const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './data/planner.db';

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;
let SQL = null;

// Initialize database
async function initializeDatabase() {
  SQL = await initSqlJs();

  // Load existing database or create new one
  try {
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
      console.log('Database loaded from', DB_PATH);
    } else {
      db = new SQL.Database();
      console.log('New database created');
    }
  } catch (err) {
    console.error('Error loading database:', err);
    db = new SQL.Database();
  }

  // Run schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.run(schema);

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  console.log('Database initialized successfully');
  saveDatabase();
}

// Save database to disk
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Wrapper to make sql.js API similar to better-sqlite3
const dbWrapper = {
  prepare(sql) {
    return {
      run(...params) {
        db.run(sql, params);
        saveDatabase();
        return {
          lastInsertRowid: db.exec('SELECT last_insert_rowid()')[0]?.values[0]?.[0],
          changes: db.getRowsModified()
        };
      },
      get(...params) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
      }
    };
  },
  exec(sql) {
    db.run(sql);
    saveDatabase();
  },
  pragma(sql) {
    db.run(`PRAGMA ${sql}`);
  }
};

module.exports = { db: dbWrapper, initializeDatabase, saveDatabase };
