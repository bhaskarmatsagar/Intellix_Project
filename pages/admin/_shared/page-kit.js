/**
 * page-kit.js - Shared governance page toolkit for Platform Admin
 * Strictly ASCII-only UTF-8
 */
import {
  kpiCard, createTable, pill, chip, chipClear, searchBox, select,
  openDrawer, openDialog, toast, emptyState, miniBar, themeToggle
} from '../slo-monitoring/js/ui.js';

import {
  esc, fmtDateTime, fmtDate, fmtPct, fmtBurn, statusClass,
  variantFor, toCsv, downloadBlob
} from '../slo-monitoring/js/util.js';

import {
  donutChart, hbarChart, groupedBarChart, stackedBarChart, gaugeChart
} from '../slo-monitoring/js/charts.js';

import { CONFIG } from '../slo-monitoring/js/config.js';

export {
  kpiCard, createTable, pill, chip, chipClear, searchBox, select,
  openDrawer, openDialog, toast, emptyState, miniBar, themeToggle,
  esc, fmtDateTime, fmtDate, fmtPct, fmtBurn, statusClass,
  variantFor, toCsv, downloadBlob,
  donutChart, hbarChart, groupedBarChart, stackedBarChart, gaugeChart,
  CONFIG
};

// ============================================================
// Theme Management
// ============================================================
export function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem('edx-theme');
  } catch (e) {
    console.warn('[theme] Storage access blocked:', e);
  }
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.bsTheme = theme;
}

export function getCurrentTheme() {
  return document.documentElement.dataset.theme || 'light';
}

window.setTheme = function(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.bsTheme = theme;
  try {
    localStorage.setItem('edx-theme', theme);
  } catch (e) {
    console.warn('[theme] Failed to save theme:', e);
  }
  window.dispatchEvent(new CustomEvent('edx-theme-changed', { detail: { theme } }));
};

// ============================================================
// Shared Partials Loading & Active Link Highlighting
// ============================================================
let partialsPromise = null;

function markSidebarActive(host) {
  if (!host) return;
  const links = host.querySelectorAll('a[href]');
  const currentFile = location.pathname.split('?')[0].split('#')[0].split('/').pop();
  links.forEach(a => {
    const href = a.getAttribute('href') || '';
    const targetFile = href.split('?')[0].split('#')[0].split('/').pop();
    if (targetFile && targetFile === currentFile) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    } else {
      a.classList.remove('active');
      a.removeAttribute('aria-current');
    }
  });
}

export function initPartials() {
  return (partialsPromise ??= (async () => {
    const loadPartial = async (id, url) => {
      const host = document.getElementById(id);
      if (!host) return;
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          host.innerHTML = await res.text();
          if (id === 'app-sidebar') markSidebarActive(host);
        }
      } catch (e) {
        console.warn(`[page-kit] Failed to load ${url}:`, e);
      }
    };

    await Promise.all([
      loadPartial('app-header', '../../../partials/header.html'),
      loadPartial('app-sidebar', '../../../partials/sidebar-admin.html'),
      loadPartial('app-footer', '../../../partials/footer.html'),
    ]);

    const sidebarHost = document.getElementById('app-sidebar');
    if (sidebarHost) {
      markSidebarActive(sidebarHost);
      new MutationObserver(() => markSidebarActive(sidebarHost)).observe(sidebarHost, { childList: true, subtree: true });
    }
  })());
}

