with open('src/main.js', 'r', encoding='utf-8') as f:
    code = f.read().replace('\r\n', '\n')

# 1. Update adminLoginPage: remove RUANG PENGURUSAN and login-intro
old_admin_card = '<section class="login-card"><p class="eyebrow">RUANG PENGURUSAN</p><h1>Admin log masuk</h1><p class="login-intro">Masukkan butiran admin untuk buka dashboard TMB Fighters.</p><form id="admin-login-form">'
new_admin_card = '<section class="login-card"><h1>Admin log masuk</h1><form id="admin-login-form">'

if old_admin_card in code:
    code = code.replace(old_admin_card, new_admin_card)
    print('Updated adminLoginPage')
else:
    print('Warning: old_admin_card not found directly')

# 2. Update hero-panel in registrationPage to include contacts
wa_icon_svg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.83a8.17 8.17 0 0 1-5.82 2.41c-1.42 0-2.82-.37-4.06-1.1l-.29-.17-3.02.79.81-2.94-.19-.3a8.19 8.19 0 0 1-1.26-4.47c0-4.54 3.7-8.24 8.24-8.24m-3.56 4.76c-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.43 0 1.44 1.05 2.82 1.2 3.01.15.2 2.05 3.14 4.98 4.4 2.43 1.05 2.92.84 3.45.79.53-.05 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.27-.2-.56-.35-.3-.15-1.7-.84-1.97-.94-.26-.09-.46-.15-.65.15-.2.29-.76.94-.93 1.13-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.29-.02-.45.13-.6.13-.13.3-.35.44-.52.15-.17.2-.29.3-.49.09-.2.05-.37-.02-.52-.08-.15-.65-1.57-.9-2.15-.24-.56-.49-.49-.67-.5"/></svg>'

contacts_html = f'''      <aside class="hero-contact-card">
        <div class="contact-header">
          <span class="contact-header-icon">{wa_icon_svg}</span>
          <div>
            <p class="contact-eyebrow">HUBUNGI KAMI</p>
            <h3 class="contact-title">Sebarang pertanyaan, boleh hubungi:</h3>
          </div>
        </div>
        <div class="contact-list">
          <a class="contact-item" href="https://wa.me/60139326767" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Pn Azila">
            <span class="contact-wa-badge">{wa_icon_svg}</span>
            <div class="contact-info">
              <span class="contact-name">Pn Azila</span>
              <span class="contact-phone">013-932 6767</span>
            </div>
            <span class="contact-arrow" aria-hidden="true">↗</span>
          </a>
          <a class="contact-item" href="https://wa.me/601110894945" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp En Fadhil">
            <span class="contact-wa-badge">{wa_icon_svg}</span>
            <div class="contact-info">
              <span class="contact-name">En Fadhil</span>
              <span class="contact-phone">011-1089 4945</span>
            </div>
            <span class="contact-arrow" aria-hidden="true">↗</span>
          </a>
          <a class="contact-item" href="https://wa.me/60107965236" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Syahmi">
            <span class="contact-wa-badge">{wa_icon_svg}</span>
            <div class="contact-info">
              <span class="contact-name">Syahmi</span>
              <span class="contact-phone">010-796 5236</span>
            </div>
            <span class="contact-arrow" aria-hidden="true">↗</span>
          </a>
          <a class="contact-item" href="https://wa.me/601120812650" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Hud">
            <span class="contact-wa-badge">{wa_icon_svg}</span>
            <div class="contact-info">
              <span class="contact-name">Hud</span>
              <span class="contact-phone">011-2081 2650</span>
            </div>
            <span class="contact-arrow" aria-hidden="true">↗</span>
          </a>
        </div>
      </aside>'''

old_hero_panel = '''<section class="hero-panel"><img class="hero-banner" src="${banner}" alt="Kelab Pencak Silat TVETMARA Besut — TMB Fighters" /><div class="hero-copy"><div class="eyebrow"><span></span> AYUH SERTAI KAMI</div><h1 class="hero-title">PENCARIAN ATLET<br /><span class="typewriter-wrap"><em id="typewriter-text">BAHARU</em><span class="typewriter-cursor" aria-hidden="true">|</span></span></h1><p class="organizer">Kelab Pencak Silat TVETMARA Besut dengan kerjasama Exco Sukan dan Rekreasi, MPP TVETMARA Besut</p><div class="chips"><span>Silat Seni</span><span>Silat Olahraga</span><span>RM10 sebulan</span><span>Tutup 30 November 2026</span><span>Terhad kepada 30 peserta</span></div><p class="intro">Disini tempat untuk kita bina disiplin dan asah keberanian. Isi borang di bawah untuk bersama TMB Fighters.</p><a class="button button-red hero-cta" href="#borang">MULA PENDAFTARAN <span aria-hidden="true">↓</span></a></div><div class="hero-mark" aria-hidden="true">TMB<br /><span>FIGHT</span></div></section>'''

