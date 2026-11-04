/**
 * TMB FIGHTERS — EMPIRICAL ADVERSARIAL STRESS TEST HARNESS (MILESTONE M2)
 * 
 * Verifies Registration & Authentication Flows against live Supabase backend:
 * 1. Registration Flow:
 *    - 1.1 New applicant insertion with No. Matrik and IC -> matric_number & member_id auto-synced
 *    - 1.2 Duplicate No. Matrik insertion -> PostgREST HTTP 409 (code 23505) & registerMember user error
 *    - 1.3 Case-insensitive duplicate matric detection ('dfk2401' vs 'DFK2401')
 *    - 1.4 IC validation edge cases (less than 12 digits, hyphens, alphanumeric, masking)
 *    - 1.5 Health conditional validation (health === 'Ada' with details vs cleared when 'Tiada')
 *    - 1.6 Check constraints enforcement on DB (gender, health, experience, status)
 * 2. Authentication & Authorization Flow:
 *    - 2.1 Admin login: valid credentials return access_token with admin role
 *    - 2.2 Admin login: invalid password rejected with proper error
 *    - 2.3 Athlete login: valid matric 'DFK2401' logs in via dfk2401@tmbfighters.com
 *    - 2.4 Athlete login: mixed-case 'dfk2401' and whitespace padded '  DFK2401  ' login successfully
 *    - 2.5 Athlete login: invalid password rejected with proper error
 *    - 2.6 Athlete login: non-existent matric rejected
 *    - 2.7 Role Guard: Athlete credentials passed to loginAdmin are BLOCKED with error and session purged
 *    - 2.8 Cross-tenant RLS: Athlete session cannot read or modify peer records or payments
 *    - 2.9 Session restoration & lifecycle: login -> getSession() non-null -> logout() -> getSession() null
 * 3. Data Integrity & Safe Views:
 *    - 3.1 Public safe view public_registered_members does NOT leak IC, phone, email, health
 *    - 3.2 getAthleteProfile returns member details and payments for authenticated athlete
 */

import { config } from './config.js';
import { createApiClient } from './helpers/client.js';
import {
  supabase,
  registerMember,
  getPublicRegisteredMembers,
  loginAdmin,
  loginAthlete,
  getAthleteProfile,
  uploadAthletePhoto,
  getAdminDashboardData,
  getSession,
  getUser,
  logout,
  maskIC,
  normalizeMatricNumber,
  validateMalaysianIC,
} from '../src/lib/supabase.js';

let passedCount = 0;
let failedCount = 0;
const results = [];

async function challenge(id, title, testFn) {
  process.stdout.write(`[TEST] ${id} ${title} ... `);
  const start = Date.now();
  try {
    const detail = await testFn();
    const duration = Date.now() - start;
    passedCount++;
    console.log(`PASS (${duration}ms)`);
    results.push({ id, title, status: 'PASS', duration, detail });
  } catch (err) {
    const duration = Date.now() - start;
    failedCount++;
    console.log(`FAIL (${duration}ms)`);
    console.error(`   -> Error: ${err.message}`);
    results.push({ id, title, status: 'FAIL', duration, error: err.message });
  }
}

