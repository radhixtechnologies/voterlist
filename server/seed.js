import bcrypt from 'bcryptjs';
import { initDatabase, query } from './db.js';

initDatabase();

console.log('--- Seeding database with realistic enterprise data ---');

// Clear existing tables
query.exec(`
  DELETE FROM audit_logs;
  DELETE FROM voters;
  DELETE FROM users;
  DELETE FROM portal_settings;
`);

const defaultHash = bcrypt.hashSync('Password@123', 10);
const tempHash = bcrypt.hashSync('Vote#8921', 10);

// 1. Create Super Admin
const superAdminRes = query.run(
  `INSERT INTO users (login_id, email, mobile, password_hash, name, role, status, must_change_password)
   VALUES ('superadmin', 'superadmin@civicpulse.org', '9800000001', ?, 'Dr. Alexander Vance (Super Admin)', 'SUPER_ADMIN', 'ACTIVE', 0)`,
  defaultHash
);
const superAdminId = superAdminRes.lastInsertRowid;

// 2. Create Admins
const admin1Res = query.run(
  `INSERT INTO users (login_id, email, mobile, password_hash, name, role, status, created_by, must_change_password)
   VALUES ('admin.metro', 'admin.metro@civicpulse.org', '9800000002', ?, 'Rajesh Sharma (Admin - Metro)', 'ADMIN', 'ACTIVE', ?, 0)`,
  defaultHash, superAdminId
);
const adminMetroId = admin1Res.lastInsertRowid;

const admin2Res = query.run(
  `INSERT INTO users (login_id, email, mobile, password_hash, name, role, status, created_by, must_change_password)
   VALUES ('admin.central', 'admin.central@civicpulse.org', '9800000003', ?, 'Priya Nair (Admin - Central)', 'ADMIN', 'ACTIVE', ?, 0)`,
  defaultHash, superAdminId
);
const adminCentralId = admin2Res.lastInsertRowid;

// 3. Create Associate Members
const assoc1Res = query.run(
  `INSERT INTO users (login_id, email, mobile, password_hash, name, role, status, created_by, managed_by_admin_id, must_change_password)
   VALUES ('assoc.rahul', 'rahul.verma@civicpulse.org', '9800000011', ?, 'Rahul Verma', 'ASSOCIATE_MEMBER', 'ACTIVE', ?, ?, 0)`,
  defaultHash, superAdminId, adminMetroId
);
const assocRahulId = assoc1Res.lastInsertRowid;

const assoc2Res = query.run(
  `INSERT INTO users (login_id, email, mobile, password_hash, name, role, status, created_by, managed_by_admin_id, must_change_password)
   VALUES ('assoc.anita', 'anita.desai@civicpulse.org', '9800000012', ?, 'Anita Desai', 'ASSOCIATE_MEMBER', 'ACTIVE', ?, ?, 0)`,
  defaultHash, superAdminId, adminMetroId
);
const assocAnitaId = assoc2Res.lastInsertRowid;

const assoc3Res = query.run(
  `INSERT INTO users (login_id, email, mobile, password_hash, name, role, status, created_by, managed_by_admin_id, must_change_password)
   VALUES ('assoc.vikram', 'vikram.singh@civicpulse.org', '9800000013', ?, 'Vikram Singh', 'ASSOCIATE_MEMBER', 'ACTIVE', ?, ?, 0)`,
  defaultHash, superAdminId, adminCentralId
);
const assocVikramId = assoc3Res.lastInsertRowid;

const assoc4Res = query.run(
  `INSERT INTO users (login_id, email, mobile, password_hash, name, role, status, created_by, managed_by_admin_id, must_change_password)
   VALUES ('assoc.sneha', 'sneha.patel@civicpulse.org', '9800000014', ?, 'Sneha Patel', 'ASSOCIATE_MEMBER', 'ACTIVE', ?, ?, 0)`,
  defaultHash, superAdminId, adminCentralId
);
const assocSnehaId = assoc4Res.lastInsertRowid;

