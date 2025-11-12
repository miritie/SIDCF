/* ============================================
   ECR04A - Visa Contrôle Financier
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { renderSteps } from '../../../ui/widgets/steps.js';
import logger from '../../../lib/logger.js';

function createButton(className, text, onClick) {
  const btn = el('button', { className }, text);
  btn.addEventListener('click', onClick);
  return btn;
}

export async function renderVisaCF(params) {
  const { idOperation } = params;

  if (!idOperation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'ID opération manquant')
    ]));
    return;
  }

  // Load data
  const fullData = await dataService.getOperationFull(idOperation);
  if (!fullData?.operation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'Opération non trouvée')
    ]));
    return;
  }

  const { operation, attribution } = fullData;
  const registries = dataService.getAllRegistries();

  // Check if attribution completed
  if (!operation.timeline.includes('ATTR')) {
    mount('#app', el('div', { className: 'page' }, [
      renderSteps(fullData, idOperation),
      el('div', { className: 'alert alert-warning' }, [
        el('div', { className: 'alert-icon' }, '⚠️'),
        el('div', { className: 'alert-content' }, [
          el('div', { className: 'alert-title' }, 'Étape Attribution non complétée'),
          el('div', { className: 'alert-message' }, 'Vous devez d\'abord compléter l\'attribution avant le visa CF.')
        ])
      ]),
      el('div', { style: { marginTop: '16px' } }, [
        createButton('btn btn-primary', '← Retour', () => router.navigate('/fiche-marche', { idOperation }))
      ])
    ]));
    return;
  }

  // State for form
  let decisionCF = attribution?.decisionCF?.etat || '';
  let motifRefus = attribution?.decisionCF?.motifRef || '';
  let commentaireCF = attribution?.decisionCF?.commentaire || '';
  let dateCF = attribution?.dates?.decisionCF || '';
  let documentVisa = null; // For file upload

  const page = el('div', { className: 'page' }, [
    // Timeline
    renderSteps(fullData, idOperation),

    // Header
    el('div', { className: 'page-header' }, [
      createButton('btn btn-secondary btn-sm', '← Retour fiche', () => router.navigate('/fiche-marche', { idOperation })),
      el('h1', { className: 'page-title', style: { marginTop: '12px' } }, 'Visa Contrôle Financier'),
      el('p', { className: 'page-subtitle' }, operation.objet)
    ]),

    // Attribution summary
    renderAttributionSummary(operation, attribution),

    // CF Decision form
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Décision du Contrôle Financier')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
          el('label', { className: 'form-label' }, [
            'Décision',
            el('span', { className: 'required' }, '*')
          ]),
          createDecisionSelect(registries.DECISION_CF, decisionCF, (value) => {
            decisionCF = value;
            updateMotifRefusField(value);
          })
        ]),

        // Motif refus (shown dynamically if REFUS)
        el('div', { id: 'motif-refus-container' }),

        el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
          el('label', { className: 'form-label' }, 'Commentaire / Observations'),
          el('textarea', {
            className: 'form-input',
            id: 'commentaire-cf',
            rows: 4,
            placeholder: 'Observations du Contrôle Financier...',
            value: commentaireCF
          })
        ]),

        el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
          el('label', { className: 'form-label' }, [
            'Date de décision',
            el('span', { className: 'required' }, '*')
          ]),
          el('input', {
            type: 'date',
            className: 'form-input',
            id: 'date-cf',
            value: dateCF || new Date().toISOString().split('T')[0]
          })
        ]),

        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Document de visa (PDF)'),
          el('input', {
            type: 'file',
            className: 'form-input',
            id: 'document-visa',
            accept: '.pdf'
          })
        ])
      ])
    ]),

    // Info box
    el('div', { className: 'card', style: { marginBottom: '24px', borderColor: 'var(--color-info)' } }, [
      el('div', { className: 'card-body' }, [
        el('div', { className: 'alert alert-info' }, [
          el('div', { className: 'alert-icon' }, 'ℹ️'),
          el('div', { className: 'alert-content' }, [
            el('div', { className: 'alert-title' }, 'Information importante'),
            el('div', { className: 'alert-message' }, [
              el('p', {}, 'Les décisions possibles sont :'),
              el('ul', { style: { marginTop: '8px', paddingLeft: '20px' } }, [
                el('li', {}, el('strong', {}, 'VISA') + ' : Marché approuvé, l\'exécution peut commencer (émission d\'OS)'),
                el('li', {}, el('strong', {}, 'RESERVE') + ' : Observations à lever avant validation définitive'),
                el('li', {}, el('strong', {}, 'REFUS') + ' : Marché non conforme, procédure à reprendre')
              ])
            ])
          ])
        ])
      ])
    ]),

    // Actions
    el('div', { className: 'card' }, [
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } }, [
          createButton('btn btn-secondary', 'Annuler', () => router.navigate('/fiche-marche', { idOperation })),
          createButton('btn btn-primary', 'Enregistrer Décision', async () => {
            await handleSave(idOperation, decisionCF, motifRefus, commentaireCF, dateCF, documentVisa);
          })
        ])
      ])
    ])
  ]);

  mount('#app', page);

  // Initial render
  if (decisionCF) {
    updateMotifRefusField(decisionCF);
  }
}

/**
 * Render attribution summary
 */
