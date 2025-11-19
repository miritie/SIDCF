/* ============================================
   ECR02A - Procédure & Choix Mode de Passation
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { renderSteps } from '../../../ui/widgets/steps.js';
import logger from '../../../lib/logger.js';
import {
  hasSoumissionnairesManagement,
  hasLotsManagement,
  requiresCOJO,
  requiresDGMPValidation,
  requiresPublication,
  createProcedureInfoAlert
} from '../../../lib/procedure-context.js';
import { SoumissionnairesWidget } from '../../../widgets/soumissionnaires-widget.js';
import { LotsWidget } from '../../../widgets/lots-widget.js';

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

  // Widgets instances
  let soumissionnairesWidget = null;
  let lotsWidget = null;

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
            updateContextualSections(value, procedure);
          })
        ])
      ])
    ]),

    // Derogation alert (shown dynamically)
    el('div', { id: 'derogation-alert-container' }),

    // Contextual info alert (requirements based on mode)
    el('div', { id: 'contextual-info-container' }),

    // Procedure details form (dynamic based on mode)
    el('div', { id: 'procedure-details-container' }),

    // Soumissionnaires widget (contextual - shown for PSC, PSL, PSO, AOO, PI)
    el('div', { id: 'soumissionnaires-container' }),

    // Lots widget (contextual - shown for PSC+)
    el('div', { id: 'lots-container' }),

    // Actions
    el('div', { className: 'card' }, [
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } }, [
          createButton('btn btn-secondary', 'Annuler', () => router.navigate('/fiche-marche', { idOperation })),
          createButton('btn btn-primary', 'Enregistrer & Continuer', async () => {
            await handleSave(idOperation, selectedMode, derogationJustif, derogationComment, suggestedCodes, soumissionnairesWidget, lotsWidget);
          })
        ])
      ])
    ])
  ]);

  mount('#app', page);

  // Initial derogation check and contextual sections
  if (selectedMode) {
    updateDerogationAlert(selectedMode, suggestedCodes);
    updateContextualSections(selectedMode, procedure);
  }

  /**
   * Update contextual sections based on selected mode
   */
  function updateContextualSections(mode, procedureData) {
    if (!mode) {
      // Hide all contextual sections
      document.getElementById('contextual-info-container').innerHTML = '';
      document.getElementById('procedure-details-container').innerHTML = '';
      document.getElementById('soumissionnaires-container').innerHTML = '';
      document.getElementById('lots-container').innerHTML = '';
      return;
    }

    // Render procedure details form based on mode
    const detailsContainer = document.getElementById('procedure-details-container');
    detailsContainer.innerHTML = '';
    const detailsForm = renderProcedureDetailsForm(procedureData, operation, registries, mode);
    if (detailsForm) {
      detailsContainer.appendChild(detailsForm);
    }

    // Display contextual info alert
    const infoContainer = document.getElementById('contextual-info-container');
    const infoAlert = createProcedureInfoAlert(mode);
    infoContainer.innerHTML = '';
    if (infoAlert) {
      const card = el('div', { className: 'card', style: { marginBottom: '24px', borderColor: '#0dcaf0' } }, [
        el('div', { className: 'card-header', style: { background: '#cff4fc' } }, [
          el('h3', { className: 'card-title', style: { color: '#055160' } }, '📌 Exigences contextuelles')
        ]),
        el('div', { className: 'card-body' })
      ]);
      card.querySelector('.card-body').appendChild(infoAlert);
      infoContainer.appendChild(card);
    }

    // Soumissionnaires management
    const soumissionnairesContainer = document.getElementById('soumissionnaires-container');
    if (hasSoumissionnairesManagement(mode)) {
      soumissionnairesContainer.innerHTML = '';

      const card = el('div', { className: 'card', style: { marginBottom: '24px' } }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, '👥 Gestion des soumissionnaires')
        ]),
        el('div', { className: 'card-body' }, [
          el('div', { id: 'soumissionnaires-widget-root' })
        ])
      ]);

      soumissionnairesContainer.appendChild(card);

      // Initialize widget
      soumissionnairesWidget = new SoumissionnairesWidget('soumissionnaires-widget-root', {
        allowAdd: true,
        allowEdit: true,
        allowDelete: true,
        showBankInfo: true,
        showSanctionStatus: true,
        onChange: (soumissionnaires) => {
          logger.info('[Procedure] Soumissionnaires updated:', soumissionnaires);
          // Update lots widget with new soumissionnaires
          if (lotsWidget) {
            lotsWidget.setSoumissionnaires(soumissionnaires);
          }
        }
      });

      // Load existing data if available
      if (procedureData?.soumissionnaires) {
        soumissionnairesWidget.loadData(procedureData.soumissionnaires);
      }
    } else {
      soumissionnairesContainer.innerHTML = '';
      soumissionnairesWidget = null;
    }

    // Lots management
    const lotsContainer = document.getElementById('lots-container');
    if (hasLotsManagement(mode)) {
      lotsContainer.innerHTML = '';

      const card = el('div', { className: 'card', style: { marginBottom: '24px' } }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, '📦 Gestion des lots')
        ]),
        el('div', { className: 'card-body' }, [
          el('div', { id: 'lots-widget-root' })
        ])
      ]);

      lotsContainer.appendChild(card);

      // Initialize widget
      lotsWidget = new LotsWidget('lots-widget-root', {
        allowAdd: true,
        allowEdit: true,
        allowDelete: true,
        showLivrables: true,
        showSoumissionnaires: true,
        soumissionnaires: soumissionnairesWidget ? soumissionnairesWidget.getData() : [],
        onChange: (lots) => {
          logger.info('[Procedure] Lots updated:', lots);
        }
      });

      // Load existing data if available
      if (procedureData?.lots) {
        lotsWidget.loadData(procedureData.lots);
      }
    } else {
      lotsContainer.innerHTML = '';
      lotsWidget = null;
    }
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
 * Render procedure details form based on mode
 * - PSD: Simplified (devis + bon de commande)
 * - PSC: Comparaison de devis
 * - PSL/PSO/AOO/PI: Full form with COJO, dates, PV
 */
