/** Reusable UI components */
import { esc, fmtDateTime, fmtPct, fmtBurn, statusClass, variantFor } from './util.js';

// ============================================================
// UI State preservation helper
// ============================================================
export function withUiKept(fn) {
  const a = document.activeElement;
  const key = a && a.dataset && a.dataset.fkey ? a.dataset.fkey : null;
  const sel = a && typeof a.selectionStart === 'number' ? [a.selectionStart, a.selectionEnd] : null;
  const y = window.scrollY;
  fn();
  window.scrollTo(0, y);
  if (key) {
    const el = document.querySelector('[data-fkey="' + key + '"]');
    if (el) {
      el.focus({ preventScroll: true });
      if (sel && el.setSelectionRange) {
        try { el.setSelectionRange(sel[0], sel[1]); } catch (e) {}
      }
    }
  }
}

// ============================================================
// Toast notifications
// ============================================================
let toastContainer = null;

function ensureToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    toastContainer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function toast(message, type = 'info', duration = 4000, options = {}) {
  const container = ensureToastContainer();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.setAttribute('role', 'alert');
  const icons = {
    good: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    bad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };
  const iconSvg = icons[type] || icons.info;
  const msgContent = options.html ? message : esc(message);
  el.innerHTML = `<div class="toast-icon">${iconSvg}</div><div class="toast-message">${msgContent}</div><button class="toast-close" aria-label="Dismiss"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
  el.querySelector('.toast-close').addEventListener('click', () => el.remove());
  container.appendChild(el);
  if (duration > 0) setTimeout(() => el.remove(), duration);
}

// ============================================================
// Pill / Chip
// ============================================================
export function pill(text, variant) {
  const v = String(text ?? '');
  const chosenVariant = variant || variantFor(v);
  const cls = 'pill ' + chosenVariant;
  return `<span class="${cls}">${esc(v)}</span>`;
}

export function chip(label, active, onClick, count) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'chip' + (active ? ' active' : '');
  btn.innerHTML = esc(label) + (count != null ? `<span class="count">${esc(count)}</span>` : '');
  btn.addEventListener('click', onClick);
  return btn;
}

export function chipClear(label, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'chip-clear';
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

// ============================================================
// Search Box
// ============================================================
export function searchBox(placeholder, onInput, value = '', fkey = 'search') {
  const wrap = document.createElement('div');
  wrap.className = 'search-box';
  wrap.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="search" placeholder="${esc(placeholder)}" value="${esc(value)}" aria-label="${esc(placeholder)}">`;
  const input = wrap.querySelector('input');
  input.dataset.fkey = fkey;
  input.addEventListener('input', e => onInput(e.target.value));
  return wrap;
}

// ============================================================
// Select
// ============================================================
export function select(options, value, onChange, placeholder) {
  const el = document.createElement('select');
  el.className = 'form-select form-select-sm';
  if (placeholder) {
    const opt = document.createElement('option');
    opt.value = ''; opt.textContent = placeholder; opt.disabled = true; opt.selected = !value;
    el.appendChild(opt);
  }
  options.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.value; opt.textContent = o.label; opt.selected = o.value === value;
    el.appendChild(opt);
  });
  el.addEventListener('change', e => onChange(e.target.value));
  return el;
}

// ============================================================
// KPI Card
// ============================================================
export function kpiCard(label, value, note, badge = null) {
  const div = document.createElement('div');
  div.className = 'kpi-card';
  let badgeHtml = '';
  if (badge) badgeHtml = `<div class="kpi-badge">${pill(badge.text, badge.variant)}</div>`;
  div.innerHTML = `<div class="kpi-label">${esc(label)}</div><div class="kpi-value">${esc(value)}</div><div class="kpi-note">${esc(note)}</div>${badgeHtml}`;
  return div;
}

