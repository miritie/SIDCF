/* ============================================
   Pie Chart Widget
   Graphique circulaire / Donut
   ============================================ */

import { el } from '../../lib/dom.js';
import { money, percent } from '../../lib/format.js';

/**
 * Créer un graphique circulaire
 * @param {Array} data - Données [{label, value, color, percentage?}]
 * @param {Object} options - Options {type: 'pie'|'donut', size, showPercentages, showLegend, showValues}
 * @returns {HTMLElement}
 */
export function pieChart(data, options = {}) {
  const {
    type = 'donut',
    size = 200,
    showPercentages = true,
    showLegend = true,
    showValues = false,
    centerText = null
  } = options;

  if (!data || data.length === 0) {
    return el('div', { className: 'chart-empty' }, 'Aucune donnée à afficher');
  }

  // Calculer le total et les pourcentages
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const dataWithPercentages = data.map(d => ({
    ...d,
    percentage: total > 0 ? (d.value / total) * 100 : 0
  }));

  const chart = type === 'donut'
    ? createDonutChart(dataWithPercentages, size, centerText)
    : createPieChartSVG(dataWithPercentages, size);

  const legend = showLegend
    ? createLegend(dataWithPercentages, { showPercentages, showValues })
    : null;

  return el('div', {
    className: 'pie-chart-container',
    style: 'display: flex; align-items: center; gap: 20px;'
  }, [
    chart,
    legend
  ].filter(Boolean));
}

/**
 * Créer un graphique donut (CSS-based)
 */
function createDonutChart(data, size, centerText) {
  const radius = size / 2;
  const strokeWidth = size * 0.2; // 20% du diamètre
  const innerRadius = radius - strokeWidth;
  const circumference = 2 * Math.PI * (radius - strokeWidth / 2);

  let currentOffset = 0;

  const segments = data.map((item, index) => {
    const segmentLength = (item.percentage / 100) * circumference;
    const segment = el('circle', {
      cx: radius,
      cy: radius,
      r: radius - strokeWidth / 2,
      fill: 'transparent',
      stroke: item.color || '#3B82F6',
      'stroke-width': strokeWidth,
      'stroke-dasharray': `${segmentLength} ${circumference}`,
      'stroke-dashoffset': -currentOffset,
      style: 'transition: stroke-dashoffset 0.3s ease;'
    });

    currentOffset += segmentLength;
    return segment;
  });

  const centerTextEl = centerText ? el('text', {
    x: radius,
    y: radius,
    'text-anchor': 'middle',
    'dominant-baseline': 'middle',
    style: 'font-size: 18px; font-weight: bold; fill: #333;'
  }, centerText) : null;

  const svg = el('svg', {
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
    style: 'transform: rotate(-90deg);'
  }, [...segments, centerTextEl].filter(Boolean));

  return el('div', { className: 'donut-chart', style: 'position: relative;' }, [svg]);
}

/**
 * Créer un graphique pie (SVG path-based)
 */
function createPieChartSVG(data, size) {
  const radius = size / 2;
  const center = { x: radius, y: radius };

  let currentAngle = -90; // Commencer en haut

  const slices = data.map(item => {
    const angle = (item.percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const start = polarToCartesian(center.x, center.y, radius, startAngle);
    const end = polarToCartesian(center.x, center.y, radius, endAngle);
    const largeArc = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${center.x} ${center.y}`,
      `L ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
      'Z'
    ].join(' ');

    currentAngle += angle;

    return el('path', {
      d: pathData,
      fill: item.color || '#3B82F6',
      stroke: 'white',
      'stroke-width': 2
    });
  });

  return el('svg', {
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`
  }, slices);
}

/**
 * Créer la légende
 */
function createLegend(data, options) {
  const { showPercentages, showValues } = options;

  const items = data.map(item => {
    const valueText = showValues ? ` - ${money(item.value)}` : '';
    const percentText = showPercentages ? ` (${item.percentage.toFixed(1)}%)` : '';

    return el('div', {
      className: 'legend-item',
      style: 'display: flex; align-items: center; margin-bottom: 8px;'
    }, [
      el('div', {
        className: 'legend-color',
        style: `
          width: 16px;
          height: 16px;
          background-color: ${item.color};
          border-radius: 2px;
          margin-right: 8px;
        `
      }),
      el('div', { className: 'legend-label', style: 'font-size: 13px;' },
        `${item.label}${valueText}${percentText}`)
    ]);
  });

  return el('div', { className: 'pie-chart-legend' }, items);
}

/**
 * Convertir coordonnées polaires en cartésiennes
 */
function polarToCartesian(cx, cy, radius, angle) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians)
  };
}

/**
 * Graphique donut simplifié (pour petits widgets)
 * @param {Number} percentage - Pourcentage (0-100)
 * @param {Object} options - Options {size, color, label}
 * @returns {HTMLElement}
 */
export function simpleDonut(percentage, options = {}) {
  const { size = 100, color = '#22C55E', label = '' } = options;

  return pieChart([
    { label: 'Complété', value: percentage, color },
    { label: 'Reste', value: 100 - percentage, color: '#E5E7EB' }
  ], {
    type: 'donut',
    size,
    showLegend: false,
    centerText: `${percentage.toFixed(0)}%`
  });
}

export default { pieChart, simpleDonut };
