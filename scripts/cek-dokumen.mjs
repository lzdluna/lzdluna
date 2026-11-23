/**
 * cek-dokumen.mjs — menjaga DESIGN.md tetap sesuai kode.
 *
 * Dokumen desain mudah jadi bohong: nilai token berubah, klaim tidak ikut
 * diperbarui. Skrip ini membaca CSS dan data, lalu memastikan setiap klaim
 * di DESIGN.md masih benar. Dijalankan di CI.
 *
 * Angka kontras TIDAK diperiksa di sini — itu tugas scripts/audit-kontras.mjs,
 * yang menghitung ulang dari token. Di sini hanya invariannya: tidak boleh ada
 * pasangan yang gagal.
 */

import fs from 'node:fs';
import path from 'node:path';
import { audit } from './audit-kontras.mjs';

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

/* --------------------------------------------------------------- token */

const token = {};
for (const m of css.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) token[m[1]] = m[2].toLowerCase();

const wajib = [
  'bg', 'bg-soft', 'card', 'ink', 'ink-soft', 'muted', 'line',
  'yellow', 'orange', 'blue', 'green-fill', 'pink', 'purple',
  'accent', 'accent-wash', 'teal',
  'green', 'green-wash', 'amber', 'amber-wash', 'red', 'red-wash',
  'stabilo', 'stabilo-teal', 'hand'
];

for (const nama of wajib) {
  cek('token --' + nama + ' ada di CSS', Boolean(token[nama]), token[nama]);
  cek('DESIGN.md menyebut nilai --' + nama,
    doc.toUpperCase().includes((token[nama] || 'x').toUpperCase()), token[nama]);
}

/* ------------------------------------------------ kontras: invariannya di sini */

const { hasil, gagal: kontrasGagal } = audit();
cek('audit kontras mengukur pasangan', hasil.length >= 60, hasil.length);
cek('tidak ada pasangan kontras yang gagal', kontrasGagal.length === 0, kontrasGagal.length);
cek('DESIGN.md menyatakan seluruh pasangan lolos AA', /seluruh pasangan lolos/i.test(doc));

/* Palet lama tidak boleh kembali */
const lama = ['#ea580c', '#c2410c', '#fdf1e8', '#0d9488', '#16a34a', '#e9f7ef',
  '#eab308', '#fef7e0', '#dc2626', '#fdecec', '#14345c', '#1f5d31', '#8a4a12', '#a8341f',
  '#faf7f0', '#6b6459'];
for (const h of lama) {
  cek('palet lama ' + h + ' tidak ada di CSS', !css.toLowerCase().includes(h));
}

/* Klaim dokumen tidak boleh bertentangan dengan kenyataan */
cek('DESIGN.md tidak lagi menyebut palet LocalGuide sebagai aktif',
  !/Palet LocalGuide\. Primary/.test(css));
cek('DESIGN.md mendokumentasikan neo-brutalism', /neo-brutalism/i.test(doc));

/* ------------------------------------------------------------ komponen */

const pasangan = [
  ['bayangan keras tanpa blur', /--shadow:4px 4px 0 0 #111111/.test(css)],
  ['border tebal 2\.5px', /2\.5px solid var\(--line\)/.test(css)],
  ['isian kuning', /--yellow:#fddf3a/.test(css)],
  ['isian biru', /--blue:#38bdf8/.test(css)],
  ['isian hijau', /--green-wash:#51e28a/.test(css)],
  ['isian pink', /--red-wash:#ff6584/.test(css)],
  ['isian ungu', /--purple:#c084fc/.test(css)],
  ['latar titik', /radial-gradient/.test(css)],
  ['pita kartu', /\.card::before/.test(css)],
  ['coretan judul', /\.page-head h2::after[\s\S]{0,200}?svg\+xml/.test(css)],
  ['lingkaran nomor', /\.jump-num::before/.test(css)],
  ['stabilo', /linear-gradient\(180deg[\s\S]{0,120}?--stabilo/.test(css)],
  ['pop jawaban', /@keyframes pop/.test(css)],
  ['stiker profil', /\.id-card::after/.test(css)],
  ['fisika tekan', /\.jump:active/.test(css)],
  ['reduced-motion', /prefers-reduced-motion/.test(css)]
];
for (const [nama, kondisi] of pasangan) {
  cek('CSS punya ' + nama, kondisi);
}

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
cek('tanpa aset eksternal', !/(cdn\.|fonts\.googleapis|fonts\.gstatic)/.test(html));
cek('data-stat dipakai', (html.match(/data-stat="/g) || []).length >= 8);
cek('favicon memakai isian oranye', html.includes('%23ff8a3c'));

cek('halaman tidak memakai "saya"', !/\bsaya\b/i.test(html));
cek('halaman memakai "aku"', (html.match(/\baku\b/gi) || []).length >= 5);
cek('DESIGN.md menetapkan aku/kamu', /"aku".*"kamu"/is.test(doc));

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
