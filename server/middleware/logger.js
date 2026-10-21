import { query } from '../db.js';

export function recordAuditLog({ req, userId, userName, userRole, action, targetType, targetId, details }) {
  try {
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') : 'system';
    
    // Sanitize details to never log passwords or secrets
    let detailsString = '';
    if (typeof details === 'object' && details !== null) {
      const sanitized = { ...details };
      delete sanitized.password;
      delete sanitized.password_hash;
      delete sanitized.temp_password;
      delete sanitized.token;
      detailsString = JSON.stringify(sanitized);
    } else if (typeof details === 'string') {
      detailsString = details;
    }

    query.run(
      `INSERT INTO audit_logs (user_id, user_name, user_role, action, target_type, target_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      userId || null,
      userName || 'System',
      userRole || 'SYSTEM',
      action,
      targetType || null,
      targetId ? String(targetId) : null,
      detailsString,
      ip
    );
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

