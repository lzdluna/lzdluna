/* render.js — helper DOM.
   Semua teks masuk lewat textContent, tidak pernah innerHTML, supaya isi berkas
   data tidak mungkin berubah menjadi markup. */
window.SKD = window.SKD || {};
(function (SKD) {
  'use strict';

  /** camelCase -> kebab-case, untuk nama atribut data-*. */
  function kebab(nama) {
    return String(nama).replace(/[A-Z]/g, function (m) {
      return '-' + m.toLowerCase();
    });
  }

  /** Buat elemen. opsi: { cls, text, attrs, dataset } */
  function el(tag, opsi) {
    var node = document.createElement(tag);
    if (!opsi) return node;
    if (opsi.cls) node.className = opsi.cls;
    if (opsi.text !== undefined && opsi.text !== null) node.textContent = opsi.text;
    if (opsi.attrs) {
      for (var a in opsi.attrs) {
        if (opsi.attrs[a] !== null && opsi.attrs[a] !== undefined) {
          node.setAttribute(a, opsi.attrs[a]);
        }
      }
    }
    if (opsi.dataset) {
      for (var d in opsi.dataset) {
        node.setAttribute('data-' + kebab(d), opsi.dataset[d]);
      }
    }
    return node;
  }

  /** Ubah "**tebal**" menjadi <b>. Penanda harus berpasangan (dijaga validator). */
  function kaya(teks) {
    var frag = document.createDocumentFragment();
    var bagian = String(teks === undefined || teks === null ? '' : teks).split('**');
    for (var i = 0; i < bagian.length; i++) {
      if (!bagian[i]) continue;
      if (i % 2 === 1) {
        frag.appendChild(el('b', { text: bagian[i] }));
      } else {
        frag.appendChild(document.createTextNode(bagian[i]));
      }
    }
    return frag;
  }

  /** Isi elemen dengan teks yang mendukung penanda **tebal**. */
  function isi(node, teks) {
    kosong(node);
    node.appendChild(kaya(teks));
    return node;
  }

  function kosong(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
    return node;
  }

  /** Iterasi aman; galat satu elemen tidak menghentikan sisanya. */
  function masing(nodes, fn) {
    if (!nodes) return;
    for (var i = 0; i < nodes.length; i++) {
      try {
        fn(nodes[i], i);
      } catch (e) {
        if (window.console) console.error(e);
      }
    }
  }

  function aturSibuk(id, sibuk) {
    var node = document.getElementById(id);
    if (!node) return;
    if (sibuk) node.setAttribute('aria-busy', 'true');
    else node.removeAttribute('aria-busy');
  }

  SKD.el = el;
  SKD.kaya = kaya;
  SKD.isi = isi;
  SKD.kosong = kosong;
  SKD.masing = masing;
  SKD.aturSibuk = aturSibuk;
})(window.SKD);
