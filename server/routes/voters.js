import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/logger.js';

const router = express.Router();

// Helper to generate a unique Voter Login ID (e.g. VOTER10025)
async function generateVoterLoginId() {
  const countRow = await query.get("SELECT COUNT(*) as count FROM users WHERE role = 'VOTER'");
  const nextNum = 10001 + (countRow ? countRow.count : 0) + Math.floor(Math.random() * 10);
  let candidate = `VOTER${nextNum}`;
  
  // Ensure uniqueness
  while (await query.get('SELECT id FROM users WHERE login_id = ?', candidate)) {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    candidate = `VOTER${randomSuffix}`;
  }
  return candidate;
}

// Helper to generate a secure random temporary password (e.g., Vote#8291)
function generateTempPassword() {
  const words = ['Vote', 'Civic', 'Pulse', 'India', 'Nation', 'Ballot'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word}#${num}`;
}

// GET /api/voters (Scoped voter list)
router.get('/', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN', 'ASSOCIATE_MEMBER'), async (req, res) => {
  const {
    search = '',
    status = '',
    ward = '',
    area = '',
    associateId = '',
    startDate = '',
    endDate = '',
    page = 1,
    limit = 10,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = req.query;

  const user = req.user;
  const conditions = [];
  const params = [];

  // Scoping according to user role:
  if (user.role === 'ASSOCIATE_MEMBER') {
    conditions.push('v.associate_member_id = ?');
    params.push(user.id);
  } else if (user.role === 'ADMIN') {
    // Admin can see voters registered by Associate Members managed by this Admin
    conditions.push(`v.associate_member_id IN (
      SELECT id FROM users WHERE managed_by_admin_id = ? AND role = 'ASSOCIATE_MEMBER'
    )`);
    params.push(user.id);
  } else if (user.role === 'SUPER_ADMIN') {
    // Super Admin sees all, but can filter by associateId if provided
    if (associateId) {
      conditions.push('v.associate_member_id = ?');
      params.push(associateId);
    }
  }

  // Search filter
  if (search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    conditions.push('(v.full_name LIKE ? OR v.mobile LIKE ? OR v.epic_number LIKE ? OR v.voter_login_id LIKE ?)');
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Status filter
  if (status) {
    conditions.push('v.status = ?');
    params.push(status);
  }

  // Ward filter
  if (ward) {
    conditions.push('v.ward = ?');
    params.push(ward);
  }

  // Area filter
  if (area) {
    conditions.push('v.area = ?');
    params.push(area);
  }

  // Date range filters
  if (startDate) {
    conditions.push('v.created_at >= ?');
    params.push(`${startDate} 00:00:00`);
  }
  if (endDate) {
    conditions.push('v.created_at <= ?');
    params.push(`${endDate} 23:59:59`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM voters v ${whereClause}`;
  const totalRow = await query.get(countSql, ...params);
  const total = totalRow ? totalRow.total : 0;

  // Safe sorting columns
  const allowedSortCols = ['id', 'full_name', 'epic_number', 'mobile', 'ward', 'area', 'status', 'created_at'];
  const safeSortBy = allowedSortCols.includes(sortBy) ? `v.${sortBy}` : 'v.created_at';
  const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  const dataSql = `
    SELECT 
      v.*,
      u.name as associate_name,
      u.login_id as associate_login_id,
      u.email as associate_email
    FROM voters v
    LEFT JOIN users u ON v.associate_member_id = u.id
    ${whereClause}
    ORDER BY ${safeSortBy} ${safeSortOrder}
    LIMIT ? OFFSET ?
  `;

  const voters = await query.all(dataSql, ...params, parseInt(limit), offset);

  res.json({
    voters,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)) || 1
    }
  });
});

// GET /api/voters/export/csv (CSV Export with same scoping)
router.get('/export/csv', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN', 'ASSOCIATE_MEMBER'), async (req, res) => {
  const user = req.user;
  const conditions = [];
  const params = [];

  if (user.role === 'ASSOCIATE_MEMBER') {
    conditions.push('v.associate_member_id = ?');
    params.push(user.id);
  } else if (user.role === 'ADMIN') {
    conditions.push(`v.associate_member_id IN (
      SELECT id FROM users WHERE managed_by_admin_id = ? AND role = 'ASSOCIATE_MEMBER'
    )`);
    params.push(user.id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const dataSql = `
    SELECT 
      v.id,
      v.voter_login_id as "Login ID",
      v.epic_number as "EPIC / Voter ID",
      v.full_name as "Full Name",
      v.mobile as "Mobile",
      v.gender as "Gender",
      v.age as "Age",
      v.dob as "DOB",
      v.address as "Address",
      v.ward as "Ward",
      v.area as "Area",
      v.constituency as "Constituency",
      v.district as "District",
      v.state as "State",
      v.status as "Status",
      u.name as "Referred By",
      v.created_at as "Registration Date"
    FROM voters v
    LEFT JOIN users u ON v.associate_member_id = u.id
    ${whereClause}
    ORDER BY v.created_at DESC
  `;

  const rows = await query.all(dataSql, ...params);

  // Build CSV
  if (rows.length === 0) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="voters.csv"');
    return res.send('No records found');
  }

  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(h => {
        let val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',')
    )
  ];

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="voter_export_${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csvLines.join('\n'));
});

// POST /api/voters (Create Voter - Associate Member or Super Admin)
router.post('/', authenticateToken, requireRole('SUPER_ADMIN', 'ASSOCIATE_MEMBER'), async (req, res) => {
  const {
    full_name,
    mobile,
    epic_number,
    dob,
    age,
    gender,
    address,
    state,
    district,
    constituency,
    ward,
    area,
    emergency_contact
  } = req.body;

  // 1. Validate required fields
  if (!full_name || !mobile || !address || !state || !district || !constituency || !ward || !area) {
    return res.status(400).json({
      message: 'Please fill in all mandatory fields: Name, Mobile, Address, State, District, Constituency, Ward, Area.'
    });
  }

  const cleanMobile = mobile.trim();
  const cleanEpic = epic_number ? epic_number.trim().toUpperCase() : `EPIC${Math.floor(100000 + Math.random() * 900000)}`;

  // Mobile validation
  if (!/^\d{10}$/.test(cleanMobile.replace(/\D/g, '').slice(-10))) {
    return res.status(400).json({ message: 'Please provide a valid 10-digit mobile number.' });
  }

  // 2 & 3. Duplicate checks according to requirements:
  // "If a duplicate mobile number or voter ID is detected, display a clear message such as:
  //  'This voter is already registered.' Do not create duplicate accounts or expose existing credentials."
  const existingVoter = await query.get(
    'SELECT id FROM voters WHERE mobile = ? OR epic_number = ?',
    cleanMobile, cleanEpic
  );
  const existingUser = await query.get('SELECT id FROM users WHERE mobile = ?', cleanMobile);

  if (existingVoter || existingUser) {
    return res.status(409).json({
      message: 'This voter is already registered. A voter with this Mobile Number or Voter ID / EPIC already exists in the portal.'
    });
  }

  // Associate Member ID comes strictly from authenticated session
  const associateMemberId = req.user.id;
  const associateMemberName = req.user.name;

  // 4 & 5. Generate unique Login ID and Temporary Password
  const loginId = await generateVoterLoginId();
  const tempPassword = generateTempPassword();
  const passwordHash = bcrypt.hashSync(tempPassword, 10);

  try {
    let newUserId;
    let voterId;
    await query.transaction(async transaction => {
    // Insert user account with must_change_password = 1
    const userResult = await transaction.run(
      `INSERT INTO users (login_id, mobile, password_hash, name, role, status, created_by, must_change_password)
       VALUES (?, ?, ?, ?, 'VOTER', 'ACTIVE', ?, 1)`,
      loginId,
      cleanMobile,
      passwordHash,
      full_name.trim(),
      associateMemberId
    );
    newUserId = userResult.lastInsertRowid;

    // Calculate age if dob is provided and age isn't
    let computedAge = age ? parseInt(age) : null;
    if (dob && !computedAge) {
      const birthDate = new Date(dob);
      const diffMs = Date.now() - birthDate.getTime();
      computedAge = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
    }

    // Insert voter profile
    const voterResult = await transaction.run(
      `INSERT INTO voters (
        user_id, voter_login_id, epic_number, full_name, mobile,
        gender, dob, age, address, ward, area,
        constituency, district, state, associate_member_id, emergency_contact, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      newUserId,
      loginId,
      cleanEpic,
      full_name.trim(),
      cleanMobile,
      gender || 'MALE',
      dob || null,
      computedAge,
      address.trim(),
      ward.trim(),
      area.trim(),
      constituency.trim(),
      district.trim(),
      state.trim(),
      associateMemberId,
      emergency_contact ? emergency_contact.trim() : null
    );

    voterId = voterResult.lastInsertRowid;
    });

    // Record audit log
    await recordAuditLog({
      req,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'CREATE_VOTER',
      targetType: 'VOTER',
      targetId: voterId,
      details: {
        voter_id: voterId,
        login_id: loginId,
        epic_number: cleanEpic,
        registered_by: req.user.name
      }
    });

    // Return the generated credentials ONLY ONCE to the creator
    return res.status(201).json({
      message: 'Voter registered successfully!',
      voter: {
        id: voterId,
        user_id: newUserId,
        login_id: loginId,
        epic_number: cleanEpic,
        full_name: full_name.trim(),
        mobile: cleanMobile,
        ward: ward.trim(),
        area: area.trim(),
        constituency: constituency.trim(),
        district: district.trim(),
        state: state.trim(),
        associate_name: associateMemberName,
        created_at: new Date().toISOString()
      },
      credentials: {
        login_id: loginId,
        temp_password: tempPassword,
        note: 'Display these credentials to the voter. The voter will be prompted to change this temporary password upon first login.'
      }
    });
  } catch (error) {
    console.error('Error creating voter:', error);
    return res.status(500).json({ message: 'Internal server error while creating voter record.' });
  }
});

