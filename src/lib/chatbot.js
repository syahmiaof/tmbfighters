// ========================================================
// LEKIR BOT — Pembantu AI Rasmi TMB Fighters TVETMARA Besut
// ========================================================

const OPENROUTER_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENROUTER_API_KEY) || '';

// Hardcoded FAQ Knowledge Base
export const FAQ_KNOWLEDGE = [
  {
    topic: 'Jadual Latihan',
    keywords: ['jadual', 'waktu', 'bila', 'hari', 'isnin', 'rabu', 'malam', 'pukul berapa', 'jam berapa', 'tarikh', 'masa'],
    answer: '🕒 **Jadual Latihan TMB Fighters**:\n• Hari: **Isnin & Rabu**\n• Masa: **9:00 Malam – 11:00 Malam**\n• Status: **Latihan rasmi bermula semester depan** bertempat di TVETMARA Besut.'
  },
  {
    topic: 'Yuran Keahlian',
    keywords: ['yuran', 'bayaran', 'harga', 'rm10', 'kos', 'duit', 'bayar', 'bulanan'],
    answer: '💰 **Yuran Keahlian**:\nYuran hanya **RM10 sebulan** sahaja! Sangat berpatutan untuk kemudahan latihan, bimbingan jurulatih bertauliah, dan persediaan kejohanan.'
  },
  {
    topic: 'Jurulatih Bertauliah',
    keywords: ['coach', 'jurulatih', 'guru', 'cikgu', 'ajar', 'syahmi', 'siapa latih'],
    answer: '🥋 **Jurulatih Bertauliah**:\nLatihan dikendalikan oleh **Coach Syahmi (Muhammad Syahmi bin Ahmad Omar Faizul)**, jurulatih bertauliah di bawah naungan rasmi **Pertubuhan Silat Seni Gayong Malaysia (PSSGM)**.'
  },
  {
    topic: 'Kategori Silat',
    keywords: ['kategori', 'jenis', 'olahraga', 'seni', 'persembahan', 'tempur', 'sparring'],
    answer: '⚔️ **Kategori Silat Yang Ditawarkan**:\n1. **Silat Seni**: Gerak tari jurus tangan kosong, pisau, kerambit, tongkat, dan warisan Melayu.\n2. **Silat Olahraga**: Teknik bertempur (sparring), jatuhan, sepakan point, dan persediaan kejohanan SUKIPT/MASISWA.'
  },
  {
    topic: 'Pendaftaran & Sasaran Kuota',
    keywords: ['daftar', 'macam mana', 'borang', 'syarat', 'kuota', '30', 'limit', 'terhad', 'link', 'sasaran'],
    answer: '📝 **Pendaftaran Ahli Baharu**:\n• Terbuka kepada semua pelajar TVETMARA Besut!\n• Sasaran awal kami adalah **30 peserta** (Silat Seni & Silat Olahraga).\n• Pendaftaran **tetap dibuka (pendaftaran terbuka)** dan tidak disekat walaupun melebihi 30 orang untuk memberi peluang kepada semua yang berminat.\n• Hanya perlu mengisi nama, No. IC, No. Matrik, dan nombor WhatsApp pada borang di laman utama.'
  },
  {
    topic: 'Barisan Kepimpinan AJK',
    keywords: ['ajk', 'carta', 'pengerusi', 'organisasi', 'siapa ajk', 'penasihat', 'penyelaras', 'penaung', 'timbalan', 'setiausaha', 'bendahari'],
    answer: '👥 **Barisan Kepimpinan AJK**:\n• **Penaung**: Tuan Zainal Abidin bin Yusof (Timbalan Pengarah (KPHP))\n• **Guru Penyelaras**: Puan Noor Azila binti Saari & Encik Muhammad Fadhil bin Kamaruzaman\n• **Pengerusi**: Muhammad Syahmi bin Ahmad Omar Faizul\n• **Timbalan Pengerusi**: Huud Uqail bin Mohd Yusoff\n• **Setiausaha**: Muhammad Syafiq Zuhail bin Mohd Sidek\n• **Bendahari**: Aniisah Umairah binti Ibrahim\n• **Barisan AJK**: Mohamad Hafiy (Latihan), Muhammad Harees El-Ilmi (Disiplin & Kebajikan), Syuhada Adriana (Media & Publisiti)\n\nBro boleh tekan tab **"AJK"** di menu atas untuk carta organisasi penuh!'
  },
  {
    topic: 'Lokasi Latihan',
    keywords: ['lokasi', 'tempat', 'mana', 'kat mana', 'dewan', 'gelanggang', 'tvetmara'],
    answer: '📍 **Lokasi Latihan**:\nLatihan dijalankan di perkarangan & dewan sukan **TVETMARA Besut, Terengganu** dengan kerjasama Exco Sukan & Rekreasi MPP TVETMARA Besut.'
  },
  {
    topic: 'Naungan Rasmi PSSGM',
    keywords: ['pssgm', 'persatuan', 'pertubuhan', 'gayong', 'naungan', 'asal usul', 'mpp'],
    answer: '🛡️ **Naungan Rasmi**:\nKelab ini bernaung secara rasmi di bawah **Pertubuhan Silat Seni Gayong Malaysia (PSSGM)** dengan sokongan penuh pengurusan TVETMARA Besut serta kerjasama **Exco Sukan & Rekreasi MPP TVETMARA Besut**.'
  },
  {
    topic: 'Hubungi Pengurusan',
    keywords: ['hubungi', 'whatsapp', 'admin', 'nombor', 'tanya', 'telefon', 'contact', 'call'],
    answer: '📞 **Hubungi Pengurusan TMB Fighters**:\n• **Pn. Azila** (Guru Penyelaras): 013-932 6767\n• **En. Fadhil** (Guru Penyelaras): 011-1089 4945\n• **Coach Syahmi** (Pengerusi / Jurulatih): 010-796 5236\n• **Huud Uqail** (Timbalan Pengerusi): 011-2081 2650'
  }
];

