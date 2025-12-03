/* ============================================
   Écran Physico-Financier - Module Investissement
   ============================================
   Axe 4: Croisement avancement physique vs financier
   - Matrice physico-financière par projet
   - Écarts physique/financier
   - Détection des anomalies
   - Aide à la décision CF
   ============================================ */

import { el, mount, qs } from '../../../lib/dom.js';
import { money, percent, abbreviate } from '../../../lib/format.js';
import router from '../../../router.js';
import logger from '../../../lib/logger.js';
import { INV_SIDEBAR_MENU, getCurrentYear, createSidebarMenuItems, getMenuIcon } from '../inv-constants.js';
import { createInvFilters, injectFilterStyles, DEFAULT_FILTERS } from '../components/inv-filters.js';

// Aliases
const formatMontant = (amount, short = false) => short ? abbreviate(amount) : money(amount);
const formatPourcent = (val) => percent(val);

// Mock données physico-financières
const MOCK_PROJETS = [
  {
    id: 'p1',
    code: 'PAPSE-II',
    nom: 'Programme Éducation II',
    bailleur: 'BM',
    // Financier
    montantNotifie: 45000000000,
    montantExecute: 32100000000,
    tauxExecutionFinancier: 71.3,
    // Physique
    nbActivites: 12,
    activitesRealisees: 8,
    tauxAvancementPhysique: 66.7,
    // Écart
    ecartPhysicoFinancier: 4.6,
    situation: 'EQUILIBRE',
    recommandation: 'Maintenir le rythme d\'exécution'
  },
  {
    id: 'p2',
    code: 'PEJEDEC',
    nom: 'Emploi Jeunes',
    bailleur: 'BAD',
    montantNotifie: 28000000000,
    montantExecute: 18900000000,
    tauxExecutionFinancier: 67.5,
    nbActivites: 8,
    activitesRealisees: 4,
    tauxAvancementPhysique: 50.0,
    ecartPhysicoFinancier: 17.5,
    situation: 'SOUS_EXECUTION_PHYSIQUE',
    recommandation: 'Accélérer l\'avancement physique - décaissements rapides sans contrepartie'
  },
  {
    id: 'p3',
    code: 'ProSEB',
    nom: 'Éducation de Base',
    bailleur: 'AFD',
    montantNotifie: 35000000000,
    montantExecute: 28120000000,
    tauxExecutionFinancier: 80.3,
    nbActivites: 10,
    activitesRealisees: 9,
    tauxAvancementPhysique: 90.0,
    ecartPhysicoFinancier: -9.7,
    situation: 'SOUS_EXECUTION_FINANCIERE',
    recommandation: 'Accélérer les décaissements - avancement physique en avance'
  },
  {
    id: 'p4',
    code: 'PASEA',
    nom: 'Eau & Assainissement',
    bailleur: 'BM',
    montantNotifie: 52000000000,
    montantExecute: 38250000000,
    tauxExecutionFinancier: 73.6,
    nbActivites: 15,
    activitesRealisees: 11,
    tauxAvancementPhysique: 73.3,
    ecartPhysicoFinancier: 0.3,
    situation: 'EQUILIBRE',
    recommandation: 'Situation optimale - maintenir'
  },
  {
    id: 'p5',
    code: 'PRICI',
    nom: 'Infrastructures CI',
    bailleur: 'BM',
    montantNotifie: 85000000000,
    montantExecute: 65800000000,
    tauxExecutionFinancier: 77.4,
    nbActivites: 20,
    activitesRealisees: 12,
    tauxAvancementPhysique: 60.0,
    ecartPhysicoFinancier: 17.4,
    situation: 'SOUS_EXECUTION_PHYSIQUE',
    recommandation: 'Alerte - Décaissements élevés vs avancement physique faible'
  },
  {
    id: 'p6',
    code: 'PNACC',
    nom: 'Adaptation Climat',
    bailleur: 'UE',
    montantNotifie: 15000000000,
    montantExecute: 8400000000,
    tauxExecutionFinancier: 56.0,
    nbActivites: 6,
    activitesRealisees: 2,
    tauxAvancementPhysique: 33.3,
    ecartPhysicoFinancier: 22.7,
    situation: 'CRITIQUE',
    recommandation: 'Situation critique - Audit recommandé'
  }
];

// Statistiques globales
const MOCK_STATS = {
  totalProjets: 6,
  equilibre: 2,
  sousExecPhysique: 2,
  sousExecFinancier: 1,
  critique: 1,
  ecartMoyen: 12.0,
  tauxPhysiqueMoyen: 62.2,
  tauxFinancierMoyen: 71.0
};

