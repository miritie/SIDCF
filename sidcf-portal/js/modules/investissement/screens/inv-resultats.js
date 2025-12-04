/* ============================================
   Écran Résultats (GAR) - Module Investissement
   ============================================
   Axe 5: Gestion Axée sur les Résultats
   - Indicateurs OUTPUT / OUTCOME / IMPACT
   - Suivi des cibles par projet
   - Tableau de bord GAR consolidé
   - Alertes indicateurs à risque
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

// Mock statistiques GAR
const MOCK_STATS = {
  totalIndicateurs: 87,
  parNiveau: {
    OUTPUT: 52,
    OUTCOME: 28,
    IMPACT: 7
  },
  parStatut: {
    EN_BONNE_VOIE: 58,
    A_RISQUE: 18,
    NON_ATTEINT: 8,
    DEPASSE: 3
  },
  tauxAtteinteMoyen: 76.4,
  projetsAvecGar: 42,
  projetsSansGar: 5
};

// Mock indicateurs par niveau
const MOCK_INDICATEURS = {
  OUTPUT: [
    {
      projetCode: 'PAPSE-II',
      projetNom: 'Programme Éducation II',
      indicateur: 'Nombre de salles de classe construites',
      unite: 'Nombre',
      baseline: 0,
      cibleAnnee: 300,
      valeurActuelle: 245,
      tauxAtteinte: 81.7,
      statut: 'EN_BONNE_VOIE'
    },
    {
      projetCode: 'PAPSE-II',
      projetNom: 'Programme Éducation II',
      indicateur: 'Nombre d\'enseignants formés',
      unite: 'Nombre',
      baseline: 0,
      cibleAnnee: 5000,
      valeurActuelle: 4200,
      tauxAtteinte: 84.0,
      statut: 'EN_BONNE_VOIE'
    },
    {
      projetCode: 'PRICI',
      projetNom: 'Infrastructures CI',
      indicateur: 'Km de routes réhabilitées',
      unite: 'Km',
      baseline: 0,
      cibleAnnee: 150,
      valeurActuelle: 98,
      tauxAtteinte: 65.3,
      statut: 'A_RISQUE'
    },
    {
      projetCode: 'PASEA',
      projetNom: 'Eau & Assainissement',
      indicateur: 'Forages réalisés',
      unite: 'Nombre',
      baseline: 0,
      cibleAnnee: 200,
      valeurActuelle: 185,
      tauxAtteinte: 92.5,
      statut: 'EN_BONNE_VOIE'
    },
    {
      projetCode: 'PEJEDEC',
      projetNom: 'Emploi Jeunes',
      indicateur: 'Jeunes formés aux métiers',
      unite: 'Nombre',
      baseline: 0,
      cibleAnnee: 8000,
      valeurActuelle: 5200,
      tauxAtteinte: 65.0,
      statut: 'A_RISQUE'
    },
    {
      projetCode: 'PNACC',
      projetNom: 'Adaptation Climat',
      indicateur: 'Hectares reboisés',
      unite: 'Ha',
      baseline: 0,
      cibleAnnee: 500,
      valeurActuelle: 180,
      tauxAtteinte: 36.0,
      statut: 'NON_ATTEINT'
    }
  ],
  OUTCOME: [
    {
      projetCode: 'PAPSE-II',
      projetNom: 'Programme Éducation II',
      indicateur: 'Taux de scolarisation primaire',
      unite: '%',
      baseline: 78.5,
      cibleAnnee: 82.0,
      valeurActuelle: 80.2,
      tauxAtteinte: 48.6,
      statut: 'A_RISQUE'
    },
    {
      projetCode: 'PASEA',
      projetNom: 'Eau & Assainissement',
      indicateur: 'Taux d\'accès à l\'eau potable',
      unite: '%',
      baseline: 65.0,
      cibleAnnee: 72.0,
      valeurActuelle: 70.5,
      tauxAtteinte: 78.6,
      statut: 'EN_BONNE_VOIE'
    },
    {
      projetCode: 'PEJEDEC',
      projetNom: 'Emploi Jeunes',
      indicateur: 'Taux d\'insertion professionnelle',
      unite: '%',
      baseline: 25.0,
      cibleAnnee: 40.0,
      valeurActuelle: 32.5,
      tauxAtteinte: 50.0,
      statut: 'A_RISQUE'
    },
    {
      projetCode: 'PRICI',
      projetNom: 'Infrastructures CI',
      indicateur: 'Réduction temps de trajet moyen',
      unite: '%',
      baseline: 0,
      cibleAnnee: 30.0,
      valeurActuelle: 22.0,
      tauxAtteinte: 73.3,
      statut: 'EN_BONNE_VOIE'
    }
  ],
  IMPACT: [
    {
      projetCode: 'PAPSE-II',
      projetNom: 'Programme Éducation II',
      indicateur: 'Taux d\'achèvement du primaire',
      unite: '%',
      baseline: 65.0,
      cibleAnnee: 72.0,
      valeurActuelle: 68.5,
      tauxAtteinte: 50.0,
      statut: 'EN_BONNE_VOIE'
    },
    {
      projetCode: 'PASEA',
      projetNom: 'Eau & Assainissement',
      indicateur: 'Réduction maladies hydriques',
      unite: '%',
      baseline: 0,
      cibleAnnee: 25.0,
      valeurActuelle: 18.0,
      tauxAtteinte: 72.0,
      statut: 'EN_BONNE_VOIE'
    }
  ]
};

// Mock projets sans indicateurs GAR
const MOCK_SANS_GAR = [
  { code: 'PNGR', nom: 'Programme National Gestion Risques', motif: 'En cours de définition' },
  { code: 'PDCI', nom: 'Développement Communautaire Intégré', motif: 'Cadre logique non finalisé' },
  { code: 'PTRAN', nom: 'Transport Urbain Abidjan', motif: 'En attente validation bailleur' }
];

// State
let state = {
  filters: { ...DEFAULT_FILTERS },
  activeTab: 'dashboard',
  selectedNiveau: 'OUTPUT'
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
 * Render tabs
 */
