/**
 * accessibility.js
 * Manages all accessibility controls for LAVA AI Data Center.
 *
 * Features:
 *  - High-contrast mode toggle
 *  - Reduced-motion toggle (seizure safety)
 *  - Font-size step controls
 *  - Theme toggle (dark calm / light calm)
 *  - Focus mode (hides side panels)
 *  - Keyboard shortcuts
 *  - Persists preferences via localStorage
 */

(function () {
  'use strict';

  /* ── Constants ─────────────────────────────────────────────── */
  const LS_KEY = 'lavaai_a11y';

  const TEXT_SIZES = ['text-size-sm', 'text-size-md', 'text-size-lg', 'text-size-xl', 'text-size-2xl'];
  const DEFAULT_TEXT_SIZE_INDEX = 1; // 'text-size-md'

  /* ── Load persisted state ───────────────────────────────────── */
  function loadPrefs() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY)) || {};
    } catch {
      return {};
    }
  }

  function savePrefs(prefs) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(prefs));
    } catch {
      /* storage unavailable — ignore */
    }
  }

  /* ── Apply preference to DOM ────────────────────────────────── */
  let prefs = loadPrefs();

  const body = document.body;

  // High contrast
  if (prefs.highContrast) {
    body.classList.add('high-contrast');
  }

  // Reduced motion (also auto-detect OS setting)
  const osReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefs.motionReduced || osReducedMotion) {
    body.classList.add('motion-reduced');
  }

  // Text size
  const textSizeIdx = (typeof prefs.textSizeIdx === 'number') ? prefs.textSizeIdx : DEFAULT_TEXT_SIZE_INDEX;
  applyTextSize(textSizeIdx);

  // Theme
  if (prefs.theme === 'light') {
    body.classList.remove('theme-calm');
    body.classList.add('theme-light');
  }

  // Focus mode
  if (prefs.focusMode) {
    body.classList.add('focus-mode');
  }

  /* ── Wire up buttons ────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    const btnContrast   = document.getElementById('btn-contrast');
    const btnMotion     = document.getElementById('btn-motion');
    const btnFontInc    = document.getElementById('btn-font-increase');
    const btnFontDec    = document.getElementById('btn-font-decrease');
    const btnTheme      = document.getElementById('btn-theme');
    const btnFocus      = document.getElementById('btn-focus');

    // Sync button aria-pressed states
    syncButtonStates();

    btnContrast.addEventListener('click', toggleContrast);
    btnMotion.addEventListener('click', toggleMotion);
    btnFontInc.addEventListener('click', increaseFontSize);
    btnFontDec.addEventListener('click', decreaseFontSize);
    btnTheme.addEventListener('click', toggleTheme);
    btnFocus.addEventListener('click', toggleFocusMode);

    /* ── Keyboard Shortcuts ────────────────────────────────── */
    document.addEventListener('keydown', function (e) {
      if (!e.altKey) return;
      switch (e.key) {
        case 'c':
        case 'C':
          e.preventDefault();
          toggleContrast();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMotion();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFocusMode();
          break;
        case '+':
        case '=':
          e.preventDefault();
          increaseFontSize();
          break;
        case '-':
        case '_':
          e.preventDefault();
          decreaseFontSize();
          break;
        default:
          break;
      }
    });

    function syncButtonStates() {
      if (btnContrast) btnContrast.setAttribute('aria-pressed', String(!!prefs.highContrast));
      if (btnMotion)   btnMotion.setAttribute('aria-pressed', String(!!(prefs.motionReduced || osReducedMotion)));
      if (btnFocus)    btnFocus.setAttribute('aria-pressed', String(!!prefs.focusMode));
    }

    function toggleContrast() {
      prefs.highContrast = !prefs.highContrast;
      body.classList.toggle('high-contrast', prefs.highContrast);
      btnContrast.setAttribute('aria-pressed', String(prefs.highContrast));
      savePrefs(prefs);
      announceStatus(prefs.highContrast ? 'High contrast mode ON' : 'High contrast mode OFF');
    }

    function toggleMotion() {
      prefs.motionReduced = !prefs.motionReduced;
      body.classList.toggle('motion-reduced', prefs.motionReduced || osReducedMotion);
      btnMotion.setAttribute('aria-pressed', String(!!(prefs.motionReduced || osReducedMotion)));
      savePrefs(prefs);
      announceStatus(prefs.motionReduced ? 'Animations paused (seizure safety ON)' : 'Animations enabled');
    }

    function increaseFontSize() {
      const current = (typeof prefs.textSizeIdx === 'number') ? prefs.textSizeIdx : DEFAULT_TEXT_SIZE_INDEX;
      const next = Math.min(current + 1, TEXT_SIZES.length - 1);
      prefs.textSizeIdx = next;
      applyTextSize(next);
      savePrefs(prefs);
      announceStatus('Text size: ' + TEXT_SIZES[next].replace('text-size-', ''));
    }

    function decreaseFontSize() {
      const current = (typeof prefs.textSizeIdx === 'number') ? prefs.textSizeIdx : DEFAULT_TEXT_SIZE_INDEX;
      const next = Math.max(current - 1, 0);
      prefs.textSizeIdx = next;
      applyTextSize(next);
      savePrefs(prefs);
      announceStatus('Text size: ' + TEXT_SIZES[next].replace('text-size-', ''));
    }

    function toggleTheme() {
      if (body.classList.contains('theme-light')) {
        body.classList.remove('theme-light');
        body.classList.add('theme-calm');
        prefs.theme = 'calm';
        btnTheme.textContent = '🌙 Theme';
        announceStatus('Dark theme active');
      } else {
        body.classList.remove('theme-calm');
        body.classList.add('theme-light');
        prefs.theme = 'light';
        btnTheme.textContent = '☀️ Theme';
        announceStatus('Light theme active');
      }
      savePrefs(prefs);
    }

    function toggleFocusMode() {
      prefs.focusMode = !prefs.focusMode;
      body.classList.toggle('focus-mode', prefs.focusMode);
      btnFocus.setAttribute('aria-pressed', String(prefs.focusMode));
      savePrefs(prefs);
      announceStatus(prefs.focusMode ? 'Focus mode ON — sidebars hidden' : 'Focus mode OFF');
    }
  });

  /* ── Helpers ────────────────────────────────────────────────── */
  function applyTextSize(index) {
    TEXT_SIZES.forEach(function (cls) { body.classList.remove(cls); });
    body.classList.add(TEXT_SIZES[index]);
  }

  /**
   * Announce a message to screen readers via the status bar.
   */
  function announceStatus(message) {
    const el = document.getElementById('status-message');
    if (el) el.textContent = message;
  }

  /* Expose announceStatus globally for other modules */
  window.lavaA11y = { announceStatus: announceStatus };

})();
