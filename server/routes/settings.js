import express from 'express';
import { query } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/logger.js';

const router = express.Router();

// GET /api/settings/public
router.get('/public', async (req, res) => {
  const settingsRows = await query.all('SELECT key, value FROM portal_settings');
  const settings = {};
  settingsRows.forEach(row => {
    settings[row.key] = row.value;
  });
  res.json({ settings });
});

// GET /api/settings (Super Admin)
router.get('/', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  const settings = await query.all('SELECT * FROM portal_settings ORDER BY key ASC');
  res.json({ settings });
});

// PUT /api/settings (Super Admin)
router.put('/', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  const { settings } = req.body; // array of { key, value } or object

  if (!settings) {
    return res.status(400).json({ message: 'Settings payload is required.' });
  }

  const entries = Array.isArray(settings) ? settings : Object.entries(settings).map(([k, v]) => ({ key: k, value: v }));

  for (const { key, value } of entries) {
    await query.run(
      `INSERT INTO portal_settings (key, value, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
      key, String(value)
    );
  }

  await recordAuditLog({
    req,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'UPDATE_SETTINGS',
    targetType: 'SYSTEM',
    targetId: 'PORTAL_SETTINGS',
    details: 'Super Admin updated portal settings configuration'
  });

  res.json({ message: 'Settings updated successfully.' });
});

export default router;