function renderTabs() {
  const tabs = [
    { id: 'dashboard', label: 'Vue d\'ensemble', icon: '📊' },
    { id: 'indicateurs', label: 'Indicateurs', icon: '🎯' },
    { id: 'risques', label: 'À risque', icon: '⚠️' },
    { id: 'couverture', label: 'Couverture GAR', icon: '📋' }
  ];

  return el('div', { className: 'tabs-nav' },
    tabs.map(tab =>
      el('button', {
        className: `tab-btn ${state.activeTab === tab.id ? 'active' : ''}`,
        onclick: () => {
          state.activeTab = tab.id;
          updateContent();
        }
      }, [
        el('span', { className: 'tab-icon' }, tab.icon),
        el('span', { className: 'tab-label' }, tab.label),
        tab.id === 'risques' && MOCK_STATS.parStatut.A_RISQUE > 0 &&
          el('span', { className: 'tab-badge badge-warning' }, String(MOCK_STATS.parStatut.A_RISQUE))
      ].filter(Boolean))
    )
  );
}

/**
 * Render dashboard
 */
function renderDashboard() {
  const stats = MOCK_STATS;

  return el('div', { className: 'content-section' }, [
    // KPIs
    el('div', { className: 'gar-kpi-grid' }, [
      // Total indicateurs
      el('div', { className: 'gar-kpi-card' }, [
        el('div', { className: 'gar-kpi-value' }, String(stats.totalIndicateurs)),
        el('div', { className: 'gar-kpi-label' }, 'Indicateurs suivis'),
        el('div', { className: 'gar-kpi-breakdown' }, [
          el('span', {}, `${stats.parNiveau.OUTPUT} OUTPUT`),
          el('span', {}, `${stats.parNiveau.OUTCOME} OUTCOME`),
          el('span', {}, `${stats.parNiveau.IMPACT} IMPACT`)
        ])
      ]),

      // Taux atteinte
      el('div', { className: 'gar-kpi-card' }, [
        el('div', { className: `gar-kpi-value ${getTauxClass(stats.tauxAtteinteMoyen)}` },
          formatPourcent(stats.tauxAtteinteMoyen)),
        el('div', { className: 'gar-kpi-label' }, 'Taux d\'atteinte moyen')
      ]),

      // Par statut
      el('div', { className: 'gar-kpi-card gar-statut-card' }, [
        el('div', { className: 'gar-statut-grid' }, [
          el('div', { className: 'gar-statut-item' }, [
            el('span', { className: 'statut-value statut-success' }, String(stats.parStatut.EN_BONNE_VOIE)),
            el('span', { className: 'statut-label' }, 'En bonne voie')
          ]),
          el('div', { className: 'gar-statut-item' }, [
            el('span', { className: 'statut-value statut-warning' }, String(stats.parStatut.A_RISQUE)),
            el('span', { className: 'statut-label' }, 'À risque')
          ]),
          el('div', { className: 'gar-statut-item' }, [
            el('span', { className: 'statut-value statut-error' }, String(stats.parStatut.NON_ATTEINT)),
            el('span', { className: 'statut-label' }, 'Non atteint')
          ]),
          el('div', { className: 'gar-statut-item' }, [
            el('span', { className: 'statut-value statut-info' }, String(stats.parStatut.DEPASSE)),
            el('span', { className: 'statut-label' }, 'Dépassé')
          ])
        ])
      ])
    ]),

    // Pyramide GAR
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Pyramide des résultats')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { className: 'gar-pyramide' }, [
          el('div', { className: 'pyramide-niveau pyramide-impact' }, [
            el('div', { className: 'pyramide-label' }, 'IMPACT'),
            el('div', { className: 'pyramide-count' }, String(stats.parNiveau.IMPACT)),
            el('div', { className: 'pyramide-desc' }, 'Changements durables au niveau de la société')
          ]),
          el('div', { className: 'pyramide-niveau pyramide-outcome' }, [
            el('div', { className: 'pyramide-label' }, 'OUTCOME (Effets)'),
            el('div', { className: 'pyramide-count' }, String(stats.parNiveau.OUTCOME)),
            el('div', { className: 'pyramide-desc' }, 'Changements de comportement des bénéficiaires')
          ]),
          el('div', { className: 'pyramide-niveau pyramide-output' }, [
            el('div', { className: 'pyramide-label' }, 'OUTPUT (Produits)'),
            el('div', { className: 'pyramide-count' }, String(stats.parNiveau.OUTPUT)),
            el('div', { className: 'pyramide-desc' }, 'Livrables directs des activités')
          ])
        ])
      ])
    ]),

    // Indicateurs à risque (aperçu)
    MOCK_STATS.parStatut.A_RISQUE > 0 && el('div', { className: 'card card-warning' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Indicateurs à risque'),
        el('a', {
          className: 'btn btn-sm btn-ghost',
          onclick: () => { state.activeTab = 'risques'; updateContent(); }
        }, 'Voir tout →')
      ]),
      el('div', { className: 'card-body' }, [
        renderIndicateursTable([
          ...MOCK_INDICATEURS.OUTPUT.filter(i => i.statut === 'A_RISQUE').slice(0, 2),
          ...MOCK_INDICATEURS.OUTCOME.filter(i => i.statut === 'A_RISQUE').slice(0, 2)
        ])
      ])
    ])
  ]);
}

