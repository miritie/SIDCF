/* ============================================
   Écran Soutenabilité - Module Investissement
   ============================================
   Axe 2: Pluriannualité & Soutenabilité budgétaire
   - Vue trajectoire pluriannuelle
   - Glissements inter-annuels
   - Suivi trimestriel
   - Analyse soutenabilité
   ============================================ */

import { el, mount, qs } from '../../../lib/dom.js';
import { money, percent, abbreviate } from '../../../lib/format.js';
import router from '../../../router.js';
import logger from '../../../lib/logger.js';
import { INV_SIDEBAR_MENU, getCurrentYear, getAvailableYears, createSidebarMenuItems, getMenuIcon } from '../inv-constants.js';
import { createInvFilters, applyInvFilters, injectFilterStyles, DEFAULT_FILTERS } from '../components/inv-filters.js';

// Aliases
const formatMontant = (amount, short = false) => short ? abbreviate(amount) : money(amount);
const formatPourcent = (val) => percent(val);

// Mock data trajectoire pluriannuelle
const MOCK_TRAJECTOIRE = {
  annees: [2022, 2023, 2024, 2025, 2026],
  donnees: [
    { annee: 2022, prevu: 180000000000, realise: 165000000000, glisse: 15000000000, tauxRealisation: 91.7 },
    { annee: 2023, prevu: 220000000000, realise: 185000000000, glisse: 35000000000, tauxRealisation: 84.1 },
    { annee: 2024, prevu: 245000000000, realise: 156200000000, glisse: null, tauxRealisation: 63.8 },
    { annee: 2025, prevu: 280000000000, realise: null, glisse: null, tauxRealisation: null },
    { annee: 2026, prevu: 310000000000, realise: null, glisse: null, tauxRealisation: null }
  ],
  totaux: {
    totalPrevu: 1235000000000,
    totalRealise: 506200000000,
    totalGlisse: 50000000000,
    tauxGlobal: 41.0
  }
};

// Mock suivi trimestriel
const MOCK_TRIMESTRIEL = {
  annee: 2024,
  trimestres: [
    {
      trimestre: 1,
      notifie: 60000000000,
      transfere: 58000000000,
      execute: 42000000000,
      tauxExec: 72.4,
      appreciation: 'SATISFAISANT',
      observations: 'Démarrage conforme aux prévisions'
    },
    {
      trimestre: 2,
      notifie: 62000000000,
      transfere: 60000000000,
      execute: 48000000000,
      tauxExec: 80.0,
      appreciation: 'SATISFAISANT',
      observations: 'Accélération des décaissements'
    },
    {
      trimestre: 3,
      notifie: 63000000000,
      transfere: 55000000000,
      execute: 38200000000,
      tauxExec: 69.5,
      appreciation: 'EN_RETARD',
      observations: 'Retards procédures marchés sur 3 projets'
    },
    {
      trimestre: 4,
      notifie: 60000000000,
      transfere: 25500000000,
      execute: 28000000000,
      tauxExec: null,
      appreciation: 'EN_COURS',
      observations: 'Trimestre en cours - données partielles'
    }
  ]
};

// Mock glissements
const MOCK_GLISSEMENTS = [
  {
    projetCode: 'PAPSE-II',
    projetNom: 'Programme Appui Plan Sectoriel Éducation II',
    anneeOrigine: 2023,
    anneeDestination: 2024,
    montantInitial: 42000000000,
    montantRealise: 35000000000,
    montantGlisse: 7000000000,
    tauxGlissement: 16.7,
    categorieMotif: 'ADMINISTRATIF',
    motif: 'Retard procédures marché'
  },
  {
    projetCode: 'PEJEDEC',
    projetNom: 'Projet Emploi Jeunes Développement Compétences',
    anneeOrigine: 2023,
    anneeDestination: 2024,
    montantInitial: 28000000000,
    montantRealise: 22000000000,
    montantGlisse: 6000000000,
    tauxGlissement: 21.4,
    categorieMotif: 'TECHNIQUE',
    motif: 'Difficultés terrain zones Nord'
  },
  {
    projetCode: 'PASEA',
    projetNom: 'Projet Appui Secteur Eau Assainissement',
    anneeOrigine: 2023,
    anneeDestination: 2024,
    montantInitial: 52000000000,
    montantRealise: 40000000000,
    montantGlisse: 12000000000,
    tauxGlissement: 23.1,
    categorieMotif: 'TECHNIQUE',
    motif: 'Retard livraison équipements importés'
  },
  {
    projetCode: 'PNACC',
    projetNom: 'Programme National Adaptation Changement Climatique',
    anneeOrigine: 2023,
    anneeDestination: 2024,
    montantInitial: 15000000000,
    montantRealise: 8000000000,
    montantGlisse: 7000000000,
    tauxGlissement: 46.7,
    categorieMotif: 'INSTITUTIONNEL',
    motif: 'Restructuration UCP'
  }
];

