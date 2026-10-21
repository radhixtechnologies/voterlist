import assert from 'node:assert';

const BASE_URL = process.env.TEST_API_BASE_URL || 'http://localhost:5000/api';

async function testSuite() {
  console.log('--- STARTING END-TO-END VERIFICATION TEST SUITE ---');

  // Test 1: Super Admin Login
  console.log('1. Testing Super Admin Login...');
  const saRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'superadmin', password: 'Password@123' })
  });
  const saData = await saRes.json();
  assert.strictEqual(saRes.status, 200);
  assert.strictEqual(saData.user.role, 'SUPER_ADMIN');
  const saToken = saData.token;
  console.log('   ✓ Super Admin authenticated successfully');

  // Test 2: Super Admin Dashboard Stats
  console.log('2. Testing Super Admin Dashboard Statistics...');
  const saStatsRes = await fetch(`${BASE_URL}/stats/dashboard`, {
    headers: { Authorization: `Bearer ${saToken}` }
  });
  const saStats = await saStatsRes.json();
  assert.strictEqual(saStatsRes.status, 200);
  assert(saStats.stats.totalVoters > 0);
  assert(saStats.stats.totalAdmins >= 2);
  assert(saStats.stats.totalAssociates >= 4);
  console.log(`   ✓ Stats verified: ${saStats.stats.totalVoters} voters, ${saStats.stats.totalAdmins} admins, ${saStats.stats.totalAssociates} associates`);

  // Test 3: Admin Scoped Login & Scoping Check
  console.log('3. Testing Admin Scoping...');
  const adminRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin.metro', password: 'Password@123' })
  });
  const adminData = await adminRes.json();
  assert.strictEqual(adminRes.status, 200);
  assert.strictEqual(adminData.user.role, 'ADMIN');
  const adminToken = adminData.token;

  // Admin attempts to view Admins list (should be 403 Forbidden)
  const forbiddenAdminCheck = await fetch(`${BASE_URL}/users/admins`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(forbiddenAdminCheck.status, 403);
  console.log('   ✓ Security check passed: Admin blocked from accessing Super Admin endpoints (403)');

  // Admin gets their scoped dashboard
  const adminStatsRes = await fetch(`${BASE_URL}/stats/dashboard`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const adminStats = await adminStatsRes.json();
  assert.strictEqual(adminStatsRes.status, 200);
  console.log(`   ✓ Admin scoped dashboard verified: ${adminStats.stats.totalAssociates} managed associates`);

  // Test 4: Associate Member Registers New Voter & Credentials Generated
  console.log('4. Testing Associate Member Voter Registration & Credential Generation...');
  const assocRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'assoc.rahul', password: 'Password@123' })
  });
  const assocData = await assocRes.json();
  assert.strictEqual(assocRes.status, 200);
  assert.strictEqual(assocData.user.role, 'ASSOCIATE_MEMBER');
  const assocToken = assocData.token;

  const testMobile = `981${Math.floor(1000000 + Math.random() * 9000000)}`;
  const regRes = await fetch(`${BASE_URL}/voters`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${assocToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      full_name: 'Test Citizen E2E',
      mobile: testMobile,
      address: 'Plot 99, Green Avenue',
      state: 'Delhi NCT',
      district: 'South District',
      constituency: 'South Delhi Metro',
      ward: 'Ward 04 - Metro South',
      area: 'Sector 14'
    })
  });
  const regData = await regRes.json();
  assert.strictEqual(regRes.status, 201);
  assert(regData.credentials.login_id.startsWith('VOTER'));
  assert(regData.credentials.temp_password.length > 0);
  console.log(`   ✓ New citizen registered: ${regData.voter.full_name} with Login ID: ${regData.credentials.login_id} and Temp Password: ${regData.credentials.temp_password}`);

  // Test 5: Duplicate Prevention
  console.log('5. Testing Duplicate Registration Prevention...');
  const dupRes = await fetch(`${BASE_URL}/voters`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${assocToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      full_name: 'Imposter Citizen',
      mobile: testMobile, // duplicate mobile!
      address: 'Different address',
      state: 'Delhi NCT',
      district: 'South District',
      constituency: 'South Delhi Metro',
      ward: 'Ward 04',
      area: 'Sector 14'
    })
  });
  assert.strictEqual(dupRes.status, 409);
  const dupData = await dupRes.json();
  assert(dupData.message.includes('already registered'));
  console.log('   ✓ Duplicate prevention verified: 409 Conflict returned with clear message');

  // Test 6: New Voter First-Time Login & Password Reset Flow
  console.log('6. Testing New Voter Login & Forced Password Reset...');
  const newVoterRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: regData.credentials.login_id, password: regData.credentials.temp_password })
  });
  const newVoterData = await newVoterRes.json();
  assert.strictEqual(newVoterRes.status, 200);
  assert.strictEqual(newVoterData.user.must_change_password, true);
  console.log('   ✓ Forced password reset flag verified: must_change_password = true');

  // New voter updates password
  const pwRes = await fetch(`${BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${newVoterData.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      currentPassword: regData.credentials.temp_password,
      newPassword: 'MyNewSecurePassword#2026'
    })
  });
  assert.strictEqual(pwRes.status, 200);
  console.log('   ✓ Temporary password successfully updated to private password');

  // Test 7: Audit Log Verification
  console.log('7. Testing Audit Logging of Sensitive Actions...');
  const auditRes = await fetch(`${BASE_URL}/audit`, {
    headers: { Authorization: `Bearer ${saToken}` }
  });
  const auditData = await auditRes.json();
  assert.strictEqual(auditRes.status, 200);
  const actions = auditData.logs.map(l => l.action);
  assert(actions.includes('CREATE_VOTER'));
  assert(actions.includes('CHANGE_PASSWORD'));
  console.log(`   ✓ Audit log stream verified: ${auditData.pagination.total} audit events recorded`);

  console.log('--- ALL END-TO-END VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
}

testSuite().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
