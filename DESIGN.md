# SKD Notes Design System

## Overview

SKD Notes adalah halaman belajar SKD CPNS yang dibaca seperti **buku catatan
yang ditempel-tempel**, bukan dashboard. Arah visualnya **neo-brutalism**:
kertas krem bertitik, border hitam tebal, bayangan keras tanpa blur, dan isian
warna saturasi tinggi.

Tiga prinsip yang membentuk semua keputusan desain:

1. **Makna dibawa oleh latar, bukan oleh warna huruf.** Semua teks berwarna
   tinta; yang berwarna adalah kotaknya. Konsekuensinya kontras tinggi secara
   bawaan — bukan hasil penyesuaian belakangan.
2. **Satu berkas statis, tanpa backend.** Tanpa webfont, tanpa CDN, tanpa build
   step. Konten dimuat dari `data/*.json` lewat `fetch()`.
3. **Tenang di isi, ramai di kulit.** Angka, pasal, dan disclaimer tetap datar.
   Yang boleh heboh: sapaan, progres, umpan balik, dekorasi.

---

## Colors

Semua token didefinisikan di `:root` pada `assets/css/skd.css`.

### Permukaan

- **Kertas** `--bg` `#FBF8EF` — latar halaman, bertitik 18px.
- **Kertas Gelap** `--bg-soft` `#F2EDDD` — permukaan cekung, hari pada jadwal.
- **Kartu** `--card` `#FFFFFF` — semua permukaan terangkat.

### Teks

- **Tinta** `--ink` `#111111` — judul, teks utama, dan **semua teks semantik**.
- **Tinta Lembut** `--ink-soft` `#262626` — paragraf isi.
- **Redup** `--muted` `#525252` — label, caption, metadata.
- **Garis** `--line` `#111111` — semua border, 2.5px.

### Isian

- **Kuning** `--yellow` `#FDDF3A` — sorotan judul, header tabel, penanda.
- **Oranye** `--orange` `#FF8A3C` — brand, kartu navigasi kedua.
- **Biru** `--blue` `#38BDF8` — informasi, kartu subtes TIU, header explorer.
- **Hijau** `--green-fill` `#51E28A` — berhasil, jawaban benar, "Resmi".
- **Pink** `--pink` `#FF6584` — salah, peringatan kritis, kartu TKP.
- **Ungu** `--purple` `#C084FC` — aksen dekoratif, avatar.

### Semantik

Semua token semantik **teksnya adalah tinta**. Warna dibawa oleh `*-wash`:

| Peran | Teks | Latar |
|---|---|---|
| `--green` / `--green-wash` | `#111111` | `#51E28A` |
| `--amber` / `--amber-wash` | `#111111` | `#FDDF3A` |
| `--red` / `--red-wash` | `#111111` | `#FF6584` |
| `--accent` / `--accent-wash` | `#111111` | `#38BDF8` |

Karena itu `.q-opt.correct` otomatis menjadi "kotak hijau, huruf hitam" tanpa
aturan tambahan.

### Kontras (terukur — seluruh pasangan lolos WCAG AA)

`npm run kontras` mengukur **90 pasangan** teks–latar yang benar-benar dipakai.
Hasil: **90 lolos, 0 gagal**. Nilai terendah di halaman adalah `--muted` di atas
`--yellow` = **5.88:1**, masih di atas ambang 4.5:1.

| Teks | di `--bg` | di `--bg-soft` | di `--card` |
|---|---|---|---|
| `--ink` | 17.78 | 16.13 | 18.88 |
| `--ink-soft` | 14.25 | 12.92 | 15.13 |
| `--muted` | 7.36 | 6.67 | 7.81 |

Di atas isian, tinta tetap unggul: kuning 14.20 · hijau 11.33 · biru 8.81 ·
oranye 8.05 · ungu 7.15 · pink 6.70. Tombol hitam dengan teks putih = 18.88.

Ini perbaikan besar dari palet sebelumnya (43 dari 77 pasangan, terburuk 1.79).
Kuncinya satu keputusan: **jangan pernah memakai warna sebagai warna teks.**

---

## Typography

Satu keluarga font untuk semuanya — system UI stack, tanpa unduhan:

