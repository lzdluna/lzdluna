/**
 * uji-responsif.mjs — lapisan kedua: mengukur di browser sungguhan.
 *
 * scripts/cek-responsif.mjs hanya membuktikan aturan @media ADA. Skrip ini
 * memuat halaman di Chromium pada lima lebar layar dan mengukur hal yang tidak
 * bisa diketahui jsdom: apakah ada konten terpotong, seberapa tinggi navbar
 * sticky, apakah target sentuh cukup besar, dan apakah tabel benar-benar bisa
 * digeser.
 *
 * Tangkapan layar disimpan di scripts/out/ (di-gitignore) untuk ditinjau
 * manusia.
 */

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { buatServer } from './serve.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'scripts', 'out');

const LEBAR = [
  { w: 320, h: 640, sentuh: true, nama: '320' },
  { w: 360, h: 740, sentuh: true, nama: '360' },
  { w: 390, h: 844, sentuh: true, nama: '390' },
  { w: 768, h: 1024, sentuh: true, nama: '768' },
  { w: 1024, h: 768, sentuh: false, nama: '1024' }
];

const HALAMAN = ['beranda', 'materi', 'bankdata', 'simulasi', 'strategi', 'latihan', 'catatan'];

let lulus = 0;
const gagal = [];
const cek = (label, kondisi, info) => {
  if (kondisi) lulus++;
  else gagal.push(label + (info !== undefined ? '  [' + info + ']' : ''));
};

const server = buatServer(ROOT);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

