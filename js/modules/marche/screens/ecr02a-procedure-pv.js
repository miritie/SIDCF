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

    // Procedure details form
    renderProcedureDetailsForm(procedure, operation, registries),

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
 * Render procedure details form (editable)
 */
function renderProcedureDetailsForm(procedure, operation, registries) {
  const existingProc = procedure || {};

  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '📋 Détails de la procédure')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [

        // Type de commission
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, ['Type de commission', el('span', { className: 'required' }, '*')]),
          el('select', { className: 'form-input', id: 'proc-commission', required: true }, [
            el('option', { value: '' }, '-- Sélectionner --'),
            ...(registries.TYPE_COMMISSION || []).map(c =>
              el('option', { value: c.code, selected: c.code === existingProc.commission }, c.label)
            )
          ]),
          el('small', { className: 'text-muted' }, 'COJO pour Admin Centrale, COPE pour projets/collectivités')
        ]),

        // Catégorie procédure
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, ['Catégorie', el('span', { className: 'required' }, '*')]),
          el('select', { className: 'form-input', id: 'proc-categorie', required: true }, [
            el('option', { value: '' }, '-- Sélectionner --'),
            ...(registries.CATEGORIE_PROCEDURE || []).map(cat =>
              el('option', { value: cat.code, selected: cat.code === existingProc.categorie }, cat.label)
            )
          ])
        ]),

        // Type dossier d'appel
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Type de dossier d\'appel'),
          el('select', { className: 'form-input', id: 'proc-type-dossier' }, [
            el('option', { value: '' }, '-- Sélectionner --'),
            ...(registries.TYPE_DOSSIER_APPEL || []).map(d =>
              el('option', { value: d.code, selected: d.code === existingProc.typeDossierAppel }, d.label)
            )
          ]),
          el('small', { className: 'text-muted' }, 'DAO, AMI, DPI, etc.')
        ]),

        // Upload dossier d'appel
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Document dossier d\'appel'),
          el('input', {
            type: 'file',
            className: 'form-input',
            id: 'proc-dossier-doc',
            accept: '.pdf,.doc,.docx,.zip'
          }),
          existingProc.dossierAppelDoc ? el('small', { className: 'text-success' }, `✓ ${existingProc.dossierAppelDoc}`) : null
        ]),

        // Nombre d'offres reçues
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Nombre d\'offres reçues'),
          el('input', {
            type: 'number',
            className: 'form-input',
            id: 'proc-nb-offres-recues',
            min: 0,
            value: existingProc.nbOffresRecues || 0
          })
        ]),

        // Nombre d'offres classées
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Nombre d\'offres classées'),
          el('input', {
            type: 'number',
            className: 'form-input',
            id: 'proc-nb-offres-classees',
            min: 0,
            value: existingProc.nbOffresClassees || 0
          })
        ])
      ]),

      // Dates section (avec validation chronologique)
      el('div', { style: { marginTop: '24px', marginBottom: '8px', borderTop: '1px solid var(--color-gray-200)', paddingTop: '16px' } }, [
        el('strong', {}, '📅 Dates chronologiques de la procédure')
      ]),

      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' } }, [
        // Date ouverture
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Date ouverture'),
          el('input', {
            type: 'date',
            className: 'form-input',
            id: 'proc-date-ouverture',
            value: existingProc.dates?.ouverture ? existingProc.dates.ouverture.split('T')[0] : ''
          })
        ]),

        // Date analyse
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Date analyse'),
          el('input', {
            type: 'date',
            className: 'form-input',
            id: 'proc-date-analyse',
            value: existingProc.dates?.analyse ? existingProc.dates.analyse.split('T')[0] : ''
          }),
          el('small', { className: 'text-muted' }, '≥ Date ouverture')
        ]),

        // Date jugement
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Date jugement'),
          el('input', {
            type: 'date',
            className: 'form-input',
            id: 'proc-date-jugement',
            value: existingProc.dates?.jugement ? existingProc.dates.jugement.split('T')[0] : ''
          }),
          el('small', { className: 'text-muted' }, '≥ Date analyse')
        ])
      ]),

      // PV section
      el('div', { style: { marginTop: '24px', marginBottom: '8px', borderTop: '1px solid var(--color-gray-200)', paddingTop: '16px' } }, [
        el('strong', {}, '📄 Procès-verbaux (PV)')
      ]),

      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' } }, [
        // PV Ouverture
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'PV Ouverture'),
          el('input', {
            type: 'file',
            className: 'form-input',
            id: 'proc-pv-ouverture',
            accept: '.pdf,.doc,.docx'
          }),
          existingProc.pv?.ouverture ? el('small', { className: 'text-success' }, `✓ ${existingProc.pv.ouverture}`) : null
        ]),

        // PV Analyse
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'PV Analyse'),
          el('input', {
            type: 'file',
            className: 'form-input',
            id: 'proc-pv-analyse',
            accept: '.pdf,.doc,.docx'
          }),
          existingProc.pv?.analyse ? el('small', { className: 'text-success' }, `✓ ${existingProc.pv.analyse}`) : null
        ]),

        // PV Jugement
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'PV Jugement'),
          el('input', {
            type: 'file',
            className: 'form-input',
            id: 'proc-pv-jugement',
            accept: '.pdf,.doc,.docx'
          }),
          existingProc.pv?.jugement ? el('small', { className: 'text-success' }, `✓ ${existingProc.pv.jugement}`) : null
        ])
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

  // Collect procedure details
  const commission = document.getElementById('proc-commission')?.value;
  const categorie = document.getElementById('proc-categorie')?.value;
  const typeDossierAppel = document.getElementById('proc-type-dossier')?.value || null;
  const nbOffresRecues = Number(document.getElementById('proc-nb-offres-recues')?.value) || 0;
  const nbOffresClassees = Number(document.getElementById('proc-nb-offres-classees')?.value) || 0;

  // Dates (with chronological validation)
  const dateOuverture = document.getElementById('proc-date-ouverture')?.value || null;
  const dateAnalyse = document.getElementById('proc-date-analyse')?.value || null;
  const dateJugement = document.getElementById('proc-date-jugement')?.value || null;

  // Validation chronologique
  if (dateOuverture && dateAnalyse && new Date(dateAnalyse) < new Date(dateOuverture)) {
    alert('⚠️ La date d\'analyse ne peut pas être antérieure à la date d\'ouverture');
    return;
  }

  if (dateAnalyse && dateJugement && new Date(dateJugement) < new Date(dateAnalyse)) {
    alert('⚠️ La date de jugement ne peut pas être antérieure à la date d\'analyse');
    return;
  }

  // Documents (simulate upload)
  let dossierAppelDoc = null;
  let pvOuverture = null;
  let pvAnalyse = null;
  let pvJugement = null;

  const dossierInput = document.getElementById('proc-dossier-doc');
  const pvOuvertureInput = document.getElementById('proc-pv-ouverture');
  const pvAnalyseInput = document.getElementById('proc-pv-analyse');
  const pvJugementInput = document.getElementById('proc-pv-jugement');

  if (dossierInput?.files?.[0]) {
    dossierAppelDoc = 'DOSSIER_' + Date.now() + '.pdf';
    logger.info('[Procedure] Dossier d\'appel uploadé:', dossierAppelDoc);
  }

  if (pvOuvertureInput?.files?.[0]) {
    pvOuverture = 'PV_OUVERTURE_' + Date.now() + '.pdf';
    logger.info('[Procedure] PV ouverture uploadé:', pvOuverture);
  }

  if (pvAnalyseInput?.files?.[0]) {
    pvAnalyse = 'PV_ANALYSE_' + Date.now() + '.pdf';
    logger.info('[Procedure] PV analyse uploadé:', pvAnalyse);
  }

  if (pvJugementInput?.files?.[0]) {
    pvJugement = 'PV_JUGEMENT_' + Date.now() + '.pdf';
    logger.info('[Procedure] PV jugement uploadé:', pvJugement);
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

  const operationResult = await dataService.update(ENTITIES.OPERATION, idOperation, updateData);

  if (!operationResult.success) {
    alert('❌ Erreur lors de la mise à jour de l\'opération');
    return;
  }

  // Create or update procedure
  const existingProcedure = await dataService.getByField(ENTITIES.PROCEDURE, 'operationId', idOperation);

  const procedureData = {
    operationId: idOperation,
    commission: commission || 'COJO',
    modePassation: selectedMode,
    categorie: categorie || 'NATIONALE',
    typeDossierAppel,
    dossierAppelDoc: dossierAppelDoc || existingProcedure?.dossierAppelDoc || null,
    dates: {
      ouverture: dateOuverture || null,
      analyse: dateAnalyse || null,
      jugement: dateJugement || null
    },
    nbOffresRecues,
    nbOffresClassees,
    pv: {
      ouverture: pvOuverture || existingProcedure?.pv?.ouverture || null,
      analyse: pvAnalyse || existingProcedure?.pv?.analyse || null,
      jugement: pvJugement || existingProcedure?.pv?.jugement || null
    }
  };

  let procedureResult;
  if (existingProcedure) {
    procedureResult = await dataService.update(ENTITIES.PROCEDURE, existingProcedure.id, procedureData);
  } else {
    procedureResult = await dataService.create(ENTITIES.PROCEDURE, procedureData);
  }

  if (procedureResult.success) {
    logger.info('[Procedure] Procédure enregistrée avec succès');
    alert('✅ Procédure enregistrée' + (isDerogation ? ' (avec dérogation)' : ''));
    router.navigate('/fiche-marche', { idOperation });
  } else {
    alert('❌ Erreur lors de la sauvegarde de la procédure');
  }
}

export default renderProcedurePV;
