/* ============================================
   Admin - Règles & Procédures
   ============================================ */

import { mount, el } from '../lib/dom.js';
import dataService from '../datastore/data-service.js';
import router from '../router.js';
import logger from '../lib/logger.js';

let rulesConfig = null;

export async function renderRegles() {
  rulesConfig = dataService.getRulesConfig();

  // Vérifier que rulesConfig est valide
  if (!rulesConfig || typeof rulesConfig !== 'object') {
    logger.error('[Regles] rulesConfig non disponible');
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, [
        el('div', { className: 'alert-icon' }, '⚠️'),
        el('div', { className: 'alert-content' }, [
          el('div', { className: 'alert-title' }, 'Erreur de chargement'),
          el('div', { className: 'alert-message' }, 'La configuration des règles n\'a pas pu être chargée.')
        ])
      ]),
      el('button', {
        className: 'btn btn-primary',
        onclick: () => router.navigate('/portal')
      }, '← Retour au portail')
    ]));
    return;
  }

  // Construire les sections dynamiquement
  const sections = [
    el('div', { className: 'page-header' }, [
      el('h1', { className: 'page-title' }, 'Règles & Procédures'),
      el('p', { className: 'page-subtitle' }, 'Configuration des règles réglementaires et seuils paramétrables')
    ]),

    el('div', { className: 'alert alert-info', style: { marginBottom: '24px' } }, [
      el('div', { className: 'alert-icon' }, 'ℹ️'),
      el('div', { className: 'alert-content' }, [
        el('div', { className: 'alert-title' }, 'Règles métier paramétrables'),
        el('div', { className: 'alert-message' }, 'Ces règles sont appliquées automatiquement lors de la saisie et de la validation des marchés. Modifiez-les avec précaution.')
      ])
    ])
  ];

  // Seuils
  if (rulesConfig.seuils) {
    sections.push(renderSection('Seuils et Limites', rulesConfig.seuils, 'seuils'));
  }

  // Validations
  if (rulesConfig.validations) {
    sections.push(renderSection('Validations Obligatoires', rulesConfig.validations, 'validations'));
  }

  // Délais types
  if (rulesConfig.delais_types) {
    sections.push(renderSection('Délais Réglementaires', rulesConfig.delais_types, 'delais'));
  }

  // ANO
  if (rulesConfig.ano) {
    sections.push(renderSectionANO());
  }

  // Garanties
  if (rulesConfig.garanties) {
    sections.push(renderSectionGaranties());
  }

  // Matrices des procédures (NOUVEAU)
  if (rulesConfig.matrices_procedures) {
    sections.push(renderSectionMatricesProcedures());
  }

  // Contextualité des procédures (NOUVEAU)
  if (rulesConfig.contextualite_procedures) {
    sections.push(renderSectionContextualite());
  }

  // Actions
  sections.push(
    el('div', { className: 'card' }, [
      el('div', { className: 'card-body' }, [
        el('button', {
          className: 'btn btn-secondary',
          onclick: () => router.navigate('/portal')
        }, '← Retour au portail')
      ])
    ])
  );

  const page = el('div', { className: 'page' }, sections);

  mount('#app', page);
}

/**
 * Rendu d'une section de règles
 */
function renderSection(title, items, type) {
  const bodyId = `section-body-${type}`;

  const toggleBtn = el('button', {
    className: 'btn btn-sm',
    style: 'padding: 4px 8px; margin-right: 12px; background: transparent; border: none; cursor: pointer; font-size: 18px;',
    onclick: function() {
      const bodyDiv = document.getElementById(bodyId);
      if (bodyDiv) {
        const isHidden = bodyDiv.style.display === 'none';
        bodyDiv.style.display = isHidden ? 'block' : 'none';
        this.textContent = isHidden ? '▼' : '▶';
      }
    }
  }, '▼');

  const bodyDiv = el('div', {
    id: bodyId,
    className: 'card-body'
  }, [
    el('div', { style: { display: 'grid', gap: '12px' } },
      Object.entries(items).map(([key, config]) => renderRuleItem(key, config, type))
    )
  ]);

  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
      el('div', { style: { display: 'flex', alignItems: 'center' } }, [
        toggleBtn,
        el('h3', { className: 'card-title', style: { margin: 0 } }, title)
      ]),
      el('span', { className: 'badge badge-secondary' }, `${Object.keys(items).length} règle(s)`)
    ]),
    bodyDiv
  ]);
}

