/**
 * ekstrak.mjs — sekali pakai.
 *
 * Membaca index.html lalu menuliskan seluruh konten terstruktur ke data/*.json.
 * Tujuannya mekanis: tidak ada teks yang diketik ulang, sehingga tidak ada
 * risiko salah salin. Setelah data/ terbentuk, skrip ini tidak dijalankan lagi
 * kecuali index.html versi lama perlu dipanen ulang.
 */

import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'index.html');
const DATA = path.join(ROOT, 'data');

const SUBTES = ['twk', 'tiu', 'tkp'];
const KODE = { twk: 'TWK', tiu: 'TIU', tkp: 'TKP' };

/* ------------------------------------------------------------------ util */

const rapikan = (s) => (s || '').replace(/\s+/g, ' ').trim();

/** Serialisasi inline: <b> -> **teks**, <em> -> *teks*, sisanya teks biasa. */
function inline(node) {
  let out = '';
  for (const n of node.childNodes) {
    if (n.nodeType === 3) out += n.textContent;
    else if (n.nodeName === 'B' || n.nodeName === 'STRONG') out += `**${rapikan(n.textContent)}**`;
    else if (n.nodeName === 'I' || n.nodeName === 'EM') out += `*${rapikan(n.textContent)}*`;
    else out += inline(n);
  }
  return rapikan(out);
}

function tulis(relatif, isi) {
  const tujuan = path.join(DATA, relatif);
  fs.mkdirSync(path.dirname(tujuan), { recursive: true });
  fs.writeFileSync(tujuan, JSON.stringify(isi, null, 2) + '\n', 'utf8');
  const ukuran = fs.statSync(tujuan).size;
  console.log(`  tulis  data/${relatif.replace(/\\/g, '/')}  (${ukuran} B)`);
}

/* ------------------------------------------------------------------ baca */

const html = fs.readFileSync(SRC, 'utf8');
const { document: doc } = new JSDOM(html).window;

/* Skrip ini hanya untuk migrasi awal: memanen markup statis dari index.html
   versi lama. Setelah index.html menjadi kerangka kosong, tidak ada lagi yang
   bisa dipanen — hentikan dengan pesan jelas alih-alih menulis data kosong. */
if (doc.querySelectorAll('.acc[data-materi-id]').length === 0) {
  console.error(
    'index.html tidak lagi berisi markup statis materi.\n' +
    'scripts/ekstrak.mjs hanya dipakai sekali saat migrasi awal.\n' +
    'Untuk mengubah konten, sunting data/*.json lalu jalankan: npm run validasi'
  );
  process.exit(1);
}

const masalah = [];
const catat = (pesan) => masalah.push(pesan);

/* ------------------------------------------------- konfigurasi: subtes */

const kartu = [...doc.querySelectorAll('.grid-3 .card')];
if (kartu.length !== 3) catat(`kartu subtes: harap 3, dapat ${kartu.length}`);

const barisTabel = new Map();
for (const tr of doc.querySelectorAll('[data-page="materi"] .table-wrap tbody tr')) {
  const sel = [...tr.children].map((td) => rapikan(td.textContent));
  if (sel[0]) barisTabel.set(sel[0], sel);
}

const subtes = kartu.map((card, i) => {
  const key = SUBTES[i];
  const kode = rapikan(card.querySelector('.card-kode')?.textContent);
  if (kode !== KODE[key]) catat(`urutan kartu: indeks ${i} berisi ${kode}, harap ${KODE[key]}`);

  const angka = [...card.querySelectorAll('.stat-row .stat')].map((s) => ({
    nilai: Number(rapikan(s.querySelector('.stat-val')?.textContent)),
    label: rapikan(s.querySelector('.stat-lbl')?.textContent).toLowerCase()
  }));
  const ambil = (label) => angka.find((a) => a.label === label)?.nilai;

  const baris = barisTabel.get(kode) || [];
  const targetAman = baris[5] || null;

  return {
    kode,
    subtes: key,
    nama: rapikan(card.querySelector('h3')?.textContent),
    subjudul: rapikan(card.querySelector('.card-sub')?.textContent),
    soal: ambil('soal'),
    passing: ambil('passing'),
    maks: ambil('maks'),
    nilaiPerSoal: baris[2] || null,
    targetAman,
    cakupan: [...card.querySelectorAll('.cakupan li')].map(inline)
  };
});

