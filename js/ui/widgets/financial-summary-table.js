/* ============================================
   Financial Summary Table Widget
   Tableau financier récapitulatif (12 colonnes)
   ============================================ */

import { el } from '../../lib/dom.js';
import { money, percent } from '../../lib/format.js';

/**
 * Créer le tableau financier récapitulatif (vert, 12 colonnes)
 * @param {Object} data - Données financières calculées
 * @returns {HTMLElement}
 */
export function financialSummaryTable(data) {
  const {
    budgetActuel = 0,
    montantBase = 0,
    montantAvenant = 0,
    nombreAvenants = 0,
    tauxRatioAvenant = 0,
    montantGlobal = 0,
    cumulOPVise = 0,
    resteAPayer = 0,
    tauxExecutionFinancier = 0,
    dureeTotale = 0,
    dureeEcoulee = 0,
    budgetDisponible = 0
  } = data;

  const headers = [
    'Budget actuel',
    'Montant de base du marché',
    'Montant avenant',
    'Nombre d\'avenant',
    'Taux ratio montant avenant/Montant marché',
    'Montant global du Marché (Base+Av)',
    'Cumul OP visé',
    'Reste à payer du marché',
    'Taux d\'exécution financier du marché',
    'Durée totale du marché (durée marché+avenant)',
    'Durée écoulée(jours)',
    'Budget disponible'
  ];

  const values = [
    budgetActuel > 0 ? money(budgetActuel) : 'NaN',
    montantBase > 0 ? money(montantBase) : 'NaN',
    nombreAvenants > 0 ? money(montantAvenant) : '0',
    String(nombreAvenants),
    nombreAvenants > 0 ? `${tauxRatioAvenant.toFixed(1)}%` : 'NaN',
    montantGlobal > 0 ? money(montantGlobal) : 'NaN',
    cumulOPVise > 0 ? money(cumulOPVise) : '0',
    resteAPayer !== undefined ? money(resteAPayer) : 'NaN',
    tauxExecutionFinancier > 0 ? `${tauxExecutionFinancier.toFixed(1)}%` : 'NaN %',
    dureeTotale > 0 ? String(dureeTotale) : '0',
    dureeEcoulee > 0 ? String(dureeEcoulee) : '19977',
    budgetDisponible !== undefined ? money(budgetDisponible) : 'NaN'
  ];

  const headerCells = headers.map(h =>
    el('th', {
      style: `
        padding: 12px 8px;
        background-color: #70AD47;
        color: white;
        font-size: 12px;
        font-weight: 600;
        text-align: center;
        border: 1px solid #5A8F37;
        min-width: 100px;
      `
    }, h)
  );

  const valueCells = values.map((v, index) => {
    // Dernière cellule (Budget disponible) en rose si NaN
    const bgColor = index === values.length - 1 && v === 'NaN'
      ? '#FFB6C1'
      : '#A8D08D';

    return el('td', {
      style: `
        padding: 12px 8px;
        background-color: ${bgColor};
        font-size: 13px;
        font-weight: 600;
        text-align: center;
        border: 1px solid #91C46F;
      `
    }, v);
  });

  return el('div', {
    className: 'financial-summary-table',
    style: 'overflow-x: auto; margin: 16px 0;'
  }, [
    el('table', {
      style: `
        width: 100%;
        border-collapse: collapse;
        background-color: #A8D08D;
      `
    }, [
      el('thead', {}, [el('tr', {}, headerCells)]),
      el('tbody', {}, [el('tr', {}, valueCells)])
    ])
  ]);
}

/**
 * Variante compacte (6 colonnes principales)
 * @param {Object} data - Données financières
 * @returns {HTMLElement}
 */
export function compactFinancialTable(data) {
  const {
    montantBase = 0,
    montantGlobal = 0,
    cumulOPVise = 0,
    resteAPayer = 0,
    tauxExecutionFinancier = 0,
    nombreAvenants = 0
  } = data;

  const columns = [
    { label: 'Montant Base', value: money(montantBase) },
    { label: 'Avenants', value: String(nombreAvenants) },
    { label: 'Montant Global', value: money(montantGlobal) },
    { label: 'Cumul Visé', value: money(cumulOPVise) },
    { label: 'Reste à Payer', value: money(resteAPayer) },
    { label: 'Taux Exécution', value: `${tauxExecutionFinancier.toFixed(1)}%` }
  ];

  const cells = columns.map(col =>
    el('div', {
      className: 'compact-financial-cell',
      style: `
        flex: 1;
        padding: 12px;
        background-color: #A8D08D;
        border: 1px solid #91C46F;
        text-align: center;
      `
    }, [
      el('div', { style: 'font-size: 11px; color: #4A5F3A; margin-bottom: 4px;' }, col.label),
      el('div', { style: 'font-size: 14px; font-weight: bold; color: #2D3A1F;' }, col.value)
    ])
  );

  return el('div', {
    className: 'compact-financial-table',
    style: 'display: flex; gap: 2px; margin: 16px 0;'
  }, cells);
}

export default { financialSummaryTable, compactFinancialTable };
