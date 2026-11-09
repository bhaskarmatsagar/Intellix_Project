/** SLO Standards view - table of all SLO definitions */
import { STORE } from '../store.js';
import { esc, fmtPct, fmtBurn, statusClass, toCsv, downloadBlob } from '../util.js';
import { pill, searchBox, createTable, chip, chipClear, select } from '../ui.js';

let currentSortKey = 'name';
let currentSortDir = 'asc';
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
  const { slos, services, ui } = state;
  const main = document.getElementById('app-main');
  if (!main) return;

  // Header
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <div class="page-title-block">
      <div class="context">Platform Admin \u00b7 Reliability Governance</div>
      <h1>SLO Standards & Current Posture</h1>
      <p class="subtitle">Govern service-level standards, current error-budget exposure and the lifecycle of reliability objectives.</p>
    </div>
  `;

  // Compute filtered first
  const filtered = getFilteredRows(slos, services, ui);

  // Filter bar
  const filterBar = buildFilterBar(slos, services, ui, filtered.length);

  // Table
  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-wrapper';
  tableWrap.appendChild(buildTable(filtered, services));

  // Export
  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn-outline-secondary btn-sm mt-2';
  exportBtn.textContent = 'Export CSV';
  exportBtn.addEventListener('click', () => exportCsv(filtered));

  main.innerHTML = '';
  main.appendChild(header);
  main.appendChild(filterBar);
  main.appendChild(tableWrap);
  main.appendChild(exportBtn);
}

function buildFilterBar(slos, services, ui, filteredCount) {
  const tiers = [...new Set(slos.map(s => s.service_tier).filter(Boolean))].sort();
  const serviceOpts = services.map(s => ({ value: s.service_id, label: `${s.name} (${s.service_id})` }));
  const statuses = [...new Set(slos.map(s => s.status))].sort();

  const bar = document.createElement('div');
  bar.className = 'filter-bar';
  bar.appendChild(searchBox('Search SLOs\u2026', v => { STORE.setSearch(v); }, ui.search, 'slos-search'));

  // Status
  const statusGroup = document.createElement('div');
  statusGroup.className = 'filter-group';
  statuses.forEach(st => {
    const active = ui.filters.status.includes(st);
    statusGroup.appendChild(chip(st, active, () => toggleFilter('status', st), slos.filter(s => s.status === st).length));
  });
  bar.appendChild(statusGroup);

  // Tier
  const tierSel = select([{ value: '', label: 'All Tiers' }, ...tiers.map(t => ({ value: t, label: t }))], ui.filters.tier.join(','), v => STORE.setFilters({ tier: v ? v.split(',') : [] }));
  const tierGroup = document.createElement('div');
  tierGroup.className = 'filter-group';
  tierGroup.innerHTML = '<label>Tier</label>';
  tierGroup.appendChild(tierSel);
  bar.appendChild(tierGroup);

  // Service
  const svcSel = select([{ value: '', label: 'All Services' }, ...serviceOpts], ui.filters.service.join(','), v => STORE.setFilters({ service: v ? v.split(',') : [] }));
  const svcGroup = document.createElement('div');
  svcGroup.className = 'filter-group';
  svcGroup.innerHTML = '<label>Service</label>';
  svcGroup.appendChild(svcSel);
  bar.appendChild(svcGroup);

  if (ui.filters.status.length || ui.filters.tier.length || ui.filters.service.length) {
    bar.appendChild(chipClear('Clear filters', () => STORE.clearFilters()));
  }

  const count = document.createElement('span');
  count.className = 'text-body-secondary small';
  count.textContent = `${filteredCount} of ${slos.length} SLOs`;
  bar.appendChild(count);

  return bar;
}

function toggleFilter(key, value) {
  const ui = STORE.getState().ui;
  const arr = [...ui.filters[key]];
  const idx = arr.indexOf(value);
  if (idx >= 0) arr.splice(idx, 1); else arr.push(value);
  STORE.setFilters({ [key]: arr });
}

function getFilteredRows(slos, services, ui) {
  let rows = [...slos];
  const search = ui.search.toLowerCase();
  if (search) rows = rows.filter(s => [s.name, s.slo_id, s.service_id].some(v => v?.toLowerCase().includes(search)));
  if (ui.filters.status.length) rows = rows.filter(s => ui.filters.status.includes(s.status));
  if (ui.filters.tier.length) rows = rows.filter(s => ui.filters.tier.includes(s.service_tier));
  if (ui.filters.service.length) rows = rows.filter(s => ui.filters.service.includes(s.service_id));

  const numCols = new Set(['current_pct', 'error_budget_remaining_pct', 'burn_1h', 'burn_6h', 'burn_24h']);
  const num = v => { const n = parseFloat(v); return isNaN(n) ? -Infinity : n; };

  rows.sort((a, b) => {
    let va = currentSortKey.split('.').reduce((o, k) => o?.[k], a);
    let vb = currentSortKey.split('.').reduce((o, k) => o?.[k], b);
    if (numCols.has(currentSortKey)) {
      va = num(va);
      vb = num(vb);
    } else {
      va = String(va ?? '').toLowerCase();
      vb = String(vb ?? '').toLowerCase();
    }
    if (va < vb) return currentSortDir === 'asc' ? -1 : 1;
    if (va > vb) return currentSortDir === 'asc' ? 1 : -1;
    return 0;
  });
  return rows;
}

function buildTable(rows, services) {
  const svcMap = new Map(services.map(s => [s.service_id, s.name]));
  const columns = [
    { key: 'name', label: 'SLO Name', render: r => `<strong>${esc(r.name)}</strong><div class="evidence mono">${esc(r.slo_id)} \u00b7 v${esc(r.version)}</div>`, sortable: true },
    { key: 'service_id', label: 'Service', render: r => `${esc(svcMap.get(r.service_id) || r.service_id)}<div class="small text-body-secondary">${esc(r.service_tier)}</div>`, sortable: true },
    { key: 'version', label: 'Version', className: 'mono', sortable: true },
    { key: 'service_tier', label: 'Tier', render: r => pill(r.service_tier), sortable: true },
    { key: 'target_display', label: 'Target', sortable: true },
    { key: 'window_label', label: 'Window', sortable: true },
    { key: 'sli_definition', label: 'SLI Definition', sortable: true },
    { key: 'specialist_owner', label: 'Specialist Owner', sortable: true },
    { key: 'business_owner', label: 'Business Owner', sortable: true },
    { key: 'status', label: 'Status', render: r => pill(r.status, statusClass(r.status)), sortable: true },
    { key: 'current_pct', label: 'Reported %', render: r => fmtPct(r.current_pct, 2), className: 'num', sortable: true },
    { key: 'error_budget_remaining_pct', label: 'Budget %', render: r => fmtPct(r.error_budget_remaining_pct, 1), className: 'num', sortable: true },
    { key: 'burn_1h', label: 'Burn 1h', render: r => fmtBurn(r.burn_1h), className: 'num mono', sortable: true },
    { key: 'burn_6h', label: 'Burn 6h', render: r => fmtBurn(r.burn_6h), className: 'num mono', sortable: true },
    { key: 'burn_24h', label: 'Burn 24h', render: r => fmtBurn(r.burn_24h), className: 'num mono', sortable: true },
  ];

  return createTable(columns, rows, {
    sortKey: currentSortKey,
    sortDir: currentSortDir,
    onSort: (key) => {
      if (currentSortKey === key) currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
      else { currentSortKey = key; currentSortDir = 'asc'; }
      render();
    },
    onRowClick: (row) => {
      window.location.hash = `#/slo-detail?slo=${encodeURIComponent(row.slo_id)}`;
    },
    emptyMessage: 'No SLOs match the current filters.',
  });
}

