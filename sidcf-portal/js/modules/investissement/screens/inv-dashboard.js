/* ============================================
   Dashboard Investissement
   ============================================
   Vue d'ensemble des Projets d'Investissement Publics (PIP)
   KPIs, alertes, mini-liste des projets
   ============================================ */

import { el, mount, qs } from '../../../lib/dom.js';
import { money, date, percent, abbreviate } from '../../../lib/format.js';

// Aliases pour compatibilité
const formatMontant = (amount, short = false) => short ? abbreviate(amount) : money(amount);
const formatDate = (d) => date(d);
const formatPourcent = (val) => percent(val);
import router from '../../../router.js';
import dataService from '../../../datastore/data-service.js';
import { ENTITIES } from '../../../datastore/schema.js';
import logger from '../../../lib/logger.js';
import { INV_SIDEBAR_MENU, getCurrentYear, getAvailableYears, createSidebarMenuItems, getMenuIcon, injectInvSidebarStyles } from '../inv-constants.js';

// Données mock pour démonstration (à remplacer par dataService)
const MOCK_DATA = {
  stats: {
    totalProjets: 47,
    projetsTransfert: 12,
    projetsSigobe: 28,
    projetsHorsSigobe: 7,
    projetsOPE: 8,
    projetsDansDCF: 42,
    montantNotifie: 245000000000,
    montantTransfere: 198500000000,
    montantExecute: 156200000000,
    montantEclate: 238000000000,
    autorisationExecuter: 205000000000,
    tauxExecutionGlobal: 78.7,
    tauxAbsorption: 63.8,
    alertesCritiques: 5,
    alertesMajeures: 12,
    alertesTotal: 23,
    // Nouveaux indicateurs enrichis
    lettresAvanceEnCours: 4,
    montantLettresAvance: 6800000000,
    opProvisoiresNonReg: 3,
    montantOpProvisoires: 2150000000,
    regiesActives: 6,
    missionsTerrainRetard: 2,
    rsfManquants: 3
  },
  // Stats OPE dédiées
  statsOPE: {
    totalOPE: 8,
    montantTotalOPE: 425000000000,
    montantExecuteOPE: 312000000000,
    tauxExecutionOPE: 73.4,
    opeEnDifficulte: 2,
    opeCritique: 1
  },
  alertes: [
    { id: 'a1', type: 'BUDGET_ECLATE_MANQUANT', projet: 'PAPSE II', priorite: 'CRITIQUE', message: 'Projet en transfert sans budget éclaté' },
    { id: 'a2', type: 'ECART_NOTIFIE_ECLATE', projet: 'PEJEDEC', priorite: 'MAJEURE', message: 'Écart de 500 M FCFA entre notifié et éclaté' },
    { id: 'a3', type: 'TRANSFERE_INFERIEUR_EXECUTE', projet: 'ProSEB', priorite: 'CRITIQUE', message: 'Exécuté supérieur au transféré (+120 M FCFA)' },
    { id: 'a4', type: 'VARIATION_COUT_CRITIQUE', projet: 'PASEA', priorite: 'CRITIQUE', message: 'Variation du coût > 30% (+42%)' },
    { id: 'a5', type: 'LETTRE_AVANCE_NON_REGULARISEE', projet: 'C2D Santé', priorite: 'MAJEURE', message: 'Lettre d\'avance non régularisée (120 jours)' },
    { id: 'a6', type: 'RSF_MANQUANT_CLASSE_2', projet: 'PRICI', priorite: 'MAJEURE', message: 'RSF manquant pour dépenses classe 2' }
  ],
  projets: [
    { id: 'p1', code: 'PAPSE-II', nom: 'Programme d\'Appui au Plan Sectoriel Éducation II', type: 'TRANSFERT', entite: 'UCP-PAPSE', notifie: 45000000000, transfere: 38500000000, execute: 32100000000, tauxExec: 83.4, nbAlertes: 1 },
    { id: 'p2', code: 'PEJEDEC', nom: 'Projet Emploi Jeunes et Développement des Compétences', type: 'SIGOBE', entite: 'UCP-PEJEDEC', notifie: 28000000000, transfere: 25200000000, execute: 18900000000, tauxExec: 75.0, nbAlertes: 1 },
    { id: 'p3', code: 'ProSEB', nom: 'Projet Secteur Éducation de Base', type: 'TRANSFERT', entite: 'UCP-ProSEB', notifie: 35000000000, transfere: 28000000000, execute: 28120000000, tauxExec: 100.4, nbAlertes: 1, isOpe: true },
    { id: 'p4', code: 'PASEA', nom: 'Projet d\'Appui au Secteur Eau et Assainissement', type: 'SIGOBE', entite: 'ONEP', notifie: 52000000000, transfere: 45500000000, execute: 38250000000, tauxExec: 84.1, nbAlertes: 1, isOpe: true },
    { id: 'p5', code: 'C2D-SANTE', nom: 'Programme Santé C2D Phase III', type: 'TRANSFERT', entite: 'MSHP', notifie: 18500000000, transfere: 16200000000, execute: 12150000000, tauxExec: 75.0, nbAlertes: 1 },
    { id: 'p6', code: 'PRICI', nom: 'Projet de Renaissance des Infrastructures de CI', type: 'SIGOBE', entite: 'AGEROUTE', notifie: 85000000000, transfere: 72000000000, execute: 65800000000, tauxExec: 91.4, nbAlertes: 1, isOpe: true }
  ]
};

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
 * Render KPI cards - Enrichis V2
 */
