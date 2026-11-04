/**
 * Data keahlian rasmi Kelab Pencak Silat TVETMARA Besut (TMB Fighters).
 * Mengandungi 30 rekod atlet sintetik yang diselaraskan dengan pangkalan data Supabase.
 * Program: DFK, SLR, ITW, DCG, PPU, DGA (Semester 1 - 5).
 * @typedef {{
 *   id: string,
 *   name: string,
 *   program: string,
 *   phone: string,
 *   email: string,
 *   gender: 'Lelaki'|'Perempuan',
 *   health: 'Tiada'|'Ada',
 *   healthDetails: string,
 *   experience: 'Ada'|'Tiada',
 *   status: 'Diterima'|'Semakan',
 *   registeredAt: string
 * }} Registration
 */

/** @type {Registration[]} */
const SAMPLE_REGISTRATIONS = [
  // DFK (sem 1 - 5)
  { id: 'DFK2401', name: 'Muhammad Amirul bin Rosli', program: 'DFK sem 1', phone: '+60101110001', email: 'peserta01@example.test', gender: 'Lelaki', health: 'Tiada', healthDetails: '', experience: 'Ada', status: 'Diterima', registeredAt: '2026-11-02' },
  { id: 'DFK2402', name: 'Siti Aisyah binti Mohd Salleh', program: 'DFK sem 2', phone: '+60101110002', email: 'peserta02@example.test', gender: 'Perempuan', health: 'Tiada', healthDetails: '', experience: 'Ada', status: 'Diterima', registeredAt: '2026-11-01' },
  { id: 'DFK2403', name: 'Ahmad Farhan bin Osman', program: 'DFK sem 3', phone: '+60101110003', email: 'peserta03@example.test', gender: 'Lelaki', health: 'Tiada', healthDetails: '', experience: 'Tiada', status: 'Diterima', registeredAt: '2026-10-30' },
  { id: 'DFK2404', name: 'Muhammad Naim bin Bakar', program: 'DFK sem 4', phone: '+60101110004', email: 'peserta04@example.test', gender: 'Lelaki', health: 'Tiada', healthDetails: '', experience: 'Ada', status: 'Diterima', registeredAt: '2026-10-28' },
  { id: 'DFK2405', name: 'Syed Muzaffar bin Syed Ali', program: 'DFK sem 5', phone: '+60101110005', email: 'peserta05@example.test', gender: 'Lelaki', health: 'Tiada', healthDetails: '', experience: 'Ada', status: 'Diterima', registeredAt: '2026-10-27' },

  // SLR (sem 1 - 5)
  { id: 'SLR2401', name: 'Adam Daniel bin Yusof', program: 'SLR sem 1', phone: '+60101110006', email: 'peserta06@example.test', gender: 'Lelaki', health: 'Tiada', healthDetails: '', experience: 'Tiada', status: 'Diterima', registeredAt: '2026-10-26' },
  { id: 'SLR2402', name: 'Megat Iskandar bin Megat Hashim', program: 'SLR sem 2', phone: '+60101110007', email: 'peserta07@example.test', gender: 'Lelaki', health: 'Tiada', healthDetails: '', experience: 'Ada', status: 'Diterima', registeredAt: '2026-10-25' },
  { id: 'SLR2403', name: 'Muhammad Zafuan bin Zulkarnain', program: 'SLR sem 3', phone: '+60101110008', email: 'peserta08@example.test', gender: 'Lelaki', health: 'Tiada', healthDetails: '', experience: 'Ada', status: 'Diterima', registeredAt: '2026-10-24' },
  { id: 'SLR2404', name: 'Danial Haikal bin Ahmad', program: 'SLR sem 4', phone: '+60101110009', email: 'peserta09@example.test', gender: 'Lelaki', health: 'Ada', healthDetails: 'Alergi debu ringan', experience: 'Ada', status: 'Semakan', registeredAt: '2026-10-23' },
  { id: 'SLR2405', name: 'Nur Fadhilah binti Shukri', program: 'SLR sem 5', phone: '+60101110010', email: 'peserta10@example.test', gender: 'Perempuan', health: 'Ada', healthDetails: 'Asma ringan', experience: 'Ada', status: 'Semakan', registeredAt: '2026-10-22' },

  // ITW (sem 1 - 5)
  { id: 'ITW2401', name: 'Khairul Anuar bin Mansor', program: 'ITW sem 1', phone: '+60101110011', email: 'peserta11@example.test', gender: 'Lelaki', health: 'Tiada', healthDetails: '', experience: 'Tiada', status: 'Diterima', registeredAt: '2026-10-21' },
  { id: 'ITW2402', name: 'Zulhilmi bin Ariffin', program: 'ITW sem 2', phone: '+60101110012', email: 'peserta12@example.test', gender: 'Lelaki', health: 'Tiada', healthDetails: '', experience: 'Ada', status: 'Diterima', registeredAt: '2026-10-20' },
  { id: 'ITW2403', name: 'Hafizuddin bin Mahadzir', program: 'ITW sem 3', phone: '+60101110013', email: 'peserta13@example.test', gender: 'Lelaki', health: 'Tiada', healthDetails: '', experience: 'Ada', status: 'Diterima', registeredAt: '2026-10-19' },
  { id: 'ITW2404', name: 'Aiman Hakim bin Shamsul', program: 'ITW sem 4', phone: '+60101110014', email: 'peserta14@example.test', gender: 'Lelaki', health: 'Tiada', healthDetails: '', experience: 'Tiada', status: 'Diterima', registeredAt: '2026-10-18' },
  { id: 'ITW2405', name: 'Irfan Zakwan bin Zainuddin', program: 'ITW sem 5', phone: '+60101110015', email: 'peserta15@example.test', gender: 'Lelaki', health: 'Tiada', healthDetails: '', experience: 'Ada', status: 'Diterima', registeredAt: '2026-10-17' },

  // DCG (sem 1 - 5)
  { id: 'DCG2401', name: 'Nurul Izzah binti Zainal', program: 'DCG sem 1', phone: '+60101110016', email: 'peserta16@example.test', gender: 'Perempuan', health: 'Tiada', healthDetails: '', experience: 'Tiada', status: 'Diterima', registeredAt: '2026-10-16' },
  { id: 'DCG2402', name: 'Puteri Balqis binti Kamarudin', program: 'DCG sem 2', phone: '+60101110017', email: 'peserta17@example.test', gender: 'Perempuan', health: 'Tiada', healthDetails: '', experience: 'Ada', status: 'Diterima', registeredAt: '2026-10-15' },
  { id: 'DCG2403', name: 'Anis Sofea binti Khairul', program: 'DCG sem 3', phone: '+60101110018', email: 'peserta18@example.test', gender: 'Perempuan', health: 'Tiada', healthDetails: '', experience: 'Tiada', status: 'Diterima', registeredAt: '2026-10-14' },
  { id: 'DCG2404', name: 'Nurul Huda binti Ishak', program: 'DCG sem 4', phone: '+60101110019', email: 'peserta19@example.test', gender: 'Perempuan', health: 'Tiada', healthDetails: '', experience: 'Ada', status: 'Diterima', registeredAt: '2026-10-13' },
  { id: 'DCG2405', name: 'Ain Farhana binti Johari', program: 'DCG sem 5', phone: '+60101110020', email: 'peserta20@example.test', gender: 'Perempuan', health: 'Tiada', healthDetails: '', experience: 'Tiada', status: 'Diterima', registeredAt: '2026-10-12' },

  // PPU (sem 1 - 5)
  { id: 'PPU2401', name: 'Nor Natasha binti Razali', program: 'PPU sem 1', phone: '+60101110021', email: 'peserta21@example.test', gender: 'Perempuan', health: 'Ada', healthDetails: 'Pernah cedera pergelangan', experience: 'Ada', status: 'Semakan', registeredAt: '2026-10-11' },
  { id: 'PPU2402', name: 'Farah Nadia binti Nazri', program: 'PPU sem 2', phone: '+60101110022', email: 'peserta22@example.test', gender: 'Perempuan', health: 'Tiada', healthDetails: '', experience: 'Ada', status: 'Diterima', registeredAt: '2026-10-10' },
  { id: 'PPU2403', name: 'Nur Ain Syuhada binti Baharuddin', program: 'PPU sem 3', phone: '+60101110023', email: 'peserta23@example.test', gender: 'Perempuan', health: 'Tiada', healthDetails: '', experience: 'Tiada', status: 'Diterima', registeredAt: '2026-10-09' },
  { id: 'PPU2404', name: 'Harith Irfan bin Zulkifli', program: 'PPU sem 4', phone: '+60101110024', email: 'peserta24@example.test', gender: 'Lelaki', health: 'Tiada', healthDetails: '', experience: 'Tiada', status: 'Semakan', registeredAt: '2026-10-08' },
  { id: 'PPU2405', name: 'Luqman Hakim bin Azhar', program: 'PPU sem 5', phone: '+60101110025', email: 'peserta25@example.test', gender: 'Lelaki', health: 'Tiada', healthDetails: '', experience: 'Ada', status: 'Diterima', registeredAt: '2026-10-07' },

  // DGA (sem 1 - 5)
  { id: 'DGA2401', name: 'Wan Nur Syakirah binti Wan Hassan', program: 'DGA sem 1', phone: '+60101110026', email: 'peserta26@example.test', gender: 'Perempuan', health: 'Ada', healthDetails: 'Migrain berkala', experience: 'Ada', status: 'Semakan', registeredAt: '2026-10-06' },
  { id: 'DGA2402', name: 'Fatin Nabilah binti Che Mat', program: 'DGA sem 2', phone: '+60101110027', email: 'peserta27@example.test', gender: 'Perempuan', health: 'Tiada', healthDetails: '', experience: 'Ada', status: 'Diterima', registeredAt: '2026-10-05' },
  { id: 'DGA2403', name: 'Nur Sabrina binti Halim', program: 'DGA sem 3', phone: '+60101110028', email: 'peserta28@example.test', gender: 'Perempuan', health: 'Tiada', healthDetails: '', experience: 'Tiada', status: 'Diterima', registeredAt: '2026-10-04' },
  { id: 'DGA2404', name: 'Nurul Asyiqin binti Mazlan', program: 'DGA sem 4', phone: '+60101110029', email: 'peserta29@example.test', gender: 'Perempuan', health: 'Tiada', healthDetails: '', experience: 'Ada', status: 'Diterima', registeredAt: '2026-10-03' },
  { id: 'DGA2405', name: 'Nur Kamilia binti Mohd Radzi', program: 'DGA sem 5', phone: '+60101110030', email: 'peserta30@example.test', gender: 'Perempuan', health: 'Tiada', healthDetails: '', experience: 'Ada', status: 'Diterima', registeredAt: '2026-10-02' }
];

