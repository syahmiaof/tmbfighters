import {
  supabase,
  registerMember,
  getPublicRegisteredMembers,
  loginAdmin,
  loginAthlete,
  getAthleteProfile,
  uploadAthletePhoto,
  getAdminDashboardData,
  updateMemberRecord,
  deleteMemberRecord,
  formatProgramSemester,
  parseProgramDetails,
  getSession,
  getUser,
  logout,
  maskIC,
  normalizeMatricNumber,
  validateMalaysianIC,
} from './lib/supabase.js';
import { listSampleRegistrations } from './data/registrations.js';
import { getAthleteAccountOverview } from './data/athlete-account.js';
import { initLekirBot } from './lib/chatbot.js';
import './style.css';

const app = document.querySelector('#app');
const banner = '/tmb-banner.png';
const logo = '/tmb-mark.png';

// Force dark theme permanently as mandated
document.documentElement.dataset.theme = 'dark';

let liveToastInterval = null;
let typewriterTimer = null;

export function whatsappUrl(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return 'https://wa.me/';
  const normalized = digits.startsWith('60')
    ? digits
    : digits.startsWith('0')
    ? `6${digits}`
    : `60${digits}`;
  return `https://wa.me/${normalized}`;
}

export function brandHeader(activePage = 'home') {
  return `<header class="topbar">
    <a class="brand" href="/" aria-label="TMB Fighters — Homepage">
      <img src="${logo}" alt="TMB Fighters Mark" />
      <span>TMB <b>FIGHTERS</b></span>
    </a>
    <nav aria-label="Navigasi utama">
      <a class="nav-link ${activePage === 'home' ? 'active' : ''}" href="/">Homepage</a>
      <a class="nav-link ${activePage === 'ajk' ? 'active' : ''}" href="/ajk/">AJK</a>
      <a class="nav-link ${activePage === 'login' ? 'active' : ''}" href="/login/">Login</a>
    </nav>
  </header>`;
}

function siteFooter() {
  return `<footer class="site-footer">
    <p>Built by <a href="https://syahmiaof.my" target="_blank" rel="noopener noreferrer">SYAHMIAOF.MY</a></p>
  </footer>`;
}

