# 💰 BudgetViz — Expense & Budget Visualizer

A lightweight, client-side expense tracker built with pure HTML, CSS, and Vanilla JavaScript. No backend, no framework, no account required — just open and start tracking.

🌐 **Live Demo:** [nikodwicahyo.github.io/CodingCamp-21Sep26-NikoDwicahyo](https://nikodwicahyo.github.io/CodingCamp-21Sep26-NikoDwicahyo)

---

## ✨ Features

### Core
| Feature | Description |
|---|---|
| **Total Balance** | Real-time total expenditure display, updates instantly on every add or delete |
| **Add Transaction** | Form with Item Name, Amount, and Category — full inline validation |
| **Transaction List** | Scrollable history with category badges and per-item delete |
| **Pie Chart** | Interactive Chart.js visualization of spending by category, auto-updates on data change |

### Optional
- **Custom Categories** — Add your own categories inline via the `+ Baru` button next to the dropdown
- **Sort Transactions** — Order by Default, Largest Amount, Smallest Amount, or Category A–Z
- **Dark / Light Mode** — Toggle between themes; preference is saved across sessions

---

## 🖥️ Preview

```
┌──────────────────────────────────────────┐
│  💰 BudgetViz                        🌙 │  ← Header + Theme Toggle
├──────────────────────────────────────────┤
│         Total Pengeluaran                │
│              Rp 125.000                  │  ← Balance Card
├────────────────────┬─────────────────────┤
│  Tambah Transaksi  │  Pengeluaran per    │
│  ────────────────  │  Kategori           │
│  Nama Item         │                     │
│  Jumlah (Rp)       │    [Pie Chart]      │
│  Kategori + Baru   │                     │
│  [+ Tambah]        │                     │
├────────────────────┴─────────────────────┤
│  Riwayat Transaksi          [Sort ▾]     │
│  ─────────────────────────────────────   │
│  Kopi Susu    Food    Rp 25.000    🗑     │
│  Grab         Transport Rp 50.000  🗑     │
└──────────────────────────────────────────┘
```

---

## 🗂️ Project Structure

```
├── index.html          # App shell, semantic HTML5 structure
├── css/
│   └── style.css       # Design system, themes, responsive layout
├── js/
│   └── main.js         # All app logic — state, storage, render, events
├── .kiro/              # Kiro Builder ID configuration folder
└── README.md
```

---

## 🚀 Getting Started

This is a fully static app — no build step or install needed.

### Open directly
Double-click `index.html` to open in your browser.

> **Note:** Some browsers block CDN scripts on `file://` URLs. If the chart doesn't appear.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Semantic document structure, accessibility |
| CSS3 | Design system, CSS custom properties, responsive grid, animations |
| Vanilla JavaScript (ES6+) | DOM manipulation, state management, LocalStorage, CRUD |
| [Chart.js v4](https://www.chartjs.org/) | Pie chart visualization (via CDN) |
| [Lucide Icons](https://lucide.dev/) | SVG icon set (via CDN) |

---

## 💾 Data Storage

All data is stored in the browser's **LocalStorage** — nothing is sent to any server.

| Key | Contents |
|---|---|
| `ebv_transactions` | Array of all transaction objects |
| `ebv_categories` | Array of category names (including custom) |
| `ebv_theme` | Current theme (`light` or `dark`) |
| `ebv_sort` | Current sort preference |

To reset all data: open DevTools → Application → Local Storage → clear all `ebv_*` keys.

---

## 📱 Responsive Layout

| Breakpoint | Layout |
|---|---|
| Mobile (< 768px) | Single column — Balance → Form → Chart → List |
| Desktop (≥ 768px) | Balance full-width → Form + Chart side-by-side → List full-width |

---

## ♿ Accessibility

- Semantic HTML5 landmarks (`<header>`, `<main>`, `<footer>`, `<section>`)
- `aria-live` regions on balance and transaction list for screen reader updates
- Inline form errors with `aria-describedby` linking inputs to error messages
- Focus trap inside the custom category modal
- Full keyboard navigation (Tab, Enter, Escape)
- `prefers-reduced-motion` media query disables all animations
- `:focus-visible` styles for keyboard users

---

## 🌙 Dark / Light Mode

Click the moon/sun icon in the top-right corner to toggle themes. The preference persists across page refreshes via LocalStorage and is applied before first render to prevent a flash of the wrong theme.

---

## 📦 Deployment (GitHub Pages)

1. Push this repository to GitHub
2. Go to **Settings → Pages**
3. Set source to `main` branch, `/ (root)` folder
4. Your app will be live at `https://<username>.github.io/<repo-name>/`

---

## 📋 License

Built for Coding Camp by Niko Dwicahyo Widiyanto. Free to use and modify.
