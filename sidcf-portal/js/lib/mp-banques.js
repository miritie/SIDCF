/**
 * Marché+ — Référentiel des banques commerciales (Côte d'Ivoire).
 * Chargé une fois, mis en cache.
 */

import logger from './logger.js';

let cache = null;

export async function loadBanques() {
  if (cache) return cache;
  try {
    const r = await fetch('/js/config/mp-banques.json');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    cache = data.banques || [];
  } catch (err) {
    logger.warn('[mp-banques] Échec chargement :', err.message);
    cache = [];
  }
  return cache;
}

export async function getBanqueLabel(code) {
  const all = await loadBanques();
  return all.find(b => b.code === code)?.label || code;
}

export default { loadBanques, getBanqueLabel };
