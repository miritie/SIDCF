/* ============================================
   Phase Helper - Configuration dynamique des étapes
   ============================================
   Charge la configuration des étapes depuis la BD
   ou utilise la configuration par défaut
   ============================================ */

import logger from './logger.js';
import dataService from '../datastore/data-service.js';

// URL de l'API - récupère depuis la config app-config.json
function getApiBaseUrl() {
  const config = dataService.getConfig();
  if (config?.postgres?.apiUrl) {
    return config.postgres.apiUrl;
  }
  // Fallback pour dev local
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8787';
  }
  return 'https://sidcf-portal-api.sidcf.workers.dev';
}

// Note: getApiBaseUrl() is called dynamically each time to ensure dataService is initialized

// Cache pour les configurations chargées
let phaseConfigCache = {};
let allPhasesCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Configuration par défaut (fallback si BD non disponible)
const DEFAULT_PHASE_CONFIG = {
  'PSD': [
    { code: 'PLANIF', titre: 'Planification', sous_titre: 'Inscription au PPM', icon: '📋', color: 'blue', order: 1 },
    { code: 'PROCEDURE', titre: 'Contractualisation', sous_titre: 'Sélection directe du prestataire', icon: '📝', color: 'orange', order: 2 },
    { code: 'ATTRIBUTION', titre: 'Enregistrement de marché', sous_titre: 'Bon de commande & Facture', icon: '✅', color: 'green', order: 3 },
    { code: 'EXECUTION', titre: 'Exécution', sous_titre: 'Ordre de service & Suivi', icon: '⚙️', color: 'purple', order: 4 },
    { code: 'CLOTURE', titre: 'Clôture', sous_titre: 'Réceptions provisoire & définitive', icon: '🏁', color: 'gray', order: 5 }
  ],
  'PSC': [
    { code: 'PLANIF', titre: 'Planification', sous_titre: 'Inscription au PPM', icon: '📋', color: 'blue', order: 1 },
    { code: 'PROCEDURE', titre: 'Contractualisation', sous_titre: 'Demande de cotation (3 fournisseurs)', icon: '📝', color: 'orange', order: 2 },
    { code: 'ATTRIBUTION', titre: 'Enregistrement de marché', sous_titre: 'Sélection & Attribution', icon: '✅', color: 'green', order: 3 },
    { code: 'EXECUTION', titre: 'Exécution', sous_titre: 'OS & Suivi des travaux', icon: '⚙️', color: 'purple', order: 4 },
    { code: 'CLOTURE', titre: 'Clôture', sous_titre: 'Réceptions & PV', icon: '🏁', color: 'gray', order: 5 }
  ],
  'PSL': [
    { code: 'PLANIF', titre: 'Planification', sous_titre: 'Inscription au PPM', icon: '📋', color: 'blue', order: 1 },
    { code: 'PROCEDURE', titre: 'Contractualisation', sous_titre: 'Validation DGMP & Commission COJO', icon: '📝', color: 'orange', order: 2 },
    { code: 'ATTRIBUTION', titre: 'Enregistrement de marché', sous_titre: 'Attributaire & garanties', icon: '✅', color: 'green', order: 3 },
    { code: 'VISA_CF', titre: 'Approbation', sous_titre: 'Organe approbateur', icon: '🔍', color: 'yellow', order: 4 },
    { code: 'EXECUTION', titre: 'Exécution', sous_titre: 'OS & Avenants', icon: '⚙️', color: 'purple', order: 5 },
    { code: 'CLOTURE', titre: 'Clôture', sous_titre: 'Réceptions & Clôture', icon: '🏁', color: 'gray', order: 6 }
  ],
  'PSO': [
    { code: 'PLANIF', titre: 'Planification', sous_titre: 'Inscription au PPM', icon: '📋', color: 'blue', order: 1 },
    { code: 'PROCEDURE', titre: 'Contractualisation', sous_titre: 'Validation DGMP & Commission COJO', icon: '📝', color: 'orange', order: 2 },
    { code: 'ATTRIBUTION', titre: 'Enregistrement de marché', sous_titre: 'Attributaire & garanties', icon: '✅', color: 'green', order: 3 },
    { code: 'VISA_CF', titre: 'Approbation', sous_titre: 'Organe approbateur', icon: '🔍', color: 'yellow', order: 4 },
    { code: 'EXECUTION', titre: 'Exécution', sous_titre: 'OS & Avenants', icon: '⚙️', color: 'purple', order: 5 },
    { code: 'CLOTURE', titre: 'Clôture', sous_titre: 'Réceptions & Clôture', icon: '🏁', color: 'gray', order: 6 }
  ],
  'AOO': [
    { code: 'PLANIF', titre: 'Planification', sous_titre: 'Inscription au PPM', icon: '📋', color: 'blue', order: 1 },
    { code: 'PROCEDURE', titre: 'Contractualisation', sous_titre: 'DAO validé DGMP & Commission COJO', icon: '📝', color: 'orange', order: 2 },
    { code: 'ATTRIBUTION', titre: 'Enregistrement de marché', sous_titre: 'Attributaire & garanties', icon: '✅', color: 'green', order: 3 },
    { code: 'VISA_CF', titre: 'Approbation', sous_titre: 'Organe approbateur', icon: '🔍', color: 'yellow', order: 4 },
    { code: 'EXECUTION', titre: 'Exécution', sous_titre: 'OS & Suivi', icon: '⚙️', color: 'purple', order: 5 },
    { code: 'CLOTURE', titre: 'Clôture', sous_titre: 'Réceptions & Clôture', icon: '🏁', color: 'gray', order: 6 }
  ],
  'PI': [
    { code: 'PLANIF', titre: 'Planification', sous_titre: 'Inscription au PPM', icon: '📋', color: 'blue', order: 1 },
    { code: 'PROCEDURE', titre: 'Contractualisation', sous_titre: 'AMI/DP & Sélection technique', icon: '📝', color: 'orange', order: 2 },
    { code: 'ATTRIBUTION', titre: 'Enregistrement de marché', sous_titre: 'Contrat de prestation', icon: '✅', color: 'green', order: 3 },
    { code: 'VISA_CF', titre: 'Approbation', sous_titre: 'Organe approbateur', icon: '🔍', color: 'yellow', order: 4 },
    { code: 'EXECUTION', titre: 'Exécution', sous_titre: 'Ordre de service & Suivi', icon: '⚙️', color: 'purple', order: 5 },
    { code: 'CLOTURE', titre: 'Clôture', sous_titre: 'Réception des livrables', icon: '🏁', color: 'gray', order: 6 }
  ]
};

