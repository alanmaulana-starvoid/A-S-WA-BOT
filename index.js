process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino'), readline = require('readline'), fs = require('fs'), https = require('https');
const logger = pino({ level: 'silent' }), activeSpams = new Map(), activeATL = new Map(), activeGuestNumber = new Map(), activeGuestEmoji = new Map(), activeCW = new Map(), botSentIds = new Set(), AUTO_RESPONSE_FILE = './auto_response.json';

const BOT_INFO = {
    name: 'A-S Bot WA',
    version: '1.4.0',
    owner: 'alanmaulana-starvoid',
    description: 'Bot WhatsApp utilitas & otomasi privat'
};

const NUMBER_COMMANDS = {
    1: '/Test',
    2: '/A-S Guide',
    3: '/A-S help',
    4: '/Auto spam',
    5: '/S auto',
    6: '/Add Auto response',
    7: '/Delete Auto response',
    8: '/Auto response on',
    9: '/Auto response off',
    10: '/Auto response list',
    11: '/Set',
    12: '/Summary',
    13: '/Translate',
    14: '/Calculate',
    15: '/Covert',
    16: '/Info',
    17: '/TOL',
    18: '/Number command on',
    19: '/Number command off',
    20: '/ATL',
    21: '/Guest number',
    22: '/Guest emoji',
    23: '/CW'
};

const ATL_WORDS = [
    // 5 Huruf
    { word: 'KURSI', cat: 'Benda' }, { word: 'LAMPU', cat: 'Benda' }, { word: 'PINTU', cat: 'Benda' },
    { word: 'GELAS', cat: 'Benda' }, { word: 'PISAU', cat: 'Benda' }, { word: 'KUNCI', cat: 'Benda' },
    { word: 'KASUR', cat: 'Benda' }, { word: 'RAKUS', cat: 'Sifat' }, { word: 'SUKAR', cat: 'Sifat' },
    { word: 'KURAS', cat: 'Aktivitas' }, { word: 'SURAT', cat: 'Benda' }, { word: 'GAJAH', cat: 'Hewan' },
    { word: 'MACAN', cat: 'Hewan' }, { word: 'ELANG', cat: 'Hewan' }, { word: 'PENYU', cat: 'Hewan' },
    { word: 'ZEBRA', cat: 'Hewan' }, { word: 'BADAK', cat: 'Hewan' }, { word: 'SEMUT', cat: 'Hewan' },
    { word: 'LEBAH', cat: 'Hewan' }, { word: 'CICAK', cat: 'Hewan' }, { word: 'UDANG', cat: 'Hewan' },
    { word: 'JERUK', cat: 'Buah' }, { word: 'NANAS', cat: 'Buah' }, { word: 'MELON', cat: 'Buah' },
    { word: 'SALAK', cat: 'Buah' }, { word: 'JAMBU', cat: 'Buah' }, { word: 'TOMAT', cat: 'Sayuran' },
    { word: 'BAYAM', cat: 'Sayuran' }, { word: 'BAMBU', cat: 'Tanaman' }, { word: 'HUJAN', cat: 'Alam' },
    { word: 'ANGIN', cat: 'Alam' }, { word: 'OMBAK', cat: 'Alam' }, { word: 'TANAH', cat: 'Alam' },
    { word: 'PASIR', cat: 'Alam' }, { word: 'KABUT', cat: 'Alam' }, { word: 'BADAI', cat: 'Alam' },
    { word: 'SINAR', cat: 'Alam' }, { word: 'BULAN', cat: 'Alam' }, { word: 'DUNIA', cat: 'Alam' },
    { word: 'PASAR', cat: 'Tempat' }, { word: 'TAMAN', cat: 'Tempat' }, { word: 'HOTEL', cat: 'Tempat' },
    { word: 'HUTAN', cat: 'Tempat' }, { word: 'DANAU', cat: 'Tempat' }, { word: 'PULAU', cat: 'Tempat' },
    { word: 'LAYAR', cat: 'Teknologi' }, { word: 'SUARA', cat: 'Umum' }, { word: 'WARNA', cat: 'Umum' },
    { word: 'WAKTU', cat: 'Umum' }, { word: 'MIMPI', cat: 'Umum' }, { word: 'MUSIK', cat: 'Seni' },
    // 6 Huruf
    { word: 'KERBAU', cat: 'Hewan' }, { word: 'KUCING', cat: 'Hewan' }, { word: 'ANJING', cat: 'Hewan' },
    { word: 'MONYET', cat: 'Hewan' }, { word: 'CAPUNG', cat: 'Hewan' }, { word: 'MANGGA', cat: 'Buah' },
    { word: 'PISANG', cat: 'Buah' }, { word: 'PEPAYA', cat: 'Buah' }, { word: 'DURIAN', cat: 'Buah' },
    { word: 'ANGGUR', cat: 'Buah' }, { word: 'WORTEL', cat: 'Sayuran' }, { word: 'JAGUNG', cat: 'Tanaman' },
    { word: 'KELAPA', cat: 'Tanaman' }, { word: 'PANTAI', cat: 'Tempat' }, { word: 'SUNGAI', cat: 'Tempat' },
    { word: 'GUNUNG', cat: 'Tempat' }, { word: 'KANTOR', cat: 'Tempat' }, { word: 'APOTEK', cat: 'Tempat' },
    { word: 'MASJID', cat: 'Tempat' }, { word: 'GEREJA', cat: 'Tempat' }, { word: 'WARUNG', cat: 'Tempat' },
    { word: 'MUSEUM', cat: 'Tempat' }, { word: 'KAMERA', cat: 'Teknologi' }, { word: 'LAPTOP', cat: 'Teknologi' },
    { word: 'PONSEL', cat: 'Teknologi' }, { word: 'SINYAL', cat: 'Teknologi' }, { word: 'SEPEDA', cat: 'Kendaraan' },
    { word: 'KERETA', cat: 'Kendaraan' }, { word: 'PERAHU', cat: 'Kendaraan' }, { word: 'DOKTER', cat: 'Profesi' },
    { word: 'POLISI', cat: 'Profesi' }, { word: 'PETANI', cat: 'Profesi' }, { word: 'PELAUT', cat: 'Profesi' },
    { word: 'LEMARI', cat: 'Benda' }, { word: 'PAYUNG', cat: 'Benda' }, { word: 'CERITA', cat: 'Umum' },
    { word: 'BAHASA', cat: 'Ilmu' },
    // 7 Huruf
    { word: 'KELINCI', cat: 'Hewan' }, { word: 'HARIMAU', cat: 'Hewan' }, { word: 'JERAPAH', cat: 'Hewan' },
    { word: 'KEDELAI', cat: 'Tanaman' }, { word: 'ALPUKAT', cat: 'Buah' }, { word: 'MANGGIS', cat: 'Buah' },
    { word: 'SEKOLAH', cat: 'Tempat' }, { word: 'BANDARA', cat: 'Tempat' }, { word: 'STASIUN', cat: 'Tempat' },
    { word: 'BIOSKOP', cat: 'Tempat' }, { word: 'PESAWAT', cat: 'Kendaraan' }, { word: 'GEROBAK', cat: 'Kendaraan' },
    { word: 'BINTANG', cat: 'Alam' }, { word: 'PELANGI', cat: 'Alam' }, { word: 'GERHANA', cat: 'Alam' },
    { word: 'SAMUDRA', cat: 'Alam' }, { word: 'JENDELA', cat: 'Benda' }, { word: 'SELIMUT', cat: 'Benda' },
    { word: 'CANGKIR', cat: 'Benda' }, { word: 'GUNTING', cat: 'Benda' }, { word: 'NELAYAN', cat: 'Profesi' },
    { word: 'PERAWAT', cat: 'Profesi' }, { word: 'TENTARA', cat: 'Profesi' }, { word: 'PELUKIS', cat: 'Profesi' },
    { word: 'PENULIS', cat: 'Profesi' }, { word: 'SEJARAH', cat: 'Ilmu' }, { word: 'EKONOMI', cat: 'Ilmu' },
    { word: 'LIBURAN', cat: 'Aktivitas' }, { word: 'SAHABAT', cat: 'Umum' }, { word: 'MAKANAN', cat: 'Umum' },
    { word: 'MINUMAN', cat: 'Umum' },
    // 8 Huruf
    { word: 'KOMPUTER', cat: 'Teknologi' }, { word: 'INTERNET', cat: 'Teknologi' }, { word: 'APLIKASI', cat: 'Teknologi' },
    { word: 'JARINGAN', cat: 'Teknologi' }, { word: 'KEPITING', cat: 'Hewan' }, { word: 'BELALANG', cat: 'Hewan' },
    { word: 'RAMBUTAN', cat: 'Buah' }, { word: 'SEMANGKA', cat: 'Buah' }, { word: 'MATAHARI', cat: 'Alam' },
    { word: 'KACAMATA', cat: 'Benda' }, { word: 'PEDAGANG', cat: 'Profesi' }, { word: 'INSINYUR', cat: 'Profesi' },
    { word: 'OLAHRAGA', cat: 'Aktivitas' }, { word: 'GEOGRAFI', cat: 'Ilmu' },
    // 9 Huruf
    { word: 'KELELAWAR', cat: 'Hewan' }, { word: 'PENGHAPUS', cat: 'Benda' }, { word: 'PENGGARIS', cat: 'Benda' },
    { word: 'PELABUHAN', cat: 'Tempat' }, { word: 'KENDARAAN', cat: 'Umum' }, { word: 'PERMAINAN', cat: 'Umum' },
    { word: 'KESEHATAN', cat: 'Umum' }, { word: 'NUSANTARA', cat: 'Geografi' }, { word: 'INDONESIA', cat: 'Negara' },
    { word: 'TEKNOLOGI', cat: 'Ilmu' }, { word: 'ASTRONOMI', cat: 'Ilmu' },
    // 10 Huruf
    { word: 'MATEMATIKA', cat: 'Ilmu' }, { word: 'HALILINTAR', cat: 'Alam' }, { word: 'LINGKUNGAN', cat: 'Alam' },
    { word: 'PENGADILAN', cat: 'Tempat' }, { word: 'PERJALANAN', cat: 'Aktivitas' }, { word: 'PENDIDIKAN', cat: 'Umum' },
    { word: 'KEBERSIHAN', cat: 'Umum' }, { word: 'KOMUNIKASI', cat: 'Umum' }
].filter(item => item.word.length >= 5 && item.word.length <= 10);

