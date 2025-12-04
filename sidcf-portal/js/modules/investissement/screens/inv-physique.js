/* ============================================
   Écran Suivi Physique - Module Investissement
   ============================================
   Axe 3: Suivi physique, RSF & Missions terrain
   - Missions terrain (périodiques, ponctuelles)
   - RSF par classe de dépense (2/6)
   - Mission baseline post-OS
   - Alertes retard missions
   ============================================ */

import { el, mount, qs } from '../../../lib/dom.js';
import { money, date, percent, abbreviate } from '../../../lib/format.js';
import router from '../../../router.js';
import logger from '../../../lib/logger.js';
import { INV_SIDEBAR_MENU, getCurrentYear, createSidebarMenuItems, getMenuIcon } from '../inv-constants.js';
import { createInvFilters, injectFilterStyles, DEFAULT_FILTERS } from '../components/inv-filters.js';

// Aliases
const formatMontant = (amount, short = false) => short ? abbreviate(amount) : money(amount);
const formatDate = (d) => date(d);
const formatPourcent = (val) => percent(val);

// Mock statistiques globales
const MOCK_STATS = {
  totalMissions: 47,
  missionsPeriodiques: 35,
  missionsPonctuelles: 12,
  missionsEnRetard: 5,
  totalRsf: 28,
  rsfClasse2: 22,
  rsfClasse6: 6,
  rsfManquants: 4,
  projetsAvecBaseline: 38,
  projetsSansBaseline: 9,
  tauxConformite: 84.5
};

// Mock missions récentes
const MOCK_MISSIONS = [
  {
    id: 'm1',
    projetCode: 'PAPSE-II',
    projetNom: 'Programme Éducation II',
    type: 'PERIODIQUE',
    localisation: 'Bouaké, Korhogo',
    dateMission: '2024-11-15',
    dateRapport: '2024-11-20',
    resultat: 'CONFORME',
    observations: 'Construction en bonne progression, 85% des travaux terminés. Qualité conforme aux normes.',
    photos: 12,
    agentCf: 'KOUASSI Y.',
    isBaseline: false
  },
  {
    id: 'm2',
    projetCode: 'ProSEB',
    projetNom: 'Éducation de Base',
    type: 'PERIODIQUE',
    localisation: 'Abidjan',
    dateMission: '2024-11-10',
    dateRapport: '2024-11-12',
    resultat: 'ECART_MINEUR',
    observations: 'Retard livraison équipements (2 semaines). Qualité globale satisfaisante.',
    photos: 8,
    agentCf: 'N\'GORAN K.',
    isBaseline: false
  },
  {
    id: 'm3',
    projetCode: 'PRICI',
    projetNom: 'Renaissance Infrastructures',
    type: 'PONCTUELLE',
    localisation: 'Yamoussoukro',
    dateMission: '2024-11-05',
    dateRapport: '2024-11-08',
    resultat: 'ECART_MAJEUR',
    observations: 'Non-conformité détectée sur lot 3 (étanchéité). Mise en demeure entrepreneur.',
    photos: 15,
    agentCf: 'TRAORE M.',
    isBaseline: false
  },
  {
    id: 'm4',
    projetCode: 'PASEA',
    projetNom: 'Eau & Assainissement',
    type: 'BASELINE',
    localisation: 'San Pedro',
    dateMission: '2024-10-20',
    dateRapport: '2024-10-25',
    resultat: 'CONFORME',
    observations: 'Mission baseline post-OS. État des lieux complet réalisé.',
    photos: 25,
    agentCf: 'KOFFI A.',
    isBaseline: true
  },
  {
    id: 'm5',
    projetCode: 'PNACC',
    projetNom: 'Adaptation Climat',
    type: 'PERIODIQUE',
    localisation: 'Man, Danané',
    dateMission: '2024-09-28',
    dateRapport: null,
    resultat: 'EN_ATTENTE',
    observations: 'Rapport non encore soumis',
    photos: 0,
    agentCf: 'YAO E.',
    isBaseline: false
  }
];

