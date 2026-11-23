# SKD Notes Design System

## Overview

SKD Notes adalah halaman belajar SKD CPNS yang **dibaca seperti buku**, bukan
dipakai seperti dashboard. Arah visualnya editorial print: latar kertas hangat,
garis tipis berwarna gamping, judul serif Georgia berketebalan 400, dengan palet
**LocalGuide** — merah-orange untuk aksi primer, teal untuk tautan, kuning untuk
penanda — dipakai hemat di atas kertas.

Tiga prinsip yang membentuk semua keputusan desain:

1. **Hierarki dari ukuran dan warna**, bukan dari bayangan tebal atau gradien.
   Hanya ada satu token bayangan di seluruh halaman.
2. **Satu berkas statis, tanpa backend.** Tanpa webfont, tanpa CDN, tanpa build
   step. Konten dimuat dari `data/*.json` lewat `fetch()`.
3. **Tenang dan jujur.** Tidak ada hitung mundur berkedip, tidak ada badge promosi.
   Warna semantik hanya muncul saat memang perlu.

---

## Colors

Semua token didefinisikan di `:root` pada `assets/css/skd.css`.

### Permukaan

- **Paper** `--bg` `#FAF7F0` — latar halaman.
- **Paper Soft** `--bg-soft` `#F3EEE2` — pita seksi, header tabel, permukaan cekung.
- **Card** `--card` `#FFFDF8` — semua permukaan terangkat.

### Teks

- **Ink** `--ink` `#1B1A17` — judul dan teks utama.
- **Ink Soft** `--ink-soft` `#4A463F` — paragraf isi.
- **Muted** `--muted` `#6B6459` — label, caption, metadata, header tabel.
- **Line** `--line` `#E3DCCD` — semua garis dan border 1px.

### Aksen (palet LocalGuide)

- **Primary Red-Orange** `--accent` `#EA580C` — tombol primer, state aktif, penanda kunci.
- **Primary Dark** `--accent-soft` `#C2410C` — hover tombol primer.
- **Primary Wash** `--accent-wash` `#FDF1E8` — callout, latar badge.
- **Secondary Teal** `--teal` `#0D9488` — semua tautan teks, aksi sekunder.

### Semantik (palet LocalGuide)

- **Success** `--green` `#16A34A` / `--green-wash` `#E9F7EF` — jawaban benar,
  "sudah dipelajari", badge "Resmi".
- **Warning** `--amber` `#EAB308` / `--amber-wash` `#FEF7E0` — peringatan,
  badge "Latihan", skor TKP tingkat menengah.
- **Error** `--red` `#DC2626` / `--red-wash` `#FDECEC` — jawaban salah,
  timer di bawah 5 menit.

### Penyimpangan yang disengaja dari LocalGuide

| LocalGuide | Di proyek ini | Alasan |
|---|---|---|
| Background `#FFFFFF` | `#FAF7F0` (kertas) | Karakter editorial print dipertahankan; dipilih sadar |
| Surface Default `#FFFFFF` | `#FFFDF8` | Menjaga kehangatan kertas |

Warna Primary, Secondary, Tertiary, Success, Warning, Error, dan Info dipakai
**verbatim**, sesuai peran yang ditetapkan LocalGuide.

### Kontras (terukur — TIDAK memenuhi WCAG AA)

> **Peringatan.** Palet LocalGuide dirancang untuk latar putih. Di latar kertas
> proyek ini, seluruh warna semantik **gagal** ambang 4.5:1 bila dipakai sebagai
> teks. Ini keputusan sadar, bukan kelalaian. Angka di bawah adalah hasil ukur,
> bukan perkiraan.

| Token | Hex | di `--bg` | di `--bg-soft` | di `--card` | AA |
|---|---|---|---|---|---|
| `--accent` | `#EA580C` | 3.33 | 3.07 | 3.50 | ❌ |
| `--accent-soft` | `#C2410C` | 4.84 | 4.47 | 5.09 | ❌ (bg-soft) |
| `--teal` | `#0D9488` | 3.50 | 3.23 | 3.68 | ❌ |
| `--green` | `#16A34A` | 3.08 | 2.85 | 3.24 | ❌ |
| `--amber` | `#EAB308` | 1.79 | 1.66 | 1.89 | ❌ |
| `--red` | `#DC2626` | 4.51 | 4.17 | 4.75 | ❌ (bg-soft) |
| `--ink` | `#1B1A17` | 16.26 | 15.03 | 17.12 | ✅ |
| `--ink-soft` | `#4A463F` | 8.77 | 8.10 | 9.23 | ✅ |
| `--muted` | `#6B6459` | 5.46 | 5.05 | 5.75 | ✅ |

