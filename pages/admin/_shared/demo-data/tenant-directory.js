/**
 * Demo data for Tenant Directory & Provisioning
 * Dates around 5 Oct 2026. Strictly ASCII-only.
 */

export const TENANT_DIRECTORY_DEMO = [
  {
    id: 'TEN-1001',
    name: 'Springfield Public Schools',
    type: 'District',
    region: 'US-East',
    tier: 'Tier 1',
    status: 'Active',
    onboarded: '2026-08-15T09:00:00Z',
    admin_contact: 'admin@springfield-k12.org',
    connectors_count: 4,
    lead_name: 'Dr. Sarah Jenkins',
    student_count: 24500,
    domain: 'springfield-k12.org',
    checklist: [
      { step: 'Organization Profile Verified', status: 'Done', notes: 'Verified via state district registry' },
      { step: 'Identity Federation (SAML 2.0)', status: 'Done', notes: 'Google Workspace IdP connected' },
      { step: 'Data Sharing Agreement (DSA)', status: 'Done', notes: 'Executed DSA-2026-0810' },
      { step: 'Credential & Key Vault Provisioning', status: 'Done', notes: 'Vault path /tenants/ten-1001' },
      { step: 'Connector Certification Gate', status: 'Done', notes: 'PowerSchool and Canvas SIS certified' },
      { step: 'Initial Ingestion Validation Gate', status: 'Done', notes: '100% student enrollment records validated' }
    ]
  },
  {
    id: 'TEN-1002',
    name: 'Metro State University System',
    type: 'University',
    region: 'US-Central',
    tier: 'Tier 0',
    status: 'Active',
    onboarded: '2026-05-10T14:30:00Z',
    admin_contact: 'governance@metro-state.edu',
    connectors_count: 7,
    lead_name: 'Marcus Vance',
    student_count: 58000,
    domain: 'metro-state.edu',
    checklist: [
      { step: 'Organization Profile Verified', status: 'Done', notes: 'Higher Ed charter verified' },
      { step: 'Identity Federation (SAML 2.0)', status: 'Done', notes: 'Azure AD / Entra ID SSO live' },
      { step: 'Data Sharing Agreement (DSA)', status: 'Done', notes: 'Multi-campus agreement executed' },
      { step: 'Credential & Key Vault Provisioning', status: 'Done', notes: 'Vault path /tenants/ten-1002' },
      { step: 'Connector Certification Gate', status: 'Done', notes: 'Banner ERP and Canvas LMS certified' },
      { step: 'Initial Ingestion Validation Gate', status: 'Done', notes: 'Course enrollment feeds active' }
    ]
  },
  {
    id: 'TEN-1003',
    name: 'Department of Elementary & Secondary Education',
    type: 'State agency',
    region: 'US-East',
    tier: 'Tier 0',
    status: 'Active',
    onboarded: '2026-04-01T11:00:00Z',
    admin_contact: 'data-steward@dese.state.gov',
    connectors_count: 12,
    lead_name: 'Elena Rostova',
    student_count: 890000,
    domain: 'dese.state.gov',
    checklist: [
      { step: 'Organization Profile Verified', status: 'Done', notes: 'State education agency authority verified' },
      { step: 'Identity Federation (SAML 2.0)', status: 'Done', notes: 'State IdP gateway connected' },
      { step: 'Data Sharing Agreement (DSA)', status: 'Done', notes: 'Statewide governance charter in place' },
      { step: 'Credential & Key Vault Provisioning', status: 'Done', notes: 'Dedicated HSM backed vault' },
      { step: 'Connector Certification Gate', status: 'Done', notes: 'State reporting gateway certified' },
      { step: 'Initial Ingestion Validation Gate', status: 'Done', notes: 'Fall enrollment snapshot reconciled' }
    ]
  },
  {
    id: 'TEN-1004',
    name: 'Riverdale Unified School District',
    type: 'District',
    region: 'US-West',
    tier: 'Tier 2',
    status: 'Provisioning',
    onboarded: '2026-09-28T16:20:00Z',
    admin_contact: 'it-admin@riverdale-usd.org',
    connectors_count: 2,
    lead_name: 'Arthur Pendelton',
    student_count: 12300,
    domain: 'riverdale-usd.org',
    checklist: [
      { step: 'Organization Profile Verified', status: 'Done', notes: 'District board approval documented' },
      { step: 'Identity Federation (SAML 2.0)', status: 'Done', notes: 'ClassLink SSO configured' },
      { step: 'Data Sharing Agreement (DSA)', status: 'Done', notes: 'DSA-2026-0925 signed' },
      { step: 'Credential & Key Vault Provisioning', status: 'In progress', notes: 'Awaiting webhook secret approval' },
      { step: 'Connector Certification Gate', status: 'In progress', notes: 'Infinite Campus connector under test' },
      { step: 'Initial Ingestion Validation Gate', status: 'Blocked', notes: 'Dependent on credential completion' }
    ]
  },
  {
    id: 'TEN-1005',
    name: 'Lakeland Community College',
    type: 'University',
    region: 'US-Central',
    tier: 'Tier 2',
    status: 'Pending Approval',
    onboarded: '2026-10-02T10:15:00Z',
    admin_contact: 'cio@lakeland.edu',
    connectors_count: 1,
    lead_name: 'Patricia Chen',
    student_count: 8500,
    domain: 'lakeland.edu',
    checklist: [
      { step: 'Organization Profile Verified', status: 'Done', notes: 'Board accreditation submitted' },
      { step: 'Identity Federation (SAML 2.0)', status: 'In progress', notes: 'Metadata XML uploaded, awaiting test' },
      { step: 'Data Sharing Agreement (DSA)', status: 'In progress', notes: 'Legal counsel review pending' },
      { step: 'Credential & Key Vault Provisioning', status: 'Blocked', notes: 'Pending legal agreement execution' },
      { step: 'Connector Certification Gate', status: 'Blocked', notes: 'Not started' },
      { step: 'Initial Ingestion Validation Gate', status: 'Blocked', notes: 'Not started' }
    ]
  },
  {
    id: 'TEN-1006',
    name: 'Highland Park School District',
    type: 'District',
    region: 'US-South',
    tier: 'Tier 1',
    status: 'Active',
    onboarded: '2026-07-20T13:45:00Z',
    admin_contact: 'tech@highlandpark-isd.net',
    connectors_count: 5,
    lead_name: 'Robert Garcia',
    student_count: 18900,
    domain: 'highlandpark-isd.net',
    checklist: [
      { step: 'Organization Profile Verified', status: 'Done', notes: 'County validation completed' },
      { step: 'Identity Federation (SAML 2.0)', status: 'Done', notes: 'Active Directory Federation Services' },
      { step: 'Data Sharing Agreement (DSA)', status: 'Done', notes: 'Executed DSA-2026-0715' },
      { step: 'Credential & Key Vault Provisioning', status: 'Done', notes: 'Vault path /tenants/ten-1006' },
      { step: 'Connector Certification Gate', status: 'Done', notes: 'Skyward SIS connector operational' },
      { step: 'Initial Ingestion Validation Gate', status: 'Done', notes: 'Continuous ingestion live' }
    ]
  },
  {
    id: 'TEN-1007',
    name: 'Oakridge Academy Charter Network',
    type: 'District',
    region: 'US-West',
    tier: 'Tier 2',
    status: 'Suspended',
    onboarded: '2026-06-12T08:00:00Z',
    admin_contact: 'compliance@oakridgecharter.org',
    connectors_count: 0,
    lead_name: 'Dana Sterling',
    student_count: 4200,
    domain: 'oakridgecharter.org',
    checklist: [
      { step: 'Organization Profile Verified', status: 'Done', notes: 'Charter registry verified' },
      { step: 'Identity Federation (SAML 2.0)', status: 'Done', notes: 'Okta workforce tenant' },
      { step: 'Data Sharing Agreement (DSA)', status: 'Blocked', notes: 'Annual renewal lapsed 2026-09-30' },
      { step: 'Credential & Key Vault Provisioning', status: 'Blocked', notes: 'Keys rotated and temporarily revoked' },
      { step: 'Connector Certification Gate', status: 'Blocked', notes: 'Ingestion suspended pending renewal' },
      { step: 'Initial Ingestion Validation Gate', status: 'Blocked', notes: 'Suspended by Platform Admin' }
    ]
  },
  {
    id: 'TEN-1008',
    name: 'State Board of Higher Education',
    type: 'State agency',
    region: 'US-Central',
    tier: 'Tier 0',
    status: 'Active',
    onboarded: '2026-03-15T15:00:00Z',
    admin_contact: 'policy@sbhe.state.gov',
    connectors_count: 9,
    lead_name: 'Dr. Gregory Houseman',
    student_count: 320000,
    domain: 'sbhe.state.gov',
    checklist: [
      { step: 'Organization Profile Verified', status: 'Done', notes: 'State statutory authority verified' },
      { step: 'Identity Federation (SAML 2.0)', status: 'Done', notes: 'State SSO broker connected' },
      { step: 'Data Sharing Agreement (DSA)', status: 'Done', notes: 'Master state data exchange charter' },
      { step: 'Credential & Key Vault Provisioning', status: 'Done', notes: 'Automated HSM rotation active' },
      { step: 'Connector Certification Gate', status: 'Done', notes: 'State IPEDS and Clearinghouse links certified' },
      { step: 'Initial Ingestion Validation Gate', status: 'Done', notes: 'Quarterly state reconciliation verified' }
    ]
  }
];