// Seuils
const SEUILS = {
  ecartAcceptable: 10, // ± 10%
  ecartAlerte: 15,     // ± 15%
  ecartCritique: 20    // > 20%
};

// State
let state = {
  filters: { ...DEFAULT_FILTERS },
  sortField: 'ecartPhysicoFinancier',
  sortDirection: 'desc'
};

/**
 * Render sidebar
 */
function renderInvSidebar(activeRoute) {
  return el('aside', { className: 'sidebar inv-sidebar' }, [
    el('div', { className: 'sidebar-header' }, [
      el('h2', { className: 'sidebar-title' }, 'Investissement'),
      el('button', {
        className: 'btn btn-sm btn-ghost',
        onclick: () => router.navigate('/portal')
      }, 'Portail')
    ]),
    el('nav', { className: 'sidebar-nav' },
      createSidebarMenuItems(el, activeRoute)
    )
  ]);
}

/**
 * Render KPIs
 */
function renderKPIs() {
  const stats = MOCK_STATS;

  return el('div', { className: 'kpi-grid-pf' }, [
    // Situation globale
    el('div', { className: 'kpi-situation' }, [
      el('h3', { className: 'kpi-section-title' }, 'Répartition des situations'),
      el('div', { className: 'situation-bars' }, [
        el('div', { className: 'situation-bar' }, [
          el('div', { className: 'bar-label' }, [
            el('span', { className: 'dot dot-success' }),
            el('span', {}, 'Équilibre')
          ]),
          el('div', { className: 'bar-track' }, [
            el('div', {
              className: 'bar-fill bar-success',
              style: `width: ${(stats.equilibre / stats.totalProjets) * 100}%`
            })
          ]),
          el('div', { className: 'bar-value' }, String(stats.equilibre))
        ]),
        el('div', { className: 'situation-bar' }, [
          el('div', { className: 'bar-label' }, [
            el('span', { className: 'dot dot-warning' }),
            el('span', {}, 'Sous-exec physique')
          ]),
          el('div', { className: 'bar-track' }, [
            el('div', {
              className: 'bar-fill bar-warning',
              style: `width: ${(stats.sousExecPhysique / stats.totalProjets) * 100}%`
            })
          ]),
          el('div', { className: 'bar-value' }, String(stats.sousExecPhysique))
        ]),
        el('div', { className: 'situation-bar' }, [
          el('div', { className: 'bar-label' }, [
            el('span', { className: 'dot dot-info' }),
            el('span', {}, 'Sous-exec financier')
          ]),
          el('div', { className: 'bar-track' }, [
            el('div', {
              className: 'bar-fill bar-info',
              style: `width: ${(stats.sousExecFinancier / stats.totalProjets) * 100}%`
            })
          ]),
          el('div', { className: 'bar-value' }, String(stats.sousExecFinancier))
        ]),
        el('div', { className: 'situation-bar' }, [
          el('div', { className: 'bar-label' }, [
            el('span', { className: 'dot dot-error' }),
            el('span', {}, 'Critique')
          ]),
          el('div', { className: 'bar-track' }, [
            el('div', {
              className: 'bar-fill bar-error',
              style: `width: ${(stats.critique / stats.totalProjets) * 100}%`
            })
          ]),
          el('div', { className: 'bar-value' }, String(stats.critique))
        ])
      ])
    ]),

    // Indicateurs moyens
    el('div', { className: 'kpi-moyens' }, [
      el('div', { className: 'kpi-moyen-item' }, [
        el('div', { className: 'kpi-moyen-icon' }, '📊'),
        el('div', { className: 'kpi-moyen-content' }, [
          el('div', { className: 'kpi-moyen-value' }, formatPourcent(stats.tauxPhysiqueMoyen)),
          el('div', { className: 'kpi-moyen-label' }, 'Avancement physique moyen')
        ])
      ]),
      el('div', { className: 'kpi-moyen-item' }, [
        el('div', { className: 'kpi-moyen-icon' }, '💰'),
        el('div', { className: 'kpi-moyen-content' }, [
          el('div', { className: 'kpi-moyen-value' }, formatPourcent(stats.tauxFinancierMoyen)),
          el('div', { className: 'kpi-moyen-label' }, 'Exécution financière moyenne')
        ])
      ]),
      el('div', { className: 'kpi-moyen-item' }, [
        el('div', { className: 'kpi-moyen-icon' }, '⚖️'),
        el('div', { className: 'kpi-moyen-content' }, [
          el('div', { className: `kpi-moyen-value ${getEcartClass(stats.ecartMoyen)}` },
            `${stats.ecartMoyen > 0 ? '+' : ''}${stats.ecartMoyen.toFixed(1)}%`),
          el('div', { className: 'kpi-moyen-label' }, 'Écart moyen (Fin - Phys)')
        ])
      ])
    ])
  ]);
}

