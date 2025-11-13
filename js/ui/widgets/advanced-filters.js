/* ============================================
   Advanced Filters Widget
   Filtres multi-critères avancés
   ============================================ */

import { el } from '../../lib/dom.js';

/**
 * Créer un widget de filtres avancés
 * @param {Object} config - Configuration des filtres
 * @param {Function} onFilter - Callback avec filtres appliqués
 * @returns {HTMLElement}
 */
export function advancedFilters(config, onFilter) {
  const {
    filters = [],
    searchPlaceholder = 'Rechercher...',
    showSearch = true,
    initialValues = {}
  } = config;

  const currentFilters = { ...initialValues };

  // Créer les dropdowns
  const filterElements = filters.map(filter => {
    return createFilterDropdown(filter, (value) => {
      currentFilters[filter.key] = value;
    }, initialValues[filter.key]);
  });

  // Créer la recherche textuelle
  const searchElement = showSearch ? createSearchInput(searchPlaceholder, (value) => {
    currentFilters.search = value;
  }, initialValues.search) : null;

  // Boutons d'action
  const actions = el('div', { className: 'filters-actions', style: 'display: flex; gap: 8px;' }, [
    el('button', {
      className: 'btn btn-primary',
      onclick: () => {
        if (onFilter) onFilter(currentFilters);
      }
    }, 'Appliquer'),
    el('button', {
      className: 'btn btn-secondary',
      onclick: () => {
        // Réinitialiser les filtres
        Object.keys(currentFilters).forEach(key => {
          currentFilters[key] = '';
        });

        // Réinitialiser les selects
        const selects = document.querySelectorAll('.filter-dropdown select');
        selects.forEach(select => {
          select.value = '';
        });

        // Réinitialiser la recherche
        const searchInput = document.querySelector('.filter-search input');
        if (searchInput) searchInput.value = '';

        if (onFilter) onFilter({});
      }
    }, 'Réinitialiser')
  ]);

  return el('div', { className: 'advanced-filters card' }, [
    el('div', { className: 'card-body' }, [
      el('div', { className: 'filters-row', style: 'display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 12px;' },
        filterElements),
      searchElement,
      actions
    ])
  ]);
}

/**
 * Créer un dropdown de filtre
 */
function createFilterDropdown(filter, onChange, initialValue = '') {
  const { key, label, options, placeholder = 'Tous' } = filter;

  const select = el('select', {
    className: 'form-input',
    onchange: (e) => {
      onChange(e.target.value);
    }
  }, [
    el('option', { value: '' }, placeholder),
    ...options.map(opt => {
      const value = typeof opt === 'string' ? opt : opt.value;
      const labelText = typeof opt === 'string' ? opt : opt.label;
      return el('option', {
        value,
        selected: value === initialValue
      }, labelText);
    })
  ]);

  return el('div', { className: 'filter-dropdown', style: 'flex: 1; min-width: 180px;' }, [
    el('label', { className: 'form-label', style: 'font-size: 13px; margin-bottom: 4px;' }, label),
    select
  ]);
}

/**
 * Créer un champ de recherche
 */
function createSearchInput(placeholder, onChange, initialValue = '') {
  let debounceTimer;

  const input = el('input', {
    type: 'text',
    className: 'form-input',
    placeholder,
    value: initialValue,
    oninput: (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        onChange(e.target.value);
      }, 300); // Debounce de 300ms
    }
  });

  return el('div', { className: 'filter-search', style: 'margin-bottom: 12px;' }, [
    el('label', { className: 'form-label', style: 'font-size: 13px; margin-bottom: 4px;' },
      'Recherche'),
    input
  ]);
}

/**
 * Widget de filtres simples (version compacte)
 * @param {Array} filters - Liste de filtres
 * @param {Function} onChange - Callback
 * @returns {HTMLElement}
 */
export function simpleFilters(filters, onChange) {
  const currentValues = {};

  const elements = filters.map(filter => {
    const select = el('select', {
      className: 'form-input form-input-sm',
      onchange: (e) => {
        currentValues[filter.key] = e.target.value;
        if (onChange) onChange(currentValues);
      }
    }, [
      el('option', { value: '' }, filter.placeholder || filter.label),
      ...filter.options.map(opt => {
        const value = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        return el('option', { value }, label);
      })
    ]);

    return el('div', { className: 'filter-item', style: 'display: inline-block; margin-right: 8px;' }, [
      select
    ]);
  });

  return el('div', { className: 'simple-filters' }, elements);
}

export default { advancedFilters, simpleFilters };
