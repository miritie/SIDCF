/* ============================================
   Vue Portefeuille Investissement
   ============================================
   Vues agrégées par:
   - Bailleur
   - Ministère / Secteur
   - UCP / Entité exécutante
   - Région / Domaine
   - Projets OPE
   ============================================ */

import { el, mount, qs } from '../../../lib/dom.js';
import { money, percent, abbreviate } from '../../../lib/format.js';
import router from '../../../router.js';
import logger from '../../../lib/logger.js';
import { INV_SIDEBAR_MENU, getCurrentYear, createSidebarMenuItems, getMenuIcon } from '../inv-constants.js';

// Aliases pour compatibilité
const formatMontant = (amount, short = false) => short ? abbreviate(amount) : money(amount);
const formatPourcent = (val) => percent(val);

// Mock data for portfolio views
const MOCK_PORTFOLIO = {
  parBailleur: [
    { code: 'BM', nom: 'Banque Mondiale', nbProjets: 12, montantTotal: 320000000000, montantNotifie: 145000000000, montantTransfere: 125000000000, montantExecute: 102500000000, tauxAbsorption: 82.0, alertesCritiques: 2 },
    { code: 'BAD', nom: 'BAD', nbProjets: 8, montantTotal: 180000000000, montantNotifie: 82000000000, montantTransfere: 70000000000, montantExecute: 56000000000, tauxAbsorption: 80.0, alertesCritiques: 1 },
    { code: 'AFD', nom: 'AFD', nbProjets: 6, montantTotal: 95000000000, montantNotifie: 45000000000, montantTransfere: 38000000000, montantExecute: 30400000000, tauxAbsorption: 80.0, alertesCritiques: 0 },
    { code: 'UE', nom: 'Union Européenne', nbProjets: 5, montantTotal: 65000000000, montantNotifie: 32000000000, montantTransfere: 28000000000, montantExecute: 21000000000, tauxAbsorption: 75.0, alertesCritiques: 1 },
    { code: 'BID', nom: 'BID', nbProjets: 4, montantTotal: 85000000000, montantNotifie: 42000000000, montantTransfere: 38000000000, montantExecute: 32300000000, tauxAbsorption: 85.0, alertesCritiques: 0 },
    { code: 'BADEA', nom: 'BADEA', nbProjets: 3, montantTotal: 42000000000, montantNotifie: 22000000000, montantTransfere: 18000000000, montantExecute: 12600000000, tauxAbsorption: 70.0, alertesCritiques: 1 }
  ],
  parMinistere: [
    { code: 'MEN', nom: 'Ministère de l\'Éducation Nationale', secteur: 'Éducation', nbProjets: 8, montantTotal: 180000000000, montantExecute: 98000000000, tauxExecution: 78.5, alertes: 3, nbOpe: 2 },
    { code: 'MSHP', nom: 'Ministère de la Santé', secteur: 'Santé', nbProjets: 6, montantTotal: 120000000000, montantExecute: 72000000000, tauxExecution: 82.0, alertes: 1, nbOpe: 1 },
    { code: 'MCLAU', nom: 'Min. Construction et Urbanisme', secteur: 'Infrastructures', nbProjets: 5, montantTotal: 250000000000, montantExecute: 175000000000, tauxExecution: 85.0, alertes: 2, nbOpe: 3 },
    { code: 'MINADER', nom: 'Ministère de l\'Agriculture', secteur: 'Agriculture', nbProjets: 7, montantTotal: 95000000000, montantExecute: 57000000000, tauxExecution: 75.0, alertes: 2, nbOpe: 1 },
    { code: 'MTCA', nom: 'Ministère des Transports', secteur: 'Transport', nbProjets: 4, montantTotal: 185000000000, montantExecute: 148000000000, tauxExecution: 88.0, alertes: 0, nbOpe: 2 }
  ],
  parUCP: [
    { type: 'UCP', code: 'UCP-PAPSE', nom: 'UCP-PAPSE', nbProjets: 2, montantTotal: 75000000000, montantTransfere: 65000000000, montantExecute: 52000000000, performance: 80.0, alertes: 1 },
    { type: 'UCP', code: 'UCP-PEJEDEC', nom: 'UCP-PEJEDEC', nbProjets: 1, montantTotal: 28000000000, montantTransfere: 25200000000, montantExecute: 18900000000, performance: 75.0, alertes: 1 },
    { type: 'EPN', code: 'AGEROUTE', nom: 'AGEROUTE', nbProjets: 3, montantTotal: 185000000000, montantTransfere: 156000000000, montantExecute: 132600000000, performance: 85.0, alertes: 0 },
    { type: 'EPN', code: 'ONEP', nom: 'ONEP', nbProjets: 2, montantTotal: 65000000000, montantTransfere: 55000000000, montantExecute: 46750000000, performance: 85.0, alertes: 1 },
    { type: 'ADMIN', code: 'MEN-DIS', nom: 'Direction Infrastructure Scolaire', nbProjets: 4, montantTotal: 120000000000, montantTransfere: 98000000000, montantExecute: 78400000000, performance: 80.0, alertes: 2 }
  ],
  parRegion: [
    { district: 'Abidjan', region: 'Abidjan', nbProjets: 15, montantTotal: 350000000000, montantExecute: 280000000000, tauxExecution: 80.0, nbOpe: 5 },
    { district: 'Yamoussoukro', region: 'Bélier', nbProjets: 8, montantTotal: 120000000000, montantExecute: 90000000000, tauxExecution: 75.0, nbOpe: 2 },
    { district: 'Sassandra-Marahoué', region: 'Marahoué', nbProjets: 6, montantTotal: 85000000000, montantExecute: 59500000000, tauxExecution: 70.0, nbOpe: 1 },
    { district: 'Savanes', region: 'Korhogo', nbProjets: 5, montantTotal: 72000000000, montantExecute: 57600000000, tauxExecution: 80.0, nbOpe: 1 },
    { district: 'Lagunes', region: 'Grands-Ponts', nbProjets: 4, montantTotal: 55000000000, montantExecute: 44000000000, tauxExecution: 80.0, nbOpe: 1 }
  ],
  projetsOPE: [
    { id: 'p3', code: 'ProSEB', nom: 'Projet Secteur Éducation de Base', entite: 'UCP-ProSEB', bailleur: 'AFD', notifie: 35000000000, execute: 28120000000, tauxExec: 80.3, alertes: 1 },
    { id: 'p4', code: 'PASEA', nom: 'Projet Eau et Assainissement', entite: 'ONEP', bailleur: 'BM', notifie: 52000000000, execute: 38250000000, tauxExec: 73.6, alertes: 1 },
    { id: 'p6', code: 'PRICI', nom: 'Renaissance des Infrastructures', entite: 'AGEROUTE', bailleur: 'BM', notifie: 85000000000, execute: 65800000000, tauxExec: 77.4, alertes: 1 },
    { id: 'p8', code: 'PEPT', nom: 'Électrification Rurale Phase III', entite: 'CI-ENERGIES', bailleur: 'BID', notifie: 62000000000, execute: 48400000000, tauxExec: 78.1, alertes: 0 },
    { id: 'p10', code: 'PTRAN', nom: 'Transport Urbain Abidjan', entite: 'AGETU', bailleur: 'BM', notifie: 120000000000, execute: 82320000000, tauxExec: 68.6, alertes: 0 }
  ]
};

