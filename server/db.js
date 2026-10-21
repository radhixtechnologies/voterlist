import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'voter_portal.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode for reliability
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login_id TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      mobile TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('SUPER_ADMIN', 'ADMIN', 'ASSOCIATE_MEMBER', 'VOTER')),
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      managed_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      must_change_password INTEGER DEFAULT 0,
      last_login_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS voters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      voter_login_id TEXT NOT NULL,
      epic_number TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      mobile TEXT UNIQUE NOT NULL,
      gender TEXT CHECK(gender IN ('MALE', 'FEMALE', 'OTHER')),
      dob TEXT,
      age INTEGER,
      address TEXT NOT NULL,
      ward TEXT NOT NULL,
      area TEXT NOT NULL,
      constituency TEXT NOT NULL,
      district TEXT NOT NULL,
      state TEXT NOT NULL,
      associate_member_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      emergency_contact TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'FLAGGED')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      user_name TEXT,
      user_role TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS portal_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_login_id ON users(login_id);
    CREATE INDEX IF NOT EXISTS idx_users_managed_by ON users(managed_by_admin_id);
    CREATE INDEX IF NOT EXISTS idx_voters_epic ON voters(epic_number);
    CREATE INDEX IF NOT EXISTS idx_voters_mobile ON voters(mobile);
    CREATE INDEX IF NOT EXISTS idx_voters_associate ON voters(associate_member_id);
    CREATE INDEX IF NOT EXISTS idx_voters_ward ON voters(ward);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
  `);
}

// Helper wrapper functions
export const query = {
  get: (sql, ...params) => {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  },
  all: (sql, ...params) => {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },
  run: (sql, ...params) => {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return {
      changes: result.changes,
      lastInsertRowid: Number(result.lastInsertRowid),
    };
  },
  exec: (sql) => {
    return db.exec(sql);
  }
};

export default db;

