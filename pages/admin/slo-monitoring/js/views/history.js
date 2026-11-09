/** History & Evidence view */
import { STORE } from '../store.js';
import { esc, fmtDateTime, fmtDateTimeText, toCsv, downloadBlob } from '../util.js';
import { pill, searchBox, createTable, chip, chipClear, select } from '../ui.js';

let currentSortKey = 'recorded_at';
let currentSortDir = 'desc';
let unsubscribe = null;

export async function init() {
  render();
  unsubscribe = STORE.subscribe(render);
}

export function destroy() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

function render() {
  const state = STORE.getState();
  const { history, ui } = state;
  const main = document.getElementById('app-main');
  if (!main) return;

  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <div class="page-title-block">
      <div class="context">Platform Admin \u00b7 Reliability Governance</div>
      <h1>Reliability Governance History & Evidence</h1>
      <p class="subtitle">Cross-domain record of source evidence, governance decisions, verification evidence and follow-through.</p>
    </div>
  `;

  // Filter bar
  const domains = [...new Set(history.map(h => h.domain).filter(Boolean))].sort();
  const statuses = [...new Set(history.map(h => h.status).filter(Boolean))].sort();
  const bar = document.createElement('div');
  bar.className = 'filter-bar';
  bar.appendChild(searchBox('Search history\u2026', v => { STORE.setSearch(v); }, ui.search, 'history-search'));

  const domainGroup = document.createElement('div');
  domainGroup.className = 'filter-group';
  domains.forEach(d => domainGroup.appendChild(chip(d, ui.filters.status.includes(d), () => toggleFilter('status', d), history.filter(h => h.domain === d).length)));
  bar.appendChild(domainGroup);

  const statusGroup = document.createElement('div');
  statusGroup.className = 'filter-group';
  statuses.forEach(st => statusGroup.appendChild(chip(st, ui.filters.tier.includes(st), () => toggleFilter('tier', st), history.filter(h => h.status === st).length)));
  bar.appendChild(statusGroup);

  if (ui.filters.status.length || ui.filters.tier.length) bar.appendChild(chipClear('Clear filters', () => STORE.clearFilters()));

  // Table
  const filtered = getFilteredRows(history, ui);
  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-wrapper';
  tableWrap.appendChild(buildTable(filtered));

  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn-outline-secondary btn-sm mt-2';
  exportBtn.textContent = 'Export CSV';
  exportBtn.addEventListener('click', () => exportCsv(filtered));

  main.innerHTML = '';
  main.appendChild(header);
  main.appendChild(bar);
  main.appendChild(tableWrap);
  main.appendChild(exportBtn);
}

function toggleFilter(key, value) {
  const ui = STORE.getState().ui;
  const arr = [...ui.filters[key]];
  const idx = arr.indexOf(value);
  if (idx >= 0) arr.splice(idx, 1); else arr.push(value);
  STORE.setFilters({ [key]: arr });
}

function getFilteredRows(history, ui) {
  let rows = [...history];
  const search = ui.search.toLowerCase();
  if (search) rows = rows.filter(h => [h.subject, h.subject_id, h.decision, h.assurance, h.specialist_owner, h.source_evidence, h.decision_evidence, h.verification_evidence, h.recorded_by].some(v => v?.toLowerCase().includes(search)));
  if (ui.filters.status.length) rows = rows.filter(h => ui.filters.status.includes(h.domain));
  if (ui.filters.tier.length) rows = rows.filter(h => ui.filters.tier.includes(h.status));
  rows.sort((a, b) => {
    let va = currentSortKey.split('.').reduce((o, k) => o?.[k], a);
    let vb = currentSortKey.split('.').reduce((o, k) => o?.[k], b);
    va = String(va ?? '').toLowerCase();
    vb = String(vb ?? '').toLowerCase();
    if (va < vb) return currentSortDir === 'asc' ? -1 : 1;
    if (va > vb) return currentSortDir === 'asc' ? 1 : -1;
    return 0;
  });
  return rows;
}

function buildTable(rows) {
  const columns = [
    { key: 'recorded_at', label: 'Recorded', render: r => fmtDateTimeText(r.recorded_at), className: 'mono', sortable: true },
    { key: 'domain', label: 'Domain', sortable: true },
    { key: 'subject', label: 'Subject', render: r => `<strong>${esc(r.subject)}</strong><div class="small text-body-secondary">${esc(r.subject_id)}</div>`, sortable: true },
    { key: 'decision', label: 'Decision', sortable: true },
    { key: 'assurance', label: 'Assurance', render: r => pill(r.assurance), sortable: true },
    { key: 'specialist_owner', label: 'Specialist Owner', sortable: true },
    { key: 'source_evidence', label: 'Source Evidence', render: r => r.source_evidence || '\u2014', className: 'mono' },
    { key: 'decision_evidence', label: 'Decision Evidence', render: r => r.decision_evidence || '\u2014', className: 'mono' },
    { key: 'verification_evidence', label: 'Verification Evidence', render: r => r.verification_evidence || '\u2014', className: 'mono' },
    { key: 'checkpoint', label: 'Checkpoint', render: r => r.checkpoint ? fmtDateTimeText(r.checkpoint) : '\u2014', className: 'mono' },
    { key: 'recorded_by', label: 'Recorded By', render: r => `${esc(r.recorded_by)}<div class="small">${fmtDateTimeText(r.recorded_at)}</div>`, sortable: true },
    { key: 'status', label: 'Status', render: r => pill(r.status), sortable: true },
  ];

  return createTable(columns, rows, {
    sortKey: currentSortKey,
    sortDir: currentSortDir,
    onSort: (key) => {
      if (currentSortKey === key) currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
      else { currentSortKey = key; currentSortDir = 'asc'; }
      render();
    },
    emptyMessage: 'No governance history records.',
  });
}

function exportCsv(rows) {
  const cols = [
    { label: 'Recorded At', key: 'recorded_at', transform: v => v ? new Date(v).toISOString() : '' },
    { label: 'Domain', key: 'domain' },
    { label: 'Subject', key: 'subject' },
    { label: 'Subject ID', key: 'subject_id' },
    { label: 'Decision', key: 'decision' },
    { label: 'Assurance', key: 'assurance' },
    { label: 'Specialist Owner', key: 'specialist_owner' },
    { label: 'Source Evidence', key: 'source_evidence' },
    { label: 'Decision Evidence', key: 'decision_evidence' },
    { label: 'Verification Evidence', key: 'verification_evidence' },
    { label: 'Checkpoint', key: 'checkpoint', transform: v => v ? new Date(v).toISOString() : '' },
    { label: 'Recorded By', key: 'recorded_by' },
    { label: 'Status', key: 'status' },
  ];
  const csv = toCsv(rows.map(r => ({ ...r, ...cols.reduce((o, c) => { o[c.key] = c.transform ? c.transform(r[c.key], r) : r[c.key]; return o; }, {}) })), cols);
  downloadBlob(csv, `governance-history-${new Date().toISOString().slice(0,10)}.csv`);
}
