/* ============================================
   Bar Chart Widget
   Graphique en barres (horizontales ou verticales)
   ============================================ */

import { el } from '../../lib/dom.js';

/**
 * Créer un graphique en barres
 * @param {Array} data - Données [{label, value, color?}]
 * @param {Object} options - Options {orientation: 'horizontal'|'vertical', height, showValues, showLegend, maxValue}
 * @returns {HTMLElement}
 */
export function barChart(data, options = {}) {
  const {
    orientation = 'vertical',
    height = 300,
    showValues = true,
    showLegend = false,
    maxValue = null,
    barWidth = 40
  } = options;

  if (!data || data.length === 0) {
    return el('div', { className: 'chart-empty' }, 'Aucune donnée à afficher');
  }

  const max = maxValue || Math.max(...data.map(d => d.value));

  if (orientation === 'horizontal') {
    return createHorizontalBarChart(data, max, { height, showValues, showLegend });
  } else {
    return createVerticalBarChart(data, max, { height, showValues, showLegend, barWidth });
  }
}

/**
 * Créer un graphique en barres horizontales
 */
function createHorizontalBarChart(data, max, options) {
  const { height, showValues } = options;
  const barHeight = 30;
  const gap = 10;
  const totalHeight = (data.length * (barHeight + gap)) + 40;

  const bars = data.map((item, index) => {
    const percentage = max > 0 ? (item.value / max) * 100 : 0;
    const color = item.color || '#3B82F6';

    return el('div', {
      className: 'bar-chart-row',
      style: `margin-bottom: ${gap}px;`
    }, [
      el('div', {
        className: 'bar-chart-label',
        style: 'width: 150px; font-size: 13px; padding-right: 10px; text-align: right;'
      }, item.label),
      el('div', { className: 'bar-chart-bar-container', style: 'flex: 1; position: relative;' }, [
        el('div', {
          className: 'bar-chart-bar',
          style: `
            width: ${percentage}%;
            height: ${barHeight}px;
            background-color: ${color};
            border-radius: 4px;
            transition: width 0.3s ease;
            position: relative;
          `
        }, showValues ? [
          el('span', {
            style: `
              position: absolute;
              right: 8px;
              top: 50%;
              transform: translateY(-50%);
              color: white;
              font-size: 12px;
              font-weight: bold;
            `
          }, String(item.value))
        ] : [])
      ])
    ]);
  });

  return el('div', {
    className: 'bar-chart bar-chart-horizontal',
    style: `height: ${totalHeight}px;`
  }, bars);
}

/**
 * Créer un graphique en barres verticales
 */
function createVerticalBarChart(data, max, options) {
  const { height, showValues, barWidth } = options;

  const bars = data.map(item => {
    const percentage = max > 0 ? (item.value / max) * 100 : 0;
    const barHeightPx = (height - 60) * (percentage / 100);
    const color = item.color || '#3B82F6';

    return el('div', {
      className: 'bar-chart-column',
      style: `
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        margin: 0 8px;
        min-width: ${barWidth}px;
      `
    }, [
      showValues ? el('div', {
        className: 'bar-chart-value',
        style: 'font-size: 12px; font-weight: bold; margin-bottom: 4px; height: 20px;'
      }, String(item.value)) : el('div', { style: 'height: 20px;' }),

      el('div', {
        className: 'bar-chart-bar',
        style: `
          width: ${barWidth}px;
          height: ${barHeightPx}px;
          background-color: ${color};
          border-radius: 4px 4px 0 0;
          transition: height 0.3s ease;
          align-self: flex-end;
        `
      }),

      el('div', {
        className: 'bar-chart-label',
        style: `
          font-size: 11px;
          margin-top: 8px;
          text-align: center;
          max-width: ${barWidth + 20}px;
          word-wrap: break-word;
        `
      }, item.label)
    ]);
  });

  return el('div', {
    className: 'bar-chart bar-chart-vertical',
    style: `
      height: ${height}px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 20px 10px;
    `
  }, bars);
}

/**
 * Créer un graphique en barres empilées horizontales (pour timeline)
 * @param {Array} segments - Segments [{label, value, color, percentage}]
 * @param {Object} options - Options
 * @returns {HTMLElement}
 */
export function stackedBarChart(segments, options = {}) {
  const { height = 40, showLabels = true } = options;

  const bars = segments.map(segment => {
    return el('div', {
      className: 'stacked-bar-segment',
      style: `
        width: ${segment.percentage || 0}%;
        height: ${height}px;
        background-color: ${segment.color};
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
      `,
      title: `${segment.label}: ${segment.value}`
    }, showLabels && segment.percentage > 10 ? segment.label : []);
  });

  return el('div', {
    className: 'stacked-bar-chart',
    style: `
      display: flex;
      width: 100%;
      height: ${height}px;
      border-radius: 4px;
      overflow: hidden;
    `
  }, bars);
}

export default { barChart, stackedBarChart };
