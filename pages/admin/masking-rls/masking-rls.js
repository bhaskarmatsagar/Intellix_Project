/**
 * Masking & Row-Level Security
 * Strictly ASCII-only UTF-8
 */
import { renderPage, pill, variantFor, fmtDate, esc } from '../_shared/page-kit.js';
import { MASKING_RLS_DEMO } from '../_shared/demo-data/masking-rls.js';

renderPage({
  slug: 'masking-rls',
  title: 'Masking \u0026 Row-Level Security',
  subtitle: 'Dynamic column masking expressions, multi-tenant row isolation predicates, and enforcement audit tracking.',
  context: 'Platform Admin \u00b7 Policy \u0026 Protection',
  roleBoundary: 'Platform Admin sets platform masking standards, row-level isolation policies, and audits policy enforcement. Column expressions and specific tenant row predicates are authored and tested by Data Engineers and Stewards.',
  source: { endpoint: null, demo: MASKING_RLS_DEMO },
  rowId: 'id',
  defaultSort: { key: 'status', dir: 'asc' },
  searchFields: ['id', 'dataset', 'predicate', 'technique', 'applies_to_roles'],

  kpis: rows => {
    const total = rows.length;
    const enforced = rows.filter(r => r.status === 'Enforced').length;
    const auditOnly = rows.filter(r => r.status === 'Audit-only').length;
    const violations = rows.reduce((s, r) => s + (r.violations_30d || 0), 0);

    return [
      { label: 'Security Rules', value: total, note: 'Registered masking & RLS filters' },
      { label: 'Enforced', value: enforced, note: 'Active runtime enforcement', badge: { text: 'Enforced', variant: 'good' } },
      { label: 'Audit-Only', value: auditOnly, note: 'Shadow validation mode', badge: { text: auditOnly > 0 ? 'Shadow' : 'Zero', variant: auditOnly > 0 ? 'warn' : 'good' } },
      { label: 'Violations (30d)', value: violations, note: 'Blocked / audited anomalies', badge: { text: violations > 0 ? `${violations} detected` : 'Zero', variant: violations > 0 ? 'bad' : 'good' } },
    ];
  },

  filters: [
    { key: 'status', label: 'Status', type: 'chips' },
    { key: 'technique', label: 'Technique', type: 'select' },
  ],

  columns: [
    { key: 'id', label: 'Rule ID', sortable: true },
    { key: 'dataset', label: 'Dataset', sortable: true },
    {
      key: 'predicate',
      label: 'Column / Row Predicate',
      sortable: true,
      render: r => `<code>${esc(r.predicate)}</code>`
    },
    {
      key: 'technique',
      label: 'Technique',
      sortable: true,
      render: r => pill(r.technique, 'neutral')
    },
    { key: 'applies_to_roles', label: 'Applies to Roles', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: r => pill(r.status, variantFor(r.status))
    },
    {
      key: 'last_validated',
      label: 'Last Validated',
      sortable: true,
      render: r => fmtDate(r.last_validated)
    },
    {
      key: 'violations_30d',
      label: 'Violations 30d',
      sortable: true,
      className: 'text-end',
      render: r => r.violations_30d > 0 ? `<span class="badge text-bg-danger">${esc(r.violations_30d)}</span>` : '<span class="text-body-secondary">0</span>'
    },
  ],

  drawerTitle: r => `Security Rule: ${r.id}`,
  drawer: r => `
    <div class="drawer-section">
      <h3>Policy Predicate Specification</h3>
      <div class="drawer-row"><strong>Rule ID</strong><span>${esc(r.id)}</span></div>
      <div class="drawer-row"><strong>Target Dataset</strong><span>${esc(r.dataset)}</span></div>
      <div class="drawer-row"><strong>Target Column / Predicate</strong><span><code>${esc(r.predicate)}</code></span></div>
      <div class="drawer-row"><strong>Protection Technique</strong><span>${pill(r.technique, 'neutral')}</span></div>
      <div class="drawer-row"><strong>Rule Category</strong><span>${esc(r.rule_type)}</span></div>
      <div class="drawer-row"><strong>Enforcement Status</strong><span>${pill(r.status, variantFor(r.status))}</span></div>
    </div>

    <div class="drawer-section">
      <h3>Transformation Expression &amp; Execution</h3>
      <div class="drawer-row"><strong>Expression Template</strong><span><code>${esc(r.expression)}</code></span></div>
      <div class="drawer-row"><strong>Enforcement Engine</strong><span>${esc(r.enforcement_engine)}</span></div>
      <div class="drawer-row"><strong>Applies to Roles</strong><span>${esc(r.applies_to_roles)}</span></div>
      <div class="drawer-row"><strong>Last Validation Run</strong><span>${fmtDate(r.last_validated)}</span></div>
      <div class="drawer-row"><strong>Recorded Violations (30d)</strong><span>${esc(r.violations_30d)} unauthorized access attempts</span></div>
    </div>
  `
});
