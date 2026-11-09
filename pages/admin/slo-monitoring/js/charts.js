/** Hand-written SVG chart components */
import { esc } from './util.js';

const COLORS = {
  good: '#15803D', warn: '#B45309', bad: '#B91C1C', info: '#1D4ED8',
  goodBg: '#DCFCE7', warnBg: '#FEF3C7', badBg: '#FEE2E2', infoBg: '#DBEAFE',
};

const PERIOD_COLORS = {
  '1h': '#1D4ED8',
  '6h': '#3B82F6',
  '24h': '#93C5FD',
};

function svgNs() { return 'http://www.w3.org/2000/svg'; }

function el(tag, attrs = {}, children = []) {
  const e = document.createElementNS(svgNs(), tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  const childList = Array.isArray(children) ? children : [children];
  childList.forEach(c => {
    if (c === null || c === undefined) return;
    if (typeof c === 'string' || typeof c === 'number') {
      e.textContent = String(c);
    } else {
      e.appendChild(c);
    }
  });
  return e;
}

/** Donut chart for status distribution */
export function donutChart(data, title) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  if (!total) return emptyChart('No status distribution data');

  const svg = el('svg', { class: 'donut-svg', viewBox: '0 0 200 200', role: 'img', 'aria-label': title });
  svg.appendChild(el('title', {}, title));

  const cx = 100, cy = 100, r = 72, stroke = 16;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  // Background ring
  svg.appendChild(el('circle', { class: 'donut-bg', cx, cy, r, 'stroke-width': stroke, fill: 'none' }));

  data.forEach(d => {
    if (!d.value) return;
    const pct = d.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const path = el('circle', {
      class: 'donut-segment',
      cx, cy, r,
      'stroke-width': stroke,
      fill: 'none',
      stroke: COLORS[d.variant] || COLORS.info,
      'stroke-dasharray': `${dash} ${gap}`,
      'stroke-dashoffset': -offset * circumference,
      'stroke-linecap': 'round',
      transform: 'rotate(-90 100 100)',
    });
    path.setAttribute('data-value', d.value);
    path.setAttribute('data-label', d.label);
    svg.appendChild(path);
    offset += pct;
  });

  // Center label
  svg.appendChild(el('text', { class: 'donut-label', x: cx, y: cy + 6, 'font-size': '28', 'font-weight': '700', fill: 'var(--text)' }, total.toLocaleString()));

  // Legend
  const legend = document.createElement('div');
  legend.className = 'chart-legend';
  data.forEach(d => {
    const item = document.createElement('div');
    item.className = 'chart-legend-item';
    item.innerHTML = `<span class="chart-legend-swatch" style="background:${COLORS[d.variant] || COLORS.info}"></span><span>${esc(d.label)}: ${d.value}</span>`;
    legend.appendChild(item);
  });

  const wrapper = document.createElement('div');
  wrapper.appendChild(svg);
  wrapper.appendChild(legend);
  return wrapper;
}

/** Horizontal bar chart for error budget remaining */
export function hbarChart(data, title, markerAt = 0) {
  if (!data || !data.length) return emptyChart('No budget data');

  const barHeight = 20, gap = 8, leftPad = 170, rightPad = 60, topPad = 20;
  const height = topPad * 2 + data.length * (barHeight + gap);
  const maxVal = 100;
  const width = 500 - leftPad - rightPad;

  const svg = el('svg', { class: 'hbar-svg', viewBox: `0 0 500 ${height}`, role: 'img', 'aria-label': title });
  svg.appendChild(el('title', {}, title));

  data.forEach((d, i) => {
    const y = topPad + i * (barHeight + gap);
    const val = Math.max(0, Math.min(100, d.value || 0));
    const barW = (val / maxVal) * width;

    // Background
    svg.appendChild(el('rect', { class: 'bar-bg', x: leftPad, y, width, height: barHeight, rx: 3 }));
    // Fill
    svg.appendChild(el('rect', { class: 'bar-fill', x: leftPad, y, width: barW, height: barHeight, rx: 3, fill: COLORS[d.variant] || COLORS.info }));

    // Label with truncation and title tooltip
    const rawLabel = String(d.label || '');
    const cleanLabel = rawLabel.replace(/\s*\([^)]*\)$/, '');
    const truncated = cleanLabel.length > 22 ? cleanLabel.slice(0, 21) + '\u2026' : cleanLabel;

    const labelText = el('text', {
      class: 'bar-label',
      x: leftPad - 8,
      y: y + barHeight / 2 + 4,
      'text-anchor': 'end',
      'dominant-baseline': 'middle',
      'font-size': '11',
    }, truncated);
    labelText.appendChild(el('title', {}, rawLabel));
    svg.appendChild(labelText);

    // Value text
    svg.appendChild(el('text', {
      class: 'bar-value',
      x: leftPad + barW + 4,
      y: y + barHeight / 2 + 4,
      'dominant-baseline': 'middle',
      'font-size': '11',
    }, (d.value ?? 0).toFixed(1) + '%'));
  });

  // Marker line at markerAt%
  if (markerAt >= 0 && markerAt <= 100) {
    const mx = leftPad + (markerAt / maxVal) * width;
    svg.appendChild(el('line', { class: 'marker-line', x1: mx, y1: topPad - 4, x2: mx, y2: height - topPad + 4 }));
  }

  const wrapper = document.createElement('div');
  wrapper.appendChild(svg);
  return wrapper;
}

