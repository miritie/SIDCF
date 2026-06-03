/* ============================================
   Steps Widget - Timeline de progression
   ============================================ */

import { el } from '../../lib/dom.js';
import router from '../../router.js';
// Modif #56 — utiliser le helper Marché+ qui force le libellé « Approbation »
// pour le code VISA_CF (au lieu de « Engagement » ou « Visa CF ») afin d'unifier
// avec les boutons « SUIVI DU PROCESSUS » de la fiche de vie.
import { getPhases, getPhasesAsync, hasPhase } from '../../lib/phase-helper-mp.js';

/**
 * DEPRECATED: Configuration statique remplacée par phase-helper.js
 * Conservée pour compatibilité arrière
 */
export const LIFECYCLE_STEPS = [
  {
    code: 'PLANIF',
    label: 'Planification',
    icon: '📋',
    route: '/mp/ppm-list',
    description: 'Inscription au PPM'
  },
  {
    code: 'PROCEDURE',
    label: 'Contractualisation',
    icon: '📝',
    route: '/mp/procedure',
    description: 'Passation & PV'
  },
  {
    code: 'ATTRIBUTION',
    label: 'Enregistrement de marché',
    icon: '✅',
    route: '/mp/attribution',
    description: 'Attributaire & garanties'
  },
  {
    code: 'VISA_CF',
    label: 'Visa CF',
    icon: '🔍',
    route: '/mp/visa-cf',
    description: 'Contrôle financier'
  },
  {
    code: 'EXECUTION',
    label: 'Exécution',
    icon: '⚙️',
    route: '/mp/execution',
    description: 'OS & suivi'
  },
  {
    code: 'AVENANTS',
    label: 'Avenants',
    icon: '🔖',
    route: '/mp/avenants',
    description: 'Modifications contractuelles'
  },
  {
    code: 'CLOTURE',
    label: 'Clôture',
    icon: '🏁',
    route: '/mp/cloture',
    description: 'Réceptions & clôture'
  }
];

/**
 * Get lifecycle steps for a specific procedure
 * @param {string} modePassation - Mode de passation (PSD, PSC, etc.)
 * @returns {Array} Steps configuration
 */
export function getLifecycleSteps(modePassation) {
  if (!modePassation) {
    return LIFECYCLE_STEPS; // Fallback
  }

  // Charger depuis la configuration
  const phases = getPhases(modePassation);

  // Mapper vers le format Steps
  return phases.map(phase => ({
    code: phase.code,
    label: phase.titre,
    icon: phase.icon,
    route: `/mp/${phase.code.toLowerCase()}`,
    description: phase.sous_titre,
    color: phase.color
  }));
}

/**
 * Calculer le status de chaque étape en fonction des données
 * @param {Object} fullData - Données complètes de l'opération
 * @returns {Array} Status de chaque étape
 */
