/* ============================================
   Centre d'Alertes Investissement
   ============================================
   Gestion des alertes automatiques et manuelles
   sur les projets d'investissement
   ============================================ */

import { el, mount, qs } from '../../../lib/dom.js';
import { money, date, abbreviate } from '../../../lib/format.js';
import router from '../../../router.js';
import logger from '../../../lib/logger.js';
import { INV_SIDEBAR_MENU, getCurrentYear, createSidebarMenuItems, getMenuIcon } from '../inv-constants.js';

// Aliases pour compatibilité
const formatMontant = (amount, short = false) => short ? abbreviate(amount) : money(amount);
const formatDate = (d) => date(d);

// Mock alertes data
const MOCK_ALERTES = [
  {
    id: 'a1',
    projectId: 'p1',
    projetCode: 'PAPSE-II',
    projetNom: 'Programme d\'Appui au Plan Sectoriel Éducation II',
    typeAlerte: 'BUDGET_ECLATE_MANQUANT',
    codeAlerte: 'BEM-001',
    priorite: 'CRITIQUE',
    titre: 'Projet en transfert sans budget éclaté',
    description: 'Le projet PAPSE-II est de type TRANSFERT mais n\'a pas de budget éclaté enregistré. Le second transfert ne peut être effectué.',
    annee: 2024,
    valeurSeuil: 0,
    valeurActuelle: 0,
    statut: 'ACTIVE',
    dateDetection: '2024-10-01',
    lienAction: '/investissement/projet?id=p1&tab=budget'
  },
  {
    id: 'a2',
    projectId: 'p2',
    projetCode: 'PEJEDEC',
    projetNom: 'Projet Emploi Jeunes et Développement des Compétences',
    typeAlerte: 'ECART_NOTIFIE_ECLATE',
    codeAlerte: 'ENE-002',
    priorite: 'MAJEURE',
    titre: 'Écart Notifié/Éclaté significatif',
    description: 'Le montant notifié (28 000 M) ne correspond pas au budget éclaté (27 500 M). Écart de 500 M FCFA.',
    annee: 2024,
    valeurSeuil: 0,
    valeurActuelle: 500000000,
    statut: 'ACTIVE',
    dateDetection: '2024-09-15',
    lienAction: '/investissement/projet?id=p2&tab=budget'
  },
  {
    id: 'a3',
    projectId: 'p3',
    projetCode: 'ProSEB',
    projetNom: 'Projet Secteur Éducation de Base',
    typeAlerte: 'TRANSFERE_INFERIEUR_EXECUTE',
    codeAlerte: 'TIE-003',
    priorite: 'CRITIQUE',
    titre: 'Exécuté supérieur au transféré',
    description: 'Le montant exécuté (28 120 M) dépasse le montant transféré (28 000 M). Anomalie de +120 M FCFA à régulariser.',
    annee: 2024,
    valeurSeuil: 28000000000,
    valeurActuelle: 28120000000,
    statut: 'ACTIVE',
    dateDetection: '2024-10-05',
    lienAction: '/investissement/projet?id=p3&tab=financier'
  },
  {
    id: 'a4',
    projectId: 'p4',
    projetCode: 'PASEA',
    projetNom: 'Projet d\'Appui au Secteur Eau et Assainissement',
    typeAlerte: 'VARIATION_COUT_CRITIQUE',
    codeAlerte: 'VCC-004',
    priorite: 'CRITIQUE',
    titre: 'Variation du coût > 30%',
    description: 'Le coût du projet a augmenté de 42% par rapport au budget initial. Cela implique de nouveaux marchés.',
    annee: 2024,
    valeurSeuil: 30,
    valeurActuelle: 42,
    statut: 'ACTIVE',
    dateDetection: '2024-08-20',
    lienAction: '/investissement/projet?id=p4&tab=financier'
  },
  {
    id: 'a5',
    projectId: 'p5',
    projetCode: 'C2D-SANTE',
    projetNom: 'Programme Santé C2D Phase III',
    typeAlerte: 'LETTRE_AVANCE_NON_REGULARISEE',
    codeAlerte: 'LAR-005',
    priorite: 'MAJEURE',
    titre: 'Lettre d\'avance non régularisée',
    description: 'La lettre d\'avance LA-2024-008 de 1 500 M FCFA n\'est pas régularisée. Délai dépassé de 30 jours.',
    annee: 2024,
    valeurSeuil: 90,
    valeurActuelle: 120,
    statut: 'ACTIVE',
    dateDetection: '2024-09-25',
    lienAction: '/investissement/projet?id=p5&tab=transferts'
  },
  {
    id: 'a6',
    projectId: 'p6',
    projetCode: 'PRICI',
    projetNom: 'Projet de Renaissance des Infrastructures',
    typeAlerte: 'RSF_MANQUANT_CLASSE_2',
    codeAlerte: 'RSF-006',
    priorite: 'MAJEURE',
    titre: 'RSF manquant pour dépenses classe 2',
    description: 'Des dépenses de classe 2 ont été exécutées sans RSF associé. Preuves physiques manquantes.',
    annee: 2024,
    valeurSeuil: 1,
    valeurActuelle: 0,
    statut: 'ACTIVE',
    dateDetection: '2024-10-08',
    lienAction: '/investissement/projet?id=p6&tab=physique'
  },
  {
    id: 'a7',
    projectId: 'p7',
    projetCode: 'PSAC',
    projetNom: 'Projet de Soutien au Secteur Agricole',
    typeAlerte: 'MISSION_TERRAIN_MANQUANTE',
    codeAlerte: 'MTM-007',
    priorite: 'MAJEURE',
    titre: 'Mission terrain non effectuée',
    description: 'Aucune mission terrain n\'a été effectuée depuis 75 jours. Périodicité attendue: 60 jours.',
    annee: 2024,
    valeurSeuil: 60,
    valeurActuelle: 75,
    statut: 'ACTIVE',
    dateDetection: '2024-10-10',
    lienAction: '/investissement/projet?id=p7&tab=physique'
  },
  {
    id: 'a8',
    projectId: 'p8',
    projetCode: 'PEPT',
    projetNom: 'Projet d\'Électrification Rurale',
    typeAlerte: 'INDICATEUR_A_RISQUE',
    codeAlerte: 'IAR-008',
    priorite: 'MINEURE',
    titre: 'Indicateur GAR à risque',
    description: 'L\'indicateur "Nombre de ménages électrifiés" est à 68% de la cible annuelle alors qu\'on est au T4.',
    annee: 2024,
    valeurSeuil: 80,
    valeurActuelle: 68,
    statut: 'ACTIVE',
    dateDetection: '2024-10-01',
    lienAction: '/investissement/projet?id=p8&tab=gar'
  },
  {
    id: 'a9',
    projectId: 'p9',
    projetCode: 'PNACC',
    projetNom: 'Programme Adaptation Changement Climatique',
    typeAlerte: 'RETARD_EXECUTION',
    codeAlerte: 'RE-009',
    priorite: 'MAJEURE',
    titre: 'Retard d\'exécution significatif',
    description: 'Le taux d\'exécution (56%) est très inférieur à l\'attendu (75%) au T3.',
    annee: 2024,
    valeurSeuil: 75,
    valeurActuelle: 56,
    statut: 'ACTIVE',
    dateDetection: '2024-09-30',
    lienAction: '/investissement/projet?id=p9&tab=financier'
  },
  {
    id: 'a10',
    projectId: 'p1',
    projetCode: 'PAPSE-II',
    projetNom: 'Programme d\'Appui au Plan Sectoriel Éducation II',
    typeAlerte: 'LETTRE_AVANCE_NON_REGULARISEE',
    codeAlerte: 'LAR-010',
    priorite: 'MAJEURE',
    titre: 'Lettre d\'avance partiellement régularisée',
    description: 'La lettre d\'avance LA-2024-002 est partiellement régularisée. Reste 1,3 Mds à régulariser.',
    annee: 2024,
    valeurSeuil: 1800000000,
    valeurActuelle: 500000000,
    statut: 'ACTIVE',
    dateDetection: '2024-10-12',
    lienAction: '/investissement/projet?id=p1&tab=transferts'
  }
];

