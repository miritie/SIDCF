/* ============================================
   KPI Widgets
   ============================================ */

import { el } from '../../lib/dom.js';
import { money, percent } from '../../lib/format.js';

/**
 * Create KPI card
 */
export function kpiCard(label, value, options = {}) {
  const {
    change = null,
    color = 'primary',
    format = null
  } = options;

  let formattedValue = value;
  if (format === 'money') {
    formattedValue = money(value);
  } else if (format === 'percent') {
    formattedValue = percent(value);
  }

  const card = el('div', { className: 'kpi-card' }, [
    el('div', { className: 'kpi-label' }, label),
    el('div', { className: 'kpi-value' }, String(formattedValue))
  ]);

  // Apply color
  if (color !== 'primary') {
    card.style.borderLeftColor = `var(--color-${color})`;
  }

  // Add change indicator
  if (change !== null) {
    const changeClass = change >= 0 ? 'positive' : 'negative';
    const changeIcon = change >= 0 ? '↑' : '↓';

    card.appendChild(
      el('div', { className: `kpi-change ${changeClass}` }, [
        el('span', {}, changeIcon),
        el('span', {}, `${Math.abs(change)}%`)
      ])
    );
  }

  return card;
}

/**
 * Create KPI grid
 */
export function kpiGrid(kpis) {
  const cards = kpis.map(kpi =>
    kpiCard(kpi.label, kpi.value, kpi.options || {})
  );

  return el('div', { className: 'kpi-grid' }, cards);
}

export default { kpiCard, kpiGrid };
