/* ============================================
   Écran Gouvernance - Module Investissement
   ============================================
   Axe 6: Gouvernance & Documentation
   - Matrice documentaire par phase
   - Documents obligatoires / recommandés
   - Fiches de décision CF/DCF
   - Suivi de la conformité documentaire
   ============================================ */

import { el, mount, qs } from '../../../lib/dom.js';
import { date } from '../../../lib/format.js';
import router from '../../../router.js';
import logger from '../../../lib/logger.js';
import { INV_SIDEBAR_MENU, getCurrentYear, createSidebarMenuItems, getMenuIcon } from '../inv-constants.js';
import { createInvFilters, injectFilterStyles, DEFAULT_FILTERS } from '../components/inv-filters.js';

// Aliases
const formatDate = (d) => date(d);

// Mock statistiques gouvernance
const MOCK_STATS = {
  totalDocuments: 156,
  documentsValides: 128,
  documentsEnAttente: 18,
  documentsManquants: 10,
  tauxConformite: 82.1,
  decisionsEnAttente: 4,
  decisionsRendues: 38
};

// Matrice documentaire par phase
const MATRICE_DOCUMENTAIRE = {
  phases: ['IDENTIFICATION', 'PREPARATION', 'EVALUATION', 'NEGOCIATION', 'EXECUTION', 'CLOTURE'],
  documents: [
    {
      code: 'FV',
      libelle: 'Fiche de vie du projet',
      phases: { IDENTIFICATION: 'OBLIGATOIRE', PREPARATION: 'MISE_A_JOUR', EXECUTION: 'MISE_A_JOUR' },
      description: 'Document de suivi synthétique du projet'
    },
    {
      code: 'PTBA',
      libelle: 'Plan de Travail Budgétisé Annuel',
      phases: { EXECUTION: 'OBLIGATOIRE' },
      description: 'Programme annuel d\'activités et budget'
    },
    {
      code: 'CL',
      libelle: 'Cadre logique',
      phases: { PREPARATION: 'OBLIGATOIRE', EVALUATION: 'MISE_A_JOUR' },
      description: 'Cadre des résultats GAR'
    },
    {
      code: 'RAP',
      libelle: 'Rapport d\'avancement',
      phases: { EXECUTION: 'OBLIGATOIRE' },
      description: 'Rapport trimestriel d\'avancement'
    },
    {
      code: 'RAF',
      libelle: 'Rapport d\'audit financier',
      phases: { EXECUTION: 'OBLIGATOIRE', CLOTURE: 'OBLIGATOIRE' },
      description: 'Audit externe des comptes'
    },
    {
      code: 'RSF',
      libelle: 'Relevé de Service Fait',
      phases: { EXECUTION: 'OBLIGATOIRE' },
      description: 'Validation physique des prestations'
    },
    {
      code: 'PV_COMITE',
      libelle: 'PV Comité de pilotage',
      phases: { EXECUTION: 'RECOMMANDE' },
      description: 'Compte-rendu des réunions de pilotage'
    },
    {
      code: 'DCF',
      libelle: 'Décision CF',
      phases: { EXECUTION: 'OBLIGATOIRE' },
      description: 'Avis du Contrôleur Financier'
    },
    {
      code: 'RAC',
      libelle: 'Rapport d\'achèvement',
      phases: { CLOTURE: 'OBLIGATOIRE' },
      description: 'Bilan final du projet'
    },
    {
      code: 'PV_RECEP',
      libelle: 'PV de réception',
      phases: { CLOTURE: 'OBLIGATOIRE' },
      description: 'Réception provisoire ou définitive'
    }
  ]
};