function renderKPICards(stats) {
  const kpis = [
    { label: 'Projets', value: stats.totalProjets, sublabel: `${stats.projetsOPE} OPE | ${stats.projetsDansDCF} périmètre DCF`, icon: '📁', color: 'primary' },
    { label: 'Transfert', value: stats.projetsTransfert, sublabel: `SIGOBE: ${stats.projetsSigobe} | Hors: ${stats.projetsHorsSigobe}`, icon: '🔄', color: 'info' },
    { label: 'Notifié', value: formatMontant(stats.montantNotifie, true), sublabel: 'Budget LF ' + getCurrentYear(), icon: '📋', color: 'default' },
    { label: 'Autorisé', value: formatMontant(stats.autorisationExecuter, true), sublabel: 'Transféré + reports', icon: '🔓', color: 'warning' },
    { label: 'Exécuté', value: formatMontant(stats.montantExecute, true), sublabel: `${formatPourcent(stats.tauxExecutionGlobal)} exec | ${formatPourcent(stats.tauxAbsorption)} absorb.`, icon: '✅', color: 'success' },
    { label: 'Alertes', value: stats.alertesCritiques, sublabel: `${stats.alertesCritiques} critiques | ${stats.alertesMajeures} majeures`, icon: '⚠️', color: 'error' }
  ];

  return el('div', { className: 'kpi-grid inv-kpi-grid' },
    kpis.map(kpi =>
      el('div', { className: `kpi-card kpi-${kpi.color}` }, [
        el('div', { className: 'kpi-icon' }, kpi.icon),
        el('div', { className: 'kpi-content' }, [
          el('div', { className: 'kpi-value' }, String(kpi.value)),
          el('div', { className: 'kpi-label' }, kpi.label),
          el('div', { className: 'kpi-sublabel' }, kpi.sublabel)
        ])
      ])
    )
  );
}

/**
 * Render OPE Summary Card - Nouveau V2
 */
function renderOPESummary(statsOPE) {
  return el('div', { className: 'card inv-ope-card' }, [
    el('div', { className: 'card-header ope-header' }, [
      el('h3', { className: 'card-title' }, [
        el('span', { className: 'ope-badge' }, 'OPE'),
        ' Opérations Prioritaires de l\'État'
      ]),
      el('a', {
        className: 'btn btn-sm btn-ghost',
        href: '#/investissement/portefeuille?vue=ope'
      }, 'Voir détail →')
    ]),
    el('div', { className: 'card-body ope-body' }, [
      el('div', { className: 'ope-stats-grid' }, [
        el('div', { className: 'ope-stat' }, [
          el('div', { className: 'ope-stat-value' }, String(statsOPE.totalOPE)),
          el('div', { className: 'ope-stat-label' }, 'Projets OPE')
        ]),
        el('div', { className: 'ope-stat' }, [
          el('div', { className: 'ope-stat-value' }, formatMontant(statsOPE.montantTotalOPE, true)),
          el('div', { className: 'ope-stat-label' }, 'Montant total')
        ]),
        el('div', { className: 'ope-stat' }, [
          el('div', { className: 'ope-stat-value ope-taux' }, formatPourcent(statsOPE.tauxExecutionOPE)),
          el('div', { className: 'ope-stat-label' }, 'Taux d\'exécution')
        ]),
        el('div', { className: 'ope-stat ope-alert' }, [
          el('div', { className: 'ope-stat-value' }, [
            statsOPE.opeEnDifficulte > 0
              ? el('span', { className: 'text-warning' }, `${statsOPE.opeEnDifficulte} en difficulté`)
              : el('span', { className: 'text-success' }, 'Tous en bonne voie')
          ]),
          el('div', { className: 'ope-stat-label' }, statsOPE.opeCritique > 0 ? `dont ${statsOPE.opeCritique} critique(s)` : '')
        ])
      ])
    ])
  ]);
}

