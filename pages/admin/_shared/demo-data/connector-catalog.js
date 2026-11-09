/**
 * Demo data for Connector Catalog & Certification
 * Dates around 5 Oct 2026. Strictly ASCII-only.
 */

export const CONNECTOR_CATALOG_DEMO = [
  {
    id: 'CONN-SIS-001',
    name: 'PowerSchool SIS Enterprise Connector',
    type: 'SIS Ingestion',
    version: '4.2.1',
    certification: 'Certified',
    certified_on: '2026-06-15T09:00:00Z',
    expires: '2027-06-15T09:00:00Z',
    owner: 'Exchange Foundation Team',
    tenants_using: 28,
    standard: 'Ed-Fi Data Standard v4.0 / REST API',
    schema_version: '2026.2',
    test_suite_status: '142 / 142 Tests Passed (100%)'
  },
  {
    id: 'CONN-SIS-002',
    name: 'Infinite Campus District Connector',
    type: 'SIS Ingestion',
    version: '3.8.0',
    certification: 'Certified',
    certified_on: '2026-07-20T11:30:00Z',
    expires: '2027-07-20T11:30:00Z',
    owner: 'Exchange Foundation Team',
    tenants_using: 19,
    standard: 'Ed-Fi Data Standard v4.0 / API 6.1',
    schema_version: '2026.1',
    test_suite_status: '128 / 128 Tests Passed (100%)'
  },
  {
    id: 'CONN-LMS-001',
    name: 'Canvas LMS OneRoster Connector',
    type: 'LMS Sync',
    version: '2.5.4',
    certification: 'Certified',
    certified_on: '2026-05-10T14:00:00Z',
    expires: '2026-11-10T14:00:00Z',
    owner: 'Learning Tools Integration Pod',
    tenants_using: 42,
    standard: '1EdTech OneRoster v1.2 (REST + OAuth2)',
    schema_version: '1.2.0',
    test_suite_status: '96 / 96 Tests Passed (100%)'
  },
  {
    id: 'CONN-STATE-001',
    name: 'State Longitudinal Reporting Gateway',
    type: 'State Reporting',
    version: '5.1.0',
    certification: 'Certified',
    certified_on: '2026-08-01T10:00:00Z',
    expires: '2027-08-01T10:00:00Z',
    owner: 'State Accountability Team',
    tenants_using: 15,
    standard: 'CEDS v11.0 / Ed-Fi Core 3.3',
    schema_version: '5.1',
    test_suite_status: '210 / 210 Tests Passed (100%)'
  },
  {
    id: 'CONN-ASSESS-001',
    name: 'NWEA MAP Assessment Connector',
    type: 'Assessment Ingestion',
    version: '1.9.2',
    certification: 'In review',
    certified_on: null,
    expires: null,
    owner: 'Data Pipeline Engineering',
    tenants_using: 8,
    standard: 'QTI / CEDS Assessment Domain',
    schema_version: '1.9',
    test_suite_status: '78 / 85 Tests Passed (Review in progress)'
  },
  {
    id: 'CONN-ERP-001',
    name: 'Ellucian Banner Higher Ed ERP Connector',
    type: 'Higher Ed ERP',
    version: '2.1.0',
    certification: 'Certified',
    certified_on: '2026-01-12T08:00:00Z',
    expires: '2026-10-30T08:00:00Z',
    owner: 'Exchange Foundation Team',
    tenants_using: 12,
    standard: 'Higher Ed Data Model (HEDM) / Ethos API',
    schema_version: '2.1',
    test_suite_status: '112 / 112 Tests Passed (100%)'
  },
  {
    id: 'CONN-FED-001',
    name: 'National Student Clearinghouse Ingress',
    type: 'Postsecondary Ingestion',
    version: '1.4.0',
    certification: 'Expired',
    certified_on: '2025-09-01T00:00:00Z',
    expires: '2026-09-01T00:00:00Z',
    owner: 'External Interop Pod',
    tenants_using: 6,
    standard: 'NSC DegreeVerify Format 2024',
    schema_version: '1.4',
    test_suite_status: 'Re-certification audit required'
  },
  {
    id: 'CONN-SPECIAL-001',
    name: 'Special Education IEP Direct Bridge',
    type: 'Program Specific',
    version: '0.8.0-beta',
    certification: 'Not certified',
    certified_on: null,
    expires: null,
    owner: 'Special Education Working Group',
    tenants_using: 0,
    standard: 'IDEA Part B Reporting Specification',
    schema_version: '0.8-draft',
    test_suite_status: 'Development sandbox stage'
  }
];
