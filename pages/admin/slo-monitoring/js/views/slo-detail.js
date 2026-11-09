/** SLO Detail view - full page detail for a single SLO */
import { STORE } from '../store.js';
import { ROUTER } from '../router.js';
import { esc, fmtDateTimeText, fmtPct, fmtBurn, statusClass, FU_STATUS } from '../util.js';
import { pill, createTable, kpiCard, miniBar, reconIcon } from '../ui.js';
import { gaugeChart } from '../charts.js';

let unsubscribe = null;

export async function init(params) {
  const sloId = params.get('slo');
  if (!sloId) { ROUTER.go('monitoring'); return; }
  STORE.setSelectedSlo(sloId);
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
  const { slos, services, snapshotsBySlo, followups, history, meta, ui } = state;
  const sloId = ui.selectedSloId;
  const main = document.getElementById('app-main');
  if (!main) return;

  const slo = slos.find(s => s.slo_id === sloId);
  if (!slo) { main.innerHTML = '<div class="alert alert-danger">SLO not found</div>'; return; }

  const snapshots = snapshotsBySlo.get(sloId) || [];
  const snap = snapshots[0];
  const sloFollowups = followups.filter(f => f.slo_id === sloId);
  const sloHistory = history.filter(h => h.subject_id === sloId).slice(0, 20);
  const svc = services.find(s => s.service_id === slo.service_id);

  // Header with back link
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <div class="page-title-block">
      <a href="#/monitoring" class="btn btn-sm btn-outline-secondary mb-2" style="text-decoration:none;">\u2190 Back to Monitoring</a>
      <div class="context">Platform Admin \u00b7 Reliability Governance</div>
      <h1>${esc(slo.name)}</h1>
      <p class="subtitle">${esc(slo.slo_id)} \u00b7 v${esc(slo.version)} \u00b7 ${esc(slo.service_tier)} \u00b7 ${esc(svc?.name || slo.service_id)}</p>
    </div>
  `;

  // KPI row
  const kpiGrid = document.createElement('div');
  kpiGrid.className = 'kpi-grid';
  kpiGrid.appendChild(kpiCard('Status', slo.status, '', { text: slo.status, variant: statusClass(slo.status) }));
  kpiGrid.appendChild(kpiCard('Reported', fmtPct(slo.current_pct, 2), 'Current reported SLI'));
  kpiGrid.appendChild(kpiCard('SLI (counts)', snap ? fmtPct(snap.sli_pct, 2) : '\u2014', snap ? `${snap.successful_count}/${snap.eligible_count} eligible \u00b7 ${snap.excluded_count} excluded` : 'No snapshot'));
  kpiGrid.appendChild(kpiCard('Budget Remaining', fmtPct(slo.error_budget_remaining_pct, 1), 'Error budget', { text: fmtPct(slo.error_budget_remaining_pct, 1), variant: parseFloat(slo.error_budget_remaining_pct) <= 10 ? 'bad' : parseFloat(slo.error_budget_remaining_pct) <= 30 ? 'warn' : 'good' }));
  kpiGrid.appendChild(kpiCard('Burn 1h / 6h / 24h', `${fmtBurn(slo.burn_1h)} / ${fmtBurn(slo.burn_6h)} / ${fmtBurn(slo.burn_24h)}`, 'Separately sourced'));
  kpiGrid.appendChild(kpiCard('Forecast', slo.breach_forecast, 'Breach forecast'));
  kpiGrid.appendChild(kpiCard('Open Follow-ups', sloFollowups.filter(f => f.status !== FU_STATUS.CLOSED).length, 'Awaiting or in review'));
  kpiGrid.appendChild(kpiCard('Latest Snapshot', meta ? fmtDateTimeText(meta.data_as_of) : '\u2014', 'Position as of data_as_of'));

  // Gauge chart for budget
  const gaugeDiv = document.createElement('div');
  gaugeDiv.style.textAlign = 'center';
  gaugeDiv.style.marginBottom = '16px';
  gaugeDiv.appendChild(gaugeChart(parseFloat(slo.error_budget_remaining_pct), 'Error Budget Remaining'));

  // Detail sections
  const sections = document.createElement('div');
  sections.style.display = 'grid';
  sections.style.gridTemplateColumns = 'repeat(auto-fit, minmax(400px, 1fr))';
  sections.style.gap = '16px';

  // Definition card
  sections.appendChild(buildCard('Definition', [
    { label: 'SLI Definition', value: slo.sli_definition },
    { label: 'Target', value: slo.target_display },
    { label: 'Evaluation Window', value: slo.window_label },
    { label: 'Version', value: slo.version },
    { label: 'Service', value: `${svc?.name || slo.service_id} (${slo.service_id})` },
    { label: 'Tier', value: pill(slo.service_tier), html: true },
    { label: 'Specialist Owner', value: slo.specialist_owner },
    { label: 'Business Owner', value: slo.business_owner },
    { label: 'Exclusion Policy', value: slo.exclusion_policy ?? '\u2014' },
    { label: 'Measurement Source', value: slo.measurement_source ?? '\u2014' },
    { label: 'Eligibility Scope', value: slo.eligibility_scope ?? '\u2014' },
    { label: 'Effective From', value: fmtDateTimeText(slo.effective_from) },
    { label: 'Review Due', value: slo.review_due ? fmtDateTimeText(slo.review_due) : '\u2014' },
    { label: 'Decision Authority', value: slo.decision_authority ?? '\u2014' },
    { label: 'Approval Evidence', value: slo.approval_evidence ?? '\u2014' },
  ]));

  // Position card
  const rec = snap?.sli_reconciled ?? slo.sli_reconciled ?? 1;
  const missing = snap?.exclusion_evidence_missing ?? slo.exclusion_evidence_missing ?? (snap?.exclusion_evidence !== undefined ? (snap.exclusion_evidence ? 0 : 1) : 0);
  const qual = snap?.quality ?? slo.quality ?? 'Validated';

  sections.appendChild(buildCard('Current Position', [
    { label: 'Reported SLI', value: fmtPct(slo.current_pct, 2) },
    { label: 'Computed SLI (counts)', value: snap ? fmtPct(snap.sli_pct, 2) : '\u2014' },
    { label: 'Reconciled', value: snap ? (rec ? pill('Yes', 'good') : pill('No', 'bad')) : '\u2014', html: true },
    { label: 'Formula', value: snap ? `successful \u00f7 eligible \u00d7 100 = ${snap.successful_count} \u00f7 ${snap.eligible_count} \u00d7 100 = ${fmtPct(snap.sli_pct, 2)}` : '\u2014' },
    { label: 'Exclusions', value: snap ? `${snap.excluded_count} excluded \u00b7 basis: ${snap.exclusion_basis || '\u2014'} \u00b7 evidence: ${snap.exclusion_evidence || 'missing'}` : '\u2014' },
    { label: 'Evidence Quality', value: snap ? pill(qual, qual === 'Validated' ? 'good' : 'warn') : '\u2014', html: true },
    { label: 'Quality Note', value: snap?.quality_note || '\u2014' },
  ]));

  // Error budget card
  sections.appendChild(buildCard('Error Budget & Burn Rates', [
    { label: 'Budget Remaining', value: miniBar(parseFloat(slo.error_budget_remaining_pct)), html: true },
    { label: 'Burn 1h', value: fmtBurn(slo.burn_1h) },
    { label: 'Burn 6h', value: fmtBurn(slo.burn_6h) },
    { label: 'Burn 24h', value: fmtBurn(slo.burn_24h) },
    { label: 'Breach Forecast', value: slo.breach_forecast },
  ]));

  // Measurement evidence card
  sections.appendChild(buildCard('Latest Measurement Evidence', snap ? [
    { label: 'Snapshot ID', value: snap.snapshot_id },
    { label: 'Source Reference', value: `${snap.source_reference} (${snap.source_owner})` },
    { label: 'Observed At', value: fmtDateTimeText(snap.observed_at) },
    { label: 'Population', value: String(snap.population ?? '\u2014') },
    { label: 'Eligible / Successful', value: `${snap.eligible_count} / ${snap.successful_count}` },
    { label: 'Excluded', value: `${snap.excluded_count} (basis: ${snap.exclusion_basis || '\u2014'})` },
    { label: 'Exclusion Evidence', value: snap.exclusion_evidence || 'Missing' },
    { label: 'Measurement Treatment', value: snap.measurement_treatment ?? '\u2014' },
    { label: 'Linked Incident', value: snap.incident_id || 'No incident record' },
    { label: 'Expected Rate', value: snap.expected_rate_pct ?? snap.expected_rate ?? '\u2014' },
  ] : [{ label: 'No snapshot data', value: '\u2014' }]));

  // Concerns
  const concerns = [];
  if (snap || slo) {
    if (!rec) concerns.push('SLI not reconciled to eligible/successful counts');
    if (missing) concerns.push(`${snap?.excluded_count ?? slo.excluded_count} excluded samples missing evidence`);
    if (qual !== 'Validated') concerns.push(`Evidence quality: ${qual}`);
  }
  sections.appendChild(buildCard('Measurement Concerns', concerns.length ? concerns.map(c => ({ label: '\u2022', value: c })) : [{ label: 'None', value: 'No measurement concerns' }]));

  // Follow-ups
  const fuColumns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'priority', label: 'Priority', render: r => pill(r.priority, r.priority === 'P0' ? 'bad' : r.priority === 'P1' ? 'warn' : 'info'), sortable: true },
    { key: 'status', label: 'Status', render: r => pill(r.status), sortable: true },
    { key: 'due_at', label: 'Due', render: r => fmtDateTimeText(r.due_at), className: 'mono', sortable: true },
    { key: 'source_returned_evidence', label: 'Specialist Evidence', render: r => r.source_returned_evidence || '\u2014', className: 'mono' },
    { key: 'independent_reviewer', label: 'Reviewer', render: r => r.independent_reviewer || '\u2014' },
    { key: 'review_rounds', label: 'Review Rounds', render: r => r.review_rounds?.length || 0, className: 'num' },
  ];
  const fuTable = createTable(fuColumns, sloFollowups.sort((a,b) => {
    const sa = statusOrder(a.status), sb = statusOrder(b.status);
    if (sa !== sb) return sa - sb;
    const pa = priorityOrder(a.priority), pb = priorityOrder(b.priority);
    if (pa !== pb) return pa - pb;
    return new Date(a.due_at) - new Date(b.due_at);
  }), { emptyMessage: 'No follow-ups for this SLO' });

  sections.appendChild(buildCard(`Follow-ups (${sloFollowups.length})`, [], fuTable));

  // History
  const histColumns = [
    { key: 'recorded_at', label: 'Recorded', render: r => fmtDateTimeText(r.recorded_at), className: 'mono', sortable: true },
    { key: 'decision', label: 'Decision', sortable: true },
    { key: 'assurance', label: 'Assurance', sortable: true },
    { key: 'status', label: 'Status', render: r => pill(r.status), sortable: true },
    { key: 'specialist_owner', label: 'Specialist', sortable: true },
    { key: 'source_evidence', label: 'Source Evidence', className: 'mono' },
    { key: 'decision_evidence', label: 'Decision Evidence', className: 'mono' },
    { key: 'verification_evidence', label: 'Verification Evidence', className: 'mono' },
  ];
  const histTable = createTable(histColumns, sloHistory, { emptyMessage: 'No governance history' });
  sections.appendChild(buildCard('Governance History (latest 20)', [], histTable));

  // Follow-up register link
  const fuRegisterBtn = document.createElement('button');
  fuRegisterBtn.className = 'btn btn-primary mt-3';
  fuRegisterBtn.textContent = 'Open Follow-up Register';
  fuRegisterBtn.addEventListener('click', () => ROUTER.go('monitoring'));

  main.innerHTML = '';
  main.appendChild(header);
  main.appendChild(kpiGrid);
  main.appendChild(gaugeDiv);
  main.appendChild(sections);
  main.appendChild(fuRegisterBtn);
}

function buildCard(title, rows, extraContent = null) {
  const card = document.createElement('div');
  card.style.background = 'var(--surface)';
  card.style.border = '1px solid var(--border)';
  card.style.borderRadius = '10px';
  card.style.padding = '16px';
  let html = `<h3 style="margin:0 0 12px; font-size:0.875rem; font-weight:600;">${esc(title)}</h3>`;
  if (rows.length) {
    html += '<dl style="margin:0; display:grid; grid-template-columns:160px 1fr; gap:8px 16px;">';
    rows.forEach(r => {
      const rawVal = r.value ?? '\u2014';
      const renderedVal = r.html ? rawVal : esc(rawVal);
      if (r.label === '\u2022') {
        html += `<dd style="margin:0; grid-column:1/-1; padding-left:16px; font-size:0.8125rem; color:var(--muted);">${renderedVal}</dd>`;
      } else {
        html += `<dt style="margin:0; font-size:0.8125rem; color:var(--muted);">${esc(r.label)}</dt><dd style="margin:0; font-size:0.8125rem;">${renderedVal}</dd>`;
      }
    });
    html += '</dl>';
  }
  card.innerHTML = html;
  if (extraContent) card.appendChild(extraContent);
  return card;
}

function statusOrder(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('awaiting')) return 0;
  if (s.includes('returned') && !s.includes('closed')) return 1;
  if (s.includes('closed')) return 2;
  return 3;
}

function priorityOrder(p) { return p === 'P0' ? 0 : p === 'P1' ? 1 : 2; }
