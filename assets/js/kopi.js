/* kopi.js — tombol apung "Traktir kopi" + modal QRIS.
   Ikut pola modul lain: dipanggil dari SKD.app setelah render. */
window.SKD = window.SKD || {};
(function (SKD) {
  'use strict';

  function init() {
    var btn = document.getElementById('kopiBtn');
    var backdrop = document.getElementById('kopiBackdrop');
    var tutup = document.getElementById('kopiTutup');
    var salin = document.getElementById('kopiSalin');
    var nmid = document.getElementById('kopiNmid');
    var status = document.getElementById('kopiStatus');
    if (!btn || !backdrop || !tutup) return;

    function buka() {
      backdrop.hidden = false;
      if (status) status.textContent = '';
      try { tutup.focus(); } catch (e) {}
    }

    function tutupModal() {
      backdrop.hidden = true;
      try { btn.focus(); } catch (e) {}
    }

    btn.addEventListener('click', buka);
    tutup.addEventListener('click', tutupModal);

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) tutupModal();
    });

    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && !backdrop.hidden) tutupModal();
    }, false);

    if (salin && nmid) {
      salin.addEventListener('click', function () {
        var teks = nmid.textContent || '';
        function ok() {
          if (status) status.textContent = 'NMID tersalin, tinggal tempel di e-wallet kamu.';
        }
        function gagal() {
          if (status) status.textContent = 'Gagal salin otomatis, catat manual ya: ' + teks;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(teks).then(ok, gagal);
        } else {
          try {
            var area = document.createElement('textarea');
            area.value = teks;
            document.body.appendChild(area);
            area.select();
            if (document.execCommand('copy')) ok();
            else gagal();
            document.body.removeChild(area);
          } catch (err) {
            gagal();
          }
        }
      });
    }
  }

  SKD.kopi = { init: init };
})(window.SKD);