for (const s of subtes) {
  if (!s.soal || !s.passing || !s.maks) catat(`subtes ${s.kode}: angka soal/passing/maks tidak lengkap`);
  if (!s.nilaiPerSoal) catat(`subtes ${s.kode}: nilaiPerSoal tidak ditemukan di tabel`);
  if (!s.targetAman) catat(`subtes ${s.kode}: targetAman tidak ditemukan di tabel`);
}

const strip = [...doc.querySelectorAll('.stat-strip > div b')].map((b) => Number(rapikan(b.textContent)));
const [, skdSoal, skdMenit, skdSkorMaks] = strip;

const konfigurasi = {
  tahun: 2024,
  regulasi: {
    nama: 'KepmenPANRB No. 321 Tahun 2024',
    url: 'https://www.bkn.go.id/regulasi/keputusan-menteri-pendayagunaan-aparatur-negara-dan-reformasi-birokrasi-republik-indonesia-nomor-321-tahun-2024/'
  },
  skd: { soal: skdSoal, menit: skdMenit, skorMaks: skdSkorMaks },
  subtes,
  jalurKhusus: [
    { label: 'Cumlaude/diaspora', kumulatif: 311, tiu: 85 },
    { label: 'Disabilitas, putra/putri Papua, dan putra/putri daerah tertinggal', kumulatif: 286, tiu: 60 }
  ]
};

/* ------------------------------------------------------ konfigurasi: cek */

const totalSoalSubtes = subtes.reduce((n, s) => n + (s.soal || 0), 0);
if (totalSoalSubtes !== skdSoal) {
  catat(`jumlah soal subtes (${totalSoalSubtes}) tidak sama dengan strip (${skdSoal})`);
}
const totalMaks = subtes.reduce((n, s) => n + (s.maks || 0), 0);
if (totalMaks !== skdSkorMaks) {
  catat(`jumlah skor maks subtes (${totalMaks}) tidak sama dengan strip (${skdSkorMaks})`);
}

/* --------------------------------------------------------------- sumber */

const blokSumber = [...doc.querySelectorAll('[data-page="bankdata"] .src-list')];
if (blokSumber.length !== 2) catat(`blok sumber: harap 2, dapat ${blokSumber.length}`);

const sumber = { resmi: [], tambahan: [] };
blokSumber.forEach((blok, i) => {
  const kategori = i === 0 ? 'resmi' : 'tambahan';
  [...blok.querySelectorAll('a.src')].forEach((a, j) => {
    sumber[kategori].push({
      id: `${kategori}-${String(j + 1).padStart(2, '0')}`,
      ikon: rapikan(a.querySelector('.src-ic')?.textContent),
      judul: rapikan(a.querySelector('.src-body h4')?.textContent),
      deskripsi: rapikan(a.querySelector('.src-body p')?.textContent),
      tag: rapikan(a.querySelector('.src-tag')?.textContent),
      url: a.getAttribute('href')
    });
  });
});

/* --------------------------------------------------------------- materi */

const materi = {};
for (const key of SUBTES) {
  const panel = doc.querySelector(`.me-panel[data-panel="${key}"]`);
  if (!panel) { catat(`panel materi ${key} tidak ditemukan`); continue; }

  const topik = [...panel.querySelectorAll('.acc')].map((acc) => {
    const id = acc.getAttribute('data-materi-id');
    if (!id) catat(`materi ${key}: ada topik tanpa data-materi-id`);

    const titleEl = acc.querySelector('.acc-title');
    let judul = '';
    for (const n of titleEl?.childNodes || []) {
      if (n.nodeType === 3) judul += n.textContent;
    }

    const body = acc.querySelector('.acc-body');
    const catatanEl = body?.querySelector('.acc-note');
    const item = {
      id,
      nomor: Number(rapikan(acc.querySelector('.acc-num')?.textContent)),
      judul: rapikan(judul),
      subjudul: rapikan(titleEl?.querySelector('em')?.textContent),
      ringkasan: rapikan(body?.querySelector('p')?.textContent)
    };

    const flag = rapikan(acc.querySelector('.acc-flag')?.textContent);
    if (flag) item.flag = flag;

    const poinJudul = rapikan(body?.querySelector('h5')?.textContent);
    if (poinJudul) item.poinJudul = poinJudul;

    const poin = [...(body?.querySelectorAll('.kp li') || [])].map(inline);
    if (poin.length) item.poin = poin;

    if (catatanEl) item.catatan = rapikan(catatanEl.textContent);

    if (!item.id || !item.judul || !item.ringkasan) {
      catat(`materi ${key}: topik "${id}" tidak lengkap`);
    }
    return item;
  });

  materi[key] = { subtes: key, label: KODE[key], topik };
}

