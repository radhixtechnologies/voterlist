import 'dotenv/config';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isPostgres = Boolean(process.env.DATABASE_URL);
let pool;
let sqlite;
let sqliteDbPath;

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

function saveSqliteDisk() {
  if (sqlite && sqliteDbPath) {
    try {
      const data = sqlite.export();
      fs.mkdirSync(path.dirname(sqliteDbPath), { recursive: true });
      fs.writeFileSync(sqliteDbPath, Buffer.from(data));
    } catch (e) {
      // Ignore write errors in read-only environments
    }
  }
}

async function initializeSqlite() {
  const wasmCandidatePaths = [
    path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
    path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
    path.join(__dirname, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
  ];
  const validWasmPath = wasmCandidatePaths.find(p => fs.existsSync(p));

  const SQL = await initSqlJs({
    locateFile: (file) => (validWasmPath && file.endsWith('.wasm') ? validWasmPath : file)
  });

  const defaultPath = process.env.VERCEL
    ? path.join('/tmp', 'voter_portal.db')
    : path.join(__dirname, '..', 'data', 'voter_portal.db');
  sqliteDbPath = process.env.SQLITE_DATABASE_PATH
    ? path.resolve(process.env.SQLITE_DATABASE_PATH)
    : defaultPath;

  const repoDbPath = path.join(__dirname, '..', 'data', 'voter_portal.db');

  if (fs.existsSync(sqliteDbPath)) {
    try {
      const filebuffer = fs.readFileSync(sqliteDbPath);
      sqlite = new SQL.Database(filebuffer);
    } catch (e) {
      sqlite = new SQL.Database();
    }
  } else if (fs.existsSync(repoDbPath)) {
    try {
      const filebuffer = fs.readFileSync(repoDbPath);
      sqlite = new SQL.Database(filebuffer);
      saveSqliteDisk();
    } catch (e) {
      sqlite = new SQL.Database();
    }
  } else {
    sqlite = new SQL.Database();
  }

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

  const checkStmt = sqlite.prepare('SELECT COUNT(*) as c FROM users');
  let userCount = 0;
  if (checkStmt.step()) {
    userCount = checkStmt.getAsObject().c;
  }
  checkStmt.free();

  if (userCount === 0) {
    const defaultHash = bcrypt.hashSync('Password@123', 10);
    const tempHash = bcrypt.hashSync('Vote#8921', 10);
    sqlite.exec(`
      INSERT INTO users (id, login_id, email, mobile, password_hash, name, role, status, must_change_password)
      VALUES (1, 'superadmin', 'superadmin@civicpulse.org', '9800000001', '${defaultHash}', 'Dr. Alexander Vance (Super Admin)', 'SUPER_ADMIN', 'ACTIVE', 0);
      INSERT INTO users (id, login_id, email, mobile, password_hash, name, role, status, created_by, must_change_password)
      VALUES (2, 'admin.metro', 'admin.metro@civicpulse.org', '9800000002', '${defaultHash}', 'Rajesh Sharma (Admin - Metro)', 'ADMIN', 'ACTIVE', 1, 0);
      INSERT INTO users (id, login_id, email, mobile, password_hash, name, role, status, created_by, managed_by_admin_id, must_change_password)
      VALUES (3, 'assoc.rahul', 'rahul.verma@civicpulse.org', '9800000011', '${defaultHash}', 'Rahul Verma', 'ASSOCIATE_MEMBER', 'ACTIVE', 1, 2, 0);
      INSERT INTO users (id, login_id, email, mobile, password_hash, name, role, status, created_by, must_change_password)
      VALUES (4, 'VOTER10025', 'arjun@example.com', '9876543210', '${defaultHash}', 'Arjun Mehta', 'VOTER', 'ACTIVE', 3, 0);
      INSERT INTO users (id, login_id, email, mobile, password_hash, name, role, status, created_by, must_change_password)
      VALUES (5, 'VOTER10026', 'kavita@example.com', '9876543211', '${tempHash}', 'Kavita Reddy', 'VOTER', 'ACTIVE', 3, 1);
      
      INSERT INTO voters (user_id, voter_login_id, epic_number, full_name, mobile, gender, dob, age, address, ward, area, constituency, district, state, associate_member_id, status)
      VALUES (4, 'VOTER10025', 'EPIC-ND-104921', 'Arjun Mehta', '9876543210', 'MALE', '1992-05-14', 33, 'Flat 402, Royal Residency, Sector 14', 'Ward 04 - Metro South', 'Sector 14 Garden', 'South Delhi Metro', 'South District', 'Delhi NCT', 3, 'ACTIVE');
      INSERT INTO voters (user_id, voter_login_id, epic_number, full_name, mobile, gender, dob, age, address, ward, area, constituency, district, state, associate_member_id, status)
      VALUES (5, 'VOTER10026', 'EPIC-ND-104922', 'Kavita Reddy', '9876543211', 'FEMALE', '1998-11-20', 27, 'B-12/4, Greenfield Enclave', 'Ward 02 - Metro East', 'Greenfield Colony', 'East Delhi Metro', 'East District', 'Delhi NCT', 3, 'ACTIVE');
      
      INSERT OR IGNORE INTO portal_settings (key, value, description)
      VALUES ('portal_name', 'CivicPulse Enterprise Voter Portal', 'Public facing portal title'),
             ('election_title', '2026 Metropolitan General Assembly Election', 'Active election cycle'),
             ('require_epic', 'true', 'Mandate EPIC Voter ID number during registration'),
             ('allow_voter_self_edit', 'true', 'Allow voters to update permitted contact fields'),
             ('support_email', 'support@civicpulse.org', 'Helpdesk contact email'),
             ('support_phone', '+91 1800 233 4567', 'Helpline toll-free phone number'),
             ('registration_status', 'OPEN', 'Portal registration status');
    `);
  }

  saveSqliteDisk();
}

export async function initDatabase() {
  if (!isPostgres) {
    await initializeSqlite();
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
    if (!isPostgres) {
      const stmt = sqlite.prepare(sql);
      stmt.bind(normalizeArgs(args));
      let row = undefined;
      if (stmt.step()) {
        row = stmt.getAsObject();
      }
      stmt.free();
      return row;
    }
    const result = await pool.query(preparePostgresSql(sql), normalizeArgs(args));
    return convertRows(result.rows)[0];
  },

  async all(sql, ...args) {
    if (!isPostgres) {
      const stmt = sqlite.prepare(sql);
      stmt.bind(normalizeArgs(args));
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    }
    const result = await pool.query(preparePostgresSql(sql), normalizeArgs(args));
    return convertRows(result.rows);
  },

  async run(sql, ...args) {
    if (!isPostgres) {
      sqlite.run(sql, normalizeArgs(args));
      const changes = sqlite.getRowsModified();
      const lastRes = sqlite.exec("SELECT last_insert_rowid() as id");
      const lastId = lastRes[0]?.values[0]?.[0] ? Number(lastRes[0].values[0][0]) : null;
      saveSqliteDisk();
      return { changes, lastInsertRowid: lastId };
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
    if (!isPostgres) {
      const res = sqlite.exec(sql);
      saveSqliteDisk();
      return res;
    }
    return pool.query(sql);
  },

  async transaction(callback) {
    if (!isPostgres) {
      sqlite.run('BEGIN TRANSACTION;');
      try {
        const result = await callback(query);
        sqlite.run('COMMIT;');
        saveSqliteDisk();
        return result;
      } catch (error) {
        try { sqlite.run('ROLLBACK;'); } catch (e) {}
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
