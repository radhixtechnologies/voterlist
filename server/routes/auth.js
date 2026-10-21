import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { authenticateToken, JWT_SECRET } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/logger.js';

const router = express.Router();

// Simple in-memory rate limiter for login
const loginAttempts = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxAttempts = 15;

  const userAttempts = loginAttempts.get(ip) || [];
  const recentAttempts = userAttempts.filter(timestamp => now - timestamp < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    return false;
  }
  
  recentAttempts.push(now);
  loginAttempts.set(ip, recentAttempts);
  return true;
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ message: 'Too many login attempts. Please try again after 1 minute.' });
  }

  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Login ID/Email/Mobile and Password are required.' });
  }

  const cleanIdentifier = identifier.trim();

  // Search user by login_id, email, or mobile (case-insensitive for login_id and email)
  const user = await query.get(
    `SELECT * FROM users WHERE LOWER(login_id) = LOWER(?) OR LOWER(email) = LOWER(?) OR mobile = ?`,
    cleanIdentifier, cleanIdentifier, cleanIdentifier
  );

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials. Please verify your Login ID and password.' });
  }

  if (user.status !== 'ACTIVE') {
    return res.status(403).json({ message: `Your account is ${user.status.toLowerCase()}. Please contact the administrator.` });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials. Please verify your Login ID and password.' });
  }

  // Update last login
  await query.run("UPDATE users SET last_login_at = datetime('now') WHERE id = ?", user.id);

  // Record audit log
  await recordAuditLog({
    req,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'LOGIN',
    targetType: 'USER',
    targetId: user.id,
    details: { login_id: user.login_id }
  });

  // Generate JWT token (expires in 24 hours)
  const token = jwt.sign(
    { id: user.id, login_id: user.login_id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // If Voter, also fetch voter details & referrer name
  let voterProfile = null;
  if (user.role === 'VOTER') {
    voterProfile = await query.get(
      `SELECT v.*, u.name as referred_by_name, u.login_id as referred_by_login_id
       FROM voters v
       LEFT JOIN users u ON v.associate_member_id = u.id
       WHERE v.user_id = ?`,
      user.id
    );
  }

  return res.json({
    token,
    user: {
      id: user.id,
      login_id: user.login_id,
      email: user.email,
      mobile: user.mobile,
      name: user.name,
      role: user.role,
      status: user.status,
      must_change_password: Boolean(user.must_change_password),
      last_login_at: user.last_login_at
    },
    voterProfile
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  const user = req.user;
  let voterProfile = null;

  if (user.role === 'VOTER') {
    voterProfile = await query.get(
      `SELECT v.*, u.name as referred_by_name, u.login_id as referred_by_login_id
       FROM voters v
       LEFT JOIN users u ON v.associate_member_id = u.id
       WHERE v.user_id = ?`,
      user.id
    );
  }

  return res.json({
    user: {
      id: user.id,
      login_id: user.login_id,
      email: user.email,
      mobile: user.mobile,
      name: user.name,
      role: user.role,
      status: user.status,
      must_change_password: Boolean(user.must_change_password),
      managed_by_admin_id: user.managed_by_admin_id
    },
    voterProfile
  });
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
  }

  const currentUser = await query.get('SELECT password_hash, must_change_password FROM users WHERE id = ?', userId);
  
  // If not in forced password change mode, verify current password
  if (currentUser.must_change_password !== 1) {
    if (!currentPassword) {
      return res.status(400).json({ message: 'Current password is required.' });
    }
    const isValid = bcrypt.compareSync(currentPassword, currentUser.password_hash);
    if (!isValid) {
      return res.status(400).json({ message: 'Current password does not match.' });
    }
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  await query.run(
    "UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = datetime('now') WHERE id = ?",
    newHash, userId
  );

  await recordAuditLog({
    req,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'CHANGE_PASSWORD',
    targetType: 'USER',
    targetId: userId,
    details: 'User updated their account password'
  });

  return res.json({ message: 'Password updated successfully. You can now use your new password.' });
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
  await recordAuditLog({
    req,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'LOGOUT',
    targetType: 'USER',
    targetId: req.user.id,
    details: 'User logged out'
  });

  return res.json({ message: 'Logged out successfully.' });
});

export default router;