/**
 * Render indicateurs
 */
function renderIndicateurs() {
  const niveaux = ['OUTPUT', 'OUTCOME', 'IMPACT'];

  return el('div', { className: 'content-section' }, [
    // Sélecteur de niveau
    el('div', { className: 'niveau-selector' },
      niveaux.map(niveau =>
        el('button', {
          className: `niveau-btn ${state.selectedNiveau === niveau ? 'active' : ''}`,
          onclick: () => {
            state.selectedNiveau = niveau;
            updateContent();
          }
        }, [
          el('span', { className: 'niveau-icon' }, getNiveauIcon(niveau)),
          el('span', { className: 'niveau-label' }, getNiveauLabel(niveau)),
          el('span', { className: 'niveau-count' }, String(MOCK_INDICATEURS[niveau]?.length || 0))
        ])
      )
    ),

    // Table indicateurs
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, `Indicateurs ${getNiveauLabel(state.selectedNiveau)}`)
      ]),
      el('div', { className: 'card-body' }, [
        renderIndicateursTable(MOCK_INDICATEURS[state.selectedNiveau] || [])
      ])
    ])
  ]);
}

/**
 * Render table indicateurs
 */
function renderIndicateursTable(indicateurs) {
  if (indicateurs.length === 0) {
    return el('div', { className: 'empty-state' }, [
      el('p', {}, 'Aucun indicateur à afficher')
    ]);
  }

  return el('table', { className: 'table gar-table' }, [
    el('thead', {}, [
      el('tr', {}, [
        el('th', {}, 'Projet'),
        el('th', {}, 'Indicateur'),
        el('th', { className: 'text-center' }, 'Baseline'),
        el('th', { className: 'text-center' }, `Cible ${getCurrentYear()}`),
        el('th', { className: 'text-center' }, 'Actuel'),
        el('th', { className: 'text-center' }, 'Atteinte'),
        el('th', {}, 'Statut')
      ])
    ]),
    el('tbody', {},
      indicateurs.map(ind => {
        const rowClass = getStatutRowClass(ind.statut);

        return el('tr', {
          className: rowClass,
          onclick: () => router.navigate('/investissement/projet', { id: ind.projetCode.toLowerCase() })
        }, [
          el('td', {}, [
            el('div', { className: 'font-bold' }, ind.projetCode),
            el('div', { className: 'text-sm text-muted' }, ind.projetNom)
          ]),
          el('td', {}, [
            el('div', {}, ind.indicateur),
            el('div', { className: 'text-sm text-muted' }, `Unité: ${ind.unite}`)
          ]),
          el('td', { className: 'text-center' }, String(ind.baseline)),
          el('td', { className: 'text-center font-bold' }, String(ind.cibleAnnee)),
          el('td', { className: 'text-center' }, [
            el('span', { className: 'valeur-actuelle' }, String(ind.valeurActuelle))
          ]),
          el('td', { className: 'text-center' }, [
            el('div', { className: 'atteinte-display' }, [
              el('div', { className: `atteinte-value ${getTauxClass(ind.tauxAtteinte)}` },
                formatPourcent(ind.tauxAtteinte)),
              el('div', { className: 'atteinte-bar' }, [
                el('div', {
                  className: `atteinte-fill ${getAtteinteFillClass(ind.tauxAtteinte)}`,
                  style: `width: ${Math.min(ind.tauxAtteinte, 100)}%`
                })
              ])
            ])
          ]),
          el('td', {}, [
            el('span', { className: `badge badge-${getStatutColor(ind.statut)}` },
              getStatutLabel(ind.statut))
          ])
        ]);
      })
    )
  ]);
}

