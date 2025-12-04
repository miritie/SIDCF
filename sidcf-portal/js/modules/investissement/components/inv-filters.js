/* ============================================
   Filtres Transverses Investissement
   ============================================
   Composant réutilisable pour tous les écrans
   Filtres: Année, Type, Entité, Bailleur, Secteur, OPE
   Toggle: Vision Année / Pluriannuel
   ============================================ */

import { el } from '../../../lib/dom.js';

// Fonctions locales pour éviter la dépendance circulaire avec index.js
function getCurrentYear() {
  return new Date().getFullYear();
}

function getAvailableYears() {
  const currentYear = getCurrentYear();
  const years = [];
  for (let y = currentYear - 5; y <= currentYear + 2; y++) {
    years.push(y);
  }
  return years;
}

/**
 * Configuration par défaut des filtres
 */
export const DEFAULT_FILTERS = {
  annee: getCurrentYear(),
  visionPluriannuelle: false,
  typeProjet: '',
  typeEntite: '',
  bailleur: '',
  secteur: '',
  ope: '',
  search: ''
};

/**
 * Registres des options de filtres
 */
export const FILTER_OPTIONS = {
  typeProjet: [
    { value: '', label: 'Tous types' },
    { value: 'SIGOBE_DIRECT', label: 'SIGOBE Direct' },
    { value: 'TRANSFERT', label: 'Transfert' },
    { value: 'HORS_SIGOBE', label: 'Hors SIGOBE' }
  ],
  typeEntite: [
    { value: '', label: 'Toutes entités' },
    { value: 'UCP', label: 'UCP' },
    { value: 'EPN', label: 'EPN' },
    { value: 'COLLECTIVITE', label: 'Collectivité' },
    { value: 'ADMIN', label: 'Admin. centrale' }
  ],
  bailleur: [
    { value: '', label: 'Tous bailleurs' },
    { value: 'BM', label: 'Banque Mondiale' },
    { value: 'BAD', label: 'BAD' },
    { value: 'AFD', label: 'AFD' },
    { value: 'UE', label: 'Union Européenne' },
    { value: 'BID', label: 'BID' },
    { value: 'BADEA', label: 'BADEA' },
    { value: 'BOAD', label: 'BOAD' },
    { value: 'FIDA', label: 'FIDA' },
    { value: 'JICA', label: 'JICA' },
    { value: 'KFW', label: 'KfW' },
    { value: 'MULTI', label: 'Multi-bailleurs' }
  ],
  secteur: [
    { value: '', label: 'Tous secteurs' },
    { value: 'EDUCATION', label: 'Éducation' },
    { value: 'SANTE', label: 'Santé' },
    { value: 'AGRICULTURE', label: 'Agriculture' },
    { value: 'INFRASTRUCTURES', label: 'Infrastructures' },
    { value: 'ENERGIE', label: 'Énergie' },
    { value: 'EAU_ASSAINISSEMENT', label: 'Eau & Assainissement' },
    { value: 'TRANSPORT', label: 'Transport' },
    { value: 'SOCIAL', label: 'Protection sociale' },
    { value: 'ENVIRONNEMENT', label: 'Environnement' },
    { value: 'NUMERIQUE', label: 'Numérique' },
    { value: 'GOUVERNANCE', label: 'Gouvernance' }
  ],
  ope: [
    { value: '', label: 'Tous projets' },
    { value: 'oui', label: 'OPE uniquement' },
    { value: 'non', label: 'Non OPE' }
  ],
  perimetreDcf: [
    { value: '', label: 'Tout périmètre' },
    { value: 'OUI', label: 'Dans périmètre DCF' },
    { value: 'NON', label: 'Hors périmètre DCF' }
  ]
};

/**
 * Créer la barre de filtres transverses
 * @param {Object} currentFilters - Filtres actuels
 * @param {Function} onFilterChange - Callback appelé quand un filtre change
 * @param {Object} options - Options de configuration
 * @returns {HTMLElement}
 */
