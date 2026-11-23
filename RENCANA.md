# Rencana: Pisahkan Data ke Folder `data/`

Status: **disetujui**, sedang dieksekusi.
Target: `index.html` 2.458 baris → kerangka ±350 baris + data terstruktur.

---

## Masalah yang diselesaikan

1. **Konten bercampur markup.** 16 topik materi (baris 808–1093) dan 18 soal
   (baris 1473–1766) ditulis sebagai HTML di tengah halaman. Menambah satu soal
   berarti menyunting blok HTML panjang dan berisiko merusak struktur.
2. **Angka jumlah ditulis manual di 14 tempat.** `18 soal` muncul di meta
   description, 4 chip hero, judul seksi, tombol filter `Semua (18)`, `/18` di
   pelacak skor, dan id-card. Menambah soal berarti mengedit 6–7 tempat; satu
   terlewat membuat halaman tidak konsisten.
3. **Tidak ada validasi.** Tidak ada yang mencegah soal tanpa kunci jawaban,
   soal dengan dua kunci, atau `id` topik duplikat.

---

## Keputusan

| Aspek | Pilihan | Konsekuensi |
|---|---|---|
| Format | JSON asli + `fetch()` | Pratinjau lokal wajib `npm run serve`; `file://` ditolak dengan pesan jelas |
| Granularitas | Per subtes (3 materi + 3 soal) | Edit TWK tidak menyentuh TIU |
| Cakupan | Data + JS + CSS dipisah | `index.html` jadi kerangka |
| Modul JS | Classic script + `window.SKD` | jsdom tetap bisa menguji; ES modules akan memaksa pindah ke Playwright |

---

## Struktur akhir

```
/
├── index.html                  kerangka (±350 baris)
├── .nojekyll                   matikan build Jekyll di Pages
├── .gitignore
├── DESIGN.md
├── RENCANA.md
├── package.json                devDependency: jsdom
├── data/
│   ├── konfigurasi.json        tahun, regulasi, skd, subtes[], jalurKhusus[]
│   ├── sumber.json             12 tautan (4 resmi + 8 tambahan)
│   ├── materi/{twk,tiu,tkp}.json
│   └── soal/{twk,tiu,tkp}.json
├── assets/
│   ├── css/skd.css             dari <style> baris 9–615
│   └── js/
│       ├── render.js           helper DOM aman + parser **tebal**
│       ├── router.js
│       ├── timer.js
│       ├── quiz.js
│       ├── materi.js
│       ├── sumber.js
│       └── app.js              bootstrap: load → render → init
└── scripts/
    ├── ekstrak.mjs             index.html → data/*.json (sekali pakai)
    ├── validasi.mjs            skema + konsistensi
    ├── uji.mjs                 tes jsdom (78 assertion + tes baru)
    └── serve.mjs               server statis lokal
```

---

## Skema

### `data/konfigurasi.json`

```json
{
  "tahun": 2024,
  "regulasi": { "nama": "KepmenPANRB No. 321 Tahun 2024", "url": "..." },
  "skd": { "soal": 110, "menit": 100, "skorMaks": 550 },
  "subtes": [{
    "kode": "TWK",
    "nama": "Tes Wawasan Kebangsaan",
    "subjudul": "Konseptual · implementasi nilai",
    "soal": 30, "passing": 65, "maks": 150,
    "nilaiPerSoal": "Benar 5 · Salah 0",
    "targetAman": "75–85",
    "cakupan": ["**Nasionalisme** — kepentingan nasional di atas pribadi"]
  }],
  "jalurKhusus": [
    { "label": "Cumlaude/diaspora", "kumulatif": 311, "tiu": 85 },
    { "label": "Disabilitas, Papua, daerah tertinggal", "kumulatif": 286, "tiu": 60 }
  ]
}
```

### `data/materi/twk.json`

```json
{
  "subtes": "twk",
  "label": "TWK",
  "topik": [{
    "id": "twk-nasionalisme",
    "nomor": 1,
    "judul": "Nasionalisme",
    "subjudul": "Kesetiaan pada bangsa tanpa merendahkan bangsa lain",
    "flag": "Sering keluar",
    "ringkasan": "Nasionalisme adalah paham kebangsaan...",
    "poinJudul": "Poin kunci",
    "poin": ["**Cinta tanah air** dan bangga menjadi bagian dari bangsa Indonesia."],
    "catatan": "Pilih respons yang mengedepankan kepentingan bersama."
  }]
}
```

