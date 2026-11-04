import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://avdbuqyxckswmexackwc.supabase.co';

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGJ1cXl4Y2tzd21leGFja3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3NjUyNTUsImV4cCI6MjEwOTM0MTI1NX0.hxt9wMXHxg3AFl0vHJKmY9zFRNobzs-RPPENemgRwlo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function normalizeMatricNumber(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export function validateMalaysianIC(ic) {
  if (!ic || typeof ic !== 'string') return false;
  const digits = ic.replace(/\D/g, '');
  return digits.length === 12;
}

export function maskIC(ic) {
  if (!ic) return '••••••-••-••••';
  const digits = String(ic).replace(/\D/g, '');
  if (digits.length === 12) {
    return `••••••-••-${digits.slice(8)}`;
  }
  return '••••••-••-••••';
}

/**
 * Normalizes any program and semester input to canonical "CODE Sem X" format.
 * Supports both single string "DFK sem 1" and two arguments ("DFK", "Sem 1").
 * Examples:
 *   "dfk sem 1" -> "DFK Sem 1"
 *   "DFK SEM 1" -> "DFK Sem 1"
 *   "dga semester 3" -> "DGA Sem 3"
 *   "ITW Sem2" -> "ITW Sem 2"
 *   "DFK 1" -> "DFK Sem 1"
 *   formatProgramSemester('DFK', 'Sem 1') -> "DFK Sem 1"
 */
export function formatProgramSemester(courseOrRaw, maybeSemester) {
  if (maybeSemester) {
    const course = String(courseOrRaw || '').trim().toUpperCase();
    const semDigits = String(maybeSemester).replace(/\D/g, '');
    const semNum = semDigits ? semDigits.charAt(0) : '1';
    return `${course} Sem ${semNum}`;
  }

  const raw = String(courseOrRaw || '').trim();
  if (!raw) return '';

  // Pattern 1: Code + optional separator + Sem/Semester + optional space + digit
  // e.g., 'DFK Sem 1', 'dfk sem 1', 'DFK SEM 1', 'DFK Sem1', 'DFK Semester 1', 'DFK - Sem 1'
  const semMatch = raw.match(/^([A-Za-z]{2,10})\s*[-/]?\s*(?:sem(?:ester)?|s)\.?\s*([0-9]+)$/i);
  if (semMatch) {
    return `${semMatch[1].toUpperCase()} Sem ${semMatch[2]}`;
  }

  // Pattern 2: Standalone semester only, e.g. 'Sem 1', 'sem 3', 'Semester 2'
  const semOnlyMatch = raw.match(/^(?:sem(?:ester)?|s)\.?\s*([0-9]+)$/i);
  if (semOnlyMatch) {
    return `Sem ${semOnlyMatch[1]}`;
  }

  // Pattern 3: Code + digit directly, e.g. 'DFK 1', 'SLR 5', 'dfk 2' (excluding words like 'sem', 'semester')
  const codeDigitMatch = raw.match(/^(?!sem(?:ester)?$)([A-Za-z]{2,10})\s*[-/]?\s*([1-8])$/i);
  if (codeDigitMatch) {
    return `${codeDigitMatch[1].toUpperCase()} Sem ${codeDigitMatch[2]}`;
  }

  // Pattern 4: Just code without semester, e.g. 'DFK', 'slr' (excluding 'sem', 'semester')
  const codeOnlyMatch = raw.match(/^(?!sem(?:ester)?$)([A-Za-z]{2,10})$/i);
  if (codeOnlyMatch) {
    return codeOnlyMatch[1].toUpperCase();
  }

  // Fallback: Return trimmed original string
  return raw;
}

/**
 * Parses a program string into its constituent code and semester components.
 * Used for admin filtering and multi-criteria breakdown.
 */
export function parseProgramDetails(raw) {
  if (!raw || typeof raw !== 'string') {
    return { code: '', semester: '', semNum: null, raw: '' };
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return { code: '', semester: '', semNum: null, raw: '' };
  }

  // Pattern 1: Code + Semester
  const semMatch = trimmed.match(/^([A-Za-z]{2,10})\s*[-/]?\s*(?:sem(?:ester)?|s)\.?\s*([0-9]+)$/i);
  if (semMatch) {
    const code = semMatch[1].toUpperCase();
    const semNum = semMatch[2];
    return {
      code,
      semester: `Sem ${semNum}`,
      semNum,
      raw: trimmed,
    };
  }

  // Pattern 2: Standalone semester only
  const semOnlyMatch = trimmed.match(/^(?:sem(?:ester)?|s)\.?\s*([0-9]+)$/i);
  if (semOnlyMatch) {
    return {
      code: '',
      semester: `Sem ${semOnlyMatch[1]}`,
      semNum: semOnlyMatch[1],
      raw: trimmed,
    };
  }

  // Pattern 3: Code + digit directly
  const codeDigitMatch = trimmed.match(/^(?!sem(?:ester)?$)([A-Za-z]{2,10})\s*[-/]?\s*([1-8])$/i);
  if (codeDigitMatch) {
    const code = codeDigitMatch[1].toUpperCase();
    const semNum = codeDigitMatch[2];
    return {
      code,
      semester: `Sem ${semNum}`,
      semNum,
      raw: trimmed,
    };
  }

  // Pattern 4: Just code
  const codeOnlyMatch = trimmed.match(/^(?!sem(?:ester)?$)([A-Za-z]{2,10})$/i);
  if (codeOnlyMatch) {
    return {
      code: codeOnlyMatch[1].toUpperCase(),
      semester: '',
      semNum: null,
      raw: trimmed,
    };
  }

  return {
    code: '',
    semester: '',
    semNum: null,
    raw: trimmed,
  };
}

/**
 * Public registration handler for new athletes/members
 */
export async function registerMember(data) {
  try {
    const matricNumber = normalizeMatricNumber(data.matricNumber);
    const rawIc = (data.icNumber || '').replace(/\D/g, '').slice(0, 12);
    const formattedIc =
      rawIc.length === 12
        ? `${rawIc.slice(0, 6)}-${rawIc.slice(6, 8)}-${rawIc.slice(8, 12)}`
        : (data.icNumber || '').trim();

    const payload = {
      full_name: (data.fullName || '').trim().toUpperCase(),
      ic_number: formattedIc,
      matric_number: matricNumber,
      member_id: matricNumber,
      program: formatProgramSemester(data.program),
      phone: (data.phone || '').trim(),
      email: (data.email || '').trim().toLowerCase(),
      gender: data.gender,
      health: data.health,
      health_details: data.health === 'Ada' ? (data.healthDetails || '').trim() : '',
      experience: data.experience,
      status: 'Semakan',
      membership_status: 'Aktif',
    };

    const { data: created, error } = await supabase
      .from('members')
      .insert([payload])
      .select()
      .single();

    if (error) {
      let userFriendlyMessage = error.message || 'Ralat semasa menghantar borang pendaftaran.';
      
      if (userFriendlyMessage.includes('No. Matrik')) {
        userFriendlyMessage = userFriendlyMessage.replace(/^.*?No\. Matrik/, 'No. Matrik');
      } else if (userFriendlyMessage.includes('No. Kad Pengenalan')) {
        userFriendlyMessage = userFriendlyMessage.replace(/^.*?No\. Kad Pengenalan/, 'No. Kad Pengenalan');
      } else if (userFriendlyMessage.includes('Nama atlet')) {
        userFriendlyMessage = userFriendlyMessage.replace(/^.*?Nama atlet/, 'Nama atlet');
      } else if (userFriendlyMessage.includes('Nombor telefon')) {
        userFriendlyMessage = userFriendlyMessage.replace(/^.*?Nombor telefon/, 'Nombor telefon');
      } else if (userFriendlyMessage.includes('Alamat email')) {
        userFriendlyMessage = userFriendlyMessage.replace(/^.*?Alamat email/, 'Alamat email');
      } else if (
        error.code === '23505' ||
        error.message?.includes('duplicate key') ||
        error.message?.includes('unique')
      ) {
        if (error.message?.includes('ic_number')) {
          userFriendlyMessage = 'No. Kad Pengenalan (IC) ini telah pun didaftarkan dalam sistem.';
        } else if (error.message?.includes('email')) {
          userFriendlyMessage = 'Alamat email ini telah pun digunakan untuk pendaftaran.';
        } else if (error.message?.includes('phone')) {
          userFriendlyMessage = 'Nombor telefon/WhatsApp ini telah pun didaftarkan.';
        } else {
          userFriendlyMessage = 'Maklumat ini (No. Matrik / IC / Nama) telah pun didaftarkan dalam sistem.';
        }
      }

      return {
        data: null,
        error: new Error(userFriendlyMessage),
      };
    }

    return { data: created, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Fetch list of confirmed registered members for public tracker (safe fields only)
 */
export async function getPublicRegisteredMembers() {
  try {
    const { data, error } = await supabase
      .from('public_registered_members')
      .select('id, full_name, program, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return { members: [], error: new Error(error.message) };
    }
    return { members: data || [], error: null };
  } catch (err) {
    return { members: [], error: err };
  }
}

/**
 * Admin authentication with role verification
 */
export async function loginAdmin(username, password) {
  try {
    const clean = (username || '').trim().toLowerCase();
    const email = clean.includes('@') ? clean : `${clean}@tmbfighters.com`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        session: null,
        user: null,
        error: new Error('Username atau kata laluan tidak sah. Sila semak semula butiran anda.'),
      };
    }

    const user = data.user || data.session?.user;
    const isAdmin =
      user?.app_metadata?.role === 'admin' ||
      user?.email === 'admin@tmbfighters.com' ||
      user?.email?.startsWith('admin@');

    if (!isAdmin) {
      await supabase.auth.signOut();
      return {
        session: null,
        user: null,
        error: new Error('Akaun ini tidak mempunyai akses pentadbir (admin).'),
      };
    }

    return { session: data.session, user: data.user, error: null };
  } catch (err) {
    return { session: null, user: null, error: err };
  }
}

/**
 * Athlete authentication using Student Matric Number
 * Currently locked for new intake period: Access will open next semester.
 */
export async function loginAthlete(matricNumber, password) {
  return {
    session: null,
    user: null,
    error: new Error('Akses portal atlet akan dibuka semester depan.'),
  };
}

/**
 * Fetch profile and payment history for the authenticated athlete
 */
export async function getAthleteProfile(userId) {
  try {
    let member = null;
    let memberErr = null;

    if (userId) {
      const res = await supabase.from('members').select('*').eq('user_id', userId).maybeSingle();
      member = res.data;
      memberErr = res.error;
    }

    // Fallback if user_id column in members wasn't populated yet: look up by matric number in user_metadata
    if (!member) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const matric = user?.user_metadata?.matric_number;
      if (matric) {
        const res = await supabase
          .from('members')
          .select('*')
          .eq('matric_number', matric.toUpperCase())
          .maybeSingle();
        if (res.data) {
          member = res.data;
          memberErr = null;
        }
      }
    }

    // Fetch payments (DO NOT filter by user_id column; payments table links via athlete_id / RLS)
    const { data: payments, error: paymentsErr } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    return {
      member,
      payments: payments || [],
      error: memberErr || paymentsErr ? new Error((memberErr || paymentsErr).message) : null,
    };
  } catch (err) {
    return { member: null, payments: [], error: err };
  }
}

/**
 * Upload athlete profile picture to Supabase Storage bucket 'avatars'
 */
export async function uploadAthletePhoto(userId, file) {
  try {
    if (!file) {
      return { publicUrl: null, error: new Error('Sila pilih fail imej untuk dimuat naik.') };
    }

    // Client-side validations
    if (file.size > 2 * 1024 * 1024) {
      return {
        publicUrl: null,
        error: new Error('Saiz gambar melebihi had maksimum 2MB. Sila pilih gambar yang lebih kecil.'),
      };
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return {
        publicUrl: null,
        error: new Error(
          'Format fail tidak disokong. Sila muat naik imej dalam format JPG, PNG, WebP atau GIF.'
        ),
      };
    }

    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const filePath = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { contentType: file.type, upsert: true });

    if (uploadError) {
      return {
        publicUrl: null,
        error: new Error('Gagal memuat naik ke storan: ' + uploadError.message),
      };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath);

    // Persist new avatar URL to members table
    const { error: updateError } = await supabase
      .from('members')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateError) {
      // If user_id wasn't set, try updating by matric
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const matric = user?.user_metadata?.matric_number;
      if (matric) {
        await supabase
          .from('members')
          .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('matric_number', matric.toUpperCase());
      }
    }

    return { publicUrl, error: null };
  } catch (err) {
    return { publicUrl: null, error: err };
  }
}