// Active view state
let activeView = 'bailleur';

/**
 * Render Investissement sidebar
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
 * Render view tabs
 */
function renderViewTabs() {
  const views = [
    { id: 'bailleur', label: 'Par Bailleur', icon: '🏛️' },
    { id: 'ministere', label: 'Par Ministère', icon: '🏢' },
    { id: 'ucp', label: 'Par UCP/Entité', icon: '👥' },
    { id: 'region', label: 'Par Région', icon: '📍' },
    { id: 'ope', label: 'Projets OPE', icon: '⭐' }
  ];

  return el('div', { className: 'view-tabs' },
    views.map(view =>
      el('button', {
        className: `view-tab ${activeView === view.id ? 'active' : ''}`,
        onclick: () => {
          activeView = view.id;
          updateViewContent();
        }
      }, [
        el('span', { className: 'view-icon' }, view.icon),
        el('span', { className: 'view-label' }, view.label)
      ])
    )
  );
}

/**
 * Render view content
 */
function renderViewContent() {
  switch (activeView) {
    case 'bailleur': return renderBailleurView();
    case 'ministere': return renderMinistereView();
    case 'ucp': return renderUCPView();
    case 'region': return renderRegionView();
    case 'ope': return renderOPEView();
    default: return renderBailleurView();
  }
}

