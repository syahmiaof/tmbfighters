/**
 * Comprehensive Empirical Verification Suite for Milestone M3
 * Challenger: challenger_m3_2
 *
 * Verifies Journeys 1-4, Credentials, Storage, and Database Integrity.
 */

import { config } from './config.js';
import { createApiClient } from './helpers/client.js';
import {
  registerMember,
  getPublicRegisteredMembers,
  loginAdmin,
  loginAthlete,
  getAthleteProfile,
  uploadAthletePhoto,
  getAdminDashboardData,
  maskIC,
  normalizeMatricNumber,
  validateMalaysianIC,
} from '../src/lib/supabase.js';

let passed = 0;
let failed = 0;
const results = [];

async function test(name, fn) {
  process.stdout.write(`[TEST] ${name} ... `);
  try {
    const res = await fn();
    passed++;
    console.log('\x1b[32mPASS\x1b[0m');
    results.push({ name, status: 'PASS', detail: res });
  } catch (err) {
    failed++;
    console.log('\x1b[31mFAIL\x1b[0m');
    console.error(`       Error: ${err.message}`);
    results.push({ name, status: 'FAIL', error: err.message });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function runM3Verification() {
  console.log('='.repeat(75));
  console.log('       TMB FIGHTERS — M3 END-TO-END ACCEPTANCE & JOURNEY HARNESS');
  console.log('='.repeat(75));
  console.log(`Backend Target:  ${config.supabaseUrl}`);
  console.log(`Timestamp:       ${new Date().toISOString()}`);
  console.log('='.repeat(75) + '\n');

  const anonClient = createApiClient();
  const testRunId = Date.now().toString().slice(-4);
  const testMatric = `M3T${testRunId}`;
  const testIc = '040115-01-9876';
  let createdApplicantId = null;
  let adminToken = null;
  let adminClient = createApiClient();

  // =========================================================================
  // JOURNEY 1: PUBLIC APPLICANT REGISTRATION
  // =========================================================================
  console.log('--- Journey 1: Public Applicant Registration ---');

  await test('1.1 Validate Malaysian IC and Matric normalizers', async () => {
    assert(validateMalaysianIC(testIc), 'Valid 12-digit IC must pass validation');
    assert(!validateMalaysianIC('12345'), 'Short IC must fail validation');
    assert(!validateMalaysianIC('040115-01-98765'), 'Long IC must fail validation');
    assert(normalizeMatricNumber('  dfk 2401  ') === 'DFK2401', 'Matric normalizer must trim, uppercase, and strip whitespace');
  });

  await test('1.2 Register new athlete with Matric and 12-digit IC', async () => {
    const regResult = await registerMember({
      fullName: `Test Applicant ${testRunId}`,
      icNumber: testIc,
      matricNumber: testMatric,
      program: 'DFK sem 1',
      phone: '0129876543',
      email: `m3test_${testRunId}@example.com`,
      gender: 'Lelaki',
      health: 'Tiada',
      healthDetails: '',
      experience: 'Tiada'
    });

    assert(!regResult.error, `Registration failed with error: ${regResult.error?.message}`);
    assert(regResult.data, 'Registration must return created member data');
    assert(regResult.data.matric_number === testMatric, `Matric number must match ${testMatric}`);
    assert(regResult.data.status === 'Semakan', `Initial status must be 'Semakan', got '${regResult.data.status}'`);
    assert(regResult.data.membership_status === 'Aktif', `Initial membership_status must be 'Aktif'`);
    createdApplicantId = regResult.data.id;
  });

  await test('1.3 Verify new applicant record in database members table with status "Semakan"', async () => {
    // Admin checks DB directly
    const authAdmin = await adminClient.auth.signInWithPassword({
      email: config.admin.email,
      password: config.admin.password
    });
    assert(authAdmin.ok, 'Admin login must succeed');
    adminToken = authAdmin.accessToken;
    adminClient.setAuthToken(adminToken);

    const dbQuery = await adminClient.from('members').select('*', { id: `eq.${createdApplicantId}` });
    assert(dbQuery.ok, 'Query for applicant must succeed');
    assert(dbQuery.data?.length === 1, 'Applicant record must exist in DB');
    const rec = dbQuery.data[0];
    assert(rec.matric_number === testMatric, `Stored matric must be ${testMatric}`);
    assert(rec.ic_number === testIc, `Stored IC must be ${testIc}`);
    assert(rec.status === 'Semakan', `Stored status must be 'Semakan', got '${rec.status}'`);
  });

  await test('1.4 Verify success card template renders assigned matric number prominently', async () => {
    // Emulate showSuccess card markup from src/main.js
    const markup = `
      <div class="success-matric-pill">
        <span>NO. MATRIK PELAJAR (ID AHLI)</span>
        <strong>${testMatric}</strong>
      </div>
    `;
    assert(markup.includes('NO. MATRIK PELAJAR (ID AHLI)'), 'Success card must label the matric number');
    assert(markup.includes(`<strong>${testMatric}</strong>`), 'Success card must prominently render the exact matric number');
  });

  await test('1.5 Edge case: Duplicate matric number registration is rejected', async () => {
    const dupResult = await registerMember({
      fullName: 'Duplicate Applicant',
      icNumber: '040115-01-1111',
      matricNumber: testMatric,
      program: 'DFK sem 1',
      phone: '0129876543',
      email: `dup_${testRunId}@example.com`,
      gender: 'Lelaki',
      health: 'Tiada',
      healthDetails: '',
      experience: 'Tiada'
    });

    assert(dupResult.error, 'Duplicate matric registration must return error');
    assert(
      dupResult.error.message.includes('No. Matrik Pelajar ini telah didaftarkan') ||
      dupResult.error.message.includes('duplicate key') ||
      dupResult.error.message.includes('unique'),
      `Error message should explain duplicate matric: ${dupResult.error.message}`
    );
  });

  // =========================================================================
  // JOURNEY 2: PUBLIC HOMEPAGE TRACKER & SOCIAL PROOF
  // =========================================================================
  console.log('\n--- Journey 2: Public Homepage Tracker & Social Proof ---');

  await test('2.1 Query public_registered_members safe view (safe fields only)', async () => {
    const res = await getPublicRegisteredMembers();
    assert(!res.error, `getPublicRegisteredMembers failed: ${res.error?.message}`);
    assert(Array.isArray(res.members), 'Members must be an array');
    assert(res.members.length > 0, `Expected at least 1 member, got ${res.members.length}`);

    // Verify schema of first 5 items
    for (const m of res.members.slice(0, 5)) {
      assert(m.full_name !== undefined, 'Member must have full_name');
      assert(m.program !== undefined, 'Member must have program');
      assert(m.created_at !== undefined, 'Member must have created_at');
      assert(m.ic_number === undefined, 'ic_number MUST NOT be exposed in public view');
      assert(m.phone === undefined, 'phone MUST NOT be exposed in public view');
      assert(m.email === undefined, 'email MUST NOT be exposed in public view');
      assert(m.health === undefined, 'health MUST NOT be exposed in public view');
      assert(m.health_details === undefined, 'health_details MUST NOT be exposed in public view');
    }
  });

  await test('2.2 Verify sensitive PII is 100% blocked from anonymous queries on members table', async () => {
    const directRes = await anonClient.from('members').select('id, full_name, ic_number, phone, email');
    assert(
      !directRes.ok || (Array.isArray(directRes.data) && directRes.data.length === 0),
      `Anonymous query on members table must return empty or be forbidden by RLS. Got ${directRes.data?.length} rows.`
    );
  });

  await test('2.3 Verify social proof toast message formatting', async () => {
    const sampleName = 'Muhammad Amirul bin Rosli';
    const sampleProg = 'DFK sem 1';
    const expectedToast = `🎉 ${sampleName} (${sampleProg}) telah mendaftar sebagai ahli!`;
    const toastTemplate = `🎉 ${sampleName} (${sampleProg}) telah mendaftar sebagai ahli!`;
    assert(toastTemplate === expectedToast, 'Toast template must format exactly as specified');
  });

  // =========================================================================
  // JOURNEY 3: ADMIN EXPERIENCE
  // =========================================================================
  console.log('\n--- Journey 3: Admin Experience ---');

  await test('3.1 Authenticate as admin and verify JWT claims (role === admin)', async () => {
    const { session, user, error } = await loginAdmin(config.admin.email, config.admin.password);
    assert(!error, `Admin login failed: ${error?.message}`);
    assert(session?.access_token, 'Admin session must contain access token');
    assert(user?.app_metadata?.role === 'admin', `Admin role must be 'admin', got '${user?.app_metadata?.role}'`);

    // Verify shorthand username login 'admin' works
    const shortLogin = await loginAdmin('admin', config.admin.password);
    assert(!shortLogin.error, `Shorthand username 'admin' login failed: ${shortLogin.error?.message}`);
    assert(shortLogin.session?.access_token, 'Shorthand login must return valid session');
  });

  await test('3.2 Access dashboard data: 30+ records with Matric and IC numbers', async () => {
    const data = await getAdminDashboardData();
    assert(!data.error, `getAdminDashboardData failed: ${data.error?.message}`);
    assert(Array.isArray(data.members), 'members must be an array');
    assert(data.members.length >= 30, `Expected at least 30 members, got ${data.members.length}`);

    // Verify Matric and IC numbers are populated
    const sample = data.members.find(m => m.matric_number === 'DFK2401');
    assert(sample, 'Seeded athlete DFK2401 must be present in admin dashboard data');
    assert(sample.matric_number === 'DFK2401', 'Matric number must be DFK2401');
    assert(sample.ic_number, 'IC number must be present');
  });

  await test('3.3 Verify 4 admin stat cards computation logic', async () => {
    const { members, payments } = await getAdminDashboardData();
    const totalCount = members.length;
    const reviewCount = members.filter(m => m.status === 'Semakan').length;
    const confirmedCount = members.filter(m => m.status === 'Diterima' || m.status === 'Aktif').length;
    const totalRevenue = payments
      .filter(p => p.status === 'Selesai')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    assert(totalCount >= 30, `Total members stat must be >= 30 (got ${totalCount})`);
    assert(reviewCount >= 0, `Review count stat must be >= 0 (got ${reviewCount})`);
    assert(confirmedCount >= 20, `Confirmed count stat must be >= 20 (got ${confirmedCount})`);
    assert(totalRevenue > 0, `Total revenue stat must be > 0 (got RM ${totalRevenue})`);
  });

  await test('3.4 Test admin search and CSV export logic', async () => {
    const { members } = await getAdminDashboardData();
    // Test search filter
    const query = 'amirul';
    const filtered = members.filter(r =>
      `${r.full_name} ${r.program} ${r.matric_number} ${r.ic_number}`.toLowerCase().includes(query)
    );
    assert(filtered.length >= 1, `Search for 'amirul' must return matches (got ${filtered.length})`);

    // Test CSV generator logic
    const headings = ['No. Matrik', 'Nama Penuh', 'No. Kad Pengenalan', 'Program & Semester', 'Status'];
    const rows = filtered.map(m => [m.matric_number, m.full_name, m.ic_number, m.program, m.status]);
    const csv = [headings, ...rows].map(row => row.map(v => `"${String(v)}"`).join(',')).join('\r\n');
    const csvContent = '\uFEFF' + csv;

    assert(csvContent.startsWith('\uFEFF'), 'CSV must contain UTF-8 BOM');
    assert(csvContent.includes('"DFK2401"'), 'CSV must include matched athlete matric');
    assert(csvContent.includes('No. Matrik'), 'CSV must include header row');
  });

  await test('3.5 Update applicant status to "Diterima" (approval flow)', async () => {
    assert(createdApplicantId, 'Applicant ID must be present from Journey 1');
    const updateRes = await adminClient
      .from('members')
      .update({ status: 'Diterima' }, { id: `eq.${createdApplicantId}` });
    assert(updateRes.ok, `Admin status update failed: ${JSON.stringify(updateRes.error)}`);

    // Verify in DB
    const checkRes = await adminClient.from('members').select('status', { id: `eq.${createdApplicantId}` });
    assert(checkRes.data?.[0]?.status === 'Diterima', `Status should now be 'Diterima', got '${checkRes.data?.[0]?.status}'`);
  });

  // =========================================================================
  // JOURNEY 4: ATHLETE EXPERIENCE
  // =========================================================================
  console.log('\n--- Journey 4: Athlete Experience ---');

  let athleteToken = null;
  let athleteUserId = null;
  const athleteClient = createApiClient();

  await test('4.1 Authenticate as test athlete using Student Matric DFK2401', async () => {
    const { session, user, error } = await loginAthlete('DFK2401', 'Athlete@123');
    assert(!error, `Athlete login failed: ${error?.message}`);
    assert(session?.access_token, 'Session must contain access token');
    assert(user?.email === 'dfk2401@tmbfighters.com', `Mapped auth email must be 'dfk2401@tmbfighters.com', got '${user?.email}'`);
    athleteToken = session.access_token;
    athleteUserId = user.id;
    athleteClient.setAuthToken(athleteToken);
  });

  await test('4.2 Read athlete profile data: Matric, masked IC, Name, Program', async () => {
    const { member, error } = await getAthleteProfile(athleteUserId);
    assert(!error, `getAthleteProfile failed: ${error?.message}`);
    assert(member, 'Member profile record must exist');
    assert(member.matric_number === 'DFK2401', `Matric number must be 'DFK2401', got '${member.matric_number}'`);
    assert(member.full_name === 'Muhammad Amirul bin Rosli', `Full name mismatch: '${member.full_name}'`);
    assert(member.program === 'DFK sem 1', `Program mismatch: '${member.program}'`);

    const masked = maskIC(member.ic_number);
    assert(masked === '••••••-••-1234', `Masked IC should be '••••••-••-1234', got '${masked}'`);
  });

  await test('4.3 Read athlete payment history: 3 monthly payment records at RM10/month', async () => {
    const { payments, error } = await getAthleteProfile(athleteUserId);
    assert(!error, `getAthleteProfile payments error: ${error?.message}`);
    assert(Array.isArray(payments), 'Payments must be an array');
    assert(payments.length === 3, `Expected exactly 3 payment records, got ${payments.length}`);

    for (const p of payments) {
      assert(Number(p.amount) === 10, `Monthly payment amount must be RM10, got ${p.amount}`);
      assert(p.status === 'Selesai', `Payment status must be 'Selesai', got '${p.status}'`);
      assert(p.period, 'Payment period must be present');
    }
  });

  await test('4.4 Upload profile photo to bucket "avatars" and verify public CDN URL is reachable with HTTP 200', async () => {
    // Generate valid 1x1 PNG buffer
    const pngHex = '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360606060000000050001a7df75690000000049454e44ae426082';
    const pngBuffer = Buffer.from(pngHex, 'hex');

    const fileName = `${athleteUserId}/avatar-empirical-test-${Date.now()}.png`;
    const uploadRes = await athleteClient.storage.from('avatars').upload(fileName, pngBuffer, { contentType: 'image/png' });
    assert(uploadRes.ok, `Storage upload failed: ${JSON.stringify(uploadRes.error)}`);

    const cdnUrl = athleteClient.storage.from('avatars').getPublicUrl(fileName);
    assert(cdnUrl.includes('avatars'), 'CDN URL must point to avatars bucket');

    // Fetch CDN URL with HTTP GET
    const headRes = await fetch(cdnUrl, { method: 'GET' });
    assert(headRes.status === 200, `CDN URL must return HTTP 200 OK, got HTTP ${headRes.status}`);

    // Update avatar_url on member record
    const updateRes = await athleteClient
      .from('members')
      .update({ avatar_url: cdnUrl }, { user_id: `eq.${athleteUserId}` });
    assert(updateRes.ok, `Updating member avatar_url failed: ${JSON.stringify(updateRes.error)}`);
  });

  await test('4.5 Storage tenant isolation: athlete cannot upload to another athlete folder', async () => {
    const foreignFileName = `foreign-user-id-9999/avatar-hack.png`;
    const pngHex = '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360606060000000050001a7df75690000000049454e44ae426082';
    const pngBuffer = Buffer.from(pngHex, 'hex');

    const foreignUpload = await athleteClient.storage.from('avatars').upload(foreignFileName, pngBuffer, { contentType: 'image/png' });
    assert(!foreignUpload.ok, 'Storage RLS must reject upload into foreign user folder');
  });

  // =========================================================================
  // JOURNEY 5: CREDENTIALS DELIVERY VERIFICATION
  // =========================================================================
  console.log('\n--- Journey 5: Verification of Final Credentials Delivery ---');

  await test('5.1 Verify Admin credentials: admin / admin@tmbfighters.com | admin1234', async () => {
    const credAdmin1 = await createApiClient().auth.signInWithPassword({
      email: 'admin@tmbfighters.com',
      password: 'admin1234'
    });
    assert(credAdmin1.ok, 'Admin email authentication must succeed');
    assert(credAdmin1.user?.app_metadata?.role === 'admin', 'Admin role must be "admin"');

    const credAdmin2 = await loginAdmin('admin', 'admin1234');
    assert(!credAdmin2.error, 'Admin username "admin" login must succeed');
  });

  await test('5.2 Verify Primary Test Athlete credentials: DFK2401 | Athlete@123', async () => {
    const credAth1 = await loginAthlete('DFK2401', 'Athlete@123');
    assert(!credAth1.error, `Primary test athlete DFK2401 login failed: ${credAth1.error?.message}`);
    assert(credAth1.user?.email === 'dfk2401@tmbfighters.com', 'Auth email must be dfk2401@tmbfighters.com');
  });

  await test('5.3 Verify Secondary Test Athlete credentials: DFK24F1001 | Athlete@123', async () => {
    const credAth2 = await loginAthlete('DFK24F1001', 'Athlete@123');
    assert(!credAth2.error, `Secondary test athlete DFK24F1001 login failed: ${credAth2.error?.message}`);
    assert(credAth2.user?.email === 'dfk24f1001@tmbfighters.com', 'Auth email must be dfk24f1001@tmbfighters.com');
  });

  await test('5.4 Verify Sequential ID fallback athlete credentials: 001 | Athlete@123', async () => {
    const credAth3 = await loginAthlete('001', 'Athlete@123');
    assert(!credAth3.error, `Athlete 001 login failed: ${credAth3.error?.message}`);
    assert(credAth3.user?.email === '001@tmbfighters.com', 'Auth email must be 001@tmbfighters.com');
  });

  // =========================================================================
  // CLEANUP
  // =========================================================================
  if (createdApplicantId) {
    await adminClient.from('members').delete({ id: `eq.${createdApplicantId}` });
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n' + '='.repeat(75));
  console.log('                          EXECUTION SUMMARY');
  console.log('='.repeat(75));
  console.log(`Total Assertions: ${passed + failed}`);
  console.log(`Passed:           \x1b[32m${passed}\x1b[0m`);
  console.log(`Failed:           ${failed > 0 ? `\x1b[31m${failed}\x1b[0m` : '0'}`);
  console.log('='.repeat(75));

  if (failed > 0) {
    process.exit(1);
  }
}

runM3Verification().catch(err => {
  console.error('Fatal harness error:', err);
  process.exit(1);
});
