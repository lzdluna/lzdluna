/* materi.js — explorer materi. Topik dirender dari data/materi/*.json.
   Progres "sudah dipelajari" disimpan di localStorage dengan id topik yang
   sama seperti versi sebelumnya, sehingga penanda pengguna tidak hilang. */
window.SKD = window.SKD || {};
(function (SKD) {
  'use strict';

  var SUBTES = ['twk', 'tiu', 'tkp'];
  var STORE_KEY = 'skdnotes.materi.done.v1';

  var done = {};

  var explorer, panelsWrap, progressText, progressFill, searchInput, expandBtn;

  function muat() {
    try {
      var stored = window.localStorage && window.localStorage.getItem(STORE_KEY);
      if (stored) done = JSON.parse(stored) || {};
    } catch (e) {
      done = {};
    }
  }

  function simpan() {
    try {
      if (window.localStorage) window.localStorage.setItem(STORE_KEY, JSON.stringify(done));
    } catch (e) {}
  }

  function nomorDua(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function topik(isi) {
    var acc = SKD.el('div', { cls: 'acc', dataset: { materiId: isi.id } });

    var head = SKD.el('button', { cls: 'acc-head', attrs: { type: 'button', 'aria-expanded': 'false' } });
    head.appendChild(SKD.el('span', { cls: 'acc-num', text: nomorDua(isi.nomor) }));

    var title = SKD.el('span', { cls: 'acc-title' });
    title.appendChild(document.createTextNode(isi.judul));
    title.appendChild(SKD.el('em', { text: isi.subjudul }));
    head.appendChild(title);

    if (isi.flag) head.appendChild(SKD.el('span', { cls: 'acc-flag', text: isi.flag }));
    head.appendChild(SKD.el('span', { cls: 'acc-chev', attrs: { 'aria-hidden': 'true' }, text: '▾' }));
    acc.appendChild(head);

    var body = SKD.el('div', { cls: 'acc-body' });
    body.appendChild(SKD.el('p', { text: isi.ringkasan }));

    if (isi.poin && isi.poin.length) {
      if (isi.poinJudul) body.appendChild(SKD.el('h5', { text: isi.poinJudul }));
      var ul = SKD.el('ul', { cls: 'kp' });
      isi.poin.forEach(function (p) {
        var li = SKD.el('li');
        li.appendChild(SKD.kaya(p));
        ul.appendChild(li);
      });
      body.appendChild(ul);
    }

    if (isi.catatan) {
      var note = SKD.el('div', { cls: 'acc-note' });
      note.appendChild(SKD.kaya(isi.catatan));
      body.appendChild(note);
    }

    body.appendChild(SKD.el('button', { cls: 'mark-btn', attrs: { type: 'button' }, text: 'Tandai sudah dipelajari' }));
    acc.appendChild(body);

    return acc;
  }

  function panel(key, isi, aktif) {
    var p = SKD.el('div', {
      cls: 'me-panel' + (aktif ? ' active' : ''),
      attrs: { 'data-panel': key, role: 'tabpanel' }
    });

    isi.topik.forEach(function (t) {
      p.appendChild(topik(t));
    });

    p.appendChild(SKD.el('div', { cls: 'me-empty', text: 'Tidak ada topik yang cocok dengan pencarian.' }));
    return p;
  }

  function activePanel() {
    return explorer ? explorer.querySelector('.me-panel.active') : null;
  }

  function updateProgress() {
    var p = activePanel();
    if (!p) return;
    var items = p.querySelectorAll('.acc');
    var total = items.length;
    var count = 0;
    SKD.masing(items, function (it) {
      if (it.classList.contains('done')) count++;
    });
    if (progressText) progressText.textContent = count + '/' + total + ' ditandai';
    if (progressFill) progressFill.style.width = total ? (count / total) * 100 + '%' : '0%';
  }

  function applyDone() {
    SKD.masing(explorer.querySelectorAll('.acc'), function (acc) {
      var id = acc.getAttribute('data-materi-id');
      var btn = acc.querySelector('.mark-btn');
      if (done[id]) {
        acc.classList.add('done');
        if (btn) {
          btn.classList.add('on');
          btn.textContent = '✓ Sudah dipelajari';
        }
      }
    });
  }

  function filterPanel() {
    var p = activePanel();
    if (!p) return;
    var q = ((searchInput && searchInput.value) || '').toLowerCase().trim();
    var items = p.querySelectorAll('.acc');
    var shown = 0;

    SKD.masing(items, function (it) {
      var head = it.querySelector('.acc-head');
      var body = it.querySelector('.acc-body');
      var text = ((head ? head.textContent : '') + ' ' + (body ? body.textContent : '')).toLowerCase();
      var match = !q || text.indexOf(q) !== -1;
      it.style.display = match ? '' : 'none';
      if (match) shown++;
    });

    var empty = p.querySelector('.me-empty');
    if (empty) empty.style.display = shown ? 'none' : 'block';
  }

  function init(data) {
    explorer = document.getElementById('materiExplorer');
    if (!explorer) return;

    panelsWrap = document.getElementById('materiPanels');
    progressText = explorer.querySelector('.me-progress-text');
    progressFill = explorer.querySelector('.me-bar i');
    searchInput = explorer.querySelector('#meSearch');
    expandBtn = explorer.querySelector('.me-expand');

    muat();

    if (panelsWrap) {
      SKD.kosong(panelsWrap);
      SUBTES.forEach(function (key, i) {
        if (data[key]) panelsWrap.appendChild(panel(key, data[key], i === 0));
      });
    }

    var tabs = explorer.querySelectorAll('.me-tab');
    var panels = explorer.querySelectorAll('.me-panel');

    SKD.masing(tabs, function (tab) {
      tab.addEventListener('click', function () {
        SKD.masing(tabs, function (t) {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        var key = tab.getAttribute('data-tab');
        SKD.masing(panels, function (pn) {
          if (pn.getAttribute('data-panel') === key) pn.classList.add('active');
          else pn.classList.remove('active');
        });

        updateProgress();
        filterPanel();
      });
    });

    SKD.masing(explorer.querySelectorAll('.acc-head'), function (head) {
      head.addEventListener('click', function () {
        var acc = head.closest ? head.closest('.acc') : head.parentNode;
        if (!acc) return;
        var open = acc.classList.toggle('open');
        head.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });

    SKD.masing(explorer.querySelectorAll('.mark-btn'), function (btn) {
      btn.addEventListener('click', function (e) {
        if (e.stopPropagation) e.stopPropagation();
        var acc = btn.closest ? btn.closest('.acc') : null;
        if (!acc) return;
        var id = acc.getAttribute('data-materi-id');
        if (!id) return;

        if (done[id]) {
          delete done[id];
          acc.classList.remove('done');
          btn.classList.remove('on');
          btn.textContent = 'Tandai sudah dipelajari';
        } else {
          done[id] = true;
          acc.classList.add('done');
          btn.classList.add('on');
          btn.textContent = '✓ Sudah dipelajari';
        }
        simpan();
        updateProgress();
      });
    });

    if (expandBtn) {
      expandBtn.addEventListener('click', function () {
        var p = activePanel();
        if (!p) return;
        var items = p.querySelectorAll('.acc');
        var anyClosed = false;

        SKD.masing(items, function (it) {
          if (it.style.display !== 'none' && !it.classList.contains('open')) anyClosed = true;
        });

        SKD.masing(items, function (it) {
          if (it.style.display === 'none') return;
          if (anyClosed) it.classList.add('open');
          else it.classList.remove('open');
          var head = it.querySelector('.acc-head');
          if (head) head.setAttribute('aria-expanded', anyClosed ? 'true' : 'false');
        });

        expandBtn.textContent = anyClosed ? 'Tutup semua' : 'Buka semua';
      });
    }

    if (searchInput) searchInput.addEventListener('input', filterPanel);

    applyDone();
    updateProgress();
    filterPanel();
  }

  SKD.materi = { init: init };
})(window.SKD);