// State
let state = {
  alertes: [...MOCK_ALERTES],
  filteredAlertes: [...MOCK_ALERTES],
  filters: {
    priorite: '',
    type: '',
    statut: 'ACTIVE',
    search: ''
  }
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
 * Apply filters
 */
function applyFilters() {
  state.filteredAlertes = state.alertes.filter(a => {
    if (state.filters.priorite && a.priorite !== state.filters.priorite) return false;
    if (state.filters.type && a.typeAlerte !== state.filters.type) return false;
    if (state.filters.statut && a.statut !== state.filters.statut) return false;
    if (state.filters.search) {
      const search = state.filters.search.toLowerCase();
      if (!a.projetCode.toLowerCase().includes(search) &&
          !a.projetNom.toLowerCase().includes(search) &&
          !a.titre.toLowerCase().includes(search)) {
        return false;
      }
    }
    return true;
  });

  // Sort by priority then date
  const priorityOrder = { 'CRITIQUE': 0, 'MAJEURE': 1, 'MINEURE': 2, 'INFO': 3 };
  state.filteredAlertes.sort((a, b) => {
    if (priorityOrder[a.priorite] !== priorityOrder[b.priorite]) {
      return priorityOrder[a.priorite] - priorityOrder[b.priorite];
    }
    return new Date(b.dateDetection) - new Date(a.dateDetection);
  });
}

/**
 * Render summary stats
 */
function renderSummaryStats() {
  const critiques = state.alertes.filter(a => a.priorite === 'CRITIQUE' && a.statut === 'ACTIVE').length;
  const majeures = state.alertes.filter(a => a.priorite === 'MAJEURE' && a.statut === 'ACTIVE').length;
  const mineures = state.alertes.filter(a => a.priorite === 'MINEURE' && a.statut === 'ACTIVE').length;
  const total = state.alertes.filter(a => a.statut === 'ACTIVE').length;

  return el('div', { className: 'alertes-summary' }, [
    el('div', { className: 'summary-stat summary-critique' }, [
      el('div', { className: 'stat-icon' }, '!!'),
      el('div', { className: 'stat-content' }, [
        el('div', { className: 'stat-value' }, String(critiques)),
        el('div', { className: 'stat-label' }, 'Critiques')
      ])
    ]),
    el('div', { className: 'summary-stat summary-majeure' }, [
      el('div', { className: 'stat-icon' }, '!'),
      el('div', { className: 'stat-content' }, [
        el('div', { className: 'stat-value' }, String(majeures)),
        el('div', { className: 'stat-label' }, 'Majeures')
      ])
    ]),
    el('div', { className: 'summary-stat summary-mineure' }, [
      el('div', { className: 'stat-icon' }, 'i'),
      el('div', { className: 'stat-content' }, [
        el('div', { className: 'stat-value' }, String(mineures)),
        el('div', { className: 'stat-label' }, 'Mineures')
      ])
    ]),
    el('div', { className: 'summary-stat summary-total' }, [
      el('div', { className: 'stat-icon' }, '∑'),
      el('div', { className: 'stat-content' }, [
        el('div', { className: 'stat-value' }, String(total)),
        el('div', { className: 'stat-label' }, 'Total actives')
      ])
    ])
  ]);
}

/**
 * Render filters
 */
function renderFilters() {
  const types = [
    { code: 'BUDGET_ECLATE_MANQUANT', label: 'Budget éclaté manquant' },
    { code: 'ECART_NOTIFIE_ECLATE', label: 'Écart Notifié/Éclaté' },
    { code: 'TRANSFERE_INFERIEUR_EXECUTE', label: 'Transféré < Exécuté' },
    { code: 'VARIATION_COUT_CRITIQUE', label: 'Variation coût > 30%' },
    { code: 'LETTRE_AVANCE_NON_REGULARISEE', label: 'Lettre avance non régularisée' },
    { code: 'MISSION_TERRAIN_MANQUANTE', label: 'Mission terrain manquante' },
    { code: 'RSF_MANQUANT_CLASSE_2', label: 'RSF manquant classe 2' },
    { code: 'INDICATEUR_A_RISQUE', label: 'Indicateur à risque' },
    { code: 'RETARD_EXECUTION', label: 'Retard d\'exécution' }
  ];

  return el('div', { className: 'filters-panel' }, [
    el('div', { className: 'filter-group filter-search' }, [
      el('input', {
        type: 'text',
        className: 'form-input',
        placeholder: 'Rechercher par projet ou titre...',
        value: state.filters.search,
        oninput: (e) => {
          state.filters.search = e.target.value;
          applyFilters();
          updateTable();
        }
      })
    ]),
    el('div', { className: 'filter-group' }, [
      el('label', {}, 'Priorité'),
      el('select', {
        className: 'form-select',
        value: state.filters.priorite,
        onchange: (e) => {
          state.filters.priorite = e.target.value;
          applyFilters();
          updateTable();
        }
      }, [
        el('option', { value: '' }, 'Toutes'),
        el('option', { value: 'CRITIQUE' }, 'Critique'),
        el('option', { value: 'MAJEURE' }, 'Majeure'),
        el('option', { value: 'MINEURE' }, 'Mineure'),
        el('option', { value: 'INFO' }, 'Info')
      ])
    ]),
    el('div', { className: 'filter-group' }, [
      el('label', {}, 'Type'),
      el('select', {
        className: 'form-select',
        value: state.filters.type,
        onchange: (e) => {
          state.filters.type = e.target.value;
          applyFilters();
          updateTable();
        }
      }, [
        el('option', { value: '' }, 'Tous'),
        ...types.map(t => el('option', { value: t.code }, t.label))
      ])
    ]),
    el('div', { className: 'filter-group' }, [
      el('label', {}, 'Statut'),
      el('select', {
        className: 'form-select',
        value: state.filters.statut,
        onchange: (e) => {
          state.filters.statut = e.target.value;
          applyFilters();
          updateTable();
        }
      }, [
        el('option', { value: '' }, 'Tous'),
        el('option', { value: 'ACTIVE' }, 'Active'),
        el('option', { value: 'ACQUITTEE' }, 'Acquittée'),
        el('option', { value: 'RESOLUE' }, 'Résolue')
      ])
    ]),
    el('button', {
      className: 'btn btn-ghost',
      onclick: () => {
        state.filters = { priorite: '', type: '', statut: 'ACTIVE', search: '' };
        applyFilters();
        renderInvAlertes();
      }
    }, 'Réinitialiser')
  ]);
}

/**
 * Render alertes table
 */
function renderAlertesTable() {
  if (state.filteredAlertes.length === 0) {
    return el('div', { className: 'empty-state' }, [
      el('div', { className: 'empty-icon' }, '✓'),
      el('p', {}, 'Aucune alerte correspondant aux critères')
    ]);
  }

  return el('table', { className: 'table alertes-table' }, [
    el('thead', {}, [
      el('tr', {}, [
        el('th', { style: 'width: 40px' }, ''),
        el('th', {}, 'Projet'),
        el('th', {}, 'Alerte'),
        el('th', {}, 'Type'),
        el('th', { className: 'text-center' }, 'Année'),
        el('th', {}, 'Détection'),
        el('th', {}, 'Statut'),
        el('th', {}, '')
      ])
    ]),
    el('tbody', {},
      state.filteredAlertes.map(alerte =>
        el('tr', {
          className: `alerte-row alerte-${alerte.priorite.toLowerCase()}`
        }, [
          el('td', { className: 'priorite-cell' }, [
            el('span', {
              className: `priorite-badge priorite-${alerte.priorite.toLowerCase()}`,
              title: alerte.priorite
            }, getPrioriteIcon(alerte.priorite))
          ]),
          el('td', {}, [
            el('div', { className: 'projet-code' }, alerte.projetCode),
            el('div', { className: 'projet-nom' }, alerte.projetNom)
          ]),
          el('td', {}, [
            el('div', { className: 'alerte-titre' }, alerte.titre),
            el('div', { className: 'alerte-desc' }, alerte.description)
          ]),
          el('td', {}, [
            el('span', { className: 'badge badge-default' }, getTypeLabel(alerte.typeAlerte))
          ]),
          el('td', { className: 'text-center' }, String(alerte.annee)),
          el('td', {}, formatDate(alerte.dateDetection)),
          el('td', {}, [
            el('span', { className: `badge badge-${getStatutBadgeColor(alerte.statut)}` }, alerte.statut)
          ]),
          el('td', {}, [
            el('div', { className: 'action-buttons' }, [
              el('button', {
                className: 'btn btn-sm btn-primary',
                onclick: () => router.navigate(alerte.lienAction),
                title: 'Voir le projet'
              }, 'Traiter'),
              alerte.statut === 'ACTIVE' && el('button', {
                className: 'btn btn-sm btn-ghost',
                onclick: () => handleAcquitter(alerte.id),
                title: 'Acquitter l\'alerte'
              }, 'Acquitter')
            ])
          ])
        ])
      )
    )
  ]);
}

/**
 * Get priority icon
 */
function getPrioriteIcon(priorite) {
  const icons = { 'CRITIQUE': '!!', 'MAJEURE': '!', 'MINEURE': 'i', 'INFO': 'o' };
  return icons[priorite] || '?';
}

/**
 * Get type label (shortened)
 */
function getTypeLabel(type) {
  const labels = {
    'BUDGET_ECLATE_MANQUANT': 'Budget éclaté',
    'ECART_NOTIFIE_ECLATE': 'Écart N/E',
    'TRANSFERE_INFERIEUR_EXECUTE': 'T < E',
    'VARIATION_COUT_CRITIQUE': 'Variation > 30%',
    'LETTRE_AVANCE_NON_REGULARISEE': 'Lettre avance',
    'MISSION_TERRAIN_MANQUANTE': 'Mission terrain',
    'RSF_MANQUANT_CLASSE_2': 'RSF manquant',
    'INDICATEUR_A_RISQUE': 'Indicateur GAR',
    'RETARD_EXECUTION': 'Retard'
  };
  return labels[type] || type;
}

/**
 * Get badge color for status
 */
function getStatutBadgeColor(statut) {
  const colors = { 'ACTIVE': 'error', 'ACQUITTEE': 'warning', 'RESOLUE': 'success', 'EXPIREE': 'default' };
  return colors[statut] || 'default';
}

/**
 * Handle acquitter
 */
function handleAcquitter(alerteId) {
  const alerte = state.alertes.find(a => a.id === alerteId);
  if (alerte) {
    alerte.statut = 'ACQUITTEE';
    alerte.dateAcquittement = new Date().toISOString();
    applyFilters();
    updateTable();
    logger.info(`[Alertes] Alerte ${alerteId} acquittée`);
  }
}

/**
 * Update table
 */
function updateTable() {
  const container = qs('#alertes-table-container');
  if (container) {
    container.innerHTML = '';
    container.appendChild(renderAlertesTable());
  }

  // Update summary
  const summaryContainer = qs('#alertes-summary');
  if (summaryContainer) {
    summaryContainer.innerHTML = '';
    const newSummary = renderSummaryStats();
    newSummary.childNodes.forEach(node => summaryContainer.appendChild(node));
  }
}

/**
 * Main render function
 */
export async function renderInvAlertes() {
  logger.info('[Investissement] Rendering Alerts Center...');

  applyFilters();

  const page = el('div', { className: 'page-layout inv-layout' }, [
    renderInvSidebar('/investissement/alertes'),

    el('main', { className: 'page-main' }, [
      // Header
      el('div', { className: 'page-header' }, [
        el('div', { className: 'page-header-content' }, [
          el('h1', { className: 'page-title' }, 'Centre d\'Alertes'),
          el('p', { className: 'page-subtitle' }, 'Gestion des alertes sur les projets d\'investissement')
        ])
      ]),

      // Summary stats
      el('div', { id: 'alertes-summary', className: 'alertes-summary' },
        renderSummaryStats().childNodes
      ),

      // Filters
      renderFilters(),

      // Content
      el('div', { className: 'page-content' }, [
        el('div', { className: 'card' }, [
          el('div', { className: 'card-header' }, [
            el('h3', { className: 'card-title' }, `${state.filteredAlertes.length} alerte(s)`),
            el('div', { className: 'card-actions' }, [
              el('button', { className: 'btn btn-sm btn-ghost' }, 'Exporter CSV')
            ])
          ]),
          el('div', { id: 'alertes-table-container', className: 'card-body' }, [
            renderAlertesTable()
          ])
        ])
      ])
    ])
  ]);

  mount('#app', page);

  // Inject styles
  injectAlertesStyles();

  logger.info('[Investissement] Alerts Center rendered');
}

function injectAlertesStyles() {
  const styleId = 'inv-alertes-styles';
  if (document.getElementById(styleId)) return;

  const styles = `
    .alertes-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-stat {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-radius: 0.5rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
    }

    .summary-stat .stat-icon {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-weight: 700;
      font-size: 1rem;
    }

    .summary-critique {
      border-left: 4px solid #dc2626;
    }

    .summary-critique .stat-icon {
      background: #fef2f2;
      color: #dc2626;
    }

    .summary-majeure {
      border-left: 4px solid #f59e0b;
    }

    .summary-majeure .stat-icon {
      background: #fffbeb;
      color: #f59e0b;
    }

    .summary-mineure {
      border-left: 4px solid #3b82f6;
    }

    .summary-mineure .stat-icon {
      background: #eff6ff;
      color: #3b82f6;
    }

    .summary-total {
      border-left: 4px solid var(--color-primary);
    }

    .summary-total .stat-icon {
      background: var(--color-surface-alt);
      color: var(--color-primary);
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    /* Alertes table */
    .alertes-table {
      width: 100%;
    }

    .alerte-row {
      transition: background 0.15s;
    }

    .alerte-row:hover {
      background: var(--color-hover);
    }

    .alerte-row.alerte-critique {
      background: #fef2f2;
    }

    .alerte-row.alerte-majeure {
      background: #fffbeb;
    }

    .priorite-cell {
      padding: 0.5rem !important;
    }

    .priorite-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      font-weight: 700;
      font-size: 0.875rem;
    }

    .priorite-critique {
      background: #dc2626;
      color: white;
    }

    .priorite-majeure {
      background: #f59e0b;
      color: white;
    }

    .priorite-mineure {
      background: #3b82f6;
      color: white;
    }

    .priorite-info {
      background: #6b7280;
      color: white;
    }

    .projet-code {
      font-weight: 600;
      color: var(--color-primary);
    }

    .projet-nom {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      max-width: 180px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .alerte-titre {
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .alerte-desc {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      max-width: 300px;
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
    }

    .empty-state {
      padding: 3rem;
      text-align: center;
    }

    .empty-icon {
      font-size: 3rem;
      color: var(--color-success);
      margin-bottom: 1rem;
    }

    .card-actions {
      display: flex;
      gap: 0.5rem;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

export default renderInvAlertes;
