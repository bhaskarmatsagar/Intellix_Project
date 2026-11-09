/**
 * Billing & Usage
 * Strictly ASCII-only UTF-8
 */
import { renderPage, pill, miniBar, variantFor, hbarChart, esc } from '../_shared/page-kit.js';
import { BILLING_USAGE_DEMO } from '../_shared/demo-data/billing-usage.js';

renderPage({
  slug: 'billing-usage',
  title: 'Billing \u0026 Usage',
  subtitle: 'Platform consumption tracking, contractual commitments, invoice status, and billing dispute governance.',
  context: 'Platform Admin \u00b7 Tenant \u0026 Commercial',
  roleBoundary: 'Platform Admin monitors platform aggregate usage, tenant commitments, and billing dispute records. Commercial invoice settlement and pricing tiers remain with Finance and Account Management.',
  source: { endpoint: null, demo: BILLING_USAGE_DEMO },
  rowId: 'id',
  defaultSort: { key: 'invoice_amount', dir: 'desc' },
  searchFields: ['tenant', 'plan', 'id', 'invoice_status'],

  kpis: rows => {
    const totalBilled = rows.reduce((sum, r) => sum + parseFloat(r.invoice_amount.replace(/[^0-9.]/g, '') || 0), 0);
    const overdue = rows.filter(r => r.invoice_status === 'Overdue').length;
    const overCommitment = rows.filter(r => r.commitment_pct > 100).length;
    const disputes = rows.filter(r => r.invoice_status === 'Disputed').length;

    return [
      { label: 'Month-to-Date Billed', value: '$' + totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), note: 'Aggregate platform billable' },
      { label: 'Overdue Invoices', value: overdue, note: 'Past payment term', badge: { text: overdue > 0 ? 'Action needed' : 'None', variant: overdue > 0 ? 'bad' : 'good' } },
      { label: 'Tenants Over Commitment', value: overCommitment, note: 'Exceeding provisioned tier', badge: { text: overCommitment > 0 ? 'Over cap' : 'Nominal', variant: overCommitment > 0 ? 'warn' : 'good' } },
      { label: 'Open Disputes', value: disputes, note: 'Egress / usage review', badge: { text: disputes > 0 ? 'Investigation' : 'Zero', variant: disputes > 0 ? 'warn' : 'good' } },
    ];
  },

  filters: [
    { key: 'invoice_status', label: 'Status', type: 'chips' },
    { key: 'plan', label: 'Plan', type: 'select' },
  ],

  chart: rows => {
    const chartData = rows.map(r => ({
      label: r.tenant.length > 20 ? r.tenant.slice(0, 18) + '\u2026' : r.tenant,
      value: r.commitment_pct,
      variant: r.commitment_pct > 100 ? 'bad' : r.commitment_pct > 80 ? 'warn' : 'good'
    }));
    return hbarChart(chartData, 'Usage vs Commitment % (100% Commitment Threshold)', 100);
  },

  columns: [
    { key: 'tenant', label: 'Tenant', sortable: true },
    { key: 'plan', label: 'Plan', sortable: true },
    { key: 'billing_period', label: 'Billing Period', sortable: true },
    { key: 'api_calls', label: 'API Calls', sortable: true, className: 'text-end' },
    { key: 'storage_gb', label: 'Storage (GB)', sortable: true, className: 'text-end', render: r => esc(r.storage_gb.toLocaleString()) },
    { key: 'transfer_gb', label: 'Data Transfer (GB)', sortable: true, className: 'text-end', render: r => esc(r.transfer_gb.toLocaleString()) },
    {
      key: 'commitment_pct',
      label: 'Usage vs Commitment',
      sortable: true,
      render: r => miniBar(r.commitment_pct)
    },
    { key: 'invoice_amount', label: 'Invoice Amount', sortable: true, className: 'text-end' },
    {
      key: 'invoice_status',
      label: 'Invoice Status',
      sortable: true,
      render: r => pill(r.invoice_status, variantFor(r.invoice_status))
    },
  ],

  drawerTitle: r => `Invoice: ${r.id} \u2014 ${r.tenant}`,
  drawer: r => `
    <div class="drawer-section">
      <h3>Billing Summary</h3>
      <div class="drawer-row"><strong>Invoice ID</strong><span>${esc(r.id)}</span></div>
      <div class="drawer-row"><strong>Tenant Name</strong><span>${esc(r.tenant)} (${esc(r.tenant_id)})</span></div>
      <div class="drawer-row"><strong>Commercial Plan</strong><span>${esc(r.plan)}</span></div>
      <div class="drawer-row"><strong>Billing Cycle</strong><span>${esc(r.billing_period)}</span></div>
      <div class="drawer-row"><strong>Due Date</strong><span>${esc(r.due_date)}</span></div>
      <div class="drawer-row"><strong>Invoice Status</strong><span>${pill(r.invoice_status, variantFor(r.invoice_status))}</span></div>
      <div class="drawer-row"><strong>Settlement Amount</strong><span class="fw-bold">${esc(r.invoice_amount)}</span></div>
      <div class="drawer-row"><strong>Payment Method</strong><span>${esc(r.payment_method)}</span></div>
      <div class="drawer-row"><strong>Billing Contact</strong><span>${esc(r.contact_email)}</span></div>
    </div>

    <div class="drawer-section">
      <h3>Usage Breakdown vs Contractual Commitment</h3>
      <div class="drawer-row"><strong>API Calls</strong><span>${esc(r.api_calls)} calls</span></div>
      <div class="drawer-row"><strong>Storage Allocated</strong><span>${esc(r.storage_gb.toLocaleString())} GB</span></div>
      <div class="drawer-row"><strong>Egress Transfer</strong><span>${esc(r.transfer_gb.toLocaleString())} GB</span></div>
      <div class="drawer-row"><strong>Commitment Position</strong><span>${miniBar(r.commitment_pct)} (${r.commitment_pct.toFixed(1)}% of contracted cap)</span></div>
      ${r.dispute_reason ? `<div class="drawer-row"><strong>Dispute Notice</strong><span class="text-danger fw-semibold">${esc(r.dispute_reason)}</span></div>` : ''}
    </div>
  `
});
