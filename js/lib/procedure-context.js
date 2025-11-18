/* ============================================
   Procedure Context Helper v2.0
   Gère la contextualisation complète des champs selon le type de procédure
   Basé sur le Code des Marchés Publics de Côte d'Ivoire

   NOUVEAU: Support complet PSD, PSC, PSL, PSO, AOO, PI
   ============================================ */

import { getRulesConfig } from '../datastore/data-service.js';

/**
 * Récupère la configuration contextuelle complète depuis rules-config.json
 * @param {string} modePassation - Code du mode de passation
 * @param {string} phase - Phase du cycle (contractualisation, attribution, execution, cloture)
 * @returns {Object} Configuration des champs pour cette phase
 */
export function getContextualConfig(modePassation, phase = 'contractualisation') {
  const rulesConfig = getRulesConfig();
  const contextConfig = rulesConfig?.contextualite_procedures?.[modePassation];

  if (!contextConfig) {
    console.warn(`[ProcedureContext] Aucune configuration trouvée pour le mode: ${modePassation}`);
    return {
      label: modePassation,
      champs_requis: [],
      champs_optionnels: [],
      champs_caches: []
    };
  }

  return {
    label: contextConfig.label,
    ...contextConfig[phase]
  };
}

/**
 * Récupère tous les modes de passation disponibles
 * @returns {Array} Liste des codes de modes
 */
export function getAvailableModes() {
  const rulesConfig = getRulesConfig();
  return rulesConfig?.referentiels?.modes_passation || [];
}

/**
 * Vérifie si un champ est requis pour un mode et une phase
 * @param {string} fieldName - Nom du champ
 * @param {string} modePassation - Code du mode de passation
 * @param {string} phase - Phase du cycle
 * @returns {boolean}
 */
export function isFieldRequired(fieldName, modePassation, phase = 'contractualisation') {
  const config = getContextualConfig(modePassation, phase);
  return config.champs_requis?.includes(fieldName) || false;
}

/**
 * Vérifie si un champ est optionnel pour un mode et une phase
 * @param {string} fieldName - Nom du champ
 * @param {string} modePassation - Code du mode de passation
 * @param {string} phase - Phase du cycle
 * @returns {boolean}
 */
export function isFieldOptional(fieldName, modePassation, phase = 'contractualisation') {
  const config = getContextualConfig(modePassation, phase);
  return config.champs_optionnels?.includes(fieldName) || false;
}

/**
 * Vérifie si un champ doit être caché pour un mode et une phase
 * @param {string} fieldName - Nom du champ
 * @param {string} modePassation - Code du mode de passation
 * @param {string} phase - Phase du cycle
 * @returns {boolean}
 */
export function isFieldHidden(fieldName, modePassation, phase = 'contractualisation') {
  const config = getContextualConfig(modePassation, phase);
  return config.champs_caches?.includes(fieldName) || false;
}

/**
 * Vérifie si la gestion des soumissionnaires est active pour un mode
 * @param {string} modePassation - Code du mode de passation
 * @returns {boolean}
 */
export function hasSoumissionnairesManagement(modePassation) {
  const config = getContextualConfig(modePassation, 'contractualisation');
  return config.info_soumissionnaires === true;
}

/**
 * Récupère les champs soumissionnaires pour un mode
 * @param {string} modePassation - Code du mode de passation
 * @returns {Array} Liste des champs soumissionnaires
 */
export function getSoumissionnairesFields(modePassation) {
  const config = getContextualConfig(modePassation, 'contractualisation');
  return config.champs_soumissionnaires || [];
}

/**
 * Vérifie si la gestion des lots est active pour un mode
 * @param {string} modePassation - Code du mode de passation
 * @returns {boolean}
 */
export function hasLotsManagement(modePassation) {
  const config = getContextualConfig(modePassation, 'contractualisation');
  return config.info_lots === true;
}

/**
 * Récupère les champs lots pour un mode
 * @param {string} modePassation - Code du mode de passation
 * @returns {Array} Liste des champs lots
 */
export function getLotsFields(modePassation) {
  const config = getContextualConfig(modePassation, 'contractualisation');
  return config.champs_lots || [];
}