// ==========================================
// VIEW 1: REGISTRATION PAGE (HOMEPAGE '/')
// ==========================================
export async function registrationPage() {
  stopLiveToast();
  if (typewriterTimer) clearTimeout(typewriterTimer);

  app.innerHTML = `
    ${brandHeader('home')}
    <main class="page-shell">
      <!-- HERO SECTION -->
      <section class="hero-panel">
        <img class="hero-banner" src="${banner}" alt="Kelab Pencak Silat TVETMARA Besut — TMB Fighters" />
        <div class="hero-layout">
          <div class="hero-copy">
            <div class="eyebrow"><span></span> AYUH SERTAI KAMI</div>
            <h1 class="hero-title">
              PENCARIAN ATLET<br />
              <span class="typewriter-wrap">
                <em id="typewriter-text"></em>
                <span class="typewriter-cursor" aria-hidden="true">|</span>
              </span>
            </h1>
            <p class="organizer">Kelab Pencak Silat TVETMARA Besut dengan kerjasama Exco Sukan dan Rekreasi, MPP TVETMARA Besut</p>
            <div class="chips">
              <span>Silat Seni</span>
              <span>Silat Olahraga</span>
              <span>RM10 sebulan</span>
              <span>Isnin &amp; Rabu (9:00 - 11:00 Malam)</span>
              <span>Latihan Bermula Sem Depan</span>
              <span>Jurulatih Bertauliah: Coach Syahmi</span>
              <span>Naungan Rasmi: PSSGM</span>
              <span>Sasaran 30 peserta (Pendaftaran Terbuka)</span>
            </div>
            <p class="intro">Disini tempat untuk kita bina disiplin dan asah keberanian. Isi borang di bawah untuk bersama TMB Fighters.</p>
            <a class="button button-red hero-cta" href="#borang">MULA PENDAFTARAN <span aria-hidden="true">↓</span></a>
          </div>

          <aside class="hero-contact-card" id="hubungi-kami">
            <div class="training-info-box" style="margin-bottom: 16px; padding: 14px 16px; background: rgba(220, 38, 38, 0.12); border: 1px solid rgba(220, 38, 38, 0.35); border-radius: 14px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span style="font-size: 16px;">🥋</span>
                <strong style="font-family: 'Barlow Condensed', sans-serif; font-size: 15px; letter-spacing: 0.05em; color: #fca5a5; text-transform: uppercase;">Jadual Latihan Rasmi</strong>
              </div>
              <p style="margin: 0; font-size: 13.5px; color: #fff; font-weight: 700;">Isnin &amp; Rabu (9:00 – 11:00 Malam)</p>
              <p style="margin: 5px 0 0; font-size: 11.5px; color: #d4d4d8; line-height: 1.4;">
                Latihan bermula semester depan di TVETMARA Besut. Di bawah naungan <strong>Pertubuhan Silat Seni Gayong Malaysia (PSSGM)</strong> bersama jurulatih bertauliah <strong>Coach Syahmi</strong>!
              </p>
            </div>
            <div class="contact-header">
              <span class="contact-header-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.83a8.17 8.17 0 0 1-5.82 2.41c-1.42 0-2.82-.37-4.06-1.1l-.29-.17-3.02.79.81-2.94-.19-.3a8.19 8.19 0 0 1-1.26-4.47c0-4.54 3.7-8.24 8.24-8.24m-3.56 4.76c-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.43 0 1.44 1.05 2.82 1.2 3.01.15.2 2.05 3.14 4.98 4.4 2.43 1.05 2.92.84 3.45.79.53-.05 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.27-.2-.56-.35-.3-.15-1.7-.84-1.97-.94-.26-.09-.46-.15-.65.15-.2.29-.76.94-.93 1.13-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.29-.02-.45.13-.6.13-.13.3-.35.44-.52.15-.17.2-.29.3-.49.09-.2.05-.37-.02-.52-.08-.15-.65-1.57-.9-2.15-.24-.56-.49-.49-.67-.5"/>
                </svg>
              </span>
              <div>
                <p class="contact-eyebrow">HUBUNGI KAMI</p>
                <h3 class="contact-title">Sebarang pertanyaan, boleh hubungi:</h3>
              </div>
            </div>
            <div class="contact-list">
              <a class="contact-item" href="https://wa.me/60139326767" target="_blank" rel="noopener noreferrer">
                <span class="contact-wa-badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.83a8.17 8.17 0 0 1-5.82 2.41c-1.42 0-2.82-.37-4.06-1.1l-.29-.17-3.02.79.81-2.94-.19-.3a8.19 8.19 0 0 1-1.26-4.47c0-4.54 3.7-8.24 8.24-8.24m-3.56 4.76c-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.43 0 1.44 1.05 2.82 1.2 3.01.15.2 2.05 3.14 4.98 4.4 2.43 1.05 2.92.84 3.45.79.53-.05 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.27-.2-.56-.35-.3-.15-1.7-.84-1.97-.94-.26-.09-.46-.15-.65.15-.2.29-.76.94-.93 1.13-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.29-.02-.45.13-.6.13-.13.3-.35.44-.52.15-.17.2-.29.3-.49.09-.2.05-.37-.02-.52-.08-.15-.65-1.57-.9-2.15-.24-.56-.49-.49-.67-.5"/></svg>
                </span>
                <div class="contact-info">
                  <span class="contact-name">Pn Azila</span>
                  <span class="contact-phone">013-932 6767</span>
                </div>
                <span class="contact-arrow" aria-hidden="true">↗</span>
              </a>
              <a class="contact-item" href="https://wa.me/601110894945" target="_blank" rel="noopener noreferrer">
                <span class="contact-wa-badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.83a8.17 8.17 0 0 1-5.82 2.41c-1.42 0-2.82-.37-4.06-1.1l-.29-.17-3.02.79.81-2.94-.19-.3a8.19 8.19 0 0 1-1.26-4.47c0-4.54 3.7-8.24 8.24-8.24m-3.56 4.76c-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.43 0 1.44 1.05 2.82 1.2 3.01.15.2 2.05 3.14 4.98 4.4 2.43 1.05 2.92.84 3.45.79.53-.05 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.27-.2-.56-.35-.3-.15-1.7-.84-1.97-.94-.26-.09-.46-.15-.65.15-.2.29-.76.94-.93 1.13-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.29-.02-.45.13-.6.13-.13.3-.35.44-.52.15-.17.2-.29.3-.49.09-.2.05-.37-.02-.52-.08-.15-.65-1.57-.9-2.15-.24-.56-.49-.49-.67-.5"/></svg>
                </span>
                <div class="contact-info">
                  <span class="contact-name">En Fadhil</span>
                  <span class="contact-phone">011-1089 4945</span>
                </div>
                <span class="contact-arrow" aria-hidden="true">↗</span>
              </a>
              <a class="contact-item" href="https://wa.me/60107965236" target="_blank" rel="noopener noreferrer">
                <span class="contact-wa-badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.83a8.17 8.17 0 0 1-5.82 2.41c-1.42 0-2.82-.37-4.06-1.1l-.29-.17-3.02.79.81-2.94-.19-.3a8.19 8.19 0 0 1-1.26-4.47c0-4.54 3.7-8.24 8.24-8.24m-3.56 4.76c-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.43 0 1.44 1.05 2.82 1.2 3.01.15.2 2.05 3.14 4.98 4.4 2.43 1.05 2.92.84 3.45.79.53-.05 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.27-.2-.56-.35-.3-.15-1.7-.84-1.97-.94-.26-.09-.46-.15-.65.15-.2.29-.76.94-.93 1.13-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.29-.02-.45.13-.6.13-.13.3-.35.44-.52.15-.17.2-.29.3-.49.09-.2.05-.37-.02-.52-.08-.15-.65-1.57-.9-2.15-.24-.56-.49-.49-.67-.5"/></svg>
                </span>
                <div class="contact-info">
                  <span class="contact-name">Coach Syahmi (Jurulatih Bertauliah)</span>
                  <span class="contact-phone">010-796 5236</span>
                </div>
                <span class="contact-arrow" aria-hidden="true">↗</span>
              </a>
              <a class="contact-item" href="https://wa.me/601120812650" target="_blank" rel="noopener noreferrer">
                <span class="contact-wa-badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.83a8.17 8.17 0 0 1-5.82 2.41c-1.42 0-2.82-.37-4.06-1.1l-.29-.17-3.02.79.81-2.94-.19-.3a8.19 8.19 0 0 1-1.26-4.47c0-4.54 3.7-8.24 8.24-8.24m-3.56 4.76c-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.43 0 1.44 1.05 2.82 1.2 3.01.15.2 2.05 3.14 4.98 4.4 2.43 1.05 2.92.84 3.45.79.53-.05 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.27-.2-.56-.35-.3-.15-1.7-.84-1.97-.94-.26-.09-.46-.15-.65.15-.2.29-.76.94-.93 1.13-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.29-.02-.45.13-.6.13-.13.3-.35.44-.52.15-.17.2-.29.3-.49.09-.2.05-.37-.02-.52-.08-.15-.65-1.57-.9-2.15-.24-.56-.49-.49-.67-.5"/></svg>
                </span>
                <div class="contact-info">
                  <span class="contact-name">Hud</span>
                  <span class="contact-phone">011-2081 2650</span>
                </div>
                <span class="contact-arrow" aria-hidden="true">↗</span>
              </a>
            </div>
          </aside>
        </div>
        <div class="hero-mark" aria-hidden="true">TMB<br /><span>FIGHT</span></div>
      </section>

      <!-- REGISTRATION FORM -->
      <section class="form-section" id="borang">
        <div class="section-heading">
          <div>
            <div class="eyebrow">BORANG PENDAFTARAN</div>
            <h2>Butiran atlet</h2>
          </div>
          <p class="required-note"><span>*</span> Wajib diisi</p>
        </div>
        <form id="registration-form" novalidate>
          <div class="fields-grid">
            <div class="field">
              <label for="fullName">01 <span>NAMA PENUH</span> <b>*</b></label>
              <input id="fullName" name="fullName" type="text" autocomplete="name" placeholder="NAMA MENGIKUT KAD PENGENALAN" style="text-transform: uppercase;" required />
              <small class="field-error" aria-live="polite"></small>
            </div>
            <div class="field">
              <label for="icNumber">02 <span>NO. KAD PENGENALAN (IC)</span> <b>*</b></label>
              <input id="icNumber" name="icNumber" type="text" inputmode="numeric" maxlength="14" placeholder="Contoh: 021119-02-0731" required />
              <small class="field-error" aria-live="polite"></small>
            </div>
            <div class="field">
              <label for="matricNumber">03 <span>NO. MATRIK PELAJAR</span> <b>*</b></label>
              <input id="matricNumber" name="matricNumber" type="text" placeholder="Contoh: DFK250234" style="text-transform: uppercase;" required />
              <small class="field-error" aria-live="polite"></small>
            </div>
            <div class="field">
              <label for="program">04 <span>PROGRAM &amp; SEMESTER</span> <b>*</b></label>
              <div class="program-semester-grid">
                <select id="program" name="programCode" aria-label="Program Pengajian" required>
                  <option value="" disabled selected>Pilih Program</option>
                  <option value="DFK">DFK</option>
                  <option value="DGA">DGA</option>
                  <option value="ITW">ITW</option>
                  <option value="SLR">SLR</option>
                </select>
                <select id="semester" name="semester" aria-label="Semester Pengajian" required>
                  <option value="" disabled selected>Pilih Semester</option>
                  <option value="Sem 1">Sem 1</option>
                  <option value="Sem 2">Sem 2</option>
                  <option value="Sem 3">Sem 3</option>
                  <option value="Sem 4">Sem 4</option>
                  <option value="Sem 5">Sem 5</option>
                </select>
              </div>
              <small class="field-error" aria-live="polite"></small>
            </div>
            <div class="field">
              <label for="phone">05 <span>NOMBOR TELEFON (WHATSAPP)</span> <b>*</b></label>
              <input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="Contoh: 012 345 6789" required />
              <small class="field-error" aria-live="polite"></small>
            </div>
            <div class="field">
              <label for="email">06 <span>EMAIL AKTIF</span> <b>*</b></label>
              <input id="email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="nama@email.com" required />
              <small class="field-error" aria-live="polite"></small>
            </div>
            <fieldset class="field choice-field">
              <legend><span class="field-number">07</span> JANTINA <b>*</b></legend>
              <div class="choice-row">
                <label class="choice"><input type="radio" name="gender" value="Lelaki" required /><span>Lelaki</span></label>
                <label class="choice"><input type="radio" name="gender" value="Perempuan" /><span>Perempuan</span></label>
              </div>
              <small class="field-error" data-error="gender" aria-live="polite"></small>
            </fieldset>
            <fieldset class="field choice-field">
              <legend><span class="field-number">08</span> MASALAH KESIHATAN <b>*</b></legend>
              <div class="choice-row">
                <label class="choice"><input type="radio" name="health" value="Tiada" required /><span>Tiada</span></label>
                <label class="choice"><input type="radio" name="health" value="Ada" /><span>Ada</span></label>
              </div>
              <div class="health-details" hidden>
                <label class="sr-only" for="healthDetails">Nyatakan masalah kesihatan</label>
                <input id="healthDetails" name="healthDetails" type="text" maxlength="140" placeholder="Nyatakan masalah kesihatan" />
                <small class="field-error" aria-live="polite"></small>
              </div>
              <small class="field-error" data-error="health" aria-live="polite"></small>
            </fieldset>
            <fieldset class="field choice-field">
              <legend><span class="field-number">09</span> PENGALAMAN LATIHAN SILAT / PERTANDINGAN SILAT <b>*</b></legend>
              <div class="choice-row">
                <label class="choice"><input type="radio" name="experience" value="Ada" required /><span>Ada</span></label>
                <label class="choice"><input type="radio" name="experience" value="Tiada" /><span>Tiada</span></label>
              </div>
              <small class="field-error" data-error="experience" aria-live="polite"></small>
            </fieldset>
          </div>
          <div id="registration-general-error" class="avatar-feedback error" style="margin-top: 14px;" hidden aria-live="polite"></div>
          <div class="form-footer">
            <p><span>*</span> Pastikan nombor WhatsApp dan email boleh dihubungi.</p>
            <button class="button button-red submit-button" type="submit">HANTAR PENDAFTARAN <span aria-hidden="true">↗</span></button>
          </div>
        </form>
      </section>

      <!-- PUBLIC REGISTRATION TRACKER SECTION -->
      <section class="tracker-section" id="senarai-peserta">
        <div class="tracker-header">
          <div>
            <div class="eyebrow"><span></span> SEMAKAN PENDAFTARAN AWAM</div>
            <h2>SENARAI ATLET TELAH MENDAFTAR</h2>
            <p class="tracker-subtitle">Pelajar yang telah submit borang boleh semak status pendaftaran di bawah. Hanya nama, program &amp; semester dipaparkan demi privasi data.</p>
          </div>
          <div class="tracker-badge">
            <span class="badge-dot"></span>
            <span id="tracker-count-badge">Memuatkan...</span>
          </div>
        </div>
        <div class="tracker-search-bar">
          <span class="search-icon" aria-hidden="true">⌕</span>
          <input id="tracker-search-input" type="search" placeholder="Cari nama anda atau program (cth: Amirul, DFK, SLR, ITW)..." aria-label="Cari nama atau program" />
        </div>
        <div class="tracker-table-wrap">
          <table class="tracker-table">
            <thead>
              <tr>
                <th style="width: 48px;">No.</th>
                <th>Nama Atlet</th>
                <th>Program &amp; Semester</th>
                <th>Tarikh Daftar</th>
                <th style="text-align: right;">Status</th>
              </tr>
            </thead>
            <tbody id="tracker-table-body">
              <tr><td colspan="5" style="text-align:center; padding: 24px; color: #888;">Memuatkan senarai peserta...</td></tr>
            </tbody>
          </table>
          <div id="tracker-empty" class="tracker-empty" hidden>
            Tiada nama sepadan dijumpai. Pastikan ejaan nama atau program betul.
          </div>
        </div>
        <div class="tracker-footer">
          <span id="tracker-visible-note">Memuatkan rekod...</span>
          <a class="tracker-register-link" href="#borang">Belum mendaftar? Isi borang sekarang ↑</a>
        </div>
      </section>
    </main>

    <!-- LIVE SOCIAL PROOF TOAST POPUP (BOTTOM-LEFT) -->
    <div id="live-toast-container" class="live-toast-container" aria-live="polite">
      <div class="live-toast-card">
        <div class="live-toast-icon-wrap" aria-hidden="true">
          <span class="live-toast-pulse"></span>
          <span class="live-toast-emoji">🥋</span>
        </div>
        <div class="live-toast-body">
          <div class="live-toast-header">
            <span class="live-toast-tag">PENDAFTARAN BAHARU</span>
            <span class="live-toast-time" id="toast-time">Baru sahaja</span>
          </div>
          <p class="live-toast-message">
            🎉 <strong id="toast-name"></strong> (<span id="toast-prog"></span>) telah mendaftar sebagai ahli!
          </p>
        </div>
        <button class="live-toast-close" id="toast-close" type="button" aria-label="Tutup notifikasi">×</button>
      </div>
    </div>

    ${siteFooter()}
  `;

  setupForm();
  setupTypewriter();

  // Asynchronously query safe public view from Supabase
  try {
    const { members, error } = await getPublicRegisteredMembers();
    const publicList =
      !error && Array.isArray(members)
        ? members.map(m => ({
            id: m.id,
            name: m.full_name,
            program: m.program,
            registeredAt: m.created_at ? m.created_at.split('T')[0] : '2026-11-04',
            status: m.status || 'Diterima',
          }))
        : [];

    setupTracker(publicList);
    startLiveToast(publicList);
  } catch (err) {
    console.warn('Error loading tracker from database:', err);
    setupTracker([]);
  }
}

