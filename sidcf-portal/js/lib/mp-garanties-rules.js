/**
 * Marché+ — Validation des taux de garanties selon le Code des Marchés Publics CI.
 *
 * Source légale : Ordonnance n°2019-679 du 24 juillet 2019 portant Code des marchés
 * publics (vérifiée sur le texte officiel — voir observations EHOUMAN du 14/06/2026).
 *
 *   - Garantie d'offre / soumission    : 1 % – 1,5 % du montant prévisionnel  (Art. 95.2)
 *   - Garantie de bonne exécution      : 3 % – 5 % du montant du marché       (Art. 97.3) — ne concerne pas les PI (Art. 97.1)
 *   - Retenue de garantie              : 3 % – 5 % de chaque paiement         (Art. 98)   — ne concerne pas les PI
 *   - Avance de démarrage              : ≤ 15 % forfaitaire (Art. 129) · ≤ 30 % en cumul forfaitaire + facultative (Art. 131)
 *   - Garantie de restitution d'avance : 100 % du montant de l'avance         (Art. 100)
 *   - Cautionnement                    : pas de borne légale standard (selon CCAP)
 *
 * NB : l'avance n'a pas de minimum légal (le titulaire peut y renoncer) — seule la
 * borne haute s'applique. La garantie de RESTITUTION, elle, couvre la totalité (100 %)
 * de l'avance versée : à ne pas confondre avec le montant de l'avance lui-même.
 */

const REGLES = {
  // contrainteLabel : libellé du badge « 📐 » quand la plage simple ne suffit pas.
  soumission:        { tauxMin: 1,    tauxMax: 1.5,  label: 'Garantie d\'offre / soumission', strict: true,  reference: 'Art. 95.2' },
  bonneExec:         { tauxMin: 3,    tauxMax: 5,    label: 'Garantie de bonne exécution',    strict: true,  exclutPI: true, reference: 'Art. 97.3' },
  retenue:           { tauxMin: 3,    tauxMax: 5,    label: 'Retenue de garantie',            strict: true,  exclutPI: true, reference: 'Art. 98' },
  avance:            { tauxMin: null, tauxMax: 30,   label: 'Avance de démarrage',            strict: true,  reference: 'Art. 129-131', contrainteLabel: '≤ 15 % forfaitaire · ≤ 30 % cumulé' },
  restitutionAvance: { tauxMin: 100,  tauxMax: 100,  label: 'Garantie de restitution d\'avance', strict: true, reference: 'Art. 100' },
  cautionnement:     { tauxMin: null, tauxMax: null, label: 'Cautionnement',                  strict: false }
};

/**
 * Valide le taux d'une garantie.
 * @param {string} type - 'soumission' | 'bonneExec' | 'retenue' | 'avance' | 'restitutionAvance' | 'cautionnement'
 * @param {number} taux - en pourcentage (ex: 12.5)
 * @returns {{ok:boolean, severity:'ok'|'warning', message:string, tauxMin?:number, tauxMax?:number}}
 */
export function validateTaux(type, taux) {
  const r = REGLES[type];
  if (!r) return { ok: true, severity: 'ok', message: '' };

  // Cautionnement : pas de borne légale, juste informatif
  if (r.tauxMin == null && r.tauxMax == null) {
    return { ok: true, severity: 'ok', message: 'Pas de borne légale — selon CCAP', tauxMin: null, tauxMax: null };
  }

  const t = Number(taux) || 0;

  // Plafond seul (avance : pas de minimum légal, borne haute uniquement)
  if (r.tauxMin == null && r.tauxMax != null) {
    if (t > r.tauxMax) {
      return { ok: false, severity: 'warning', message: `⚠️ Taux ${t.toFixed(2)}% supérieur au plafond légal (${r.tauxMax}%)`, tauxMin: null, tauxMax: r.tauxMax };
    }
    return { ok: true, severity: 'ok', message: `Conforme (plafond légal ${r.tauxMax}%)`, tauxMin: null, tauxMax: r.tauxMax };
  }

  // Taux fixe (ex : restitution d'avance = 100 %)
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

  // Plage [min, max]
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
  if (r.contrainteLabel) return r.contrainteLabel;
  if (r.tauxMin == null && r.tauxMax == null) return 'Selon CCAP';
  if (r.tauxMin == null && r.tauxMax != null) return `Plafond légal ${r.tauxMax}%`;
  if (r.tauxMin === r.tauxMax) return `Taux fixe ${r.tauxMin}%`;
  return `Plage légale ${r.tauxMin}% – ${r.tauxMax}%`;
}

export default { validateTaux, getReglesGarantie, getLabelContraintes };