/**
 * Render Financial Instruments Summary - Nouveau V2
 */
function renderFinancialInstruments(stats) {
  return el('div', { className: 'card inv-instruments-card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, 'Instruments financiers en cours')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { className: 'instruments-grid' }, [
        // Lettres d'avance
        el('div', { className: `instrument-item ${stats.lettresAvanceEnCours > 0 ? 'has-items' : ''}` }, [
          el('div', { className: 'instrument-icon' }, '📄'),
          el('div', { className: 'instrument-content' }, [
            el('div', { className: 'instrument-title' }, 'Lettres d\'avance'),
            el('div', { className: 'instrument-value' }, [
              el('strong', {}, String(stats.lettresAvanceEnCours)),
              ' en cours'
            ]),
            el('div', { className: 'instrument-amount' }, formatMontant(stats.montantLettresAvance, true))
          ])
        ]),
        // OP provisoires
        el('div', { className: `instrument-item ${stats.opProvisoiresNonReg > 0 ? 'has-warning' : ''}` }, [
          el('div', { className: 'instrument-icon' }, '⏳'),
          el('div', { className: 'instrument-content' }, [
            el('div', { className: 'instrument-title' }, 'OP provisoires'),
            el('div', { className: 'instrument-value' }, [
              el('strong', {}, String(stats.opProvisoiresNonReg)),
              ' non régularisés'
            ]),
            el('div', { className: 'instrument-amount' }, formatMontant(stats.montantOpProvisoires, true))
          ])
        ]),
        // Régies
        el('div', { className: 'instrument-item' }, [
          el('div', { className: 'instrument-icon' }, '💰'),
          el('div', { className: 'instrument-content' }, [
            el('div', { className: 'instrument-title' }, 'Régies actives'),
            el('div', { className: 'instrument-value' }, [
              el('strong', {}, String(stats.regiesActives)),
              ' régies'
            ]),
            el('div', { className: 'instrument-amount' }, 'À surveiller')
          ])
        ]),
        // Suivi physique
        el('div', { className: `instrument-item ${stats.missionsTerrainRetard > 0 || stats.rsfManquants > 0 ? 'has-warning' : ''}` }, [
          el('div', { className: 'instrument-icon' }, '🔍'),
          el('div', { className: 'instrument-content' }, [
            el('div', { className: 'instrument-title' }, 'Suivi physique'),
            el('div', { className: 'instrument-value' }, [
              stats.missionsTerrainRetard > 0 && el('span', { className: 'text-warning' }, `${stats.missionsTerrainRetard} missions retard`),
              stats.rsfManquants > 0 && el('span', { className: 'text-warning' }, ` | ${stats.rsfManquants} RSF manquants`)
            ]),
            el('div', { className: 'instrument-amount' }, 'Classe 2')
          ])
        ])
      ])
    ])
  ]);
}

/**
 * Render alerts banner
 */
function renderAlertsBanner(alertes) {
  const critiques = alertes.filter(a => a.priorite === 'CRITIQUE');
  const majeures = alertes.filter(a => a.priorite === 'MAJEURE');

  return el('div', { className: 'card inv-alerts-card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, 'Alertes actives'),
      el('a', {
        className: 'btn btn-sm btn-ghost',
        href: '#/investissement/alertes'
      }, 'Voir tout →')
    ]),
    el('div', { className: 'card-body' }, [
      // Alertes critiques
      critiques.length > 0 && el('div', { className: 'alert-section' }, [
        el('h4', { className: 'alert-section-title alert-critique' }, `Critiques (${critiques.length})`),
        el('ul', { className: 'alert-list' },
          critiques.slice(0, 3).map(alerte =>
            el('li', { className: 'alert-item alert-critique' }, [
              el('span', { className: 'alert-badge' }, '!!'),
              el('span', { className: 'alert-projet' }, alerte.projet),
              el('span', { className: 'alert-message' }, alerte.message),
              el('a', {
                className: 'alert-link',
                href: `#/investissement/projet?id=${alerte.id}`,
                title: 'Voir le projet'
              }, '→')
            ])
          )
        )
      ]),
      // Alertes majeures
      majeures.length > 0 && el('div', { className: 'alert-section' }, [
        el('h4', { className: 'alert-section-title alert-majeure' }, `Majeures (${majeures.length})`),
        el('ul', { className: 'alert-list' },
          majeures.slice(0, 3).map(alerte =>
            el('li', { className: 'alert-item alert-majeure' }, [
              el('span', { className: 'alert-badge' }, '!'),
              el('span', { className: 'alert-projet' }, alerte.projet),
              el('span', { className: 'alert-message' }, alerte.message),
              el('a', {
                className: 'alert-link',
                href: `#/investissement/projet?id=${alerte.id}`,
                title: 'Voir le projet'
              }, '→')
            ])
          )
        )
      ])
    ].filter(Boolean))
  ]);
}

