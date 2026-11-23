/**
 * validasi.mjs — memeriksa data/*.json sebelum di-deploy.
 *
 * Dijalankan manual (`npm run validasi`) dan di CI pada setiap push.
 * Gagal = exit code 1, sehingga push dengan data rusak tidak lolos.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA = path.join(ROOT, 'data');

const SUBTES = ['twk', 'tiu', 'tkp'];
const KODE = { twk: 'TWK', tiu: 'TIU', tkp: 'TKP' };

const galat = [];
const ingat = [];

const gagal = (pesan) => galat.push(pesan);
const info = (pesan) => ingat.push(pesan);

function baca(relatif) {
  const file = path.join(DATA, relatif);
  if (!fs.existsSync(file)) {
    gagal(`data/${relatif}: file tidak ada`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    gagal(`data/${relatif}: JSON tidak valid — ${e.message}`);
    return null;
  }
}

const teks = (v) => typeof v === 'string' && v.trim().length > 0;
const angka = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

/** Penanda **tebal** harus berpasangan; jika tidak, parser akan menghasilkan teks aneh. */
function cekMarkup(nilai, jalur) {
  if (typeof nilai !== 'string') return;
  const jumlah = (nilai.match(/\*\*/g) || []).length;
  if (jumlah % 2 !== 0) gagal(`${jalur}: penanda **tebal** tidak berpasangan`);
}

/* ------------------------------------------------------------ konfigurasi */

const konfigurasi = baca('konfigurasi.json');
let skdSoal = 0;

if (konfigurasi) {
  const { tahun, regulasi, skd, subtes, jalurKhusus } = konfigurasi;

  if (!angka(tahun)) gagal('konfigurasi.tahun: harus angka tahun');
  if (!regulasi || !teks(regulasi.nama) || !teks(regulasi.url)) {
    gagal('konfigurasi.regulasi: nama dan url wajib diisi');
  } else if (!/^https:\/\//.test(regulasi.url)) {
    gagal('konfigurasi.regulasi.url: wajib https');
  }

  if (!skd || !angka(skd.soal) || !angka(skd.menit) || !angka(skd.skorMaks)) {
    gagal('konfigurasi.skd: soal, menit, skorMaks wajib angka positif');
  } else {
    skdSoal = skd.soal;
    if (skd.soal !== 110) info(`skd.soal = ${skd.soal} (formasi SKD lazimnya 110)`);
    if (skd.skorMaks !== skd.soal * 5) {
      gagal(`skd.skorMaks (${skd.skorMaks}) seharusnya soal x 5 = ${skd.soal * 5}`);
    }
  }

  if (!Array.isArray(subtes) || subtes.length !== 3) {
    gagal('konfigurasi.subtes: harus berisi 3 subtes');
  } else {
    subtes.forEach((s, i) => {
      const jalur = `konfigurasi.subtes[${i}]`;
      if (s.kode !== KODE[SUBTES[i]]) gagal(`${jalur}.kode: harap ${KODE[SUBTES[i]]}, dapat ${s.kode}`);
      if (s.subtes !== SUBTES[i]) gagal(`${jalur}.subtes: harap ${SUBTES[i]}, dapat ${s.subtes}`);
      ['nama', 'subjudul', 'nilaiPerSoal', 'targetAman'].forEach((k) => {
        if (!teks(s[k])) gagal(`${jalur}.${k}: wajib teks`);
      });
      ['soal', 'passing', 'maks'].forEach((k) => {
        if (!angka(s[k])) gagal(`${jalur}.${k}: wajib angka positif`);
      });
      if (!Array.isArray(s.cakupan) || s.cakupan.length === 0) {
        gagal(`${jalur}.cakupan: wajib berisi minimal satu butir`);
      } else {
        s.cakupan.forEach((c, j) => cekMarkup(c, `${jalur}.cakupan[${j}]`));
      }
      if (angka(s.passing) && angka(s.maks) && s.passing > s.maks) {
        gagal(`${jalur}.passing (${s.passing}) melebihi maks (${s.maks})`);
      }
    });

    const jumlahSoal = subtes.reduce((n, s) => n + (s.soal || 0), 0);
    const jumlahMaks = subtes.reduce((n, s) => n + (s.maks || 0), 0);
    if (skd && jumlahSoal !== skd.soal) {
      gagal(`jumlah soal subtes (${jumlahSoal}) != skd.soal (${skd.soal})`);
    }
    if (skd && jumlahMaks !== skd.skorMaks) {
      gagal(`jumlah maks subtes (${jumlahMaks}) != skd.skorMaks (${skd.skorMaks})`);
    }
    subtes.forEach((s) => {
      if (angka(s.maks) && angka(s.soal) && s.maks !== s.soal * 5) {
        gagal(`subtes ${s.kode}: maks (${s.maks}) seharusnya soal x 5 = ${s.soal * 5}`);
      }
    });
  }

  if (!Array.isArray(jalurKhusus) || jalurKhusus.length === 0) {
    gagal('konfigurasi.jalurKhusus: wajib berisi minimal satu jalur');
  } else {
    jalurKhusus.forEach((j, i) => {
      const jalur = `konfigurasi.jalurKhusus[${i}]`;
      if (!teks(j.label)) gagal(`${jalur}.label: wajib teks`);
      if (!angka(j.kumulatif)) gagal(`${jalur}.kumulatif: wajib angka positif`);
      if (!angka(j.tiu)) gagal(`${jalur}.tiu: wajib angka positif`);
    });
  }
}

