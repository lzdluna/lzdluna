/**
 * audit-kontras.mjs — mengukur kontras setiap pasangan warna yang dipakai.
 *
 * Pendekatan deklaratif: pasangan (teks, latar) didaftarkan eksplisit, nilainya
 * diambil dari token di assets/css/skd.css. Ini disengaja — jsdom tidak
 * menerapkan `background` shorthand dan `var()` secara konsisten, sehingga
 * pengukuran lewat DOM memberi angka palsu. Pasangan di sini adalah pasangan
 * yang benar-benar dipakai di halaman; kalau ada komponen baru, tambahkan
 * barisnya.
 *
 * Keluar dengan kode 1 bila ada pasangan gagal yang belum terdaftar di
 * DITERIMA, artinya regresi.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const css = fs.readFileSync(path.join(ROOT, 'assets/css/skd.css'), 'utf8');

/* ------------------------------------------------------------------ warna */

const hex2rgb = (h) => {
  let x = h.replace('#', '');
  if (x.length === 3) x = x.split('').map((c) => c + c).join('');
  return { r: parseInt(x.slice(0, 2), 16), g: parseInt(x.slice(2, 4), 16), b: parseInt(x.slice(4, 6), 16) };
};
const lin = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const L = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
const rasio = (a, b) => {
  const [x, y] = [L(hex2rgb(a)), L(hex2rgb(b))].sort((p, q) => q - p);
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
};

/* ----------------------------------------------------------------- token */

const token = {};
for (const m of css.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) token[m[1]] = m[2].toLowerCase();

const wajib = ['bg', 'bg-soft', 'card', 'ink', 'ink-soft', 'muted', 'accent',
  'green', 'green-wash', 'amber', 'amber-wash', 'red', 'red-wash',
  'accent-wash', 'teal', 'stabilo', 'stabilo-teal'];
const hilang = wajib.filter((k) => !token[k]);
if (hilang.length) {
  console.error('Token tidak ditemukan di CSS: ' + hilang.join(', '));
  process.exit(1);
}

/* -------------------------------------------------------------- pasangan */
/* [label, warna teks, warna latar, ukuran px, tebal] */