// Mock projets pour analyse soutenabilité
const MOCK_PROJETS_SOUTENABILITE = [
  { code: 'PAPSE-II', nom: 'Programme Éducation II', coutTotal: 75000000000, cumuleRealise: 52000000000, resteAFaire: 23000000000, dureeRestante: 12, capaciteAnnuelle: 15000000000, soutenable: true, risque: 'FAIBLE' },
  { code: 'PEJEDEC', nom: 'Emploi Jeunes', coutTotal: 28000000000, cumuleRealise: 18900000000, resteAFaire: 9100000000, dureeRestante: 8, capaciteAnnuelle: 8000000000, soutenable: true, risque: 'FAIBLE' },
  { code: 'ProSEB', nom: 'Éducation de Base', coutTotal: 35000000000, cumuleRealise: 28120000000, resteAFaire: 6880000000, dureeRestante: 6, capaciteAnnuelle: 10000000000, soutenable: true, risque: 'FAIBLE' },
  { code: 'PASEA', nom: 'Eau Assainissement', coutTotal: 52000000000, cumuleRealise: 38250000000, resteAFaire: 13750000000, dureeRestante: 10, capaciteAnnuelle: 12000000000, soutenable: true, risque: 'MOYEN' },
  { code: 'PRICI', nom: 'Infrastructures CI', coutTotal: 85000000000, cumuleRealise: 65800000000, resteAFaire: 19200000000, dureeRestante: 8, capaciteAnnuelle: 18000000000, soutenable: true, risque: 'FAIBLE' },
  { code: 'PNACC', nom: 'Adaptation Climat', coutTotal: 15000000000, cumuleRealise: 8400000000, resteAFaire: 6600000000, dureeRestante: 4, capaciteAnnuelle: 3000000000, soutenable: false, risque: 'ELEVE' }
];

// State
let state = {
  filters: { ...DEFAULT_FILTERS },
  activeTab: 'trajectoire'
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
    { id: 'trajectoire', label: 'Trajectoire', icon: '📈' },
    { id: 'trimestriel', label: 'Suivi trimestriel', icon: '📅' },
    { id: 'glissements', label: 'Glissements', icon: '↪️' },
    { id: 'soutenabilite', label: 'Analyse soutenabilité', icon: '⚖️' }
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
        el('span', { className: 'tab-label' }, tab.label)
      ])
    )
  );
}

/**
 * Render trajectoire pluriannuelle
 */
