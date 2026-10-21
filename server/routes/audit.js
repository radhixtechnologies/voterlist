import express from 'express';
import { query } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/audit (Super Admin only)
router.get('/', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  const { action = '', role = '', search = '', startDate = '', endDate = '', page = 1, limit = 20 } = req.query;

  const conditions = [];
  const params = [];

  if (action) {
    conditions.push('action = ?');
    params.push(action);
  }
  if (role) {
    conditions.push('user_role = ?');
    params.push(role);
  }
  if (search.trim()) {
    conditions.push('(user_name LIKE ? OR target_id LIKE ? OR details LIKE ?)');
    const q = `%${search.trim()}%`;
    params.push(q, q, q);
  }
  if (startDate) {
    conditions.push('created_at >= ?');
    params.push(`${startDate} 00:00:00`);
  }
  if (endDate) {
    conditions.push('created_at <= ?');
    params.push(`${endDate} 23:59:59`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = (await query.get(`SELECT COUNT(*) as c FROM audit_logs ${whereClause}`, ...params)).c;

  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  const logs = await query.all(
    `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    ...params, parseInt(limit), offset
  );

  res.json({
    logs,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)) || 1
    }
  });
});

export default router;