function setupTracker(records) {
  const tbody = document.querySelector('#tracker-table-body');
  const searchInput = document.querySelector('#tracker-search-input');
  const emptyState = document.querySelector('#tracker-empty');
  const countBadge = document.querySelector('#tracker-count-badge');
  const visibleNote = document.querySelector('#tracker-visible-note');

  if (!tbody || !searchInput) return;

  if (countBadge) {
    countBadge.textContent = records.length <= 30
      ? `${records.length} / 30 Sasaran (Pendaftaran Terbuka)`
      : `${records.length} Peserta (Sasaran 30 Dicapai — Pendaftaran Terbuka)`;
  }

  function renderRows(list) {
    if (list.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) {
        emptyState.textContent = 'Belum ada pendaftaran. Jadilah yang pertama mendaftar di atas!';
        emptyState.hidden = false;
      }
      if (visibleNote) visibleNote.textContent = '0 atlet berdaftar';
      return;
    }

    if (emptyState) emptyState.hidden = true;
    tbody.innerHTML = list
      .map((item, idx) => {
        const initials = item.name
          .split(' ')
          .map(n => n[0])
          .filter(Boolean)
          .slice(0, 2)
          .join('')
          .toUpperCase();
        const formattedDate = item.registeredAt
          ? new Intl.DateTimeFormat('ms-MY', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }).format(new Date(`${item.registeredAt}T00:00:00`))
          : '04 Nov 2026';

        return `
        <tr>
          <td class="tracker-num">${String(idx + 1).padStart(2, '0')}</td>
          <td>
            <div class="tracker-athlete-cell">
              <span class="tracker-avatar" aria-hidden="true">${initials}</span>
              <div class="tracker-athlete-info">
                <strong>${item.name}</strong>
              </div>
            </div>
          </td>
          <td>
            <span class="tracker-program-tag">${item.program}</span>
          </td>
          <td class="tracker-date">${formattedDate}</td>
          <td style="text-align: right;">
            <span class="tracker-status-badge ${item.status === 'Semakan' ? 'review' : 'accepted'}">
              <span class="tracker-badge-dot"></span>
              ${item.status === 'Semakan' ? 'Dalam Semakan' : 'Disahkan'}
            </span>
          </td>
        </tr>
      `;
      })
      .join('');

    if (visibleNote) {
      visibleNote.textContent = `Memaparkan ${list.length} daripada ${records.length} rekod atlet berdaftar`;
    }
  }

  renderRows(records);

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      renderRows(records);
      return;
    }
    const filtered = records.filter(
      r =>
        r.name.toLowerCase().includes(query) ||
        r.program.toLowerCase().includes(query)
    );
    renderRows(filtered);
  });
}

function startLiveToast(records) {
  stopLiveToast();
  const container = document.querySelector('#live-toast-container');
  const toastName = document.querySelector('#toast-name');
  const toastProg = document.querySelector('#toast-prog');
  const toastTime = document.querySelector('#toast-time');
  const toastClose = document.querySelector('#toast-close');

  if (!container || !toastName || !records || records.length === 0) {
    if (container) container.style.display = 'none';
    return;
  }
  container.style.display = '';

  let currentIndex = 0;
  let isPaused = false;
  const timeLabels = ['Baru sahaja', '1 minit lalu', '3 minit lalu', '5 minit lalu', '10 minit lalu'];

  if (toastClose) {
    toastClose.addEventListener('click', () => {
      container.classList.remove('is-visible');
      isPaused = true;
      setTimeout(() => {
        isPaused = false;
      }, 60000);
    });
  }

  function cycle() {
    if (isPaused || !container.isConnected) return;

    const person = records[currentIndex % records.length];
    currentIndex++;

    container.classList.remove('is-visible');

    setTimeout(() => {
      if (!container.isConnected || isPaused) return;
      toastName.textContent = person.name;
      toastProg.textContent = person.program;
      toastTime.textContent = timeLabels[Math.floor(Math.random() * timeLabels.length)];
      container.classList.add('is-visible');

      setTimeout(() => {
        if (container.isConnected) {
          container.classList.remove('is-visible');
        }
      }, 4800);
    }, 600);
  }

  setTimeout(cycle, 3500);
  liveToastInterval = setInterval(cycle, 16000);
}

function stopLiveToast() {
  if (liveToastInterval) {
    clearInterval(liveToastInterval);
    liveToastInterval = null;
  }
}

function setupTypewriter() {
  if (typewriterTimer) clearTimeout(typewriterTimer);
  const el = document.querySelector('#typewriter-text');
  if (!el) return;

  const words = ['BAHARU', 'SILAT SENI', 'SILAT OLAHRAGA', 'TMB FIGHTERS'];
  let wordIdx = 0;
  let charIdx = 0;
  let isDeleting = false;

  el.textContent = '';

  function tick() {
    if (!el.isConnected) return;
    const currentWord = words[wordIdx];

    if (!isDeleting) {
      charIdx++;
      el.textContent = currentWord.substring(0, charIdx);

      if (charIdx === currentWord.length) {
        isDeleting = true;
        typewriterTimer = setTimeout(tick, 1900);
        return;
      }
      typewriterTimer = setTimeout(tick, 90);
    } else {
      charIdx--;
      el.textContent = currentWord.substring(0, charIdx);

      if (charIdx === 0) {
        isDeleting = false;
        wordIdx = (wordIdx + 1) % words.length;
        typewriterTimer = setTimeout(tick, 350);
        return;
      }
      typewriterTimer = setTimeout(tick, 50);
    }
  }

  typewriterTimer = setTimeout(tick, 350);
}

