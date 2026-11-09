/**
 * Demo data for Evidence Packages
 * Dates around 5 Oct 2026. Strictly ASCII-only.
 */

export const EVIDENCE_PACKAGES_DEMO = [
  {
    id: 'EVD-PKG-2026-Q3-FERPA',
    title: 'FERPA & Student Privacy Annual Compliance Package',
    framework: 'FERPA / EDGAR',
    period: 'Q3 2026',
    owner: 'Chief Privacy Officer',
    items_count: 18,
    completeness_pct: 100.0,
    status: 'Approved',
    generated_at: '2026-09-30T16:00:00Z',
    reviewer: 'Rachel Adams (Deloitte Auditor)',
    evidence_items: [
      { ref: 'EVD-FERPA-DSA-001', type: 'Signed Data Sharing Agreements', domain: 'Tenant Governance', verified: 'Yes' },
      { ref: 'EVD-FERPA-MASK-002', type: 'Column Masking Test Suite Logs', domain: 'Data Protection', verified: 'Yes' },
      { ref: 'EVD-FERPA-RLS-003', type: 'Tenant Row Isolation Proofs', domain: 'Data Protection', verified: 'Yes' },
      { ref: 'EVD-FERPA-PURP-004', type: 'Purpose Limitation Authorizations', domain: 'Policy & Protection', verified: 'Yes' }
    ]
  },
  {
    id: 'EVD-PKG-2026-SOC2-TYPE2',
    title: 'Annual SOC 2 Type II Platform Reliability & Security Audit',
    framework: 'SOC 2 Type II',
    period: 'Oct 2025 - Sep 2026',
    owner: 'Platform Security Operations',
    items_count: 36,
    completeness_pct: 94.4,
    status: 'Ready for review',
    generated_at: '2026-10-02T11:30:00Z',
    reviewer: 'Audit Review Committee',
    evidence_items: [
      { ref: 'EVD-SOC2-TLS-001', type: 'TLS 1.3 Baseline Configurations', domain: 'Network Security', verified: 'Yes' },
      { ref: 'EVD-SOC2-SLO-002', type: '30-Day SLO Measurement Slips', domain: 'SLO Monitoring', verified: 'Yes' },
      { ref: 'EVD-SOC2-CAB-003', type: 'CAB Emergency Change Retrospectives', domain: 'Change Management', verified: 'Yes' },
      { ref: 'EVD-SOC2-BCDR-004', type: 'Annual Failover Exercise Records', domain: 'Operations', verified: 'No' }
    ]
  },
  {
    id: 'EVD-PKG-2026-Q3-ACCESS',
    title: 'Q3 2026 Privileged Access & Role Recertification Package',
    framework: 'CIS Benchmark / NIST 800-53',
    period: 'Q3 2026',
    owner: 'Platform Access Governance',
    items_count: 14,
    completeness_pct: 100.0,
    status: 'Approved',
    generated_at: '2026-09-28T14:15:00Z',
    reviewer: 'SecOps Assurance Team',
    evidence_items: [
      { ref: 'EVD-ACC-REV-001', type: 'Platform Admin Reauthorization', domain: 'Access Control', verified: 'Yes' },
      { ref: 'EVD-ACC-MFA-002', type: 'MFA Enforcement Audit Extract', domain: 'Access Control', verified: 'Yes' },
      { ref: 'EVD-ACC-JIT-003', type: 'Just-in-Time Elevation Logs', domain: 'Access Control', verified: 'Yes' }
    ]
  },
  {
    id: 'EVD-PKG-2026-STATE-DESE',
    title: 'State Reporting Accountability Certification Package',
    framework: 'CEDS / State Mandate',
    period: 'Fall 2026 Ingestion',
    owner: 'State Accountability Team',
    items_count: 22,
    completeness_pct: 77.2,
    status: 'Draft',
    generated_at: '2026-10-04T09:00:00Z',
    reviewer: 'Elena Rostova (State Steward)',
    evidence_items: [
      { ref: 'EVD-STATE-INGEST-01', type: 'Validation Gate Summary Report', domain: 'Exchange Foundation', verified: 'Yes' },
      { ref: 'EVD-STATE-RECON-02', type: 'District Enrollment Reconciliation', domain: 'Exchange Foundation', verified: 'Yes' },
      { ref: 'EVD-STATE-LEGAL-03', type: 'State Statutory Authority Attestation', domain: 'Governance', verified: 'No' }
    ]
  },
  {
    id: 'EVD-PKG-2026-KMS-ROTATION',
    title: 'Annual Cryptographic Key & Secrets Management Audit',
    framework: 'FIPS 140-3 / NIST SP 800-57',
    period: 'FY 2026',
    owner: 'Cryptographic Security Team',
    items_count: 12,
    completeness_pct: 100.0,
    status: 'Approved',
    generated_at: '2026-09-15T10:00:00Z',
    reviewer: 'External Cryptographic Auditor',
    evidence_items: [
      { ref: 'EVD-KMS-HSM-001', type: 'HSM Partition Slot Audit Manifest', domain: 'Secrets Vault', verified: 'Yes' },
      { ref: 'EVD-KMS-ROT-002', type: 'Automatic Rotation Verification Logs', domain: 'Secrets Vault', verified: 'Yes' }
    ]
  },
  {
    id: 'EVD-PKG-2025-ANNUAL-SLO',
    title: 'FY 2025 Platform Reliability & Availability Assurance Package',
    framework: 'SLA / Contractual Assurance',
    period: 'FY 2025',
    owner: 'Platform Operations',
    items_count: 24,
    completeness_pct: 100.0,
    status: 'Expired',
    generated_at: '2025-10-01T08:00:00Z',
    reviewer: 'VP, Platform Services',
    evidence_items: [
      { ref: 'EVD-SLO-2025-YR', type: 'Full Year Service Availability Summary', domain: 'Reliability', verified: 'Yes' },
      { ref: 'EVD-PIR-2025-ALL', type: 'Major Incident Post-Mortem Register', domain: 'Reliability', verified: 'Yes' }
    ]
  },
  {
    id: 'EVD-PKG-2026-DISASTER-RECOV',
    title: 'Semi-Annual BCDR & Geo-Replication Verification Package',
    framework: 'ISO 22301 / BCDR',
    period: 'H1 2026',
    owner: 'Core Infrastructure Ops',
    items_count: 16,
    completeness_pct: 100.0,
    status: 'Approved',
    generated_at: '2026-06-30T17:00:00Z',
    reviewer: 'Enterprise Risk Management',
    evidence_items: [
      { ref: 'EVD-BCDR-SIM-001', type: 'Secondary Region Live Traffic Cutover', domain: 'Infrastructure', verified: 'Yes' },
      { ref: 'EVD-BCDR-RPO-002', type: 'Database RPO/RTO Reconciliation Report', domain: 'Infrastructure', verified: 'Yes' }
    ]
  },
  {
    id: 'EVD-PKG-2026-RESEARCH-IRB',
    title: 'Multi-Institution Academic Research Ethics & IRB Dossier',
    framework: 'FERPA / Institutional IRB',
    period: 'Fall 2026 Cohort',
    owner: 'Chief Privacy Officer',
    items_count: 9,
    completeness_pct: 88.8,
    status: 'Ready for review',
    generated_at: '2026-10-03T14:45:00Z',
    reviewer: 'University IRB Review Board',
    evidence_items: [
      { ref: 'EVD-IRB-APP-001', type: 'IRB Protocol Approval Notices', domain: 'Policy & Protection', verified: 'Yes' },
      { ref: 'EVD-IRB-ANON-002', type: 'k-Anonymity Differential Privacy Check', domain: 'Data Protection', verified: 'Yes' }
    ]
  }
];
