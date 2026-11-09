/** Monitoring view - main SLO monitoring dashboard */
import { STORE } from '../store.js';
import { API } from '../api.js';
import { ROUTER } from '../router.js';
import { esc, fmtDateTime, fmtDateTimeText, fmtPct, fmtBurn, statusClass, statusSortKey, toCsv, downloadBlob, debounce, FU_STATUS } from '../util.js';
import { pill, chip, chipClear, searchBox, kpiCard, createTable, openDrawer, connectionBadge, themeToggle, miniBar, reconIcon, toast, openDialog } from '../ui.js';
import { donutChart, hbarChart, groupedBarChart, stackedBarChart } from '../charts.js';

let filteredRows = [];
let fuSearch = '';
let fuFilters = { status: [], priority: [], owner: [], overdue: false };
let fuSortKey = 'status';
let fuSortDir = 'asc';
let unsubscribe = null;

export async function init(params) {
  render();
  unsubscribe = STORE.subscribe(render);
}

export function update() {
  render();
}

export function destroy() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

function render() {
  const state = STORE.getState();
  if (state.ui.view !== 'monitoring') return;

  const { meta, slos, followups, services, connection, lastFetch, ui } = state;
  const main = document.getElementById('app-main');
  if (!main) return;

  // Page header
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <div class="page-title-block">
      <div class="context">Platform Admin \u00b7 Reliability Governance</div>
      <h1>SLO Monitoring &amp; Reliability Assurance</h1>
      <p class="subtitle">Governed service reliability posture, measured objectives, evidence integrity and independent assurance follow-through.</p>
    </div>
    <div class="page-header-actions" id="header-actions"></div>
  `;
  const actions = header.querySelector('#header-actions');
  if (meta) {
    actions.appendChild(connectionBadge(connection, lastFetch, refreshNow, setPollInterval, STORE.getPollInterval()));
    actions.appendChild(themeToggle(getCurrentTheme(), t => window.setTheme(t)));
  }

  // Role boundary
  const roleBoundary = document.createElement('div');
  roleBoundary.className = 'role-boundary';
  roleBoundary.innerHTML = `<strong>Role boundary:</strong> ${esc(meta?.role_boundary || 'Platform Admin governs SLO standards and versions, reliability exceptions, escalation policy, maintenance SLO treatment, recovery/corrective assurance and evidence.')}`;

  // KPI Cards
  const kpiGrid = document.createElement('div');
  kpiGrid.className = 'kpi-grid';
  const kpis = computeKpis(slos, followups, meta);
  kpis.forEach(k => kpiGrid.appendChild(kpiCard(k.label, k.value, k.note, k.badge)));

  // Charts
  const chartGrid = document.createElement('div');
  chartGrid.className = 'chart-grid';
  chartGrid.appendChild(donutChart(statusDonutData(slos), 'SLO Status Distribution'));
  chartGrid.appendChild(hbarChart(budgetBarData(slos), 'Error Budget Remaining', 0));
  chartGrid.appendChild(groupedBarChart(burnRateData(slos), 'Burn Rates (1h / 6h / 24h)'));
  chartGrid.appendChild(stackedBarChart(followupStatusData(followups), 'Follow-up Status'));

  // SLO Table Filter Bar
  filteredRows = getFilteredRows(slos, services, ui);
  const filterBar = buildFilterBar(slos, services, ui, filteredRows.length);

  // SLO Table
  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-wrapper';
  tableWrap.appendChild(buildTable(filteredRows, services, ui));

  // Export button
  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn-outline-secondary btn-sm mt-2';
  exportBtn.textContent = 'Export CSV';
  exportBtn.addEventListener('click', () => exportCsv(filteredRows));

  // Follow-up Register Section
  const fuSection = buildFollowupRegister(followups, services, slos);

  // Drawer
  if (ui.drawerOpen && ui.selectedSloId) {
    openDrawer('SLO Detail', buildDrawerContent(ui.selectedSloId), () => {
      STORE.setDrawerOpen(false);
      STORE.setSelectedSlo(null);
      ROUTER.go('monitoring');
    });
  }

  // Assemble
  main.innerHTML = '';
  main.appendChild(header);
  main.appendChild(roleBoundary);
  main.appendChild(kpiGrid);
  main.appendChild(chartGrid);
  main.appendChild(filterBar);
  main.appendChild(tableWrap);
  main.appendChild(exportBtn);
  main.appendChild(fuSection);
}

function refreshNow() {
  STORE.fetchAll()
    .then(() => toast('Data refreshed', 'good'))
    .catch(e => toast(`Refresh failed: ${e.message}`, 'bad'));
}

function setPollInterval(ms) {
  STORE.setPollInterval(ms);
}

function computeKpis(slos, followups, meta) {
  const onTarget = slos.filter(s => /on target/i.test(s.status)).length;
  const atRisk = slos.filter(s => /at risk/i.test(s.status)).length;
  const breached = slos.filter(s => /breach/i.test(s.status)).length;
  const openFollowups = followups.filter(f => f.status !== FU_STATUS.CLOSED).length;
  const awaitingReview = followups.filter(f => f.status === FU_STATUS.EVIDENCE_RETURNED).length;
  const now = meta ? new Date(meta.data_as_of) : new Date();

  // Diff <= 120 minutes includes overdue items (diff < 0)
  const overdueOrDue = followups.filter(f => {
    if (f.status === FU_STATUS.CLOSED) return false;
    const due = new Date(f.due_at);
    const diff = due - now;
    return diff <= 120 * 60 * 1000;
  }).length;

  const concerns = slos.filter(s => {
    const snap = STORE.getState().snapshotsBySlo.get(s.slo_id);
    const d = snap?.[0] || {};
    const rec = d.sli_reconciled ?? s.sli_reconciled ?? 1;
    const missing = d.exclusion_evidence_missing ?? s.exclusion_evidence_missing ?? (d.exclusion_evidence !== undefined ? (d.exclusion_evidence ? 0 : 1) : 0);
    const quality = d.quality ?? s.quality ?? 'Validated';
    return !rec || !!missing || quality !== 'Validated';
  }).length;

  const latestSnap = meta ? fmtDateTimeText(meta.data_as_of) : '\u2014';

  return [
    { label: 'Governed SLOs', value: slos.length, note: `${onTarget} On Target \u00b7 ${atRisk} At Risk \u00b7 ${breached} Breached` },
    { label: 'On Target', value: onTarget, note: 'Within error budget', badge: { text: 'Good', variant: 'good' } },
    { label: 'At Risk', value: atRisk, note: 'Elevated burn rate', badge: atRisk ? { text: 'Attention', variant: 'warn' } : { text: 'Clear', variant: 'good' } },
    { label: 'Breached', value: breached, note: 'Budget exhausted', badge: breached ? { text: 'Critical', variant: 'bad' } : { text: 'Clear', variant: 'good' } },
    { label: 'Open Follow-ups', value: openFollowups, note: `${awaitingReview} awaiting review`, badge: openFollowups ? { text: 'Open', variant: 'warn' } : { text: 'Current', variant: 'good' } },
    { label: 'Due soon / overdue', value: overdueOrDue, note: 'Measured at snapshot time', badge: overdueOrDue ? { text: 'Urgent', variant: 'bad' } : { text: 'Clear', variant: 'good' } },
    { label: 'SLOs w/ Concerns', value: concerns, note: 'Reconciliation or evidence gaps', badge: concerns ? { text: 'Review', variant: 'warn' } : { text: 'Clean', variant: 'good' } },
    { label: 'Latest Snapshot', value: latestSnap, note: 'Position as of data_as_of' },
  ];
}

function statusDonutData(slos) {
  const counts = { 'On Target': 0, 'At Risk': 0, Breached: 0 };
  slos.forEach(s => {
    const sLow = s.status.toLowerCase();
    if (sLow.includes('on target')) counts['On Target']++;
    else if (sLow.includes('at risk')) counts['At Risk']++;
    else if (sLow.includes('breach')) counts.Breached++;
  });
  return [
    { label: 'On Target', value: counts['On Target'], variant: 'good' },
    { label: 'At Risk', value: counts['At Risk'], variant: 'warn' },
    { label: 'Breached', value: counts.Breached, variant: 'bad' },
  ].filter(d => d.value > 0);
}

function budgetBarData(slos) {
  return slos
    .map(s => {
      const pct = parseFloat(s.error_budget_remaining_pct);
      if (isNaN(pct)) return null;
      let variant = 'good';
      if (pct <= 10) variant = 'bad';
      else if (pct <= 30) variant = 'warn';
      return { label: `${s.name} (${s.slo_id})`, value: pct, variant };
    })
    .filter(Boolean)
    .sort((a, b) => a.value - b.value)
    .slice(0, 15);
}

function burnRateData(slos) {
  return slos
    .map(s => ({
      slo: s.name,
      burns: {
        '1h': s.burn_1h != null ? parseFloat(s.burn_1h) : null,
        '6h': s.burn_6h != null ? parseFloat(s.burn_6h) : null,
        '24h': s.burn_24h != null ? parseFloat(s.burn_24h) : null,
      },
    }))
    .filter(d => Object.values(d.burns).some(v => v != null))
    .sort((a, b) => {
      const aMax = Math.max(...Object.values(a.burns).filter(v => v != null));
      const bMax = Math.max(...Object.values(b.burns).filter(v => v != null));
      return bMax - aMax;
    });
}

function followupStatusData(followups) {
  const statuses = [FU_STATUS.AWAITING, FU_STATUS.EVIDENCE_RETURNED, FU_STATUS.ADDITIONAL_REQUIRED, FU_STATUS.CLOSED];
  return statuses.map(st => {
    const count = followups.filter(f => f.status === st).length;
    let variant = 'info';
    if (st === FU_STATUS.AWAITING) variant = 'warn';
    else if (st === FU_STATUS.EVIDENCE_RETURNED) variant = 'info';
    else if (st === FU_STATUS.ADDITIONAL_REQUIRED) variant = 'bad';
    else if (st === FU_STATUS.CLOSED) variant = 'good';
    return { status: st, count, variant };
  }).filter(d => d.count > 0);
}

function buildFilterBar(slos, services, ui, filteredCount) {
  const state = STORE.getState();
  const tiers = [...new Set(slos.map(s => s.service_tier).filter(Boolean))].sort();
  const serviceOpts = services.map(s => ({ value: s.service_id, label: `${s.name} (${s.service_id})` }));
  const qualities = [...new Set(slos.map(s => {
    const snap = state.snapshotsBySlo.get(s.slo_id);
    return snap?.[0]?.quality || 'Unknown';
  }).filter(Boolean))].sort();

  const bar = document.createElement('div');
  bar.className = 'filter-bar';

  bar.appendChild(searchBox('Search SLOs\u2026', v => { STORE.setSearch(v); }, ui.search, 'slo-search'));

  const statusGroup = document.createElement('div');
  statusGroup.className = 'filter-group';
  const statuses = ['On Target', 'At Risk', 'Breached'];
  statuses.forEach(st => {
    const active = ui.filters.status.includes(st);
    statusGroup.appendChild(chip(st, active, () => toggleFilter('status', st), slos.filter(s => s.status === st).length));
  });
  bar.appendChild(statusGroup);

  const tierSel = select([{ value: '', label: 'All Tiers' }, ...tiers.map(t => ({ value: t, label: t }))], ui.filters.tier.join(','), v => STORE.setFilters({ tier: v ? v.split(',') : [] }));
  const tierGroup = document.createElement('div');
  tierGroup.className = 'filter-group';
  tierGroup.innerHTML = '<label>Tier</label>';
  tierGroup.appendChild(tierSel);
  bar.appendChild(tierGroup);

  const svcSel = select([{ value: '', label: 'All Services' }, ...serviceOpts], ui.filters.service.join(','), v => STORE.setFilters({ service: v ? v.split(',') : [] }));
  const svcGroup = document.createElement('div');
  svcGroup.className = 'filter-group';
  svcGroup.innerHTML = '<label>Service</label>';
  svcGroup.appendChild(svcSel);
  bar.appendChild(svcGroup);

  const qualSel = select([{ value: '', label: 'All Quality' }, ...qualities.map(q => ({ value: q, label: q }))], ui.filters.quality.join(','), v => STORE.setFilters({ quality: v ? v.split(',') : [] }));
  const qualGroup = document.createElement('div');
  qualGroup.className = 'filter-group';
  qualGroup.innerHTML = '<label>Evidence Quality</label>';
  qualGroup.appendChild(qualSel);
  bar.appendChild(qualGroup);

  const concernWrap = document.createElement('label');
  concernWrap.style.display = 'flex';
  concernWrap.style.alignItems = 'center';
  concernWrap.style.gap = '6px';
  concernWrap.style.fontSize = '0.8125rem';
  concernWrap.innerHTML = `<input type="checkbox" ${ui.filters.concerns ? 'checked' : ''}> Has measurement concerns`;
  concernWrap.querySelector('input').addEventListener('change', e => STORE.setFilters({ concerns: e.target.checked }));
  bar.appendChild(concernWrap);

  const fuWrap = document.createElement('label');
  fuWrap.style.display = 'flex';
  fuWrap.style.alignItems = 'center';
  fuWrap.style.gap = '6px';
  fuWrap.style.fontSize = '0.8125rem';
  fuWrap.innerHTML = `<input type="checkbox" ${ui.filters.openFollowup ? 'checked' : ''}> Has open follow-up`;
  fuWrap.querySelector('input').addEventListener('change', e => STORE.setFilters({ openFollowup: e.target.checked }));
  bar.appendChild(fuWrap);

  const hasFilters = ui.filters.status.length || ui.filters.tier.length || ui.filters.service.length || ui.filters.quality.length || ui.filters.concerns || ui.filters.openFollowup;
  if (hasFilters) {
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
  if (search) {
    rows = rows.filter(s => [s.name, s.slo_id, s.service_id, s.specialist_owner, s.business_owner].some(v => v?.toLowerCase().includes(search)));
  }
  if (ui.filters.status.length) rows = rows.filter(s => ui.filters.status.includes(s.status));
  if (ui.filters.tier.length) rows = rows.filter(s => ui.filters.tier.includes(s.service_tier));
  if (ui.filters.service.length) rows = rows.filter(s => ui.filters.service.includes(s.service_id));
  if (ui.filters.quality.length) {
    rows = rows.filter(s => {
      const snap = STORE.getState().snapshotsBySlo.get(s.slo_id);
      return snap?.[0]?.quality && ui.filters.quality.includes(snap[0].quality);
    });
  }
  if (ui.filters.concerns) {
    rows = rows.filter(s => {
      const snap = STORE.getState().snapshotsBySlo.get(s.slo_id);
      const d = snap?.[0] || {};
      const rec = d.sli_reconciled ?? s.sli_reconciled ?? 1;
      const missing = d.exclusion_evidence_missing ?? s.exclusion_evidence_missing ?? (d.exclusion_evidence !== undefined ? (d.exclusion_evidence ? 0 : 1) : 0);
      const quality = d.quality ?? s.quality ?? 'Validated';
      return !rec || !!missing || quality !== 'Validated';
    });
  }
  if (ui.filters.openFollowup) {
    const fuSloIds = new Set(STORE.getState().followups.filter(f => f.status !== FU_STATUS.CLOSED).map(f => f.slo_id));
    rows = rows.filter(s => fuSloIds.has(s.slo_id));
  }

  const num = v => { const n = parseFloat(v); return isNaN(n) ? -Infinity : n; };
  const snapOf = s => (STORE.getState().snapshotsBySlo.get(s.slo_id) || [])[0] || {};
  const openFu = s => STORE.getState().followups.filter(f => f.slo_id === s.slo_id && f.status !== FU_STATUS.CLOSED).length;
  const svcName = s => (STORE.getState().services.find(x => x.service_id === s.service_id) || {}).name || s.service_id;

  const ACCESS = {
    statusSort: s => statusSortKey(s.status),
    status: s => statusSortKey(s.status),
    slo: s => s.name,
    service: s => svcName(s),
    target: s => num(s.target_pct ?? s.target_display),
    reported: s => num(s.current_pct),
    sli: s => num(snapOf(s).sli_pct),
    budget: s => num(s.error_budget_remaining_pct),
    burn1h: s => num(s.burn_1h),
    burn6h: s => num(s.burn_6h),
    burn24h: s => num(s.burn_24h),
    quality: s => snapOf(s).quality || '',
    followups: s => openFu(s),
  };

  const get = ACCESS[ui.sort.key] || (s => s[ui.sort.key] ?? '');
  rows.sort((a, b) => {
    const va = get(a);
    const vb = get(b);
    return (va < vb ? -1 : va > vb ? 1 : 0) * (ui.sort.dir === 'asc' ? 1 : -1);
  });
  return rows;
}

function buildTable(rows, services, ui) {
  const state = STORE.getState();
  const svcMap = new Map(services.map(s => [s.service_id, s.name]));
  const columns = [
    { key: 'slo', label: 'SLO', render: r => `<strong>${esc(r.name)}</strong><div class="evidence mono">${esc(r.slo_id)} \u00b7 v${esc(r.version)}</div>`, sortable: true },
    { key: 'service', label: 'Service', render: r => `${esc(svcMap.get(r.service_id) || r.service_id)}<div class="small text-body-secondary">${esc(r.service_tier)}</div>`, sortable: true },
    { key: 'target', label: 'Target', render: r => `${esc(r.target_display)}<div class="small text-body-secondary">${esc(r.window_label)}</div>`, sortable: true },
    { key: 'reported', label: 'Reported', render: r => fmtPct(r.current_pct, 2), className: 'num', sortable: true },
    { key: 'sli', label: 'SLI (counts)', render: r => {
      const snap = state.snapshotsBySlo.get(r.slo_id);
      const d = snap?.[0];
      if (!d) return '\u2014';
      const pct = d.sli_pct != null ? fmtPct(d.sli_pct, 2) : '\u2014';
      const rec = d.sli_reconciled ?? r.sli_reconciled ?? 1;
      const missing = d.exclusion_evidence_missing ?? r.exclusion_evidence_missing ?? (d.exclusion_evidence !== undefined ? (d.exclusion_evidence ? 0 : 1) : 0);
      return `${pct} ${reconIcon(rec, missing)}<div class="small text-body-secondary">${d.successful_count} / ${d.eligible_count} eligible \u00b7 ${d.excluded_count} excluded</div>`;
    }, sortable: true },
    { key: 'status', label: 'Status', render: r => pill(r.status, statusClass(r.status)), className: 'text-nowrap', sortable: true },
    { key: 'budget', label: 'Budget Left', render: r => miniBar(parseFloat(r.error_budget_remaining_pct)), className: 'num', sortable: true },
    { key: 'burn1h', label: 'Burn 1h', render: r => fmtBurn(r.burn_1h), className: 'num mono', sortable: true },
    { key: 'burn6h', label: 'Burn 6h', render: r => fmtBurn(r.burn_6h), className: 'num mono', sortable: true },
    { key: 'burn24h', label: 'Burn 24h', render: r => fmtBurn(r.burn_24h), className: 'num mono', sortable: true },
    { key: 'quality', label: 'Evidence Quality', render: r => {
      const snap = state.snapshotsBySlo.get(r.slo_id);
      const q = snap?.[0]?.quality || 'Unknown';
      return pill(q, q === 'Validated' ? 'good' : q === 'Pending' ? 'warn' : 'neutral');
    }, sortable: true },
    { key: 'followups', label: 'Open FU', render: r => {
      const count = state.followups.filter(f => f.slo_id === r.slo_id && f.status !== FU_STATUS.CLOSED).length;
      return count > 0 ? `<strong>${count}</strong>` : '\u2014';
    }, className: 'num', sortable: true },
  ];

  return createTable(columns, rows, {
    sortKey: ui.sort.key,
    sortDir: ui.sort.dir,
    onSort: (key) => {
      const dir = (ui.sort.key === key && ui.sort.dir === 'asc') ? 'desc' : 'asc';
      STORE.setSort({ key, dir });
    },
    onRowClick: (row) => {
      STORE.setSelectedSlo(row.slo_id);
      STORE.setDrawerOpen(true);
      ROUTER.go('monitoring', { slo: row.slo_id });
    },
    getRowClass: r => {
      const s = r.status.toLowerCase();
      if (s.includes('breach')) return 'critical-row';
      if (s.includes('at risk')) return 'attention-row';
      return '';
    },
    emptyMessage: 'No SLOs match the current filters.',
  });
}

function buildDrawerContent(sloId) {
  const state = STORE.getState();
  const slo = state.slos.find(s => s.slo_id === sloId);
  const snapshots = state.snapshotsBySlo.get(sloId) || [];
  const snap = snapshots[0];
  const followups = state.followups.filter(f => f.slo_id === sloId);
  const history = state.history.filter(h => h.subject_id === sloId).slice(0, 5);
  if (!slo) return document.createTextNode('SLO not found');

  const div = document.createElement('div');
  const svc = state.services.find(s => s.service_id === slo.service_id);
  const rec = snap?.sli_reconciled ?? slo.sli_reconciled ?? 1;
  const missing = snap?.exclusion_evidence_missing ?? slo.exclusion_evidence_missing ?? (snap?.exclusion_evidence !== undefined ? (snap.exclusion_evidence ? 0 : 1) : 0);
  const qual = snap?.quality ?? slo.quality ?? 'Validated';
  const hasConcerns = !rec || !!missing || qual !== 'Validated';

  div.innerHTML = `
    <div class="drawer-section">
      <h3>Definition</h3>
      <div class="drawer-row"><strong>SLO</strong><span>${esc(slo.name)} (${esc(slo.slo_id)}) v${esc(slo.version)}</span></div>
      <div class="drawer-row"><strong>Service</strong><span>${esc(svc?.name || slo.service_id)}</span></div>
      <div class="drawer-row"><strong>Tier</strong><span>${esc(slo.service_tier)}</span></div>
      <div class="drawer-row"><strong>SLI</strong><span>${esc(slo.sli_definition)}</span></div>
      <div class="drawer-row"><strong>Target</strong><span>${esc(slo.target_display)}</span></div>
      <div class="drawer-row"><strong>Window</strong><span>${esc(slo.window_label)}</span></div>
      <div class="drawer-row"><strong>Specialist Owner</strong><span>${esc(slo.specialist_owner)}</span></div>
      <div class="drawer-row"><strong>Business Owner</strong><span>${esc(slo.business_owner)}</span></div>
    </div>
    <div class="drawer-section">
      <h3>Position</h3>
      <div class="drawer-row"><strong>Reported</strong><span>${fmtPct(slo.current_pct, 2)}</span></div>
      <div class="drawer-row"><strong>SLI from counts</strong><span>${snap ? fmtPct(snap.sli_pct, 2) : '\u2014'} ${snap ? reconIcon(rec, missing) : ''}</span></div>
      ${snap ? `<div class="drawer-row"><strong>Formula</strong><span>successful \u00f7 eligible \u00d7 100 = ${esc(snap.successful_count)} \u00f7 ${esc(snap.eligible_count)} \u00d7 100 = ${fmtPct(snap.sli_pct, 2)}</span></div>` : ''}
      ${snap ? `<div class="drawer-row"><strong>Exclusions</strong><span>${esc(snap.excluded_count)} excluded \u00b7 basis: ${esc(snap.exclusion_basis || '\u2014')} \u00b7 evidence: ${esc(snap.exclusion_evidence || 'missing')}</span></div>` : ''}
      ${snap ? `<div class="drawer-row"><strong>Quality</strong><span>${pill(qual, qual === 'Validated' ? 'good' : 'warn')}</span></div>` : ''}
      ${snap?.quality_note ? `<div class="drawer-row"><strong>Quality Note</strong><span>${esc(snap.quality_note)}</span></div>` : ''}
    </div>
    <div class="drawer-section">
      <h3>Error Budget</h3>
      <div class="drawer-row"><strong>Remaining</strong><span>${miniBar(parseFloat(slo.error_budget_remaining_pct))}</span></div>
      <div class="drawer-row"><strong>Burn 1h</strong><span>${fmtBurn(slo.burn_1h)}</span></div>
      <div class="drawer-row"><strong>Burn 6h</strong><span>${fmtBurn(slo.burn_6h)}</span></div>
      <div class="drawer-row"><strong>Burn 24h</strong><span>${fmtBurn(slo.burn_24h)}</span></div>
      <div class="drawer-row"><strong>Forecast</strong><span>${esc(slo.breach_forecast)}</span></div>
    </div>
    <div class="drawer-section">
      <h3>Measurement Evidence</h3>
      ${snap ? `
      <div class="drawer-row"><strong>Source</strong><span>${esc(snap.source_reference)} (${esc(snap.source_owner)})</span></div>
      <div class="drawer-row"><strong>Observed</strong><span>${fmtDateTime(snap.observed_at)}</span></div>
      <div class="drawer-row"><strong>Population</strong><span>${esc(snap.population)}</span></div>
      <div class="drawer-row"><strong>Treatment</strong><span>${esc(snap.measurement_treatment)}</span></div>
      <div class="drawer-row"><strong>Incident</strong><span>${snap.incident_id ? esc(snap.incident_id) : 'No incident record'}</span></div>
      ` : '<div class="drawer-row"><span>No snapshot data</span></div>'}
    </div>
    <div class="drawer-section">
      <h3>Concerns</h3>
      ${hasConcerns ? `
        <ul style="margin:0; padding-left:1.2rem; font-size:0.8125rem;">
          ${!rec ? '<li>SLI not reconciled to eligible/successful counts</li>' : ''}
          ${missing ? `<li>${esc(snap?.excluded_count ?? slo.excluded_count)} excluded samples missing evidence</li>` : ''}
          ${qual !== 'Validated' ? `<li>Evidence quality: ${esc(qual)}</li>` : ''}
        </ul>
      ` : '<div class="drawer-row"><span>No measurement concerns</span></div>'}
    </div>
    <div class="drawer-section">
      <h3>Follow-ups (${followups.length})</h3>
      ${followups.length ? followups.map(f => `
        <div style="padding:8px 0; border-bottom:1px solid var(--border);">
          <strong>${esc(f.id)}</strong> \u00b7 ${pill(f.status)} \u00b7 ${pill(f.priority, f.priority === 'P0' ? 'bad' : f.priority === 'P1' ? 'warn' : 'info')}<br>
          <small>${esc(f.title)}</small><br>
          <small>Due: ${fmtDateTime(f.due_at)}</small>
        </div>
      `).join('') : '<div class="drawer-row"><span>No follow-ups</span></div>'}
    </div>
    <div class="drawer-section">
      <h3>Recent Governance History</h3>
      ${history.length ? history.map(h => `
        <div style="padding:8px 0; border-bottom:1px solid var(--border);">
          <strong>${esc(h.decision)}</strong> \u00b7 ${pill(h.assurance)} \u00b7 ${pill(h.status)}<br>
          <small>${esc(h.recorded_by)} \u00b7 ${fmtDateTime(h.recorded_at)}</small>
        </div>
      `).join('') : '<div class="drawer-row"><span>No history</span></div>'}
    </div>
  `;
  return div;
}

// ============================================================
// Follow-up Register
// ============================================================
function buildFollowupRegister(followups, services, slos) {
  const section = document.createElement('section');
  section.id = 'fu-section';
  section.style.marginTop = '24px';

  // Header with "Request specialist evidence" button
  const header = document.createElement('div');
  header.className = 'd-flex justify-content-between align-items-center mb-3';
  header.innerHTML = `
    <div>
      <h2 class="h5 mb-0">Follow-up Register</h2>
      <p class="text-body-secondary small mb-0">Specialist evidence requests, returns and independent reviews</p>
    </div>
    <button class="btn btn-primary btn-sm" id="request-fu-btn">Request Specialist Evidence</button>
  `;
  header.querySelector('#request-fu-btn').addEventListener('click', () => openRequestFollowupDialog(slos));
  section.appendChild(header);

  // Filter bar for follow-ups
  const fuFilterBar = buildFuFilterBar(followups);
  section.appendChild(fuFilterBar);

  // Follow-up table wrapper
  const fuTableWrap = document.createElement('div');
  fuTableWrap.id = 'fu-table-wrap';
  fuTableWrap.className = 'table-wrapper';
  const fuFiltered = getFilteredFollowups(followups);
  fuTableWrap.appendChild(buildFuTable(fuFiltered, services, slos));
  section.appendChild(fuTableWrap);

  return section;
}

function renderFuSection() {
  const oldSection = document.getElementById('fu-section');
  if (!oldSection) return;
  const state = STORE.getState();
  const newSection = buildFollowupRegister(state.followups, state.services, state.slos);
  oldSection.replaceWith(newSection);
}

function buildFuFilterBar(followups) {
  const bar = document.createElement('div');
  bar.className = 'filter-bar';

  // Search input: only replaces table wrapper, keeping input focus
  bar.appendChild(searchBox('Search follow-ups\u2026', debounce(v => { fuSearch = v; renderFuTable(); }, 150), fuSearch, 'fu-search'));

  // Status chips
  const statuses = [FU_STATUS.AWAITING, FU_STATUS.EVIDENCE_RETURNED, FU_STATUS.ADDITIONAL_REQUIRED, FU_STATUS.CLOSED];
  const statusGroup = document.createElement('div');
  statusGroup.className = 'filter-group';
  statuses.forEach(st => {
    const count = followups.filter(f => f.status === st).length;
    const active = fuFilters.status.includes(st);
    statusGroup.appendChild(chip(st, active, () => toggleFuFilter('status', st), count));
  });
  bar.appendChild(statusGroup);

  // Priority chips
  const priorities = ['P0', 'P1', 'P2'];
  const priorityGroup = document.createElement('div');
  priorityGroup.className = 'filter-group';
  priorities.forEach(p => {
    const count = followups.filter(f => f.priority === p).length;
    const active = fuFilters.priority.includes(p);
    priorityGroup.appendChild(chip(p, active, () => toggleFuFilter('priority', p), count));
  });
  bar.appendChild(priorityGroup);

  // Owner filter
  const owners = [...new Set(followups.map(f => f.specialist_owner).filter(Boolean))].sort();
  const ownerSel = select([{ value: '', label: 'All Owners' }, ...owners.map(o => ({ value: o, label: o }))], fuFilters.owner.join(','), v => {
    fuFilters.owner = v ? v.split(',') : [];
    renderFuSection();
  });
  const ownerGroup = document.createElement('div');
  ownerGroup.className = 'filter-group';
  ownerGroup.innerHTML = '<label>Owner</label>';
  ownerGroup.appendChild(ownerSel);
  bar.appendChild(ownerGroup);

  // Overdue checkbox
  const overdueWrap = document.createElement('label');
  overdueWrap.style.display = 'flex';
  overdueWrap.style.alignItems = 'center';
  overdueWrap.style.gap = '6px';
  overdueWrap.style.fontSize = '0.8125rem';
  const meta = STORE.getState().meta;
  const now = meta ? new Date(meta.data_as_of) : new Date();
  const overdueCount = followups.filter(f => f.status !== FU_STATUS.CLOSED && new Date(f.due_at) < now).length;
  overdueWrap.innerHTML = `<input type="checkbox" ${fuFilters.overdue ? 'checked' : ''}> Overdue (${overdueCount})`;
  overdueWrap.querySelector('input').addEventListener('change', e => {
    fuFilters.overdue = e.target.checked;
    renderFuSection();
  });
  bar.appendChild(overdueWrap);

  // Clear filters
  const hasFilters = fuFilters.status.length || fuFilters.priority.length || fuFilters.owner.length || fuFilters.overdue;
  if (hasFilters) {
    bar.appendChild(chipClear('Clear filters', () => {
      fuFilters = { status: [], priority: [], owner: [], overdue: false };
      renderFuSection();
    }));
  }

  return bar;
}

function toggleFuFilter(key, value) {
  const arr = [...fuFilters[key]];
  const idx = arr.indexOf(value);
  if (idx >= 0) arr.splice(idx, 1); else arr.push(value);
  fuFilters[key] = arr;
  renderFuSection();
}

function getFilteredFollowups(followups) {
  let rows = [...followups];
  const search = fuSearch.toLowerCase();
  if (search) {
    rows = rows.filter(f => [f.id, f.title, f.slo_id, f.specialist_owner, f.requested_by].some(v => v?.toLowerCase().includes(search)));
  }
  if (fuFilters.status.length) rows = rows.filter(f => fuFilters.status.includes(f.status));
  if (fuFilters.priority.length) rows = rows.filter(f => fuFilters.priority.includes(f.priority));
  if (fuFilters.owner.length) rows = rows.filter(f => fuFilters.owner.includes(f.specialist_owner));
  if (fuFilters.overdue) {
    const meta = STORE.getState().meta;
    const now = meta ? new Date(meta.data_as_of) : new Date();
    rows = rows.filter(f => f.status !== FU_STATUS.CLOSED && new Date(f.due_at) < now);
  }
  // Sort: open first, then P0\u2192P2, then due date
  rows.sort((a, b) => {
    const aClosed = a.status === FU_STATUS.CLOSED;
    const bClosed = b.status === FU_STATUS.CLOSED;
    if (aClosed !== bClosed) return aClosed ? 1 : -1;
    const pa = a.priority === 'P0' ? 0 : a.priority === 'P1' ? 1 : 2;
    const pb = b.priority === 'P0' ? 0 : b.priority === 'P1' ? 1 : 2;
    if (pa !== pb) return pa - pb;
    return new Date(a.due_at) - new Date(b.due_at);
  });
  return rows;
}

function buildFuTable(rows, services, slos) {
  const state = STORE.getState();
  const meta = state.meta;
  const now = meta ? new Date(meta.data_as_of) : new Date();
  const sloMap = new Map(slos.map(s => [s.slo_id, s]));

  const columns = [
    { key: 'id', label: 'ID', render: r => `<strong>${esc(r.id)}</strong>`, sortable: true },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'slo_id', label: 'SLO', render: r => {
      const s = sloMap.get(r.slo_id);
      return s ? `<a href="#/monitoring?slo=${encodeURIComponent(r.slo_id)}" class="text-decoration-none">${esc(s.name)}</a><div class="small text-body-secondary mono">${esc(r.slo_id)}</div>` : r.slo_id;
    }, sortable: true },
    { key: 'priority', label: 'Priority', render: r => pill(r.priority, r.priority === 'P0' ? 'bad' : r.priority === 'P1' ? 'warn' : 'info'), sortable: true },
    { key: 'status', label: 'Status', render: r => pill(r.status), sortable: true },
    { key: 'due_at', label: 'Due', render: r => {
      const due = new Date(r.due_at);
      const diff = due - now;
      const isOverdue = diff < 0 && r.status !== FU_STATUS.CLOSED;
      const countdown = isOverdue ? `<span class="badge text-bg-danger">Overdue</span>` : diff < 120 * 60 * 1000 ? `<span class="badge text-bg-warning">${fmtCountdown(diff)}</span>` : '';
      return `${fmtDateTime(r.due_at)} ${countdown}`;
    }, className: 'mono', sortable: true },
    { key: 'specialist_owner', label: 'Specialist Owner', sortable: true },
    { key: 'source_returned_evidence', label: 'Specialist Evidence', render: r => r.source_returned_evidence ? `<span class="mono">${esc(r.source_returned_evidence)}</span><div class="small text-body-secondary">by ${esc(r.source_returned_by)} \u00b7 ${fmtDateTime(r.source_returned_at)}</div>` : '<span class="text-body-secondary">Awaiting</span>' },
    { key: 'independent_reviewer', label: 'Reviewer', render: r => r.independent_reviewer || '\u2014' },
    { key: 'review_rounds', label: 'Review Rounds', render: r => r.review_rounds?.length || 0, className: 'num' },
    { key: 'actions', label: 'Actions', render: r => buildFuActions(r) },
  ];

  return createTable(columns, rows, {
    sortKey: fuSortKey,
    sortDir: fuSortDir,
    onSort: (key) => {
      if (fuSortKey === key) fuSortDir = fuSortDir === 'asc' ? 'desc' : 'asc';
      else { fuSortKey = key; fuSortDir = 'asc'; }
      renderFuTable();
    },
    emptyMessage: 'No follow-ups match the current filters.',
  });
}

function fmtCountdown(ms) {
  if (ms <= 0) return 'Overdue';
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins}m`;
}