function renderTrajectoire() {
  const data = MOCK_TRAJECTOIRE;
  const currentYear = getCurrentYear();

  return el('div', { className: 'content-section' }, [
    // KPIs
    el('div', { className: 'kpi-row' }, [
      el('div', { className: 'kpi-item' }, [
        el('div', { className: 'kpi-value' }, formatMontant(data.totaux.totalPrevu, true)),
        el('div', { className: 'kpi-label' }, 'Total prévu 5 ans')
      ]),
      el('div', { className: 'kpi-item' }, [
        el('div', { className: 'kpi-value' }, formatMontant(data.totaux.totalRealise, true)),
        el('div', { className: 'kpi-label' }, 'Cumulé réalisé')
      ]),
      el('div', { className: 'kpi-item' }, [
        el('div', { className: 'kpi-value text-warning' }, formatMontant(data.totaux.totalGlisse, true)),
        el('div', { className: 'kpi-label' }, 'Total glissements')
      ]),
      el('div', { className: 'kpi-item' }, [
        el('div', { className: `kpi-value ${getTauxClass(data.totaux.tauxGlobal)}` }, formatPourcent(data.totaux.tauxGlobal)),
        el('div', { className: 'kpi-label' }, 'Taux global')
      ])
    ]),

    // Graphique trajectoire (simplifié - barres textuelles)
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Trajectoire budgétaire pluriannuelle')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { className: 'trajectoire-chart' },
          data.donnees.map(d => {
            const maxVal = Math.max(...data.donnees.map(x => x.prevu));
            const prevuWidth = (d.prevu / maxVal * 100).toFixed(0);
            const realiseWidth = d.realise ? (d.realise / maxVal * 100).toFixed(0) : 0;

            return el('div', { className: `trajectoire-row ${d.annee === currentYear ? 'current' : ''}` }, [
              el('div', { className: 'trajectoire-year' }, [
                el('span', { className: 'year-label' }, String(d.annee)),
                d.annee === currentYear && el('span', { className: 'badge badge-primary' }, 'En cours')
              ]),
              el('div', { className: 'trajectoire-bars' }, [
                el('div', { className: 'bar-container' }, [
                  el('div', { className: 'bar bar-prevu', style: `width: ${prevuWidth}%` }),
                  el('div', { className: 'bar bar-realise', style: `width: ${realiseWidth}%` }),
                  d.glisse && el('div', {
                    className: 'bar bar-glisse',
                    style: `width: ${(d.glisse / maxVal * 100).toFixed(0)}%; left: ${realiseWidth}%`
                  })
                ])
              ]),
              el('div', { className: 'trajectoire-values' }, [
                el('div', { className: 'value-prevu' }, formatMontant(d.prevu, true)),
                el('div', { className: 'value-realise' }, d.realise ? formatMontant(d.realise, true) : '-'),
                el('div', { className: `value-taux ${d.tauxRealisation ? getTauxClass(d.tauxRealisation) : ''}` },
                  d.tauxRealisation ? formatPourcent(d.tauxRealisation) : '-')
              ])
            ]);
          })
        ),
        el('div', { className: 'trajectoire-legend' }, [
          el('div', { className: 'legend-item' }, [
            el('span', { className: 'legend-color legend-prevu' }),
            el('span', {}, 'Prévu')
          ]),
          el('div', { className: 'legend-item' }, [
            el('span', { className: 'legend-color legend-realise' }),
            el('span', {}, 'Réalisé')
          ]),
          el('div', { className: 'legend-item' }, [
            el('span', { className: 'legend-color legend-glisse' }),
            el('span', {}, 'Glissé')
          ])
        ])
      ])
    ])
  ]);
}

/**
 * Render suivi trimestriel
 */
function renderTrimestriel() {
  const data = MOCK_TRIMESTRIEL;

  return el('div', { className: 'content-section' }, [
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, `Suivi trimestriel ${data.annee}`)
      ]),
      el('div', { className: 'card-body' }, [
        el('table', { className: 'table' }, [
          el('thead', {}, [
            el('tr', {}, [
              el('th', {}, 'Trimestre'),
              el('th', { className: 'text-right' }, 'Notifié'),
              el('th', { className: 'text-right' }, 'Transféré'),
              el('th', { className: 'text-right' }, 'Exécuté'),
              el('th', { className: 'text-center' }, 'Taux'),
              el('th', {}, 'Appréciation'),
              el('th', {}, 'Observations')
            ])
          ]),
          el('tbody', {},
            data.trimestres.map(t =>
              el('tr', { className: getTrimestreRowClass(t.appreciation) }, [
                el('td', { className: 'font-bold' }, `T${t.trimestre}`),
                el('td', { className: 'text-right' }, formatMontant(t.notifie, true)),
                el('td', { className: 'text-right' }, formatMontant(t.transfere, true)),
                el('td', { className: 'text-right' }, formatMontant(t.execute, true)),
                el('td', { className: 'text-center' }, [
                  t.tauxExec !== null
                    ? el('span', { className: `taux-badge ${getTauxClass(t.tauxExec)}` }, formatPourcent(t.tauxExec))
                    : el('span', { className: 'text-muted' }, 'En cours')
                ]),
                el('td', {}, [
                  el('span', { className: `badge badge-${getAppreciationColor(t.appreciation)}` },
                    getAppreciationLabel(t.appreciation))
                ]),
                el('td', { className: 'observations' }, t.observations)
              ])
            )
          ),
          el('tfoot', {}, [
            el('tr', { className: 'total-row' }, [
              el('td', { className: 'font-bold' }, 'Cumul'),
              el('td', { className: 'text-right font-bold' },
                formatMontant(data.trimestres.reduce((s, t) => s + t.notifie, 0), true)),
              el('td', { className: 'text-right font-bold' },
                formatMontant(data.trimestres.reduce((s, t) => s + t.transfere, 0), true)),
              el('td', { className: 'text-right font-bold' },
                formatMontant(data.trimestres.reduce((s, t) => s + t.execute, 0), true)),
              el('td', { colSpan: 3 })
            ])
          ])
        ])
      ])
    ])
  ]);
}