export function calculateStepStatuses(fullData) {
  const { operation, procedure, attribution, visasCF, ordresService, avenants, cloture } = fullData;
  const etat = operation?.etat || 'PLANIFIE';

  // Helper local pour vérifier si une attribution est complète
  const isAttrComplete = (attr) => {
    if (!attr) return false;
    // Nouvelle structure JSONB
    const hasAttributaire = attr.attributaire?.nom || attr.attributaire?.entrepriseId;
    const hasMontant = attr.montants?.attribue > 0 || attr.montants?.ttc > 0;
    if (hasAttributaire && hasMontant) return true;
    // Ancienne structure
    if (attr.titulaire && attr.montantAttribue > 0) return true;
    return false;
  };

  // Helper local pour vérifier si un visa CF est valide
  const hasValidVisaCF = (visas) => {
    if (!visas || visas.length === 0) return false;
    return visas.some(v => ['VISA', 'FAVORABLE', 'VISE', 'VISE_RESERVE'].includes(v.decision));
  };

  return LIFECYCLE_STEPS.map((step) => {
    const code = step.code;

    // Détection basée sur l'état du marché et les données présentes
    switch (code) {
      case 'PLANIF':
        // Toujours done si on a une opération
        return operation ? 'done' : 'current';

      case 'PROC':
        // Done si procédure complète (décision d'attribution)
        if (procedure && procedure.decisionAttributionRef) {
          return 'done';
        }
        // Current si procédure commencée ou état EN_PROC
        if (procedure || etat === 'EN_PROC') {
          return 'current';
        }
        // Current si étape précédente done et celle-ci pas encore
        if (operation) {
          return 'current';
        }
        return 'todo';

      case 'ATTR':
        // Done si attribution complète avec montants et titulaire
        if (isAttrComplete(attribution)) {
          return 'done';
        }
        // Current si attribution commencée ou état ATTRIBUE
        if (attribution || etat === 'ATTRIBUE') {
          return 'current';
        }
        // Current si procédure complète
        if (procedure && procedure.decisionAttributionRef) {
          return 'current';
        }
        return 'todo';

      case 'VISE':
        // Done si visa CF obtenu
        if (hasValidVisaCF(visasCF)) {
          return 'done';
        }
        // Current si en attente de visa ou état VISE
        if (visasCF && visasCF.length > 0) {
          return 'current';
        }
        if (etat === 'VISE') {
          return 'current';
        }
        // Current si attribution complète
        if (isAttrComplete(attribution)) {
          return 'current';
        }
        return 'todo';

      case 'EXEC':
        // Done si clôture complète (exécution terminée)
        if (etat === 'CLOS' || (cloture && cloture.datePVD)) {
          return 'done';
        }
        // Done si avenants (exécution avancée)
        if (avenants && avenants.length > 0) {
          return 'done';
        }
        // Done si ordre de service émis (exécution démarrée)
        if (ordresService && ordresService.length > 0) {
          return 'done';
        }
        // Current si état EXECUTION ou EN_EXEC
        if (etat === 'EXECUTION' || etat === 'EN_EXEC') {
          return 'current';
        }
        // Current si visa CF obtenu (prêt à démarrer exécution)
        if (hasValidVisaCF(visasCF)) {
          return 'current';
        }
        return 'todo';

      case 'AVEN':
        // Done si avenants enregistrés
        if (avenants && avenants.length > 0) {
          return 'done';
        }
        // Current si en exécution (avenants possibles)
        if (ordresService && ordresService.length > 0) {
          return 'current';
        }
        if (etat === 'EN_EXEC') {
          return 'current';
        }
        return 'todo';

      case 'CLOT':
        // Done si clôture complète
        if (cloture && cloture.datePVD) {
          return 'done';
        }
        // Current si clôture commencée ou état CLOS
        if (cloture || etat === 'CLOS') {
          return 'current';
        }
        // Current si en exécution avancée
        if (ordresService && ordresService.length > 0) {
          return 'todo'; // Seulement todo, pas current automatiquement
        }
        return 'todo';

      default:
        return 'todo';
    }
  });
}

/**
 * Créer la timeline visuelle dynamique selon le mode de passation
 * @param {Object} fullData - Données complètes de l'opération
 * @param {string} operationId - ID de l'opération
 * @returns {HTMLElement}
 */
export function renderSteps(fullData, operationId) {
  const { operation } = fullData;
  const modePassation = operation?.modePassation || 'PSD';

  // Obtenir les phases dynamiques selon le mode de passation
  const phases = getPhases(modePassation);

  // Si pas de phases configurées, utiliser le fallback
  const steps = phases.length > 0 ? phases.map(phase => ({
    code: phase.code,
    label: phase.titre,
    icon: phase.icon,
    route: getRouteForPhase(phase.code),
    description: phase.sous_titre
  })) : LIFECYCLE_STEPS;

  const statuses = calculateDynamicStepStatuses(fullData, steps);

  const stepsContainer = el('div', { className: 'steps-container' }, [
    el('div', { className: 'steps' },
      steps.map((step, index) => {
        const status = statuses[index];
        const stepEl = el('div', { className: `step step-${status}` }, [
          el('div', { className: 'step-icon' }, step.icon),
          el('div', { className: 'step-label' }, step.label),
          el('div', { className: 'step-description' }, step.description)
        ]);

        // Click handler - naviguer vers l'écran de l'étape
        if (status === 'done' || status === 'current') {
          stepEl.classList.add('step-clickable');
          stepEl.addEventListener('click', () => {
            router.navigate(step.route, { idOperation: operationId });
          });
        }

        return stepEl;
      })
    )
  ]);

  return stepsContainer;
}