export class LekirBot {
  constructor() {
    this.isOpen = false;
    this.messages = [
      {
        sender: 'bot',
        text: 'Assalam & Salam Persilatan! Saya **Lekir Bot**, pembantu AI rasmi **TMB Fighters**. Ada apa-apa nak tanya pasal pendaftaran, yuran, jadual, atau silat?',
        time: this.getCurrentTime()
      }
    ];
    this.isTyping = false;
  }

  getCurrentTime() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  init() {
    if (document.querySelector('#lekir-bot-root')) return;

    const root = document.createElement('div');
    root.id = 'lekir-bot-root';
    root.className = 'lekir-bot-root';
    root.innerHTML = this.renderHTML();
    document.body.appendChild(root);

    this.bindEvents();
  }

  renderHTML() {
    return `
      <!-- Launcher Button -->
      <button id="lekir-launcher" class="lekir-launcher" aria-label="Buka Lekir Bot AI" title="Tanya Lekir Bot">
        <div class="lekir-launcher-avatar-wrap">
          <img src="/lekir-bot.png" alt="Lekir Bot Mascot" class="lekir-launcher-avatar" />
          <span class="lekir-online-indicator"></span>
        </div>
        <span class="lekir-launcher-label">
          <span class="lekir-launcher-name">LEKIR BOT</span>
          <span class="lekir-launcher-status">Tanya Saya</span>
        </span>
      </button>

      <!-- Chat Window Window -->
      <div id="lekir-window" class="lekir-window" style="display: none;" aria-hidden="true">
        <!-- Header -->
        <div class="lekir-header">
          <div class="lekir-header-identity">
            <div class="lekir-avatar-wrapper">
              <img src="/lekir-bot.png" alt="Lekir Bot" class="lekir-avatar-img" />
              <span class="lekir-header-pulse"></span>
            </div>
            <div>
              <div class="lekir-title-row">
                <span class="lekir-title">LEKIR BOT</span>
                <span class="lekir-badge-ai">AI SILAT</span>
              </div>
              <p class="lekir-subtitle">PSSGM · TVETMARA Besut</p>
            </div>
          </div>
          <div class="lekir-header-actions">
            <button id="lekir-close-btn" class="lekir-icon-btn" aria-label="Tutup chatbot" title="Tutup">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- FAQ Quick Chips -->
        <div class="lekir-chips-bar" aria-label="Soalan Lazim">
          <button class="lekir-chip" data-faq="jadual">🕒 Jadual Latihan</button>
          <button class="lekir-chip" data-faq="yuran">💰 Yuran RM10</button>
          <button class="lekir-chip" data-faq="coach">🥋 Siapa Coach?</button>
          <button class="lekir-chip" data-faq="kategori">⚔️ Kategori Silat</button>
          <button class="lekir-chip" data-faq="daftar">📝 Cara Daftar</button>
          <button class="lekir-chip" data-faq="ajk">👥 Senarai AJK</button>
        </div>

        <!-- Messages Area -->
        <div id="lekir-messages" class="lekir-messages" role="log" aria-live="polite">
          ${this.renderMessages()}
        </div>

        <!-- Input Area -->
        <form id="lekir-form" class="lekir-form">
          <input 
            type="text" 
            id="lekir-input" 
            class="lekir-input" 
            placeholder="Tanya Lekir Bot (cth: Jadual latihan bila?)..." 
            autocomplete="off" 
            required 
          />
          <button type="submit" id="lekir-send-btn" class="lekir-send-btn" aria-label="Hantar mesej">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    `;
  }

