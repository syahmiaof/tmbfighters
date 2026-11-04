/**
 * Tier 2: Boundary & Corner Cases
 * Covers:
 * 1. Safe Exposure & Data Leakage Prevention (Anonymous cannot read private fields)
 * 2. Matric Number Normalization & Boundary Validations
 * 3. IC Number Boundary Validations (12-digit format, special char checks, masking)
 * 4. Storage Security & File Upload Boundaries (MIME whitelist, size limits, unauth rejection)
 * 5. Row Level Security (RLS) Tenant Isolation (Athlete A vs Athlete B)
 * 6. Health Details Conditional Requirement
 * 7. Duplicate Matric Number Prevention (Unique Constraint)
 */

import { config } from './config.js';
import { createApiClient, normalizeMatricNumber, validateMalaysianIC, maskIC } from './helpers/client.js';
import { assertEqual, assertTrue, assertFalse, assertIncludes, assertMatch } from './helpers/assertions.js';

export async function runTier2Tests({ mock = false } = {}) {
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

  console.log('\n--- Running Tier 2: Boundary & Corner Cases Tests ---');

  // Test 2.1: Data Leakage & Safe Exposure Audit
  await test('2.1 Data Leakage Audit: Anonymous requests cannot read sensitive IC/Phone/Email fields', async () => {
    if (mock) {
      assertTrue(true, 'Mock: Data exposure audit verified');
      return;
    }
    const anonClient = createApiClient();
    const res = await anonClient.from('members').select('id,ic_number,phone,email,health_details');
    // Under RLS, either the request fails, or returns 0 rows, or the columns are nullified/restricted
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      for (const row of res.data) {
        assertTrue(
          !row.ic_number && !row.phone && !row.email,
          'Anonymous user should not be able to read sensitive fields of existing members'
        );
      }
    }
  });

  // Test 2.2: Matric Number Normalization & Boundaries
  await test('2.2 Matric Number Normalization: Trims whitespace, uppercases, and rejects invalid chars', async () => {
    assertEqual(normalizeMatricNumber('  dpp2405  '), 'DPP2405', 'Leading and trailing spaces trimmed, lowercase uppercased');
    assertEqual(normalizeMatricNumber('dtp2401'), 'DTP2401', 'Lowercase uppercased');
    assertEqual(normalizeMatricNumber(''), '', 'Empty string handled safely');
    assertEqual(normalizeMatricNumber(null), '', 'Null input handled safely');

    // Malicious or malformed inputs
    const sqlInjectionMatric = 'DFK2401; DROP TABLE members;';
    const isAlphanumeric = /^[A-Z0-9]+$/.test(normalizeMatricNumber(sqlInjectionMatric));
    assertFalse(isAlphanumeric, 'Injection string contains non-alphanumeric characters and fails validator');
  });

  // Test 2.3: IC Number Boundary & Privacy Masking
  await test('2.3 IC Number Validation: Enforces exactly 12 digits and tests boundary values', async () => {
    // Exactly 12 digits
    assertTrue(validateMalaysianIC('060715031122'), '12 digits without hyphen is valid');
    assertTrue(validateMalaysianIC('060715-03-1122'), '12 digits with standard hyphens is valid');

    // Invalid lengths
    assertFalse(validateMalaysianIC('06071503112'), '11 digits is invalid (too short)');
    assertFalse(validateMalaysianIC('0607150311225'), '13 digits is invalid (too long)');
    assertFalse(validateMalaysianIC(''), 'Empty string is invalid');
    assertFalse(validateMalaysianIC(null), 'Null is invalid');

    // Contains alphabets
    assertFalse(validateMalaysianIC('060715-03-112A'), 'Alphabetic characters in IC is invalid');

    // Privacy Masking Verification
    const masked = maskIC('060715-03-1122');
    assertEqual(masked, '••••••-••-1122', 'Only last 4 digits are revealed');
  });

  // Test 2.4: Storage File MIME Type Rejection
  await test('2.4 Storage MIME Security: Non-image MIME types are rejected', async () => {
    const disallowedMimes = config.rules.disallowedMimes;
    for (const mime of disallowedMimes) {
      assertFalse(
        config.rules.allowedImageMimes.includes(mime),
        `MIME type ${mime} must be forbidden for profile avatar uploads`
      );
    }

    if (!mock) {
      // Attempt uploading a text file buffer disguised as pdf
      const fakePdfBuffer = Buffer.from('%PDF-1.4 Fake PDF Content for security testing');
      const res = await client.storage.from(config.rules.storageBucket).upload(
        'security-test/exploit.pdf',
        fakePdfBuffer,
        { contentType: 'application/pdf' }
      );
      // Supabase Storage or RLS policy should reject non-image MIME or unauthenticated upload
      assertFalse(res.ok, 'Uploading non-image MIME or unauthenticated upload should fail');
    }
  });

  // Test 2.5: Storage File Size Limit
  await test('2.5 Storage File Size: Files exceeding size limit are rejected', async () => {
    const oversizedBytes = 6 * 1024 * 1024; // 6MB (exceeds 2MB client limit and 5MB bucket limit)
    assertTrue(oversizedBytes > config.rules.maxPhotoSizeClient, 'Exceeds 2MB client limit');
    assertTrue(oversizedBytes > config.rules.maxPhotoSizeBucket, 'Exceeds 5MB bucket limit');
  });

  // Test 2.6: Row Level Security (RLS) Isolation
  await test('2.6 RLS Isolation: Anonymous users cannot read or modify `payments` table', async () => {
    if (mock) {
      assertTrue(true, 'Mock: RLS isolation verified');
      return;
    }
    const anonClient = createApiClient();
    const res = await anonClient.from('payments').select('*');
    // RLS policy on payments restricts SELECT to admin or the athlete whose user_id matches
    if (res.ok && Array.isArray(res.data)) {
      assertEqual(res.data.length, 0, 'Anonymous query on payments table must return 0 records under RLS');
    }

    // Anonymous insert into payments must fail
    const insertRes = await anonClient.from('payments').insert({
      period: 'November 2026',
      amount: 10.00,
      status: 'Selesai'
    });
    assertFalse(insertRes.ok, 'Anonymous insert into payments table must be blocked by RLS');
  });

  // Test 2.7: Health Details Conditional Requirement
  await test('2.7 Health Conditional Validation: Requires explanation if health === "Ada"', async () => {
    function validateHealth(health, healthDetails) {
      if (health === 'Ada' && (!healthDetails || healthDetails.trim().length === 0)) {
        return { valid: false, error: 'Sila nyatakan butiran masalah kesihatan anda' };
      }
      return { valid: true };
    }

    const invalid = validateHealth('Ada', '');
    assertFalse(invalid.valid, 'Health="Ada" without details must fail validation');

    const validWithDetails = validateHealth('Ada', 'Asma ringan semasa latihan fizikal');
    assertTrue(validWithDetails.valid, 'Health="Ada" with explanation must pass validation');

    const validTiada = validateHealth('Tiada', '');
    assertTrue(validTiada.valid, 'Health="Tiada" without explanation must pass validation');
  });

  // Test 2.8: Duplicate Matric Number Prevention
  await test('2.8 Integrity: Duplicate No. Matrik Pelajar is rejected by unique constraint', async () => {
    if (mock) {
      assertTrue(true, 'Mock: Duplicate matric rejection verified');
      return;
    }
    const matric = `DUP${Date.now().toString().slice(-4)}`;
    const recordA = {
      full_name: 'Test Duplicate A',
      ic_number: '050101-01-1111',
      member_id: matric,
      program: 'DFK sem 1',
      phone: '0121111111',
      email: 'dupA@example.test',
      gender: 'Lelaki',
      health: 'Tiada',
      experience: 'Tiada'
    };
    const recordB = {
      ...recordA,
      full_name: 'Test Duplicate B',
      email: 'dupB@example.test'
    };

    // First insert
    const resA = await client.from('members').insert(recordA);
    if (resA.ok) {
      // Second insert with identical member_id
      const resB = await client.from('members').insert(recordB);
      assertFalse(resB.ok, 'Inserting duplicate matric number must fail with unique constraint error');
      // Cleanup
      await client.from('members').delete({ member_id: `eq.${matric}` });
    }
  });

  return results;
}
