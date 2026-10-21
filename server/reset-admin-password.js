import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const loginId = process.env.ADMIN_LOGIN_ID?.trim();
const newPassword = process.env.NEW_ADMIN_PASSWORD;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required.');
}
if (!loginId) {
  throw new Error('ADMIN_LOGIN_ID is required.');
}
if (!newPassword || newPassword.length < 14) {
  throw new Error('NEW_ADMIN_PASSWORD must contain at least 14 characters.');
}

const pool = new pg.Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'false'
    ? false
    : process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  max: 1,
  connectionTimeoutMillis: 10_000,
});

try {
  const passwordHash = await bcrypt.hash(newPassword, 12);
  const result = await pool.query(
    `UPDATE users
     SET password_hash = $1, must_change_password = 0, updated_at = CURRENT_TIMESTAMP
     WHERE login_id = $2 AND role = 'SUPER_ADMIN'
     RETURNING login_id`,
    [passwordHash, loginId]
  );

  if (result.rowCount !== 1) {
    throw new Error(`No super-admin account found with login ID "${loginId}".`);
  }

  console.log(`Password reset successfully for super-admin "${loginId}".`);
} finally {
  await pool.end();
}
