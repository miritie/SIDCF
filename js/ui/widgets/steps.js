/* ============================================
   Steps Widget - Timeline de progression
   ============================================ */

import { el } from '../../lib/dom.js';
import router from '../../router.js';

/**
 * Définition des étapes du cycle de vie d'un marché
 */
export const LIFECYCLE_STEPS = [
  {
    code: 'PLANIF',
    label: 'Planification',
    icon: '📋',
    route: '/ppm-list',
    description: 'Inscription au PPM'
  },
  {
    code: 'PROC',
    label: 'Procédure',
    icon: '⚖️',
    route: '/procedure',
    description: 'Passation & PV'
  },
  {
    code: 'ATTR',
    label: 'Attribution',
    icon: '👥',
    route: '/attribution',
    description: 'Attributaire & montants'
  },
  {
    code: 'VISE',
    label: 'Visa CF',
    icon: '✅',
    route: '/fiche-marche',
    description: 'Contrôle financier'
  },
  {
    code: 'EXEC',
    label: 'Exécution',
    icon: '🔧',
    route: '/execution',
    description: 'OS & avenants'
  },
  {
    code: 'CLOT',
    label: 'Clôture',
    icon: '🏁',
    route: '/cloture',
    description: 'Réceptions & clôture'
  }
];

/**
 * Calculer le status de chaque étape en fonction des données
 * @param {Object} fullData - Données complètes de l'opération
 * @returns {Array} Status de chaque étape
 */
export function calculateStepStatuses(fullData) {
  const { operation, procedure, attribution, avenants, cloture } = fullData;
  const timeline = operation?.timeline || ['PLANIF'];

  return LIFECYCLE_STEPS.map((step) => {
    const code = step.code;

    // done : étape complétée
    if (timeline.includes(code)) {
      return 'done';
    }

    // current : étape en cours (détection via présence de données partielles)
    if (code === 'PROC' && procedure && !procedure.decisionAttributionRef) {
      return 'current';
    }
    if (code === 'ATTR' && attribution && !attribution.dates?.decisionCF) {
      return 'current';
    }
    if (code === 'VISE' && attribution?.dates?.decisionCF && !avenants?.length) {
      return 'current';
    }
    if (code === 'EXEC' && avenants?.length > 0 && !cloture) {
      return 'current';
    }
    if (code === 'CLOT' && cloture && !cloture.closAt) {
      return 'current';
    }

    // Vérifier si c'est la prochaine étape logique
    const currentIndex = LIFECYCLE_STEPS.findIndex(s => timeline.includes(s.code));
    const stepIndex = LIFECYCLE_STEPS.findIndex(s => s.code === code);
    if (stepIndex === currentIndex + 1) {
      return 'current';
    }

    // todo : étape à venir
    return 'todo';
  });
}

/**
 * Créer la timeline visuelle
 * @param {Object} fullData - Données complètes de l'opération
 * @param {string} operationId - ID de l'opération
 * @returns {HTMLElement}
 */
export function renderSteps(fullData, operationId) {
  const statuses = calculateStepStatuses(fullData);

  const stepsContainer = el('div', { className: 'steps-container' }, [
    el('div', { className: 'steps' },
      LIFECYCLE_STEPS.map((step, index) => {
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

export default { renderSteps, renderSimpleSteps, calculateStepStatuses, LIFECYCLE_STEPS };
