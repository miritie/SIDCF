/* ============================================
   Timeline Chart Widget
   Graphique de timeline (Gantt-like) pour avancement temporel
   ============================================ */

import { el } from '../../lib/dom.js';
import { stackedBarChart } from './bar-chart.js';

/**
 * Créer un graphique de timeline d'avancement
 * @param {Object} data - Données temporelles
 * @param {Object} options - Options
 * @returns {HTMLElement}
 */
export function timelineChart(data, options = {}) {
  const {
    dureeInitiale = 0,
    dureeAvenants = 0,
    dureeEcoulee = 0,
    dureeTotale = 0,
    showLegend = true
  } = data;

  const { height = 50 } = options;

  // Calculer les pourcentages
  const total = dureeTotale || (dureeInitiale + dureeAvenants);
  const pctInitiale = total > 0 ? (dureeInitiale / total) * 100 : 0;
  const pctAvenants = total > 0 ? (dureeAvenants / total) * 100 : 0;
  const pctEcoulee = total > 0 ? (dureeEcoulee / total) * 100 : 0;
  const pctRestant = Math.max(0, 100 - pctEcoulee);

  const segments = [
    {
      label: 'Temps écoulé',
      value: dureeEcoulee,
      percentage: pctEcoulee,
      color: '#22C55E'
    },
    {
      label: 'Temps restant',
      value: total - dureeEcoulee,
      percentage: pctRestant,
      color: '#E5E7EB'
    }
  ];

  const chart = stackedBarChart(segments, { height, showLabels: false });

  const legend = showLegend ? el('div', {
    className: 'timeline-legend',
    style: 'display: flex; gap: 16px; margin-top: 12px; font-size: 13px;'
  }, [
    createLegendItem('Durée initiale', `${dureeInitiale} jours`, '#3B82F6'),
    createLegendItem('Avenants (délais)', `${dureeAvenants} jours`, '#F59E0B'),
    createLegendItem('Durée totale', `${total} jours`, '#6B7280'),
    createLegendItem('Temps écoulé', `${dureeEcoulee} jours (${pctEcoulee.toFixed(1)}%)`, '#22C55E')
  ]) : null;

  return el('div', { className: 'timeline-chart' }, [
    el('div', { style: 'margin-bottom: 8px; font-weight: 600; color: #1F2937;' },
      'Avancement Temporel'),
    chart,
    legend
  ].filter(Boolean));
}

/**
 * Créer un item de légende
 */
function createLegendItem(label, value, color) {
  return el('div', { style: 'display: flex; align-items: center;' }, [
    el('div', {
      style: `
        width: 12px;
        height: 12px;
        background-color: ${color};
        border-radius: 2px;
        margin-right: 6px;
      `
    }),
    el('span', { style: 'color: #4B5563;' }, `${label}: `),
    el('strong', { style: 'margin-left: 4px;' }, value)
  ]);
}

/**
 * Timeline financière (similaire mais pour montants)
 * @param {Object} data - Données financières
 * @returns {HTMLElement}
 */
export function financialTimeline(data) {
  const {
    montantBase = 0,
    montantAvenants = 0,
    cumulDecomptes = 0,
    resteAExecuter = 0
  } = data;

  const montantTotal = montantBase + montantAvenants;
  const pctBase = montantTotal > 0 ? (montantBase / montantTotal) * 100 : 0;
  const pctAvenants = montantTotal > 0 ? (montantAvenants / montantTotal) * 100 : 0;
  const pctExecute = montantTotal > 0 ? (cumulDecomptes / montantTotal) * 100 : 0;

  const segments = [
    {
      label: 'Exécuté',
      value: cumulDecomptes,
      percentage: pctExecute,
      color: '#22C55E'
    },
    {
      label: 'Reste à exécuter',
      value: resteAExecuter,
      percentage: 100 - pctExecute,
      color: '#E5E7EB'
    }
  ];

  const chart = stackedBarChart(segments, { height: 50, showLabels: false });

  const legend = el('div', {
    className: 'financial-timeline-legend',
    style: 'display: flex; gap: 16px; margin-top: 12px; font-size: 13px;'
  }, [
    createLegendItem('Montant Base+Avenants', `${montantTotal.toLocaleString('fr-FR')} F CFA`, '#3B82F6'),
    createLegendItem('Décomptes visés', `${cumulDecomptes.toLocaleString('fr-FR')} F CFA (${pctExecute.toFixed(1)}%)`, '#22C55E'),
    createLegendItem('Reste à exécuter', `${resteAExecuter.toLocaleString('fr-FR')} F CFA`, '#E5E7EB')
  ]);

  return el('div', { className: 'financial-timeline' }, [
    el('div', { style: 'margin-bottom: 8px; font-weight: 600; color: #1F2937;' },
      'Avancement Financier'),
    chart,
    legend
  ]);
}

export default { timelineChart, financialTimeline };