/* ----------------------------------------------------------------- soal */

const soal = {};
const selisihJawaban = [];

for (const key of SUBTES) {
  const daftar = [...doc.querySelectorAll(`[data-quiz][data-subtes="${key}"]`)];

  const items = daftar.map((item, idx) => {
    const id = `${key}-${String(idx + 1).padStart(2, '0')}`;
    const opts = [...item.querySelectorAll('[data-opt]')];

    const opsi = opts.map((o, i) => {
      const mentah = rapikan(o.textContent);
      const bersih = mentah.replace(/^[A-E]\.\s*/, '');
      const entri = { kode: String.fromCharCode(65 + i), teks: bersih };
      if (o.hasAttribute('data-correct')) entri.benar = true;
      return entri;
    });

    const benar = opsi.filter((o) => o.benar);
    if (benar.length !== 1) catat(`soal ${id}: kunci jawaban ${benar.length}, harap 1`);
    if (opsi.length !== 5) catat(`soal ${id}: ${opsi.length} opsi, harap 5`);

    const explain = item.querySelector('.q-explain');
    const b = explain?.querySelector('b');
    const teksJawabanHtml = rapikan(b?.textContent);

    const salinan = explain?.cloneNode(true);
    salinan?.querySelector('b')?.remove();
    const pembahasan = rapikan(salinan?.textContent);
    if (!pembahasan) catat(`soal ${id}: pembahasan kosong`);

    /* Bandingkan baris jawaban di HTML dengan hasil turunan, supaya selisih
       teks (jika ada) tercatat, bukan hilang diam-diam. */
    const label = /^Jawaban terbaik/.test(teksJawabanHtml) ? 'Jawaban terbaik' : 'Jawaban';
    const turunan = benar.length === 1
      ? `${label}: ${benar[0].kode}. ${benar[0].teks}.`
      : '(tidak dapat diturunkan)';
    if (teksJawabanHtml && teksJawabanHtml !== turunan) {
      selisihJawaban.push({ id, html: teksJawabanHtml, turunan });
    }

    return {
      id,
      teks: rapikan(item.querySelector('.q-text')?.textContent),
      opsi,
      pembahasan
    };
  });

  soal[key] = { subtes: key, label: KODE[key], soal: items };
}

/* ---------------------------------------------------------------- tulis */

console.log('Menulis data:');
tulis('konfigurasi.json', konfigurasi);
tulis('sumber.json', sumber);
for (const key of SUBTES) tulis(path.join('materi', `${key}.json`), materi[key]);
for (const key of SUBTES) tulis(path.join('soal', `${key}.json`), soal[key]);

/* -------------------------------------------------------------- laporan */

const nTopik = SUBTES.reduce((n, k) => n + (materi[k]?.topik.length || 0), 0);
const nSoal = SUBTES.reduce((n, k) => n + (soal[k]?.soal.length || 0), 0);
const nOpsi = SUBTES.reduce((n, k) => n + (soal[k]?.soal || []).reduce((m, s) => m + s.opsi.length, 0), 0);
const nSumber = sumber.resmi.length + sumber.tambahan.length;

console.log('\nRingkasan:');
console.log(`  topik materi : ${nTopik}`);
console.log(`  soal         : ${nSoal}`);
console.log(`  opsi         : ${nOpsi}`);
console.log(`  sumber       : ${nSumber} (${sumber.resmi.length} resmi + ${sumber.tambahan.length} tambahan)`);
console.log(`  subtes       : ${subtes.length}`);

if (selisihJawaban.length) {
  console.log('\nSelisih baris jawaban HTML vs turunan (akan berubah saat render):');
  for (const s of selisihJawaban) {
    console.log(`  ${s.id}`);
    console.log(`    html    : ${s.html}`);
    console.log(`    turunan : ${s.turunan}`);
  }
}

if (masalah.length) {
  console.log('\nMASALAH:');
  for (const m of masalah) console.log('  - ' + m);
  process.exitCode = 1;
} else {
  console.log('\nTidak ada masalah.');
}
