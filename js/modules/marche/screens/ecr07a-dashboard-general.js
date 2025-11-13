/* ============================================
   ECR07A - Tableau de Bord Général
   Vue d'ensemble complète pour la direction
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import DashboardCalculations from '../../../services/dashboard-calculations.js';
import { kpiGrid } from '../../../ui/widgets/kpis.js';
import { barChart } from '../../../ui/widgets/bar-chart.js';
import { pieChart } from '../../../ui/widgets/pie-chart.js';
import { alertBlock } from '../../../ui/widgets/alert-block.js';
import { dataTable } from '../../../ui/widgets/table.js';
import { money, date as formatDate } from '../../../lib/format.js';

/**
 * Rendu de l'onglet Tableau de Bord Général
 * @param {HTMLElement} container - Container DOM
 * @param {Object} filters - Filtres actifs
 */
export async function renderDashboardGeneral(container, filters = {}) {
  // 1. CHARGER LES DONNÉES
  const operations = await dataService.query(ENTITIES.OPERATION);
  const avenants = await dataService.query(ENTITIES.AVENANT);
  const decomptes = await dataService.query(ENTITIES.DECOMPTE);
  const ordresService = await dataService.query(ENTITIES.ORDRE_SERVICE);
  const visasCF = await dataService.query(ENTITIES.VISA_CF);
  const anos = await dataService.query(ENTITIES.ANO);
  const rulesConfig = dataService.getRulesConfig();

  // 2. CALCULER LES KPIs
  const kpis = DashboardCalculations.calculateGlobalKPIs(
    operations,
    avenants,
    decomptes,
    rulesConfig
  );

  // 3. DÉTECTER LES ALERTES
  const alerts = DashboardCalculations.detectAlerts(
    operations,
    avenants,
    ordresService,
    anos,
    visasCF,
    rulesConfig
  );

  // 4. PRÉPARER LES DONNÉES POUR GRAPHIQUES
  const chartDataEtats = DashboardCalculations.prepareChartDataEtats(operations);
  const chartDataFinancement = DashboardCalculations.prepareChartDataFinancement(operations);
  const chartDataTypes = Object.entries(DashboardCalculations.groupByTypeMarche(operations))
    .map(([type, data]) => ({
      label: type,
      value: data.count,
      montant: data.montant,
      color: getTypeColor(type)
    }));

  // 5. DERNIÈRES OPÉRATIONS
  const recentOps = DashboardCalculations.getRecentOperations(operations, 5);

  // 6. CONSTRUIRE L'INTERFACE
  const content = el('div', { className: 'dashboard-general' }, [
    // Bandeau KPIs
    renderKPISection(kpis),

    // Grille 2 colonnes
    el('div', {
      style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;'
    }, [
      // Colonne gauche: Répartition par état
      el('div', { className: 'card' }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, 'Répartition par État')
        ]),
        el('div', { className: 'card-body' }, [
          barChart(chartDataEtats, {
            orientation: 'horizontal',
            height: 300,
            showValues: true
          }),
          renderEtatBadges(chartDataEtats)
        ])
      ]),

      // Colonne droite: Alertes critiques
      el('div', { className: 'card' }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, 'Alertes Critiques')
        ]),
        el('div', { className: 'card-body' }, [
          alertBlock(alerts, {
            maxAlerts: 8,
            onAlertClick: (alert) => {
              if (alert.operationId) {
                router.navigate('/fiche-marche', { idOperation: alert.operationId });
              }
            }
          })
        ])
      ])
    ]),

    // Répartition par source de financement
    el('div', { className: 'card', style: 'margin-bottom: 24px;' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Répartition par Source de Financement')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { style: 'display: flex; justify-content: center;' }, [
          pieChart(chartDataFinancement, {
            type: 'donut',
            size: 250,
            showLegend: true,
            showValues: true
          })
        ])
      ])
    ]),

    // Répartition par type de marché
    el('div', { className: 'card', style: 'margin-bottom: 24px;' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Répartition par Type de Marché')
      ]),
      el('div', { className: 'card-body' }, [
        barChart(chartDataTypes, {
          orientation: 'horizontal',
          height: 200,
          showValues: true
        })
      ])
    ]),

    // Dernières opérations modifiées
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Dernières Opérations Modifiées')
      ]),
      el('div', { className: 'card-body' }, [
        renderRecentOperations(recentOps)
      ])
    ])
  ]);

  mount(container, content);
}