// ============================================================
// Table Helper
// ============================================================
export function createTable(columns, rows, options = {}) {
  const { onRowClick, sortKey, sortDir, onSort, emptyMessage = 'No data', getRowClass, keyField = 'id' } = options;
  const table = document.createElement('table');
  table.className = 'slo-table';
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  columns.forEach(col => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = col.label;
    if (col.sortable !== false) {
      th.style.cursor = 'pointer';
      th.tabIndex = 0;
      th.setAttribute('role', 'columnheader');
      const triggerSort = () => onSort?.(col.key);
      th.addEventListener('click', triggerSort);
      th.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerSort();
        }
      });
      if (sortKey === col.key) th.setAttribute('aria-sort', sortDir === 'asc' ? 'ascending' : 'descending');
    }
    if (col.className) th.className = col.className;
    tr.appendChild(th);
  });
  thead.appendChild(tr);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  if (!rows.length) {
    const td = document.createElement('td');
    td.colSpan = columns.length;
    td.className = 'empty-state';
    td.style.padding = '32px';
    td.textContent = emptyMessage;
    tbody.appendChild(document.createElement('tr')).appendChild(td);
  } else {
    rows.forEach(row => {
      const tr = document.createElement('tr');
      if (getRowClass) tr.className = getRowClass(row);
      tr.dataset.key = row[keyField];
      columns.forEach(col => {
        const td = document.createElement('td');
        const val = col.render ? col.render(row) : (row[col.key] ?? '\u2014');
        if (val instanceof Node) {
          td.append(val);
        } else if (typeof val === 'string' && val.startsWith('<')) {
          td.innerHTML = val;
        } else {
          td.textContent = String(val);
        }
        if (col.className) td.className = col.className;
        tr.appendChild(td);
      });
      if (onRowClick) {
        tr.style.cursor = 'pointer';
        tr.tabIndex = 0;
        tr.addEventListener('click', () => onRowClick(row));
        tr.addEventListener('keydown', e => {
          if (e.key === 'Enter') onRowClick(row);
        });
      }
      tbody.appendChild(tr);
    });
  }
  table.appendChild(tbody);
  return table;
}

// ============================================================
// Drawer
// ============================================================
let drawerEl = null;

export function openDrawer(title, content, onClose) {
  let prevScroll = 0;
  if (!drawerEl) {
    drawerEl = document.createElement('div');
    drawerEl.className = 'drawer';
    drawerEl.innerHTML = `
      <div class="drawer-overlay" aria-hidden="true"></div>
      <div class="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <div class="drawer-header">
          <h2 id="drawer-title"></h2>
          <button class="drawer-close" aria-label="Close drawer"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="drawer-body"></div>
      </div>`;
    document.body.appendChild(drawerEl);
    drawerEl.querySelector('.drawer-close').addEventListener('click', closeDrawer);
    drawerEl.querySelector('.drawer-overlay').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', onDrawerKeydown);
  } else {
    const bodyEl = drawerEl.querySelector('.drawer-body');
    if (drawerEl.classList.contains('open') && bodyEl) {
      prevScroll = bodyEl.scrollTop;
    }
  }
  drawerEl.querySelector('#drawer-title').textContent = title;
  const drawerBody = drawerEl.querySelector('.drawer-body');
  drawerBody.innerHTML = '';
  drawerBody.append(content);
  if (prevScroll > 0) {
    drawerBody.scrollTop = prevScroll;
  }
  drawerEl.classList.add('open');
  drawerEl.querySelector('.drawer-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  drawerEl._onClose = onClose;
}

function closeDrawer() {
  if (!drawerEl) return;
  drawerEl.classList.remove('open');
  drawerEl.querySelector('.drawer-overlay').classList.remove('open');
  document.body.style.overflow = '';
  if (drawerEl._onClose) drawerEl._onClose();
  drawerEl._onClose = null;
}

export function hideDrawer() {
  if (!drawerEl) return;
  drawerEl.classList.remove('open');
  drawerEl.querySelector('.drawer-overlay').classList.remove('open');
  document.body.style.overflow = '';
  drawerEl._onClose = null;
}

function onDrawerKeydown(e) {
  if (e.key === 'Escape' && drawerEl?.classList.contains('open')) closeDrawer();
}

export function closeDrawerPublic() { closeDrawer(); }

// ============================================================
// Dialog (Modal)
// ============================================================
export function openDialog(title, content, footerActions) {
  return new Promise(resolve => {
    const prevFocus = document.activeElement;
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div class="dialog-header">
          <h2 id="dialog-title">${esc(title)}</h2>
          <button class="dialog-close" aria-label="Close"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="dialog-body"></div>
        <div class="dialog-footer"></div>
      </div>`;
    const dialog = overlay.querySelector('.dialog');
    const body = dialog.querySelector('.dialog-body');
    const footer = dialog.querySelector('.dialog-footer');
    body.append(content);

    const close = () => {
      overlay.remove();
      document.removeEventListener('keydown', onKeydown);
      if (prevFocus && typeof prevFocus.focus === 'function') {
        try { prevFocus.focus(); } catch (e) {}
      }
    };
    const onKeydown = e => { if (e.key === 'Escape') close(); };

    footerActions.forEach(({ label, variant = 'primary', onClick, disabled }) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn btn-${variant} ${disabled ? 'disabled' : ''}`;
      btn.textContent = label;
      btn.disabled = !!disabled;
      btn.addEventListener('click', () => onClick({ close, dialog, body, footer, button: btn }));
      footer.appendChild(btn);
    });

    overlay.querySelector('.dialog-close').addEventListener('click', () => close());
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKeydown);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('open');
      const firstInput = dialog.querySelector('input, select, textarea, button');
      if (firstInput && typeof firstInput.focus === 'function') {
        firstInput.focus();
      }
    });

    resolve({ close, dialog, body, footer });
  });
}

