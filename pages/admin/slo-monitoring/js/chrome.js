/** Load shared header, sidebar, footer partials */
const PARTIALS = {
  header: '../../../partials/header.html',
  sidebar: '../../../partials/sidebar-admin.html',
  footer: '../../../partials/footer.html',
};

async function loadPartial(id, url) {
  const host = document.getElementById(id);
  if (!host) return;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      host.innerHTML = await res.text();
      // Mark sidebar active link after load
      if (id === 'app-sidebar') markSidebarActive(host);
    }
  } catch (e) {
    console.warn(`[chrome] Failed to load ${url}:`, e);
  }
}

function markSidebarActive(host) {
  const links = host.querySelectorAll('a[href]');
  const currentPage = 'slo-monitoring.html';
  links.forEach(a => {
    const href = a.getAttribute('href') || '';
    const target = href.split('?')[0].split('#')[0].split('/').pop();
    if (target === currentPage) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }
  });
}

let chromePromise = null;

export function initChrome() {
  return (chromePromise ??= (async () => {
    await Promise.all([
      loadPartial('app-header', PARTIALS.header),
      loadPartial('app-sidebar', PARTIALS.sidebar),
      loadPartial('app-footer', PARTIALS.footer),
    ]);
    // Observe sidebar for dynamic content
    const sidebarHost = document.getElementById('app-sidebar');
    if (sidebarHost) {
      new MutationObserver(() => markSidebarActive(sidebarHost)).observe(sidebarHost, { childList: true, subtree: true });
    }
  })());
}
