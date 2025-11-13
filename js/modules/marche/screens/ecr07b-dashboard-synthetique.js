/* ============================================
   ECR07B - Tableau de Bord Synthétique
   Focus sur les indicateurs stratégiques
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import DashboardCalculations from '../../../services/dashboard-calculations.js';
import { barChart } from '../../../ui/widgets/bar-chart.js';
import { pieChart } from '../../../ui/widgets/pie-chart.js';
import { dataTable } from '../../../ui/widgets/table.js';
import { money, percent } from '../../../lib/format.js';

export async function renderDashboardSynthetique(container, filters = {}) {
  const operations = await dataService.getAll(ENTITIES.OPERATION);
  const avenants = await dataService.getAll(ENTITIES.AVENANT);
  const rulesConfig = dataService.getRulesConfig();

  const kpis = DashboardCalculations.calculateGlobalKPIs(operations, avenants, [], rulesConfig);
  const conformiteStats = DashboardCalculations.calculateConformiteStats(operations, avenants, rulesConfig);
  const topMarches = DashboardCalculations.getTopMarches(operations, 10);
  const byUnite = DashboardCalculations.groupByUnite(operations);

  const content = el('div', { className: 'dashboard-synthetique' }, [
    // Indicateurs financiers globaux
    el('div', { className: 'card', style: 'margin-bottom: 24px;' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Indicateurs Financiers Globaux')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', {
          style: 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;'
        }, [
          createFinancialIndicator('Budget Prévisionnel', money(kpis.budgetPrevu)),
          createFinancialIndicator('Budget Actuel', money(kpis.budgetActuel)),
          createFinancialIndicator('Taux Exécution', `${kpis.tauxExecutionGlobal}%`)
        ])
      ])
    ]),

    // Top 10 Marchés
    el('div', { className: 'card', style: 'margin-bottom: 24px;' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Top 10 Marchés par Montant')
      ]),
      el('div', { className: 'card-body' }, [
        dataTable(
          [
            { key: 'objet', label: 'Objet' },
            { key: 'unite', label: 'UO' },
            {
              key: 'montantActuel',
              label: 'Montant',
              render: (v, row) => money(v || row.montantPrevisionnel)
            },
            { key: 'etat', label: 'État' }
          ],
          topMarches,
          { striped: true }
        )
      ])
    ]),

    // Répartition par Unité
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Répartition par Unité Administrative')
      ]),
      el('div', { className: 'card-body' }, [
        barChart(
          Object.entries(byUnite)
            .sort((a, b) => b[1].montant - a[1].montant)
            .slice(0, 10)
            .map(([unite, data]) => ({
              label: unite,
              value: data.montant,
              color: '#3B82F6'
            })),
          { orientation: 'horizontal', height: 300, showValues: false }
        )
      ])
    ])
  ]);

  mount(container, content);
}

function createFinancialIndicator(label, value) {
  return el('div', {
    className: 'financial-indicator',
    style: `
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      color: white;
      text-align: center;
    `
  }, [
    el('div', { style: 'font-size: 13px; opacity: 0.9; margin-bottom: 8px;' }, label),
    el('div', { style: 'font-size: 24px; font-weight: bold;' }, value)
  ]);
}

export default { renderDashboardSynthetique };