/**
 * Render matrice
 */
function renderMatrice() {
  // Sort projects
  const projets = [...MOCK_PROJETS].sort((a, b) => {
    const valA = a[state.sortField];
    const valB = b[state.sortField];
    const mult = state.sortDirection === 'asc' ? 1 : -1;
    return (Math.abs(valA) - Math.abs(valB)) * mult;
  });

  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, 'Matrice Physico-Financière'),
      el('div', { className: 'card-subtitle' }, 'Écart = Taux Exécution Financier - Taux Avancement Physique')
    ]),
    el('div', { className: 'card-body' }, [
      el('table', { className: 'table pf-table' }, [
        el('thead', {}, [
          el('tr', {}, [
            el('th', {}, 'Projet'),
            el('th', {}, 'Bailleur'),
            el('th', { className: 'text-right' }, 'Budget'),
            el('th', { className: 'text-center col-financial' }, [
              el('div', {}, 'Financier'),
              el('div', { className: 'th-subtitle' }, '(Exécuté / Notifié)')
            ]),
            el('th', { className: 'text-center col-physical' }, [
              el('div', {}, 'Physique'),
              el('div', { className: 'th-subtitle' }, '(Activités réalisées)')
            ]),
            el('th', {
              className: 'text-center col-ecart sortable',
              onclick: () => handleSort('ecartPhysicoFinancier')
            }, [
              el('div', {}, 'Écart'),
              el('div', { className: 'th-subtitle' }, 'Fin - Phys'),
              state.sortField === 'ecartPhysicoFinancier' &&
                el('span', { className: 'sort-indicator' }, state.sortDirection === 'asc' ? ' ↑' : ' ↓')
            ].filter(Boolean)),
            el('th', {}, 'Situation'),
            el('th', {}, 'Recommandation')
          ])
        ]),
        el('tbody', {},
          projets.map(p => {
            const rowClass = getSituationRowClass(p.situation);

            return el('tr', {
              className: rowClass,
              onclick: () => router.navigate('/investissement/projet', { id: p.id })
            }, [
              el('td', {}, [
                el('div', { className: 'font-bold' }, p.code),
                el('div', { className: 'text-sm text-muted' }, p.nom)
              ]),
              el('td', {}, p.bailleur),
              el('td', { className: 'text-right' }, formatMontant(p.montantNotifie, true)),
              el('td', { className: 'text-center' }, [
                el('div', { className: 'taux-display' }, [
                  el('div', { className: 'taux-value' }, formatPourcent(p.tauxExecutionFinancier)),
                  el('div', { className: 'taux-bar' }, [
                    el('div', {
                      className: 'taux-fill taux-fill-financial',
                      style: `width: ${Math.min(p.tauxExecutionFinancier, 100)}%`
                    })
                  ])
                ])
              ]),
              el('td', { className: 'text-center' }, [
                el('div', { className: 'taux-display' }, [
                  el('div', { className: 'taux-value' }, formatPourcent(p.tauxAvancementPhysique)),
                  el('div', { className: 'taux-bar' }, [
                    el('div', {
                      className: 'taux-fill taux-fill-physical',
                      style: `width: ${Math.min(p.tauxAvancementPhysique, 100)}%`
                    })
                  ]),
                  el('div', { className: 'activites-count' },
                    `${p.activitesRealisees}/${p.nbActivites} act.`)
                ])
              ]),
              el('td', { className: 'text-center' }, [
                el('span', { className: `ecart-badge ${getEcartBadgeClass(p.ecartPhysicoFinancier)}` },
                  `${p.ecartPhysicoFinancier > 0 ? '+' : ''}${p.ecartPhysicoFinancier.toFixed(1)}%`)
              ]),
              el('td', {}, [
                el('span', { className: `badge badge-${getSituationColor(p.situation)}` },
                  getSituationLabel(p.situation))
              ]),
              el('td', { className: 'recommandation' }, p.recommandation)
            ]);
          })
        )
      ])
    ])
  ]);
}

/**
 * Render légende
 */