// GET /api/voters/:id (Get single voter details)
router.get('/:id', authenticateToken, async (req, res) => {
  const voterId = req.params.id;
  const voter = await query.get(
    `SELECT v.*, u.name as associate_name, u.login_id as associate_login_id, u.email as associate_email, u.mobile as associate_mobile
     FROM voters v
     LEFT JOIN users u ON v.associate_member_id = u.id
     WHERE v.id = ?`,
    voterId
  );

  if (!voter) {
    return res.status(404).json({ message: 'Voter record not found.' });
  }

  // Authorization check:
  const user = req.user;
  if (user.role === 'VOTER') {
    if (voter.user_id !== user.id) {
      return res.status(403).json({ message: 'Access denied: You can only view your own voter record.' });
    }
  } else if (user.role === 'ASSOCIATE_MEMBER') {
    if (voter.associate_member_id !== user.id) {
      return res.status(403).json({ message: 'Access denied: You can only view records of voters you registered.' });
    }
  } else if (user.role === 'ADMIN') {
    // Check if voter's associate member is managed by this Admin
    const assoc = await query.get('SELECT managed_by_admin_id FROM users WHERE id = ?', voter.associate_member_id);
    if (!assoc || assoc.managed_by_admin_id !== user.id) {
      return res.status(403).json({ message: 'Access denied: Voter is not under your managed Associate Members.' });
    }
  }

  res.json({ voter });
});