/**
 * Créer la timeline visuelle en chargeant depuis l'API (version async)
 * @param {Object} fullData - Données complètes de l'opération
 * @param {string} operationId - ID de l'opération
 * @returns {Promise<HTMLElement>}
 */
export async function renderStepsAsync(fullData, operationId) {
  const { operation } = fullData;
  const modePassation = operation?.modePassation || 'PSD';

  // Charger les phases depuis l'API
  const phases = await getPhasesAsync(modePassation);

  // Si pas de phases configurées, utiliser le fallback
  const steps = phases.length > 0 ? phases.map(phase => ({
    code: phase.code,
    label: phase.titre,
    icon: phase.icon,
    route: getRouteForPhase(phase.code),
    description: phase.sous_titre
  })) : LIFECYCLE_STEPS;

  const statuses = calculateDynamicStepStatuses(fullData, steps);

  const stepsContainer = el('div', { className: 'steps-container' }, [
    el('div', { className: 'steps' },
      steps.map((step, index) => {
        const status = statuses[index];
        const stepEl = el('div', { className: `step step-${status}` }, [
          el('div', { className: 'step-icon' }, step.icon),
          el('div', { className: 'step-label' }, step.label),
          el('div', { className: 'step-description' }, step.description)
        ]);

        // Click handler - naviguer vers l'écran de l'étape
        if (status === 'done' || status === 'current') {
          stepEl.classList.add('step-clickable');
          stepEl.addEventListener('click', () => {
            router.navigate(step.route, { idOperation: operationId });
          });
        }

        return stepEl;
      })
    )
  ]);

  return stepsContainer;
}

/**
 * Get route for a phase code
 */
function getRouteForPhase(code) {
  const routeMap = {
    'PLANIF': '/mp/ppm-list',
    'PROCEDURE': '/mp/procedure',
    'ATTRIBUTION': '/mp/attribution',
    'VISA_CF': '/mp/visa-cf',
    'EXECUTION': '/mp/execution',
    'AVENANTS': '/mp/avenants',
    'CLOTURE': '/mp/cloture'
  };
  return routeMap[code] || `/mp/${code.toLowerCase()}`;
}

/**
 * Helper pour vérifier si une attribution est complète
 * Supporte les deux structures : ancienne (titulaire, montantAttribue) et nouvelle (attributaire.nom, montants.attribue)
 */
function isAttributionComplete(attribution) {
  if (!attribution) return false;

  // Nouvelle structure JSONB (PostgreSQL)
  const hasAttributaire = attribution.attributaire?.nom || attribution.attributaire?.entrepriseId;
  const hasMontant = attribution.montants?.attribue > 0 || attribution.montants?.ttc > 0;
  if (hasAttributaire && hasMontant) return true;

  // Ancienne structure (compatibilité)
  if (attribution.titulaire && attribution.montantAttribue > 0) return true;

  return false;
}

/**
 * Helper pour vérifier si un visa CF est favorable
 */
function hasValidVisa(visasCF) {
  if (!visasCF || visasCF.length === 0) return false;
  // Accepter VISA, FAVORABLE, VISE, VISE_RESERVE
  return visasCF.some(v => ['VISA', 'FAVORABLE', 'VISE', 'VISE_RESERVE'].includes(v.decision));
}

