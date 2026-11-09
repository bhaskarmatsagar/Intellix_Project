/**
 * Demo data for Secrets & Credential References
 * References only. Never contains secret values, passwords, keys or tokens.
 * Dates around 5 Oct 2026. Strictly ASCII-only.
 */

export const SECRETS_CREDENTIALS_DEMO = [
  {
    id: 'SEC-REF-1001',
    name: 'State Reporting TLS Certificate',
    system: 'State Reporting Gateway (SVC-STATE)',
    owner: 'Platform Security Operations',
    type: 'Certificate',
    vault_path: 'vault://edx-prod-pki/certs/state-reporting-gw',
    rotation_policy_days: 90,
    last_rotated: '2026-08-10T12:00:00Z',
    next_rotation: '2026-11-08T12:00:00Z',
    status: 'Healthy',
    hsm_slot: 'Slot-4 (FIPS 140-3)'
  },
  {
    id: 'SEC-REF-1002',
    name: 'API Gateway Ingress mTLS CA',
    system: 'Provider API Gateway (SVC-API)',
    owner: 'Platform Security Operations',
    type: 'Certificate',
    vault_path: 'vault://edx-prod-pki/cas/api-ingress-ca',
    rotation_policy_days: 365,
    last_rotated: '2025-10-15T00:00:00Z',
    next_rotation: '2026-10-15T00:00:00Z',
    status: 'Rotation Due',
    hsm_slot: 'Slot-1 (Root PKI)'
  },
  {
    id: 'SEC-REF-1003',
    name: 'Canvas LMS OneRoster OAuth Client Reference',
    system: 'LMS Integration Connector',
    owner: 'Exchange Foundation Team',
    type: 'OAuth client',
    vault_path: 'vault://edx-connectors/oauth/canvas-prod-client-ref',
    rotation_policy_days: 180,
    last_rotated: '2026-07-01T08:00:00Z',
    next_rotation: '2026-12-28T08:00:00Z',
    status: 'Healthy',
    hsm_slot: 'Cloud KMS KeyRing-Connectors'
  },
  {
    id: 'SEC-REF-1004',
    name: 'PowerSchool SIS Webhook Signing Reference',
    system: 'SIS Ingestion Pipeline',
    owner: 'Data Pipeline Engineering',
    type: 'API key',
    vault_path: 'vault://edx-connectors/apikeys/powerschool-webhook-ref',
    rotation_policy_days: 90,
    last_rotated: '2026-06-20T14:30:00Z',
    next_rotation: '2026-09-18T14:30:00Z',
    status: 'Expired',
    hsm_slot: 'Cloud KMS KeyRing-Pipelines'
  },
  {
    id: 'SEC-REF-1005',
    name: 'PostgreSQL Read Replica Credential Reference',
    system: 'Query Workbench (SVC-QUERY)',
    owner: 'Database Reliability Team',
    type: 'DB credential',
    vault_path: 'vault://edx-data-stores/db/pg-workbench-readonly-ref',
    rotation_policy_days: 60,
    last_rotated: '2026-09-01T02:00:00Z',
    next_rotation: '2026-10-31T02:00:00Z',
    status: 'Healthy',
    hsm_slot: 'Vault Dynamic Secrets Engine'
  },
  {
    id: 'SEC-REF-1006',
    name: 'Deprecated SFTP Batch Ingestion Credential',
    system: 'Legacy Batch Ingestion',
    owner: 'Integration Services',
    type: 'DB credential',
    vault_path: 'vault://edx-legacy/sftp/batch-deprecate-ref',
    rotation_policy_days: 30,
    last_rotated: '2026-04-12T09:00:00Z',
    next_rotation: '2026-05-12T09:00:00Z',
    status: 'Revoked',
    hsm_slot: 'Decommissioned HSM Partition'
  },
  {
    id: 'SEC-REF-1007',
    name: 'Identity Provider SAML Signing Certificate',
    system: 'Identity & Access Services (SVC-IDENTITY)',
    owner: 'Identity Engineering',
    type: 'Certificate',
    vault_path: 'vault://edx-identity/saml/idp-signing-cert-ref',
    rotation_policy_days: 365,
    last_rotated: '2026-01-10T10:00:00Z',
    next_rotation: '2027-01-10T10:00:00Z',
    status: 'Healthy',
    hsm_slot: 'Slot-2 (Identity HSM)'
  },
  {
    id: 'SEC-REF-1008',
    name: 'National Student Clearinghouse OAuth Reference',
    system: 'Clearinghouse Verification Gateway',
    owner: 'Exchange Foundation Team',
    type: 'OAuth client',
    vault_path: 'vault://edx-connectors/oauth/nsc-verifier-ref',
    rotation_policy_days: 90,
    last_rotated: '2026-07-25T15:00:00Z',
    next_rotation: '2026-10-23T15:00:00Z',
    status: 'Rotation Due',
    hsm_slot: 'Cloud KMS KeyRing-Connectors'
  }
];
