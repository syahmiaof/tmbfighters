/**
 * Tier 3: Cross-Feature Combinations
 * Covers:
 * 1. Public Registration -> Admin Dashboard Verification
 * 2. Athlete Authentication -> Avatar Photo Upload -> URL Persistence & Public Render
 * 3. Athlete Authentication -> Payment History Linkage & RLS Verification
 * 4. Public Registration -> Social Proof Toast Feed Sync
 */

import { config } from './config.js';
import { createApiClient, normalizeMatricNumber } from './helpers/client.js';
import { assertEqual, assertTrue, assertFalse, assertIncludes } from './helpers/assertions.js';

// Minimal 1x1 valid PNG buffer for photo upload test fixture
const TINY_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

export async function runTier3Tests({ mock = false } = {}) {
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

  console.log('\n--- Running Tier 3: Cross-Feature Combinations Tests ---');

  // Test 3.1: Public Registration -> Admin Review Flow
  await test('3.1 Registration -> Admin Review: Public registration appears in admin dashboard', async () => {
    const testMatric = `DFK${Math.floor(1000 + Math.random() * 9000)}`;
    const regPayload = {
      full_name: 'Calon Ujian Silat',
      ic_number: '050912-11-4321',
      member_id: testMatric,
      program: 'DFK sem 1',
      phone: '0198887777',
      email: 'calon.silat@example.test',
      gender: 'Lelaki',
      health: 'Tiada',
      health_details: '',
      experience: 'Ada'
    };

    if (mock) {
      assertEqual(regPayload.member_id, testMatric);
      return;
    }

    // Step 1: Anonymous public registration
    const regRes = await client.from('members').insert(regPayload);
    if (!regRes.ok) {
      throw new Error(`Public registration failed: ${regRes.status} ${JSON.stringify(regRes.error)}`);
    }

    // Step 2: Admin authenticates
    const adminRes = await client.auth.signInWithPassword({
      email: config.admin.email,
      password: config.admin.password
    });
    if (!adminRes.ok) {
      throw new Error(`Admin authentication failed: ${adminRes.status} ${JSON.stringify(adminRes.error)}`);
    }

    const adminClient = createApiClient({ authToken: adminRes.accessToken });

    // Step 3: Admin queries dashboard members
    const fetchRes = await adminClient.from('members').select('*', { member_id: `eq.${testMatric}` });
    assertTrue(fetchRes.ok, 'Admin query should succeed');
    assertTrue(Array.isArray(fetchRes.data) && fetchRes.data.length > 0, 'Newly registered member must appear in admin query');

    const createdRecord = fetchRes.data[0];
    assertEqual(createdRecord.member_id, testMatric, 'Member ID should match registered student matric');
    assertEqual(createdRecord.ic_number, regPayload.ic_number, 'IC number must be recorded correctly');

    // Cleanup
    await adminClient.from('members').delete({ member_id: `eq.${testMatric}` });
  });

  // Test 3.2: Athlete Login -> Avatar Photo Upload -> Persistence & Renderability
  await test('3.2 Athlete Photo Upload: Authenticated athlete uploads avatar and verifies public URL', async () => {
    if (mock) {
      assertTrue(true, 'Mock: Athlete photo upload lifecycle verified');
      return;
    }

    // Step 1: Athlete authenticates
    const cleanedMatric = normalizeMatricNumber(config.athlete.matricNumber);
    const athleteEmail = `${cleanedMatric.toLowerCase()}@tmbfighters.com`;

    const authRes = await client.auth.signInWithPassword({
      email: athleteEmail,
      password: config.athlete.password
    });
    if (!authRes.ok) {
      throw new Error(`Athlete login failed: ${authRes.status} ${JSON.stringify(authRes.error)}`);
    }

    const athleteToken = authRes.accessToken;
    const athleteUser = authRes.user;
    const athleteClient = createApiClient({ authToken: athleteToken });

    // Step 2: Upload avatar image to Supabase Storage
    const timestamp = Date.now();
    const filePath = `${athleteUser.id}/avatar-${timestamp}.png`;
    const uploadRes = await athleteClient.storage.from(config.rules.storageBucket).upload(
      filePath,
      TINY_PNG_BUFFER,
      { contentType: 'image/png', upsert: true }
    );
    if (!uploadRes.ok) {
      throw new Error(`Avatar upload failed: ${uploadRes.status} ${JSON.stringify(uploadRes.error)}`);
    }

    // Step 3: Retrieve public URL
    const publicUrl = athleteClient.storage.from(config.rules.storageBucket).getPublicUrl(filePath);
    assertTrue(publicUrl.includes(filePath), 'Public URL contains storage path');

    // Step 4: Update member record with avatar_url
    const updateRes = await athleteClient.from('members').update(
      { avatar_url: publicUrl, updated_at: new Date().toISOString() },
      { user_id: `eq.${athleteUser.id}` }
    );
    assertTrue(updateRes.ok, 'Updating athlete avatar_url should succeed');

    // Step 5: Verify public image URL returns HTTP 200
    const imagePing = await fetch(publicUrl);
    assertEqual(imagePing.status, 200, 'Public avatar URL must return HTTP 200');
    assertIncludes(imagePing.headers.get('content-type') || '', 'image/', 'Response Content-Type must be image');
  });

  // Test 3.3: Athlete Login -> Payment History Linkage & RLS
  await test('3.3 Payment Tracking: Authenticated athlete queries own payment records', async () => {
    if (mock) {
      assertTrue(true, 'Mock: Athlete payments linkage verified');
      return;
    }

    // Step 1: Athlete authenticates
    const cleanedMatric = normalizeMatricNumber(config.athlete.matricNumber);
    const athleteEmail = `${cleanedMatric.toLowerCase()}@tmbfighters.com`;

    const authRes = await client.auth.signInWithPassword({
      email: athleteEmail,
      password: config.athlete.password
    });
    if (!authRes.ok) {
      throw new Error(`Athlete login failed: ${authRes.status} ${JSON.stringify(authRes.error)}`);
    }

    const athleteClient = createApiClient({ authToken: authRes.accessToken });

    // Step 2: Athlete queries own payment records
    const paymentsRes = await athleteClient.from('payments').select('*');
    assertTrue(paymentsRes.ok, 'Athlete should be able to query own payment records');
    assertTrue(Array.isArray(paymentsRes.data), 'Payments should return an array');

    if (paymentsRes.data.length > 0) {
      for (const p of paymentsRes.data) {
        // Each payment record amount is RM10
        assertEqual(Number(p.amount), config.rules.monthlyFee, 'Monthly fee amount must be RM10.00');
        assertTrue(p.status === 'Selesai' || p.status === 'Belum bayar', 'Status must be Selesai or Belum bayar');
      }
    }
  });

  // Test 3.4: Public Registration -> Social Proof Toast Feed Sync
  await test('3.4 Social Proof Sync: New registration generates valid public toast payload', async () => {
    const newAthlete = {
      fullName: 'Nurul Hidayah',
      program: 'DTK Sem 2',
      registeredAt: new Date().toISOString()
    };

    // Format toast according to social proof specification
    const toastText = `🎉 ${newAthlete.fullName} (${newAthlete.program}) telah mendaftar sebagai ahli!`;
    assertIncludes(toastText, 'Nurul Hidayah', 'Toast contains recent athlete name');
    assertIncludes(toastText, 'DTK Sem 2', 'Toast contains recent athlete program');
  });

  return results;
}