/**
 * Rendu de la section KPIs
 */
function renderKPISection(kpis) {
  const kpiData = [
    {
      label: 'Total Marchés',
      value: kpis.totalMarches,
      options: { color: 'primary', icon: '📦' }
    },
    {
      label: 'En Cours Exécution',
      value: kpis.enCours,
      options: { color: 'info', icon: '⚙️' }
    },
    {
      label: 'Budget Prévisionnel',
      value: money(kpis.budgetPrevu),
      options: { color: 'warning', icon: '💰' }
    },
    {
      label: 'Budget Actuel',
      value: money(kpis.budgetActuel),
      options: { color: 'success', icon: '💵' }
    },
    {
      label: 'Taux Exécution Global',
      value: `${kpis.tauxExecutionGlobal}%`,
      options: { color: kpis.tauxExecutionGlobal > 70 ? 'success' : 'warning', icon: '📊' }
    },
    {
      label: 'Marchés Clôturés',
      value: kpis.clotures,
      options: { color: 'secondary', icon: '✅' }
    }
  ];

  return el('div', { style: 'margin-bottom: 24px;' }, [
    kpiGrid(kpiData)
  ]);
}

/**
 * Rendu des badges d'états
 */
function renderEtatBadges(chartData) {
  const badges = chartData.map(item => {
    return el('span', {
      className: 'badge',
      style: `
        background-color: ${item.color};
        color: white;
        margin: 4px;
        padding: 6px 12px;
        font-size: 13px;
      `
    }, `${item.label}: ${item.value}`);
  });

  return el('div', { style: 'margin-top: 16px; display: flex; flex-wrap: wrap;' }, badges);
}

/**
 * Rendu des dernières opérations
 */
function renderRecentOperations(operations) {
  if (!operations || operations.length === 0) {
    return el('p', { style: 'text-align: center; color: #6B7280;' }, 'Aucune opération récente');
  }

  return dataTable(
    [
      { key: 'updatedAt', label: 'Date', render: (val) => formatDate(val) },
      {
        key: 'objet',
        label: 'Marché',
        render: (val, row) => el('a', {
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            router.navigate('/fiche-marche', { idOperation: row.id });
          },
          style: 'color: #0f5132; text-decoration: underline;'
        }, val || 'Sans objet')
      },
      { key: 'unite', label: 'Unité' },
      {
        key: 'montantActuel',
        label: 'Montant',
        render: (val, row) => money(val || row.montantPrevisionnel || 0)
      },
      {
        key: 'etat',
        label: 'État',
        render: (val) => el('span', { className: `badge badge-${getEtatBadgeClass(val)}` }, val)
      }
    ],
    operations,
    {
      striped: true,
      hover: true
    }
  );
}

/**
 * Obtenir la couleur selon le type de marché
 */
function getTypeColor(type) {
  const colors = {
    'TRAVAUX': '#3B82F6',
    'FOURNITURES': '#10B981',
    'SERVICES': '#F59E0B',
    'PRESTATIONS INTELLECTUELLES': '#8B5CF6'
  };
  return colors[type] || '#6B7280';
}

/**
 * Obtenir la classe de badge selon l'état
 */
function getEtatBadgeClass(etat) {
  const classes = {
    'PLANIFIE': 'primary',
    'EN_PROCEDURE': 'purple',
    'EN_ATTRIBUTION': 'warning',
    'VISE': 'success-light',
    'EN_EXEC': 'success',
    'CLOS': 'secondary',
    'REFUSE': 'error'
  };
  return classes[etat] || 'secondary';
}

export default { renderDashboardGeneral };