Teks putih di atas tombol juga di bawah ambang: `#FFFFFF` pada `--accent` = **3.56:1**.

**Yang terkena:** `.note-strip` (paragraf penuh), `.acc-note`, `.timer-note`,
`.q-toggle`, `.src-tag`, `.jump-go`, `.order-opt b`, `.card-kode`, `.acc-num`,
`.q-badge`, `.acc-flag`, serta label `Benar`/`Salah` pada pelacak skor.

**Yang aman:** seluruh teks isi (`--ink`, `--ink-soft`) dan metadata (`--muted`)
tetap lolos — dan itu mayoritas teks di halaman.

**Cara memulihkan AA tanpa mengganti hue:** gelapkan token hingga lolos, dengan
`--accent` `#BB460A` (4.91), `--teal` `#0B7970` (4.93), `--amber` `#886805`
(4.87), `--green` `#117D39` (4.89), `--red` `#D22424` (4.88). Angka dalam
kurung adalah rasio terhadap `--bg`. Jalankan `npm run uji` setelah mengubah —
tes mengunci nilai token, jadi perubahan akan terdeteksi.

---

## Typography

Tiga keluarga font, semuanya lokal — tidak ada unduhan.

- **Display / Judul**: `Georgia, serif`, **selalu weight 400**. Hierarki dari
  ukuran, bukan ketebalan.
- **Body**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica
  Neue", Arial, sans-serif`.
- **Mono**: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` — hanya
  untuk timer.

| Peran | Ukuran | Line height | Weight |
|---|---|---|---|
| `h1.hero-title` | `clamp(2.1rem, 5.4vw, 3.4rem)` | 1.1 | 400 serif |
| `h2` | `clamp(1.6rem, 3.2vw, 2.2rem)` | 1.2 | 400 serif |
| `.card h3` / `.sim h3` | `1.22–1.24rem` | — | 400 serif |
| `.stat-val` | `1.45rem` | 1 | 400 serif |
| `body` | `16.5px` | 1.68 | 400 |
| `.q-text` | `15.5px` | — | 500 |
| `.note-strip` | `14.5px` | — | 400 |
| `.q-opt` | `14px` | 1.5 | 400 |
| `.eyebrow`, `.sec-num` | `12.5px` | — | 600 uppercase, tracking `.14–.16em` |
| `th`, `.stat-lbl` | `11–11.5px` | — | 600 uppercase, tracking `.09em` |
| `.q-badge` | `10.5px` | — | 700 uppercase |

Timer memakai mono `2rem` dengan `font-variant-numeric: tabular-nums` agar digit
tidak bergeser saat berjalan.

---

## Spacing & Radius

- Lebar konten `--maxw` **1080px**; padding horizontal `.wrap` **24px**;
  padding vertikal halaman **52px 0 80px**.
- Skala yang dipakai: `4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 24 · 26 · 28 ·
  30 · 34 · 44 · 46 · 52 · 80` px. Jarak antar seksi lewat `.sub-head` (52px atas).

### Breakpoints

| Lebar | Perubahan |
|---|---|
| ≤ 860px | `.grid-3`, `.sim-grid`, `.strategy-grid`, `.notes-wrap` jadi 1 kolom; `.jump-grid` 2 kolom |
| ≤ 760px | `.src-list` jadi 1 kolom |
| ≤ 720px | Footer rata kiri |
| ≤ 640px | `.stat-strip` jadi 2×2 |
| ≤ 600px | `.acc-body` tanpa indentasi, `.acc-flag` disembunyikan |
| ≤ 560px | `.jump-grid` 1 kolom, teks brand disembunyikan, `.schedule-row` 1 kolom |

| Radius | Pemakaian |
|---|---|
| `14px` (`--radius`) | Kartu, panel, tabel, callout |
| `10px` | `.btn`, `.src-ic` |
| `9px` | Input, `.t-btn`, `.acc-note` |
| `8px` | `.q-opt`, `.mark-btn`, `.q-toggle` |
| `5–6px` | Badge mikro |
| `99px` | Nav, chip, tab, filter, pill |
| `50%` | Avatar, dot |

### Elevation

Hanya satu token bayangan:

```css
--shadow: 0 1px 2px rgba(27,26,23,.04), 0 8px 28px -18px rgba(27,26,23,.35);
```

Tidak ada glow, tidak ada bayangan berlapis. Efek terangkat saat hover **hanya**
untuk elemen yang benar-benar bisa diklik (`.jump`, `.src`).

---

## Struktur Berkas

```
index.html          kerangka saja (502 baris), tanpa konten
assets/css/skd.css  seluruh gaya, termasuk token di :root
assets/js/          render · router · timer · quiz · materi · sumber · app
data/               konfigurasi · sumber · materi/{twk,tiu,tkp} · soal/{twk,tiu,tkp}
scripts/            ekstrak · validasi · uji · serve (tidak di-deploy)
```

- JS memakai classic script + namespace `window.SKD`, dimuat dengan `defer`.
  Bukan ES modules — jsdom tidak bisa mengeksekusinya, dan seluruh tes bergantung
  pada jsdom.
- Semua teks dirender lewat `textContent`. Tidak ada `innerHTML`; satu-satunya
  markup yang dibangkitkan adalah `<b>` dari penanda `**tebal**`.

---

## Components

### Navigation

Sticky, tinggi `62px`, latar `rgba(250,247,240,.94)` + border bawah 1px. Link
berbentuk pill 13.5px/500; state aktif berlatar `--accent`, teks putih, plus
`aria-current="page"`.

### Timer Pill

Muncul di nav hanya saat timer berjalan. Mono 13px, latar `--accent`. Titik
indikator hijau `#8fd19e`, berubah merah `#f0a58f` saat habis. Kliknya menavigasi
ke `#/simulasi`.