function buildFuActions(fu) {
  const isClosed = fu.status === FU_STATUS.CLOSED;
  const isAwaiting = fu.status === FU_STATUS.AWAITING;
  const isReturned = fu.status === FU_STATUS.EVIDENCE_RETURNED;
  const isMore = fu.status === FU_STATUS.ADDITIONAL_REQUIRED;

  const actions = [];

  if (isAwaiting || isMore) {
    actions.push({
      label: 'Record Specialist Evidence',
      variant: 'primary',
      onClick: () => openRecordEvidenceDialog(fu),
    });
  }

  if (isReturned) {
    actions.push({
      label: 'Review Evidence',
      variant: 'primary',
      onClick: () => openReviewDialog(fu),
    });
  }

  actions.push({
    label: 'History',
    variant: 'secondary',
    onClick: () => openHistoryDialog(fu),
  });

  const div = document.createElement('div');
  div.style.display = 'flex';
  div.style.flexWrap = 'wrap';
  div.style.gap = '4px';
  actions.forEach(a => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn btn-${a.variant} btn-sm`;
    btn.textContent = a.label;
    btn.addEventListener('click', a.onClick);
    div.appendChild(btn);
  });
  return div;
}

function renderFuTable() {
  const state = STORE.getState();
  const fuTableWrap = document.getElementById('fu-table-wrap');
  if (fuTableWrap) {
    const fuFiltered = getFilteredFollowups(state.followups);
    fuTableWrap.innerHTML = '';
    fuTableWrap.appendChild(buildFuTable(fuFiltered, state.services, state.slos));
  }
}

// ============================================================
// Forms / Dialogs
// ============================================================
function parseDateTimeInput(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function openRequestFollowupDialog(slos) {
  const state = STORE.getState();
  const reviewers = state.reviewers || [];

  const content = document.createElement('div');
  content.innerHTML = `
    <form id="request-fu-form">
      <div class="form-field">
        <label for="fu-slo">SLO <span class="text-danger">*</span></label>
        <select class="form-select" id="fu-slo" required>
          <option value="" disabled selected>Select SLO</option>
          ${slos.map(s => `<option value="${esc(s.slo_id)}">${esc(s.name)} (${esc(s.slo_id)})</option>`).join('')}
        </select>
      </div>
      <div class="form-field">
        <label for="fu-title">Title <span class="text-danger">*</span></label>
        <input type="text" class="form-control" id="fu-title" required maxlength="200" placeholder="Brief title for the follow-up">
      </div>
      <div class="form-field">
        <label for="fu-priority">Priority <span class="text-danger">*</span></label>
        <select class="form-select" id="fu-priority" required>
          <option value="P0">P0 \u2014 Critical</option>
          <option value="P1" selected>P1 \u2014 High</option>
          <option value="P2">P2 \u2014 Medium</option>
        </select>
      </div>
      <div class="form-field">
        <label for="fu-requested-by">Requested by <span class="text-danger">*</span></label>
        <select class="form-select" id="fu-requested-by" required>
          <option value="" disabled selected>Select reviewer</option>
          ${reviewers.map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join('')}
        </select>
      </div>
      <div class="form-field">
        <label for="fu-due-at">Due at (your local time) <span class="text-danger">*</span></label>
        <input type="datetime-local" class="form-control" id="fu-due-at" required>
        <div class="form-text">Must be in the future (measured against snapshot time)</div>
      </div>
      <div class="form-field">
        <label for="fu-rationale">Rationale <span class="text-danger">*</span></label>
        <textarea class="form-control" id="fu-rationale" rows="3" required minlength="10" placeholder="What evidence is required and why (at least 10 characters)"></textarea>
        <div class="form-text">Minimum 10 characters</div>
      </div>
      <div class="form-field">
        <label for="fu-specialist-owner">Specialist owner (optional)</label>
        <input type="text" class="form-control" id="fu-specialist-owner" placeholder="Defaults to SLO's specialist owner">
      </div>
    </form>
  `;

  openDialog('Request Specialist Evidence', content, [
    { label: 'Cancel', variant: 'secondary', onClick: ({ close }) => close() },
    { label: 'Request Evidence', variant: 'primary', onClick: async ({ close, dialog, button }) => {
      const form = dialog.querySelector('#request-fu-form');
      if (!form.reportValidity()) return;
      button.disabled = true;
      button.textContent = 'Submitting...';

      try {
        const dueIso = parseDateTimeInput(form.querySelector('#fu-due-at').value);
        if (!dueIso) {
          toast('Enter a valid date and time', 'bad');
          button.disabled = false;
          button.textContent = 'Request Evidence';
          return;
        }

        const body = {
          slo_id: form.querySelector('#fu-slo').value,
          title: form.querySelector('#fu-title').value.trim(),
          priority: form.querySelector('#fu-priority').value,
          requested_by: form.querySelector('#fu-requested-by').value,
          due_at: dueIso,
          rationale: form.querySelector('#fu-rationale').value.trim(),
          specialist_owner: form.querySelector('#fu-specialist-owner').value.trim() || undefined,
        };

        await API.createFollowup(body);
        toast('Follow-up created successfully', 'good');
        close();
        await STORE.refreshAfterMutation();
      } catch (err) {
        toast(`Failed: ${err.message}`, 'bad');
        button.disabled = false;
        button.textContent = 'Request Evidence';
      }
    }},
  ]);
}

function openRecordEvidenceDialog(fu) {
  const content = document.createElement('div');
  content.innerHTML = `
    <form id="record-evidence-form">
      <div class="form-field">
        <label for="evidence-ref">Evidence Reference <span class="text-danger">*</span></label>
        <input type="text" class="form-control" id="evidence-ref" required maxlength="80" placeholder="Unique reference for this evidence submission">
        <div class="form-text">Must be unique across all evidence on this follow-up (case-insensitive)</div>
      </div>
      <div class="form-field">
        <label for="returned-by">Returned by</label>
        <input type="text" class="form-control" id="returned-by" maxlength="120" value="${esc(fu.specialist_owner)}">
      </div>
      <div class="form-field">
        <label for="returned-at">Returned at (your local time) <span class="text-danger">*</span></label>
        <input type="datetime-local" class="form-control" id="returned-at" required value="${localInput(new Date().toISOString())}">
        <div class="form-text">Cannot be before request time or previous review; cannot be in the future</div>
      </div>
    </form>
  `;

  openDialog(`Record Specialist Evidence \u2014 ${fu.id}`, content, [
    { label: 'Cancel', variant: 'secondary', onClick: ({ close }) => close() },
    { label: 'Record Evidence', variant: 'primary', onClick: async ({ close, dialog, button }) => {
      const form = dialog.querySelector('#record-evidence-form');
      if (!form.reportValidity()) return;
      button.disabled = true;
      button.textContent = 'Recording...';

      try {
        const returnedIso = parseDateTimeInput(form.querySelector('#returned-at').value);
        if (!returnedIso) {
          toast('Enter a valid date and time', 'bad');
          button.disabled = false;
          button.textContent = 'Record Evidence';
          return;
        }

        const body = {
          evidence_ref: form.querySelector('#evidence-ref').value.trim(),
          returned_by: form.querySelector('#returned-by').value.trim() || undefined,
          returned_at: returnedIso,
        };

        await API.recordSpecialistEvidence(fu.id, body);
        toast('Specialist evidence recorded', 'good');
        close();
        await STORE.refreshAfterMutation();
      } catch (err) {
        toast(`Failed: ${err.message}`, 'bad');
        button.disabled = false;
        button.textContent = 'Record Evidence';
      }
    }},
  ]);
}

function openReviewDialog(fu) {
  const state = STORE.getState();
  const reviewers = state.reviewers || [];
  const snap = state.snapshotsBySlo.get(fu.slo_id)?.[0];
  const slo = state.slos.find(s => s.slo_id === fu.slo_id);
  const rec = snap?.sli_reconciled ?? slo?.sli_reconciled ?? 1;
  const missing = snap?.exclusion_evidence_missing ?? slo?.exclusion_evidence_missing ?? (snap?.exclusion_evidence !== undefined ? (snap.exclusion_evidence ? 0 : 1) : 0);
  const qual = snap?.quality ?? slo?.quality ?? 'Validated';
  const concerns = !rec || !!missing || qual !== 'Validated';

  const content = document.createElement('div');
  content.innerHTML = `
    <form id="review-form">
      ${concerns ? `
      <div class="alert alert-warning">
        <strong>Measurement concerns exist for this SLO:</strong>
        <ul class="mb-0 mt-2">
          ${!rec ? '<li>SLI not reconciled to counts</li>' : ''}
          ${missing ? '<li>Exclusions missing evidence</li>' : ''}
          ${qual !== 'Validated' ? `<li>Evidence quality: ${esc(qual)}</li>` : ''}
        </ul>
      </div>
      ` : ''}
      <div class="form-field">
        <label for="reviewer">Independent Reviewer <span class="text-danger">*</span></label>
        <select class="form-select" id="reviewer" required>
          <option value="" disabled selected>Select reviewer</option>
          ${reviewers.filter(r => r !== fu.requested_by).map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join('')}
        </select>
        <div class="form-text">Cannot be the same person who requested this follow-up</div>
      </div>
      <div class="form-field">
        <label for="outcome">Outcome <span class="text-danger">*</span></label>
        <select class="form-select" id="outcome" required>
          <option value="${FU_STATUS.CLOSED}">Close \u2014 Evidence sufficient</option>
          <option value="${FU_STATUS.ADDITIONAL_REQUIRED}">Return for more evidence</option>
        </select>
      </div>
      <div class="form-field">
        <label for="review-evidence">Review Evidence Reference <span class="text-danger">*</span></label>
        <input type="text" class="form-control" id="review-evidence" required maxlength="80" placeholder="Separate reference for review evidence">
        <div class="form-text">Must differ from specialist evidence and any prior references</div>
      </div>
      <div class="form-field">
        <label for="review-rationale">Rationale <span class="text-danger">*</span></label>
        <textarea class="form-control" id="review-rationale" rows="3" required minlength="10" placeholder="Explain what was sufficient or what is missing (at least 10 characters)"></textarea>
      </div>
      ${concerns ? `
      <div class="form-field check-field mt-3">
        <div class="form-check">
          <input type="checkbox" class="form-check-input" id="confirm-concerns" required>
          <label class="form-check-label" for="confirm-concerns">I confirm the evidence resolves the measurement concerns</label>
        </div>
      </div>
      ` : ''}
    </form>
  `;

  openDialog(`Review Evidence \u2014 ${fu.id}`, content, [
    { label: 'Cancel', variant: 'secondary', onClick: ({ close }) => close() },
    { label: 'Submit Review', variant: 'primary', onClick: async ({ close, dialog, button }) => {
      const form = dialog.querySelector('#review-form');
      if (!form.reportValidity()) return;
      button.disabled = true;
      button.textContent = 'Submitting...';

      try {
        const outcome = form.querySelector('#outcome').value;
        const body = {
          reviewer: form.querySelector('#reviewer').value,
          outcome,
          review_evidence: form.querySelector('#review-evidence').value.trim(),
          rationale: form.querySelector('#review-rationale').value.trim(),
          confirmed: !!form.querySelector('#confirm-concerns')?.checked,
        };

        await API.recordReview(fu.id, body);
        toast(`Review submitted: ${outcome}`, 'good');
        close();
        await STORE.refreshAfterMutation();
      } catch (err) {
        toast(`Failed: ${err.message}`, 'bad');
        button.disabled = false;
        button.textContent = 'Submit Review';
      }
    }},
  ]);
}

function openHistoryDialog(fu) {
  const rounds = fu.review_rounds || [];
  const content = document.createElement('div');
  content.innerHTML = `
    <div style="max-height: 400px; overflow-y: auto;">
      <div class="mb-3">
        <strong>Follow-up:</strong> ${esc(fu.id)} \u2014 ${esc(fu.title)}<br>
        <strong>Status:</strong> ${pill(fu.status)} \u00b7 ${pill(fu.priority, fu.priority === 'P0' ? 'bad' : fu.priority === 'P1' ? 'warn' : 'info')}<br>
        <strong>SLO:</strong> ${esc(fu.slo_id)}<br>
        <strong>Requested by:</strong> ${esc(fu.requested_by)} at ${fmtDateTime(fu.requested_at)}<br>
        <strong>Due:</strong> ${fmtDateTime(fu.due_at)}<br>
        <strong>Specialist Owner:</strong> ${esc(fu.specialist_owner)}
      </div>
      <h6>Evidence Returns</h6>
      ${fu.source_returned_evidence ? `
        <div class="border rounded p-3 mb-3">
          <strong>Specialist Evidence:</strong> ${esc(fu.source_returned_evidence)}<br>
          <strong>Returned by:</strong> ${esc(fu.source_returned_by)}<br>
          <strong>Returned at:</strong> ${fmtDateTime(fu.source_returned_at)}
        </div>
      ` : '<div class="text-body-secondary">No specialist evidence returned yet</div>'}
      <h6>Review Rounds (${rounds.length})</h6>
      ${rounds.length ? rounds.map((r, i) => `
        <div class="border rounded p-3 mb-3">
          <strong>Round ${i + 1}:</strong> ${pill(r.outcome)}<br>
          <strong>Reviewer:</strong> ${esc(r.reviewer)}<br>
          <strong>Review Evidence:</strong> ${esc(r.review_evidence)}<br>
          <strong>Source Evidence:</strong> ${esc(r.source_evidence)}<br>
          <strong>At:</strong> ${fmtDateTime(r.at)}<br>
          <strong>Rationale:</strong> ${esc(r.rationale)}
        </div>
      `).join('') : '<div class="text-body-secondary">No review rounds yet</div>'}
    </div>
  `;

  openDialog(`History \u2014 ${fu.id}`, content, [
    { label: 'Close', variant: 'secondary', onClick: ({ close }) => close() },
  ]);
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
    { label: 'Reported %', key: 'current_pct', transform: v => fmtPct(v, 2) },
    { label: 'SLI (counts) %', key: 'sli_pct', transform: (v, r) => { const snap = state.snapshotsBySlo.get(r.slo_id); return snap?.[0]?.sli_pct != null ? fmtPct(snap[0].sli_pct, 2) : '\u2014'; } },
    { label: 'Reconciled', key: 'sli_reconciled', transform: (v, r) => { const snap = state.snapshotsBySlo.get(r.slo_id); return snap?.[0] ? (snap[0].sli_reconciled ? 'Yes' : 'No') : '\u2014'; } },
    { label: 'Status', key: 'status' },
    { label: 'Budget Remaining %', key: 'error_budget_remaining_pct', transform: v => fmtPct(v, 1) },
    { label: 'Burn 1h', key: 'burn_1h', transform: v => fmtBurn(v) },
    { label: 'Burn 6h', key: 'burn_6h', transform: v => fmtBurn(v) },
    { label: 'Burn 24h', key: 'burn_24h', transform: v => fmtBurn(v) },
    { label: 'Forecast', key: 'breach_forecast' },
    { label: 'Evidence Quality', key: 'quality', transform: (v, r) => { const snap = state.snapshotsBySlo.get(r.slo_id); return snap?.[0]?.quality || '\u2014'; } },
    { label: 'Open Follow-ups', key: 'followups', transform: (v, r) => state.followups.filter(f => f.slo_id === r.slo_id && f.status !== FU_STATUS.CLOSED).length },
  ];
  const csv = toCsv(rows.map(r => ({ ...r, ...cols.reduce((o, c) => { o[c.key] = c.transform ? c.transform(r[c.key], r) : r[c.key]; return o; }, {}) })), cols);
  downloadBlob(csv, `slo-monitoring-${new Date().toISOString().slice(0,10)}.csv`);
}

function select(options, value, onChange) {
  const el = document.createElement('select');
  el.className = 'form-select form-select-sm';
  options.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.value; opt.textContent = o.label; opt.selected = o.value === value;
    el.appendChild(opt);
  });
  el.addEventListener('change', e => onChange(e.target.value));
  return el;
}

function getCurrentTheme() {
  return document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function localInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
