process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino'), readline = require('readline'), fs = require('fs'), https = require('https');
const logger = pino({ level: 'silent' }), activeSpams = new Map(), AUTO_RESPONSE_FILE = './auto_response.json';

const BOT_INFO = {
    name: 'A-S Bot WA',
    version: '1.2.1',
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
    19: '/Number command off'
};

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
            if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;
            const from = msg.key.remoteJid, body = extractText(msg.message), senderNum = (msg.key.participant || from).replace(/[^0-9]/g, '');
            const reply = (text, quoted) => sock.sendMessage(from, { text }, quoted ? { quoted } : {});
            const allowedNumbers = [sock.user?.id.split(':')[0], '628211250424'], isOwner = allowedNumbers.includes(senderNum) || msg.key.fromMe;
            if (body.startsWith('/') && !isOwner) return reply('❌ Maaf, bot ini bersifat privat dan hanya dapat digunakan oleh pemilik yang terdaftar.');
            if (msg.key.fromMe && !body.startsWith('/')) return;

            let cleanBody = body.trim();
            // Resolusi Number Command (/1 s.d. /19 + argumen opsional)
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
18. /Number command on - Menyalakan pintasan perintah angka (/1 - /19)
19. /Number command off - Mematikan pintasan perintah angka`);
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
19. */Number command off* - Mematikan fitur pintasan perintah angka.`);
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
• *Total Perintah:* 19 perintah
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
                await reply('✅ Number command sekarang *ON (Aktif)*.\nGunakan */1* s.d. */19* sesuai urutan di */A-S Guide*.');
            }
            else if (cleanBody.toLowerCase() === '/number command off') {
                autoResponseData.numberCommand = false;
                saveAutoResponse(autoResponseData);
                await reply('⛔ Number command sekarang *OFF (Nonaktif)*.');
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