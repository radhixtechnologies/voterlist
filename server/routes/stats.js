import express from 'express';
import { query } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/stats/dashboard (Role-tailored dashboard stats)
router.get('/dashboard', authenticateToken, async (req, res) => {
  const user = req.user;

  try {
    if (user.role === 'SUPER_ADMIN') {
      // 1. Overall counts
      const totalVoters = (await query.get('SELECT COUNT(*) as c FROM voters')).c;
      const activeVoters = (await query.get("SELECT COUNT(*) as c FROM voters WHERE status = 'ACTIVE'")).c;
      const inactiveVoters = (await query.get("SELECT COUNT(*) as c FROM voters WHERE status != 'ACTIVE'")).c;
      const totalAdmins = (await query.get("SELECT COUNT(*) as c FROM users WHERE role = 'ADMIN'")).c;
      const totalAssociates = (await query.get("SELECT COUNT(*) as c FROM users WHERE role = 'ASSOCIATE_MEMBER'")).c;
      const activeAssociates = (await query.get("SELECT COUNT(*) as c FROM users WHERE role = 'ASSOCIATE_MEMBER' AND status = 'ACTIVE'")).c;

      // New registrations today & this month
      const todayRegistrations = (await query.get("SELECT COUNT(*) as c FROM voters WHERE date(created_at) = date('now')")).c;
      const thisMonthRegistrations = (await query.get("SELECT COUNT(*) as c FROM voters WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')")).c;

      // 2. Trend data (last 7 days / last 14 days)
      const trendData = await query.all(`
        SELECT date(created_at) as date, COUNT(*) as count 
        FROM voters 
        WHERE created_at >= date('now', '-14 days')
        GROUP BY date(created_at)
        ORDER BY date ASC
      `);

      // 3. Ward breakdown
      const wardBreakdown = await query.all(`
        SELECT ward, COUNT(*) as count 
        FROM voters 
        GROUP BY ward 
        ORDER BY count DESC 
        LIMIT 6
      `);

      // 4. Status breakdown
      const statusBreakdown = await query.all(`
        SELECT status, COUNT(*) as count 
        FROM voters 
        GROUP BY status
      `);

      // 5. Recent voters
      const recentVoters = await query.all(`
        SELECT v.id, v.voter_login_id, v.full_name, v.mobile, v.epic_number, v.ward, v.area, v.status, v.created_at, u.name as associate_name
        FROM voters v
        LEFT JOIN users u ON v.associate_member_id = u.id
        ORDER BY v.created_at DESC
        LIMIT 6
      `);

      // 6. Recent associate members
      const recentAssociates = await query.all(`
        SELECT u.id, u.login_id, u.name, u.email, u.mobile, u.status, u.created_at,
               mgr.name as manager_name,
               (SELECT COUNT(*) FROM voters WHERE associate_member_id = u.id) as voter_count
        FROM users u
        LEFT JOIN users mgr ON u.managed_by_admin_id = mgr.id
        WHERE u.role = 'ASSOCIATE_MEMBER'
        ORDER BY u.created_at DESC
        LIMIT 5
      `);

      // 7. Recent audit logs
      const recentActivity = await query.all(`
        SELECT id, user_name, user_role, action, target_type, target_id, details, created_at
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT 6
      `);

      return res.json({
        stats: {
          totalVoters,
          activeVoters,
          inactiveVoters,
          totalAdmins,
          totalAssociates,
          activeAssociates,
          todayRegistrations,
          thisMonthRegistrations
        },
        trendData,
        wardBreakdown,
        statusBreakdown,
        recentVoters,
        recentAssociates,
        recentActivity
      });
    }

    if (user.role === 'ADMIN') {
      // Admin dashboard: scoped to Associate Members managed by this admin
      const totalAssociates = (await query.get(
        "SELECT COUNT(*) as c FROM users WHERE role = 'ASSOCIATE_MEMBER' AND managed_by_admin_id = ?",
        user.id
      )).c;

      const activeAssociates = (await query.get(
        "SELECT COUNT(*) as c FROM users WHERE role = 'ASSOCIATE_MEMBER' AND managed_by_admin_id = ? AND status = 'ACTIVE'",
        user.id
      )).c;

      const totalVoters = (await query.get(`
        SELECT COUNT(*) as c FROM voters v
        JOIN users u ON v.associate_member_id = u.id
        WHERE u.managed_by_admin_id = ?
      `, user.id)).c;

      const activeVoters = (await query.get(`
        SELECT COUNT(*) as c FROM voters v
        JOIN users u ON v.associate_member_id = u.id
        WHERE u.managed_by_admin_id = ? AND v.status = 'ACTIVE'
      `, user.id)).c;

      const thisMonthRegistrations = (await query.get(`
        SELECT COUNT(*) as c FROM voters v
        JOIN users u ON v.associate_member_id = u.id
        WHERE u.managed_by_admin_id = ? AND strftime('%Y-%m', v.created_at) = strftime('%Y-%m', 'now')
      `, user.id)).c;

      const todayRegistrations = (await query.get(`
        SELECT COUNT(*) as c FROM voters v
        JOIN users u ON v.associate_member_id = u.id
        WHERE u.managed_by_admin_id = ? AND date(v.created_at) = date('now')
      `, user.id)).c;

      // Trend data scoped
      const trendData = await query.all(`
        SELECT date(v.created_at) as date, COUNT(*) as count 
        FROM voters v
        JOIN users u ON v.associate_member_id = u.id
        WHERE u.managed_by_admin_id = ? AND v.created_at >= date('now', '-14 days')
        GROUP BY date(v.created_at)
        ORDER BY date ASC
      `, user.id);

      // Managed associate members list
      const managedAssociates = await query.all(`
        SELECT u.id, u.login_id, u.name, u.email, u.mobile, u.status, u.created_at,
               (SELECT COUNT(*) FROM voters WHERE associate_member_id = u.id) as voter_count
        FROM users u
        WHERE u.role = 'ASSOCIATE_MEMBER' AND u.managed_by_admin_id = ?
        ORDER BY voter_count DESC
        LIMIT 6
      `, user.id);

      // Recent voter registrations under this admin's scope
      const recentVoters = await query.all(`
        SELECT v.id, v.voter_login_id, v.full_name, v.mobile, v.epic_number, v.ward, v.area, v.status, v.created_at, u.name as associate_name
        FROM voters v
        JOIN users u ON v.associate_member_id = u.id
        WHERE u.managed_by_admin_id = ?
        ORDER BY v.created_at DESC
        LIMIT 6
      `, user.id);

      return res.json({
        stats: {
          totalAssociates,
          activeAssociates,
          totalVoters,
          activeVoters,
          thisMonthRegistrations,
          todayRegistrations
        },
        trendData,
        managedAssociates,
        recentVoters
      });
    }

    if (user.role === 'ASSOCIATE_MEMBER') {
      // Associate Member dashboard: scoped to voters registered by this associate
      const totalVoters = (await query.get('SELECT COUNT(*) as c FROM voters WHERE associate_member_id = ?', user.id)).c;
      const activeVoters = (await query.get("SELECT COUNT(*) as c FROM voters WHERE associate_member_id = ? AND status = 'ACTIVE'", user.id)).c;
      const todayRegistrations = (await query.get("SELECT COUNT(*) as c FROM voters WHERE associate_member_id = ? AND date(created_at) = date('now')", user.id)).c;
      const thisMonthRegistrations = (await query.get(
        "SELECT COUNT(*) as c FROM voters WHERE associate_member_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')",
        user.id
      )).c;

      // Trend data for this member
      const trendData = await query.all(`
        SELECT date(created_at) as date, COUNT(*) as count 
        FROM voters 
        WHERE associate_member_id = ? AND created_at >= date('now', '-14 days')
        GROUP BY date(created_at)
        ORDER BY date ASC
      `, user.id);

      // Recent voters registered by this member
      const recentVoters = await query.all(`
        SELECT id, voter_login_id, full_name, mobile, epic_number, ward, area, status, created_at
        FROM voters
        WHERE associate_member_id = ?
        ORDER BY created_at DESC
        LIMIT 6
      `, user.id);

      return res.json({
        stats: {
          totalVoters,
          activeVoters,
          todayRegistrations,
          thisMonthRegistrations
        },
        trendData,
        recentVoters
      });
    }

    if (user.role === 'VOTER') {
      // Voter personal dashboard
      const voter = await query.get(`
        SELECT v.*, u.name as referred_by_name, u.login_id as referred_by_login_id, u.email as referred_by_email, u.mobile as referred_by_mobile
        FROM voters v
        LEFT JOIN users u ON v.associate_member_id = u.id
        WHERE v.user_id = ?
      `, user.id);

      return res.json({
        voter
      });
    }

    return res.status(400).json({ message: 'Unknown role' });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Error retrieving dashboard statistics.' });
  }
});

export default router;
