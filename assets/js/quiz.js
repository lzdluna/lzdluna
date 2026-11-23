/* quiz.js — latihan kilat. Soal dirender dari data/soal/*.json.
   Opsi memakai <button> supaya bisa dijawab dengan keyboard, dan status
   benar/salah ditandai ikon, bukan hanya warna. */
window.SKD = window.SKD || {};
(function (SKD) {
  'use strict';

  var SUBTES = ['twk', 'tiu', 'tkp'];

  var stats = { done: 0, correct: 0, wrong: 0 };
  var resets = [];
  var doneEl, correctEl, wrongEl, resetBtn;

  function badgeClass(key) {
    return key === 'twk' ? 'q-badge' : 'q-badge ' + key;
  }

  /** Baris jawaban disusun dari opsi yang bertanda benar, bukan diduplikasi di data. */
  function labelJawaban(key, opsi) {
    if (!opsi) return 'Jawaban:';
    if (key === 'tkp') return 'Jawaban terbaik: ' + opsi.kode + '.';
    return 'Jawaban: ' + opsi.kode + '. ' + opsi.teks + '.';
  }

  function kartu(key, label, s) {
    var art = SKD.el('article', { cls: 'q-item', dataset: { quiz: '', subtes: key } });

    var head = SKD.el('div', { cls: 'q-head' });
    head.appendChild(SKD.el('span', { cls: badgeClass(key), text: label }));
    art.appendChild(head);

    art.appendChild(SKD.el('p', { cls: 'q-text', text: s.teks }));

    var opts = SKD.el('div', { cls: 'q-opts' });
    var benar = null;
    s.opsi.forEach(function (o) {
      var btn = SKD.el('button', {
        cls: 'q-opt',
        attrs: { type: 'button' },
        dataset: { opt: '' },
        text: o.kode + '. ' + o.teks
      });
      if (o.benar) {
        btn.setAttribute('data-correct', '');
        benar = o;
      }
      opts.appendChild(btn);
    });
    art.appendChild(opts);

    art.appendChild(SKD.el('button', {
      cls: 'q-toggle',
      attrs: { type: 'button' },
      text: 'Buka pembahasan'
    }));

    var explain = SKD.el('div', { cls: 'q-explain' });
    explain.appendChild(SKD.el('b', { text: labelJawaban(key, benar) }));
    explain.appendChild(document.createTextNode(' ' + s.pembahasan));
    art.appendChild(explain);

    return art;
  }

  function bind(item, nomor) {
    var toggle = item.querySelector('.q-toggle');
    var explain = item.querySelector('.q-explain');
    var opts = item.querySelectorAll('[data-opt]');
    var answered = false;

    if (!toggle || !explain) return;

    var explainId = 'q-explain-' + nomor;
    explain.id = explainId;
    explain.setAttribute('aria-live', 'polite');
    toggle.setAttribute('aria-controls', explainId);
    toggle.setAttribute('aria-expanded', 'false');

    function setOpen(open) {
      if (open) explain.classList.add('open');
      else explain.classList.remove('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Tutup pembahasan' : 'Buka pembahasan';
    }

    toggle.addEventListener('click', function () {
      var isOpen = !explain.classList.contains('open');
      setOpen(isOpen);
      if (isOpen && !answered) {
        SKD.masing(opts, function (opt) {
          if (opt.hasAttribute('data-correct')) opt.classList.add('correct');
        });
      }
    });

    SKD.masing(opts, function (opt) {
      opt.addEventListener('click', function () {
        if (answered) return;
        answered = true;
        var isCorrect = opt.hasAttribute('data-correct');

        SKD.masing(opts, function (o) {
          o.disabled = true;
          if (o.hasAttribute('data-correct')) o.classList.add('correct');
        });
        if (!isCorrect) opt.classList.add('wrong');

        if (isCorrect) stats.correct++;
        else stats.wrong++;
        stats.done++;
        updateStats();
        setOpen(true);

        /* Tombol yang diklik menjadi nonaktif; pindahkan fokus ke toggle. */
        try {
          toggle.focus({ preventScroll: true });
        } catch (e) {
          try {
            toggle.focus();
          } catch (e2) {}
        }
      });
    });

    resets.push(function () {
      answered = false;
      SKD.masing(opts, function (o) {
        o.classList.remove('correct');
        o.classList.remove('wrong');
        o.disabled = false;
      });
      setOpen(false);
    });
  }

  function updateStats() {
    if (doneEl) doneEl.textContent = stats.done;
    if (correctEl) correctEl.textContent = stats.correct;
    if (wrongEl) wrongEl.textContent = stats.wrong;
  }

  function renderFilter(data, total) {
    var wrap = document.getElementById('quizFilter');
    if (!wrap) return;
    SKD.kosong(wrap);

    var defs = [{ key: 'all', label: 'Semua', n: total }];
    SUBTES.forEach(function (key) {
      if (data[key]) defs.push({ key: key, label: data[key].label, n: data[key].soal.length });
    });

    defs.forEach(function (d, i) {
      var btn = SKD.el('button', {
        cls: 'qf-btn' + (i === 0 ? ' active' : ''),
        attrs: { type: 'button' },
        dataset: { filter: d.key },
        text: d.label + ' (' + d.n + ')'
      });
      btn.addEventListener('click', function () {
        SKD.masing(wrap.querySelectorAll('.qf-btn'), function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        SKD.masing(document.querySelectorAll('[data-quiz]'), function (item) {
          var match = d.key === 'all' || item.getAttribute('data-subtes') === d.key;
          item.style.display = match ? '' : 'none';
        });
      });
      wrap.appendChild(btn);
    });
  }

  function init(data) {
    doneEl = document.getElementById('qDone');
    correctEl = document.getElementById('qCorrect');
    wrongEl = document.getElementById('qWrong');
    resetBtn = document.getElementById('qReset');

    var list = document.getElementById('quizList');
    if (!list) return 0;
    SKD.kosong(list);

    var total = 0;
    var nomor = 0;

    SUBTES.forEach(function (key) {
      var isi = data[key];
      if (!isi) return;
      isi.soal.forEach(function (s) {
        nomor++;
        total++;
        var art = kartu(key, isi.label, s);
        list.appendChild(art);
        bind(art, nomor);
      });
    });

    renderFilter(data, total);

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        stats.done = 0;
        stats.correct = 0;
        stats.wrong = 0;
        SKD.masing(resets, function (fn) {
          fn();
        });
        updateStats();
      });
    }

    updateStats();
    return total;
  }

  SKD.quiz = { init: init };
})(window.SKD);