function renderAttributionSummary(operation, attribution) {
  if (!attribution) {
    return el('div', { className: 'alert alert-warning', style: { marginBottom: '24px' } }, [
      el('div', { className: 'alert-icon' }, '⚠️'),
      el('div', { className: 'alert-content' }, [
        el('div', { className: 'alert-title' }, 'Aucune attribution enregistrée'),
        el('div', { className: 'alert-message' }, 'Complétez d\'abord l\'attribution du marché.')
      ])
    ]);
  }

  const isSimple = attribution.attributaire?.singleOrGroup === 'SIMPLE';
  const attributaireName = isSimple
    ? attribution.attributaire.entreprises?.[0]?.raisonSociale || 'N/A'
    : attribution.attributaire.entreprises?.find(e => e.role === 'MANDATAIRE')?.raisonSociale || 'N/A';

  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, 'Résumé de l\'attribution')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
        renderField('Attributaire', attributaireName),
        renderField('Type', isSimple ? 'Entreprise seule' : 'Groupement'),
        renderField('Montant HT', `${(attribution.montants?.ht / 1000000).toFixed(2)}M XOF`),
        renderField('Montant TTC', `${(attribution.montants?.ttc / 1000000).toFixed(2)}M XOF`),
        renderField('Délai', `${attribution.delaiExecution || 0} ${attribution.delaiUnite || 'MOIS'}`)
      ])
    ])
  ]);
}

function renderField(label, value) {
  return el('div', {}, [
    el('div', { className: 'text-small text-muted' }, label),
    el('div', { style: { fontWeight: '500', marginTop: '4px' } }, String(value || '-'))
  ]);
}

/**
 * Create decision selection dropdown
 */
function createDecisionSelect(decisions, selectedValue, onChange) {
  const select = el('select', { className: 'form-input', id: 'decision-cf' });

  // Empty option
  const emptyOption = el('option', { value: '' }, '-- Sélectionnez une décision --');
  select.appendChild(emptyOption);

  // Decision options
  decisions.forEach(decision => {
    const option = el('option', { value: decision.code }, decision.label);
    if (decision.code === selectedValue) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  select.addEventListener('change', (e) => {
    onChange(e.target.value);
  });

  return select;
}

/**
 * Update motif refus field visibility
 */
function updateMotifRefusField(decision) {
  const container = document.getElementById('motif-refus-container');
  if (!container) return;

  container.innerHTML = '';

  if (decision === 'REFUS') {
    const field = el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
      el('label', { className: 'form-label' }, [
        'Motif du refus',
        el('span', { className: 'required' }, '*')
      ]),
      el('select', { className: 'form-input', id: 'motif-refus' }, [
        el('option', { value: '' }, '-- Sélectionnez un motif --'),
        el('option', { value: 'NON_CONFORME_REGLEMENTATION' }, 'Non conforme à la réglementation'),
        el('option', { value: 'PROCEDURE_IRREGULIERE' }, 'Procédure irrégulière'),
        el('option', { value: 'MONTANT_NON_JUSTIFIE' }, 'Montant non justifié'),
        el('option', { value: 'ATTRIBUTION_NON_CONFORME' }, 'Attribution non conforme'),
        el('option', { value: 'ABSENCE_CREDIT_BUDGETAIRE' }, 'Absence de crédit budgétaire'),
        el('option', { value: 'AUTRE' }, 'Autre motif (préciser en commentaire)')
      ])
    ]);

    container.appendChild(field);
  } else if (decision === 'RESERVE') {
    const alert = el('div', { className: 'alert alert-warning', style: { marginBottom: '16px' } }, [
      el('div', { className: 'alert-icon' }, '⚠️'),
      el('div', { className: 'alert-content' }, [
        el('div', { className: 'alert-title' }, 'Décision avec réserves'),
        el('div', { className: 'alert-message' }, 'Précisez les observations à lever dans le champ commentaire ci-dessous.')
      ])
    ]);

    container.appendChild(alert);
  } else if (decision === 'VISA') {
    const alert = el('div', { className: 'alert alert-success', style: { marginBottom: '16px' } }, [
      el('div', { className: 'alert-icon' }, '✅'),
      el('div', { className: 'alert-content' }, [
        el('div', { className: 'alert-title' }, 'Visa accordé'),
        el('div', { className: 'alert-message' }, 'Le marché pourra être mis en exécution (émission d\'ordre de service).')
      ])
    ]);

    container.appendChild(alert);
  }
}

