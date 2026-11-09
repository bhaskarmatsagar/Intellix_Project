/**
 * Platform Notifications
 * Strictly ASCII-only UTF-8
 */
import { renderPage, pill, variantFor, fmtDateTime, miniBar, esc } from '../_shared/page-kit.js';
import { PLATFORM_NOTIFICATIONS_DEMO } from '../_shared/demo-data/platform-notifications.js';

renderPage({
  slug: 'platform-notifications',
  title: 'Platform Notifications',
  subtitle: 'Platform-wide operational bulletins, incident broadcasts, maintenance schedules, and multi-channel delivery rates.',
  context: 'Platform Admin \u00b7 Platform Operations',
  roleBoundary: 'Platform Admin publishes and governs platform-wide emergency bulletins, maintenance advisories, and system alerts. Tenant-specific user notifications are managed locally by Tenant Admins.',
  source: { endpoint: null, demo: PLATFORM_NOTIFICATIONS_DEMO },
  rowId: 'id',
  defaultSort: { key: 'scheduled_or_sent_at', dir: 'desc' },
  searchFields: ['id', 'title', 'channel', 'audience', 'severity'],

  kpis: rows => {
    // Sent in last 7 days relative to 2026-10-05: between 2026-09-28 and 2026-10-05
    const sent7d = rows.filter(r => r.status === 'Sent').length;
    const scheduled = rows.filter(r => r.status === 'Scheduled').length;
    const failed = rows.reduce((sum, r) => sum + (r.failure_count || 0), 0);
    const deliveredRows = rows.filter(r => r.delivery_rate !== null && r.delivery_rate !== undefined);
    const avgDelivery = Math.round(deliveredRows.reduce((sum, r) => sum + r.delivery_rate, 0) / (deliveredRows.length || 1));

    return [
      { label: 'Sent (7 days)', value: sent7d, note: 'Dispatched broadcast alerts', badge: { text: 'Delivered', variant: 'good' } },
      { label: 'Scheduled', value: scheduled, note: 'Pending execution window', badge: { text: scheduled > 0 ? 'Upcoming' : 'None', variant: 'info' } },
      { label: 'Failed Deliveries', value: failed, note: 'Bounce / relay timeouts', badge: { text: failed > 0 ? 'Review failures' : 'Zero', variant: failed > 0 ? 'bad' : 'good' } },
      { label: 'Average Delivery Rate', value: `${avgDelivery}%`, note: 'Multi-channel receipt rate', badge: { text: avgDelivery >= 95 ? 'Nominal' : 'Degraded', variant: avgDelivery >= 95 ? 'good' : 'warn' } },
    ];
  },

  filters: [
    { key: 'status', label: 'Status', type: 'chips' },
    { key: 'channel', label: 'Channel', type: 'select' },
  ],

  columns: [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'title', label: 'Title', sortable: true },
    {
      key: 'channel',
      label: 'Channel',
      sortable: true,
      render: r => pill(r.channel, 'neutral')
    },
    { key: 'audience', label: 'Audience', sortable: true },
    {
      key: 'severity',
      label: 'Severity',
      sortable: true,
      render: r => pill(r.severity, r.severity === 'Critical' ? 'bad' : r.severity === 'Warning' ? 'warn' : 'info')
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: r => pill(r.status, variantFor(r.status))
    },
    {
      key: 'scheduled_or_sent_at',
      label: 'Scheduled / Sent At',
      sortable: true,
      render: r => fmtDateTime(r.scheduled_or_sent_at)
    },
    {
      key: 'delivery_rate',
      label: 'Delivery Rate',
      sortable: true,
      render: r => miniBar(r.delivery_rate)
    },
  ],

  drawerTitle: r => `Notification: ${r.id}`,
  drawer: r => `
    <div class="drawer-section">
      <h3>Notification Broadcast Details</h3>
      <div class="drawer-row"><strong>Notification ID</strong><span>${esc(r.id)}</span></div>
      <div class="drawer-row"><strong>Subject / Headline</strong><span>${esc(r.title)}</span></div>
      <div class="drawer-row"><strong>Dispatch Channel</strong><span>${pill(r.channel, 'neutral')}</span></div>
      <div class="drawer-row"><strong>Severity Level</strong><span>${pill(r.severity, r.severity === 'Critical' ? 'bad' : 'info')}</span></div>
      <div class="drawer-row"><strong>Target Audience</strong><span>${esc(r.audience)}</span></div>
      <div class="drawer-row"><strong>Broadcast Status</strong><span>${pill(r.status, variantFor(r.status))}</span></div>
      <div class="drawer-row"><strong>Dispatch Timestamp</strong><span>${fmtDateTime(r.scheduled_or_sent_at)}</span></div>
    </div>

    <div class="drawer-section">
      <h3>Message Body &amp; Content</h3>
      <div class="p-3 rounded bg-body-tertiary border mb-3 small">
        ${esc(r.body)}
      </div>
    </div>

    <div class="drawer-section">
      <h3>Telemetry &amp; Delivery SLA</h3>
      <div class="drawer-row"><strong>Total Targeted Recipients</strong><span>${esc(r.recipients_count)}</span></div>
      <div class="drawer-row"><strong>Confirmed Deliveries</strong><span>${esc(r.recipients_count - r.failure_count)}</span></div>
      <div class="drawer-row"><strong>Failed Deliveries</strong><span>${r.failure_count > 0 ? `<span class="badge text-bg-danger">${esc(r.failure_count)} failed</span>` : '0'}</span></div>
      <div class="drawer-row"><strong>Delivery Rate</strong><span>${miniBar(r.delivery_rate)} (${r.delivery_rate != null ? r.delivery_rate.toFixed(1) + '%' : 'Draft'})</span></div>
    </div>
  `
});
