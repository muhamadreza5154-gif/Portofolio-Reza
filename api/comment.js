import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────
//  In-Memory IP Rate Limiter (Max 2 comments per minute per IP)
// ─────────────────────────────────────────────
const ipTracker = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 menit
const MAX_REQUESTS_PER_WINDOW = 2;

// Bersihkan data tracker lama secara berkala
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipTracker.entries()) {
    if (now - data.firstReqTime > RATE_LIMIT_WINDOW_MS) {
      ipTracker.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// ─────────────────────────────────────────────
//  Profanity & Slang List
// ─────────────────────────────────────────────
const PROFANITY_LIST = [
  'tolol', 'kontol', 'bangsat', 'anjing', 'anjir',
  'anying', 'babi', 'tai', 'taik', 'memek', 'goblok', 'goblog',
  'bodoh', 'bodo', 'mampus', 'setan', 'iblis', 'bajingan', 'keparat',
  'brengsek', 'ngentot', 'ngentod', 'ngetod', 'jancok', 'jancuk', 'asu', 'celeng', 'monyet',
  'kampret', 'sialan', 'bedebah', 'sontoloyo', 'gendeng',
  'edan', 'gila', 'sinting', 'dungu', 'berengsek', 'bajing',
  'cuk', 'cok', 'lonte', 'pelacur', 'sundal', 'lacur', 'kimak', 'puki',
  'pepek', 'titit', 'toket', 'ngewe', 'bokep', 'bego', 'oon', 'anj', 'jembod',
  'kondol', 'kontod',
  // Singkatan gaul kasar
  'bgst', 'bngst', 'bgsd', 'kntl', 'kntd', 'gblk', 'gblg',
  'ajg', 'anjg', 'anjr', 'anyg', 'mmk', 'bjgn', 'bjnk',
  'tll', 'tlol', 'mmps', 'pntk', 'jnc', 'janck', 'asw',
  'kmprt', 'brngsk', 'brengsk', 'bgo', 'kacung', 'babu',
  // Penghinaan
  'jelek', 'buruk', 'payah', 'parah', 'gagal', 'pecundang', 'pengecut',
  'penghianat', 'sampah', 'najis', 'kotor', 'busuk', 'menjijikkan',
  'memalukan', 'hina', 'rendah', 'murahan', 'norak', 'kampungan',
  'ndeso', 'culun', 'alay', 'lebay', 'sotoy', 'sombong', 'congkak',
  'serakah', 'rakus', 'pemalas', 'pengemis', 'gelandangan',
  'kurang waras', 'stres', 'plonga plongo', 'jangan pake ai',
  // English
  'fuck', 'fck', 'shit', 'ass', 'asshole', 'bitch',
  'bastard', 'damn', 'crap', 'cock', 'dick', 'pussy', 'slut', 'whore',
  'nigga', 'nigger', 'cunt', 'piss', 'retard', 'moron', 'loser', 'stupid',
  'dumb', 'idiot', 'ugly', 'trash', 'garbage', 'kill', 'die',
  'kys', 'stfu', 'jerk', 'freak', 'scum', 'filthy',
  'disgusting', 'pathetic', 'worthless', 'useless', 'brainless', 'fool',
];

const PROFANITY_REGEX = new RegExp(
  PROFANITY_LIST.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i'
);

const BOT_USERNAME_REGEX = /^user_[a-z0-9]{4,}$/i;

const containsHTMLOrScript = (text) => {
  if (!text) return false;
  return /<[^>]*>|javascript:|on\w+\s*=/i.test(text);
};

const normalizeText = (raw) => {
  if (!raw) return { original: '', collapsed: '', noSeparators: '' };
  const str = raw
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/d$/g, 't')
    .replace(/d\b/g, 't');
  const collapsed = str.replace(/(.)\1+/g, (m, c) => c);
  const noSeparators = collapsed.replace(/[\s\._\-+*#@!?,]/g, '');
  return { original: raw.toLowerCase(), collapsed, noSeparators };
};

const containsProfanity = (text) => {
  if (!text) return false;
  if (containsHTMLOrScript(text)) return true;
  if (PROFANITY_REGEX.test(text)) return true;
  const { collapsed, noSeparators } = normalizeText(text);
  return PROFANITY_REGEX.test(collapsed) || PROFANITY_REGEX.test(noSeparators);
};

// ─────────────────────────────────────────────
//  Vercel Serverless Function Handler
// ─────────────────────────────────────────────
export default async function handler(req, res) {
  // Hanya menerima metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Ambil IP Pengunjung untuk Rate Limit
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown';

  const now = Date.now();
  const clientData = ipTracker.get(ip) || { count: 0, firstReqTime: now };

  if (now - clientData.firstReqTime < RATE_LIMIT_WINDOW_MS) {
    if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
      return res.status(429).json({
        error: 'Terlalu banyak permintaan. Harap tunggu 1 menit sebelum mengirim komentar lagi.',
      });
    }
    clientData.count += 1;
  } else {
    clientData.count = 1;
    clientData.firstReqTime = now;
  }
  ipTracker.set(ip, clientData);

  // 2. Validasi Input Body
  const { content, user_name, profile_image } = req.body || {};

  const trimmedName = typeof user_name === 'string' ? user_name.trim() : '';
  const trimmedContent = typeof content === 'string' ? content.trim() : '';

  if (!trimmedName || trimmedName.length < 2) {
    return res.status(400).json({ error: 'Nama minimal 2 karakter.' });
  }
  if (trimmedName.length > 50) {
    return res.status(400).json({ error: 'Nama maksimal 50 karakter.' });
  }

  if (!trimmedContent || trimmedContent.length < 1) {
    return res.status(400).json({ error: 'Komentar tidak boleh kosong.' });
  }
  if (trimmedContent.length > 500) {
    return res.status(400).json({ error: 'Komentar maksimal 500 karakter.' });
  }

  // 3. Cek Bot Pattern
  if (BOT_USERNAME_REGEX.test(trimmedName)) {
    return res.status(400).json({ error: 'Nama tidak valid. Gunakan nama asli.' });
  }

  // 4. Cek HTML & Script Injection
  if (containsHTMLOrScript(trimmedName) || containsHTMLOrScript(trimmedContent)) {
    return res.status(400).json({ error: 'Karakter kode HTML / Script tidak diizinkan.' });
  }

  // 5. Cek Profanity & Kata Kasar
  if (containsProfanity(trimmedName) || containsProfanity(trimmedContent)) {
    return res.status(400).json({ error: 'Komentar mengandung kata-kata yang tidak pantas.' });
  }

  // 6. Simpan ke Supabase
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing on server.');
    return res.status(500).json({ error: 'Konfigurasi server belum lengkap.' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('portfolio_comments')
      .insert([
        {
          content: trimmedContent,
          user_name: trimmedName,
          profile_image: profile_image || null,
          is_pinned: false,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(400).json({ error: error.message || 'Gagal menyimpan komentar.' });
    }

    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
}
