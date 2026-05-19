const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(__dirname, 'planificador.db');

let _db = null;

async function getDb() {
  if (!_db) {
    _db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
    await _db.exec('PRAGMA journal_mode = WAL');
    await _db.exec('PRAGMA foreign_keys = ON');
  }
  return _db;
}

module.exports = { getDb };