// Daftar soal benda rahasia berdasarkan petunjuk emoji untuk /Guest emoji
const EMOJI_ITEMS = [
    { emojis: '📱 🔋 🔌', answers: ['CHARGER', 'PENGISI DAYA', 'CASAN'], category: 'Elektronik' },
    { emojis: '🌧️ ☂️ 💧', answers: ['PAYUNG'], category: 'Perlengkapan' },
    { emojis: '📸 🎞️ 🖼️', answers: ['KAMERA'], category: 'Elektronik' },
    { emojis: '⏰ 🔔 🛏️', answers: ['JAM WEKER', 'ALARM', 'JAM'], category: 'Benda Rumah' },
    { emojis: '🔑 🔒 🚪', answers: ['GEMBOK', 'KUNCI'], category: 'Keamanan' },
    { emojis: '🧹 🗑️ 🏠', answers: ['SAPU'], category: 'Alat Kebersihan' },
    { emojis: '👓 📖 👀', answers: ['KACAMATA'], category: 'Aksesoris' },
    { emojis: '✂️ 📄 📏', answers: ['GUNTING'], category: 'Alat Tulis' },
    { emojis: '🎸 🎶 🎤', answers: ['GITAR'], category: 'Alat Musik' },
    { emojis: '🔭 🌌 ⭐', answers: ['TELESKOP', 'TEROPONG BINTANG'], category: 'Sains' },
    { emojis: '🔬 🧪 🦠', answers: ['MIKROSKOP'], category: 'Sains' },
    { emojis: '🌡️ 🤒 🏥', answers: ['TERMOMETER', 'PENGUKUR SUHU'], category: 'Alat Medis' },
    { emojis: '🪥 🦷 🫧', answers: ['SIKAT GIGI'], category: 'Kamar Mandi' },
    { emojis: '🕯️ 🔥 🎂', answers: ['LILIN'], category: 'Benda Rumah' },
    { emojis: '🧲 🔩 📎', answers: ['MAGNET'], category: 'Sains' },
    { emojis: '🔦 🌑 🔋', answers: ['SENTER'], category: 'Elektronik' },
    { emojis: '🎧 🎵 📱', answers: ['HEADPHONE', 'HEADSET', 'EARPHONE'], category: 'Elektronik' },
    { emojis: '🖨️ 📄 🏢', answers: ['PRINTER', 'MESIN CETAK'], category: 'Elektronik' },
    { emojis: '🚲 ⚙️ ⛓️', answers: ['SEPEDA'], category: 'Kendaraan' },
    { emojis: '🚁 💨 ☁️', answers: ['HELIKOPTER'], category: 'Kendaraan' },
    { emojis: '🚀 🌕 👨‍🚀', answers: ['ROKET'], category: 'Kendaraan' },
    { emojis: '⚓ 🚢 🌊', answers: ['JANGKAR'], category: 'Maritim' },
    { emojis: '🎻 🎼 🎶', answers: ['BIOLA'], category: 'Alat Musik' },
    { emojis: '🎹 🎵 🎼', answers: ['PIANO', 'KEYBOARD'], category: 'Alat Musik' },
    { emojis: '🥁 🎶 🎵', answers: ['DRUM', 'BEDUG'], category: 'Alat Musik' },
    { emojis: '🧯 🔥 🚨', answers: ['APAR', 'PEMADAM API', 'TABUNG PEMADAM'], category: 'Keamanan' },
    { emojis: '🧳 ✈️ 🎫', answers: ['KOPER'], category: 'Perjalanan' },
    { emojis: '🎒 📚 ✏️', answers: ['RANSEL', 'TAS', 'TAS SEKOLAH'], category: 'Perlengkapan' },
    { emojis: '🪞 💄 💇', answers: ['CERMIN', 'KACA'], category: 'Benda Rumah' },
    { emojis: '🧼 🫧 👐', answers: ['SABUN'], category: 'Kamar Mandi' },
    { emojis: '🩺 ❤️ 👨‍⚕️', answers: ['STETOSKOP'], category: 'Alat Medis' },
    { emojis: '💉 🏥 💊', answers: ['SUNTIKAN', 'JARUM SUNTIK'], category: 'Alat Medis' },
    { emojis: '🔨 🪵 🔩', answers: ['PALU', 'MARTIL'], category: 'Perkakas' },
    { emojis: '🪜 🏠 ⬆️', answers: ['TANGGA'], category: 'Perkakas' },
    { emojis: '🪣 💧 🧽', answers: ['EMBER'], category: 'Alat Kebersihan' },
    { emojis: '🥄 🥣 🍜', answers: ['SENDOK'], category: 'Alat Makan' },
    { emojis: '🍴 🍝 🍽️', answers: ['GARPU'], category: 'Alat Makan' },
    { emojis: '🔪 🧅 🍳', answers: ['PISAU'], category: 'Alat Dapur' },
    { emojis: '🧊 🥤 ❄️', answers: ['ES BATU', 'ES'], category: 'Dapur' },
    { emojis: '🎈 🎉 🎂', answers: ['BALON'], category: 'Pesta' },
    { emojis: '🎁 🎀 🎉', answers: ['KADO', 'HADIAH'], category: 'Pesta' },
    { emojis: '🏆 🥇 🎖️', answers: ['PIALA', 'TROFI'], category: 'Penghargaan' },
    { emojis: '🧭 🗺️ ⛵', answers: ['KOMPAS'], category: 'Navigasi' },
    { emojis: '📡 🛰️ 📺', answers: ['ANTENA', 'PARABOLA'], category: 'Elektronik' },
    { emojis: '🔋 ⚡ 📱', answers: ['BATERAI', 'POWERBANK'], category: 'Elektronik' },
    { emojis: '💡 🏠 ⚡', answers: ['LAMPU', 'BOHLAM'], category: 'Elektronik' },
    { emojis: '🛏️ 😴 💤', answers: ['KASUR', 'TEMPAT TIDUR', 'RANJANG'], category: 'Perabot' },
    { emojis: '🪑 🪵 🏠', answers: ['KURSI'], category: 'Perabot' },
    { emojis: '🚪 🔑 🏠', answers: ['PINTU'], category: 'Bangunan' },
    { emojis: '🪟 ☀️ 🌬️', answers: ['JENDELA'], category: 'Bangunan' },
    { emojis: '💻 ⌨️ 🖱️', answers: ['LAPTOP', 'KOMPUTER'], category: 'Elektronik' },
    { emojis: '⌚ 🏃 ❤️', answers: ['JAM TANGAN', 'SMARTWATCH'], category: 'Aksesoris' },
    { emojis: '👑 💎 🤴', answers: ['MAHKOTA'], category: 'Aksesoris' },
    { emojis: '🛡️ ⚔️ 🏰', answers: ['PERISAI', 'TAMENG'], category: 'Benda Sejarah' },
    { emojis: '🏹 🎯 🪶', answers: ['BUSUR', 'PANAH', 'BUSUR PANAH'], category: 'Olahraga' },
    { emojis: '🎣 🐟 🌊', answers: ['PANCING', 'PANCINGAN', 'JORAN'], category: 'Hobi' },
    { emojis: '🚑 🚨 🏥', answers: ['AMBULANS', 'AMBULAN'], category: 'Kendaraan' },
    { emojis: '🚒 🔥 🚨', answers: ['MOBIL PEMADAM', 'TRUK PEMADAM'], category: 'Kendaraan' }
];

// Kamus kata Bahasa Indonesia untuk /CW (Connect Word)
const CW_WORDS = [
    ...ATL_WORDS.map(w => w.word),
    'AIR', 'API', 'AKAR', 'AWAN', 'ANAK', 'AYAM', 'APEL', 'ASAP', 'ATAP', 'ALAM',
    'BUKU', 'BATU', 'BOLA', 'BAJU', 'BUMI', 'BUNGA', 'BURUNG', 'BUAH', 'BERAS', 'BOTOL',
    'CINTA', 'CAHAYA', 'CINCIN', 'CUACA', 'COKLAT', 'CABAI', 'CACING', 'CANDI', 'CERMIN',
    'DAUN', 'DARAH', 'DINDING', 'DAPUR', 'DOMBA', 'DEBU', 'DAGING', 'DOMPET', 'DRAMA',
    'EMAS', 'EKOR', 'EMBER', 'EMPUK', 'ENERGI', 'ESKRIM', 'EDUKASI', 'EFISIEN',
    'FOTO', 'FILM', 'FISIKA', 'FAJAR', 'FAKTA', 'FLORA', 'FAUNA', 'FUNGSI',
    'GULA', 'GARAM', 'GARIS', 'GELAP', 'GITAR', 'GURU', 'GIGI', 'GAUN', 'GEMPA',
    'HARI', 'HATI', 'HITAM', 'HIJAU', 'HEWAN', 'HARGA', 'HADIAH', 'HIDUP', 'HURUF',
    'IKAN', 'IBU', 'ILMU', 'INTAN', 'ISTANA', 'IMPIAN', 'INDAH', 'INGAT', 'IRAMA',
    'JALAN', 'JARUM', 'JANTUNG', 'JAMUR', 'JEMBATAN', 'JENDELA', 'JUJUR', 'JURNAL',
    'KATA', 'KAKI', 'KAYU', 'KERTAS', 'KAPAL', 'KOTA', 'KOLAM', 'KACANG', 'KEBUN',
    'LAUT', 'LANGIT', 'LILIN', 'LUMPUR', 'LOMBA', 'LUKISAN', 'LISTRIK', 'LOGAM',
    'MATA', 'MEJA', 'MOBIL', 'MERAH', 'MADU', 'MALAM', 'MINYAK', 'MESIN', 'MUTIARA',
    'NASI', 'NAMA', 'NAGA', 'NEGERI', 'NILAI', 'NYAMUK', 'NYANYI', 'NADA', 'NORMA',
    'ORANG', 'OBAT', 'OTAK', 'OBOR', 'OKSIGEN', 'OPINI', 'OMSET', 'ORGAN', 'OTOT',
    'PAGI', 'POHON', 'PENA', 'PIRING', 'PUTIH', 'PELITA', 'PERAK', 'PETIR', 'PUISI',
    'QURAN', 'QARI',
    'ROTI', 'RUMAH', 'RAJA', 'RATU', 'RODA', 'RUMPUT', 'RUSA', 'HUJAN', 'RENCANA',
    'SATU', 'SAPI', 'SUSU', 'SAYAP', 'SENI', 'SORE', 'SURGA', 'SABUN', 'SENDOK',
    'TALI', 'TOPI', 'TAHUN', 'TELUR', 'TIKUS', 'TIMUR', 'TULANG', 'TINTA', 'TANGGA',
    'ULAR', 'UANG', 'UDARA', 'ULAT', 'USIA', 'UTARA', 'UJIAN', 'UMUR', 'UNGU',
    'VILLA', 'VIRUS', 'VISUAL', 'VOKAL', 'VOLUME', 'VARIASI', 'VENTILASI',
    'WAJAH', 'WARUNG', 'WANITA', 'WAYANG', 'WISATA', 'WADUK', 'WORTEL', 'WUJUD',
    'XENON', 'XILOFON',
    'YAKIN', 'YATIM', 'YOGURT', 'YUDISIUM',
    'ZAMAN', 'ZAT', 'ZIRAFAH', 'ZONA', 'ZAKAT'
];
const CW_VALID_SET = new Set(CW_WORDS);

