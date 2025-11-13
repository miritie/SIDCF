/* ============================================
   Steps Widget - Timeline de progression
   ============================================ */

import { el } from '../../lib/dom.js';
import router from '../../router.js';

/**
 * Définition des étapes du cycle de vie d'un marché
 * Note: Les garanties font partie de l'attribution (pas une étape séparée)
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
    description: 'Attributaire & garanties'
  },
  {
    code: 'VISE',
    label: 'Visa CF',
    icon: '✅',
    route: '/visa-cf',
    description: 'Contrôle financier'
  },
  {
    code: 'EXEC',
    label: 'Exécution',
    icon: '🔧',
    route: '/execution',
    description: 'OS & suivi'
  },
  {
    code: 'AVEN',
    label: 'Avenants',
    icon: '📝',
    route: '/avenants',
    description: 'Modifications contractuelles'
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
  const { operation, procedure, attribution, visasCF, ordresService, avenants, cloture } = fullData;
  const etat = operation?.etat || 'PLANIFIE';

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
        // Current si procédure commencée ou état EN_PROCEDURE
        if (procedure || etat === 'EN_PROCEDURE') {
          return 'current';
        }
        // Current si étape précédente done et celle-ci pas encore
        if (operation) {
          return 'current';
        }
        return 'todo';

      case 'ATTR':
        // Done si attribution complète avec montants et titulaire
        if (attribution && attribution.titulaire && attribution.montantAttribue > 0) {
          return 'done';
        }
        // Current si attribution commencée ou état EN_ATTRIBUTION
        if (attribution || etat === 'EN_ATTRIBUTION') {
          return 'current';
        }
        // Current si procédure complète
        if (procedure && procedure.decisionAttributionRef) {
          return 'current';
        }
        return 'todo';

      case 'VISE':
        // Done si visa CF obtenu
        if (visasCF && visasCF.length > 0 && visasCF.some(v => v.decision === 'FAVORABLE')) {
          return 'done';
        }
        // Current si en attente de visa ou état VISE
        if (visasCF && visasCF.length > 0) {
          return 'current';
        }
        if (etat === 'VISE' || etat === 'EN_VISA') {
          return 'current';
        }
        // Current si attribution complète
        if (attribution && attribution.titulaire && attribution.montantAttribue > 0) {
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
        // Current si état EN_EXEC
        if (etat === 'EN_EXEC') {
          return 'current';
        }
        // Current si visa CF obtenu (prêt à démarrer exécution)
        if (visasCF && visasCF.length > 0 && visasCF.some(v => v.decision === 'FAVORABLE')) {
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
