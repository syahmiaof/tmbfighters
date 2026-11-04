/**
 * Empirical Challenger M1-2: Stress & Adversarial Test Harness
 * Target: Supabase Storage & Supabase Authentication Security
 */

import { config } from './config.js';
import { createApiClient } from './helpers/client.js';

function decodeJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return { header, payload };
  } catch (e) {
    return null;
  }
}

// 1x1 transparent PNG buffer
const VALID_1X1_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// 1x1 JPEG buffer
const VALID_1X1_JPG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64'
);

async function runAdversarialSuite() {
  const report = {
    total: 0,
    passed: 0,
    failed: 0,
    results: []
  };

  async function assertCase(category, name, testFn) {
    report.total++;
    const start = Date.now();
    try {
      const details = await testFn();
      report.passed++;
      report.results.push({
        category,
        name,
        status: 'PASS',
        durationMs: Date.now() - start,
        details: details || 'OK'
      });
      console.log(`  [PASS] ${name} (${Date.now() - start}ms)`);
    } catch (err) {
      report.failed++;
      report.results.push({
        category,
        name,
        status: 'FAIL',
        durationMs: Date.now() - start,
        error: err.message,
        stack: err.stack
      });
      console.error(`  [FAIL] ${name} (${Date.now() - start}ms): ${err.message}`);
    }
  }

  console.log('======================================================================');
  console.log('     TMB FIGHTERS — CHALLENGER M1-2 EMPIRICAL TEST SUITE');
  console.log('     Target: Supabase Storage & Authentication Security');
  console.log('======================================================================\n');

  const client = createApiClient();

  // -------------------------------------------------------------------------
  // CATEGORY 1: Storage Non-Image MIME Rejection
  // -------------------------------------------------------------------------
  console.log('--- Category 1: Storage MIME & Payload Rejection ---');

  await assertCase('Storage MIME', '1.1 Unauthenticated upload of text/plain is rejected', async () => {
    const anonClient = createApiClient();
    const res = await anonClient.storage.from('avatars').upload(
      'unauth/test.txt',
      Buffer.from('Hello world'),
      { contentType: 'text/plain' }
    );
    if (res.ok) throw new Error('Unauthenticated text/plain upload should be rejected');
    return `Rejected as expected: status=${res.status}, error=${JSON.stringify(res.error)}`;
  });

  await assertCase('Storage MIME', '1.2 Unauthenticated upload of application/pdf is rejected', async () => {
    const anonClient = createApiClient();
    const res = await anonClient.storage.from('avatars').upload(
      'unauth/test.pdf',
      Buffer.from('%PDF-1.4 test content'),
      { contentType: 'application/pdf' }
    );
    if (res.ok) throw new Error('Unauthenticated application/pdf upload should be rejected');
    return `Rejected as expected: status=${res.status}, error=${JSON.stringify(res.error)}`;
  });

  // Login as athlete to test authenticated uploads
  const athleteLogin = await client.auth.signInWithPassword({
    email: config.athlete.email,
    password: config.athlete.password
  });
  if (!athleteLogin.ok) {
    throw new Error(`Failed to sign in test athlete: ${JSON.stringify(athleteLogin.error)}`);
  }
  const athleteClient = createApiClient({ authToken: athleteLogin.accessToken });
  const athleteUserId = athleteLogin.user.id;
  const athleteMatric = athleteLogin.user.user_metadata?.matric_number || 'DFK2401';

  await assertCase('Storage MIME', '1.3 Authenticated athlete upload of text/plain is rejected by bucket MIME whitelist', async () => {
    const res = await athleteClient.storage.from('avatars').upload(
      `${athleteMatric}/exploit.txt`,
      Buffer.from('This is a plain text file pretending to be avatar'),
      { contentType: 'text/plain' }
    );
    if (res.ok) {
      await athleteClient.storage.from('avatars').upload(`${athleteMatric}/exploit.txt`, Buffer.from(''), {});
      throw new Error('Supabase Storage accepted text/plain file into avatars bucket!');
    }
    return `Rejected: status=${res.status}, message=${res.error?.message || res.error?.error || JSON.stringify(res.error)}`;
  });

  await assertCase('Storage MIME', '1.4 Authenticated athlete upload of application/pdf is rejected by bucket MIME whitelist', async () => {
    const res = await athleteClient.storage.from('avatars').upload(
      `${athleteMatric}/exploit.pdf`,
      Buffer.from('%PDF-1.4 dummy payload'),
      { contentType: 'application/pdf' }
    );
    if (res.ok) throw new Error('Supabase Storage accepted application/pdf file into avatars bucket!');
    return `Rejected: status=${res.status}, message=${res.error?.message || JSON.stringify(res.error)}`;
  });

  await assertCase('Storage MIME', '1.5 Authenticated athlete upload of application/x-msdownload (exe) is rejected', async () => {
    const res = await athleteClient.storage.from('avatars').upload(
      `${athleteMatric}/trojan.exe`,
      Buffer.from('MZ\x90\x00\x03\x00\x00\x00'),
      { contentType: 'application/x-msdownload' }
    );
    if (res.ok) throw new Error('Supabase Storage accepted application/x-msdownload into avatars bucket!');
    return `Rejected: status=${res.status}, message=${res.error?.message || JSON.stringify(res.error)}`;
  });

  await assertCase('Storage MIME', '1.6 Authenticated athlete upload of image/svg+xml (XSS vector) is rejected', async () => {
    const res = await athleteClient.storage.from('avatars').upload(
      `${athleteMatric}/xss.svg`,
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
      { contentType: 'image/svg+xml' }
    );
    if (res.ok) throw new Error('Supabase Storage accepted image/svg+xml into avatars bucket!');
    return `Rejected: status=${res.status}, message=${res.error?.message || JSON.stringify(res.error)}`;
  });

  await assertCase('Storage MIME', '1.7 Authenticated athlete upload of file with .png extension but Content-Type text/plain is rejected', async () => {
    const res = await athleteClient.storage.from('avatars').upload(
      `${athleteMatric}/fake.png`,
      Buffer.from('Plain text disguised as png'),
      { contentType: 'text/plain' }
    );
    if (res.ok) throw new Error('Supabase Storage accepted file with disguised Content-Type text/plain!');
    return `Rejected: status=${res.status}, message=${res.error?.message || JSON.stringify(res.error)}`;
  });

  await assertCase('Storage MIME', '1.8 Oversized upload (>5MB limit) is rejected', async () => {
    // 5.1 MB dummy buffer (just above 5,242,880 bytes limit)
    const oversized = Buffer.alloc(5242880 + 1024, 0x41);
    const res = await athleteClient.storage.from('avatars').upload(
      `${athleteMatric}/oversized.png`,
      oversized,
      { contentType: 'image/png' }
    );
    if (res.ok) throw new Error('Supabase Storage accepted 5.1MB file exceeding 5MB file_size_limit!');
    return `Rejected: status=${res.status}, message=${res.error?.message || JSON.stringify(res.error)}`;
  });

  // -------------------------------------------------------------------------
  // CATEGORY 2: Storage Public CDN URL Reachability & Valid Image Serving
  // -------------------------------------------------------------------------
  console.log('\n--- Category 2: Storage Public CDN Reachability ---');

  const testImagePath = `${athleteMatric}/challenger-avatar.png`;

  await assertCase('Storage CDN', '2.1 Upload valid PNG image to athlete folder', async () => {
    const res = await athleteClient.storage.from('avatars').upload(
      testImagePath,
      VALID_1X1_PNG,
      { contentType: 'image/png', upsert: true }
    );
    if (!res.ok) throw new Error(`Upload failed: ${JSON.stringify(res.error)}`);
    return `Upload succeeded: key=${res.data?.Key || testImagePath}`;
  });

  await assertCase('Storage CDN', '2.2 Verify public CDN URL is reachable without authentication (raw fetch)', async () => {
    const publicUrl = athleteClient.storage.from('avatars').getPublicUrl(testImagePath);
    // Perform raw unauthenticated fetch
    const res = await fetch(publicUrl);
    if (res.status !== 200) {
      throw new Error(`Public CDN URL returned HTTP status ${res.status} (expected 200) for URL: ${publicUrl}`);
    }
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/png')) {
      throw new Error(`Unexpected Content-Type: ${contentType} (expected image/png)`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length !== VALID_1X1_PNG.length) {
      throw new Error(`Returned byte length ${buffer.length} does not match uploaded ${VALID_1X1_PNG.length}`);
    }
    return `Reachable: status=${res.status}, contentType=${contentType}, bytes=${buffer.length}, url=${publicUrl}`;
  });

  await assertCase('Storage CDN', '2.3 Upload valid JPEG image to athlete UUID folder and verify CDN reachability', async () => {
    const uuidPath = `${athleteUserId}/challenger-avatar.jpg`;
    const res = await athleteClient.storage.from('avatars').upload(
      uuidPath,
      VALID_1X1_JPG,
      { contentType: 'image/jpeg', upsert: true }
    );
    if (!res.ok) throw new Error(`Upload failed: ${JSON.stringify(res.error)}`);

    const publicUrl = athleteClient.storage.from('avatars').getPublicUrl(uuidPath);
    const cdnRes = await fetch(publicUrl);
    if (cdnRes.status !== 200) {
      throw new Error(`Public CDN URL returned HTTP status ${cdnRes.status} for UUID path: ${publicUrl}`);
    }
    const contentType = cdnRes.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/jpeg')) {
      throw new Error(`Unexpected Content-Type: ${contentType} (expected image/jpeg)`);
    }
    return `Reachable: status=${cdnRes.status}, contentType=${contentType}, url=${publicUrl}`;
  });

  // -------------------------------------------------------------------------
  // CATEGORY 3: Storage Tenant Isolation & Boundary Security
  // -------------------------------------------------------------------------
  console.log('\n--- Category 3: Storage Tenant Isolation ---');

  await assertCase('Storage Isolation', '3.1 Athlete A cannot upload into Athlete B matric folder', async () => {
    const res = await athleteClient.storage.from('avatars').upload(
      `DTK2402/tampered.png`,
      VALID_1X1_PNG,
      { contentType: 'image/png' }
    );
    if (res.ok) throw new Error('Cross-tenant write allowed! Athlete A was able to upload to DTK2402 folder!');
    return `Blocked by RLS as expected: status=${res.status}, error=${JSON.stringify(res.error)}`;
  });

  await assertCase('Storage Isolation', '3.2 Athlete A cannot upload into Athlete B UUID folder', async () => {
    const res = await athleteClient.storage.from('avatars').upload(
      `a0000000-0000-4000-8000-000000000005/tampered.png`,
      VALID_1X1_PNG,
      { contentType: 'image/png' }
    );
    if (res.ok) throw new Error('Cross-tenant write allowed! Athlete A was able to upload to athlete B UUID folder!');
    return `Blocked by RLS as expected: status=${res.status}, error=${JSON.stringify(res.error)}`;
  });

  await assertCase('Storage Isolation', '3.3 Athlete cannot upload directly to root of bucket', async () => {
    const res = await athleteClient.storage.from('avatars').upload(
      `root-tampered.png`,
      VALID_1X1_PNG,
      { contentType: 'image/png' }
    );
    if (res.ok) throw new Error('Athlete was able to upload directly to root without folder prefix!');
    return `Blocked by RLS as expected: status=${res.status}, error=${JSON.stringify(res.error)}`;
  });

  await assertCase('Storage Isolation', '3.4 Unauthenticated user cannot upload valid PNG image', async () => {
    const anonClient = createApiClient();
    const res = await anonClient.storage.from('avatars').upload(
      `${athleteMatric}/anon.png`,
      VALID_1X1_PNG,
      { contentType: 'image/png' }
    );
    if (res.ok) throw new Error('Unauthenticated user was able to upload PNG image!');
    return `Blocked by RLS as expected: status=${res.status}, error=${JSON.stringify(res.error)}`;
  });

  // -------------------------------------------------------------------------
  // CATEGORY 4: Authentication Security & Invalid Password Rejection
  // -------------------------------------------------------------------------
  console.log('\n--- Category 4: Authentication Security & Wrong Password Rejection ---');

  await assertCase('Auth Security', '4.1 Admin login with invalid password fails with HTTP 400', async () => {
    const res = await client.auth.signInWithPassword({
      email: config.admin.email,
      password: 'DefinitiveWrongPassword!2026'
    });
    if (res.ok) throw new Error('Admin login succeeded with incorrect password!');
    if (res.status !== 400) throw new Error(`Expected HTTP 400, received ${res.status}`);
    const errorMsg = res.error?.error_description || res.error?.msg || res.error?.message;
    return `Rejected: status=${res.status}, code=${res.error?.error_code || 'invalid_credentials'}, msg="${errorMsg}"`;
  });

  await assertCase('Auth Security', '4.2 Athlete login with invalid password fails with HTTP 400', async () => {
    const res = await client.auth.signInWithPassword({
      email: config.athlete.email,
      password: 'DefinitiveWrongAthletePass!'
    });
    if (res.ok) throw new Error('Athlete login succeeded with incorrect password!');
    if (res.status !== 400) throw new Error(`Expected HTTP 400, received ${res.status}`);
    return `Rejected: status=${res.status}, msg="${res.error?.error_description || res.error?.message}"`;
  });

  await assertCase('Auth Security', '4.3 Non-existent user login fails with HTTP 400', async () => {
    const res = await client.auth.signInWithPassword({
      email: 'nonexistent-user-999@tmbfighters.com',
      password: 'SomeRandomPassword123!'
    });
    if (res.ok) throw new Error('Non-existent user login succeeded!');
    if (res.status !== 400) throw new Error(`Expected HTTP 400, received ${res.status}`);
    return `Rejected: status=${res.status}, msg="${res.error?.error_description || res.error?.message}"`;
  });

  await assertCase('Auth Security', '4.4 Empty password login fails with HTTP 400', async () => {
    const res = await client.auth.signInWithPassword({
      email: config.admin.email,
      password: ''
    });
    if (res.ok) throw new Error('Empty password login succeeded!');
    if (res.status !== 400) throw new Error(`Expected HTTP 400, received ${res.status}`);
    return `Rejected: status=${res.status}`;
  });

  await assertCase('Auth Security', '4.5 SQL injection payload in email is safely rejected', async () => {
    const res = await client.auth.signInWithPassword({
      email: "' OR '1'='1' --",
      password: 'password123'
    });
    if (res.ok) throw new Error('SQL injection in login succeeded!');
    return `Rejected safely: status=${res.status}`;
  });

  // -------------------------------------------------------------------------
  // CATEGORY 5: Admin JWT Role Claims & Authorization
  // -------------------------------------------------------------------------
  console.log('\n--- Category 5: Admin JWT Role Claims & Permissions ---');

  let adminAccessToken = null;

  await assertCase('Admin Auth', '5.1 Admin login returns valid access token and refresh token', async () => {
    const res = await client.auth.signInWithPassword({
      email: config.admin.email,
      password: config.admin.password
    });
    if (!res.ok) throw new Error(`Admin login failed: ${JSON.stringify(res.error)}`);
    if (!res.accessToken) throw new Error('No access_token returned in admin login response');
    adminAccessToken = res.accessToken;
    return `Logged in successfully: user_id=${res.user.id}, email=${res.user.email}`;
  });

  await assertCase('Admin Auth', '5.2 Decode and verify admin JWT claims structure and role claim', async () => {
    const decoded = decodeJwt(adminAccessToken);
    if (!decoded) throw new Error('Failed to parse JWT token parts');
    const { header, payload } = decoded;

    // Supabase can use ES256 (asymmetric) or HS256 (symmetric)
    if (!['ES256', 'HS256'].includes(header.alg)) {
      throw new Error(`Expected alg ES256 or HS256, got ${header.alg}`);
    }
    if (!payload.iss.includes('supabase')) throw new Error(`Expected iss to contain 'supabase', got ${payload.iss}`);
    if (payload.aud !== 'authenticated') throw new Error(`Expected aud 'authenticated', got ${payload.aud}`);
    if (payload.email !== config.admin.email) throw new Error(`Expected email ${config.admin.email}, got ${payload.email}`);

    // Check admin role claim in app_metadata
    const appRole = payload.app_metadata?.role;
    if (appRole !== 'admin') {
      throw new Error(`Admin JWT app_metadata.role is '${appRole}', expected 'admin'`);
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp <= nowSec) throw new Error('JWT token is already expired');
    if (payload.exp - payload.iat <= 0) throw new Error('JWT lifespan is invalid');

    return `Verified: alg='${header.alg}', app_metadata.role='${appRole}', exp in ${payload.exp - nowSec}s, sub=${payload.sub}`;
  });

  await assertCase('Admin Auth', '5.3 Call /auth/v1/user with admin access token', async () => {
    const userRes = await client.auth.getUser(adminAccessToken);
    if (!userRes.ok) throw new Error(`Failed to fetch user with token: ${JSON.stringify(userRes.error)}`);
    const user = userRes.user;
    if (user.app_metadata?.role !== 'admin') {
      throw new Error(`User object app_metadata.role is '${user.app_metadata?.role}', expected 'admin'`);
    }
    return `User fetched: id=${user.id}, email=${user.email}, role=${user.app_metadata?.role}`;
  });

  await assertCase('Admin Auth', '5.4 Admin token grants full read access on members table', async () => {
    const adminClient = createApiClient({ authToken: adminAccessToken });
    const res = await adminClient.from('members').select('id,member_id,matric_number,ic_number,phone,email');
    if (!res.ok) throw new Error(`Admin query on members failed: ${JSON.stringify(res.error)}`);
    if (!Array.isArray(res.data) || res.data.length < 30) {
      throw new Error(`Expected at least 30 members for admin, got ${res.data?.length}`);
    }
    // Verify admin can see sensitive fields
    const first = res.data[0];
    if (!first.ic_number || !first.phone) {
      throw new Error('Admin was unable to read private sensitive fields (ic_number/phone)');
    }
    return `Admin read verified: total=${res.data.length} records, sample IC=${first.ic_number}, sample phone=${first.phone}`;
  });

  await assertCase('Admin Auth', '5.5 Admin token grants full read access on payments table', async () => {
    const adminClient = createApiClient({ authToken: adminAccessToken });
    const res = await adminClient.from('payments').select('id,period,amount,status,matric_number');
    if (!res.ok) throw new Error(`Admin query on payments failed: ${JSON.stringify(res.error)}`);
    if (!Array.isArray(res.data) || res.data.length < 90) {
      throw new Error(`Expected at least 90 payments for admin, got ${res.data?.length}`);
    }
    return `Admin payments verified: total=${res.data.length} records, all 3 months represented`;
  });

  // -------------------------------------------------------------------------
  // CATEGORY 6: Athlete Authentication & Session Verification
  // -------------------------------------------------------------------------
  console.log('\n--- Category 6: Athlete Login Session Verification ---');

  let athleteToken = null;

  await assertCase('Athlete Auth', '6.1 Athlete login with matric DFK2401 (dfk2401@tmbfighters.com)', async () => {
    const res = await client.auth.signInWithPassword({
      email: 'dfk2401@tmbfighters.com',
      password: 'Athlete@123'
    });
    if (!res.ok) throw new Error(`Athlete login failed: ${JSON.stringify(res.error)}`);
    athleteToken = res.accessToken;
    const decoded = decodeJwt(athleteToken);
    const userMatric = decoded?.payload?.user_metadata?.matric_number;
    if (userMatric !== 'DFK2401') {
      throw new Error(`Expected user_metadata.matric_number 'DFK2401', got '${userMatric}'`);
    }
    return `Logged in: user_id=${res.user.id}, matric=${userMatric}, email=${res.user.email}`;
  });

  await assertCase('Athlete Auth', '6.2 Athlete DFK2401 can query own profile and personal data', async () => {
    const athClient = createApiClient({ authToken: athleteToken });
    const decoded = decodeJwt(athleteToken);
    const uid = decoded.payload.sub;
    const res = await athClient.from('members').select('*', { user_id: `eq.${uid}` });
    if (!res.ok) throw new Error(`Query failed: ${JSON.stringify(res.error)}`);
    if (!Array.isArray(res.data) || res.data.length !== 1) {
      throw new Error(`Expected exactly 1 profile for athlete, got ${res.data?.length}`);
    }
    const profile = res.data[0];
    if (profile.matric_number !== 'DFK2401') {
      throw new Error(`Expected matric DFK2401, got ${profile.matric_number}`);
    }
    if (!profile.ic_number) {
      throw new Error('Athlete cannot view their own IC number');
    }
    return `Profile retrieved: name="${profile.full_name}", matric=${profile.matric_number}, ic=${profile.ic_number}`;
  });

  await assertCase('Athlete Auth', '6.3 Athlete DFK2401 can query own payment records under RLS', async () => {
    const athClient = createApiClient({ authToken: athleteToken });
    // Under payments_athlete_select policy, querying payments automatically filters by members.user_id = auth.uid()
    const res = await athClient.from('payments').select('id,period,amount,status,matric_number');
    if (!res.ok) throw new Error(`Query failed: ${JSON.stringify(res.error)}`);
    if (!Array.isArray(res.data) || res.data.length === 0) {
      throw new Error('No payment records returned for athlete DFK2401');
    }
    // Verify all returned records belong to DFK2401
    for (const record of res.data) {
      if (record.matric_number !== 'DFK2401') {
        throw new Error(`Payment record with matric ${record.matric_number} leaked to DFK2401!`);
      }
    }
    return `Payments retrieved: count=${res.data.length}, periods=${res.data.map(p => p.period).join(', ')}`;
  });

  await assertCase('Athlete Auth', '6.4 Athlete DFK2401 CANNOT read other athletes records from members table', async () => {
    const athClient = createApiClient({ authToken: athleteToken });
    const res = await athClient.from('members').select('*', { matric_number: 'eq.DTK2402' });
    if (res.ok && Array.isArray(res.data)) {
      if (res.data.length > 0) {
        throw new Error(`Athlete DFK2401 was able to read DTK2402 private record! Rows: ${res.data.length}`);
      }
    }
    return `RLS strictly isolates athlete profiles: 0 rows returned for other athlete's record`;
  });

  await assertCase('Athlete Auth', '6.5 Athlete DFK2401 CANNOT read other athletes payment records', async () => {
    const athClient = createApiClient({ authToken: athleteToken });
    const res = await athClient.from('payments').select('*', { matric_number: 'eq.DTK2402' });
    if (res.ok && Array.isArray(res.data)) {
      if (res.data.length > 0) {
        throw new Error(`Athlete DFK2401 was able to read DTK2402 payment records! Rows: ${res.data.length}`);
      }
    }
    return `RLS strictly isolates payments: 0 rows returned for other athlete query`;
  });

  await assertCase('Athlete Auth', '6.6 Athlete login with matric DFK24F1001 (dfk24f1001@tmbfighters.com)', async () => {
    const res = await client.auth.signInWithPassword({
      email: 'dfk24f1001@tmbfighters.com',
      password: 'Athlete@123'
    });
    if (!res.ok) throw new Error(`Athlete login failed: ${JSON.stringify(res.error)}`);
    const decoded = decodeJwt(res.accessToken);
    const userMatric = decoded?.payload?.user_metadata?.matric_number;
    if (userMatric !== 'DFK24F1001') {
      throw new Error(`Expected user_metadata.matric_number 'DFK24F1001', got '${userMatric}'`);
    }
    return `Logged in: user_id=${res.user.id}, matric=${userMatric}, email=${res.user.email}`;
  });

  await assertCase('Athlete Auth', '6.7 Athlete login with legacy 3-digit ID 001 (001@tmbfighters.com)', async () => {
    const res = await client.auth.signInWithPassword({
      email: '001@tmbfighters.com',
      password: 'Athlete@123'
    });
    if (!res.ok) throw new Error(`Legacy 001 login failed: ${JSON.stringify(res.error)}`);
    const decoded = decodeJwt(res.accessToken);
    return `Logged in: user_id=${res.user.id}, member_id=${decoded?.payload?.user_metadata?.member_id}`;
  });

  // Summary
  console.log('\n======================================================================');
  console.log('                    CHALLENGE EXECUTION SUMMARY');
  console.log('======================================================================');
  console.log(`Total Assertions: ${report.total}`);
  console.log(`Passed:           ${report.passed}`);
  console.log(`Failed:           ${report.failed}`);
  console.log('======================================================================\n');

  if (report.failed > 0) {
    process.exitCode = 1;
  }
  return report;
}

runAdversarialSuite().catch(err => {
  console.error('Fatal suite error:', err);
  process.exit(1);
});