function isValidIndonesianWord(word) {
    if (CW_VALID_SET.has(word)) return true;
    if (!/^[A-Z]{3,18}$/.test(word)) return false;
    // Wajib memiliki minimal 1 huruf vokal dan tidak ada 3 huruf kembar berturut-turut
    if (!/[AIUEO]/.test(word)) return false;
    if (/(.)\1\1/.test(word)) return false;
    if (/[^AIUEO]{4,}/.test(word)) return false;
    return true;
}

const formatRemainingTime = (ms) => {
    const totalSec = Math.max(1, Math.ceil(ms / 1000));
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    if (min > 0 && sec > 0) return `${min} menit ${sec} detik`;
    if (min > 0) return `${min} menit`;
    return `${sec} detik`;
};

const sortLetters = (str) => str.toUpperCase().replace(/[^A-Z]/g, '').split('').sort().join('');
function createATLGame(targetLen = null) {
    const pool = targetLen ? ATL_WORDS.filter(w => w.word.length === targetLen) : ATL_WORDS;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    const validSet = new Set(ATL_WORDS.map(w => w.word));
    let letters = chosen.word.split(''), shuffled = chosen.word;
    for (let attempt = 0; attempt < 25; attempt++) {
        for (let i = letters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [letters[i], letters[j]] = [letters[j], letters[i]];
        }
        shuffled = letters.join('');
        if (!validSet.has(shuffled)) break;
    }
    if (shuffled === chosen.word) shuffled = chosen.word.slice(1) + chosen.word[0];
    return {
        word: chosen.word,
        cat: chosen.cat,
        sorted: sortLetters(chosen.word),
        scrambled: shuffled.split('').join(' - '),
        expiresAt: Date.now() + 180000,
        timer: null
    };
}

// Helper untuk membuat dan memformat permainan /Guest number (4 digit angka acak)
function createGuestNumberGame() {
    const secret = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join('');
    return {
        secret,
        revealed: [false, false, false, false],
        attempts: 0,
        expiresAt: Date.now() + 60000,
        timer: null
    };
}
const getMaskedNumber = (game) => game.secret.split('').map((digit, idx) => (game.revealed[idx] ? digit : '*')).join('');
const NUMBER_WORD_ID = ['Tidak ada', 'Satu', 'Dua', 'Tiga', 'Empat'];

// Helper untuk membuat permainan /Guest emoji (Tebak benda rahasia dari emoji, maks. 2 menit)
function createGuestEmojiGame() {
    const chosen = EMOJI_ITEMS[Math.floor(Math.random() * EMOJI_ITEMS.length)];
    return {
        emojis: chosen.emojis,
        answers: chosen.answers,
        mainAnswer: chosen.answers[0],
        category: chosen.category,
        attempts: 0,
        expiresAt: Date.now() + 120000,
        timer: null
    };
}

// Helper untuk membuat permainan /CW (Connect Word, maks. 1 menit per sambungan)
function createCWGame() {
    const starters = ATL_WORDS.map(w => w.word).filter(w => w.length >= 5);
    const firstWord = starters[Math.floor(Math.random() * starters.length)];
    return {
        currentWord: firstWord,
        nextLetter: firstWord[firstWord.length - 1],
        usedWords: new Set([firstWord]),
        chain: [firstWord],
        scores: new Map(),
        expiresAt: Date.now() + 60000,
        timer: null
    };
}

