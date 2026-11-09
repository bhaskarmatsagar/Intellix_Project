/** Configuration: API base, polling, defaults */
export const CONFIG = (() => {
  const isSameOrigin = location.pathname.startsWith('/site/');
  const apiBase = isSameOrigin ? '' : (window.EDX_CONFIG?.apiBase ?? 'http://127.0.0.1:8000');
  return {
    apiBase,
    pollMs: window.EDX_CONFIG?.pollMs ?? 5000,
    maxBackoffMs: 30000,
    defaultSort: { key: 'statusSort', dir: 'asc' },
    pageSize: 50,
  };
})();