try {
  for (const vp of LEBAR) {
    const context = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      hasTouch: vp.sentuh,
      isMobile: vp.sentuh,
      deviceScaleFactor: 1
    });
    const page = await context.newPage();

    await page.goto(BASE + '/', { waitUntil: 'load' });
    /* Tunggu data selesai dirender. */
    await page.waitForFunction(() => {
      const l = document.getElementById('quizList');
      return l && l.children.length > 0 && !l.hasAttribute('aria-busy');
    }, null, { timeout: 15000 });

    /* ---------------------------------------------- navbar sticky */
    const nav = await page.evaluate(() => {
      const card = document.querySelector('.nav-card');
      const r = card.getBoundingClientRect();
      return { tinggi: Math.round(r.height), lebar: Math.round(r.width), kanan: Math.round(r.right) };
    });

    /* Ambang lipat mengikuti CSS: menu collapse di bawah 860px. */
    if (vp.w < 860) {
      cek(vp.nama + ': navbar tertutup <= 80px', nav.tinggi <= 80, nav.tinggi + 'px');
    } else {
      cek(vp.nama + ': navbar desktop wajar', nav.tinggi <= 90, nav.tinggi + 'px');
    }

    /* ------------------------------------------------ menu lipat */
    if (vp.w < 860) {
      const terlihatAwal = await page.locator('#navLinks').isVisible();
      cek(vp.nama + ': menu tertutup saat muat', !terlihatAwal);

      await page.click('#navToggle');
      await page.waitForTimeout(120);
      const terbuka = await page.locator('#navLinks').isVisible();
      cek(vp.nama + ': menu terbuka setelah diklik', terbuka);

      const tautanTampil = await page.locator('#navLinks a').first().isVisible();
      cek(vp.nama + ': tautan terlihat saat menu terbuka', tautanTampil);

      const ukuranToggle = await page.evaluate(() => {
        const r = document.getElementById('navToggle').getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      });
      cek(vp.nama + ': target sentuh menu >= 44px', ukuranToggle.h >= 44, ukuranToggle.h + 'px');

      await page.keyboard.press('Escape');
      await page.waitForTimeout(120);
      const tertutupLagi = await page.locator('#navLinks').isVisible();
      cek(vp.nama + ': Esc menutup menu', !tertutupLagi);

      const fokus = await page.evaluate(() => document.activeElement && document.activeElement.id);
      cek(vp.nama + ': fokus kembali ke tombol menu', fokus === 'navToggle', fokus);
    } else {
      const tautanTampil = await page.locator('#navLinks a').first().isVisible();
      cek(vp.nama + ': menu tampil penuh di desktop', tautanTampil);
      const toggleTersembunyi = await page.locator('#navToggle').isVisible();
      cek(vp.nama + ': tombol menu disembunyikan di desktop', !toggleTersembunyi);
    }

    /* ------------------------------- tiap halaman: tidak terpotong */
    for (const nama of HALAMAN) {
      await page.evaluate((n) => { location.hash = '#/' + n; }, nama);
      await page.waitForFunction(
        (n) => {
          const p = document.querySelector('.page[data-page="' + n + '"]');
          return p && p.classList.contains('active');
        },
        nama,
        { timeout: 5000 }
      );
      await page.waitForTimeout(120);

      const ukur = await page.evaluate(() => {
        const vw = window.innerWidth;
        const kandidat = ['.nav-card', '.hero-title', '.jump', '.timer-box', '.table-wrap', '.foot',
          '.card', '.src', '.q-item', '.quiz-bar', '.me', '.strategy-card'];
        const meluber = [];

        for (const sel of kandidat) {
          for (const el of document.querySelectorAll(sel)) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) continue;
            /* Toleransi 6px untuk kartu yang diputar sedikit
               (transform rotate) — itu bukan konten terpotong. */
            if (r.right > vw + 6 || r.left < -6) {
              meluber.push(sel + ' (' + Math.round(r.left) + '..' + Math.round(r.right) + ')');
            }
          }
        }

        return {
          scrollWidth: document.documentElement.scrollWidth,
          vw,
          meluber: [...new Set(meluber)].slice(0, 4)
        };
      });

      cek(vp.nama + ' / ' + nama + ': tanpa scroll horizontal', ukur.scrollWidth <= ukur.vw + 1,
        ukur.scrollWidth + ' vs ' + ukur.vw);
      cek(vp.nama + ' / ' + nama + ': tidak ada elemen keluar layar', ukur.meluber.length === 0,
        ukur.meluber.join(', '));
    }

    /* ------------------------------------------------- timer muat */
    await page.evaluate(() => { location.hash = '#/simulasi'; });
    await page.waitForTimeout(150);
    const timer = await page.evaluate(() => {
      const box = document.querySelector('.timer-box').getBoundingClientRect();
      const disp = document.getElementById('timerDisplay').getBoundingClientRect();
      return {
        boxKanan: Math.round(box.right),
        dispKanan: Math.round(disp.right),
        dispLebar: Math.round(disp.width),
        vw: window.innerWidth
      };
    });
    cek(vp.nama + ': timer tidak keluar kartu', timer.dispKanan <= timer.boxKanan + 1,
      timer.dispKanan + ' vs ' + timer.boxKanan);
    cek(vp.nama + ': angka timer punya lebar', timer.dispLebar >= 60, timer.dispLebar + 'px');

    /* --------------------------------------------- tabel bisa digeser */
    await page.evaluate(() => { location.hash = '#/materi'; });
    await page.waitForTimeout(150);
    const tabel = await page.evaluate(() => {
      const wrap = document.querySelector('.table-wrap');
      const th = wrap.querySelector('th');
      const cs = getComputedStyle(th);
      return {
        scrollWidth: wrap.scrollWidth,
        clientWidth: wrap.clientWidth,
        posisi: cs.position,
        hint: getComputedStyle(document.querySelector('.table-hint')).display
      };
    });
    if (vp.w <= 600) {
      cek(vp.nama + ': tabel bisa digeser', tabel.scrollWidth > tabel.clientWidth + 1,
        tabel.scrollWidth + ' vs ' + tabel.clientWidth);
      cek(vp.nama + ': kolom pertama menempel', tabel.posisi === 'sticky', tabel.posisi);
      cek(vp.nama + ': petunjuk geser tampil', tabel.hint !== 'none', tabel.hint);
    } else {
      cek(vp.nama + ': petunjuk geser disembunyikan', tabel.hint === 'none', tabel.hint);
    }

    /* ---------------------------------------- target sentuh perangkat sentuh */
    if (vp.sentuh && vp.w <= 600) {
      const target = await page.evaluate(() => {
        const hasil = {};
        for (const sel of ['#navToggle', '.qf-btn', '.t-btn', '.q-opt', '.mark-btn']) {
          const el = document.querySelector(sel);
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (r.width || r.height) hasil[sel] = Math.round(r.height);
        }
        return hasil;
      });
      const kecil = Object.entries(target).filter(([, h]) => h < 44);
      cek(vp.nama + ': semua target sentuh >= 44px', kecil.length === 0,
        kecil.map(([s, h]) => s + '=' + h + 'px').join(', '));
    }

    /* ------------------------------------------------ tangkapan layar */
    for (const nama of ['beranda', 'materi', 'latihan']) {
      await page.evaluate((n) => { location.hash = '#/' + n; }, nama);
      await page.waitForTimeout(200);
      await page.screenshot({
        path: path.join(OUT, vp.nama + '-' + nama + '.png'),
        fullPage: true
      });
    }

    await context.close();
    console.log('selesai lebar ' + vp.nama + 'px');
  }
} finally {
  await browser.close();
  server.close();
}

console.log('');
console.log(lulus + ' cek lolos');
if (gagal.length) {
  console.log(gagal.length + ' gagal:');
  for (const g of gagal) console.log('  x ' + g);
  process.exit(1);
}
console.log('Tangkapan layar: scripts/out/');
console.log('Responsif aman di semua lebar uji.');