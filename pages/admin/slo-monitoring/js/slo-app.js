/** Main application entry point */
import { STORE } from './store.js';
import { ROUTER } from './router.js';
import { initChrome } from './chrome.js';
import { esc } from './util.js';
import { toast } from './ui.js';

// Initialize theme from localStorage or prefers-color-scheme
(function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem('edx-theme');
  } catch (e) {
    console.warn('[theme] Storage access blocked:', e);
  }
  const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.bsTheme = theme;
})();

// Global theme toggle function for header button
window.setTheme = function(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.bsTheme = theme;
  try {
    localStorage.setItem('edx-theme', theme);
  } catch (e) {
    console.warn('[theme] Failed to save theme:', e);
  }
};

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', e => {
  const msg = e.reason?.message || String(e.reason || 'Unexpected error');
  toast(msg, 'bad');
});

// App bootstrap
let routerInitialized = false;

async function bootstrap() {
  const main = document.getElementById('app-main');
  if (main) {
    main.innerHTML = `
      <div class="d-flex align-items-center justify-content-center p-5 text-muted">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
        <span>Loading SLO Monitoring & Reliability Governance\u2026</span>
      </div>
    `;
  }

  // Load chrome in parallel
  initChrome().catch(err => console.warn('[chrome] error:', err));

  // Auto-recovery listener
  let unsubscribeRecovery = null;
  const checkRecovery = () => {
    if (STORE.getState().meta && !routerInitialized) {
      routerInitialized = true;
      if (unsubscribeRecovery) {
        unsubscribeRecovery();
        unsubscribeRecovery = null;
      }
      ROUTER.init();
    }
  };
  unsubscribeRecovery = STORE.subscribe(checkRecovery);

  function showError(err) {
    if (main && !routerInitialized) {
      main.innerHTML = `
        <div class="alert alert-danger my-4" role="alert">
          <h4 class="alert-heading">Unable to load SLO monitoring data</h4>
          <p>${esc(err?.message || 'Backend connection failed')}</p>
          <hr>
          <div class="d-flex align-items-center justify-content-between">
            <span class="small text-body-secondary">
              Backend should be running at <code>http://127.0.0.1:8000</code>. Retrying automatically\u2026
            </span>
            <button class="btn btn-sm btn-danger" id="retry-fetch-btn">Retry Now</button>
          </div>
        </div>
      `;
      main.querySelector('#retry-fetch-btn')?.addEventListener('click', async () => {
        try {
          await STORE.fetchAll();
        } catch (e) {
          toast(e.message || 'Retry failed', 'bad');
        }
      });
    }
  }

  try {
    await STORE.fetchAll();
    if (!routerInitialized) {
      routerInitialized = true;
      if (unsubscribeRecovery) {
        unsubscribeRecovery();
        unsubscribeRecovery = null;
      }
      ROUTER.init();
    }
  } catch (err) {
    console.error('[slo-app] Initial fetch failed:', err);
    showError(err);
  } finally {
    STORE.startPolling();
  }
}

bootstrap();

// Export for debugging
window.EDX_SLO_APP = { STORE, ROUTER };
