/**
 * Demo data for Masking & Row-Level Security
 * Dates around 5 Oct 2026. Strictly ASCII-only.
 */

export const MASKING_RLS_DEMO = [
  {
    id: 'SEC-RLS-001',
    dataset: 'Student Master Demographics',
    predicate: 'student_ssn',
    technique: 'Redact',
    applies_to_roles: 'Consumer, Engineer, Auditor',
    status: 'Enforced',
    last_validated: '2026-10-02T14:00:00Z',
    violations_30d: 0,
    rule_type: 'Dynamic Data Masking',
    expression: "REDACT() -> '***-**-****'",
    enforcement_engine: 'Trino Policy Gateway / SQL Parser'
  },
  {
    id: 'SEC-RLS-002',
    dataset: 'Student Master Demographics',
    predicate: 'tenant_id = current_tenant()',
    technique: 'Row filter by tenant',
    applies_to_roles: 'All Non-Global Roles',
    status: 'Enforced',
    last_validated: '2026-10-04T09:30:00Z',
    violations_30d: 0,
    rule_type: 'Row-Level Isolation',
    expression: 'WHERE tenant_id = @SESSION.tenant_id',
    enforcement_engine: 'PostgreSQL / BigQuery RLS Engine'
  },
  {
    id: 'SEC-RLS-003',
    dataset: 'State Assessment Scaled Scores',
    predicate: 'national_id_hash',
    technique: 'Hash',
    applies_to_roles: 'Consumer (Researcher)',
    status: 'Enforced',
    last_validated: '2026-09-28T16:15:00Z',
    violations_30d: 0,
    rule_type: 'Cryptographic Pseudonymization',
    expression: 'SHA256(student_id + salt)',
    enforcement_engine: 'ETL Transformer Node'
  },
  {
    id: 'SEC-RLS-004',
    dataset: 'Student Master Demographics',
    predicate: 'birth_date',
    technique: 'Partial mask',
    applies_to_roles: 'Consumer (Analytics)',
    status: 'Enforced',
    last_validated: '2026-09-25T11:00:00Z',
    violations_30d: 0,
    rule_type: 'Date Truncation Mask',
    expression: "DATE_TRUNC('year', birth_date) -> YYYY-01-01",
    enforcement_engine: 'Dynamic View Rewrite'
  },
  {
    id: 'SEC-RLS-005',
    dataset: 'Special Education Accommodations (IEP)',
    predicate: 'iep_classification_code',
    technique: 'Redact',
    applies_to_roles: 'Consumer (General Reporting)',
    status: 'Audit-only',
    last_validated: '2026-09-30T10:00:00Z',
    violations_30d: 2,
    rule_type: 'Attribute Redaction',
    expression: "IF allowed THEN iep_code ELSE 'REDACTED'",
    enforcement_engine: 'Policy Interceptor (Shadow Mode)'
  },
  {
    id: 'SEC-RLS-006',
    dataset: 'District Public Directory Information',
    predicate: 'guardian_phone_number',
    technique: 'Partial mask',
    applies_to_roles: 'Consumer, Public API',
    status: 'Enforced',
    last_validated: '2026-09-18T13:45:00Z',
    violations_30d: 0,
    rule_type: 'String Slicing Mask',
    expression: "CONCAT('***-***-', RIGHT(phone, 4))",
    enforcement_engine: 'API Gateway Response Filter'
  },
  {
    id: 'SEC-RLS-007',
    dataset: 'Course Enrollment & Schedules',
    predicate: 'school_district_code = session_district()',
    technique: 'Row filter by tenant',
    applies_to_roles: 'Consumer, Steward',
    status: 'Pending',
    last_validated: '2026-10-01T08:20:00Z',
    violations_30d: 0,
    rule_type: 'District Tenant Boundary',
    expression: 'WHERE district_id IN (@SESSION.authorized_districts)',
    enforcement_engine: 'PostgreSQL Row Filter Policy'
  },
  {
    id: 'SEC-RLS-008',
    dataset: 'Educator Professional Staff Credentials',
    predicate: 'ssn_last_four',
    technique: 'Hash',
    applies_to_roles: 'Consumer, Engineer',
    status: 'Disabled',
    last_validated: '2026-06-10T12:00:00Z',
    violations_30d: 0,
    rule_type: 'Deprecated Masking Rule',
    expression: 'MD5(ssn) [Superseded by SEC-RLS-001]',
    enforcement_engine: 'Legacy View Filter'
  }
];
