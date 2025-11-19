/* ============================================
   ECR07 - Dashboard Principal (Version 2.0 - One Page)
   Vue unique scrollable sans onglets internes
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
import { advancedFilters } from '../../../ui/widgets/advanced-filters.js';
import { marcheCardGrid } from '../../../ui/widgets/marche-card.js';
import { money, date as formatDate } from '../../../lib/format.js';

/**
 * Rendu du dashboard principal (version one-page)
 */
export async function renderDashboard(params) {
  const page = el('div', { className: 'page dashboard-page' }, [
    el('div', { className: 'loading', style: 'text-align: center; padding: 40px;' },
      'Chargement du dashboard...')
  ]);

  mount('#app', page);

  try {
    // Charger toutes les données
    const [operations, avenants, decomptes, ordresService, visasCF, anos] = await Promise.all([
      dataService.query(ENTITIES.OPERATION),
      dataService.query(ENTITIES.AVENANT),
      dataService.query(ENTITIES.DECOMPTE),
      dataService.query(ENTITIES.ORDRE_SERVICE),
      dataService.query(ENTITIES.VISA_CF),
      dataService.query(ENTITIES.ANO)
    ]);

    const rulesConfig = dataService.getRulesConfig();
    const registries = dataService.getAllRegistries();

    // Calculer les KPIs et données
    const kpis = DashboardCalculations.calculateGlobalKPIs(operations, avenants, decomptes, rulesConfig);
    const alerts = DashboardCalculations.detectAlerts(operations, avenants, ordresService, anos, visasCF, rulesConfig);
    const chartDataEtats = DashboardCalculations.prepareChartDataEtats(operations);
    const chartDataFinancement = DashboardCalculations.prepareChartDataFinancement(operations);
    const topMarches = DashboardCalculations.getTopMarches(operations, 5);
    const recentOps = DashboardCalculations.getRecentOperations(operations, 5);

    // Construire le contenu
    const content = el('div', { className: 'dashboard-one-page' }, [
      // Header avec titre et actions
      renderHeader(operations.length, kpis),

      // Section 1: KPIs Principaux (toujours visible)
      renderKPISection(kpis),

      // Section 2: Vue d'ensemble en 2 colonnes
      el('div', {
        className: 'dashboard-overview',
        style: 'display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 24px;'
      }, [
        // Colonne gauche: Graphiques
        el('div', {}, [
          renderRepartitionEtats(chartDataEtats),
          renderRepartitionFinancement(chartDataFinancement)
        ]),

        // Colonne droite: Alertes
        renderAlertes(alerts, operations)
      ]),

      // Section 3: Top Marchés et Activités Récentes (2 colonnes)
      el('div', {
        style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;'
      }, [
        renderTopMarches(topMarches),
        renderActivitesRecentes(recentOps)
      ]),

      // Section 4: Recherche et Liste Complète (pliable)
      renderListeMarches(operations, registries),

      // Section 5: Répartition par type de marché
      renderRepartitionTypes(operations)
    ]);

    mount('#app', el('div', { className: 'page' }, [content]));

  } catch (error) {
    console.error('Erreur chargement dashboard:', error);
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, [
        el('div', { className: 'alert-icon' }, '⛔'),
        el('div', { className: 'alert-content' }, [
          el('div', { className: 'alert-title' }, 'Erreur de chargement'),
          el('div', { className: 'alert-message' }, error.message)
        ])
      ])
    ]));
  }
}

/**
 * Header avec titre et actions rapides
 */
