/**
 * app.js
 * Main application logic for LAVA AI Data Center.
 *
 * - Manages watchlist symbols
 * - Generates realistic simulated OHLCV price data (no external API key needed)
 * - Handles symbol loading, chart type switching, indicator toggles
 * - Populates the accessible data table
 * - Designed for ease-of-use with TBI / PTSD considerations:
 *     • No auto-refreshing data streams
 *     • No unexpected popups or alerts
 *     • All updates are user-initiated or clearly announced
 */

(function () {
  'use strict';

  /* ── Watchlist ──────────────────────────────────────────────── */
  const DEFAULT_WATCHLIST = [
    { symbol: 'AAPL',   name: 'Apple Inc.',            basePrice: 185 },
    { symbol: 'MSFT',   name: 'Microsoft Corp.',        basePrice: 415 },
    { symbol: 'GOOGL',  name: 'Alphabet Inc.',          basePrice: 178 },
    { symbol: 'AMZN',   name: 'Amazon.com Inc.',        basePrice: 198 },
    { symbol: 'NVDA',   name: 'NVIDIA Corp.',           basePrice: 875 },
    { symbol: 'SPY',    name: 'S&P 500 ETF',            basePrice: 520 },
    { symbol: 'QQQ',    name: 'Nasdaq 100 ETF',         basePrice: 445 },
    { symbol: 'BTC',    name: 'Bitcoin (simulated)',    basePrice: 65000 },
    { symbol: 'ETH',    name: 'Ethereum (simulated)',   basePrice: 3400 },
    { symbol: 'GLD',    name: 'Gold ETF',               basePrice: 210 },
  ];

  /* ── State ──────────────────────────────────────────────────── */
  let currentSymbol   = 'AAPL';
  let currentInterval = '1D';
  let showVolume      = true;
  let showSma20       = false;
  let showSma50       = false;
  let currentChartType = 'candlestick';

  /* ── Random seeded generator (simple, deterministic per symbol+date) */
  function seededRand(seed) {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
  }

  /* ── Generate simulated OHLCV data ─────────────────────────── */
  function generateData(symbol, intervalKey) {
    const entry = DEFAULT_WATCHLIST.find(function (w) {
      return w.symbol === symbol.toUpperCase();
    });
    const base = entry ? entry.basePrice : 100;
    const symbolSeed = symbol.split('').reduce(function (acc, c) {
      return acc + c.charCodeAt(0);
    }, 0);

    const intervalConfig = {
      '1D': { bars: 252, stepMs: 86400000 },
      '1W': { bars: 104, stepMs: 7 * 86400000 },
      '1M': { bars: 60,  stepMs: 30 * 86400000 },
      '3M': { bars: 40,  stepMs: 91 * 86400000 },
      '1Y': { bars: 10,  stepMs: 365 * 86400000 },
    };

    const cfg = intervalConfig[intervalKey] || intervalConfig['1D'];
    const data = [];
    let price = base;

    // Start date: go back (bars * stepMs) from today
    const now = Date.now();
    const startTs = now - cfg.bars * cfg.stepMs;

    for (let i = 0; i < cfg.bars; i++) {
      const ts = Math.floor((startTs + i * cfg.stepMs) / 1000);
      const seed = symbolSeed * 137 + i * 31;

      const r1 = seededRand(seed);
      const r2 = seededRand(seed + 7);
      const r3 = seededRand(seed + 13);
      const r4 = seededRand(seed + 19);

      // Daily move: ±3% typical, occasional ±8%
      const isVolatile = seededRand(seed + 23) > 0.92;
      const maxMove = isVolatile ? 0.08 : 0.03;
      const move = (r1 - 0.48) * 2 * maxMove;

      const open  = price;
      const close = Math.max(0.01, price * (1 + move));
      const high  = Math.max(open, close) * (1 + r2 * 0.015);
      const low   = Math.min(open, close) * (1 - r3 * 0.015);
      const volume = Math.floor(base * 10000 * (0.5 + r4 * 1.5));

      data.push({
        time:   ts,
        open:   +open.toFixed(2),
        high:   +high.toFixed(2),
        low:    +low.toFixed(2),
        close:  +close.toFixed(2),
        volume: volume,
      });

      price = close;
    }

    return data;
  }

  /* ── Format numbers ─────────────────────────────────────────── */
  function formatPrice(n) {
    if (n === undefined || n === null) return '—';
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatVolume(n) {
    if (n === undefined || n === null) return '—';
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
  }

  function formatDate(unixTs) {
    return new Date(unixTs * 1000).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  /* ── Announce status ────────────────────────────────────────── */
  function status(msg) {
    if (window.lavaA11y) window.lavaA11y.announceStatus(msg);
  }

  /* ── Load symbol into chart ─────────────────────────────────── */
  function loadSymbol(symbol) {
    symbol = (symbol || 'AAPL').toUpperCase().trim();
    if (!symbol) return;

    currentSymbol = symbol;

    const entry = DEFAULT_WATCHLIST.find(function (w) { return w.symbol === symbol; });
    const name  = entry ? entry.name : symbol;

    // Update header
    const chartSymbolEl = document.getElementById('chart-symbol');
    const chartNameEl   = document.getElementById('chart-name');
    const tableSymbolEl = document.getElementById('table-symbol');
    if (chartSymbolEl) chartSymbolEl.textContent = symbol;
    if (chartNameEl)   chartNameEl.textContent = name;
    if (tableSymbolEl) tableSymbolEl.textContent = symbol;

    // Generate data
    status('Loading ' + symbol + '…');
    const data = generateData(symbol, currentInterval);

    // Chart
    window.lavaCharts.setChartType(currentChartType);
    window.lavaCharts.loadData(data, {
      showVolume: showVolume,
      showSma20:  showSma20,
      showSma50:  showSma50,
    });

    // Price display
    const last   = data[data.length - 1];
    const prev   = data[data.length - 2] || last;
    const change = last.close - prev.close;
    const changePct = (change / prev.close) * 100;
    const sign = change >= 0 ? '+' : '';

    const priceEl  = document.getElementById('price-current');
    const changeEl = document.getElementById('price-change');
    if (priceEl)  priceEl.textContent = '$' + formatPrice(last.close);
    if (changeEl) {
      changeEl.textContent = sign + formatPrice(change) + ' (' + sign + changePct.toFixed(2) + '%)';
      changeEl.className = 'price-change ' + (change >= 0 ? 'positive' : 'negative');
    }

    // Stats panel
    const highs  = data.map(function (d) { return d.high; });
    const lows   = data.map(function (d) { return d.low;  });
    const vols   = data.map(function (d) { return d.volume; });
    const totalVol = vols.reduce(function (a, b) { return a + b; }, 0);

    setText('stat-open',   '$' + formatPrice(last.open));
    setText('stat-high',   '$' + formatPrice(last.high));
    setText('stat-low',    '$' + formatPrice(last.low));
    setText('stat-close',  '$' + formatPrice(last.close));
    setText('stat-volume', formatVolume(last.volume));
    setText('stat-52h',    '$' + formatPrice(Math.max.apply(null, highs)));
    setText('stat-52l',    '$' + formatPrice(Math.min.apply(null, lows)));

    // Accessible screen-reader description
    const desc = document.getElementById('chart-description');
    if (desc) {
      desc.textContent =
        symbol + ' (' + name + '). ' +
        'Last price: $' + formatPrice(last.close) + '. ' +
        'Change: ' + sign + formatPrice(change) + ' (' + sign + changePct.toFixed(2) + '%). ' +
        '52-week high: $' + formatPrice(Math.max.apply(null, highs)) + '. ' +
        '52-week low: $'  + formatPrice(Math.min.apply(null, lows)) + '.';
    }

    // Data table
    populateTable(data, symbol);

    // Highlight active watchlist item
    document.querySelectorAll('.watchlist-item').forEach(function (el) {
      el.classList.toggle('active', el.dataset.symbol === symbol);
      el.setAttribute('aria-current', el.dataset.symbol === symbol ? 'true' : 'false');
    });

    status(symbol + ' loaded. Last: $' + formatPrice(last.close) + ' ' + sign + changePct.toFixed(2) + '%');

    void totalVol; // suppress unused-variable lint
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  /* ── Populate data table (accessible alternative) ────────────── */
  function populateTable(data, symbol) {
    const tbody = document.getElementById('data-table-body');
    if (!tbody) return;

    // Show most-recent 50 rows (reverse order, newest first)
    const rows = data.slice(-50).reverse();

    tbody.innerHTML = rows.map(function (d) {
      return (
        '<tr>' +
        '<td>' + formatDate(d.time)      + '</td>' +
        '<td>$' + formatPrice(d.open)   + '</td>' +
        '<td>$' + formatPrice(d.high)   + '</td>' +
        '<td>$' + formatPrice(d.low)    + '</td>' +
        '<td>$' + formatPrice(d.close)  + '</td>' +
        '<td>'  + formatVolume(d.volume) + '</td>' +
        '</tr>'
      );
    }).join('');
  }

  /* ── Build watchlist sidebar ────────────────────────────────── */
  function buildWatchlist() {
    const ul = document.getElementById('watchlist');
    if (!ul) return;

    ul.innerHTML = DEFAULT_WATCHLIST.map(function (item) {
      const data    = generateData(item.symbol, '1D');
      const last    = data[data.length - 1];
      const prev    = data[data.length - 2] || last;
      const change  = last.close - prev.close;
      const changePct = (change / prev.close) * 100;
      const sign    = change >= 0 ? '+' : '';
      const cls     = change >= 0 ? 'watchlist-change-pos' : 'watchlist-change-neg';

      return (
        '<li>' +
        '<button ' +
        '  class="watchlist-item" ' +
        '  data-symbol="' + item.symbol + '" ' +
        '  type="button" ' +
        '  aria-label="Load ' + item.symbol + ' — ' + item.name + '"' +
        '>' +
        '<span class="watchlist-symbol">' + item.symbol + '</span>' +
        '<span>' +
        '<span class="watchlist-price">$' + formatPrice(last.close) + '</span> ' +
        '<span class="' + cls + '">' + sign + changePct.toFixed(2) + '%</span>' +
        '</span>' +
        '</button>' +
        '</li>'
      );
    }).join('');

    /* Event delegation for watchlist clicks */
    ul.addEventListener('click', function (e) {
      const btn = e.target.closest('.watchlist-item');
      if (btn) loadSymbol(btn.dataset.symbol);
    });
  }

  /* ── DOMContentLoaded ──────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {

    /* Init chart library */
    if (window.lavaCharts) {
      window.lavaCharts.init();
    }

    /* Build watchlist */
    buildWatchlist();

    /* Load default symbol */
    loadSymbol(currentSymbol);

    /* Symbol search input */
    const input    = document.getElementById('symbol-input');
    const btnLoad  = document.getElementById('btn-load');

    if (btnLoad) {
      btnLoad.addEventListener('click', function () {
        loadSymbol(input ? input.value : currentSymbol);
      });
    }

    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') loadSymbol(input.value);
      });
    }

    /* Interval buttons */
    document.querySelectorAll('.btn-interval').forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentInterval = btn.dataset.interval;
        document.querySelectorAll('.btn-interval').forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        loadSymbol(currentSymbol);
      });
    });

    /* Chart type radio */
    document.querySelectorAll('input[name="chart-type"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (radio.checked) {
          currentChartType = radio.value;
          loadSymbol(currentSymbol);
        }
      });
    });

    /* Indicator checkboxes */
    const cbVolume = document.getElementById('ind-volume');
    const cbSma20  = document.getElementById('ind-sma20');
    const cbSma50  = document.getElementById('ind-sma50');

    if (cbVolume) {
      cbVolume.addEventListener('change', function () {
        showVolume = cbVolume.checked;
        loadSymbol(currentSymbol);
      });
    }
    if (cbSma20) {
      cbSma20.addEventListener('change', function () {
        showSma20 = cbSma20.checked;
        loadSymbol(currentSymbol);
      });
    }
    if (cbSma50) {
      cbSma50.addEventListener('change', function () {
        showSma50 = cbSma50.checked;
        loadSymbol(currentSymbol);
      });
    }

    /* Refresh theme when toggled (so chart colours update) */
    document.getElementById('btn-theme').addEventListener('click', function () {
      setTimeout(function () {
        if (window.lavaCharts) window.lavaCharts.refreshTheme();
      }, 50);
    });

  });

})();
