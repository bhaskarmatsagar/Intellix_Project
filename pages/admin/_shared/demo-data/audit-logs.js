/**
 * Demo data for Platform Audit Logs
 * Immutable audit trail. Dates around 5 Oct 2026.
 * 32 records to support pagination (25 per page). Strictly ASCII-only.
 */

const RAW_EVENTS = [
  { hoursAgo: 0.5, actor: 'alex.chen@edx-platform.net', action: 'ROLE_ELEVATION_GRANTED', target: 'ACC-102 (maria.gonzalez)', category: 'Access', outcome: 'Success', ip: '10.240.1.15', req: 'REQ-261005-001', details: 'Approved JIT elevation to Platform Admin for change CHG-2610-014' },
  { hoursAgo: 1.2, actor: 'sec-ops-lead@edx-platform.net', action: 'POLICY_UPDATE', target: 'NET-CTL-004 (WAF Ruleset)', category: 'Policy', outcome: 'Success', ip: '10.240.2.8', req: 'REQ-261005-002', details: 'Updated OWASP Core Rule Set to v3.3.4 block mode' },
  { hoursAgo: 2.0, actor: 'unknown.actor@198.51.100.89', action: 'ADMIN_LOGIN_ATTEMPT', target: 'Control Plane /admin', category: 'Access', outcome: 'Denied', ip: '198.51.100.89', req: 'REQ-261005-003', details: 'Failed MFA challenge; IP flagged by threat intelligence' },
  { hoursAgo: 2.8, actor: 'system.vault@edx.internal', action: 'KEY_ROTATION_AUTOMATED', target: 'SEC-REF-1005 (PG Workbench)', category: 'Configuration', outcome: 'Success', ip: '10.244.0.12', req: 'REQ-261005-004', details: 'Automated 60-day DB dynamic secret credential rotation' },
  { hoursAgo: 3.5, actor: 'elena.rostova@dese.state.gov', action: 'TENANT_PROVISION_STEP', target: 'TEN-1003 (State DESE)', category: 'Configuration', outcome: 'Success', ip: '192.0.2.45', req: 'REQ-261005-005', details: 'Submitted annual state data exchange reconciliation sign-off' },
  { hoursAgo: 4.1, actor: 'dave.miller@contractor.edx-platform.net', action: 'DIRECT_DB_ACCESS_ATTEMPT', target: 'edx_production_db', category: 'Data', outcome: 'Denied', ip: '10.240.5.21', req: 'REQ-261005-006', details: 'Unauthorized raw SQL query blocked by policy interceptor' },
  { hoursAgo: 5.0, actor: 'alex.chen@edx-platform.net', action: 'LEGAL_HOLD_UPDATED', target: 'HLD-2026-001', category: 'Policy', outcome: 'Success', ip: '10.240.1.15', req: 'REQ-261005-007', details: 'Appended custodian scope to state OCR litigation hold' },
  { hoursAgo: 6.2, actor: 'system.cron@edx.internal', action: 'DISPOSAL_SWEEP_EXECUTED', target: 'RET-007 (Transient Feed)', category: 'Data', outcome: 'Success', ip: '10.244.1.4', req: 'REQ-261005-008', details: 'Purged 142 expired staging feeds older than 30 days' },
  { hoursAgo: 7.0, actor: 'maria.gonzalez@edx-platform.net', action: 'CONNECTOR_CERTIFICATION_GATE', target: 'CONN-SIS-001', category: 'Configuration', outcome: 'Success', ip: '10.240.3.19', req: 'REQ-261005-009', details: 'Passed test suite: 142/142 tests verified for Ed-Fi 4.0' },
  { hoursAgo: 8.4, actor: 'external-auditor@deloitte-audit.com', action: 'EVIDENCE_PACKAGE_EXPORT', target: 'EVD-PKG-2026-Q3-FERPA', category: 'Policy', outcome: 'Success', ip: '203.0.113.102', req: 'REQ-261005-010', details: 'Downloaded read-only immutable compliance snapshot' },
  { hoursAgo: 9.1, actor: 'system.auth@edx.internal', action: 'API_TOKEN_EXPIRED', target: 'SEC-REF-1004 (PowerSchool)', category: 'Access', outcome: 'Failure', ip: '10.244.2.1', req: 'REQ-261005-011', details: 'Ingestion pipeline attempted call with expired webhook secret' },
  { hoursAgo: 10.5, actor: 'alex.chen@edx-platform.net', action: 'TENANT_STATUS_MODIFIED', target: 'TEN-1007 (Oakridge)', category: 'Configuration', outcome: 'Success', ip: '10.240.1.15', req: 'REQ-261005-012', details: 'Suspended ingestion tenant following lapsed DSA charter renewal' },
  { hoursAgo: 12.0, actor: 'system.sentinel@edx.internal', action: 'SECURITY_CONTROL_SCAN', target: 'NET-CTL-001 (TLS Enforcement)', category: 'Policy', outcome: 'Success', ip: '10.244.0.9', req: 'REQ-261005-013', details: 'Verified 100% of edge load balancers reject TLS < 1.2' },
  { hoursAgo: 13.5, actor: 'dr.jenkins@springfield-k12.org', action: 'CLASSIFICATION_REVIEW', target: 'DS-001 (Student Demographics)', category: 'Data', outcome: 'Success', ip: '198.51.100.12', req: 'REQ-261005-014', details: 'Certified 100% tag coverage on demographic table' },
  { hoursAgo: 14.8, actor: 'system.monitor@edx.internal', action: 'SLO_BREACH_ALERT_DISPATCH', target: 'SLO-PIPE-SUCCESS-001', category: 'Configuration', outcome: 'Success', ip: '10.244.3.8', req: 'REQ-261005-015', details: 'Dispatched automated alert: Pipeline success fell to 98.84%' },
  { hoursAgo: 16.0, actor: 'storage-admin@edx-platform.net', action: 'BUCKET_POLICY_CHANGE_ATTEMPT', target: 'edx-archive-coldline', category: 'Configuration', outcome: 'Denied', ip: '10.240.4.5', req: 'REQ-261005-016', details: 'Attempted to loosen object immutability without CAB approval' },
  { hoursAgo: 18.2, actor: 'marcus.vance@metro-state.edu', action: 'PURPOSE_SUBSCRIPTION_REQUEST', target: 'POL-PURP-002 (Research)', category: 'Policy', outcome: 'Success', ip: '192.0.2.190', req: 'REQ-261005-017', details: 'Enrolled institutional research workspace in policy' },
  { hoursAgo: 20.0, actor: 'sec-ops-lead@edx-platform.net', action: 'EMERGENCY_PATCH_APPROVAL', target: 'CHG-2610-015', category: 'Configuration', outcome: 'Success', ip: '10.240.2.8', req: 'REQ-261005-018', details: 'Approved urgent WAF hotfix for CVE-2026-7811' },
  { hoursAgo: 22.5, actor: 'system.billing@edx.internal', action: 'MONTHLY_USAGE_RECONCILE', target: 'INV-202610-02 (Metro State)', category: 'Configuration', outcome: 'Success', ip: '10.244.0.15', req: 'REQ-261005-019', details: 'Reconciled 8.95M API calls against commitment cap' },
  { hoursAgo: 23.9, actor: 'service-account@ingest.edx.internal', action: 'MASKING_RULE_VALIDATION', target: 'SEC-RLS-001 (SSN Redact)', category: 'Data', outcome: 'Success', ip: '10.244.4.12', req: 'REQ-261005-020', details: 'Automated policy validator verified 0 unmasked SSN leakage' },
  // Events older than 24h (24h - 7d)
  { hoursAgo: 26.0, actor: 'alex.chen@edx-platform.net', action: 'CHANGE_REQUEST_SUBMITTED', target: 'CHG-2610-014 (Cert Rotation)', category: 'Configuration', outcome: 'Success', ip: '10.240.1.15', req: 'REQ-261005-021', details: 'Scheduled maintenance window for MW-261007-01' },
  { hoursAgo: 32.0, actor: 'sec-ops-lead@edx-platform.net', action: 'IP_ALLOWLIST_MODIFIED', target: 'NET-CTL-002', category: 'Access', outcome: 'Success', ip: '10.240.2.8', req: 'REQ-261005-022', details: 'Added authorized state agency VPN egress CIDR 192.0.2.0/24' },
  { hoursAgo: 40.0, actor: 'unknown.scanner@203.0.113.200', action: 'PORT_SCAN_BLOCKED', target: 'Edge Ingress Gateway', category: 'Access', outcome: 'Denied', ip: '203.0.113.200', req: 'REQ-261005-023', details: 'Automated rate limit and IP drop triggered on suspicious sweep' },
  { hoursAgo: 50.0, actor: 'system.cron@edx.internal', action: 'AUDIT_LOG_INTEGRITY_SEAL', target: 'AUDIT-LOG-BLOCK-20261003', category: 'Policy', outcome: 'Success', ip: '10.244.0.2', req: 'REQ-261005-024', details: 'Cryptographic SHA256 chain seal appended to audit segment' },
  { hoursAgo: 58.0, actor: 'dave.miller@contractor.edx-platform.net', action: 'PIPELINE_CONFIG_MODIFIED', target: 'Pipe: DeseStateIngest', category: 'Configuration', outcome: 'Success', ip: '10.240.5.21', req: 'REQ-261005-025', details: 'Updated connector timeout from 120s to 300s' },
  { hoursAgo: 72.0, actor: 'maria.gonzalez@edx-platform.net', action: 'ROLE_REVOCATION', target: 'ACC-107 (Legacy Account)', category: 'Access', outcome: 'Success', ip: '10.240.3.19', req: 'REQ-261005-026', details: 'Revoked standing access for non-MFA compliant service account' },
  { hoursAgo: 85.0, actor: 'system.vault@edx.internal', action: 'CREDENTIAL_REVOKED', target: 'SEC-REF-1006 (SFTP Legacy)', category: 'Configuration', outcome: 'Success', ip: '10.244.0.12', req: 'REQ-261005-027', details: 'Decommissioned legacy SFTP key from HSM slot' },
  { hoursAgo: 98.0, actor: 'patricia.chen@lakeland.edu', action: 'TENANT_ONBOARD_INITIATED', target: 'TEN-1005 (Lakeland)', category: 'Configuration', outcome: 'Success', ip: '198.51.100.80', req: 'REQ-261005-028', details: 'Submitted initial charter and federation metadata XML' },
  { hoursAgo: 112.0, actor: 'alex.chen@edx-platform.net', action: 'GOVERNANCE_EXCEPTION_LOGGED', target: 'NET-CTL-006 (Legacy Port 22)', category: 'Policy', outcome: 'Success', ip: '10.240.1.15', req: 'REQ-261005-029', details: 'Approved 30-day time-bound exception for State SFTP bridge' },
  { hoursAgo: 130.0, actor: 'system.sentinel@edx.internal', action: 'ANOMALY_DETECTION_ALERT', target: 'API Gateway Rate Anomaly', category: 'Access', outcome: 'Failure', ip: '10.244.1.9', req: 'REQ-261005-030', details: 'Burst of 401 Unauthorized errors observed on /v2/rosters' },
  { hoursAgo: 145.0, actor: 'sec-ops-lead@edx-platform.net', action: 'ACCESS_RECERTIFICATION_CYCLE', target: 'Global Platform Admins', category: 'Access', outcome: 'Success', ip: '10.240.2.8', req: 'REQ-261005-031', details: 'Completed Q3 administrative access review cycle' },
  { hoursAgo: 160.0, actor: 'system.cron@edx.internal', action: 'AUDIT_ARCHIVE_TRANSFER', target: 'S3 Glacier Deep Archive', category: 'Data', outcome: 'Success', ip: '10.244.0.2', req: 'REQ-261005-032', details: 'Archived September 2026 immutable audit records' }
];

const BASE_TIME = new Date('2026-10-05T15:00:00Z').getTime();

export const AUDIT_LOGS_DEMO = RAW_EVENTS.map(ev => {
  const ts = new Date(BASE_TIME - ev.hoursAgo * 3600 * 1000).toISOString();
  return {
    id: ev.req,
    timestamp_utc: ts,
    actor: ev.actor,
    action: ev.action,
    target: ev.target,
    category: ev.category,
    outcome: ev.outcome,
    source_ip: ev.ip,
    request_id: ev.req,
    details: ev.details,
    hours_ago: ev.hoursAgo
  };
});
