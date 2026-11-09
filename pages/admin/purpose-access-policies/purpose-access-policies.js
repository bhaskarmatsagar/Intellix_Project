/**
 * Purpose & Access Policies
 * Strictly ASCII-only UTF-8
 */
import { renderPage, pill, variantFor, fmtDate, esc } from '../_shared/page-kit.js';
import { PURPOSE_ACCESS_POLICIES_DEMO } from '../_shared/demo-data/purpose-access-policies.js';

renderPage({
  slug: 'purpose-access-policies',
  title: 'Purpose \u0026 Access Policies',
  subtitle: 'Governance of lawful data use limitations, permitted analytical purposes, role scopes, and policy recertification.',
  context: 'Platform Admin \u00b7 Policy \u0026 Protection',
  roleBoundary: 'Platform Admin approves platform purpose limitation rules and legal basis definitions. Purpose subscription requests and consumption context validation are executed by Data Consumers and Stewards.',
  source: { endpoint: null, demo: PURPOSE_ACCESS_POLICIES_DEMO },
  rowId: 'id',
  defaultSort: { key: 'status', dir: 'asc' },
  searchFields: ['id', 'name', 'purpose', 'data_classes_covered', 'legal_basis'],

  kpis: rows => {
    const active = rows.filter(r => r.status === 'Active').length;
    const underReview = rows.filter(r => r.status === 'Under review').length;
    const draft = rows.filter(r => r.status === 'Draft').length;
    // Due within 30 days relative to 2026-10-05: before 2026-11-04
    const reviewsDue = rows.filter(r => r.review_due && new Date(r.review_due) <= new Date('2026-11-04T00:00:00Z') && new Date(r.review_due) >= new Date('2026-10-05T00:00:00Z')).length;

    return [
      { label: 'Active Policies', value: active, note: 'Enforced purpose boundaries', badge: { text: 'Enforced', variant: 'good' } },
      { label: 'Under Review', value: underReview, note: 'Pending stakeholder review', badge: { text: underReview > 0 ? 'In review' : 'None', variant: 'warn' } },
      { label: 'Draft', value: draft, note: 'Pre-approval policy drafts', badge: { text: draft > 0 ? 'Draft' : 'Zero', variant: 'info' } },
      { label: 'Reviews Due (30d)', value: reviewsDue, note: 'Annual recertification due', badge: { text: reviewsDue > 0 ? 'Action required' : 'Current', variant: reviewsDue > 0 ? 'warn' : 'good' } },
    ];
  },

  filters: [
    { key: 'status', label: 'Status', type: 'chips' },
    { key: 'purpose', label: 'Purpose', type: 'select' },
  ],

  columns: [
    { key: 'id', label: 'Policy ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'purpose',
      label: 'Purpose',
      sortable: true,
      render: r => pill(r.purpose, 'neutral')
    },
    { key: 'data_classes_covered', label: 'Data Classes Covered', sortable: true },
    { key: 'allowed_roles', label: 'Allowed Roles', sortable: true },
    { key: 'legal_basis', label: 'Legal Basis', sortable: true },
    { key: 'version', label: 'Version', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: r => pill(r.status, variantFor(r.status))
    },
    {
      key: 'effective',
      label: 'Effective',
      sortable: true,
      render: r => fmtDate(r.effective)
    },
    {
      key: 'review_due',
      label: 'Review Due',
      sortable: true,
      render: r => fmtDate(r.review_due)
    },
  ],

  drawerTitle: r => `Policy: ${r.name} (${r.id})`,
  drawer: r => `
    <div class="drawer-section">
      <h3>Policy Purpose Specification</h3>
      <div class="drawer-row"><strong>Policy Identifier</strong><span>${esc(r.id)}</span></div>
      <div class="drawer-row"><strong>Policy Title</strong><span>${esc(r.name)}</span></div>
      <div class="drawer-row"><strong>Authorized Purpose</strong><span>${pill(r.purpose, 'neutral')}</span></div>
      <div class="drawer-row"><strong>Version</strong><span>v${esc(r.version)}</span></div>
      <div class="drawer-row"><strong>Statutory / Legal Basis</strong><span>${esc(r.legal_basis)}</span></div>
      <div class="drawer-row"><strong>Lifecycle Status</strong><span>${pill(r.status, variantFor(r.status))}</span></div>
      <div class="drawer-row"><strong>Policy Description</strong><span>${esc(r.description)}</span></div>
    </div>

    <div class="drawer-section">
      <h3>Scope &amp; Role Authorizations</h3>
      <div class="drawer-row"><strong>Data Classes Covered</strong><span>${esc(r.data_classes_covered)}</span></div>
      <div class="drawer-row"><strong>Permitted Roles</strong><span>${esc(r.allowed_roles)}</span></div>
      <div class="drawer-row"><strong>Permitted Exports</strong><span>${esc(r.permitted_exports)}</span></div>
      <div class="drawer-row"><strong>Effective Date</strong><span>${fmtDate(r.effective)}</span></div>
      <div class="drawer-row"><strong>Recertification Due Date</strong><span>${fmtDate(r.review_due)}</span></div>
    </div>
  `
});