// 4. Create Realistic Voters
const sampleVoters = [
  {
    name: 'Arjun Mehta',
    mobile: '9876543210',
    login_id: 'VOTER10025',
    epic: 'EPIC-ND-104921',
    gender: 'MALE',
    dob: '1992-05-14',
    age: 33,
    address: 'Flat 402, Royal Residency, Sector 14',
    ward: 'Ward 04 - Metro South',
    area: 'Sector 14 Garden',
    constituency: 'South Delhi Metro',
    district: 'South District',
    state: 'Delhi NCT',
    assocId: assocRahulId,
    status: 'ACTIVE',
    mustChange: 0,
    daysAgo: 1
  },
  {
    name: 'Kavita Reddy',
    mobile: '9876543211',
    login_id: 'VOTER10026',
    epic: 'EPIC-ND-104922',
    gender: 'FEMALE',
    dob: '1998-11-20',
    age: 27,
    address: 'B-12/4, Greenfield Enclave',
    ward: 'Ward 02 - Metro East',
    area: 'Greenfield Colony',
    constituency: 'East Delhi Metro',
    district: 'East District',
    state: 'Delhi NCT',
    assocId: assocRahulId,
    status: 'ACTIVE',
    mustChange: 1, // Requires first login password change
    daysAgo: 0
  },
  {
    name: 'Rohan Gupta',
    mobile: '9876543212',
    login_id: 'VOTER10027',
    epic: 'EPIC-ND-104923',
    gender: 'MALE',
    dob: '1985-03-08',
    age: 40,
    address: 'House No. 89, Old Market Road',
    ward: 'Ward 01 - Metro Central',
    area: 'Civic Centre Market',
    constituency: 'Central Delhi Metro',
    district: 'Central District',
    state: 'Delhi NCT',
    assocId: assocAnitaId,
    status: 'ACTIVE',
    mustChange: 0,
    daysAgo: 2
  },
  {
    name: 'Sunita Sharma',
    mobile: '9876543213',
    login_id: 'VOTER10028',
    epic: 'EPIC-ND-104924',
    gender: 'FEMALE',
    dob: '1990-09-17',
    age: 35,
    address: 'Plot 77, Sunrise Heights',
    ward: 'Ward 03 - Metro North',
    area: 'North Ridge',
    constituency: 'North Delhi Metro',
    district: 'North District',
    state: 'Delhi NCT',
    assocId: assocAnitaId,
    status: 'ACTIVE',
    mustChange: 0,
    daysAgo: 3
  },
  {
    name: 'Amitabh Sen',
    mobile: '9876543214',
    login_id: 'VOTER10029',
    epic: 'EPIC-ND-104925',
    gender: 'MALE',
    dob: '1978-01-22',
    age: 48,
    address: 'Flat 10-A, Heritage Towers',
    ward: 'Ward 05 - West Central',
    area: 'Heritage Square',
    constituency: 'West Delhi Metro',
    district: 'West District',
    state: 'Delhi NCT',
    assocId: assocVikramId,
    status: 'ACTIVE',
    mustChange: 0,
    daysAgo: 4
  },
  {
    name: 'Deepika Rao',
    mobile: '9876543215',
    login_id: 'VOTER10030',
    epic: 'EPIC-ND-104926',
    gender: 'FEMALE',
    dob: '2001-07-30',
    age: 24,
    address: '204, Lotus Apartments, Lake View',
    ward: 'Ward 05 - West Central',
    area: 'Lake View Park',
    constituency: 'West Delhi Metro',
    district: 'West District',
    state: 'Delhi NCT',
    assocId: assocVikramId,
    status: 'ACTIVE',
    mustChange: 0,
    daysAgo: 5
  },
  {
    name: 'Mohammad Farooq',
    mobile: '9876543216',
    login_id: 'VOTER10031',
    epic: 'EPIC-ND-104927',
    gender: 'MALE',
    dob: '1982-12-11',
    age: 43,
    address: 'Lane 4, Jamia Nagar East',
    ward: 'Ward 04 - Metro South',
    area: 'Jamia Enclave',
    constituency: 'South Delhi Metro',
    district: 'South District',
    state: 'Delhi NCT',
    assocId: assocSnehaId,
    status: 'ACTIVE',
    mustChange: 0,
    daysAgo: 6
  },
  {
    name: 'Ananya Mukherjee',
    mobile: '9876543217',
    login_id: 'VOTER10032',
    epic: 'EPIC-ND-104928',
    gender: 'FEMALE',
    dob: '1995-04-18',
    age: 30,
    address: 'D-56, Shantiniketan Block C',
    ward: 'Ward 01 - Metro Central',
    area: 'Shantiniketan',
    constituency: 'Central Delhi Metro',
    district: 'Central District',
    state: 'Delhi NCT',
    assocId: assocSnehaId,
    status: 'INACTIVE',
    mustChange: 0,
    daysAgo: 7
  },
  {
    name: 'Harpreet Singh Sandhu',
    mobile: '9876543218',
    login_id: 'VOTER10033',
    epic: 'EPIC-ND-104929',
    gender: 'MALE',
    dob: '1989-08-25',
    age: 36,
    address: 'Kothi 14, Punjabi Bagh West',
    ward: 'Ward 03 - Metro North',
    area: 'Punjabi Bagh Extension',
    constituency: 'North Delhi Metro',
    district: 'North District',
    state: 'Delhi NCT',
    assocId: assocRahulId,
    status: 'ACTIVE',
    mustChange: 0,
    daysAgo: 8
  },
  {
    name: 'Pooja Chawla',
    mobile: '9876543219',
    login_id: 'VOTER10034',
    epic: 'EPIC-ND-104930',
    gender: 'FEMALE',
    dob: '1993-02-14',
    age: 33,
    address: 'Pocket 3, Sector 18, Rohini',
    ward: 'Ward 03 - Metro North',
    area: 'Sector 18 Hub',
    constituency: 'North Delhi Metro',
    district: 'North District',
    state: 'Delhi NCT',
    assocId: assocAnitaId,
    status: 'ACTIVE',
    mustChange: 0,
    daysAgo: 9
  },
  {
    name: 'Suresh Kumar Yadav',
    mobile: '9876543220',
    login_id: 'VOTER10035',
    epic: 'EPIC-ND-104931',
    gender: 'MALE',
    dob: '1975-06-30',
    age: 50,
    address: 'Village Badarpur Main, Gali 2',
    ward: 'Ward 04 - Metro South',
    area: 'Badarpur Extension',
    constituency: 'South Delhi Metro',
    district: 'South District',
    state: 'Delhi NCT',
    assocId: assocVikramId,
    status: 'FLAGGED',
    mustChange: 0,
    daysAgo: 10
  },
  {
    name: 'Meenakshi Iyer',
    mobile: '9876543221',
    login_id: 'VOTER10036',
    epic: 'EPIC-ND-104932',
    gender: 'FEMALE',
    dob: '1988-10-05',
    age: 37,
    address: 'Villa 18, Palm Meadows',
    ward: 'Ward 02 - Metro East',
    area: 'Mayur Vihar Phase 1',
    constituency: 'East Delhi Metro',
    district: 'East District',
    state: 'Delhi NCT',
    assocId: assocSnehaId,
    status: 'ACTIVE',
    mustChange: 0,
    daysAgo: 11
  }
];

