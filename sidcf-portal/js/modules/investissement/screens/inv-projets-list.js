/* ============================================
   Liste des Projets d'Investissement
   ============================================
   Affichage filtrable et paginé des projets PIP
   ============================================ */

import { el, mount, qs } from '../../../lib/dom.js';
import { money, percent, abbreviate } from '../../../lib/format.js';
import router from '../../../router.js';
import logger from '../../../lib/logger.js';
import { INV_SIDEBAR_MENU, getCurrentYear, getAvailableYears, createSidebarMenuItems, getMenuIcon } from '../inv-constants.js';
import { createInvFilters, applyInvFilters, injectFilterStyles, DEFAULT_FILTERS } from '../components/inv-filters.js';

// Aliases pour compatibilité
const formatMontant = (amount, short = false) => short ? abbreviate(amount) : money(amount);
const formatPourcent = (val) => percent(val);

// Mock data - Extended list
const MOCK_PROJETS = [
  { id: 'p1', code: 'PAPSE-II', nom: 'Programme d\'Appui au Plan Sectoriel Éducation II', type: 'TRANSFERT', nature: 'RECURRENT', entite: 'UCP-PAPSE', typeEntite: 'UCP', secteur: 'EDUCATION', bailleur: 'BM', isOpe: false, notifie: 45000000000, transfere: 38500000000, execute: 32100000000, tauxExec: 83.4, nbAlertes: 1, statut: 'EN_COURS' },
  { id: 'p2', code: 'PEJEDEC', nom: 'Projet Emploi Jeunes et Développement des Compétences', type: 'SIGOBE', nature: 'NOUVEAU', entite: 'UCP-PEJEDEC', typeEntite: 'UCP', secteur: 'SOCIAL', bailleur: 'BAD', isOpe: false, notifie: 28000000000, transfere: 25200000000, execute: 18900000000, tauxExec: 75.0, nbAlertes: 1, statut: 'EN_COURS' },
  { id: 'p3', code: 'ProSEB', nom: 'Projet Secteur Éducation de Base', type: 'TRANSFERT', nature: 'RECURRENT', entite: 'UCP-ProSEB', typeEntite: 'UCP', secteur: 'EDUCATION', bailleur: 'AFD', isOpe: true, notifie: 35000000000, transfere: 28000000000, execute: 28120000000, tauxExec: 100.4, nbAlertes: 1, statut: 'EN_COURS' },
  { id: 'p4', code: 'PASEA', nom: 'Projet d\'Appui au Secteur Eau et Assainissement', type: 'SIGOBE', nature: 'NOUVEAU', entite: 'ONEP', typeEntite: 'EPN', secteur: 'EAU_ASSAINISSEMENT', bailleur: 'BM', isOpe: true, notifie: 52000000000, transfere: 45500000000, execute: 38250000000, tauxExec: 84.1, nbAlertes: 1, statut: 'EN_COURS' },
  { id: 'p5', code: 'C2D-SANTE', nom: 'Programme Santé C2D Phase III', type: 'TRANSFERT', nature: 'NOUVELLE_PHASE', entite: 'MSHP', typeEntite: 'ADMIN', secteur: 'SANTE', bailleur: 'AFD', isOpe: false, notifie: 18500000000, transfere: 16200000000, execute: 12150000000, tauxExec: 75.0, nbAlertes: 1, statut: 'EN_COURS' },
  { id: 'p6', code: 'PRICI', nom: 'Projet de Renaissance des Infrastructures de CI', type: 'SIGOBE', nature: 'NOUVEAU', entite: 'AGEROUTE', typeEntite: 'EPN', secteur: 'INFRASTRUCTURES', bailleur: 'BM', isOpe: true, notifie: 85000000000, transfere: 72000000000, execute: 65800000000, tauxExec: 91.4, nbAlertes: 1, statut: 'EN_COURS' },
  { id: 'p7', code: 'PSAC', nom: 'Projet de Soutien au Secteur Agricole de Côte d\'Ivoire', type: 'TRANSFERT', nature: 'NOUVEAU', entite: 'ANADER', typeEntite: 'EPN', secteur: 'AGRICULTURE', bailleur: 'BAD', isOpe: false, notifie: 32000000000, transfere: 28500000000, execute: 21375000000, tauxExec: 75.0, nbAlertes: 0, statut: 'EN_COURS' },
  { id: 'p8', code: 'PEPT', nom: 'Projet d\'Électrification Rurale Phase III', type: 'SIGOBE', nature: 'NOUVELLE_PHASE', entite: 'CI-ENERGIES', typeEntite: 'EPN', secteur: 'ENERGIE', bailleur: 'BID', isOpe: true, notifie: 62000000000, transfere: 55000000000, execute: 48400000000, tauxExec: 88.0, nbAlertes: 0, statut: 'EN_COURS' },
  { id: 'p9', code: 'PNACC', nom: 'Programme National d\'Adaptation au Changement Climatique', type: 'HORS_SIGOBE', nature: 'NOUVEAU', entite: 'MINEDD', typeEntite: 'ADMIN', secteur: 'ENVIRONNEMENT', bailleur: 'UE', isOpe: false, notifie: 15000000000, transfere: 12000000000, execute: 8400000000, tauxExec: 70.0, nbAlertes: 2, statut: 'EN_COURS' },
  { id: 'p10', code: 'PTRAN', nom: 'Programme de Transport Urbain d\'Abidjan', type: 'SIGOBE', nature: 'NOUVEAU', entite: 'AGETU', typeEntite: 'EPN', secteur: 'TRANSPORT', bailleur: 'BM', isOpe: true, notifie: 120000000000, transfere: 98000000000, execute: 82320000000, tauxExec: 84.0, nbAlertes: 0, statut: 'EN_COURS' },
  { id: 'p11', code: 'PNGR', nom: 'Programme National de Gestion des Risques', type: 'TRANSFERT', nature: 'NOUVEAU', entite: 'ONPC', typeEntite: 'EPN', secteur: 'SOCIAL', bailleur: 'BADEA', isOpe: false, notifie: 8500000000, transfere: 7200000000, execute: 5040000000, tauxExec: 70.0, nbAlertes: 1, statut: 'EN_COURS' },
  { id: 'p12', code: 'PDCI', nom: 'Programme de Développement Communautaire Intégré', type: 'SIGOBE', nature: 'RECURRENT', entite: 'FDFP', typeEntite: 'EPN', secteur: 'SOCIAL', bailleur: 'BM', isOpe: false, notifie: 22000000000, transfere: 19800000000, execute: 15840000000, tauxExec: 80.0, nbAlertes: 0, statut: 'EN_COURS' }
];

