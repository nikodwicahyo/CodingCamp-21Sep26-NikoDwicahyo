/**
 * Expense & Budget Visualizer — main.js
 * Vanilla ES6+ | LocalStorage | Chart.js v4
 * Features: CRUD transactions, Pie Chart, Sort, Custom Categories, Dark/Light Mode
 */

'use strict';

/* ============================================================
   1. CONSTANTS & STORAGE KEYS
   ============================================================ */

const STORAGE_KEYS = {
  TRANSACTIONS: 'ebv_transactions',
  CATEGORIES:   'ebv_categories',
  THEME:        'ebv_theme',
  SORT:         'ebv_sort',
};

/** Default built-in categories */
const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];

/** Category → CSS badge class mapping */
const BADGE_CLASS_MAP = {
  food:      'badge-food',
  transport: 'badge-transport',
  fun:       'badge-fun',
};

/** Category → Chart.js color mapping (extended for custom) */
const CATEGORY_COLORS = {
  Food:      '#f97316',
  Transport: '#3b82f6',
  Fun:       '#ec4899',
};

/** Ordered color pool for custom categories */
const CUSTOM_COLOR_POOL = [
  '#8b5cf6', '#10b981', '#f59e0b', '#14b8a6',
  '#6366f1', '#ef4444', '#84cc16', '#0ea5e9',
  '#d946ef', '#f43f5e', '#22c55e', '#a78bfa',
];

/* ============================================================
   2. STATE
   ============================================================ */

/**
 * Single source of truth — never mutate directly outside helpers.
 * @type {{
 *   transactions: Array<{id:string, name:string, amount:number, category:string, createdAt:number}>,
 *   categories: string[],
 *   theme: 'light'|'dark',
 *   currentSort: string,
 *   customCategoryColors: Record<string, string>
 * }}
 */
const state = {
  transactions:          [],
  categories:            [...DEFAULT_CATEGORIES],
  theme:                 'light',
  currentSort:           'default',
  customCategoryColors:  {},
};

/* ============================================================
   3. STORAGE MODULE
   ============================================================ */

/**
 * Safely parse JSON from LocalStorage, returning fallback on error.
 * @param {string} key
 * @param {*} fallback
 */
function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/** Safely write value to LocalStorage as JSON. */
function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[BudgetViz] localStorage write failed:', e);
  }
}

/** Load all persisted data into state. */
function loadState() {
  const savedTx   = lsGet(STORAGE_KEYS.TRANSACTIONS, []);
  const savedCats = lsGet(STORAGE_KEYS.CATEGORIES, [...DEFAULT_CATEGORIES]);
  const savedTheme = lsGet(STORAGE_KEYS.THEME, 'light');
  const savedSort = lsGet(STORAGE_KEYS.SORT, 'default');

  // Validate transactions shape
  state.transactions = Array.isArray(savedTx)
    ? savedTx.filter(t =>
        t && typeof t.id === 'string' &&
        typeof t.name === 'string' &&
        typeof t.amount === 'number' &&
        typeof t.category === 'string'
      )
    : [];

  // Merge saved categories with defaults (ensure defaults are never lost)
  const merged = [...DEFAULT_CATEGORIES];
  savedCats.forEach(c => {
    if (typeof c === 'string' && c.trim() && !merged.includes(c)) {
      merged.push(c);
    }
  });
  state.categories = merged;

  state.theme       = savedTheme === 'dark' ? 'dark' : 'light';
  state.currentSort = ['default', 'amount-desc', 'amount-asc', 'category'].includes(savedSort)
    ? savedSort : 'default';

  // Rebuild custom category color assignments
  state.customCategoryColors = {};
  let colorIdx = 0;
  state.categories.forEach(cat => {
    if (!DEFAULT_CATEGORIES.includes(cat)) {
      state.customCategoryColors[cat] =
        CUSTOM_COLOR_POOL[colorIdx % CUSTOM_COLOR_POOL.length];
      colorIdx++;
    }
  });
}

function saveTransactions() { lsSet(STORAGE_KEYS.TRANSACTIONS, state.transactions); }
function saveCategories()   { lsSet(STORAGE_KEYS.CATEGORIES,   state.categories);   }
function saveTheme()        { lsSet(STORAGE_KEYS.THEME,        state.theme);        }
function saveSort()         { lsSet(STORAGE_KEYS.SORT,         state.currentSort);  }

