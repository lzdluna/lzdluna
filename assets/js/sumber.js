/* sumber.js — kartu tautan Bank Data dari data/sumber.json. */
window.SKD = window.SKD || {};
(function (SKD) {
  'use strict';

  function kartu(s) {
    var a = SKD.el('a', {
      cls: 'src',
      attrs: {
        href: s.url,
        target: '_blank',
        rel: 'noopener noreferrer'
      }
    });

    a.appendChild(SKD.el('span', { cls: 'src-ic', text: s.ikon }));

    var body = SKD.el('div', { cls: 'src-body' });
    body.appendChild(SKD.el('h4', { text: s.judul }));
    body.appendChild(SKD.el('p', { text: s.deskripsi }));
    body.appendChild(SKD.el('span', { cls: 'src-tag', text: s.tag }));
    a.appendChild(body);

    return a;
  }

  function isi(id, daftar) {
    var wrap = document.getElementById(id);
    if (!wrap) return 0;
    SKD.kosong(wrap);
    (daftar || []).forEach(function (s) {
      wrap.appendChild(kartu(s));
    });
    return (daftar || []).length;
  }

  function init(sumber) {
    var resmi = isi('sumberResmi', sumber.resmi);
    var tambahan = isi('sumberTambahan', sumber.tambahan);
    return resmi + tambahan;
  }

  SKD.sumber = { init: init };
})(window.SKD);
