/**
 * Marché+ — Référentiel des organes d'approbation
 *
 * Charge le référentiel JSON et fournit la fonction de filtrage
 * basée sur :
 *   - scope (type d'institution, depuis app-config)
 *   - montant prévisionnel du marché
 */

import dataService from '../datastore/data-service.js';
import logger from './logger.js';

let cache = null;

async function load() {
  if (cache) return cache;
  try {
    const resp = await fetch('/js/config/mp-organes-approbation.json');
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    cache = data.organes || [];
  } catch (err) {
    logger.warn('[mp-organes] Échec chargement :', err.message);
    cache = [];
  }
  return cache;
}

/**
 * Récupère le scope (type d'institution) du portail courant.
 * @returns {string} ex: 'ADMIN_CENTRALE'
 */
export function getInstitutionScope() {
  const config = dataService.getConfig?.() || {};
  return config?.institution?.type || 'ADMIN_CENTRALE';
}

/**
 * Filtre la liste des organes selon le scope (type d'institution) et le montant du marché.
 *
 * - Scope match : organes dont scope === scopeDemandé (ou scope === '*' = AUTRE)
 * - Seuil match : montant ∈ [seuilMin, seuilMax] (null = pas de borne)
 *
 * Si rien ne matche les deux conditions, on relâche le filtre montant
 * et on retourne tous les organes du même scope (+ AUTRE).
 *
 * @param {Object} options
 * @param {string} [options.scope]         Scope ; défaut = institution courante
 * @param {number} [options.montant=0]     Montant prévisionnel en FCFA
 * @returns {Promise<Array>} Liste filtrée d'organes
 */
export async function getOrganesApplicables({ scope, montant = 0 } = {}) {
  const all = await load();
  const targetScope = scope || getInstitutionScope();

  const matchScope = (o) => o.scope === targetScope || o.scope === '*';
  const matchSeuil = (o) => {
    const minOK = o.seuilMin == null || montant >= o.seuilMin;
    const maxOK = o.seuilMax == null || montant <= o.seuilMax;
    return minOK && maxOK;
  };

  // Si le montant n'est pas connu (= 0), on ne peut pas filtrer par seuil
  // → on retourne tous les organes du scope (informatif).
  if (!montant || montant <= 0) {
    return all.filter(matchScope);
  }

  const strict = all.filter(o => matchScope(o) && matchSeuil(o));

  // Cas dégradé : seul AUTRE matche (montant hors plages connues du scope —
  // typiquement marché sous le seuil légal). On élargit en gardant tous les
  // organes du scope pour permettre un choix indicatif.
  const onlyAutre = strict.length === 1 && strict[0].scope === '*';
  if (strict.length > 1 && !onlyAutre) return strict;

  // Fallback : tous les organes du scope (sans filtre seuil)
  return all.filter(matchScope);
}

/**
 * Récupère un organe par son code.
 * @param {string} code
 */
export async function getOrganeByCode(code) {
  const all = await load();
  return all.find(o => o.code === code) || null;
}

/**
 * Récupère tous les organes (sans filtre).
 */
export async function getAllOrganes() {
  return await load();
}

export default { getOrganesApplicables, getOrganeByCode, getAllOrganes, getInstitutionScope };