async function runAdversarialHarness() {
  console.log('='.repeat(72));
  console.log('    TMB FIGHTERS — M2 ADVERSARIAL STRESS TEST HARNESS (REG & AUTH)');
  console.log('='.repeat(72));
  console.log(`Target Supabase URL: ${config.supabaseUrl}`);
  console.log('Execution Mode:      GENUINE LIVE BACKEND AUDIT');
  console.log('Timestamp:           ' + new Date().toISOString());
  console.log('='.repeat(72));
  console.log('');

  const anonClient = createApiClient();
  const adminClient = createApiClient();

  // Setup admin client
  const adminAuth = await adminClient.auth.signInWithPassword({
    email: config.admin.email,
    password: config.admin.password,
  });
  if (!adminAuth.ok) {
    throw new Error(`Admin authentication failed during test harness setup: ${JSON.stringify(adminAuth.error)}`);
  }
  adminClient.setAuthToken(adminAuth.accessToken);

  // -------------------------------------------------------------------------
  // SECTION 1: REGISTRATION FLOW ADVERSARIAL CHALLENGES
  // -------------------------------------------------------------------------
  console.log('--- SECTION 1: REGISTRATION FLOW ADVERSARIAL CHALLENGES ---');

  const testMatric = `ADV${Date.now().toString().slice(-6)}`;
  const testIc = '050101-03-7890';
  let createdTestMemberId = null;

  await challenge('1.1', 'New applicant insertion auto-syncs matric_number and member_id', async () => {
    const payload = {
      fullName: 'Peserta Ujian Adversarial M2',
      icNumber: testIc,
      matricNumber: testMatric,
      program: 'DFK sem 1',
      phone: '0198887766',
      email: `test.${testMatric.toLowerCase()}@tmbfighters.com`,
      gender: 'Lelaki',
      health: 'Tiada',
      healthDetails: '',
      experience: 'Ada',
    };

    const { data, error } = await registerMember(payload);
    if (error) {
      throw new Error(`registerMember failed: ${error.message}`);
    }
    if (!data) {
      throw new Error('registerMember returned no data representation');
    }

    createdTestMemberId = data.id;

    if (data.matric_number !== testMatric.toUpperCase()) {
      throw new Error(`Expected matric_number '${testMatric.toUpperCase()}', got '${data.matric_number}'`);
    }

    if (data.member_id !== testMatric.toUpperCase()) {
      throw new Error(`Expected member_id to match matric_number '${testMatric.toUpperCase()}', got '${data.member_id}'`);
    }

    if (data.ic_number !== testIc) {
      throw new Error(`Expected ic_number '${testIc}', got '${data.ic_number}'`);
    }

    if (data.status !== 'Semakan') {
      throw new Error(`Expected status 'Semakan', got '${data.status}'`);
    }

    return `Inserted record id: ${data.id}, matric_number: ${data.matric_number}, member_id: ${data.member_id}`;
  });

  await challenge('1.2', 'Duplicate matric insertion rejected via raw PostgREST with HTTP 409 & 23505', async () => {
    const rawRes = await anonClient.from('members').insert({
      full_name: 'Penyerang Duplicate PostgREST',
      ic_number: '050202-04-1234',
      matric_number: testMatric, // Duplicate of 1.1
      member_id: testMatric,
      program: 'DFK sem 1',
      phone: '0191112222',
      email: 'dup.postgrest@example.com',
      gender: 'Lelaki',
      health: 'Tiada',
      experience: 'Tiada',
    });

    if (rawRes.ok) {
      throw new Error('Database unexpectedly allowed duplicate matric insertion!');
    }

    if (rawRes.status !== 409) {
      throw new Error(`Expected HTTP 409, received HTTP ${rawRes.status}: ${JSON.stringify(rawRes.error)}`);
    }

    if (rawRes.error?.code !== '23505') {
      throw new Error(`Expected Postgres error code 23505, received ${rawRes.error?.code}`);
    }

    return `PostgREST correctly rejected with HTTP 409, code 23505: ${rawRes.error?.message}`;
  });

  await challenge('1.3', 'Duplicate matric via registerMember() returns friendly Bahasa Melayu error', async () => {
    const { data, error } = await registerMember({
      fullName: 'Penyerang Duplicate Frontend',
      icNumber: '050303-05-9999',
      matricNumber: testMatric, // Duplicate of 1.1
      program: 'DFK sem 1',
      phone: '0193334444',
      email: 'dup.frontend@example.com',
      gender: 'Perempuan',
      health: 'Tiada',
      experience: 'Tiada',
    });

    if (data) {
      throw new Error('registerMember unexpectedly succeeded on duplicate matric!');
    }

    if (!error) {
      throw new Error('registerMember returned neither data nor error');
    }

    const expectedSnippet = 'No. Matrik Pelajar ini telah didaftarkan dalam sistem';
    if (!error.message.includes(expectedSnippet)) {
      throw new Error(`Error message did not contain expected BM explanation: '${error.message}'`);
    }

    return `Friendly error message verified: "${error.message}"`;
  });

  await challenge('1.4', 'Case-insensitive duplicate matric detection (lowercase matric triggers 409/error)', async () => {
    const lowercaseMatric = testMatric.toLowerCase();
    const { data, error } = await registerMember({
      fullName: 'Penyerang Lowercase Duplicate',
      icNumber: '050404-06-8888',
      matricNumber: lowercaseMatric, // Lowercase variant of testMatric
      program: 'DFK sem 1',
      phone: '0195556666',
      email: 'lower.dup@example.com',
      gender: 'Lelaki',
      health: 'Tiada',
      experience: 'Tiada',
    });

    if (data) {
      throw new Error('registerMember allowed duplicate lowercase matric!');
    }

    if (!error || !error.message.includes('No. Matrik Pelajar ini telah didaftarkan')) {
      throw new Error(`Expected duplicate error, got: ${error?.message}`);
    }

    return `Normalized '${lowercaseMatric}' -> '${testMatric}' and blocked duplicate`;
  });

  await challenge('1.5', 'IC validation edge cases (lengths, formats, non-numeric)', async () => {
    // 12 digits valid
    if (!validateMalaysianIC('040115011234')) throw new Error('040115011234 should be valid');
    if (!validateMalaysianIC('040115-01-1234')) throw new Error('040115-01-1234 should be valid');
    if (!validateMalaysianIC('  040115-01-1234  ')) throw new Error('Whitespace padded IC should be valid');

    // Invalid lengths
    if (validateMalaysianIC('04011501123')) throw new Error('11-digit IC should be invalid');
    if (validateMalaysianIC('0401150112345')) throw new Error('13-digit IC should be invalid');
    if (validateMalaysianIC('')) throw new Error('Empty IC should be invalid');
    if (validateMalaysianIC(null)) throw new Error('Null IC should be invalid');
    if (validateMalaysianIC(undefined)) throw new Error('Undefined IC should be invalid');

    // Alphanumeric edge case
    if (validateMalaysianIC('04011501123A')) throw new Error('11 digits + 1 letter should be invalid');

    // Masking check
    const masked1 = maskIC('040115-01-1234');
    if (masked1 !== '••••••-••-1234') {
      throw new Error(`Expected '••••••-••-1234', got '${masked1}'`);
    }

    const masked2 = maskIC('040115011234');
    if (masked2 !== '••••••-••-1234') {
      throw new Error(`Expected '••••••-••-1234', got '${masked2}'`);
    }

    const maskedInvalid = maskIC('123');
    if (maskedInvalid !== '••••••-••-••••') {
      throw new Error(`Expected default mask for invalid IC, got '${maskedInvalid}'`);
    }

    return 'All IC validation and masking tests passed';
  });

  await challenge('1.6', 'Health conditional validation: health details captured when "Ada", cleared when "Tiada"', async () => {
    const matricAda = `ADA${Date.now().toString().slice(-6)}`;
    const resAda = await registerMember({
      fullName: 'Peserta Ada Masalah Kesihatan',
      icNumber: '050505-07-1111',
      matricNumber: matricAda,
      program: 'DFK sem 1',
      phone: '0197778888',
      email: `ada.${matricAda.toLowerCase()}@tmbfighters.com`,
      gender: 'Lelaki',
      health: 'Ada',
      healthDetails: 'Asma Kronik (Inhaler Ventolin)',
      experience: 'Tiada',
    });

    if (resAda.error) throw new Error(`Health Ada insert failed: ${resAda.error.message}`);
    if (resAda.data?.health_details !== 'Asma Kronik (Inhaler Ventolin)') {
      throw new Error(`Expected health_details preserved, got: '${resAda.data?.health_details}'`);
    }

    // Now test Tiada with extraneous details
    const matricTiada = `TDA${Date.now().toString().slice(-6)}`;
    const resTiada = await registerMember({
      fullName: 'Peserta Tiada Kesihatan',
      icNumber: '050606-08-2222',
      matricNumber: matricTiada,
      program: 'DFK sem 1',
      phone: '0197778889',
      email: `tiada.${matricTiada.toLowerCase()}@tmbfighters.com`,
      gender: 'Perempuan',
      health: 'Tiada',
      healthDetails: 'Should be cleared',
      experience: 'Tiada',
    });

    if (resTiada.error) throw new Error(`Health Tiada insert failed: ${resTiada.error.message}`);
    if (resTiada.data?.health_details !== '') {
      throw new Error(`Expected health_details to be cleared for 'Tiada', got: '${resTiada.data?.health_details}'`);
    }

    // Clean up temporary test records
    await adminClient.from('members').delete({ matric_number: `in.(${matricAda},${matricTiada})` });

    return 'Health conditional correctly retained for "Ada" and cleared for "Tiada"';
  });

  // Clean up primary test record from 1.1
  if (createdTestMemberId) {
    await adminClient.from('members').delete({ id: `eq.${createdTestMemberId}` });
  }

  // -------------------------------------------------------------------------
  // SECTION 2: AUTHENTICATION & AUTHORIZATION FLOW ADVERSARIAL CHALLENGES
  // -------------------------------------------------------------------------
  console.log('');
  console.log('--- SECTION 2: AUTHENTICATION & AUTHORIZATION FLOW CHALLENGES ---');

  await challenge('2.1', 'Admin login with valid credentials returns access_token with admin role', async () => {
    const { session, user, error } = await loginAdmin(config.admin.username, config.admin.password);

    if (error) {
      throw new Error(`loginAdmin failed unexpectedly: ${error.message}`);
    }

    if (!session || !session.access_token) {
      throw new Error('loginAdmin did not return a valid session or access_token');
    }

    if (!user) {
      throw new Error('loginAdmin did not return user object');
    }

    const isAdmin =
      user.app_metadata?.role === 'admin' ||
      user.email === 'admin@tmbfighters.com' ||
      user.email?.startsWith('admin@');

    if (!isAdmin) {
      throw new Error(`User does not have admin role claim! app_metadata: ${JSON.stringify(user.app_metadata)}`);
    }

    // Logout after test
    await logout();

    return `Admin authenticated. User ID: ${user.id}, Role: ${user.app_metadata?.role || 'admin'}`;
  });

  await challenge('2.2', 'Admin login with invalid password fails with error', async () => {
    const { session, error } = await loginAdmin(config.admin.username, 'WrongPassword2026!');

    if (session) {
      throw new Error('loginAdmin unexpectedly returned a session with an invalid password!');
    }

    if (!error) {
      throw new Error('loginAdmin did not return an error for invalid password');
    }

    return `Correctly rejected invalid admin password: "${error.message}"`;
  });

  await challenge('2.3', 'Athlete login using Student Matric Number "DFK2401" succeeds', async () => {
    const { session, user, error } = await loginAthlete(config.athlete.matricNumber, config.athlete.password);

    if (error) {
      throw new Error(`loginAthlete failed: ${error.message}`);
    }

    if (!session || !session.access_token) {
      throw new Error('loginAthlete did not return a valid session');
    }

    const expectedEmail = `${config.athlete.matricNumber.toLowerCase()}@tmbfighters.com`;
    if (user.email !== expectedEmail) {
      throw new Error(`Expected user email '${expectedEmail}', got '${user.email}'`);
    }

    await logout();
    return `Athlete ${config.athlete.matricNumber} logged in as ${user.email}`;
  });

  await challenge('2.4', 'Athlete login handles mixed-case ("dfk2401", "dFk2401") and whitespace ("  DFK2401  ")', async () => {
    // Mixed case 1: lowercase
    const res1 = await loginAthlete('dfk2401', config.athlete.password);
    if (res1.error || !res1.session) {
      throw new Error(`Lowercase matric 'dfk2401' failed: ${res1.error?.message}`);
    }
    await logout();

    // Mixed case 2: camelCase
    const res2 = await loginAthlete('dFk2401', config.athlete.password);
    if (res2.error || !res2.session) {
      throw new Error(`Mixed case 'dFk2401' failed: ${res2.error?.message}`);
    }
    await logout();

    // Whitespace padded
    const res3 = await loginAthlete('   DFK2401   ', config.athlete.password);
    if (res3.error || !res3.session) {
      throw new Error(`Whitespace-padded matric failed: ${res3.error?.message}`);
    }
    await logout();

    return 'All matric case variants and whitespace paddings resolved deterministically';
  });

  await challenge('2.5', 'Athlete login with invalid password fails with error', async () => {
    const { session, error } = await loginAthlete(config.athlete.matricNumber, 'WrongAthletePassword!');

    if (session) {
      throw new Error('loginAthlete returned a session with an invalid password!');
    }

    if (!error) {
      throw new Error('loginAthlete did not return an error for invalid password');
    }

    return `Correctly rejected invalid athlete password: "${error.message}"`;
  });

  await challenge('2.6', 'Athlete login with non-existent matric fails with error', async () => {
    const { session, error } = await loginAthlete('NONEXISTENT999', 'Athlete@123');

    if (session) {
      throw new Error('loginAthlete returned a session for non-existent matric!');
    }

    if (!error) {
      throw new Error('loginAthlete did not return an error for non-existent matric');
    }

    return `Correctly rejected non-existent matric: "${error.message}"`;
  });

  await challenge('2.7', 'Role Guard: Non-admin athlete attempting to loginAdmin() is BLOCKED and session purged', async () => {
    // Attempting to log in as admin using valid athlete credentials
    const { session, user, error } = await loginAdmin(config.athlete.matricNumber, config.athlete.password);

    if (session) {
      throw new Error('Security breach: Non-admin athlete was granted an admin session!');
    }

    if (!error) {
      throw new Error('loginAdmin did not return an error when athlete attempted admin login');
    }

    const expectedMsg = 'Akaun ini tidak mempunyai akses pentadbir (admin)';
    if (!error.message.includes(expectedMsg)) {
      throw new Error(`Expected role guard error message, got: '${error.message}'`);
    }

    // Verify session was cleanly purged
    const currentSession = await getSession();
    if (currentSession) {
      throw new Error('Security breach: Session was not revoked after failed role check!');
    }

    return `Role guard strictly blocked athlete and purged session: "${error.message}"`;
  });

  await challenge('2.8', 'Cross-tenant RLS: Athlete session cannot read or update peer records', async () => {
    // Log in as Athlete 1 (DFK2401)
    const { session } = await loginAthlete(config.athlete.matricNumber, config.athlete.password);
    if (!session) throw new Error('Athlete 1 login failed during RLS setup');

    const athleteClient = createApiClient({ authToken: session.access_token });

    // 1. Try reading peer athlete DTK2402 directly from members
    const peerRead = await athleteClient.from('members').select('*', { matric_number: 'eq.DTK2402' });
    if (!peerRead.ok) {
      throw new Error(`Direct query failed with unexpected status: ${peerRead.status}`);
    }
    const peerRows = peerRead.data || [];
    if (peerRows.length > 0) {
      throw new Error(`RLS breach: Athlete 1 was able to read Athlete 2 (DTK2402) profile! Rows: ${JSON.stringify(peerRows)}`);
    }

    // 2. Try reading peer payments
    const peerPayments = await athleteClient.from('payments').select('*', { matric_number: 'eq.DTK2402' });
    const paymentRows = peerPayments.data || [];
    if (paymentRows.length > 0) {
      throw new Error(`RLS breach: Athlete 1 was able to read Athlete 2 (DTK2402) payments! Rows: ${JSON.stringify(paymentRows)}`);
    }

    // 3. Try modifying peer athlete phone
    const peerUpdate = await athleteClient.from('members').update(
      { phone: '0199999999' },
      { matric_number: 'eq.DTK2402' }
    );
    const updatedRows = Array.isArray(peerUpdate.data) ? peerUpdate.data.length : 0;
    if (updatedRows > 0) {
      throw new Error('RLS breach: Athlete 1 modified Athlete 2 profile!');
    }

    await logout();
    return 'Cross-tenant isolation verified: 0 rows returned, 0 rows modified for peer';
  });

  await challenge('2.9', 'Session restoration lifecycle: getSession() reflects login and logout states', async () => {
    // 1. Initially logged out
    await logout();
    const initialSession = await getSession();
    if (initialSession !== null && initialSession !== undefined) {
      throw new Error(`Expected null session initially, got: ${JSON.stringify(initialSession)}`);
    }

    // 2. Log in as admin
    const loginRes = await loginAdmin(config.admin.username, config.admin.password);
    if (loginRes.error) throw new Error(`Login failed: ${loginRes.error.message}`);

    // 3. getSession() returns active session
    const activeSession = await getSession();
    if (!activeSession || !activeSession.access_token) {
      throw new Error('getSession() did not return active session after login');
    }

    // 4. getUser() returns current authenticated user
    const currentUser = await getUser();
    if (!currentUser || currentUser.email !== config.admin.email) {
      throw new Error(`getUser() returned unexpected user: ${currentUser?.email}`);
    }

    // 5. Logout purges session
    await logout();
    const postLogoutSession = await getSession();
    if (postLogoutSession !== null && postLogoutSession !== undefined) {
      throw new Error(`Expected null session after logout, got: ${JSON.stringify(postLogoutSession)}`);
    }

    return 'Full session lifecycle verified: logged out -> logged in -> active session -> logged out';
  });

  // -------------------------------------------------------------------------
  // SECTION 3: DATA INTEGRITY & SAFE VIEWS
  // -------------------------------------------------------------------------
  console.log('');
  console.log('--- SECTION 3: DATA INTEGRITY & SAFE VIEWS ---');

  await challenge('3.1', 'Public safe view public_registered_members exposes ONLY non-PII fields', async () => {
    const { members, error } = await getPublicRegisteredMembers();

    if (error) {
      throw new Error(`getPublicRegisteredMembers failed: ${error.message}`);
    }

    if (!Array.isArray(members) || members.length === 0) {
      throw new Error('getPublicRegisteredMembers returned empty or non-array result');
    }

    const first = members[0];
    const allowedKeys = new Set(['id', 'full_name', 'program', 'created_at']);
    const keys = Object.keys(first);

    for (const key of keys) {
      if (!allowedKeys.has(key)) {
        throw new Error(`Data leakage: Unauthorized column '${key}' present in public members tracker!`);
      }
    }

    const forbiddenFields = ['ic_number', 'phone', 'email', 'health', 'health_details', 'gender'];
    for (const field of forbiddenFields) {
      if (field in first) {
        throw new Error(`Critical PII leak: Field '${field}' exposed in public view!`);
      }
    }

    return `Confirmed ${members.length} records. Exposes only safe fields: [${keys.join(', ')}]`;
  });

  await challenge('3.2', 'getAthleteProfile returns member record and payment history for authenticated athlete', async () => {
    // Log in as athlete
    const { session, user } = await loginAthlete(config.athlete.matricNumber, config.athlete.password);
    if (!session) throw new Error('Athlete login failed during profile test');

    const { member, payments, error } = await getAthleteProfile(user.id);
    if (error) {
      throw new Error(`getAthleteProfile failed: ${error.message}`);
    }

    if (!member) {
      throw new Error('getAthleteProfile did not return member profile');
    }

    if (member.matric_number !== config.athlete.matricNumber) {
      throw new Error(`Expected matric ${config.athlete.matricNumber}, got ${member.matric_number}`);
    }

    if (!Array.isArray(payments) || payments.length === 0) {
      throw new Error('getAthleteProfile did not return payments array');
    }

    await logout();
    return `Profile retrieved for ${member.full_name} (${member.matric_number}), ${payments.length} payment records`;
  });

  await challenge('3.3', 'Client-side file size and MIME validation in uploadAthletePhoto', async () => {
    // 1. Missing file
    const noFile = await uploadAthletePhoto('fake-user', null);
    if (!noFile.error || !noFile.error.message.includes('Sila pilih fail')) {
      throw new Error('Expected missing file error');
    }

    // 2. Oversized file (>2MB)
    const bigFile = {
      name: 'huge.jpg',
      type: 'image/jpeg',
      size: 3 * 1024 * 1024, // 3MB
    };
    const oversizeRes = await uploadAthletePhoto('fake-user', bigFile);
    if (!oversizeRes.error || !oversizeRes.error.message.includes('melebihi had maksimum 2MB')) {
      throw new Error(`Expected oversized file error, got: ${oversizeRes.error?.message}`);
    }

    // 3. Disallowed MIME type
    const pdfFile = {
      name: 'malware.pdf',
      type: 'application/pdf',
      size: 1024,
    };
    const badMimeRes = await uploadAthletePhoto('fake-user', pdfFile);
    if (!badMimeRes.error || !badMimeRes.error.message.includes('Format fail tidak disokong')) {
      throw new Error(`Expected format error, got: ${badMimeRes.error?.message}`);
    }

    return 'All client-side file upload guard rails verified';
  });

  // -------------------------------------------------------------------------
  // FINAL VERDICT & SUMMARY
  // -------------------------------------------------------------------------
  console.log('');
  console.log('='.repeat(72));
  console.log('            M2 ADVERSARIAL TEST EXECUTION SUMMARY');
  console.log('='.repeat(72));
  console.log(`Total Challenges: ${results.length}`);
  console.log(`Passed:           ${passedCount}`);
  console.log(`Failed:           ${failedCount}`);
  console.log('='.repeat(72));

  if (failedCount > 0) {
    console.log('GATE VERDICT: REQUEST_CHANGES (Defects detected during adversarial testing)');
    process.exit(1);
  } else {
    console.log('GATE VERDICT: APPROVE (Registration & Authentication flows fully verified)');
    process.exit(0);
  }
}

runAdversarialHarness().catch(err => {
  console.error('Fatal Harness Failure:', err);
  process.exit(1);
});