/* ============================================================
   4. TRANSACTION CRUD
   ============================================================ */

/**
 * Generate a UUID v4 using crypto API with fallback.
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Add a new transaction to state and persist.
 * @param {string} name
 * @param {number} amount
 * @param {string} category
 */
function addTransaction(name, amount, category) {
  const tx = {
    id:        generateId(),
    name:      name.trim(),
    amount:    Math.round(parseFloat(amount) * 100) / 100, // 2dp precision
    category:  category.trim(),
    createdAt: Date.now(),
  };
  state.transactions.push(tx);
  saveTransactions();
  return tx;
}

/**
 * Remove a transaction by ID from state and persist.
 * @param {string} id
 */
function deleteTransaction(id) {
  state.transactions = state.transactions.filter(t => t.id !== id);
  saveTransactions();
}

/* ============================================================
   5. COMPUTED HELPERS
   ============================================================ */

/** Sum of all transaction amounts. */
function getTotal() {
  return state.transactions.reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Return a sorted copy of transactions based on sortBy param.
 * Does NOT mutate state.transactions.
 * @param {string} sortBy
 * @returns {Array}
 */
function getSortedTransactions(sortBy) {
  const copy = [...state.transactions];
  switch (sortBy) {
    case 'amount-desc':
      return copy.sort((a, b) => b.amount - a.amount);
    case 'amount-asc':
      return copy.sort((a, b) => a.amount - b.amount);
    case 'category':
      return copy.sort((a, b) => a.category.localeCompare(b.category));
    default: // 'default' — insertion order (newest last, as pushed)
      return copy;
  }
}

/**
 * Format a number as Indonesian Rupiah.
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
  return 'Rp\u00a0' + amount.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Get the badge CSS class for a category.
 * @param {string} category
 * @returns {string}
 */
function getBadgeClass(category) {
  const key = category.toLowerCase();
  return BADGE_CLASS_MAP[key] || 'badge-custom';
}

/**
 * Get the chart color for a category.
 * @param {string} category
 * @returns {string}
 */
function getCategoryColor(category) {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  if (state.customCategoryColors[category]) return state.customCategoryColors[category];
  // Fallback
  return '#a78bfa';
}

/**
 * Build aggregated data for Chart.js from current transactions.
 * @returns {{ labels: string[], data: number[], colors: string[] }}
 */
function buildChartData() {
  const totals = {};
  state.transactions.forEach(t => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });
  const labels = Object.keys(totals);
  const data   = labels.map(l => totals[l]);
  const colors = labels.map(l => getCategoryColor(l));
  return { labels, data, colors };
}

/* ============================================================
   6. DOM REFERENCES (resolved after DOMContentLoaded)
   ============================================================ */

let dom = {};

function initDomRefs() {
  dom = {
    // Balance
    totalBalance:    document.getElementById('total-balance'),
    balanceCount:    document.getElementById('balance-count'),
    // Form
    form:            document.getElementById('transaction-form'),
    itemName:        document.getElementById('item-name'),
    itemAmount:      document.getElementById('item-amount'),
    itemCategory:    document.getElementById('item-category'),
    itemNameErr:     document.getElementById('item-name-error'),
    itemAmountErr:   document.getElementById('item-amount-error'),
    itemCategoryErr: document.getElementById('item-category-error'),
    submitBtn:       document.getElementById('submit-btn'),
    // Sort
    sortSelect:      document.getElementById('sort-select'),
    // Transaction list
    transactionList: document.getElementById('transaction-list'),
    // Chart
    chartCanvas:     document.getElementById('expense-chart'),
    // Theme
    themeToggle:     document.getElementById('theme-toggle'),
    themeIcon:       document.getElementById('theme-icon'),
    // Category modal
    addCategoryBtn:  document.getElementById('add-category-btn'),
    categoryModal:   document.getElementById('category-modal'),
    newCatInput:     document.getElementById('new-category-input'),
    modalError:      document.getElementById('modal-error'),
    modalCancel:     document.getElementById('modal-cancel'),
    modalConfirm:    document.getElementById('modal-confirm'),
  };
}

/* ============================================================
   7. THEME MODULE
   ============================================================ */