// PATCH /api/voters/:id (Update permitted voter fields)
router.patch('/:id', authenticateToken, async (req, res) => {
  const voterId = req.params.id;
  const voter = await query.get('SELECT * FROM voters WHERE id = ?', voterId);

  if (!voter) {
    return res.status(404).json({ message: 'Voter not found.' });
  }

  const user = req.user;

  // Authorization check
  if (user.role === 'VOTER') {
    if (voter.user_id !== user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this profile.' });
    }
    // Voter can only update permitted fields: address, emergency_contact, mobile
    const { address, emergency_contact, mobile } = req.body;
    
    // If mobile changed, check uniqueness
    if (mobile && mobile !== voter.mobile) {
      const duplicate = await query.get('SELECT id FROM voters WHERE mobile = ? AND id != ?', mobile, voterId);
      if (duplicate) {
        return res.status(409).json({ message: 'This mobile number is already registered to another voter.' });
      }
    }

    await query.run(
      `UPDATE voters SET
         address = COALESCE(?, address),
         emergency_contact = COALESCE(?, emergency_contact),
         mobile = COALESCE(?, mobile),
         updated_at = datetime('now')
       WHERE id = ?`,
      address || null,
      emergency_contact || null,
      mobile || null,
      voterId
    );

    if (mobile) {
      await query.run("UPDATE users SET mobile = ?, updated_at = datetime('now') WHERE id = ?", mobile, voter.user_id);
    }

    await recordAuditLog({
      req,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE_VOTER',
      targetType: 'VOTER',
      targetId: voterId,
      details: 'Voter self-updated contact/address information'
    });

    return res.json({ message: 'Profile updated successfully.' });
  }

  // Super Admin, Admin, or Associate Member update
  if (user.role === 'ASSOCIATE_MEMBER' && voter.associate_member_id !== user.id) {
    return res.status(403).json({ message: 'Unauthorized to modify this voter.' });
  }
  if (user.role === 'ADMIN') {
    const assoc = await query.get('SELECT managed_by_admin_id FROM users WHERE id = ?', voter.associate_member_id);
    if (!assoc || assoc.managed_by_admin_id !== user.id) {
      return res.status(403).json({ message: 'Unauthorized to modify this voter.' });
    }
  }

  const { full_name, mobile, address, ward, area, constituency, district, state, emergency_contact, status } = req.body;

  await query.run(
    `UPDATE voters SET
       full_name = COALESCE(?, full_name),
       mobile = COALESCE(?, mobile),
       address = COALESCE(?, address),
       ward = COALESCE(?, ward),
       area = COALESCE(?, area),
       constituency = COALESCE(?, constituency),
       district = COALESCE(?, district),
       state = COALESCE(?, state),
       emergency_contact = COALESCE(?, emergency_contact),
       status = COALESCE(?, status),
       updated_at = datetime('now')
     WHERE id = ?`,
    full_name || null,
    mobile || null,
    address || null,
    ward || null,
    area || null,
    constituency || null,
    district || null,
    state || null,
    emergency_contact || null,
    status || null,
    voterId
  );

  if (full_name || mobile || status) {
    await query.run(
      `UPDATE users SET
         name = COALESCE(?, name),
         mobile = COALESCE(?, mobile),
         status = COALESCE(?, status),
         updated_at = datetime('now')
       WHERE id = ?`,
      full_name || null,
      mobile || null,
      status || null,
      voter.user_id
    );
  }

  await recordAuditLog({
    req,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'UPDATE_VOTER',
    targetType: 'VOTER',
    targetId: voterId,
    details: { updated_by: user.name, changes: req.body }
  });

  return res.json({ message: 'Voter details updated successfully.' });
});

