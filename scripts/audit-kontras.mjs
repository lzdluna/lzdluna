/**
 * audit-kontras.mjs — mengukur kontras setiap pasangan warna yang dipakai.
 *
 * Pendekatan deklaratif: pasangan (teks, latar) didaftarkan eksplisit, nilainya
 * diambil dari token di assets/css/skd.css. Ini disengaja — jsdom tidak
 * menerapkan `background` shorthand dan `var()` secara konsisten, sehingga
 * pengukuran lewat DOM memberi angka palsu (dan butuh ~350 detik).
 *
 * Diekspor sebagai audit() agar scripts/cek-dokumen.mjs bisa memakai invarian
 * yang sama tanpa menduplikasi daftar pasangan.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

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
export const rasio = (a, b) => {
  const [x, y] = [L(hex2rgb(a)), L(hex2rgb(b))].sort((p, q) => q - p);
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
};

/* --------------------------------------------------------------- pasangan */
/* [label, token teks, token latar, ukuran px, tebal] */

const P = [
  /* teks isi di atas kertas dan kartu */
  ['h1 hero', 'ink', 'bg', 34, true],
  ['sorotan hero', 'ink', 'yellow', 40, true],
  ['.hero-lead', 'ink-soft', 'bg', 17, false],
  ['h2 judul seksi', 'ink', 'bg', 30, true],
  ['.sec-desc', 'ink-soft', 'bg', 16.5, false],
  ['.eyebrow', 'muted', 'bg', 12.5, true],
  ['.sec-num', 'muted', 'bg', 12.5, true],
  ['paragraf materi', 'ink-soft', 'card', 14.5, false],
  ['.acc-title', 'ink', 'card', 15, true],
  ['.acc-title em', 'muted', 'card', 13, false],
  ['.acc-body h5', 'muted', 'card', 11.5, true],
  ['poin .kp li', 'ink-soft', 'card', 14, false],
  ['.src-body h4', 'ink', 'card', 15.5, true],
  ['.src-body p', 'muted', 'card', 14, false],
  ['.sim p', 'ink-soft', 'card', 14.5, false],
  ['.strategy-card p', 'ink-soft', 'card', 14.5, false],
  ['.quote', 'ink', 'bg', 17.6, false],
  ['.schedule-desc', 'ink-soft', 'card', 14, false],
  ['.schedule-day', 'ink', 'bg-soft', 13, true],
  ['footer p', 'muted', 'bg-soft', 13.5, false],
  ['.id-list label', 'muted', 'card', 13.5, false],
  ['.id-list nilai', 'ink', 'card', 13.5, true],
  ['.me-empty', 'muted', 'card', 14, false],
  ['.order-opt span', 'ink-soft', 'bg-soft', 13.5, false],
  ['.alloc-time', 'muted', 'card', 13, false],

  /* label kecil */
  ['.stat-lbl', 'muted', 'card', 11, true],
  ['.stat-val', 'ink', 'card', 23, true],
  ['th tabel', 'ink', 'yellow', 11.5, true],
  ['td tabel', 'ink', 'card', 14, false],
  ['.card-sub', 'muted', 'card', 13.5, false],
  ['.chip', 'ink', 'card', 13, true],
  ['.jump p', 'ink', 'card', 13.5, false],
  ['.jump-go', 'ink', 'card', 12.5, true],
  ['.me-progress', 'muted', 'bg-soft', 12.5, false],
  ['.acc-chev', 'muted', 'card', 12, false],
  ['input pencarian', 'ink', 'bg', 14, false],
  ['label Benar', 'ink', 'green-wash', 13, false],
  ['label Salah', 'ink', 'red-wash', 13, false],

  /* kartu berwarna: teks tinta di atas isian */
  ['kartu subtes TWK', 'ink', 'yellow', 13.5, false],
  ['kartu subtes TIU', 'ink', 'blue', 13.5, false],
  ['kartu subtes TKP', 'ink', 'pink', 13.5, false],
  ['kartu navigasi hijau', 'ink', 'green-fill', 13.5, false],
  ['kartu navigasi oranye', 'ink', 'orange', 13.5, false],
  ['kartu navigasi ungu', 'ink', 'purple', 13.5, false],
  ['metrik angka', 'ink', 'card', 25, true],
  ['metrik label', 'muted', 'card', 11, true],
  ['label kelompok badge', 'muted', 'bg', 10.5, true],
  ['ikon modul', 'ink', 'card', 20, false],
  ['chip hero ungu', 'ink', 'purple', 13, true],
  ['chip hero oranye', 'ink', 'orange', 13, true],

  /* stabilo */
  ['poin tebal (stabilo)', 'ink', 'stabilo', 16, true],
  ['cakupan tebal (stabilo teal)', 'ink', 'stabilo-teal', 16, true],
  ['label jawaban (stabilo)', 'ink', 'stabilo', 16, true],
  ['target aman (stabilo)', 'ink', 'stabilo', 14, true],

  /* callout, badge, stiker */
  ['.note-strip', 'ink', 'accent-wash', 14.5, false],
  ['.note-strip.warn', 'ink', 'amber-wash', 14.5, false],
  ['.acc-note', 'ink', 'accent-wash', 13, false],
  ['.card-kode', 'ink', 'yellow', 13, true],
  ['.acc-num', 'ink', 'yellow', 12.5, true],
  ['.q-badge TWK', 'ink', 'blue', 10.5, true],
  ['.q-badge TIU', 'ink', 'yellow', 10.5, true],
  ['.q-badge TKP', 'ink', 'green-fill', 10.5, true],
  ['.b-resmi', 'ink', 'green-fill', 11, true],
  ['.b-latihan', 'ink', 'yellow', 11, true],
  ['.acc-flag', 'ink', 'green-fill', 10.5, true],
  ['.src-tag', 'ink', 'card', 11.5, true],
  ['.src-ic', 'ink', 'card', 15, true],
  ['.order-opt b', 'ink', 'bg-soft', 12, true],
  ['.jump-num', 'ink', 'card', 11.5, true],
  ['.q-toggle', 'ink', 'card', 13.5, true],
  ['.timer-note', 'ink', 'yellow', 13, true],
  ['.timer-info p', 'muted', 'yellow', 13.5, false],
  ['.credit a', 'ink', 'bg-soft', 13.5, true],
  ['tautan teks', 'ink', 'bg', 16.5, false],
  ['.me-tab', 'ink-soft', 'blue', 13.5, true],

  /* tombol dan state aktif */
  ['.btn primer', 'putih', 'ink', 14.5, true],
  ['.t-btn.primary', 'putih', 'ink', 13.5, true],
  ['.timer-pill', 'putih', 'ink', 13, true],
  ['.qf-btn.active', 'putih', 'ink', 13, true],
  ['.me-tab.active', 'putih', 'ink', 13.5, true],
  ['.nav-links a.active', 'putih', 'ink', 13.5, false],
  ['.brand-mark', 'ink', 'orange', 16, true],
  ['.avatar', 'ink', 'purple', 23, true],
  ['.mark-btn.on', 'ink', 'green-wash', 12.5, true],
  ['.q-opt', 'ink', 'card', 14, false],
  ['.q-opt correct', 'ink', 'green-wash', 14, true],
  ['.q-opt wrong', 'ink', 'red-wash', 14, false],
  ['.timer-display', 'ink', 'yellow', 32, true],
  ['.timer-display kritis', 'ink', 'pink', 32, true],
  ['.t-btn reset', 'ink', 'card', 13.5, true]
];

