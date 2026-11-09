/**
 * Evidence Packages
 * Strictly ASCII-only UTF-8
 */
import { renderPage, pill, variantFor, fmtDate, miniBar, esc } from '../_shared/page-kit.js';
import { EVIDENCE_PACKAGES_DEMO } from '../_shared/demo-data/evidence-packages.js';

renderPage({
  slug: 'evidence-packages',
  title: 'Evidence Packages',
  subtitle: 'Compiled compliance dossiers, multi-source evidence assemblies, assurance completeness, and external audit bundles.',
  context: 'Platform Admin \u00b7 Governance \u0026 Assurance',
  roleBoundary: 'Platform Admin compiles and certifies comprehensive assurance evidence packages for external auditors and regulatory authorities. Primary evidence generation is maintained by respective technical and policy teams.',
  source: { endpoint: null, demo: EVIDENCE_PACKAGES_DEMO },
  rowId: 'id',
  defaultSort: { key: 'generated_at', dir: 'desc' },
  searchFields: ['id', 'title', 'framework', 'owner', 'reviewer'],

  kpis: rows => {
    const total = rows.length;
    const ready = rows.filter(r => r.status === 'Ready for review').length;
    const approved = rows.filter(r => r.status === 'Approved').length;
    const expired = rows.filter(r => r.status === 'Expired').length;

    return [
      { label: 'Packages', value: total, note: 'Governed evidence dossiers' },
      { label: 'Ready for Review', value: ready, note: 'Pending independent auditor review', badge: { text: ready > 0 ? 'Pending' : 'Zero', variant: ready > 0 ? 'warn' : 'good' } },
      { label: 'Approved', value: approved, note: 'Certified and verified', badge: { text: 'Certified', variant: 'good' } },
      { label: 'Expired', value: expired, note: 'Lapsed assurance period', badge: { text: expired > 0 ? 'Lapsed' : 'None', variant: expired > 0 ? 'bad' : 'good' } },
    ];
  },

  filters: [
    { key: 'status', label: 'Status', type: 'chips' },
    { key: 'framework', label: 'Framework', type: 'select' },
  ],

  columns: [
    { key: 'id', label: 'Package ID', sortable: true },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'period', label: 'Period', sortable: true },
    { key: 'owner', label: 'Owner', sortable: true },
    { key: 'items_count', label: 'Items', sortable: true, className: 'text-end' },
    {
      key: 'completeness_pct',
      label: 'Completeness',
      sortable: true,
      render: r => miniBar(r.completeness_pct)
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: r => pill(r.status, variantFor(r.status))
    },
    {
      key: 'generated_at',
      label: 'Generated At',
      sortable: true,
      render: r => fmtDate(r.generated_at)
    },
    { key: 'reviewer', label: 'Reviewer', sortable: true },
  ],

  drawerTitle: r => `Evidence Package: ${r.id}`,
  drawer: r => {
    const itemsHtml = (r.evidence_items || []).map(it => `
      <div class="checklist-step">
        <div>${pill(it.verified === 'Yes' ? 'Verified' : 'Unverified', it.verified === 'Yes' ? 'good' : 'warn')}</div>
        <div>
          <div class="fw-semibold small">${esc(it.ref)} \u2014 ${esc(it.type)}</div>
          <div class="text-body-secondary small">Domain: ${esc(it.domain)} \u00b7 Verified: ${esc(it.verified)}</div>
        </div>
      </div>
    `).join('');

    return `
      <div class="drawer-section">
        <h3>Evidence Package Dossier</h3>
        <div class="drawer-row"><strong>Package ID</strong><span>${esc(r.id)}</span></div>
        <div class="drawer-row"><strong>Dossier Title</strong><span>${esc(r.title)}</span></div>
        <div class="drawer-row"><strong>Assurance Framework</strong><span>${esc(r.framework)}</span></div>
        <div class="drawer-row"><strong>Audit Period</strong><span>${esc(r.period)}</span></div>
        <div class="drawer-row"><strong>Compilation Owner</strong><span>${esc(r.owner)}</span></div>
        <div class="drawer-row"><strong>Assurance Status</strong><span>${pill(r.status, variantFor(r.status))}</span></div>
        <div class="drawer-row"><strong>Assurance Reviewer</strong><span>${esc(r.reviewer)}</span></div>
        <div class="drawer-row"><strong>Compilation Date</strong><span>${fmtDate(r.generated_at)}</span></div>
        <div class="drawer-row"><strong>Evidence Completeness</strong><span>${miniBar(r.completeness_pct)} (${r.completeness_pct.toFixed(1)}%)</span></div>
      </div>

      <div class="drawer-section">
        <h3>Included Evidence Manifest (${(r.evidence_items || []).length} Items)</h3>
        <p class="text-body-secondary small mb-2">Cryptographic signatures and provenance proofs for individual compliance artifacts.</p>
        <div>${itemsHtml}</div>
      </div>
    `;
  }
});
