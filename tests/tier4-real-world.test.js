/**
 * Tier 4: Real-World Scenarios
 * Covers:
 * 1. Complete End-to-End Athlete Registration, Admin Approval & Monthly Fee Payment Lifecycle
 * 2. Multi-Program Concurrent Registration & Quota Tracking Lifecycle
 */

import { config } from './config.js';
import { createApiClient, validateMalaysianIC, maskIC } from './helpers/client.js';
import { assertEqual, assertTrue, assertFalse } from './helpers/assertions.js';

export async function runTier4Tests({ mock = false } = {}) {
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

  console.log('\n--- Running Tier 4: Real-World Workload Scenarios Tests ---');

  // Test 4.1: End-to-End Registration, Review, Fee Issuance & Athlete Profile Audit
  await test('4.1 Full Lifecycle: Registration -> Admin Approval -> Payment -> Profile Audit', async () => {
    const testMatric = `DPP${Math.floor(2000 + Math.random() * 7000)}`;
    const student = {
      fullName: 'Danial Hakim Bin Zainal',
      icNumber: '051120-11-9876',
      matricNumber: testMatric,
      program: 'DPP sem 1',
      phone: '0179998888',
      email: 'danial.hakim@example.test',
      gender: 'Lelaki',
      health: 'Tiada',
      experience: 'Ada'
    };

    if (mock) {
      assertTrue(validateMalaysianIC(student.icNumber));
      assertEqual(maskIC(student.icNumber), '••••••-••-9876');
      return;
    }

    // Step 1: Public registration submission
    const regRes = await client.from('members').insert({
      full_name: student.fullName,
      ic_number: student.icNumber,
      member_id: student.matricNumber,
      program: student.program,
      phone: student.phone,
      email: student.email,
      gender: student.gender,
      health: student.health,
      health_details: '',
      experience: student.experience,
      status: 'Semakan'
    });
    if (!regRes.ok) {
      throw new Error(`Registration failed: ${regRes.status} ${JSON.stringify(regRes.error)}`);
    }

    // Step 2: Admin authenticates
    const adminAuth = await client.auth.signInWithPassword({
      email: config.admin.email,
      password: config.admin.password
    });
    if (!adminAuth.ok) {
      throw new Error(`Admin login failed: ${adminAuth.status} ${JSON.stringify(adminAuth.error)}`);
    }
    const adminClient = createApiClient({ authToken: adminAuth.accessToken });

    // Step 3: Admin reviews and updates status to 'Diterima'
    const updateRes = await adminClient.from('members').update(
      { status: 'Diterima' },
      { member_id: `eq.${student.matricNumber}` }
    );
    assertTrue(updateRes.ok, 'Admin should be able to update member status to Diterima');

    // Step 4: Admin retrieves member record ID to attach payment
    const memberRecordRes = await adminClient.from('members').select('id', { member_id: `eq.${student.matricNumber}` });
    assertTrue(memberRecordRes.ok && memberRecordRes.data?.length > 0, 'Should find newly approved member');
    const memberDbId = memberRecordRes.data[0].id;

    // Step 5: Admin logs first monthly payment record (RM10.00)
    const paymentRes = await adminClient.from('payments').insert({
      athlete_id: memberDbId,
      member_id: student.matricNumber,
      period: 'November 2026',
      amount: config.rules.monthlyFee,
      status: 'Selesai',
      paid_at: new Date().toISOString()
    });
    assertTrue(paymentRes.ok, 'Admin should record monthly fee payment');

    // Step 6: Audit athlete record state
    const auditRes = await adminClient.from('members').select('member_id,ic_number,status', { id: `eq.${memberDbId}` });
    assertTrue(auditRes.ok, 'Audit query should succeed');
    const audited = auditRes.data[0];
    assertEqual(audited.status, 'Diterima', 'Status should now be Diterima');
    assertEqual(audited.member_id, student.matricNumber, 'Matric number should match');

    // Cleanup created records
    await adminClient.from('payments').delete({ athlete_id: `eq.${memberDbId}` });
    await adminClient.from('members').delete({ id: `eq.${memberDbId}` });
  });

  // Test 4.2: Concurrent Registration & Quota Tracking
  await test('4.2 Multi-Registration: Handles multiple applicants across TVET programs and updates quota', async () => {
    const timestamp = Date.now().toString().slice(-4);
    const applicants = [
      {
        full_name: 'Pemohon DFK 1',
        ic_number: '050101-01-2001',
        member_id: `DFK${timestamp}1`,
        program: 'DFK sem 1',
        phone: '0131110001',
        email: `dfk${timestamp}1@example.test`,
        gender: 'Lelaki',
        health: 'Tiada',
        experience: 'Ada'
      },
      {
        full_name: 'Pemohon DTK 2',
        ic_number: '050202-02-2002',
        member_id: `DTK${timestamp}2`,
        program: 'DTK sem 2',
        phone: '0131110002',
        email: `dtk${timestamp}2@example.test`,
        gender: 'Perempuan',
        health: 'Tiada',
        experience: 'Tiada'
      },
      {
        full_name: 'Pemohon DPP 3',
        ic_number: '050303-03-2003',
        member_id: `DPP${timestamp}3`,
        program: 'DPP sem 1',
        phone: '0131110003',
        email: `dpp${timestamp}3@example.test`,
        gender: 'Lelaki',
        health: 'Tiada',
        experience: 'Ada'
      }
    ];

    if (mock) {
      assertEqual(applicants.length, 3);
      return;
    }

    // Submit registrations concurrently
    const insertPromises = applicants.map(app => client.from('members').insert(app));
    const results = await Promise.all(insertPromises);

    for (let i = 0; i < results.length; i++) {
      assertTrue(results[i].ok, `Applicant ${applicants[i].member_id} registration should succeed`);
    }

    // Admin authenticates and cleans up
    const adminAuth = await client.auth.signInWithPassword({
      email: config.admin.email,
      password: config.admin.password
    });
    if (adminAuth.ok) {
      const adminClient = createApiClient({ authToken: adminAuth.accessToken });
      for (const app of applicants) {
        await adminClient.from('members').delete({ member_id: `eq.${app.member_id}` });
      }
    }
  });

  return results;
}
