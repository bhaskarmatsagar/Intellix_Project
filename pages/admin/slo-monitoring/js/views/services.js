/** Service Posture view */
import { STORE } from '../store.js';
import { esc, fmtPct, fmtBurn, statusClass, toCsv, downloadBlob } from '../util.js';
import { pill, searchBox, createTable, chip, chipClear, select, kpiCard } from '../ui.js';

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
  const { services, slos, ui } = state;
  const main = document.getElementById('app-main');
  if (!main) return;

  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <div class="page-title-block">
      <div class="context">Platform Admin \u00b7 Reliability Governance</div>
      <h1>Service Reliability Posture</h1>
      <p class="subtitle">Review service-health evidence, governed SLO relationships, dependencies, customer impact and open reliability governance.</p>
    </div>
  `;

  // KPIs
  const kpiGrid = document.createElement('div');
  kpiGrid.className = 'kpi-grid';
  const healthy = services.filter(s => s.status === 'Healthy').length;
  const atRisk = services.filter(s => s.status === 'At Risk').length;
  const degraded = services.filter(s => s.status === 'Degraded').length;
  kpiGrid.appendChild(kpiCard('Total Services', services.length, `${healthy} Healthy \u00b7 ${atRisk} At Risk \u00b7 ${degraded} Degraded`));
  kpiGrid.appendChild(kpiCard('Tier 0 Services', services.filter(s => s.tier === 'Tier 0').length, 'Highest criticality'));
  kpiGrid.appendChild(kpiCard('Services w/ SLOs', services.filter(svc => slos.some(s => s.service_id === svc.service_id)).length, 'Governed by SLOs'));

  // Filter bar
  const tiers = [...new Set(services.map(s => s.tier).filter(Boolean))].sort();
  const statuses = [...new Set(services.map(s => s.status).filter(Boolean))].sort();
  const bar = document.createElement('div');
  bar.className = 'filter-bar';
  bar.appendChild(searchBox('Search services\u2026', v => { STORE.setSearch(v); }, ui.search, 'services-search'));

  const statusGroup = document.createElement('div');
  statusGroup.className = 'filter-group';
  statuses.forEach(st => statusGroup.appendChild(chip(st, ui.filters.status.includes(st), () => toggleFilter('status', st), services.filter(s => s.status === st).length)));
  bar.appendChild(statusGroup);

  const tierSel = select([{ value: '', label: 'All Tiers' }, ...tiers.map(t => ({ value: t, label: t }))], ui.filters.tier.join(','), v => STORE.setFilters({ tier: v ? v.split(',') : [] }));
  const tierGroup = document.createElement('div');
  tierGroup.className = 'filter-group';
  tierGroup.innerHTML = '<label>Tier</label>';
  tierGroup.appendChild(tierSel);
  bar.appendChild(tierGroup);

  if (ui.filters.status.length || ui.filters.tier.length) bar.appendChild(chipClear('Clear filters', () => STORE.clearFilters()));

  // Table
  const filtered = getFilteredRows(services, ui);
  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-wrapper';
  tableWrap.appendChild(buildTable(filtered, slos));

  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn-outline-secondary btn-sm mt-2';
  exportBtn.textContent = 'Export CSV';
  exportBtn.addEventListener('click', () => exportCsv(filtered, slos));

  main.innerHTML = '';
  main.appendChild(header);
  main.appendChild(kpiGrid);
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

function getFilteredRows(services, ui) {
  let rows = [...services];
  const search = ui.search.toLowerCase();
  if (search) rows = rows.filter(s => [s.name, s.service_id, s.customer_impact].some(v => v?.toLowerCase().includes(search)));
  if (ui.filters.status.length) rows = rows.filter(s => ui.filters.status.includes(s.status));
  if (ui.filters.tier.length) rows = rows.filter(s => ui.filters.tier.includes(s.tier));
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

function buildTable(rows, slos) {
  const columns = [
    { key: 'name', label: 'Service', render: r => `<strong>${esc(r.name)}</strong><div class="evidence mono">${esc(r.service_id)}</div>`, sortable: true },
    { key: 'tier', label: 'Tier', render: r => pill(r.tier), sortable: true },
    { key: 'status', label: 'Status', render: r => pill(r.status, statusClass(r.status)), sortable: true },
    { key: 'customer_impact', label: 'Customer Impact', render: r => `<div class="small">${esc(r.customer_impact || '\u2014')}</div>` },
    { key: 'slo_ids', label: 'Governed SLOs', render: r => {
      const matchingSlos = slos.filter(s => s.service_id === r.service_id);
      return matchingSlos.length ? matchingSlos.map(s =>
        `<div><a href="#/slo-detail?slo=${encodeURIComponent(s.slo_id)}" class="text-decoration-none">${esc(s.name)}</a> ${pill(s.status, statusClass(s.status))}</div>`
      ).join('<hr class="my-1">') : '\u2014';
    }},
    { key: 'dependencies', label: 'Dependencies', render: r => r.dependencies?.map(d => `<span class="badge bg-body-tertiary text-body me-1 mb-1">${esc(d)}</span>`).join('') || '\u2014' },
    { key: 'governance_posture', label: 'Governance Posture', render: r => pill(r.governance_posture || 'Normal'), sortable: true },
  ];

  return createTable(columns, rows, {
    sortKey: currentSortKey,
    sortDir: currentSortDir,
    onSort: (key) => {
      if (currentSortKey === key) currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
      else { currentSortKey = key; currentSortDir = 'asc'; }
      render();
    },
    emptyMessage: 'No services match the current filters.',
  });
}

function exportCsv(rows, slos) {
  const cols = [
    { label: 'Service Name', key: 'name' },
    { label: 'Service ID', key: 'service_id' },
    { label: 'Tier', key: 'tier' },
    { label: 'Status', key: 'status' },
    { label: 'Customer Impact', key: 'customer_impact' },
    { label: 'SLOs', key: 'service_id', transform: (v) => slos.filter(s => s.service_id === v).map(s => `${s.name} (${s.status})`).join('; ') || '\u2014' },
    { label: 'Dependencies', key: 'dependencies', transform: v => v?.join('; ') || '\u2014' },
    { label: 'Governance Posture', key: 'governance_posture' },
  ];
  const csv = toCsv(rows.map(r => ({ ...r, ...cols.reduce((o, c) => { o[c.key] = c.transform ? c.transform(r[c.key], r) : r[c.key]; return o; }, {}) })), cols);
  downloadBlob(csv, `service-posture-${new Date().toISOString().slice(0,10)}.csv`);
}