/**
 * Render glissements
 */
function renderGlissements() {
  const data = MOCK_GLISSEMENTS;
  const totalGlisse = data.reduce((s, g) => s + g.montantGlisse, 0);

  return el('div', { className: 'content-section' }, [
    // Résumé
    el('div', { className: 'alert alert-warning' }, [
      el('strong', {}, `${data.length} projets `),
      `avec glissements pour un total de `,
      el('strong', {}, formatMontant(totalGlisse)),
      ` (${getCurrentYear() - 1} → ${getCurrentYear()})`
    ]),

    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Glissements budgétaires inter-annuels')
      ]),
      el('div', { className: 'card-body' }, [
        el('table', { className: 'table' }, [
          el('thead', {}, [
            el('tr', {}, [
              el('th', {}, 'Projet'),
              el('th', {}, 'Origine'),
              el('th', { className: 'text-right' }, 'Prévu'),
              el('th', { className: 'text-right' }, 'Réalisé'),
              el('th', { className: 'text-right' }, 'Glissé'),
              el('th', { className: 'text-center' }, 'Taux'),
              el('th', {}, 'Catégorie'),
              el('th', {}, 'Motif')
            ])
          ]),
          el('tbody', {},
            data.map(g => {
              const isElevé = g.tauxGlissement > 30;
              return el('tr', { className: isElevé ? 'row-warning' : '' }, [
                el('td', {}, [
                  el('div', { className: 'font-bold' }, g.projetCode),
                  el('div', { className: 'text-sm text-muted' }, g.projetNom)
                ]),
                el('td', {}, `${g.anneeOrigine} → ${g.anneeDestination}`),
                el('td', { className: 'text-right' }, formatMontant(g.montantInitial, true)),
                el('td', { className: 'text-right' }, formatMontant(g.montantRealise, true)),
                el('td', { className: 'text-right font-bold text-warning' }, formatMontant(g.montantGlisse, true)),
                el('td', { className: 'text-center' }, [
                  el('span', { className: `badge ${isElevé ? 'badge-error' : 'badge-warning'}` },
                    `-${g.tauxGlissement.toFixed(1)}%`)
                ]),
                el('td', {}, [
                  el('span', { className: 'badge badge-default' }, g.categorieMotif)
                ]),
                el('td', { className: 'observations' }, g.motif)
              ]);
            })
          ),
          el('tfoot', {}, [
            el('tr', { className: 'total-row' }, [
              el('td', { colSpan: 4, className: 'font-bold' }, 'Total'),
              el('td', { className: 'text-right font-bold text-warning' }, formatMontant(totalGlisse, true)),
              el('td', { colSpan: 3 })
            ])
          ])
        ])
      ])
    ]),

    // Règle métier
    el('div', { className: 'alert alert-info' }, [
      el('strong', {}, 'Règle: '),
      'Un glissement > 30% déclenche une alerte critique et nécessite une justification validée par le DCF.'
    ])
  ]);
}

/**
 * Render analyse soutenabilité
 */