function renderHeader(totalOps, kpis) {
  return el('div', {
    className: 'page-header',
    style: `
      background: linear-gradient(135deg, #0f5132 0%, #198754 100%);
      color: white;
      padding: 32px 24px;
      border-radius: 12px;
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    `
  }, [
    el('div', { style: 'display: flex; justify-content: space-between; align-items: center;' }, [
      el('div', {}, [
        el('h1', {
          className: 'page-title',
          style: 'margin: 0 0 8px 0; font-size: 32px;'
        }, '📊 Dashboard SIDCF'),
        el('p', {
          className: 'page-subtitle',
          style: 'margin: 0; opacity: 0.9; font-size: 16px;'
        }, `Pilotage de ${totalOps} marchés publics`)
      ]),
      el('div', { style: 'display: flex; gap: 12px;' }, [
        el('button', {
          className: 'btn btn-secondary',
          style: 'background: white; color: #0f5132;',
          onclick: () => router.navigate('/ppm-list')
        }, '📋 PPM'),
        el('button', {
          className: 'btn btn-secondary',
          style: 'background: white; color: #0f5132;',
          onclick: () => router.navigate('/ppm-import')
        }, '📥 Import')
      ])
    ])
  ]);
}

/**
 * Section KPIs
 */
function renderKPISection(kpis) {
  const kpiData = [
    {
      label: 'Total Marchés',
      value: kpis.totalMarches,
      options: { color: 'primary', icon: '📦' }
    },
    {
      label: 'En Exécution',
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
      label: 'Taux Exécution',
      value: `${kpis.tauxExecutionGlobal}%`,
      options: {
        color: kpis.tauxExecutionGlobal > 70 ? 'success' : 'warning',
        icon: '📊'
      }
    },
    {
      label: 'Clôturés',
      value: kpis.clotures,
      options: { color: 'secondary', icon: '✅' }
    }
  ];

  return el('div', { style: 'margin-bottom: 32px;' }, [
    kpiGrid(kpiData)
  ]);
}

/**
 * Répartition par états
 */
function renderRepartitionEtats(chartData) {
  return el('div', {
    className: 'card',
    style: 'margin-bottom: 24px;'
  }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, 'Répartition par État')
    ]),
    el('div', { className: 'card-body' }, [
      barChart(chartData, {
        orientation: 'horizontal',
        height: 250,
        showValues: true
      }),
      // Badges
      el('div', { style: 'margin-top: 16px; display: flex; flex-wrap: wrap; gap: 8px;' },
        chartData.map(item =>
          el('span', {
            className: 'badge',
            style: `background-color: ${item.color}; color: white; padding: 6px 12px;`
          }, `${item.label}: ${item.value}`)
        )
      )
    ])
  ]);
}

/**
 * Répartition par financement
 */
function renderRepartitionFinancement(chartData) {
  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, 'Répartition par Source de Financement')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { style: 'display: flex; justify-content: center;' }, [
        pieChart(chartData, {
          type: 'donut',
          size: 220,
          showLegend: true,
          showValues: true
        })
      ])
    ])
  ]);
}

/**
 * Section alertes
 */
function renderAlertes(alerts, operations) {
  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, 'Alertes Critiques')
    ]),
    el('div', { className: 'card-body' }, [
      alertBlock(alerts, {
        maxAlerts: 10,
        onAlertClick: (alert) => {
          if (alert.operationId) {
            router.navigate('/fiche-marche', { idOperation: alert.operationId });
          }
        }
      })
    ])
  ]);
}

/**
 * Top marchés
 */
function renderTopMarches(topMarches) {
  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, 'Top 5 Marchés')
    ]),
    el('div', { className: 'card-body' }, [
      topMarches.length > 0 ? dataTable(
        [
          { key: 'objet', label: 'Objet', render: (v) => v?.substring(0, 50) + '...' || 'N/A' },
          {
            key: 'montantActuel',
            label: 'Montant',
            render: (v, row) => money(v || row.montantPrevisionnel)
          }
        ],
        topMarches,
        {
          striped: true,
          onRowClick: (row) => router.navigate('/fiche-marche', { idOperation: row.id })
        }
      ) : el('p', { style: 'text-align: center; color: #6B7280;' }, 'Aucun marché')
    ])
  ]);
}