// PATCH /api/voters/:id/status (Toggle status)
router.patch('/:id/status', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  const voterId = req.params.id;
  const { status } = req.body;

  if (!['ACTIVE', 'INACTIVE', 'FLAGGED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be ACTIVE, INACTIVE, or FLAGGED.' });
  }

  const voter = await query.get('SELECT * FROM voters WHERE id = ?', voterId);
  if (!voter) {
    return res.status(404).json({ message: 'Voter not found.' });
  }

  // Admin scoping check
  if (req.user.role === 'ADMIN') {
    const assoc = await query.get('SELECT managed_by_admin_id FROM users WHERE id = ?', voter.associate_member_id);
    if (!assoc || assoc.managed_by_admin_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to modify this voter.' });
    }
  }

  await query.run("UPDATE voters SET status = ?, updated_at = datetime('now') WHERE id = ?", status, voterId);
  // Also reflect on users table
  const userStatus = status === 'FLAGGED' ? 'SUSPENDED' : status;
  await query.run("UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?", userStatus, voter.user_id);

  await recordAuditLog({
    req,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'TOGGLE_STATUS',
    targetType: 'VOTER',
    targetId: voterId,
    details: { old_status: voter.status, new_status: status }
  });

  res.json({ message: `Voter status changed to ${status}.` });
});

// DELETE /api/voters/:id (Super Admin only)
router.delete('/:id', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  const voterId = req.params.id;
  const voter = await query.get('SELECT * FROM voters WHERE id = ?', voterId);

  if (!voter) {
    return res.status(404).json({ message: 'Voter not found.' });
  }

  await query.transaction(async transaction => {
    await transaction.run('DELETE FROM voters WHERE id = ?', voterId);
    await transaction.run('DELETE FROM users WHERE id = ?', voter.user_id);
  });

  await recordAuditLog({
    req,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'DELETE_VOTER',
    targetType: 'VOTER',
    targetId: voterId,
    details: { voter_name: voter.full_name, epic: voter.epic_number }
  });

  res.json({ message: 'Voter record and user account removed successfully.' });
});

export default router;
