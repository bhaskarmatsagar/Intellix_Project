/**
 * Demo data for Classification & Tagging
 * Dates around 5 Oct 2026. Strictly ASCII-only.
 */

export const CLASSIFICATION_TAGGING_DEMO = [
  {
    id: 'DS-001',
    dataset: 'Student Master Demographics',
    domain: 'Student Information',
    classification: 'Restricted',
    tags: ['FERPA', 'PII', 'Direct Identifier', 'Directory Excluded'],
    tag_coverage: 100.0,
    steward: 'Dr. Sarah Jenkins (Data Steward)',
    last_review: '2026-09-15T10:00:00Z',
    status: 'Classified',
    record_count: '240,000 records',
    retention_period: 'Permanent / 7y Post-Graduation'
  },
  {
    id: 'DS-002',
    dataset: 'Course Enrollment & Schedules',
    domain: 'Curriculum & Instruction',
    classification: 'Confidential',
    tags: ['FERPA', 'Indirect Identifier', 'Operational'],
    tag_coverage: 92.5,
    steward: 'Marcus Vance (Data Steward)',
    last_review: '2026-08-20T14:30:00Z',
    status: 'Classified',
    record_count: '1,850,000 records',
    retention_period: '5 Years'
  },
  {
    id: 'DS-003',
    dataset: 'State Assessment Scaled Scores',
    domain: 'Accountability & Assessment',
    classification: 'Restricted',
    tags: ['FERPA', 'PII', 'Assessment Data', 'Confidential Reporting'],
    tag_coverage: 100.0,
    steward: 'Elena Rostova (State Steward)',
    last_review: '2026-09-28T11:00:00Z',
    status: 'Classified',
    record_count: '890,000 records',
    retention_period: '10 Years'
  },
  {
    id: 'DS-004',
    dataset: 'Special Education Accommodations (IEP)',
    domain: 'Special Programs',
    classification: 'Restricted',
    tags: ['FERPA', 'PII', 'IDEA Sensitive', 'Disability Record'],
    tag_coverage: 98.0,
    steward: 'Dr. Gregory Houseman',
    last_review: '2026-07-10T09:00:00Z',
    status: 'Review due',
    record_count: '34,000 records',
    retention_period: '7 Years Post Age-of-Majority'
  },
  {
    id: 'DS-005',
    dataset: 'District Public Directory Information',
    domain: 'Student Information',
    classification: 'Public',
    tags: ['Directory Information', 'FERPA Public Scope'],
    tag_coverage: 100.0,
    steward: 'Dr. Sarah Jenkins (Data Steward)',
    last_review: '2026-09-01T15:00:00Z',
    status: 'Classified',
    record_count: '120,000 records',
    retention_period: 'Annual Replacement'
  },
  {
    id: 'DS-006',
    dataset: 'Educator Professional Staff Credentials',
    domain: 'Human Resources & Staff',
    classification: 'Internal',
    tags: ['State License', 'Staff Directory', 'Internal Only'],
    tag_coverage: 88.0,
    steward: 'Patricia Chen (Data Steward)',
    last_review: '2026-08-14T16:00:00Z',
    status: 'Classified',
    record_count: '18,500 records',
    retention_period: '7 Years Post-Employment'
  },
  {
    id: 'DS-007',
    dataset: 'Raw Ed-Fi Staging Ingestion Feed',
    domain: 'Ingestion Staging',
    classification: 'Restricted',
    tags: ['Uncurated', 'Ingestion Transient'],
    tag_coverage: 40.0,
    steward: 'Unassigned',
    last_review: null,
    status: 'Unclassified',
    record_count: '450,000 records',
    retention_period: '30 Days Transient'
  },
  {
    id: 'DS-008',
    dataset: 'School Facility Energy & Environmental Telemetry',
    domain: 'Operations & Facilities',
    classification: 'Internal',
    tags: ['Operational Metrics', 'Non-Student Data'],
    tag_coverage: 75.0,
    steward: 'Robert Garcia (Data Steward)',
    last_review: '2026-05-18T10:00:00Z',
    status: 'Review due',
    record_count: '5,200,000 records',
    retention_period: '3 Years'
  }
];
