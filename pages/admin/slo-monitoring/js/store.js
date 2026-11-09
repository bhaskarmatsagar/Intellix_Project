/** Centralized state store with polling, diff, and change detection */
import { CONFIG } from './config.js';
import { API } from './api.js';
import { withUiKept } from './ui.js';

const STATE = {
  meta: null,
  slos: [],
  followups: [],
  services: [],
  incidents: [],
  reviewers: [],
  history: [],
  snapshotsBySlo: new Map(),
  lastFetch: null,
  connection: 'connecting', // 'live' | 'degraded' | 'offline'
  pollMs: CONFIG.pollMs,
  backoffMs: CONFIG.pollMs,
  pollTimer: null,
  visible: true,
  listeners: new Set(),
  // UI state preserved across renders
  ui: {
    view: 'monitoring',
    search: '',
    filters: { status: [], tier: [], service: [], quality: [], concerns: false, openFollowup: false },
    sort: { ...CONFIG.defaultSort },
    selectedSloId: null,
    drawerOpen: false,
    scrollPos: 0,
    focusedEl: null,
  },
};

let inFlight = null;

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function notify() {
  STATE.listeners.forEach(cb => {
    try { cb(); } catch (err) { console.error('[store] subscriber error:', err); }
  });
}

export const STORE = {
  getState() { return STATE; },
  subscribe(cb) {
    const wrapped = () => withUiKept(cb);
    STATE.listeners.add(wrapped);
    return () => STATE.listeners.delete(wrapped);
  },

  // Data setters
  setMeta(data) { STATE.meta = data; },
  setSlos(data) { STATE.slos = data; },
  setFollowups(data) { STATE.followups = data; },
  setServices(data) { STATE.services = data; },
  setIncidents(data) { STATE.incidents = data; },
  setReviewers(data) { STATE.reviewers = data; },
  setHistory(data) { STATE.history = data; },
  setSnapshots(sloId, data) { STATE.snapshotsBySlo.set(sloId, data); },

  // UI state setters
  setView(view) { STATE.ui.view = view; notify(); },
  setSearch(q) { STATE.ui.search = q; notify(); },
  setFilters(f) { STATE.ui.filters = { ...STATE.ui.filters, ...f }; notify(); },
  clearFilters() { STATE.ui.filters = { status: [], tier: [], service: [], quality: [], concerns: false, openFollowup: false }; notify(); },
  setSort(sort) { STATE.ui.sort = sort; notify(); },
  setSelectedSlo(id) { STATE.ui.selectedSloId = id; notify(); },
  setDrawerOpen(open) { STATE.ui.drawerOpen = open; notify(); },
  setScrollPos(y) { STATE.ui.scrollPos = y; },
  setFocusedEl(el) { STATE.ui.focusedEl = el; },

  // Poll interval
  setPollInterval(ms) {
    STATE.pollMs = ms;
    STORE.stopPolling();
    if (ms > 0) {
      STORE.startPolling();
    }
    notify();
  },
  getPollInterval() {
    return STATE.pollMs;
  },

  // Full data fetch (parallel)
  fetchAll() {
    if (inFlight) return inFlight;
    inFlight = (async () => {
      try {
        const [meta, slos, followups, services, incidents, reviewers] = await Promise.all([
          API.meta(), API.slos(), API.followups(), API.services(), API.incidents(), API.reviewers(),
        ]);

        // Load snapshots
        const snapshotsBySlo = new Map();
        try {
          const all = await API.snapshots();
          if (Array.isArray(all) && all.length && all[0].slo_id) {
            all.forEach(s => {
              const list = snapshotsBySlo.get(s.slo_id) || [];
              list.push(s);
              snapshotsBySlo.set(s.slo_id, list);
            });
          } else {
            throw new Error('fallback');
          }
        } catch {
          const results = await Promise.allSettled(slos.map(s => API.snapshots(s.slo_id)));
          results.forEach((r, i) => {
            if (r.status === 'fulfilled' && r.value) {
              const val = Array.isArray(r.value) ? r.value : [r.value];
              snapshotsBySlo.set(slos[i].slo_id, val);
            }
          });
        }
        snapshotsBySlo.forEach(list => {
          list.sort((a, b) => new Date(b.observed_at) - new Date(a.observed_at));
        });

        // Load history
        let history = [];
        try {
          history = await API.governanceHistory();
        } catch (err) {
          console.warn('[store] governanceHistory fetch failed, keeping previous', err);
          history = STATE.history;
        }

        const snapObj = Object.fromEntries(snapshotsBySlo.entries());
        const oldSnapObj = Object.fromEntries(STATE.snapshotsBySlo.entries());

        const dataChanged = !deepEqual(STATE.meta, meta) ||
                            !deepEqual(STATE.slos, slos) ||
                            !deepEqual(STATE.followups, followups) ||
                            !deepEqual(STATE.services, services) ||
                            !deepEqual(STATE.incidents, incidents) ||
                            !deepEqual(STATE.reviewers, reviewers) ||
                            !deepEqual(oldSnapObj, snapObj) ||
                            !deepEqual(STATE.history, history);

        const connChanged = STATE.connection !== 'live';

        STATE.meta = meta;
        STATE.slos = slos;
        STATE.followups = followups;
        STATE.services = services;
        STATE.incidents = incidents;
        STATE.reviewers = reviewers;
        STATE.snapshotsBySlo = snapshotsBySlo;
        STATE.history = history;
        STATE.lastFetch = Date.now();
        STATE.connection = 'live';
        STATE.backoffMs = STATE.pollMs || CONFIG.pollMs;

        if (dataChanged || connChanged) {
          notify();
        }
        return dataChanged;
      } catch (err) {
        console.error('[store] fetchAll failed:', err);
        const connChanged = STATE.connection !== 'offline';
        STATE.connection = 'offline';
        STATE.backoffMs = Math.min((STATE.backoffMs || CONFIG.pollMs) * 2, CONFIG.maxBackoffMs);
        if (connChanged) {
          notify();
        }
        throw err;
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  },

  // Fetch single SLO detail + snapshots
  async fetchSloDetail(sloId) {
    const [slo, snapshots] = await Promise.all([API.slo(sloId), API.snapshots(sloId)]);
    const list = Array.isArray(snapshots) ? snapshots : [snapshots];
    list.sort((a, b) => new Date(b.observed_at) - new Date(a.observed_at));
    STATE.snapshotsBySlo.set(sloId, list);
    return { slo, snapshots: list };
  },

  // Polling control
  startPolling() {
    if (STATE.pollTimer) return;
    if (STATE.pollMs === 0) return;
    const tick = async () => {
      if (document.hidden) {
        if (STATE.pollMs > 0) {
          STATE.pollTimer = setTimeout(tick, STATE.pollMs);
        }
        return;
      }
      try {
        await STORE.fetchAll();
      } catch {}
      if (STATE.pollMs > 0) {
        const nextDelay = STATE.connection === 'offline' ? STATE.backoffMs : STATE.pollMs;
        STATE.pollTimer = setTimeout(tick, nextDelay);
      }
    };
    STATE.pollTimer = setTimeout(tick, STATE.pollMs);
  },

  stopPolling() {
    if (STATE.pollTimer) {
      clearTimeout(STATE.pollTimer);
      STATE.pollTimer = null;
    }
  },

  setVisibility(vis) {
    STATE.visible = vis;
    if (vis) {
      STORE.fetchAll().catch(() => {});
    }
  },

  // Post-mutation refresh
  async refreshAfterMutation() {
    await STORE.fetchAll();
  },
};

// Visibility handling
document.addEventListener('visibilitychange', () => STORE.setVisibility(!document.hidden));
window.addEventListener('focus', () => STORE.setVisibility(true));
