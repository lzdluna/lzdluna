# SKD Notes — Design System

## Overview

SKD Notes adalah halaman belajar SKD CPNS satu file: materi, bank data, simulasi,
strategi, latihan, dan catatan. Arah visualnya **editorial print**, bukan dashboard
aplikasi. Latar kertas hangat (`#FAF7F0`), garis tipis berwarna gamping, judul serif
Georgia berketebalan 400, dan satu warna aksen navy yang dipakai hemat.

Tiga prinsip yang membentuk seluruh keputusan desain:

1. **Terbaca seperti buku, bukan seperti SaaS.** Hierarki dibangun dari ukuran dan
   warna, bukan dari bayangan tebal atau gradien.
2. **Satu file, tanpa backend.** Semua aset inline, tanpa webfont, tanpa request
   eksternal. Halaman harus utuh dibuka dari `file://` maupun GitHub Pages.
3. **Jujur dan tenang.** Tidak ada hitung mundur yang berkedip, tidak ada badge
   "sale". Warna semantik hanya muncul saat memang perlu.

---

## Constraints (baca dulu sebelum menambah komponen)

| Batasan | Konsekuensi desain |
|---|---|
| Statis, disajikan GitHub Pages dari `main` / | Tanpa server, tanpa API, tanpa proses build. |
| Semua CSS & JS inline di `index.html` | Tidak ada file CSS terpisah, tidak ada bundler. |
| Tanpa webfont | Hanya Georgia, system UI stack, dan ui-monospace. |
| Tanpa gambar/foto | Ikon berupa glyph teks (`l`, `→`, `▾`, `✓`, `✕`) atau inline SVG. |
| State hanya di browser | `localStorage` untuk progres materi, `sessionStorage` untuk timer. |
| Routing hash (`#/materi`) | Aman untuk hosting statis; jangan pindah ke path routing. |

---

## Colors

Semua warna didefinisikan sebagai CSS custom property di `:root`.

### Permukaan (surface)

- **Paper** `--bg` `#FAF7F0` — latar halaman.
- **Paper Soft** `--bg-soft` `#F3EEE2` — pita seksi, header tabel, permukaan cekung.
- **Card** `--card` `#FFFDF8` — semua permukaan terangkat (kartu, panel, tabel).

### Teks

- **Ink** `--ink` `#1B1A17` — judul dan teks utama.
- **Ink Soft** `--ink-soft` `#4A463F` — paragraf isi.
- **Muted** `--muted` `#6B6459` — label, caption, metadata, header tabel.
- **Line** `--line` `#E3DCCD` — garis 1px dan border.

### Aksen

- **Accent (Navy)** `--accent` `#14345C` — tautan, tombol primer, state aktif.
- **Accent Soft** `--accent-soft` `#1F4A7D` — hover tombol primer.
- **Accent Wash** `--accent-wash` `#E8EEF6` — callout informasi, badge subtes.

### Semantik

- **Success** `--green` `#1F5D31` / `--green-wash` `#E7F0E8` — jawaban benar, "sudah dipelajari", badge "Resmi".
- **Warning** `--amber` `#8A4A12` / `--amber-wash` `#FDEEE0` — peringatan, badge "Latihan".
- **Error** `--red` `#A8341F` / `--red-wash` `#FBE9E5` — jawaban salah, timer < 5 menit.

### Aturan pemakaian warna

- Navy adalah **satu-satunya** warna interaktif. Jangan pakai hijau/merah untuk tombol aksi.
- Pasangan `*-wash` hanya untuk latar badge dan callout, tidak pernah untuk teks.
- Warna tidak boleh menjadi satu-satunya penanda status (lihat Accessibility).

### Kontras (terukur, WCAG AA)

`--muted` sengaja di-tuning ke `#6B6459` — nilai sebelumnya `#7D776C` gagal di latar
`--bg-soft` (3.84:1). Semua kombinasi teks × permukaan sekarang lolos 4.5:1:

