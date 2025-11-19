/* ============================================
   Marche Card Widget
   Carte récapitulative d'un marché
   ============================================ */

import { el } from '../../lib/dom.js';
import { money } from '../../lib/format.js';
import router from '../../router.js';

/**
 * Créer une carte marché
 * @param {Object} operation - Données OPERATION
 * @param {Object} options - Options {onClick, showDetails, compact}
 * @returns {HTMLElement}
 */
export function marcheCard(operation, options = {}) {
  const {
    onClick = null,
    showDetails = true,
    compact = false
  } = options;

  const handleClick = onClick || (() => {
    router.navigate('/fiche-marche', { idOperation: operation.id });
  });

  const etatBadge = createEtatBadge(operation.etat);
  const montant = operation.montantActuel || operation.montantPrevisionnel || 0;

  if (compact) {
    return createCompactCard(operation, etatBadge, montant, handleClick);
  }

  return createFullCard(operation, etatBadge, montant, handleClick, showDetails);
}

/**
 * Créer une carte complète
 */
function createFullCard(operation, etatBadge, montant, handleClick, showDetails) {
  return el('div', {
    className: 'marche-card card',
    onclick: handleClick,
    style: 'cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; margin-bottom: 16px;',
    onmouseenter: (e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    },
    onmouseleave: (e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '';
    }
  }, [
    el('div', { className: 'card-body' }, [
      el('div', { style: 'display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;' }, [
        el('div', { className: 'marche-card-icon', style: 'font-size: 32px; margin-right: 12px;' }, '💾'),
        etatBadge
      ]),

      el('h4', {
        className: 'marche-card-title',
        style: 'font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #1F2937;'
      }, operation.objet || 'Sans objet'),

      el('div', { className: 'marche-card-info', style: 'font-size: 14px; color: #6B7280;' }, [
        el('div', { style: 'margin-bottom: 6px;' }, [
          el('strong', {}, 'Montant Prévisionnel : '),
          el('span', { style: 'color: #059669; font-weight: 600;' }, money(montant))
        ]),

        operation.chaineBudgetaire?.ligneBudgetaire ? el('div', { style: 'margin-bottom: 6px;' }, [
          el('strong', {}, 'Imputation Budgétaire : '),
          el('span', {}, operation.chaineBudgetaire.ligneBudgetaire)
        ]) : null,

        showDetails ? el('div', { style: 'margin-bottom: 6px;' }, [
          el('strong', {}, 'Mode de passation : '),
          el('span', {}, operation.modePassation || 'Non renseigné')
        ]) : null,

        showDetails && operation.id ? el('div', { style: 'margin-bottom: 6px;' }, [
          el('strong', {}, 'Référence du marché : '),
          el('span', {}, operation.id)
        ]) : null,

        showDetails ? el('div', {}, [
          el('strong', {}, 'Unité : '),
          el('span', {}, operation.unite || 'Non renseigné')
        ]) : null
      ].filter(Boolean)),

      el('div', { style: 'margin-top: 16px; display: flex; justify-content: flex-end;' }, [
        el('button', {
          className: 'btn btn-sm btn-primary',
          onclick: (e) => {
            e.stopPropagation();
            handleClick();
          }
        }, 'Information sur le marché →')
      ])
    ])
  ]);
}

/**
 * Créer une carte compacte
 */
function createCompactCard(operation, etatBadge, montant, handleClick) {
  return el('div', {
    className: 'marche-card marche-card-compact',
    onclick: handleClick,
    style: `
      display: flex;
      align-items: center;
      padding: 12px;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: background-color 0.2s;
    `,
    onmouseenter: (e) => {
      e.currentTarget.style.backgroundColor = '#F9FAFB';
    },
    onmouseleave: (e) => {
      e.currentTarget.style.backgroundColor = '';
    }
  }, [
    el('div', { style: 'font-size: 24px; margin-right: 12px;' }, '💾'),
    el('div', { style: 'flex: 1;' }, [
      el('div', { style: 'font-weight: 600; margin-bottom: 4px;' }, operation.objet || 'Sans objet'),
      el('div', { style: 'font-size: 13px; color: #6B7280;' }, [
        el('span', {}, money(montant)),
        operation.unite ? el('span', { style: 'margin-left: 12px;' }, ` • ${operation.unite}`) : null
      ].filter(Boolean))
    ]),
    etatBadge
  ]);
}

/**
 * Créer un badge d'état
 */
function createEtatBadge(etat) {
  const etatsConfig = {
    'PLANIFIE': { label: 'Planifié', class: 'badge-primary' },
    'EN_PROCEDURE': { label: 'En Procédure', class: 'badge-purple' },
    'EN_ATTRIBUTION': { label: 'En Attribution', class: 'badge-warning' },
    'VISE': { label: 'Visé', class: 'badge-success-light' },
    'EN_EXEC': { label: 'En Exécution', class: 'badge-success' },
    'CLOS': { label: 'Clôturé', class: 'badge-secondary' },
    'REFUSE': { label: 'Refusé', class: 'badge-error' }
  };

  const config = etatsConfig[etat] || { label: etat || 'Inconnu', class: 'badge-secondary' };

  return el('span', {
    className: `badge ${config.class}`,
    style: 'font-size: 11px;'
  }, config.label);
}

/**
 * Grille de cartes marchés
 * @param {Array} operations - Liste des opérations
 * @param {Object} options - Options
 * @returns {HTMLElement}
 */
export function marcheCardGrid(operations, options = {}) {
  const { columns = 2, ...cardOptions } = options;

  if (!operations || operations.length === 0) {
    return el('div', { className: 'marche-card-grid-empty' }, [
      el('p', { style: 'text-align: center; color: #6B7280; padding: 40px;' },
        'Aucun marché à afficher')
    ]);
  }

  const cards = operations.map(op => marcheCard(op, cardOptions));

  return el('div', {
    className: 'marche-card-grid',
    style: `
      display: grid;
      grid-template-columns: repeat(${columns}, 1fr);
      gap: 16px;
    `
  }, cards);
}

export default { marcheCard, marcheCardGrid };
