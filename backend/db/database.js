const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'forknewname.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db = null;
let SQL = null;

async function getDB() {
  if (db) return db;

  SQL = await initSqlJs();

  // Load existing DB file or create fresh
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log('[DB] Loaded existing database.');
  } else {
    db = new SQL.Database();
    console.log('[DB] Created new database.');
  }
  return db;
}

function saveDB() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function initDB(database) {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  database.run(schema);
  saveDB();
  console.log('[DB] Schema initialized.');
}

function seedIfEmpty(database) {
  const result = database.exec('SELECT COUNT(*) AS cnt FROM names');
  const count = result.length > 0 ? result[0].values[0][0] : 0;

  if (count === 0) {
    console.log('[DB] Names table empty, running seed...');
    const seed = require('./seed/seed');
    seed.run(database, SQL);
    saveDB();
  } else {
    console.log(`[DB] Names table has ${count} records, skip seed.`);
  }
}

function closeDB() {
  if (db) {
    saveDB();
    db.close();
    db = null;
    console.log('[DB] Connection closed.');
  }
}

// Auto-save periodically (every 60 seconds)
let saveInterval = null;
function startAutoSave() {
  if (saveInterval) return;
  saveInterval = setInterval(() => {
    if (db) {
      saveDB();
    }
  }, 60000);
}

function stopAutoSave() {
  if (saveInterval) {
    clearInterval(saveInterval);
    saveInterval = null;
  }
}

module.exports = { getDB, initDB, seedIfEmpty, saveDB, closeDB, startAutoSave, stopAutoSave };