function formatMalaysianIC(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 12);
  if (digits.length <= 6) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 12)}`;
}

function setupForm() {
  const form = document.querySelector('#registration-form');
  if (!form) return;

  const fullNameInput = form.querySelector('#fullName');
  const icInput = form.querySelector('#icNumber');
  const matricInput = form.querySelector('#matricNumber');
  const programCodeSelect = form.querySelector('#program');
  const semesterSelect = form.querySelector('#semester');

  // Auto-uppercase Full Name as the student types
  if (fullNameInput) {
    fullNameInput.addEventListener('input', () => {
      fullNameInput.value = fullNameInput.value.toUpperCase();
    });
  }

  // Auto-format IC Number into 000000-00-0000 as the student types
  if (icInput) {
    icInput.addEventListener('input', e => {
      e.target.value = formatMalaysianIC(e.target.value);
    });
    icInput.addEventListener('blur', e => {
      e.target.value = formatMalaysianIC(e.target.value);
    });
  }

  // Auto-uppercase and strip spaces for Matric Number
  if (matricInput) {
    matricInput.addEventListener('input', () => {
      matricInput.value = matricInput.value.toUpperCase().replace(/\s+/g, '');
    });
  }

  const healthInputs = [...form.querySelectorAll('[name="health"]')];
  const healthWrap = form.querySelector('.health-details');
  const healthDetails = form.querySelector('#healthDetails');
  const generalError = form.querySelector('#registration-general-error');

  healthInputs.forEach(input =>
    input.addEventListener('change', () => {
      const show = input.value === 'Ada' && input.checked;
      if (show) {
        healthWrap.hidden = false;
        healthDetails.required = true;
        healthDetails.focus();
      } else if (input.checked) {
        healthWrap.hidden = true;
        healthDetails.required = false;
        healthDetails.value = '';
        clearError(healthDetails);
      }
    })
  );

  form.querySelectorAll('input, select').forEach(control => {
    const handleClear = () => {
      clearError(control);
      if (generalError) generalError.hidden = true;
    };
    control.addEventListener('input', handleClear);
    control.addEventListener('change', handleClear);
  });
  form.querySelectorAll('input[type="radio"]').forEach(input =>
    input.addEventListener('change', () => {
      clearChoiceError(input.name);
      if (generalError) generalError.hidden = true;
    })
  );

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const values = new FormData(form);

    const fullName = (values.get('fullName')?.trim() || '').toUpperCase();
    const rawIc = (values.get('icNumber') || '').replace(/\D/g, '').slice(0, 12);
    const icNumber = rawIc.length === 12
      ? `${rawIc.slice(0, 6)}-${rawIc.slice(6, 8)}-${rawIc.slice(8, 12)}`
      : (values.get('icNumber')?.trim() || '');
    const matricNumber = normalizeMatricNumber(values.get('matricNumber') || '');
    const programCode = values.get('programCode')?.trim() || '';
    const semester = values.get('semester')?.trim() || '';
    const combinedProgram = (programCode && semester) ? `${programCode} ${semester}` : '';
    const program = combinedProgram || (values.get('program')?.trim() || '');
    const phone = values.get('phone')?.trim() || '';
    const email = values.get('email')?.trim() || '';
    const gender = values.get('gender');
    const health = values.get('health');
    const healthDetailsVal = values.get('healthDetails')?.trim() || '';
    const experience = values.get('experience');

    const checks = [
      ['fullName', fullName ? '' : 'Masukkan nama penuh anda.'],
      [
        'icNumber',
        validateMalaysianIC(icNumber)
          ? ''
          : 'Masukkan nombor kad pengenalan (IC) yang sah (12 digit, cth: 040115-01-1234).',
      ],
      [
        'matricNumber',
        matricNumber && matricNumber.length >= 4
          ? ''
          : 'Masukkan no. matrik pelajar yang sah (cth: DFK2401).',
      ],
      [
        'programCode',
        programCode ? '' : (!semester ? 'Pilih program dan semester anda.' : 'Pilih program pengajian anda.'),
      ],
      [
        'semester',
        semester ? '' : (!programCode ? 'Pilih program dan semester anda.' : 'Pilih semester pengajian anda.'),
      ],
      [
        'phone',
        validPhone(phone)
          ? ''
          : 'Masukkan nombor WhatsApp yang sah (contoh: 012 345 6789).',
      ],
      ['email', validEmail(email) ? '' : 'Masukkan alamat email yang sah.'],
      [
        'healthDetails',
        health === 'Ada' && !healthDetailsVal ? 'Nyatakan masalah kesihatan anda.' : '',
      ],
    ];

    checks.forEach(([name, error]) => error && showError(form.elements.namedItem(name), error));
    for (const name of ['gender', 'health', 'experience']) {
      if (!values.get(name)) showChoiceError(name, 'Pilih satu jawapan untuk teruskan.');
    }

    const firstError = form.querySelector('.field-error:not(:empty)');
    if (firstError) {
      const field = firstError.closest('.field');
      const target = field?.querySelector('[aria-invalid="true"]') ||
                     field?.querySelector('input:not([type="hidden"]), select');
      target?.focus();
      return;
    }

    const submitBtn = form.querySelector('.submit-button');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'SEDANG MENGHANTAR... <span aria-hidden="true">⏳</span>';
    if (generalError) generalError.hidden = true;

    try {
      const { data, error } = await registerMember({
        fullName,
        icNumber,
        matricNumber,
        program,
        phone,
        email,
        gender,
        health,
        healthDetails: healthDetailsVal,
        experience,
      });

      if (error) {
        if (generalError) {
          generalError.textContent = error.message;
          generalError.hidden = false;
        }
        if (error.message.includes('No. Matrik')) {
          showError(form.elements.namedItem('matricNumber'), error.message);
        } else if (error.message.includes('No. Kad Pengenalan')) {
          showError(form.elements.namedItem('icNumber'), error.message);
        } else if (error.message.includes('Nama atlet')) {
          showError(form.elements.namedItem('fullName'), error.message);
        } else if (error.message.includes('Nombor telefon')) {
          showError(form.elements.namedItem('phone'), error.message);
        } else if (error.message.includes('email')) {
          showError(form.elements.namedItem('email'), error.message);
        }
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        return;
      }

      showSuccess({ fullName, matricNumber });
    } catch (err) {
      if (generalError) {
        generalError.textContent = err.message || 'Ralat berlaku semasa pendaftaran.';
        generalError.hidden = false;
      }
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
}

function validPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 13;
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());
}

function showError(input, message) {
  const error = input?.closest('.field')?.querySelector('.field-error');
  if (error) error.textContent = message;
  input?.setAttribute('aria-invalid', 'true');
}

function clearError(input) {
  input.removeAttribute('aria-invalid');
  const error = input.closest('.field')?.querySelector('.field-error');
  if (error && !error.dataset.error) error.textContent = '';
}

function showChoiceError(name, message) {
  const error = document.querySelector(`[data-error="${name}"]`);
  if (error) error.textContent = message;
}

function clearChoiceError(name) {
  const error = document.querySelector(`[data-error="${name}"]`);
  if (error) error.textContent = '';
}

function showSuccess({ fullName, matricNumber }) {
  stopLiveToast();
  app.innerHTML = `
    ${brandHeader('home')}
    <main class="success-page">
      <div class="success-card">
        <div class="success-icon" aria-hidden="true">
          <svg viewBox="0 0 48 48"><path d="m11 25 9 9 18-20" /></svg>
        </div>
        <p class="eyebrow">LANGKAH PERTAMA SELESAI</p>
        <h1>🎉 Syabas! Pendaftaran ${fullName || 'anda'} telah diterima.</h1>
        <div class="success-matric-pill">
          <span>NO. MATRIK PELAJAR (ID AHLI)</span>
          <strong>${matricNumber}</strong>
        </div>
        <p class="success-copy">
          Sila simpan No. Matrik ini. Akses akaun atlet dan kata laluan akan diberikan selepas pendaftaran disahkan oleh pihak pengurusan.<br />
          Jom masuk group WhatsApp rasmi untuk info latihan dan aktiviti.
        </p>
        <a class="button button-red whatsapp-cta" href="https://chat.whatsapp.com/EYzzSlyOPikKmtgbyBUulP?s=cl&amp;p=i&amp;mlu=4&amp;ilr=4&amp;iam=2" target="_blank" rel="noopener noreferrer">
          <span class="wa-symbol">◉</span> SERTAI GROUP WHATSAPP <span aria-hidden="true">↗</span>
        </a>
        <div class="success-actions">
          <a class="back-link" href="/#senarai-peserta">← Lihat nama dalam senarai peserta berdaftar</a>
        </div>
      </div>
    </main>
    ${siteFooter()}
  `;
}

// ==========================================
// VIEW: AJK (ORGANISASI) PAGE ('/ajk/')
// ==========================================
export function ajkPage() {
  stopLiveToast();
  window.scrollTo(0, 0);
  app.innerHTML = `
    ${brandHeader('ajk')}
    <main class="ajk-page">
      <header class="ajk-header">
        <p class="eyebrow">TMB FIGHTERS · CARTA ORGANISASI</p>
        <h1>Barisan Kepimpinan Kelab Silat</h1>
        <p class="ajk-header-sub">
          Kelab Pencak Silat TVETMARA Besut beroperasi di bawah naungan rasmi <strong>Pertubuhan Silat Seni Gayong Malaysia (PSSGM)</strong> 
          dengan kerjasama Exco Sukan &amp; Rekreasi, Majlis Perwakilan Pelajar (MPP) TVETMARA Besut.
        </p>
      </header>

      <div class="ajk-tree">
        <!-- Level 1: Penaung -->
        <div class="ajk-level">
          <span class="ajk-level-title">Penaung Kelab</span>
          <div class="ajk-cards-grid">
            <div class="ajk-card ajk-card-highlight">
              <span class="ajk-card-role-badge">Penaung</span>
              <h3 class="ajk-card-name">Tuan Zainal Abidin bin Yusof</h3>
              <p class="ajk-card-detail">Timbalan Pengarah (KPHP)</p>
              <span class="ajk-card-tag">Pengurusan Tertinggi TVETMARA</span>
            </div>
          </div>
        </div>

        <div class="ajk-connector-line"></div>

        <!-- Level 2: Guru Penyelaras -->
        <div class="ajk-level">
          <span class="ajk-level-title">Guru Penyelaras</span>
          <div class="ajk-cards-grid">
            <div class="ajk-card">
              <span class="ajk-card-role-badge">Guru Penyelaras 1</span>
              <h3 class="ajk-card-name">Puan Noor Azila binti Saari</h3>
              <p class="ajk-card-detail">Pegawai Kaunseling &amp; Kerjaya</p>
              <span class="ajk-card-tag">Penyelaras Kelab</span>
            </div>
            <div class="ajk-card">
              <span class="ajk-card-role-badge">Guru Penyelaras 2</span>
              <h3 class="ajk-card-name">Encik Muhammad Fadhil bin Kamaruzaman</h3>
              <p class="ajk-card-detail">Pensyarah PPU</p>
              <span class="ajk-card-tag">Penyelaras Kelab</span>
            </div>
          </div>
        </div>

        <div class="ajk-connector-line"></div>

        <!-- Level 3: Kepimpinan Tertinggi Pelajar -->
        <div class="ajk-level">
          <span class="ajk-level-title">Kepimpinan Tertinggi Pelajar</span>
          <div class="ajk-cards-grid">
            <div class="ajk-card ajk-card-highlight">
              <span class="ajk-card-role-badge">Pengerusi &amp; Jurulatih</span>
              <h3 class="ajk-card-name">Muhammad Syahmi bin Ahmad Omar Faizul</h3>
              <p class="ajk-card-detail">DFK Sem 3 · Jurulatih Bertauliah PSSGM</p>
              <span class="ajk-card-tag">Ketua Pasukan / Coach</span>
            </div>
            <div class="ajk-card">
              <span class="ajk-card-role-badge">Timbalan Pengerusi</span>
              <h3 class="ajk-card-name">Huud Uqail bin Mohd Yusoff</h3>
              <p class="ajk-card-detail">DGA Sem 3</p>
              <span class="ajk-card-tag">Timbalan Ketua Pasukan</span>
            </div>
          </div>
        </div>

        <div class="ajk-connector-line"></div>

        <!-- Level 4: Sekretariat & Kewangan -->
        <div class="ajk-level">
          <span class="ajk-level-title">Sekretariat &amp; Kewangan</span>
          <div class="ajk-cards-grid">
            <div class="ajk-card">
              <span class="ajk-card-role-badge">Setiausaha</span>
              <h3 class="ajk-card-name">Muhammad Syafiq Zuhail bin Mohd Sidek</h3>
              <p class="ajk-card-detail">DFK Sem 3</p>
              <span class="ajk-card-tag">Pengurusan Rekod &amp; Dokumentasi</span>
            </div>
            <div class="ajk-card">
              <span class="ajk-card-role-badge">Bendahari</span>
              <h3 class="ajk-card-name">Aniisah Umairah binti Ibrahim</h3>
              <p class="ajk-card-detail">DFK Sem 3</p>
              <span class="ajk-card-tag">Pengurusan Yuran (RM10/bln)</span>
            </div>
          </div>
        </div>

        <div class="ajk-connector-line"></div>

        <!-- Level 5: Barisan Exco & AJK Pelaksana -->
        <div class="ajk-level">
          <span class="ajk-level-title">Barisan Exco &amp; AJK Pelaksana</span>
          <div class="ajk-cards-grid">
            <div class="ajk-card">
              <span class="ajk-card-role-badge">AJK Latihan</span>
              <h3 class="ajk-card-name">Mohamad Hafiy bin Ruslan</h3>
              <p class="ajk-card-detail">ITW Sem 1</p>
              <span class="ajk-card-tag">Logistik &amp; Gelanggang Silat</span>
            </div>
            <div class="ajk-card">
              <span class="ajk-card-role-badge">AJK Disiplin &amp; Kebajikan</span>
              <h3 class="ajk-card-name">Muhammad Harees El-Ilmi bin Mohamad Faizal</h3>
              <p class="ajk-card-detail">ITW Sem 1</p>
              <span class="ajk-card-tag">Disiplin &amp; Kebajikan Atlet</span>
            </div>
            <div class="ajk-card">
              <span class="ajk-card-role-badge">AJK Media &amp; Publisiti</span>
              <h3 class="ajk-card-name">Syuhada Adriana binti Yussof</h3>
              <p class="ajk-card-detail">SLR Sem 1</p>
              <span class="ajk-card-tag">Publisiti, Hebahan &amp; Media</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Join CTA Section -->
      <div style="margin-top: 50px; text-align: center; padding: 32px 24px; background: rgba(220, 38, 38, 0.08); border: 1px solid rgba(220, 38, 38, 0.3); border-radius: 20px;">
        <h3 style="font-family: 'Barlow Condensed', sans-serif; font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 8px; text-transform: uppercase;">
          Ayuh Sertai Barisan Atlet TMB Fighters!
        </h3>
        <p style="font-size: 14px; color: #a1a1aa; max-width: 600px; margin: 0 auto 20px; line-height: 1.5;">
          Jadual latihan Isnin &amp; Rabu (9:00 – 11:00 Malam) bermula semester depan. Terbuka kepada semua pelajar TVETMARA Besut dengan yuran berpatutan RM10 sebulan!
        </p>
        <a class="button button-red" href="/#borang">MULA PENDAFTARAN SEKARANG →</a>
      </div>
    </main>
    ${siteFooter()}
  `;
}

// ==========================================
// VIEW 2: LOGIN CHOICE PAGE ('/login/')
// ==========================================
function loginChoicePage() {
  stopLiveToast();
  app.innerHTML = `
    ${brandHeader('login')}
    <main class="access-shell">
      <div class="access-heading">
        <p class="eyebrow">TMB FIGHTERS</p>
        <h1>Log masuk</h1>
      </div>
      <section class="access-grid" aria-label="Pilih jenis akaun">
        <article class="access-card">
          <span class="access-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32"><path d="M16 4 27 8v7c0 7-4.5 11-11 13C9.5 26 5 22 5 15V8l11-4Z"/><path d="m11 16 3.2 3.2L21.5 12"/></svg>
          </span>
          <div class="access-card-text">
            <h2>Admin</h2>
          </div>
          <a class="button button-red access-link" href="/admin/login/">LOGIN ADMIN <span aria-hidden="true">↗</span></a>
        </article>
        <article class="access-card is-locked" aria-disabled="true">
          <span class="access-icon athlete" aria-hidden="true">
            <svg viewBox="0 0 32 32"><circle cx="16" cy="9" r="5"/><path d="M6 27c.7-6 4.4-9 10-9s9.3 3 10 9H6Z"/><path d="m21 23 2.5 2.5L28 21"/></svg>
          </span>
          <div class="access-card-text">
            <h2>Atlet</h2>
            <p class="access-card-notice">Akses akan dibuka semester depan</p>
          </div>
          <button class="access-button-locked" type="button" disabled aria-disabled="true">
            <span aria-hidden="true">🔒</span> AKSES DIBUKA SEMESTER DEPAN
          </button>
        </article>
      </section>
      <a class="login-home access-home" href="/">← Kembali ke Homepage</a>
    </main>
    ${siteFooter()}
  `;
}

// ==========================================
// VIEW 3: ADMIN LOGIN PAGE ('/admin/login/')
// ==========================================
function adminLoginPage() {
  stopLiveToast();
  app.innerHTML = `
    ${brandHeader('login')}
    <main class="login-shell">
      <section class="login-card">
        <h1>Admin log masuk</h1>
        <form id="admin-login-form">
          <label for="admin-username">USERNAME ADMIN</label>
          <input id="admin-username" name="username" type="text" autocomplete="username" placeholder="Contoh: admin" required />
          <label for="admin-password">KATA LALUAN</label>
          <div class="password-control">
            <input id="admin-password" name="password" type="password" autocomplete="current-password" placeholder="Kata laluan" required />
            <button class="password-toggle" type="button" aria-label="Papar kata laluan"></button>
          </div>
          <p class="login-message" id="login-message" aria-live="polite" hidden></p>
          <button class="button button-red login-submit" type="submit">LOG MASUK <span aria-hidden="true">↗</span></button>
        </form>
        <a class="login-home" href="/login/">← Pilih jenis akaun</a>
      </section>
    </main>
    ${siteFooter()}
  `;
  setupPasswordToggle('#admin-password');

  const form = document.querySelector('#admin-login-form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const username = document.querySelector('#admin-username').value.trim();
    const password = document.querySelector('#admin-password').value;
    const message = document.querySelector('#login-message');
    const submitBtn = form.querySelector('.login-submit');

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'MENGESAHKAN... <span aria-hidden="true">⏳</span>';
    message.hidden = true;

    const { session, error } = await loginAdmin(username, password);

    if (error) {
      message.textContent = error.message;
      message.hidden = false;
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'LOG MASUK <span aria-hidden="true">↗</span>';
      return;
    }

    navigateTo('/admin/');
  });
}

// ==========================================
// VIEW 4: ADMIN DASHBOARD ('/admin/')
// ==========================================
async function adminPage(session) {
  stopLiveToast();

  app.innerHTML = `
    ${brandHeader('login')}
    <main class="admin-shell">
      <div class="admin-title-row">
        <div>
          <p class="eyebrow">TMB FIGHTERS · PENGURUSAN</p>
          <h1>
            Dashboard admin
            <span class="sync-cloud-pill" title="Diselaraskan secara langsung dengan Supabase" aria-label="Pangkalan data disambungkan">
              <svg class="sync-cloud-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
              </svg>
              <span class="sync-pulse-dot" aria-hidden="true"></span>
              <span id="admin-sync-label">LIVE SYNC</span>
            </span>
          </h1>
          <p class="admin-subtitle">Gambaran kemasukan atlet dan status keahlian semasa.</p>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <button class="button button-red export-button" id="export-button" type="button">
            <span aria-hidden="true">↓</span> EXPORT EXCEL
          </button>
          <button class="outline-link" id="admin-logout-btn" type="button" style="cursor: pointer; background: transparent;">
            LOG KELUAR ⎋
          </button>
        </div>
      </div>
      <section class="stats-grid stats-4" aria-label="Ringkasan pendaftaran">
        <article class="stat-card">
          <div class="stat-icon">01</div>
          <div>
            <p>Jumlah pendaftar</p>
            <strong id="stat-total">...</strong>
            <span>Peserta Berdaftar</span>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon">02</div>
          <div>
            <p>Menunggu semakan</p>
            <strong id="stat-review">...</strong>
            <span>Perlu Tindakan</span>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon">03</div>
          <div>
            <p>Ahli Sah / Aktif</p>
            <strong id="stat-confirmed">...</strong>
            <span>Disahkan Keahlian</span>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-icon">04</div>
          <div>
            <p>Kutipan Yuran</p>
            <strong id="stat-revenue">...</strong>
            <span>Yuran Bulanan RM10</span>
          </div>
        </article>
      </section>
      <section class="registrations-panel">
        <div class="panel-heading">
          <div>
            <h2>Senarai peserta</h2>
            <p id="result-count">Memuatkan rekod...</p>
          </div>
          <div class="table-legend">
            <span class="status-dot accepted"></span> Diterima 
            <span class="status-dot review"></span> Semakan
          </div>
        </div>
        <div class="filters">
          <label class="search-field">
            <span aria-hidden="true">⌕</span>
            <input id="search" type="search" placeholder="Cari nama, matrik, IC atau program" aria-label="Cari nama, matrik, IC atau program" />
          </label>
          <label class="filter-select">
            <span class="sr-only">Tapis kod kursus</span>
            <select id="filter-course">
              <option value="">Semua kod</option>
              <option value="DFK">DFK</option>
              <option value="DGA">DGA</option>
              <option value="ITW">ITW</option>
              <option value="SLR">SLR</option>
            </select>
          </label>
          <label class="filter-select">
            <span class="sr-only">Tapis semester</span>
            <select id="filter-semester">
              <option value="">Semua semester</option>
              <option value="Sem 1">Sem 1</option>
              <option value="Sem 2">Sem 2</option>
              <option value="Sem 3">Sem 3</option>
              <option value="Sem 4">Sem 4</option>
              <option value="Sem 5">Sem 5</option>
            </select>
          </label>
          <label class="filter-select">
            <span class="sr-only">Tapis jantina</span>
            <select id="filter-gender">
              <option value="">Semua jantina</option>
              <option>Lelaki</option>
              <option>Perempuan</option>
            </select>
          </label>
          <label class="filter-select">
            <span class="sr-only">Tapis pengalaman</span>
            <select id="filter-experience">
              <option value="">Semua pengalaman</option>
              <option>Ada</option>
              <option>Tiada</option>
            </select>
          </label>
          <label class="filter-select">
            <span class="sr-only">Tapis status</span>
            <select id="filter-status">
              <option value="">Semua status</option>
              <option>Diterima</option>
              <option>Semakan</option>
            </select>
          </label>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Peserta</th>
                <th>No. Matrik</th>
                <th>No. IC</th>
                <th>Program</th>
                <th>Jantina</th>
                <th>Pengalaman</th>
                <th>Telefon / WhatsApp</th>
                <th>Status</th>
                <th style="text-align: right; min-width: 140px;">Tindakan</th>
              </tr>
            </thead>
            <tbody id="registration-rows">
              <tr><td colspan="9" style="text-align:center; padding: 30px;">Memuatkan pangkalan data...</td></tr>
            </tbody>
          </table>
          <div id="empty-state" class="empty-state" hidden>Tiada rekod sepadan. Cuba ubah carian atau tapisan.</div>
        </div>
        <div class="table-foot">
          <span>Maklumat kesihatan hanya kelihatan dalam paparan butiran.</span>
          <span><b id="visible-count">0</b> rekod dipaparkan</span>
        </div>
      </section>
      <p class="admin-back"><a href="/">← Kembali ke homepage</a></p>
    </main>
    <dialog id="participant-dialog" class="participant-dialog">
      <div id="participant-detail"></div>
    </dialog>
    ${siteFooter()}
  `;

  // Setup Logout button
  document.querySelector('#admin-logout-btn')?.addEventListener('click', async () => {
    await logout();
    navigateTo('/admin/login/');
  });

  // Fetch live dashboard data from Supabase
  let members = [];
  let payments = [];
  try {
    const data = await getAdminDashboardData();
    members = data.members || [];
    payments = data.payments || [];
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
  }

  const updateStats = () => {
    const totalCount = members.length;
    const reviewCount = members.filter(m => m.status === 'Semakan').length;
    const confirmedCount = members.filter(m => m.status === 'Diterima' || m.status === 'Aktif').length;
    const totalRevenue = payments
      .filter(p => p.status === 'Selesai')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const totalEl = document.querySelector('#stat-total');
    const reviewEl = document.querySelector('#stat-review');
    const confirmedEl = document.querySelector('#stat-confirmed');
    const revenueEl = document.querySelector('#stat-revenue');
    const syncEl = document.querySelector('#admin-sync-label');

    if (totalEl) totalEl.innerHTML = `${totalCount}<small> peserta</small>`;
    if (reviewEl) reviewEl.innerHTML = `${reviewCount}<small> peserta</small>`;
    if (confirmedEl) confirmedEl.innerHTML = `${confirmedCount}<small> peserta</small>`;
    if (revenueEl) revenueEl.innerHTML = `RM ${totalRevenue.toFixed(2)}`;
    if (syncEl) syncEl.textContent = `LIVE SYNC (${totalCount})`;
  };

  updateStats();

  const searchInput = document.querySelector('#search');
  const courseSelect = document.querySelector('#filter-course');
  const semesterSelect = document.querySelector('#filter-semester');
  const genderSelect = document.querySelector('#filter-gender');
  const expSelect = document.querySelector('#filter-experience');
  const statusSelect = document.querySelector('#filter-status');

  const filterControls = [searchInput, courseSelect, semesterSelect, genderSelect, expSelect, statusSelect];
  const tbody = document.querySelector('#registration-rows');
  const dialog = document.querySelector('#participant-dialog');

  const renderTable = () => {
    const query = (searchInput?.value || '').trim().toLowerCase();
    const course = (courseSelect?.value || '').trim().toUpperCase();
    const semester = (semesterSelect?.value || '').trim().toLowerCase();
    const gender = (genderSelect?.value || '').trim().toLowerCase();
    const experience = (expSelect?.value || '').trim().toLowerCase();
    const status = (statusSelect?.value || '').trim().toLowerCase();

    const shown = members.filter(row => {
      const searchTarget = `${row.full_name || ''} ${row.program || ''} ${row.matric_number || ''} ${row.member_id || ''} ${row.ic_number || ''}`.toLowerCase();
      const parsed = parseProgramDetails(row.program);

      const matchesQuery = !query || searchTarget.includes(query);
      const matchesCourse =
        !course ||
        course === 'SEMUA KOD' ||
        course === 'SEMUA' ||
        parsed.code === course ||
        (row.program || '').toUpperCase().startsWith(course);

      const matchesSemester =
        !semester ||
        semester === 'semua semester' ||
        semester === 'semua' ||
        (parsed.semester && parsed.semester.toLowerCase() === semester) ||
        (parsed.semNum && semester.includes(parsed.semNum));

      const matchesGender = !gender || (row.gender || '').toLowerCase() === gender;
      const matchesExperience = !experience || (row.experience || '').toLowerCase() === experience;
      const matchesStatus = !status || (row.status || '').toLowerCase() === status;

      return matchesQuery && matchesCourse && matchesSemester && matchesGender && matchesExperience && matchesStatus;
    });

    tbody.innerHTML = shown
      .map(row => {
        const matric = row.matric_number || row.member_id || '—';
        const initials =
          (row.full_name || 'A')
            .split(' ')
            .filter(Boolean)
            .slice(-1)[0]
            ?.slice(-2)
            .toUpperCase() || 'A';
        return `
        <tr>
          <td>
            <button class="participant-link" data-action="view" data-id="${row.id}" type="button">
              <span class="avatar">${initials}</span>
              <span><strong>${row.full_name}</strong><small>${matric}</small></span>
            </button>
          </td>
          <td><span style="font-family: monospace; font-weight: 700;">${matric}</span></td>
          <td><span style="font-family: monospace; color: #bbb;">${row.ic_number || '—'}</span></td>
          <td>${row.program || '—'}</td>
          <td>${row.gender || '—'}</td>
          <td><span class="experience-tag ${row.experience === 'Ada' ? 'yes' : ''}">${row.experience || '—'}</span></td>
          <td><a class="whatsapp-link" href="${whatsappUrl(row.phone)}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp ${row.full_name}"><span aria-hidden="true">◉</span>${row.phone || '—'}</a></td>
          <td><span class="status-tag ${row.status === 'Diterima' ? 'accepted' : 'review'}">${row.status || 'Semakan'}</span></td>
          <td>
            <div class="action-btns-group">
              <button class="action-btn action-btn-status" data-action="toggle-status" data-id="${row.id}" type="button" title="Tukar status (${row.status === 'Diterima' ? 'Ubah ke Semakan' : 'Ubah ke Diterima'})">⚡</button>
              <button class="action-btn action-btn-edit" data-action="edit" data-id="${row.id}" type="button" title="Edit maklumat">✏️</button>
              <button class="action-btn action-btn-view" data-action="view" data-id="${row.id}" type="button" title="Lihat butiran">👁️</button>
              <button class="action-btn action-btn-delete" data-action="delete" data-id="${row.id}" type="button" title="Padam rekod">🗑️</button>
            </div>
          </td>
        </tr>
      `;
      })
      .join('');

    const resCount = document.querySelector('#result-count');
    const visCount = document.querySelector('#visible-count');
    const emptyState = document.querySelector('#empty-state');
    if (resCount) resCount.textContent = `${shown.length} rekod`;
    if (visCount) visCount.textContent = shown.length;
    if (emptyState) emptyState.hidden = shown.length > 0;
  };

  filterControls.forEach(el => el?.addEventListener('input', renderTable));
  filterControls.forEach(el => el?.addEventListener('change', renderTable));

  tbody.addEventListener('click', async event => {
    const actionBtn = event.target.closest('[data-action]');
    const participantLink = event.target.closest('.participant-link');
    const targetEl = actionBtn || participantLink;
    if (!targetEl) return;

    const action = targetEl.dataset.action || 'view';
    const id = targetEl.dataset.id;
    const member = members.find(r => String(r.id) === String(id));
    if (!member) return;

    const refreshDashboard = async () => {
      const refreshed = await getAdminDashboardData();
      members = refreshed.members || [];
      payments = refreshed.payments || [];
      updateStats();
      renderTable();
    };

    if (action === 'view') {
      openDetails(member, dialog, refreshDashboard);
    } else if (action === 'edit') {
      openEditModal(member, dialog, refreshDashboard);
    } else if (action === 'delete') {
      openDeleteModal(member, dialog, refreshDashboard);
    } else if (action === 'toggle-status') {
      actionBtn.disabled = true;
      const newStatus = member.status === 'Diterima' ? 'Semakan' : 'Diterima';
      const { error } = await updateMemberRecord(member.id, { status: newStatus });
      if (!error) {
        member.status = newStatus;
        updateStats();
        renderTable();
      }
      actionBtn.disabled = false;
    }
  });

  dialog.addEventListener('click', event => {
    if (event.target === dialog || event.target.closest('[data-close]')) dialog.close();
  });

  document.querySelector('#export-button')?.addEventListener('click', () => exportAdminCsv(members));

  renderTable();
}

function openEditModal(member, dialog, onUpdate) {
  const matric = member.matric_number || member.member_id || '—';
  const detail = document.querySelector('#participant-detail');
  const parsed = parseProgramDetails(member.program);
  const currentCode = parsed.code || 'DFK';
  const currentSem = parsed.semester || 'Sem 1';

  detail.innerHTML = `
    <div class="dialog-head">
      <div>
        <p class="eyebrow">EDIT REKOD ATLET · ${matric}</p>
        <h2>Kemaskini Maklumat Peserta</h2>
      </div>
      <button class="dialog-close" data-close type="button" aria-label="Tutup">×</button>
    </div>
    <form id="edit-member-form" class="edit-form">
      <div class="edit-form-grid">
        <div class="edit-field full-span">
          <label class="edit-label" for="edit-full-name">Nama Penuh *</label>
          <input id="edit-full-name" name="fullName" class="edit-input" type="text" value="${member.full_name || ''}" required style="text-transform: uppercase;" />
        </div>
        <div class="edit-field">
          <label class="edit-label" for="edit-matric">No. Matrik Pelajar *</label>
          <input id="edit-matric" name="matricNumber" class="edit-input" type="text" value="${matric}" required style="text-transform: uppercase;" />
        </div>
        <div class="edit-field">
          <label class="edit-label" for="edit-ic">No. Kad Pengenalan *</label>
          <input id="edit-ic" name="icNumber" class="edit-input" type="text" value="${member.ic_number || ''}" required />
        </div>
        <div class="edit-field">
          <label class="edit-label" for="edit-program-code">Program Pengajian *</label>
          <select id="edit-program-code" name="programCode" class="edit-select" required>
            <option value="DFK" ${currentCode === 'DFK' ? 'selected' : ''}>DFK</option>
            <option value="DGA" ${currentCode === 'DGA' ? 'selected' : ''}>DGA</option>
            <option value="ITW" ${currentCode === 'ITW' ? 'selected' : ''}>ITW</option>
            <option value="SLR" ${currentCode === 'SLR' ? 'selected' : ''}>SLR</option>
          </select>
        </div>
        <div class="edit-field">
          <label class="edit-label" for="edit-semester">Semester Pengajian *</label>
          <select id="edit-semester" name="semester" class="edit-select" required>
            <option value="Sem 1" ${currentSem === 'Sem 1' ? 'selected' : ''}>Sem 1</option>
            <option value="Sem 2" ${currentSem === 'Sem 2' ? 'selected' : ''}>Sem 2</option>
            <option value="Sem 3" ${currentSem === 'Sem 3' ? 'selected' : ''}>Sem 3</option>
            <option value="Sem 4" ${currentSem === 'Sem 4' ? 'selected' : ''}>Sem 4</option>
            <option value="Sem 5" ${currentSem === 'Sem 5' ? 'selected' : ''}>Sem 5</option>
          </select>
        </div>
        <div class="edit-field">
          <label class="edit-label" for="edit-phone">No Telefon / WhatsApp *</label>
          <input id="edit-phone" name="phone" class="edit-input" type="tel" value="${member.phone || ''}" required />
        </div>
        <div class="edit-field">
          <label class="edit-label" for="edit-status">Status Keahlian *</label>
          <select id="edit-status" name="status" class="edit-select" required>
            <option value="Diterima" ${member.status === 'Diterima' ? 'selected' : ''}>Diterima</option>
            <option value="Semakan" ${member.status === 'Semakan' ? 'selected' : ''}>Semakan</option>
          </select>
        </div>
        <div class="edit-field full-span">
          <label class="edit-label" for="edit-health">Masalah Kesihatan (jika ada)</label>
          <input id="edit-health" name="healthDetails" class="edit-input" type="text" value="${member.health_details || member.health_issues || ''}" placeholder="Tiada atau nyatakan masalah kesihatan" />
        </div>
      </div>
      <div id="edit-form-error" class="field-error" style="margin-bottom: 12px; color: #f87171;" hidden></div>
      <div class="edit-modal-actions">
        <button type="button" class="btn-secondary" data-close>Batal</button>
        <button type="submit" class="btn-primary" id="save-edit-btn">Simpan Perubahan</button>
      </div>
    </form>
  `;

  const form = detail.querySelector('#edit-member-form');
  const errorBox = detail.querySelector('#edit-form-error');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const saveBtn = form.querySelector('#save-edit-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Menyimpan...';
    errorBox.hidden = true;

    const fullName = form.querySelector('#edit-full-name').value.trim().toUpperCase();
    const matricNumber = normalizeMatricNumber(form.querySelector('#edit-matric').value.trim());
    const icNumber = form.querySelector('#edit-ic').value.trim();
    const code = form.querySelector('#edit-program-code').value;
    const sem = form.querySelector('#edit-semester').value;
    const phone = form.querySelector('#edit-phone').value.trim();
    const status = form.querySelector('#edit-status').value;
    const healthDetails = form.querySelector('#edit-health').value.trim();

    const updates = {
      full_name: fullName,
      matric_number: matricNumber,
      member_id: matricNumber,
      ic_number: icNumber,
      program: formatProgramSemester(code, sem),
      phone,
      status,
      health: healthDetails && healthDetails.toLowerCase() !== 'tiada' ? 'Ada' : 'Tiada',
      health_details: healthDetails || 'Tiada',
    };

    const { error } = await updateMemberRecord(member.id, updates);
    if (error) {
      errorBox.textContent = error.message || 'Gagal menyimpan perubahan. Sila cuba lagi.';
      errorBox.hidden = false;
      saveBtn.disabled = false;
      saveBtn.textContent = 'Simpan Perubahan';
      return;
    }

    Object.assign(member, updates);
    dialog.close();
    if (typeof onUpdate === 'function') onUpdate();
  });

  dialog.showModal();
}

function openDeleteModal(member, dialog, onUpdate) {
  const matric = member.matric_number || member.member_id || '—';
  const detail = document.querySelector('#participant-detail');

  // Step 1: First Confirmation
  const renderStep1 = () => {
    detail.innerHTML = `
      <div class="dialog-head">
        <div>
          <p class="eyebrow" style="color: #f87171;">PENGESAHAN PADAM REKOD (LANGKAH 1 DARI 2)</p>
          <h2 style="color: #fff;">Padam Rekod Peserta?</h2>
        </div>
        <button class="dialog-close" data-close type="button" aria-label="Tutup">×</button>
      </div>
      <div style="padding: 16px 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">
        <p>Adakah anda pasti mahu memadam rekod peserta ini?</p>
        <div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 12px 16px; margin: 14px 0; border-radius: 4px;">
          <strong style="color: #fff; display: block; font-size: 15px;">${member.full_name}</strong>
          <span style="font-family: monospace; color: #a1a1aa;">No. Matrik: ${matric} · Program: ${member.program || '—'}</span>
        </div>
        <p style="font-size: 13px; color: #a1a1aa;">Tindakan ini memerlukan pengesahan kali kedua sebelum rekod dipadam secara kekal.</p>
      </div>
      <div class="edit-modal-actions">
        <button type="button" class="btn-secondary" data-close>Batal</button>
        <button type="button" class="btn-danger" id="delete-step1-btn">Teruskan ke Pengesahan Akhir →</button>
      </div>
    `;

    detail.querySelector('#delete-step1-btn')?.addEventListener('click', renderStep2);
  };

  // Step 2: Final Confirmation
  const renderStep2 = () => {
    detail.innerHTML = `
      <div class="dialog-head">
        <div>
          <p class="eyebrow" style="color: #ef4444;">AMARAN TINDAKAN KEKAL (LANGKAH 2 DARI 2)</p>
          <h2 style="color: #ef4444;">Pengesahan Akhir Padam</h2>
        </div>
        <button class="dialog-close" data-close type="button" aria-label="Tutup">×</button>
      </div>
      <div style="padding: 16px 0; color: #e4e4e7; font-size: 14px; line-height: 1.6;">
        <p><strong style="color: #f87171;">PERHATIAN:</strong> Rekod atlet <strong>${member.full_name} (${matric})</strong> dan semua sejarah berkaitan akan dipadam sepenuhnya daripada pangkalan data Supabase rasmi.</p>
        <p style="font-size: 13px; color: #a1a1aa; margin-top: 8px;">Tindakan ini tidak boleh diundur semula.</p>
        <div id="delete-error-msg" class="field-error" style="margin-top: 10px; color: #f87171;" hidden></div>
      </div>
      <div class="edit-modal-actions">
        <button type="button" class="btn-secondary" data-close>Batal</button>
        <button type="button" class="btn-danger" id="delete-step2-btn" style="background: #dc2626; color: #fff;">PADAM REKOD SEKARANG</button>
      </div>
    `;

    detail.querySelector('#delete-step2-btn')?.addEventListener('click', async e => {
      const btn = e.target;
      btn.disabled = true;
      btn.textContent = 'Memadam...';
      const errorMsg = detail.querySelector('#delete-error-msg');
      errorMsg.hidden = true;

      const { error } = await deleteMemberRecord(member.id);
      if (error) {
        errorMsg.textContent = error.message || 'Gagal memadam rekod. Sila cuba lagi.';
        errorMsg.hidden = false;
        btn.disabled = false;
        btn.textContent = 'PADAM REKOD SEKARANG';
        return;
      }

      dialog.close();
      if (typeof onUpdate === 'function') onUpdate();
    });
  };

  renderStep1();
  dialog.showModal();
}

function openDetails(row, dialog, onUpdate) {
  const matric = row.matric_number || row.member_id || '—';
  const detail = document.querySelector('#participant-detail');
  detail.innerHTML = `
    <div class="dialog-head">
      <div>
        <p class="eyebrow">REKOD ATLET · ${matric}</p>
        <h2>${row.full_name}</h2>
      </div>
      <button class="dialog-close" data-close type="button" aria-label="Tutup butiran">×</button>
    </div>
    <dl class="detail-list">
      <div><dt>No. Matrik Pelajar</dt><dd><strong>${matric}</strong></dd></div>
      <div><dt>No. Kad Pengenalan</dt><dd>${row.ic_number || '—'}</dd></div>
      <div><dt>Program &amp; semester</dt><dd>${row.program || '—'}</dd></div>
      <div><dt>Nombor WhatsApp</dt><dd><a href="${whatsappUrl(row.phone)}" target="_blank" rel="noopener noreferrer">${row.phone} ↗</a></dd></div>
      <div><dt>Email aktif</dt><dd>${row.email || '—'}</dd></div>
      <div><dt>Jantina</dt><dd>${row.gender || '—'}</dd></div>
      <div><dt>Pengalaman silat</dt><dd>${row.experience || '—'}</dd></div>
      <div><dt>Masalah kesihatan</dt><dd>${row.health === 'Ada' ? row.health_details || 'Ada' : 'Tiada'}</dd></div>
      <div><dt>Status keahlian</dt><dd><span class="status-tag ${row.status === 'Diterima' ? 'accepted' : 'review'}">${row.status}</span></dd></div>
      <div><dt>Tarikh daftar</dt><dd>${row.created_at ? new Intl.DateTimeFormat('ms-MY', { dateStyle: 'long' }).format(new Date(row.created_at)) : '04 Nov 2026'}</dd></div>
    </dl>
    <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
      <button id="toggle-status-btn" class="outline-link" type="button" style="cursor: pointer; background: transparent;">
        Tukar Status kepada: ${row.status === 'Diterima' ? 'Semakan' : 'Diterima'}
      </button>
    </div>
  `;

  document.querySelector('#toggle-status-btn')?.addEventListener('click', async e => {
    const btn = e.target;
    btn.disabled = true;
    btn.textContent = 'Mengemas kini...';
    const newStatus = row.status === 'Diterima' ? 'Semakan' : 'Diterima';
    await supabase.from('members').update({ status: newStatus }).eq('id', row.id);
    row.status = newStatus;
    dialog.close();
    if (typeof onUpdate === 'function') onUpdate();
  });

  dialog.showModal();
}

function exportAdminCsv(members) {
  const headings = [
    'No. Matrik',
    'Nama Penuh',
    'No. Kad Pengenalan',
    'Program & Semester',
    'Telefon',
    'Email',
    'Jantina',
    'Pengalaman Silat',
    'Status',
    'Tarikh Daftar',
  ];
  const rows = members.map(m => [
    m.matric_number || m.member_id || '',
    m.full_name || '',
    m.ic_number || '',
    m.program || '',
    m.phone || '',
    m.email || '',
    m.gender || '',
    m.experience || '',
    m.status || '',
    m.created_at ? m.created_at.split('T')[0] : '',
  ]);
  const csv = [headings, ...rows]
    .map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(','))
    .join('\r\n');
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'tmb-fighters-senarai-ahli.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);

  const button = document.querySelector('#export-button');
  if (button) {
    button.innerHTML = '<span aria-hidden="true">✓</span> CSV DIMUAT TURUN';
    setTimeout(() => {
      if (button.isConnected) button.innerHTML = '<span aria-hidden="true">↓</span> EXPORT EXCEL';
    }, 2400);
  }
}

// ==========================================
// VIEW 5: ATHLETE LOGIN PAGE ('/atlet/login/')
// ==========================================
function athleteLoginPage() {
  stopLiveToast();
  app.innerHTML = `
    ${brandHeader('login')}
    <main class="login-shell">
      <section class="login-card" style="text-align: center;">
        <div style="margin-bottom: 12px;">
          <span class="access-lock-badge"><span aria-hidden="true">🔒</span> NOTIS PENGURUSAN</span>
        </div>
        <h1 style="margin-bottom: 8px;">Portal atlet</h1>
        <div style="padding: 24px 20px; background: rgba(234, 179, 8, 0.08); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 8px; margin: 18px 0 24px; text-align: center;">
          <p style="margin: 0 0 8px; font-weight: 800; color: #fde047; font-size: 16px; letter-spacing: .02em;">
            AKSES AKAN DIBUKA SEMESTER DEPAN
          </p>
          <p style="margin: 0; color: #c5c2be; font-size: 12px; line-height: 1.6;">
            Sistem semakan profil dan bayaran yuran ahli sedang dikunci buat masa ini. Akses akan dibuka secara rasmi semester depan kepada semua ahli baharu yang disahkan.
          </p>
        </div>
        <a class="button button-red" style="width: 100%; justify-content: center;" href="/#senarai-peserta">
          SEMAK STATUS PENDAFTARAN AWAM <span aria-hidden="true">↓</span>
        </a>
        <a class="login-home" href="/login/" style="margin-top: 20px; display: inline-block;">← Kembali ke pilihan akaun</a>
      </section>
    </main>
    ${siteFooter()}
  `;
}

// ==========================================
// VIEW 6: ATHLETE PROFILE PAGE ('/atlet/')
// ==========================================
async function athleteAccountPage(authUser) {
  stopLiveToast();

  app.innerHTML = `
    ${brandHeader('login')}
    <main class="athlete-shell">
      <div class="athlete-page-heading">
        <div>
          <p class="eyebrow">PORTAL ATLET</p>
          <h1>Profil atlet</h1>
          <p>Maklumat rasmi keahlian dan status yuran bulanan.</p>
        </div>
        <button class="outline-link" id="athlete-logout-btn" type="button" style="cursor: pointer; background: transparent;">
          Log keluar <span aria-hidden="true">⎋</span>
        </button>
      </div>

      <section class="athlete-overview">
        <div class="athlete-avatar-wrap">
          <div class="athlete-avatar" id="athlete-avatar-container">
            <span id="athlete-avatar-initials">...</span>
          </div>
          <label for="avatar-input" class="avatar-upload-badge" title="Tukar foto profil" aria-label="Tukar foto profil">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </label>
          <input type="file" id="avatar-input" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none;" />
        </div>
        <div class="athlete-overview-copy">
          <p class="eyebrow">STATUS AKAUN</p>
          <h2 id="athlete-overview-name">Memuatkan...</h2>
          <span class="account-status" id="athlete-overview-status">Aktif</span>
          <div id="avatar-upload-feedback" class="avatar-feedback" hidden></div>
        </div>
        <div class="member-id">
          <span>NO. MATRIK</span>
          <strong id="athlete-overview-matric">...</strong>
        </div>
      </section>

      <section class="athlete-info-section">
        <div class="athlete-section-heading">
          <div>
            <h2>Maklumat atlet</h2>
            <p>Nombor kad pengenalan dilindungi demi keselamatan peribadi.</p>
          </div>
          <span class="private-note">MAKLUMAT PERIBADI</span>
        </div>
        <dl class="athlete-info-grid">
          <div><dt>Nama penuh</dt><dd id="athlete-info-name">...</dd></div>
          <div><dt>Nombor kad pengenalan</dt><dd id="athlete-info-ic">...</dd></div>
          <div><dt>Program &amp; semester</dt><dd id="athlete-info-program">...</dd></div>
          <div><dt>Nombor WhatsApp</dt><dd id="athlete-info-phone">...</dd></div>
          <div><dt>Email aktif</dt><dd id="athlete-info-email">...</dd></div>
          <div><dt>Status keahlian</dt><dd id="athlete-info-status">...</dd></div>
        </dl>
      </section>

      <section class="payment-section">
        <div class="athlete-section-heading">
          <div>
            <h2>Rekod bayaran</h2>
            <p>Semakan bayaran yuran bulanan kelab silat.</p>
          </div>
          <span class="payment-rate">RM10 <small>/ bulan</small></span>
        </div>
        <div class="payment-table-wrap">
          <table class="payment-table">
            <thead>
              <tr><th>Bulan</th><th>Jumlah</th><th>Status</th><th>Tarikh bayaran</th></tr>
            </thead>
            <tbody id="athlete-payment-rows">
              <tr><td colspan="4" style="text-align: center; padding: 20px;">Memuatkan rekod bayaran...</td></tr>
            </tbody>
          </table>
        </div>
      </section>
      <p class="account-availability"><a href="/">← Kembali ke Homepage</a></p>
    </main>
    ${siteFooter()}
  `;

  // Logout button
  document.querySelector('#athlete-logout-btn')?.addEventListener('click', async () => {
    await logout();
    navigateTo('/atlet/login/');
  });

  // Fetch live profile and payments
  const userId = authUser?.id;
  let profileData = null;
  try {
    profileData = await getAthleteProfile(userId);
  } catch (err) {
    console.error('Failed to load athlete profile:', err);
  }

  const member = profileData?.member;
  const payments = profileData?.payments || [];

  const fullName = member?.full_name || authUser?.user_metadata?.name || 'Muhammad Amirul bin Rosli';
  const matricNo =
    member?.matric_number ||
    member?.member_id ||
    authUser?.user_metadata?.matric_number ||
    'DFK2401';
  const maskedIc = maskIC(member?.ic_number || '040115011234');
  const program = member?.program || 'DFK sem 1';
  const phone = member?.phone || '012 345 6789';
  const email = member?.email || authUser?.email || 'amirul@tmbfighters.com';
  const status =
    member?.status === 'Diterima' || member?.membership_status === 'Aktif'
      ? 'Aktif'
      : member?.status || 'Aktif';

  // Populate overview
  document.querySelector('#athlete-overview-name').textContent = fullName;
  document.querySelector('#athlete-overview-status').textContent = status;
  document.querySelector('#athlete-overview-matric').textContent = matricNo;

  // Populate avatar container
  const avatarContainer = document.querySelector('#athlete-avatar-container');
  if (member?.avatar_url) {
    avatarContainer.innerHTML = `<img id="athlete-avatar-img" src="${member.avatar_url}" alt="${fullName}" />`;
  } else {
    const initials = fullName
      .split(' ')
      .map(n => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
    avatarContainer.innerHTML = `<span id="athlete-avatar-initials">${initials || 'A'}</span>`;
  }

  // Populate info grid
  document.querySelector('#athlete-info-name').textContent = fullName;
  document.querySelector('#athlete-info-ic').textContent = maskedIc;
  document.querySelector('#athlete-info-program').textContent = program;
  document.querySelector('#athlete-info-phone').textContent = phone;
  document.querySelector('#athlete-info-email').textContent = email;
  document.querySelector('#athlete-info-status').textContent = status;

  // Populate payments
  const paymentsTbody = document.querySelector('#athlete-payment-rows');
  if (payments.length > 0) {
    paymentsTbody.innerHTML = payments
      .map(p => {
        const amountFormatted = Number(p.amount || 10).toFixed(2);
        const paidDate = p.paid_at
          ? new Intl.DateTimeFormat('ms-MY', { dateStyle: 'medium' }).format(new Date(p.paid_at))
          : p.status === 'Selesai'
          ? '04 Nov 2026'
          : '—';
        return `
        <tr>
          <td><strong>${p.period}</strong></td>
          <td>RM${amountFormatted}</td>
          <td><span class="payment-status ${p.status === 'Selesai' ? 'paid' : ''}">${p.status}</span></td>
          <td>${paidDate}</td>
        </tr>
      `;
      })
      .join('');
  } else {
    // Fallback default account payments if empty
    const defaultAccount = getAthleteAccountOverview();
    paymentsTbody.innerHTML = defaultAccount.payments
      .map(
        p => `
      <tr>
        <td><strong>${p.period}</strong></td>
        <td>RM${p.amount.toFixed(2)}</td>
        <td><span class="payment-status ${p.status === 'Selesai' ? 'paid' : ''}">${p.status}</span></td>
        <td>${p.paidAt || '—'}</td>
      </tr>
    `
      )
      .join('');
  }

  // Setup Avatar Upload
  const avatarInput = document.querySelector('#avatar-input');
  const feedback = document.querySelector('#avatar-upload-feedback');

  avatarInput?.addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    feedback.hidden = false;
    feedback.className = 'avatar-feedback loading';
    feedback.textContent = 'Sedang memuat naik foto profil...';

    // Client file validation
    if (file.size > 2 * 1024 * 1024) {
      feedback.className = 'avatar-feedback error';
      feedback.textContent =
        'Saiz gambar melebihi had maksimum 2MB. Sila pilih gambar yang lebih kecil.';
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      feedback.className = 'avatar-feedback error';
      feedback.textContent =
        'Format fail tidak disokong. Sila muat naik imej dalam format JPG, PNG, WebP atau GIF.';
      return;
    }

    try {
      const { publicUrl, error } = await uploadAthletePhoto(userId, file);
      if (error) {
        feedback.className = 'avatar-feedback error';
        feedback.textContent = error.message || 'Gagal memuat naik foto profil.';
        return;
      }

      // Cache-busting URL to ensure immediate visual DOM update
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      avatarContainer.innerHTML = `<img id="athlete-avatar-img" src="${cacheBustedUrl}" alt="Foto profil" />`;

      feedback.className = 'avatar-feedback success';
      feedback.textContent = 'Foto profil berjaya dikemas kini!';
      setTimeout(() => {
        if (feedback.isConnected) feedback.hidden = true;
      }, 4000);
    } catch (err) {
      feedback.className = 'avatar-feedback error';
      feedback.textContent = err.message || 'Ralat berlaku semasa muat naik.';
    }
  });
}

function setupPasswordToggle(selector) {
  const password = document.querySelector(selector);
  const passwordToggle = password?.closest('.password-control')?.querySelector('.password-toggle');
  if (!passwordToggle) return;

  const eyeShow = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const eyeHide = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

  passwordToggle.innerHTML = eyeShow;
  passwordToggle.addEventListener('click', () => {
    const show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    passwordToggle.innerHTML = show ? eyeHide : eyeShow;
    passwordToggle.setAttribute('aria-label', `${show ? 'Sembunyikan' : 'Papar'} kata laluan`);
  });
}

// ==========================================
// SPA ROUTER & ROUTE GUARDS
// ==========================================
export function navigateTo(path) {
  if (window.location.pathname !== path) {
    history.pushState(null, '', path);
  }
  handleRouting();
}

export async function handleRouting() {
  const currentPath = window.location.pathname;
  let session = null;
  try {
    session = await getSession();
  } catch (err) {
    console.warn('Session verification warning:', err);
  }

  const user = session?.user;
  const isAdmin =
    user?.app_metadata?.role === 'admin' ||
    user?.email === 'admin@tmbfighters.com' ||
    user?.email?.startsWith('admin@');
  const isAthlete = !!user && !isAdmin;

  if (currentPath === '/admin' || currentPath === '/admin/') {
    if (!session || !isAdmin) {
      if (window.location.pathname !== '/admin/login/') {
        history.replaceState(null, '', '/admin/login/');
      }
      adminLoginPage();
    } else {
      adminPage(session);
    }
  } else if (currentPath.startsWith('/admin/login')) {
    if (session && isAdmin) {
      if (window.location.pathname !== '/admin/') {
        history.replaceState(null, '', '/admin/');
      }
      adminPage(session);
    } else {
      adminLoginPage();
    }
  } else if (currentPath.startsWith('/atlet/login')) {
    if (session && isAthlete) {
      if (window.location.pathname !== '/atlet/') {
        history.replaceState(null, '', '/atlet/');
      }
      athleteAccountPage(session.user);
    } else {
      athleteLoginPage();
    }
  } else if (currentPath === '/atlet' || currentPath.startsWith('/atlet/')) {
    if (!session) {
      if (window.location.pathname !== '/atlet/login/') {
        history.replaceState(null, '', '/atlet/login/');
      }
      athleteLoginPage();
    } else {
      athleteAccountPage(session.user);
    }
  } else if (currentPath === '/ajk' || currentPath === '/ajk/' || currentPath.startsWith('/ajk/')) {
    ajkPage();
  } else if (currentPath === '/login' || currentPath.startsWith('/login/')) {
    loginChoicePage();
  } else {
    registrationPage();
  }

  // Floating AI Chatbot — Lekir Bot
  try {
    initLekirBot();
  } catch (botErr) {
    console.warn('Lekir Bot initialization warning:', botErr);
  }
}

// Global click interception for SPA navigation
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="/"]');
  if (link && !link.target && !link.hasAttribute('download')) {
    const href = link.getAttribute('href');
    if (href.startsWith('/#')) {
      if (window.location.pathname === '/') return;
    }
    if (href.startsWith('/') && !href.startsWith('//')) {
      e.preventDefault();
      navigateTo(href);
    }
  }
});

window.addEventListener('popstate', handleRouting);
handleRouting();

// Ensure Lekir Bot is initialized and mounted to document.body at startup
try {
  initLekirBot();
} catch (startupBotErr) {
  console.warn('Lekir Bot startup error:', startupBotErr);
}