/* ------------------------------------------------------- yang sudah diterima */
/* Kosong berarti seluruh pasangan harus lolos. Entri di sini wajib beralasan. */
const DITERIMA = {};

/* ------------------------------------------------------------------ audit */

export function audit() {
  const css = fs.readFileSync(path.join(ROOT, 'assets/css/skd.css'), 'utf8');

  const token = {};
  for (const m of css.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) token[m[1]] = m[2].toLowerCase();
  token.putih = '#ffffff';

  const hilang = [...new Set(P.flatMap(([, fg, bg]) => [fg, bg]))].filter((k) => !token[k]);
  if (hilang.length) {
    throw new Error('Token tidak ditemukan di CSS: ' + hilang.join(', '));
  }

  const hasil = P.map(([label, fgKey, bgKey, px, tebal]) => {
    const fg = token[fgKey];
    const bg = token[bgKey];
    const besar = px >= 24 || (tebal && px >= 18.66);
    const ambang = besar ? 3.0 : 4.5;
    const r = rasio(fg, bg);
    return { label, fg, bg, px, tebal, besar, ambang, r, lulus: r >= ambang };
  });

  const gagal = hasil.filter((h) => !h.lulus && !DITERIMA[h.label]);
  const terendah = hasil.slice().sort((a, b) => a.r - b.r)[0];
  const stabiloAman = /\.note-strip b,\.acc-note b\{color:var\(--ink\);\}/.test(css);

  return { hasil, gagal, terendah, stabiloAman, token };
}

/* --------------------------------------------------------------- CLI */

const langsung = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename);

if (langsung) {
  const { hasil, gagal, terendah, stabiloAman } = audit();

  const baris = (h) =>
    String(h.r).padStart(6) + '/ ' + h.ambang + '  ' + h.label.padEnd(30).slice(0, 30) +
    ' ' + h.fg.toUpperCase() + ' di ' + h.bg.toUpperCase() +
    '  ' + (h.besar ? 'besar' : 'kecil') + ' ' + h.px + 'px' + (h.tebal ? ' bold' : '');

  console.log('Pasangan diukur : ' + hasil.length);
  console.log('Lolos AA        : ' + (hasil.length - gagal.length));
  console.log('Gagal           : ' + gagal.length);

  if (gagal.length) {
    console.log('\nGAGAL:');
    for (const h of gagal.sort((a, b) => a.r - b.r)) console.log('  ' + baris(h));
  }

  if (!stabiloAman) {
    console.log('\nREGRESI: aturan pengaman stabilo hilang (.note-strip b / .acc-note b harus --ink)');
  }

  console.log('\nTerendah: ' + baris(terendah));

  if (gagal.length || !stabiloAman) process.exit(1);
  console.log('\nTidak ada regresi kontras.');
}