/**
 * Query full member list and payments for the admin dashboard
 */
export async function getAdminDashboardData() {
  try {
    const { data: members, error: membersErr } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: payments, error: paymentsErr } = await supabase
      .from('payments')
      .select('*');

    return {
      members: members || [],
      payments: payments || [],
      error: membersErr || paymentsErr ? new Error((membersErr || paymentsErr).message) : null,
    };
  } catch (err) {
    return { members: [], payments: [], error: err };
  }
}

/**
 * Session & Auth State Helpers
 */
export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Update member record (Admin action)
 */
export async function updateMemberRecord(id, updates) {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    if (payload.full_name) payload.full_name = payload.full_name.trim().toUpperCase();
    if (payload.program) payload.program = formatProgramSemester(payload.program);
    if (payload.matric_number) {
      payload.matric_number = normalizeMatricNumber(payload.matric_number);
      payload.member_id = payload.matric_number;
    }

    const { data, error } = await supabase
      .from('members')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Delete member record (Admin action)
 */
export async function deleteMemberRecord(id) {
  try {
    // Delete related payments first to ensure referential integrity
    await supabase.from('payments').delete().eq('member_id', id);
    const { error } = await supabase.from('members').delete().eq('id', id);
    return { error };
  } catch (err) {
    return { error: err };
  }
}