export function createInvFilters(currentFilters = {}, onFilterChange, options = {}) {
  const filters = { ...DEFAULT_FILTERS, ...currentFilters };
  const {
    showSearch = true,
    showVisionToggle = true,
    showTypeProjet = true,
    showTypeEntite = true,
    showBailleur = true,
    showSecteur = true,
    showOpe = true,
    showPerimetreDcf = false,
    compact = false,
    filterId = 'inv-filters-container'
  } = options;

  const handleChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    if (onFilterChange) {
      onFilterChange(newFilters, field, value);
    }
  };

  // Check if any filters are active (other than year and visionPluriannuelle)
  const hasActiveFilters = filters.typeProjet || filters.typeEntite || filters.bailleur ||
    filters.secteur || filters.ope || filters.search || filters.perimetreDcf;

  return el('div', { id: filterId, className: `inv-filters ${compact ? 'inv-filters-compact' : ''} ${hasActiveFilters ? 'has-active-filters' : ''}` }, [
    // Ligne 1: Toggle vision + Année + Recherche
    el('div', { className: 'inv-filters-row inv-filters-main' }, [
      // Toggle Vision Année/Pluriannuel
      showVisionToggle && el('div', { className: 'inv-filter-group inv-vision-toggle' }, [
        el('div', { className: 'vision-toggle-container' }, [
          el('button', {
            className: `vision-btn ${!filters.visionPluriannuelle ? 'active' : ''}`,
            onclick: () => handleChange('visionPluriannuelle', false)
          }, [
            el('span', { className: 'vision-icon' }, '📅'),
            el('span', { className: 'vision-label' }, `Année ${filters.annee}`)
          ]),
          el('button', {
            className: `vision-btn ${filters.visionPluriannuelle ? 'active' : ''}`,
            onclick: () => handleChange('visionPluriannuelle', true)
          }, [
            el('span', { className: 'vision-icon' }, '📊'),
            el('span', { className: 'vision-label' }, 'Pluriannuel')
          ])
        ])
      ]),

      // Année
      createYearFilter(filters.annee, handleChange),

      // Recherche
      showSearch && el('div', { className: 'inv-filter-group inv-filter-search' }, [
        el('input', {
          type: 'text',
          className: 'inv-filter-input',
          placeholder: 'Rechercher projet, code, entité...',
          value: filters.search || '',
          oninput: (e) => handleChange('search', e.target.value)
        }),
        filters.search && el('button', {
          className: 'inv-filter-clear',
          onclick: () => handleChange('search', ''),
          title: 'Effacer'
        }, '×')
      ])
    ]),

    // Ligne 2: Filtres métier
    el('div', { className: 'inv-filters-row inv-filters-secondary' }, [
      // Type projet
      showTypeProjet && createSelectFilter('typeProjet', 'Type', filters.typeProjet, FILTER_OPTIONS.typeProjet, handleChange),

      // Type entité
      showTypeEntite && createSelectFilter('typeEntite', 'Entité', filters.typeEntite, FILTER_OPTIONS.typeEntite, handleChange),

      // Bailleur
      showBailleur && createSelectFilter('bailleur', 'Bailleur', filters.bailleur, FILTER_OPTIONS.bailleur, handleChange),

      // Secteur
      showSecteur && createSelectFilter('secteur', 'Secteur', filters.secteur, FILTER_OPTIONS.secteur, handleChange),

      // OPE
      showOpe && createSelectFilter('ope', 'OPE', filters.ope, FILTER_OPTIONS.ope, handleChange),

      // Périmètre DCF
      showPerimetreDcf && createSelectFilter('perimetreDcf', 'Périmètre', filters.perimetreDcf, FILTER_OPTIONS.perimetreDcf, handleChange),

      // Bouton reset
      el('button', {
        className: 'inv-filter-reset',
        onclick: () => onFilterChange && onFilterChange({ ...DEFAULT_FILTERS }, 'reset', null),
        title: 'Réinitialiser les filtres'
      }, 'Réinitialiser')
    ])
  ].filter(Boolean));
}

/**
 * Créer le filtre année
 */
function createYearFilter(currentYear, onChange) {
  const selectEl = el('select', {
    className: 'inv-filter-select',
    onchange: (e) => onChange('annee', parseInt(e.target.value))
  }, getAvailableYears().map(y =>
    el('option', { value: y }, String(y))
  ));

  // Set value after creation
  selectEl.value = currentYear;

  return el('div', { className: 'inv-filter-group' }, [
    el('label', { className: 'inv-filter-label' }, 'Année'),
    selectEl
  ]);
}

/**
 * Créer un filtre select
 */
function createSelectFilter(field, label, currentValue, options, onChange) {
  const selectEl = el('select', {
    className: 'inv-filter-select',
    onchange: (e) => onChange(field, e.target.value)
  }, options.map(opt =>
    el('option', { value: opt.value }, opt.label)
  ));

  // Set value after creation to ensure it's properly selected
  selectEl.value = currentValue || '';

  return el('div', { className: 'inv-filter-group' }, [
    el('label', { className: 'inv-filter-label' }, label),
    selectEl
  ]);
}

/**
 * Appliquer les filtres à une liste de projets
 * @param {Array} projets - Liste des projets
 * @param {Object} filters - Filtres à appliquer
 * @returns {Array} - Projets filtrés
 */