let cachedPhaseConfig = null;

/**
 * Fetch phases from API
 * @param {string} modePassation - PSD, PSC, PSL, PSO, AOO, PI
 * @returns {Promise<Array>} Array of phase objects
 */
async function fetchPhasesFromAPI(modePassation) {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/config/phases/${modePassation}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const phases = await response.json();

    // Mapper les noms de colonnes API vers le format attendu
    // Marché+ : si l'API renvoie le code VISA_CF avec un libellé hérité (« Engagement »,
    // « Visa CF »…), on force « Approbation » côté UI Marché+.
    return phases.map(p => {
      const isApprobation = p.phaseCode === 'VISA_CF';
      // Modif #92 — CR 6.c : l'étape ATTRIBUTION s'affiche « Enregistrement de
      // marché » quel que soit le libellé stocké en base (même logique que
      // VISA_CF → « Approbation »).
      const isEnregistrement = p.phaseCode === 'ATTRIBUTION';
      // Modif #95 — la phase PROCEDURE s'affiche « Contractualisation » quel que
      // soit le libellé stocké en base (cohérence avec le bandeau/titre/badge).
      const isContractualisation = p.phaseCode === 'PROCEDURE';
      return {
        code: p.phaseCode,
        titre: isApprobation ? 'Approbation'
             : (isEnregistrement ? 'Enregistrement de marché'
             : (isContractualisation ? 'Contractualisation' : p.titre)),
        sous_titre: isApprobation ? 'Organe approbateur' : (isEnregistrement ? 'Attributaire & garanties' : p.sousTitre),
        icon: p.icon,
        color: p.color,
        order: p.phaseOrder,
        isRequired: p.isRequired,
        isActive: p.isActive,
        id: p.id
      };
    });
  } catch (error) {
    logger.warn(`[PhaseHelper] Erreur API pour ${modePassation}:`, error.message);
    return null;
  }
}

/**
 * Get phases for a specific procedure type
 * @param {string} modePassation - PSD, PSC, PSL, PSO, AOO, PI
 * @returns {Array} Array of phase objects
 */
export function getPhases(modePassation) {
  if (!modePassation) {
    logger.warn('[PhaseHelper] Mode de passation non fourni');
    return [];
  }

  // Vérifier le cache
  const now = Date.now();
  if (phaseConfigCache[modePassation] && (now - cacheTimestamp) < CACHE_TTL) {
    return phaseConfigCache[modePassation];
  }

  // Utiliser la configuration par défaut en synchrone
  // La version async chargera depuis l'API
  const phases = DEFAULT_PHASE_CONFIG[modePassation] || [];

  logger.info(`[PhaseHelper] Phases (fallback) pour ${modePassation}:`, phases.length);
  return phases.sort((a, b) => a.order - b.order);
}

/**
 * Get phases asynchronously (from API)
 * @param {string} modePassation - PSD, PSC, PSL, PSO, AOO, PI
 * @returns {Promise<Array>} Array of phase objects
 */