/**
 * Apply a theme: sets data-theme attribute, button icon, persists.
 * @param {'light'|'dark'} theme
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
  if (dom.themeIcon) {
    dom.themeIcon.innerHTML = theme === 'dark'
      ? '<i data-lucide="sun"  class="icon icon-theme" aria-hidden="true"></i>'
      : '<i data-lucide="moon" class="icon icon-theme" aria-hidden="true"></i>';
    // Re-render Lucide icons after injecting new markup
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  if (dom.themeToggle) {
    dom.themeToggle.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'
    );
  }
  saveTheme();
}

function toggleTheme() {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  // Re-render chart so text color adapts
  renderChart();
}

/* ============================================================
   8. RENDER — BALANCE
   ============================================================ */

function renderBalance() {
  const total = getTotal();
  const count = state.transactions.length;
  dom.totalBalance.textContent  = formatCurrency(total);
  dom.balanceCount.textContent  =
    count === 0 ? '0 transaksi'
    : count === 1 ? '1 transaksi'
    : `${count} transaksi`;
}

/* ============================================================
   9. RENDER — CATEGORY DROPDOWN
   ============================================================ */

/**
 * Populate the category <select> from state.categories.
 * Preserves current selection if still valid; optionally forces a value.
 * @param {string} [forceSelect] — category name to force-select after rebuild
 */
function populateCategoryDropdown(forceSelect) {
  const current = forceSelect || dom.itemCategory.value;
  dom.itemCategory.innerHTML = '';

  // Placeholder
  const placeholder = document.createElement('option');
  placeholder.value    = '';
  placeholder.textContent = '— Pilih Kategori —';
  placeholder.disabled = true;
  placeholder.hidden   = true;
  dom.itemCategory.appendChild(placeholder);

  state.categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value       = cat;
    opt.textContent = cat;
    dom.itemCategory.appendChild(opt);
  });

  // Restore selection
  if (forceSelect && state.categories.includes(forceSelect)) {
    dom.itemCategory.value = forceSelect;
  } else if (current && state.categories.includes(current)) {
    dom.itemCategory.value = current;
  } else {
    dom.itemCategory.selectedIndex = 0; // placeholder
  }
}

/* ============================================================
   10. RENDER — TRANSACTION LIST
   ============================================================ */

function renderTransactionList() {
  const sorted = getSortedTransactions(state.currentSort);
  const list   = dom.transactionList;
  list.innerHTML = '';

  if (sorted.length === 0) {
    list.innerHTML = `
      <li class="empty-state" role="listitem">
        <span class="empty-icon" aria-hidden="true">
          <i data-lucide="inbox" class="icon icon-empty"></i>
        </span>
        <span class="empty-title">Belum ada transaksi</span>
        <span class="empty-sub">Tambahkan transaksi pertama kamu di atas!</span>
      </li>`;
    return;
  }

  sorted.forEach(tx => {
    const item = document.createElement('li');
    item.className = 'transaction-item';
    item.setAttribute('role', 'listitem');
    item.dataset.id = tx.id;

    const badgeClass = getBadgeClass(tx.category);

    item.innerHTML = `
      <div class="item-info">
        <div class="item-name" title="${escapeHtml(tx.name)}">${escapeHtml(tx.name)}</div>
        <span class="badge ${badgeClass}" aria-label="Kategori: ${escapeHtml(tx.category)}">
          ${escapeHtml(tx.category)}
        </span>
      </div>
      <span class="item-amount">${formatCurrency(tx.amount)}</span>
      <button
        class="btn-delete"
        data-id="${tx.id}"
        aria-label="Hapus transaksi ${escapeHtml(tx.name)}"
        title="Hapus"
      ><i data-lucide="trash-2" class="icon icon-sm" aria-hidden="true"></i></button>`;

    list.appendChild(item);
  });
}

/**
 * Escape HTML to prevent XSS when inserting user content.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

/* ============================================================
   11. RENDER — CHART (Chart.js v4)
   ============================================================ */

/** Holds the current Chart instance so we can destroy/recreate. */
let chartInstance = null;

/**
 * Inline Chart.js plugin: draws centered "No data" text when chart is empty.
 */