/**
 * Rendu d'un élément de règle
 */
function renderRuleItem(key, config, type) {
  const isValidation = type === 'validations';

  return el('div', {
    className: 'rule-item',
    style: `
      padding: 16px;
      border: 2px solid ${isValidation && config.enabled ? '#10B981' : '#E5E7EB'};
      border-radius: 10px;
      background: white;
      transition: all 0.2s ease;
    `
  }, [
    el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' } }, [
      el('div', { style: { flex: 1 } }, [
        el('div', { style: { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '6px' } }, [
          el('code', {
            style: 'background: #F3F4F6; padding: 4px 8px; border-radius: 6px; font-size: 12px; color: #374151; font-weight: 600;'
          }, key),
          config.severity && el('span', {
            className: `badge ${config.severity === 'BLOCK' ? 'badge-error' : 'badge-warning'}`,
            style: { fontSize: '11px' }
          }, config.severity === 'BLOCK' ? 'BLOQUANT' : 'ALERTE')
        ]),
        el('p', {
          style: 'margin: 0; font-size: 14px; color: #6B7280;'
        }, config.description || '')
      ]),

      // Toggle pour validations
      isValidation && el('label', {
        className: 'toggle-switch',
        style: 'margin-left: 16px;'
      }, [
        el('input', {
          type: 'checkbox',
          checked: config.enabled,
          onchange: (e) => toggleValidation(key, e.target.checked)
        }),
        el('span', { className: 'toggle-slider' })
      ])
    ]),

    // Valeur éditable
    !isValidation && config.value !== undefined && el('div', {
      style: 'display: flex; gap: 12px; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid #F3F4F6;'
    }, [
      el('label', {
        style: 'font-size: 13px; font-weight: 600; color: #374151;'
      }, 'Valeur :'),
      el('input', {
        type: 'number',
        value: config.value,
        className: 'form-control',
        style: {
          width: '120px',
          fontSize: '14px',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '2px solid #E5E7EB'
        },
        onchange: (e) => updateRuleValue(type, key, parseFloat(e.target.value))
      }),
      el('span', {
        style: 'font-size: 14px; color: #6B7280; font-weight: 500;'
      }, config.unit || '')
    ])
  ]);
}

/**
 * Section ANO spécifique
 */
