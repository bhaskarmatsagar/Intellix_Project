/** Hash-based router for section navigation */
import { STORE } from './store.js';
import { hideDrawer } from './ui.js';

const ROUTES = {
  monitoring: { view: 'monitoring', title: 'Monitoring', file: 'monitoring.js' },
  slos: { view: 'slos', title: 'SLO Standards', file: 'slos.js' },
  'slo-detail': { view: 'slo-detail', title: 'SLO Detail', file: 'slo-detail.js' },
  services: { view: 'services', title: 'Service Posture', file: 'services.js' },
  incidents: { view: 'incidents', title: 'Incident Assurance', file: 'incidents.js' },
  history: { view: 'history', title: 'History & Evidence', file: 'history.js' },
  exceptions: { view: 'empty', title: 'Exceptions', file: 'empty.js', empty: true },
  'alert-governance': { view: 'empty', title: 'Alert Governance', file: 'empty.js', empty: true },
  'corrective-actions': { view: 'empty', title: 'Corrective Actions', file: 'empty.js', empty: true },
  maintenance: { view: 'empty', title: 'Maintenance', file: 'empty.js', empty: true },
};

let currentViewModule = null;
let currentRouteKey = null;
let navToken = 0;

function parseHash() {
  const raw = location.hash.slice(1);
  if (!raw) {
    return { route: ROUTES.monitoring, routeKey: 'monitoring', params: new URLSearchParams(''), parts: ['monitoring'] };
  }
  const [path, queryStr] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const routeKey = parts[0] || 'monitoring';
  if (!(routeKey in ROUTES)) {
    return null;
  }
  return { route: ROUTES[routeKey], routeKey, params: new URLSearchParams(queryStr || ''), parts };
}

export const ROUTER = {
  init() {
    window.addEventListener('hashchange', () => this.navigate());
    this.navigate();
  },

  async navigate() {
    const parsed = parseHash();
    if (!parsed) {
      const raw = location.hash.slice(1).split('?')[0];
      if (raw && document.getElementById(raw)) return;   // in-page anchor such as #app-main (skip link)
      history.replaceState(null, '', location.pathname + location.search + '#monitoring');
      return this.navigate();
    }
    const { route, routeKey, params, parts } = parsed;
    const viewName = route.view;
    const token = ++navToken;

    // Fast path: if staying on monitoring and only ?slo= changed
    if (currentRouteKey === 'monitoring' && routeKey === 'monitoring' && currentViewModule?.update) {
      const sloId = params.get('slo');
      STORE.setSelectedSlo(sloId || null);
      STORE.setDrawerOpen(!!sloId);
      currentViewModule.update();
      return;
    }

    // 1. Destroy previous view FIRST
    if (currentViewModule && currentViewModule.destroy) {
      try { currentViewModule.destroy(); } catch (e) { console.error(e); }
      currentViewModule = null;
    }

    // 2. Hide drawer if leaving monitoring
    if (routeKey !== 'monitoring') {
      hideDrawer();
    }

    // 3. Reset filters/search if leaving monitoring
    if (viewName !== 'monitoring') {
      STORE.setSearch('');
      STORE.setFilters({ status: [], tier: [], service: [], quality: [], concerns: false, openFollowup: false });
    }

    // 4. Handle SLO selection
    if (routeKey === 'slo-detail' || (routeKey === 'monitoring' && params.get('slo'))) {
      const sloId = params.get('slo') || parts[1];
      STORE.setSelectedSlo(sloId || null);
      STORE.setDrawerOpen(!!sloId);
    } else {
      STORE.setSelectedSlo(null);
      STORE.setDrawerOpen(false);
    }

    STORE.setView(viewName);
    currentRouteKey = routeKey;

    try {
      const mod = await import(`./views/${route.file}`);
      if (token !== navToken) return; // race check
      currentViewModule = mod.default || mod;
      if (currentViewModule.init) {
        await currentViewModule.init(params, parts, { routeKey, title: route.title });
      }
    } catch (err) {
      console.error('[router] Failed to load view:', route.file, err);
      const host = document.getElementById('app-main');
      if (host && token === navToken) {
        host.innerHTML = '<div class="alert alert-danger my-4" role="alert">This section could not be loaded. <a href="#monitoring">Back to Monitoring</a></div>';
      }
    }
  },

  go(view, params = {}) {
    const qs = new URLSearchParams(params).toString();
    location.hash = view + (qs ? '?' + qs : '');
  },
};
