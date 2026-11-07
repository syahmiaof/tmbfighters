# Project: TMB Fighters Web Application Updates

## Architecture
- **Tech Stack**: Vanilla JavaScript (ES Modules), Vite 6.4.1 bundler, CSS3 custom properties (dark/light themes).
- **Backend / Database**: Supabase (`@supabase/supabase-js`), PostgreSQL `public.members` and `public.payments` tables.
- **Routing**: SPA routing via `handleRouting()` in `src/main.js`, with route rewrites defined in `vercel.json`.
- **Target Hosting**: Vercel (`https://tmbfighters.vercel.app`), GitHub (`syahmiaof/tmbfighters`).

## Feature Inventory
Every feature from the Survey phase appears here with its assigned milestone.
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Standardized Program Dropdown | Dropdown with course codes only: `DFK`, `DGA`, `ITW`, `SLR` | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Standardized Semester Dropdown | Dropdown with semesters: `Sem 1`, `Sem 2`, `Sem 3`, `Sem 4`, `Sem 5` | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Uniform Database Storage Format | Format and store data in Supabase `members.program` as "CODE Sem X" (e.g. "DFK Sem 1") | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Backward Compatibility for Existing Records | Existing records remain intact without corruption; format parser handles legacy strings | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Course Code Filter Dropdown | Admin table filter with short codes only (`Semua kod`, `DFK`, `DGA`, `ITW`, `SLR`) | M2 | ORIGINAL_REQUEST §R2 |
| 6 | Semester Filter Dropdown | Admin table filter with semesters (`Semua semester`, `Sem 1` to `Sem 5`) | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Edit Member Modal & Action | Edit button (✏️) opening modal prefilled with 7 fields, persisting via `updateMemberRecord` | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Delete Member Double-Confirmation Modal | Delete button (🗑️) with 2-step confirmation modal calling `deleteMemberRecord` | M2 | ORIGINAL_REQUEST §R2 |
| 9 | Quick Status Toggle Action | In-table toggle between `Diterima` and `Semakan` updating Supabase and stat cards | M2 | ORIGINAL_REQUEST §R2 |
| 10 | Direct WhatsApp Action Button | Button generating valid `https://wa.me/` link with normalized phone number | M2 | ORIGINAL_REQUEST §R2 |
| 11 | WhatsApp OpenGraph & Sharing Meta Tags | Absolute URLs for `og:image`, `og:image:secure_url`, `og:image:type`, `og:image:width`, `og:image:height`, and `<link rel="image_src">` | M3 | ORIGINAL_REQUEST §R3 |
| 12 | Preview Thumbnail Optimization (<300KB) | Ensure preview image `public/og/tmb-fighters-share.jpg` is strictly < 300KB and tracked in Git | M3 | ORIGINAL_REQUEST §R3 |
| 13 | Metadata Copy Cleanup | Purge "RM10 sebulan" and "Sasaran 30 peserta" from `<title>` and `<meta name="description">` | M3 | ORIGINAL_REQUEST §R3 |
| 14 | Clean Production Build Verification | `npm run build` exits with code 0 without errors | M3 | ORIGINAL_REQUEST §R4 |
| 15 | Deployment Readiness & Test Verification | Pass full test suites, verify Git tracking and Vercel deployment configuration | M3 | ORIGINAL_REQUEST §R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Homepage Registration Dropdowns & Data Format | Replace Medan 04 with Program & Semester dropdowns; enforce "CODE Sem X" in Supabase | none | PLANNED |
| 2 | M2: Admin Dashboard Filtering & Actions | Course & Semester filters; Actions column (Edit modal, Delete double-confirmation, quick status toggle, WhatsApp button); Supabase helpers | M1 | PLANNED |
| 3 | M3: WhatsApp OpenGraph, Build & Final Verification | Add `<link rel="image_src">`, verify image <300KB & Git tracking, clean meta copy; run `npm run build` & pass 100% E2E tests | M1, M2 | PLANNED |

## Interface Contracts
### `src/main.js` ↔ `src/lib/supabase.js`
- `registerMember(data)`: Accepts `{ ..., program: string, ... }` where `program` is `"CODE Sem X"` (e.g. `"DFK Sem 1"`).
- `formatProgramSemester(raw)`: Parses and formats any program string into `"CODE Sem X"`.
- `updateMemberRecord(id, updates)`: Updates member in `public.members`. Preserves `"CODE Sem X"` casing and syncs `member_id = matric_number`.
- `deleteMemberRecord(id)`: Cascades deletion across `public.payments` and deletes row from `public.members`.
- `parseProgramDetails(programStr)`: Returns `{ code: string, semester: string, semNum: string|null, raw: string }`.

## Code Layout
- `index.html`: Entry HTML document, `<head>` OpenGraph and sharing meta tags.
- `src/main.js`: Core SPA application router, homepage registration form, admin dashboard views, modals, event handlers.
- `src/style.css`: Application styles, form select controls, admin actions cell, modal dialogs.
- `src/lib/supabase.js`: Supabase client integration, `registerMember`, `updateMemberRecord`, `deleteMemberRecord`.
- `public/og/tmb-fighters-share.jpg`: OpenGraph share image (<300KB).
- `tests/`: Test suites (`round2-verification.test.js`, `smoke-test.js`, E2E test suites).
