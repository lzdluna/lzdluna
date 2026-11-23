/**
 * uji.mjs — rangkaian tes perilaku di jsdom.
 *
 * Halaman disajikan lewat HTTP (bukan file://) karena data dimuat dengan
 * fetch(). Setiap bagian menguji satu modul: struktur, router, kuis, timer,
 * materi, sumber, angka turunan, serta state pemuatan dan kegagalan.
 */

import fs from 'node:fs';
import path from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { buatServer } from './serve.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');

let lulus = 0;
const gagal = [];

function cek(label, kondisi, info) {
  if (kondisi) {
    lulus++;
  } else {
    gagal.push(label + (info !== undefined ? '  [' + info + ']' : ''));
  }
}

const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));

async function tungguSiap(dom, batas = 8000) {
  const mulai = Date.now();
  for (;;) {
    const d = dom.window.document;
    const list = d.getElementById('quizList');
    const galat = d.getElementById('galat');
    if (galat && galat.hidden === false) return 'galat';
    if (list && list.children.length > 0 && !list.hasAttribute('aria-busy')) return 'siap';
    if (Date.now() - mulai > batas) throw new Error('render tidak selesai dalam ' + batas + ' ms');
    await tunggu(25);
  }
}

/** jsdom mendaftarkan <link> lebih dulu, aturan CSS-nya menyusul. */
async function tungguCss(dom, batas = 5000) {
  const mulai = Date.now();
  for (;;) {
    const sheets = dom.window.document.styleSheets;
    let siap = false;
    for (let i = 0; i < sheets.length; i++) {
      try {
        if (sheets[i].cssRules && sheets[i].cssRules.length > 0) siap = true;
      } catch (e) {}
    }
    if (siap) return true;
    if (Date.now() - mulai > batas) return false;
    await tunggu(25);
  }
}

/** Buka halaman lewat server. beforeParse dipakai untuk menyuntik fetch/Date. */
function buka(base, beforeParse, html) {
  const vc = new VirtualConsole();
  const galatKonsol = [];
  vc.on('jsdomError', (e) => {
    if (!/Not implemented/.test(e.message)) galatKonsol.push('jsdomError: ' + e.message);
  });
  vc.on('error', (m) => galatKonsol.push('console.error: ' + m));

  const dom = new JSDOM(html, {
    url: base + '/',
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(win) {
      win.fetch = (url, opsi) => globalThis.fetch(new URL(String(url), win.location.href), opsi);
      if (beforeParse) beforeParse(win);
    }
  });

  dom.galatKonsol = galatKonsol;
  return dom;
}

function klik(win, el) {
  el.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
}

/* ==================================================================== */

const server = buatServer(ROOT);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
const HTML = await (await fetch(BASE + '/')).text();

