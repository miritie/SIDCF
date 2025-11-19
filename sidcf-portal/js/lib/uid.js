/* ============================================
   UID Generator - Human-readable IDs
   ============================================ */

/**
 * Generate a unique ID with prefix
 * @param {string} prefix - E.g., 'PPM', 'OP', 'PROC'
 * @returns {string}
 */
export function uid(prefix = 'ID') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}

/**
 * Generate operation ID
 */
export function operationId() {
  return uid('OP');
}

/**
 * Generate PPM plan ID
 */
export function ppmPlanId() {
  return uid('PPM');
}

/**
 * Generate procedure ID
 */
export function procedureId() {
  return uid('PROC');
}

/**
 * Generate attribution ID
 */
export function attributionId() {
  return uid('ATTR');
}

/**
 * Generate avenant ID
 */
export function avenantId() {
  return uid('AVE');
}

/**
 * Generate garantie ID
 */
export function garantieId() {
  return uid('GAR');
}

/**
 * Generate recours ID
 */
export function recoursId() {
  return uid('REC');
}

/**
 * Generate echeancier ID
 */
export function echeancierId() {
  return uid('ECH');
}

/**
 * Generate cle repartition ID
 */
export function cleId() {
  return uid('CLE');
}

/**
 * Generate cloture ID
 */
export function clotureId() {
  return uid('CLO');
}

/**
 * Generate entreprise ID
 */
export function entrepriseId() {
  return uid('ENT');
}

/**
 * Generate document ID
 */
export function documentId() {
  return uid('DOC');
}

/**
 * Generate short numeric ID (for display)
 * @returns {string}
 */
export function shortId() {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}