// Mock RSF
const MOCK_RSF = [
  {
    id: 'rsf1',
    projetCode: 'PAPSE-II',
    projetNom: 'Programme Éducation II',
    reference: 'RSF-2024-045',
    classeDepense: 2,
    montantConcerne: 2500000000,
    dateRsf: '2024-11-18',
    statut: 'VALIDE',
    missionAssociee: 'm1',
    preuvePhysique: true,
    observations: 'RSF validé après mission terrain Bouaké'
  },
  {
    id: 'rsf2',
    projetCode: 'ProSEB',
    projetNom: 'Éducation de Base',
    reference: 'RSF-2024-042',
    classeDepense: 2,
    montantConcerne: 1800000000,
    dateRsf: '2024-11-12',
    statut: 'VALIDE',
    missionAssociee: 'm2',
    preuvePhysique: true,
    observations: 'Équipements livrés vérifiés'
  },
  {
    id: 'rsf3',
    projetCode: 'PRICI',
    projetNom: 'Renaissance Infrastructures',
    reference: 'RSF-2024-038',
    classeDepense: 2,
    montantConcerne: 5200000000,
    dateRsf: '2024-11-08',
    statut: 'SUSPENDU',
    missionAssociee: 'm3',
    preuvePhysique: false,
    observations: 'Suspendu suite écart majeur détecté'
  },
  {
    id: 'rsf4',
    projetCode: 'PEJEDEC',
    projetNom: 'Emploi Jeunes',
    reference: 'RSF-2024-035',
    classeDepense: 6,
    montantConcerne: 850000000,
    dateRsf: '2024-10-30',
    statut: 'VALIDE',
    missionAssociee: null,
    preuvePhysique: false,
    observations: 'Classe 6 - RSF documentaire'
  }
];

// Mock projets en retard de mission
const MOCK_RETARDS = [
  { projetCode: 'PNACC', projetNom: 'Adaptation Climat', derniereMission: '2024-08-15', joursDepuis: 92, periodicite: 60, retard: 32 },
  { projetCode: 'PDCI', projetNom: 'Développement Communautaire', derniereMission: '2024-09-01', joursDepuis: 75, periodicite: 60, retard: 15 },
  { projetCode: 'PSAC', projetNom: 'Secteur Agricole', derniereMission: '2024-09-20', joursDepuis: 56, periodicite: 60, retard: 0 },
  { projetCode: 'C2D-SANTE', projetNom: 'Santé C2D Phase III', derniereMission: '2024-08-28', joursDepuis: 78, periodicite: 60, retard: 18 },
  { projetCode: 'PNGR', projetNom: 'Gestion Risques', derniereMission: '2024-09-10', joursDepuis: 66, periodicite: 60, retard: 6 }
];

