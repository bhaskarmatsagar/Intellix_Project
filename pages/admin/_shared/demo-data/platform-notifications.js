/**
 * Demo data for Platform Notifications
 * Dates around 5 Oct 2026. Strictly ASCII-only.
 */

export const PLATFORM_NOTIFICATIONS_DEMO = [
  {
    id: 'NOTIF-2610-001',
    title: 'Scheduled Ingress Maintenance Window Notice (MW-261007-01)',
    channel: 'Email',
    audience: 'All Tenant Administrators & Integration Leads',
    severity: 'Warning',
    status: 'Sent',
    scheduled_or_sent_at: '2026-10-04T14:00:00Z',
    delivery_rate: 99.8,
    recipients_count: 342,
    failure_count: 1,
    body: 'EduData Exchange will conduct scheduled API gateway certificate rotations on Oct 7 between 01:00-03:00 UTC. Brief 30s connection pauses may occur.'
  },
  {
    id: 'NOTIF-2610-002',
    title: 'Pipeline Ingestion Degradation Advisory (INC-261005-07)',
    channel: 'Status page',
    audience: 'Public Platform Status Subscribers',
    severity: 'Critical',
    status: 'Sent',
    scheduled_or_sent_at: '2026-10-05T14:15:00Z',
    delivery_rate: 100.0,
    recipients_count: 1250,
    failure_count: 0,
    body: 'We are investigating elevated completion latency on scheduled SIS ingestion feeds. Real-time API queries remain unaffected.'
  },
  {
    id: 'NOTIF-2610-003',
    title: 'Quarterly FERPA Compliance Recertification Reminder',
    channel: 'In-app',
    audience: 'Data Stewards & Compliance Reviewers',
    severity: 'Info',
    status: 'Scheduled',
    scheduled_or_sent_at: '2026-10-15T09:00:00Z',
    delivery_rate: 100.0,
    recipients_count: 58,
    failure_count: 0,
    body: 'Annual steward access review is due by Oct 31. Please review pending classification assignments in the Policy & Protection console.'
  },
  {
    id: 'NOTIF-2610-004',
    title: 'Ed-Fi 4.0 Adapter Upgrade Security Advisory',
    channel: 'Webhook',
    audience: 'Registered SIS Partner Endpoints',
    severity: 'Warning',
    status: 'Sent',
    scheduled_or_sent_at: '2026-09-30T16:00:00Z',
    delivery_rate: 96.5,
    recipients_count: 85,
    failure_count: 3,
    body: 'Automated webhook dispatch notifying automated listener systems of deprecation schedule for Ed-Fi 3.x adapter endpoints.'
  },
  {
    id: 'NOTIF-2610-005',
    title: 'Legacy SFTP Ingestion Gateway Decommission Warning',
    channel: 'Email',
    audience: 'State Agency Technical Coordinators',
    severity: 'Critical',
    status: 'Failed',
    scheduled_or_sent_at: '2026-10-03T11:20:00Z',
    delivery_rate: 42.0,
    recipients_count: 12,
    failure_count: 7,
    body: 'Delivery failed due to upstream MTA SMTP relay timeout on state government MX servers. Re-queued for administrative review.'
  },
  {
    id: 'NOTIF-2610-006',
    title: 'Fall 2026 Data Exchange Release Notes & Roadmap',
    channel: 'In-app',
    audience: 'All Authorized Platform Users',
    severity: 'Info',
    status: 'Draft',
    scheduled_or_sent_at: '2026-10-20T10:00:00Z',
    delivery_rate: null,
    recipients_count: 1800,
    failure_count: 0,
    body: 'Draft announcement outlining upcoming features in EDX 7.2 including enhanced row-level security policy simulator and automated validation gates.'
  },
  {
    id: 'NOTIF-2610-007',
    title: 'Emergency Security Patch Notification: WAF Rule Update',
    channel: 'Webhook',
    audience: 'SecOps Incident Escalation Channels',
    severity: 'Critical',
    status: 'Sent',
    scheduled_or_sent_at: '2026-10-01T02:30:00Z',
    delivery_rate: 100.0,
    recipients_count: 14,
    failure_count: 0,
    body: 'Urgent notification confirming automated hotfix applied to edge reverse proxy rules to mitigate CVE-2026-7811 query parsing vulnerability.'
  },
  {
    id: 'NOTIF-2610-008',
    title: 'Platform Maintenance Completion Notice',
    channel: 'Status page',
    audience: 'All Platform Subscribers',
    severity: 'Info',
    status: 'Sent',
    scheduled_or_sent_at: '2026-09-28T04:00:00Z',
    delivery_rate: 100.0,
    recipients_count: 1250,
    failure_count: 0,
    body: 'Scheduled database indexing maintenance completed successfully ahead of window. All services operational with nominal latency.'
  }
];
