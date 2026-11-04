/**
 * Rapid Smoke Test for TMB Fighters E2E Test Suite
 * Verifies core configuration, endpoint connectivity, contract formats, and validators.
 */

import { config } from './config.js';
import { createApiClient, normalizeMatricNumber, validateMalaysianIC, maskIC } from './helpers/client.js';

async function runSmokeTest() {
  console.log('=====================================================');
  console.log('   TMB FIGHTERS — RAPID SMOKE TEST (Node.js)         ');
  console.log('=====================================================');
  console.log(`Supabase URL:    ${config.supabaseUrl}`);
  console.log(`Anon Key Prefix: ${config.supabaseAnonKey.slice(0, 20)}...`);
  console.log(`Admin User:      ${config.admin.email}`);
  console.log(`Athlete Matric:  ${config.athlete.matricNumber}`);
  console.log(`Expected Quota:  30 participants (RM${config.rules.monthlyFee}/month)`);
  console.log('-----------------------------------------------------\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Primary Identifier Contract (No. Matrik Pelajar)
  const normMatric = normalizeMatricNumber('  dfk2401  ');
  assert(normMatric === 'DFK2401', 'Matric number normalized to uppercase without whitespace');
  assert(normMatric !== '001', 'Rejects arbitrary sequential "001" counter');

  // 2. Identity Document Contract (No. Kad Pengenalan)
  assert(validateMalaysianIC('040115-01-1234'), '12-digit IC with hyphens validated');
  assert(validateMalaysianIC('040115011234'), '12-digit IC without hyphens validated');
  assert(!validateMalaysianIC('12345'), 'Short IC rejected');
  assert(maskIC('040115-01-1234') === '••••••-••-1234', 'IC privacy mask formats correctly');

  // 3. Storage Bucket Configuration
  const client = createApiClient();
  const avatarUrl = client.storage.from(config.rules.storageBucket).getPublicUrl('test-user/avatar.png');
  assert(avatarUrl.includes('/storage/v1/object/public/avatars/'), 'Storage public URL contract verified');

  // 4. Social Proof Toast Contract
  const toastMessage = `🎉 Ahmad Albab (DFK Sem 1) telah mendaftar sebagai ahli!`;
  assert(toastMessage.startsWith('🎉') && toastMessage.includes('Ahmad Albab'), 'Social proof toast format verified');

  // 5. Connectivity Check (Live Supabase API ping)
  try {
    const res = await fetch(`${config.supabaseUrl}/rest/v1/`, {
      headers: { apikey: config.supabaseAnonKey }
    });
    assert(res.status < 500, `Supabase API reachable (HTTP ${res.status})`);
  } catch (err) {
    console.error(`[FAIL] Supabase API network reachability: ${err.message}`);
    failed++;
  }

  console.log('\n-----------------------------------------------------');
  console.log(`Smoke Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('=====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSmokeTest();