// State
let state = {
  filters: { ...DEFAULT_FILTERS },
  activeTab: 'dashboard'
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
    { id: 'missions', label: 'Missions terrain', icon: '🚗' },
    { id: 'rsf', label: 'RSF', icon: '📋' },
    { id: 'retards', label: 'Retards', icon: '⚠️' }
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
        tab.id === 'retards' && MOCK_STATS.missionsEnRetard > 0 &&
          el('span', { className: 'tab-badge badge-error' }, String(MOCK_STATS.missionsEnRetard))
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
    el('div', { className: 'kpi-grid-physique' }, [
      el('div', { className: 'kpi-card' }, [
        el('div', { className: 'kpi-header' }, [
          el('span', { className: 'kpi-icon' }, '🚗'),
          el('span', { className: 'kpi-title' }, 'Missions terrain')
        ]),
        el('div', { className: 'kpi-body' }, [
          el('div', { className: 'kpi-main-value' }, String(stats.totalMissions)),
          el('div', { className: 'kpi-details' }, [
            el('span', {}, `${stats.missionsPeriodiques} périodiques`),
            el('span', {}, `${stats.missionsPonctuelles} ponctuelles`)
          ])
        ]),
        stats.missionsEnRetard > 0 && el('div', { className: 'kpi-alert' }, [
          el('span', { className: 'badge badge-error' }, `${stats.missionsEnRetard} en retard`)
        ])
      ]),

      el('div', { className: 'kpi-card' }, [
        el('div', { className: 'kpi-header' }, [
          el('span', { className: 'kpi-icon' }, '📋'),
          el('span', { className: 'kpi-title' }, 'RSF émis')
        ]),
        el('div', { className: 'kpi-body' }, [
          el('div', { className: 'kpi-main-value' }, String(stats.totalRsf)),
          el('div', { className: 'kpi-details' }, [
            el('span', {}, `${stats.rsfClasse2} Classe 2`),
            el('span', {}, `${stats.rsfClasse6} Classe 6`)
          ])
        ]),
        stats.rsfManquants > 0 && el('div', { className: 'kpi-alert' }, [
          el('span', { className: 'badge badge-warning' }, `${stats.rsfManquants} manquants`)
        ])
      ]),

      el('div', { className: 'kpi-card' }, [
        el('div', { className: 'kpi-header' }, [
          el('span', { className: 'kpi-icon' }, '🎯'),
          el('span', { className: 'kpi-title' }, 'Mission baseline')
        ]),
        el('div', { className: 'kpi-body' }, [
          el('div', { className: 'kpi-main-value' }, String(stats.projetsAvecBaseline)),
          el('div', { className: 'kpi-details' }, [
            el('span', {}, 'projets avec baseline')
          ])
        ]),
        stats.projetsSansBaseline > 0 && el('div', { className: 'kpi-alert' }, [
          el('span', { className: 'badge badge-warning' }, `${stats.projetsSansBaseline} sans baseline`)
        ])
      ]),

      el('div', { className: 'kpi-card kpi-conformite' }, [
        el('div', { className: 'kpi-header' }, [
          el('span', { className: 'kpi-icon' }, '✅'),
          el('span', { className: 'kpi-title' }, 'Conformité')
        ]),
        el('div', { className: 'kpi-body' }, [
          el('div', { className: `kpi-main-value ${getTauxClass(stats.tauxConformite)}` },
            formatPourcent(stats.tauxConformite)),
          el('div', { className: 'kpi-details' }, [
            el('span', {}, 'taux de conformité')
          ])
        ])
      ])
    ]),

    // Règles métier
    el('div', { className: 'rules-card' }, [
      el('h3', { className: 'rules-title' }, 'Règles de suivi physique DCF'),
      el('div', { className: 'rules-grid' }, [
        el('div', { className: 'rule-item' }, [
          el('div', { className: 'rule-class' }, 'Classe 2'),
          el('div', { className: 'rule-desc' }, 'RSF systématiques obligatoires avec preuves physiques (photos)'),
          el('div', { className: 'rule-badge' }, el('span', { className: 'badge badge-error' }, 'Obligatoire'))
        ]),
        el('div', { className: 'rule-item' }, [
          el('div', { className: 'rule-class' }, 'Classe 6'),
          el('div', { className: 'rule-desc' }, 'RSF documentaires sans obligation de preuve physique'),
          el('div', { className: 'rule-badge' }, el('span', { className: 'badge badge-info' }, 'Recommandé'))
        ]),
        el('div', { className: 'rule-item' }, [
          el('div', { className: 'rule-class' }, 'Baseline'),
          el('div', { className: 'rule-desc' }, 'Mission obligatoire après OS de démarrage'),
          el('div', { className: 'rule-badge' }, el('span', { className: 'badge badge-error' }, 'Obligatoire'))
        ]),
        el('div', { className: 'rule-item' }, [
          el('div', { className: 'rule-class' }, 'Périodicité'),
          el('div', { className: 'rule-desc' }, 'Missions terrain tous les 60 jours par défaut'),
          el('div', { className: 'rule-badge' }, el('span', { className: 'badge badge-warning' }, 'Paramétrable'))
        ])
      ])
    ]),

    // Dernières missions
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Dernières missions'),
        el('a', {
          className: 'btn btn-sm btn-ghost',
          onclick: () => { state.activeTab = 'missions'; updateContent(); }
        }, 'Voir tout →')
      ]),
      el('div', { className: 'card-body' }, [
        renderMissionsTable(MOCK_MISSIONS.slice(0, 3))
      ])
    ])
  ]);
}

/**
 * Render missions
 */