/**
 * Pulangkan senarai penuh pendaftaran untuk dashboard dan semakan awam.
 * @returns {Registration[]}
 */
export function listSampleRegistrations() {
  return [...SAMPLE_REGISTRATIONS];
}

/**
 * Tambah pendaftaran baharu secara in-memory untuk sesi semasa.
 * @param {Omit<Registration, 'id' | 'status' | 'registeredAt'>} data
 * @returns {Registration}
 */
export function addRegistration(data) {
  const newRow = {
    id: data.matricNumber || `TMB-${String(SAMPLE_REGISTRATIONS.length + 1).padStart(3, '0')}`,
    name: data.fullName || 'Peserta Baharu',
    program: data.program || 'DFK sem 1',
    phone: data.phone || '',
    email: data.email || '',
    gender: data.gender || 'Lelaki',
    health: data.health || 'Tiada',
    healthDetails: data.healthDetails || '',
    experience: data.experience || 'Tiada',
    status: 'Diterima',
    registeredAt: new Date().toISOString().slice(0, 10)
  };
  SAMPLE_REGISTRATIONS.unshift(newRow);
  return newRow;
}

/** Normalize a Malaysian phone number into wa.me's digits-only format. */
export function whatsappUrl(phone) {
  const digits = String(phone || '').replace(/\D/g, '').replace(/^0/, '60');
  return `https://wa.me/${encodeURIComponent(digits)}`;
}
