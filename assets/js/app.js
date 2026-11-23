/* app.js — bootstrap.
   Urutan: muat data -> periksa -> render -> inisialisasi modul.
   Tanpa backend: semua state ada di browser, data berupa berkas statis. */
window.SKD = window.SKD || {};
(function (SKD) {
  'use strict';

  var SUBTES = ['twk', 'tiu', 'tkp'];
  var SIBUK = ['subtesGrid', 'materiExplorer', 'materiPanels', 'sumberResmi', 'sumberTambahan', 'quizList'];

  function ambil(jalur) {
    return fetch('data/' + jalur, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('data/' + jalur + ' (HTTP ' + r.status + ')');
      return r.json();
    });
  }

  function tampilkanGalat(pesan) {
    var box = document.getElementById('galat');
    if (!box) return;

    SKD.kosong(box);
    var strip = SKD.el('div', { cls: 'note-strip warn' });
    strip.appendChild(SKD.el('b', { text: 'Data gagal dimuat. ' }));
    strip.appendChild(document.createTextNode(pesan));

    var btn = SKD.el('button', {
      cls: 't-btn',
      attrs: { type: 'button' },
      text: 'Coba lagi'
    });
    btn.style.marginTop = '12px';
    btn.addEventListener('click', function () {
      location.reload();
    });

    strip.appendChild(document.createElement('br'));
    strip.appendChild(btn);
    box.appendChild(strip);
    box.hidden = false;
  }

  function selesaiSibuk() {
    SIBUK.forEach(function (id) {
      SKD.aturSibuk(id, false);
    });
  }

  /* --------------------------------------------------------------- data */

  function periksa(materi, soal) {
    var idMateri = {};

    SUBTES.forEach(function (k) {
      if (!materi[k] || !Array.isArray(materi[k].topik)) {
        throw new Error('materi/' + k + '.json tidak lengkap');
      }
      materi[k].topik.forEach(function (t) {
        if (!t.id) throw new Error('materi/' + k + '.json: topik tanpa id');
        if (idMateri[t.id]) throw new Error('id materi ganda: ' + t.id);
        idMateri[t.id] = true;
      });

      if (!soal[k] || !Array.isArray(soal[k].soal)) {
        throw new Error('soal/' + k + '.json tidak lengkap');
      }
      soal[k].soal.forEach(function (s) {
        var kunci = (s.opsi || []).filter(function (o) {
          return o.benar === true;
        }).length;
        if (kunci !== 1) throw new Error('soal ' + s.id + ' punya ' + kunci + ' kunci jawaban');
      });
    });
  }

  function hitungStats(konfigurasi, materi, soal) {
    var s = {
      totalSubtes: konfigurasi.subtes.length,
      skdSoal: konfigurasi.skd.soal,
      skdMenit: konfigurasi.skd.menit,
      skorMaks: konfigurasi.skd.skorMaks,
      /* Detik per soal dibulatkan ke bawah: 6000 / 110 = 54,5 -> "54 detik",
         sama seperti teks versi sebelumnya. */
      detikPerSoal: Math.floor((konfigurasi.skd.menit * 60) / konfigurasi.skd.soal),
      totalTopik: 0,
      totalSoal: 0
    };

    SUBTES.forEach(function (k) {
      var t = materi[k] ? materi[k].topik.length : 0;
      var q = soal[k] ? soal[k].soal.length : 0;
      s['topik' + k.toUpperCase()] = t;
      s['soal' + k.toUpperCase()] = q;
      s.totalTopik += t;
      s.totalSoal += q;
    });

    /* Target total dijumlahkan dari rentang tiap subtes, bukan ditulis manual. */
    var min = 0;
    var max = 0;
    konfigurasi.subtes.forEach(function (sub) {
      var bagian = String(sub.targetAman || '').split(/[\u2013\u2014-]/).map(Number);
      if (bagian.length === 2 && isFinite(bagian[0]) && isFinite(bagian[1])) {
        min += bagian[0];
        max += bagian[1];
      }
    });
    s.targetTotal = min && max ? min + '\u2013' + max : '\u2014';

    return s;
  }

  function isiStats(stats) {
    SKD.masing(document.querySelectorAll('[data-stat]'), function (node) {
      var k = node.getAttribute('data-stat');
      if (Object.prototype.hasOwnProperty.call(stats, k)) {
        node.textContent = String(stats[k]);
      }
    });
  }

  /* ------------------------------------------------------------- render */

  function kartuSubtes(sub) {
    var card = SKD.el('article', { cls: 'card' });
    card.appendChild(SKD.el('span', { cls: 'card-kode', text: sub.kode }));
    card.appendChild(SKD.el('h3', { text: sub.nama }));
    card.appendChild(SKD.el('p', { cls: 'card-sub', text: sub.subjudul }));

    var row = SKD.el('div', { cls: 'stat-row' });
    [['Soal', sub.soal], ['Passing', sub.passing], ['Maks', sub.maks]].forEach(function (pasangan) {
      var stat = SKD.el('div', { cls: 'stat' });
      stat.appendChild(SKD.el('span', { cls: 'stat-val', text: String(pasangan[1]) }));
      stat.appendChild(SKD.el('span', { cls: 'stat-lbl', text: pasangan[0] }));
      row.appendChild(stat);
    });
    card.appendChild(row);

    var ul = SKD.el('ul', { cls: 'cakupan' });
    (sub.cakupan || []).forEach(function (c) {
      var li = SKD.el('li');
      li.appendChild(SKD.kaya(c));
      ul.appendChild(li);
    });
    card.appendChild(ul);

    return card;
  }

  function isiGrid(konfigurasi) {
    var grid = document.getElementById('subtesGrid');
    if (!grid) return;
    SKD.kosong(grid);
    konfigurasi.subtes.forEach(function (sub) {
      grid.appendChild(kartuSubtes(sub));
    });
  }

  function baris(label, soal, perSoal, maks, passing, target) {
    var tr = SKD.el('tr');
    tr.appendChild(SKD.el('td', { cls: 'td-strong', text: label }));
    tr.appendChild(SKD.el('td', { cls: 'num', text: String(soal) }));
    tr.appendChild(SKD.el('td', { cls: 'num', text: String(perSoal) }));
    tr.appendChild(SKD.el('td', { cls: 'num', text: String(maks) }));
    tr.appendChild(SKD.el('td', { cls: 'num', text: String(passing) }));
    tr.appendChild(SKD.el('td', { cls: 'num', text: String(target) }));
    return tr;
  }

  function isiTabel(konfigurasi, stats) {
    var body = document.getElementById('tabelAmbangBatas');
    if (!body) return;
    SKD.kosong(body);
    konfigurasi.subtes.forEach(function (s) {
      body.appendChild(baris(s.kode, s.soal, s.nilaiPerSoal, s.maks, s.passing, s.targetAman));
    });
    body.appendChild(baris('Total', stats.skdSoal, '\u2014', stats.skorMaks, '\u2014', stats.targetTotal));
  }

  /* -------------------------------------------------------------- mulai */

  function mulai(konfigurasi, sumber, materi, soal) {
    periksa(materi, soal);

    var stats = hitungStats(konfigurasi, materi, soal);
    isiStats(stats);
    isiGrid(konfigurasi);
    isiTabel(konfigurasi, stats);

    SKD.materi.init(materi);
    SKD.sumber.init(sumber);
    SKD.quiz.init(soal);

    SKD.router.init();
    SKD.timer.init();
  }

  function boot() {
    if (location.protocol === 'file:') {
      tampilkanGalat(
        'Halaman ini baca data dari berkas JSON, jadi nggak bisa dibuka langsung ' +
        'dengan double-click. Jalankan "npm run serve", lalu buka alamat yang muncul.'
      );
      selesaiSibuk();
      return;
    }

    var permintaan = [ambil('konfigurasi.json'), ambil('sumber.json')]
      .concat(SUBTES.map(function (k) { return ambil('materi/' + k + '.json'); }))
      .concat(SUBTES.map(function (k) { return ambil('soal/' + k + '.json'); }));

    Promise.all(permintaan)
      .then(function (hasil) {
        var konfigurasi = hasil[0];
        var sumber = hasil[1];
        var materi = {};
        var soal = {};

        SUBTES.forEach(function (k, i) {
          materi[k] = hasil[2 + i];
          soal[k] = hasil[5 + i];
        });

        mulai(konfigurasi, sumber, materi, soal);
        selesaiSibuk();
      })
      .catch(function (e) {
        if (window.console) console.error(e);
        tampilkanGalat(
          'Datanya gagal dimuat nih. Cek koneksi lalu muat ulang. (' +
          (e && e.message ? e.message : 'galat tidak diketahui') + ')'
        );
        selesaiSibuk();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, false);
  } else {
    boot();
  }
})(window.SKD);
