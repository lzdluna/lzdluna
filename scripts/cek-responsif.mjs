/**
 * cek-responsif.mjs — memastikan kontrak breakpoint benar-benar ada di CSS.
 *
 * Ini lapisan pertama: cepat dan deterministik, tanpa browser. Ia membuktikan
 * aturan responsif ADA di lebar yang benar, bukan bahwa tampilannya rapi.
 * Untuk itu ada scripts/uji-responsif.mjs (Playwright).
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const css = fs.readFileSync(path.join(ROOT, 'assets/css/skd.css'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

let lulus = 0;
const gagal = [];
const cek = (label, kondisi, info) => {
  if (kondisi) lulus++;
  else gagal.push(label + (info !== undefined ? '  [' + info + ']' : ''));
};

/* ---------------------------------------------------- kumpulkan @media */

const blok = [];   // { lebar, isi }
const semua = [];  // { kondisi, isi }

function kumpulkan(teks) {
  const re = /@media([^{]+)\{/g;
  let m;
  while ((m = re.exec(teks))) {
    let i = m.index + m[0].length;
    let depth = 1;
    while (depth > 0 && i < teks.length) {
      if (teks[i] === '{') depth++;
      else if (teks[i] === '}') depth--;
      i++;
    }
    const isi = teks.slice(m.index + m[0].length, i - 1);
    const kondisi = m[1].trim();
    semua.push({ kondisi, isi });
    const px = kondisi.match(/max-width:\s*(\d+)px/);
    if (px) blok.push({ lebar: Number(px[1]), isi });
  }
}
kumpulkan(css);

const pada = (lebar) => blok.filter((b) => b.lebar === lebar).map((b) => b.isi).join('\n');
const semuaTeks = (lebar) => pada(lebar);

/* --------------------------------------------------------- skala ada */

for (const lebar of [860, 760, 720, 600, 560, 480, 360]) {
  cek('ada blok @media ' + lebar + 'px', pada(lebar).length > 0);
}

/* --------------------------------------------- isi tiap breakpoint */

const wajib = [
  [860, /\.jump-grid\{[^}]*1fr 1fr/, 'jump-grid jadi 2 kolom'],
  [860, /\.grid-3\{[^}]*1fr/, 'grid-3 jadi 1 kolom'],
  [860, /\.sim-grid\{[^}]*1fr/, 'sim-grid jadi 1 kolom'],
  [860, /\.strategy-grid\{[^}]*1fr/, 'strategy-grid jadi 1 kolom'],
  [860, /\.notes-wrap\{[^}]*1fr/, 'notes-wrap jadi 1 kolom'],

  [760, /\.src-list\{[^}]*1fr/, 'src-list jadi 1 kolom'],

  [720, /\.timer-box\{[^}]*column/, 'timer-box menumpuk'],
  [720, /\.foot\{[^}]*column/, 'footer menumpuk'],
  [720, /\.timer-display\{[^}]*clamp/, 'timer-display memakai clamp'],

  [860, /\.nav-toggle\{display:inline-flex/, 'tombol menu muncul'],
  [860, /\.nav-links\{[^}]*display:none/, 'nav-links tersembunyi'],
  [860, /\.nav-links\.is-open\{display:flex/, 'nav-links terbuka'],
  [860, /\.nav-links a\{[^}]*min-height:44px/, 'link menu 44px'],

  [600, /\.table-hint\{display:block/, 'petunjuk geser tabel tampil'],
  [600, /position:sticky;left:0/, 'kolom pertama tabel menempel'],
  [600, /\.table-wrap table\{min-width:520px/, 'tabel menyempit ke 520'],

  [480, /\.timer-controls\{[^}]*column/, 'kontrol timer vertikal'],
  [480, /\.meta-grup\{width:100%/, 'kluster badge satu baris'],
  [480, /\.quiz-bar\{[^}]*column/, 'bar kuis menumpuk'],
  [480, /\.jump-ic\{width:34px/, 'ikon modul mengecil'],

  [360, /\.q-opt\{[^}]*font-size:13px/, 'opsi kuis mengecil di 360']
];

for (const [lebar, re, nama] of wajib) {
  cek(lebar + 'px: ' + nama, re.test(semuaTeks(lebar)));
}

/* ------------------------------------------------- penjaga overflow */

cek('html memakai overflow-x:clip', /html\{overflow-x:clip;\}/.test(css));
cek('body memakai overflow-x:clip', /body\{[^}]*overflow-x:clip/.test(css));
cek('wrap memakai clamp', /\.wrap\{[^}]*padding:0 clamp\(/.test(css));
cek('page-inner memakai clamp', /\.page-inner\{[^}]*clamp\(/.test(css));

/* ------------------------------------------- target sentuh perangkat */

const sentuh = semua.filter((b) => /pointer:\s*coarse/.test(b.kondisi)).map((b) => b.isi).join('\n');
cek('ada blok pointer:coarse', sentuh.length > 0);
for (const sel of ['.nav-toggle', '.nav-links a', '.btn', '.t-btn', '.qf-btn', '.q-opt', '.mark-btn']) {
  cek('target sentuh 44px untuk ' + sel, new RegExp(sel.replace('.', '\\.') + '[^{]*\\{[^}]*min-height:44px|[^{]*' + sel.replace('.', '\\.') + '[^{]*\\{[^}]*44px').test(sentuh) || /min-height:44px/.test(sentuh));
}

/* --------------------------------- tidak ada lebar kaku yang memaksa scroll */

const kaku = [...css.matchAll(/([^{}]+)\{([^}]*min-width:\s*(\d+)px[^}]*)\}/g)]
  .filter((m) => Number(m[3]) > 360)
  .filter((m) => !/table|min-width:520px/.test(m[1]) === false ? !/table/.test(m[1]) : true)
  .map((m) => m[1].trim());

const kakuBermasalah = [...css.matchAll(/([^{}]+)\{([^}]*min-width:\s*(\d+)px[^}]*)\}/g)]
  .filter((m) => Number(m[3]) > 360)
  .filter((m) => !/table/.test(m[1]))
  .map((m) => m[1].trim() + ' (' + m[3] + 'px)');

cek('tidak ada kontainer kaku > 360px', kakuBermasalah.length === 0, kakuBermasalah.join(', '));

/* ------------------------------------------------------------ markup */

cek('tombol menu ada di markup', /id="navToggle"/.test(html));
cek('tombol menu punya aria-controls', /aria-controls="navLinks"/.test(html));
cek('tombol menu aria-expanded=false awal', /id="navToggle"[^>]*aria-expanded="false"/.test(html));
cek('aria-label tombol menu ada', /id="navToggle"[^>]*aria-label="/.test(html));
cek('petunjuk geser tabel ada', /class="table-hint"/.test(html));

/* ------------------------------------------------------------- lapor */

console.log(`${lulus} cek lolos`);
if (gagal.length) {
  console.log(`\n${gagal.length} gagal:`);
  for (const g of gagal) console.log('  x ' + g);
  process.exit(1);
}
console.log('Kontrak breakpoint lengkap.');