/**
 * Vérifie si la gestion des recours est active pour un mode
 * @param {string} modePassation - Code du mode de passation
 * @returns {boolean}
 */
export function hasRecoursManagement(modePassation) {
  const config = getContextualConfig(modePassation, 'contractualisation');
  return config.info_recours === true;
}

/**
 * Vérifie si la validation DGMP est obligatoire pour un mode
 * @param {string} modePassation - Code du mode de passation
 * @returns {boolean}
 */
export function requiresDGMPValidation(modePassation) {
  const config = getContextualConfig(modePassation, 'contractualisation');
  return config.validation_dgmp === true;
}

/**
 * Vérifie si la publication est obligatoire pour un mode
 * @param {string} modePassation - Code du mode de passation
 * @returns {boolean}
 */
export function requiresPublication(modePassation) {
  const config = getContextualConfig(modePassation, 'contractualisation');
  return config.publication_obligatoire === true;
}

/**
 * Vérifie si la COJO est obligatoire pour un mode
 * @param {string} modePassation - Code du mode de passation
 * @returns {boolean}
 */
export function requiresCOJO(modePassation) {
  const config = getContextualConfig(modePassation, 'contractualisation');
  return config.cojo_obligatoire === true;
}

/**
 * Récupère les documents requis pour un mode et une phase
 * @param {string} modePassation - Code du mode de passation
 * @param {string} phase - Phase du cycle
 * @returns {Array} Liste des documents requis
 */
export function getRequiredDocuments(modePassation, phase = 'contractualisation') {
  const config = getContextualConfig(modePassation, phase);
  return config.documents_requis || [];
}

/**
 * Récupère les documents optionnels pour un mode et une phase
 * @param {string} modePassation - Code du mode de passation
 * @param {string} phase - Phase du cycle
 * @returns {Array} Liste des documents optionnels
 */
export function getOptionalDocuments(modePassation, phase = 'contractualisation') {
  const config = getContextualConfig(modePassation, phase);
  return config.documents_optionnels || [];
}

/**
 * Applique la contextualisation sur un formulaire
 * Cache/affiche/marque comme requis les champs selon le mode de passation
 * @param {HTMLFormElement} form - Formulaire DOM
 * @param {string} modePassation - Code du mode de passation
 * @param {string} phase - Phase du cycle
 */
export function applyProcedureContext(form, modePassation, phase = 'contractualisation') {
  if (!form || !modePassation) return;

  const config = getContextualConfig(modePassation, phase);

  console.log(`[ProcedureContext] Application contexte ${modePassation} - Phase: ${phase}`, config);

  // Récupérer tous les champs du formulaire avec attribut data-field-name
  const allFields = form.querySelectorAll('[data-field-name]');

  allFields.forEach(fieldContainer => {
    const fieldName = fieldContainer.getAttribute('data-field-name');

    // Vérifier si le champ doit être caché
    if (config.champs_caches?.includes(fieldName)) {
      fieldContainer.style.display = 'none';
      fieldContainer.setAttribute('data-context-hidden', 'true');

      // Retirer le required si présent
      const input = fieldContainer.querySelector('input, select, textarea');
      if (input) {
        input.removeAttribute('required');
      }
    } else {
      fieldContainer.style.display = '';
      fieldContainer.removeAttribute('data-context-hidden');

      // Vérifier si le champ doit être requis
      const isRequired = config.champs_requis?.includes(fieldName);
      const label = fieldContainer.querySelector('label');
      const input = fieldContainer.querySelector('input, select, textarea');

      if (input) {
        if (isRequired) {
          input.setAttribute('required', 'required');
          fieldContainer.setAttribute('data-context-required', 'true');

          // Ajouter l'astérisque rouge si absent
          if (label && !label.querySelector('.required')) {
            const requiredSpan = document.createElement('span');
            requiredSpan.className = 'required';
            requiredSpan.textContent = '*';
            requiredSpan.style.color = '#dc3545';
            requiredSpan.style.marginLeft = '4px';
            label.appendChild(requiredSpan);
          }
        } else {
          input.removeAttribute('required');
          fieldContainer.removeAttribute('data-context-required');

          // Retirer l'astérisque si présent
          const requiredSpan = label?.querySelector('.required');
          if (requiredSpan) {
            requiredSpan.remove();
          }
        }
      }
    }
  });
}