/* ----------------------------------------------------------------- sumber */

const sumber = baca('sumber.json');
let nSumber = 0;

if (sumber) {
  const urlTerpakai = new Map();

  for (const kategori of ['resmi', 'tambahan']) {
    const daftar = sumber[kategori];
    if (!Array.isArray(daftar) || daftar.length === 0) {
      gagal(`sumber.${kategori}: wajib berisi minimal satu tautan`);
      continue;
    }
    nSumber += daftar.length;

    daftar.forEach((s, i) => {
      const jalur = `sumber.${kategori}[${i}]`;
      ['id', 'ikon', 'judul', 'deskripsi', 'tag', 'url'].forEach((k) => {
        if (!teks(s[k])) gagal(`${jalur}.${k}: wajib teks`);
      });
      if (!/^https:\/\//.test(s.url || '')) {
        gagal(`${jalur}.url: wajib https, dapat ${s.url}`);
      }
      if (urlTerpakai.has(s.url)) {
        gagal(`${jalur}.url: duplikat dengan ${urlTerpakai.get(s.url)}`);
      } else {
        urlTerpakai.set(s.url, jalur);
      }
      if (kategori === 'resmi' && teks(s.url) && !/^https:\/\/[^/]*\.go\.id(\/|$)/.test(s.url)) {
        gagal(`${jalur}.url: kategori "resmi" wajib domain .go.id`);
      }
    });
  }
}

/* ----------------------------------------------------------------- materi */

const idMateri = new Map();
let nTopik = 0;

for (const key of SUBTES) {
  const isi = baca(path.join('materi', `${key}.json`));
  if (!isi) continue;

  if (isi.subtes !== key) gagal(`materi/${key}.json: subtes "${isi.subtes}" != "${key}"`);
  if (isi.label !== KODE[key]) gagal(`materi/${key}.json: label "${isi.label}" != "${KODE[key]}"`);

  const topik = isi.topik;
  if (!Array.isArray(topik) || topik.length === 0) {
    gagal(`materi/${key}.json: topik kosong`);
    continue;
  }
  nTopik += topik.length;

  topik.forEach((t, i) => {
    const jalur = `materi/${key}.json.topik[${i}]`;
    if (!teks(t.id)) gagal(`${jalur}.id: wajib teks`);
    if (!t.id.startsWith(key + '-')) gagal(`${jalur}.id "${t.id}": harus berawalan "${key}-"`);
    if (idMateri.has(t.id)) gagal(`${jalur}.id "${t.id}": duplikat dengan ${idMateri.get(t.id)}`);
    else idMateri.set(t.id, jalur);

    if (t.nomor !== i + 1) gagal(`${jalur}.nomor: harap ${i + 1}, dapat ${t.nomor}`);
    if (!teks(t.judul)) gagal(`${jalur}.judul: wajib teks`);
    if (!teks(t.subjudul)) gagal(`${jalur}.subjudul: wajib teks`);
    if (!teks(t.ringkasan)) gagal(`${jalur}.ringkasan: wajib teks`);

    if (t.flag !== undefined && !teks(t.flag)) gagal(`${jalur}.flag: jika ada, wajib teks`);
    if (t.catatan !== undefined) cekMarkup(t.catatan, `${jalur}.catatan`);

    if (t.poin !== undefined) {
      if (!Array.isArray(t.poin) || t.poin.length === 0) gagal(`${jalur}.poin: jika ada, wajib array tidak kosong`);
      else t.poin.forEach((p, j) => cekMarkup(p, `${jalur}.poin[${j}]`));
    }
    if (t.poinJudul !== undefined && !teks(t.poinJudul)) {
      gagal(`${jalur}.poinJudul: jika ada, wajib teks`);
    }
  });
}

