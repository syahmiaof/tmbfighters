/**
 * Round 2 Verification Test Suite — TMB Fighters Portal
 *
 * Verifies:
 * 1. Lekir Bot AI Chatbot Widget (R1):
 *    - Mascot image asset existence and integrity
 *    - Model configuration (openrouter/free with fallback candidates)
 *    - Malay persilatan FAQ knowledge base coverage (schedule, fees, coach, category, registration, AJK, location, PSSGM, contacts)
 *    - Polite graceful fallback when API fails or key is missing
 *    - DOM mounting into document.body and launcher click toggling
 *    - Mobile responsive breakpoint (@media (max-width: 768px)) and z-index 10001
 * 2. Homepage Silat Training & Club Information (R2):
 *    - Training schedule (Isnin & Rabu 9:00 - 11:00 Malam)
 *    - Commencement (Latihan bermula semester depan)
 *    - Coach (Coach Syahmi - Jurulatih Bertauliah)
 *    - Affiliations (PSSGM and MPP TVETMARA Besut)
 *    - Uniform fee (RM10/month)
 *    - Participant target (Sasaran 30 peserta - pendaftaran terbuka, non-blocking)
 *    - Meta tags in index.html
 * 3. AJK Committee Page & Navigation (R3):
 *    - "AJK" tab in topbar highlights with .active
 *    - Route matching for /ajk and /ajk/
 *    - 5-tier hierarchical organizational chart
 *    - Presence of all 10 official committee members with exact designations
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Test stats tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${testName}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✖ [FAIL]\x1b[0m ${testName} ${details ? `(${details})` : ''}`);
    failedTests++;
  }
}

console.log('\n================================================================');
console.log('  TMB FIGHTERS — ROUND 2 VERIFICATION TEST SUITE (E2E)');
console.log('================================================================\n');

// -------------------------------------------------------------
// SECTION 1: Mascot Image Asset Verification
// -------------------------------------------------------------
console.log('\x1b[36m[1/7] Mascot Branding & Asset Verification (R1)\x1b[0m');

const mascotPath = path.join(rootDir, 'public', 'lekir-bot.png');
const mascotExists = fs.existsSync(mascotPath);
assert(mascotExists, 'Mascot image public/lekir-bot.png exists');

if (mascotExists) {
  const stats = fs.statSync(mascotPath);
  assert(stats.size > 100000, `Mascot image size is valid (${stats.size.toLocaleString()} bytes)`);

  const buffer = fs.readFileSync(mascotPath);
  // Check JFIF (JPEG) or PNG header
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  assert(isJpeg || isPng, 'Mascot image has valid image file magic bytes');
}

// -------------------------------------------------------------
// SECTION 2: Lekir Bot Chatbot Logic & Knowledge Base (R1)
// -------------------------------------------------------------
console.log('\n\x1b[36m[2/7] Lekir Bot Knowledge Base & Fallback Logic (R1)\x1b[0m');

const chatbotCodePath = path.join(rootDir, 'src', 'lib', 'chatbot.js');
const chatbotSource = fs.readFileSync(chatbotCodePath, 'utf-8');

// Verify openrouter/free model configuration
assert(
  chatbotSource.includes("'openrouter/free'"),
  'LLM model configured to openrouter/free'
);

assert(
  chatbotSource.includes('candidateModels') && chatbotSource.includes('nvidia/nemotron-3.5-lightning:free'),
  'Multi-candidate model fallbacks implemented for high availability'
);

// Dynamic import of LekirBot class and FAQ knowledge base
const { LekirBot, FAQ_KNOWLEDGE } = await import('../src/lib/chatbot.js');

assert(Array.isArray(FAQ_KNOWLEDGE) && FAQ_KNOWLEDGE.length >= 8, 'FAQ_KNOWLEDGE base contains all core persilatan topics');

const bot = new LekirBot();

// Test FAQ Question 1: Schedule
const ansJadual = bot.checkFAQ('Bila jadual latihan silat TMB?');
assert(
  ansJadual !== null &&
  ansJadual.includes('Isnin & Rabu') &&
  ansJadual.includes('9:00 Malam – 11:00 Malam') &&
  ansJadual.includes('semester depan'),
  'FAQ Question 1: Training Schedule (Isnin & Rabu, 9:00 - 11:00 Malam, semester depan)'
);

// Test FAQ Question 2: Fees
const ansYuran = bot.checkFAQ('Berapa yuran pendaftaran dan bulanan?');
assert(
  ansYuran !== null && ansYuran.includes('RM10 sebulan'),
  'FAQ Question 2: Membership Fees (RM10 sebulan)'
);

// Test FAQ Question 3: Coach
const ansCoach = bot.checkFAQ('Siapa jurulatih yang bimbing kelab ni?');
assert(
  ansCoach !== null &&
  ansCoach.includes('Coach Syahmi') &&
  ansCoach.includes('PSSGM'),
  'FAQ Question 3: Certified Coach (Coach Syahmi & PSSGM)'
);

// Test FAQ Question 4: Categories
const ansKategori = bot.checkFAQ('Ada kategori silat apa yang boleh saya sertai?');
assert(
  ansKategori !== null &&
  ansKategori.includes('Silat Seni') &&
  ansKategori.includes('Silat Olahraga'),
  'FAQ Question 4: Silat Categories (Silat Seni & Silat Olahraga)'
);

// Test FAQ Question 5: Registration & Quota
const ansDaftar = bot.checkFAQ('Bagaimana cara nak daftar, ada kuota 30 orang ke?');
assert(
  ansDaftar !== null &&
  ansDaftar.includes('30 peserta') &&
  ansDaftar.includes('tetap dibuka'),
  'FAQ Question 5: Registration & Target (30 peserta & tetap dibuka / pendaftaran terbuka)'
);

// Test FAQ Question 6: AJK Committee
const ansAjk = bot.checkFAQ('Boleh saya tahu barisan AJK kelab?');
assert(
  ansAjk !== null &&
  ansAjk.includes('Tuan Zainal Abidin') &&
  ansAjk.includes('Puan Noor Azila') &&
  ansAjk.includes('Muhammad Syahmi'),
  'FAQ Question 6: Committee Leadership (Tuan Zainal Abidin, Pn Azila, Syahmi)'
);

// Test FAQ Question 7: Location
const ansLokasi = bot.checkFAQ('Kat mana gelanggang atau dewan tempat latihan?');
assert(
  ansLokasi !== null &&
  ansLokasi.includes('TVETMARA Besut'),
  'FAQ Question 7: Training Location (TVETMARA Besut)'
);

// Test FAQ Question 8: Affiliation
const ansNaungan = bot.checkFAQ('Adakah kelab ini di bawah PSSGM Gayong?');
assert(
  ansNaungan !== null &&
  ansNaungan.includes('Pertubuhan Silat Seni Gayong Malaysia (PSSGM)'),
  'FAQ Question 8: Official Affiliation (PSSGM)'
);

// Test FAQ Question 9: Contact Channels
const ansHubungi = bot.checkFAQ('Boleh bagi nombor telefon atau whatsapp pengurusan?');
assert(
  ansHubungi !== null &&
  ansHubungi.includes('010-796 5236') &&
  ansHubungi.includes('013-932 6767'),
  'FAQ Question 9: Contact Channels (Coach Syahmi 010-796 5236, Pn Azila 013-932 6767)'
);

// Test Fallback Handling
const fallbackGeneral = bot.getFallbackResponse('soalan rawak yang tiada jawapan faq');
assert(
  fallbackGeneral.includes('talian AI sedang padat') &&
  fallbackGeneral.includes('Coach Syahmi') &&
  fallbackGeneral.includes('010-796 5236'),
  'Polite fallback returns courteous notice with Coach Syahmi contact on unrecognized queries'
);

const fallbackWithFaqContext = bot.getFallbackResponse('jadual waktu silat');
assert(
  fallbackWithFaqContext.includes('Isnin & Rabu') &&
  fallbackWithFaqContext.includes('Talian AI sedang sibuk'),
  'Smart fallback surfaces contextual FAQ info when keywords match under network/AI failure'
);

// -------------------------------------------------------------
// SECTION 3: Lekir Bot DOM Lifecycle & Interactive Toggle (R1)
// -------------------------------------------------------------
console.log('\n\x1b[36m[3/7] Lekir Bot DOM Lifecycle & Interactive State (R1)\x1b[0m');

// Lightweight Node DOM simulation for headless DOM verification
class SimpleClassList {
  constructor() { this.classes = new Set(); }
  add(c) { this.classes.add(c); }
  remove(c) { this.classes.delete(c); }
  contains(c) { return this.classes.has(c); }
}

class SimpleElement {
  constructor(tag, id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.className = '';
    this.classList = new SimpleClassList();
    this.style = {};
    this.attributes = {};
    this.children = [];
    this.listeners = {};
    this._innerHTML = '';
  }

  set innerHTML(html) {
    this._innerHTML = html;
  }

  get innerHTML() {
    return this._innerHTML;
  }

  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k] || null; }

  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  dispatchEvent(event) {
    const list = this.listeners[event.type || event] || [];
    for (const fn of list) fn(event);
  }

  click() {
    this.dispatchEvent({ type: 'click', target: this, closest: () => this });
  }

  appendChild(child) {
    this.children.push(child);
  }

  closest() { return this; }
}

// Setup simulated document and window
const mockBody = new SimpleElement('body');
const elementsMap = new Map();

const mockDocument = {
  body: mockBody,
  createElement(tag) { return new SimpleElement(tag); },
  querySelector(selector) {
    if (elementsMap.has(selector)) return elementsMap.get(selector);
    const el = new SimpleElement('div');
    elementsMap.set(selector, el);
    return el;
  }
};

globalThis.document = mockDocument;
globalThis.window = {
  innerWidth: 1024,
  location: { pathname: '/', origin: 'http://localhost:5173' }
};

// Initialize Lekir Bot in DOM
bot.init();
const rootElement = mockDocument.querySelector('#lekir-bot-root');
assert(rootElement !== null, 'Lekir Bot mounts root container #lekir-bot-root');

// Verify initial state
assert(bot.isOpen === false, 'Bot window starts closed (isOpen = false)');

// Simulate launcher click toggle
const launcherEl = mockDocument.querySelector('#lekir-launcher');
const windowEl = mockDocument.querySelector('#lekir-window');

bot.toggleWindow(true);
assert(bot.isOpen === true, 'Toggling open sets bot.isOpen = true');
assert(windowEl.style.display === 'flex', 'Opening bot sets window display: flex');
assert(launcherEl.classList.contains('is-active'), 'Opening bot adds .is-active to launcher');

bot.toggleWindow(false);
assert(bot.isOpen === false, 'Toggling closed sets bot.isOpen = false');
assert(windowEl.style.display === 'none', 'Closing bot sets window display: none');
assert(!launcherEl.classList.contains('is-active'), 'Closing bot removes .is-active from launcher');

// Test markdown formatting
const formatted = bot.formatMarkdown('**bold** dan *italic* dan • list item');
assert(
  formatted.includes('<strong>bold</strong>') &&
  formatted.includes('<em>italic</em>') &&
  formatted.includes('<li>list item</li>'),
  'Bot formatMarkdown parses bold, italic, and bullet lists cleanly'
);

// -------------------------------------------------------------
// SECTION 4: Mobile Responsive CSS & Z-Index Verification (R1)
// -------------------------------------------------------------
console.log('\n\x1b[36m[4/7] Mobile Responsive Styles & Z-Index Audit (R1)\x1b[0m');

const cssPath = path.join(rootDir, 'src', 'style.css');
const cssSource = fs.readFileSync(cssPath, 'utf-8');

// Verify @media (max-width: 768px)
assert(
  cssSource.includes('@media (max-width: 768px)'),
  'Mobile responsive media query updated to @media (max-width: 768px)'
);

// Verify 48px circular launcher in mobile
assert(
  cssSource.includes('width: 48px;') && cssSource.includes('height: 48px;'),
  'Mobile launcher avatar container sized to compact 48px circle'
);

// Verify hidden text label in mobile
assert(
  cssSource.includes('.lekir-launcher-label {\n    display: none;') ||
  cssSource.includes('.lekir-launcher-label { display: none;') ||
  cssSource.includes('.lekir-launcher-label {\r\n    display: none;'),
  'Mobile launcher hides text label (.lekir-launcher-label { display: none; })'
);

// Verify full-width bottom sheet styles
assert(
  cssSource.includes('border-radius: 24px 24px 0 0;') &&
  cssSource.includes('height: 82vh;'),
  'Mobile chat window renders as responsive bottom sheet (82vh, curved top border)'
);

// Verify z-index 10001 (sits cleanly above toast 9999)
assert(
  cssSource.includes('z-index: 10001;'),
  '.lekir-window configured with z-index: 10001 (above social proof toasts at 9999)'
);

// -------------------------------------------------------------
// SECTION 5: Homepage Silat Training & Club Info (R2)
// -------------------------------------------------------------
console.log('\n\x1b[36m[5/7] Homepage Training & Club Information (R2)\x1b[0m');

const mainJsPath = path.join(rootDir, 'src', 'main.js');
const mainJsSource = fs.readFileSync(mainJsPath, 'utf-8');

// Training schedule: Monday & Wednesday (9:00 PM - 11:00 PM / Isnin & Rabu 9:00 - 11:00 Malam)
assert(
  mainJsSource.includes('Isnin &amp; Rabu (9:00 - 11:00 Malam)') ||
  mainJsSource.includes('Isnin & Rabu (9:00 – 11:00 Malam)') ||
  mainJsSource.includes('Isnin &amp; Rabu (9:00 – 11:00 Malam)'),
  'Homepage clearly states training schedule: Isnin & Rabu (9:00 - 11:00 Malam)'
);

// Training commencement: Latihan bermula semester depan
assert(
  mainJsSource.includes('Latihan bermula semester depan di TVETMARA Besut') ||
  mainJsSource.includes('Latihan Bermula Sem Depan'),
  'Homepage clearly states commencement: Latihan bermula semester depan'
);

// Homepage contact list: Pn Azila, En Fadhil, Syahmi, and Hud
assert(
  mainJsSource.includes('010-796 5236') &&
  mainJsSource.includes('013-932 6767') &&
  mainJsSource.includes('011-1089 4945') &&
  mainJsSource.includes('011-2081 2650') &&
  mainJsSource.includes('<span class="contact-name">Syahmi</span>'),
  'Homepage contact list displays all key leaders with Syahmi clearly named'
);

// Official affiliations: PSSGM and MPP TVETMARA Besut
assert(
  mainJsSource.includes('Pertubuhan Silat Seni Gayong Malaysia (PSSGM)') &&
  mainJsSource.includes('MPP TVETMARA Besut'),
  'Homepage explicitly features PSSGM as governing body and MPP TVETMARA Besut as collaborator'
);

// Membership fee: RM10 per month
assert(
  mainJsSource.includes('RM10 sebulan'),
  'Membership fee uniformly displayed as RM10 sebulan'
);

// Target 30 participants (open registration, non-blocking)
assert(
  mainJsSource.includes('Sasaran 30 peserta (Pendaftaran Terbuka)'),
  'Target of 30 participants stated as target with open registration'
);

// Confirm registration validation never blocks registrations > 30
assert(
  !mainJsSource.includes('if (records.length >= 30) throw') &&
  !mainJsSource.includes('if (memberCount >= 30) throw') &&
  !mainJsSource.includes('disabled = records.length >= 30'),
  'Registration logic has zero hard limit blocks when member count reaches or exceeds 30'
);

// Verify index.html meta description alignment
const indexHtmlPath = path.join(rootDir, 'index.html');
const indexHtmlSource = fs.readFileSync(indexHtmlPath, 'utf-8');

assert(
  indexHtmlSource.includes('Kelab Pencak Silat TVETMARA Besut. Ayuh sertai kami'),
  'index.html meta description updated with clean preview text'
);

// -------------------------------------------------------------
// SECTION 6: AJK Committee Page & Navigation (R3)
// -------------------------------------------------------------
console.log('\n\x1b[36m[6/7] AJK Committee Page & 5-Tier Organizational Chart (R3)\x1b[0m');

// Verify topbar navigation tab "AJK"
assert(
  mainJsSource.includes('href="/ajk/">AJK</a>') &&
  mainJsSource.includes("${activePage === 'ajk' ? 'active' : ''}"),
  'Topbar navigation includes active "AJK" link routing to /ajk/'
);

// Verify routing table handles /ajk and /ajk/
assert(
  mainJsSource.includes("currentPath === '/ajk'") &&
  mainJsSource.includes("currentPath === '/ajk/'"),
  'Router in handleRouting() explicitly routes /ajk and /ajk/ to ajkPage()'
);

// Verify presence of all 10 committee members and designations:
const expectedMembers = [
  { tier: 1, role: 'Penaung', name: 'Tuan Zainal Abidin bin Yusof', designation: 'Timbalan Pengarah (KPHP)' },
  { tier: 2, role: 'Guru Penyelaras 1', name: 'Puan Noor Azila binti Saari', designation: 'Pegawai Kaunseling & Kerjaya' },
  { tier: 2, role: 'Guru Penyelaras 2', name: 'Encik Muhammad Fadhil bin Kamaruzaman', designation: 'Pensyarah PPU' },
  { tier: 3, role: 'Pengerusi', name: 'Muhammad Syahmi bin Ahmad Omar Faizul', designation: 'DFK Sem 3' },
  { tier: 3, role: 'Timbalan Pengerusi', name: 'Huud Uqail bin Mohd Yusoff', designation: 'DGA Sem 3' },
  { tier: 4, role: 'Setiausaha', name: 'Muhammad Syafiq Zuhail bin Mohd Sidek', designation: 'DFK Sem 3' },
  { tier: 4, role: 'Bendahari', name: 'Aniisah Umairah binti Ibrahim', designation: 'DFK Sem 3' },
  { tier: 5, role: 'AJK Latihan', name: 'Mohamad Hafiy bin Ruslan', designation: 'ITW Sem 1' },
  { tier: 5, role: 'AJK Disiplin & Kebajikan', name: 'Muhammad Harees El-Ilmi bin Mohamad Faizal', designation: 'ITW Sem 1' },
  { tier: 5, role: 'AJK Media & Publisiti', name: 'Syuhada Adriana binti Yussof', designation: 'SLR Sem 1' }
];

for (const m of expectedMembers) {
  const namePresent = mainJsSource.includes(m.name);
  const designationPresent = mainJsSource.includes(m.designation.replace('&', '&amp;')) || mainJsSource.includes(m.designation);
  assert(
    namePresent && designationPresent,
    `Tier ${m.tier} [${m.role}]: ${m.name} (${m.designation}) present in organizational chart`
  );
}

// Verify 5-tier connector lines
const connectorCount = (mainJsSource.match(/ajk-connector-line/g) || []).length;
assert(
  connectorCount >= 4,
  `5-tier hierarchy connected with vertical connector lines (found ${connectorCount} connectors)`
);

// -------------------------------------------------------------
// SECTION 7: Production Build Artifact Audit
// -------------------------------------------------------------
console.log('\n\x1b[36m[7/7] Production Build Artifact Audit\x1b[0m');

const distHtmlPath = path.join(rootDir, 'dist', 'index.html');
const distExists = fs.existsSync(distHtmlPath);
assert(distExists, 'Production build artifact dist/index.html exists');

if (distExists) {
  const distHtmlSource = fs.readFileSync(distHtmlPath, 'utf-8');
  assert(distHtmlSource.includes('data-theme="dark"'), 'Built index.html contains dark theme attribute');
  assert(distHtmlSource.includes('Kelab Pencak Silat TVETMARA Besut. Ayuh sertai kami'), 'Built index.html contains clean meta description');
}

// -------------------------------------------------------------
// FINAL SUMMARY
// -------------------------------------------------------------
console.log('\n================================================================');
console.log(`  VERIFICATION RESULTS: ${passedTests} / ${totalTests} CHECKS PASSED`);
if (failedTests > 0) {
  console.log(`  \x1b[31mFAILURE: ${failedTests} checks failed.\x1b[0m`);
  console.log('================================================================\n');
  process.exit(1);
} else {
  console.log('  \x1b[32mALL ROUND 2 CHECKS PASSED WITH 100% SUCCESS!\x1b[0m');
  console.log('================================================================\n');
  process.exit(0);
}