| Teks | di `--bg` | di `--bg-soft` | di `--card` |
|---|---|---|---|
| `--ink` | 16.26 | 15.03 | 17.12 |
| `--ink-soft` | 8.77 | 8.10 | 9.23 |
| `--muted` | 5.46 | 5.05 | 5.75 |
| `--accent` | 11.71 | 10.83 | 12.33 |
| `--green` | 7.36 | 6.80 | 7.74 |
| `--amber` | 6.40 | 5.91 | 6.73 |
| `--red` | 6.18 | 5.71 | 6.50 |

Nilai terendah di seluruh palet adalah `--muted` pada `--red-wash` = **4.98:1**.
Jangan menggelapkan `--muted` tanpa menghitung ulang tabel ini.

---

## Typography

Tiga keluarga font, semuanya lokal — tidak ada unduhan.

- **Display / Judul**: `Georgia, serif` — **selalu weight 400**. Hierarki dari ukuran, bukan ketebalan.
- **Body**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Mono**: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` — hanya untuk timer.

### Skala

| Peran | Ukuran | Line height | Tracking | Weight |
|---|---|---|---|---|
| `h1.hero-title` | `clamp(2.1rem, 5.4vw, 3.4rem)` | 1.1 | `-.02em` | 400 serif |
| `h2` | `clamp(1.6rem, 3.2vw, 2.2rem)` | 1.2 | `-.015em` | 400 serif |
| `.card h3` | `1.22rem` | — | `-.01em` | 400 serif |
| `.sim h3` | `1.24rem` | — | — | 400 serif |
| `.quote` | `1.1rem` | 1.55 | — | 400 serif italic |
| `.stat-val` | `1.45rem` | 1 | — | 400 serif |
| `body` | `16.5px` | 1.68 | — | 400 |
| `.q-text` | `15.5px` | — | — | 500 |
| `.src-body h4` | `15.5px` | — | — | 600 sans |
| `.acc-title` | `15px` | 1.4 | — | 600 |
| `.note-strip` | `14.5px` | — | — | 400 |
| `.q-opt` | `14px` | 1.5 | — | 400 |
| `.chip` | `13px` | — | — | 500 |
| `.eyebrow`, `.sec-num` | `12.5px` | — | `.14–.16em` | 600 uppercase |
| `th`, `.stat-lbl` | `11–11.5px` | — | `.09em` | 600 uppercase |
| `.q-badge` | `10.5px` | — | `.1em` | 700 uppercase |

Timer memakai mono `2rem`, weight 600, `font-variant-numeric: tabular-nums` agar
digit tidak bergeser saat berjalan.

### Aturan tipografi

- Judul serif **tidak pernah** bold atau italic, kecuali `<em>` di dalam `h1.hero-title`
  yang diberi warna `--accent`.
- Paragraf isi maksimal ~60–66ch (`.hero-lead`, `.page-head`, `.sec-desc`).
- Label kecil selalu uppercase + tracking; jangan uppercase pada teks panjang.

---

## Spacing

Tidak ada grid 8px yang kaku. Skala de-facto yang dipakai:

`4 · 6 · 7 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 22 · 24 · 26 · 28 · 30 · 34 · 36 · 44 · 46 · 52 · 80` (px)

Nilai yang paling sering muncul dan sebaiknya dipakai untuk komponen baru:

| Token informal | Nilai | Pemakaian |
|---|---|---|
| `space-2` | 8px | gap ikon-teks, jarak antar baris |
| `space-3` | 12px | padding vertikal tombol kecil |
| `space-4` | 16px | gap grid, padding sel tabel horizontal |
| `space-5` | 20–24px | padding kartu, panel |
| `space-6` | 26–30px | padding kartu besar, jarak antar blok |
| `space-7` | 44–52px | jarak antar seksi (`.sub-head` 52px atas) |

Lebar konten: `--maxw` `1080px`, padding horizontal `.wrap` `24px`, padding vertikal
halaman `.page-inner` `52px 0 80px`.

---

## Border Radius

| Nilai | Nama | Pemakaian |
|---|---|---|
| `14px` (`--radius`) | Panel | Kartu, panel, tabel, callout, `.me`, `.timer-box` |
| `10px` | Tombol besar | `.btn`, `.src-ic` |
| `9px` | Kontrol | `.me-search input`, `.t-btn`, `.brand-mark`, `.acc-note` |
| `8px` | Elemen kecil | `.q-opt`, `.mark-btn`, `.card-kode`, `.q-toggle`, `.acc-num` |
| `6px` | Badge kecil | `.sim-badge` |
| `5px` | Label mikro | `.acc-flag`, `.q-badge` |
| `99px` | Pill | `.nav-links a`, `.chip`, `.me-tab`, `.qf-btn`, `.timer-pill`, `.alloc-bar` |
| `50%` | Lingkaran | `.avatar`, `.dot`, `.tp-dot` |

---

## Elevation

Hanya **satu** token bayangan, dipakai di semua permukaan terangkat:

```css
--shadow: 0 1px 2px rgba(27,26,23,.04), 0 8px 28px -18px rgba(27,26,23,.35);
```

Tidak ada glow, tidak ada bayangan berlapis. Efek "terangkat" saat hover hanya
boleh untuk elemen yang **benar-benar bisa diklik**:

```css
.jump:hover { transform: translateY(-3px); border-color: var(--accent); }
.src:hover  { border-color: var(--accent); background: #fff; }
```

Kartu statis (`.card`, `.strategy-card`, `.sim`, `.q-item`, `.q-item`) **tidak**
boleh punya hover lift — itu janji palsu ke pengguna.

### Motion

- Durasi 0.15–0.35s, easing `ease`.
- Hanya `transform`, `background`, `border-color`, `color`, `width` (progress bar).
- Semua dihormati oleh `@media (prefers-reduced-motion: reduce)` — lift dimatikan,
  smooth scroll dimatikan.

---

## Layout & Breakpoints

| Breakpoint | Perubahan |
|---|---|
| ≤ 860px | `.grid-3`, `.sim-grid`, `.strategy-grid`, `.notes-wrap` jadi 1 kolom; `.jump-grid` 2 kolom |
| ≤ 760px | `.src-list` jadi 1 kolom |
| ≤ 720px | Footer rata kiri |
| ≤ 640px | `.stat-strip` jadi 2×2, border disesuaikan |
| ≤ 600px | `.acc-body` tanpa indentasi, `.acc-flag` disembunyikan |
| ≤ 560px | `.jump-grid` 1 kolom, teks brand disembunyikan, `.schedule-row` 1 kolom |

Navigasi atas: sticky, tinggi `62px`, latar `rgba(250,247,240,.94)` + border bawah
1px. Link nav bisa di-scroll horizontal di layar sempit (scrollbar disembunyikan).

---

## Components

### Navigation

`.nav` sticky, `.brand` dengan `.brand-mark` 30×30 radius 9px berisi huruf `l`
serif. Link nav berbentuk pill 13.5px/500, state aktif: latar `--accent`, teks putih,
plus `aria-current="page"`.

### Timer Pill

Muncul di nav hanya saat timer berjalan (`.show`). Mono 13px, latar `--accent`.
Titik indikator hijau `#8fd19e`; saat habis berubah merah `#f0a58f` (`.done`).
Kliknya menavigasi ke `#/simulasi`, bukan membuka panel.

### Chips

Pill, latar `--card`, border 1px `--line`, teks 13px/500 `--ink-soft`. Dipakai untuk
metadata ringkas di hero (`<b>` di dalamnya memakai `--ink` 600).

### Stat Strip / Stat Row

Grid 4 kolom dengan garis pemisah 1px, angka serif 1.55rem (strip) atau 1.45rem
(row), label uppercase 11px `--muted`.

### Cards

Dua jenis, jangan dicampur:

- **`.card`** — statis, tidak bisa diklik. Padding `26px 24px`, radius 14px.
- **`.jump`** / **`.src`** — bisa diklik, punya hover lift / border accent.

### Accordion (Materi Explorer)

`.acc` dipisah garis 1px. `.acc-head` adalah `<button>` selebar penuh dengan
`aria-expanded`. State:

| State | Penanda visual |
|---|---|
| Tertutup | `.acc-num` latar `--accent-wash`, teks `--accent`; chevron `▾` |
| Terbuka | `.acc.open`, chevron diputar 180° |
| Sudah dipelajari | `.acc.done` — `.acc-num` jadi hijau, `.mark-btn.on` hijau dengan `✓` |

`.acc-flag` ("Sering keluar") hanya tampil di ≥601px.

### Buttons

| Kelas | Tampilan |
|---|---|
| `.btn` | Primer. Latar `--accent`, teks putih, radius 10px, padding `12px 20px` |
| `.t-btn` | Sekunder. Latar `--card`, border 1px, radius 9px |
| `.t-btn.primary` | Varian primer untuk kontrol timer |
| `.q-toggle` | Outline, teks `--accent`, radius 8px |
| `.mark-btn` | Outline kecil 12.5px; `.on` = hijau + `✓` |
| `.qf-btn` | Filter pill; `.active` = latar `--accent`, teks putih |

Semua tombol wajib punya `:focus-visible` yang terlihat. Tidak ada tombol tanpa
label teks (ikon saja dilarang, kecuali dekoratif dengan `aria-hidden`).

### Option Row (Kuis)

`.q-opt` adalah **`<button type="button">`**, bukan `div`. Ini bukan detail
implementasi — tanpa itu kuis tidak bisa dijawab dengan keyboard.

- Padding `9px 13px`, radius 8px, latar `--bg-soft`, teks rata kiri, `width:100%`.
- Hover (saat belum dijawab): latar putih + border `--line`.
- `.correct`: latar `--green-wash`, teks `--green`, **plus `✓`**.
- `.wrong`: latar `--red-wash`, teks `--red`, **plus `✕`**.
- Setelah dijawab, semua opsi `disabled`; `opacity` tetap 1 dan warna dipertahankan
  (`-webkit-text-fill-color: currentColor`) agar tetap terbaca.

### Tables

Dibungkus `.table-wrap` (radius 14px, `overflow:auto`, `min-width:560px` pada tabel).
Header uppercase 11.5px `--muted` di latar `--bg-soft`. Kolom angka memakai
`.num` dengan `text-align:center` dan `tabular-nums`.

### Source Cards

`.src` — kartu tautan eksternal. Ikon 36×36 radius 10px berisi 2–3 huruf serif,
judul 15.5px/600, deskripsi `--muted`, tag uppercase 11.5px `--accent`.

### Callouts

`.note-strip` — latar `--accent-wash`, teks `--accent`, radius 14px, padding
`18px 22px`. Varian `.warn` memakai `--amber-wash` / `--amber`. Maksimal dua
berturut-turut; lebih dari itu berubah jadi tembok warna.

### Timer Display

`.timer-display` mono 2rem, `tabular-nums`, `min-width:5.6ch` supaya tidak
"melompat" saat digit menyusut. Berubah `--red` saat ≤ 5 menit (`.warn`).

`.timer-note` di bawah deskripsi adalah satu-satunya tempat pesan status timer
(`role="status"`, `aria-live="polite"`).

---

## Interaction States

### Timer

| State | Tombol | Catatan |
|---|---|---|
| Idle | `Mulai` (primer) | `100:00` |
| Running | `Jeda` | Pill muncul di nav |
| Paused | `Lanjut` (primer) | Sisa waktu dibekukan |
| Finished | `Mulai ulang` | `00:00`, pesan "Waktu habis", alarm + judul berkedip |

Timer dihitung dari `Date.now()` terhadap `deadline`, bukan penambahan per tick.
Ini wajib: browser men-throttle `setInterval` di tab latar, sehingga penghitung
per-tick akan melambat. State disimpan di `sessionStorage` dan dipulihkan saat reload
(running → dilanjutkan, paused → tetap jeda, lewat deadline → dianggap selesai).

### Kuis

| State | Perilaku |
|---|---|
| Belum dijawab | Opsi aktif, pembahasan tertutup |
| Benar | Opsi terpilih hijau + `✓`, skor benar +1 |
| Salah | Opsi terpilih merah + `✕`, kunci ditandai hijau, skor salah +1 |
| Dijawab | Semua opsi `disabled`, pembahasan terbuka otomatis |

Klik "Buka pembahasan" sebelum menjawab tetap boleh, tapi hanya menandai kunci —
skor tidak bertambah. Tombol reset mengembalikan semuanya ke "Belum dijawab".

### Materi Explorer

Tab TWK/TIU/TKP (`role="tablist"`), pencarian real-time lintas judul + isi,
tombol "Buka semua / Tutup semua", dan penanda selesai yang persisten.

---

## Accessibility

Standar minimum yang sudah diterapkan dan tidak boleh diturunkan:

1. **Kontras ≥ 4.5:1** untuk semua teks (lihat tabel di bagian Colors).
2. **Semua kontrol adalah elemen native** — `<button>`, `<a>`, `<input>`. Bukan
   `div` dengan click handler.
3. **Status tidak hanya warna** — benar/salah memakai `✓`/`✕`; state aktif nav
   memakai `aria-current`.
4. **ARIA secukupnya** — `aria-expanded` + `aria-controls` pada toggle pembahasan,
   `aria-selected` pada tab, `role="status"` + `aria-live="polite"` pada pesan timer.
5. **Fokus terlihat** — `:focus-visible` dengan outline `--accent` 2px, offset 2px.
6. **`prefers-reduced-motion`** dimatikan animasinya.
7. **Target sentuh** — tombol kecil minimal 32px tinggi; opsi kuis ~36px.

---

## Storage Contract

| Key | Storage | Isi |
|---|---|---|
| `skdnotes.materi.done.v1` | `localStorage` | Objek `{ "twk-nasionalisme": true, ... }` |
| `skdnotes.timer.v1` | `sessionStorage` | `{ running, deadline, remaining }` |

Keduanya dibungkus `try/catch`. Data rusak atau storage diblokir **tidak boleh**
mematikan halaman — selalu fallback ke nilai default. Naikkan versi key
(`.v1` → `.v2`) jika bentuk datanya berubah, jangan migrasi diam-diam.

---

## Do's and Don'ts

1. **Do** pertahankan judul serif weight 400. Hierarki datang dari ukuran dan warna, bukan bold.
2. **Do** pakai navy sebagai satu-satunya warna interaktif; hijau/amber/merah hanya untuk makna.
3. **Do** beri hover lift hanya pada elemen yang benar-benar bisa diklik.
4. **Do** sertakan ikon di samping warna untuk status benar/salah.
5. **Do** jaga semua teks ≥ 4.5:1; hitung ulang tabel kontras jika mengubah token.
6. **Do** pertahankan base body 16.5px / 1.68 — ini halaman bacaan panjang.
7. **Do** hormati `prefers-reduced-motion` pada setiap animasi baru.
8. **Don't** menambah webfont, CDN, atau aset eksternal apa pun. Halaman harus utuh tanpa jaringan.
9. **Don't** memakai putih murni `#FFFFFF` sebagai latar halaman — selalu kertas hangat.
10. **Don't** membuat bayangan berlapis atau glow. Satu token bayangan saja.
11. **Don't** memakai `div`/`span` sebagai tombol, dan jangan bungkus elemen blok di dalam `span`.
12. **Don't** mengandalkan backend, cookie, atau analytics. State hanya di browser.
13. **Don't** menyembunyikan informasi penting hanya di breakpoint kecil (mis. label "Sering keluar") tanpa alternatif.
14. **Don't** mengklaim halaman ini resmi. Selalu tegaskan "bukan situs resmi BKN" dan cantumkan tahun regulasi.

---

## Known Gaps

Dicatat jujur supaya tidak dianggap sudah beres:

- Progres kuis belum persisten (materi sudah). Jika ditambahkan, pakai `sessionStorage`
  dengan key berversi, sejalan dengan timer.
- Tab materi belum mendukung navigasi panah kiri/kanan sesuai pola WAI-ARIA tablist.
- Beberapa nilai masih inline `style=""` (lebar bar alokasi, warna). Kandidat
  untuk dipindah ke kelas utilitas saat disentuh lagi.
- `.src-body h4` (15.5px sans 600) menyimpang dari pola judul serif; disengaja karena
  ini label tautan, bukan heading seksi. Jangan ditiru untuk heading baru.
