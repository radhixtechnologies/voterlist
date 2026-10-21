import 'dotenv/config';
import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isPostgres = Boolean(process.env.DATABASE_URL);
let pool;
let sqlite;

const postgresSchema = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
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
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS voters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    voter_login_id TEXT NOT NULL,
    epic_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    mobile TEXT UNIQUE NOT NULL,
    gender TEXT CHECK(gender IN ('MALE', 'FEMALE', 'OTHER')),
    dob DATE,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS portal_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_users_login_id ON users(login_id);
  CREATE INDEX IF NOT EXISTS idx_users_managed_by ON users(managed_by_admin_id);
  CREATE INDEX IF NOT EXISTS idx_voters_epic ON voters(epic_number);
  CREATE INDEX IF NOT EXISTS idx_voters_mobile ON voters(mobile);
  CREATE INDEX IF NOT EXISTS idx_voters_associate ON voters(associate_member_id);
  CREATE INDEX IF NOT EXISTS idx_voters_ward ON voters(ward);
  CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
`;

function initializeSqlite() {
  const defaultPath = process.env.VERCEL
    ? path.join('/tmp', 'voter_portal.db')
    : path.join(__dirname, '..', 'data', 'voter_portal.db');
  const dbPath = process.env.SQLITE_DATABASE_PATH
    ? path.resolve(process.env.SQLITE_DATABASE_PATH)
    : defaultPath;
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  sqlite = new DatabaseSync(dbPath);
  sqlite.exec('PRAGMA foreign_keys = ON;');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, login_id TEXT UNIQUE NOT NULL, email TEXT UNIQUE,
      mobile TEXT UNIQUE, password_hash TEXT NOT NULL, name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('SUPER_ADMIN', 'ADMIN', 'ASSOCIATE_MEMBER', 'VOTER')),
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      managed_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      must_change_password INTEGER DEFAULT 0, last_login_at TEXT,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS voters (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      voter_login_id TEXT NOT NULL, epic_number TEXT UNIQUE NOT NULL, full_name TEXT NOT NULL,
      mobile TEXT UNIQUE NOT NULL, gender TEXT CHECK(gender IN ('MALE', 'FEMALE', 'OTHER')),
      dob TEXT, age INTEGER, address TEXT NOT NULL, ward TEXT NOT NULL, area TEXT NOT NULL,
      constituency TEXT NOT NULL, district TEXT NOT NULL, state TEXT NOT NULL,
      associate_member_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      emergency_contact TEXT, status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'FLAGGED')),
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      user_name TEXT, user_role TEXT, action TEXT NOT NULL, target_type TEXT, target_id TEXT,
      details TEXT, ip_address TEXT, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS portal_settings (
      key TEXT PRIMARY KEY, value TEXT NOT NULL, description TEXT, updated_at TEXT DEFAULT (datetime('now'))
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

export async function initDatabase() {
  if (process.env.VERCEL && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be configured for Vercel deployments.');
  }

  if (!isPostgres) {
    initializeSqlite();
    return;
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true'
      ? { rejectUnauthorized: false }
      : process.env.DATABASE_SSL === 'false' ? false : undefined,
    max: Number(process.env.DATABASE_POOL_MAX || 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  await pool.query(postgresSchema);
}

export async function closeDatabase() {
  if (pool) await pool.end();
  if (sqlite) sqlite.close();
}

function convertRows(rows) {
  return rows.map(row => {
    for (const [key, value] of Object.entries(row)) {
      if (value !== null && (['c', 'count', 'total'].includes(key) || key.endsWith('_count'))) {
        row[key] = Number(value);
      }
    }
    return row;
  });
}

function convertSql(sql) {
  return sql
    .replace(/datetime\('now',\s*'-'\s*\|\|\s*\?\s*\|\|\s*' days'\)/gi, "CURRENT_TIMESTAMP - (?::int * INTERVAL '1 day')")
    .replace(/strftime\('%Y-%m',\s*created_at\)/gi, "TO_CHAR(created_at::timestamp, 'YYYY-MM')")
    .replace(/strftime\('%Y-%m',\s*v\.created_at\)/gi, "TO_CHAR(v.created_at::timestamp, 'YYYY-MM')")
    .replace(/strftime\('%Y-%m',\s*'now'\)/gi, "TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM')")
    .replace(/date\('now',\s*'-(\d+) days'\)/gi, "CURRENT_DATE - INTERVAL '$1 days'")
    .replace(/date\('now'\)/gi, 'CURRENT_DATE')
    .replace(/date\(((?:[a-z]+\.)?created_at)\)/gi, '$1::date')
    .replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP')
    .replace(/\bLIKE\b/gi, 'ILIKE')
    .replace(/\?/g, () => `$${++convertSql.parameterIndex}`);
}
convertSql.parameterIndex = 0;

export function preparePostgresSql(sql) {
  convertSql.parameterIndex = 0;
  return convertSql(sql);
}

function normalizeArgs(args) {
  return args.map(value => value === undefined ? null : value);
}

export const query = {
  async get(sql, ...args) {
    if (!isPostgres) return sqlite.prepare(sql).get(...args);
    const result = await pool.query(preparePostgresSql(sql), normalizeArgs(args));
    return convertRows(result.rows)[0];
  },
  async all(sql, ...args) {
    if (!isPostgres) return sqlite.prepare(sql).all(...args);
    const result = await pool.query(preparePostgresSql(sql), normalizeArgs(args));
    return convertRows(result.rows);
  },
  async run(sql, ...args) {
    if (!isPostgres) {
      const result = sqlite.prepare(sql).run(...args);
      return { changes: result.changes, lastInsertRowid: Number(result.lastInsertRowid) };
    }

    const insertTable = /^\s*INSERT\s+INTO\s+([a-z_]+)/i.exec(sql)?.[1]?.toLowerCase();
    const primaryKey = insertTable === 'portal_settings' ? null : 'id';
    const returningSql = insertTable && primaryKey && !/\bRETURNING\b/i.test(sql)
      ? `${sql.trim().replace(/;$/, '')} RETURNING ${primaryKey}`
      : sql;
    const result = await pool.query(preparePostgresSql(returningSql), normalizeArgs(args));
    return {
      changes: result.rowCount,
      lastInsertRowid: result.rows[0]?.[primaryKey] ?? null,
    };
  },
  async exec(sql) {
    if (!isPostgres) return sqlite.exec(sql);
    return pool.query(sql);
  },
  async transaction(callback) {
    if (!isPostgres) {
      sqlite.exec('BEGIN TRANSACTION');
      try {
        const result = await callback(query);
        sqlite.exec('COMMIT');
        return result;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    }

    const client = await pool.connect();
    const transactionQuery = {
      async run(sql, ...args) {
        const insertTable = /^\s*INSERT\s+INTO\s+([a-z_]+)/i.exec(sql)?.[1]?.toLowerCase();
        const primaryKey = insertTable === 'portal_settings' ? null : 'id';
        const returningSql = insertTable && primaryKey && !/\bRETURNING\b/i.test(sql)
          ? `${sql.trim().replace(/;$/, '')} RETURNING ${primaryKey}`
          : sql;
        const result = await client.query(preparePostgresSql(returningSql), normalizeArgs(args));
        return {
          changes: result.rowCount,
          lastInsertRowid: result.rows[0]?.[primaryKey] ?? null,
        };
      },
      async get(sql, ...args) {
        const result = await client.query(preparePostgresSql(sql), normalizeArgs(args));
        return convertRows(result.rows)[0];
      },
      async all(sql, ...args) {
        const result = await client.query(preparePostgresSql(sql), normalizeArgs(args));
        return convertRows(result.rows);
      },
    };

    try {
      await client.query('BEGIN');
      const result = await callback(transactionQuery);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};

export default query;