function renderSectionANO() {
  const ano = rulesConfig.ano;
  const bodyId = 'section-body-ano';

  const toggleBtn = el('button', {
    className: 'btn btn-sm',
    style: 'padding: 4px 8px; margin-right: 12px; background: transparent; border: none; cursor: pointer; font-size: 18px;',
    onclick: function() {
      const bodyDiv = document.getElementById(bodyId);
      if (bodyDiv) {
        const isHidden = bodyDiv.style.display === 'none';
        bodyDiv.style.display = isHidden ? 'block' : 'none';
        this.textContent = isHidden ? '▼' : '▶';
      }
    }
  }, '▼');

  const bodyDiv = el('div', {
    id: bodyId,
    className: 'card-body'
  }, [
    el('p', { style: { color: '#6B7280', marginBottom: '16px', fontSize: '14px' } }, ano.description),

    el('div', { style: { display: 'grid', gap: '12px' } }, [
      // Modes requérant ANO
      el('div', { className: 'info-block' }, [
        el('strong', { style: { display: 'block', marginBottom: '8px', color: '#374151' } }, 'Modes de passation requérant ANO :'),
        el('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
          ano.modes_requierant_ano.map(mode =>
            el('span', { className: 'badge', style: 'background: #DBEAFE; color: #1E40AF; padding: 6px 12px;' }, mode)
          )
        )
      ]),

      // Bailleurs requérant ANO
      el('div', { className: 'info-block' }, [
        el('strong', { style: { display: 'block', marginBottom: '8px', color: '#374151' } }, 'Bailleurs requérant ANO :'),
        el('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
          ano.bailleurs_requierant_ano.map(bailleur =>
            el('span', { className: 'badge', style: 'background: #FEF3C7; color: #92400E; padding: 6px 12px;' }, bailleur)
          )
        )
      ]),

      // Seuils par type
      el('div', { className: 'info-block' }, [
        el('strong', { style: { display: 'block', marginBottom: '12px', color: '#374151' } }, 'Seuils de montant par type de marché :'),
        el('div', { style: { display: 'grid', gap: '8px' } },
          Object.entries(ano.seuils_montant).map(([type, config]) =>
            el('div', {
              style: 'display: flex; justify-content: space-between; padding: 10px 14px; background: #F9FAFB; border-radius: 6px;'
            }, [
              el('span', { style: { fontWeight: '500', color: '#374151' } }, type),
              el('span', { style: { color: '#6B7280' } }, `${(config.value / 1000000).toFixed(0)}M XOF`)
            ])
          )
        )
      ])
    ])
  ]);

  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
      el('div', { style: { display: 'flex', alignItems: 'center' } }, [
        toggleBtn,
        el('h3', { className: 'card-title', style: { margin: 0 } }, 'Avis de Non-Objection (ANO)')
      ]),
      el('span', { className: 'badge badge-info' }, 'Réglementaire')
    ]),
    bodyDiv
  ]);
}

/**
 * Section Garanties spécifique
 */
function renderSectionGaranties() {
  const garanties = rulesConfig.garanties;
  const bodyId = 'section-body-garanties';

  const toggleBtn = el('button', {
    className: 'btn btn-sm',
    style: 'padding: 4px 8px; margin-right: 12px; background: transparent; border: none; cursor: pointer; font-size: 18px;',
    onclick: function() {
      const bodyDiv = document.getElementById(bodyId);
      if (bodyDiv) {
        const isHidden = bodyDiv.style.display === 'none';
        bodyDiv.style.display = isHidden ? 'block' : 'none';
        this.textContent = isHidden ? '▼' : '▶';
      }
    }
  }, '▼');

  const bodyDiv = el('div', {
    id: bodyId,
    className: 'card-body'
  }, [
    el('p', { style: { color: '#6B7280', marginBottom: '16px', fontSize: '14px' } }, garanties.description),

    el('div', { style: { display: 'grid', gap: '16px' } }, [
      // Garantie d'avance
      renderGarantieBlock('Garantie de Restitution d\'Avance', garanties.garantie_avance),

      // Garantie de bonne exécution
      renderGarantieBlock('Garantie de Bonne Exécution', garanties.garantie_bonne_execution),

      // Retenue de garantie
      el('div', {
        style: 'padding: 14px; background: #F9FAFB; border-radius: 8px; border: 1px solid #E5E7EB;'
      }, [
        el('strong', { style: { display: 'block', marginBottom: '8px', color: '#374151' } }, 'Retenue de Garantie'),
        el('p', { style: { margin: 0, color: '#6B7280', fontSize: '14px' } },
          `${garanties.retenue_garantie.description} : ${garanties.retenue_garantie.taux}${garanties.retenue_garantie.unit}`
        )
      ])
    ])
  ]);

  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
      el('div', { style: { display: 'flex', alignItems: 'center' } }, [
        toggleBtn,
        el('h3', { className: 'card-title', style: { margin: 0 } }, 'Garanties Bancaires')
      ]),
      el('span', { className: 'badge badge-info' }, 'Réglementaire')
    ]),
    bodyDiv
  ]);
}

/**
 * Bloc de garantie
 */
