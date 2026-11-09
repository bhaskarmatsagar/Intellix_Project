/**
 * Network & Security Controls
 * Strictly ASCII-only UTF-8
 */
import { renderPage, pill, variantFor, fmtDate, esc } from '../_shared/page-kit.js';
import { NETWORK_SECURITY_DEMO } from '../_shared/demo-data/network-security.js';

renderPage({
  slug: 'network-security',
  title: 'Network \u0026 Security Controls',
  subtitle: 'Perimeter protection, transport encryption, ingress allow-lists, WAF policies, and security control compliance.',
  context: 'Platform Admin \u00b7 Platform Access \u0026 Security',
  roleBoundary: 'Platform Admin governs network security policy compliance, perimeter controls, and exception registers. Physical firewall rules and VPC routing execution remain with Cloud Infrastructure Engineers.',
  source: { endpoint: null, demo: NETWORK_SECURITY_DEMO },
  rowId: 'id',
  defaultSort: { key: 'status', dir: 'asc' },
  searchFields: ['id', 'control', 'scope', 'owner', 'evidence_ref'],

  kpis: rows => {
    const compliant = rows.filter(r => r.status === 'Compliant').length;
    const compliancePct = Math.round((compliant / rows.length) * 100);
    const exceptions = rows.filter(r => r.status === 'Exception').length;
    const nonCompliant = rows.filter(r => r.status === 'Non-compliant').length;
    // Older than 90 days relative to 2026-10-05: 90 days before is 2026-07-07
    const older90d = rows.filter(r => new Date(r.last_evidence_date) < new Date('2026-07-07T00:00:00Z')).length;

    return [
      { label: 'Control Compliance %', value: `${compliancePct}%`, note: `${compliant} of ${rows.length} verified compliant`, badge: { text: compliancePct >= 80 ? 'Target met' : 'Below target', variant: compliancePct >= 80 ? 'good' : 'warn' } },
      { label: 'Exceptions', value: exceptions, note: 'Approved time-bound waivers', badge: { text: exceptions > 0 ? 'Active waiver' : 'Zero', variant: exceptions > 0 ? 'warn' : 'good' } },
      { label: 'Non-Compliant', value: nonCompliant, note: 'Gaps requiring remediation', badge: { text: nonCompliant > 0 ? 'Action required' : 'Zero', variant: nonCompliant > 0 ? 'bad' : 'good' } },
      { label: 'Evidence Older Than 90d', value: older90d, note: 'Stale audit assurance evidence', badge: { text: older90d > 0 ? 'Recertify' : 'Current', variant: older90d > 0 ? 'warn' : 'good' } },
    ];
  },

  filters: [
    { key: 'status', label: 'Status', type: 'chips' },
    { key: 'scope', label: 'Scope', type: 'select' },
  ],

  columns: [
    { key: 'id', label: 'Control ID', sortable: true },
    { key: 'control', label: 'Control', sortable: true },
    { key: 'scope', label: 'Scope', sortable: true },
    { key: 'owner', label: 'Owner', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: r => pill(r.status, variantFor(r.status))
    },
    {
      key: 'last_evidence_date',
      label: 'Last Evidence Date',
      sortable: true,
      render: r => fmtDate(r.last_evidence_date)
    },
    {
      key: 'evidence_ref',
      label: 'Evidence Ref',
      sortable: true,
      render: r => `<code class="small">${esc(r.evidence_ref)}</code>`
    },
  ],

  drawerTitle: r => `Security Control: ${r.id}`,
  drawer: r => `
    <div class="drawer-section">
      <h3>Control Specification</h3>
      <div class="drawer-row"><strong>Control ID</strong><span>${esc(r.id)}</span></div>
      <div class="drawer-row"><strong>Title</strong><span>${esc(r.control)}</span></div>
      <div class="drawer-row"><strong>Scope of Enforcement</strong><span>${esc(r.scope)}</span></div>
      <div class="drawer-row"><strong>Responsible Owner</strong><span>${esc(r.owner)}</span></div>
      <div class="drawer-row"><strong>Compliance Standard</strong><span>${esc(r.standard)}</span></div>
      <div class="drawer-row"><strong>Evaluation Status</strong><span>${pill(r.status, variantFor(r.status))}</span></div>
      <div class="drawer-row"><strong>Requirement Details</strong><span>${esc(r.description)}</span></div>
    </div>

    <div class="drawer-section">
      <h3>Assurance Evidence &amp; Audit Trail</h3>
      <div class="drawer-row"><strong>Evidence Package Ref</strong><span><code>${esc(r.evidence_ref)}</code></span></div>
      <div class="drawer-row"><strong>Evidence Timestamp</strong><span>${fmtDate(r.last_evidence_date)}</span></div>
      <div class="drawer-row"><strong>Active Exceptions</strong><span>${r.exceptions_count > 0 ? pill('1 Active Exception', 'warn') : pill('None', 'good')}</span></div>
      <div class="drawer-row"><strong>Continuous Monitoring</strong><span>Automated daily compliance scan (EDX SecOps Sentinel)</span></div>
    </div>
  `
});
