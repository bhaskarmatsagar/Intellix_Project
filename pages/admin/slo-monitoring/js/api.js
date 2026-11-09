/** API client with fetch wrapper and error handling */
import { CONFIG } from './config.js';

function buildUrl(path, params = {}) {
  const url = new URL(path, CONFIG.apiBase || location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });
  return url.toString();
}

async function request(path, options = {}) {
  const url = buildUrl(path, options.params);
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'omit',
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try { const err = await res.json(); detail = err.detail || detail; } catch {}
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export const API = {
  meta: () => request('/api/meta'),
  health: () => request('/api/health'),
  slos: () => request('/api/slos'),
  slo: (id) => request(`/api/slos/${encodeURIComponent(id)}`),
  snapshots: (sloId) => request('/api/snapshots', { params: { slo_id: sloId } }),
  services: () => request('/api/services'),
  service: (id) => request(`/api/services/${encodeURIComponent(id)}`),
  incidents: () => request('/api/incidents'),
  incident: (id) => request(`/api/incidents/${encodeURIComponent(id)}`),
  followups: () => request('/api/followups'),
  followup: (id) => request(`/api/followups/${encodeURIComponent(id)}`),
  reviewers: () => request('/api/reviewers'),
  governanceHistory: (subjectId, limit = 200) => request('/api/governance-history', { params: { subject_id: subjectId, limit } }),
  createFollowup: (body) => request('/api/followups', { method: 'POST', body }),
  recordSpecialistEvidence: (id, body) => request(`/api/followups/${encodeURIComponent(id)}/specialist-evidence`, { method: 'POST', body }),
  recordReview: (id, body) => request(`/api/followups/${encodeURIComponent(id)}/reviews`, { method: 'POST', body }),
};