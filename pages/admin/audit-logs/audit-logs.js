/**
 * Platform Audit Logs
 * Strictly ASCII-only UTF-8
 */
import { renderPage, pill, variantFor, fmtDateTime, esc } from '../_shared/page-kit.js';
import { AUDIT_LOGS_DEMO } from '../_shared/demo-data/audit-logs.js';

renderPage({
  slug: 'audit-logs',
  title: 'Platform Audit Logs',
  subtitle: 'Immutable record of platform control-plane actions, administrative elevations, policy changes, and security events.',
  context: 'Platform Admin \u00b7 Governance \u0026 Assurance',
  roleBoundary: 'Audit records cannot be edited or deleted.',
  source: { endpoint: null, demo: AUDIT_LOGS_DEMO },
  rowId: 'id',
  pageSize: 25,
  defaultSort: { key: 'timestamp_utc', dir: 'desc' },
  searchFields: ['actor', 'action', 'target', 'source_ip', 'request_id', 'details'],

  kpis: rows => {
    const events24h = rows.filter(r => r.hours_ago <= 24).length;
    const failedOrDenied = rows.filter(r => r.outcome === 'Failure' || r.outcome === 'Denied').length;
    const privileged = rows.filter(r => r.category === 'Access' || r.action.includes('ELEVATION') || r.action.includes('KEY_ROTATION')).length;
    const distinctActors = new Set(rows.map(r => r.actor)).size;

    return [
      { label: 'Events (24h)', value: events24h, note: 'Recent recorded actions', badge: { text: 'Current', variant: 'info' } },
      { label: 'Failed or Denied', value: failedOrDenied, note: 'Unauthorized or failed actions', badge: { text: failedOrDenied > 0 ? `${failedOrDenied} events` : 'Zero', variant: failedOrDenied > 0 ? 'bad' : 'good' } },
      { label: 'Privileged Actions', value: privileged, note: 'Admin & credential operations', badge: { text: 'Audited', variant: 'neutral' } },
      { label: 'Distinct Actors', value: distinctActors, note: 'Unique identities & services', badge: { text: 'Tracked', variant: 'good' } },
    ];
  },

  filters: [
    { key: 'category', label: 'Category', type: 'chips' },
    { key: 'outcome', label: 'Outcome', type: 'chips' },
    {
      key: 'range',
      label: 'Time Window',
      type: 'select',
      options: [
        { value: '', label: 'All Records (30 Days)' },
        { value: '24h', label: 'Past 24 Hours' },
        { value: '7d', label: 'Past 7 Days' },
      ]
    }
  ],

  columns: [
    {
      key: 'timestamp_utc',
      label: 'Timestamp (UTC)',
      sortable: true,
      render: r => fmtDateTime(r.timestamp_utc)
    },
    { key: 'actor', label: 'Actor', sortable: true },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: r => `<code class="small text-body">${esc(r.action)}</code>`
    },
    { key: 'target', label: 'Target', sortable: true },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: r => pill(r.category, 'neutral')
    },
    {
      key: 'outcome',
      label: 'Outcome',
      sortable: true,
      render: r => pill(r.outcome, r.outcome === 'Success' ? 'good' : r.outcome === 'Denied' ? 'bad' : 'warn')
    },
    {
      key: 'source_ip',
      label: 'Source IP',
      sortable: true,
      render: r => `<code class="small text-body-secondary">${esc(r.source_ip)}</code>`
    },
    {
      key: 'request_id',
      label: 'Request ID',
      sortable: true,
      render: r => `<code class="small">${esc(r.request_id)}</code>`
    },
  ],

  drawerTitle: r => `Audit Event: ${r.request_id}`,
  drawer: r => `
    <div class="drawer-section">
      <h3>Audit Event Specification</h3>
      <div class="alert alert-warning py-2 small mb-3">
        <i class="bi bi-lock-fill me-1"></i> Immutable record: Cryptographically sealed on immutable storage. Cannot be altered or purged.
      </div>
      <div class="drawer-row"><strong>Request ID</strong><span><code>${esc(r.request_id)}</code></span></div>
      <div class="drawer-row"><strong>Event Timestamp (UTC)</strong><span>${fmtDateTime(r.timestamp_utc)}</span></div>
      <div class="drawer-row"><strong>Authenticated Actor</strong><span>${esc(r.actor)}</span></div>
      <div class="drawer-row"><strong>Action Executed</strong><span><code>${esc(r.action)}</code></span></div>
      <div class="drawer-row"><strong>Target Resource</strong><span>${esc(r.target)}</span></div>
      <div class="drawer-row"><strong>Event Category</strong><span>${pill(r.category, 'neutral')}</span></div>
      <div class="drawer-row"><strong>Execution Outcome</strong><span>${pill(r.outcome, variantFor(r.outcome))}</span></div>
      <div class="drawer-row"><strong>Source IP Address</strong><span><code>${esc(r.source_ip)}</code></span></div>
    </div>

    <div class="drawer-section">
      <h3>Contextual Details &amp; Payload</h3>
      <div class="p-3 rounded bg-body-tertiary border mb-3 small">
        ${esc(r.details)}
      </div>
      <div class="drawer-row"><strong>Integrity Verification</strong><span><span class="recon-icon ok">\u2713</span> SHA256 Chain Verified</span></div>
      <div class="drawer-row"><strong>Storage Location</strong><span>Object Vault: <code>gs://edx-audit-immutable-prod/2026/10/</code></span></div>
    </div>
  `
});