const emptyStatePlugin = {
  id: 'emptyState',
  afterDraw(chart) {
    const { datasets } = chart.data;
    const hasData = datasets.length > 0 &&
      datasets[0].data.length > 0 &&
      datasets[0].data.some(v => v > 0);

    if (hasData) return;

    const { ctx, chartArea: { left, top, right, bottom } } = chart;
    const cx = (left + right)  / 2;
    const cy = (top  + bottom) / 2;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#9ca3af';

    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    // Draw a simple bar-chart icon on canvas using paths
    const iconSize = 36;
    const ix = cx - iconSize / 2;
    const iy = cy - iconSize / 2 - 22;
    ctx.fillStyle = textColor;
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';

    // Bar 1 (short, left)
    const b1x = ix + 2,  b1h = iconSize * 0.45, b1y = iy + iconSize - b1h, b1w = 7;
    // Bar 2 (tall, middle)
    const b2x = ix + 13, b2h = iconSize * 0.80, b2y = iy + iconSize - b2h, b2w = 7;
    // Bar 3 (medium, right)
    const b3x = ix + 24, b3h = iconSize * 0.60, b3y = iy + iconSize - b3h, b3w = 7;

    // Base line
    ctx.beginPath();
    ctx.moveTo(ix, iy + iconSize + 1);
    ctx.lineTo(ix + iconSize + 3, iy + iconSize + 1);
    ctx.stroke();

    // Bars (filled with slight transparency)
    ctx.globalAlpha = 0.65;
    [[b1x, b1y, b1w, b1h], [b2x, b2y, b2w, b2h], [b3x, b3y, b3w, b3h]].forEach(([x, y, w, h]) => {
      ctx.beginPath();
      const r = 2;
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Text
    ctx.font = '600 0.88rem Segoe UI, system-ui, sans-serif';
    ctx.fillStyle = textColor;
    ctx.fillText('Belum ada data', cx, cy + 20);

    ctx.font = '0.78rem Segoe UI, system-ui, sans-serif';
    ctx.fillText('Tambah transaksi untuk melihat grafik', cx, cy + 40);

    ctx.restore();
  },
};

function renderChart() {
  const { labels, data, colors } = buildChartData();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const legendColor = isDark ? '#e2e8f0' : '#1e1b4b';

  // Destroy existing instance to avoid canvas reuse issues
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const ctx = dom.chartCanvas.getContext('2d');

  chartInstance = new Chart(ctx, {
    type: 'pie',
    plugins: [emptyStatePlugin],
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor:      colors,
        hoverBackgroundColor: colors.map(c => hexToRgba(c, 0.85)),
        borderColor:          isDark ? '#1c1b2e' : '#ffffff',
        borderWidth:          3,
        hoverOffset:          10,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      animation: {
        animateRotate: true,
        animateScale:  true,
        duration:      500,
        easing:        'easeInOutQuart',
      },
      plugins: {
        legend: {
          display:  labels.length > 0,
          position: 'bottom',
          labels: {
            color:       legendColor,
            font:        { size: 12, weight: '600', family: 'Segoe UI, system-ui, sans-serif' },
            padding:     14,
            usePointStyle: true,
            pointStyle:  'circle',
          },
        },
        tooltip: {
          callbacks: {
            label(context) {
              const label  = context.label || '';
              const value  = context.parsed;
              const total  = context.dataset.data.reduce((a, b) => a + b, 0);
              const pct    = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              return ` ${label}: ${formatCurrency(value)} (${pct}%)`;
            },
          },
          backgroundColor: isDark ? '#252440' : '#1e1b4b',
          titleColor:      '#ffffff',
          bodyColor:       '#e2e8f0',
          borderColor:     isDark ? '#2e2c4a' : 'transparent',
          borderWidth:     1,
          padding:         10,
          cornerRadius:    8,
          displayColors:   true,
          boxPadding:      4,
        },
      },
    },
  });
}

/**
 * Convert hex color + alpha to rgba string.
 * @param {string} hex  e.g. "#f97316"
 * @param {number} alpha
 * @returns {string}
 */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ============================================================
   12. RENDER ALL (single re-render entry point)
   ============================================================ */

function renderAll() {
  renderBalance();
  renderTransactionList();
  renderChart();
  // Hydrate any Lucide <i data-lucide="..."> elements injected by JS
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/* ============================================================
   13. FORM VALIDATION
   ============================================================ */

/**
 * Validate the add-transaction form.
 * Returns true if valid; false if errors were found.
 * Sets/clears .is-invalid and .form-error text per field.
 */
function validateForm() {
  let valid = true;

  // Clear previous errors
  clearFieldError(dom.itemName,     dom.itemNameErr);
  clearFieldError(dom.itemAmount,   dom.itemAmountErr);
  clearFieldError(dom.itemCategory, dom.itemCategoryErr);

  // Name
  const name = dom.itemName.value.trim();
  if (!name) {
    setFieldError(dom.itemName, dom.itemNameErr, 'Nama item tidak boleh kosong.');
    valid = false;
  } else if (name.length < 2) {
    setFieldError(dom.itemName, dom.itemNameErr, 'Nama item minimal 2 karakter.');
    valid = false;
  }

  // Amount
  const rawAmt = dom.itemAmount.value.trim();
  const amount = parseFloat(rawAmt);
  if (!rawAmt) {
    setFieldError(dom.itemAmount, dom.itemAmountErr, 'Jumlah tidak boleh kosong.');
    valid = false;
  } else if (isNaN(amount) || amount <= 0) {
    setFieldError(dom.itemAmount, dom.itemAmountErr, 'Masukkan jumlah yang valid (> 0).');
    valid = false;
  } else if (amount > 999_999_999_999) {
    setFieldError(dom.itemAmount, dom.itemAmountErr, 'Jumlah terlalu besar.');
    valid = false;
  }

  // Category
  if (!dom.itemCategory.value) {
    setFieldError(dom.itemCategory, dom.itemCategoryErr, 'Pilih kategori terlebih dahulu.');
    valid = false;
  }

  return valid;
}

function setFieldError(input, errorEl, message) {
  input.classList.add('is-invalid');
  errorEl.textContent = message;
}

function clearFieldError(input, errorEl) {
  input.classList.remove('is-invalid');
  errorEl.textContent = '';
}

/* ============================================================
   14. CUSTOM CATEGORIES MODULE
   ============================================================ */

function openCategoryModal() {
  dom.newCatInput.value    = '';
  dom.modalError.textContent = '';
  dom.newCatInput.classList.remove('is-invalid');
  dom.categoryModal.removeAttribute('hidden');
  dom.newCatInput.focus();
}

function closeCategoryModal() {
  dom.categoryModal.setAttribute('hidden', '');
  dom.addCategoryBtn.focus();
}

function confirmNewCategory() {
  const raw  = dom.newCatInput.value.trim();
  const name = raw.charAt(0).toUpperCase() + raw.slice(1); // capitalize first letter

  // Validation
  if (!name) {
    dom.newCatInput.classList.add('is-invalid');
    dom.modalError.textContent = 'Nama kategori tidak boleh kosong.';
    dom.newCatInput.focus();
    return;
  }
  if (name.length < 2) {
    dom.newCatInput.classList.add('is-invalid');
    dom.modalError.textContent = 'Minimal 2 karakter.';
    dom.newCatInput.focus();
    return;
  }
  if (state.categories.some(c => c.toLowerCase() === name.toLowerCase())) {
    dom.newCatInput.classList.add('is-invalid');
    dom.modalError.textContent = 'Kategori ini sudah ada.';
    dom.newCatInput.focus();
    return;
  }

  // Add category
  state.categories.push(name);

  // Assign color
  const customCount = state.categories.filter(c => !DEFAULT_CATEGORIES.includes(c)).length;
  state.customCategoryColors[name] =
    CUSTOM_COLOR_POOL[(customCount - 1) % CUSTOM_COLOR_POOL.length];

  saveCategories();
  populateCategoryDropdown(name); // auto-select new category
  clearFieldError(dom.itemCategory, dom.itemCategoryErr);
  closeCategoryModal();
}

/* ============================================================
   15. EVENT HANDLERS
   ============================================================ */

function attachEventListeners() {

  /* ── Form submit ── */
  dom.form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateForm()) return;

    const name     = dom.itemName.value.trim();
    const amount   = parseFloat(dom.itemAmount.value);
    const category = dom.itemCategory.value;

    addTransaction(name, amount, category);

    // Reset form
    dom.form.reset();
    dom.itemCategory.value = '';
    clearFieldError(dom.itemName,     dom.itemNameErr);
    clearFieldError(dom.itemAmount,   dom.itemAmountErr);
    clearFieldError(dom.itemCategory, dom.itemCategoryErr);

    renderAll();

    // Scroll to list on mobile so user sees the new item
    if (window.innerWidth < 768) {
      dom.transactionList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  /* ── Real-time inline validation (clear error on valid input) ── */
  dom.itemName.addEventListener('input', () => {
    if (dom.itemName.value.trim().length >= 2) {
      clearFieldError(dom.itemName, dom.itemNameErr);
    }
  });
  dom.itemAmount.addEventListener('input', () => {
    const v = parseFloat(dom.itemAmount.value);
    if (!isNaN(v) && v > 0) {
      clearFieldError(dom.itemAmount, dom.itemAmountErr);
    }
  });
  dom.itemCategory.addEventListener('change', () => {
    if (dom.itemCategory.value) {
      clearFieldError(dom.itemCategory, dom.itemCategoryErr);
    }
  });

  /* ── Transaction list: event delegation for delete ── */
  dom.transactionList.addEventListener('click', e => {
    const btn = e.target.closest('.btn-delete');
    if (!btn) return;

    const id   = btn.dataset.id;
    const item = btn.closest('.transaction-item');

    if (item) {
      // Animate removal
      item.classList.add('removing');
      item.addEventListener('animationend', () => {
        deleteTransaction(id);
        renderAll();
      }, { once: true });
    } else {
      deleteTransaction(id);
      renderAll();
    }
  });

  /* ── Sort select ── */
  dom.sortSelect.addEventListener('change', () => {
    state.currentSort = dom.sortSelect.value;
    saveSort();
    renderTransactionList(); // chart doesn't need to change
  });

  /* ── Theme toggle ── */
  dom.themeToggle.addEventListener('click', toggleTheme);

  /* ── Add category button ── */
  dom.addCategoryBtn.addEventListener('click', openCategoryModal);

  /* ── Modal: cancel ── */
  dom.modalCancel.addEventListener('click', closeCategoryModal);

  /* ── Modal: confirm ── */
  dom.modalConfirm.addEventListener('click', confirmNewCategory);

  /* ── Modal: Enter key in input ── */
  dom.newCatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); confirmNewCategory(); }
    if (e.key === 'Escape') { closeCategoryModal(); }
  });

  /* ── Modal: close on overlay click ── */
  dom.categoryModal.addEventListener('click', e => {
    if (e.target === dom.categoryModal) closeCategoryModal();
  });

  /* ── Modal: trap focus ── */
  dom.categoryModal.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusable = dom.categoryModal.querySelectorAll(
      'input, button, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  });

  /* ── Global Escape to close modal ── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !dom.categoryModal.hidden) {
      closeCategoryModal();
    }
  });
}

/* ============================================================
   16. SYNC UI STATE TO DOM (on load)
   ============================================================ */

/**
 * Sync non-rendered state widgets to match loaded state.
 * (Sort select value, theme icon, etc.)
 */
function syncUiState() {
  dom.sortSelect.value = state.currentSort;
}

/* ============================================================
   17. INITIALISE
   ============================================================ */

function init() {
  // 1. Resolve DOM refs
  initDomRefs();

  // 2. Load state from LocalStorage
  loadState();

  // 3. Apply theme BEFORE first render (prevents flash)
  applyTheme(state.theme);

  // 4. Populate category dropdown
  populateCategoryDropdown();

  // 5. Sync UI widgets (sort select)
  syncUiState();

  // 6. Attach all event listeners
  attachEventListeners();

  // 7. First render
  renderAll();

  // 8. Hydrate static Lucide icons (header brand, theme toggle)
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Wait for DOM and Chart.js to both be ready
document.addEventListener('DOMContentLoaded', () => {
  // Chart.js is loaded via defer script tag — it should be available by now.
  // Add a small safety check in case of slow CDN.
  if (typeof Chart === 'undefined') {
    console.warn('[BudgetViz] Chart.js not loaded yet, retrying…');
    const retry = setInterval(() => {
      if (typeof Chart !== 'undefined') {
        clearInterval(retry);
        init();
      }
    }, 100);
    // Give up after 5 seconds and init without chart
    setTimeout(() => {
      clearInterval(retry);
      if (typeof Chart === 'undefined') {
        console.error('[BudgetViz] Chart.js failed to load. Chart will not render.');
        // Provide a no-op Chart stub so app still works
        window.Chart = class {
          constructor() { this.destroy = () => {}; }
        };
        init();
      }
    }, 5000);
  } else {
    init();
  }
});