/** Grouped bar chart for burn rates */
export function groupedBarChart(data, title) {
  const periods = ['1h', '6h', '24h'];
  const validData = (data || []).filter(d => periods.some(p => d.burns && d.burns[p] != null));
  if (!validData.length) return emptyChart('No burn rate data');

  const rawMax = Math.max(...validData.flatMap(d => periods.map(p => d.burns[p] ?? 0)), 1.5);
  const maxVal = Math.max(3.0, Math.ceil(rawMax * 1.15 * 2) / 2);

  const bottomPad = 55, leftPad = 50, topPad = 25, rightPad = 30;
  const barWidth = 14, groupGap = 20;
  const chartHeight = 170;
  const groupWidth = periods.length * barWidth;
  const totalSvgWidth = Math.max(380, leftPad + validData.length * (groupWidth + groupGap) + rightPad);
  const totalSvgHeight = topPad + chartHeight + bottomPad;

  const svg = el('svg', { class: 'gbar-svg', viewBox: `0 0 ${totalSvgWidth} ${totalSvgHeight}`, role: 'img', 'aria-label': title });
  svg.appendChild(el('title', {}, title));

  // Y axis
  svg.appendChild(el('line', { x1: leftPad, y1: topPad, x2: leftPad, y2: topPad + chartHeight, stroke: 'var(--border)', 'stroke-width': 1 }));

  // Y step calculation
  const ySteps = [0];
  const stepCount = 4;
  for (let i = 1; i <= stepCount; i++) {
    ySteps.push((maxVal / stepCount) * i);
  }

  ySteps.forEach(v => {
    const y = topPad + chartHeight - (v / maxVal) * chartHeight;
    svg.appendChild(el('line', { x1: leftPad - 4, y1: y, x2: leftPad, y2: y, stroke: 'var(--border)', 'stroke-width': 1 }));
    svg.appendChild(el('text', { class: 'y-label', x: leftPad - 8, y: y + 4, 'text-anchor': 'end', 'font-size': '10' }, v.toFixed(1) + 'x'));
  });

  // Reference line at 1.0x (Red)
  const refY = topPad + chartHeight - (1.0 / maxVal) * chartHeight;
  svg.appendChild(el('line', {
    class: 'ref-line',
    x1: leftPad,
    y1: refY,
    x2: totalSvgWidth - rightPad,
    y2: refY,
    stroke: '#DC2626',
    'stroke-width': '1.5',
    'stroke-dasharray': '4 3',
  }));
  svg.appendChild(el('text', {
    x: totalSvgWidth - rightPad,
    y: refY - 4,
    'text-anchor': 'end',
    fill: '#DC2626',
    'font-size': '10',
    'font-weight': '600',
  }, '1.0x budget pace'));

  // Bars
  validData.forEach((d, si) => {
    const groupX = leftPad + 10 + si * (groupWidth + groupGap);
    periods.forEach((p, pi) => {
      const val = d.burns[p];
      if (val == null) return;
      const x = groupX + pi * barWidth;
      const h = Math.max(2, (val / maxVal) * chartHeight);
      const y = topPad + chartHeight - h;

      const rect = el('rect', {
        class: 'bar',
        x,
        y,
        width: barWidth - 2,
        height: h,
        fill: PERIOD_COLORS[p],
        rx: 2,
      });
      rect.setAttribute('data-slo', d.slo);
      rect.setAttribute('data-period', p);
      rect.setAttribute('data-value', val.toFixed(2));
      rect.appendChild(el('title', {}, `${d.slo} (${p}): ${val.toFixed(2)}x`));
      svg.appendChild(rect);
    });

    // SLO label truncated and rotated
    const sloClean = String(d.slo || '').replace(/\s*\([^)]*\)$/, '');
    const sloShort = sloClean.length > 14 ? sloClean.slice(0, 13) + '\u2026' : sloClean;
    const labelCenterX = groupX + groupWidth / 2;
    const labelY = topPad + chartHeight + 14;

    const labelText = el('text', {
      class: 'group-label',
      x: labelCenterX,
      y: labelY,
      'text-anchor': 'end',
      'font-size': '10',
      transform: `rotate(-30 ${labelCenterX} ${labelY})`,
    }, sloShort);
    labelText.appendChild(el('title', {}, d.slo));
    svg.appendChild(labelText);
  });

  // Legend matching period colors
  const legend = document.createElement('div');
  legend.className = 'chart-legend';
  periods.forEach(p => {
    const item = document.createElement('div');
    item.className = 'chart-legend-item';
    item.innerHTML = `<span class="chart-legend-swatch" style="background:${PERIOD_COLORS[p]}"></span><span>${p} burn</span>`;
    legend.appendChild(item);
  });

  const wrapper = document.createElement('div');
  wrapper.appendChild(svg);
  wrapper.appendChild(legend);
  return wrapper;
}