function renderMissions() {
  return el('div', { className: 'content-section' }, [
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Missions terrain'),
        el('div', { className: 'card-actions' }, [
          el('button', { className: 'btn btn-sm btn-primary' }, '+ Nouvelle mission')
        ])
      ]),
      el('div', { className: 'card-body' }, [
        renderMissionsTable(MOCK_MISSIONS)
      ])
    ])
  ]);
}

/**
 * Render missions table
 */
function renderMissionsTable(missions) {
  return el('table', { className: 'table' }, [
    el('thead', {}, [
      el('tr', {}, [
        el('th', {}, 'Projet'),
        el('th', {}, 'Type'),
        el('th', {}, 'Localisation'),
        el('th', {}, 'Date'),
        el('th', {}, 'Résultat'),
        el('th', { className: 'text-center' }, 'Photos'),
        el('th', {}, 'Agent CF'),
        el('th', {}, '')
      ])
    ]),
    el('tbody', {},
      missions.map(m =>
        el('tr', { className: getResultatRowClass(m.resultat) }, [
          el('td', {}, [
            el('div', { className: 'font-bold' }, m.projetCode),
            el('div', { className: 'text-sm text-muted' }, m.projetNom)
          ]),
          el('td', {}, [
            el('span', { className: `badge badge-${getTypeMissionColor(m.type)}` },
              m.isBaseline ? 'BASELINE' : m.type)
          ]),
          el('td', {}, m.localisation),
          el('td', {}, [
            el('div', {}, formatDate(m.dateMission)),
            m.dateRapport
              ? el('div', { className: 'text-sm text-muted' }, `Rapport: ${formatDate(m.dateRapport)}`)
              : el('div', { className: 'text-sm text-warning' }, 'Rapport en attente')
          ]),
          el('td', {}, [
            el('span', { className: `badge badge-${getResultatColor(m.resultat)}` },
              getResultatLabel(m.resultat))
          ]),
          el('td', { className: 'text-center' }, [
            m.photos > 0
              ? el('span', { className: 'photos-badge' }, `📷 ${m.photos}`)
              : el('span', { className: 'text-muted' }, '-')
          ]),
          el('td', {}, m.agentCf),
          el('td', {}, [
            el('button', {
              className: 'btn btn-sm btn-ghost',
              onclick: () => router.navigate('/investissement/projet', { id: m.projetCode.toLowerCase() })
            }, 'Voir')
          ])
        ])
      )
    )
  ]);
}

/**
 * Render RSF
 */
function renderRsf() {
  return el('div', { className: 'content-section' }, [
    // Résumé par classe
    el('div', { className: 'rsf-summary' }, [
      el('div', { className: 'rsf-summary-item' }, [
        el('div', { className: 'rsf-class' }, 'Classe 2'),
        el('div', { className: 'rsf-count' }, String(MOCK_STATS.rsfClasse2)),
        el('div', { className: 'rsf-desc' }, 'Investissement (obligatoire)')
      ]),
      el('div', { className: 'rsf-summary-item' }, [
        el('div', { className: 'rsf-class' }, 'Classe 6'),
        el('div', { className: 'rsf-count' }, String(MOCK_STATS.rsfClasse6)),
        el('div', { className: 'rsf-desc' }, 'Transferts courants')
      ])
    ]),

    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Relevés de Service Fait (RSF)')
      ]),
      el('div', { className: 'card-body' }, [
        el('table', { className: 'table' }, [
          el('thead', {}, [
            el('tr', {}, [
              el('th', {}, 'Projet'),
              el('th', {}, 'Référence'),
              el('th', { className: 'text-center' }, 'Classe'),
              el('th', { className: 'text-right' }, 'Montant'),
              el('th', {}, 'Date'),
              el('th', { className: 'text-center' }, 'Preuve'),
              el('th', {}, 'Statut'),
              el('th', {}, 'Observations')
            ])
          ]),
          el('tbody', {},
            MOCK_RSF.map(r =>
              el('tr', { className: r.statut === 'SUSPENDU' ? 'row-warning' : '' }, [
                el('td', {}, [
                  el('div', { className: 'font-bold' }, r.projetCode),
                  el('div', { className: 'text-sm text-muted' }, r.projetNom)
                ]),
                el('td', { className: 'font-mono' }, r.reference),
                el('td', { className: 'text-center' }, [
                  el('span', { className: `badge badge-${r.classeDepense === 2 ? 'error' : 'info'}` },
                    `Cl. ${r.classeDepense}`)
                ]),
                el('td', { className: 'text-right' }, formatMontant(r.montantConcerne, true)),
                el('td', {}, formatDate(r.dateRsf)),
                el('td', { className: 'text-center' }, [
                  r.preuvePhysique
                    ? el('span', { className: 'badge badge-success' }, '📷 Oui')
                    : el('span', { className: r.classeDepense === 2 ? 'badge badge-error' : 'badge badge-default' },
                        r.classeDepense === 2 ? 'Manquant' : 'N/A')
                ]),
                el('td', {}, [
                  el('span', { className: `badge badge-${getStatutRsfColor(r.statut)}` }, r.statut)
                ]),
                el('td', { className: 'observations' }, r.observations)
              ])
            )
          )
        ])
      ])
    ])
  ]);
}

