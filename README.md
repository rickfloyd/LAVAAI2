# 🌋 LAVA AI Data Center

**An accessible financial charting platform built for the disabled community —
specifically designed for people with TBI, PTSD, and seizure disorders.**

> "I HAVE A TBI AND PTSD AND SEIZURES SO I AM BUILDING A BETTER DATA CENTER
> THAN TRADINGVIEW FOR THE DISABLED" — Project founder

---

## Overview

LAVA AI Data Center is a browser-based financial chart viewer that puts
**accessibility first**. While TradingView and similar platforms are powerful,
they were not designed with the needs of people with traumatic brain injury (TBI),
PTSD, or seizure disorders in mind. This project aims to change that.

---

## Accessibility Features

| Feature | Detail |
|---|---|
| 🔴 **Seizure Safety** | Zero flashing/strobing effects. All animations can be paused instantly with the ⏸ Motion button. Respects the OS `prefers-reduced-motion` setting automatically. |
| 🧠 **TBI / Cognitive** | Clean, uncluttered layout. Large readable fonts. Adjustable text size (A+ / A−). Calm colour palette reduces visual noise. |
| 💜 **PTSD Considerate** | No unexpected popups, alerts, or auto-updating tickers. All data updates are user-initiated. No sudden audio. Predictable UI. |
| ⬛ **High Contrast** | One-click high-contrast mode with yellow-on-black for maximum readability. |
| 🎯 **Focus Mode** | Hides sidebars and footer so you can concentrate on just the chart. |
| ♿ **Screen Reader** | Full ARIA labels, live regions, and an accessible data table below every chart. |
| ⌨️ **Keyboard Navigation** | Full keyboard support. Skip-navigation link. Focus indicators always visible. |
| 📋 **Data Table** | Every chart can be expanded as an accessible HTML table — ideal for screen readers and low-vision users. |

---

## Keyboard Shortcuts

| Keys | Action |
|---|---|
| `Alt+C` | Toggle high contrast |
| `Alt+M` | Toggle animations (seizure safety) |
| `Alt+F` | Toggle focus mode |
| `Alt++` | Increase text size |
| `Alt+−` | Decrease text size |
| `Enter` (in symbol box) | Load chart |

---

## How to Use

1. **Open `index.html`** in any modern browser — no build step, no install required.
2. Click a symbol in the **Watchlist** (left panel) to load its chart.
3. Or type a ticker in the **Symbol Search** box and press **Load** or `Enter`.
4. Switch between **Candlestick**, **Line** (gentler on eyes), **Area**, or **Bar** chart types.
5. Select an **Interval** (1D, 1W, 1M, 3M, 1Y).
6. Toggle **SMA 20 / SMA 50** and **Volume** indicators.
7. Use the **Accessibility toolbar** at the top-right to adjust contrast, text size, motion, and focus mode.

> **Note:** Price data is currently simulated for demonstration purposes.
> To use live market data, integrate a real market data API (e.g., Alpha Vantage,
> Polygon.io, Yahoo Finance) in `js/app.js` by replacing the `generateData()` function.

---

## File Structure

```
LAVAAI2/
├── index.html              Main dashboard
├── css/
│   ├── styles.css          Core styles (seizure-safe, accessible palette)
│   └── accessibility.css   Accessibility overrides (contrast, motion, font size, focus mode)
└── js/
    ├── accessibility.js    Accessibility controls + keyboard shortcuts + localStorage persistence
    ├── charts.js           Lightweight Charts integration (price + volume charts)
    └── app.js              Application logic (watchlist, data generation, event handling)
```

---

## Design Principles

1. **No flashing content** — WCAG Success Criterion 2.3.1 (Three Flashes).
2. **Minimum touch target 44×44 px** — WCAG 2.5.5.
3. **Focus indicators always visible** — WCAG 2.4.7.
4. **Colour is never the only conveyor of meaning** — WCAG 1.4.1.
5. **Reduced motion supported** — respects OS setting and provides a manual override.
6. **Text resizable to 200% without loss of content** — WCAG 1.4.4.

---

## Technology

- [Lightweight Charts](https://github.com/tradingview/lightweight-charts) — open-source charting library by TradingView (MIT licence)
- Pure HTML / CSS / JavaScript — no build step, no framework dependencies
- Preferences persisted via `localStorage`

---

## Roadmap

- [ ] Live market data API integration
- [ ] More indicators (RSI, MACD, Bollinger Bands)
- [ ] Voice navigation support
- [ ] Custom symbol list (add/remove)
- [ ] Export chart as image or CSV
- [ ] Mobile / touch optimisations

