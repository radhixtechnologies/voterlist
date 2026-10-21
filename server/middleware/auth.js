import jwt from 'jsonwebtoken';
import { query } from '../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'voter-portal-super-secure-secret-key-2025';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Session expired or invalid token.' });
    }

    // Fetch user from DB to ensure still active and permissions are current
    const user = query.get(
      'SELECT id, login_id, email, mobile, name, role, status, managed_by_admin_id, must_change_password FROM users WHERE id = ?',
      decoded.id
    );

    if (!user) {
      return res.status(401).json({ message: 'User account not found.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ message: `Account is ${user.status.toLowerCase()}. Contact administrator.` });
    }

    req.user = user;
    next();
  });
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied: You do not have permission to access this resource.',
        requiredRole: allowedRoles,
        currentRole: req.user.role
      });
    }

    next();
  };
}