/**
 * Render retards
 */
function renderRetards() {
  const retards = MOCK_RETARDS.filter(r => r.retard > 0);

  return el('div', { className: 'content-section' }, [
    retards.length > 0
      ? el('div', { className: 'alert alert-error' }, [
          el('strong', {}, `${retards.length} projet(s) `),
          'en retard de mission terrain. Action requise.'
        ])
      : el('div', { className: 'alert alert-success' }, [
          el('strong', {}, 'Aucun retard '),
          '- Toutes les missions sont à jour.'
        ]),

    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Suivi des retards de mission')
      ]),
      el('div', { className: 'card-body' }, [
        el('table', { className: 'table' }, [
          el('thead', {}, [
            el('tr', {}, [
              el('th', {}, 'Projet'),
              el('th', {}, 'Dernière mission'),
              el('th', { className: 'text-center' }, 'Jours depuis'),
              el('th', { className: 'text-center' }, 'Périodicité'),
              el('th', { className: 'text-center' }, 'Retard'),
              el('th', {}, 'Statut'),
              el('th', {}, '')
            ])
          ]),
          el('tbody', {},
            MOCK_RETARDS.map(r => {
              const isEnRetard = r.retard > 0;
              const isCritique = r.retard > 30;

              return el('tr', { className: isCritique ? 'row-error' : isEnRetard ? 'row-warning' : '' }, [
                el('td', {}, [
                  el('div', { className: 'font-bold' }, r.projetCode),
                  el('div', { className: 'text-sm text-muted' }, r.projetNom)
                ]),
                el('td', {}, formatDate(r.derniereMission)),
                el('td', { className: 'text-center' }, `${r.joursDepuis} j`),
                el('td', { className: 'text-center' }, `${r.periodicite} j`),
                el('td', { className: 'text-center' }, [
                  isEnRetard
                    ? el('span', { className: `badge ${isCritique ? 'badge-error' : 'badge-warning'}` },
                        `+${r.retard} j`)
                    : el('span', { className: 'badge badge-success' }, 'OK')
                ]),
                el('td', {}, [
                  isCritique
                    ? el('span', { className: 'badge badge-error' }, 'Critique')
                    : isEnRetard
                      ? el('span', { className: 'badge badge-warning' }, 'En retard')
                      : el('span', { className: 'badge badge-success' }, 'À jour')
                ]),
                el('td', {}, [
                  isEnRetard && el('button', {
                    className: 'btn btn-sm btn-primary',
                    title: 'Planifier une mission'
                  }, 'Planifier')
                ])
              ]);
            })
          )
        ])
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
    case 'missions': return renderMissions();
    case 'rsf': return renderRsf();
    case 'retards': return renderRetards();
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
      showVisionToggle: false,
      showTypeProjet: true,
      showBailleur: true,
      showSecteur: true,
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

function getTypeMissionColor(type) {
  const colors = { 'PERIODIQUE': 'primary', 'PONCTUELLE': 'info', 'BASELINE': 'warning' };
  return colors[type] || 'default';
}

function getResultatColor(resultat) {
  const colors = {
    'CONFORME': 'success',
    'ECART_MINEUR': 'info',
    'ECART_MAJEUR': 'warning',
    'NON_CONFORME': 'error',
    'EN_ATTENTE': 'default'
  };
  return colors[resultat] || 'default';
}

function getResultatLabel(resultat) {
  const labels = {
    'CONFORME': 'Conforme',
    'ECART_MINEUR': 'Écart mineur',
    'ECART_MAJEUR': 'Écart majeur',
    'NON_CONFORME': 'Non conforme',
    'EN_ATTENTE': 'En attente'
  };
  return labels[resultat] || resultat;
}

function getResultatRowClass(resultat) {
  if (resultat === 'ECART_MAJEUR' || resultat === 'NON_CONFORME') return 'row-warning';
  return '';
}

function getStatutRsfColor(statut) {
  const colors = { 'VALIDE': 'success', 'SUSPENDU': 'warning', 'REJETE': 'error', 'EN_ATTENTE': 'default' };
  return colors[statut] || 'default';
}

/**
 * Main render function
 */
export async function renderInvPhysique() {
  logger.info('[Investissement] Rendering Physique...');

  const handleFilterChange = (newFilters) => {
    state.filters = newFilters;
    updateContent(handleFilterChange);
  };

  const page = el('div', { className: 'page-layout inv-layout' }, [
    renderInvSidebar('/investissement/physique'),

    el('main', { className: 'page-main' }, [
      // Header
      el('div', { className: 'page-header' }, [
        el('div', { className: 'page-header-content' }, [
          el('h1', { className: 'page-title' }, 'Suivi Physique'),
          el('p', { className: 'page-subtitle' }, 'Missions terrain, RSF et contrôle de l\'exécution physique')
        ])
      ]),

      // Filtres
      createInvFilters(state.filters, handleFilterChange, {
        showSearch: true,
        showVisionToggle: false,
        showTypeProjet: true,
        showBailleur: true,
        showSecteur: true,
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
  injectPhysiqueStyles();

  logger.info('[Investissement] Physique rendered');
}

function injectPhysiqueStyles() {
  const styleId = 'inv-physique-styles';
  if (document.getElementById(styleId)) return;

  const styles = `
    /* KPI Grid Physique */
    .kpi-grid-physique {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .kpi-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
      padding: 1rem;
    }

    .kpi-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .kpi-icon {
      font-size: 1.25rem;
    }

    .kpi-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    .kpi-body {
      text-align: center;
    }

    .kpi-main-value {
      font-size: 2rem;
      font-weight: 700;
    }

    .kpi-details {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-top: 0.25rem;
    }

    .kpi-alert {
      margin-top: 0.75rem;
      text-align: center;
    }

    .kpi-conformite {
      border-left: 4px solid #22c55e;
    }

    /* Rules card */
    .rules-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .rules-title {
      font-size: 0.875rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }

    .rules-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .rule-item {
      padding: 0.75rem;
      background: var(--color-surface-alt);
      border-radius: 0.375rem;
    }

    .rule-class {
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .rule-desc {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-bottom: 0.5rem;
    }

    /* RSF Summary */
    .rsf-summary {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .rsf-summary-item {
      flex: 1;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
      padding: 1.25rem;
      text-align: center;
    }

    .rsf-class {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
    }

    .rsf-count {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--color-primary);
    }

    .rsf-desc {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    /* Tab badge */
    .tab-badge {
      margin-left: 0.5rem;
      font-size: 0.625rem;
      padding: 0.125rem 0.375rem;
      border-radius: 9999px;
    }

    .badge-error {
      background: #dc2626;
      color: white;
    }

    /* Photos badge */
    .photos-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
    }

    /* Table overrides */
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

    .font-mono {
      font-family: var(--font-mono);
    }

    .taux-good { color: #16a34a; }
    .taux-medium { color: #ca8a04; }
    .taux-low { color: #dc2626; }

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

    .alert-error {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      color: #991b1b;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .kpi-grid-physique {
        grid-template-columns: repeat(2, 1fr);
      }
      .rules-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .kpi-grid-physique,
      .rules-grid {
        grid-template-columns: 1fr;
      }
      .rsf-summary {
        flex-direction: column;
      }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

export default renderInvPhysique;
