#!/usr/bin/env node
/**
 * Master E2E Test Suite Runner for TMB Fighters
 * Executes 4-tier opaque-box E2E tests:
 * - Tier 1: Feature Coverage (Core Requirements & Follow-ups)
 * - Tier 2: Boundary & Corner Cases (Security, Validation, RLS Isolation)
 * - Tier 3: Cross-Feature Combinations (Multi-step workflows)
 * - Tier 4: Real-World Scenarios (Full lifecycles)
 *
 * Usage:
 *   node tests/e2e-suite.js            # Run all 4 tiers in live mode
 *   node tests/e2e-suite.js --mock     # Run contract / validation tests offline
 *   node tests/e2e-suite.js --tier=1   # Run only Tier 1
 *   node tests/e2e-suite.js --tier=2   # Run only Tier 2
 */

import { runTier1Tests } from './tier1-feature-coverage.test.js';
import { runTier2Tests } from './tier2-boundary-corner-cases.test.js';
import { runTier3Tests } from './tier3-cross-feature.test.js';
import { runTier4Tests } from './tier4-real-world.test.js';
import { config } from './config.js';

// Parse command line arguments
const args = process.argv.slice(2);
const mockMode = args.includes('--mock') || args.includes('--offline');
const tierArg = args.find(a => a.startsWith('--tier='));
const targetTier = tierArg ? parseInt(tierArg.split('=')[1], 10) : null;

async function runSuite() {
  const startTime = Date.now();
  console.log('======================================================================');
  console.log('            TMB FIGHTERS — COMPREHENSIVE E2E TEST SUITE               ');
  console.log('======================================================================');
  console.log(`Execution Mode:  ${mockMode ? 'OFFLINE / CONTRACT MOCK' : 'LIVE SUPABASE BACKEND'}`);
  console.log(`Supabase URL:    ${config.supabaseUrl}`);
  console.log(`Target Tier:     ${targetTier ? `Tier ${targetTier} only` : 'All Tiers (1 - 4)'}`);
  console.log(`Primary ID Rule: Student Matric Number ('No. Matrik Pelajar', e.g. DFK2401)`);
  console.log(`Secondary Field: Student IC Number ('No. Kad Pengenalan', e.g. 040115-01-1234)`);
  console.log('======================================================================\n');

  const tierResults = {
    tier1: [],
    tier2: [],
    tier3: [],
    tier4: []
  };

  if (!targetTier || targetTier === 1) {
    tierResults.tier1 = await runTier1Tests({ mock: mockMode });
  }
  if (!targetTier || targetTier === 2) {
    tierResults.tier2 = await runTier2Tests({ mock: mockMode });
  }
  if (!targetTier || targetTier === 3) {
    tierResults.tier3 = await runTier3Tests({ mock: mockMode });
  }
  if (!targetTier || targetTier === 4) {
    tierResults.tier4 = await runTier4Tests({ mock: mockMode });
  }

  // Print results
  console.log('\n======================================================================');
  console.log('                        TEST EXECUTION SUMMARY                        ');
  console.log('======================================================================');

  let totalPassed = 0;
  let totalFailed = 0;
  const failures = [];

  function printTierSummary(tierName, items) {
    if (items.length === 0) return;
    const passed = items.filter(i => i.passed).length;
    const failed = items.filter(i => !i.passed).length;
    totalPassed += passed;
    totalFailed += failed;

    console.log(`\n${tierName}: ${passed} / ${items.length} Passed`);
    for (const item of items) {
      const statusLabel = item.passed ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
      console.log(`  ${statusLabel} ${item.name} (${item.duration}ms)`);
      if (!item.passed) {
        failures.push({ name: item.name, error: item.error });
      }
    }
  }

  printTierSummary('Tier 1 (Feature Coverage)', tierResults.tier1);
  printTierSummary('Tier 2 (Boundary & Corner Cases)', tierResults.tier2);
  printTierSummary('Tier 3 (Cross-Feature Combinations)', tierResults.tier3);
  printTierSummary('Tier 4 (Real-World Workload Scenarios)', tierResults.tier4);

  const totalTests = totalPassed + totalFailed;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n----------------------------------------------------------------------');
  console.log(`Total Completed: ${totalTests} tests in ${elapsed}s`);
  console.log(`Total Passed:    \x1b[32m${totalPassed}\x1b[0m`);
  console.log(`Total Failed:    ${totalFailed > 0 ? `\x1b[31m${totalFailed}\x1b[0m` : '0'}`);
  console.log('----------------------------------------------------------------------');

  if (failures.length > 0) {
    console.log('\n\x1b[31mFailure Details:\x1b[0m');
    failures.forEach((f, idx) => {
      console.log(`\n[${idx + 1}] ${f.name}`);
      console.log(`    Message: ${f.error?.message || f.error}`);
      if (f.error?.stack && !mockMode) {
        const stackLines = f.error.stack.split('\n').slice(1, 3).map(l => `    ${l.trim()}`).join('\n');
        console.log(stackLines);
      }
    });
    console.log('\n======================================================================');
    console.log('Exit Code: 1 (One or more tests failed)');
    console.log('======================================================================\n');
    process.exit(1);
  } else {
    console.log('\n\x1b[32mALL TEST ASSERTIONS PASSED SUCCESSFULLY!\x1b[0m');
    console.log('======================================================================\n');
    process.exit(0);
  }
}

runSuite().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