function renderLegende() {
  return el('div', { className: 'legende-card' }, [
    el('h3', { className: 'legende-title' }, 'Interprétation des écarts'),
    el('div', { className: 'legende-grid' }, [
      el('div', { className: 'legende-item' }, [
        el('span', { className: 'ecart-badge ecart-equilibre' }, '± 10%'),
        el('span', { className: 'legende-desc' }, [
          el('strong', {}, 'Équilibre: '),
          'Avancement physique et financier cohérents'
        ])
      ]),
      el('div', { className: 'legende-item' }, [
        el('span', { className: 'ecart-badge ecart-sous-phys' }, '> +10%'),
        el('span', { className: 'legende-desc' }, [
          el('strong', {}, 'Sous-exécution physique: '),
          'Décaissements rapides sans avancement physique proportionnel'
        ])
      ]),
      el('div', { className: 'legende-item' }, [
        el('span', { className: 'ecart-badge ecart-sous-fin' }, '< -10%'),
        el('span', { className: 'legende-desc' }, [
          el('strong', {}, 'Sous-exécution financière: '),
          'Avancement physique en avance sur les décaissements'
        ])
      ]),
      el('div', { className: 'legende-item' }, [
        el('span', { className: 'ecart-badge ecart-critique' }, '> ± 20%'),
        el('span', { className: 'legende-desc' }, [
          el('strong', {}, 'Critique: '),
          'Écart majeur nécessitant une intervention urgente'
        ])
      ])
    ])
  ]);
}

/**
 * Handle sort
 */
function handleSort(field) {
  if (state.sortField === field) {
    state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    state.sortField = field;
    state.sortDirection = 'desc';
  }
  updateContent();
}

/**
 * Render content
 */
function renderContent() {
  return el('div', { className: 'content-section' }, [
    renderKPIs(),
    renderMatrice(),
    renderLegende()
  ]);
}

/**
 * Update filters UI
 */
function updateFilters(handleFilterChange) {
  const filtersContainer = qs('#inv-filters-container');
  if (filtersContainer) {
    const newFilters = createInvFilters(state.filters, handleFilterChange, {
      showSearch: true,
      showVisionToggle: true,
      showTypeProjet: true,
      showBailleur: true,
      showSecteur: false,
      showOpe: true,
      filterId: 'inv-filters-container'
    });
    filtersContainer.replaceWith(newFilters);
  }
}

/**
 * Update content
 */
function updateContent(handleFilterChange) {
  const container = qs('#content-container');
  if (container) {
    container.innerHTML = '';
    container.appendChild(renderContent());
  }

  // Update filters UI
  if (handleFilterChange) {
    updateFilters(handleFilterChange);
  }
}

// Helper functions
function getEcartClass(ecart) {
  const abs = Math.abs(ecart);
  if (abs <= SEUILS.ecartAcceptable) return 'ecart-ok';
  if (abs <= SEUILS.ecartAlerte) return 'ecart-warning';
  return 'ecart-critical';
}

function getEcartBadgeClass(ecart) {
  const abs = Math.abs(ecart);
  if (abs <= SEUILS.ecartAcceptable) return 'ecart-equilibre';
  if (abs > SEUILS.ecartCritique) return 'ecart-critique';
  if (ecart > 0) return 'ecart-sous-phys';
  return 'ecart-sous-fin';
}

function getSituationColor(situation) {
  const colors = {
    'EQUILIBRE': 'success',
    'SOUS_EXECUTION_PHYSIQUE': 'warning',
    'SOUS_EXECUTION_FINANCIERE': 'info',
    'CRITIQUE': 'error'
  };
  return colors[situation] || 'default';
}

function getSituationLabel(situation) {
  const labels = {
    'EQUILIBRE': 'Équilibre',
    'SOUS_EXECUTION_PHYSIQUE': 'Sous-exec. phys.',
    'SOUS_EXECUTION_FINANCIERE': 'Sous-exec. fin.',
    'CRITIQUE': 'Critique'
  };
  return labels[situation] || situation;
}

function getSituationRowClass(situation) {
  if (situation === 'CRITIQUE') return 'row-error';
  if (situation === 'SOUS_EXECUTION_PHYSIQUE') return 'row-warning';
  return '';
}

/**
 * Main render function
 */
