/* ============================================
   ECR02A - Procédure & Choix Mode de Passation
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

export async function renderProcedurePV(params) {
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

  const { operation, procedure } = fullData;
  const registries = dataService.getAllRegistries();

  // Get suggested procedures based on rules
  const suggestedProcedures = dataService.getSuggestedProcedures(operation);
  const suggestedCodes = suggestedProcedures.map(p => p.mode);

  // Check if current mode is a derogation
  const isDerogation = operation.modePassation && !suggestedCodes.includes(operation.modePassation);

  // State for form
  let selectedMode = operation.modePassation || '';
  let derogationJustif = operation.procDerogation?.docId || null;
  let derogationComment = operation.procDerogation?.comment || '';

  const page = el('div', { className: 'page' }, [
    // Timeline
    renderSteps(fullData, idOperation),

    // Header
    el('div', { className: 'page-header' }, [
      createButton('btn btn-secondary btn-sm', '← Retour fiche', () => router.navigate('/fiche-marche', { idOperation })),
      el('h1', { className: 'page-title', style: { marginTop: '12px' } }, 'Procédure & Mode de Passation'),
      el('p', { className: 'page-subtitle' }, operation.objet)
    ]),

    // Suggested procedures alert
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '💡 Procédures admissibles (selon règles)')
      ]),
      el('div', { className: 'card-body' }, [
        suggestedProcedures.length > 0
          ? el('div', { className: 'alert alert-info' }, [
              el('div', { className: 'alert-icon' }, 'ℹ️'),
              el('div', { className: 'alert-content' }, [
                el('div', { className: 'alert-title' }, 'Barème applicable'),
                el('div', { className: 'alert-message' }, [
                  el('p', {}, `Type institution: ${operation.typeInstitution || 'ADMIN_CENTRALE'}`),
                  el('p', {}, `Montant: ${(operation.montantPrevisionnel / 1000000).toFixed(1)}M XOF`),
                  el('p', { style: { fontWeight: '600', marginTop: '8px' } }, 'Procédures admissibles:'),
                  el('ul', { style: { marginTop: '8px', paddingLeft: '20px' } },
                    suggestedProcedures.map(p =>
                      el('li', {}, `${p.mode} (${registries.MODE_PASSATION.find(m => m.code === p.mode)?.label || p.mode})`)
                    )
                  )
                ])
              ])
            ])
          : el('div', { className: 'alert alert-warning' }, [
              el('div', { className: 'alert-icon' }, '⚠️'),
              el('div', { className: 'alert-content' }, [
                el('div', { className: 'alert-title' }, 'Aucune règle trouvée'),
                el('div', { className: 'alert-message' }, 'Vérifiez la configuration des barèmes dans rules-config.json')
              ])
            ])
      ])
    ]),

    // Mode selection form
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Mode de passation')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, [
            'Mode de passation',
            el('span', { className: 'required' }, '*')
          ]),
          createModeSelect(registries.MODE_PASSATION, selectedMode, (value) => {
            selectedMode = value;
            updateDerogationAlert(value, suggestedCodes);
          })
        ])
      ])
    ]),

    // Derogation alert (shown dynamically)
    el('div', { id: 'derogation-alert-container' }),

    // Procedure details (if exists)
    procedure ? renderProcedureDetails(procedure, registries) : null,

    // Actions
    el('div', { className: 'card' }, [
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } }, [
          createButton('btn btn-secondary', 'Annuler', () => router.navigate('/fiche-marche', { idOperation })),
          createButton('btn btn-primary', 'Enregistrer & Continuer', async () => {
            await handleSave(idOperation, selectedMode, derogationJustif, derogationComment, suggestedCodes);
          })
        ])
      ])
    ])
  ]);

  mount('#app', page);

  // Initial derogation check
  if (selectedMode) {
    updateDerogationAlert(selectedMode, suggestedCodes);
  }
}

/**
 * Create mode selection dropdown
 */
