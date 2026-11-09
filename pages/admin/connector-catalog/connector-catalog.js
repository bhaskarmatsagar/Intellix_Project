/**
 * Connector Catalog & Certification
 * Strictly ASCII-only UTF-8
 */
import { renderPage, pill, variantFor, fmtDate, esc } from '../_shared/page-kit.js';
import { CONNECTOR_CATALOG_DEMO } from '../_shared/demo-data/connector-catalog.js';

renderPage({
  slug: 'connector-catalog',
  title: 'Connector Catalog \u0026 Certification',
  subtitle: 'Verified interoperability profiles, data standard conformance, certification lifecycles, and tenant adoption.',
  context: 'Platform Admin \u00b7 Exchange Foundation',
  roleBoundary: 'Platform Admin certifies connector versions, evaluates interoperability profiles, and governs catalog publishing. Connector deployment configuration and tenant scheduling remain with Data Engineers and Tenant Admins.',
  source: { endpoint: null, demo: CONNECTOR_CATALOG_DEMO },
  rowId: 'id',
  defaultSort: { key: 'certification', dir: 'asc' },
  searchFields: ['id', 'name', 'type', 'owner', 'standard'],

  kpis: rows => {
    const total = rows.length;
    const certified = rows.filter(r => r.certification === 'Certified').length;
    // Expiring within 60 days relative to 2026-10-05: before 2026-12-04
    const expiring60d = rows.filter(r => r.expires && new Date(r.expires) <= new Date('2026-12-04T00:00:00Z') && new Date(r.expires) >= new Date('2026-10-05T00:00:00Z')).length;
    const notCertified = rows.filter(r => r.certification === 'Not certified' || r.certification === 'In review' || r.certification === 'Expired').length;

    return [
      { label: 'Connectors', value: total, note: 'Registered adapter catalog' },
      { label: 'Certified', value: certified, note: 'Passed interoperability gate', badge: { text: 'Certified', variant: 'good' } },
      { label: 'Certification Expiring (60d)', value: expiring60d, note: 'Renewal window open', badge: { text: expiring60d > 0 ? 'Upcoming' : 'None', variant: expiring60d > 0 ? 'warn' : 'good' } },
      { label: 'Not Certified', value: notCertified, note: 'Draft, in review or expired', badge: { text: notCertified > 0 ? 'Uncertified' : 'Zero', variant: notCertified > 0 ? 'bad' : 'good' } },
    ];
  },

  filters: [
    { key: 'certification', label: 'Certification', type: 'chips' },
    { key: 'type', label: 'Type', type: 'select' },
  ],

  columns: [
    { key: 'id', label: 'Connector ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'version', label: 'Version', sortable: true },
    {
      key: 'certification',
      label: 'Certification',
      sortable: true,
      render: r => pill(r.certification, variantFor(r.certification))
    },
    {
      key: 'certified_on',
      label: 'Certified On',
      sortable: true,
      render: r => fmtDate(r.certified_on)
    },
    {
      key: 'expires',
      label: 'Expires',
      sortable: true,
      render: r => fmtDate(r.expires)
    },
    { key: 'owner', label: 'Owner', sortable: true },
    { key: 'tenants_using', label: 'Tenants Using', sortable: true, className: 'text-end' },
  ],

  drawerTitle: r => `Connector: ${r.name} v${r.version}`,
  drawer: r => `
    <div class="drawer-section">
      <h3>Connector Certification Profile</h3>
      <div class="drawer-row"><strong>Connector ID</strong><span>${esc(r.id)}</span></div>
      <div class="drawer-row"><strong>Title</strong><span>${esc(r.name)}</span></div>
      <div class="drawer-row"><strong>Integration Domain</strong><span>${esc(r.type)}</span></div>
      <div class="drawer-row"><strong>Release Version</strong><span>v${esc(r.version)}</span></div>
      <div class="drawer-row"><strong>Authoritative Team</strong><span>${esc(r.owner)}</span></div>
      <div class="drawer-row"><strong>Current Certification</strong><span>${pill(r.certification, variantFor(r.certification))}</span></div>
      <div class="drawer-row"><strong>Certified On</strong><span>${fmtDate(r.certified_on)}</span></div>
      <div class="drawer-row"><strong>Expiration Date</strong><span>${fmtDate(r.expires)}</span></div>
    </div>

    <div class="drawer-section">
      <h3>Interoperability Standard &amp; Conformance</h3>
      <div class="drawer-row"><strong>Standard Specification</strong><span>${esc(r.standard)}</span></div>
      <div class="drawer-row"><strong>Schema Alignment</strong><span>Schema Version ${esc(r.schema_version)}</span></div>
      <div class="drawer-row"><strong>Compliance Test Suite</strong><span>${esc(r.test_suite_status)}</span></div>
      <div class="drawer-row"><strong>Active Tenant Footprint</strong><span>${esc(r.tenants_using)} production tenant instances</span></div>
    </div>
  `
});