```
--font-display: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                "Helvetica Neue", Arial, sans-serif
```

Tidak ada serif. Tidak ada webfont. Timer memakai `ui-monospace` agar digit
tidak bergeser.

| Peran | Ukuran | Line height | Weight |
|---|---|---|---|
| `h1.hero-title` | `clamp(2.1rem, 5.4vw, 3.4rem)` | 1.06 | 800 |
| `h2` | `clamp(1.6rem, 3.2vw, 2.2rem)` | 1.15 | 800 |
| `.card h3` / `.sim h3` | `1.22–1.24rem` | — | 800 |
| `.stat-val` | `1.45rem` | 1 | 800 |
| `body` | `16.5px` | 1.68 | 400 |
| `.q-text` | `15.5px` | — | 500 |
| `.note-strip` | `14.5px` | — | 400 |
| `.q-opt` | `14px` | 1.5 | 600 |
| `.eyebrow`, `.sec-num` | `12.5px` | — | 600 uppercase, tracking `.14–.16em` |
| `th`, `.stat-lbl` | `11–11.5px` | — | 600–800 uppercase |
| `.q-badge`, `.acc-flag` | `10.5px` | — | 800 uppercase |

Judul memakai tracking negatif (`-.035em`) supaya terasa padat dan tegas.

---

## Spacing & Radius

- Lebar konten `--maxw` **1080px**; padding horizontal `.wrap` **24px**;
  padding vertikal halaman **52px 0 80px**.
- Skala: `4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 24 · 26 · 28 · 30 · 34 ·
  44 · 46 · 52 · 80` px.

| Radius | Pemakaian |
|---|---|
| `16px` (`--radius`) | Kartu, panel, tabel, callout |
| `12px` | Tombol primer, opsi kuis, sorotan judul |
| `10px` | Input, brand mark |
| `8–9px` | Tombol kecil, `.acc-note` |
| `5–6px` | Badge mikro |
| `99px` | Nav, chip, tab, filter, pill |

### Breakpoints

Target minimum yang diuji: **320px**. Skala dijaga sengaja kecil supaya
perilaku tiap lebar bisa diprediksi.

| Lebar | Perubahan |
|---|---|
| ≤ 860px | `.grid-3`, `.sim-grid`, `.strategy-grid`, `.notes-wrap` jadi 1 kolom; `.jump-grid` 2 kolom; **navbar berubah jadi menu lipat** |
| ≤ 760px | `.src-list` jadi 1 kolom |
| ≤ 720px | Footer jadi satu kolom; timer menumpuk (info di atas, kontrol di bawah) |
| ≤ 640px | `.stat-strip` jadi 2×2 |
| ≤ 600px | `.acc-body` tanpa indentasi, `.acc-flag` disembunyikan; tabel dapat kolom pertama yang menempel + petunjuk geser |
| ≤ 560px | `.jump-grid` 1 kolom, teks brand disembunyikan, `.schedule-row` 1 kolom |
| ≤ 480px | Kontrol timer vertikal penuh, kluster badge satu baris, bar kuis menumpuk, opsi kuis lebih rapat, ikon modul 34px |
| ≤ 360px | Pengaman akhir: padding kartu, ukuran angka metrik, dan font opsi turun |

**Aturan penempatan:** blok `@media` harus berada **setelah** aturan dasarnya.
Blok 860px pernah diletakkan di atas `.grid-3` sehingga kalah oleh aturan dasar
dan grid tetap 3 kolom di ponsel — ini pernah lolos tanpa terdeteksi karena
tidak ada pengujian tata letak.

### Perilaku mobile per komponen

| Komponen | Perilaku |
|---|---|
| Navbar | ≤860px: tombol **Menu** dengan `aria-expanded`; panel terbuka di dalam kartu, bukan modal. Esc menutup dan mengembalikan fokus; klik di luar dan memilih menu juga menutup |
| Timer | ≤720px menumpuk; ≤480px tombol selebar kartu, angka memakai `clamp()` |
| Tabel | ≤600px `min-width` 520, kolom pertama `position:sticky; left:0`, petunjuk "geser" muncul |
| Badge hero | ≤480px tiap kluster jadi satu baris penuh |
| Kuis | ≤480px filter dan skor masing-masing satu baris; opsi `padding:10px 12px` |
| Sentuh | `@media (pointer:coarse)` memberi `min-height:44px` pada semua kontrol |
| Overflow | `html, body { overflow-x: clip }` menahan offset negatif dekorasi |