// Mock documents projets
const MOCK_DOCUMENTS = [
  {
    projetCode: 'PAPSE-II',
    projetNom: 'Programme Éducation II',
    type: 'PTBA',
    titre: 'PTBA 2024',
    reference: 'PTBA-2024-001',
    dateDocument: '2024-01-10',
    dateValidation: '2024-01-15',
    statut: 'VALIDE',
    validePar: 'CF / DCF'
  },
  {
    projetCode: 'PAPSE-II',
    projetNom: 'Programme Éducation II',
    type: 'RAP',
    titre: 'Rapport T3 2024',
    reference: 'RAP-Q3-2024',
    dateDocument: '2024-10-05',
    dateValidation: null,
    statut: 'EN_ATTENTE',
    validePar: null
  },
  {
    projetCode: 'PRICI',
    projetNom: 'Infrastructures CI',
    type: 'RAF',
    titre: 'Audit 2023',
    reference: 'RAF-2023-PRICI',
    dateDocument: '2024-03-15',
    dateValidation: '2024-04-01',
    statut: 'VALIDE',
    validePar: 'Cabinet externe'
  },
  {
    projetCode: 'PASEA',
    projetNom: 'Eau & Assainissement',
    type: 'DCF',
    titre: 'Avis Avenant n°2',
    reference: 'DCF-2024-045',
    dateDocument: '2024-06-20',
    dateValidation: '2024-06-25',
    statut: 'VALIDE',
    validePar: 'DCF'
  },
  {
    projetCode: 'PEJEDEC',
    projetNom: 'Emploi Jeunes',
    type: 'FV',
    titre: 'Fiche de vie - Mise à jour',
    reference: 'FV-PEJEDEC-2024',
    dateDocument: '2024-09-01',
    dateValidation: null,
    statut: 'EN_ATTENTE',
    validePar: null
  }
];

// Mock décisions CF/DCF
const MOCK_DECISIONS = [
  {
    reference: 'DCF-2024-052',
    type: 'AVIS_MARCHE',
    projetCode: 'PAPSE-II',
    projetNom: 'Programme Éducation II',
    objet: 'Avis sur marché construction lot 3',
    montant: 2500000000,
    emetteur: 'CF',
    dateEmission: '2024-11-15',
    sens: 'FAVORABLE',
    observations: 'Avis favorable sous réserve de garantie bancaire'
  },
  {
    reference: 'DCF-2024-051',
    type: 'AVIS_AVENANT',
    projetCode: 'PRICI',
    projetNom: 'Infrastructures CI',
    objet: 'Avis sur avenant n°3 - Prolongation délai',
    montant: 0,
    emetteur: 'DCF',
    dateEmission: '2024-11-10',
    sens: 'FAVORABLE',
    observations: 'Prolongation de 6 mois accordée'
  },
  {
    reference: 'DCF-2024-050',
    type: 'AVIS_BUDGET',
    projetCode: 'PASEA',
    projetNom: 'Eau & Assainissement',
    objet: 'Avis sur révision budget éclaté',
    montant: 5200000000,
    emetteur: 'CF',
    dateEmission: '2024-11-05',
    sens: 'RESERVE',
    observations: 'Demande de justification sur ligne équipements'
  },
  {
    reference: 'DCF-2024-049',
    type: 'AVIS_MARCHE',
    projetCode: 'PEJEDEC',
    projetNom: 'Emploi Jeunes',
    objet: 'Avis sur marché formation - Gré à gré',
    montant: 450000000,
    emetteur: 'CF',
    dateEmission: '2024-10-28',
    sens: 'DEFAVORABLE',
    observations: 'Procédure de gré à gré non justifiée'
  }
];