function renderGarantieBlock(title, config) {
  return el('div', {
    style: 'padding: 14px; background: #F9FAFB; border-radius: 8px; border: 1px solid #E5E7EB;'
  }, [
    el('strong', { style: { display: 'block', marginBottom: '10px', color: '#374151' } }, title),
    el('p', { style: { margin: '0 0 8px 0', color: '#6B7280', fontSize: '13px' } }, config.description),
    el('div', { style: { display: 'flex', gap: '16px' } }, [
      el('span', { style: { fontSize: '14px', color: '#374151' } },
        `Taux min : ${config.taux_min}${config.unit}`
      ),
      el('span', { style: { fontSize: '14px', color: '#374151' } },
        `Taux max : ${config.taux_max}${config.unit}`
      )
    ])
  ]);
}

/**
 * Toggle validation
 */
function toggleValidation(key, enabled) {
  logger.info(`[Regles] Toggle validation ${key}: ${enabled}`);
  // TODO: Save to localStorage or backend
  alert(`Validation "${key}" ${enabled ? 'activée' : 'désactivée'}`);
}

/**
 * Update rule value
 */
function updateRuleValue(type, key, value) {
  logger.info(`[Regles] Update ${type}.${key}: ${value}`);
  // TODO: Save to localStorage or backend
  alert(`Règle "${key}" mise à jour : ${value}`);
}

/**
 * Section Matrices des Procédures
 */
function renderSectionMatricesProcedures() {
  const matrices = rulesConfig.matrices_procedures;
  const bodyId = 'section-body-matrices';

  const toggleBtn = el('button', {
    className: 'btn btn-sm',
    style: 'padding: 4px 8px; margin-right: 12px; background: transparent; border: none; cursor: pointer; font-size: 18px;',
    onclick: function() {
      const bodyDiv = document.getElementById(bodyId);
      if (bodyDiv) {
        const isHidden = bodyDiv.style.display === 'none';
        bodyDiv.style.display = isHidden ? 'block' : 'none';
        this.textContent = isHidden ? '▼' : '▶';
      }
    }
  }, '▼');

  const bodyDiv = el('div', {
    id: bodyId,
    className: 'card-body'
  }, [
    el('p', { style: { color: '#6B7280', marginBottom: '16px', fontSize: '14px' } },
      'Définit les procédures applicables selon les seuils de montant et le type d\'autorité contractante'
    ),

    Object.entries(matrices).map(([typeAutorite, config]) =>
      el('div', { style: { marginBottom: '24px' } }, [
        el('h4', { style: { color: '#374151', marginBottom: '12px', fontSize: '16px', fontWeight: '600' } },
          config.description
        ),
        el('div', { style: { display: 'grid', gap: '8px' } },
          config.seuils_montants.map(seuil => renderProcedureCard(seuil))
        )
      ])
    )
  ]);

  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
      el('div', { style: { display: 'flex', alignItems: 'center' } }, [
        toggleBtn,
        el('h3', { className: 'card-title', style: { margin: 0 } }, 'Matrices des Procédures')
      ]),
      el('span', { className: 'badge badge-info' }, 'Réglementaire')
    ]),
    bodyDiv
  ]);
}

/**
 * Render procedure card
 */
function renderProcedureCard(seuil) {
  const formatMontant = (montant) => {
    if (montant === null) return 'Illimité';
    return `${(montant / 1000000).toFixed(0)}M XOF`;
  };

  return el('div', {
    style: `
      padding: 12px 16px;
      background: linear-gradient(135deg, #F9FAFB 0%, #FFFFFF 100%);
      border-left: 4px solid #3B82F6;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    `
  }, [
    el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' } }, [
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } }, [
        el('span', {
          className: 'badge',
          style: 'background: #3B82F6; color: white; font-weight: 600; padding: 4px 10px; font-size: 12px;'
        }, seuil.mode),
        el('strong', { style: { color: '#374151', fontSize: '14px' } }, seuil.label)
      ]),
      el('span', {
        style: 'color: #6B7280; font-size: 13px; font-weight: 600;'
      }, `${formatMontant(seuil.min)} ${seuil.max !== null ? '→ ' + formatMontant(seuil.max) : '+'}`)
    ]),
    el('p', {
      style: 'margin: 8px 0 0 0; color: #6B7280; font-size: 13px; line-height: 1.5;'
    }, seuil.description)
  ]);
}

/**
 * Section Contextualité des Procédures
 */