export async function renderInvPhysicoFinancier() {
  logger.info('[Investissement] Rendering Physico-Financier...');

  const handleFilterChange = (newFilters) => {
    state.filters = newFilters;
    updateContent(handleFilterChange);
  };

  const page = el('div', { className: 'page-layout inv-layout' }, [
    renderInvSidebar('/investissement/physico-financier'),

    el('main', { className: 'page-main' }, [
      // Header
      el('div', { className: 'page-header' }, [
        el('div', { className: 'page-header-content' }, [
          el('h1', { className: 'page-title' }, 'Analyse Physico-Financière'),
          el('p', { className: 'page-subtitle' }, 'Croisement entre avancement physique et exécution financière')
        ])
      ]),

      // Filtres
      createInvFilters(state.filters, handleFilterChange, {
        showSearch: true,
        showVisionToggle: true,
        showTypeProjet: true,
        showBailleur: true,
        showSecteur: false,
        showOpe: true,
        filterId: 'inv-filters-container'
      }),

      // Content
      el('div', { id: 'content-container', className: 'page-content' }, [
        renderContent()
      ])
    ])
  ]);

  mount('#app', page);

  // Inject styles
  injectFilterStyles();
  injectPfStyles();

  logger.info('[Investissement] Physico-Financier rendered');
}

function injectPfStyles() {
  const styleId = 'inv-pf-styles';
  if (document.getElementById(styleId)) return;

  const styles = `
    /* KPI Grid PF */
    .kpi-grid-pf {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .kpi-situation {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
      padding: 1.25rem;
    }

    .kpi-section-title {
      font-size: 0.875rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }

    .situation-bars {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .situation-bar {
      display: grid;
      grid-template-columns: 140px 1fr 40px;
      gap: 0.75rem;
      align-items: center;
    }

    .bar-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
    }

    .dot {
      width: 0.625rem;
      height: 0.625rem;
      border-radius: 50%;
    }

    .dot-success { background: #22c55e; }
    .dot-warning { background: #f59e0b; }
    .dot-info { background: #3b82f6; }
    .dot-error { background: #dc2626; }

    .bar-track {
      height: 0.5rem;
      background: #e5e7eb;
      border-radius: 0.25rem;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 0.25rem;
    }

    .bar-success { background: #22c55e; }
    .bar-warning { background: #f59e0b; }
    .bar-info { background: #3b82f6; }
    .bar-error { background: #dc2626; }

    .bar-value {
      font-weight: 700;
      text-align: right;
    }

    /* KPI Moyens */
    .kpi-moyens {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .kpi-moyen-item {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .kpi-moyen-icon {
      font-size: 1.5rem;
    }

    .kpi-moyen-value {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .kpi-moyen-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    /* Matrice table */
    .pf-table {
      width: 100%;
    }

    .pf-table th {
      vertical-align: bottom;
    }

    .th-subtitle {
      font-size: 0.625rem;
      font-weight: 400;
      color: var(--color-text-muted);
    }

    .col-financial { background: #eff6ff; }
    .col-physical { background: #f0fdf4; }
    .col-ecart { background: #fef3c7; }

    .sortable {
      cursor: pointer;
    }

    .sortable:hover {
      background: #fcd34d;
    }

    .sort-indicator {
      color: var(--color-primary);
      font-weight: 700;
    }

    /* Taux display */
    .taux-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .taux-value {
      font-weight: 700;
      font-size: 0.875rem;
    }

    .taux-bar {
      width: 100%;
      height: 0.375rem;
      background: #e5e7eb;
      border-radius: 0.25rem;
      overflow: hidden;
    }

    .taux-fill {
      height: 100%;
    }

    .taux-fill-financial {
      background: #3b82f6;
    }

    .taux-fill-physical {
      background: #22c55e;
    }

    .activites-count {
      font-size: 0.625rem;
      color: var(--color-text-muted);
    }

    /* Écart badges */
    .ecart-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 700;
    }

    .ecart-equilibre {
      background: #dcfce7;
      color: #166534;
    }

    .ecart-sous-phys {
      background: #fef3c7;
      color: #92400e;
    }

    .ecart-sous-fin {
      background: #dbeafe;
      color: #1e40af;
    }

    .ecart-critique {
      background: #fecaca;
      color: #991b1b;
    }

    .ecart-ok { color: #16a34a; }
    .ecart-warning { color: #ca8a04; }
    .ecart-critical { color: #dc2626; }

    /* Recommandation */
    .recommandation {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      max-width: 180px;
    }

    /* Row classes */
    .row-warning {
      background: #fffbeb;
    }

    .row-error {
      background: #fef2f2;
    }

    /* Légende */
    .legende-card {
      background: var(--color-surface-alt);
      border-radius: 0.5rem;
      padding: 1rem;
      margin-top: 1.5rem;
    }

    .legende-title {
      font-size: 0.875rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }

    .legende-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .legende-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .legende-desc {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .kpi-grid-pf {
        grid-template-columns: 1fr;
      }
      .legende-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

export default renderInvPhysicoFinancier;