function renderProcedureDetailsForm(procedure, operation, registries, mode) {
  const existingProc = procedure || {};

  // PSD - Procédure Simplifiée d'Entente Directe
  if (mode === 'PSD' || mode === 'ENTENTE_DIRECTE') {
    return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '📋 Validation du devis')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { className: 'alert alert-info', style: { marginBottom: '16px' } }, [
          el('div', { className: 'alert-icon' }, 'ℹ️'),
          el('div', { className: 'alert-content' }, [
            el('div', { className: 'alert-title' }, 'Procédure simplifiée'),
            el('div', { className: 'alert-message' }, 'Pour les marchés < 10M XOF, une simple validation du devis suffit. Pas de commission ni de PV requis.')
          ])
        ]),

        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
          // Fournisseur sélectionné
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, ['Fournisseur', el('span', { className: 'required' }, '*')]),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'proc-fournisseur',
              placeholder: 'Nom du fournisseur',
              value: existingProc.fournisseurNom || ''
            })
          ]),

          // Référence devis
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, ['Référence devis', el('span', { className: 'required' }, '*')]),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'proc-ref-devis',
              placeholder: 'Ex: DEV-2024-001',
              value: existingProc.refDevis || ''
            })
          ]),

          // Date du devis
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Date du devis'),
            el('input', {
              type: 'date',
              className: 'form-input',
              id: 'proc-date-devis',
              value: existingProc.dateDevis ? existingProc.dateDevis.split('T')[0] : ''
            })
          ]),

          // Document devis
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, ['Document devis (PDF)', el('span', { className: 'required' }, '*')]),
            el('input', {
              type: 'file',
              className: 'form-input',
              id: 'proc-doc-devis',
              accept: '.pdf'
            }),
            existingProc.docDevis ? el('small', { className: 'text-success' }, `✓ ${existingProc.docDevis}`) : null
          ])
        ]),

        // Bon de commande
        el('div', { style: { marginTop: '24px', marginBottom: '8px', borderTop: '1px solid var(--color-gray-200)', paddingTop: '16px' } }, [
          el('strong', {}, '📄 Bon de commande')
        ]),

        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
          // Numéro BC
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Numéro bon de commande'),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'proc-num-bc',
              placeholder: 'Ex: BC-2024-001',
              value: existingProc.numBC || ''
            })
          ]),

          // Date BC
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Date émission'),
            el('input', {
              type: 'date',
              className: 'form-input',
              id: 'proc-date-bc',
              value: existingProc.dateBC ? existingProc.dateBC.split('T')[0] : ''
            })
          ]),

          // Document BC
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Document BC (PDF)'),
            el('input', {
              type: 'file',
              className: 'form-input',
              id: 'proc-doc-bc',
              accept: '.pdf'
            }),
            existingProc.docBC ? el('small', { className: 'text-success' }, `✓ ${existingProc.docBC}`) : null
          ])
        ])
      ])
    ]);
  }

  // PSC - Procédure Simplifiée de Cotation
  if (mode === 'PSC') {
    return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '📋 Comparaison de devis')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { className: 'alert alert-info', style: { marginBottom: '16px' } }, [
          el('div', { className: 'alert-icon' }, 'ℹ️'),
          el('div', { className: 'alert-content' }, [
            el('div', { className: 'alert-title' }, 'Procédure de cotation'),
            el('div', { className: 'alert-message' }, 'Pour les marchés entre 10M et 30M XOF, une comparaison d\'au moins 3 devis est requise. Pas de COJO formel.')
          ])
        ]),

        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
          // Nombre de fournisseurs consultés
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, ['Nombre de fournisseurs consultés', el('span', { className: 'required' }, '*')]),
            el('input', {
              type: 'number',
              className: 'form-input',
              id: 'proc-nb-fournisseurs',
              min: 3,
              value: existingProc.nbFournisseursConsultes || 3
            }),
            el('small', { className: 'text-muted' }, 'Minimum 3 fournisseurs')
          ]),

          // Nombre de devis reçus
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Nombre de devis reçus'),
            el('input', {
              type: 'number',
              className: 'form-input',
              id: 'proc-nb-devis-recus',
              min: 0,
              value: existingProc.nbDevisRecus || 0
            })
          ]),

          // Date comparaison
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Date de comparaison'),
            el('input', {
              type: 'date',
              className: 'form-input',
              id: 'proc-date-comparaison',
              value: existingProc.dateComparaison ? existingProc.dateComparaison.split('T')[0] : ''
            })
          ]),

          // Tableau comparatif
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, ['Tableau comparatif (PDF)', el('span', { className: 'required' }, '*')]),
            el('input', {
              type: 'file',
              className: 'form-input',
              id: 'proc-tableau-comparatif',
              accept: '.pdf,.xlsx,.xls'
            }),
            existingProc.tableauComparatif ? el('small', { className: 'text-success' }, `✓ ${existingProc.tableauComparatif}`) : null
          ])
        ]),

        // Note de sélection
        el('div', { style: { marginTop: '24px', marginBottom: '8px', borderTop: '1px solid var(--color-gray-200)', paddingTop: '16px' } }, [
          el('strong', {}, '📄 Note de sélection')
        ]),

        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
          // Fournisseur retenu
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, ['Fournisseur retenu', el('span', { className: 'required' }, '*')]),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'proc-fournisseur-retenu',
              placeholder: 'Nom du fournisseur sélectionné',
              value: existingProc.fournisseurRetenu || ''
            })
          ]),

          // Motif de sélection
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Motif de sélection'),
            el('select', { className: 'form-input', id: 'proc-motif-selection' }, [
              el('option', { value: 'MOINS_DISANT', selected: existingProc.motifSelection === 'MOINS_DISANT' }, 'Moins-disant'),
              el('option', { value: 'MIEUX_DISANT', selected: existingProc.motifSelection === 'MIEUX_DISANT' }, 'Mieux-disant'),
              el('option', { value: 'UNIQUE_REPONSE', selected: existingProc.motifSelection === 'UNIQUE_REPONSE' }, 'Unique réponse conforme')
            ])
          ]),

          // Note de sélection
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Note de sélection (PDF)'),
            el('input', {
              type: 'file',
              className: 'form-input',
              id: 'proc-note-selection',
              accept: '.pdf'
            }),
            existingProc.noteSelection ? el('small', { className: 'text-success' }, `✓ ${existingProc.noteSelection}`) : null
          ])
        ])
      ])
    ]);
  }

  // PSL, PSO, AOO, PI - Procédures avec COJO/COPE
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
async function handleSave(idOperation, selectedMode, derogationJustif, derogationComment, suggestedCodes, soumissionnairesWidget, lotsWidget) {
  if (!selectedMode) {
    alert('Veuillez sélectionner un mode de passation');
    return;
  }

  // Validate soumissionnaires if widget is active
  if (soumissionnairesWidget) {
    const soumValidation = soumissionnairesWidget.validate();
    if (!soumValidation.valid) {
      alert('⚠️ Validation soumissionnaires:\n\n' + soumValidation.errors.join('\n'));
      return;
    }
  }

  // Validate lots if widget is active
  if (lotsWidget) {
    const lotsValidation = lotsWidget.validate();
    if (!lotsValidation.valid) {
      alert('⚠️ Validation lots:\n\n' + lotsValidation.errors.join('\n'));
      return;
    }
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

  // Collect procedure details based on mode
  let procedureData = {
    operationId: idOperation,
    modePassation: selectedMode
  };

  // PSD / ENTENTE_DIRECTE - Simplified procedure
  if (selectedMode === 'PSD' || selectedMode === 'ENTENTE_DIRECTE') {
    const fournisseur = document.getElementById('proc-fournisseur')?.value?.trim();
    const refDevis = document.getElementById('proc-ref-devis')?.value?.trim();

    if (!fournisseur || !refDevis) {
      alert('⚠️ Le fournisseur et la référence du devis sont obligatoires');
      return;
    }

    procedureData = {
      ...procedureData,
      fournisseurNom: fournisseur,
      refDevis: refDevis,
      dateDevis: document.getElementById('proc-date-devis')?.value || null,
      docDevis: document.getElementById('proc-doc-devis')?.files?.[0] ? 'DEVIS_' + Date.now() + '.pdf' : null,
      numBC: document.getElementById('proc-num-bc')?.value?.trim() || null,
      dateBC: document.getElementById('proc-date-bc')?.value || null,
      docBC: document.getElementById('proc-doc-bc')?.files?.[0] ? 'BC_' + Date.now() + '.pdf' : null
    };
  }
  // PSC - Comparaison de devis
  else if (selectedMode === 'PSC') {
    const nbFournisseurs = Number(document.getElementById('proc-nb-fournisseurs')?.value) || 0;
    const fournisseurRetenu = document.getElementById('proc-fournisseur-retenu')?.value?.trim();

    if (nbFournisseurs < 3) {
      alert('⚠️ Minimum 3 fournisseurs doivent être consultés pour une PSC');
      return;
    }

    if (!fournisseurRetenu) {
      alert('⚠️ Le fournisseur retenu est obligatoire');
      return;
    }

    procedureData = {
      ...procedureData,
      nbFournisseursConsultes: nbFournisseurs,
      nbDevisRecus: Number(document.getElementById('proc-nb-devis-recus')?.value) || 0,
      dateComparaison: document.getElementById('proc-date-comparaison')?.value || null,
      tableauComparatif: document.getElementById('proc-tableau-comparatif')?.files?.[0] ? 'TABLEAU_' + Date.now() + '.pdf' : null,
      fournisseurRetenu: fournisseurRetenu,
      motifSelection: document.getElementById('proc-motif-selection')?.value || 'MOINS_DISANT',
      noteSelection: document.getElementById('proc-note-selection')?.files?.[0] ? 'NOTE_SEL_' + Date.now() + '.pdf' : null
    };
  }
  // PSL, PSO, AOO, PI - Full procedure with COJO
  else {
    const commission = document.getElementById('proc-commission')?.value;
    const categorie = document.getElementById('proc-categorie')?.value;

    if (!commission || !categorie) {
      alert('⚠️ Le type de commission et la catégorie sont obligatoires');
      return;
    }

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

    procedureData = {
      ...procedureData,
      commission: commission,
      categorie: categorie,
      typeDossierAppel,
      dossierAppelDoc,
      dates: {
        ouverture: dateOuverture,
        analyse: dateAnalyse,
        jugement: dateJugement
      },
      nbOffresRecues,
      nbOffresClassees,
      pv: {
        ouverture: pvOuverture,
        analyse: pvAnalyse,
        jugement: pvJugement
      }
    };
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

  // Get soumissionnaires and lots data from widgets
  const soumissionnaires = soumissionnairesWidget ? soumissionnairesWidget.getData() : [];
  const lots = lotsWidget ? lotsWidget.getData() : [];

  // Add soumissionnaires and lots to procedureData
  procedureData.soumissionnaires = soumissionnaires;
  procedureData.lots = lots;

  // Merge with existing data if updating
  if (existingProcedure) {
    // Preserve existing documents if not re-uploaded
    if (procedureData.docDevis === null && existingProcedure.docDevis) {
      procedureData.docDevis = existingProcedure.docDevis;
    }
    if (procedureData.docBC === null && existingProcedure.docBC) {
      procedureData.docBC = existingProcedure.docBC;
    }
    if (procedureData.tableauComparatif === null && existingProcedure.tableauComparatif) {
      procedureData.tableauComparatif = existingProcedure.tableauComparatif;
    }
    if (procedureData.noteSelection === null && existingProcedure.noteSelection) {
      procedureData.noteSelection = existingProcedure.noteSelection;
    }
    if (procedureData.dossierAppelDoc === null && existingProcedure.dossierAppelDoc) {
      procedureData.dossierAppelDoc = existingProcedure.dossierAppelDoc;
    }
    if (procedureData.pv) {
      if (procedureData.pv.ouverture === null && existingProcedure.pv?.ouverture) {
        procedureData.pv.ouverture = existingProcedure.pv.ouverture;
      }
      if (procedureData.pv.analyse === null && existingProcedure.pv?.analyse) {
        procedureData.pv.analyse = existingProcedure.pv.analyse;
      }
      if (procedureData.pv.jugement === null && existingProcedure.pv?.jugement) {
        procedureData.pv.jugement = existingProcedure.pv.jugement;
      }
    }
  }

  let procedureResult;
  if (existingProcedure) {
    procedureResult = await dataService.update(ENTITIES.PROCEDURE, existingProcedure.id, procedureData);
  } else {
    procedureResult = await dataService.add(ENTITIES.PROCEDURE, procedureData);
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