/**
 * Render projects mini-table
 */
function renderProjectsTable(projets) {
  return el('div', { className: 'card inv-projects-card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, 'Projets d\'investissement'),
      el('a', {
        className: 'btn btn-sm btn-primary',
        href: '#/investissement/projets'
      }, 'Voir tous les projets →')
    ]),
    el('div', { className: 'card-body' }, [
      el('table', { className: 'table inv-table' }, [
        el('thead', {}, [
          el('tr', {}, [
            el('th', {}, 'Projet'),
            el('th', {}, 'Type'),
            el('th', {}, 'Entité'),
            el('th', { className: 'text-right' }, 'Notifié'),
            el('th', { className: 'text-right' }, 'Transféré'),
            el('th', { className: 'text-right' }, 'Exécuté'),
            el('th', { className: 'text-center' }, '% Exec'),
            el('th', { className: 'text-center' }, 'Alertes'),
            el('th', {}, '')
          ])
        ]),
        el('tbody', {},
          projets.map(projet =>
            el('tr', {
              className: projet.nbAlertes > 0 ? 'has-alerts' : '',
              onclick: () => router.navigate('/investissement/projet', { id: projet.id })
            }, [
              el('td', { className: 'projet-cell' }, [
                el('div', { className: 'projet-nom' }, [
                  projet.isOpe && el('span', { className: 'badge badge-warning', title: 'Opération Prioritaire de l\'État' }, 'OPE'),
                  el('span', {}, projet.code)
                ]),
                el('div', { className: 'projet-desc' }, projet.nom)
              ]),
              el('td', {}, [
                el('span', { className: `badge badge-${getTypeBadgeColor(projet.type)}` }, projet.type)
              ]),
              el('td', {}, projet.entite),
              el('td', { className: 'text-right montant' }, formatMontant(projet.notifie, true)),
              el('td', { className: 'text-right montant' }, formatMontant(projet.transfere, true)),
              el('td', { className: 'text-right montant' }, formatMontant(projet.execute, true)),
              el('td', { className: 'text-center' }, [
                el('span', {
                  className: `taux-badge ${getTauxClass(projet.tauxExec)}`
                }, formatPourcent(projet.tauxExec))
              ]),
              el('td', { className: 'text-center' }, [
                projet.nbAlertes > 0
                  ? el('span', { className: 'badge badge-error' }, String(projet.nbAlertes))
                  : el('span', { className: 'badge badge-success' }, '0')
              ]),
              el('td', {}, [
                el('button', {
                  className: 'btn btn-sm btn-ghost',
                  onclick: (e) => {
                    e.stopPropagation();
                    router.navigate('/investissement/projet', { id: projet.id });
                  }
                }, 'Voir')
              ])
            ])
          )
        )
      ])
    ])
  ]);
}

/**
 * Get badge color for project type
 */
function getTypeBadgeColor(type) {
  const colors = {
    'SIGOBE': 'primary',
    'TRANSFERT': 'warning',
    'HORS_SIGOBE': 'info'
  };
  return colors[type] || 'default';
}

/**
 * Get class for execution rate
 */
function getTauxClass(taux) {
  if (taux > 100) return 'taux-over';
  if (taux >= 80) return 'taux-good';
  if (taux >= 50) return 'taux-medium';
  return 'taux-low';
}

/**
 * Render year filter
 */
