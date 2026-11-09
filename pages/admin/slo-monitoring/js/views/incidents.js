/** Incident Assurance view */
import { STORE } from '../store.js';
import { esc, fmtDateTime, fmtDateTimeText, statusClass, toCsv, downloadBlob } from '../util.js';
import { pill, searchBox, createTable, chip, chipClear, select } from '../ui.js';

let currentSortKey = 'incident_id';
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
  const { incidents, snapshotsBySlo, slos, ui } = state;
  const main = document.getElementById('app-main');
  if (!main) return;

  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <div class="page-title-block">
      <div class="context">Platform Admin \u00b7 Reliability Governance</div>
      <h1>Incident & Recovery Assurance</h1>
      <p class="subtitle">Verify recovery evidence and post-incident assurance without operating the incident.</p>
    </div>
  `;

  // Filter bar
  const severities = [...new Set(incidents.map(i => i.severity).filter(Boolean))].sort();
  const states = [...new Set(incidents.map(i => i.operational_state).filter(Boolean))].sort();
  const bar = document.createElement('div');
  bar.className = 'filter-bar';
  bar.appendChild(searchBox('Search incidents\u2026', v => { STORE.setSearch(v); }, ui.search, 'incidents-search'));

  const sevGroup = document.createElement('div');
  sevGroup.className = 'filter-group';
  severities.forEach(sev => sevGroup.appendChild(chip(sev, ui.filters.status.includes(sev), () => toggleFilter('status', sev), incidents.filter(i => i.severity === sev).length)));
  bar.appendChild(sevGroup);

  const stateGroup = document.createElement('div');
  stateGroup.className = 'filter-group';
  states.forEach(st => stateGroup.appendChild(chip(st, ui.filters.tier.includes(st), () => toggleFilter('tier', st), incidents.filter(i => i.operational_state === st).length)));
  bar.appendChild(stateGroup);

  if (ui.filters.status.length || ui.filters.tier.length) bar.appendChild(chipClear('Clear filters', () => STORE.clearFilters()));

  // Table
  const filtered = getFilteredRows(incidents, ui);
  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-wrapper incident-table-wrap';
  tableWrap.style.overflowX = 'auto';
  tableWrap.appendChild(buildTable(filtered, snapshotsBySlo, slos));

  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn-outline-secondary btn-sm mt-2';
  exportBtn.textContent = 'Export CSV';
  exportBtn.addEventListener('click', () => exportCsv(filtered, snapshotsBySlo, slos));

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

function getFilteredRows(incidents, ui) {
  let rows = [...incidents];
  const search = ui.search.toLowerCase();
  if (search) {
    rows = rows.filter(i => [(i.incident_id || i.id), i.title, i.customer_impact, i.recovery_position].some(v => v?.toLowerCase().includes(search)));
  }
  if (ui.filters.status.length) rows = rows.filter(i => ui.filters.status.includes(i.severity));
  if (ui.filters.tier.length) rows = rows.filter(i => ui.filters.tier.includes(i.operational_state));
  rows.sort((a, b) => {
    let va = currentSortKey.split('.').reduce((o, k) => o?.[k], a);
    let vb = currentSortKey.split('.').reduce((o, k) => o?.[k], b);
    if (currentSortKey === 'incident_id' || currentSortKey === 'id') {
      va = a.incident_id || a.id || '';
      vb = b.incident_id || b.id || '';
    }
    va = String(va ?? '').toLowerCase();
    vb = String(vb ?? '').toLowerCase();
    if (va < vb) return currentSortDir === 'asc' ? -1 : 1;
    if (va > vb) return currentSortDir === 'asc' ? 1 : -1;
    return 0;
  });
  return rows;
}

function buildTable(rows, snapshotsBySlo, slos) {
  const sloMap = new Map(slos.map(s => [s.slo_id, s]));
  const columns = [
    { key: 'incident_id', label: 'Incident ID', render: r => `<strong>${esc(r.incident_id || r.id)}</strong>`, sortable: true, className: 'sticky-col-1' },
    { key: 'title', label: 'Title', render: r => `<div style="max-width:260px;">${esc(r.title)}</div>`, sortable: true, className: 'sticky-col-2' },
    { key: 'severity', label: 'Severity', render: r => pill(r.severity, /^P[12]\b/.test(r.severity) ? 'bad' : 'warn'), sortable: true },
    { key: 'operational_state', label: 'State', render: r => pill(r.operational_state), sortable: true },
    { key: 'opened_at', label: 'Opened', render: r => fmtDateTimeText(r.opened_at), className: 'mono', sortable: true },
    { key: 'specialist_owner', label: 'Specialist Owner', render: r => r.specialist_owner || '\u2014', sortable: true },
    { key: 'affected_services', label: 'Affected Services', render: r => r.affected_services?.join(', ') || '\u2014' },
    { key: 'customer_impact', label: 'Customer Impact', render: r => `<div style="max-width:260px;" class="small">${esc(r.customer_impact || '\u2014')}</div>` },
    { key: 'recovery_position', label: 'Recovery Position', render: r => `<div style="max-width:260px;" class="small">${esc(r.recovery_position || '\u2014')}</div>` },
    { key: 'resolution_criteria', label: 'Resolution Criteria', render: r => `<div style="max-width:260px;" class="small">${esc(r.resolution_criteria || '\u2014')}</div>` },
    { key: 'recovery_evidence', label: 'Recovery Evidence', render: r => r.recovery_evidence || '\u2014', className: 'mono' },
    { key: 'resolution_criteria_met', label: 'Criteria Met', render: r => r.resolution_criteria_met ? pill('Yes', 'good') : (r.resolution_criteria_met === false ? pill('No', 'bad') : '\u2014') },
    { key: 'customer_impact_ended', label: 'Impact Ended', render: r => r.customer_impact_ended ? pill('Yes', 'good') : (r.customer_impact_ended === false ? pill('No', 'warn') : '\u2014') },
    { key: 'pir_status', label: 'PIR Status', render: r => r.pir_status || '\u2014' },
    { key: 'governance.decision', label: 'Governance Decision', render: r => r.governance?.decision || '\u2014' },
    { key: 'governance.assurance', label: 'Assurance', render: r => pill(r.governance?.assurance || '\u2014'), sortable: true },
    { key: 'referencing_slos', label: 'Referencing SLO Snapshots', render: r => {
      const incId = r.incident_id || r.id;
      const refs = [];
      snapshotsBySlo.forEach((snaps, sloId) => {
        snaps.forEach(snap => {
          if (snap.incident_id === incId) {
            const s = sloMap.get(sloId);
            refs.push(s ? `${s.name} (${sloId})` : sloId);
          }
        });
      });
      return refs.length ? refs.join(', ') : '\u2014';
    }},
  ];

  return createTable(columns, rows, {
    keyField: 'incident_id',
    sortKey: currentSortKey,
    sortDir: currentSortDir,
    onSort: (key) => {
      if (currentSortKey === key) currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
      else { currentSortKey = key; currentSortDir = 'asc'; }
      render();
    },
    emptyMessage: 'No incidents match the current filters.',
  });
}

function exportCsv(rows, snapshotsBySlo, slos) {
  const sloMap = new Map(slos.map(s => [s.slo_id, s]));
  const cols = [
    { label: 'Incident ID', key: 'incident_id', transform: (v, r) => r.incident_id || r.id },
    { label: 'Title', key: 'title' },
    { label: 'Severity', key: 'severity' },
    { label: 'Operational State', key: 'operational_state' },
    { label: 'Opened At', key: 'opened_at', transform: v => v ? new Date(v).toISOString() : '\u2014' },
    { label: 'Specialist Owner', key: 'specialist_owner' },
    { label: 'Affected Services', key: 'affected_services', transform: v => v?.join('; ') || '\u2014' },
    { label: 'Customer Impact', key: 'customer_impact' },
    { label: 'Recovery Position', key: 'recovery_position' },
    { label: 'Resolution Criteria', key: 'resolution_criteria' },
    { label: 'Recovery Evidence', key: 'recovery_evidence' },
    { label: 'Criteria Met', key: 'resolution_criteria_met', transform: v => v ? 'Yes' : (v === false ? 'No' : '\u2014') },
    { label: 'Impact Ended', key: 'customer_impact_ended', transform: v => v ? 'Yes' : (v === false ? 'No' : '\u2014') },
    { label: 'PIR Status', key: 'pir_status' },
    { label: 'Governance Decision', key: 'governance.decision', transform: (v, r) => r.governance?.decision || '\u2014' },
    { label: 'Governance Assurance', key: 'governance.assurance', transform: (v, r) => r.governance?.assurance || '\u2014' },
    { label: 'Referencing SLOs', key: 'referencing_slos', transform: (v, r) => {
      const incId = r.incident_id || r.id;
      const refs = [];
      snapshotsBySlo.forEach((snaps, sloId) => {
        snaps.forEach(snap => { if (snap.incident_id === incId) { const s = sloMap.get(sloId); refs.push(s ? `${s.name} (${sloId})` : sloId); } });
      });
      return refs.join('; ') || '\u2014';
    }},
  ];
  const csv = toCsv(rows.map(r => ({ ...r, ...cols.reduce((o, c) => { o[c.key] = c.transform ? c.transform(r[c.key], r) : r[c.key]; return o; }, {}) })), cols);
  downloadBlob(csv, `incident-assurance-${new Date().toISOString().slice(0,10)}.csv`);
}