/**
 * Activités récentes
 */
function renderActivitesRecentes(recentOps) {
  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, 'Activités Récentes')
    ]),
    el('div', { className: 'card-body' }, [
      recentOps.length > 0 ? dataTable(
        [
          { key: 'updatedAt', label: 'Date', render: (v) => formatDate(v) },
          { key: 'objet', label: 'Marché', render: (v) => v?.substring(0, 40) + '...' || 'N/A' },
          { key: 'etat', label: 'État' }
        ],
        recentOps,
        {
          striped: true,
          onRowClick: (row) => router.navigate('/fiche-marche', { idOperation: row.id })
        }
      ) : el('p', { style: 'text-align: center; color: #6B7280;' }, 'Aucune activité')
    ])
  ]);
}

/**
 * Liste des marchés (section pliable)
 */
function renderListeMarches(operations, registries) {
  let isExpanded = false;
  let filteredOps = [...operations];

  const toggleBtn = el('button', {
    className: 'btn btn-secondary',
    onclick: () => {
      isExpanded = !isExpanded;
      contentDiv.style.display = isExpanded ? 'block' : 'none';
      toggleBtn.textContent = isExpanded ? '▼ Masquer la liste complète' : '▶ Afficher la liste complète';
    }
  }, '▶ Afficher la liste complète');

  const contentDiv = el('div', { style: 'display: none; margin-top: 16px;' }, [
    // Filtres
    advancedFilters({
      filters: [
        {
          key: 'unite',
          label: 'Unité',
          options: [...new Set(operations.map(o => o.unite))].filter(Boolean)
        },
        {
          key: 'etat',
          label: 'État',
          options: ['PLANIFIE', 'EN_EXEC', 'CLOS']
        }
      ],
      showSearch: true
    }, (filters) => {
      filteredOps = operations.filter(op => {
        if (filters.unite && op.unite !== filters.unite) return false;
        if (filters.etat && op.etat !== filters.etat) return false;
        if (filters.search) {
          return op.objet?.toLowerCase().includes(filters.search.toLowerCase());
        }
        return true;
      });

      // Rafraîchir la grille
      const newGrid = marcheCardGrid(filteredOps, { columns: 3, compact: true });
      gridContainer.innerHTML = '';
      gridContainer.appendChild(newGrid);
    }),

    // Grille
    el('div', { style: 'margin-top: 16px;' }, [
      el('strong', {}, `${operations.length} marché(s)`)
    ])
  ]);

  const gridContainer = el('div', { style: 'margin-top: 16px;' });
  contentDiv.appendChild(gridContainer);
  gridContainer.appendChild(marcheCardGrid(operations, { columns: 3, compact: true }));

  return el('div', {
    className: 'card',
    style: 'margin-top: 24px;'
  }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, 'Liste Complète des Marchés'),
      toggleBtn
    ]),
    el('div', { className: 'card-body' }, [contentDiv])
  ]);
}

/**
 * Répartition par type de marché
 */
function renderRepartitionTypes(operations) {
  const typeData = {};

  operations.forEach(op => {
    const type = op.typeMarche || 'Non spécifié';
    if (!typeData[type]) {
      typeData[type] = { count: 0, montant: 0 };
    }
    typeData[type].count++;
    typeData[type].montant += op.montantActuel || op.montantPrevisionnel || 0;
  });

  const chartData = Object.entries(typeData)
    .sort((a, b) => b[1].montant - a[1].montant)
    .map(([type, data]) => ({
      label: type,
      value: data.count,
      color: getTypeColor(type)
    }));

  return el('div', {
    className: 'card',
    style: 'margin-top: 24px;'
  }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, 'Répartition par Type de Marché')
    ]),
    el('div', { className: 'card-body' }, [
      barChart(chartData, {
        orientation: 'horizontal',
        height: 200,
        showValues: true
      })
    ])
  ]);
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

export default renderDashboard;
