/** Utilities: escaping, formatting, dates, CSV */

const ESC_MAP = {
  '&': '\u0026amp;',
  '<': '\u0026lt;',
  '>': '\u0026gt;',
  '"': '\u0026quot;',
  "'": '\u0026#39;',
};

// Escape HTML
export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ESC_MAP[c]);
}

// Plain-text date for places that escape their input (e.g. KPI cards)
export function fmtDateTimeText(iso) {
  if (!iso) return '\u2014';
  const d = new Date(iso);
  return isNaN(d) ? String(iso) : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

// Pick a pill colour from the text itself
export function variantFor(text) {
  const s = String(text || '').toLowerCase();
  if (/closed|verified|on target|validated|\byes\b|reconciled|live/.test(s)) return 'good';
  if (/breach|overdue|missing|failed|critical|\bno\b|offline|returned \u2014 additional/.test(s)) return 'bad';
  if (/awaiting|review required|at risk|pending|limited|degraded/.test(s)) return 'warn';
  if (/returned|investigating|acknowledged|info/.test(s)) return 'info';
  return 'neutral';
}

// Canonical follow-up statuses
export const FU_STATUS = {
  AWAITING: 'Awaiting Specialist Evidence',
  EVIDENCE_RETURNED: 'Evidence Returned \u2014 Review Required',
  ADDITIONAL_REQUIRED: 'Returned \u2014 Additional Specialist Evidence Required',
  CLOSED: 'Closed \u2014 Independently Verified',
};

// Format UTC ISO string to local display with UTC tooltip
export function fmtDateTime(iso) {
  if (!iso) return '\u2014';
  const d = new Date(iso);
  if (isNaN(d)) return esc(iso);
  const local = d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  const utc = d.toISOString().replace('T', ' ').replace('Z', ' UTC');
  return `<span title="${esc(utc)}">${esc(local)}</span>`;
}

export function fmtDate(iso) {
  if (!iso) return '\u2014';
  const d = new Date(iso);
  if (isNaN(d)) return esc(iso);
  return esc(d.toLocaleDateString(undefined, { dateStyle: 'medium' }));
}

// Format percentage from number (0-100) or string
export function fmtPct(val, decimals = 2) {
  if (val === null || val === undefined || val === '') return '\u2014';
  const n = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(n)) return esc(String(val));
  return n.toFixed(decimals) + '%';
}

// Format burn rate
export function fmtBurn(val) {
  if (val === null || val === undefined) return 'N/A';
  const n = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(n)) return esc(String(val));
  return n.toFixed(2) + 'x';
}

// Status pill class
export function statusClass(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('on target')) return 'good';
  if (s.includes('at risk')) return 'warn';
  if (s.includes('breach')) return 'bad';
  return 'neutral';
}

// Sort key for SLO status (worst first)
export function statusSortKey(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('breach')) return 0;
  if (s.includes('at risk')) return 1;
  return 2;
}

// Generate CSV from array of objects
export function toCsv(rows, columns) {
  if (!rows.length) return '';
  const header = columns.map(c => c.label).join(',');
  const lines = rows.map(row =>
    columns.map(c => {
      let v = c.key.split('.').reduce((o, k) => o?.[k], row);
      if (v === null || v === undefined) v = '';
      v = String(v);
      if (/^[=+\-@]/.test(v)) {
        v = "'" + v;
      }
      v = v.replace(/"/g, '""');
      if (v.includes(',') || v.includes('"') || v.includes('\n')) v = '"' + v + '"';
      return v;
    }).join(',')
  );
  return [header, ...lines].join('\n');
}

// Download blob
export function downloadBlob(content, filename, mime = 'text/csv') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// Debounce
export function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// Unique ID
export function uid(prefix = 'id') { return prefix + '-' + Math.random().toString(36).slice(2, 10); }

// Parse hash params
export function getHashParams() {
  const hash = location.hash.slice(1);
  const [, query] = hash.split('?');
  return new URLSearchParams(query || '');
}