function renderSectionContextualite() {
  const contextualite = rulesConfig.contextualite_procedures;
  const bodyId = 'section-body-contextualite';

  const toggleBtn = el('button', {
    className: 'btn btn-sm',
    style: 'padding: 4px 8px; margin-right: 12px; background: transparent; border: none; cursor: pointer; font-size: 18px;',
    onclick: function() {
      const bodyDiv = document.getElementById(bodyId);
      if (bodyDiv) {
        const isHidden = bodyDiv.style.display === 'none';
        bodyDiv.style.display = isHidden ? 'block' : 'none';
        this.textContent = isHidden ? '▼' : '▶';
      }
    }
  }, '▼');

  const bodyDiv = el('div', {
    id: bodyId,
    className: 'card-body'
  }, [
    el('p', { style: { color: '#6B7280', marginBottom: '16px', fontSize: '14px' } },
      'Champs requis, optionnels et masqués selon le type de procédure et la phase du cycle de vie'
    ),

    el('div', { style: { display: 'grid', gap: '16px' } },
      Object.entries(contextualite).map(([modePassation, config]) =>
        renderContextualiteCard(modePassation, config)
      )
    )
  ]);

  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
      el('div', { style: { display: 'flex', alignItems: 'center' } }, [
        toggleBtn,
        el('h3', { className: 'card-title', style: { margin: 0 } }, 'Exigences Contextuelles par Procédure')
      ]),
      el('span', { className: 'badge badge-secondary' }, `${Object.keys(contextualite).length} procédure(s)`)
    ]),
    bodyDiv
  ]);
}

/**
 * Render contextualite card
 */
function renderContextualiteCard(modePassation, config) {
  const phases = config.phases || {};
  const phaseList = Object.keys(phases);

  return el('div', {
    style: `
      padding: 16px;
      background: white;
      border: 2px solid #E5E7EB;
      border-radius: 10px;
      transition: all 0.2s ease;
    `
  }, [
    el('div', { style: { marginBottom: '12px' } }, [
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' } }, [
        el('span', {
          className: 'badge',
          style: 'background: #3B82F6; color: white; font-weight: 700; padding: 6px 12px; font-size: 13px;'
        }, modePassation),
        el('strong', { style: { color: '#374151', fontSize: '15px' } }, config.label)
      ]),
      el('p', {
        style: 'margin: 4px 0 0 0; color: #6B7280; font-size: 13px;'
      }, `Phases configurées: ${phaseList.join(', ')}`)
    ]),

    // Liste des phases
    el('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
      phaseList.map(phase => {
        const phaseConfig = phases[phase];
        const nbRequis = phaseConfig.champs_requis?.length || 0;
        const nbOptionnels = phaseConfig.champs_optionnels?.length || 0;

        return el('div', {
          style: `
            padding: 6px 12px;
            background: #F3F4F6;
            border-radius: 6px;
            font-size: 12px;
            color: #374151;
            font-weight: 500;
          `
        }, `${phase}: ${nbRequis}R / ${nbOptionnels}O`);
      })
    ),

    el('div', { style: { marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #F3F4F6' } }, [
      el('button', {
        className: 'btn btn-sm btn-secondary',
        style: 'font-size: 12px; padding: 6px 12px;',
        onclick: () => showContextDetails(modePassation, config)
      }, '🔍 Voir détails')
    ])
  ]);
}

/**
 * Show context details in modal/alert
 */
function showContextDetails(mode, config) {
  const phases = config.phases || {};
  let details = `📋 ${config.label} (${mode})\n\n`;

  Object.entries(phases).forEach(([phase, phaseConfig]) => {
    details += `━━━ ${phase} ━━━\n`;
    details += `Requis: ${phaseConfig.champs_requis?.join(', ') || 'Aucun'}\n`;
    details += `Optionnels: ${phaseConfig.champs_optionnels?.join(', ') || 'Aucun'}\n`;
    details += `Masqués: ${phaseConfig.champs_caches?.join(', ') || 'Aucun'}\n\n`;
  });

  alert(details);
}

export default renderRegles;