---

## Elevation

Bayangan keras, tanpa blur, tanpa opacity. Empat tingkat:

```css
--shadow-sm: 2px 2px 0 0 #111111;
--shadow:    4px 4px 0 0 #111111;
--shadow-lg: 6px 6px 0 0 #111111;
--shadow-xl: 8px 8px 0 0 #111111;
```

Tidak ada glow, tidak ada bayangan lembut. Semua kartu memakai `--shadow` dan
border `2.5px solid var(--line)`.

### Fisika

Elemen yang bisa diklik bergerak; yang statis tidak:

| State | Transform | Bayangan |
|---|---|---|
| Diam | — | `--shadow` |
| Hover | `translate(-3px,-3px)` | `--shadow-lg` |
| Ditekan | `translate(2px,2px)` | tidak ada |

Ini meniru tombol fisik. Semua gerakan dimatikan pada
`prefers-reduced-motion: reduce`.

---

## Struktur Berkas

```
index.html          kerangka saja (502 baris), tanpa konten
assets/css/skd.css  seluruh gaya, termasuk token di :root
assets/js/          render · router · timer · quiz · materi · sumber · app
data/               konfigurasi · sumber · materi/{twk,tiu,tkp} · soal/{twk,tiu,tkp}
scripts/            ekstrak · validasi · dokumen · kontras · responsif · uji · uji-responsif · serve
```

- JS memakai classic script + namespace `window.SKD`, dimuat dengan `defer`.
  Bukan ES modules — jsdom tidak bisa mengeksekusinya, dan seluruh tes
  bergantung pada jsdom.
- Semua teks dirender lewat `textContent`. Tidak ada `innerHTML`; satu-satunya
  markup yang dibangkitkan adalah `<b>` dari penanda `**tebal**`.
- Nol request eksternal. Tidak ada Tailwind CDN, tidak ada Google Fonts.

---

## Components

### Navigation

Navbar adalah **kartu mengambang**, bukan bilah penuh selebar layar: pembungkus
`.nav` transparan (`top:12px`), dan di dalamnya `.nav-card` putih ber-border
2.5px, radius 16px, serta `--shadow-lg` agar terangkat dari konten. Rasanya
seperti di `inspirasi.html`, tapi tetap `sticky` supaya navigasi dan timer-pill
selalu terjangkau saat scroll.

- Brand: kotak oranye berbentuk **lingkaran** 36px berisi huruf `l`, memutar 12°
  saat hover.
- Link: pill dengan border transparan 2.5px. Hover memberi isian warna
  **berbeda per menu** (Materi hijau, Bank Data oranye, Simulasi biru, Strategi
  kuning, Latihan pink, Catatan ungu) plus border tinta.
- State aktif: isian oranye, teks tinta, `--shadow-sm`, dan `aria-current="page"`.
- Link boleh wrap; tidak ada lagi scroll horizontal tersembunyi.

### Footer

Kartu putih ber-border 2.5px dengan `--shadow`, tiga kolom yang menjadi satu
kolom di bawah 720px:

1. Nama + disclaimer "bukan situs resmi BKN".
2. Stiker pill `Made with 💖 for Gen Z` (isian pink, diputar −1.5°).
3. Penyusun + tautan repositori yang sebenarnya.

### Timer Pill

Muncul di nav hanya saat timer berjalan. Latar tinta, teks putih, ber-border
2.5px dengan `--shadow-sm`. Kliknya menavigasi ke `#/simulasi`.

### Cards

Tiga jenis, jangan dicampur:

- **`.card`** — statis. Kartu subtes, diwarnai kuning/biru/pink per kolom.
- **`.jump`** — kartu navigasi beranda, enam warna berbeda, punya fisika tekan.
- **`.src`** — kartu tautan, putih, punya fisika tekan.

### Metrik vs Navigasi

Kartu metrik (`.stat-strip`) sengaja **tidak berwarna penuh**: sel putih dengan
garis aksen 6px di atas dan angka tinta besar. Hanya elemen yang bisa diklik yang
memakai isian penuh. Ini yang membedakan "informasi" dari "aksi" tanpa perlu
label tambahan.