function renderYearFilter(selectedYear, onYearChange) {
  const years = getAvailableYears();

  return el('div', { className: 'filter-group' }, [
    el('label', { className: 'filter-label' }, 'Année budgétaire'),
    el('select', {
      className: 'form-select',
      id: 'year-filter',
      value: selectedYear,
      onchange: (e) => onYearChange(parseInt(e.target.value))
    },
      years.map(year =>
        el('option', { value: year, selected: year === selectedYear }, String(year))
      )
    )
  ]);
}

/**
 * Main render function
 */
export async function renderInvDashboard() {
  logger.info('[Investissement] Rendering Dashboard...');

  // Injecter les styles du sidebar
  injectInvSidebarStyles();

  const currentYear = getCurrentYear();
  let selectedYear = currentYear;

  // Pour l'instant, utiliser les données mock
  // TODO: Remplacer par appel dataService quand les tables seront créées
  const stats = MOCK_DATA.stats;
  const statsOPE = MOCK_DATA.statsOPE;
  const alertes = MOCK_DATA.alertes;
  const projets = MOCK_DATA.projets;

  const page = el('div', { className: 'page-layout inv-layout' }, [
    renderInvSidebar('/investissement/dashboard'),

    el('main', { className: 'page-main' }, [
      // Header
      el('div', { className: 'page-header' }, [
        el('div', { className: 'page-header-content' }, [
          el('h1', { className: 'page-title' }, 'Dashboard Investissement'),
          el('p', { className: 'page-subtitle' }, 'Vue d\'ensemble des Projets d\'Investissement Publics - DCF Côte d\'Ivoire')
        ]),
        el('div', { className: 'page-header-actions' }, [
          renderYearFilter(selectedYear, (year) => {
            selectedYear = year;
            // TODO: Recharger les données pour l'année sélectionnée
            logger.info(`[Investissement] Year changed to ${year}`);
          })
        ])
      ]),

      // Content
      el('div', { className: 'page-content' }, [
        // KPI Cards
        renderKPICards(stats),

        // OPE Summary - Nouveau V2
        renderOPESummary(statsOPE),

        // Financial Instruments - Nouveau V2
        renderFinancialInstruments(stats),

        // Alerts Banner
        renderAlertsBanner(alertes),

        // Projects Table
        renderProjectsTable(projets)
      ])
    ])
  ]);

  mount('#app', page);

  // Inject custom styles for Investissement module
  injectInvStyles();

  logger.info('[Investissement] Dashboard rendered');
}

/**
 * Inject custom CSS for Investissement module
 */
