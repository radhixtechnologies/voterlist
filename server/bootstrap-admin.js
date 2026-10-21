import bcrypt from 'bcryptjs';
import { closeDatabase, initDatabase, query } from './db.js';

const { BOOTSTRAP_ADMIN_LOGIN_ID, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_PASSWORD } = process.env;

if (!BOOTSTRAP_ADMIN_LOGIN_ID || !BOOTSTRAP_ADMIN_EMAIL || !BOOTSTRAP_ADMIN_NAME || !BOOTSTRAP_ADMIN_PASSWORD) {
  throw new Error('Set BOOTSTRAP_ADMIN_LOGIN_ID, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_NAME, and BOOTSTRAP_ADMIN_PASSWORD.');
}

if (BOOTSTRAP_ADMIN_PASSWORD.length < 14) {
  throw new Error('BOOTSTRAP_ADMIN_PASSWORD must contain at least 14 characters.');
}

await initDatabase();

try {
  const existingSuperAdmin = await query.get("SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1");
  if (existingSuperAdmin) {
    throw new Error('A super-admin account already exists; bootstrap was not applied.');
  }

  const passwordHash = await bcrypt.hash(BOOTSTRAP_ADMIN_PASSWORD, 12);
  await query.run(
    `INSERT INTO users (login_id, email, password_hash, name, role, status, must_change_password)
     VALUES (?, ?, ?, ?, 'SUPER_ADMIN', 'ACTIVE', 0)`,
    BOOTSTRAP_ADMIN_LOGIN_ID.trim(),
    BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase(),
    passwordHash,
    BOOTSTRAP_ADMIN_NAME.trim()
  );
  console.log(`Created the initial super-admin account "${BOOTSTRAP_ADMIN_LOGIN_ID.trim()}".`);
} finally {
  await closeDatabase();
}
