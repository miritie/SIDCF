/* ============================================
   Comparator Widget
   Vue comparative Initial vs Actuel (pour avenants)
   ============================================ */

import { el } from '../../lib/dom.js';
import { money, date as formatDate } from '../../lib/format.js';

/**
 * Créer un comparateur Initial / Actuel
 * @param {Object} initial - Données initiales du marché
 * @param {Object} actuel - Données actuelles (après avenants)
 * @param {Object} options - Options
 * @returns {HTMLElement}
 */
export function comparator(initial, actuel, options = {}) {
  const { showDifferences = true } = options;

  const fields = [
    { key: 'objet', label: 'Objet', formatter: (v) => v || 'Non renseigné' },
    { key: 'montant', label: 'Montant', formatter: money },
    { key: 'date', label: 'Date', formatter: (v) => v ? formatDate(v) : 'Non renseigné' },
    { key: 'titulaire', label: 'Titulaire', formatter: (v) => v || '' },
    { key: 'taux', label: 'Taux Minimum', formatter: (v) => v ? `${v}%` : 'NaN' },
    { key: 'duree', label: 'Durée', formatter: (v) => v ? `${v} Jours` : 'Non renseigné Jours' },
    { key: 'tauxDuree', label: 'Taux Durée', formatter: (v) => v ? `${v}%` : '100 %' },
    { key: 'sourceFinancement', label: 'Source de financement', formatter: (v) => v || 'Non renseigné' },
    { key: 'ligneBudgetaire', label: 'Ligne Budgétaire', formatter: (v) => v || 'Non renseigné' },
    { key: 'beneficiaire', label: 'Bénéficiaire', formatter: (v) => v || 'Non renseigné' },
    { key: 'autres', label: 'Autres', formatter: (v) => v || '' }
  ];

  const rows = fields.map(field => {
    const initialValue = initial[field.key];
    const actuelValue = actuel[field.key];
    const difference = calculateDifference(initialValue, actuelValue, field.key);

    return el('tr', {}, [
      el('td', {
        style: 'padding: 12px; border: 1px solid #E5E7EB; background-color: #FEF3C7; font-weight: 600;'
      }, field.label),

      el('td', {
        style: 'padding: 12px; border: 1px solid #E5E7EB; background-color: #F9FAFB;'
      }, field.formatter(initialValue)),

      showDifferences ? el('td', {
        style: `
          padding: 12px;
          border: 1px solid #E5E7EB;
          background-color: #DBEAFE;
          text-align: center;
          font-weight: 600;
        `
      }, difference) : null,

      el('td', {
        style: 'padding: 12px; border: 1px solid #E5E7EB; background-color: #F9FAFB;'
      }, field.formatter(actuelValue))
    ].filter(Boolean));
  });

  const columns = showDifferences ? 4 : 3;
  const colHeaders = showDifferences
    ? ['', 'Marché/Contrat Initial', 'Total Avenant', 'Marché/Contrat Actuel']
    : ['', 'Initial', 'Actuel'];

  return el('div', { className: 'comparator', style: 'overflow-x: auto;' }, [
    el('table', {
      style: 'width: 100%; border-collapse: collapse; margin: 16px 0;'
    }, [
      el('thead', {}, [
        el('tr', {}, colHeaders.map((h, i) =>
          el('th', {
            style: `
              padding: 12px;
              border: 1px solid #E5E7EB;
              background-color: ${i === 0 ? '#FEF3C7' : i === 2 ? '#DBEAFE' : '#F3F4F6'};
              font-weight: 700;
              text-align: center;
              color: #1F2937;
            `
          }, h)
        ))
      ]),
      el('tbody', {}, rows)
    ])
  ]);
}

/**
 * Calculer la différence entre initial et actuel
 */
function calculateDifference(initialValue, actuelValue, key) {
  if (key === 'montant' && typeof initialValue === 'number' && typeof actuelValue === 'number') {
    const diff = actuelValue - initialValue;
    const percentage = initialValue > 0 ? ((diff / initialValue) * 100).toFixed(1) : 'NaN';
    return `${money(diff)} (${percentage}%)`;
  }

  if (key === 'duree' && typeof initialValue === 'number' && typeof actuelValue === 'number') {
    const diff = actuelValue - initialValue;
    return `${diff} Jours`;
  }

  if (key === 'taux' && initialValue && actuelValue) {
    return `+${((actuelValue - initialValue) || 0).toFixed(1)}%`;
  }

  if (key === 'tauxDuree' && initialValue && actuelValue) {
    return `+${((actuelValue - initialValue) || 0).toFixed(1)}%`;
  }

  return '-';
}

/**
 * Comparateur simplifié (2 colonnes seulement)
 * @param {Object} data - Données {label, initial, actuel}[]
 * @returns {HTMLElement}
 */
export function simpleComparator(data) {
  const rows = data.map(row => {
    return el('div', {
      className: 'simple-comparator-row',
      style: 'display: grid; grid-template-columns: 150px 1fr 1fr; gap: 12px; margin-bottom: 8px;'
    }, [
      el('div', {
        style: 'font-weight: 600; color: #4B5563;'
      }, row.label),
      el('div', {
        style: 'padding: 8px; background-color: #FEF3C7; border-radius: 4px;'
      }, row.initial),
      el('div', {
        style: 'padding: 8px; background-color: #DBEAFE; border-radius: 4px;'
      }, row.actuel)
    ]);
  });

  return el('div', { className: 'simple-comparator' }, [
    el('div', {
      style: 'display: grid; grid-template-columns: 150px 1fr 1fr; gap: 12px; margin-bottom: 12px; font-weight: bold;'
    }, [
      el('div', {}),
      el('div', {}, 'Initial'),
      el('div', {}, 'Actuel')
    ]),
    ...rows
  ]);
}

export default { comparator, simpleComparator };
