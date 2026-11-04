/**
 * Challenger M1 Empirical Adversarial Test Suite
 * 
 * Conducts aggressive empirical stress tests against:
 * 1. Duplicate Matric Numbers (exact, case-variant, whitespace)
 * 2. Invalid Check Constraints (gender, status, experience, health)
 * 3. Negative Payment Amounts and invalid payment statuses
 * 4. Sequence Synchronization ('031' auto-generation on null/empty ID)
 * 5. PII Protection & RLS Isolation (anon access, view column lockdown, cross-tenant isolation)
 */

import { config } from './config.js';
import { createApiClient } from './helpers/client.js';

let passedCount = 0;
let failedCount = 0;
const results = [];

async function challenge(title, fn) {
  process.stdout.write(`[TESTING] ${title} ... `);
  try {
    const detail = await fn();
    passedCount++;
    console.log(`PASS`);
    results.push({ title, status: 'PASS', detail });
  } catch (err) {
    failedCount++;
    console.log(`FAIL`);
    console.error(`   Error: ${err.message}`);
    results.push({ title, status: 'FAIL', error: err.message });
  }
}

async function runChallengerSuite() {
  console.log('='.repeat(70));
  console.log('      TMB FIGHTERS — CHALLENGER M1 EMPIRICAL AUDIT HARNESS');
  console.log('='.repeat(70));
  console.log(`Target: ${config.supabaseUrl}`);
  console.log('Mode:   LIVE SUPABASE ADVERSARIAL VERIFICATION');
  console.log('='.repeat(70));
  console.log('');

  const anonClient = createApiClient();
  
  // Authenticate Admin client for payment testing & fixture cleanup
  const adminClient = createApiClient();
  const adminAuth = await adminClient.auth.signInWithPassword({
    email: config.admin.email,
    password: config.admin.password
  });
  if (!adminAuth.ok) {
    throw new Error(`Admin login failed during setup: ${JSON.stringify(adminAuth.error)}`);
  }
  adminClient.setAuthToken(adminAuth.accessToken);

  // Authenticate Athlete 1 (DFK2401)
  const athlete1Client = createApiClient();
  const athlete1Auth = await athlete1Client.auth.signInWithPassword({
    email: config.athlete.email,
    password: config.athlete.password
  });
  if (!athlete1Auth.ok) {
    throw new Error(`Athlete 1 login failed during setup: ${JSON.stringify(athlete1Auth.error)}`);
  }
  athlete1Client.setAuthToken(athlete1Auth.accessToken);

  // -------------------------------------------------------------
  // SUITE 1: DUPLICATE MATRIC NUMBER ADVERSARIAL CHECKS
  // -------------------------------------------------------------
  console.log('--- Suite 1: Duplicate Matric Number & Unique Constraints ---');

  await challenge('1.1 Exact duplicate matric_number insertion is rejected by unique constraint', async () => {
    const res = await anonClient.from('members').insert({
      full_name: 'Adversary Exact Duplicate',
      matric_number: 'DFK2401', // already seeded
      member_id: 'DFK2401',
      ic_number: '050101-01-9999',
      program: 'DFK sem 1',
      phone: '0191111111',
      email: 'exact.dup@example.com',
      gender: 'Lelaki',
      health: 'Tiada',
      experience: 'Tiada'
    });

    if (res.ok) {
      // If it succeeded, clean up and fail test
      await adminClient.from('members').delete({ email: 'eq.exact.dup@example.com' });
      throw new Error('Database unexpectedly allowed duplicate matric_number "DFK2401"');
    }

    if (res.status !== 409) {
      throw new Error(`Expected HTTP 409 Conflict, received HTTP ${res.status}: ${JSON.stringify(res.error)}`);
    }

    const code = res.error?.code;
    const msg = res.error?.message || '';
    if (code !== '23505' || !msg.includes('members_matric_number_key')) {
      throw new Error(`Expected unique violation 23505 (members_matric_number_key), got: ${JSON.stringify(res.error)}`);
    }

    return `Correctly rejected with code ${code} (${msg})`;
  });

  await challenge('1.2 Lowercase duplicate matric_number is normalized and rejected by unique constraint', async () => {
    const res = await anonClient.from('members').insert({
      full_name: 'Adversary Lowercase Duplicate',
      matric_number: 'dfk2401', // lowercase of DFK2401
      ic_number: '050101-01-9998',
      program: 'DFK sem 1',
      phone: '0191111112',
      email: 'lower.dup@example.com',
      gender: 'Lelaki',
      health: 'Tiada',
      experience: 'Tiada'
    });

    if (res.ok) {
      await adminClient.from('members').delete({ email: 'eq.lower.dup@example.com' });
      throw new Error('Database unexpectedly allowed lowercase duplicate matric_number "dfk2401"');
    }

    if (res.status !== 409 || res.error?.code !== '23505') {
      throw new Error(`Expected HTTP 409 / 23505, received ${res.status}: ${JSON.stringify(res.error)}`);
    }

    return `Trigger correctly uppercase-normalized and unique constraint rejected: ${res.error?.message}`;
  });

  await challenge('1.3 Whitespace-padded matric_number is trimmed and rejected by unique constraint', async () => {
    const res = await anonClient.from('members').insert({
      full_name: 'Adversary Whitespace Duplicate',
      matric_number: '   DFK2401   ', // padded with whitespace
      ic_number: '050101-01-9997',
      program: 'DFK sem 1',
      phone: '0191111113',
      email: 'ws.dup@example.com',
      gender: 'Lelaki',
      health: 'Tiada',
      experience: 'Tiada'
    });

    if (res.ok) {
      await adminClient.from('members').delete({ email: 'eq.ws.dup@example.com' });
      throw new Error('Database unexpectedly allowed whitespace-padded matric_number');
    }

    if (res.status !== 409 || res.error?.code !== '23505') {
      throw new Error(`Expected HTTP 409 / 23505, received ${res.status}: ${JSON.stringify(res.error)}`);
    }

    return `Trigger correctly trimmed and unique constraint rejected: ${res.error?.message}`;
  });

  await challenge('1.4 Duplicate member_id with different matric_number is rejected by member_id unique constraint', async () => {
    const res = await anonClient.from('members').insert({
      full_name: 'Adversary MemberID Duplicate',
      matric_number: 'UNIQUE_MATRIC_99',
      member_id: 'DFK2401', // duplicate member_id
      ic_number: '050101-01-9996',
      program: 'DFK sem 1',
      phone: '0191111114',
      email: 'mid.dup@example.com',
      gender: 'Lelaki',
      health: 'Tiada',
      experience: 'Tiada'
    });

    if (res.ok) {
      await adminClient.from('members').delete({ email: 'eq.mid.dup@example.com' });
      throw new Error('Database unexpectedly allowed duplicate member_id');
    }

    if (res.status !== 409 || res.error?.code !== '23505' || !res.error?.message.includes('members_member_id_key')) {
      throw new Error(`Expected unique violation on members_member_id_key, received: ${JSON.stringify(res.error)}`);
    }

    return `Correctly rejected on members_member_id_key: ${res.error?.message}`;
  });

  // -------------------------------------------------------------
  // SUITE 2: INVALID CHECK CONSTRAINTS ADVERSARIAL CHECKS
  // -------------------------------------------------------------
  console.log('');
  console.log('--- Suite 2: Check Constraints Integrity ---');

  await challenge('2.1 Invalid gender value ("Lain-lain") is rejected by members_gender_check', async () => {
    const res = await anonClient.from('members').insert({
      full_name: 'Adversary Invalid Gender',
      matric_number: 'TEST_GEN_01',
      ic_number: '050101-01-8881',
      program: 'DFK sem 1',
      phone: '0192222221',
      email: 'bad.gender@example.com',
      gender: 'Lain-lain', // Invalid
      health: 'Tiada',
      experience: 'Tiada'
    });

    if (res.ok) {
      await adminClient.from('members').delete({ matric_number: 'eq.TEST_GEN_01' });
      throw new Error('Database allowed invalid gender "Lain-lain"');
    }

    const code = res.error?.code;
    const msg = res.error?.message || '';
    if (code !== '23514' || !msg.includes('members_gender_check')) {
      throw new Error(`Expected check violation 23514 (members_gender_check), received: ${JSON.stringify(res.error)}`);
    }

    return `Rejected by check constraint: ${msg}`;
  });

  await challenge('2.2 Case-sensitive invalid gender ("lelaki") is rejected by members_gender_check', async () => {
    const res = await anonClient.from('members').insert({
      full_name: 'Adversary Lowercase Gender',
      matric_number: 'TEST_GEN_02',
      ic_number: '050101-01-8882',
      program: 'DFK sem 1',
      phone: '0192222222',
      email: 'lower.gender@example.com',
      gender: 'lelaki', // lowercase
      health: 'Tiada',
      experience: 'Tiada'
    });

    if (res.ok) {
      await adminClient.from('members').delete({ matric_number: 'eq.TEST_GEN_02' });
      throw new Error('Database allowed lowercase gender "lelaki"');
    }

    if (res.error?.code !== '23514' || !res.error?.message.includes('members_gender_check')) {
      throw new Error(`Expected 23514 members_gender_check, received: ${JSON.stringify(res.error)}`);
    }

    return `Correctly enforced case check: ${res.error?.message}`;
  });

  await challenge('2.3 Invalid status value ("Pending") is rejected by members_status_check', async () => {
    const res = await anonClient.from('members').insert({
      full_name: 'Adversary Invalid Status',
      matric_number: 'TEST_STAT_01',
      ic_number: '050101-01-8883',
      program: 'DFK sem 1',
      phone: '0192222223',
      email: 'bad.status@example.com',
      gender: 'Lelaki',
      status: 'Pending', // Invalid: only 'Diterima', 'Semakan' allowed
      health: 'Tiada',
      experience: 'Tiada'
    });

    if (res.ok) {
      await adminClient.from('members').delete({ matric_number: 'eq.TEST_STAT_01' });
      throw new Error('Database allowed invalid status "Pending"');
    }

    if (res.error?.code !== '23514' || !res.error?.message.includes('members_status_check')) {
      throw new Error(`Expected 23514 members_status_check, received: ${JSON.stringify(res.error)}`);
    }

    return `Rejected by status check constraint: ${res.error?.message}`;
  });

  await challenge('2.4 Invalid experience value ("Banyak") is rejected by members_experience_check', async () => {
    const res = await anonClient.from('members').insert({
      full_name: 'Adversary Invalid Experience',
      matric_number: 'TEST_EXP_01',
      ic_number: '050101-01-8884',
      program: 'DFK sem 1',
      phone: '0192222224',
      email: 'bad.exp@example.com',
      gender: 'Lelaki',
      health: 'Tiada',
      experience: 'Banyak' // Invalid: only 'Ada', 'Tiada' allowed
    });

    if (res.ok) {
      await adminClient.from('members').delete({ matric_number: 'eq.TEST_EXP_01' });
      throw new Error('Database allowed invalid experience "Banyak"');
    }

    if (res.error?.code !== '23514' || !res.error?.message.includes('members_experience_check')) {
      throw new Error(`Expected 23514 members_experience_check, received: ${JSON.stringify(res.error)}`);
    }

    return `Rejected by experience check constraint: ${res.error?.message}`;
  });

  await challenge('2.5 Invalid health value ("Sihat") is rejected by members_health_check', async () => {
    const res = await anonClient.from('members').insert({
      full_name: 'Adversary Invalid Health',
      matric_number: 'TEST_HLT_01',
      ic_number: '050101-01-8885',
      program: 'DFK sem 1',
      phone: '0192222225',
      email: 'bad.health@example.com',
      gender: 'Lelaki',
      health: 'Sihat', // Invalid: only 'Tiada', 'Ada' allowed
      experience: 'Tiada'
    });

    if (res.ok) {
      await adminClient.from('members').delete({ matric_number: 'eq.TEST_HLT_01' });
      throw new Error('Database allowed invalid health "Sihat"');
    }

    if (res.error?.code !== '23514' || !res.error?.message.includes('members_health_check')) {
      throw new Error(`Expected 23514 members_health_check, received: ${JSON.stringify(res.error)}`);
    }

    return `Rejected by health check constraint: ${res.error?.message}`;
  });

  // -------------------------------------------------------------
  // SUITE 3: PAYMENT INTEGRITY & NEGATIVE AMOUNT CHECKS
  // -------------------------------------------------------------
  console.log('');
  console.log('--- Suite 3: Payment Integrity & Amount Constraints ---');

  // Fetch valid athlete_id for DFK2401 to test payments
  const athlete1Res = await adminClient.from('members').select('id,matric_number,member_id', {
    matric_number: 'eq.DFK2401'
  });
  if (!athlete1Res.ok || !athlete1Res.data || athlete1Res.data.length === 0) {
    throw new Error('Could not find athlete DFK2401 to run payment adversarial tests');
  }
  const validAthlete = athlete1Res.data[0];

  await challenge('3.1 Negative payment amount (-10.00) is rejected by payments_amount_check', async () => {
    const res = await adminClient.from('payments').insert({
      athlete_id: validAthlete.id,
      matric_number: validAthlete.matric_number,
      member_id: validAthlete.member_id,
      period: 'Adversarial Test Period',
      amount: -10.00, // Negative amount attack
      status: 'Selesai'
    });

    if (res.ok) {
      await adminClient.from('payments').delete({ period: 'eq.Adversarial Test Period' });
      throw new Error('Database unexpectedly accepted negative payment amount -10.00');
    }

    if (res.error?.code !== '23514' || !res.error?.message.includes('payments_amount_check')) {
      throw new Error(`Expected check violation 23514 (payments_amount_check), received: ${JSON.stringify(res.error)}`);
    }

    return `Rejected negative payment: ${res.error?.message}`;
  });

  await challenge('3.2 Fractional negative payment amount (-0.01) is rejected by payments_amount_check', async () => {
    const res = await adminClient.from('payments').insert({
      athlete_id: validAthlete.id,
      matric_number: validAthlete.matric_number,
      member_id: validAthlete.member_id,
      period: 'Adversarial Test Period Frac',
      amount: -0.01,
      status: 'Selesai'
    });

    if (res.ok) {
      await adminClient.from('payments').delete({ period: 'eq.Adversarial Test Period Frac' });
      throw new Error('Database accepted fractional negative amount -0.01');
    }

    if (res.error?.code !== '23514' || !res.error?.message.includes('payments_amount_check')) {
      throw new Error(`Expected 23514 payments_amount_check, received: ${JSON.stringify(res.error)}`);
    }

    return `Rejected fractional negative payment: ${res.error?.message}`;
  });

  await challenge('3.3 Invalid payment status ("Pending") is rejected by payments_status_check', async () => {
    const res = await adminClient.from('payments').insert({
      athlete_id: validAthlete.id,
      matric_number: validAthlete.matric_number,
      member_id: validAthlete.member_id,
      period: 'Adversarial Status Period',
      amount: 10.00,
      status: 'Pending' // Invalid: only 'Selesai', 'Belum bayar' allowed
    });

    if (res.ok) {
      await adminClient.from('payments').delete({ period: 'eq.Adversarial Status Period' });
      throw new Error('Database accepted invalid payment status "Pending"');
    }

    if (res.error?.code !== '23514' || !res.error?.message.includes('payments_status_check')) {
      throw new Error(`Expected 23514 payments_status_check, received: ${JSON.stringify(res.error)}`);
    }

    return `Rejected invalid payment status: ${res.error?.message}`;
  });

  await challenge('3.4 Foreign key constraint rejects payment with non-existent athlete_id', async () => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    const res = await adminClient.from('payments').insert({
      athlete_id: fakeUuid,
      matric_number: 'FAKE999',
      member_id: 'FAKE999',
      period: 'FK Test Period',
      amount: 10.00,
      status: 'Selesai'
    });

    if (res.ok) {
      await adminClient.from('payments').delete({ period: 'eq.FK Test Period' });
      throw new Error('Database accepted payment with non-existent foreign key');
    }

    if (res.error?.code !== '23503') {
      throw new Error(`Expected foreign key violation 23503, received: ${JSON.stringify(res.error)}`);
    }

    return `Rejected by foreign key constraint: ${res.error?.message}`;
  });

  // -------------------------------------------------------------
  // SUITE 4: SEQUENCE SYNCHRONIZATION & AUTO-ASSIGNMENT ('031')
  // -------------------------------------------------------------
  console.log('');
  console.log('--- Suite 4: Sequence Synchronization & Auto-ID ("031") ---');

  await challenge('4.1 Inserting member without matric_number and member_id auto-assigns next sequence ("031")', async () => {
    // Public registration omitting both matric_number and member_id
    const payload = {
      full_name: 'Ujian Jujukan Auto 031',
      ic_number: '051212-08-1122',
      program: 'DFK sem 1',
      phone: '0189998877',
      email: 'seq031@example.com',
      gender: 'Lelaki',
      health: 'Tiada',
      experience: 'Tiada'
    };

    const res = await anonClient.from('members').insert(payload);
    if (!res.ok) {
      throw new Error(`Registration failed: ${res.status} ${JSON.stringify(res.error)}`);
    }

    const created = Array.isArray(res.data) ? res.data[0] : res.data;
    if (!created) {
      throw new Error('No record representation returned on insert');
    }

    const assignedMemberId = created.member_id;
    const assignedMatricNumber = created.matric_number;

    // Verify cleanup before assertion to prevent dirty state if assertion fails
    await adminClient.from('members').delete({ id: `eq.${created.id}` });

    if (assignedMemberId !== '031') {
      throw new Error(`Expected member_id '031', received '${assignedMemberId}'`);
    }

    if (assignedMatricNumber !== '031') {
      throw new Error(`Expected matric_number '031', received '${assignedMatricNumber}'`);
    }

    return `Successfully assigned sequence '031' to both member_id and matric_number`;
  });

  // -------------------------------------------------------------
  // SUITE 5: PII PROTECTION & ROW LEVEL SECURITY ISOLATION
  // -------------------------------------------------------------
  console.log('');
  console.log('--- Suite 5: PII Protection & RLS Isolation ---');

  await challenge('5.1 Anonymous direct GET to members returns zero rows (no data leakage)', async () => {
    const res = await anonClient.from('members').select('*');
    if (!res.ok) {
      throw new Error(`Direct query failed with unexpected error: ${res.status}`);
    }
    const count = Array.isArray(res.data) ? res.data.length : -1;
    if (count !== 0) {
      throw new Error(`Security breach: Anonymous query returned ${count} member rows!`);
    }
    return `Anonymous query returned exactly 0 rows`;
  });

  await challenge('5.2 Anonymous direct GET to payments returns zero rows', async () => {
    const res = await anonClient.from('payments').select('*');
    if (!res.ok) {
      throw new Error(`Direct query failed: ${res.status}`);
    }
    const count = Array.isArray(res.data) ? res.data.length : -1;
    if (count !== 0) {
      throw new Error(`Security breach: Anonymous query returned ${count} payment rows!`);
    }
    return `Anonymous query returned exactly 0 rows`;
  });

  await challenge('5.3 Anonymous targeted sensitive column query (ic_number, phone, email) returns zero rows', async () => {
    const res = await anonClient.from('members').select('ic_number,phone,email,health,health_details');
    if (!res.ok) {
      throw new Error(`Query failed: ${res.status}`);
    }
    const count = Array.isArray(res.data) ? res.data.length : -1;
    if (count !== 0) {
      throw new Error(`PII Leak: Returned ${count} rows of sensitive personal data!`);
    }
    return `Zero sensitive rows returned under RLS`;
  });

  await challenge('5.4 Public safe view exposes ONLY non-PII fields (id, full_name, program, created_at)', async () => {
    const res = await anonClient.from('public_registered_members').select('*');
    if (!res.ok) {
      throw new Error(`Failed to query safe public view: ${res.status} ${JSON.stringify(res.error)}`);
    }
    if (!Array.isArray(res.data) || res.data.length === 0) {
      throw new Error('Public view returned empty or invalid data');
    }

    const first = res.data[0];
    const allowedKeys = new Set(['id', 'full_name', 'program', 'created_at']);
    const keys = Object.keys(first);

    for (const key of keys) {
      if (!allowedKeys.has(key)) {
        throw new Error(`PII Leak: Unauthorized column '${key}' exposed in public_registered_members!`);
      }
    }

    if ('ic_number' in first || 'phone' in first || 'email' in first || 'health' in first) {
      throw new Error('Critical PII fields found in public view!');
    }

    return `Exposes exactly safe columns: [${keys.join(', ')}] across ${res.data.length} confirmed athletes`;
  });

  await challenge('5.5 Attempting to select sensitive column (ic_number) from public view is rejected', async () => {
    const res = await anonClient.from('public_registered_members').select('ic_number');
    if (res.ok) {
      throw new Error('Database unexpectedly allowed selecting ic_number from public view');
    }
    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400 Bad Request, received ${res.status}`);
    }
    return `Rejected: ${res.error?.message}`;
  });

  await challenge('5.6 Authenticated athlete cannot read another athlete profile (Cross-tenant RLS)', async () => {
    // Athlete 1 (DFK2401) attempts to read Athlete 2 (DTK2402)
    const res = await athlete1Client.from('members').select('*', {
      matric_number: 'eq.DTK2402'
    });

    if (!res.ok) {
      throw new Error(`Query failed: ${res.status}`);
    }

    const rows = res.data || [];
    if (rows.length !== 0) {
      throw new Error(`Isolation failure: Athlete 1 read Athlete 2 profile: ${JSON.stringify(rows)}`);
    }

    return `Correctly isolated: 0 rows returned for peer athlete`;
  });

  await challenge('5.7 Authenticated athlete cannot read peer payments (Cross-tenant RLS)', async () => {
    // Athlete 1 (DFK2401) attempts to read Athlete 2 (DTK2402) payments
    const res = await athlete1Client.from('payments').select('*', {
      matric_number: 'eq.DTK2402'
    });

    if (!res.ok) {
      throw new Error(`Query failed: ${res.status}`);
    }

    const rows = res.data || [];
    if (rows.length !== 0) {
      throw new Error(`Isolation failure: Athlete 1 read Athlete 2 payments: ${JSON.stringify(rows)}`);
    }

    return `Correctly isolated: 0 payment rows returned for peer athlete`;
  });

  await challenge('5.8 Authenticated athlete CAN read own profile and payments (Self-access RLS)', async () => {
    const profileRes = await athlete1Client.from('members').select('id,matric_number,full_name,email');
    if (!profileRes.ok || !profileRes.data || profileRes.data.length !== 1) {
      throw new Error(`Athlete cannot read own profile: ${JSON.stringify(profileRes)}`);
    }

    const paymentsRes = await athlete1Client.from('payments').select('id,period,amount,status');
    if (!paymentsRes.ok || !paymentsRes.data || paymentsRes.data.length !== 3) {
      throw new Error(`Expected 3 monthly payments for athlete, received: ${paymentsRes.data?.length}`);
    }

    return `Self-access verified: 1 profile record and 3 payment records retrieved`;
  });

  await challenge('5.9 Authenticated athlete cannot modify peer profile (Cross-tenant update RLS)', async () => {
    // Athlete 1 tries to patch phone of Athlete 2
    const res = await athlete1Client.from('members').update(
      { phone: '0199999999' },
      { matric_number: 'eq.DTK2402' }
    );

    // In PostgREST with RLS, updating rows not permitted by USING/WITH CHECK returns 0 rows updated
    const updatedRows = Array.isArray(res.data) ? res.data.length : 0;
    if (updatedRows > 0) {
      throw new Error(`Security breach: Athlete 1 modified Athlete 2 record!`);
    }

    // Verify peer phone was not modified
    const checkRes = await adminClient.from('members').select('phone', {
      matric_number: 'eq.DTK2402'
    });
    const currentPhone = checkRes.data?.[0]?.phone;
    if (currentPhone === '0199999999') {
      throw new Error('Security breach: Peer phone was mutated in database!');
    }

    return `Correctly blocked: 0 rows modified, target peer phone unchanged`;
  });

  // -------------------------------------------------------------
  // SUMMARY & VERDICT
  // -------------------------------------------------------------
  console.log('');
  console.log('='.repeat(70));
  console.log('                CHALLENGER AUDIT EXECUTION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Challenges: ${results.length}`);
  console.log(`Passed:           ${passedCount}`);
  console.log(`Failed:           ${failedCount}`);
  console.log('='.repeat(70));

  if (failedCount > 0) {
    console.log('VERDICT: REQUEST_CHANGES (Defects detected during empirical audit)');
    process.exit(1);
  } else {
    console.log('VERDICT: APPROVE (All database constraints, sequence sync, and RLS hold)');
    process.exit(0);
  }
}

runChallengerSuite().catch((err) => {
  console.error('Fatal Harness Error:', err);
  process.exit(1);
});
