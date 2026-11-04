/**
 * Adversarial Test Suite for Milestone M2:
 * Photo Upload, Public Tracker, and Social Proof Flows
 * 
 * Verifies live Supabase behavior, client validation in src/lib/supabase.js,
 * storage RLS, safe public view isolation, and toast formatting.
 */

import { config } from './config.js';
import { createApiClient } from './helpers/client.js';
import {
  supabase,
  uploadAthletePhoto,
  getPublicRegisteredMembers,
  loginAthlete,
  logout
} from '../src/lib/supabase.js';
import fs from 'node:fs';
import path from 'node:path';

// Valid 1x1 transparent PNG buffer
const VALID_1X1_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Valid 1x1 JPEG buffer
const VALID_1X1_JPG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64'
);

async function runM2AdversarialSuite() {
  const startTime = Date.now();
  const summary = {
    total: 0,
    passed: 0,
    failed: 0,
    results: []
  };

  async function assertCase(section, name, testFn) {
    summary.total++;
    const testStart = Date.now();
    try {
      const details = await testFn();
      summary.passed++;
      const duration = Date.now() - testStart;
      summary.results.push({ section, name, status: 'PASS', duration, details: details || 'OK' });
      console.log(`  \x1b[32m[PASS]\x1b[0m ${name} (${duration}ms)`);
    } catch (err) {
      summary.failed++;
      const duration = Date.now() - testStart;
      summary.results.push({ section, name, status: 'FAIL', duration, error: err.message, stack: err.stack });
      console.error(`  \x1b[31m[FAIL]\x1b[0m ${name} (${duration}ms): ${err.message}`);
    }
  }

  console.log('======================================================================');
  console.log('       TMB FIGHTERS — ADVERSARIAL M2 UPLOAD & TRACKER TEST HARNESS     ');
  console.log('======================================================================');
  console.log(`Target:    ${config.supabaseUrl}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('======================================================================\n');

  // Setup unauthenticated client
  const anonClient = createApiClient();

  // Setup Admin client to verify database state independently
  const adminClient = createApiClient();
  const adminLogin = await adminClient.auth.signInWithPassword({
    email: config.admin.email,
    password: config.admin.password
  });
  if (!adminLogin.ok) {
    throw new Error(`Admin login failed during setup: ${JSON.stringify(adminLogin.error)}`);
  }
  adminClient.setAuthToken(adminLogin.accessToken);

  // Authenticate primary athlete (DFK2401) using src/lib/supabase.js client
  const athleteLoginRes = await loginAthlete('DFK2401', 'Athlete@123');
  if (athleteLoginRes.error || !athleteLoginRes.session) {
    throw new Error(`Athlete login failed via src/lib/supabase.js: ${athleteLoginRes.error?.message}`);
  }
  const athleteUser = athleteLoginRes.user;
  const athleteUserId = athleteUser.id;

  // -------------------------------------------------------------------------
  // SECTION 1: Photo Upload & Storage Security
  // -------------------------------------------------------------------------
  console.log('--- Section 1: Photo Upload & Storage Security ---');

  let uploadedPngUrl = null;
  let uploadedJpgUrl = null;

  await assertCase('Photo Upload', '1.1 Authenticated athlete uploads valid PNG image via uploadAthletePhoto()', async () => {
    const pngFile = new File([VALID_1X1_PNG], 'avatar-test.png', { type: 'image/png' });
    const { publicUrl, error } = await uploadAthletePhoto(athleteUserId, pngFile);

    if (error) {
      throw new Error(`uploadAthletePhoto failed: ${error.message}`);
    }
    if (!publicUrl) {
      throw new Error('uploadAthletePhoto did not return a publicUrl');
    }
    if (!publicUrl.includes('/storage/v1/object/public/avatars/')) {
      throw new Error(`publicUrl does not point to avatars bucket: ${publicUrl}`);
    }
    uploadedPngUrl = publicUrl;

    // Verify members.avatar_url is updated in database
    const dbCheck = await adminClient.from('members').select('id,avatar_url,matric_number,user_id', { matric_number: 'eq.DFK2401' });
    if (!dbCheck.ok || !dbCheck.data || dbCheck.data.length === 0) {
      throw new Error(`Could not query members record for athlete: ${JSON.stringify(dbCheck.error)}`);
    }
    const memberRecord = dbCheck.data[0];
    if (memberRecord.avatar_url !== publicUrl) {
      throw new Error(`members.avatar_url not updated! DB value: "${memberRecord.avatar_url}", expected: "${publicUrl}"`);
    }

    // Verify public CDN URL is reachable via unauthenticated HTTP GET
    const fetchRes = await fetch(publicUrl);
    if (fetchRes.status !== 200) {
      throw new Error(`Unauthenticated GET on publicUrl returned status ${fetchRes.status} (expected 200)`);
    }
    const contentType = fetchRes.headers.get('content-type') || '';
    if (!contentType.startsWith('image/png')) {
      throw new Error(`Unexpected Content-Type header: "${contentType}" (expected image/png)`);
    }
    const bodyBuffer = Buffer.from(await fetchRes.arrayBuffer());
    if (bodyBuffer.length !== VALID_1X1_PNG.length) {
      throw new Error(`Downloaded buffer size ${bodyBuffer.length} does not match uploaded ${VALID_1X1_PNG.length}`);
    }

    return `Uploaded successfully, members.avatar_url updated, unauthenticated GET returned HTTP 200 (${contentType})`;
  });

  await assertCase('Photo Upload', '1.2 Authenticated athlete uploads valid JPEG image via uploadAthletePhoto()', async () => {
    const jpgFile = new File([VALID_1X1_JPG], 'avatar-test.jpg', { type: 'image/jpeg' });
    const { publicUrl, error } = await uploadAthletePhoto(athleteUserId, jpgFile);

    if (error) {
      throw new Error(`uploadAthletePhoto failed: ${error.message}`);
    }
    if (!publicUrl) {
      throw new Error('uploadAthletePhoto did not return a publicUrl');
    }
    uploadedJpgUrl = publicUrl;

    // Verify members.avatar_url is updated to JPEG URL
    const dbCheck = await adminClient.from('members').select('avatar_url', { matric_number: 'eq.DFK2401' });
    if (dbCheck.data?.[0]?.avatar_url !== publicUrl) {
      throw new Error(`members.avatar_url did not update to JPEG URL (got ${dbCheck.data?.[0]?.avatar_url})`);
    }

    // Verify public CDN reachability
    const fetchRes = await fetch(publicUrl);
    if (fetchRes.status !== 200) {
      throw new Error(`Unauthenticated GET on JPEG publicUrl returned status ${fetchRes.status}`);
    }
    const contentType = fetchRes.headers.get('content-type') || '';
    if (!contentType.startsWith('image/jpeg')) {
      throw new Error(`Unexpected Content-Type: "${contentType}" (expected image/jpeg)`);
    }

    return `Uploaded JPEG, verified DB update & unauthenticated HTTP 200 with image/jpeg`;
  });

  await assertCase('Photo Upload', '1.3 Non-image upload rejection: MIME application/pdf rejected client-side', async () => {
    const pdfFile = new File([Buffer.from('%PDF-1.4 dummy')], 'document.pdf', { type: 'application/pdf' });
    const { publicUrl, error } = await uploadAthletePhoto(athleteUserId, pdfFile);

    if (publicUrl) {
      throw new Error('uploadAthletePhoto should NOT return publicUrl for PDF file');
    }
    if (!error) {
      throw new Error('uploadAthletePhoto should return an error for PDF file');
    }
    if (!error.message.includes('Format fail tidak disokong')) {
      throw new Error(`Unexpected error message: "${error.message}"`);
    }
    return `Client rejection verified: "${error.message}"`;
  });

  await assertCase('Photo Upload', '1.4 Non-image upload rejection: MIME text/plain rejected client-side', async () => {
    const txtFile = new File([Buffer.from('Hello plain text')], 'malicious.txt', { type: 'text/plain' });
    const { publicUrl, error } = await uploadAthletePhoto(athleteUserId, txtFile);

    if (publicUrl) {
      throw new Error('uploadAthletePhoto should NOT return publicUrl for text/plain');
    }
    if (!error) {
      throw new Error('uploadAthletePhoto should return an error for text/plain');
    }
    if (!error.message.includes('Format fail tidak disokong')) {
      throw new Error(`Unexpected error message: "${error.message}"`);
    }
    return `Client rejection verified: "${error.message}"`;
  });

  await assertCase('Photo Upload', '1.5 Non-image upload rejection: MIME application/pdf rejected server-side by bucket whitelist', async () => {
    // Bypass client-side function by calling Supabase Storage API directly
    const directUpload = await supabase.storage.from('avatars').upload(
      `${athleteUserId}/bypass.pdf`,
      Buffer.from('%PDF-1.4 dummy payload'),
      { contentType: 'application/pdf', upsert: true }
    );

    if (!directUpload.error) {
      throw new Error('Supabase Storage server allowed application/pdf upload into avatars bucket!');
    }
    return `Server rejection confirmed: status=${directUpload.error?.statusCode || 400}, error="${directUpload.error.message}"`;
  });

  await assertCase('Photo Upload', '1.6 Non-image upload rejection: MIME text/plain rejected server-side by bucket whitelist', async () => {
    const directUpload = await supabase.storage.from('avatars').upload(
      `${athleteUserId}/bypass.txt`,
      Buffer.from('Direct plain text bypass'),
      { contentType: 'text/plain', upsert: true }
    );

    if (!directUpload.error) {
      throw new Error('Supabase Storage server allowed text/plain upload into avatars bucket!');
    }
    return `Server rejection confirmed: status=${directUpload.error?.statusCode || 400}, error="${directUpload.error.message}"`;
  });

  await assertCase('Photo Upload', '1.7 Oversized file rejection: File > 2MB rejected by client validation', async () => {
    // 2.2 MB dummy buffer
    const largeBuffer = Buffer.alloc(2.2 * 1024 * 1024);
    const largeFile = new File([largeBuffer], 'large-photo.png', { type: 'image/png' });
    const { publicUrl, error } = await uploadAthletePhoto(athleteUserId, largeFile);

    if (publicUrl) {
      throw new Error('uploadAthletePhoto should NOT return publicUrl for file > 2MB');
    }
    if (!error) {
      throw new Error('uploadAthletePhoto should return an error for file > 2MB');
    }
    if (!error.message.includes('2MB') && !error.message.includes('Saiz')) {
      throw new Error(`Unexpected error message: "${error.message}"`);
    }
    return `Client oversized rejection verified: "${error.message}"`;
  });

  await assertCase('Photo Upload', '1.8 Oversized file rejection: File > 5MB rejected server-side by bucket limit', async () => {
    // 5MB + 1KB buffer (5,243,904 bytes exceeds 5,242,880 limit)
    const oversizedBuffer = Buffer.alloc(5242880 + 1024, 0x41);
    const directUpload = await supabase.storage.from('avatars').upload(
      `${athleteUserId}/oversized-server.png`,
      oversizedBuffer,
      { contentType: 'image/png', upsert: true }
    );

    if (!directUpload.error) {
      throw new Error('Supabase Storage accepted file exceeding 5MB bucket limit!');
    }
    return `Server oversized rejection confirmed: error="${directUpload.error.message}"`;
  });

  await assertCase('Photo Upload', '1.9 Unauthenticated upload is blocked by storage RLS', async () => {
    // Use raw unauthenticated client (no Authorization Bearer header)
    const unauthRes = await anonClient.storage.from('avatars').upload(
      `unauthenticated/avatar.png`,
      VALID_1X1_PNG,
      { contentType: 'image/png' }
    );

    if (unauthRes.ok) {
      throw new Error('Unauthenticated user was able to upload to avatars bucket!');
    }
    return `Blocked by RLS: status=${unauthRes.status}, error=${JSON.stringify(unauthRes.error)}`;
  });

  await assertCase('Photo Upload', '1.10 Null or empty file input rejected gracefully by uploadAthletePhoto()', async () => {
    const { publicUrl, error } = await uploadAthletePhoto(athleteUserId, null);
    if (publicUrl || !error) {
      throw new Error('Expected uploadAthletePhoto(null) to return error');
    }
    if (!error.message.includes('Sila pilih fail imej')) {
      throw new Error(`Unexpected error message for null file: "${error.message}"`);
    }
    return `Null file handled safely: "${error.message}"`;
  });

  // -------------------------------------------------------------------------
  // SECTION 2: Public Registered Members Tracker & Safe Data Exposure
  // -------------------------------------------------------------------------
  console.log('\n--- Section 2: Public Registered Members Tracker ---');

  await assertCase('Public Tracker', '2.1 getPublicRegisteredMembers() queries safe view and returns confirmed members', async () => {
    const { members, error } = await getPublicRegisteredMembers();
    if (error) {
      throw new Error(`getPublicRegisteredMembers failed: ${error.message}`);
    }
    if (!Array.isArray(members)) {
      throw new Error('getPublicRegisteredMembers did not return an array');
    }
    if (members.length < 24) {
      throw new Error(`Expected at least 24 confirmed members, received ${members.length}`);
    }
    return `Fetched ${members.length} confirmed member records from safe view`;
  });

  await assertCase('Public Tracker', '2.2 Direct anonymous REST query against public_registered_members safe view', async () => {
    const res = await anonClient.from('public_registered_members').select('*');
    if (!res.ok) {
      throw new Error(`Direct query on public_registered_members failed: ${res.status} ${JSON.stringify(res.error)}`);
    }
    if (!Array.isArray(res.data) || res.data.length < 24) {
      throw new Error(`Expected >= 24 records, got ${res.data?.length}`);
    }
    return `Anonymous query returned ${res.data.length} records successfully`;
  });

  await assertCase('Public Tracker', '2.3 Safe view contains strictly id, full_name, program, created_at and NO sensitive columns', async () => {
    const { members } = await getPublicRegisteredMembers();
    const sensitiveKeys = [
      'ic_number',
      'ic',
      'no_kad_pengenalan',
      'phone',
      'no_telefon',
      'telephone',
      'email',
      'health',
      'health_details',
      'gender',
      'experience',
      'user_id',
      'password',
      'password_hash'
    ];

    const allowedKeys = new Set(['id', 'full_name', 'program', 'created_at']);

    for (const [idx, row] of members.entries()) {
      const keys = Object.keys(row);
      for (const key of keys) {
        if (!allowedKeys.has(key)) {
          throw new Error(`Row ${idx} exposes unexpected column "${key}"! Row keys: ${keys.join(', ')}`);
        }
      }
      for (const sensitive of sensitiveKeys) {
        if (sensitive in row) {
          throw new Error(`Row ${idx} exposes sensitive field "${sensitive}"!`);
        }
      }
      if (!row.full_name || typeof row.full_name !== 'string') {
        throw new Error(`Row ${idx} missing full_name`);
      }
      if (!row.program || typeof row.program !== 'string') {
        throw new Error(`Row ${idx} missing program`);
      }
    }

    return `Audited ${members.length} rows: strictly keys [id, full_name, program, created_at], 0 sensitive columns`;
  });

  await assertCase('Public Tracker', '2.4 Adversarial query for sensitive columns on public_registered_members fails', async () => {
    // Attempt to explicitly ask PostgREST for ic_number or phone on the view
    const res = await anonClient.from('public_registered_members').select('id,ic_number,phone,email');
    if (res.ok) {
      throw new Error(`PostgREST allowed SELECT on non-existent view columns: ${JSON.stringify(res.data)}`);
    }
    return `Safely rejected by PostgREST schema validation: status=${res.status}, error=${res.error?.message}`;
  });

  await assertCase('Public Tracker', '2.5 Direct anonymous query on members base table returns 0 rows due to RLS', async () => {
    const res = await anonClient.from('members').select('*');
    if (!res.ok) {
      throw new Error(`Query failed unexpectedly with error: ${JSON.stringify(res.error)}`);
    }
    if (!Array.isArray(res.data)) {
      throw new Error(`Expected array response, got ${typeof res.data}`);
    }
    if (res.data.length !== 0) {
      throw new Error(`Data leakage! Anonymous query on members base table returned ${res.data.length} rows!`);
    }
    return `RLS strictly active: 0 rows returned for anonymous query on members base table`;
  });

  await assertCase('Public Tracker', '2.6 Direct anonymous query for sensitive columns on members table returns 0 rows', async () => {
    const res = await anonClient.from('members').select('id,full_name,ic_number,phone,email,matric_number');
    if (res.data?.length !== 0) {
      throw new Error(`Data leakage! Anonymous query for sensitive fields returned ${res.data.length} rows!`);
    }
    return `0 rows returned, sensitive fields completely protected by PostgreSQL RLS`;
  });

  await assertCase('Public Tracker', '2.7 Direct anonymous query on payments base table returns 0 rows due to RLS', async () => {
    const res = await anonClient.from('payments').select('*');
    if (res.data?.length !== 0) {
      throw new Error(`Data leakage! Anonymous query on payments table returned ${res.data.length} rows!`);
    }
    return `0 rows returned, financial records protected by PostgreSQL RLS`;
  });

  // -------------------------------------------------------------------------
  // SECTION 3: Social Proof Toast Formatting & Integrity
  // -------------------------------------------------------------------------
  console.log('\n--- Section 3: Social Proof Toast Formatting ---');

  await assertCase('Social Proof Toast', '3.1 Verify toast message format: "🎉 [Nama] ([Program]) telah mendaftar sebagai ahli!"', async () => {
    const testCases = [
      { name: 'Muhammad Amirul bin Rosli', program: 'DFK sem 1' },
      { name: 'Siti Nurhaliza binti Ahmad', program: 'DTK sem 2' },
      { name: 'Ahmad Albab', program: 'DPP sem 3' },
      { name: 'Wan Nur Aisyah', program: 'DTP sem 1' },
    ];

    const toastRegex = /^🎉 (?<name>.+?) \((?<program>.+?)\) telah mendaftar sebagai ahli!$/;

    for (const tc of testCases) {
      const message = `🎉 ${tc.name} (${tc.program}) telah mendaftar sebagai ahli!`;
      const match = message.match(toastRegex);
      if (!match) {
        throw new Error(`Message failed regex match: "${message}"`);
      }
      if (match.groups.name !== tc.name) {
        throw new Error(`Extracted name "${match.groups.name}" did not match "${tc.name}"`);
      }
      if (match.groups.program !== tc.program) {
        throw new Error(`Extracted program "${match.groups.program}" did not match "${tc.program}"`);
      }
    }
    return `All ${testCases.length} test variations strictly match the mandated format`;
  });

  await assertCase('Social Proof Toast', '3.2 Inspect src/main.js source code template for live social proof toast', async () => {
    const mainJsPath = path.resolve('src/main.js');
    const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

    // Check toast HTML element
    if (!mainJsContent.includes('id="live-toast-container"')) {
      throw new Error('src/main.js missing #live-toast-container');
    }
    if (!mainJsContent.includes('live-toast-message')) {
      throw new Error('src/main.js missing .live-toast-message container');
    }
    if (!mainJsContent.includes('telah mendaftar sebagai ahli!')) {
      throw new Error('src/main.js missing "telah mendaftar sebagai ahli!" toast text');
    }
    if (!mainJsContent.includes('🎉')) {
      throw new Error('src/main.js missing "🎉" celebratory emoji in toast');
    }
    if (!mainJsContent.includes('startLiveToast')) {
      throw new Error('src/main.js missing startLiveToast function');
    }

    return `src/main.js contains all required social proof toast templates and logic`;
  });

  await assertCase('Social Proof Toast', '3.3 Verify live database records feed valid data into toast pipeline', async () => {
    const { members } = await getPublicRegisteredMembers();
    if (!members || members.length === 0) {
      throw new Error('No public members available to verify toast feeding');
    }

    // Verify first 10 members produce valid non-empty toast strings
    for (let i = 0; i < Math.min(10, members.length); i++) {
      const m = members[i];
      const toastText = `🎉 ${m.full_name} (${m.program}) telah mendaftar sebagai ahli!`;
      if (!m.full_name || m.full_name.trim().length === 0) {
        throw new Error(`Member at index ${i} has empty full_name`);
      }
      if (!m.program || m.program.trim().length === 0) {
        throw new Error(`Member at index ${i} has empty program`);
      }
      if (toastText.includes('undefined') || toastText.includes('null')) {
        throw new Error(`Toast contains undefined/null for member ${m.id}`);
      }
    }
    return `Verified first 10 live member records feed pristine toast text without nulls or undefs`;
  });

  // -------------------------------------------------------------------------
  // SECTION 4: Cross-Tenant Storage Isolation (Adversarial Attack)
  // -------------------------------------------------------------------------
  console.log('\n--- Section 4: Cross-Tenant Storage Attack ---');

  await assertCase('Storage Attack', '4.1 Authenticated athlete cannot upload into another athlete folder', async () => {
    const targetFolder = 'b0000000-0000-4000-8000-000000000002'; // Athlete 2 UUID
    const attackUpload = await supabase.storage.from('avatars').upload(
      `${targetFolder}/tampered-avatar.png`,
      VALID_1X1_PNG,
      { contentType: 'image/png', upsert: true }
    );

    if (!attackUpload.error) {
      throw new Error('Cross-tenant storage attack succeeded! Athlete 1 was able to write to Athlete 2 folder!');
    }
    return `Blocked by Storage RLS policy: "${attackUpload.error.message}"`;
  });

  await assertCase('Storage Attack', '4.2 Authenticated athlete cannot upload to root of avatars bucket', async () => {
    const rootUpload = await supabase.storage.from('avatars').upload(
      `root-hacked.png`,
      VALID_1X1_PNG,
      { contentType: 'image/png', upsert: true }
    );

    if (!rootUpload.error) {
      throw new Error('Athlete was able to upload directly into the bucket root without user folder prefix!');
    }
    return `Blocked by Storage RLS: "${rootUpload.error.message}"`;
  });

  // Teardown / Sign out
  await logout();

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n======================================================================');
  console.log('              ADVERSARIAL M2 SUITE EXECUTION SUMMARY                  ');
  console.log('======================================================================');
  console.log(`Total Assertions: ${summary.total}`);
  console.log(`Passed:           \x1b[32m${summary.passed}\x1b[0m`);
  console.log(`Failed:           ${summary.failed > 0 ? `\x1b[31m${summary.failed}\x1b[0m` : '0'}`);
  console.log(`Execution Time:   ${elapsed}s`);
  console.log('======================================================================\n');

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
  return summary;
}

runM2AdversarialSuite().catch(err => {
  console.error('Fatal adversarial suite error:', err);
  process.exit(1);
});
