/* ============================================
   Libellés de montant contextuels par phase (Marché+)
   ============================================
   Le même chiffre porte un libellé différent selon l'étape du cycle de
   vie du marché. Ce helper centralise la règle pour éviter la
   divergence entre écrans.

   Phases :
   - PPM            : « Montant prévisionnel »
   - PROCEDURE      : « Montant prévisionnel » (encore au stade de programmation)
   - ATTRIBUTION    : « Montant du marché de base » (suite à l'attribution)
   - AVENANT_INPUT  : « Montant de l'avenant » (saisie d'un avenant en cours)
   - AVENANT_TOTAL  : « Montant total du marché » (cumul après avenants)
*/

const LABELS = {
  PPM: 'Montant prévisionnel',
  PROCEDURE: 'Montant prévisionnel',
  ATTRIBUTION: 'Montant du marché de base',
  AVENANT_INPUT: 'Montant de l\'avenant',
  AVENANT_TOTAL: 'Montant total du marché'
};

/**
 * @param {('PPM'|'PROCEDURE'|'ATTRIBUTION'|'AVENANT_INPUT'|'AVENANT_TOTAL')} phase
 * @param {Object} [options]
 * @param {('HT'|'TTC')} [options.precision]  Suffixe (HT) ou (TTC) si précision utile
 * @param {boolean}     [options.withDevise]  Ajoute " (XOF)" en fin de libellé
 * @returns {string}
 */
export function getMontantLabel(phase, options = {}) {
  let label = LABELS[phase] || 'Montant';
  if (options.precision) label += ` (${options.precision})`;
  if (options.withDevise) label += ' (XOF)';
  return label;
}

/**
 * Variante courte (pour KPI / colonnes étroites) — abrège « Montant du marché
 * de base » en « Marché de base », « Montant total du marché » en « Total marché ».
 */
export function getMontantLabelShort(phase) {
  const shortMap = {
    PPM: 'Prévisionnel',
    PROCEDURE: 'Prévisionnel',
    ATTRIBUTION: 'Marché de base',
    AVENANT_INPUT: 'Avenant',
    AVENANT_TOTAL: 'Total marché'
  };
  return shortMap[phase] || 'Montant';
}

export default { getMontantLabel, getMontantLabelShort };
