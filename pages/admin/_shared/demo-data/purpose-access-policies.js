/**
 * Demo data for Purpose & Access Policies
 * Dates around 5 Oct 2026. Strictly ASCII-only.
 */

export const PURPOSE_ACCESS_POLICIES_DEMO = [
  {
    id: 'POL-PURP-001',
    name: 'State Mandatory Accountability Reporting Policy',
    purpose: 'Reporting',
    data_classes_covered: 'Enrollment, Assessment, Demographics',
    allowed_roles: 'Platform Admin, Steward, State Auditor',
    legal_basis: 'State Statutory Mandate (Ed Code 402.1)',
    version: '3.1',
    status: 'Active',
    effective: '2026-01-01T00:00:00Z',
    review_due: '2026-12-31T00:00:00Z',
    permitted_exports: 'Aggregated state extracts, certified cohorts',
    description: 'Permits authorized extraction of validated student counts and assessment results for official federal/state reporting.'
  },
  {
    id: 'POL-PURP-002',
    name: 'Academic Educational Research & Evaluation Policy',
    purpose: 'Research',
    data_classes_covered: 'De-identified Assessment, Program Attendance',
    allowed_roles: 'Consumer (Verified Researcher), Auditor',
    legal_basis: 'FERPA Studies Exception (34 CFR 99.31(a)(6))',
    version: '2.0',
    status: 'Active',
    effective: '2026-03-15T00:00:00Z',
    review_due: '2026-10-25T00:00:00Z',
    permitted_exports: 'k-anonymized tabular exports only (k >= 10)',
    description: 'Requires strict k-anonymity, suppression of cell counts under 10, and signed IRB data protection addenda.'
  },
  {
    id: 'POL-PURP-003',
    name: 'Real-Time Operational Instruction & LMS Sync',
    purpose: 'Operations',
    data_classes_covered: 'Rosters, Class Sections, Course Offerings',
    allowed_roles: 'Engineer, Platform Admin, Tenant Admin',
    legal_basis: 'FERPA School Official Exception (34 CFR 99.31(a)(1))',
    version: '4.0',
    status: 'Active',
    effective: '2026-07-01T00:00:00Z',
    review_due: '2027-07-01T00:00:00Z',
    permitted_exports: 'Automated OneRoster REST API endpoints',
    description: 'Governs direct SIS-to-LMS roster synchronization strictly for day-to-day classroom instructional execution.'
  },
  {
    id: 'POL-PURP-004',
    name: 'Technical Support & Troubleshooting Data Inspection',
    purpose: 'Support',
    data_classes_covered: 'Pipeline Logs, Error Quarantines, Masked Samples',
    allowed_roles: 'Engineer, Platform Admin',
    legal_basis: 'Operational Maintenance Contract Clause 8.2',
    version: '1.4',
    status: 'Under review',
    effective: '2025-10-01T00:00:00Z',
    review_due: '2026-10-15T00:00:00Z',
    permitted_exports: 'Masked error stack traces, no unmasked PII',
    description: 'Restricts tier-3 technical support engineers to inspect quarantined records solely within sandboxed debugging views.'
  },
  {
    id: 'POL-PURP-005',
    name: 'Early Warning Dropout Prevention Indicator Model',
    purpose: 'Research',
    data_classes_covered: 'Attendance, Behavior, Course Grades (ABC)',
    allowed_roles: 'Consumer, Steward',
    legal_basis: 'Institutional Educational Interest',
    version: '1.0-rc2',
    status: 'Draft',
    effective: '2026-11-01T00:00:00Z',
    review_due: '2026-10-20T00:00:00Z',
    permitted_exports: 'Predictive risk scores within tenant boundary',
    description: 'Defines acceptable training and evaluation parameters for district early-warning attendance models.'
  },
  {
    id: 'POL-PURP-006',
    name: 'Financial Aid & Title IV Verification Exchange',
    purpose: 'Operations',
    data_classes_covered: 'Enrollment Status, Financial Need Tiers',
    allowed_roles: 'Consumer (Aid Officer), Auditor',
    legal_basis: 'Higher Education Act Title IV Regulations',
    version: '2.2',
    status: 'Active',
    effective: '2026-05-01T00:00:00Z',
    review_due: '2027-05-01T00:00:00Z',
    permitted_exports: 'Encrypted Clearinghouse API payloads',
    description: 'Authorizes secure transmission of enrollment verification tokens to federal aid processors.'
  },
  {
    id: 'POL-PURP-007',
    name: 'Legacy Unrestricted SQL Export Policy (Sunset)',
    purpose: 'Operations',
    data_classes_covered: 'All Data Classes',
    allowed_roles: 'None (Disabled)',
    legal_basis: 'Superseded by Granular RBAC',
    version: '0.9',
    status: 'Retired',
    effective: '2024-01-01T00:00:00Z',
    review_due: '2025-01-01T00:00:00Z',
    permitted_exports: 'None',
    description: 'Deprecated legacy export mechanism. Retained for historical compliance audit records only.'
  },
  {
    id: 'POL-PURP-008',
    name: 'District Program Evaluation & Title I Impact Analysis',
    purpose: 'Reporting',
    data_classes_covered: 'Federal Program Eligibility, Scaled Growth',
    allowed_roles: 'Steward, Platform Admin',
    legal_basis: 'Elementary & Secondary Education Act (ESEA)',
    version: '2.1',
    status: 'Active',
    effective: '2026-08-15T00:00:00Z',
    review_due: '2026-11-15T00:00:00Z',
    permitted_exports: 'Annual district Title I evaluation report',
    description: 'Controls district-level disaggregated reporting requirements for federally funded student support programs.'
  }
];