`id` **wajib identik** dengan `data-materi-id` sekarang agar progres
`localStorage` pengguna tidak hilang.

### `data/soal/twk.json`

```json
{
  "subtes": "twk",
  "soal": [{
    "id": "twk-01",
    "teks": "Berdasarkan Pasal 1 ayat (3) UUD 1945, Indonesia merupakan negara …",
    "opsi": [
      { "kode": "A", "teks": "Serikat" },
      { "kode": "B", "teks": "Hukum", "benar": true }
    ],
    "pembahasan": "Pasal 1 ayat (3) UUD 1945 menyatakan bahwa..."
  }]
}
```

Baris jawaban (`Jawaban: B. Hukum.`) **tidak disimpan** — renderer menyusunnya
dari `kode` + teks opsi yang benar. Label otomatis `Jawaban` untuk TWK/TIU dan
`Jawaban terbaik` untuk TKP.

---

## Penurunan angka (14 titik)

| Angka | Sumber setelah refactor |
|---|---|
| `110 soal`, `100 menit`, `550` | `konfigurasi.skd` |
| `54 detik per soal` | dihitung `menit × 60 ÷ soal` |
| `30/35/45`, `65/80/166`, `150/175/225` | `konfigurasi.subtes[]` |
| `16 topik` | jumlah topik di `data/materi/*.json` |
| `18 soal`, `Semua (18)`, `/18` | jumlah soal di `data/soal/*.json` |

`meta description` tetap statis (crawler tidak menjalankan JS), tetapi
`validasi.mjs` **gagal** bila angka di dalamnya tidak sama dengan jumlah soal
sebenarnya.

---

## Bootstrap `app.js`

1. `location.protocol === 'file:'` → tampilkan pesan "buka lewat `npm run serve`", stop.
2. `aria-busy="true"` pada container.
3. `Promise.all` 8 request paralel (konfigurasi + sumber + 3 materi + 3 soal).
4. Validasi ringan di klien: `id` duplikat, soal tanpa kunci, soal dengan dua kunci.
5. Render: kartu subtes, tabel ambang batas, explorer materi, daftar sumber, daftar soal.
6. Turunkan 14 angka dari hasil hitung.
7. Init modul: router, timer, quiz, materi, sumber.
8. `aria-busy="false"`.

Gagal di langkah 3 → kartu error + tombol **Coba lagi**; halaman tidak boleh kosong.

---

## Rendering aman

Tanpa `innerHTML`. Semua teks lewat `textContent`; hanya penanda `**tebal**`
diubah menjadi `<b>` oleh parser khusus di `render.js`. Ini mencegah teks dari
file data berubah menjadi markup.

---

## Urutan eksekusi + gerbang

| # | Langkah | Gerbang |
|---|---|---|
| 0 | `RENCANA.md`, `.gitignore`, `package.json` | Commit bersih |
| 1 | `scripts/ekstrak.mjs` + `data/*.json` + `validasi.mjs` | 16 topik, 18 soal, 90 opsi, 12 sumber, 0 id duplikat, validasi lolos |
| 2 | `assets/` + renderer + loader; `index.html` baca dari JSON | DOM hasil render identik dengan fixture (selisih terdokumentasi) |
| 3 | Hapus markup statis; turunkan 14 angka | `grep '18 soal\|16 topik'` di HTML = 0 |
| 4 | `scripts/uji.mjs` + `.github/workflows/validasi.yml` | Semua tes lolos, workflow hijau |

Tag `v1-baseline` pada commit sebelum refactor untuk rollback satu perintah.

---

## Risiko yang diterima

1. `file://` tidak lagi jalan — pratinjau lewat `npm run serve`.
2. Konten tidak ada di HTML awal — ada `<noscript>` penjelas.
3. Satu lapisan async — butuh state loading dan error.
4. 8 request (total ±45 KB, paralel) — `.nojekyll` mematikan Jekyll.
5. Cache GitHub Pages ±10 menit setelah edit JSON.

Progres materi pengguna **aman**: `id` topik dan key `localStorage` tidak berubah.