try {
  /* ---------------------------------------------------------------- CSS */
  /* Dijalankan pertama, pada dokumen sendiri. Pemeriksaan memakai isi
     cssRules, bukan getComputedStyle: jsdom tidak mewariskan custom property
     secara konsisten ke elemen turunan, sehingga var() sering tidak terurai. */
  {
    const dom = buka(BASE, null, HTML);
    await tungguSiap(dom);
    const d = dom.window.document;
    const cssSiap = await tungguCss(dom);
    cek('stylesheet eksternal termuat', cssSiap && d.styleSheets.length >= 1, d.styleSheets.length);

    const aturan = new Map();
    const media = [];
    (function jelajah(daftar) {
      for (let i = 0; i < daftar.length; i++) {
        const r = daftar[i];
        if (r.selectorText) aturan.set(r.selectorText, r.style);
        else if (r.cssRules) {
          if (r.conditionText) media.push(r.conditionText);
          jelajah(r.cssRules);
        }
      }
    })(d.styleSheets[0].cssRules);

    const gaya = (sel) => aturan.get(sel);
    const nilai = (sel, prop) => (gaya(sel) ? gaya(sel).getPropertyValue(prop).trim() : '');
    const radius = (sel) =>
      nilai(sel, 'border-radius') ||
      nilai(sel, 'border-top-left-radius');

    cek('CSS terurai > 200 aturan', aturan.size > 200, aturan.size);
    cek(':root --muted = #6b6459', nilai(':root', '--muted') === '#6b6459', nilai(':root', '--muted'));
    cek(':root --radius = 14px', nilai(':root', '--radius') === '14px');
    cek(':root --maxw = 1080px', nilai(':root', '--maxw') === '1080px');

    /* Palet LocalGuide, verbatim. */
    cek(':root --accent = #ea580c', nilai(':root', '--accent') === '#ea580c', nilai(':root', '--accent'));
    cek(':root --teal = #0d9488', nilai(':root', '--teal') === '#0d9488', nilai(':root', '--teal'));
    cek(':root --green = #16a34a', nilai(':root', '--green') === '#16a34a', nilai(':root', '--green'));
    cek(':root --amber = #eab308', nilai(':root', '--amber') === '#eab308', nilai(':root', '--amber'));
    cek(':root --red = #dc2626', nilai(':root', '--red') === '#dc2626', nilai(':root', '--red'));
    cek('tautan memakai teal', /var\(--teal\)/.test(nilai('a', 'color')), nilai('a', 'color'));
    cek('kredit memakai teal', /var\(--teal\)/.test(nilai('.credit a', 'color')), nilai('.credit a', 'color'));
    cek('latar tetap kertas hangat', nilai(':root', '--bg') === '#faf7f0', nilai(':root', '--bg'));
    cek('custom property terbaca di documentElement',
      dom.window.getComputedStyle(d.documentElement).getPropertyValue('--muted').trim() === '#6b6459');

    cek('.card memakai --radius', /var\(--radius\)/.test(radius('.card')), radius('.card'));
    cek('.card tanpa transition transform', !/transform/.test(nilai('.card', 'transition')), nilai('.card', 'transition'));
    cek('.q-opt:disabled opacity tetap 1', nilai('.q-opt:disabled', 'opacity') === '1');
    cek('.q-opt.correct::after menampilkan centang', /✓/.test(nilai('.q-opt.correct::after', 'content')),
      nilai('.q-opt.correct::after', 'content'));
    cek('.q-opt.wrong::after menampilkan silang', /✕/.test(nilai('.q-opt.wrong::after', 'content')),
      nilai('.q-opt.wrong::after', 'content'));
    cek('.qf-btn.active berlatar --accent', /var\(--accent\)/.test(nilai('.qf-btn.active', 'background')),
      nilai('.qf-btn.active', 'background'));
    cek('th memakai --muted', /var\(--muted\)/.test(nilai('th', 'color')), nilai('th', 'color'));
    cek('ada media query prefers-reduced-motion',
      media.some((m) => /prefers-reduced-motion/.test(m)), media.join(' | '));
    cek('ada media query max-width 860px', media.some((m) => /max-width:\s*860px/.test(m)));
    cek('body memakai font sistem', /-apple-system|Segoe UI/.test(nilai('body', 'font-family')),
      nilai('body', 'font-family'));
    cek('judul serif Georgia weight 400',
      /Georgia/.test(nilai('h2', 'font-family')) && nilai('h2', 'font-weight') === '400',
      nilai('h2', 'font-family') + ' / ' + nilai('h2', 'font-weight'));

    dom.window.close();
  }

  /* ------------------------------------------------------------- struktur */
  {
    const dom = buka(BASE, null, HTML);
    const hasil = await tungguSiap(dom);
    const d = dom.window.document;
    cek('halaman berhasil dimuat dari data JSON', hasil === 'siap', hasil);

    const items = [...d.querySelectorAll('[data-quiz]')];
    cek('18 soal dirender', items.length === 18, items.length);

    const opsi = items.flatMap((q) => [...q.querySelectorAll('[data-opt]')]);
    cek('90 opsi jawaban', opsi.length === 90, opsi.length);
    cek('semua opsi <button type=button>', opsi.every((o) => o.tagName === 'BUTTON' && o.type === 'button'));
    cek('opsi diberi label A-E', opsi[0].textContent.startsWith('A. ') && opsi[4].textContent.startsWith('E. '));
    cek('tiap soal punya tepat 1 kunci',
      items.every((q) => q.querySelectorAll('[data-opt][data-correct]').length === 1));

    cek('16 topik materi dirender', d.querySelectorAll('#materiPanels .acc').length === 16,
      d.querySelectorAll('#materiPanels .acc').length);
    cek('12 kartu sumber dirender',
      d.querySelectorAll('#sumberResmi .src').length + d.querySelectorAll('#sumberTambahan .src').length === 12);
    cek('4 sumber resmi', d.querySelectorAll('#sumberResmi .src').length === 4);
    cek('3 kartu subtes dirender', d.querySelectorAll('#subtesGrid .card').length === 3);
    cek('tabel ambang batas 4 baris', d.querySelectorAll('#tabelAmbangBatas tr').length === 4,
      d.querySelectorAll('#tabelAmbangBatas tr').length);

    cek('aria-busy dibersihkan setelah render',
      ['subtesGrid', 'materiPanels', 'sumberResmi', 'sumberTambahan', 'quizList']
        .every((id) => !d.getElementById(id).hasAttribute('aria-busy')));

    cek('id topik lama dipertahankan',
      !!d.querySelector('[data-materi-id="twk-nasionalisme"]') &&
      !!d.querySelector('[data-materi-id="tkp-radikalisme"]'));

    cek('tidak ada console.error', dom.galatKonsol.length === 0, dom.galatKonsol.join(' | '));

    /* -------------------------------------------------------- angka turunan */
    const stat = (k) => (d.querySelector('[data-stat="' + k + '"]') || {}).textContent;
    cek('data-stat totalSoal = 18', stat('totalSoal') === '18', stat('totalSoal'));
    cek('data-stat totalTopik = 16', stat('totalTopik') === '16', stat('totalTopik'));
    cek('data-stat skdSoal = 110', stat('skdSoal') === '110', stat('skdSoal'));
    cek('data-stat skdMenit = 100', stat('skdMenit') === '100', stat('skdMenit'));
    cek('data-stat skorMaks = 550', stat('skorMaks') === '550', stat('skorMaks'));
    cek('data-stat detikPerSoal = 54', stat('detikPerSoal') === '54', stat('detikPerSoal'));
    cek('data-stat totalSubtes = 3', stat('totalSubtes') === '3', stat('totalSubtes'));
    cek('data-stat topikTWK = 5', stat('topikTWK') === '5', stat('topikTWK'));
    cek('data-stat topikTKP = 6', stat('topikTKP') === '6', stat('topikTKP'));

    const total = d.querySelector('#tabelAmbangBatas tr:last-child');
    cek('baris Total: 110 / 550 / 350–395',
      total.children[1].textContent === '110' &&
      total.children[3].textContent === '550' &&
      total.children[5].textContent === '350\u2013395',
      [...total.children].map((c) => c.textContent).join('|'));

    const twkCard = d.querySelector('#subtesGrid .card');
    cek('kartu TWK: 30 / 65 / 150',
      [...twkCard.querySelectorAll('.stat-val')].map((n) => n.textContent).join(',') === '30,65,150');
    cek('cakupan memakai <b>', !!twkCard.querySelector('.cakupan li b'));

    /* ------------------------------------------------------------- router */
    const navMateri = d.querySelector('[data-nav="materi"]');
    klik(dom.window, navMateri);
    await tunggu(30);
    cek('klik nav Materi pindah halaman', d.querySelector('.page[data-page="materi"]').classList.contains('active'));
    cek('hash berubah', dom.window.location.hash === '#/materi', dom.window.location.hash);
    cek('nav aktif ditandai', navMateri.classList.contains('active'));
    cek('title jadi judul Materi', d.title === 'Materi — SKD Notes', d.title);
    cek('halaman lama disembunyikan', !d.querySelector('.page[data-page="beranda"]').classList.contains('active'));

    dom.window.history.back();
    await tunggu(30);
    cek('tombol back kembali ke beranda',
      d.querySelector('.page[data-page="beranda"]').classList.contains('active'));

    dom.window.location.hash = '#/tidak-ada';
    await tunggu(30);
    cek('hash tak dikenal fallback ke beranda',
      d.querySelector('.page[data-page="beranda"]').classList.contains('active'));

    /* --------------------------------------------------------------- kuis */
    dom.window.location.hash = '#/latihan';
    await tunggu(30);

    const first = items[0];
    const salah = first.querySelector('[data-opt]:not([data-correct])');
    klik(dom.window, salah);
    cek('jawaban salah menandai .wrong', salah.classList.contains('wrong'));
    cek('kunci ditampilkan', first.querySelector('[data-opt][data-correct]').classList.contains('correct'));
    cek('skor salah = 1', d.getElementById('qWrong').textContent === '1');
    cek('dikerjakan = 1', d.getElementById('qDone').textContent === '1');
    cek('pembahasan terbuka otomatis', first.querySelector('.q-explain').classList.contains('open'));
    cek('semua opsi nonaktif', [...first.querySelectorAll('[data-opt]')].every((o) => o.disabled));
    cek('aria-expanded true', first.querySelector('.q-toggle').getAttribute('aria-expanded') === 'true');
    cek('aria-controls terisi', !!first.querySelector('.q-toggle').getAttribute('aria-controls'));

    const second = items[1];
    klik(dom.window, second.querySelector('[data-opt][data-correct]'));
    cek('jawaban benar menambah skor benar', d.getElementById('qCorrect').textContent === '1');
    cek('dikerjakan = 2', d.getElementById('qDone').textContent === '2');

    klik(dom.window, d.getElementById('qReset'));
    cek('reset mengosongkan skor', d.getElementById('qDone').textContent === '0');
    cek('reset mengaktifkan opsi', !first.querySelector('[data-opt]').disabled);
    cek('reset membersihkan kelas', first.querySelectorAll('.correct,.wrong').length === 0);
    cek('reset menutup pembahasan', !first.querySelector('.q-explain').classList.contains('open'));

    const filterBtns = [...d.querySelectorAll('.qf-btn')];
    cek('filter: Semua (18)', filterBtns[0].textContent === 'Semua (18)', filterBtns[0].textContent);
    cek('filter: TWK (6)', filterBtns[1].textContent === 'TWK (6)', filterBtns[1].textContent);

    klik(dom.window, filterBtns[3]);
    const tampil = items.filter((q) => q.style.display !== 'none');
    cek('filter TKP menyisakan 6 soal', tampil.length === 6, tampil.length);
    cek('semua yang tampil bertipe tkp', tampil.every((q) => q.getAttribute('data-subtes') === 'tkp'));
    klik(dom.window, filterBtns[0]);
    cek('filter Semua mengembalikan 18', items.filter((q) => q.style.display !== 'none').length === 18);

    cek('baris jawaban TKP tanpa teks panjang',
      /^Jawaban terbaik: [A-E]\.$/.test(items[12].querySelector('.q-explain b').textContent),
      items[12].querySelector('.q-explain b').textContent);
    cek('baris jawaban TWK memuat teks opsi',
      /^Jawaban: [A-E]\. .+\.$/.test(first.querySelector('.q-explain b').textContent),
      first.querySelector('.q-explain b').textContent);

    /* -------------------------------------------------------------- timer */
    const tgl = d.getElementById('timerToggle');
    const disp = d.getElementById('timerDisplay');
    const note = d.getElementById('timerNote');

    cek('timer awal 100:00', disp.textContent === '100:00', disp.textContent);
    klik(dom.window, tgl);
    cek('mulai -> Jeda', tgl.textContent === 'Jeda', tgl.textContent);
    cek('pill timer muncul', d.getElementById('navTimer').classList.contains('show'));

    const jamAsli = dom.window.Date.now.bind(dom.window.Date);
    let geser = 0;
    dom.window.Date.now = () => jamAsli() + geser;

    geser = 61000;
    d.dispatchEvent(new dom.window.Event('visibilitychange'));
    const keDetik = (t) => {
      const [a, b] = t.split(':').map(Number);
      return a * 60 + b;
    };
    cek('timer mengikuti jam nyata', Math.abs(keDetik(disp.textContent) - 5939) <= 1, disp.textContent);
    cek('pill timer sinkron', d.getElementById('navTimerText').textContent === disp.textContent);

    geser = 6000 * 1000;
    d.dispatchEvent(new dom.window.Event('visibilitychange'));
    cek('waktu habis -> 00:00', disp.textContent === '00:00', disp.textContent);
    cek('pesan waktu habis muncul', /Waktu habis/.test(note.textContent), note.textContent);
    cek('pill ditandai done', d.getElementById('navTimer').classList.contains('done'));
    cek('tombol jadi Mulai ulang', tgl.textContent === 'Mulai ulang', tgl.textContent);

    klik(dom.window, tgl);
    cek('klik setelah habis memulai sesi baru', disp.textContent === '100:00', disp.textContent);

    klik(dom.window, d.getElementById('timerReset'));
    cek('reset timer -> 100:00', disp.textContent === '100:00', disp.textContent);
    cek('catatan timer dibersihkan', note.textContent === '');
    dom.window.Date.now = jamAsli;

    /* ------------------------------------------------------------- materi */
    const tabTkp = d.querySelector('.me-tab[data-tab="tkp"]');
    klik(dom.window, tabTkp);
    cek('tab TKP aktif', d.querySelector('.me-panel[data-panel="tkp"]').classList.contains('active'));
    cek('aria-selected pindah', tabTkp.getAttribute('aria-selected') === 'true');

    const accTkp = d.querySelector('.me-panel[data-panel="tkp"] .acc');
    klik(dom.window, accTkp.querySelector('.acc-head'));
    cek('akordeon terbuka', accTkp.classList.contains('open'));
    klik(dom.window, accTkp.querySelector('.mark-btn'));
    cek('tandai dipelajari -> done', accTkp.classList.contains('done'));
    cek('progres tersimpan di localStorage',
      JSON.parse(dom.window.localStorage.getItem('skdnotes.materi.done.v1'))['tkp-pelayanan'] === true);

    const cari = d.getElementById('meSearch');
    cari.value = 'radikal';
    cari.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    cek('pencarian menyaring topik',
      [...d.querySelectorAll('.me-panel[data-panel="tkp"] .acc')].filter((a) => a.style.display !== 'none').length === 1);

    cari.value = 'zzzz';
    cari.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    cek('pencarian kosong memunculkan pesan',
      d.querySelector('.me-panel[data-panel="tkp"] .me-empty').style.display === 'block');

    cari.value = '';
    cari.dispatchEvent(new dom.window.Event('input', { bubbles: true }));

    const expand = d.querySelector('.me-expand');
    klik(dom.window, expand);
    cek('Buka semua membuka topik', expand.textContent === 'Tutup semua', expand.textContent);

    /* ------------------------------------------------------------- sumber */
    const srcResmi = d.querySelector('#sumberResmi .src');
    cek('sumber resmi memakai https', srcResmi.href.startsWith('https://'), srcResmi.href);
    cek('sumber resmi domain go.id', /\.go\.id/.test(srcResmi.href), srcResmi.href);
    cek('tautan eksternal punya rel noopener',
      srcResmi.getAttribute('rel') === 'noopener noreferrer');

    cek('semua tautan https',
      [...d.querySelectorAll('.src')].every((a) => a.href.startsWith('https://')));
    cek('judul kartu sumber terisi', d.querySelector('#sumberResmi .src-body h4').textContent.length > 5);

    /* Hentikan kedip judul dari uji timer agar tidak menimpa judul halaman. */
    dom.window.SKD.timer.hentikanKedip();

    dom.window.close();
  }

  /* ------------------------------------------------- state pemuatan gagal */
  {
    const dom = buka(BASE, (win) => {
      const asli = win.fetch;
      win.fetch = (url, opsi) =>
        String(url).indexOf('konfigurasi.json') !== -1
          ? Promise.reject(new Error('simulasi offline'))
          : asli(url, opsi);
    }, HTML);
    await tungguSiap(dom);
    const d = dom.window.document;
    const box = d.getElementById('galat');

    cek('kegagalan fetch menampilkan pesan', box.hidden === false);
    cek('pesan menyebut cara memulihkan', /Coba lagi/.test(box.textContent), box.textContent.slice(0, 80));
    cek('aria-busy tetap dibersihkan saat gagal',
      ['subtesGrid', 'quizList'].every((id) => !d.getElementById(id).hasAttribute('aria-busy')));
    dom.window.close();
  }

  /* --------------------------------------------- guard protokol file:// */
  {
    const htmlFile = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const dom = new JSDOM(htmlFile, {
      url: 'file:///' + ROOT.replace(/\\/g, '/') + '/index.html',
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true,
      virtualConsole: new VirtualConsole(),
      beforeParse(win) {
        win.fetch = () => Promise.reject(new Error('fetch diblokir di file://'));
      }
    });
    await tunggu(1200);
    const d = dom.window.document;
    const box = d.getElementById('galat');
    cek('file:// ditolak dengan pesan jelas', box && box.hidden === false);
    cek('pesan file:// menyebut npm run serve', /npm run serve/.test(box ? box.textContent : ''),
      (box ? box.textContent : '').slice(0, 90));
    dom.window.close();
  }
} finally {
  server.close();
}

/* ------------------------------------------------------------- laporan */

console.log('\n' + lulus + ' cek lolos');
if (gagal.length) {
  console.log(gagal.length + ' gagal:');
  for (const g of gagal) console.log('  x ' + g);
  process.exit(1);
}
console.log('Semua tes lolos.');
