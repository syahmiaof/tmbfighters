# TMB Fighters E2E Testing Infrastructure (TEST_INFRA.md)

**Target Project**: TMB Fighters Web Application Updates (R1, R2, R3, R4)  
**Target Environment**: Node.js v20+ / v24+ (Native ES Modules, Zero external npm test framework dependencies)  
**Author**: `teamwork_test_writer` (`test_writer_e2e`)  
**Specification References**: `ORIGINAL_REQUEST.md`, `PROJECT.md`

---

## 1. Test Architecture & Design Principles

### 1.1 Specification-Driven Black-Box & Integration Testing
The E2E test suite evaluates the complete application against the requirements in `PROJECT.md` and `ORIGINAL_REQUEST.md`:
1. **Homepage Registration UI (R1)**: Standardized Program (`DFK`, `DGA`, `ITW`, `SLR`) and Semester (`Sem 1` to `Sem 5`) dropdowns replacing Medan 04 text input.
2. **Data & Contract Integrity (R1)**: Uniform storage format `"CODE Sem X"` in Supabase `members.program`, with backward compatibility parser (`parseProgramDetails`) for legacy records (`'DFK sem 1'`, `'DGA 2'`).
3. **Admin Dashboard Participant Management & Filters (R2)**:
   - Course code filter dropdown with short codes only (`Semua kod`, `DFK`, `DGA`, `ITW`, `SLR`).
   - Semester filter dropdown (`Semua semester`, `Sem 1` to `Sem 5`).
   - Actions column: Edit modal (✏️) updating 7 athlete fields via `updateMemberRecord`, Delete modal (🗑️) with double-confirmation via `deleteMemberRecord`, Quick status toggle (`Diterima` <-> `Semakan`), Direct WhatsApp action button (`https://wa.me/`).
4. **WhatsApp OpenGraph Preview & Share Metadata (R3)**:
   - Absolute URLs for `og:image`, `og:image:secure_url`, `og:image:type`, `og:image:width`, `og:image:height`, and `<link rel="image_src">`.
   - Preview image file `public/og/tmb-fighters-share.jpg` strictly < 300KB and tracked in Git.
   - Meta copy cleanup: purging "RM10 sebulan" and "Sasaran 30 peserta" from `<title>` and `<meta name="description">`.
5. **Build & Deployment Readiness (R4)**: Clean production build (`npm run build`) exiting with code 0 and Vercel SPA route rewrite configuration.

### 1.2 Zero-Dependency Architecture
The test suite utilizes Node.js native capabilities:
- Native ES Modules (`import`/`export`).
- Native file system (`node:fs`), path resolution (`node:path`), and assertions (`node:assert`).
- Built-in lightweight test harness with color-coded ANSI status logs (`✔ [PASS]`, `✖ [FAIL]`), execution timings, and deterministic exit codes.
- No third-party test runners (e.g. Jest, Cypress, Mocha) are required, preventing dependency conflicts.

### 1.3 Execution Modes
- **Comprehensive Mode (`node tests/e2e-all-requirements.test.js`)**: Executes the full 4-tier suite against both logical specifications and project source files (`src/main.js`, `src/lib/supabase.js`, `index.html`, `public/og/tmb-fighters-share.jpg`).
- **Contract / Mock Mode (`node tests/e2e-all-requirements.test.js --mock`)**: Executes all logic, contract transformations, boundaries, combinations, and real-world scenarios in-memory against reference oracles.
- **Tier-Specific Execution (`--tier=1`, `--tier=2`, `--tier=3`, `--tier=4`)**: Allows isolated execution of any single tier.

---

## 2. 4-Tier Test Taxonomy

### Tier 1: Feature Coverage (Core Requirements Isolated Verification)
Verifies happy-path functionality for all 15 features in `PROJECT.md`:
1. **Feature 1 (Standardized Program Dropdown)**: Dropdown offering course codes only without descriptions (`DFK`, `DGA`, `ITW`, `SLR`).
2. **Feature 2 (Standardized Semester Dropdown)**: Dropdown offering `Sem 1`, `Sem 2`, `Sem 3`, `Sem 4`, `Sem 5`.
3. **Feature 3 (Uniform Database Storage Format)**: Storage format formatted as `"CODE Sem X"` in Supabase `members.program`.
4. **Feature 4 (Backward Compatibility Parser)**: Format parser `parseProgramDetails` handles existing records without corruption.
5. **Feature 5 (Course Code Filter Dropdown)**: Admin table filter displaying short codes only (`Semua kod`, `DFK`, `DGA`, `ITW`, `SLR`).
6. **Feature 6 (Semester Filter Dropdown)**: Admin table filter displaying `Semua semester`, `Sem 1` through `Sem 5`.
7. **Feature 7 (Edit Member Modal & Action)**: Edit button (✏️) opening modal prefilled with 7 fields (Nama, No IC, No Matrik, Program & Sem, Telefon, Status, Kesihatan), persisting updates via `updateMemberRecord`.
8. **Feature 8 (Delete Member Double-Confirmation Modal)**: Delete button (🗑️) prompting 2-step confirmation before calling `deleteMemberRecord`.
9. **Feature 9 (Quick Status Toggle Action)**: In-table toggle between `Diterima` and `Semakan` updating Supabase and stat cards.
10. **Feature 10 (Direct WhatsApp Action Button)**: WhatsApp action button generating valid `https://wa.me/` link with normalized phone number.
11. **Feature 11 (WhatsApp OpenGraph & Sharing Meta Tags)**: Absolute URLs in `index.html` for `og:image`, `og:image:secure_url`, `og:image:type`, `og:image:width`, `og:image:height`, and `<link rel="image_src">`.
12. **Feature 12 (Preview Thumbnail Optimization)**: `public/og/tmb-fighters-share.jpg` exists, size strictly < 300KB (307,200 bytes), tracked in Git.
13. **Feature 13 (Metadata Copy Cleanup)**: Purge "RM10 sebulan" and "Sasaran 30 peserta" from `<title>` and `<meta name="description">`.
14. **Feature 14 (Clean Production Build Verification)**: `npm run build` exits with code 0 without bundler errors.