function exportCsv(rows) {
  const state = STORE.getState();
  const svcMap = new Map(state.services.map(s => [s.service_id, s.name]));
  const cols = [
    { label: 'SLO Name', key: 'name' },
    { label: 'SLO ID', key: 'slo_id' },
    { label: 'Version', key: 'version' },
    { label: 'Service', key: 'service_id', transform: v => svcMap.get(v) || v },
    { label: 'Tier', key: 'service_tier' },
    { label: 'Target', key: 'target_display' },
    { label: 'Window', key: 'window_label' },
    { label: 'SLI Definition', key: 'sli_definition' },
    { label: 'Specialist Owner', key: 'specialist_owner' },
    { label: 'Business Owner', key: 'business_owner' },
    { label: 'Status', key: 'status' },
    { label: 'Reported %', key: 'current_pct', transform: v => fmtPct(v, 2) },
    { label: 'Budget Remaining %', key: 'error_budget_remaining_pct', transform: v => fmtPct(v, 1) },
    { label: 'Burn 1h', key: 'burn_1h', transform: v => fmtBurn(v) },
    { label: 'Burn 6h', key: 'burn_6h', transform: v => fmtBurn(v) },
    { label: 'Burn 24h', key: 'burn_24h', transform: v => fmtBurn(v) },
  ];
  const csv = toCsv(rows.map(r => ({ ...r, ...cols.reduce((o, c) => { o[c.key] = c.transform ? c.transform(r[c.key]) : r[c.key]; return o; }, {}) })), cols);
  downloadBlob(csv, `slo-standards-${new Date().toISOString().slice(0,10)}.csv`);
}