// Mock documents manquants
const MOCK_MANQUANTS = [
  { projetCode: 'PNACC', projetNom: 'Adaptation Climat', type: 'PTBA', phase: 'EXECUTION', delaiJours: 45 },
  { projetCode: 'PNGR', projetNom: 'Gestion Risques', type: 'RAF', phase: 'EXECUTION', delaiJours: 120 },
  { projetCode: 'PDCI', projetNom: 'Développement Communautaire', type: 'CL', phase: 'PREPARATION', delaiJours: 90 }
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
    { id: 'matrice', label: 'Matrice documentaire', icon: '📋' },
    { id: 'documents', label: 'Documents', icon: '📁' },
    { id: 'decisions', label: 'Décisions CF', icon: '⚖️' },
    { id: 'manquants', label: 'Manquants', icon: '⚠️' }
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
        tab.id === 'manquants' && MOCK_STATS.documentsManquants > 0 &&
          el('span', { className: 'tab-badge badge-error' }, String(MOCK_STATS.documentsManquants))
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
    el('div', { className: 'gov-kpi-grid' }, [
      el('div', { className: 'gov-kpi-card' }, [
        el('div', { className: 'gov-kpi-icon' }, '📄'),
        el('div', { className: 'gov-kpi-content' }, [
          el('div', { className: 'gov-kpi-value' }, String(stats.totalDocuments)),
          el('div', { className: 'gov-kpi-label' }, 'Documents totaux')
        ]),
        el('div', { className: 'gov-kpi-breakdown' }, [
          el('span', { className: 'breakdown-success' }, `${stats.documentsValides} validés`),
          el('span', { className: 'breakdown-warning' }, `${stats.documentsEnAttente} en attente`),
          el('span', { className: 'breakdown-error' }, `${stats.documentsManquants} manquants`)
        ])
      ]),

      el('div', { className: 'gov-kpi-card gov-kpi-conformite' }, [
        el('div', { className: 'gov-kpi-icon' }, '✅'),
        el('div', { className: 'gov-kpi-content' }, [
          el('div', { className: `gov-kpi-value ${getTauxClass(stats.tauxConformite)}` },
            `${stats.tauxConformite.toFixed(1)}%`),
          el('div', { className: 'gov-kpi-label' }, 'Taux de conformité documentaire')
        ])
      ]),

      el('div', { className: 'gov-kpi-card' }, [
        el('div', { className: 'gov-kpi-icon' }, '⚖️'),
        el('div', { className: 'gov-kpi-content' }, [
          el('div', { className: 'gov-kpi-value' }, String(stats.decisionsRendues)),
          el('div', { className: 'gov-kpi-label' }, 'Décisions CF/DCF')
        ]),
        stats.decisionsEnAttente > 0 && el('div', { className: 'gov-kpi-alert' }, [
          el('span', { className: 'badge badge-warning' }, `${stats.decisionsEnAttente} en attente`)
        ])
      ])
    ]),

    // Dernières décisions
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Dernières décisions CF/DCF'),
        el('a', {
          className: 'btn btn-sm btn-ghost',
          onclick: () => { state.activeTab = 'decisions'; updateContent(); }
        }, 'Voir tout →')
      ]),
      el('div', { className: 'card-body' }, [
        renderDecisionsTable(MOCK_DECISIONS.slice(0, 3))
      ])
    ]),

    // Documents manquants (alerte)
    MOCK_STATS.documentsManquants > 0 && el('div', { className: 'card card-error' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Documents obligatoires manquants'),
        el('a', {
          className: 'btn btn-sm btn-ghost',
          onclick: () => { state.activeTab = 'manquants'; updateContent(); }
        }, 'Voir tout →')
      ]),
      el('div', { className: 'card-body' }, [
        el('table', { className: 'table' }, [
          el('thead', {}, [
            el('tr', {}, [
              el('th', {}, 'Projet'),
              el('th', {}, 'Document'),
              el('th', {}, 'Phase'),
              el('th', { className: 'text-center' }, 'Retard')
            ])
          ]),
          el('tbody', {},
            MOCK_MANQUANTS.slice(0, 3).map(m =>
              el('tr', { className: 'row-error' }, [
                el('td', {}, [
                  el('div', { className: 'font-bold' }, m.projetCode),
                  el('div', { className: 'text-sm text-muted' }, m.projetNom)
                ]),
                el('td', {}, m.type),
                el('td', {}, m.phase),
                el('td', { className: 'text-center' }, [
                  el('span', { className: 'badge badge-error' }, `+${m.delaiJours} j`)
                ])
              ])
            )
          )
        ])
      ])
    ])
  ]);
}

/**
 * Render matrice documentaire
 */
