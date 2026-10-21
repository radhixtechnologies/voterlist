import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/logger.js';

const router = express.Router();

// Helper to generate login ID for admins / associate members if not provided
async function generateStaffLoginId(role) {
  const prefix = role === 'ADMIN' ? 'ADMIN' : 'ASSOC';
  const countRow = await query.get('SELECT COUNT(*) as c FROM users WHERE role = ?', role);
  const count = (countRow ? countRow.c : 0) + 101;
  let candidate = `${prefix}${count}`;
  while (await query.get('SELECT id FROM users WHERE login_id = ?', candidate)) {
    candidate = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return candidate;
}

// GET /api/users/admins (Super Admin only)
router.get('/admins', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  const { search = '', status = '' } = req.query;
  const conditions = ["role = 'ADMIN'"];
  const params = [];

  if (search.trim()) {
    conditions.push('(name LIKE ? OR login_id LIKE ? OR email LIKE ? OR mobile LIKE ?)');
    const q = `%${search.trim()}%`;
    params.push(q, q, q, q);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const sql = `
    SELECT 
      u.id, u.login_id, u.name, u.email, u.mobile, u.role, u.status, u.created_at, u.last_login_at,
      (SELECT COUNT(*) FROM users a WHERE a.managed_by_admin_id = u.id AND a.role = 'ASSOCIATE_MEMBER') as managed_associates_count,
      (SELECT COUNT(*) FROM voters v 
       JOIN users a ON v.associate_member_id = a.id 
       WHERE a.managed_by_admin_id = u.id) as total_voters_count
    FROM users u
    ${whereClause}
    ORDER BY u.created_at DESC
  `;

  const admins = await query.all(sql, ...params);
  res.json({ admins });
});

// POST /api/users/admins (Super Admin only)
router.post('/admins', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  const { name, email, mobile, password, login_id } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, Email, and Password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanMobile = mobile ? mobile.trim() : null;
  const finalLoginId = (login_id && login_id.trim()) ? login_id.trim().toUpperCase() : await generateStaffLoginId('ADMIN');

  // Check unique constraints
  const duplicate = await query.get(
    'SELECT id, email, mobile, login_id FROM users WHERE LOWER(email) = ? OR (mobile = ? AND mobile IS NOT NULL) OR LOWER(login_id) = ?',
    cleanEmail, cleanMobile, finalLoginId.toLowerCase()
  );

  if (duplicate) {
    return res.status(409).json({ message: 'An account with this Email, Mobile, or Login ID already exists.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = await query.run(
    `INSERT INTO users (login_id, email, mobile, password_hash, name, role, status, created_by)
     VALUES (?, ?, ?, ?, ?, 'ADMIN', 'ACTIVE', ?)`,
    finalLoginId,
    cleanEmail,
    cleanMobile,
    passwordHash,
    name.trim(),
    req.user.id
  );

  await recordAuditLog({
    req,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'CREATE_ADMIN',
    targetType: 'USER',
    targetId: result.lastInsertRowid,
    details: { admin_name: name, login_id: finalLoginId, email: cleanEmail }
  });

  res.status(201).json({
    message: 'Admin account created successfully.',
    admin: {
      id: result.lastInsertRowid,
      login_id: finalLoginId,
      name: name.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });
});

// GET /api/users/associates (Super Admin & Admin)
router.get('/associates', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  const user = req.user;
  const { search = '', status = '', adminId = '' } = req.query;

  const conditions = ["u.role = 'ASSOCIATE_MEMBER'"];
  const params = [];

  // Scoping: If user is ADMIN, only show Associate Members assigned to this Admin
  if (user.role === 'ADMIN') {
    conditions.push('u.managed_by_admin_id = ?');
    params.push(user.id);
  } else if (user.role === 'SUPER_ADMIN' && adminId) {
    conditions.push('u.managed_by_admin_id = ?');
    params.push(adminId);
  }

  if (search.trim()) {
    conditions.push('(u.name LIKE ? OR u.login_id LIKE ? OR u.email LIKE ? OR u.mobile LIKE ?)');
    const q = `%${search.trim()}%`;
    params.push(q, q, q, q);
  }

  if (status) {
    conditions.push('u.status = ?');
    params.push(status);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const sql = `
    SELECT 
      u.id, u.login_id, u.name, u.email, u.mobile, u.role, u.status, u.created_at, u.last_login_at,
      u.managed_by_admin_id,
      mgr.name as manager_admin_name,
      (SELECT COUNT(*) FROM voters v WHERE v.associate_member_id = u.id) as registered_voters_count,
      (SELECT COUNT(*) FROM voters v WHERE v.associate_member_id = u.id AND v.status = 'ACTIVE') as active_voters_count
    FROM users u
    LEFT JOIN users mgr ON u.managed_by_admin_id = mgr.id
    ${whereClause}
    ORDER BY u.created_at DESC
  `;

  const associates = await query.all(sql, ...params);
  res.json({ associates });
});

// POST /api/users/associates (Super Admin & Admin)
router.post('/associates', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  const { name, email, mobile, password, login_id, managed_by_admin_id } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, Email, and Password are required.' });
  }

  // Prevent privilege escalation: Admin can only set managed_by_admin_id to themselves
  let finalAdminId = null;
  if (req.user.role === 'ADMIN') {
    finalAdminId = req.user.id;
  } else if (req.user.role === 'SUPER_ADMIN') {
    finalAdminId = managed_by_admin_id || null;
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanMobile = mobile ? mobile.trim() : null;
  const finalLoginId = (login_id && login_id.trim()) ? login_id.trim().toUpperCase() : await generateStaffLoginId('ASSOCIATE_MEMBER');

  const duplicate = await query.get(
    'SELECT id, email, mobile, login_id FROM users WHERE LOWER(email) = ? OR (mobile = ? AND mobile IS NOT NULL) OR LOWER(login_id) = ?',
    cleanEmail, cleanMobile, finalLoginId.toLowerCase()
  );

  if (duplicate) {
    return res.status(409).json({ message: 'An account with this Email, Mobile, or Login ID already exists.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = await query.run(
    `INSERT INTO users (login_id, email, mobile, password_hash, name, role, status, created_by, managed_by_admin_id)
     VALUES (?, ?, ?, ?, ?, 'ASSOCIATE_MEMBER', 'ACTIVE', ?, ?)`,
    finalLoginId,
    cleanEmail,
    cleanMobile,
    passwordHash,
    name.trim(),
    req.user.id,
    finalAdminId
  );

  await recordAuditLog({
    req,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'CREATE_ASSOCIATE_MEMBER',
    targetType: 'USER',
    targetId: result.lastInsertRowid,
    details: { associate_name: name, login_id: finalLoginId, assigned_to_admin: finalAdminId }
  });

  res.status(201).json({
    message: 'Associate Member created successfully.',
    associate: {
      id: result.lastInsertRowid,
      login_id: finalLoginId,
      name: name.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      role: 'ASSOCIATE_MEMBER',
      status: 'ACTIVE',
      managed_by_admin_id: finalAdminId
    }
  });
});

// PATCH /api/users/:id/status (Toggle User Status)
router.patch('/:id/status', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  const targetUserId = req.params.id;
  const { status } = req.body;

  if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }

  const targetUser = await query.get('SELECT * FROM users WHERE id = ?', targetUserId);
  if (!targetUser) {
    return res.status(404).json({ message: 'User not found.' });
  }

  // Prevent Admin from modifying Super Admin or other Admins:
  if (req.user.role === 'ADMIN') {
    if (targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'ADMIN') {
      return res.status(403).json({ message: 'Access denied: Cannot change status of administrative accounts.' });
    }
    if (targetUser.role === 'ASSOCIATE_MEMBER' && targetUser.managed_by_admin_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not manage this Associate Member.' });
    }
  }

  // Cannot modify own account status
  if (targetUser.id === req.user.id) {
    return res.status(400).json({ message: 'You cannot change your own account status.' });
  }

  await query.run("UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?", status, targetUserId);

  await recordAuditLog({
    req,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'TOGGLE_STATUS',
    targetType: 'USER',
    targetId: targetUserId,
    details: { target_name: targetUser.name, old_status: targetUser.status, new_status: status }
  });

  res.json({ message: `Account status updated to ${status}.` });
});

// DELETE /api/users/:id (Super Admin only)
router.delete('/:id', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  const targetUserId = req.params.id;
  const targetUser = await query.get('SELECT * FROM users WHERE id = ?', targetUserId);

  if (!targetUser) {
    return res.status(404).json({ message: 'User not found.' });
  }

  if (targetUser.id === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own account.' });
  }

  await query.run('DELETE FROM users WHERE id = ?', targetUserId);

  await recordAuditLog({
    req,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'DELETE_USER',
    targetType: 'USER',
    targetId: targetUserId,
    details: { name: targetUser.name, role: targetUser.role, login_id: targetUser.login_id }
  });

  res.json({ message: 'User account removed successfully.' });
});

export default router;