/* ------------------------------------------------------------------- soal */

const idSoal = new Map();
let nSoal = 0;

for (const key of SUBTES) {
  const isi = baca(path.join('soal', `${key}.json`));
  if (!isi) continue;

  if (isi.subtes !== key) gagal(`soal/${key}.json: subtes "${isi.subtes}" != "${key}"`);
  if (isi.label !== KODE[key]) gagal(`soal/${key}.json: label "${isi.label}" != "${KODE[key]}"`);

  const daftar = isi.soal;
  if (!Array.isArray(daftar) || daftar.length === 0) {
    gagal(`soal/${key}.json: daftar soal kosong`);
    continue;
  }
  nSoal += daftar.length;

  daftar.forEach((s, i) => {
    const jalur = `soal/${key}.json.soal[${i}]`;
    const harapan = `${key}-${String(i + 1).padStart(2, '0')}`;
    if (s.id !== harapan) gagal(`${jalur}.id: harap "${harapan}", dapat "${s.id}"`);
    if (idSoal.has(s.id)) gagal(`${jalur}.id "${s.id}": duplikat dengan ${idSoal.get(s.id)}`);
    else idSoal.set(s.id, jalur);

    if (!teks(s.teks)) gagal(`${jalur}.teks: wajib teks`);
    if (!teks(s.pembahasan)) gagal(`${jalur}.pembahasan: wajib teks`);
    cekMarkup(s.pembahasan, `${jalur}.pembahasan`);

    if (!Array.isArray(s.opsi) || s.opsi.length !== 5) {
      gagal(`${jalur}.opsi: wajib 5 opsi, dapat ${Array.isArray(s.opsi) ? s.opsi.length : 'bukan array'}`);
      return;
    }

    const kunci = [];
    s.opsi.forEach((o, j) => {
      const sub = `${jalur}.opsi[${j}]`;
      const kodeHarap = String.fromCharCode(65 + j);
      if (o.kode !== kodeHarap) gagal(`${sub}.kode: harap "${kodeHarap}", dapat "${o.kode}"`);
      if (!teks(o.teks)) gagal(`${sub}.teks: wajib teks`);
      if (o.benar !== undefined && typeof o.benar !== 'boolean') gagal(`${sub}.benar: harus boolean`);
      if (o.benar === true) kunci.push(o.kode);
    });

    if (kunci.length !== 1) gagal(`${jalur}: harus tepat 1 kunci jawaban, dapat ${kunci.length}`);
  });
}

/* --------------------------------------------------------- silang: index */

const index = path.join(ROOT, 'index.html');
if (fs.existsSync(index)) {
  const html = fs.readFileSync(index, 'utf8');
  const meta = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
  if (meta) {
    const sebut = meta[1].match(/(\d+)\s+soal latihan/);
    if (sebut && Number(sebut[1]) !== nSoal) {
      gagal(`index.html meta description menyebut ${sebut[1]} soal latihan, data berisi ${nSoal}`);
    }
  }
}

/* --------------------------------------------------------------- laporan */

const baris = [
  `konfigurasi : ${konfigurasi ? 'ok' : 'GAGAL'}`,
  `subtes      : ${konfigurasi?.subtes?.length ?? 0}`,
  `sumber      : ${nSumber}`,
  `topik materi: ${nTopik}`,
  `soal        : ${nSoal}`,
  `kunci unik  : ${idSoal.size}`
];

console.log(baris.join('\n'));

if (ingat.length) {
  console.log('\nCatatan:');
  for (const c of ingat) console.log('  - ' + c);
}

if (galat.length) {
  console.log(`\n${galat.length} masalah:`);
  for (const g of galat) console.log('  x ' + g);
  process.exit(1);
}

console.log('\nValidasi lolos.');
