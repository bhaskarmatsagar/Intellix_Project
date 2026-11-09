/**
 * Classification & Tagging
 * Strictly ASCII-only UTF-8
 */
import { renderPage, pill, variantFor, fmtDate, miniBar, esc } from '../_shared/page-kit.js';
import { CLASSIFICATION_TAGGING_DEMO } from '../_shared/demo-data/classification-tagging.js';

renderPage({
  slug: 'classification-tagging',
  title: 'Classification \u0026 Tagging',
  subtitle: 'Governance of dataset confidentiality tiers, FERPA/PII tag taxonomies, and compliance tag coverage.',
  context: 'Platform Admin \u00b7 Policy \u0026 Protection',
  roleBoundary: 'Platform Admin sets platform data classification tiers, mandatory tag taxonomies, and cross-domain protection policies. Detailed field-level dataset tagging is executed and maintained by Data Stewards.',
  source: { endpoint: null, demo: CLASSIFICATION_TAGGING_DEMO },
  rowId: 'id',
  defaultSort: { key: 'classification', dir: 'desc' },
  searchFields: ['dataset', 'domain', 'classification', 'steward', 'id'],

  kpis: rows => {
    const totalDatasets = rows.length;
    const unclassified = rows.filter(r => r.status === 'Unclassified').length;
    const piiCount = rows.filter(r => r.tags.includes('PII') || r.tags.includes('FERPA')).length;
    const avgCoverage = Math.round(rows.reduce((sum, r) => sum + r.tag_coverage, 0) / rows.length);

    return [
      { label: 'Datasets', value: totalDatasets, note: 'Registered governance catalog' },
      { label: 'Unclassified', value: unclassified, note: 'Awaiting classification tier', badge: { text: unclassified > 0 ? 'Action required' : 'Zero', variant: unclassified > 0 ? 'bad' : 'good' } },
      { label: 'Datasets Containing PII', value: piiCount, note: 'FERPA / PII flagged assets', badge: { text: 'Protected', variant: 'warn' } },
      { label: 'Tag Coverage %', value: `${avgCoverage}%`, note: 'Mandatory taxonomy applied', badge: { text: avgCoverage >= 80 ? 'Compliant' : 'Sub-target', variant: avgCoverage >= 80 ? 'good' : 'warn' } },
    ];
  },

  filters: [
    { key: 'classification', label: 'Classification', type: 'chips' },
    { key: 'domain', label: 'Domain', type: 'select' },
  ],

  columns: [
    { key: 'dataset', label: 'Dataset', sortable: true },
    { key: 'domain', label: 'Domain', sortable: true },
    {
      key: 'classification',
      label: 'Classification',
      sortable: true,
      render: r => {
        let v = 'neutral';
        if (r.classification === 'Restricted') v = 'bad';
        else if (r.classification === 'Confidential') v = 'warn';
        else if (r.classification === 'Internal') v = 'info';
        else if (r.classification === 'Public') v = 'good';
        return pill(r.classification, v);
      }
    },
    {
      key: 'tags',
      label: 'Tags',
      sortable: false,
      render: r => r.tags.map(t => `<span class="badge text-bg-light border me-1">${esc(t)}</span>`).join('')
    },
    {
      key: 'tag_coverage',
      label: 'Tag Coverage',
      sortable: true,
      render: r => miniBar(r.tag_coverage)
    },
    { key: 'steward', label: 'Steward', sortable: true },
    {
      key: 'last_review',
      label: 'Last Review',
      sortable: true,
      render: r => fmtDate(r.last_review)
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: r => pill(r.status, variantFor(r.status))
    },
  ],

  drawerTitle: r => `Dataset: ${r.dataset}`,
  drawer: r => `
    <div class="drawer-section">
      <h3>Dataset Classification Profile</h3>
      <div class="drawer-row"><strong>Dataset Identifier</strong><span>${esc(r.id)}</span></div>
      <div class="drawer-row"><strong>Dataset Name</strong><span>${esc(r.dataset)}</span></div>
      <div class="drawer-row"><strong>Subject Domain</strong><span>${esc(r.domain)}</span></div>
      <div class="drawer-row"><strong>Confidentiality Tier</strong><span>${pill(r.classification, r.classification === 'Restricted' ? 'bad' : 'neutral')}</span></div>
      <div class="drawer-row"><strong>Governance Status</strong><span>${pill(r.status, variantFor(r.status))}</span></div>
      <div class="drawer-row"><strong>Authoritative Data Steward</strong><span>${esc(r.steward)}</span></div>
      <div class="drawer-row"><strong>Estimated Scale</strong><span>${esc(r.record_count)}</span></div>
      <div class="drawer-row"><strong>Retention Cadence</strong><span>${esc(r.retention_period)}</span></div>
    </div>

    <div class="drawer-section">
      <h3>Taxonomy &amp; Legal Protection Tags</h3>
      <div class="drawer-row"><strong>Tag Coverage Score</strong><span>${miniBar(r.tag_coverage)} (${r.tag_coverage.toFixed(1)}%)</span></div>
      <div class="drawer-row"><strong>Applied Tags</strong><span>${r.tags.map(t => `<span class="badge text-bg-secondary me-1">${esc(t)}</span>`).join('')}</span></div>
      <div class="drawer-row"><strong>FERPA Impact</strong><span>${r.tags.includes('FERPA') ? 'Subject to Family Educational Rights and Privacy Act (FERPA) regulations.' : 'Not subject to FERPA.'}</span></div>
      <div class="drawer-row"><strong>Last Steward Review</strong><span>${fmtDate(r.last_review)}</span></div>
    </div>
  `
});