export function applyInvFilters(projets, filters) {
  return projets.filter(p => {
    // Type projet
    if (filters.typeProjet && p.typeProjet !== filters.typeProjet && p.type !== filters.typeProjet) {
      return false;
    }

    // Type entité
    if (filters.typeEntite && p.typeEntite !== filters.typeEntite) {
      return false;
    }

    // Bailleur
    if (filters.bailleur) {
      const bailleurMatch = p.bailleur === filters.bailleur ||
        (p.bailleurs && p.bailleurs.some(b => b.code === filters.bailleur));
      if (!bailleurMatch) return false;
    }

    // Secteur
    if (filters.secteur && p.secteur !== filters.secteur && p.secteurCode !== filters.secteur) {
      return false;
    }

    // OPE
    if (filters.ope === 'oui' && !p.isOpe) return false;
    if (filters.ope === 'non' && p.isOpe) return false;

    // Périmètre DCF
    if (filters.perimetreDcf && p.dansPerimetreDcf !== filters.perimetreDcf) {
      return false;
    }

    // Recherche textuelle
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const searchFields = [
        p.code, p.nom, p.entite, p.entiteExecutante,
        p.ministere, p.bailleur
      ].filter(Boolean).map(s => s.toLowerCase());

      if (!searchFields.some(field => field.includes(search))) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Créer un résumé textuel des filtres actifs
 */
export function getFiltersummary(filters) {
  const parts = [];

  if (filters.visionPluriannuelle) {
    parts.push('Vision pluriannuelle');
  } else {
    parts.push(`Année ${filters.annee}`);
  }

  if (filters.typeProjet) {
    const opt = FILTER_OPTIONS.typeProjet.find(o => o.value === filters.typeProjet);
    if (opt) parts.push(opt.label);
  }

  if (filters.bailleur) {
    const opt = FILTER_OPTIONS.bailleur.find(o => o.value === filters.bailleur);
    if (opt) parts.push(opt.label);
  }

  if (filters.secteur) {
    const opt = FILTER_OPTIONS.secteur.find(o => o.value === filters.secteur);
    if (opt) parts.push(opt.label);
  }

  if (filters.ope === 'oui') {
    parts.push('OPE uniquement');
  }

  return parts.join(' | ');
}

/**
 * Injecter les styles CSS pour les filtres
 */
export function injectFilterStyles() {
  const styleId = 'inv-filters-styles';
  if (document.getElementById(styleId)) return;

  const styles = `
    /* Filtres transverses Investissement */
    .inv-filters {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .inv-filters-compact {
      padding: 0.75rem;
    }

    .inv-filters-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: flex-end;
      justify-content: flex-start;
    }

    .inv-filters-main {
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--color-border);
    }

    .inv-filters-secondary {
      flex-wrap: wrap;
    }

    .inv-filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .inv-filter-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .inv-filter-select {
      padding: 0.5rem 2rem 0.5rem 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: 0.375rem;
      background: white;
      font-size: 0.875rem;
      min-width: 140px;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
      background-position: right 0.5rem center;
      background-repeat: no-repeat;
      background-size: 1.25em 1.25em;
    }

    .inv-filter-select:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .inv-filter-input {
      padding: 0.5rem 2rem 0.5rem 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: 0.375rem;
      font-size: 0.875rem;
      width: 100%;
    }

    .inv-filter-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .inv-filter-search {
      flex: 1;
      min-width: 200px;
      position: relative;
    }

    .inv-filter-clear {
      position: absolute;
      right: 0.5rem;
      bottom: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.25rem;
      color: var(--color-text-muted);
      padding: 0 0.25rem;
      line-height: 1;
    }

    .inv-filter-clear:hover {
      color: var(--color-error);
    }

    .inv-filter-reset {
      padding: 0.5rem 1rem;
      border: 1px solid var(--color-border);
      border-radius: 0.375rem;
      background: var(--color-surface);
      font-size: 0.875rem;
      cursor: pointer;
      color: var(--color-text-muted);
      transition: all 0.2s;
      align-self: flex-end;
    }

    .inv-filter-reset:hover {
      background: var(--color-hover);
      color: var(--color-text);
      border-color: var(--color-primary);
    }

    /* Active filters indicator */
    .inv-filters.has-active-filters {
      border-color: var(--color-primary);
      border-width: 2px;
    }

    .inv-filters-summary {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px dashed var(--color-border);
    }

    .filter-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      background: var(--color-primary);
      color: white;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .filter-tag-remove {
      cursor: pointer;
      font-weight: 700;
      margin-left: 0.25rem;
      opacity: 0.8;
    }

    .filter-tag-remove:hover {
      opacity: 1;
    }

    /* Toggle Vision Année/Pluriannuel */
    .inv-vision-toggle {
      margin-right: auto;
    }

    .vision-toggle-container {
      display: flex;
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .vision-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      background: white;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .vision-btn:first-child {
      border-right: 1px solid var(--color-border);
    }

    .vision-btn:hover {
      background: var(--color-hover);
    }

    .vision-btn.active {
      background: var(--color-primary);
      color: white;
    }

    .vision-icon {
      font-size: 1rem;
    }

    .vision-label {
      font-weight: 500;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .inv-filters-row {
        gap: 0.75rem;
      }

      .inv-filter-select {
        min-width: 120px;
      }
    }

    @media (max-width: 768px) {
      .inv-filters-main {
        flex-direction: column;
        align-items: stretch;
      }

      .inv-vision-toggle {
        margin-right: 0;
      }

      .vision-toggle-container {
        width: 100%;
      }

      .vision-btn {
        flex: 1;
        justify-content: center;
      }

      .inv-filter-search {
        min-width: 100%;
      }

      .inv-filters-secondary {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
      }

      .inv-filter-group {
        width: 100%;
      }

      .inv-filter-select {
        width: 100%;
        min-width: auto;
      }

      .inv-filter-reset {
        grid-column: span 2;
      }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

export default {
  createInvFilters,
  applyInvFilters,
  getFiltersummary,
  injectFilterStyles,
  DEFAULT_FILTERS,
  FILTER_OPTIONS
};