// ============================================================
// Page Renderer
// ============================================================
export async function renderPage(config) {
  initTheme();
  await initPartials();

  const main = document.getElementById('app-main');
  if (!main) {
    console.error('[page-kit] Main element #app-main not found');
    return;
  }

  // Fetch or resolve data
  let allRows = [];
  let dataState = 'demo'; // 'live' | 'demo' | 'offline'

  const fetchSource = async () => {
    if (config.source?.endpoint) {
      try {
        const base = CONFIG.apiBase || 'http://127.0.0.1:8000';
        const url = base.replace(/\/+$/, '') + '/' + config.source.endpoint.replace(/^\/+/, '');
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          allRows = await res.json();
          dataState = 'live';
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch (e) {
        console.warn(`[page-kit] Endpoint ${config.source.endpoint} failed:`, e);
        dataState = 'offline';
        allRows = Array.isArray(config.source.demo) ? [...config.source.demo] : [];
        toast('Backend unreachable \u2014 showing fallback data', 'warn');
      }
    } else {
      allRows = Array.isArray(config.source?.demo) ? [...config.source.demo] : [];
      dataState = 'demo';
    }
  };

  await fetchSource();

  // If custom render function is provided (e.g., Home page hub)
  if (typeof config.customRender === 'function') {
    main.innerHTML = '';
    await config.customRender({
      main,
      data: allRows,
      dataState,
      refresh: async () => {
        await fetchSource();
        await config.customRender({ main, data: allRows, dataState, refresh: this });
      }
    });
    return;
  }

  // State
  let searchQuery = '';
  const filterValues = {};
  (config.filters || []).forEach(f => {
    filterValues[f.key] = f.type === 'chips' ? [] : '';
  });

  let sortKey = config.defaultSort?.key || '';
  let sortDir = config.defaultSort?.dir || 'asc';
  let currentPage = 1;
  const pageSize = config.pageSize || null;

  // Build containers
  const header = document.createElement('div');
  header.className = 'page-header';

  const roleBoundary = document.createElement('div');
  roleBoundary.className = 'role-boundary';
  roleBoundary.innerHTML = `<strong>Role boundary:</strong> ${esc(config.roleBoundary || 'Platform Admin reviews governance evidence.')}`;

  const kpiGrid = document.createElement('div');
  kpiGrid.className = 'kpi-grid';

  const chartContainer = document.createElement('div');
  chartContainer.className = 'chart-grid';

  const tabsContainer = document.createElement('div');
  if (config.tabs && config.tabs.length) {
    tabsContainer.className = 'page-kit-tabs';
  }

  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';

  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-wrapper';

  const paginationBar = document.createElement('div');
  paginationBar.className = 'pagination-bar';

  const actionBar = document.createElement('div');
  actionBar.className = 'd-flex align-items-center gap-2 mt-2';

  // Export CSV button
  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.className = 'btn btn-outline-secondary btn-sm';
  exportBtn.innerHTML = '<i class="bi bi-download me-1" aria-hidden="true"></i> Export CSV';
  exportBtn.addEventListener('click', () => {
    const filtered = getFilteredRows();
    const csvCols = config.csv || (config.columns || []).map(c => ({ label: c.label, key: c.key }));
    const csvData = toCsv(filtered, csvCols);
    downloadBlob(csvData, `${config.slug || 'export'}.csv`);
    toast('CSV downloaded', 'good');
  });
  actionBar.appendChild(exportBtn);

  // Filter logic
  function getFilteredRows() {
    return allRows.filter(row => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const searchFields = config.searchFields || Object.keys(row);
        const match = searchFields.some(f => {
          const val = row[f];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
        });
        if (!match) return false;
      }

      // Filters
      for (const f of (config.filters || [])) {
        const current = filterValues[f.key];
        if (f.type === 'chips') {
          if (Array.isArray(current) && current.length > 0) {
            const rowVal = String(row[f.key] ?? '');
            if (!current.includes(rowVal)) return false;
          }
        } else if (f.type === 'select') {
          if (current !== '' && current !== null && current !== undefined) {
            if (String(row[f.key] ?? '') !== String(current)) return false;
          }
        }
      }
      return true;
    });
  }

  function getSortedRows(rows) {
    if (!sortKey) return rows;
    const col = (config.columns || []).find(c => c.key === sortKey);
    return [...rows].sort((a, b) => {
      let va = a[sortKey];
      let vb = b[sortKey];
      if (col && typeof col.sortValue === 'function') {
        va = col.sortValue(a);
        vb = col.sortValue(b);
      }
      if (va === null || va === undefined) va = '';
      if (vb === null || vb === undefined) vb = '';
      let cmp = 0;
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb;
      } else {
        cmp = String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' });
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }

  // Header render
  function renderHeader() {
    header.innerHTML = `
      <div class="page-title-block">
        <div class="context">${esc(config.context || 'Platform Admin')}</div>
        <h1>${esc(config.title || '')}</h1>
        <p class="subtitle">${esc(config.subtitle || '')}</p>
      </div>
      <div class="page-header-actions" id="page-header-actions"></div>
    `;

    const actions = header.querySelector('#page-header-actions');

    // Badge
    let badgeHtml = '';
    if (dataState === 'live') {
      badgeHtml = '<span class="connection-badge live"><span class="dot"></span>Live data</span>';
    } else if (dataState === 'offline') {
      badgeHtml = '<span class="connection-badge offline"><span class="dot"></span>Backend unreachable \u2014 fallback data</span>';
    } else {
      badgeHtml = '<span class="connection-badge degraded"><span class="dot"></span>Demo data \u2014 backend not connected</span>';
    }
    const badgeSpan = document.createElement('span');
    badgeSpan.innerHTML = badgeHtml;
    actions.appendChild(badgeSpan.firstElementChild);

    // Refresh if live
    if (config.source?.endpoint) {
      const refreshBtn = document.createElement('button');
      refreshBtn.type = 'button';
      refreshBtn.className = 'btn btn-outline-secondary btn-sm';
      refreshBtn.title = 'Refresh data';
      refreshBtn.setAttribute('aria-label', 'Refresh data');
      refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise" aria-hidden="true"></i>';
      refreshBtn.addEventListener('click', async () => {
        await fetchSource();
        renderAll();
        toast('Data refreshed', 'good');
      });
      actions.appendChild(refreshBtn);
    }

    // Theme toggle
    const toggle = themeToggle(getCurrentTheme(), t => {
      window.setTheme(t);
      renderHeader();
    });
    actions.appendChild(toggle);
  }

  // KPIs render
  function renderKpis() {
    kpiGrid.innerHTML = '';
    if (typeof config.kpis === 'function') {
      const kpis = config.kpis(allRows);
      kpis.forEach(k => {
        kpiGrid.appendChild(kpiCard(k.label, k.value, k.note, k.badge));
      });
    }
  }

  // Chart render
  function renderChart() {
    chartContainer.innerHTML = '';
    if (typeof config.chart === 'function') {
      const chartNode = config.chart(allRows);
      if (chartNode) {
        chartContainer.appendChild(chartNode);
        chartContainer.style.display = 'grid';
      } else {
        chartContainer.style.display = 'none';
      }
    } else {
      chartContainer.style.display = 'none';
    }
  }

  // Filter bar render
  function renderFilterBar(filteredCount) {
    filterBar.innerHTML = '';

    // Clear filters button (created early so search handler can toggle it)
    const clearBtn = chipClear('Clear filters', () => {
      searchQuery = '';
      const searchInput = filterBar.querySelector('input[type="search"]');
      if (searchInput) searchInput.value = '';
      Object.keys(filterValues).forEach(k => {
        filterValues[k] = Array.isArray(filterValues[k]) ? [] : '';
      });
      currentPage = 1;
      renderFilterBar(allRows.length);
      renderTableAndPagination();
    });

    // Result count
    const countSpan = document.createElement('span');
    countSpan.className = 'filter-count text-body-secondary small';
    countSpan.textContent = `Showing ${filteredCount} of ${allRows.length} records`;

    // Search box
    const searchPlaceholder = `Search ${config.title || 'records'}\u2026`;
    const sb = searchBox(searchPlaceholder, v => {
      searchQuery = v;
      currentPage = 1;
      const count = getFilteredRows().length;
      countSpan.textContent = `Showing ${count} of ${allRows.length} records`;
      const activeFilter = Object.values(filterValues).some(val => Array.isArray(val) ? val.length > 0 : !!val);
      clearBtn.style.display = (v || activeFilter) ? '' : 'none';
      renderTableAndPagination();
    }, searchQuery, `${config.slug}-search`);
    filterBar.appendChild(sb);

    // Filters
    (config.filters || []).forEach(f => {
      if (f.type === 'chips') {
        const group = document.createElement('div');
        group.className = 'filter-group';
        const options = f.options || [...new Set(allRows.map(r => r[f.key]).filter(Boolean))].sort();
        options.forEach(optVal => {
          const optLabel = typeof optVal === 'object' ? optVal.label : optVal;
          const optKey = typeof optVal === 'object' ? optVal.value : optVal;
          const active = filterValues[f.key].includes(optKey);
          const count = allRows.filter(r => String(r[f.key] ?? '') === String(optKey)).length;
          const chipBtn = chip(optLabel, active, () => {
            const arr = filterValues[f.key];
            const idx = arr.indexOf(optKey);
            if (idx >= 0) arr.splice(idx, 1);
            else arr.push(optKey);
            currentPage = 1;
            renderFilterBar(getFilteredRows().length);
            renderTableAndPagination();
          }, count);
          group.appendChild(chipBtn);
        });
        filterBar.appendChild(group);
      } else if (f.type === 'select') {
        const group = document.createElement('div');
        group.className = 'filter-group';
        if (f.label) {
          const lbl = document.createElement('label');
          lbl.textContent = f.label;
          group.appendChild(lbl);
        }
        const rawOpts = f.options || [...new Set(allRows.map(r => r[f.key]).filter(Boolean))].sort();
        const selectOpts = [
          { value: '', label: `All ${f.label || f.key}` },
          ...rawOpts.map(o => typeof o === 'object' ? o : { value: o, label: o })
        ];
        const selEl = select(selectOpts, filterValues[f.key], val => {
          filterValues[f.key] = val;
          currentPage = 1;
          renderFilterBar(getFilteredRows().length);
          renderTableAndPagination();
        });
        group.appendChild(selEl);
        filterBar.appendChild(group);
      }
    });

    // Append clear button and count
    const hasSearch = !!searchQuery;
    const hasActiveFilters = Object.values(filterValues).some(v => Array.isArray(v) ? v.length > 0 : !!v);
    clearBtn.style.display = (hasSearch || hasActiveFilters) ? '' : 'none';
    filterBar.appendChild(clearBtn);
    filterBar.appendChild(countSpan);
  }

  // Table and pagination render
  function renderTableAndPagination() {
    tableWrap.innerHTML = '';
    paginationBar.innerHTML = '';

    const filtered = getFilteredRows();
    const sorted = getSortedRows(filtered);

    let displayRows = sorted;
    if (pageSize && pageSize > 0) {
      const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;
      const start = (currentPage - 1) * pageSize;
      displayRows = sorted.slice(start, start + pageSize);

      // Pagination controls
      if (totalPages > 1 || sorted.length > pageSize) {
        paginationBar.innerHTML = `
          <div class="small text-body-secondary">
            Page ${currentPage} of ${totalPages} (${sorted.length} total)
          </div>
          <div class="pagination-controls">
            <button class="btn btn-outline-secondary btn-sm" id="btn-prev" ${currentPage <= 1 ? 'disabled' : ''}>
              &larr; Previous
            </button>
            <button class="btn btn-outline-secondary btn-sm" id="btn-next" ${currentPage >= totalPages ? 'disabled' : ''}>
              Next &rarr;
            </button>
          </div>
        `;
        paginationBar.querySelector('#btn-prev')?.addEventListener('click', () => {
          if (currentPage > 1) {
            currentPage--;
            renderTableAndPagination();
          }
        });
        paginationBar.querySelector('#btn-next')?.addEventListener('click', () => {
          if (currentPage < totalPages) {
            currentPage++;
            renderTableAndPagination();
          }
        });
      }
    }

    const table = createTable(config.columns || [], displayRows, {
      sortKey,
      sortDir,
      keyField: config.rowId || 'id',
      onSort: key => {
        if (sortKey === key) {
          sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          sortKey = key;
          sortDir = 'asc';
        }
        renderTableAndPagination();
      },
      onRowClick: row => {
        if (typeof config.drawer === 'function') {
          const content = config.drawer(row);
          const title = config.drawerTitle ? config.drawerTitle(row) : `${config.title || 'Record'} Details`;
          let contentNode = content;
          if (typeof content === 'string') {
            const div = document.createElement('div');
            div.innerHTML = content;
            contentNode = div;
          }
          openDrawer(title, contentNode);
        }
      },
      emptyMessage: `No ${config.title || 'records'} match the selected criteria.`
    });

    tableWrap.appendChild(table);
  }

  function renderAll() {
    renderHeader();
    renderKpis();
    renderChart();
    const filtered = getFilteredRows();
    renderFilterBar(filtered.length);
    renderTableAndPagination();
  }

  // Initial Assembly
  main.innerHTML = '';
  main.appendChild(header);
  main.appendChild(roleBoundary);
  main.appendChild(kpiGrid);
  main.appendChild(chartContainer);
  if (config.tabs && config.tabs.length) main.appendChild(tabsContainer);
  main.appendChild(filterBar);
  main.appendChild(tableWrap);
  if (pageSize) main.appendChild(paginationBar);
  main.appendChild(actionBar);

  renderAll();
}