### Ikon modul

Setiap kartu navigasi beranda punya ikon vektor 20px di kotak putih ber-border
(`.jump-ic`), berdampingan dengan nomor urut. Nomor menjaga urutan, ikon
mempercepat pengenalan. Ikon memutar −6° saat hover, sejalan dengan panah
`.jump-go` yang bergeser 5px.

### Badge hero

Chip dikelompokkan menjadi dua kluster berlabel ("Metrik ujian", "Isi catatan")
alih-alih satu baris panjang, sehingga hierarkinya terbaca di layar sempit.

### Accordion (Materi)

`.acc-head` adalah `<button>` selebar penuh dengan `aria-expanded`. Nomor topik
memakai kotak kuning ber-border. Saat selesai, nomor berubah jadi hijau dan
tombol menjadi `✓ Udah, lanjut`.

### Option Row (Kuis)

`.q-opt` adalah **`<button type="button">`**, bukan `div` — tanpa itu kuis tidak
bisa dijawab dengan keyboard. Setiap opsi adalah kartu kecil ber-border 2.5px
dengan `--shadow-sm`.

| State | Tampilan |
|---|---|
| Diam | putih, border tinta |
| Hover | isian kuning |
| `.correct` | isian hijau + `✓` |
| `.wrong` | isian pink + `✕` |
| Dijawab | semua `disabled`, opacity tetap 1 |

### Callouts

`.note-strip` berisi biru; varian `.warn` berisi kuning. Keduanya ber-border
2.5px dengan `--shadow-sm`. Teks selalu tinta.

### Tables

Dibungkus `.table-wrap` (radius 16px, `overflow:auto`). Header berisi kuning
dengan teks tinta. Kolom angka memakai `.num` dan `tabular-nums`.

---

## Interaction States

### Timer

| State | Tombol | Catatan |
|---|---|---|
| Idle | `Mulai` | `100:00` |
| Running | `Jeda` | pill muncul di nav |
| Paused | `Lanjut` | sisa waktu dibekukan |
| Kritis (≤5 menit) | `Lanjut` | angka jadi blok pink ber-border |
| Finished | `Mulai ulang` | `00:00`, pesan, alarm, judul berkedip |

Timer dihitung dari `Date.now()` terhadap `deadline`, bukan penambahan per
tick: browser men-throttle `setInterval` di tab latar, sehingga penghitung
per-tick akan melambat. Status disimpan di `sessionStorage` dan dipulihkan saat
reload.

### Kuis

Klik "Buka pembahasan" sebelum menjawab hanya menandai kunci — skor tidak
bertambah. Reset mengembalikan semuanya ke "belum dijawab".

---

## Neo-brutalism Layer

Dekorasi memakai CSS dan SVG inline — tidak ada berkas gambar.

| Elemen | Implementasi | Di mana |
|---|---|---|
| **Border tebal** | `2.5px solid #111111` | semua kartu, tombol, input |
| **Bayangan keras** | offset 2–8px tanpa blur | semua permukaan terangkat |
| **Kertas titik** | `radial-gradient` 1px, 18px | `body` |
| **Pita kartu** | `::before` garis diagonal diputar −1.6° | `.card` |
| **Coretan judul** | SVG bergelombang | `.page-head h2::after` |
| **Lingkaran nomor** | SVG elips tidak rapi | `.jump-num::before` |
| **Stabilo** | `linear-gradient` menutup 52–94% tinggi teks | `.kp li b`, `.q-explain b` |
| **Stiker** | rotasi −2.5° + bayangan keras | `.acc-flag`, `.q-badge` |
| **Ikon modul** | SVG 20px di kotak putih ber-border | `.jump-ic` |
| **Pop** | `@keyframes` skala 1 → 1.035 | `.q-opt.correct` |

### Aturan stabilo

Stabilo **selalu di belakang teks tinta**. Di dalam callout, warna induknya juga
tinta, jadi tidak ada risiko. Aturan pengaman
`.note-strip b,.acc-note b{color:var(--ink)}` tetap dipertahankan dan dijaga
`npm run kontras` — pernah ada regresi teks amber di atas stabilo kuning
(1.66:1) yang membuat teks nyaris tak terbaca.

