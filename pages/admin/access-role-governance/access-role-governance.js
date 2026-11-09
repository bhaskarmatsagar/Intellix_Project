/**
 * Platform Access & Role Governance
 * Strictly ASCII-only UTF-8
 */
import { renderPage, pill, variantFor, fmtDate, esc } from '../_shared/page-kit.js';
import { ACCESS_ROLE_GOVERNANCE_DEMO } from '../_shared/demo-data/access-role-governance.js';

renderPage({
  slug: 'access-role-governance',
  title: 'Platform Access \u0026 Role Governance',
  subtitle: 'Privileged role assignment, standing vs just-in-time elevation, MFA enforcement, and access recertification cycles.',
  context: 'Platform Admin \u00b7 Platform Access \u0026 Security',
  roleBoundary: 'Platform Admin governs platform-level privileged roles, administrative access reviews, and just-in-time elevation policies. Tenant-local permissions and team memberships are governed by tenant identity administrators.',
  source: { endpoint: null, demo: ACCESS_ROLE_GOVERNANCE_DEMO },
  rowId: 'id',
  defaultSort: { key: 'role', dir: 'asc' },
  searchFields: ['principal', 'display_name', 'role', 'scope', 'granted_by'],

  kpis: rows => {
    const privileged = rows.filter(r => r.role === 'Platform Admin').length;
    const overdueReviews = rows.filter(r => r.review_status === 'Overdue').length;
    const jitActive = rows.filter(r => r.grant_type === 'Just-in-time').length;
    const noMfa = rows.filter(r => r.mfa === 'No').length;

    return [
      { label: 'Privileged Accounts', value: privileged, note: 'Platform Admin role assignments' },
      { label: 'Access Reviews Overdue', value: overdueReviews, note: 'Recertification lapsed', badge: { text: overdueReviews > 0 ? 'Action required' : 'Zero', variant: overdueReviews > 0 ? 'bad' : 'good' } },
      { label: 'Just-in-Time Grants Active', value: jitActive, note: 'Time-bound privileged elevations', badge: { text: jitActive > 0 ? 'Active JIT' : 'None', variant: 'info' } },
      { label: 'Accounts Without MFA', value: noMfa, note: 'FIDO2 / TOTP non-compliant', badge: { text: noMfa > 0 ? 'Security gap' : 'Compliant', variant: noMfa > 0 ? 'bad' : 'good' } },
    ];
  },

  filters: [
    { key: 'role', label: 'Role', type: 'chips' },
    { key: 'review_status', label: 'Review Status', type: 'chips' },
    { key: 'grant_type', label: 'Grant Type', type: 'select' },
  ],

  columns: [
    {
      key: 'principal',
      label: 'Principal',
      sortable: true,
      render: r => `<div><span class="fw-semibold">${esc(r.display_name || r.principal)}</span><br><span class="text-body-secondary small">${esc(r.principal)}</span></div>`
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: r => pill(r.role, r.role === 'Platform Admin' ? 'bad' : r.role === 'Auditor' ? 'info' : 'neutral')
    },
    { key: 'scope', label: 'Scope', sortable: true },
    {
      key: 'grant_type',
      label: 'Grant Type',
      sortable: true,
      render: r => pill(r.grant_type, r.grant_type === 'Just-in-time' ? 'warn' : 'neutral')
    },
    { key: 'granted_by', label: 'Granted By', sortable: true },
    {
      key: 'last_review',
      label: 'Last Review',
      sortable: true,
      render: r => fmtDate(r.last_review)
    },
    {
      key: 'review_status',
      label: 'Review Status',
      sortable: true,
      render: r => pill(r.review_status, r.review_status === 'Current' ? 'good' : r.review_status === 'Due' ? 'warn' : 'bad')
    },
    {
      key: 'mfa',
      label: 'MFA',
      sortable: true,
      render: r => pill(r.mfa, r.mfa === 'Yes' ? 'good' : 'bad')
    },
  ],

  drawerTitle: r => `Principal: ${r.display_name || r.principal}`,
  drawer: r => `
    <div class="drawer-section">
      <h3>Principal Governance Profile</h3>
      <div class="drawer-row"><strong>Account Identifier</strong><span>${esc(r.id)}</span></div>
      <div class="drawer-row"><strong>Principal Name</strong><span>${esc(r.display_name)} (${esc(r.principal)})</span></div>
      <div class="drawer-row"><strong>Department / Entity</strong><span>${esc(r.department)}</span></div>
      <div class="drawer-row"><strong>Authoritative Role</strong><span>${pill(r.role, r.role === 'Platform Admin' ? 'bad' : 'neutral')}</span></div>
      <div class="drawer-row"><strong>Governed Scope</strong><span>${esc(r.scope)}</span></div>
      <div class="drawer-row"><strong>MFA Verification</strong><span>${pill(r.mfa, r.mfa === 'Yes' ? 'good' : 'bad')}</span></div>
    </div>

    <div class="drawer-section">
      <h3>Grant Lifecycle &amp; Recertification</h3>
      <div class="drawer-row"><strong>Grant Type</strong><span>${esc(r.grant_type)}</span></div>
      <div class="drawer-row"><strong>Granted By</strong><span>${esc(r.granted_by)}</span></div>
      <div class="drawer-row"><strong>Last Access Review</strong><span>${fmtDate(r.last_review)}</span></div>
      <div class="drawer-row"><strong>Review Cadence Status</strong><span>${pill(r.review_status, variantFor(r.review_status))}</span></div>
      ${r.jit_ticket ? `<div class="drawer-row"><strong>JIT Approval Ticket</strong><span>${esc(r.jit_ticket)}</span></div>` : ''}
      ${r.jit_expires ? `<div class="drawer-row"><strong>JIT Expiration Time</strong><span>${fmtDate(r.jit_expires)}</span></div>` : ''}
    </div>
  `
});