function renderMatrice() {
  const matrice = MATRICE_DOCUMENTAIRE;

  return el('div', { className: 'content-section' }, [
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Matrice documentaire par phase')
      ]),
      el('div', { className: 'card-body matrice-container' }, [
        el('table', { className: 'table matrice-table' }, [
          el('thead', {}, [
            el('tr', {}, [
              el('th', { className: 'matrice-doc-col' }, 'Document'),
              ...matrice.phases.map(phase =>
                el('th', { className: 'matrice-phase-col text-center' }, getPhaseLabel(phase))
              )
            ])
          ]),
          el('tbody', {},
            matrice.documents.map(doc =>
              el('tr', {}, [
                el('td', { className: 'matrice-doc-cell' }, [
                  el('div', { className: 'doc-code' }, doc.code),
                  el('div', { className: 'doc-libelle' }, doc.libelle),
                  el('div', { className: 'doc-desc' }, doc.description)
                ]),
                ...matrice.phases.map(phase => {
                  const exigence = doc.phases[phase];
                  return el('td', { className: 'text-center matrice-cell' }, [
                    exigence ? el('span', {
                      className: `matrice-badge matrice-${exigence.toLowerCase()}`
                    }, getExigenceIcon(exigence)) : el('span', { className: 'matrice-vide' }, '-')
                  ]);
                })
              ])
            )
          )
        ])
      ])
    ]),

    // Légende
    el('div', { className: 'matrice-legende' }, [
      el('div', { className: 'legende-item' }, [
        el('span', { className: 'matrice-badge matrice-obligatoire' }, '●'),
        el('span', {}, 'Obligatoire')
      ]),
      el('div', { className: 'legende-item' }, [
        el('span', { className: 'matrice-badge matrice-mise_a_jour' }, '↻'),
        el('span', {}, 'Mise à jour')
      ]),
      el('div', { className: 'legende-item' }, [
        el('span', { className: 'matrice-badge matrice-recommande' }, '○'),
        el('span', {}, 'Recommandé')
      ])
    ])
  ]);
}

/**
 * Render documents
 */
function renderDocuments() {
  return el('div', { className: 'content-section' }, [
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Documents récents'),
        el('div', { className: 'card-actions' }, [
          el('button', { className: 'btn btn-sm btn-primary' }, '+ Nouveau document')
        ])
      ]),
      el('div', { className: 'card-body' }, [
        el('table', { className: 'table' }, [
          el('thead', {}, [
            el('tr', {}, [
              el('th', {}, 'Projet'),
              el('th', {}, 'Type'),
              el('th', {}, 'Titre'),
              el('th', {}, 'Référence'),
              el('th', {}, 'Date'),
              el('th', {}, 'Statut'),
              el('th', {}, 'Validé par'),
              el('th', {}, '')
            ])
          ]),
          el('tbody', {},
            MOCK_DOCUMENTS.map(doc =>
              el('tr', { className: doc.statut === 'EN_ATTENTE' ? 'row-warning' : '' }, [
                el('td', {}, [
                  el('div', { className: 'font-bold' }, doc.projetCode),
                  el('div', { className: 'text-sm text-muted' }, doc.projetNom)
                ]),
                el('td', {}, [
                  el('span', { className: 'badge badge-default' }, doc.type)
                ]),
                el('td', {}, doc.titre),
                el('td', { className: 'font-mono text-sm' }, doc.reference),
                el('td', {}, formatDate(doc.dateDocument)),
                el('td', {}, [
                  el('span', { className: `badge badge-${getStatutDocColor(doc.statut)}` },
                    getStatutDocLabel(doc.statut))
                ]),
                el('td', {}, doc.validePar || '-'),
                el('td', {}, [
                  el('button', { className: 'btn btn-sm btn-ghost' }, 'Voir')
                ])
              ])
            )
          )
        ])
      ])
    ])
  ]);
}

/**
 * Render décisions
 */
function renderDecisions() {
  return el('div', { className: 'content-section' }, [
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Décisions CF / DCF')
      ]),
      el('div', { className: 'card-body' }, [
        renderDecisionsTable(MOCK_DECISIONS)
      ])
    ])
  ]);
}

/**
 * Render decisions table
 */