/**
 * Calculer le status de chaque étape — Modif #56.
 *
 * Le statut visuel est dérivé en PRIORITÉ de l'état métier (`operation.etat`)
 * via un mapping état → étape courante. Garantit qu'UNE SEULE étape est
 * « current » à la fois et que toutes les étapes antérieures sont « done »,
 * indépendamment du remplissage des entités associées (procedure, attribution,
 * visa_cf, etc.). Évite l'effet « 2 étapes orange en même temps » que produisait
 * l'ancienne logique purement basée sur la présence d'entités.
 *
 * Mapping :
 *   PLANIFIE   → PLANIF      (current)
 *   EN_PROC    → PROCEDURE   (current)
 *   ATTRIBUE   → ATTRIBUTION (current)
 *   VISE       → VISA_CF     (current — si la phase existe dans le mode, sinon EXECUTION)
 *   EN_EXEC    → EXECUTION   (current)
 *   CLOS       → CLOTURE     (done — terminal)
 *   RESILIE    → EXECUTION   (done — terminal alternatif marqué comme exécuté)
 */
const PHASE_ORDER_REF = ['PLANIF','PROCEDURE','ATTRIBUTION','VISA_CF','EXECUTION','AVENANTS','CLOTURE'];

const ETAT_TO_PHASE = {
  PLANIFIE:  'PLANIF',
  EN_PROC:   'PROCEDURE',
  ATTRIBUE:  'ATTRIBUTION',
  VISE:      'VISA_CF',
  EN_EXEC:   'EXECUTION',
  EXECUTION: 'EXECUTION',
  CLOS:      'CLOTURE',
  CLOTURE:   'CLOTURE',
  RESILIE:   'EXECUTION'
};

function calculateDynamicStepStatuses(fullData, steps) {
  const { operation } = fullData;
  const etat = operation?.etat || 'PLANIFIE';

  // Codes effectivement présents dans les étapes du mode courant
  const stepCodes = steps.map(s => s.code);
  const phaseCible = ETAT_TO_PHASE[etat] || 'PLANIF';

  // Si la phase cible n'existe pas dans le mode (ex : PSD/PSC sans VISA_CF
  // alors que etat est VISE — improbable mais defensive), on prend la phase
  // suivante qui existe dans le mode.
  let cibleEffective = phaseCible;
  if (!stepCodes.includes(phaseCible)) {
    const startIdx = PHASE_ORDER_REF.indexOf(phaseCible);
    for (let i = startIdx + 1; i < PHASE_ORDER_REF.length; i++) {
      if (stepCodes.includes(PHASE_ORDER_REF[i])) { cibleEffective = PHASE_ORDER_REF[i]; break; }
    }
  }

  const cibleOrder = PHASE_ORDER_REF.indexOf(cibleEffective);
  const isTerminal = etat === 'CLOS' || etat === 'CLOTURE' || etat === 'RESILIE';

  return steps.map((step) => {
    const order = PHASE_ORDER_REF.indexOf(step.code);
    if (order === -1) return 'todo';

    // Cas terminal : tout ce qui est ≤ cible passe en « done »
    if (isTerminal) {
      return order <= cibleOrder ? 'done' : 'todo';
    }

    if (order < cibleOrder) return 'done';
    if (order === cibleOrder) return 'current';
    return 'todo';
  });
}

/**
 * Widget simple sans données complètes (juste timeline)
 * @param {Array} timeline - Codes d'étapes complétées
 * @returns {HTMLElement}
 */
export function renderSimpleSteps(timeline = ['PLANIF']) {
  const stepsContainer = el('div', { className: 'steps-container simple' }, [
    el('div', { className: 'steps' },
      LIFECYCLE_STEPS.map((step) => {
        const status = timeline.includes(step.code) ? 'done' : 'todo';
        const currentIndex = LIFECYCLE_STEPS.findIndex(s => timeline.includes(s.code));
        const stepIndex = LIFECYCLE_STEPS.findIndex(s => s.code === step.code);
        const isCurrent = stepIndex === currentIndex + 1 || (timeline.length === 1 && stepIndex === 0);

        return el('div', { className: `step step-${isCurrent ? 'current' : status}` }, [
          el('div', { className: 'step-icon' }, step.icon),
          el('div', { className: 'step-label' }, step.label)
        ]);
      })
    )
  ]);

  return stepsContainer;
}

export default { renderSteps, renderStepsAsync, renderSimpleSteps, calculateStepStatuses, LIFECYCLE_STEPS };
