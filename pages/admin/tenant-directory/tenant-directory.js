/**
 * Tenant Directory & Provisioning
 * Strictly ASCII-only UTF-8
 */
import { renderPage, pill, variantFor, fmtDate, esc } from '../_shared/page-kit.js';
import { TENANT_DIRECTORY_DEMO } from '../_shared/demo-data/tenant-directory.js';

renderPage({
  slug: 'tenant-directory',
  title: 'Tenant Directory \u0026 Provisioning',
  subtitle: 'Governed tenant lifecycle, provisioning checklist gates, administrative scopes, and connector instances.',
  context: 'Platform Admin \u00b7 Tenant \u0026 Commercial',
  roleBoundary: 'Platform Admin provisions provider-level tenant boundaries, validates prerequisite compliance gates, and activates connectors. Tenant-local user administration and local settings remain with Tenant Admins.',
  source: { endpoint: null, demo: TENANT_DIRECTORY_DEMO },
  rowId: 'id',
  defaultSort: { key: 'id', dir: 'asc' },
  searchFields: ['id', 'name', 'type', 'region', 'admin_contact'],

  kpis: rows => {
    const total = rows.length;
    const active = rows.filter(r => r.status === 'Active').length;
    const pending = rows.filter(r => r.status === 'Provisioning' || r.status === 'Pending Approval').length;
    const suspended = rows.filter(r => r.status === 'Suspended').length;
    return [
      { label: 'Total Tenants', value: total, note: 'Registered control-plane tenants' },
      { label: 'Active', value: active, note: 'Fully provisioned and operational', badge: { text: 'Healthy', variant: 'good' } },
      { label: 'Pending Approval', value: pending, note: 'Awaiting onboarding checklist gate', badge: { text: pending > 0 ? 'In review' : 'None', variant: 'warn' } },
      { label: 'Suspended', value: suspended, note: 'Ingestion and access paused', badge: { text: suspended > 0 ? 'Notice' : 'None', variant: suspended > 0 ? 'bad' : 'good' } },
    ];
  },

  filters: [
    { key: 'status', label: 'Status', type: 'chips' },
    { key: 'type', label: 'Type', type: 'select' },
    { key: 'region', label: 'Region', type: 'select' },
  ],

  columns: [
    { key: 'id', label: 'Tenant ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'region', label: 'Region', sortable: true },
    { key: 'tier', label: 'Tier', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: r => pill(r.status, variantFor(r.status))
    },
    {
      key: 'onboarded',
      label: 'Onboarded',
      sortable: true,
      render: r => fmtDate(r.onboarded)
    },
    { key: 'admin_contact', label: 'Admin Contact', sortable: true },
    { key: 'connectors_count', label: 'Connectors', sortable: true, className: 'text-end' },
  ],

  drawerTitle: r => `Tenant: ${r.name} (${r.id})`,
  drawer: r => {
    const checklistHtml = (r.checklist || []).map(step => {
      let stepVariant = 'neutral';
      if (step.status === 'Done') stepVariant = 'good';
      else if (step.status === 'In progress') stepVariant = 'warn';
      else if (step.status === 'Blocked') stepVariant = 'bad';
      return `
        <div class="checklist-step">
          <div>${pill(step.status, stepVariant)}</div>
          <div>
            <div class="fw-semibold small">${esc(step.step)}</div>
            <div class="text-body-secondary small">${esc(step.notes || '')}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="drawer-section">
        <h3>Tenant Profile</h3>
        <div class="drawer-row"><strong>Tenant ID</strong><span>${esc(r.id)}</span></div>
        <div class="drawer-row"><strong>Institution Name</strong><span>${esc(r.name)}</span></div>
        <div class="drawer-row"><strong>Type</strong><span>${esc(r.type)}</span></div>
        <div class="drawer-row"><strong>Region</strong><span>${esc(r.region)}</span></div>
        <div class="drawer-row"><strong>Service Tier</strong><span>${esc(r.tier)}</span></div>
        <div class="drawer-row"><strong>Domain</strong><span>${esc(r.domain || '\u2014')}</span></div>
        <div class="drawer-row"><strong>Enrollment Scope</strong><span>${r.student_count ? esc(r.student_count.toLocaleString()) + ' students' : '\u2014'}</span></div>
        <div class="drawer-row"><strong>Primary Contact</strong><span>${esc(r.lead_name || '\u2014')} (${esc(r.admin_contact)})</span></div>
        <div class="drawer-row"><strong>Onboarded Date</strong><span>${fmtDate(r.onboarded)}</span></div>
        <div class="drawer-row"><strong>Status</strong><span>${pill(r.status, variantFor(r.status))}</span></div>
      </div>

      <div class="drawer-section">
        <h3>Provisioning Checklist &amp; Gates</h3>
        <p class="text-body-secondary small mb-2">Platform governance requires all checklist gates to be certified before production activation.</p>
        <div>${checklistHtml}</div>
      </div>

      <div class="drawer-section">
        <h3>Active Connector Summary</h3>
        <div class="drawer-row"><strong>Connector Instances</strong><span>${esc(r.connectors_count)} active certified connectors</span></div>
        <div class="drawer-row"><strong>Audit Log Ref</strong><span>AUD-TEN-${esc(r.id.replace('TEN-', ''))}-202610</span></div>
      </div>
    `;
  }
});