function renderDecisionsTable(decisions) {
  return el('table', { className: 'table' }, [
    el('thead', {}, [
      el('tr', {}, [
        el('th', {}, 'Référence'),
        el('th', {}, 'Projet'),
        el('th', {}, 'Type'),
        el('th', {}, 'Objet'),
        el('th', {}, 'Émetteur'),
        el('th', {}, 'Date'),
        el('th', {}, 'Sens'),
        el('th', {}, '')
      ])
    ]),
    el('tbody', {},
      decisions.map(dec => {
        const rowClass = dec.sens === 'DEFAVORABLE' ? 'row-error' : dec.sens === 'RESERVE' ? 'row-warning' : '';

        return el('tr', { className: rowClass }, [
          el('td', { className: 'font-mono font-bold' }, dec.reference),
          el('td', {}, [
            el('div', { className: 'font-bold' }, dec.projetCode),
            el('div', { className: 'text-sm text-muted' }, dec.projetNom)
          ]),
          el('td', {}, [
            el('span', { className: 'badge badge-default' }, getTypeDecisionLabel(dec.type))
          ]),
          el('td', { className: 'objet-cell' }, dec.objet),
          el('td', {}, [
            el('span', { className: `badge badge-${dec.emetteur === 'DCF' ? 'primary' : 'info'}` }, dec.emetteur)
          ]),
          el('td', {}, formatDate(dec.dateEmission)),
          el('td', {}, [
            el('span', { className: `badge badge-${getSensColor(dec.sens)}` }, getSensLabel(dec.sens))
          ]),
          el('td', {}, [
            el('button', {
              className: 'btn btn-sm btn-ghost',
              title: dec.observations
            }, 'Détail')
          ])
        ]);
      })
    )
  ]);
}

/**
 * Render manquants
 */