  renderMessages() {
    return this.messages.map(m => {
      const isBot = m.sender === 'bot';
      // Convert basic markdown formatting like **bold** and bullet points
      const formattedText = this.formatMarkdown(m.text);
      return `
        <div class="lekir-msg ${isBot ? 'lekir-msg-bot' : 'lekir-msg-user'}">
          ${isBot ? `<img src="/lekir-bot.png" alt="" class="lekir-msg-avatar" />` : ''}
          <div class="lekir-bubble-wrap">
            <div class="lekir-bubble">${formattedText}</div>
            <span class="lekir-msg-time">${m.time}</span>
          </div>
        </div>
      `;
    }).join('') + (this.isTyping ? `
      <div class="lekir-msg lekir-msg-bot">
        <img src="/lekir-bot.png" alt="" class="lekir-msg-avatar" />
        <div class="lekir-bubble-wrap">
          <div class="lekir-bubble lekir-typing-bubble">
            <span class="lekir-typing-dot"></span>
            <span class="lekir-typing-dot"></span>
            <span class="lekir-typing-dot"></span>
          </div>
        </div>
      </div>
    ` : '');
  }

  formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/• (.*?)(\n|$)/g, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/\n/g, '<br/>');
  }

  bindEvents() {
    const launcher = document.querySelector('#lekir-launcher');
    const closeBtn = document.querySelector('#lekir-close-btn');
    const windowEl = document.querySelector('#lekir-window');
    const form = document.querySelector('#lekir-form');
    const input = document.querySelector('#lekir-input');
    const chipsBar = document.querySelector('.lekir-chips-bar');

    if (launcher) {
      launcher.addEventListener('click', () => this.toggleWindow());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.toggleWindow(false));
    }

    if (chipsBar) {
      chipsBar.addEventListener('click', (e) => {
        const chip = e.target.closest('.lekir-chip');
        if (!chip) return;
        const faqKey = chip.getAttribute('data-faq');
        const labels = {
          jadual: 'Bila jadual latihan silat?',
          yuran: 'Berapa yuran pendaftaran dan bulanan?',
          coach: 'Siapa jurulatih TMB Fighters?',
          kategori: 'Apakah kategori silat yang ada?',
          daftar: 'Bagaimana cara nak daftar ahli baru?',
          ajk: 'Siapa barisan AJK kelab silat?'
        };
        const text = labels[faqKey] || chip.textContent;
        this.handleUserSend(text);
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        this.handleUserSend(text);
      });
    }
  }

  toggleWindow(forceState) {
    this.isOpen = forceState !== undefined ? forceState : !this.isOpen;
    const windowEl = document.querySelector('#lekir-window');
    const launcher = document.querySelector('#lekir-launcher');
    if (!windowEl) return;

    if (this.isOpen) {
      windowEl.style.display = 'flex';
      windowEl.setAttribute('aria-hidden', 'false');
      if (launcher) launcher.classList.add('is-active');
      this.scrollToBottom();
      setTimeout(() => {
        const input = document.querySelector('#lekir-input');
        if (input && window.innerWidth > 640) input.focus();
      }, 100);
    } else {
      windowEl.style.display = 'none';
      windowEl.setAttribute('aria-hidden', 'true');
      if (launcher) launcher.classList.remove('is-active');
    }
  }

  scrollToBottom() {
    const msgBox = document.querySelector('#lekir-messages');
    if (msgBox) {
      setTimeout(() => {
        msgBox.scrollTop = msgBox.scrollHeight;
      }, 50);
    }
  }

  updateMessagesDOM() {
    const msgBox = document.querySelector('#lekir-messages');
    if (msgBox) {
      msgBox.innerHTML = this.renderMessages();
      this.scrollToBottom();
    }
  }

  async handleUserSend(text) {
    // 1. Add user message
    this.messages.push({
      sender: 'user',
      text: text,
      time: this.getCurrentTime()
    });
    this.isTyping = true;
    this.updateMessagesDOM();

    // 2. Check FAQ hardcoded match first
    const faqResponse = this.checkFAQ(text);
    if (faqResponse) {
      // Natural slight delay for bot reply
      setTimeout(() => {
        this.isTyping = false;
        this.messages.push({
          sender: 'bot',
          text: faqResponse,
          time: this.getCurrentTime()
        });
        this.updateMessagesDOM();
      }, 400);
      return;
    }

    // 3. Fall back to LLM if no exact FAQ matched
    try {
      const llmAnswer = await this.queryLLM(text);
      this.isTyping = false;
      this.messages.push({
        sender: 'bot',
        text: llmAnswer,
        time: this.getCurrentTime()
      });
      this.updateMessagesDOM();
    } catch (err) {
      console.warn('Lekir Bot LLM fallback warning:', err?.message || err);
      this.isTyping = false;
      this.messages.push({
        sender: 'bot',
        text: this.getFallbackResponse(text),
        time: this.getCurrentTime()
      });
      this.updateMessagesDOM();
    }
  }

  getFallbackResponse(userPrompt) {
    const matchedFaq = this.checkFAQ(userPrompt);
    if (matchedFaq) {
      return `⚠️ *Talian AI sedang sibuk, tetapi ini maklumat rasmi berkaitan pertanyaan anda:*\n\n${matchedFaq}\n\n*Jika perlukan maklumat lanjut, Coach Syahmi sentiasa sedia membantu di 010-796 5236.*`;
    }
    return 'Maaf bro, talian AI sedang padat ketika ini. Namun begitu, untuk sebarang maklumat rasmi mengenai latihan (Isnin & Rabu 9-11 malam), yuran (RM10/bln), dan pendaftaran, bro boleh pilih butang pantas di atas atau terus hubungi **Coach Syahmi (010-796 5236)** atau **Pn. Azila (013-932 6767)** ya!';
  }

  checkFAQ(text) {
    if (!text || typeof text !== 'string') return null;
    const lower = text.toLowerCase();

    // 1. First pass: word-boundary regex matching to avoid substring collisions
    // e.g. "guru" shouldn't false-match inside "pengurusan"
    for (const item of FAQ_KNOWLEDGE) {
      for (const kw of item.keywords) {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const boundaryRegex = new RegExp(`(^|\\s|[.,!?;:()"])${escaped}($|\\s|[.,!?;:()"])`, 'i');
        if (boundaryRegex.test(lower)) {
          return item.answer;
        }
      }
    }

    // 2. Second pass: fallback substring match for longer/compound phrases
    for (const item of FAQ_KNOWLEDGE) {
      for (const kw of item.keywords) {
        if (['guru', 'ajar', 'mana'].includes(kw)) continue;
        if (lower.includes(kw)) {
          return item.answer;
        }
      }
    }

    return null;
  }

  async queryLLM(userPrompt) {
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.includes('PASTE_KEY') || OPENROUTER_API_KEY.length < 20) {
      throw new Error('API key not configured');
    }

    const systemPrompt = `Anda adalah "Lekir Bot", pembantu AI rasmi untuk Kelab Pencak Silat TVETMARA Besut (TMB Fighters).
Gaya bahasa anda: Bersahabat, santai bertema Melayu silat (gunakan panggilan 'bro' / 'pendekar' / 'sahabat'), bersemangat, ringkas, dan tepat.
Fakta Utama:
- Kelab: TMB Fighters (Kelab Pencak Silat TVETMARA Besut).
- Naungan: Pertubuhan Silat Seni Gayong Malaysia (PSSGM) & Exco Sukan MPP TVETMARA Besut.
- Jurulatih: Coach Syahmi (Muhammad Syahmi bin Ahmad Omar Faizul), Jurulatih Bertauliah.
- Jadual Latihan: Isnin & Rabu, 9:00 Malam - 11:00 Malam (Bermula semester depan).
- Yuran: RM10 sebulan.
- Kategori: Silat Seni & Silat Olahraga.
- Sasaran: 30 peserta awal, namun pendaftaran sentiasa terbuka kepada semua pelajar tanpa sekatan.
- Hubungi: Coach Syahmi (010-796 5236), Pn. Azila (013-932 6767).
Jawab dalam Bahasa Melayu yang ringkas dan padat.`;

    const candidateModels = [
      'nvidia/nemotron-3.5-lightning:free',
      'openrouter/free',
      'google/gemma-4-31b-it:free',
      'google/gemma-4-26b-a4b-it:free'
    ];

    for (const model of candidateModels) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': typeof window !== 'undefined' ? (window.location.origin || 'https://tmbfighters.vercel.app') : 'https://tmbfighters.vercel.app',
            'X-Title': 'TMB Fighters Lekir Bot'
          },
          signal: controller.signal,
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            max_tokens: 350,
            temperature: 0.7,
            reasoning: { max_tokens: 0 }
          })
        });

        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          let botReply = data?.choices?.[0]?.message?.content?.trim();
          if (!botReply && data?.choices?.[0]?.message?.reasoning) {
            botReply = data.choices[0].message.reasoning.trim();
          }
          if (botReply) return botReply;
        } else {
          console.warn(`Lekir Bot [${model}] HTTP status:`, res.status);
        }
      } catch (e) {
        console.warn(`Lekir Bot [${model}] attempt failed:`, e.message);
      }
    }

    throw new Error('All LLM endpoints unreachable');
  }
}

let botInstance = null;

export function initLekirBot() {
  if (!botInstance) {
    botInstance = new LekirBot();
  }
  botInstance.init();
  return botInstance;
}