/**
 * Render risques
 */
function renderRisques() {
  const aRisque = [
    ...MOCK_INDICATEURS.OUTPUT.filter(i => i.statut === 'A_RISQUE' || i.statut === 'NON_ATTEINT'),
    ...MOCK_INDICATEURS.OUTCOME.filter(i => i.statut === 'A_RISQUE' || i.statut === 'NON_ATTEINT'),
    ...MOCK_INDICATEURS.IMPACT.filter(i => i.statut === 'A_RISQUE' || i.statut === 'NON_ATTEINT')
  ];

  return el('div', { className: 'content-section' }, [
    aRisque.length > 0
      ? el('div', { className: 'alert alert-warning' }, [
          el('strong', {}, `${aRisque.length} indicateur(s) `),
          'nécessitant une attention particulière'
        ])
      : el('div', { className: 'alert alert-success' }, [
          el('strong', {}, 'Excellent! '),
          'Tous les indicateurs sont en bonne voie.'
        ]),

    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Indicateurs à risque et non atteints')
      ]),
      el('div', { className: 'card-body' }, [
        renderIndicateursTable(aRisque)
      ])
    ])
  ]);
}

/**
 * Render couverture GAR
 */
function renderCouverture() {
  const stats = MOCK_STATS;

  return el('div', { className: 'content-section' }, [
    // Statistiques couverture
    el('div', { className: 'couverture-stats' }, [
      el('div', { className: 'couverture-stat couverture-ok' }, [
        el('div', { className: 'couverture-value' }, String(stats.projetsAvecGar)),
        el('div', { className: 'couverture-label' }, 'Projets avec cadre GAR')
      ]),
      el('div', { className: 'couverture-stat couverture-warning' }, [
        el('div', { className: 'couverture-value' }, String(stats.projetsSansGar)),
        el('div', { className: 'couverture-label' }, 'Projets sans cadre GAR')
      ])
    ]),

    // Liste des projets sans GAR
    stats.projetsSansGar > 0 && el('div', { className: 'card card-warning' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Projets sans cadre GAR')
      ]),
      el('div', { className: 'card-body' }, [
        el('table', { className: 'table' }, [
          el('thead', {}, [
            el('tr', {}, [
              el('th', {}, 'Projet'),
              el('th', {}, 'Motif'),
              el('th', {}, 'Action')
            ])
          ]),
          el('tbody', {},
            MOCK_SANS_GAR.map(p =>
              el('tr', {}, [
                el('td', {}, [
                  el('div', { className: 'font-bold' }, p.code),
                  el('div', { className: 'text-sm text-muted' }, p.nom)
                ]),
                el('td', { className: 'text-muted' }, p.motif),
                el('td', {}, [
                  el('button', { className: 'btn btn-sm btn-primary' }, 'Définir GAR')
                ])
              ])
            )
          )
        ])
      ])
    ]),

    // Recommandations
    el('div', { className: 'info-box' }, [
      el('h4', {}, 'Exigences GAR - DCF'),
      el('ul', {}, [
        el('li', {}, 'Tout projet doit avoir au minimum 1 indicateur OUTPUT, 1 OUTCOME'),
        el('li', {}, 'Les indicateurs IMPACT sont recommandés pour les projets > 10 Mds FCFA'),
        el('li', {}, 'Les valeurs doivent être mises à jour trimestriellement'),
        el('li', {}, 'Un indicateur "À risque" (< 70% de la cible au T3) déclenche une alerte')
      ])
    ])
  ]);
}