export async function getPhasesAsync(modePassation) {
  if (!modePassation) {
    logger.warn('[PhaseHelper] Mode de passation non fourni');
    return [];
  }

  // Vérifier le cache
  const now = Date.now();
  if (phaseConfigCache[modePassation] && (now - cacheTimestamp) < CACHE_TTL) {
    return phaseConfigCache[modePassation];
  }

  // Charger depuis l'API
  const apiPhases = await fetchPhasesFromAPI(modePassation);

  if (apiPhases && apiPhases.length > 0) {
    phaseConfigCache[modePassation] = apiPhases.sort((a, b) => a.order - b.order);
    cacheTimestamp = now;
    logger.info(`[PhaseHelper] Phases API chargées pour ${modePassation}:`, apiPhases.length);
    return phaseConfigCache[modePassation];
  }

  // Fallback sur la configuration par défaut
  const phases = DEFAULT_PHASE_CONFIG[modePassation] || [];
  logger.info(`[PhaseHelper] Phases fallback pour ${modePassation}:`, phases.length);
  return phases.sort((a, b) => a.order - b.order);
}

/**
 * Get all phase configurations
 * @returns {Object} Configuration object with all modes
 */
export function getAllPhaseConfigs() {
  if (cachedPhaseConfig) {
    return cachedPhaseConfig;
  }

  cachedPhaseConfig = DEFAULT_PHASE_CONFIG;
  return cachedPhaseConfig;
}

/**
 * Get all phase configurations asynchronously (from API)
 * @returns {Promise<Object>} Configuration object with all modes
 */
export async function getAllPhaseConfigsAsync() {
  const now = Date.now();
  if (allPhasesCache && (now - cacheTimestamp) < CACHE_TTL) {
    return allPhasesCache;
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/config/phases`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const phases = await response.json();

    // Grouper par mode de passation
    const grouped = {};
    phases.forEach(p => {
      const mode = p.modePassation;
      if (!grouped[mode]) {
        grouped[mode] = [];
      }
      grouped[mode].push({
        code: p.phaseCode,
        titre: p.titre,
        sous_titre: p.sousTitre,
        icon: p.icon,
        color: p.color,
        order: p.phaseOrder,
        isRequired: p.isRequired,
        isActive: p.isActive,
        id: p.id
      });
    });

    // Trier chaque groupe par ordre
    Object.keys(grouped).forEach(mode => {
      grouped[mode].sort((a, b) => a.order - b.order);
    });

    allPhasesCache = grouped;
    cacheTimestamp = now;
    logger.info('[PhaseHelper] Toutes les phases chargées depuis API');
    return allPhasesCache;
  } catch (error) {
    logger.warn('[PhaseHelper] Erreur chargement phases API:', error.message);
    return DEFAULT_PHASE_CONFIG;
  }
}

/**
 * Get a specific phase config
 * @param {string} modePassation - Mode de passation
 * @param {string} phaseCode - Code de la phase
 * @returns {Object|null} Phase configuration
 */
export function getPhase(modePassation, phaseCode) {
  const phases = getPhases(modePassation);
  return phases.find(p => p.code === phaseCode) || null;
}

/**
 * Get phase index (for progress indicators)
 * @param {string} modePassation - Mode de passation
 * @param {string} phaseCode - Code de la phase
 * @returns {number} Index of the phase (0-based)
 */
export function getPhaseIndex(modePassation, phaseCode) {
  const phases = getPhases(modePassation);
  return phases.findIndex(p => p.code === phaseCode);
}

/**
 * Get total number of phases for a procedure
 * @param {string} modePassation - Mode de passation
 * @returns {number} Total number of phases
 */
export function getPhaseCount(modePassation) {
  return getPhases(modePassation).length;
}

/**
 * Check if a phase exists for a procedure
 * @param {string} modePassation - Mode de passation
 * @param {string} phaseCode - Code de la phase
 * @returns {boolean} True if phase exists
 */
export function hasPhase(modePassation, phaseCode) {
  return getPhase(modePassation, phaseCode) !== null;
}

/**
 * Get phase color class
 * @param {string} color - Color name (blue, green, orange, etc.)
 * @returns {string} CSS class name
 */
export function getPhaseColorClass(color) {
  const colorMap = {
    'blue': 'bg-blue-500',
    'green': 'bg-green-500',
    'orange': 'bg-orange-500',
    'yellow': 'bg-yellow-500',
    'purple': 'bg-purple-500',
    'gray': 'bg-gray-500',
    'red': 'bg-red-500'
  };
  return colorMap[color] || 'bg-gray-500';
}

/**
 * Clear cached configuration (useful after updates)
 */
export function clearCache() {
  cachedPhaseConfig = null;
  logger.info('[PhaseHelper] Cache cleared');
}

export default {
  getPhases,
  getPhasesAsync,
  getAllPhaseConfigs,
  getAllPhaseConfigsAsync,
  getPhase,
  getPhaseIndex,
  getPhaseCount,
  hasPhase,
  getPhaseColorClass,
  clearCache
};
