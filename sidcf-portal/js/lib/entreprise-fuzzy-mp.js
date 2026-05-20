/* ============================================
   Marché+ — Lib de comparaison fuzzy de raisons sociales
   ============================================
   Modif #43 — Utilitaires pour :
   - normaliser une chaîne (raison sociale) → comparaison stable
   - calculer une similarité ∈ [0, 1] entre deux raisons sociales
   - trouver les doublons probables dans une liste d'entreprises

   Pas de dépendance externe. Algorithme : Levenshtein simplifié sur
   chaînes normalisées. Suffisant pour notre volume (≤ qq milliers
   d'entreprises) et pour de la détection « à la saisie ».
   ============================================ */

/**
 * Normalise une chaîne : minuscules, sans accents, sans ponctuation,
 * espaces multiples réduits à un seul, sans préfixes/suffixes commerciaux
 * fréquents qui parasitent la comparaison (SARL, SA, SAS, Cie, …).
 */
export function normalizeRaisonSociale(str) {
  if (!str || typeof str !== 'string') return '';
  const base = str
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // retire les accents (diacritiques combinants U+0300..U+036F)
    .replace(/[.,;:!?'"()\/\\&\-]/g, ' ')               // ponctuation → espace
    .replace(/\s+/g, ' ')
    .trim();
  // Retire les formes juridiques fréquentes (n'impacte que la comparaison fuzzy)
  return base.replace(/\b(sarl|sas|sasu|eurl|sci|scp|scop|cgi|gie|snc|ets|sa|cie)\b/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Distance de Levenshtein entre deux chaînes (déjà normalisées idéalement).
 * O(n × m). On n'optimise pas — nos chaînes sont courtes.
 */
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Similarité entre 2 raisons sociales ∈ [0, 1].
 * 1 = identique après normalisation, 0 = totalement différent.
 */
export function similarity(a, b) {
  const na = normalizeRaisonSociale(a);
  const nb = normalizeRaisonSociale(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(na, nb);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Cherche dans une liste d'entreprises celles qui ressemblent à un nom donné.
 * Retourne la liste triée par similarité décroissante, filtrée par seuil.
 *
 * @param {string} raisonSociale - Saisie à matcher
 * @param {Array<{id, ncc, raisonSociale, ...}>} entreprises
 * @param {number} [threshold=0.85] - Seuil minimum
 * @returns {Array<{entreprise, score}>}
 */
export function findSimilarEntreprises(raisonSociale, entreprises, threshold = 0.85) {
  if (!raisonSociale || !Array.isArray(entreprises)) return [];
  return entreprises
    .map(e => ({ entreprise: e, score: similarity(raisonSociale, e.raisonSociale) }))
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score);
}

/**
 * Recherche typeahead : matche par NCC (prefix) ou par raison sociale (substring + fuzzy).
 * Retourne au plus N résultats triés (exact NCC d'abord, puis fuzzy raison sociale).
 */
export function searchEntreprises(query, entreprises, maxResults = 10) {
  if (!query || query.length < 2) return [];
  const q = query.trim();
  const qLower = q.toLowerCase();
  const qNorm = normalizeRaisonSociale(q);

  const scored = [];
  for (const e of entreprises || []) {
    const ncc = (e.ncc || '').toLowerCase();
    const rs = (e.raisonSociale || '').toLowerCase();
    const rsNorm = normalizeRaisonSociale(e.raisonSociale || '');

    // Match exact NCC (prefix) : score le plus haut
    if (ncc && ncc.startsWith(qLower)) {
      scored.push({ entreprise: e, score: 1.0, matchType: 'ncc' });
      continue;
    }
    // Substring sur raison sociale (rapide, fréquent)
    if (rs.includes(qLower) || rsNorm.includes(qNorm)) {
      scored.push({ entreprise: e, score: 0.9, matchType: 'name-substring' });
      continue;
    }
    // Fuzzy raison sociale (utile pour fautes de frappe, accents)
    const sim = similarity(q, e.raisonSociale || '');
    if (sim >= 0.6) {
      scored.push({ entreprise: e, score: sim, matchType: 'name-fuzzy' });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(s => s.entreprise);
}