/**
 * Render content
 */
function renderContent() {
  switch (state.activeTab) {
    case 'dashboard': return renderDashboard();
    case 'indicateurs': return renderIndicateurs();
    case 'risques': return renderRisques();
    case 'couverture': return renderCouverture();
    default: return renderDashboard();
  }
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
      showTypeProjet: false,
      showBailleur: true,
      showSecteur: true,
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

  const tabsNav = qs('.tabs-nav');
  if (tabsNav) {
    tabsNav.parentNode.replaceChild(renderTabs(), tabsNav);
  }

  // Update filters UI
  if (handleFilterChange) {
    updateFilters(handleFilterChange);
  }
}

// Helper functions
function getTauxClass(taux) {
  if (taux >= 80) return 'taux-good';
  if (taux >= 60) return 'taux-medium';
  return 'taux-low';
}

function getAtteinteFillClass(taux) {
  if (taux >= 80) return 'fill-success';
  if (taux >= 60) return 'fill-warning';
  return 'fill-error';
}

function getNiveauIcon(niveau) {
  const icons = { 'OUTPUT': '📦', 'OUTCOME': '🔄', 'IMPACT': '🌍' };
  return icons[niveau] || '📊';
}

function getNiveauLabel(niveau) {
  const labels = { 'OUTPUT': 'Produits', 'OUTCOME': 'Effets', 'IMPACT': 'Impacts' };
  return labels[niveau] || niveau;
}

function getStatutColor(statut) {
  const colors = {
    'EN_BONNE_VOIE': 'success',
    'A_RISQUE': 'warning',
    'NON_ATTEINT': 'error',
    'DEPASSE': 'info'
  };
  return colors[statut] || 'default';
}

function getStatutLabel(statut) {
  const labels = {
    'EN_BONNE_VOIE': 'En bonne voie',
    'A_RISQUE': 'À risque',
    'NON_ATTEINT': 'Non atteint',
    'DEPASSE': 'Dépassé'
  };
  return labels[statut] || statut;
}

function getStatutRowClass(statut) {
  if (statut === 'NON_ATTEINT') return 'row-error';
  if (statut === 'A_RISQUE') return 'row-warning';
  return '';
}

/**
 * Main render function
 */
export async function renderInvResultats() {
  logger.info('[Investissement] Rendering Resultats (GAR)...');

  const handleFilterChange = (newFilters) => {
    state.filters = newFilters;
    updateContent(handleFilterChange);
  };

  const page = el('div', { className: 'page-layout inv-layout' }, [
    renderInvSidebar('/investissement/resultats'),

    el('main', { className: 'page-main' }, [
      // Header
      el('div', { className: 'page-header' }, [
        el('div', { className: 'page-header-content' }, [
          el('h1', { className: 'page-title' }, 'Résultats (GAR)'),
          el('p', { className: 'page-subtitle' }, 'Gestion Axée sur les Résultats - Suivi des indicateurs OUTPUT, OUTCOME, IMPACT')
        ])
      ]),

      // Filtres
      createInvFilters(state.filters, handleFilterChange, {
        showSearch: true,
        showVisionToggle: true,
        showTypeProjet: false,
        showBailleur: true,
        showSecteur: true,
        showOpe: true,
        filterId: 'inv-filters-container'
      }),

      // Tabs
      renderTabs(),

      // Content
      el('div', { id: 'content-container', className: 'page-content' }, [
        renderContent()
      ])
    ])
  ]);

  mount('#app', page);

  // Inject styles
  injectFilterStyles();
  injectGarStyles();

  logger.info('[Investissement] Resultats (GAR) rendered');
}

