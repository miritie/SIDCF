/* ============================================
   ECR07D - Liste des Marchés
   Navigation et recherche dans tous les marchés
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { advancedFilters } from '../../../ui/widgets/advanced-filters.js';
import { marcheCardGrid } from '../../../ui/widgets/marche-card.js';

export async function renderDashboardListe(container, filters = {}) {
  const operations = await dataService.query(ENTITIES.OPERATION);
  const registries = dataService.getAllRegistries();

  let filteredOperations = [...operations];

  // Configuration des filtres
  const filterConfig = {
    filters: [
      {
        key: 'unite',
        label: 'Unité Opérationnelle',
        options: [...new Set(operations.map(o => o.unite))].filter(Boolean),
        placeholder: 'Toutes'
      },
      {
        key: 'typeMarche',
        label: 'Type de Marché',
        options: registries.TYPE_MARCHE || [],
        placeholder: 'Tous'
      },
      {
        key: 'etat',
        label: 'État',
        options: registries.ETAT_MARCHE || ['PLANIFIE', 'EN_EXEC', 'CLOS'],
        placeholder: 'Tous'
      },
      {
        key: 'exercice',
        label: 'Exercice',
        options: [...new Set(operations.map(o => o.exercice))].filter(Boolean),
        placeholder: 'Tous'
      }
    ],
    searchPlaceholder: 'Rechercher par objet du marché...',
    showSearch: true
  };

  const content = el('div', { className: 'dashboard-liste' }, [
    // Filtres
    el('div', { id: 'filters-container', style: 'margin-bottom: 24px;' }),

    // Résultats
    el('div', { id: 'results-container' })
  ]);

  mount(container, content);

  // Rendu initial des filtres
  const filtersEl = advancedFilters(filterConfig, (appliedFilters) => {
    // Appliquer les filtres
    filteredOperations = operations.filter(op => {
      if (appliedFilters.unite && op.unite !== appliedFilters.unite) return false;
      if (appliedFilters.typeMarche && op.typeMarche !== appliedFilters.typeMarche) return false;
      if (appliedFilters.etat && op.etat !== appliedFilters.etat) return false;
      if (appliedFilters.exercice && op.exercice != appliedFilters.exercice) return false;
      if (appliedFilters.search) {
        const search = appliedFilters.search.toLowerCase();
        return op.objet?.toLowerCase().includes(search);
      }
      return true;
    });

    // Rafraîchir les résultats
    renderResults(filteredOperations);
  });

  mount(document.querySelector('#filters-container'), filtersEl);

  // Rendu initial des résultats
  renderResults(filteredOperations);

  function renderResults(ops) {
    const resultsContainer = document.querySelector('#results-container');

    if (!ops || ops.length === 0) {
      mount(resultsContainer, el('div', { className: 'alert alert-info' },
        'Aucun marché ne correspond aux critères de recherche'));
      return;
    }

    const header = el('div', {
      style: 'margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;'
    }, [
      el('div', { style: 'font-weight: 600; color: #4B5563;' },
        `${ops.length} marché(s) trouvé(s)`),
      el('div', {}, [
        el('button', { className: 'btn btn-sm btn-secondary' }, 'Affichage Tableau'),
        el('button', { className: 'btn btn-sm btn-primary', style: 'margin-left: 8px;' }, 'Affichage Cartes')
      ])
    ]);

    const grid = marcheCardGrid(ops, {
      columns: 2,
      showDetails: true
    });

    mount(resultsContainer, el('div', {}, [header, grid]));
  }
}

export default { renderDashboardListe };
