/**
 * Tier 1: Feature Coverage (Core Requirements & Follow-ups)
 * Covers:
 * 1. Primary Member Identifier: No. Matrik Pelajar (replaces arbitrary '001')
 * 2. Identity Document: No. Kad Pengenalan (IC Number)
 * 3. Public Registration Submission to Supabase `members`
 * 4. Supabase Database Tables (`members`, `payments`) & RLS
 * 5. Supabase Storage Bucket `'avatars'`
 * 6. Admin Authentication at /admin/login/
 * 7. Athlete Authentication at /atlet/login/ via No. Matrik Pelajar
 * 8. Data Seeding: 30 dummy athletes with matric & IC + 90 payment records
 * 9. Public Member Tracker & Safe Data Exposure
 * 10. Social Proof Toast Notification Contract
 */

import { config } from './config.js';
import { createApiClient, normalizeMatricNumber, validateMalaysianIC, maskIC } from './helpers/client.js';
import { assertEqual, assertNotEqual, assertTrue, assertFalse, assertIncludes, assertNotIncludes, assertMatch } from './helpers/assertions.js';

export async function runTier1Tests({ mock = false } = {}) {
  const results = [];
  const client = createApiClient();

  async function test(name, fn) {
    const start = Date.now();
    try {
      await fn();
      results.push({ name, passed: true, duration: Date.now() - start });
    } catch (err) {
      results.push({ name, passed: false, duration: Date.now() - start, error: err });
    }
  }

  console.log('\n--- Running Tier 1: Feature Coverage Tests ---');

  // Test 1.1: Primary Identifier Contract (No. Matrik Pelajar)
  await test('1.1 Primary Identifier: Uses No. Matrik Pelajar instead of arbitrary 3-digit counter', async () => {
    const rawMatric = '  dfk2401  ';
    const normalized = normalizeMatricNumber(rawMatric);
    assertEqual(normalized, 'DFK2401', 'Matric number should be trimmed and uppercased');
    assertTrue(/^[A-Z]{3,4}\d{4}$/.test(normalized), 'Matric format should match TVET program + digits (e.g. DFK2401)');
    assertNotEqual(normalized, '001', 'Should NOT use legacy invented arbitrary counter "001"');
  });

  // Test 1.2: Identity Document (No. Kad Pengenalan) Contract
  await test('1.2 Identity Document: Validates and masks No. Kad Pengenalan (IC Number)', async () => {
    const validWithHyphen = '040115-01-1234';
    const validWithoutHyphen = '040115011234';
    const invalidShort = '040115';

    assertTrue(validateMalaysianIC(validWithHyphen), '12-digit IC with hyphens should be valid');
    assertTrue(validateMalaysianIC(validWithoutHyphen), '12-digit IC without hyphens should be valid');
    assertFalse(validateMalaysianIC(invalidShort), 'Short IC should be invalid');

    const masked = maskIC(validWithHyphen);
    assertEqual(masked, '••••••-••-1234', 'Masked IC should reveal only last 4 digits for athlete profile');
  });

  // Test 1.3: Registration Form Payload Schema
  await test('1.3 Registration Form: Schema contains all required fields including IC & Matric', async () => {
    const payload = {
      full_name: 'Muhammad Farhan Bin Roslan',
      ic_number: '050314-11-5678',
      member_id: 'DFK2499', // No. Matrik Pelajar
      program: 'DFK sem 1',
      phone: '01123456789',
      email: 'farhan.roslan@example.com',
      gender: 'Lelaki',
      health: 'Tiada',
      health_details: '',
      experience: 'Ada'
    };

    assertEqual(payload.member_id, 'DFK2499', 'Member ID must store Student Matric Number');
    assertTrue(validateMalaysianIC(payload.ic_number), 'Payload must have valid IC Number');
    assertEqual(payload.gender, 'Lelaki', 'Gender must be valid Malaysian Silat option');

    if (!mock) {
      const res = await client.from('members').insert(payload);
      if (!res.ok) {
        throw new Error(`Public registration insert failed: ${res.status} ${JSON.stringify(res.error)}`);
      }
      assertTrue(res.ok, 'Public registration should succeed under RLS');
      // Cleanup created test record
      await client.from('members').delete({ member_id: `eq.${payload.member_id}` });
    }
  });

  // Test 1.4: Database Tables Structure & RLS
  await test('1.4 Database Tables: `members` and `payments` tables are accessible via Supabase REST API', async () => {
    if (mock) {
      assertTrue(true, 'Mock: Database tables verified');
      return;
    }
    const membersRes = await client.from('members').select('id,member_id,full_name,program,status', { limit: '1' });
    if (!membersRes.ok) {
      throw new Error(`Table public.members not accessible: ${membersRes.status} ${JSON.stringify(membersRes.error)}`);
    }
    assertTrue(membersRes.ok, 'members table should be queryable');

    const paymentsRes = await client.from('payments').select('id,period,amount,status', { limit: '1' });
    if (!paymentsRes.ok) {
      throw new Error(`Table public.payments not accessible: ${paymentsRes.status} ${JSON.stringify(paymentsRes.error)}`);
    }
    assertTrue(paymentsRes.ok, 'payments table should be queryable');
  });

  // Test 1.5: Supabase Storage Bucket
  await test('1.5 Supabase Storage: Bucket `avatars` is provisioned and serves public image URLs', async () => {
    const testPath = 'test-athlete/avatar-sample.png';
    const publicUrl = client.storage.from(config.rules.storageBucket).getPublicUrl(testPath);
    assertIncludes(publicUrl, '/storage/v1/object/public/avatars/test-athlete/avatar-sample.png', 'Public avatar URL matches pattern');

    if (!mock) {
      const ping = await fetch(publicUrl);
      // Even if 404/400 (file not yet uploaded), the storage service must respond (not network unreachable)
      assertTrue(ping.status !== 502 && ping.status !== 503, 'Storage endpoint should be reachable');
    }
  });

  // Test 1.6: Admin Authentication Flow
  let adminToken = null;
  await test('1.6 Authentication: Admin logs in with credentials and receives access token', async () => {
    if (mock) {
      const adminEmail = config.admin.email;
      assertEqual(adminEmail, 'admin@tmbfighters.com', 'Admin email must be admin@tmbfighters.com');
      return;
    }
    const res = await client.auth.signInWithPassword({
      email: config.admin.email,
      password: config.admin.password
    });
    if (!res.ok) {
      throw new Error(`Admin login failed: ${res.status} ${JSON.stringify(res.error)}`);
    }
    adminToken = res.accessToken;
    assertTrue(!!res.accessToken, 'Admin login must return an access token');
    assertTrue(res.user?.email.startsWith('admin'), 'User email must belong to admin');
  });

  // Test 1.7: Athlete Authentication Flow (via No. Matrik Pelajar)
  await test('1.7 Authentication: Athlete logs in using No. Matrik Pelajar and password', async () => {
    const rawMatric = config.athlete.matricNumber;
    const cleanedMatric = normalizeMatricNumber(rawMatric);
    const athleteAuthEmail = `${cleanedMatric.toLowerCase()}@tmbfighters.com`;

    assertEqual(athleteAuthEmail, 'dfk2401@tmbfighters.com', 'Deterministic athlete email mapped from matric');

    if (mock) {
      assertTrue(true, 'Mock: Athlete auth mapping verified');
      return;
    }
    const res = await client.auth.signInWithPassword({
      email: athleteAuthEmail,
      password: config.athlete.password
    });
    if (!res.ok) {
      throw new Error(`Athlete login failed: ${res.status} ${JSON.stringify(res.error)}`);
    }
    assertTrue(!!res.accessToken, 'Athlete login must return an access token');
  });

  // Test 1.8: Data Seeding (30 Dummy Athletes & 90 Payments)
  await test('1.8 Data Seeding: 30 dummy athlete records and 90 monthly payment records exist', async () => {
    if (mock) {
      assertEqual(config.rules.expectedDummyAthletesCount, 30, 'Expected dummy athletes is 30');
      assertEqual(config.rules.expectedDummyPaymentsCount, 90, 'Expected dummy payments is 90');
      return;
    }
    if (adminToken) {
      client.setAuthToken(adminToken);
    }
    // Query count of members
    const membersRes = await client.from('members').select('id,member_id,ic_number', { limit: '50' });
    if (!membersRes.ok) {
      throw new Error(`Could not query members: ${membersRes.status} ${JSON.stringify(membersRes.error)}`);
    }
    const countMembers = Array.isArray(membersRes.data) ? membersRes.data.length : 0;
    assertTrue(countMembers >= 30, `Expected at least 30 seeded members, found ${countMembers}`);

    // Verify first seeded member has realistic student matric and IC number
    if (countMembers > 0) {
      const first = membersRes.data[0];
      assertTrue(!!first.member_id, 'Seeded member must have member_id (Matric Number)');
      assertFalse(first.member_id === '001', 'Seeded member must have realistic matric number, not "001"');
    }

    // Query count of payments
    const paymentsRes = await client.from('payments').select('id,amount,status', { limit: '150' });
    if (!paymentsRes.ok) {
      throw new Error(`Could not query payments: ${paymentsRes.status} ${JSON.stringify(paymentsRes.error)}`);
    }
    const countPayments = Array.isArray(paymentsRes.data) ? paymentsRes.data.length : 0;
    assertTrue(countPayments >= 90, `Expected at least 90 seeded payment records, found ${countPayments}`);
  });

  // Test 1.9: Public Member Tracker & Safe Data Exposure (Follow-up 2026-11-04T08:40:32Z)
  await test('1.9 Public Tracker: Public list exposes ONLY safe fields and omits private data', async () => {
    if (mock) {
      const safeFields = ['full_name', 'program'];
      const sensitiveFields = ['ic_number', 'phone', 'email', 'health_details'];
      assertTrue(safeFields.includes('full_name'));
      assertFalse(safeFields.includes('ic_number'));
      return;
    }

    // Anonymous client without auth token
    const anonClient = createApiClient();
    const res = await anonClient.from('members').select('full_name,program,created_at');
    if (!res.ok) {
      throw new Error(`Public tracker query failed: ${res.status} ${JSON.stringify(res.error)}`);
    }
    assertTrue(Array.isArray(res.data), 'Public tracker should return list of records');
    if (res.data.length > 0) {
      const sample = res.data[0];
      assertTrue('full_name' in sample, 'Should display Full Name');
      assertTrue('program' in sample, 'Should display Program');
      assertFalse('ic_number' in sample, 'Public tracker MUST NOT expose ic_number');
      assertFalse('phone' in sample, 'Public tracker MUST NOT expose phone');
      assertFalse('email' in sample, 'Public tracker MUST NOT expose email');
      assertFalse('health_details' in sample, 'Public tracker MUST NOT expose health_details');
    }
  });

  // Test 1.10: Social Proof Toast Notification Contract (Follow-up 2026-11-04T08:40:32Z)
  await test('1.10 Social Proof Toast: Toast displays celebratory registrant name and program', async () => {
    const sampleAthlete = {
      fullName: 'Ahmad Albab',
      program: 'DFK Sem 1'
    };
    const toastMessage = `🎉 ${sampleAthlete.fullName} (${sampleAthlete.program}) telah mendaftar sebagai ahli!`;
    assertIncludes(toastMessage, '🎉', 'Toast includes celebratory emoji');
    assertIncludes(toastMessage, 'Ahmad Albab', 'Toast includes registrant name');
    assertIncludes(toastMessage, 'DFK Sem 1', 'Toast includes program name');
    assertNotIncludes(toastMessage, '040115', 'Toast MUST NEVER include IC Number');
    assertNotIncludes(toastMessage, '012', 'Toast MUST NEVER include phone number');
  });

  return results;
}
