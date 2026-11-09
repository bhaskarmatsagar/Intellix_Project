/** Empty module for sections without backend data */
import { STORE } from '../store.js';
import { emptyState } from '../ui.js';

let currentTitle = 'Section';
let unsubscribe = null;

export async function init(params, parts, routeInfo) {
  currentTitle = routeInfo?.title || 'Section';
  render();
  unsubscribe = STORE.subscribe(render);
}

export function destroy() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

function render() {
  const main = document.getElementById('app-main');
  if (!main) return;

  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <div class="page-title-block">
      <div class="context">Platform Admin \u00b7 Reliability Governance</div>
      <h1>${currentTitle}</h1>
      <p class="subtitle">This section has no backend data yet.</p>
    </div>
  `;

  const empty = emptyState(
    'Not connected: this section has no backend data yet.',
    'database'
  );
  empty.style.maxWidth = '480px';
  empty.style.margin = '48px auto';

  main.innerHTML = '';
  main.appendChild(header);
  main.appendChild(empty);
}