const question = (text) => new Promise((resolve) => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); rl.question(text, (a) => { rl.close(); resolve(a); }); });
function loadAutoResponse() {
    try {
        if (fs.existsSync(AUTO_RESPONSE_FILE)) {
            const parsed = JSON.parse(fs.readFileSync(AUTO_RESPONSE_FILE, 'utf-8'));
            return { enabled: parsed.enabled ?? true, numberCommand: parsed.numberCommand ?? true, list: Array.isArray(parsed.list) ? parsed.list : [] };
        }
    } catch {}
    return { enabled: true, numberCommand: true, list: [] };
}
function saveAutoResponse(data) { try { fs.writeFileSync(AUTO_RESPONSE_FILE, JSON.stringify(data, null, 2)); } catch {} }
let autoResponseData = loadAutoResponse();
const formatUptime = (sec) => `${Math.floor(sec / 3600)} jam ${Math.floor((sec % 3600) / 60)} menit ${Math.floor(sec % 60)} detik`;
const unwrap = (m) => m?.ephemeralMessage?.message || m?.viewOnceMessage?.message || m?.viewOnceMessageV2?.message || m;
const extractText = (raw) => { const m = unwrap(raw); return m?.conversation || m?.extendedTextMessage?.text || m?.imageMessage?.caption || m?.videoMessage?.caption || m?.documentMessage?.caption || ''; };
const getQuoted = (raw) => { const m = unwrap(raw); const ctx = m?.extendedTextMessage?.contextInfo || m?.imageMessage?.contextInfo || m?.videoMessage?.contextInfo; return ctx?.quotedMessage ? unwrap(ctx.quotedMessage) : null; };
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { family: 4, timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36', 'Accept': '*/*' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return resolve(fetchJson(res.headers.location));
            let raw = ''; res.on('data', (c) => { raw += c; });
            res.on('end', () => { if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`)); try { resolve(JSON.parse(raw)); } catch { reject(new Error('Respon tidak valid')); } });
        });
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); }); req.on('error', reject);
    });
}
async function translateToIndonesian(text) {
    const q = encodeURIComponent(text);
    try {
        const data = await fetchJson(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${q}`);
        return { translatedText: data[0].map(i => i[0]).join(''), detectedLang: (data[2] || 'auto').toUpperCase() };
    } catch {
        const data = await fetchJson(`https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=id&q=${q}`);
        return { translatedText: Array.isArray(data) ? data.map(i => Array.isArray(i) ? i[0] : i).join('') : String(data), detectedLang: ((Array.isArray(data?.[0]) && data[0][1]) || 'auto').toUpperCase() };
    }
}
function summarizeText(text) {
    const stopwords = new Set(['yang', 'dan', 'di', 'ke', 'dari', 'ini', 'itu', 'untuk', 'dengan', 'pada', 'adalah', 'sebagai', 'dalam', 'tidak', 'akan', 'juga', 'atau', 'ada', 'bisa', 'sudah', 'saya', 'aku', 'kamu', 'dia', 'mereka', 'kita', 'kami', 'nya', 'ya', 'the', 'and', 'is', 'in', 'to', 'of', 'a', 'for', 'on', 'with', 'as', 'this', 'that']);
    const cueWords = ['intinya', 'kesimpulan', 'kesimpulannya', 'penting', 'jadi', 'hasil', 'hasilnya', 'total', 'deadline', 'jadwal', 'tanggal', 'catatan', 'wajib', 'harus', 'tujuan', 'summary', 'conclusion', 'important', 'note', 'result'];
    const rawUnits = text.split(/\r?\n+/).flatMap(l => l.split(/(?<=[.!?])\s+/)).map(s => s.replace(/^[-•*\d.)\s]+/, '').trim()).filter(s => s.length > 3);
    if (rawUnits.length <= 2) return rawUnits.map(u => `• ${u}`).join('\n');
    const wordFreq = {};
    rawUnits.forEach(u => u.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).forEach(w => { if (w.length > 2 && !stopwords.has(w)) wordFreq[w] = (wordFreq[w] || 0) + 1; }));
    const scored = rawUnits.map((unit, index) => {
        const words = unit.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
        let score = words.reduce((acc, w) => acc + (wordFreq[w] || 0) + (cueWords.includes(w) ? 3 : 0), 0);
        return { unit, index, score: (words.length > 0 ? score / Math.sqrt(words.length) : 0) + (index === 0 ? 2.5 : 0) + (index === rawUnits.length - 1 ? 1.5 : 0) };
    });
    const targetCount = Math.min(4, Math.max(2, Math.ceil(rawUnits.length * 0.35)));
    return scored.sort((a, b) => b.score - a.score).slice(0, targetCount).sort((a, b) => a.index - b.index).map(i => `• ${i.unit}`).join('\n');
}
function wordsToNum(words) {
    const u = { nol: 0, kosong: 0, satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, delapan: 8, sembilan: 9 };
    const sp = { sepuluh: 10, sebelas: 11, seratus: 100, seribu: 1000, sejuta: 1e6, semiliar: 1e9, semilyar: 1e9, setriliun: 1e12 };
    const sc = { ribu: 1000, juta: 1e6, miliar: 1e9, milyar: 1e9, triliun: 1e12 };
    const whole = (arr) => {
        let tot = 0, grp = 0, tmp = 0;
        for (const w of arr) {
            if (w in u) tmp = u[w];
            else if (w in sp) { if (sp[w] >= 1000) { tot += (grp + tmp + 1) * sp[w]; grp = tmp = 0; } else grp += sp[w]; }
            else if (w === 'belas') { grp += (tmp || 1) + 10; tmp = 0; }
            else if (w === 'puluh') { grp += (tmp || 1) * 10; tmp = 0; }
            else if (w === 'ratus') { grp += (tmp || 1) * 100; tmp = 0; }
            else if (w in sc) { tot += ((grp + tmp) || 1) * sc[w]; grp = tmp = 0; }
        }
        return tot + grp + tmp;
    };
    const ci = words.indexOf('koma'), iv = ci > 0 ? whole(words.slice(0, ci)) : 0, dw = ci !== -1 ? words.slice(ci + 1) : [];
    return ci === -1 ? whole(words) : !dw.length ? iv : parseFloat(`${iv}.${dw.every(w => w in u) ? dw.map(w => u[w]).join('') : whole(dw)}`);
}
function calculateExpr(raw) {
    const nw = new Set(['nol','kosong','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan','sepuluh','sebelas','belas','puluh','seratus','ratus','seribu','ribu','sejuta','juta','semiliar','semilyar','miliar','milyar','setriliun','triliun','koma']);
    const ops = { tambah: '+', ditambah: '+', plus: '+', kurang: '-', dikurang: '-', kali: '*', dikali: '*', x: '*', '×': '*', bagi: ':', dibagi: ':', '/': ':', '÷': ':' };
    const toks = [], buf = [], flush = () => { if (buf.length) toks.push({ t: 'n', v: wordsToNum(buf.splice(0)) }); };
    for (const tk of raw.toLowerCase().replace(/([+\-*:×÷/])/g, ' $1 ').replace(/[?!="']/g, ' ').trim().split(/\s+/)) {
        if (!tk) continue; if (nw.has(tk)) { buf.push(tk); continue; } flush();
        if (/^\d+([.,]\d+)?$/.test(tk)) toks.push({ t: 'n', v: parseFloat(tk.replace(',', '.')) });
        else if (tk === 'negatif' || ((tk === '-' || tk === '+' || tk === 'minus') && (!toks.length || toks[toks.length - 1].t !== 'n'))) toks.push({ t: 's', v: tk === '+' ? '+' : '-' });
        else if (tk === 'minus') toks.push({ t: 'o', v: '-' });
        else if (tk in ops) toks.push({ t: 'o', v: ops[tk] });
        else if (tk === '+' || tk === '-' || tk === '*' || tk === ':') toks.push({ t: 'o', v: tk });
    }
    flush(); const ex = []; let sgn = 1;
    for (const x of toks) {
        if (x.t === 's') sgn *= x.v === '-' ? -1 : 1;
        else if (x.t === 'n') { ex.push({ t: 'n', v: x.v * sgn }); sgn = 1; }
        else { if (!ex.length || ex[ex.length - 1].t !== 'n') return null; ex.push(x); sgn = 1; }
    }
    if (ex.length < 3 || ex[ex.length - 1].t !== 'n') return null;
    const disp = ex.map(x => x.t === 'n' ? x.v.toLocaleString('id-ID', { maximumFractionDigits: 10 }) : x.v).join(' '), p1 = [ex[0]];
    for (let i = 1; i < ex.length; i += 2) {
        if (ex[i].v === '*' || ex[i].v === ':') {
            if (ex[i].v === ':' && ex[i + 1].v === 0) return { error: 'Tidak dapat membagi dengan nol (0).' };
            const l = p1.pop().v; p1.push({ t: 'n', v: ex[i].v === '*' ? l * ex[i + 1].v : l / ex[i + 1].v });
        } else p1.push(ex[i], ex[i + 1]);
    }
    let res = p1[0].v;
    for (let i = 1; i < p1.length; i += 2) res = p1[i].v === '+' ? res + p1[i + 1].v : res - p1[i + 1].v;
    res = Number(res.toPrecision(12));
    return { disp, out: res.toLocaleString('id-ID', { maximumFractionDigits: 10 }) };
}
const UNITS = {
    km:['l',1000,'km'],kilometer:['l',1000,'km'],hm:['l',100,'hm'],dam:['l',10,'dam'],m:['l',1,'m'],meter:['l',1,'m'],dm:['l',0.1,'dm'],cm:['l',0.01,'cm'],sentimeter:['l',0.01,'cm'],mm:['l',0.001,'mm'],milimeter:['l',0.001,'mm'],mi:['l',1609.344,'mil'],mil:['l',1609.344,'mil'],yd:['l',0.9144,'yard'],yard:['l',0.9144,'yard'],ft:['l',0.3048,'ft'],feet:['l',0.3048,'ft'],kaki:['l',0.3048,'ft'],in:['l',0.0254,'inci'],inch:['l',0.0254,'inci'],inci:['l',0.0254,'inci'],
    ton:['m',1e6,'ton'],kwintal:['m',1e5,'kwintal'],kuintal:['m',1e5,'kwintal'],kg:['m',1000,'kg'],kilogram:['m',1000,'kg'],hg:['m',100,'hg'],ons:['m',100,'ons'],dag:['m',10,'dag'],g:['m',1,'g'],gr:['m',1,'g'],gram:['m',1,'g'],dg:['m',0.1,'dg'],cg:['m',0.01,'cg'],mg:['m',0.001,'mg'],miligram:['m',0.001,'mg'],lb:['m',453.59237,'lb'],lbs:['m',453.59237,'lbs'],pound:['m',453.59237,'lb'],oz:['m',28.349523,'oz'],ounce:['m',28.349523,'oz'],
    c:['t','C','°C'],'°c':['t','C','°C'],celcius:['t','C','°C'],celsius:['t','C','°C'],f:['t','F','°F'],'°f':['t','F','°F'],fahrenheit:['t','F','°F'],k:['t','K','K'],kelvin:['t','K','K'],r:['t','R','°R'],'°r':['t','R','°R'],reamur:['t','R','°R'],
    s:['ti',1,'detik'],sec:['ti',1,'detik'],detik:['ti',1,'detik'],min:['ti',60,'menit'],menit:['ti',60,'menit'],hr:['ti',3600,'jam'],hour:['ti',3600,'jam'],jam:['ti',3600,'jam'],day:['ti',86400,'hari'],hari:['ti',86400,'hari'],week:['ti',604800,'minggu'],minggu:['ti',604800,'minggu'],month:['ti',2592000,'bulan'],bulan:['ti',2592000,'bulan'],year:['ti',31536000,'tahun'],tahun:['ti',31536000,'tahun'],
    l:['v',1,'L'],liter:['v',1,'L'],ml:['v',0.001,'mL'],mililiter:['v',0.001,'mL'],cc:['v',0.001,'cc'],m3:['v',1000,'m³'],galon:['v',3.785412,'galon'],gallon:['v',3.785412,'galon'],
    m2:['a',1,'m²'],km2:['a',1e6,'km²'],cm2:['a',1e-4,'cm²'],ha:['a',1e4,'hektar'],hektar:['a',1e4,'hektar'],are:['a',100,'are'],
    b:['d',1,'B'],byte:['d',1,'Byte'],kb:['d',1024,'KB'],mb:['d',1024**2,'MB'],gb:['d',1024**3,'GB'],tb:['d',1024**4,'TB'],pb:['d',1024**5,'PB'],
    'm/s':['sp',1,'m/s'],ms:['sp',1,'m/s'],'km/h':['sp',1/3.6,'km/jam'],kmh:['sp',1/3.6,'km/jam'],kpj:['sp',1/3.6,'km/jam'],mph:['sp',0.44704,'mph'],knot:['sp',0.514444,'knot']
};
const CURR = { rp:'IDR',idr:'IDR',rupiah:'IDR',usd:'USD',dollar:'USD',dolar:'USD',$:'USD',eur:'EUR',euro:'EUR','€':'EUR',gbp:'GBP',poundsterling:'GBP','£':'GBP',jpy:'JPY',yen:'JPY','¥':'JPY',sgd:'SGD',myr:'MYR',ringgit:'MYR',rm:'MYR',aud:'AUD',cny:'CNY',rmb:'CNY',yuan:'CNY',krw:'KRW',won:'KRW',sar:'SAR',riyal:'SAR',thb:'THB',baht:'THB',cad:'CAD',chf:'CHF',hkd:'HKD',nzd:'NZD',php:'PHP',vnd:'VND',inr:'INR',aed:'AED' };
async function convertUnit(leftStr, rightStr) {
    const parseSide = (s) => {
        let amt = null, unit = null;
        for (const tk of s.trim().replace(/([0-9.,]+)\s*([a-zA-Z°$€£¥/0-9]+)/g, '$1 $2').replace(/([a-zA-Z°$€£¥]+)\s*([0-9.,]+)/g, '$1 $2').split(/\s+/)) {
            if (amt === null && /^-?\d[\d.,]*$/.test(tk)) amt = parseFloat(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(tk) ? tk.replace(/\./g, '').replace(',', '.') : /^\d{1,3}(\.\d{3})+$/.test(tk) ? tk.replace(/\./g, '') : tk.replace(',', '.'));
            else { const k = tk.toLowerCase().replace(/[()]/g, ''); if (k in UNITS || k in CURR || /^[a-z]{3}$/i.test(k)) unit = k; }
        }
        return { amt, unit };
    };
    const L = parseSide(leftStr), R = parseSide(rightStr);
    if (!L.unit || !R.unit) return { error: 'Satuan tidak dikenali. Contoh: `/Covert 100000 Rp > USD` atau `/Covert 5 km > m`' };
    const val = L.amt ?? 1, fU = UNITS[L.unit], tU = UNITS[R.unit];
    if (fU && tU) {
        if (fU[0] !== tU[0]) return { error: `Kategori satuan berbeda (*${fU[2]}* ke *${tU[2]}*).` };
        let res;
        if (fU[0] === 't') {
            const c = fU[1] === 'C' ? val : fU[1] === 'F' ? (val - 32) * 5 / 9 : fU[1] === 'K' ? val - 273.15 : val * 5 / 4;
            res = tU[1] === 'C' ? c : tU[1] === 'F' ? c * 9 / 5 + 32 : tU[1] === 'K' ? c + 273.15 : c * 4 / 5;
        } else res = (val * fU[1]) / tU[1];
        return { from: `${val.toLocaleString('id-ID', { maximumFractionDigits: 6 })} ${fU[2]}`, to: `${Number(res.toPrecision(10)).toLocaleString('id-ID', { maximumFractionDigits: 6 })} ${tU[2]}` };
    }
    const fC = CURR[L.unit] || (!fU && /^[a-z]{3}$/i.test(L.unit) ? L.unit.toUpperCase() : null), tC = CURR[R.unit] || (!tU && /^[a-z]{3}$/i.test(R.unit) ? R.unit.toUpperCase() : null);
    if (fC && tC) {
        try {
            const d = await fetchJson(`https://open.er-api.com/v6/latest/${fC}`);
            if (d?.result === 'success' && d?.rates?.[tC]) {
                const rate = d.rates[tC], dec = ['IDR', 'JPY', 'KRW'].includes(tC) ? 2 : 4;
                return { from: `${val.toLocaleString('id-ID', { maximumFractionDigits: 4 })} ${fC}`, to: `${(val * rate).toLocaleString('id-ID', { maximumFractionDigits: dec })} ${tC}`, note: `Kurs: 1 ${fC} = ${rate.toLocaleString('id-ID', { maximumFractionDigits: 6 })} ${tC}` };
            }
            return { error: `Kode mata uang *${fC}* atau *${tC}* tidak didukung.` };
        } catch { return { error: 'Gagal mengambil kurs mata uang saat ini.' }; }
    }
    return { error: `Satuan *${L.unit}* ke *${R.unit}* tidak cocok atau belum didukung.` };
}
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_session');
    const sock = makeWASocket({ auth: state, printQRInTerminal: false, logger, browser: ['Ubuntu', 'Chrome', '20.0.04'] });
    if (!sock.authState.creds.registered) {
        const phoneNumber = (await question('Masukkan nomor WhatsApp Anda (contoh: 628123456789): ')).replace(/[^0-9]/g, '');
        setTimeout(async () => { try { let code = await sock.requestPairingCode(phoneNumber); code = code?.match(/.{1,4}/g)?.join('-') || code; console.log(`\n========================================\n KODE PAIRING ANDA: [ ${code} ]\n========================================\n`); } catch {} }, 3000);
    }
    sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot();
        else if (connection === 'open') console.log('[+] Bot WhatsApp BERHASIL terhubung dan aktif!');
    });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message || msg.key.remoteJid === 'status@broadcast' || botSentIds.has(msg.key.id)) return;
            const from = msg.key.remoteJid, body = extractText(msg.message), senderNum = (msg.key.participant || from).replace(/[^0-9]/g, '');
            const reply = async (text, quoted) => {
                const sent = await sock.sendMessage(from, { text }, quoted ? { quoted } : {});
                if (sent?.key?.id) {
                    botSentIds.add(sent.key.id);
                    setTimeout(() => botSentIds.delete(sent.key.id), 60000);
                }
                return sent;
            };
            const allowedNumbers = [sock.user?.id.split(':')[0], '628211250424'], isOwner = allowedNumbers.includes(senderNum) || msg.key.fromMe;
            if (body.startsWith('/') && !isOwner) return reply('❌ Maaf, bot ini bersifat privat dan hanya dapat digunakan oleh pemilik yang terdaftar.');
            if (msg.key.fromMe && !body.startsWith('/') && !activeATL.has(from) && !activeGuestNumber.has(from) && !activeGuestEmoji.has(from) && !activeCW.has(from)) return;

            let cleanBody = body.trim();
            // Resolusi Number Command (/1 s.d. /23 + argumen opsional)
            if (autoResponseData.numberCommand) {
                const numMatch = cleanBody.match(/^\/(\d+)(?:\s+(.*))?$/s);
                if (numMatch && NUMBER_COMMANDS[Number(numMatch[1])]) {
                    cleanBody = `${NUMBER_COMMANDS[Number(numMatch[1])]}${numMatch[2] ? ` ${numMatch[2]}` : ''}`;
                }
            }

            const args = cleanBody.split(/ +/), command = args[0];
            // 1. /Test
            if (command === '/Test') await reply('Test subject - Bot aktif!');
            // 2. /A-S Guide
            else if (cleanBody === '/A-S Guide') {
                await reply(`*PANDUAN A-S BOT WA*
1. /Test - Cek status bot
2. /A-S Guide - Membuka menu panduan perintah
3. /A-S help - Penjelasan detail setiap perintah
4. /Auto spam "isi" - Mengirim pesan beruntun
5. /S auto - Menghentikan auto spam
6. /Add Auto response "kata" > #jawaban - Tambah auto responder
7. /Delete Auto response "kata" > #jawaban - Hapus auto responder
8. /Auto response on - Menyalakan auto responder
9. /Auto response off - Mematikan auto responder
10. /Auto response list - Lihat daftar auto responder
11. /Set "kata" to #jawaban - Ubah isi auto responder
12. /Summary - Meringkas pesan (reply pesan minimal 5 baris)
13. /Translate - Menerjemahkan bahasa apa pun ke Bahasa Indonesia
14. /Calculate angka operasi angka - Menghitung matematika (langsung atau reply)
15. /Covert nilai satuan1 > satuan2 - Mengonversi satuan atau mata uang
16. /Info - Menampilkan informasi detail mengenai bot
17. /TOL - Menjawab acak antara Truth (Jujur) atau Lie (Bohong)
18. /Number command on - Menyalakan pintasan perintah angka (/1 - /23)
19. /Number command off - Mematikan pintasan perintah angka
20. /ATL - Game menyusun 5–10 huruf acak (maks. 3 menit)
21. /Guest number - Game menebak 4 digit angka rahasia (maks. 1 menit)
22. /Guest emoji - Game menebak benda rahasia dari petunjuk emoji (maks. 2 menit)
23. /CW - Connect Word, game sambung kata berantai (maks. 1 menit/kata)`);
            }
            // 3. /A-S help
            else if (cleanBody === '/A-S help') {
                await reply(`*📖 PENJELASAN LENGKAP PERINTAH BOT*

1. */Test* - Mengecek apakah bot sedang aktif.
2. */A-S Guide* - Menampilkan daftar ringkas seluruh perintah.
3. */A-S help* - Menampilkan penjelasan detail beserta contoh.
4. */Auto spam "isi pesan"* - Mengirim pesan berulang tiap 2 detik. _Contoh:_ /Auto spam "Halo"
5. */S auto* - Menghentikan auto spam yang sedang berjalan.
6. */Add Auto response "kata" > #jawaban* - Menambah pemicu & balasan otomatis. _Contoh:_ /Add Auto response "P" > #LP
7. */Delete Auto response "kata" > #jawaban* - Menghapus auto responder terdaftar. _Contoh:_ /Delete Auto response "Test" > #Test 123
8. */Auto response on* - Mengaktifkan fitur auto responder.
9. */Auto response off* - Menonaktifkan fitur auto responder.
10. */Auto response list* - Melihat status & daftar auto responder.
11. */Set "kata" to #jawaban* / */Set "lama" to "baru"* - Mengubah jawaban atau kata pemicu. _Contoh:_ /Set "P" to #LK atau /Set "P" to "A"
12. */Summary* - Meringkas pesan panjang (min. 5 baris) dengan membalas (reply) pesan target.
13. */Translate* - Menerjemahkan bahasa apa pun ke Bahasa Indonesia (reply pesan target atau ketik */Translate teks*).
14. */Calculate angka operasi angka* - Menghitung operasi tambah (*+*), kurang (*-*), kali (***), bagi (*:*), maupun tulisan angka (misal _"satu tambah satu"_). Bisa ketik langsung atau reply pesan dengan */Calculate*. _Contoh:_ /Calculate 25 * 4
15. */Covert jumlah satuan1 > satuan2* - Mengonversi satuan (panjang, berat, suhu, waktu, volume, luas, data, kecepatan) maupun mata uang. _Contoh:_ /Covert 150000 Rp > USD atau /Covert 5 km > m
16. */Info* - Menampilkan informasi bot (nama, versi, status, durasi aktif, pemilik/pembuat, dan info sistem).
17. */TOL* - Memberikan jawaban acak antara *T (Truth / Jujur)* atau *L (Lie / Bohong)*. Bisa langsung ketik */TOL* atau */TOL pernyataan*.
18. */Number command on* - Menyalakan fitur pintasan angka sesuai nomor urut di */A-S Guide* atau */A-S help* (misal */1* otomatis menjalankan */Test*).
19. */Number command off* - Mematikan fitur pintasan perintah angka.
20. */ATL* - Bot memberikan 5 hingga 10 huruf acak dan pemain harus menyusunnya menjadi kata Bahasa Indonesia yang benar dalam waktu maksimal *3 menit*. Ketik langsung kata jawaban di chat, gunakan */ATL hint* untuk petunjuk, atau */ATL skip* untuk menyerah.
21. */Guest number* - Bot membuat 4 digit angka rahasia (****) dengan batas waktu maksimal *1 menit*. Ketik langsung 4 digit angka tebakan di chat untuk membuka posisi angka yang cocok hingga seluruhnya tertebak, atau ketik */Guest number skip* untuk menyerah.
22. */Guest emoji* - Bot mengirimkan petunjuk berupa emoji dan pemain harus menebak nama benda rahasianya dengan waktu maksimal *2 menit*. Gunakan */Guest emoji hint* untuk petunjuk tambahan atau */Guest emoji skip* untuk menyerah.
23. */CW* - Connect Word (Sambung Kata). Bot memberikan kata awal dan pemain harus menyambungnya dengan 1 kata baru yang diawali huruf terakhir kata tersebut dalam waktu maksimal *1 menit* per kata. Ketik */CW stop* untuk menghentikan permainan.`);
            }
            // 4. /Auto spam
            else if (cleanBody.startsWith('/Auto spam')) {
                const textToSpam = cleanBody.match(/"(.*?)"/)?.[1] || 'Spam Chat';
                if (activeSpams.has(from)) clearInterval(activeSpams.get(from));
                await reply('Auto spam dimulai. Ketik /S auto untuk berhenti.');
                const spamInterval = setInterval(async () => { try { await sock.sendMessage(from, { text: textToSpam }); } catch { clearInterval(spamInterval); activeSpams.delete(from); } }, 2000);
                activeSpams.set(from, spamInterval);
            }
            // 5. /S auto
            else if (command === '/S' && args[1] === 'auto') {
                if (activeSpams.has(from)) { clearInterval(activeSpams.get(from)); activeSpams.delete(from); await reply('Auto spam dihentikan.'); }
                else await reply('Tidak ada auto spam yang sedang berjalan.');
            }
            // 6. /Add Auto response
            else if (cleanBody.startsWith('/Add Auto response')) {
                const match = cleanBody.match(/^\/Add Auto response\s+"([^"]+)"\s*>\s*#(.+)$/);
                if (!match) return reply('❌ Format salah!\nGunakan format: /Add Auto response "kata" > #jawaban\nContoh: /Add Auto response "P" > #LP');
                const trigger = match[1].trim(), response = match[2].trim(), idx = autoResponseData.list.findIndex(i => i.trigger.toLowerCase() === trigger.toLowerCase());
                if (idx !== -1) { autoResponseData.list[idx] = { trigger, response }; saveAutoResponse(autoResponseData); await reply(`✅ Auto response untuk *"${trigger}"* diperbarui menjadi *#${response}*.\nStatus saat ini: *${autoResponseData.enabled ? 'ON' : 'OFF'}*`); }
                else { autoResponseData.list.push({ trigger, response }); saveAutoResponse(autoResponseData); await reply(`✅ Auto response ditambahkan:\n*"${trigger}" > #${response}*\nStatus saat ini: *${autoResponseData.enabled ? 'ON' : 'OFF'}*`); }
            }
            // 7. /Delete Auto response
            else if (cleanBody.startsWith('/Delete Auto response')) {
                const match = cleanBody.match(/^\/Delete Auto response\s+"([^"]+)"\s*>\s*#(.+)$/);
                if (!match) return reply('❌ Format salah!\nGunakan format: /Delete Auto response "kata" > #jawaban\nContoh: /Delete Auto response "Test" > #Test 123');
                const trigger = match[1].trim(), response = match[2].trim(), index = autoResponseData.list.findIndex(i => i.trigger.toLowerCase() === trigger.toLowerCase() && i.response.toLowerCase() === response.toLowerCase());
                if (index === -1) { const found = autoResponseData.list.find(i => i.trigger.toLowerCase() === trigger.toLowerCase()); return reply(found ? `❌ Kata pemicu *"${found.trigger}"* ditemukan, tetapi jawabannya *#${found.response}* (bukan *#${response}*).` : `❌ Auto response *"${trigger}" > #${response}* tidak ditemukan di */Auto response list*.`); }
                const removed = autoResponseData.list.splice(index, 1)[0]; saveAutoResponse(autoResponseData);
                await reply(`🗑️ Auto response berhasil dihapus:\n*"${removed.trigger}" > #${removed.response}*`);
            }
            // 8 & 9. /Auto response on/off
            else if (cleanBody.toLowerCase() === '/auto response on') { autoResponseData.enabled = true; saveAutoResponse(autoResponseData); await reply('✅ Auto response sekarang *ON (Aktif)*.'); }
            else if (cleanBody.toLowerCase() === '/auto response off') { autoResponseData.enabled = false; saveAutoResponse(autoResponseData); await reply('⛔ Auto response sekarang *OFF (Nonaktif)*.'); }
            // 10. /Auto response list
            else if (cleanBody === '/Auto response list') {
                const statusLabel = autoResponseData.enabled ? 'ON ✅' : 'OFF ⛔';
                if (autoResponseData.list.length === 0) return reply(`*DAFTAR AUTO RESPONSE*\nStatus: *${statusLabel}*\n\nBelum ada auto response yang ditambahkan.\nGunakan /Add Auto response "contoh" > #contoh1 untuk menambah.`);
                await reply(`*DAFTAR AUTO RESPONSE*\nStatus: *${statusLabel}*\n\n${autoResponseData.list.map((item, idx) => `${idx + 1}. "${item.trigger}" > #${item.response}`).join('\n')}`);
            }
            // 11. /Set
            else if (cleanBody.startsWith('/Set')) {
                const changeReply = cleanBody.match(/^\/Set\s+"([^"]+)"\s+to\s+#(.+)$/), changeTrigger = cleanBody.match(/^\/Set\s+"([^"]+)"\s+to\s+"([^"]+)"$/);
                if (changeReply) {
                    const target = changeReply[1].trim(), newReply = changeReply[2].trim(), idx = autoResponseData.list.findIndex(i => i.trigger.toLowerCase() === target.toLowerCase());
                    if (idx === -1) return reply(`❌ Kata pemicu *"${target}"* tidak ditemukan di daftar auto response.`);
                    const oldReply = autoResponseData.list[idx].response; autoResponseData.list[idx].response = newReply; saveAutoResponse(autoResponseData);
                    await reply(`✅ Jawaban untuk *"${autoResponseData.list[idx].trigger}"* berhasil diubah:\nDari *#${oldReply}* ➡️ menjadi *#${newReply}*`);
                } else if (changeTrigger) {
                    const val1 = changeTrigger[1].trim(), val2 = changeTrigger[2].trim();
                    const idxTrig = autoResponseData.list.findIndex(i => i.trigger.toLowerCase() === val1.toLowerCase()), idxResp = autoResponseData.list.findIndex(i => i.response.toLowerCase() === val2.toLowerCase());
                    if (idxTrig !== -1) { const old = autoResponseData.list[idxTrig].trigger; autoResponseData.list[idxTrig].trigger = val2; saveAutoResponse(autoResponseData); await reply(`✅ Kata pemicu berhasil diubah:\nDari *"${old}"* ➡️ menjadi *"${val2}"* (Jawaban tetap: *#${autoResponseData.list[idxTrig].response}*)`); }
                    else if (idxResp !== -1) { const old = autoResponseData.list[idxResp].trigger; autoResponseData.list[idxResp].trigger = val1; saveAutoResponse(autoResponseData); await reply(`✅ Kata pemicu berhasil diubah:\nDari *"${old}"* ➡️ menjadi *"${val1}"* (Jawaban tetap: *#${autoResponseData.list[idxResp].response}*)`); }
                    else await reply('❌ Data tidak ditemukan di */Auto response list*. Pastikan kata pemicu atau jawaban sudah terdaftar sebelumnya.');
                } else await reply('❌ Format /Set salah!\nContoh ubah jawaban: /Set "P" to #LK\nContoh ubah kata pemicu: /Set "P" to "A" atau /Set "A" to "LP"');
            }
            // 12. /Summary
            else if (cleanBody.toLowerCase() === '/summary') {
                const quotedMsg = getQuoted(msg.message);
                if (!quotedMsg) return reply('❌ Cara menggunakan */Summary*:\nBalas (reply) pesan yang ingin diringkas dengan mengetik */Summary*.', msg);
                const quotedText = extractText(quotedMsg);
                if (!quotedText.trim()) return reply('❌ Pesan yang dibalas tidak mengandung teks yang bisa diringkas.', msg);
                const lines = quotedText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
                if (lines.length < 5) return reply(`❌ Pesan terlalu pendek untuk diringkas (terdeteksi *${lines.length} baris*). Fitur */Summary* hanya berlaku untuk pesan dengan minimal *5 baris*.`, msg);
                const summaryResult = summarizeText(quotedText), reduction = Math.max(0, Math.round((1 - summaryResult.length / quotedText.length) * 100));
                await reply(`📝 *RINGKASAN PESAN* _(${lines.length} baris • dipadatkan ${reduction}%)_\n\n${summaryResult}`, msg);
            }
            // 13. /Translate
            else if (cleanBody.toLowerCase() === '/translate' || cleanBody.toLowerCase().startsWith('/translate ')) {
                const quotedMsg = getQuoted(msg.message), textToTranslate = (extractText(quotedMsg) || cleanBody.slice('/translate'.length)).trim();
                if (!textToTranslate) return reply('❌ Cara menggunakan */Translate*:\nBalas (reply) pesan yang ingin diterjemahkan dengan mengetik */Translate*, atau ketik */Translate <teks>*.', msg);
                try { const { translatedText, detectedLang } = await translateToIndonesian(textToTranslate); await reply(`🌐 *TERJEMAHAN (${detectedLang} ➔ ID)*\n\n${translatedText}`, quotedMsg ? msg : undefined); }
                catch (e) { await reply(`❌ Gagal menerjemahkan pesan (${e.message}).`, msg); }
            }
            // 14. /Calculate
            else if (/^\/calculate(\s|$)/i.test(cleanBody)) {
                const qMsg = getQuoted(msg.message), expr = (extractText(qMsg) || cleanBody.slice(10)).trim();
                if (!expr) return reply('❌ Cara menggunakan */Calculate*:\nKetik */Calculate angka operasi angka* (contoh: `/Calculate 10 + 5`, `/Calculate satu tambah satu`), atau balas (reply) pesan dengan */Calculate*.', msg);
                const c = calculateExpr(expr);
                if (!c || c.error) return reply(`❌ ${c?.error || 'Tidak dapat membaca operasi matematika. Gunakan +, -, *, atau :.'}`, qMsg ? msg : undefined);
                await reply(`🧮 *HASIL KALKULASI*\n\n${c.disp} = *${c.out}*`, qMsg ? msg : undefined);
            }
            // 15. /Covert
            else if (/^\/co(v|nv)ert(\s|$)/i.test(cleanBody)) {
                const parts = cleanBody.replace(/^\/co(v|nv)ert\s*/i, '').trim().split('>');
                if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) return reply('❌ Format salah!\nGunakan: */Covert jumlah satuan1 > satuan2*\n_Contoh:_ `/Covert 150000 Rp > USD` atau `/Covert 5 km > m`', msg);
                const cv = await convertUnit(parts[0], parts[1]);
                if (cv.error) return reply(`❌ ${cv.error}`, msg);
                await reply(`🔄 *KONVERSI SATUAN*\n\n*${cv.from}* ➡️ *${cv.to}*${cv.note ? `\n_${cv.note}_` : ''}`, msg);
            }
            // 16. /Info
            else if (/^\/info$/i.test(cleanBody)) {
                const arStatus = autoResponseData.enabled ? `ON (${autoResponseData.list.length} item)` : `OFF (${autoResponseData.list.length} item)`;
                const numCmdStatus = autoResponseData.numberCommand ? 'ON ✅' : 'OFF ⛔';
                await reply(`ℹ️ *INFORMASI BOT*

• *Nama Bot:* ${BOT_INFO.name}
• *Versi:* v${BOT_INFO.version}
• *Status:* Aktif / Online ✅
• *Waktu Aktif:* ${formatUptime(process.uptime())}
• *Pemilik / Pembuat:* ${BOT_INFO.owner}
• *Auto Response:* ${arStatus}
• *Number Command:* ${numCmdStatus}
• *Total Perintah:* 23 perintah
• *Engine:* Node.js (@whiskeysockets/baileys)
• *Deskripsi:* ${BOT_INFO.description}`, msg);
            }
            // 17. /TOL
            else if (/^\/tol(\s|$)/i.test(cleanBody)) {
                const targetText = cleanBody.slice(4).trim();
                const isTruth = Math.random() < 0.5;
                const verdict = isTruth ? '✅ *T — TRUTH (Jujur)*' : '❌ *L — LIE (Bohong)*';
                await reply(`🎲 *TRUTH OR LIE (TOL)*${targetText ? `\n_"${targetText}"_` : ''}\n\nHasil: ${verdict}`, msg);
            }
            // 18 & 19. /Number command on/off
            else if (cleanBody.toLowerCase() === '/number command on') {
                autoResponseData.numberCommand = true;
                saveAutoResponse(autoResponseData);
                await reply('✅ Number command sekarang *ON (Aktif)*.\nGunakan */1* s.d. */23* sesuai urutan di */A-S Guide*.');
            }
            else if (cleanBody.toLowerCase() === '/number command off') {
                autoResponseData.numberCommand = false;
                saveAutoResponse(autoResponseData);
                await reply('⛔ Number command sekarang *OFF (Nonaktif)*.');
            }
            // 20. /ATL (Arrange The Letters - Maks. 3 Menit)
            else if (/^\/atl(\s|$)/i.test(cleanBody)) {
                const sub = cleanBody.slice(4).trim().toLowerCase();
                if (['stop', 'skip', 'nyerah'].includes(sub)) {
                    const current = activeATL.get(from);
                    if (!current) return reply('❌ Tidak ada permainan */ATL* yang sedang berlangsung di chat ini.');
                    clearTimeout(current.timer);
                    activeATL.delete(from);
                    return reply(`🏳️ Permainan */ATL* dihentikan.\nJawaban yang benar adalah: *${current.word}*`);
                }
                if (sub === 'hint') {
                    const current = activeATL.get(from);
                    if (!current) return reply('❌ Tidak ada permainan */ATL* yang sedang berlangsung. Ketik */ATL* untuk memulai.');
                    const mask = `${current.word[0]} ${'_ '.repeat(current.word.length - 2)}${current.word[current.word.length - 1]}`;
                    return reply(`💡 *PETUNJUK ATL*\n\n• Jumlah huruf: *${current.word.length} huruf*\n• Kategori: *${current.cat}*\n• Pola huruf: *${mask}*\n• Huruf acak: *${current.scrambled}*\n• Sisa waktu: *${formatRemainingTime(current.expiresAt - Date.now())}*`);
                }
                if (activeATL.has(from)) {
                    const current = activeATL.get(from);
                    return reply(`⚠️ Permainan */ATL* masih berlangsung!\n\nSusun huruf berikut (*${current.word.length} huruf*):\n👉 *${current.scrambled}*\n⏱️ Sisa waktu: *${formatRemainingTime(current.expiresAt - Date.now())}*\n\n_Ketik langsung kata jawabanmu, */ATL hint* untuk petunjuk, atau */ATL skip* untuk menyerah._`);
                }
                const reqLen = /^[5-9]$|^10$/.test(sub) ? Number(sub) : null;
                const game = createATLGame(reqLen);
                game.timer = setTimeout(async () => {
                    if (activeATL.has(from)) {
                        activeATL.delete(from);
                        try { await reply(`⏰ *WAKTU HABIS!*\nWaktu 3 menit telah berakhir dan tidak ada yang berhasil menyusun huruf *${game.scrambled}*.\nJawaban yang benar adalah: *${game.word}*`); } catch {}
                    }
                }, 180000);
                activeATL.set(from, game);
                await reply(`🔤 *ARRANGE THE LETTERS (ATL)*\n\nSusun huruf acak berikut menjadi sebuah kata yang benar (*${game.word.length} huruf*):\n👉 *${game.scrambled}*\n\n⏱️ Waktu maksimal jawab: *3 menit*\n_Ketik langsung kata jawabanmu di chat ini!_\n_Bantuan: */ATL hint* • Menyerah: */ATL skip*_`);
            }
            // 21. /Guest number (Tebak 4 Digit Angka Rahasia - Maks. 1 Menit)
            else if (/^\/gu?es[st]\s+number(\s|$)/i.test(cleanBody)) {
                const sub = cleanBody.replace(/^\/gu?es[st]\s+number\s*/i, '').trim().toLowerCase();
                if (['stop', 'skip', 'nyerah'].includes(sub)) {
                    const current = activeGuestNumber.get(from);
                    if (!current) return reply('❌ Tidak ada permainan */Guest number* yang sedang berlangsung di chat ini.');
                    clearTimeout(current.timer);
                    activeGuestNumber.delete(from);
                    return reply(`🏳️ Permainan */Guest number* dihentikan.\nAngka rahasia yang benar adalah: *${current.secret}*`);
                }
                if (activeGuestNumber.has(from)) {
                    const current = activeGuestNumber.get(from);
                    const remSec = Math.max(1, Math.ceil((current.expiresAt - Date.now()) / 1000));
                    return reply(`⚠️ Permainan */Guest number* masih berlangsung!\n\nAngka rahasia: *${getMaskedNumber(current)}*\nSisa waktu: *${remSec} detik*\n\n_Ketik langsung 4 digit angka tebakanmu (contoh: 2674), atau */Guest number skip* untuk menyerah._`);
                }
                const game = createGuestNumberGame();
                game.timer = setTimeout(async () => {
                    if (activeGuestNumber.has(from)) {
                        activeGuestNumber.delete(from);
                        try {
                            await reply(`⏰ *WAKTU HABIS!*\nWaktu 1 menit telah berakhir dan seluruh angka belum berhasil ditebak.\nAngka rahasia yang benar adalah: *${game.secret}*`);
                        } catch {}
                    }
                }, 60000);
                activeGuestNumber.set(from, game);
                await reply(`🔢 *GUEST NUMBER*\n\nAngka rahasia *${getMaskedNumber(game)}*\nWaktu maksimal *1 menit* untuk menebak.\n\n_Ketik langsung 4 digit angka tebakanmu di chat ini (contoh: 2674)!_\n_Menyerah: */Guest number skip*_`);
            }
            // 22. /Guest emoji (Tebak Benda Rahasia dari Emoji - Maks. 2 Menit)
            else if (/^\/gu?es[st]\s+emoji(\s|$)/i.test(cleanBody)) {
                const sub = cleanBody.replace(/^\/gu?es[st]\s+emoji\s*/i, '').trim().toLowerCase();
                if (['stop', 'skip', 'nyerah'].includes(sub)) {
                    const current = activeGuestEmoji.get(from);
                    if (!current) return reply('❌ Tidak ada permainan */Guest emoji* yang sedang berlangsung di chat ini.');
                    clearTimeout(current.timer);
                    activeGuestEmoji.delete(from);
                    return reply(`🏳️ Permainan */Guest emoji* dihentikan.\nBenda rahasia dari emoji *${current.emojis}* adalah: *${current.mainAnswer}*`);
                }
                if (sub === 'hint') {
                    const current = activeGuestEmoji.get(from);
                    if (!current) return reply('❌ Tidak ada permainan */Guest emoji* yang sedang berlangsung. Ketik */Guest emoji* untuk memulai.');
                    const ans = current.mainAnswer;
                    const pattern = ans.split(' ').map(part => part.length <= 2 ? part : `${part[0]}${'_'.repeat(part.length - 2)}${part[part.length - 1]}`).join(' ');
                    return reply(`💡 *PETUNJUK GUEST EMOJI*\n\n• Emoji petunjuk: *${current.emojis}*\n• Kategori: *${current.category}*\n• Pola huruf: *${pattern}* (${ans.replace(/\s+/g, '').length} huruf)\n• Sisa waktu: *${formatRemainingTime(current.expiresAt - Date.now())}*`);
                }
                if (activeGuestEmoji.has(from)) {
                    const current = activeGuestEmoji.get(from);
                    return reply(`⚠️ Permainan */Guest emoji* masih berlangsung!\n\nTebak benda rahasia dari emoji:\n👉 *${current.emojis}*\n⏱️ Sisa waktu: *${formatRemainingTime(current.expiresAt - Date.now())}*\n\n_Ketik langsung nama benda tebakanmu, */Guest emoji hint* untuk petunjuk, atau */Guest emoji skip* untuk menyerah._`);
                }
                const game = createGuestEmojiGame();
                game.timer = setTimeout(async () => {
                    if (activeGuestEmoji.has(from)) {
                        activeGuestEmoji.delete(from);
                        try {
                            await reply(`⏰ *WAKTU HABIS!*\nWaktu 2 menit telah berakhir dan benda rahasia dari emoji *${game.emojis}* belum berhasil ditebak.\nJawaban yang benar adalah: *${game.mainAnswer}*`);
                        } catch {}
                    }
                }, 120000);
                activeGuestEmoji.set(from, game);
                await reply(`🕵️ *GUEST EMOJI*\n\nTebak benda rahasia dari petunjuk emoji berikut:\n👉 *${game.emojis}*\n\n⏱️ Waktu maksimal *2 menit* untuk menebak!\n_Ketik langsung nama benda tebakanmu di chat ini!_\n_Bantuan: */Guest emoji hint* • Menyerah: */Guest emoji skip*_`);
            }
            // 23. /CW (Connect Word - Maks. 1 Menit per Kata)
            else if (/^\/cw(\s|$)/i.test(cleanBody)) {
                const sub = cleanBody.slice(3).trim().toLowerCase();
                if (['stop', 'skip', 'nyerah', 'end'].includes(sub)) {
                    const current = activeCW.get(from);
                    if (!current) return reply('❌ Tidak ada permainan */CW* (Connect Word) yang sedang berlangsung di chat ini.');
                    clearTimeout(current.timer);
                    activeCW.delete(from);
                    const leaderboard = [...current.scores.entries()]
                        .sort((a, b) => b[1] - a[1])
                        .map(([name, pts], i) => `${i + 1}. *${name}*: ${pts} kata`)
                        .join('\n');
                    return reply(`🏁 *CONNECT WORD (CW) DIHENTIKAN*\n\n• Total kata tersambung: *${current.chain.length} kata*\n• Rantai kata: ${current.chain.join(' ➔ ')}${leaderboard ? `\n\n🏆 *Skor Pemain:*\n${leaderboard}` : ''}`);
                }
                if (activeCW.has(from)) {
                    const current = activeCW.get(from);
                    const remSec = Math.max(1, Math.ceil((current.expiresAt - Date.now()) / 1000));
                    return reply(`⚠️ Permainan */CW* masih berlangsung!\n\nKata saat ini: *${current.currentWord}*\nSambung dengan kata berawalan huruf: *${current.nextLetter}*\n⏱️ Sisa waktu: *${remSec} detik*\n\n_Ketik langsung 1 kata sambunganmu, atau */CW stop* untuk mengakhiri._`);
                }
                const game = createCWGame();
                const scheduleCWTimeout = (cwGame) => {
                    cwGame.timer = setTimeout(async () => {
                        if (activeCW.has(from)) {
                            activeCW.delete(from);
                            const leaderboard = [...cwGame.scores.entries()]
                                .sort((a, b) => b[1] - a[1])
                                .map(([name, pts], i) => `${i + 1}. *${name}*: ${pts} kata`)
                                .join('\n');
                            try {
                                await reply(`⏰ *WAKTU HABIS!*\nWaktu 1 menit telah berakhir dan tidak ada yang menyambung kata *${cwGame.currentWord}* (huruf *${cwGame.nextLetter}*).\n\n• Total rantai: *${cwGame.chain.length} kata*\n• Rantai kata: ${cwGame.chain.join(' ➔ ')}${leaderboard ? `\n\n🏆 *Skor Pemain:*\n${leaderboard}` : ''}`);
                            } catch {}
                        }
                    }, 60000);
                };
                game.scheduleTimeout = () => scheduleCWTimeout(game);
                game.scheduleTimeout();
                activeCW.set(from, game);
                await reply(`🔗 *CONNECT WORD (CW)*\n\nKata pertama: *${game.currentWord}*\nSambung dengan kata berawalan huruf: *${game.nextLetter}*\n\n⏱️ Waktu maksimal jawab: *1 menit* per kata!\n_Ketik langsung 1 kata sambunganmu di chat ini!_\n_Hentikan permainan: */CW stop*_`);
            }
            // Cek Jawaban Pemain pada Game /Guest number
            else if (!cleanBody.startsWith('/') && activeGuestNumber.has(from)) {
                const guess = cleanBody.trim();
                if (/^\d+$/.test(guess)) {
                    const current = activeGuestNumber.get(from);
                    if (guess.length !== 4) {
                        return reply(`❌ Tebakan harus terdiri dari *4 digit angka* (contoh: *2674*).\nAngka rahasia saat ini: *${getMaskedNumber(current)}*`, msg);
                    }
                    current.attempts += 1;
                    let newlyMatched = 0;
                    for (let i = 0; i < 4; i++) {
                        if (guess[i] === current.secret[i] && !current.revealed[i]) {
                            current.revealed[i] = true;
                            newlyMatched += 1;
                        }
                    }
                    const masked = getMaskedNumber(current);
                    const totalRevealed = current.revealed.filter(Boolean).length;
                    const remSec = Math.max(1, Math.ceil((current.expiresAt - Date.now()) / 1000));

                    if (totalRevealed === 4) {
                        clearTimeout(current.timer);
                        activeGuestNumber.delete(from);
                        const playerName = msg.pushName ? ` *${msg.pushName}*` : '';
                        await reply(`🎉 *Empat angka berhasil ditebak ${current.secret}!*\nSelamat${playerName}, seluruh angka rahasia berhasil ditebak dengan jawaban *${guess}* dalam *${current.attempts} percobaan*!`, msg);
                    } else if (newlyMatched > 0) {
                        await reply(`✅ *${NUMBER_WORD_ID[totalRevealed]} angka berhasil ditebak* *${masked}* dari 4 angka rahasia dengan jawaban *${guess}*\n_(Sisa waktu: ${remSec} detik)_`, msg);
                    } else {
                        await reply(`❌ Belum ada angka baru yang cocok. Progres saat ini *${masked}* (${totalRevealed} dari 4 angka rahasia) dengan jawaban *${guess}*\n_(Sisa waktu: ${remSec} detik)_`, msg);
                    }
                }
            }
            // Cek Jawaban Pemain pada Game /Guest emoji
            else if (!cleanBody.startsWith('/') && activeGuestEmoji.has(from)) {
                const guess = cleanBody.toUpperCase().replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
                if (/^[A-Z0-9\s]{2,25}$/.test(guess) && guess.split(' ').length <= 3) {
                    const current = activeGuestEmoji.get(from);
                    current.attempts += 1;
                    if (current.answers.includes(guess)) {
                        clearTimeout(current.timer);
                        activeGuestEmoji.delete(from);
                        const playerName = msg.pushName ? ` *${msg.pushName}*` : '';
                        await reply(`🎉 *TEBAKAN BENAR!*\nSelamat${playerName}, benda rahasia dari emoji *${current.emojis}* adalah *${current.mainAnswer}*! _(Terjawab dalam ${current.attempts} percobaan)_`, msg);
                    } else {
                        await reply(`❌ *${guess}* belum tepat! Coba tebak benda dari emoji *${current.emojis}* lagi.\n_(Sisa waktu: ${formatRemainingTime(current.expiresAt - Date.now())})_`, msg);
                    }
                }
            }
            // Cek Jawaban Pemain pada Game /CW (Connect Word)
            else if (!cleanBody.startsWith('/') && activeCW.has(from)) {
                const guess = cleanBody.toUpperCase().trim();
                if (/^[A-Z]+$/.test(guess)) {
                    const current = activeCW.get(from);
                    if (guess.length < 3) {
                        return reply(`❌ Kata *${guess}* terlalu pendek! Gunakan minimal *3 huruf* yang diawali huruf *${current.nextLetter}*.`, msg);
                    }
                    if (guess[0] !== current.nextLetter) {
                        return reply(`❌ Kata *${guess}* harus diawali dengan huruf *${current.nextLetter}*! (Kata saat ini: *${current.currentWord}*)`, msg);
                    }
                    if (current.usedWords.has(guess)) {
                        return reply(`❌ Kata *${guess}* sudah pernah digunakan dalam ronde ini! Cari kata lain yang diawali huruf *${current.nextLetter}*.`, msg);
                    }
                    if (!isValidIndonesianWord(guess)) {
                        return reply(`❌ *${guess}* tidak dikenali sebagai kata yang valid. Gunakan kata Bahasa Indonesia yang benar!`, msg);
                    }

                    clearTimeout(current.timer);
                    current.usedWords.add(guess);
                    current.chain.push(guess);
                    current.currentWord = guess;
                    current.nextLetter = guess[guess.length - 1];
                    current.expiresAt = Date.now() + 60000;

                    const playerName = msg.pushName || senderNum || 'Pemain';
                    current.scores.set(playerName, (current.scores.get(playerName) || 0) + 1);
                    current.scheduleTimeout();

                    const recentChain = current.chain.length > 6
                        ? `... ➔ ${current.chain.slice(-6).join(' ➔ ')}`
                        : current.chain.join(' ➔ ');

                    await reply(`✅ *SAMBUNG KATA BERHASIL!* (+1 poin untuk *${playerName}*)\n\n🔗 Rantai (${current.chain.length} kata): ${recentChain}\n👉 Sambung berikutnya dengan huruf: *${current.nextLetter}*\n⏱️ Waktu jawab: *1 menit*`, msg);
                }
            }
            // Cek Jawaban Pemain pada Game /ATL
            else if (!cleanBody.startsWith('/') && activeATL.has(from)) {
                const guess = cleanBody.toUpperCase().trim();
                if (/^[A-Z]+$/.test(guess)) {
                    const current = activeATL.get(from);
                    const isValidAnagram = sortLetters(guess) === current.sorted && ATL_WORDS.some(w => w.word === guess);
                    if (guess === current.word || isValidAnagram) {
                        clearTimeout(current.timer);
                        activeATL.delete(from);
                        const playerName = msg.pushName ? ` *${msg.pushName}*` : '';
                        await reply(`🎉 *BENAR!* Selamat${playerName}, susunan kata yang tepat adalah *${guess}*!${guess !== current.word ? `\n_(Kata utama: *${current.word}*)_` : ''}`, msg);
                    } else if (guess.length !== current.word.length) {
                        await reply(`❌ *${guess}* (${guess.length} huruf) belum tepat. Kata harus terdiri dari *${current.word.length} huruf* (*${current.scrambled}*).\n_(Sisa waktu: ${formatRemainingTime(current.expiresAt - Date.now())})_`, msg);
                    } else if (sortLetters(guess) !== current.sorted) {
                        await reply(`❌ Huruf pada *${guess}* tidak sesuai dengan huruf yang tersedia: *${current.scrambled}*.\n_(Sisa waktu: ${formatRemainingTime(current.expiresAt - Date.now())})_`, msg);
                    } else {
                        await reply(`❌ *${guess}* menggunakan huruf yang tepat, tetapi susunannya belum menjadi kata yang benar. Coba susun ulang!\n_(Sisa waktu: ${formatRemainingTime(current.expiresAt - Date.now())})_`, msg);
                    }
                }
            }
            // Eksekusi Auto Responder
            else if (!cleanBody.startsWith('/') && !msg.key.fromMe && autoResponseData.enabled) {
                const matched = autoResponseData.list.find(i => i.trigger.toLowerCase() === cleanBody.toLowerCase());
                if (matched) await reply(matched.response);
            }
        } catch {}
    });
}
startBot();