function injectGarStyles() {
  const styleId = 'inv-gar-styles';
  if (document.getElementById(styleId)) return;

  const styles = `
    /* GAR KPI Grid */
    .gar-kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .gar-kpi-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
      padding: 1.25rem;
      text-align: center;
    }

    .gar-kpi-value {
      font-size: 2.5rem;
      font-weight: 700;
    }

    .gar-kpi-label {
      font-size: 0.875rem;
      color: var(--color-text-muted);
      margin-top: 0.25rem;
    }

    .gar-kpi-breakdown {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 0.75rem;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .gar-statut-card {
      grid-column: span 1;
    }

    .gar-statut-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .gar-statut-item {
      text-align: center;
    }

    .statut-value {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .statut-label {
      font-size: 0.625rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
    }

    .statut-success { color: #16a34a; }
    .statut-warning { color: #ca8a04; }
    .statut-error { color: #dc2626; }
    .statut-info { color: #2563eb; }

    /* Pyramide GAR */
    .gar-pyramide {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .pyramide-niveau {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 1rem 2rem;
      border-radius: 0.5rem;
      text-align: center;
    }

    .pyramide-impact {
      background: #dbeafe;
      width: 60%;
    }

    .pyramide-outcome {
      background: #fef3c7;
      width: 80%;
    }

    .pyramide-output {
      background: #dcfce7;
      width: 100%;
    }

    .pyramide-label {
      font-weight: 700;
      font-size: 0.875rem;
    }

    .pyramide-count {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .pyramide-desc {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      max-width: 200px;
    }

    /* Niveau selector */
    .niveau-selector {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .niveau-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      border: 2px solid var(--color-border);
      border-radius: 0.5rem;
      background: var(--color-surface);
      cursor: pointer;
      transition: all 0.2s;
    }

    .niveau-btn:hover {
      border-color: var(--color-primary);
    }

    .niveau-btn.active {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: white;
    }

    .niveau-icon {
      font-size: 1.25rem;
    }

    .niveau-label {
      font-weight: 600;
    }

    .niveau-count {
      background: rgba(0,0,0,0.1);
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
    }

    .niveau-btn.active .niveau-count {
      background: rgba(255,255,255,0.2);
    }

    /* Atteinte display */
    .atteinte-display {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .atteinte-value {
      font-weight: 700;
    }

    .atteinte-bar {
      width: 100%;
      height: 0.375rem;
      background: #e5e7eb;
      border-radius: 0.25rem;
      overflow: hidden;
    }

    .atteinte-fill {
      height: 100%;
    }

    .fill-success { background: #22c55e; }
    .fill-warning { background: #f59e0b; }
    .fill-error { background: #dc2626; }

    .valeur-actuelle {
      font-weight: 700;
      font-size: 1.125rem;
    }

    /* Couverture stats */
    .couverture-stats {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .couverture-stat {
      flex: 1;
      text-align: center;
      padding: 1.5rem;
      border-radius: 0.5rem;
    }

    .couverture-ok {
      background: #dcfce7;
      border: 2px solid #86efac;
    }

    .couverture-warning {
      background: #fef3c7;
      border: 2px solid #fcd34d;
    }

    .couverture-value {
      font-size: 3rem;
      font-weight: 700;
    }

    .couverture-label {
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    /* Card warning */
    .card-warning {
      border-left: 4px solid #f59e0b;
    }

    /* Table styles */
    .table th {
      text-align: center;
    }

    .table td {
      text-align: center;
    }

    .table td:first-child,
    .table th:first-child {
      text-align: left;
    }

    /* Taux classes */
    .taux-good { color: #16a34a; }
    .taux-medium { color: #ca8a04; }
    .taux-low { color: #dc2626; }

    /* Row classes */
    .row-warning { background: #fffbeb; }
    .row-error { background: #fef2f2; }

    /* Alerts */
    .alert {
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
    }

    .alert-success {
      background: #dcfce7;
      border: 1px solid #86efac;
      color: #166534;
    }

    .alert-warning {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      color: #92400e;
    }

    /* Info box */
    .info-box {
      background: var(--color-surface-alt);
      padding: 1rem;
      border-radius: 0.5rem;
      margin-top: 1rem;
    }

    .info-box h4 {
      font-size: 0.875rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .info-box ul {
      margin: 0;
      padding-left: 1.5rem;
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .gar-kpi-grid {
        grid-template-columns: 1fr;
      }
      .niveau-selector {
        flex-direction: column;
      }
      .couverture-stats {
        flex-direction: column;
      }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

export default renderInvResultats;
