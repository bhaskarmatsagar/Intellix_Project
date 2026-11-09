/**
 * Demo data for Data Protection, Retention & Legal Hold
 * Dates around 5 Oct 2026. Strictly ASCII-only.
 */

export const RETENTION_SCHEDULE_DEMO = [
  {
    id: 'RET-001',
    dataset: 'Student Master Demographics',
    retention_period: '7 Years Post-Graduation',
    disposal_method: 'Cryptographic Shredding',
    encryption_at_rest: 'Yes (AES-256-GCM)',
    backup_status: 'Geo-Redundant (Immutable)',
    next_disposal: '2026-10-31T00:00:00Z',
    status: 'Compliant',
    steward: 'Dr. Sarah Jenkins',
    archive_tier: 'Coldline Vault'
  },
  {
    id: 'RET-002',
    dataset: 'Course Enrollment & Schedules',
    retention_period: '5 Years Post-Completion',
    disposal_method: 'Cryptographic Shredding',
    encryption_at_rest: 'Yes (AES-256-GCM)',
    backup_status: 'Geo-Redundant',
    next_disposal: '2027-06-30T00:00:00Z',
    status: 'Compliant',
    steward: 'Marcus Vance',
    archive_tier: 'Nearline'
  },
  {
    id: 'RET-003',
    dataset: 'State Assessment Scaled Scores',
    retention_period: '10 Years Longitudinal',
    disposal_method: 'Secure Overwrite (DoD 5220.22-M)',
    encryption_at_rest: 'Yes (AES-256-GCM)',
    backup_status: 'Geo-Redundant (Immutable)',
    next_disposal: '2028-12-31T00:00:00Z',
    status: 'Compliant',
    steward: 'Elena Rostova',
    archive_tier: 'Coldline Vault'
  },
  {
    id: 'RET-004',
    dataset: 'Special Education Accommodations (IEP)',
    retention_period: '7 Years Post Age-of-Majority',
    disposal_method: 'Cryptographic Shredding',
    encryption_at_rest: 'Yes (AES-256-GCM)',
    backup_status: 'Geo-Redundant (Immutable)',
    next_disposal: '2026-10-15T00:00:00Z',
    status: 'Legal hold locked',
    steward: 'Dr. Gregory Houseman',
    archive_tier: 'Legal Hold Vault'
  },
  {
    id: 'RET-005',
    dataset: 'District Public Directory Information',
    retention_period: '1 Year Annual Cycle',
    disposal_method: 'Truncate & Purge',
    encryption_at_rest: 'Yes (AES-256)',
    backup_status: 'Standard Snapshot',
    next_disposal: '2026-10-20T00:00:00Z',
    status: 'Disposal due',
    steward: 'Dr. Sarah Jenkins',
    archive_tier: 'Standard'
  },
  {
    id: 'RET-006',
    dataset: 'Educator Professional Staff Credentials',
    retention_period: '7 Years Post-Employment',
    disposal_method: 'Cryptographic Shredding',
    encryption_at_rest: 'Yes (AES-256-GCM)',
    backup_status: 'Geo-Redundant',
    next_disposal: '2027-09-01T00:00:00Z',
    status: 'Compliant',
    steward: 'Patricia Chen',
    archive_tier: 'Nearline'
  },
  {
    id: 'RET-007',
    dataset: 'Raw Ed-Fi Staging Ingestion Feed',
    retention_period: '30 Days Transient',
    disposal_method: 'Automatic TTL Expiration',
    encryption_at_rest: 'Yes (AES-256)',
    backup_status: 'No Backup (Ephemeral)',
    next_disposal: '2026-10-06T00:00:00Z',
    status: 'Compliant',
    steward: 'Data Engineering',
    archive_tier: 'Ephemeral Scratch'
  },
  {
    id: 'RET-008',
    dataset: 'Ad-hoc Data Pipeline Sandbox Exports',
    retention_period: 'Undefined',
    disposal_method: 'Manual Review',
    encryption_at_rest: 'No (Legacy Disk)',
    backup_status: 'None',
    next_disposal: null,
    status: 'Unmanaged',
    steward: 'Unassigned',
    archive_tier: 'Scratch'
  }
];

export const LEGAL_HOLDS_DEMO = [
  {
    id: 'HLD-2026-001',
    case_reference: 'CASE-2026-CV-08912 (State OCR Special Ed Audit)',
    datasets: 'Special Education Accommodations (IEP), Student Master Demographics',
    placed_on: '2026-05-14T11:00:00Z',
    placed_by: 'Office of General Counsel (Attorney K. Morales)',
    status: 'Active',
    scope: 'District TEN-1001 cohorts 2023-2026',
    custodian_count: 14,
    notes: 'Preserves all historical IEP versions and accommodation records against scheduled purge.'
  },
  {
    id: 'HLD-2026-002',
    case_reference: 'AUD-FED-2026-TITLE-I (Federal Title I Grant Inquiry)',
    datasets: 'Student Master Demographics, State Assessment Scaled Scores',
    placed_on: '2026-07-22T09:30:00Z',
    placed_by: 'State Compliance Director (M. Thorne)',
    status: 'Active',
    scope: 'Title I eligible schools in Metro State region',
    custodian_count: 8,
    notes: 'Lock on poverty index calculations and demographic categorization logs.'
  },
  {
    id: 'HLD-2026-003',
    case_reference: 'DISP-2026-041 (District Billing & Transfer Egress Dispute)',
    datasets: 'Ad-hoc Data Pipeline Sandbox Exports',
    placed_on: '2026-08-30T16:00:00Z',
    placed_by: 'Chief Commercial Officer (S. Vance)',
    status: 'Active',
    scope: 'Tenant TEN-1006 raw transfer metrics',
    custodian_count: 3,
    notes: 'Disputed egress logs preserved until billing arbitration completes.'
  },
  {
    id: 'HLD-2025-014',
    case_reference: 'CASE-2025-CIV-1044 (Settled Student Records Matter)',
    datasets: 'Course Enrollment & Schedules',
    placed_on: '2025-03-10T14:00:00Z',
    placed_by: 'Office of General Counsel (Attorney K. Morales)',
    status: 'Released',
    scope: 'Historical 2024 student roster extracts',
    custodian_count: 5,
    notes: 'Formal litigation hold release order signed 2026-08-15. Normal retention resumed.'
  }
];
