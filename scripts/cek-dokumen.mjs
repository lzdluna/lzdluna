/**
 * cek-dokumen.mjs — menjaga DESIGN.md tetap sesuai kode.
 *
 * Dokumen desain mudah jadi bohong: nilai token berubah, angka kontras di tabel
 * tidak ikut diperbarui. Skrip ini membaca CSS dan data, lalu memastikan setiap
 * klaim di DESIGN.md masih benar. Dijalankan di CI.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const baca = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const css = baca('assets/css/skd.css');
const html = baca('index.html');
const doc = baca('DESIGN.md');
const js = ['render', 'router', 'timer', 'quiz', 'materi', 'sumber', 'app']
  .map((m) => baca('assets/js/' + m + '.js')).join('\n');

let lulus = 0;
const gagal = [];
const cek = (label, kondisi, info) => {
  if (kondisi) lulus++;
  else gagal.push(label + (info !== undefined ? '  [' + info + ']' : ''));
};

/* ------------------------------------------------------------- kontras */

const hex = (h) => h.replace('#', '').match(/\w\w/g).map((x) => parseInt(x, 16) / 255);
const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const L = (h) => {
  const [r, g, b] = hex(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const rasio = (a, b) => {
  const [x, y] = [L(a), L(b)].sort((p, q) => q - p);
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
};

/* --------------------------------------------------------------- token */

const token = {};
for (const m of css.matchAll(/--([a-z-]+):(#[0-9a-fA-F]{6})/g)) token[m[1]] = m[2].toLowerCase();

const wajib = [
  'bg', 'bg-soft', 'card', 'ink', 'ink-soft', 'muted', 'line',
  'accent', 'accent-soft', 'accent-wash', 'teal',
  'green', 'green-wash', 'amber', 'amber-wash', 'red', 'red-wash',
  'stabilo', 'stabilo-teal', 'hand'
];

for (const nama of wajib) {
  cek('token --' + nama + ' ada di CSS', Boolean(token[nama]), token[nama]);
  cek('DESIGN.md menyebut nilai --' + nama, doc.toUpperCase().includes((token[nama] || 'x').toUpperCase()),
    token[nama]);
}

/* ------------------------------------------------- tabel kontras akurat */

const baris = [...doc.matchAll(/^\| `--([a-z-]+)` \| `(#[0-9A-Fa-f]{6})` \| ([\d.]+) \| ([\d.]+) \| ([\d.]+) \|/gm)];
cek('tabel kontras punya 9 baris', baris.length === 9, baris.length);

for (const [, nama, hexDoc, b1, b2, b3] of baris) {
  const w = token[nama] || hexDoc.toLowerCase();
  cek('tabel: hex --' + nama + ' sama dengan CSS', w.toLowerCase() === hexDoc.toLowerCase(), w + ' vs ' + hexDoc);
  cek('tabel: --' + nama + ' di --bg', Number(b1) === rasio(w, token.bg), b1 + ' vs ' + rasio(w, token.bg));
  cek('tabel: --' + nama + ' di --bg-soft', Number(b2) === rasio(w, token['bg-soft']), b2 + ' vs ' + rasio(w, token['bg-soft']));
  cek('tabel: --' + nama + ' di --card', Number(b3) === rasio(w, token.card), b3 + ' vs ' + rasio(w, token.card));
}

/* Klaim "aman" harus benar-benar aman */
for (const t of ['ink', 'ink-soft', 'muted']) {
  const min = Math.min(rasio(token[t], token.bg), rasio(token[t], token['bg-soft']), rasio(token[t], token.card));
  cek('teks --' + t + ' benar-benar lolos 4.5:1', min >= 4.5, min);
}

/* Klaim "gagal AA" harus benar-benar gagal */
for (const t of ['accent', 'teal', 'green', 'amber']) {
  cek('--' + t + ' memang di bawah 4.5:1', rasio(token[t], token.bg) < 4.5, rasio(token[t], token.bg));
}

/* Varian pemulihan AA yang dicantumkan dokumen */
const varian = { accent: '#BB460A', teal: '#0B7970', amber: '#886805', green: '#117D39', red: '#D22424' };
for (const [nama, v] of Object.entries(varian)) {
  const r = rasio(v, token.bg);
  cek('varian ' + nama + ' ' + v + ' lolos 4.5:1', r >= 4.5, r);
  cek('DESIGN.md mencantumkan ' + v, doc.includes(v), v);
}

/* Teks putih di atas accent */
const putih = rasio('#ffffff', token.accent);
cek('putih di atas --accent = ' + putih + ' dan dikutip', doc.includes(String(putih)), putih);

/* ---------------------------------------------------- dokumen tidak bohong */

cek('DESIGN.md tidak mengklaim AA menyeluruh', !/lolos 4\.5:1 di semua kombinasi/i.test(doc));
cek('DESIGN.md menyatakan tidak memenuhi AA', /TIDAK memenuhi WCAG AA/i.test(doc));
cek('Known Gaps mencatat kontras', /Kontras di bawah WCAG AA/i.test(doc));

/* Palet lama tidak boleh kembali */
for (const h of ['#14345c', '#1f4a7d', '#e8eef6', '#1f5d31', '#e7f0e8', '#8a4a12', '#fdeee0', '#a8341f', '#fbe9e5']) {
  cek('token lama ' + h + ' tidak ada di CSS', !css.toLowerCase().includes(h));
  cek('token lama ' + h + ' tidak ada di DESIGN.md', !doc.toLowerCase().includes(h));
}

/* ------------------------------------------------------------ studygram */

const pasangan = [
  ['latar titik', /radial-gradient/.test(css), /Kertas titik/i],
  ['pita washi', /\.card::before/.test(css), /Pita washi/i],
  ['stiker badge', /\.acc-flag\{[\s\S]{0,300}?transform:rotate/.test(css), /Stiker\b/i],
  ['coretan judul', /\.page-head h2::after[\s\S]{0,200}?svg\+xml/.test(css), /Coretan judul/i],
  ['lingkaran nomor', /\.jump-num::before/.test(css), /Lingkaran nomor/i],
  ['stabilo', /linear-gradient\(180deg[\s\S]{0,120}?--stabilo/.test(css), /Stabilo/i],
  ['pop jawaban', /@keyframes pop/.test(css), /\*\*Pop\*\*/i],
  ['stiker profil', /\.id-card::after/.test(css), /Stiker profil/i],
  ['reduced-motion', /prefers-reduced-motion[\s\S]{0,400}?transform:none/.test(css), /prefers-reduced-motion/i]
];
for (const [nama, kondisiCss, polaDoc] of pasangan) {
  cek('CSS punya ' + nama, kondisiCss);
  cek('DESIGN.md mendokumentasikan ' + nama, polaDoc.test(doc));
}

/* Nada tulisan */
cek('halaman tidak memakai "saya"', !/\bsaya\b/i.test(html));
cek('halaman memakai "aku"', (html.match(/\baku\b/gi) || []).length >= 5);
cek('DESIGN.md menetapkan aku/kamu', /"aku".*"kamu"/is.test(doc));

/* ---------------------------------------------------------- struktur lain */

for (const bp of [860, 760, 720, 640, 600, 560]) {
  cek('CSS punya max-width ' + bp, new RegExp('max-width:\\s*' + bp + 'px').test(css));
  cek('DESIGN.md menyebut ' + bp, doc.includes(String(bp)));
}

for (const k of ['skdnotes.materi.done.v1', 'skdnotes.timer.v1']) {
  cek('key ' + k + ' dipakai kode', js.includes(k));
  cek('key ' + k + ' didokumentasikan', doc.includes(k));
}

for (const m of ['render', 'router', 'timer', 'quiz', 'materi', 'sumber', 'app']) {
  cek('modul ' + m + '.js ada', fs.existsSync(path.join(ROOT, 'assets/js/' + m + '.js')));
  cek('DESIGN.md menyebut modul ' + m, doc.includes(m));
}

cek('7 modul dimuat dengan defer', (html.match(/<script defer src="assets\/js\//g) || []).length === 7);
cek('tanpa CSS inline', !html.includes('<style>'));
cek('tanpa JS inline', !/<script>/.test(html));
cek('data-stat dipakai', (html.match(/data-stat="/g) || []).length >= 8);
cek('favicon memakai accent', html.includes('%23' + token.accent.replace('#', '')));

/* Karakter khusus utuh */
cek('glyph penting ada (→✓✕)', ['\u2192', '\u2713', '\u2715'].every((g) => css.includes(g)));
cek('tidak ada mojibake di CSS', !/[ÃÂ]/.test(css));
cek('tidak ada mojibake di DESIGN.md', !/[ÃÂ]/.test(doc));

/* ------------------------------------------------------------- laporan */

console.log(`${lulus} cek lolos`);
if (gagal.length) {
  console.log(`\n${gagal.length} gagal:`);
  for (const g of gagal) console.log('  x ' + g);
  process.exit(1);
}
console.log('DESIGN.md konsisten dengan kode.');
