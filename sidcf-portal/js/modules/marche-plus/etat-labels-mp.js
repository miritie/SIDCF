/* ============================================
   Marché+ — Libellés des étapes (états d'opération)
   ============================================
   Modif #41 — Source unique de vérité pour les libellés des étapes
   du module Marché+. Surcharge le registre global `ETAT_MARCHE`
   (qui reste utilisé tel quel par le module Marché original).

   Termes validés par le client :
   - PLANIFIE  → « En Planification »
   - EN_PROC   → « En Contractualisation »
   - ATTRIBUE  → « Attribué »
   - VISE      → « Approuvé »  (étape d'approbation)
   - EN_EXEC   → « En exécution »
   - CLOS      → « Achevé »

   Les codes (PLANIFIE, EN_PROC, …) restent inchangés en base et
   dans la logique JS. Seuls les libellés d'affichage évoluent.
   ============================================ */

export const ETAT_LABEL_MP = {
  PLANIFIE:  'En Planification',
  EN_PROC:   'En Contractualisation',
  ATTRIBUE:  'Attribué',
  VISE:      'Approuvé',
  EN_EXEC:   'En exécution',
  EXECUTION: 'En exécution',  // legacy
  CLOS:      'Achevé',
  CLOTURE:   'Achevé',         // legacy
  RESILIE:   'Résilié'
};

/**
 * Renvoie le libellé Marché+ pour un code etat, avec fallback :
 * 1. Map locale ETAT_LABEL_MP
 * 2. Label du registre global ETAT_MARCHE si fourni
 * 3. Code brut
 */
export function getEtatLabelMP(code, registries) {
  if (!code) return '-';
  if (ETAT_LABEL_MP[code]) return ETAT_LABEL_MP[code];
  const fromRegistry = registries?.ETAT_MARCHE?.find(e => e.code === code);
  return fromRegistry?.label || code;
}