/**
 * Applique la contextualisation sur des sections de formulaire
 * @param {HTMLElement} container - Conteneur des sections
 * @param {string} modePassation - Code du mode de passation
 * @param {string} phase - Phase du cycle
 */
export function applyProcedureContextToSections(container, modePassation, phase = 'contractualisation') {
  if (!container || !modePassation) return;

  const config = getContextualConfig(modePassation, phase);

  // Gestion sections soumissionnaires
  const soumissionnairesSection = container.querySelector('[data-section="soumissionnaires"]');
  if (soumissionnairesSection) {
    if (config.info_soumissionnaires === true) {
      soumissionnairesSection.style.display = '';
    } else {
      soumissionnairesSection.style.display = 'none';
    }
  }

  // Gestion sections lots
  const lotsSection = container.querySelector('[data-section="lots"]');
  if (lotsSection) {
    if (config.info_lots === true) {
      lotsSection.style.display = '';
    } else {
      lotsSection.style.display = 'none';
    }
  }

  // Gestion sections recours
  const recoursSection = container.querySelector('[data-section="recours"]');
  if (recoursSection) {
    if (config.info_recours === true) {
      recoursSection.style.display = '';
    } else {
      recoursSection.style.display = 'none';
    }
  }

  // Gestion sections COJO
  const cojoSection = container.querySelector('[data-section="cojo"]');
  if (cojoSection) {
    if (config.cojo_obligatoire === true) {
      cojoSection.style.display = '';
    } else {
      cojoSection.style.display = 'none';
    }
  }

  // Gestion sections garanties (attribution)
  if (phase === 'attribution') {
    const garantiesSection = container.querySelector('[data-section="garanties"]');
    if (garantiesSection) {
      // Cacher pour PI (pas de garanties pour prestations intellectuelles)
      if (modePassation === 'PI') {
        garantiesSection.style.display = 'none';
      } else {
        garantiesSection.style.display = '';
      }
    }
  }
}

/**
 * Génère un message d'aide contextuel pour un mode de passation
 * @param {string} modePassation - Code du mode de passation
 * @returns {string} Message d'aide
 */
export function getProcedureHelpText(modePassation) {
  const helpTexts = {
    'PSD': 'Procédure Simplifiée d\'Entente Directe (< 10M XOF) : Autorité contractante choisit directement un fournisseur. Bon de commande ou engagement direct. DCF peut émettre réserves.',

    'PSC': 'Procédure Simplifiée de Demande de Cotation (10M - 30M XOF) : Demande de cotations/devis à 3 fournisseurs minimum. Sélection de l\'offre économiquement la plus avantageuse. DCF peut émettre réserves.',

    'PSL': 'Procédure Simplifiée à Compétition Limitée (30M - 50M XOF) : Validation DGMP obligatoire. Publication et consultation restreinte. Commission de jugement.',

    'PSO': 'Procédure Simplifiée à Compétition Ouverte (50M - 100M XOF) : Validation DGMP + Publication obligatoire. Procédure ouverte avec COJO.',

    'AOO': 'Appel d\'Offres Ouvert (≥ 100M XOF) : Validation DGMP + Publication large (journal, site web). COJO obligatoire. Garanties avance et bonne exécution requises.',

    'PI': 'Prestations Intellectuelles (pas de seuil fixe) : Sélection basée sur qualifications (QBS, QCBS, FBS, LCS). Validation DGMP + Publication. COJO obligatoire. Pas de garanties d\'avance.',

    'AON': 'Appel d\'Offres National : Publicité large nationale, tout candidat qualifié peut soumissionner. Garantie provisoire requise.',

    'AOI': 'Appel d\'Offres International : Publicité internationale, marchés de grande envergure. Garantie provisoire requise.',

    'AOR': 'Appel d\'Offres Restreint : Présélection préalable des candidats, puis invitation à soumissionner. Garantie provisoire requise.',

    'DC': 'Demande de Cotation : Consultation d\'au moins 3 fournisseurs pour marchés de faible montant. Pas de garantie provisoire.',

    'DP': 'Demande de Propositions : Évaluation technique et financière séparée, pour prestations intellectuelles complexes.',

    'ED': 'Entente Directe : Procédure exceptionnelle nécessitant autorisation préalable et justification détaillée.',

    'DGD': 'De Gré à Gré : Négociation directe avec un seul fournisseur dans des cas exceptionnels prévus par la réglementation.',

    'CASU': 'Cas Unique : Situation d\'urgence ou cas spécifique nécessitant dérogation avec justification.'
  };

  return helpTexts[modePassation] || `Procédure ${modePassation} : Aucune information détaillée disponible.`;
}