### Nada tulisan

- Penulis menyebut diri **"aku"**, pembaca **"kamu"**. Jangan campur dengan
  "saya" atau "Anda".
- Slang hanya yang tahan lama: "nggak", "gas", "kuy", "mager".
- Emoji dipakai hemat, satu per kalimat, hanya di mikrocopy.

---

## Accessibility

1. **Kontras ≥ 4.5:1 untuk semua teks** — terverifikasi 90 pasangan, terendah
   5.88:1. Dijaga `npm run kontras`.
2. Semua kontrol adalah elemen native (`button`, `a`, `input`), bukan `div`.
3. Status tidak hanya warna — benar/salah memakai `✓`/`✕`, nav memakai
   `aria-current`.
4. ARIA secukupnya: `aria-expanded` + `aria-controls` pada toggle pembahasan,
   `aria-selected` pada tab, `role="status"` + `aria-live` pada pesan timer.
5. `:focus-visible` dengan outline 3px tinta, offset 2px.
6. `prefers-reduced-motion` mematikan fisika tekan dan smooth scroll.
7. Target sentuh minimal 32px tinggi.

---

## Storage Contract

| Key | Storage | Isi |
|---|---|---|
| `skdnotes.materi.done.v1` | `localStorage` | `{ "twk-nasionalisme": true, ... }` |
| `skdnotes.timer.v1` | `sessionStorage` | `{ running, deadline, remaining }` |

Keduanya dibungkus `try/catch`: storage rusak atau diblokir tidak boleh
mematikan halaman. Naikkan versi key (`.v1` → `.v2`) bila bentuk data berubah —
jangan migrasi diam-diam.

---

## Do's and Don'ts

1. **Do** bawa makna lewat latar. Teks berwarna semantik dilarang — itu yang
   membuat palet sebelumnya gagal.
2. **Do** pakai border 2.5px dan bayangan keras. Tidak ada bayangan blur.
3. **Do** beri fisika tekan hanya pada elemen yang bisa diklik.
4. **Do** sertakan ikon di samping warna untuk status benar/salah.
5. **Do** jalankan `npm run kontras` setiap mengubah token atau menambah pasangan.
6. **Do** pertahankan base body 16.5px / 1.68 — ini halaman bacaan panjang.
7. **Do** hormati `prefers-reduced-motion` pada setiap animasi baru.
8. **Do** jaga "ramai di kulit, tenang di isi": angka, pasal, dan disclaimer
   tanpa hiasan.
9. **Don't** memakai webfont, Tailwind CDN, atau aset eksternal apa pun.
10. **Don't** memakai putih murni sebagai latar halaman — selalu kertas krem.
11. **Don't** memakai `div`/`span` sebagai tombol, dan jangan bungkus elemen blok
    di dalam `span`.
12. **Don't** mengandalkan backend, cookie, atau analytics. State hanya di browser.
13. **Don't** menulis jumlah soal/topik manual di HTML — pakai `data-stat`.
14. **Don't** memakai slang tren yang cepat basi.
15. **Don't** mengklaim halaman ini resmi, dan jangan pernah menulis klaim
    "bocoran soal". Selalu tegaskan "bukan situs resmi BKN" plus tahun regulasi.

---

## Known Gaps

Dicatat jujur supaya tidak dianggap sudah selesai:

- Progres kuis belum persisten (materi sudah). Jika ditambahkan, pakai
  `sessionStorage` dengan key berversi, sejalan dengan timer.
- Tab materi belum mendukung navigasi panah kiri/kanan sesuai pola WAI-ARIA
  tablist.
- Beberapa nilai masih inline `style=""` (lebar bar alokasi, warna). Kandidat
  dipindah ke kelas utilitas saat disentuh lagi.
- Konten tidak ada di HTML awal, sehingga crawler dan pengguna tanpa JS tidak
  melihat 18 soal / 16 topik. Mitigasi saat ini: `<noscript>` penjelas.
- Emoji di mikrocopy (🤔 ☕ 🔥) ikut dibacakan pembaca layar karena berada di
  dalam teks. Jumlahnya sengaja dibatasi.