function renderSoutenabilite() {
  const data = MOCK_PROJETS_SOUTENABILITE;
  const nonSoutenables = data.filter(p => !p.soutenable);

  return el('div', { className: 'content-section' }, [
    // Alerte si projets non soutenables
    nonSoutenables.length > 0 && el('div', { className: 'alert alert-error' }, [
      el('strong', {}, `${nonSoutenables.length} projet(s) `),
      'identifié(s) comme non soutenable(s) au rythme actuel d\'exécution'
    ]),

    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Analyse de soutenabilité par projet')
      ]),
      el('div', { className: 'card-body' }, [
        el('table', { className: 'table' }, [
          el('thead', {}, [
            el('tr', {}, [
              el('th', {}, 'Projet'),
              el('th', { className: 'text-right' }, 'Coût total'),
              el('th', { className: 'text-right' }, 'Cumulé réalisé'),
              el('th', { className: 'text-right' }, 'Reste à faire'),
              el('th', { className: 'text-center' }, 'Durée restante'),
              el('th', { className: 'text-right' }, 'Capacité ann.'),
              el('th', { className: 'text-center' }, 'Soutenable'),
              el('th', { className: 'text-center' }, 'Risque')
            ])
          ]),
          el('tbody', {},
            data.map(p => {
              const besoinAnnuel = p.dureeRestante > 0 ? p.resteAFaire / (p.dureeRestante / 12) : 0;
              const capacitéOk = besoinAnnuel <= p.capaciteAnnuelle;

              return el('tr', { className: !p.soutenable ? 'row-error' : '' }, [
                el('td', {}, [
                  el('div', { className: 'font-bold' }, p.code),
                  el('div', { className: 'text-sm text-muted' }, p.nom)
                ]),
                el('td', { className: 'text-right' }, formatMontant(p.coutTotal, true)),
                el('td', { className: 'text-right' }, formatMontant(p.cumuleRealise, true)),
                el('td', { className: 'text-right' }, formatMontant(p.resteAFaire, true)),
                el('td', { className: 'text-center' }, `${p.dureeRestante} mois`),
                el('td', { className: 'text-right' }, formatMontant(p.capaciteAnnuelle, true)),
                el('td', { className: 'text-center' }, [
                  p.soutenable
                    ? el('span', { className: 'badge badge-success' }, 'Oui')
                    : el('span', { className: 'badge badge-error' }, 'Non')
                ]),
                el('td', { className: 'text-center' }, [
                  el('span', { className: `badge badge-${getRisqueColor(p.risque)}` }, p.risque)
                ])
              ]);
            })
          )
        ])
      ])
    ]),

    // Légende
    el('div', { className: 'info-box' }, [
      el('h4', {}, 'Critères de soutenabilité'),
      el('ul', {}, [
        el('li', {}, 'Capacité annuelle = moyenne des 3 dernières années d\'exécution'),
        el('li', {}, 'Soutenable = Reste à faire / Durée restante <= Capacité annuelle'),
        el('li', {}, 'Risque élevé = Besoin annuel > 150% de la capacité')
      ])
    ])
  ]);
}

/**
 * Render content based on active tab
 */
function renderContent() {
  switch (state.activeTab) {
    case 'trajectoire': return renderTrajectoire();
    case 'trimestriel': return renderTrimestriel();
    case 'glissements': return renderGlissements();
    case 'soutenabilite': return renderSoutenabilite();
    default: return renderTrajectoire();
  }
}

/**
 * Update filters UI
 */