### Cards

Dua jenis, jangan dicampur:

- **`.card`** — statis, tidak bisa diklik, **tanpa hover lift**.
- **`.jump`** / **`.src`** — bisa diklik, punya hover lift atau border accent.

### Accordion (Materi)

`.acc-head` adalah `<button>` selebar penuh dengan `aria-expanded`. State:
tertutup (nomor latar `--accent-wash`), terbuka (chevron diputar 180°), sudah
dipelajari (nomor hijau + tombol `✓`).

### Option Row (Kuis)

`.q-opt` adalah **`<button type="button">`**, bukan `div` — tanpa itu kuis tidak
bisa dijawab dengan keyboard. Latar `--bg-soft`, teks rata kiri, `width:100%`.

| State | Penanda |
|---|---|
| Belum dijawab | hover putih + border `--line` |
| `.correct` | latar `--green-wash`, teks `--green`, **plus `✓`** |
| `.wrong` | latar `--red-wash`, teks `--red`, **plus `✕`** |
| Setelah dijawab | semua `disabled`, opacity tetap 1 agar warna terbaca |

### Callouts

`.note-strip` — latar `--accent-wash`, teks `--accent`, padding `18px 22px`.
Varian `.warn` memakai `--amber-wash` / `--amber`. Maksimal dua berturut-turut.

---

## Interaction States

### Timer

| State | Tombol | Catatan |
|---|---|---|
| Idle | `Mulai` | `100:00` |
| Running | `Jeda` | pill muncul di nav |
| Paused | `Lanjut` | sisa waktu dibekukan |
| Finished | `Mulai ulang` | `00:00`, pesan, alarm, judul berkedip |

Timer dihitung dari `Date.now()` terhadap `deadline`, **bukan** penambahan per
tick: browser men-throttle `setInterval` di tab latar, sehingga penghitung
per-tick akan melambat. Status disimpan di `sessionStorage` dan dipulihkan saat
reload (running → dilanjutkan, paused → tetap jeda, lewat deadline → selesai).

### Kuis

Klik "Buka pembahasan" sebelum menjawab hanya menandai kunci — skor tidak
bertambah. Reset mengembalikan semuanya ke "belum dijawab".

---

## Accessibility

Standar yang diterapkan. **Satu butir sengaja tidak dipenuhi** — lihat catatan di
bawah:

1. ⚠️ **Kontras tidak memenuhi 4.5:1** untuk warna semantik dan aksen. Teks isi
   (`--ink`, `--ink-soft`, `--muted`) tetap lolos. Rincian dan cara memulihkan
   ada di bagian [Kontras](#kontras-terukur--tidak-memenuhi-wcag-aa).
2. Semua kontrol adalah elemen native (`button`, `a`, `input`), bukan `div`
   dengan click handler.
3. Status tidak hanya warna — benar/salah memakai `✓`/`✕`, nav memakai
   `aria-current`. Ini makin penting karena kontras warna rendah.
4. ARIA secukupnya: `aria-expanded` + `aria-controls` pada toggle pembahasan,
   `aria-selected` pada tab, `role="status"` + `aria-live` pada pesan timer.
5. `:focus-visible` dengan outline `--accent` 2px, offset 2px.
6. `prefers-reduced-motion` mematikan lift dan smooth scroll.
7. Target sentuh minimal 32px tinggi.

---

## Storage Contract

| Key | Storage | Isi |
|---|---|---|
| `skdnotes.materi.done.v1` | `localStorage` | `{ "twk-nasionalisme": true, ... }` |
| `skdnotes.timer.v1` | `sessionStorage` | `{ running, deadline, remaining }` |

Keduanya dibungkus `try/catch`: storage rusak atau diblokir tidak boleh mematikan
halaman. Naikkan versi key (`.v1` → `.v2`) bila bentuk data berubah — jangan
migrasi diam-diam.

---

## Do's and Don'ts

1. **Do** pertahankan judul serif weight 400. Hierarki datang dari ukuran dan
   warna, bukan bold.
2. **Do** pakai `--accent` (merah-orange) untuk aksi primer dan `--teal` untuk
   tautan; hijau/amber/merah hanya untuk makna.
3. **Do** beri hover lift hanya pada elemen yang bisa diklik.
4. **Do** sertakan ikon di samping warna untuk status benar/salah — sekarang
   wajib, karena kontras warna rendah.
5. **Do** ukur ulang tabel kontras bila token berubah, dan perbarui angka di
   dokumen ini. Jangan mengklaim AA tanpa mengukur.
6. **Do** pertahankan base body 16.5px / 1.68 — ini halaman bacaan panjang.
7. **Do** hormati `prefers-reduced-motion` pada setiap animasi baru.
8. **Don't** memakai warna aksen untuk paragraf panjang. Semakin banyak teks
   berwarna, semakin sulit dibaca pada kontras 3.3:1.
9. **Don't** menambah webfont, CDN, atau aset eksternal. Halaman harus utuh tanpa
   jaringan.
10. **Don't** memakai putih murni `#FFFFFF` sebagai latar halaman — selalu kertas
    hangat.
11. **Don't** membuat bayangan berlapis atau glow. Satu token bayangan saja.
12. **Don't** memakai `div`/`span` sebagai tombol, dan jangan bungkus elemen blok
    di dalam `span`.
13. **Don't** mengandalkan backend, cookie, atau analytics. State hanya di browser.
14. **Don't** menulis jumlah soal/topik manual di HTML — pakai `data-stat` agar
    selalu sama dengan isi `data/*.json`.
15. **Don't** mengklaim halaman ini resmi. Selalu tegaskan "bukan situs resmi BKN"
    dan cantumkan tahun regulasi.

---

## Known Gaps

Dicatat jujur supaya tidak dianggap sudah selesai:

- **Kontras di bawah WCAG AA** untuk seluruh warna semantik dan aksen
  (3.07–4.84:1). Ini konsekuensi langsung dari memakai palet LocalGuide verbatim
  di atas latar kertas. Varian yang sudah dihitung untuk memulihkan AA ada di
  bagian Kontras. Bila aksesibilitas diprioritaskan kembali, ganti lima token
  dengan varian gelap — tidak perlu mengubah struktur CSS.
- Teks putih di atas tombol `--accent` = 3.56:1. Alternatif: teks `--ink` di atas
  tombol, atau gelapkan `--accent`.
- Progres kuis belum persisten (materi sudah). Jika ditambahkan, pakai
  `sessionStorage` dengan key berversi, sejalan dengan timer.
- Tab materi belum mendukung navigasi panah kiri/kanan sesuai pola WAI-ARIA
  tablist.
- Beberapa nilai masih inline `style=""` (lebar bar alokasi, warna). Kandidat
  dipindah ke kelas utilitas saat disentuh lagi.
- Konten tidak ada di HTML awal, sehingga crawler dan pengguna tanpa JS tidak
  melihat 18 soal / 16 topik. Mitigasi saat ini: `<noscript>` penjelas.
