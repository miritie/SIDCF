/**
 * Marché+ — Validation des taux de garanties selon les règles légales.
 *
 * Source : rules-config.json → garanties (Code des Marchés Publics CI).
 *
 *   - Garantie d'avance       : 10 - 15 %
 *   - Garantie bonne exécution: 5  - 10 %
 *   - Retenue de garantie     : 10 % (taux fixe)
 *   - Cautionnement           : pas de borne légale (selon CCAP)
 */

const REGLES = {
  avance: { tauxMin: 10, tauxMax: 15, label: 'Garantie d\'avance', strict: true },
  bonneExec: { tauxMin: 5, tauxMax: 10, label: 'Garantie de bonne exécution', strict: true },
  retenue: { tauxMin: 10, tauxMax: 10, label: 'Retenue de garantie', strict: true },
  cautionnement: { tauxMin: null, tauxMax: null, label: 'Cautionnement', strict: false }
};

/**
 * Valide le taux d'une garantie.
 * @param {string} type - 'avance' | 'bonneExec' | 'retenue' | 'cautionnement'
 * @param {number} taux - en pourcentage (ex: 12.5)
 * @returns {{ok:boolean, severity:'ok'|'warning', message:string, tauxMin?:number, tauxMax?:number}}
 */
export function validateTaux(type, taux) {
  const r = REGLES[type];
  if (!r) return { ok: true, severity: 'ok', message: '' };

  // Cautionnement : pas de validation, juste informatif
  if (r.tauxMin == null && r.tauxMax == null) {
    return { ok: true, severity: 'ok', message: 'Pas de borne légale — selon CCAP', tauxMin: null, tauxMax: null };
  }

  const t = Number(taux) || 0;
  // Taux fixe (retenue de 10% pile)
  if (r.tauxMin === r.tauxMax) {
    if (t === r.tauxMin) {
      return { ok: true, severity: 'ok', message: `Conforme (${r.tauxMin}% — taux fixe)`, tauxMin: r.tauxMin, tauxMax: r.tauxMax };
    }
    return {
      ok: false,
      severity: 'warning',
      message: `⚠️ Le taux légal est fixé à ${r.tauxMin}% — saisi : ${t.toFixed(2)}%`,
      tauxMin: r.tauxMin,
      tauxMax: r.tauxMax
    };
  }

  // Plage
  if (t < r.tauxMin) {
    return {
      ok: false,
      severity: 'warning',
      message: `⚠️ Taux ${t.toFixed(2)}% inférieur au minimum légal (${r.tauxMin}%)`,
      tauxMin: r.tauxMin,
      tauxMax: r.tauxMax
    };
  }
  if (t > r.tauxMax) {
    return {
      ok: false,
      severity: 'warning',
      message: `⚠️ Taux ${t.toFixed(2)}% supérieur au maximum légal (${r.tauxMax}%)`,
      tauxMin: r.tauxMin,
      tauxMax: r.tauxMax
    };
  }
  return {
    ok: true,
    severity: 'ok',
    message: `Conforme (plage légale ${r.tauxMin}% – ${r.tauxMax}%)`,
    tauxMin: r.tauxMin,
    tauxMax: r.tauxMax
  };
}

export function getReglesGarantie(type) {
  return REGLES[type] || null;
}

export function getLabelContraintes(type) {
  const r = REGLES[type];
  if (!r) return '';
  if (r.tauxMin == null && r.tauxMax == null) return 'Selon CCAP';
  if (r.tauxMin === r.tauxMax) return `Taux fixe ${r.tauxMin}%`;
  return `Plage légale ${r.tauxMin}% – ${r.tauxMax}%`;
}

export default { validateTaux, getReglesGarantie, getLabelContraintes };