// ============================================================
// Empty State
// ============================================================
export function emptyState(message, icon = null) {
  const div = document.createElement('div');
  div.className = 'empty-state';
  const icons = {
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    database: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
  };
  div.innerHTML = `${icon ? icons[icon] : ''}<h4>${esc(message)}</h4>`;
  return div;
}

// ============================================================
// Connection Badge
// ============================================================
export function connectionBadge(state, lastUpdate, onRefresh, onIntervalChange, currentInterval) {
  const div = document.createElement('div');
  div.className = 'd-flex align-items-center gap-2';
  const labels = { live: 'Live', degraded: 'Degraded', offline: 'API unreachable' };
  const variants = { live: 'live', degraded: 'degraded', offline: 'offline' };
  const timeStr = lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : '\u2014';
  div.innerHTML = `
    <span class="connection-badge ${variants[state]}">
      <span class="dot"></span>
      ${labels[state]} ${state === 'live' ? '\u00b7 updated ' + timeStr : state === 'offline' ? '\u2014 showing last data, retrying' : ''}
    </span>
    <button class="btn btn-outline-secondary btn-sm" id="refresh-now" title="Refresh now"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></button>
    <select id="poll-interval" aria-label="Poll interval">
      <option value="0" ${currentInterval === 0 ? 'selected' : ''}>Off</option>
      <option value="3000" ${currentInterval === 3000 ? 'selected' : ''}>3 s</option>
      <option value="5000" ${currentInterval === 5000 ? 'selected' : ''}>5 s</option>
      <option value="10000" ${currentInterval === 10000 ? 'selected' : ''}>10 s</option>
    </select>
  `;
  div.querySelector('#refresh-now').addEventListener('click', onRefresh);
  div.querySelector('#poll-interval').addEventListener('change', e => onIntervalChange(parseInt(e.target.value, 10)));
  return div;
}

// ============================================================
// Theme Toggle
// ============================================================
export function themeToggle(currentTheme, onChange) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'theme-toggle';
  btn.setAttribute('aria-label', currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  btn.innerHTML = currentTheme === 'dark'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  btn.addEventListener('click', () => onChange(currentTheme === 'dark' ? 'light' : 'dark'));
  return btn;
}

// ============================================================
// Mini Progress Bar (for error budget)
// ============================================================
export function miniBar(pct, label = '') {
  if (pct === null || pct === undefined || isNaN(pct)) {
    return '<span class="mini-bar-na text-muted">N/A</span>';
  }
  const p = Math.max(0, Math.min(100, pct));
  let variant = 'good';
  if (p <= 10) variant = 'bad';
  else if (p <= 30) variant = 'warn';
  const div = document.createElement('div');
  div.className = 'mini-bar';
  div.innerHTML = `<div class="bar"><div class="fill ${variant}" style="width:${p}%"></div><div class="marker" style="left:0%"></div></div><span class="pct">${p.toFixed(1)}%</span>`;
  return div.outerHTML;
}

// ============================================================
// Reconciliation Icon
// ============================================================
export function reconIcon(reconciled, missingEvidence) {
  if (!reconciled) return `<span class="recon-icon warn" title="SLI not reconciled to counts">\u26a0</span>`;
  if (missingEvidence) return `<span class="recon-icon warn" title="Exclusions missing evidence">\u26a0</span>`;
  return `<span class="recon-icon ok" title="SLI reconciled, evidence complete">\u2713</span>`;
}
