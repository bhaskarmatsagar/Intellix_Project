/**
 * Data Protection, Retention & Legal Hold
 * Strictly ASCII-only UTF-8
 */
import {
  initTheme, initPartials, getCurrentTheme, themeToggle,
  kpiCard, createTable, pill, chip, chipClear, searchBox,
  openDrawer, toast, esc, fmtDate, variantFor, toCsv, downloadBlob
} from '../_shared/page-kit.js';

import {
  RETENTION_SCHEDULE_DEMO,
  LEGAL_HOLDS_DEMO
} from '../_shared/demo-data/data-protection-retention.js';

async function init() {
  initTheme();
  await initPartials();

  const main = document.getElementById('app-main');
  if (!main) return;

  const retentionRows = [...RETENTION_SCHEDULE_DEMO];
  const holdRows = [...LEGAL_HOLDS_DEMO];

  // Header
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <div class="page-title-block">
      <div class="context">Platform Admin \u00b7 Policy \u0026 Protection</div>
      <h1>Data Protection, Retention \u0026 Legal Hold</h1>
      <p class="subtitle">Enforcement of dataset retention lifecycles, automated cryptographic disposal, encryption at rest, and litigation legal holds.</p>
    </div>
    <div class="page-header-actions" id="page-header-actions">
      <span class="connection-badge degraded"><span class="dot"></span>Demo data \u2014 backend not connected</span>
    </div>
  `;
  const toggle = themeToggle(getCurrentTheme(), t => {
    window.setTheme(t);
  });
  header.querySelector('#page-header-actions').appendChild(toggle);

  // Role Boundary
  const roleBoundary = document.createElement('div');
  roleBoundary.className = 'role-boundary';
  roleBoundary.innerHTML = '<strong>Role boundary:</strong> Platform Admin establishes platform data retention mandates, cryptographic disposal standards, and executes legal holds. Data lifecycle purging execution and backup schedules remain with Data Engineers and Storage Admins.';

  // KPIs
  const kpiGrid = document.createElement('div');
  kpiGrid.className = 'kpi-grid';
  const activeHolds = holdRows.filter(h => h.status === 'Active').length;
  // Disposals due within 30 days relative to 2026-10-05: before 2026-11-04
  const disposalsDue = retentionRows.filter(r => r.next_disposal && new Date(r.next_disposal) <= new Date('2026-11-04T00:00:00Z') && new Date(r.next_disposal) >= new Date('2026-10-05T00:00:00Z')).length;
  const unmanaged = retentionRows.filter(r => r.status === 'Unmanaged').length;
  const encryptedCount = retentionRows.filter(r => r.encryption_at_rest.startsWith('Yes')).length;
  const encryptPct = Math.round((encryptedCount / retentionRows.length) * 100);

  kpiGrid.appendChild(kpiCard('Active Legal Holds', activeHolds, 'Litigation preservation orders', { text: activeHolds > 0 ? 'Protected' : 'Zero', variant: activeHolds > 0 ? 'warn' : 'good' }));
  kpiGrid.appendChild(kpiCard('Disposals Due (30d)', disposalsDue, 'Scheduled cryptographic purge', { text: disposalsDue > 0 ? 'Action window' : 'None', variant: disposalsDue > 0 ? 'warn' : 'good' }));
  kpiGrid.appendChild(kpiCard('Datasets Without Policy', unmanaged, 'Awaiting retention assignment', { text: unmanaged > 0 ? 'Remediate' : 'Zero', variant: unmanaged > 0 ? 'bad' : 'good' }));
  kpiGrid.appendChild(kpiCard('Encryption At Rest %', `${encryptPct}%`, 'AES-256 / KMS encrypted', { text: encryptPct >= 80 ? 'Compliant' : 'Gap', variant: encryptPct >= 80 ? 'good' : 'bad' }));

  // Tab navigation
  let activeTab = 'retention'; // 'retention' | 'holds'
  const tabNav = document.createElement('div');
  tabNav.className = 'page-kit-tabs';
  tabNav.innerHTML = `
    <button class="page-kit-tab active" id="tab-retention" type="button">
      <i class="bi bi-clock-history me-1" aria-hidden="true"></i> Retention Schedule (${retentionRows.length})
    </button>
    <button class="page-kit-tab" id="tab-holds" type="button">
      <i class="bi bi-shield-lock me-1" aria-hidden="true"></i> Legal Holds (${holdRows.length})
    </button>
  `;

  const contentArea = document.createElement('div');

  // Retention state
  let retSearch = '';
  let retStatusFilter = [];
  let retSortKey = 'dataset';
  let retSortDir = 'asc';

  // Holds state
  let hldSearch = '';
  let hldStatusFilter = [];
  let hldSortKey = 'placed_on';
  let hldSortDir = 'desc';

  function renderRetention() {
    contentArea.innerHTML = '';

    const filterBar = document.createElement('div');
    filterBar.className = 'filter-bar';

    // Search
    filterBar.appendChild(searchBox('Search retention schedules\u2026', q => {
      retSearch = q;
      updateTable();
    }, retSearch, 'ret-search'));

    // Status chips
    const statusGroup = document.createElement('div');
    statusGroup.className = 'filter-group';
    const statuses = ['Compliant', 'Disposal due', 'Legal hold locked', 'Unmanaged'];
    statuses.forEach(st => {
      const active = retStatusFilter.includes(st);
      const count = retentionRows.filter(r => r.status === st).length;
      statusGroup.appendChild(chip(st, active, () => {
        const idx = retStatusFilter.indexOf(st);
        if (idx >= 0) retStatusFilter.splice(idx, 1);
        else retStatusFilter.push(st);
        renderRetention();
      }, count));
    });
    filterBar.appendChild(statusGroup);

    if (retSearch || retStatusFilter.length > 0) {
      filterBar.appendChild(chipClear('Clear filters', () => {
        retSearch = '';
        retStatusFilter = [];
        renderRetention();
      }));
    }

    const tableWrap = document.createElement('div');
    tableWrap.className = 'table-wrapper';

    const actionBar = document.createElement('div');
    actionBar.className = 'd-flex align-items-center gap-2 mt-2';
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-outline-secondary btn-sm';
    exportBtn.innerHTML = '<i class="bi bi-download me-1" aria-hidden="true"></i> Export CSV';
    exportBtn.addEventListener('click', () => {
      const csvCols = [
        { label: 'Dataset', key: 'dataset' },
        { label: 'Retention Period', key: 'retention_period' },
        { label: 'Disposal Method', key: 'disposal_method' },
        { label: 'Encryption At Rest', key: 'encryption_at_rest' },
        { label: 'Backup Status', key: 'backup_status' },
        { label: 'Next Disposal', key: 'next_disposal' },
        { label: 'Status', key: 'status' },
      ];
      const csvData = toCsv(getFilteredRetention(), csvCols);
      downloadBlob(csvData, 'retention-schedule.csv');
      toast('CSV downloaded', 'good');
    });
    actionBar.appendChild(exportBtn);

    function getFilteredRetention() {
      return retentionRows.filter(r => {
        if (retSearch) {
          const q = retSearch.toLowerCase();
          const match = [r.dataset, r.disposal_method, r.steward, r.status].some(v => v && String(v).toLowerCase().includes(q));
          if (!match) return false;
        }
        if (retStatusFilter.length > 0 && !retStatusFilter.includes(r.status)) return false;
        return true;
      });
    }

    function updateTable() {
      tableWrap.innerHTML = '';
      const filtered = getFilteredRetention();
      const sorted = [...filtered].sort((a, b) => {
        let va = a[retSortKey] ?? '';
        let vb = b[retSortKey] ?? '';
        let cmp = String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' });
        return retSortDir === 'desc' ? -cmp : cmp;
      });

      const cols = [
        { key: 'dataset', label: 'Dataset', sortable: true },
        { key: 'retention_period', label: 'Retention Period', sortable: true },
        { key: 'disposal_method', label: 'Disposal Method', sortable: true },
        {
          key: 'encryption_at_rest',
          label: 'Encryption At Rest',
          sortable: true,
          render: r => pill(r.encryption_at_rest.startsWith('Yes') ? 'Yes' : 'No', r.encryption_at_rest.startsWith('Yes') ? 'good' : 'bad')
        },
        { key: 'backup_status', label: 'Backup Status', sortable: true },
        {
          key: 'next_disposal',
          label: 'Next Disposal',
          sortable: true,
          render: r => fmtDate(r.next_disposal)
        },
        {
          key: 'status',
          label: 'Status',
          sortable: true,
          render: r => pill(r.status, variantFor(r.status))
        },
      ];

      const table = createTable(cols, sorted, {
        sortKey: retSortKey,
        sortDir: retSortDir,
        onSort: key => {
          if (retSortKey === key) retSortDir = retSortDir === 'asc' ? 'desc' : 'asc';
          else { retSortKey = key; retSortDir = 'asc'; }
          updateTable();
        },
        onRowClick: r => {
          openDrawer(`Retention: ${r.dataset}`, `
            <div class="drawer-section">
              <h3>Retention Schedule Specification</h3>
              <div class="drawer-row"><strong>Dataset</strong><span>${esc(r.dataset)}</span></div>
              <div class="drawer-row"><strong>Retention Cadence</strong><span>${esc(r.retention_period)}</span></div>
              <div class="drawer-row"><strong>Disposal Standard</strong><span>${esc(r.disposal_method)}</span></div>
              <div class="drawer-row"><strong>Encryption At Rest</strong><span>${pill(r.encryption_at_rest, 'good')}</span></div>
              <div class="drawer-row"><strong>Backup &amp; Resilience</strong><span>${esc(r.backup_status)}</span></div>
              <div class="drawer-row"><strong>Archive Storage Tier</strong><span>${esc(r.archive_tier)}</span></div>
              <div class="drawer-row"><strong>Next Disposal Run</strong><span>${fmtDate(r.next_disposal)}</span></div>
              <div class="drawer-row"><strong>Compliance Status</strong><span>${pill(r.status, variantFor(r.status))}</span></div>
              <div class="drawer-row"><strong>Data Steward</strong><span>${esc(r.steward)}</span></div>
            </div>
          `);
        }
      });

      tableWrap.appendChild(table);
    }

    updateTable();
    contentArea.appendChild(filterBar);
    contentArea.appendChild(tableWrap);
    contentArea.appendChild(actionBar);
  }

  function renderHolds() {
    contentArea.innerHTML = '';

    const filterBar = document.createElement('div');
    filterBar.className = 'filter-bar';

    filterBar.appendChild(searchBox('Search legal holds\u2026', q => {
      hldSearch = q;
      updateHoldsTable();
    }, hldSearch, 'hld-search'));

    const statusGroup = document.createElement('div');
    statusGroup.className = 'filter-group';
    ['Active', 'Released'].forEach(st => {
      const active = hldStatusFilter.includes(st);
      const count = holdRows.filter(r => r.status === st).length;
      statusGroup.appendChild(chip(st, active, () => {
        const idx = hldStatusFilter.indexOf(st);
        if (idx >= 0) hldStatusFilter.splice(idx, 1);
        else hldStatusFilter.push(st);
        renderHolds();
      }, count));
    });
    filterBar.appendChild(statusGroup);

    if (hldSearch || hldStatusFilter.length > 0) {
      filterBar.appendChild(chipClear('Clear filters', () => {
        hldSearch = '';
        hldStatusFilter = [];
        renderHolds();
      }));
    }

    const tableWrap = document.createElement('div');
    tableWrap.className = 'table-wrapper';

    const actionBar = document.createElement('div');
    actionBar.className = 'd-flex align-items-center gap-2 mt-2';
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-outline-secondary btn-sm';
    exportBtn.innerHTML = '<i class="bi bi-download me-1" aria-hidden="true"></i> Export CSV';
    exportBtn.addEventListener('click', () => {
      const csvCols = [
        { label: 'Hold ID', key: 'id' },
        { label: 'Case Reference', key: 'case_reference' },
        { label: 'Datasets', key: 'datasets' },
        { label: 'Placed On', key: 'placed_on' },
        { label: 'Placed By', key: 'placed_by' },
        { label: 'Status', key: 'status' },
      ];
      const csvData = toCsv(getFilteredHolds(), csvCols);
      downloadBlob(csvData, 'legal-holds.csv');
      toast('CSV downloaded', 'good');
    });
    actionBar.appendChild(exportBtn);

    function getFilteredHolds() {
      return holdRows.filter(r => {
        if (hldSearch) {
          const q = hldSearch.toLowerCase();
          const match = [r.id, r.case_reference, r.datasets, r.placed_by].some(v => v && String(v).toLowerCase().includes(q));
          if (!match) return false;
        }
        if (hldStatusFilter.length > 0 && !hldStatusFilter.includes(r.status)) return false;
        return true;
      });
    }

    function updateHoldsTable() {
      tableWrap.innerHTML = '';
      const filtered = getFilteredHolds();
      const sorted = [...filtered].sort((a, b) => {
        let va = a[hldSortKey] ?? '';
        let vb = b[hldSortKey] ?? '';
        let cmp = String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' });
        return hldSortDir === 'desc' ? -cmp : cmp;
      });

      const cols = [
        { key: 'id', label: 'Hold ID', sortable: true },
        { key: 'case_reference', label: 'Case Reference', sortable: true },
        { key: 'datasets', label: 'Datasets', sortable: true },
        {
          key: 'placed_on',
          label: 'Placed On',
          sortable: true,
          render: r => fmtDate(r.placed_on)
        },
        { key: 'placed_by', label: 'Placed By', sortable: true },
        {
          key: 'status',
          label: 'Status',
          sortable: true,
          render: r => pill(r.status, r.status === 'Active' ? 'warn' : 'neutral')
        },
      ];

      const table = createTable(cols, sorted, {
        sortKey: hldSortKey,
        sortDir: hldSortDir,
        onSort: key => {
          if (hldSortKey === key) hldSortDir = hldSortDir === 'asc' ? 'desc' : 'asc';
          else { hldSortKey = key; hldSortDir = 'asc'; }
          updateHoldsTable();
        },
        onRowClick: r => {
          openDrawer(`Legal Hold: ${r.id}`, `
            <div class="drawer-section">
              <h3>Legal Hold Order Specification</h3>
              <div class="drawer-row"><strong>Hold Identifier</strong><span>${esc(r.id)}</span></div>
              <div class="drawer-row"><strong>Litigation / Case Matter</strong><span>${esc(r.case_reference)}</span></div>
              <div class="drawer-row"><strong>Target Datasets</strong><span>${esc(r.datasets)}</span></div>
              <div class="drawer-row"><strong>Custodian Scope</strong><span>${esc(r.scope)} (${esc(r.custodian_count)} custodians)</span></div>
              <div class="drawer-row"><strong>Order Placed On</strong><span>${fmtDate(r.placed_on)}</span></div>
              <div class="drawer-row"><strong>Authoritative Counsel</strong><span>${esc(r.placed_by)}</span></div>
              <div class="drawer-row"><strong>Hold Status</strong><span>${pill(r.status, r.status === 'Active' ? 'warn' : 'neutral')}</span></div>
              <div class="drawer-row"><strong>Preservation Notes</strong><span>${esc(r.notes)}</span></div>
            </div>
          `);
        }
      });

      tableWrap.appendChild(table);
    }

    updateHoldsTable();
    contentArea.appendChild(filterBar);
    contentArea.appendChild(tableWrap);
    contentArea.appendChild(actionBar);
  }

  // Switch tabs
  const tabRetBtn = tabNav.querySelector('#tab-retention');
  const tabHldBtn = tabNav.querySelector('#tab-holds');

  tabRetBtn.addEventListener('click', () => {
    activeTab = 'retention';
    tabRetBtn.classList.add('active');
    tabHldBtn.classList.remove('active');
    renderRetention();
  });

  tabHldBtn.addEventListener('click', () => {
    activeTab = 'holds';
    tabHldBtn.classList.add('active');
    tabRetBtn.classList.remove('active');
    renderHolds();
  });

  // Assemble
  main.innerHTML = '';
  main.appendChild(header);
  main.appendChild(roleBoundary);
  main.appendChild(kpiGrid);
  main.appendChild(tabNav);
  main.appendChild(contentArea);

  renderRetention();
}

init();