function updateFilters(handleFilterChange) {
  const filtersContainer = qs('#inv-filters-container');
  if (filtersContainer) {
    const newFilters = createInvFilters(state.filters, handleFilterChange, {
      showSearch: false,
      showVisionToggle: true,
      showTypeProjet: true,
      showBailleur: true,
      showSecteur: false,
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

  // Update tabs
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
  if (taux >= 50) return 'taux-medium';
  return 'taux-low';
}

function getTrimestreRowClass(appreciation) {
  if (appreciation === 'EN_RETARD') return 'row-warning';
  if (appreciation === 'CRITIQUE') return 'row-error';
  return '';
}

function getAppreciationColor(appreciation) {
  const colors = {
    'SATISFAISANT': 'success',
    'EN_BONNE_VOIE': 'success',
    'EN_RETARD': 'warning',
    'CRITIQUE': 'error',
    'EN_COURS': 'info'
  };
  return colors[appreciation] || 'default';
}

function getAppreciationLabel(appreciation) {
  const labels = {
    'SATISFAISANT': 'Satisfaisant',
    'EN_BONNE_VOIE': 'En bonne voie',
    'EN_RETARD': 'En retard',
    'CRITIQUE': 'Critique',
    'EN_COURS': 'En cours'
  };
  return labels[appreciation] || appreciation;
}

function getRisqueColor(risque) {
  const colors = { 'FAIBLE': 'success', 'MOYEN': 'warning', 'ELEVE': 'error' };
  return colors[risque] || 'default';
}

/**
 * Main render function
 */
export async function renderInvSoutenabilite() {
  logger.info('[Investissement] Rendering Soutenabilite...');

  const handleFilterChange = (newFilters) => {
    state.filters = newFilters;
    updateContent(handleFilterChange);
  };

  const page = el('div', { className: 'page-layout inv-layout' }, [
    renderInvSidebar('/investissement/soutenabilite'),

    el('main', { className: 'page-main' }, [
      // Header
      el('div', { className: 'page-header' }, [
        el('div', { className: 'page-header-content' }, [
          el('h1', { className: 'page-title' }, 'Soutenabilité & Pluriannualité'),
          el('p', { className: 'page-subtitle' }, 'Analyse de la trajectoire budgétaire et soutenabilité des projets')
        ])
      ]),

      // Filtres transverses
      createInvFilters(state.filters, handleFilterChange, {
        showSearch: false,
        showVisionToggle: true,
        showTypeProjet: true,
        showBailleur: true,
        showSecteur: false,
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
  injectSoutenabiliteStyles();

  logger.info('[Investissement] Soutenabilite rendered');
}

function injectSoutenabiliteStyles() {
  const styleId = 'inv-soutenabilite-styles';
  if (document.getElementById(styleId)) return;

  const styles = `
    /* KPI Row */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .kpi-item {
      background: var(--color-surface);
      padding: 1.25rem;
      border-radius: 0.5rem;
      border: 1px solid var(--color-border);
      text-align: center;
    }

    .kpi-value {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .kpi-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-top: 0.25rem;
    }

    /* Trajectoire chart */
    .trajectoire-chart {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .trajectoire-row {
      display: grid;
      grid-template-columns: 120px 1fr 200px;
      gap: 1rem;
      align-items: center;
      padding: 0.75rem;
      border-radius: 0.375rem;
    }

    .trajectoire-row.current {
      background: #eff6ff;
      border: 1px solid #93c5fd;
    }

    .trajectoire-year {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .year-label {
      font-weight: 600;
      font-size: 1.125rem;
    }

    .trajectoire-bars {
      position: relative;
    }

    .bar-container {
      position: relative;
      height: 2rem;
      background: #f3f4f6;
      border-radius: 0.25rem;
      overflow: hidden;
    }

    .bar {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      transition: width 0.3s;
    }

    .bar-prevu {
      background: #e5e7eb;
    }

    .bar-realise {
      background: #22c55e;
    }

    .bar-glisse {
      background: #f59e0b;
      opacity: 0.7;
    }

    .trajectoire-values {
      display: flex;
      gap: 1rem;
      font-size: 0.875rem;
    }

    .value-prevu {
      color: var(--color-text-muted);
    }

    .value-realise {
      font-weight: 600;
    }

    .value-taux {
      font-weight: 700;
    }

    .trajectoire-legend {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .legend-color {
      width: 1rem;
      height: 1rem;
      border-radius: 0.25rem;
    }

    .legend-prevu { background: #e5e7eb; }
    .legend-realise { background: #22c55e; }
    .legend-glisse { background: #f59e0b; }

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

    .observations {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      max-width: 200px;
    }

    .row-warning {
      background: #fffbeb;
    }

    .row-error {
      background: #fef2f2;
    }

    .total-row {
      background: var(--color-surface-alt);
      font-weight: 600;
    }

    .text-warning {
      color: #f59e0b;
    }

    .taux-good { color: #16a34a; }
    .taux-medium { color: #ca8a04; }
    .taux-low { color: #dc2626; }

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

    /* Alert */
    .alert {
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
    }

    .alert-warning {
      background: #fffbeb;
      border: 1px solid #fcd34d;
      color: #92400e;
    }

    .alert-error {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      color: #991b1b;
    }

    .alert-info {
      background: #eff6ff;
      border: 1px solid #93c5fd;
      color: #1e40af;
    }

    /* Tabs */
    .tabs-nav {
      display: flex;
      gap: 0.25rem;
      background: var(--color-surface);
      padding: 0.5rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      border: 1px solid var(--color-border);
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      background: var(--color-hover);
    }

    .tab-btn.active {
      background: var(--color-primary);
      color: white;
    }

    /* Sidebar section */
    .sidebar-section {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
    }

    .sidebar-section-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
      padding: 0 1rem;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

export default renderInvSoutenabilite;
