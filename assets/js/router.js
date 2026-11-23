/* router.js — navigasi berbasis hash. Aman untuk hosting statis (GitHub Pages),
   tidak butuh konfigurasi 404 dan tidak memicu request baru. */
window.SKD = window.SKD || {};
(function (SKD) {
  'use strict';

  var TITLES = {
    beranda: 'SKD Notes — Materi, Bank Data & Simulasi CPNS',
    materi: 'Materi — SKD Notes',
    bankdata: 'Bank Data — SKD Notes',
    simulasi: 'Simulasi — SKD Notes',
    strategi: 'Strategi — SKD Notes',
    latihan: 'Latihan Kilat — SKD Notes',
    catatan: 'Catatan — SKD Notes'
  };

  var pageEls = [];
  var navEls = [];

  function getPageId() {
    var h = (location.hash || '').replace(/^#\/?/, '').split('?')[0].trim();
    if (!h) return 'beranda';
    for (var i = 0; i < pageEls.length; i++) {
      if (pageEls[i].getAttribute('data-page') === h) return h;
    }
    return 'beranda';
  }

  function showPage(id) {
    if (SKD.timer && SKD.timer.hentikanKedip) SKD.timer.hentikanKedip();

    SKD.masing(pageEls, function (p) {
      if (p.getAttribute('data-page') === id) {
        p.classList.add('active');
        p.style.display = 'block';
      } else {
        p.classList.remove('active');
        p.style.display = 'none';
      }
    });

    SKD.masing(navEls, function (a) {
      if (a.getAttribute('data-nav') === id) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      } else {
        a.classList.remove('active');
        a.removeAttribute('aria-current');
      }
    });

    document.title = TITLES[id] || TITLES.beranda;
  }

  function navigateTo(id) {
    showPage(id);
    try {
      window.scrollTo(0, 0);
    } catch (e) {}
  }

  function init() {
    pageEls = document.querySelectorAll('.page');
    navEls = document.querySelectorAll('[data-nav]');

    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var el = e.target;
      while (el && el !== document) {
        if (el.tagName === 'A') {
          var href = el.getAttribute('href') || '';
          if (href.indexOf('#/') === 0) {
            e.preventDefault();
            /* Biarkan hashchange yang menangani agar riwayat browser tetap utuh. */
            if (location.hash === href) navigateTo(href.substring(2).split('?')[0]);
            else location.hash = href;
            return;
          }
          break;
        }
        el = el.parentNode;
      }
    }, false);

    window.addEventListener('hashchange', function () {
      navigateTo(getPageId());
    }, false);

    navigateTo(getPageId());
  }

  SKD.router = { init: init, buka: navigateTo };
})(window.SKD);