/** Stacked bar chart for follow-up status */
export function stackedBarChart(data, title) {
  const total = (data || []).reduce((s, d) => s + (d.count || 0), 0);
  if (!total) return emptyChart('No follow-up status data');

  const leftPad = 20, rightPad = 20, topPad = 25, barH = 34;
  const svgWidth = 500;
  const width = svgWidth - leftPad - rightPad;

  const svg = el('svg', { class: 'sbar-svg', viewBox: `0 0 ${svgWidth} 100`, role: 'img', 'aria-label': title });
  svg.appendChild(el('title', {}, title));

  let x = leftPad;
  data.forEach(d => {
    if (!d.count) return;
    const w = (d.count / total) * width;
    const rect = el('rect', { class: 'segment', x, y: topPad, width: w, height: barH, fill: COLORS[d.variant] || COLORS.info });
    rect.appendChild(el('title', {}, `${d.status}: ${d.count}`));
    svg.appendChild(rect);
    if (w > 28) {
      svg.appendChild(el('text', {
        x: x + w / 2,
        y: topPad + barH / 2 + 4,
        'text-anchor': 'middle',
        fill: '#FFFFFF',
        'font-weight': '700',
        'font-size': '12',
      }, String(d.count)));
    }
    x += w;
  });

  // Legend
  const legend = document.createElement('div');
  legend.className = 'chart-legend';
  data.forEach(d => {
    const item = document.createElement('div');
    item.className = 'chart-legend-item';
    item.innerHTML = `<span class="chart-legend-swatch" style="background:${COLORS[d.variant] || COLORS.info}"></span><span>${esc(d.status)}: ${d.count}</span>`;
    legend.appendChild(item);
  });

  const wrapper = document.createElement('div');
  wrapper.appendChild(svg);
  wrapper.appendChild(legend);
  return wrapper;
}

/** Gauge chart for error budget */
export function gaugeChart(pct, title) {
  const p = Math.max(0, Math.min(100, pct ?? 0));
  let variant = 'good';
  if (p <= 10) variant = 'bad';
  else if (p <= 30) variant = 'warn';

  const svg = el('svg', { class: 'gauge-svg', viewBox: '0 0 160 100', role: 'img', 'aria-label': title });
  svg.appendChild(el('title', {}, title));

  const cx = 80, cy = 90, r = 55, stroke = 14;
  const circumference = Math.PI * r;
  const dash = (p / 100) * circumference;

  // Background arc
  svg.appendChild(el('path', { class: 'gauge-bg', d: `M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`, 'stroke-width': stroke, fill: 'none' }));

  // Fill arc
  const path = el('path', {
    class: 'gauge-fill',
    d: `M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`,
    'stroke-width': stroke,
    fill: 'none',
    stroke: COLORS[variant],
    'stroke-dasharray': `${dash} ${circumference - dash}`,
    'stroke-dashoffset': 0,
    'stroke-linecap': 'round',
  });
  svg.appendChild(path);

  // Label
  svg.appendChild(el('text', { class: 'gauge-label', x: cx, y: cy - 10, 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, p.toFixed(1) + '%'));
  svg.appendChild(el('text', { class: 'gauge-sub', x: cx, y: cy + 18, 'text-anchor': 'middle' }, 'Budget Remaining'));
  return svg;
}

function emptyChart(msg) {
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.style.minHeight = '140px';
  div.textContent = msg;
  return div;
}
