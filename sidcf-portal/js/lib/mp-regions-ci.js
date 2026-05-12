/**
 * Marché+ — Référentiel des régions et districts autonomes de Côte d'Ivoire.
 * 2 districts autonomes (Abidjan, Yamoussoukro) + 31 régions = 33 entrées.
 */

import logger from './logger.js';

let cache = null;

export async function loadRegions() {
  if (cache) return cache;
  try {
    const r = await fetch('/js/config/mp-regions-ci.json');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    cache = data.regions || [];
  } catch (err) {
    logger.warn('[mp-regions-ci] Échec chargement :', err.message);
    cache = [];
  }
  return cache;
}

/**
 * Renvoie les régions sous forme d'options { code, label } pour les filtres.
 * Trié : districts autonomes en premier (Abidjan, Yamoussoukro), puis régions par ordre alphabétique.
 */
export async function getRegionsOptions() {
  const all = await loadRegions();
  const districts = all.filter(r => r.type === 'DISTRICT_AUTONOME');
  const regions = all.filter(r => r.type === 'REGION').sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  return [
    ...districts.map(d => ({ code: d.code, label: '★ ' + d.label })),
    ...regions.map(r => ({ code: r.code, label: r.label }))
  ];
}

export async function getRegionByCode(code) {
  const all = await loadRegions();
  return all.find(r => r.code === code) || null;
}

export default { loadRegions, getRegionsOptions, getRegionByCode };