const P = [
  /* teks isi */
  ['h1 hero', token.ink, token.bg, 34, false],
  ['.hero-lead', token['ink-soft'], token.bg, 17, false],
  ['h2 judul seksi', token.ink, token.bg, 30, false],
  ['.sec-desc', token['ink-soft'], token.bg, 16.5, false],
  ['.eyebrow', token.muted, token.bg, 12.5, true],
  ['.sec-num', token.muted, token.bg, 12.5, true],
  ['paragraf materi', token['ink-soft'], token.card, 14.5, false],
  ['.acc-title', token.ink, token.card, 15, true],
  ['.acc-title em', token.muted, token.card, 13, false],
  ['.acc-body h5', token.muted, token.card, 11.5, true],
  ['poin .kp li', token['ink-soft'], token.card, 14, false],
  ['sumber .src-body p', token.muted, token.card, 14, false],
  ['simulasi .sim p', token['ink-soft'], token.card, 14.5, false],
  ['strategi .strategy-card p', token['ink-soft'], token.card, 14.5, false],
  ['catatan .prose p', token['ink-soft'], token.bg, 16.5, false],
  ['.quote', token.ink, token.bg, 17.6, false],
  ['.schedule-desc', token['ink-soft'], token.card, 14, false],
  ['.schedule-day', token.ink, token['bg-soft'], 13, true],
  ['footer p', token.muted, token['bg-soft'], 13.5, false],
  ['.id-list label', token.muted, token.card, 13.5, false],
  ['.id-list nilai', token.ink, token.card, 13.5, true],

  /* label kecil */
  ['.stat-lbl', token.muted, token.card, 11, true],
  ['.stat-val', token.ink, token.card, 23, false],
  ['th tabel', token.muted, token['bg-soft'], 11.5, true],
  ['td tabel', token.ink, token.card, 14, false],
  ['.card-sub', token.muted, token.card, 13.5, false],
  ['.chip', token['ink-soft'], token.card, 13, false],
  ['.jump p', token['ink-soft'], token.card, 13.5, false],
  ['.me-progress', token.muted, token['bg-soft'], 12.5, false],
  ['.acc-chev', token.muted, token.card, 12, false],
  ['.alloc-time', token.muted, token['bg-soft'], 13, false],
  ['.me-empty', token.muted, token.card, 14, false],
  ['input pencarian', token.ink, token.bg, 14, false],
  ['label Benar', token.green, token.card, 13, false],
  ['label Salah', token.red, token.card, 13, false],
  ['skor TKP 5', token.green, token.card, 14, true],
  ['skor TKP 3', token.amber, token.card, 14, true],
  ['skor TKP 1', token.red, token.card, 14, true],

  /* stabilo: teks gelap di atas sorotan */
  ['poin tebal (stabilo)', token.ink, token.stabilo, 16, true],
  ['cakupan tebal (stabilo teal)', token.ink, token['stabilo-teal'], 16, true],
  ['label jawaban (stabilo)', token.ink, token.stabilo, 16, true],
  ['callout tebal (stabilo)', token.ink, token.stabilo, 16, true],
  ['nomor topik selesai (stabilo)', token.hand || token.ink, token.stabilo, 12.5, true],
  ['target aman (stabilo)', token.ink, token.stabilo, 14, true],

  /* callout & badge */
  ['.note-strip', token.accent, token['accent-wash'], 14.5, false],
  ['.note-strip.warn', token.amber, token['amber-wash'], 14.5, false],
  ['.acc-note', token.accent, token['accent-wash'], 13, false],
  ['.card-kode', token.accent, token['accent-wash'], 13, true],
  ['.acc-num', token.accent, token['accent-wash'], 12.5, true],
  ['.q-badge TWK', token.accent, token['accent-wash'], 10.5, true],
  ['.q-badge TIU', token.amber, token['amber-wash'], 10.5, true],
  ['.q-badge TKP', token.green, token['green-wash'], 10.5, true],
  ['.b-resmi', token.green, token['green-wash'], 11, true],
  ['.b-latihan', token.amber, token['amber-wash'], 11, true],
  ['.acc-flag', token.green, token['green-wash'], 10.5, true],
  ['.src-tag', token.accent, token.card, 11.5, true],
  ['.src-ic', token.accent, token['bg-soft'], 15, true],
  ['.order-opt b', token.accent, token['bg-soft'], 12, true],
  ['.jump-num', token.accent, token.card, 11.5, true],
  ['.jump-go', token.accent, token.card, 12.5, true],
  ['.q-toggle', token.accent, token.card, 13.5, true],
  ['.timer-note', token.accent, token['bg-soft'], 13, true],
  ['.credit a', token.teal, token['bg-soft'], 13.5, true],
  ['tautan teks', token.teal, token.bg, 16.5, false],

  /* tombol & state aktif */
  ['.btn primer', '#ffffff', token.accent, 14.5, true],
  ['.t-btn.primary', '#ffffff', token.accent, 13.5, true],
  ['.timer-pill', '#ffffff', token.accent, 13, true],
  ['.qf-btn.active', '#ffffff', token.accent, 13, true],
  ['.me-tab.active', '#ffffff', token.accent, 13.5, true],
  ['.nav-links a.active', '#ffffff', token.accent, 13.5, false],
  ['.brand-mark', token.bg, token.accent, 16, false],
  ['.avatar', token.bg, token.accent, 23, false],
  ['.mark-btn.on', token.green, token['green-wash'], 12.5, true],
  ['.q-opt.correct', token.green, token['green-wash'], 14, true],
  ['.q-opt.wrong', token.red, token['red-wash'], 14, false],
  ['.timer-display kritis', token.red, token['bg-soft'], 32, true],
  ['.t-btn reset', token.ink, token.card, 13.5, true]
];

/* ------------------------------------------------------- yang sudah diterima */
/* Gagal karena palet LocalGuide dipakai verbatim di atas latar kertas.
   Entri harus punya alasan; gagal tanpa alasan = regresi. */