new_hero_panel = f'''<section class="hero-panel"><img class="hero-banner" src="${{banner}}" alt="Kelab Pencak Silat TVETMARA Besut — TMB Fighters" /><div class="hero-layout"><div class="hero-copy"><div class="eyebrow"><span></span> AYUH SERTAI KAMI</div><h1 class="hero-title">PENCARIAN ATLET<br /><span class="typewriter-wrap"><em id="typewriter-text">BAHARU</em><span class="typewriter-cursor" aria-hidden="true">|</span></span></h1><p class="organizer">Kelab Pencak Silat TVETMARA Besut dengan kerjasama Exco Sukan dan Rekreasi, MPP TVETMARA Besut</p><div class="chips"><span>Silat Seni</span><span>Silat Olahraga</span><span>RM10 sebulan</span><span>Tutup 30 November 2026</span><span>Terhad kepada 30 peserta</span></div><p class="intro">Disini tempat untuk kita bina disiplin dan asah keberanian. Isi borang di bawah untuk bersama TMB Fighters.</p><a class="button button-red hero-cta" href="#borang">MULA PENDAFTARAN <span aria-hidden="true">↓</span></a></div>{contacts_html}</div><div class="hero-mark" aria-hidden="true">TMB<br /><span>FIGHT</span></div></section>'''

if old_hero_panel in code:
    code = code.replace(old_hero_panel, new_hero_panel)
    print('Updated hero-panel with contact card')
else:
    print('Warning: old_hero_panel not found directly, checking...')

with open('src/main.js', 'w', encoding='utf-8') as f:
    f.write(code)

# 3. Add CSS for hero-layout and hero-contact-card in src/style.css
with open('src/style.css', 'r', encoding='utf-8') as f:
    css = f.read().replace('\r\n', '\n')

contacts_css = '''
/* Hero Layout & Contacts */
.hero-layout {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 32px;
  padding: 28px 48px 36px;
}
.hero-copy {
  flex: 1 1 600px;
  max-width: 660px;
  padding: 0 !important;
}
.hero-contact-card {
  flex: 0 0 310px;
  max-width: 320px;
  margin-top: 6px;
  padding: 18px 20px;
  background: rgba(15, 16, 18, 0.72);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(217, 28, 40, 0.28);
  border-radius: 10px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.contact-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.contact-header-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(217, 28, 40, 0.18);
  color: #ff3b47;
  border: 1px solid rgba(217, 28, 40, 0.35);
  box-shadow: 0 0 12px rgba(217, 28, 40, 0.25);
}
.contact-eyebrow {
  margin: 0;
  color: var(--red);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .12em;
}
.contact-title {
  margin: 2px 0 0;
  font-size: 11px;
  color: #dfdcda;
  font-weight: 600;
  line-height: 1.35;
}
.contact-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.contact-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 8px 11px;
  border-radius: 6px;
  background: rgba(25, 26, 29, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  text-decoration: none;
  color: #f1f0ee;
  transition: transform .16s ease, border-color .16s ease, background .16s ease, box-shadow .16s ease;
}
.contact-item:hover {
  transform: translateX(3px);
  background: rgba(35, 36, 40, 0.85);
  border-color: rgba(217, 28, 40, 0.5);
  box-shadow: 0 4px 16px rgba(217, 28, 40, 0.2);
}
.contact-wa-badge {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(217, 28, 40, 0.15);
  color: #ff3b47;
  border: 1px solid rgba(217, 28, 40, 0.3);
  flex-shrink: 0;
}
.contact-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.contact-name {
  font-size: 12px;
  font-weight: 700;
  color: #f4f3f1;
  line-height: 1.2;
}
.contact-phone {
  font-size: 11px;
  color: #a8a5a2;
  font-family: monospace;
  letter-spacing: .02em;
}
.contact-arrow {
  color: var(--red);
  font-size: 13px;
  font-weight: 700;
  opacity: .7;
  transition: opacity .15s ease, transform .15s ease;
}
.contact-item:hover .contact-arrow {
  opacity: 1;
  transform: translate(1px, -1px);
}

@media (max-width: 860px) {
  .hero-layout {
    flex-direction: column;
    padding: 24px 20px 28px;
    gap: 24px;
  }
  .hero-contact-card {
    flex: 1 1 100%;
    max-width: 100%;
    margin-top: 0;
  }
}
'''

if '/* Hero Layout & Contacts */' not in css:
    css += '\n' + contacts_css
    with open('src/style.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print('Added contacts_css to src/style.css')