/**
 * Récupère le label complet pour un mode de passation
 * @param {string} modePassation - Code du mode
 * @returns {string} Label complet
 */
export function getProcedureLabel(modePassation) {
  const labels = {
    'PSD': 'Procédure Simplifiée d\'Entente Directe',
    'PSC': 'Procédure Simplifiée de Demande de Cotation',
    'PSL': 'Procédure Simplifiée à Compétition Limitée',
    'PSO': 'Procédure Simplifiée à Compétition Ouverte',
    'AOO': 'Appel d\'Offres Ouvert',
    'PI': 'Prestations Intellectuelles',
    'AON': 'Appel d\'Offres National',
    'AOI': 'Appel d\'Offres International',
    'AOR': 'Appel d\'Offres Restreint',
    'DC': 'Demande de Cotation',
    'DP': 'Demande de Propositions',
    'ED': 'Entente Directe',
    'DGD': 'De Gré à Gré',
    'CASU': 'Cas Unique'
  };

  return labels[modePassation] || modePassation;
}

/**
 * Valide qu'un formulaire respecte les exigences du mode de passation
 * @param {FormData|Object} formData - Données du formulaire
 * @param {string} modePassation - Code du mode de passation
 * @param {string} phase - Phase du cycle
 * @returns {Object} {valid: boolean, errors: array, warnings: array}
 */