function injectInvStyles() {
  const styleId = 'inv-module-styles';
  if (document.getElementById(styleId)) return;

  const styles = `
    /* Investissement Module Layout */
    .inv-layout {
      display: flex;
      min-height: 100vh;
    }

    .inv-sidebar {
      width: 240px;
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      padding: 1rem;
      flex-shrink: 0;
    }

    .inv-sidebar .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--color-border);
    }

    .inv-sidebar .sidebar-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
    }

    .inv-sidebar .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .inv-sidebar .sidebar-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      color: var(--color-text-muted);
      text-decoration: none;
      transition: all 0.2s;
    }

    .inv-sidebar .sidebar-link:hover {
      background: var(--color-hover);
      color: var(--color-text);
    }

    .inv-sidebar .sidebar-link.active {
      background: var(--color-primary);
      color: white;
    }

    .inv-sidebar .sidebar-icon {
      font-size: 1.25rem;
    }

    .inv-sidebar .sidebar-label {
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* KPI Grid */
    .inv-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .kpi-card {
      background: var(--color-surface);
      border-radius: 0.75rem;
      padding: 1.25rem;
      border: 1px solid var(--color-border);
      display: flex;
      gap: 1rem;
    }

    .kpi-icon {
      font-size: 2rem;
      opacity: 0.8;
    }

    .kpi-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text);
      line-height: 1.2;
    }

    .kpi-label {
      font-size: 0.875rem;
      color: var(--color-text-muted);
      margin-top: 0.25rem;
    }

    .kpi-sublabel {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      opacity: 0.8;
    }

    .kpi-primary { border-left: 4px solid var(--color-primary); }
    .kpi-success { border-left: 4px solid var(--color-success); }
    .kpi-warning { border-left: 4px solid var(--color-warning); }
    .kpi-error { border-left: 4px solid var(--color-error); }
    .kpi-info { border-left: 4px solid var(--color-info); }

    /* Alerts Card */
    .inv-alerts-card {
      margin-bottom: 1.5rem;
    }

    .alert-section {
      margin-bottom: 1rem;
    }

    .alert-section:last-child {
      margin-bottom: 0;
    }

    .alert-section-title {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
    }

    .alert-section-title.alert-critique {
      background: #fef2f2;
      color: #dc2626;
    }

    .alert-section-title.alert-majeure {
      background: #fffbeb;
      color: #d97706;
    }

    .alert-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .alert-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      border-radius: 0.375rem;
      margin-bottom: 0.25rem;
      font-size: 0.875rem;
    }

    .alert-item.alert-critique {
      background: #fef2f2;
    }

    .alert-item.alert-majeure {
      background: #fffbeb;
    }

    .alert-badge {
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-weight: 700;
      font-size: 0.75rem;
    }

    .alert-critique .alert-badge {
      background: #dc2626;
      color: white;
    }

    .alert-majeure .alert-badge {
      background: #d97706;
      color: white;
    }

    .alert-projet {
      font-weight: 600;
      min-width: 100px;
    }

    .alert-message {
      flex: 1;
      color: var(--color-text-muted);
    }

    .alert-link {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 600;
    }

    /* Projects Table */
    .inv-projects-card .card-body {
      padding: 0;
    }

    .inv-table {
      width: 100%;
      border-collapse: collapse;
    }

    .inv-table th,
    .inv-table td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--color-border);
    }

    .inv-table th {
      background: var(--color-surface-alt);
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
    }

    .inv-table tbody tr {
      cursor: pointer;
      transition: background 0.15s;
    }

    .inv-table tbody tr:hover {
      background: var(--color-hover);
    }

    .inv-table tbody tr.has-alerts {
      background: #fef2f2;
    }

    .projet-cell {
      max-width: 250px;
    }

    .projet-nom {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
    }

    .projet-desc {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    .montant {
      font-family: var(--font-mono);
      font-size: 0.875rem;
    }

    .taux-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
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

    .taux-over {
      background: #dbeafe;
      color: #1e40af;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge-primary { background: var(--color-primary); color: white; }
    .badge-success { background: var(--color-success); color: white; }
    .badge-warning { background: var(--color-warning); color: white; }
    .badge-error { background: var(--color-error); color: white; }
    .badge-info { background: var(--color-info); color: white; }
    .badge-default { background: var(--color-border); color: var(--color-text); }

    /* Filter */
    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-label {
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    .form-select {
      padding: 0.5rem 2rem 0.5rem 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: 0.375rem;
      background: white;
      font-size: 0.875rem;
      cursor: pointer;
    }

    /* Page Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--color-border);
    }

    .page-header-content {
      flex: 1;
    }

    .page-main {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
    }

    /* OPE Summary Card - Nouveau V2 */
    .inv-ope-card {
      margin-bottom: 1.5rem;
      border-left: 4px solid #f59e0b;
    }

    .ope-header {
      background: linear-gradient(135deg, #fef3c7 0%, #fff7ed 100%);
    }

    .ope-badge {
      display: inline-block;
      background: #f59e0b;
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.625rem;
      font-weight: 700;
      margin-right: 0.5rem;
    }

    .ope-body {
      padding: 1rem;
    }

    .ope-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
    }

    .ope-stat {
      text-align: center;
    }

    .ope-stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text);
    }

    .ope-stat-value.ope-taux {
      color: #16a34a;
    }

    .ope-stat-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-top: 0.25rem;
    }

    .ope-alert .ope-stat-value {
      font-size: 0.875rem;
    }

    .text-warning {
      color: #f59e0b;
    }

    .text-success {
      color: #16a34a;
    }

    /* Instruments financiers - Nouveau V2 */
    .inv-instruments-card {
      margin-bottom: 1.5rem;
    }

    .instruments-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .instrument-item {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 0.5rem;
      background: var(--color-surface-alt);
      border: 1px solid var(--color-border);
    }

    .instrument-item.has-items {
      border-left: 3px solid var(--color-primary);
    }

    .instrument-item.has-warning {
      border-left: 3px solid #f59e0b;
      background: #fffbeb;
    }

    .instrument-icon {
      font-size: 1.5rem;
    }

    .instrument-content {
      flex: 1;
    }

    .instrument-title {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--color-text);
      margin-bottom: 0.25rem;
    }

    .instrument-value {
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    .instrument-amount {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-top: 0.25rem;
      font-family: var(--font-mono);
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .ope-stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .instruments-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .inv-layout {
        flex-direction: column;
      }
      .inv-sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid var(--color-border);
      }
      .inv-kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .ope-stats-grid,
      .instruments-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

export default renderInvDashboard;
