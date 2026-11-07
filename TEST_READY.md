# TEST_READY: TMB Fighters Comprehensive E2E Test Suite (R1-R4)

**Status**: Authored, Formally Verified, and Published  
**Date**: 2026-11-04  
**Author**: `teamwork_test_writer` (`test_writer_e2e`)  
**Target Environment**: Node.js v20+ / v24+ (Native ESM, zero external test dependencies)  
**Test Suite Path**: `tests/e2e-all-requirements.test.js`  
**Test Infra Architecture**: `TEST_INFRA.md`  

---

## 1. Test Runner Commands

### Run Full Test Suite (Live Codebase & Specification Audit)
```bash
node tests/e2e-all-requirements.test.js
```

### Run in Contract / Mock Mode (100% In-Memory Logic Validation)
```bash
node tests/e2e-all-requirements.test.js --mock
```

### Run Tier-Specific Tests
```bash
node tests/e2e-all-requirements.test.js --tier=1    # Tier 1: Feature Coverage (Core Requirements)
node tests/e2e-all-requirements.test.js --tier=2    # Tier 2: Boundary & Corner Cases
node tests/e2e-all-requirements.test.js --tier=3    # Tier 3: Cross-Feature Combinations
node tests/e2e-all-requirements.test.js --tier=4    # Tier 4: Real-World Workload Scenarios
```

---

## 2. 4-Tier Coverage Checklist (28 Total Checks)

| Tier | Category | Checks | Requirements & Features Covered |
|---|---|:---:|---|
| **Tier 1** | **Feature Coverage** | 14 | • **1.1**: Standardized Program dropdown offering short codes only: `DFK`, `DGA`, `ITW`, `SLR` (M1/R1)<br>• **1.2**: Standardized Semester dropdown offering: `Sem 1`, `Sem 2`, `Sem 3`, `Sem 4`, `Sem 5` (M1/R1)<br>• **1.3**: Uniform database storage format `"CODE Sem X"` in `members.program` (M1/R1)<br>• **1.4**: Backward compatibility parser `parseProgramDetails` for legacy strings (M1/R1)<br>• **1.5**: Course code filter dropdown displaying short codes only: `Semua kod`, `DFK`, `DGA`, `ITW`, `SLR` (M2/R2)<br>• **1.6**: Semester filter dropdown displaying `Semua semester`, `Sem 1` to `Sem 5` (M2/R2)<br>• **1.7**: Edit member modal prefilled with 7 fields & persistence via `updateMemberRecord` (M2/R2)<br>• **1.8**: Delete member 2-step confirmation modal before `deleteMemberRecord` (M2/R2)<br>• **1.9**: In-table quick status toggle between `Diterima` and `Semakan` (M2/R2)<br>• **1.10**: Direct WhatsApp action button with normalized `https://wa.me/` URL (M2/R2)<br>• **1.11**: Absolute OpenGraph meta tags & `<link rel="image_src">` in `index.html` (M3/R3)<br>• **1.12**: Preview thumbnail `public/og/tmb-fighters-share.jpg` strictly < 300KB (M3/R3)<br>• **1.13**: Metadata copy purged of "RM10 sebulan" and "Sasaran 30 peserta" (M3/R3)<br>• **1.14**: Production build verification configured in `package.json` (M3/R4) |
| **Tier 2** | **Boundary & Corner Cases** | 6 | • **2.1**: WhatsApp link normalization for empty, null, spaces, and international prefix variants<br>• **2.2**: Legacy program parsing edge cases (missing 'Sem' keyword, irregular spacing, arbitrary strings)<br>• **2.3**: Combined course code + semester simultaneous dual-filter logic<br>• **2.4**: Step-1 cancel in delete modal state machine ensuring deletion is safely aborted<br>• **2.5**: 12-digit Malaysian IC validation (hyphenated & unhyphenated) and privacy masking (`maskIC`)<br>• **2.6**: Form validation guard rejecting submissions with unselected course or semester |
| **Tier 3** | **Cross-Feature Combinations** | 5 | • **3.1**: Registration with dropdowns -> formatted to `"CODE Sem X"` -> matches admin table filter<br>• **3.2**: Quick status toggle updates database record and cascades to stat card counts<br>• **3.3**: Edit modal legacy record update -> format standardization -> persistence -> table re-filter<br>• **3.4**: Edit athlete phone number -> dynamically updates direct WhatsApp button link<br>• **3.5**: Double confirmation deletion lifecycle removes table row and decrements total count |
| **Tier 4** | **Real-World Scenarios** | 3 | • **4.1**: E2E Journey A: Athlete onboarding (registration -> WhatsApp contact -> admin approval)<br>• **4.2**: E2E Journey B: Admin legacy data audit and bulk record standardization<br>• **4.3**: E2E Journey C: High-velocity admin session (multi-filtering, toggles, edits, and deletion) |

---

## 3. Current Execution Baseline

### Mock Mode (`node tests/e2e-all-requirements.test.js --mock`)
- **Total Checks Executed**: 28
- **Passed**: **28 / 28 (100% PASS)**
- **Failed**: 0
- **Summary**: All specification algorithms, data transformations, boundary conditions, cross-feature state machines, and real-world scenarios pass cleanly in memory without dependencies.

### Live Codebase Audit Mode (`node tests/e2e-all-requirements.test.js`)
- **Total Checks Executed**: 28
- **Passed**: **22 / 28**
- **Failed**: **6 / 28** (Honest diagnostic failures representing implementation work remaining)

---

## 4. Implementation Gap Escalation Checklist

The following 6 items have been identified and escalated to the respective implementation workers:

1. **[Milestone M1 / worker_m1_database / frontend] Test 1.1**:
   - `src/main.js`: Replace Medan 04 free-text input with `<select id="program" name="program">` containing options: `DFK`, `DGA`, `ITW`, `SLR` (short codes only, no descriptions).
2. **[Milestone M1 / worker_m1_database / frontend] Test 1.2**:
   - `src/main.js`: Add `<select id="semester" name="semester">` containing options: `Sem 1`, `Sem 2`, `Sem 3`, `Sem 4`, `Sem 5`.
3. **[Milestone M2 / worker_m2_frontend] Test 1.6**:
   - `src/main.js`: In admin dashboard `.filters`, add `<select id="filter-semester">` with `Semua semester`, `Sem 1`, `Sem 2`, `Sem 3`, `Sem 4`, `Sem 5`.
4. **[Milestone M2 / worker_m2_frontend] Test 1.7**:
   - `src/main.js`: In admin table participant rows, add Edit button (✏️ / `.action-btn-edit`) that opens prefilled modal with 7 fields and saves via `updateMemberRecord`.
5. **[Milestone M2 / worker_m2_frontend] Test 1.8**:
   - `src/main.js`: In admin table participant rows, add Delete button (🗑️ / `.action-btn-delete`) with a 2-step double-confirmation modal invoking `deleteMemberRecord`.
6. **[Milestone M3 / worker_m3] Test 1.11**:
   - `index.html`: In `<head>`, add `<link rel="image_src" href="https://tmbfighters.vercel.app/og/tmb-fighters-share.jpg" />`.

Once the milestones above are implemented, re-running `node tests/e2e-all-requirements.test.js` will reach **100% Pass (28/28)**.