export function validateProcedureRequirements(formData, modePassation, phase = 'contractualisation') {
  const config = getContextualConfig(modePassation, phase);
  const errors = [];
  const warnings = [];

  // Convertir FormData en objet si nécessaire
  const data = formData instanceof FormData
    ? Object.fromEntries(formData.entries())
    : formData;

  // Vérifier les champs requis
  config.champs_requis?.forEach(fieldName => {
    const value = data[fieldName];
    if (!value || value.toString().trim() === '') {
      errors.push({
        field: fieldName,
        message: `Le champ "${fieldName}" est obligatoire pour ${config.label} (phase ${phase})`
      });
    }
  });

  // Vérifier les documents requis
  config.documents_requis?.forEach(docType => {
    const docField = `doc_${docType.toLowerCase()}`;
    if (!data[docField]) {
      errors.push({
        field: docField,
        message: `Le document "${docType}" est obligatoire pour ${config.label}`
      });
    }
  });

  // Validations spécifiques par mode
  if (modePassation === 'PSC' && phase === 'contractualisation') {
    // PSC: minimum 3 soumissionnaires
    const nbSoumissionnaires = parseInt(data.nombreSoumissionnaires || 0);
    if (nbSoumissionnaires < 3) {
      warnings.push({
        field: 'nombreSoumissionnaires',
        message: 'La PSC requiert au minimum 3 fournisseurs consultés'
      });
    }
  }

  if (['PSL', 'PSO', 'AOO', 'PI'].includes(modePassation) && phase === 'contractualisation') {
    // Validation DGMP obligatoire
    if (!data.validationDGMP) {
      errors.push({
        field: 'validationDGMP',
        message: `Validation DGMP obligatoire pour ${config.label}`
      });
    }
  }

  if (['PSO', 'AOO', 'PI'].includes(modePassation) && phase === 'contractualisation') {
    // Publication obligatoire
    if (!data.datePublication) {
      errors.push({
        field: 'datePublication',
        message: `Publication obligatoire pour ${config.label}`
      });
    }
  }

  if (['AOO', 'PI'].includes(modePassation) && phase === 'attribution') {
    // Garanties obligatoires pour AOO
    if (modePassation === 'AOO') {
      if (!data.garantieBonneExecution) {
        errors.push({
          field: 'garantieBonneExecution',
          message: 'Garantie de bonne exécution obligatoire pour AOO'
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Crée un élément d'alerte d'information pour un mode de passation
 * @param {string} modePassation - Code du mode de passation
 * @returns {HTMLElement} Élément DOM
 */
export function createProcedureInfoAlert(modePassation) {
  const helpText = getProcedureHelpText(modePassation);
  const config = getContextualConfig(modePassation, 'contractualisation');

  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-info';
  alertDiv.style.marginBottom = '16px';

  const icon = document.createElement('div');
  icon.className = 'alert-icon';
  icon.textContent = 'ℹ️';

  const content = document.createElement('div');
  content.className = 'alert-content';

  const title = document.createElement('div');
  title.className = 'alert-title';
  title.textContent = `${config.label} (${modePassation})`;
  title.style.fontWeight = '600';

  const message = document.createElement('div');
  message.className = 'alert-message';
  message.textContent = helpText;
  message.style.marginTop = '8px';

  // Caractéristiques du mode
  const features = [];
  if (config.validation_dgmp) features.push('✓ Validation DGMP');
  if (config.publication_obligatoire) features.push('✓ Publication obligatoire');
  if (config.cojo_obligatoire) features.push('✓ COJO requise');
  if (config.info_soumissionnaires) features.push('✓ Gestion soumissionnaires');
  if (config.info_lots) features.push('✓ Gestion lots');

  if (features.length > 0) {
    const featuresList = document.createElement('div');
    featuresList.style.marginTop = '12px';
    featuresList.style.fontSize = '0.9em';
    featuresList.style.color = '#0c5460';
    featuresList.innerHTML = features.join(' &nbsp;&nbsp;|&nbsp;&nbsp; ');
    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(featuresList);
  } else {
    content.appendChild(title);
    content.appendChild(message);
  }

  alertDiv.appendChild(icon);
  alertDiv.appendChild(content);

  return alertDiv;
}

/**
 * Récupère la nomenclature des étapes (paramétrable)
 * @returns {Object} Nomenclature des étapes
 */
export function getStepsNomenclature() {
  const rulesConfig = getRulesConfig();
  const nomenclature = rulesConfig?.nomenclature_etapes;

  // Utiliser config utilisateur si existe, sinon défaut
  return nomenclature?.config_utilisateur && Object.keys(nomenclature.config_utilisateur).length > 0
    ? nomenclature.config_utilisateur
    : nomenclature?.defaut || {
        'PLANIFICATION': 'Planification',
        'PROCEDURE': 'Procédure & PV',
        'ATTRIBUTION': 'Attribution',
        'VISA_CF': 'Visa CF',
        'EXECUTION': 'Exécution',
        'AVENANTS': 'Avenants',
        'GARANTIES': 'Garanties',
        'CLOTURE': 'Clôture'
      };
}

/**
 * Permet de personnaliser la nomenclature des étapes
 * @param {Object} customNomenclature - Nomenclature personnalisée
 */
export function setCustomStepsNomenclature(customNomenclature) {
  const rulesConfig = getRulesConfig();
  if (rulesConfig?.nomenclature_etapes) {
    rulesConfig.nomenclature_etapes.config_utilisateur = customNomenclature;
    // Persister dans localStorage ou backend
    localStorage.setItem('sidcf:nomenclature_etapes', JSON.stringify(customNomenclature));
  }
}

// Export default pour compatibilité
export default {
  getContextualConfig,
  getAvailableModes,
  isFieldRequired,
  isFieldOptional,
  isFieldHidden,
  hasSoumissionnairesManagement,
  getSoumissionnairesFields,
  hasLotsManagement,
  getLotsFields,
  hasRecoursManagement,
  requiresDGMPValidation,
  requiresPublication,
  requiresCOJO,
  getRequiredDocuments,
  getOptionalDocuments,
  applyProcedureContext,
  applyProcedureContextToSections,
  getProcedureHelpText,
  getProcedureLabel,
  validateProcedureRequirements,
  createProcedureInfoAlert,
  getStepsNomenclature,
  setCustomStepsNomenclature
};