const DITERIMA = {
  '.note-strip': 'Warning #EAB308 pada amber-wash',
  '.note-strip.warn': 'Warning #EAB308 pada amber-wash',
  '.acc-note': 'Primary #EA580C pada accent-wash',
  '.card-kode': 'Primary #EA580C pada accent-wash',
  '.acc-num': 'Primary #EA580C pada accent-wash',
  '.q-badge TWK': 'Primary #EA580C pada accent-wash',
  '.q-badge TIU': 'Warning #EAB308 pada amber-wash',
  '.q-badge TKP': 'Success #16A34A pada green-wash',
  '.b-resmi': 'Success #16A34A pada green-wash',
  '.b-latihan': 'Warning #EAB308 pada amber-wash',
  '.acc-flag': 'Success #16A34A pada green-wash',
  '.src-tag': 'Primary #EA580C pada card',
  '.src-ic': 'Primary #EA580C pada bg-soft',
  '.order-opt b': 'Primary #EA580C pada bg-soft',
  '.jump-num': 'Primary #EA580C pada card',
  '.jump-go': 'Primary #EA580C pada card',
  '.q-toggle': 'Primary #EA580C pada card',
  '.timer-note': 'Primary #EA580C pada bg-soft',
  '.credit a': 'Secondary #0D9488 pada bg-soft',
  'tautan teks': 'Secondary #0D9488 pada kertas',
  '.btn primer': 'putih pada Primary #EA580C',
  '.t-btn.primary': 'putih pada Primary #EA580C',
  '.timer-pill': 'putih pada Primary #EA580C',
  '.qf-btn.active': 'putih pada Primary #EA580C',
  '.me-tab.active': 'putih pada Primary #EA580C',
  '.nav-links a.active': 'putih pada Primary #EA580C',
  '.brand-mark': 'warna kertas pada Primary #EA580C',
  '.avatar': 'warna kertas pada Primary #EA580C',
  '.mark-btn.on': 'Success #16A34A pada bg-soft',
  '.q-opt.correct': 'Success #16A34A pada green-wash',
  '.q-opt.wrong': 'Error #DC2626 pada red-wash',
  '.timer-display kritis': 'Error #DC2626 pada bg-soft',
  'skor TKP 3': 'Warning #EAB308 pada card',
  'label Benar': 'Success #16A34A pada card',
  'skor TKP 5': 'Success #16A34A pada card'
};

/* ------------------------------------------------------------------ ukur */

const hasil = [];
for (const [label, fg, bg, px, tebal] of P) {
  const besar = px >= 24 || (tebal && px >= 18.66);
  const ambang = besar ? 3.0 : 4.5;
  const r = rasio(fg, bg);
  hasil.push({ label, fg, bg, px, tebal, besar, ambang, r, lulus: r >= ambang });
}

/* ----------------------------------------------------------------- lapor */

const gagal = hasil.filter((h) => !h.lulus);
const baru = gagal.filter((h) => !DITERIMA[h.label]);
const baris = (h) =>
  String(h.r).padStart(6) + '/ ' + h.ambang + '  ' + h.label.padEnd(32).slice(0, 32) +
  ' ' + h.fg.toUpperCase() + ' di ' + h.bg.toUpperCase() +
  '  ' + (h.besar ? 'besar' : 'kecil') + ' ' + h.px + 'px' + (h.tebal ? ' bold' : '');

console.log('Pasangan diukur : ' + hasil.length);
console.log('Lolos AA        : ' + (hasil.length - gagal.length));
console.log('Gagal (diterima): ' + (gagal.length - baru.length));
console.log('Regresi         : ' + baru.length);

if (baru.length) {
  console.log('\nREGRESI — gagal tanpa alasan tercatat:');
  for (const h of baru) console.log('  ' + baris(h));
  process.exit(1);
}

console.log('\nGagal yang sudah diterima (konsekuensi palet verbatim):');
for (const h of gagal.sort((a, b) => a.r - b.r)) console.log('  ' + baris(h));

/* Stabilo tidak boleh menyorot teks berwarna semantik */
if (!/\.note-strip b,\.acc-note b\{color:var\(--ink\);\}/.test(css)) {
  console.log('\nREGRESI: aturan pengaman stabilo hilang (.note-strip b / .acc-note b harus --ink)');
  process.exit(1);
}

console.log('\nTidak ada regresi kontras.');
