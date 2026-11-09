/**
 * Secrets & Credential References
 * Strictly ASCII-only UTF-8. References only.
 */
import { renderPage, pill, variantFor, fmtDate, esc } from '../_shared/page-kit.js';
import { SECRETS_CREDENTIALS_DEMO } from '../_shared/demo-data/secrets-credentials.js';

renderPage({
  slug: 'secrets-credentials',
  title: 'Secrets \u0026 Credential References',
  subtitle: 'Vault paths, certificate and key rotation policies, expiration tracking, and cryptographic reference governance.',
  context: 'Platform Admin \u00b7 Platform Access \u0026 Security',
  roleBoundary: 'Platform Admin governs credential metadata, vault paths, and rotation policies. Raw secret values and private keys are never exposed in this console and remain protected within KMS/Vault.',
  source: { endpoint: null, demo: SECRETS_CREDENTIALS_DEMO },
  rowId: 'id',
  defaultSort: { key: 'next_rotation', dir: 'asc' },
  searchFields: ['id', 'name', 'system', 'owner', 'vault_path', 'type'],

  kpis: rows => {
    const tracked = rows.length;
    const due = rows.filter(r => r.status === 'Rotation Due').length;
    const expired = rows.filter(r => r.status === 'Expired').length;
    const revoked = rows.filter(r => r.status === 'Revoked').length;

    return [
      { label: 'Tracked References', value: tracked, note: 'Registered vault references' },
      { label: 'Rotation Due (30d)', value: due, note: 'Rotation window active', badge: { text: due > 0 ? 'Upcoming' : 'None', variant: due > 0 ? 'warn' : 'good' } },
      { label: 'Expired', value: expired, note: 'Passed rotation window', badge: { text: expired > 0 ? 'Action required' : 'Zero', variant: expired > 0 ? 'bad' : 'good' } },
      { label: 'Revoked', value: revoked, note: 'Decommissioned / archived', badge: { text: revoked > 0 ? 'Revoked' : 'Zero', variant: 'neutral' } },
    ];
  },

  filters: [
    { key: 'status', label: 'Status', type: 'chips' },
    { key: 'type', label: 'Type', type: 'select' },
  ],

  columns: [
    { key: 'id', label: 'Ref ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'system', label: 'System / Connector', sortable: true },
    { key: 'owner', label: 'Owner', sortable: true },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: r => pill(r.type, 'neutral')
    },
    {
      key: 'vault_path',
      label: 'Vault Path (Reference)',
      sortable: true,
      render: r => `<code class="text-body-secondary small">${esc(r.vault_path)}</code>`
    },
    {
      key: 'rotation_policy_days',
      label: 'Policy',
      sortable: true,
      className: 'text-end',
      render: r => `${esc(r.rotation_policy_days)} d`
    },
    {
      key: 'last_rotated',
      label: 'Last Rotated',
      sortable: true,
      render: r => fmtDate(r.last_rotated)
    },
    {
      key: 'next_rotation',
      label: 'Next Rotation',
      sortable: true,
      render: r => fmtDate(r.next_rotation)
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: r => pill(r.status, r.status === 'Healthy' ? 'good' : r.status === 'Rotation Due' ? 'warn' : r.status === 'Expired' ? 'bad' : 'neutral')
    },
  ],

  drawerTitle: r => `Credential Reference: ${r.name}`,
  drawer: r => `
    <div class="drawer-section">
      <h3>Reference Metadata</h3>
      <div class="alert alert-info py-2 small mb-3">
        <i class="bi bi-shield-lock me-1"></i> Security note: Raw secret payloads and private keys are withheld by design. Only architectural reference identifiers are surfaced.
      </div>
      <div class="drawer-row"><strong>Reference ID</strong><span>${esc(r.id)}</span></div>
      <div class="drawer-row"><strong>Credential Name</strong><span>${esc(r.name)}</span></div>
      <div class="drawer-row"><strong>Associated System</strong><span>${esc(r.system)}</span></div>
      <div class="drawer-row"><strong>Authoritative Owner</strong><span>${esc(r.owner)}</span></div>
      <div class="drawer-row"><strong>Credential Type</strong><span>${pill(r.type, 'neutral')}</span></div>
      <div class="drawer-row"><strong>Vault Location</strong><span><code>${esc(r.vault_path)}</code></span></div>
      <div class="drawer-row"><strong>HSM Partition / Slot</strong><span>${esc(r.hsm_slot)}</span></div>
      <div class="drawer-row"><strong>Status</strong><span>${pill(r.status, variantFor(r.status))}</span></div>
    </div>

    <div class="drawer-section">
      <h3>Rotation Cadence &amp; SLA</h3>
      <div class="drawer-row"><strong>Policy Interval</strong><span>${esc(r.rotation_policy_days)} days</span></div>
      <div class="drawer-row"><strong>Last Successful Rotation</strong><span>${fmtDate(r.last_rotated)}</span></div>
      <div class="drawer-row"><strong>Next Required Rotation</strong><span>${fmtDate(r.next_rotation)}</span></div>
      <div class="drawer-row"><strong>Automated Rotation</strong><span>Enabled (HashiCorp Vault Agent / Cloud KMS)</span></div>
    </div>
  `
});