/**
 * Vue par bailleur
 */
function renderBailleurView() {
  const data = MOCK_PORTFOLIO.parBailleur;
  const totaux = {
    nbProjets: data.reduce((s, d) => s + d.nbProjets, 0),
    montantTotal: data.reduce((s, d) => s + d.montantTotal, 0),
    montantExecute: data.reduce((s, d) => s + d.montantExecute, 0),
    alertes: data.reduce((s, d) => s + d.alertesCritiques, 0)
  };

  return el('div', { className: 'view-content' }, [
    // Summary cards
    el('div', { className: 'summary-cards' }, [
      el('div', { className: 'summary-card' }, [
        el('div', { className: 'summary-value' }, String(data.length)),
        el('div', { className: 'summary-label' }, 'Bailleurs actifs')
      ]),
      el('div', { className: 'summary-card' }, [
        el('div', { className: 'summary-value' }, String(totaux.nbProjets)),
        el('div', { className: 'summary-label' }, 'Projets')
      ]),
      el('div', { className: 'summary-card' }, [
        el('div', { className: 'summary-value' }, formatMontant(totaux.montantTotal, true)),
        el('div', { className: 'summary-label' }, 'Montant total')
      ]),
      el('div', { className: 'summary-card' }, [
        el('div', { className: 'summary-value' }, formatMontant(totaux.montantExecute, true)),
        el('div', { className: 'summary-label' }, 'Exécuté')
      ])
    ]),

    // Table
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Portefeuille par Bailleur')
      ]),
      el('div', { className: 'card-body' }, [
        el('table', { className: 'table' }, [
          el('thead', {}, [
            el('tr', {}, [
              el('th', {}, 'Bailleur'),
              el('th', { className: 'text-center' }, 'Projets'),
              el('th', { className: 'text-right' }, 'Montant total'),
              el('th', { className: 'text-right' }, 'Notifié ' + getCurrentYear()),
              el('th', { className: 'text-right' }, 'Transféré'),
              el('th', { className: 'text-right' }, 'Exécuté'),
              el('th', { className: 'text-center' }, 'Taux absorption'),
              el('th', { className: 'text-center' }, 'Alertes')
            ])
          ]),
          el('tbody', {},
            data.map(row =>
              el('tr', {}, [
                el('td', {}, [
                  el('div', { className: 'bailleur-name' }, [
                    el('span', { className: 'bailleur-code' }, row.code),
                    el('span', {}, row.nom)
                  ])
                ]),
                el('td', { className: 'text-center' }, String(row.nbProjets)),
                el('td', { className: 'text-right' }, formatMontant(row.montantTotal, true)),
                el('td', { className: 'text-right' }, formatMontant(row.montantNotifie, true)),
                el('td', { className: 'text-right' }, formatMontant(row.montantTransfere, true)),
                el('td', { className: 'text-right' }, formatMontant(row.montantExecute, true)),
                el('td', { className: 'text-center' }, [
                  el('span', { className: `taux-badge ${getTauxClass(row.tauxAbsorption)}` },
                    formatPourcent(row.tauxAbsorption))
                ]),
                el('td', { className: 'text-center' }, [
                  row.alertesCritiques > 0
                    ? el('span', { className: 'badge badge-error' }, String(row.alertesCritiques))
                    : el('span', { className: 'badge badge-success' }, '0')
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
 * Vue par ministère
 */
function renderMinistereView() {
  const data = MOCK_PORTFOLIO.parMinistere;

  return el('div', { className: 'view-content' }, [
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Portefeuille par Ministère / Secteur')
      ]),
      el('div', { className: 'card-body' }, [
        el('table', { className: 'table' }, [
          el('thead', {}, [
            el('tr', {}, [
              el('th', {}, 'Ministère'),
              el('th', {}, 'Secteur'),
              el('th', { className: 'text-center' }, 'Projets'),
              el('th', { className: 'text-right' }, 'Montant total'),
              el('th', { className: 'text-right' }, 'Exécuté'),
              el('th', { className: 'text-center' }, 'Taux exec.'),
              el('th', { className: 'text-center' }, 'Alertes'),
              el('th', { className: 'text-center' }, 'OPE')
            ])
          ]),
          el('tbody', {},
            data.map(row =>
              el('tr', {}, [
                el('td', {}, [
                  el('div', { className: 'ministere-name' }, row.nom),
                  el('div', { className: 'ministere-code' }, row.code)
                ]),
                el('td', {}, [
                  el('span', { className: 'badge badge-info' }, row.secteur)
                ]),
                el('td', { className: 'text-center' }, String(row.nbProjets)),
                el('td', { className: 'text-right' }, formatMontant(row.montantTotal, true)),
                el('td', { className: 'text-right' }, formatMontant(row.montantExecute, true)),
                el('td', { className: 'text-center' }, [
                  el('span', { className: `taux-badge ${getTauxClass(row.tauxExecution)}` },
                    formatPourcent(row.tauxExecution))
                ]),
                el('td', { className: 'text-center' }, [
                  row.alertes > 0
                    ? el('span', { className: 'badge badge-warning' }, String(row.alertes))
                    : el('span', { className: 'badge badge-success' }, '0')
                ]),
                el('td', { className: 'text-center' }, [
                  row.nbOpe > 0
                    ? el('span', { className: 'badge badge-warning' }, String(row.nbOpe))
                    : '-'
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
 * Vue par UCP/Entité
 */
function renderUCPView() {
  const data = MOCK_PORTFOLIO.parUCP;

  return el('div', { className: 'view-content' }, [
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Portefeuille par UCP / Entité Exécutante')
      ]),
      el('div', { className: 'card-body' }, [
        el('table', { className: 'table' }, [
          el('thead', {}, [
            el('tr', {}, [
              el('th', {}, 'Type'),
              el('th', {}, 'Entité'),
              el('th', { className: 'text-center' }, 'Projets'),
              el('th', { className: 'text-right' }, 'Montant total'),
              el('th', { className: 'text-right' }, 'Transféré'),
              el('th', { className: 'text-right' }, 'Exécuté'),
              el('th', { className: 'text-center' }, 'Performance'),
              el('th', { className: 'text-center' }, 'Alertes')
            ])
          ]),
          el('tbody', {},
            data.map(row =>
              el('tr', {}, [
                el('td', {}, [
                  el('span', { className: `badge badge-${getTypeBadgeColor(row.type)}` }, row.type)
                ]),
                el('td', {}, [
                  el('div', { className: 'entite-name' }, row.nom),
                  el('div', { className: 'entite-code' }, row.code)
                ]),
                el('td', { className: 'text-center' }, String(row.nbProjets)),
                el('td', { className: 'text-right' }, formatMontant(row.montantTotal, true)),
                el('td', { className: 'text-right' }, formatMontant(row.montantTransfere, true)),
                el('td', { className: 'text-right' }, formatMontant(row.montantExecute, true)),
                el('td', { className: 'text-center' }, [
                  el('span', { className: `taux-badge ${getTauxClass(row.performance)}` },
                    formatPourcent(row.performance))
                ]),
                el('td', { className: 'text-center' }, [
                  row.alertes > 0
                    ? el('span', { className: 'badge badge-warning' }, String(row.alertes))
                    : el('span', { className: 'badge badge-success' }, '0')
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
 * Vue par région
 */
function renderRegionView() {
  const data = MOCK_PORTFOLIO.parRegion;

  return el('div', { className: 'view-content' }, [
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Portefeuille par Région')
      ]),
      el('div', { className: 'card-body' }, [
        el('table', { className: 'table' }, [
          el('thead', {}, [
            el('tr', {}, [
              el('th', {}, 'District'),
              el('th', {}, 'Région'),
              el('th', { className: 'text-center' }, 'Projets'),
              el('th', { className: 'text-right' }, 'Montant total'),
              el('th', { className: 'text-right' }, 'Exécuté'),
              el('th', { className: 'text-center' }, 'Taux exec.'),
              el('th', { className: 'text-center' }, 'OPE')
            ])
          ]),
          el('tbody', {},
            data.map(row =>
              el('tr', {}, [
                el('td', {}, row.district),
                el('td', {}, row.region),
                el('td', { className: 'text-center' }, String(row.nbProjets)),
                el('td', { className: 'text-right' }, formatMontant(row.montantTotal, true)),
                el('td', { className: 'text-right' }, formatMontant(row.montantExecute, true)),
                el('td', { className: 'text-center' }, [
                  el('span', { className: `taux-badge ${getTauxClass(row.tauxExecution)}` },
                    formatPourcent(row.tauxExecution))
                ]),
                el('td', { className: 'text-center' }, [
                  row.nbOpe > 0
                    ? el('span', { className: 'badge badge-warning' }, String(row.nbOpe))
                    : '-'
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
 * Vue Projets OPE
 */
function renderOPEView() {
  const data = MOCK_PORTFOLIO.projetsOPE;
  const totalNotifie = data.reduce((s, d) => s + d.notifie, 0);
  const totalExecute = data.reduce((s, d) => s + d.execute, 0);

  return el('div', { className: 'view-content' }, [
    // Summary
    el('div', { className: 'ope-summary' }, [
      el('div', { className: 'ope-stat' }, [
        el('div', { className: 'ope-value' }, String(data.length)),
        el('div', { className: 'ope-label' }, 'Opérations Prioritaires de l\'État')
      ]),
      el('div', { className: 'ope-stat' }, [
        el('div', { className: 'ope-value' }, formatMontant(totalNotifie, true)),
        el('div', { className: 'ope-label' }, 'Budget notifié OPE')
      ]),
      el('div', { className: 'ope-stat' }, [
        el('div', { className: 'ope-value' }, formatMontant(totalExecute, true)),
        el('div', { className: 'ope-label' }, 'Exécuté')
      ]),
      el('div', { className: 'ope-stat' }, [
        el('div', { className: `ope-value ${getTauxClass(totalExecute / totalNotifie * 100)}` },
          formatPourcent(totalExecute / totalNotifie * 100)),
        el('div', { className: 'ope-label' }, 'Taux global')
      ])
    ]),

    // Table
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Liste des Projets OPE')
      ]),
      el('div', { className: 'card-body' }, [
        el('table', { className: 'table' }, [
          el('thead', {}, [
            el('tr', {}, [
              el('th', {}, 'Projet'),
              el('th', {}, 'Entité'),
              el('th', {}, 'Bailleur'),
              el('th', { className: 'text-right' }, 'Notifié'),
              el('th', { className: 'text-right' }, 'Exécuté'),
              el('th', { className: 'text-center' }, 'Taux'),
              el('th', { className: 'text-center' }, 'Alertes'),
              el('th', {}, '')
            ])
          ]),
          el('tbody', {},
            data.map(row =>
              el('tr', {
                onclick: () => router.navigate('/investissement/projet', { id: row.id })
              }, [
                el('td', {}, [
                  el('div', { className: 'projet-code' }, [
                    el('span', { className: 'badge badge-warning' }, 'OPE'),
                    el('span', {}, row.code)
                  ]),
                  el('div', { className: 'projet-nom' }, row.nom)
                ]),
                el('td', {}, row.entite),
                el('td', {}, row.bailleur),
                el('td', { className: 'text-right' }, formatMontant(row.notifie, true)),
                el('td', { className: 'text-right' }, formatMontant(row.execute, true)),
                el('td', { className: 'text-center' }, [
                  el('span', { className: `taux-badge ${getTauxClass(row.tauxExec)}` },
                    formatPourcent(row.tauxExec))
                ]),
                el('td', { className: 'text-center' }, [
                  row.alertes > 0
                    ? el('span', { className: 'badge badge-error' }, String(row.alertes))
                    : el('span', { className: 'badge badge-success' }, '0')
                ]),
                el('td', {}, [
                  el('button', {
                    className: 'btn btn-sm btn-ghost',
                    onclick: (e) => {
                      e.stopPropagation();
                      router.navigate('/investissement/projet', { id: row.id });
                    }
                  }, 'Voir')
                ])
              ])
            )
          )
        ])
      ])
    ])
  ]);
}

// Helpers
function getTauxClass(taux) {
  if (taux >= 80) return 'taux-good';
  if (taux >= 50) return 'taux-medium';
  return 'taux-low';
}

function getTypeBadgeColor(type) {
  const colors = { 'UCP': 'primary', 'EPN': 'info', 'COLLECTIVITE': 'warning', 'ADMIN': 'default' };
  return colors[type] || 'default';
}

/**
 * Update view content
 */
function updateViewContent() {
  const container = qs('#view-content-container');
  if (container) {
    container.innerHTML = '';
    container.appendChild(renderViewContent());
  }

  // Update tabs
  const tabsContainer = qs('.view-tabs');
  if (tabsContainer) {
    tabsContainer.parentNode.replaceChild(renderViewTabs(), tabsContainer);
  }
}

/**
 * Main render function
 */
export async function renderInvPortefeuille() {
  logger.info('[Investissement] Rendering Portfolio...');

  const page = el('div', { className: 'page-layout inv-layout' }, [
    renderInvSidebar('/investissement/portefeuille'),

    el('main', { className: 'page-main' }, [
      // Header
      el('div', { className: 'page-header' }, [
        el('div', { className: 'page-header-content' }, [
          el('h1', { className: 'page-title' }, 'Vue Portefeuille'),
          el('p', { className: 'page-subtitle' }, 'Analyse agrégée des projets d\'investissement')
        ])
      ]),

      // View tabs
      renderViewTabs(),

      // Content
      el('div', { id: 'view-content-container', className: 'page-content' }, [
        renderViewContent()
      ])
    ])
  ]);

  mount('#app', page);

  // Inject styles
  injectPortefeuilleStyles();

  logger.info('[Investissement] Portfolio rendered');
}

function injectPortefeuilleStyles() {
  const styleId = 'inv-portefeuille-styles';
  if (document.getElementById(styleId)) return;

  const styles = `
    .view-tabs {
      display: flex;
      gap: 0.5rem;
      padding: 0.5rem;
      background: var(--color-surface);
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
      border: 1px solid var(--color-border);
      overflow-x: auto;
    }

    .view-tab {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border: none;
      background: transparent;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .view-tab:hover {
      background: var(--color-hover);
    }

    .view-tab.active {
      background: var(--color-primary);
      color: white;
    }

    .view-icon {
      font-size: 1.125rem;
    }

    .view-content {
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-card {
      background: var(--color-surface);
      padding: 1.25rem;
      border-radius: 0.5rem;
      border: 1px solid var(--color-border);
      text-align: center;
    }

    .summary-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-primary);
    }

    .summary-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-top: 0.25rem;
    }

    .bailleur-name {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .bailleur-code {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      background: var(--color-surface-alt);
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .ministere-name {
      font-weight: 500;
    }

    .ministere-code,
    .entite-code {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .entite-name {
      font-weight: 500;
    }

    .taux-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .taux-good {
      background: #dcfce7;
      color: #166534;
    }

    .taux-medium {
      background: #fef9c3;
      color: #854d0e;
    }

    .taux-low {
      background: #fecaca;
      color: #991b1b;
    }

    /* OPE specific */
    .ope-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, var(--color-warning) 0%, #f59e0b 100%);
      border-radius: 0.75rem;
      color: white;
    }

    .ope-stat {
      text-align: center;
    }

    .ope-value {
      font-size: 2rem;
      font-weight: 700;
    }

    .ope-label {
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .projet-code {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
    }

    .projet-nom {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      max-width: 250px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .table tbody tr {
      cursor: pointer;
      transition: background 0.15s;
    }

    .table tbody tr:hover {
      background: var(--color-hover);
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

export default renderInvPortefeuille;
