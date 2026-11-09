/**
 * Platform Change Requests
 * Strictly ASCII-only UTF-8
 */
import { renderPage, pill, variantFor, esc } from '../_shared/page-kit.js';
import { CHANGE_REQUESTS_DEMO } from '../_shared/demo-data/change-requests.js';

renderPage({
  slug: 'change-requests',
  title: 'Platform Change Requests',
  subtitle: 'Governance review of architectural changes, risk levels, change windows, evidence packages, and rollback assurance.',
  context: 'Platform Admin \u00b7 Governance \u0026 Assurance',
  roleBoundary: 'Platform Admin reviews governance evidence. Technical teams approve and execute changes.',
  source: { endpoint: null, demo: CHANGE_REQUESTS_DEMO },
  rowId: 'id',
  defaultSort: { key: 'status', dir: 'asc' },
  searchFields: ['id', 'title', 'type', 'risk', 'requested_by', 'specialist_owner'],

  kpis: rows => {
    const openRequests = rows.filter(r => r.status === 'Submitted' || r.status === 'Under review').length;
    const awaitingEvidence = rows.filter(r => r.evidence_complete === 'No' && r.status !== 'Rejected').length;
    const emergencyChanges = rows.filter(r => r.type === 'Emergency').length;
    const failedOrRolledBack = rows.filter(r => r.status === 'Rolled back' || r.status === 'Rejected').length;

    return [
      { label: 'Open Requests', value: openRequests, note: 'Pending governance decision', badge: { text: openRequests > 0 ? 'Pending' : 'Zero', variant: openRequests > 0 ? 'warn' : 'good' } },
      { label: 'Awaiting Evidence', value: awaitingEvidence, note: 'Incomplete evidence packages', badge: { text: awaitingEvidence > 0 ? 'Action required' : 'Complete', variant: awaitingEvidence > 0 ? 'bad' : 'good' } },
      { label: 'Emergency Changes (30d)', value: emergencyChanges, note: 'Accelerated review path', badge: { text: emergencyChanges > 0 ? 'Elevated' : 'Nominal', variant: emergencyChanges > 0 ? 'warn' : 'good' } },
      { label: 'Failed or Rolled Back', value: failedOrRolledBack, note: 'Aborted / rejected changes', badge: { text: failedOrRolledBack > 0 ? 'Audit note' : 'Zero', variant: failedOrRolledBack > 0 ? 'bad' : 'good' } },
    ];
  },

  filters: [
    { key: 'status', label: 'Status', type: 'chips' },
    { key: 'type', label: 'Type', type: 'select' },
    { key: 'risk', label: 'Risk', type: 'select' },
  ],

  columns: [
    { key: 'id', label: 'Change ID', sortable: true },
    { key: 'title', label: 'Title', sortable: true },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: r => pill(r.type, r.type === 'Emergency' ? 'bad' : r.type === 'Normal' ? 'info' : 'neutral')
    },
    {
      key: 'risk',
      label: 'Risk',
      sortable: true,
      render: r => pill(r.risk, r.risk === 'High' ? 'bad' : r.risk === 'Medium' ? 'warn' : 'good')
    },
    { key: 'requested_by', label: 'Requested By', sortable: true },
    { key: 'specialist_owner', label: 'Specialist Owner', sortable: true },
    { key: 'window', label: 'Window', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: r => pill(r.status, variantFor(r.status))
    },
    {
      key: 'evidence_ref',
      label: 'Evidence Ref',
      sortable: true,
      render: r => r.evidence_ref ? `<code>${esc(r.evidence_ref)}</code>` : '<span class="text-body-secondary">\u2014</span>'
    },
    {
      key: 'evidence_complete',
      label: 'Evidence Complete',
      sortable: true,
      render: r => pill(r.evidence_complete, r.evidence_complete === 'Yes' ? 'good' : 'bad')
    },
  ],

  drawerTitle: r => `Change Request: ${r.id}`,
  drawer: r => `
    <div class="drawer-section">
      <h3>Change Proposal Specification</h3>
      <div class="drawer-row"><strong>Change Identifier</strong><span>${esc(r.id)}</span></div>
      <div class="drawer-row"><strong>Change Title</strong><span>${esc(r.title)}</span></div>
      <div class="drawer-row"><strong>Change Type</strong><span>${pill(r.type, r.type === 'Emergency' ? 'bad' : 'info')}</span></div>
      <div class="drawer-row"><strong>Risk Classification</strong><span>${pill(r.risk, r.risk === 'High' ? 'bad' : 'good')}</span></div>
      <div class="drawer-row"><strong>Requested By</strong><span>${esc(r.requested_by)}</span></div>
      <div class="drawer-row"><strong>Specialist Team Owner</strong><span>${esc(r.specialist_owner)}</span></div>
      <div class="drawer-row"><strong>Target Execution Window</strong><span>${esc(r.window)}</span></div>
      <div class="drawer-row"><strong>Governance Status</strong><span>${pill(r.status, variantFor(r.status))}</span></div>
      <div class="drawer-row"><strong>Description &amp; Rationale</strong><span>${esc(r.description)}</span></div>
    </div>

    <div class="drawer-section">
      <h3>Governance Evidence &amp; Rollback Assurance</h3>
      <div class="drawer-row"><strong>Evidence Package Ref</strong><span>${r.evidence_ref ? `<code>${esc(r.evidence_ref)}</code>` : 'None linked'}</span></div>
      <div class="drawer-row"><strong>Evidence Completeness</strong><span>${pill(r.evidence_complete, r.evidence_complete === 'Yes' ? 'good' : 'bad')}</span></div>
      <div class="drawer-row"><strong>CAB Authority Reference</strong><span>${esc(r.cab_meeting_ref)}</span></div>
      <div class="drawer-row"><strong>Blast Radius / Impact Scope</strong><span>${esc(r.impact_scope)}</span></div>
      <div class="drawer-row"><strong>Pre-Tested Rollback Strategy</strong><span>${esc(r.rollback_plan)}</span></div>
      <div class="alert alert-secondary mt-3 small">
        <i class="bi bi-info-circle me-1"></i> Role note: The Platform Admin verifies assurance completeness, audit traceability, and rollback readiness. Technical execution authorization is managed by the technical owner and Change Advisory Board (CAB).
      </div>
    </div>
  `
});
