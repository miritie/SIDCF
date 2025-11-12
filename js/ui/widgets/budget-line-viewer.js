/* ============================================
   Budget Line Viewer - Affichage détaillé d'une ligne budgétaire
   ============================================ */

import { el } from '../../lib/dom.js';
import { money } from '../../lib/format.js';
import { openDrawer } from './drawer.js';

/**
 * Afficher les détails d'une ligne budgétaire
 * @param {Object} budgetLine - Ligne budgétaire BUDGET_LINE
 */
export function showBudgetLineDetails(budgetLine) {
  if (!budgetLine) {
    alert('Aucune ligne budgétaire trouvée');
    return;
  }

  const content = renderBudgetLineContent(budgetLine);
  openDrawer('Ligne Budgétaire', content, { width: '600px' });
}

/**
 * Créer le contenu du drawer
 */
function renderBudgetLineContent(bl) {
  return el('div', { className: 'budget-line-details' }, [
    // Section budgétaire
    renderSection('Section budgétaire', [
      { label: 'Code section', value: bl.section },
      { label: 'Libellé', value: bl.sectionLib }
    ]),

    // Programme
    renderSection('Programme', [
      { label: 'Code programme', value: bl.programme },
      { label: 'Libellé', value: bl.programmeLib }
    ]),

    // Unité administrative
    renderSection('Unité Administrative (UA)', [
      { label: 'Code UA', value: bl.uaCode },
      { label: 'Libellé', value: bl.uaLib }
    ]),

    // Action
    renderSection('Action', [
      { label: 'Code action', value: bl.actionCode },
      { label: 'Libellé', value: bl.actionLib }
    ]),

    // Activité
    renderSection('Activité', [
      { label: 'Code activité', value: bl.activiteCode },
      { label: 'Libellé', value: bl.activiteLib }
    ]),

    // Ligne budgétaire
    renderSection('Ligne budgétaire', [
      { label: 'Code ligne', value: bl.ligneCode },
      { label: 'Libellé', value: bl.ligneLib },
      { label: 'Grande nature', value: getNatureLabel(bl.grandeNature) }
    ]),

    // Financement
    renderSection('Financement', [
      { label: 'Type de financement', value: bl.typeFinancement },
      { label: 'Source de financement', value: bl.sourceFinancement }
    ]),

    // Zone (si présente)
    bl.zoneCode ? renderSection('Localisation', [
      { label: 'Code zone', value: bl.zoneCode },
      { label: 'Libellé zone', value: bl.zoneLib }
    ]) : null,

    // Crédits
    renderSection('Crédits', [
      { label: 'Autorisations d\'Engagement (AE)', value: money(bl.AE), highlight: true },
      { label: 'Crédits de Paiement (CP)', value: money(bl.CP), highlight: true }
    ], 'section-highlight')
  ]);
}

/**
 * Créer une section de détails
 */
function renderSection(title, items, className = '') {
  const filteredItems = items.filter(item => item && item.value);

  if (filteredItems.length === 0) return null;

  return el('div', { className: `budget-section ${className}` }, [
    el('h4', { className: 'budget-section-title' }, title),
    el('div', { className: 'budget-section-content' },
      filteredItems.map(item =>
        el('div', { className: `budget-field ${item.highlight ? 'highlight' : ''}` }, [
          el('div', { className: 'budget-field-label' }, item.label),
          el('div', { className: 'budget-field-value' }, String(item.value || '-'))
        ])
      )
    )
  ]);
}

/**
 * Libellés des grandes natures
 */
function getNatureLabel(code) {
  const natures = {
    '1': '1 - Personnel',
    '2': '2 - Biens et Services',
    '3': '3 - Transferts',
    '4': '4 - Investissements'
  };
  return natures[code] || code;
}

/**
 * Créer un panneau résumé compact de budget line
 * @param {Object} budgetLine
 * @returns {HTMLElement}
 */
export function renderBudgetLineSummary(budgetLine) {
  if (!budgetLine) {
    return el('div', { className: 'alert alert-warning' }, 'Aucune ligne budgétaire associée');
  }

  const viewBtn = el('button', { className: 'btn btn-sm btn-secondary' }, '👁️ Voir détails');
  viewBtn.addEventListener('click', () => showBudgetLineDetails(budgetLine));

  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, 'Ligne budgétaire'),
      viewBtn
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { className: 'budget-line-summary' }, [
        el('div', { className: 'summary-row' }, [
          el('span', { className: 'summary-label' }, 'UA:'),
          el('span', { className: 'summary-value' }, `${budgetLine.uaCode} - ${budgetLine.uaLib}`)
        ]),
        el('div', { className: 'summary-row' }, [
          el('span', { className: 'summary-label' }, 'Activité:'),
          el('span', { className: 'summary-value' }, `${budgetLine.activiteCode} - ${budgetLine.activiteLib}`)
        ]),
        el('div', { className: 'summary-row' }, [
          el('span', { className: 'summary-label' }, 'Ligne:'),
          el('span', { className: 'summary-value' }, `${budgetLine.ligneCode} - ${budgetLine.ligneLib}`)
        ]),
        el('div', { className: 'summary-row' }, [
          el('span', { className: 'summary-label' }, 'Financement:'),
          el('span', { className: 'summary-value' }, budgetLine.sourceFinancement)
        ]),
        el('div', { className: 'summary-row highlight' }, [
          el('span', { className: 'summary-label' }, 'AE / CP:'),
          el('span', { className: 'summary-value' }, `${money(budgetLine.AE)} / ${money(budgetLine.CP)}`)
        ])
      ])
    ])
  ]);
}

export default { showBudgetLineDetails, renderBudgetLineSummary };