function createModeSelect(modes, selectedValue, onChange) {
  const select = el('select', { className: 'form-input' });

  // Empty option
  const emptyOption = el('option', { value: '' }, '-- Sélectionnez un mode --');
  select.appendChild(emptyOption);

  // Mode options
  modes.forEach(mode => {
    const option = el('option', { value: mode.code }, mode.label);
    if (mode.code === selectedValue) {
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
 * Update derogation alert based on selected mode
 */
function updateDerogationAlert(selectedMode, suggestedCodes) {
  const container = document.getElementById('derogation-alert-container');
  if (!container) return;

  container.innerHTML = '';

  if (!selectedMode) return;

  const isDerogation = !suggestedCodes.includes(selectedMode);

  if (isDerogation) {
    const alert = el('div', { className: 'card', style: { marginBottom: '24px', borderColor: 'var(--color-error)' } }, [
      el('div', { className: 'card-header', style: { background: 'var(--color-error-100)' } }, [
        el('h3', { className: 'card-title', style: { color: 'var(--color-error-700)' } }, [
          el('span', {}, '⚠️ DÉROGATION DÉTECTÉE')
        ])
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { className: 'alert alert-error' }, [
          el('div', { className: 'alert-icon' }, '🚫'),
          el('div', { className: 'alert-content' }, [
            el('div', { className: 'alert-title' }, 'Procédure non conforme au barème'),
            el('div', { className: 'alert-message' }, [
              el('p', {}, 'Le mode de passation sélectionné ne figure pas dans la liste des procédures admissibles.'),
              el('p', { style: { marginTop: '8px', fontWeight: '600' } }, 'Un document justificatif est OBLIGATOIRE pour continuer.')
            ])
          ])
        ]),

        el('div', { className: 'form-field', style: { marginTop: '16px' } }, [
          el('label', { className: 'form-label' }, [
            'Document justificatif (décision, note, etc.)',
            el('span', { className: 'required' }, '*')
          ]),
          el('input', {
            type: 'file',
            className: 'form-input',
            id: 'derogation-doc',
            accept: '.pdf,.doc,.docx'
          })
        ]),

        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Commentaire / Motif'),
          el('textarea', {
            className: 'form-input',
            id: 'derogation-comment',
            rows: 3,
            placeholder: 'Expliquez les raisons de cette dérogation...'
          })
        ])
      ])
    ]);

    container.appendChild(alert);
  }
}

/**
 * Render existing procedure details
 */
function renderProcedureDetails(procedure, registries) {
  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, 'Détails de la procédure')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
        renderField('Commission', procedure.commission),
        renderField('Catégorie', procedure.categorie),
        renderField('Offres reçues', procedure.nbOffresRecues),
        renderField('Offres classées', procedure.nbOffresClassees),
        renderField('Date ouverture', procedure.dates?.ouverture ? new Date(procedure.dates.ouverture).toLocaleDateString() : '-'),
        renderField('Date analyse', procedure.dates?.analyse ? new Date(procedure.dates.analyse).toLocaleDateString() : '-'),
        renderField('Date jugement', procedure.dates?.jugement ? new Date(procedure.dates.jugement).toLocaleDateString() : '-')
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
 * Handle save
 */
async function handleSave(idOperation, selectedMode, derogationJustif, derogationComment, suggestedCodes) {
  if (!selectedMode) {
    alert('Veuillez sélectionner un mode de passation');
    return;
  }

  const isDerogation = !suggestedCodes.includes(selectedMode);

  // Check derogation document if needed
  if (isDerogation) {
    const docInput = document.getElementById('derogation-doc');
    const commentInput = document.getElementById('derogation-comment');

    if (!docInput?.files?.[0] && !derogationJustif) {
      alert('⚠️ Un document justificatif est obligatoire pour une dérogation');
      return;
    }

    // Simulate doc upload (in real app, upload to server/storage)
    if (docInput?.files?.[0]) {
      derogationJustif = 'DOC_DEROG_' + Date.now() + '.pdf';
      logger.info('[Procedure] Document dérogation uploadé:', derogationJustif);
    }

    derogationComment = commentInput?.value || '';
  }

  // Update operation
  const updateData = {
    modePassation: selectedMode,
    procDerogation: isDerogation ? {
      isDerogation: true,
      docId: derogationJustif,
      comment: derogationComment,
      validatedAt: new Date().toISOString()
    } : null
  };

  // Add PROC to timeline if not present
  const operation = await dataService.get(ENTITIES.OPERATION, idOperation);
  if (!operation.timeline.includes('PROC')) {
    updateData.timeline = [...operation.timeline, 'PROC'];
    updateData.etat = 'EN_PROC';
  }

  const result = await dataService.update(ENTITIES.OPERATION, idOperation, updateData);

  if (result.success) {
    logger.info('[Procedure] Opération mise à jour avec succès');
    alert('✅ Mode de passation enregistré' + (isDerogation ? ' (avec dérogation)' : ''));
    router.navigate('/fiche-marche', { idOperation });
  } else {
    alert('❌ Erreur lors de la sauvegarde');
  }
}

export default renderProcedurePV;