sampleVoters.forEach(v => {
  const userRes = query.run(
    `INSERT INTO users (login_id, mobile, password_hash, name, role, status, created_by, must_change_password, created_at)
     VALUES (?, ?, ?, ?, 'VOTER', ?, ?, ?, datetime('now', '-' || ? || ' days'))`,
    v.login_id,
    v.mobile,
    v.mustChange ? tempHash : defaultHash,
    v.name,
    v.status === 'FLAGGED' ? 'SUSPENDED' : v.status,
    v.assocId,
    v.mustChange,
    v.daysAgo
  );

  query.run(
    `INSERT INTO voters (
      user_id, voter_login_id, epic_number, full_name, mobile,
      gender, dob, age, address, ward, area,
      constituency, district, state, associate_member_id, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'))`,
    userRes.lastInsertRowid,
    v.login_id,
    v.epic,
    v.name,
    v.mobile,
    v.gender,
    v.dob,
    v.age,
    v.address,
    v.ward,
    v.area,
    v.constituency,
    v.district,
    v.state,
    v.assocId,
    v.status,
    v.daysAgo
  );
});

// 5. Seed Portal Settings
const defaultSettings = [
  { key: 'portal_name', value: 'CivicPulse Enterprise Voter Portal', description: 'Public facing portal title' },
  { key: 'election_title', value: '2026 Metropolitan General Assembly Election', description: 'Active election cycle' },
  { key: 'require_epic', value: 'true', description: 'Mandate EPIC Voter ID number during registration' },
  { key: 'allow_voter_self_edit', value: 'true', description: 'Allow voters to update permitted contact fields' },
  { key: 'support_email', value: 'support@civicpulse.org', description: 'Helpdesk contact email' },
  { key: 'support_phone', value: '+91 1800 233 4567', description: 'Helpline toll-free phone number' },
  { key: 'registration_status', value: 'OPEN', description: 'Portal registration status (OPEN/CLOSED)' }
];

