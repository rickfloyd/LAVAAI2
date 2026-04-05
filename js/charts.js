/**
 * charts.js
 * Chart management for LAVA AI Data Center using Lightweight Charts.
 *
 * - Creates a seizure-safe, accessible price chart
 * - Creates a separate volume histogram
 * - Supports candlestick, line, area, and bar series types
 * - No auto-updating animation loops (seizure safety)
 * - Exposes window.lavaCharts for app.js
 */

(function () {
  'use strict';

  /* ── CSS variable helpers ──────────────────────────────────── */
  function cssVar(name) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }

  function buildChartTheme() {
    return {
      layout: {
        background:  { type: 'solid', color: cssVar('--color-bg') || '#1a1f2e' },
        textColor:   cssVar('--color-text-muted') || '#8a91a8',
        fontSize:    14,
        fontFamily:  "'Consolas', 'Courier New', monospace",
      },
      grid: {
        vertLines:   { color: cssVar('--color-border') || '#3a4160', style: 1 },
        horzLines:   { color: cssVar('--color-border') || '#3a4160', style: 1 },
      },
      crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
        vertLine: {
          color:        cssVar('--color-accent') || '#5b7fdd',
          width:        1,
          style:        2,
          labelBackgroundColor: cssVar('--color-accent') || '#5b7fdd',
        },
        horzLine: {
          color:        cssVar('--color-accent') || '#5b7fdd',
          width:        1,
          style:        2,
          labelBackgroundColor: cssVar('--color-accent') || '#5b7fdd',
        },
      },
      timeScale: {
        borderColor:      cssVar('--color-border') || '#3a4160',
        timeVisible:      true,
        secondsVisible:   false,
        fixLeftEdge:      true,
        fixRightEdge:     false,
      },
      rightPriceScale: {
        borderColor: cssVar('--color-border') || '#3a4160',
      },
    };
  }

  /* ── Colours for series ────────────────────────────────────── */
  function seriesColors() {
    return {
      upColor:    cssVar('--color-positive') || '#4caf87',
      downColor:  cssVar('--color-negative') || '#e07070',
      borderUpColor:   cssVar('--color-positive') || '#4caf87',
      borderDownColor: cssVar('--color-negative') || '#e07070',
      wickUpColor:   cssVar('--color-positive') || '#4caf87',
      wickDownColor: cssVar('--color-negative') || '#e07070',
      lineColor:    cssVar('--color-accent')   || '#5b7fdd',
      areaTopColor:    'rgba(91,127,221,0.28)',
      areaBottomColor: 'rgba(91,127,221,0.02)',
    };
  }

  /* ── State ──────────────────────────────────────────────────── */
  let priceChart    = null;
  let volumeChart   = null;
  let priceSeries   = null;
  let volumeSeries  = null;
  let sma20Series   = null;
  let sma50Series   = null;
  let currentType   = 'candlestick';

  /* ── Init ───────────────────────────────────────────────────── */
  function init() {
    const priceEl  = document.getElementById('chart-container');
    const volumeEl = document.getElementById('volume-container');

    if (!priceEl || !volumeEl) return;

    const theme = buildChartTheme();

    /* Price chart */
    priceChart = LightweightCharts.createChart(priceEl, {
      ...theme,
      width:  priceEl.clientWidth,
      height: priceEl.clientHeight || 400,
      handleScroll:  { vertTouchDrag: false },
      handleScale:   { axisPressedMouseMove: { price: false } },
    });

    /* Volume chart */
    volumeChart = LightweightCharts.createChart(volumeEl, {
      ...theme,
      width:  volumeEl.clientWidth,
      height: volumeEl.clientHeight || 80,
      rightPriceScale: { scaleMargins: { top: 0.1, bottom: 0 }, visible: false },
      timeScale: { visible: false },
      handleScroll: false,
      handleScale:  false,
    });

    volumeSeries = volumeChart.addHistogramSeries({
      color: 'rgba(91,127,221,0.4)',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });

    /* Sync crosshair time axis between charts */
    priceChart.timeScale().subscribeVisibleLogicalRangeChange(function (range) {
      if (range && volumeChart) {
        volumeChart.timeScale().setVisibleLogicalRange(range);
      }
    });

    /* Resize observer — no animation loop */
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(function () {
        if (priceChart && priceEl) {
          priceChart.applyOptions({ width: priceEl.clientWidth, height: priceEl.clientHeight });
        }
        if (volumeChart && volumeEl) {
          volumeChart.applyOptions({ width: volumeEl.clientWidth, height: volumeEl.clientHeight });
        }
      });
      ro.observe(priceEl);
      ro.observe(volumeEl);
    } else {
      window.addEventListener('resize', function () {
        if (priceChart && priceEl)   priceChart.applyOptions({ width: priceEl.clientWidth });
        if (volumeChart && volumeEl) volumeChart.applyOptions({ width: volumeEl.clientWidth });
      });
    }
  }

  /* ── Set chart type (removes old series, creates new) ──────── */
  function setChartType(type) {
    if (!priceChart) return;
    currentType = type;

    /* Remove existing price series */
    if (priceSeries) {
      priceChart.removeSeries(priceSeries);
      priceSeries = null;
    }
    if (sma20Series) { priceChart.removeSeries(sma20Series); sma20Series = null; }
    if (sma50Series) { priceChart.removeSeries(sma50Series); sma50Series = null; }

    const colors = seriesColors();

    switch (type) {
      case 'line':
        priceSeries = priceChart.addLineSeries({
          color: colors.lineColor,
          lineWidth: 2,
          priceLineVisible: true,
          lastValueVisible: true,
        });
        break;
      case 'area':
        priceSeries = priceChart.addAreaSeries({
          lineColor:   colors.lineColor,
          topColor:    colors.areaTopColor,
          bottomColor: colors.areaBottomColor,
          lineWidth:   2,
        });
        break;
      case 'bar':
        priceSeries = priceChart.addBarSeries({
          upColor:   colors.upColor,
          downColor: colors.downColor,
        });
        break;
      case 'candlestick':
      default:
        priceSeries = priceChart.addCandlestickSeries({
          upColor:   colors.upColor,
          downColor: colors.downColor,
          borderUpColor:   colors.borderUpColor,
          borderDownColor: colors.borderDownColor,
          wickUpColor:   colors.wickUpColor,
          wickDownColor: colors.wickDownColor,
        });
        break;
    }
  }

  /* ── Load data into chart ───────────────────────────────────── */
  function loadData(ohlcvData, options) {
    options = options || {};

    if (!priceSeries) {
      setChartType(currentType);
    }

    /* Price series */
    if (currentType === 'line' || currentType === 'area') {
      const lineData = ohlcvData.map(function (d) {
        return { time: d.time, value: d.close };
      });
      priceSeries.setData(lineData);
    } else {
      priceSeries.setData(ohlcvData);
    }

    /* Volume */
    if (volumeSeries && options.showVolume !== false) {
      const volData = ohlcvData.map(function (d) {
        return {
          time:  d.time,
          value: d.volume || 0,
          color: (d.close >= d.open)
            ? 'rgba(76,175,135,0.5)'
            : 'rgba(224,112,112,0.5)',
        };
      });
      volumeSeries.setData(volData);
    }

    /* SMAs */
    if (options.showSma20) { showSMA(ohlcvData, 20); }
    if (options.showSma50) { showSMA(ohlcvData, 50); }

    /* Fit to view */
    priceChart.timeScale().fitContent();
    if (volumeChart) volumeChart.timeScale().fitContent();
  }

  /* ── Simple Moving Average ──────────────────────────────────── */
  function calcSMA(data, period) {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      result.push({ time: data[i].time, value: sum / period });
    }
    return result;
  }

  function showSMA(data, period) {
    const smaData = calcSMA(data, period);
    const color = period === 20 ? '#d4a855' : '#c08a4e';
    const series = priceChart.addLineSeries({
      color:     color,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      title:     'SMA' + period,
    });
    series.setData(smaData);
    if (period === 20) sma20Series = series;
    else               sma50Series = series;
  }

  /* ── Refresh theme colours (called after theme toggle) ──────── */
  function refreshTheme() {
    if (!priceChart) return;
    const theme = buildChartTheme();
    priceChart.applyOptions(theme);
    if (volumeChart) volumeChart.applyOptions(theme);
  }

  /* ── Public API ─────────────────────────────────────────────── */
  window.lavaCharts = {
    init:         init,
    setChartType: setChartType,
    loadData:     loadData,
    refreshTheme: refreshTheme,
  };

})();
