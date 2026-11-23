/* timer.js — timer 100 menit.
   Dihitung dari Date.now() terhadap deadline, bukan penambahan per tick, karena
   browser men-throttle setInterval di tab latar sehingga penghitung per-tick
   akan melambat. Status disimpan di sessionStorage agar tahan reload. */
window.SKD = window.SKD || {};
(function (SKD) {
  'use strict';

  var TOTAL = 100 * 60;
  var KEY = 'skdnotes.timer.v1';

  var remaining = TOTAL;
  var deadline = 0;
  var intervalId = null;
  var finished = false;
  var audioCtx = null;
  var titleFlashId = null;
  var titleBase = null;

  var display, toggleBtn, resetBtn, navTimer, navTimerText, timerNote;

  function format(sec) {
    sec = Math.max(0, sec);
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function remainingNow() {
    if (!deadline) return remaining;
    return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  }

  function renderTimer() {
    var txt = format(remaining);
    if (display) {
      display.textContent = txt;
      if (remaining <= 300) display.classList.add('warn');
      else display.classList.remove('warn');
    }
    if (navTimerText) navTimerText.textContent = txt;
    if (navTimer) navTimer.classList.toggle('done', finished || remaining === 0);
  }

  function setNote(msg) {
    if (timerNote) timerNote.textContent = msg || '';
  }

  function saveTimer() {
    try {
      if (!window.sessionStorage) return;
      window.sessionStorage.setItem(KEY, JSON.stringify({
        running: intervalId !== null,
        deadline: deadline,
        remaining: remaining
      }));
    } catch (e) {}
  }

  /* AudioContext disiapkan pada gesture pertama agar alarm masih boleh bunyi
     setelah 100 menit tanpa interaksi. */
  function primeAudio() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === 'suspended' && audioCtx.resume) audioCtx.resume();
    } catch (e) {}
  }

  function beep() {
    try {
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended' && audioCtx.resume) audioCtx.resume();
      var t0 = audioCtx.currentTime;
      for (var i = 0; i < 3; i++) {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        var t = t0 + i * 0.34;
        osc.type = 'sine';
        osc.frequency.value = 880;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        osc.start(t);
        osc.stop(t + 0.32);
      }
    } catch (e) {}
  }

  function flashTitle() {
    hentikanKedip();
    titleBase = document.title;
    var n = 0;
    titleFlashId = window.setInterval(function () {
      n += 1;
      document.title = (n % 2) ? 'Waktu habis — SKD Notes' : titleBase;
      if (n >= 12) hentikanKedip();
    }, 900);
  }

  function hentikanKedip() {
    if (titleFlashId) {
      window.clearInterval(titleFlashId);
      titleFlashId = null;
    }
    if (titleBase) {
      document.title = titleBase;
      titleBase = null;
    }
  }

  function finishTimer(quiet) {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
    finished = true;
    remaining = 0;
    renderTimer();
    if (toggleBtn) {
      toggleBtn.textContent = 'Mulai ulang';
      toggleBtn.classList.add('primary');
    }
    if (quiet) {
      setNote('Sesi sebelumnya sudah berakhir. Tekan Reset untuk mulai lagi.');
    } else {
      setNote('Waktu habis. Tekan Reset untuk memulai sesi baru.');
      beep();
      flashTitle();
    }
    saveTimer();
  }

  function tick() {
    remaining = remainingNow();
    if (remaining <= 0) {
      finishTimer(false);
      return;
    }
    renderTimer();
    if (remaining % 5 === 0) saveTimer();
  }

  function startTimer(resumed) {
    if (intervalId !== null) return;
    if (!resumed || !deadline || deadline <= Date.now()) {
      if (remaining <= 0) remaining = TOTAL;
      deadline = Date.now() + remaining * 1000;
    }
    finished = false;
    if (toggleBtn) {
      toggleBtn.textContent = 'Jeda';
      toggleBtn.classList.remove('primary');
    }
    if (navTimer) navTimer.classList.add('show');
    setNote('');
    intervalId = window.setInterval(tick, 250);
    renderTimer();
    saveTimer();
  }

  function pauseTimer() {
    if (intervalId === null) return;
    window.clearInterval(intervalId);
    intervalId = null;
    remaining = remainingNow();
    if (remaining <= 0) {
      finishTimer(false);
      return;
    }
    if (toggleBtn) {
      toggleBtn.textContent = 'Lanjut';
      toggleBtn.classList.add('primary');
    }
    renderTimer();
    saveTimer();
  }

  function loadTimer() {
    var raw = null;
    try {
      if (!window.sessionStorage) return;
      raw = window.sessionStorage.getItem(KEY);
    } catch (e) {
      return;
    }
    if (!raw) return;

    var saved = null;
    try {
      saved = JSON.parse(raw);
    } catch (e) {
      saved = null;
    }
    if (!saved || typeof saved.remaining !== 'number') return;

    remaining = Math.max(0, Math.min(TOTAL, Math.round(saved.remaining)));

    if (saved.running && typeof saved.deadline === 'number') {
      deadline = saved.deadline;
      remaining = remainingNow();
      if (remaining > 0) {
        startTimer(true);
        setNote('Timer dilanjutkan dari sesi sebelumnya.');
        return;
      }
      finishTimer(true);
      return;
    }

    if (remaining === 0) {
      finished = true;
      if (toggleBtn) toggleBtn.textContent = 'Mulai ulang';
    } else if (toggleBtn) {
      toggleBtn.textContent = remaining >= TOTAL ? 'Mulai' : 'Lanjut';
      toggleBtn.classList.add('primary');
    }
    renderTimer();
  }

  function init() {
    display = document.getElementById('timerDisplay');
    toggleBtn = document.getElementById('timerToggle');
    resetBtn = document.getElementById('timerReset');
    navTimer = document.getElementById('navTimer');
    navTimerText = document.getElementById('navTimerText');
    timerNote = document.getElementById('timerNote');

    if (display && toggleBtn && resetBtn) {
      toggleBtn.addEventListener('click', function () {
        if (intervalId !== null) {
          pauseTimer();
          return;
        }
        primeAudio();
        if (remaining <= 0) remaining = TOTAL;
        startTimer(false);
      });

      resetBtn.addEventListener('click', function () {
        if (intervalId !== null) {
          window.clearInterval(intervalId);
          intervalId = null;
        }
        hentikanKedip();
        remaining = TOTAL;
        deadline = 0;
        finished = false;
        if (toggleBtn) {
          toggleBtn.textContent = 'Mulai';
          toggleBtn.classList.add('primary');
        }
        setNote('');
        renderTimer();
        saveTimer();
      });

      document.addEventListener('pointerdown', function once() {
        document.removeEventListener('pointerdown', once, false);
        primeAudio();
      }, false);

      document.addEventListener('visibilitychange', function () {
        if (intervalId !== null && !document.hidden) tick();
      }, false);

      loadTimer();
      renderTimer();
    }

    if (navTimer) {
      navTimer.addEventListener('click', function () {
        try {
          location.hash = '#/simulasi';
        } catch (e) {}
      });
    }
  }

  SKD.timer = { init: init, hentikanKedip: hentikanKedip };
})(window.SKD);