/**
 * Handle save
 */
async function handleSave(idOperation, decisionCF, motifRefus, commentaireCF, dateCF, documentVisa) {
  // Validation
  if (!decisionCF) {
    alert('⚠️ Veuillez sélectionner une décision');
    return;
  }

  const dateCFInput = document.getElementById('date-cf');
  const dateCFValue = dateCFInput?.value;

  if (!dateCFValue) {
    alert('⚠️ Veuillez saisir une date de décision');
    return;
  }

  if (decisionCF === 'REFUS') {
    const motifRefusSelect = document.getElementById('motif-refus');
    motifRefus = motifRefusSelect?.value;

    if (!motifRefus) {
      alert('⚠️ Veuillez sélectionner un motif de refus');
      return;
    }
  }

  const commentaireCFInput = document.getElementById('commentaire-cf');
  const commentaireCFValue = commentaireCFInput?.value || '';

  // Handle document upload (simulate)
  const docInput = document.getElementById('document-visa');
  if (docInput?.files?.[0]) {
    documentVisa = 'DOC_VISA_' + Date.now() + '.pdf';
    logger.info('[Visa CF] Document visa uploadé:', documentVisa);
  }

  // Update attribution with CF decision
  const attributionId = `ATTR-${idOperation}`;
  const attribution = await dataService.get(ENTITIES.ATTRIBUTION, attributionId);

  if (!attribution) {
    alert('❌ Attribution non trouvée');
    return;
  }

  const updateAttr = {
    decisionCF: {
      etat: decisionCF,
      motifRef: motifRefus || null,
      commentaire: commentaireCFValue
    },
    dates: {
      ...attribution.dates,
      decisionCF: dateCFValue
    },
    documentVisa: documentVisa || attribution.documentVisa || null,
    updatedAt: new Date().toISOString()
  };

  const attrResult = await dataService.update(ENTITIES.ATTRIBUTION, attributionId, updateAttr);

  if (!attrResult.success) {
    alert('❌ Erreur lors de la mise à jour de l\'attribution');
    return;
  }

  // Update operation timeline
  const operation = await dataService.get(ENTITIES.OPERATION, idOperation);
  const updateOp = {
    decisionCF: decisionCF,
    dateCF: dateCFValue
  };

  if (decisionCF === 'VISA' && !operation.timeline.includes('VISE')) {
    updateOp.timeline = [...operation.timeline, 'VISE'];
    updateOp.etat = 'VISE';
  } else if (decisionCF === 'REFUS') {
    updateOp.etat = 'REFUSE';
  } else if (decisionCF === 'RESERVE') {
    updateOp.etat = 'EN_RESERVE';
  }

  const opResult = await dataService.update(ENTITIES.OPERATION, idOperation, updateOp);

  if (opResult.success) {
    logger.info('[Visa CF] Décision enregistrée avec succès');

    const icon = decisionCF === 'VISA' ? '✅' : decisionCF === 'RESERVE' ? '⚠️' : '🚫';
    alert(`${icon} Décision CF enregistrée: ${decisionCF}`);

    router.navigate('/fiche-marche', { idOperation });
  } else {
    alert('❌ Erreur lors de la mise à jour de l\'opération');
  }
}

export default renderVisaCF;