defaultSettings.forEach(s => {
  query.run(
    `INSERT INTO portal_settings (key, value, description) VALUES (?, ?, ?)`,
    s.key, s.value, s.description
  );
});

// 6. Seed Audit Logs
const sampleAuditLogs = [
  {
    userId: superAdminId,
    userName: 'Dr. Alexander Vance (Super Admin)',
    userRole: 'SUPER_ADMIN',
    action: 'SYSTEM_INIT',
    targetType: 'SYSTEM',
    targetId: 'SYS_01',
    details: JSON.stringify({ message: 'Portal database initialized and security policies applied.' })
  },
  {
    userId: adminMetroId,
    userName: 'Rajesh Sharma (Admin - Metro)',
    userRole: 'ADMIN',
    action: 'CREATE_ASSOCIATE_MEMBER',
    targetType: 'USER',
    targetId: String(assocRahulId),
    details: JSON.stringify({ name: 'Rahul Verma', login_id: 'assoc.rahul' })
  },
  {
    userId: assocRahulId,
    userName: 'Rahul Verma',
    userRole: 'ASSOCIATE_MEMBER',
    action: 'CREATE_VOTER',
    targetType: 'VOTER',
    targetId: 'VOTER10025',
    details: JSON.stringify({ voter_name: 'Arjun Mehta', epic: 'EPIC-ND-104921' })
  },
  {
    userId: assocRahulId,
    userName: 'Rahul Verma',
    userRole: 'ASSOCIATE_MEMBER',
    action: 'CREATE_VOTER',
    targetType: 'VOTER',
    targetId: 'VOTER10026',
    details: JSON.stringify({ voter_name: 'Kavita Reddy', epic: 'EPIC-ND-104922' })
  }
];

sampleAuditLogs.forEach(l => {
  query.run(
    `INSERT INTO audit_logs (user_id, user_name, user_role, action, target_type, target_id, details, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?, '127.0.0.1')`,
    l.userId, l.userName, l.userRole, l.action, l.targetType, l.targetId, l.details
  );
});

console.log('Seeding completed successfully!');
console.log('-------------------------------------------------------');
console.log('Demo Credentials:');
console.log('1. Super Admin:      superadmin       / Password@123');
console.log('2. Admin:            admin.metro      / Password@123');
console.log('3. Associate Member: assoc.rahul      / Password@123');
console.log('4. Voter (Active):   VOTER10025       / Password@123');
console.log('5. Voter (1st Login):VOTER10026       / Vote#8921');
console.log('-------------------------------------------------------');