### Tier 2: Boundary & Corner Cases
Verifies extreme inputs, security boundaries, and edge cases:
1. **Empty / Missing / Malformed Phone Numbers**: WhatsApp link generator handles null, empty, non-digit strings, and country code formats (`+60`, `60`, `0`, spaces, dashes) gracefully without crashing.
2. **Legacy Program Formats Parsing**: Robust parsing of legacy variations (`'DFK sem 1'`, `'DGA 2'`, `'ITW SEM 3'`, `'slr sem 4'`, missing prefixes, extra spaces, unrecognized strings).
3. **Combined Course Code + Semester Multi-Filters**: Admin filtering across dual conditions (e.g. `DFK` + `Sem 2`, `ITW` + `Sem 1`, wildcards `Semua kod` / `Semua semester`, and zero-result combinations).
4. **Step-1 Cancel in Delete Modal State Machine**: Cancelling at Step 1 aborts deletion, prevents invoking `deleteMemberRecord`, and leaves record intact.
5. **12-Digit Malaysian IC Boundaries**: Validates 12 digits with and without hyphens, rejects invalid lengths or non-numeric characters, and verifies privacy masking (`maskIC` revealing only last 4 digits).
6. **Incomplete Form Selection Boundary**: Submitting registration without choosing Program or Semester is blocked with field-level validation errors.

### Tier 3: Cross-Feature Combinations
Verifies multi-step workflows across distinct features:
1. **Registration -> Admin Table Filter Synchronization**: Register athlete with new Program (`DFK`) and Semester (`Sem 1`) -> payload formatted as `"DFK Sem 1"` -> admin table filters by `DFK` + `Sem 1` locate newly registered athlete.
2. **Quick Status Toggle + Stat Card Cascade**: Quick toggle between `Semakan` and `Diterima` immediately recalculates summary counts (`stat-review` and `stat-confirmed`).
3. **Edit Record + Format Standardization + Filter Refresh**: Editing a legacy record (`'DFK sem 1'`) to `'DFK Sem 2'` updates `members.program`, persists via `updateMemberRecord`, updates table row, and reflects in `Sem 2` filter.
4. **Edit Phone Number -> WhatsApp Link Cascade**: Updating athlete phone number dynamically updates the direct WhatsApp button target URL.
5. **Double-Confirmation Deletion Lifecycle**: Full Step-1 abort vs Step-2 confirmation lifecycle verifying record removal from database and DOM table row deletion.

### Tier 4: Real-World Workload Scenarios
Simulates realistic end-to-end user journeys:
1. **Scenario 1 (New Student Athlete Journey)**: Athlete selects program `ITW` and semester `Sem 2` from standardized dropdowns -> submits form -> receives registration confirmation -> admin reviews applicant -> contacts via WhatsApp -> approves membership.
2. **Scenario 2 (Admin Legacy Data Audit Journey)**: Admin audits 30 legacy records with mixed program formats -> filters by course short code -> edits non-standard formats to standardized `"CODE Sem X"` -> verifies database integrity.
3. **Scenario 3 (High-Velocity Admin Session)**: Rapid sequence of multi-filtering, quick toggles, detail edits, and double-confirmation deletion verifying table state consistency and visible record counters.

---

## 3. Directory Layout in `tests/`

```
tests/
├── e2e-all-requirements.test.js      # Comprehensive Master E2E Test Suite (Tiers 1-4)
├── config.js                          # Project and Supabase environment configuration
├── helpers/
│   ├── client.js                      # REST API client & data normalization helpers
│   └── assertions.js                  # Minimal assertion library
├── round2-verification.test.js        # Lekir Bot & AJK verification test suite
└── smoke-test.js                      # Fast smoke test runner
```

---

## 4. Execution Commands

### Run Comprehensive E2E Test Suite
```bash
node tests/e2e-all-requirements.test.js
```

### Run in Contract / Mock Mode (Offline Logic Validation)
```bash
node tests/e2e-all-requirements.test.js --mock
```

### Run Specific Test Tier
```bash
node tests/e2e-all-requirements.test.js --tier=1    # Tier 1: Feature Coverage
node tests/e2e-all-requirements.test.js --tier=2    # Tier 2: Boundary & Corner Cases
node tests/e2e-all-requirements.test.js --tier=3    # Tier 3: Cross-Feature Combinations
node tests/e2e-all-requirements.test.js --tier=4    # Tier 4: Real-World Scenarios
```

---

## 5. Verification & Expected Output
Every test case derives its expected values directly from `PROJECT.md` and `ORIGINAL_REQUEST.md`. The runner outputs color-coded logs with test names, durations, and a breakdown summary table.
- In Mock/Contract mode (`--mock`), all 4 tiers pass with 100% success rate (exit code 0).
- In Live Codebase mode, completed features pass, and pending implementation milestones report explicit diagnostic failures (exit code 1 until implementation is complete).