function renderManquants() {
  return el('div', { className: 'content-section' }, [
    MOCK_MANQUANTS.length > 0
      ? el('div', { className: 'alert alert-error' }, [
          el('strong', {}, `${MOCK_MANQUANTS.length} document(s) obligatoire(s) manquant(s). `),
          'Action requise de la part des chefs de projet.'
        ])
      : el('div', { className: 'alert alert-success' }, [
          el('strong', {}, 'Excellent! '),
          'Tous les documents obligatoires sont fournis.'
        ]),

    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Documents obligatoires manquants')
      ]),
      el('div', { className: 'card-body' }, [
        el('table', { className: 'table' }, [
          el('thead', {}, [
            el('tr', {}, [
              el('th', {}, 'Projet'),
              el('th', {}, 'Document'),
              el('th', {}, 'Phase'),
              el('th', { className: 'text-center' }, 'Retard'),
              el('th', {}, 'Action')
            ])
          ]),
          el('tbody', {},
            MOCK_MANQUANTS.map(m => {
              const isCritique = m.delaiJours > 90;

              return el('tr', { className: isCritique ? 'row-error' : 'row-warning' }, [
                el('td', {}, [
                  el('div', { className: 'font-bold' }, m.projetCode),
                  el('div', { className: 'text-sm text-muted' }, m.projetNom)
                ]),
                el('td', {}, [
                  el('span', { className: 'badge badge-default' }, m.type)
                ]),
                el('td', {}, m.phase),
                el('td', { className: 'text-center' }, [
                  el('span', { className: `badge ${isCritique ? 'badge-error' : 'badge-warning'}` },
                    `+${m.delaiJours} jours`)
                ]),
                el('td', {}, [
                  el('button', { className: 'btn btn-sm btn-primary' }, 'Relancer')
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
    case 'matrice': return renderMatrice();
    case 'documents': return renderDocuments();
    case 'decisions': return renderDecisions();
    case 'manquants': return renderManquants();
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
      showSecteur: false,
      showOpe: false,
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

function getPhaseLabel(phase) {
  const labels = {
    'IDENTIFICATION': 'Ident.',
    'PREPARATION': 'Prép.',
    'EVALUATION': 'Éval.',
    'NEGOCIATION': 'Négo.',
    'EXECUTION': 'Exec.',
    'CLOTURE': 'Clôt.'
  };
  return labels[phase] || phase;
}

function getExigenceIcon(exigence) {
  const icons = {
    'OBLIGATOIRE': '●',
    'MISE_A_JOUR': '↻',
    'RECOMMANDE': '○'
  };
  return icons[exigence] || '';
}

function getStatutDocColor(statut) {
  const colors = {
    'VALIDE': 'success',
    'EN_ATTENTE': 'warning',
    'REJETE': 'error',
    'ARCHIVE': 'default'
  };
  return colors[statut] || 'default';
}

function getStatutDocLabel(statut) {
  const labels = {
    'VALIDE': 'Validé',
    'EN_ATTENTE': 'En attente',
    'REJETE': 'Rejeté',
    'ARCHIVE': 'Archivé'
  };
  return labels[statut] || statut;
}

function getTypeDecisionLabel(type) {
  const labels = {
    'AVIS_MARCHE': 'Marché',
    'AVIS_AVENANT': 'Avenant',
    'AVIS_BUDGET': 'Budget'
  };
  return labels[type] || type;
}

function getSensColor(sens) {
  const colors = {
    'FAVORABLE': 'success',
    'RESERVE': 'warning',
    'DEFAVORABLE': 'error'
  };
  return colors[sens] || 'default';
}

function getSensLabel(sens) {
  const labels = {
    'FAVORABLE': 'Favorable',
    'RESERVE': 'Réserve',
    'DEFAVORABLE': 'Défavorable'
  };
  return labels[sens] || sens;
}

/**
 * Main render function
 */
export async function renderInvGouvernance() {
  logger.info('[Investissement] Rendering Gouvernance...');

  const handleFilterChange = (newFilters) => {
    state.filters = newFilters;
    updateContent(handleFilterChange);
  };

  const page = el('div', { className: 'page-layout inv-layout' }, [
    renderInvSidebar('/investissement/gouvernance'),

    el('main', { className: 'page-main' }, [
      // Header
      el('div', { className: 'page-header' }, [
        el('div', { className: 'page-header-content' }, [
          el('h1', { className: 'page-title' }, 'Gouvernance & Documentation'),
          el('p', { className: 'page-subtitle' }, 'Matrice documentaire, décisions CF/DCF et conformité')
        ])
      ]),

      // Filtres
      createInvFilters(state.filters, handleFilterChange, {
        showSearch: true,
        showVisionToggle: false,
        showTypeProjet: true,
        showBailleur: true,
        showSecteur: false,
        showOpe: false,
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
  injectGouvernanceStyles();

  logger.info('[Investissement] Gouvernance rendered');
}

function injectGouvernanceStyles() {
  const styleId = 'inv-gouvernance-styles';
  if (document.getElementById(styleId)) return;

  const styles = `
    /* Gouvernance KPI Grid */
    .gov-kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .gov-kpi-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
      padding: 1.25rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .gov-kpi-icon {
      font-size: 2rem;
    }

    .gov-kpi-value {
      font-size: 2rem;
      font-weight: 700;
    }

    .gov-kpi-label {
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    .gov-kpi-breakdown {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
      font-size: 0.75rem;
    }

    .breakdown-success { color: #16a34a; }
    .breakdown-warning { color: #ca8a04; }
    .breakdown-error { color: #dc2626; }

    .gov-kpi-conformite {
      border-left: 4px solid #22c55e;
    }

    .gov-kpi-alert {
      margin-top: 0.5rem;
    }

    /* Matrice documentaire */
    .matrice-container {
      overflow-x: auto;
    }

    .matrice-table {
      min-width: 800px;
    }

    .matrice-doc-col {
      min-width: 250px;
    }

    .matrice-phase-col {
      width: 80px;
    }

    .matrice-doc-cell {
      padding: 0.75rem !important;
    }

    .doc-code {
      font-weight: 700;
      font-size: 0.875rem;
      color: var(--color-primary);
    }

    .doc-libelle {
      font-weight: 500;
      font-size: 0.875rem;
    }

    .doc-desc {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .matrice-cell {
      vertical-align: middle;
    }

    .matrice-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      font-size: 0.875rem;
      font-weight: 700;
    }

    .matrice-obligatoire {
      background: #dc2626;
      color: white;
    }

    .matrice-mise_a_jour {
      background: #3b82f6;
      color: white;
    }

    .matrice-recommande {
      background: #e5e7eb;
      color: #374151;
    }

    .matrice-vide {
      color: #d1d5db;
    }

    .matrice-legende {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-top: 1rem;
      padding: 1rem;
      background: var(--color-surface-alt);
      border-radius: 0.5rem;
    }

    .legende-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    /* Objet cell */
    .objet-cell {
      max-width: 200px;
      font-size: 0.875rem;
    }

    /* Cards */
    .card-error {
      border-left: 4px solid #dc2626;
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

    /* Taux */
    .taux-good { color: #16a34a; }
    .taux-medium { color: #ca8a04; }
    .taux-low { color: #dc2626; }

    /* Rows */
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

    .alert-error {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      color: #991b1b;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .gov-kpi-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

export default renderInvGouvernance;
