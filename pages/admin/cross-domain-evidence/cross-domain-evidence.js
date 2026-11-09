/**
 * Cross-Domain Evidence
 * Strictly ASCII-only UTF-8. LIVE data from /api/governance-history.
 */
import { renderPage, pill, variantFor, fmtDateTime, esc } from '../_shared/page-kit.js';
import { CROSS_DOMAIN_EVIDENCE_DEMO } from '../_shared/demo-data/cross-domain-evidence.js';

renderPage({
  slug: 'cross-domain-evidence',
  title: 'Cross-Domain Evidence',
  subtitle: 'Unified provenance trail linking operational source evidence, governance decisions, and independent verification evidence.',
  context: 'Platform Admin \u00b7 Governance \u0026 Assurance',
  roleBoundary: 'Platform Admin verifies end-to-end evidence chains across operational domains (source evidence \u2192 decision evidence \u2192 verification evidence). Authoritative records cannot be unilaterally altered.',
  source: {
    endpoint: '/api/governance-history',
    demo: CROSS_DOMAIN_EVIDENCE_DEMO
  },
  rowId: 'history_id',
  defaultSort: { key: 'recorded_at', dir: 'desc' },
  searchFields: ['history_id', 'domain', 'subject', 'subject_id', 'decision', 'assurance', 'specialist_owner'],

  kpis: rows => {
    const total = rows.length;
    const verified = rows.filter(r => r.verification_evidence && r.status === 'Closed').length;
    const openRecords = rows.filter(r => r.status === 'Open').length;
    const domainsCovered = new Set(rows.map(r => r.domain)).size;

    return [
      { label: 'Evidence Records', value: total, note: 'Cross-domain governance events' },
      { label: 'Verified', value: verified, note: 'End-to-end assurance complete', badge: { text: 'Verified', variant: 'good' } },
      { label: 'Open', value: openRecords, note: 'Awaiting evidence or verification', badge: { text: openRecords > 0 ? 'Pending' : 'Zero', variant: openRecords > 0 ? 'warn' : 'good' } },
      { label: 'Domains Covered', value: domainsCovered, note: 'Distinct operational domains', badge: { text: 'Cross-Domain', variant: 'info' } },
    ];
  },

  filters: [
    { key: 'domain', label: 'Domain', type: 'chips' },
    { key: 'status', label: 'Status', type: 'chips' },
  ],

  columns: [
    { key: 'history_id', label: 'History ID', sortable: true },
    {
      key: 'domain',
      label: 'Domain',
      sortable: true,
      render: r => pill(r.domain, 'neutral')
    },
    {
      key: 'subject',
      label: 'Subject',
      sortable: true,
      render: r => `<div><span class="fw-semibold">${esc(r.subject)}</span><br><code class="small text-body-secondary">${esc(r.subject_id || '')}</code></div>`
    },
    { key: 'decision', label: 'Decision', sortable: true },
    {
      key: 'assurance',
      label: 'Assurance',
      sortable: true,
      render: r => pill(r.assurance, variantFor(r.assurance))
    },
    {
      key: 'source_evidence',
      label: 'Source Evidence',
      sortable: true,
      render: r => r.source_evidence ? `<code>${esc(r.source_evidence)}</code>` : '<span class="text-body-secondary">\u2014</span>'
    },
    {
      key: 'decision_evidence',
      label: 'Decision Evidence',
      sortable: true,
      render: r => r.decision_evidence ? `<code>${esc(r.decision_evidence)}</code>` : '<span class="text-body-secondary">\u2014</span>'
    },
    {
      key: 'verification_evidence',
      label: 'Verification Evidence',
      sortable: true,
      render: r => r.verification_evidence ? `<span class="badge text-bg-success"><span class="recon-icon ok">\u2713</span> ${esc(r.verification_evidence)}</span>` : '<span class="text-body-secondary">\u2014</span>'
    },
    { key: 'recorded_by', label: 'Recorded By', sortable: true },
    {
      key: 'recorded_at',
      label: 'Recorded At',
      sortable: true,
      render: r => fmtDateTime(r.recorded_at)
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: r => pill(r.status, variantFor(r.status))
    },
  ],

  drawerTitle: r => `Evidence Record: ${r.history_id}`,
  drawer: r => `
    <div class="drawer-section">
      <h3>Governance Record Specification</h3>
      <div class="drawer-row"><strong>History Identifier</strong><span><code>${esc(r.history_id)}</code></span></div>
      <div class="drawer-row"><strong>Domain</strong><span>${pill(r.domain, 'neutral')}</span></div>
      <div class="drawer-row"><strong>Subject Description</strong><span>${esc(r.subject)}</span></div>
      <div class="drawer-row"><strong>Subject Identifier</strong><span><code>${esc(r.subject_id || '\u2014')}</code></span></div>
      <div class="drawer-row"><strong>Governed Decision</strong><span>${esc(r.decision)}</span></div>
      <div class="drawer-row"><strong>Assurance Position</strong><span>${pill(r.assurance, variantFor(r.assurance))}</span></div>
      <div class="drawer-row"><strong>Specialist Owner</strong><span>${esc(r.specialist_owner || 'Platform Reliability')}</span></div>
      <div class="drawer-row"><strong>Recorded By</strong><span>${esc(r.recorded_by)}</span></div>
      <div class="drawer-row"><strong>Recorded At</strong><span>${fmtDateTime(r.recorded_at)}</span></div>
      <div class="drawer-row"><strong>Lifecycle Status</strong><span>${pill(r.status, variantFor(r.status))}</span></div>
      ${r.checkpoint ? `<div class="drawer-row"><strong>Checkpoint Due</strong><span>${fmtDateTime(r.checkpoint)}</span></div>` : ''}
    </div>

    <div class="drawer-section">
      <h3>End-to-End Assurance Evidence Chain</h3>
      <p class="text-body-secondary small mb-3">Auditable cryptographic lineage: Source Evidence \u2192 Decision Evidence \u2192 Verification Evidence.</p>

      <div class="checklist-step">
        <div><span class="badge text-bg-secondary">1. Source</span></div>
        <div>
          <div class="fw-semibold small">${r.source_evidence ? `<code>${esc(r.source_evidence)}</code>` : '<span class="text-warning">No source evidence linked</span>'}</div>
          <div class="text-body-secondary small">Originating incident, alert, or operational measurement artifact.</div>
        </div>
      </div>

      <div class="checklist-step">
        <div><span class="badge text-bg-primary">2. Decision</span></div>
        <div>
          <div class="fw-semibold small">${r.decision_evidence ? `<code>${esc(r.decision_evidence)}</code>` : '<span class="text-body-secondary">Awaiting formal decision evidence</span>'}</div>
          <div class="text-body-secondary small">Documented governance review, authorization, or policy amendment record.</div>
        </div>
      </div>

      <div class="checklist-step">
        <div><span class="badge ${r.verification_evidence ? 'text-bg-success' : 'text-bg-warning'}">3. Verification</span></div>
        <div>
          <div class="fw-semibold small">${r.verification_evidence ? `<code>${esc(r.verification_evidence)}</code>` : '<span class="text-warning">Pending independent verification evidence</span>'}</div>
          <div class="text-body-secondary small">Independent assurance sign-off or post-incident review reconciliation.</div>
        </div>
      </div>
    </div>
  `
});
