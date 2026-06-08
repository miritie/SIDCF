/* ============================================
   Helpers pour la gestion per-lot des entités aval
   (Marché+ multi-lot — modif #13)
   ============================================
   Convention : chaque entité aval (MP_ATTRIBUTION, MP_VISA_CF, etc.)
   peut porter un champ optionnel `parLot` : un map { [lotId]: { ... } }
   contenant les données spécifiques à un lot. Pour les opérations à 1 lot
   (ou les données héritées avant cette modif), on lit/écrit aux champs
   racine de l'entité — back-compat assurée.
*/

/**
 * Lit les données spécifiques d'un lot dans une entité.
 *
 * - Si `entity.parLot[lotId]` existe → renvoie un *merge* { ...racine, ...parLot[lotId] }
 *   (le lot écrase les champs racine ; ainsi un screen peut montrer
 *    les valeurs root par défaut tant que le lot n'a pas été saisi).
 * - Sinon → renvoie l'entité telle quelle (legacy / single-lot).
 *
 * @param {Object|null} entity
 * @param {string|null} lotId
 * @returns {Object} merged view
 */
export function getLotData(entity, lotId) {
  if (!entity) return {};
  if (!lotId) return entity;
  const lotPart = entity.parLot && entity.parLot[lotId];
  if (!lotPart) return entity;
  return { ...entity, ...lotPart };
}

/**
 * Met à jour les données spécifiques d'un lot dans un *patch* (objet
 * destiné à être passé à dataService.update). Renvoie un nouveau patch
 * où les `fields` sont placés sous `parLot[lotId]` au lieu de la racine.
 *
 * Si lotId est null/undefined → renvoie `fields` tel quel (pas de
 * réécriture, les champs vont à la racine — comportement single-lot).
 *
 * @param {string|null} lotId
 * @param {Object} fields
 * @param {Object} [existingEntity] - entité existante en base, pour
 *   préserver les autres lots dans le patch
 * @returns {Object} patch prêt à être envoyé en update
 */
export function buildLotPatch(lotId, fields, existingEntity = null) {
  if (!lotId) return { ...fields };
  const existingParLot = (existingEntity && existingEntity.parLot) || {};
  return {
    parLot: {
      ...existingParLot,
      [lotId]: {
        ...((existingParLot[lotId]) || {}),
        ...fields
      }
    }
  };
}

/**
 * Récupère la liste des lots d'une opération depuis sa procédure.
 * Renvoie [] si la procédure n'a pas de lots (= mono-lot implicite).
 *
 * @param {Object|null} procedure
 * @returns {Array<{id, numero, libelle, ...}>}
 */
export function getLotsFromProcedure(procedure) {
  if (!procedure) return [];
  return Array.isArray(procedure.lots) ? procedure.lots : [];
}

/**
 * Détermine le lotId courant en fonction des params de route et des lots
 * disponibles. Renvoie le 1er lot par défaut si rien n'est précisé.
 *
 * @param {Array} lots
 * @param {Object} params - params de route (peut contenir `lotId`)
 * @returns {string|null}
 */
export function resolveCurrentLotId(lots, params = {}) {
  if (!Array.isArray(lots) || lots.length === 0) return null;
  if (params.lotId && lots.some(l => l.id === params.lotId)) return params.lotId;
  return lots[0]?.id || null;
}

/**
 * Modif #150 — Libellé d'affichage d'un lot, préfixé « LOT n : xxx »
 * (convention client, CR contractualisation). En allotissement unique
 * (ou sans numéro), on garde le libellé seul.
 *
 * @param {Object|null} lot
 * @param {Object} [opts]
 * @param {string} [opts.allotissement] - 'UNIQUE' | 'MULTIPLES'
 * @returns {string}
 */
export function formatLotLabel(lot, opts = {}) {
  if (!lot) return '';
  const lib = lot.libelle || lot.objet || '(sans libellé)';
  if (opts.allotissement === 'UNIQUE' || !lot.numero) return lib;
  return `LOT ${lot.numero} : ${lib}`;
}