// State
let state = {
  projets: [...MOCK_PROJETS],
  filteredProjets: [...MOCK_PROJETS],
  filters: { ...DEFAULT_FILTERS },
  pagination: {
    page: 1,
    perPage: 10
  },
  sort: {
    field: 'code',
    direction: 'asc'
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
 * Apply filters using the shared filter function
 */
function applyFiltersAndSort() {
  // Use the shared applyInvFilters function with adapted field names
  const adaptedProjets = state.projets.map(p => ({
    ...p,
    typeProjet: p.type, // Map 'type' to 'typeProjet' for applyInvFilters
    secteurCode: p.secteur
  }));

  state.filteredProjets = applyInvFilters(adaptedProjets, state.filters);

  // Apply sort
  state.filteredProjets.sort((a, b) => {
    let valA = a[state.sort.field];
    let valB = b[state.sort.field];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return state.sort.direction === 'asc' ? -1 : 1;
    if (valA > valB) return state.sort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  state.pagination.page = 1;
}

/**
 * Get paginated data
 */
function getPaginatedData() {
  const start = (state.pagination.page - 1) * state.pagination.perPage;
  const end = start + state.pagination.perPage;
  return state.filteredProjets.slice(start, end);
}

/**
 * Handle filter change callback
 */
function handleFilterChange(newFilters) {
  state.filters = newFilters;
  applyFiltersAndSort();
  updateTable();
  updateFiltersUI();
}

/**
 * Update filters UI
 */
function updateFiltersUI() {
  const filtersContainer = qs('#inv-filters-container');
  if (filtersContainer) {
    const newFilters = createInvFilters(state.filters, handleFilterChange, {
      showSearch: true,
      showVisionToggle: false,
      showTypeProjet: true,
      showTypeEntite: true,
      showBailleur: true,
      showSecteur: true,
      showOpe: true,
      filterId: 'inv-filters-container'
    });
    filtersContainer.replaceWith(newFilters);
  }
}

/**
 * Render table header with sort
 */
function renderTableHeader() {
  const columns = [
    { key: 'code', label: 'Projet', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'entite', label: 'Entité', sortable: true },
    { key: 'bailleur', label: 'Bailleur', sortable: true },
    { key: 'notifie', label: 'Notifié', sortable: true, align: 'right' },
    { key: 'transfere', label: 'Transféré', sortable: true, align: 'right' },
    { key: 'execute', label: 'Exécuté', sortable: true, align: 'right' },
    { key: 'tauxExec', label: '% Exec', sortable: true, align: 'center' },
    { key: 'nbAlertes', label: 'Alertes', sortable: true, align: 'center' },
    { key: 'actions', label: '', sortable: false }
  ];

  return el('thead', {}, [
    el('tr', {},
      columns.map(col =>
        el('th', {
          className: `${col.align ? 'text-' + col.align : ''} ${col.sortable ? 'sortable' : ''}`,
          onclick: col.sortable ? () => handleSort(col.key) : null
        }, [
          el('span', {}, col.label),
          col.sortable && state.sort.field === col.key
            ? el('span', { className: 'sort-indicator' }, state.sort.direction === 'asc' ? ' ↑' : ' ↓')
            : null
        ])
      )
    )
  ]);
}

/**
 * Handle column sort
 */
function handleSort(field) {
  if (state.sort.field === field) {
    state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    state.sort.field = field;
    state.sort.direction = 'asc';
  }
  applyFiltersAndSort();
  updateTable();
}

/**
 * Render table body
 */
function renderTableBody() {
  const projets = getPaginatedData();

  if (projets.length === 0) {
    return el('tbody', {}, [
      el('tr', {}, [
        el('td', { colSpan: 10, className: 'text-center' }, [
          el('div', { className: 'empty-state' }, [
            el('div', { className: 'empty-icon' }, '📁'),
            el('p', {}, 'Aucun projet ne correspond aux critères de recherche')
          ])
        ])
      ])
    ]);
  }

  return el('tbody', {},
    projets.map(projet =>
      el('tr', {
        className: projet.nbAlertes > 0 ? 'has-alerts' : '',
        onclick: () => router.navigate('/investissement/projet', { id: projet.id })
      }, [
        el('td', { className: 'projet-cell' }, [
          el('div', { className: 'projet-nom' }, [
            projet.isOpe && el('span', { className: 'badge badge-warning', title: 'OPE' }, 'OPE'),
            el('span', {}, projet.code)
          ]),
          el('div', { className: 'projet-desc' }, projet.nom)
        ]),
        el('td', {}, [
          el('span', { className: `badge badge-${getTypeBadgeColor(projet.type)}` }, projet.type)
        ]),
        el('td', {}, [
          el('div', {}, projet.entite),
          el('div', { className: 'text-muted text-sm' }, projet.typeEntite)
        ]),
        el('td', {}, projet.bailleur),
        el('td', { className: 'text-right montant' }, formatMontant(projet.notifie, true)),
        el('td', { className: 'text-right montant' }, formatMontant(projet.transfere, true)),
        el('td', { className: 'text-right montant' }, formatMontant(projet.execute, true)),
        el('td', { className: 'text-center' }, [
          el('span', { className: `taux-badge ${getTauxClass(projet.tauxExec)}` }, formatPourcent(projet.tauxExec))
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
  );
}

/**
 * Render pagination
 */
function renderPagination() {
  const totalPages = Math.ceil(state.filteredProjets.length / state.pagination.perPage);
  const currentPage = state.pagination.page;

  return el('div', { className: 'pagination' }, [
    el('div', { className: 'pagination-info' },
      `${state.filteredProjets.length} projet(s) trouvé(s) - Page ${currentPage} sur ${totalPages || 1}`
    ),
    el('div', { className: 'pagination-controls' }, [
      el('button', {
        className: 'btn btn-sm',
        disabled: currentPage <= 1,
        onclick: () => {
          state.pagination.page = 1;
          updateTable();
        }
      }, '«'),
      el('button', {
        className: 'btn btn-sm',
        disabled: currentPage <= 1,
        onclick: () => {
          state.pagination.page--;
          updateTable();
        }
      }, '‹'),
      el('span', { className: 'pagination-current' }, `${currentPage} / ${totalPages || 1}`),
      el('button', {
        className: 'btn btn-sm',
        disabled: currentPage >= totalPages,
        onclick: () => {
          state.pagination.page++;
          updateTable();
        }
      }, '›'),
      el('button', {
        className: 'btn btn-sm',
        disabled: currentPage >= totalPages,
        onclick: () => {
          state.pagination.page = totalPages;
          updateTable();
        }
      }, '»')
    ])
  ]);
}

/**
 * Update table without full re-render
 */
function updateTable() {
  const tableContainer = qs('#projets-table-container');
  if (tableContainer) {
    tableContainer.innerHTML = '';
    tableContainer.appendChild(
      el('table', { className: 'table inv-table' }, [
        renderTableHeader(),
        renderTableBody()
      ])
    );
    tableContainer.appendChild(renderPagination());
  }
}

function getTypeBadgeColor(type) {
  const colors = { 'SIGOBE': 'primary', 'TRANSFERT': 'warning', 'HORS_SIGOBE': 'info' };
  return colors[type] || 'default';
}

function getTauxClass(taux) {
  if (taux > 100) return 'taux-over';
  if (taux >= 80) return 'taux-good';
  if (taux >= 50) return 'taux-medium';
  return 'taux-low';
}

/**
 * Main render function
 */
export async function renderInvProjetsList() {
  logger.info('[Investissement] Rendering Projects List...');

  // Reset state
  state.filters = { ...DEFAULT_FILTERS };
  applyFiltersAndSort();

  const page = el('div', { className: 'page-layout inv-layout' }, [
    renderInvSidebar('/investissement/projets'),

    el('main', { className: 'page-main' }, [
      // Header
      el('div', { className: 'page-header' }, [
        el('div', { className: 'page-header-content' }, [
          el('h1', { className: 'page-title' }, 'Projets d\'investissement'),
          el('p', { className: 'page-subtitle' }, 'Liste des Projets d\'Investissement Publics (PIP)')
        ])
      ]),

      // Filters - Using shared component
      createInvFilters(state.filters, handleFilterChange, {
        showSearch: true,
        showVisionToggle: false,
        showTypeProjet: true,
        showTypeEntite: true,
        showBailleur: true,
        showSecteur: true,
        showOpe: true,
        filterId: 'inv-filters-container'
      }),

      // Content
      el('div', { className: 'page-content' }, [
        el('div', { className: 'card' }, [
          el('div', { id: 'projets-table-container', className: 'card-body table-responsive' }, [
            el('table', { className: 'table inv-table' }, [
              renderTableHeader(),
              renderTableBody()
            ]),
            renderPagination()
          ])
        ])
      ])
    ])
  ]);

  mount('#app', page);

  // Inject styles
  injectFilterStyles();
  injectListStyles();

  logger.info('[Investissement] Projects List rendered');
}

function injectListStyles() {
  const styleId = 'inv-list-styles';
  if (document.getElementById(styleId)) return;

  const styles = `
    .table-responsive {
      overflow-x: auto;
    }

    .sortable {
      cursor: pointer;
      user-select: none;
    }

    .sortable:hover {
      background: var(--color-hover);
    }

    .sort-indicator {
      color: var(--color-primary);
      font-weight: 700;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-top: 1px solid var(--color-border);
    }

    .pagination-info {
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    .pagination-controls {
      display: flex;
      gap: 0.25rem;
      align-items: center;
    }

    .pagination-current {
      padding: 0 1rem;
      font-size: 0.875rem;
    }

    .text-muted {
      color: var(--color-text-muted);
    }

    .text-sm {
      font-size: 0.75rem;
    }

    .empty-state {
      padding: 3rem;
      text-align: center;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

export default renderInvProjetsList;
