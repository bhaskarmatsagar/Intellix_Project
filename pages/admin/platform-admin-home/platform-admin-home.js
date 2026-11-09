/**
 * Platform Admin Home
 * Strictly ASCII-only UTF-8
 */
import {
  initTheme, initPartials, getCurrentTheme, themeToggle,
  pill, miniBar, esc, CONFIG
} from '../_shared/page-kit.js';

async function init() {
  initTheme();
  await initPartials();

  const main = document.getElementById('app-main');
  if (!main) return;

  // Header
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <div class="page-title-block">
      <div class="context">Platform Admin \u00b7 Control Plane Hub</div>
      <h1>Platform Admin Home</h1>
      <p class="subtitle">Unified control-plane overview for tenant lifecycle, platform security, data protection policies, operations, and compliance assurance.</p>
    </div>
    <div class="page-header-actions" id="page-header-actions"></div>
  `;

  const actions = header.querySelector('#page-header-actions');
  const badgeWrap = document.createElement('span');
  actions.appendChild(badgeWrap);

  const toggle = themeToggle(getCurrentTheme(), t => {
    window.setTheme(t);
  });
  actions.appendChild(toggle);

  // Role Boundary
  const roleBoundary = document.createElement('div');
  roleBoundary.className = 'role-boundary';
  roleBoundary.innerHTML = '<strong>Role boundary:</strong> Platform Admin owns provider-level tenant lifecycle, platform administrative access, connector catalog, platform security/policy controls, operations, assurance evidence and commercial controls. Tenant-local identity and administration, dataset governance, promotion decisions and data consumption remain with their authoritative roles.';

  // Live Reliability Snapshot Section
  const snapshotContainer = document.createElement('div');
  snapshotContainer.className = 'reliability-snapshot-card shadow-sm';

  let isLive = false;
  let slos = [];
  let followups = [];

  try {
    const base = (CONFIG.apiBase || 'http://127.0.0.1:8000').replace(/\/+$/, '');
    const [resSlos, resFu] = await Promise.all([
      fetch(`${base}/api/slos`, { cache: 'no-store' }),
      fetch(`${base}/api/followups`, { cache: 'no-store' })
    ]);

    if (resSlos.ok && resFu.ok) {
      slos = await resSlos.json();
      followups = await resFu.json();
      isLive = true;
    } else {
      throw new Error('API non-200');
    }
  } catch (e) {
    console.warn('[home] Backend fetch failed:', e);
    isLive = false;
  }

  // Update badge
  if (isLive) {
    badgeWrap.innerHTML = '<span class="connection-badge live"><span class="dot"></span>Live data</span>';
  } else {
    badgeWrap.innerHTML = '<span class="connection-badge degraded"><span class="dot"></span>Demo data \u2014 backend not connected</span>';
  }

  // Build Reliability Snapshot
  if (isLive) {
    const onTarget = slos.filter(s => s.status === 'On Target').length;
    const atRisk = slos.filter(s => s.status === 'At Risk').length;
    const breached = slos.filter(s => s.status === 'Breached').length;
    const openFu = followups.filter(f => f.status !== 'Closed \u2014 Independently Verified').length;
    const awaitingReview = followups.filter(f => f.status === 'Evidence Returned \u2014 Review Required').length;
    const attentionList = slos.filter(s => s.status === 'Breached' || s.status === 'At Risk');

    const attentionItemsHtml = attentionList.length > 0
      ? attentionList.map(s => `
        <div class="d-flex align-items-center justify-content-between p-2 mb-2 rounded border bg-body-tertiary">
          <div>
            <div class="fw-semibold small">${esc(s.name)} (${esc(s.slo_id)})</div>
            <div class="text-body-secondary small">${esc(s.service_name || s.service_id)} \u00b7 Target: ${esc(s.target_display)} \u00b7 Current: ${s.current_pct.toFixed(2)}%</div>
          </div>
          <div class="d-flex align-items-center gap-3">
            <div>${miniBar(parseFloat(s.error_budget_remaining_pct))}</div>
            <div>${pill(s.status, s.status === 'Breached' ? 'bad' : 'warn')}</div>
            <a href="../slo-monitoring/slo-monitoring.html" class="btn btn-outline-primary btn-sm">Inspect</a>
          </div>
        </div>
      `).join('')
      : '<div class="text-body-secondary small">All service level objectives are operating within healthy error budgets.</div>';

    snapshotContainer.innerHTML = `
      <div class="reliability-snapshot-header">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-speedometer2 fs-5 text-primary" aria-hidden="true"></i>
          <h2>Reliability &amp; Platform Operations Snapshot</h2>
          <span class="badge text-bg-success ms-2">LIVE</span>
        </div>
        <a href="../slo-monitoring/slo-monitoring.html" class="btn btn-primary btn-sm">
          Open SLO Monitoring Console <i class="bi bi-arrow-right ms-1" aria-hidden="true"></i>
        </a>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-6 col-md-4 col-lg-2">
          <div class="p-2 border rounded text-center">
            <div class="text-body-secondary small">On Target</div>
            <div class="fs-4 fw-bold text-success">${onTarget}</div>
            <div class="small">${pill('On Target', 'good')}</div>
          </div>
        </div>
        <div class="col-6 col-md-4 col-lg-2">
          <div class="p-2 border rounded text-center">
            <div class="text-body-secondary small">At Risk</div>
            <div class="fs-4 fw-bold text-warning">${atRisk}</div>
            <div class="small">${pill('At Risk', 'warn')}</div>
          </div>
        </div>
        <div class="col-6 col-md-4 col-lg-2">
          <div class="p-2 border rounded text-center">
            <div class="text-body-secondary small">Breached</div>
            <div class="fs-4 fw-bold text-danger">${breached}</div>
            <div class="small">${pill('Breached', 'bad')}</div>
          </div>
        </div>
        <div class="col-6 col-md-4 col-lg-3">
          <div class="p-2 border rounded text-center">
            <div class="text-body-secondary small">Open Follow-ups</div>
            <div class="fs-4 fw-bold">${openFu}</div>
            <div class="small text-body-secondary">Active investigations</div>
          </div>
        </div>
        <div class="col-6 col-md-4 col-lg-3">
          <div class="p-2 border rounded text-center">
            <div class="text-body-secondary small">Awaiting Review</div>
            <div class="fs-4 fw-bold text-primary">${awaitingReview}</div>
            <div class="small text-body-secondary">Evidence returned</div>
          </div>
        </div>
      </div>

      <div class="mt-3">
        <div class="fw-semibold small text-uppercase text-body-secondary mb-2">
          Needs Platform Attention (${attentionList.length})
        </div>
        ${attentionItemsHtml}
      </div>
    `;
  } else {
    snapshotContainer.innerHTML = `
      <div class="reliability-snapshot-header">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-speedometer2 fs-5 text-warning" aria-hidden="true"></i>
          <h2>Reliability &amp; Platform Operations Snapshot</h2>
          <span class="badge text-bg-warning ms-2">OFFLINE</span>
        </div>
        <a href="../slo-monitoring/slo-monitoring.html" class="btn btn-outline-secondary btn-sm">
          Open SLO Monitoring Console
        </a>
      </div>
      <div class="alert alert-warning small mb-0">
        <i class="bi bi-exclamation-triangle-fill me-1"></i> Live backend telemetry service is currently unreachable at <code>http://127.0.0.1:8000</code>. Reliability snapshot will automatically reconnect once the service is running.
      </div>
    `;
  }

  // Section Cards Grid
  const grid = document.createElement('div');
  grid.className = 'home-section-grid';

  const sections = [
    {
      title: 'Tenant & Commercial',
      icon: 'bi-building-gear',
      links: [
        {
          name: 'Tenant Directory & Provisioning',
          href: '../tenant-directory/tenant-directory.html',
          desc: 'Governed tenant lifecycle, provisioning checklist gates, and status.'
        },
        {
          name: 'Billing & Usage',
          href: '../billing-usage/billing-usage.html',
          desc: 'Platform consumption tracking, contractual commitments, and disputes.'
        }
      ]
    },
    {
      title: 'Platform Access & Security',
      icon: 'bi-shield-lock',
      links: [
        {
          name: 'Platform Access & Role Governance',
          href: '../access-role-governance/access-role-governance.html',
          desc: 'Privileged role assignment, standing vs JIT elevation, and MFA.'
        },
        {
          name: 'Secrets & Credential References',
          href: '../secrets-credentials/secrets-credentials.html',
          desc: 'Vault paths, certificate and key rotation policies, and expirations.'
        },
        {
          name: 'Network & Security Controls',
          href: '../network-security/network-security.html',
          desc: 'Perimeter protection, TLS standards, allow-lists, and WAF rules.'
        }
      ]
    },
    {
      title: 'Exchange Foundation',
      icon: 'bi-plug',
      links: [
        {
          name: 'Connector Catalog & Certification',
          href: '../connector-catalog/connector-catalog.html',
          desc: 'Verified interoperability profiles (Ed-Fi, OneRoster, CEDS) and versions.'
        }
      ]
    },
    {
      title: 'Policy & Protection',
      icon: 'bi-shield-check',
      links: [
        {
          name: 'Classification & Tagging',
          href: '../classification-tagging/classification-tagging.html',
          desc: 'Confidentiality tiers, FERPA/PII taxonomies, and tag coverage.'
        },
        {
          name: 'Purpose & Access Policies',
          href: '../purpose-access-policies/purpose-access-policies.html',
          desc: 'Lawful data use limitations, role scopes, and policy recertification.'
        },
        {
          name: 'Masking & Row-Level Security',
          href: '../masking-rls/masking-rls.html',
          desc: 'Dynamic column masking expressions and multi-tenant row isolation.'
        },
        {
          name: 'Data Protection, Retention & Legal Hold',
          href: '../data-protection-retention/data-protection-retention.html',
          desc: 'Retention schedules, cryptographic disposal, and litigation holds.'
        }
      ]
    },
    {
      title: 'Platform Operations',
      icon: 'bi-activity',
      links: [
        {
          name: 'Platform Notifications',
          href: '../platform-notifications/platform-notifications.html',
          desc: 'Operational bulletins, incident broadcasts, and delivery rates.'
        },
        {
          name: 'SLO & Platform Operations',
          href: '../slo-monitoring/slo-monitoring.html',
          desc: 'Live service reliability posture, error budgets, and assurance.'
        }
      ]
    },
    {
      title: 'Governance & Assurance',
      icon: 'bi-journal-check',
      links: [
        {
          name: 'Platform Change Requests',
          href: '../change-requests/change-requests.html',
          desc: 'Change risk governance, rollback plans, and CAB evidence review.'
        },
        {
          name: 'Platform Audit Logs',
          href: '../audit-logs/audit-logs.html',
          desc: 'Immutable audit records of control-plane actions and security events.'
        },
        {
          name: 'Evidence Packages',
          href: '../evidence-packages/evidence-packages.html',
          desc: 'Compiled compliance dossiers, multi-source evidence, and audits.'
        },
        {
          name: 'Cross-Domain Evidence',
          href: '../cross-domain-evidence/cross-domain-evidence.html',
          desc: 'Unified provenance trail linking operational source and verification.'
        }
      ]
    }
  ];

  sections.forEach(sec => {
    const card = document.createElement('div');
    card.className = 'home-card';
    card.innerHTML = `
      <div class="home-card-header">
        <i class="bi ${sec.icon}" aria-hidden="true"></i>
        <h2>${esc(sec.title)}</h2>
      </div>
      <ul class="home-card-links">
        ${sec.links.map(l => `
          <li>
            <a href="${esc(l.href)}">${esc(l.name)}</a>
            <span class="desc">${esc(l.desc)}</span>
          </li>
        `).join('')}
      </ul>
    `;
    grid.appendChild(card);
  });

  // Assemble
  main.innerHTML = '';
  main.appendChild(header);
  main.appendChild(roleBoundary);
  main.appendChild(snapshotContainer);
  main.appendChild(grid);
}

init();
