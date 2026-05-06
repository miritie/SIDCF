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
import { renderLotsProcedureMP } from '../../../ui/widgets/lots-procedure-mp.js';
import { checkSanction, renderSanctionBanner, openSanctionsDrawer } from '../../../lib/mp-sanctions.js';

// Debounce simple pour la détection sanctions (évite un appel à chaque touche)
let _procSanctionTimer = null;
function _procTriggerSanctionCheck() {
  clearTimeout(_procSanctionTimer);
  _procSanctionTimer = setTimeout(async () => {
    const banner = document.getElementById('proc-sanction-banner');
    if (!banner) return;
    const raisonSociale = (document.getElementById('proc-fournisseur-retenu')?.value || '').trim();
    if (!raisonSociale) { banner.innerHTML = ''; return; }
    const sanction = await checkSanction({ raisonSociale });
    banner.innerHTML = '';
    if (sanction) {
      const node = renderSanctionBanner(sanction);
      if (node) banner.appendChild(node);
    }
  }, 300);
}

function createButton(className, text, onClick) {
  const btn = el('button', { className }, text);
  btn.addEventListener('click', onClick);
  return btn;
}

export async function renderProcedurePV(params) {
  const { idOperation } = params;

  if (!idOperation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'ID marché manquant')
    ]));
    return;
  }

  // Load data
  const fullData = await dataService.getMpOperationFull(idOperation);
  if (!fullData?.operation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'Marché / contrat introuvable')
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
  // Marché+ : multi-lot procedure — lots[] avec libellé + nb offres + dates + PVs
  let lotsState = [];

  const page = el('div', { className: 'page' }, [
    // Timeline
    renderSteps(fullData, idOperation),

    // Header
    el('div', { className: 'page-header' }, [
      createButton('btn btn-secondary btn-sm', '← Retour fiche', () => router.navigate('/mp/fiche-marche', { idOperation })),
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
          createButton('btn btn-secondary', 'Annuler', () => router.navigate('/mp/fiche-marche', { idOperation })),
          createButton('btn btn-primary', 'Enregistrer & Continuer', async () => {
            await handleSave(idOperation, selectedMode, derogationJustif, derogationComment, suggestedCodes, soumissionnairesWidget, lotsState);
          })
        ])
      ])
    ])
  ]);

  mount('#app', page);

  // Marché+ : check sanctions sur le fournisseur retenu pré-rempli (s'il y en a un)
  setTimeout(() => _procTriggerSanctionCheck(), 150);

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

    // Lots & procédure par lot (Marché+ multi-lot)
    // On l'active pour TOUS les modes sauf PSD (Procédure Simplifiée d'Entente
    // Directe — par nature mono-fournisseur, pas de notion de lot).
    // Couvre ainsi PSC/PSL/PSO/AOO/PI (config explicite) ET CI/AOR/DEM/
    // ENTENTE_DIRECTE qui n'ont pas info_lots configuré dans rules-config.
    const lotsContainer = document.getElementById('lots-container');
    const shouldShowLots = mode && mode !== 'PSD';
    if (shouldShowLots) {
      lotsContainer.innerHTML = '';

      // Migration : si pas de lots, mais on a des dates/pv/nbOffres legacy
      // au niveau procedure → on construit un lot 1 unique depuis ces valeurs.
      let initialLots = procedureData?.lots && procedureData.lots.length > 0
        ? procedureData.lots
        : null;
      if (!initialLots && procedureData && (procedureData.dates || procedureData.pv || procedureData.nbOffresRecues)) {
        initialLots = [{
          id: undefined,
          numero: 1,
          libelle: operation.objet || '',
          nbOffresRecues: procedureData.nbOffresRecues || 0,
          nbOffresClassees: procedureData.nbOffresClassees || 0,
          dates: procedureData.dates || {},
          pv: procedureData.pv || {}
        }];
      }

      const card = el('div', { className: 'card', style: { marginBottom: '24px' } }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, '📦 Lots & procédure par lot')
        ]),
        el('div', { className: 'card-body' }, [
          el('div', { id: 'lots-widget-root' })
        ])
      ]);

      lotsContainer.appendChild(card);

      const widget = renderLotsProcedureMP(
        initialLots || [],
        { defaultLibelle: operation.objet || '' },
        (updated) => { lotsState = updated; }
      );
      document.getElementById('lots-widget-root').appendChild(widget);
      // Initialise lotsState avec la valeur courante (le widget le settera aussi via onChange dès la 1ʳᵉ interaction)
      lotsState = initialLots && initialLots.length > 0
        ? initialLots
        : [{ numero: 1, libelle: operation.objet || '', nbOffresRecues: 0, nbOffresClassees: 0, dates: {}, pv: {} }];
    } else {
      lotsContainer.innerHTML = '';
      lotsState = [];
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
        el('div', { style: { marginTop: '24px', marginBottom: '8px', borderTop: '1px solid var(--color-gray-200)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
          el('strong', {}, '📄 Note de sélection'),
          el('button', {
            type: 'button',
            className: 'btn btn-sm btn-secondary',
            onclick: (e) => { e.preventDefault(); openSanctionsDrawer(); }
          }, '🚫 Gérer la liste des entreprises sanctionnées')
        ]),

        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
          // Fournisseur retenu (avec détection sanctions live)
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, ['Fournisseur retenu', el('span', { className: 'required' }, '*')]),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'proc-fournisseur-retenu',
              placeholder: 'Nom du fournisseur sélectionné',
              value: existingProc.fournisseurRetenu || '',
              oninput: () => _procTriggerSanctionCheck()
            }),
            el('div', { id: 'proc-sanction-banner' })
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

      ]),

      el('div', {
        className: 'alert alert-info',
        style: { marginTop: '12px', fontSize: '13px' }
      }, [
        el('div', { className: 'alert-icon' }, 'ℹ️'),
        el('div', { className: 'alert-content' },
          'Le détail de la procédure (nombre d\'offres, dates et PVs) est désormais saisi dans la section « Lots & procédure par lot » ci-dessous, pour permettre une gestion par lot quand le marché en comporte plusieurs.')
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
async function handleSave(idOperation, selectedMode, derogationJustif, derogationComment, suggestedCodes, soumissionnairesWidget, lotsState) {
  if (!selectedMode) {
    alert('Veuillez sélectionner un mode de passation');
    return;
  }

  // Pré-fetch de la procédure existante : on en a besoin pour suppress
  // les faux warnings quand le fichier est déjà uploadé.
  const existingProc = await dataService.getByField(ENTITIES.MP_PROCEDURE, 'operationId', idOperation);

  // Validate soumissionnaires if widget is active
  if (soumissionnairesWidget) {
    const soumValidation = soumissionnairesWidget.validate();
    if (!soumValidation.valid) {
      alert('⚠️ Validation soumissionnaires:\n\n' + soumValidation.errors.join('\n'));
      return;
    }
  }

  // Marché+ multi-lot : lotsState est déjà un Array via onChange du widget.
  // Pas de validation bloquante ici (les champs sont optionnels par design).

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
  // PSL, PSO, AOO, PI - Full procedure with COJO/COPE
  // Tous les champs sont optionnels : on n'interrompt jamais le save, on
  // remonte juste un récap des manquants à la fin.
  // Le détail (nb offres / dates / PVs) est désormais PER LOT et provient
  // de lotsState (renseigné via le widget renderLotsProcedureMP).
  else {
    const commission = document.getElementById('proc-commission')?.value || null;
    const categorie = document.getElementById('proc-categorie')?.value || null;
    const typeDossierAppel = document.getElementById('proc-type-dossier')?.value || null;

    let dossierAppelDoc = null;
    const dossierInput = document.getElementById('proc-dossier-doc');
    if (dossierInput?.files?.[0]) {
      dossierAppelDoc = 'DOSSIER_' + Date.now() + '.pdf';
      logger.info('[Procedure] Dossier d\'appel uploadé:', dossierAppelDoc);
    }

    procedureData = {
      ...procedureData,
      commission,
      categorie,
      typeDossierAppel,
      dossierAppelDoc
    };

    // Avertissements non bloquants
    const warnings = [];
    if (!commission) warnings.push('Type de commission');
    if (!categorie) warnings.push('Catégorie');

    const lots = Array.isArray(lotsState) ? lotsState : [];
    if (lots.length === 0) {
      warnings.push('Aucun lot défini (au moins 1 lot attendu)');
    } else {
      lots.forEach((lot, i) => {
        const tag = `Lot ${lot.numero || i + 1}`;
        if (!lot.libelle) warnings.push(`${tag} : libellé manquant`);
        if (!lot.dates?.ouverture) warnings.push(`${tag} : date d'ouverture manquante`);
        if (!lot.dates?.jugement) warnings.push(`${tag} : date de jugement manquante`);
        const hasAnyPvOuv = lot.pv?.ouverture;
        if (!hasAnyPvOuv) warnings.push(`${tag} : PV d'ouverture manquant`);
        const hasAnyPvJug = lot.pv?.jugement;
        if (!hasAnyPvJug) warnings.push(`${tag} : PV de jugement manquant`);
        // Chronologie
        const dOuv = lot.dates?.ouverture;
        const dAnaT = lot.dates?.analyseTechnique;
        const dJug = lot.dates?.jugement;
        if (dOuv && dAnaT && new Date(dAnaT) < new Date(dOuv)) {
          warnings.push(`${tag} : date d'analyse technique antérieure à l'ouverture`);
        }
        if (dAnaT && dJug && new Date(dJug) < new Date(dAnaT)) {
          warnings.push(`${tag} : date de jugement antérieure à l'analyse technique`);
        }
      });
    }
    if (warnings.length > 0) {
      window.__mpProcedureWarnings = warnings;
    } else {
      delete window.__mpProcedureWarnings;
    }
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
  const operation = await dataService.get(ENTITIES.MP_OPERATION, idOperation);
  if (!operation.timeline.includes('PROC')) {
    updateData.timeline = [...operation.timeline, 'PROC'];
    updateData.etat = 'EN_PROC';
  }

  const operationResult = await dataService.update(ENTITIES.MP_OPERATION, idOperation, updateData);

  if (!operationResult.success) {
    alert('❌ Erreur lors de la mise à jour de l\'opération');
    return;
  }

  // Create or update procedure (existingProc déjà pré-fetché plus haut)
  const existingProcedure = existingProc;

  // Get soumissionnaires from widget; lots from lotsState (Marché+ multi-lot)
  const soumissionnaires = soumissionnairesWidget ? soumissionnairesWidget.getData() : [];
  const lots = Array.isArray(lotsState) ? lotsState : [];

  procedureData.soumissionnaires = soumissionnaires;
  procedureData.lots = lots;

  // Merge with existing data if updating (préserve documents PSD/PSC/dossier
  // si non ré-uploadés). La logique per-lot pour les PVs/dates est gérée par
  // le widget renderLotsProcedureMP côté UI (chaque PV file est conservé tant
  // qu'il n'est pas explicitement remplacé).
  if (existingProcedure) {
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
  }

  let procedureResult;
  if (existingProcedure) {
    procedureResult = await dataService.update(ENTITIES.MP_PROCEDURE, existingProcedure.id, procedureData);
  } else {
    procedureResult = await dataService.add(ENTITIES.MP_PROCEDURE, procedureData);
  }

  if (procedureResult.success) {
    logger.info('[Procedure] Procédure enregistrée avec succès');
    let msg = '✅ Procédure enregistrée' + (isDerogation ? ' (avec dérogation)' : '');
    const warnings = window.__mpProcedureWarnings;
    if (Array.isArray(warnings) && warnings.length > 0) {
      msg += '\n\n⚠️ Champs incomplets ou incohérents (non bloquants) :\n• ' + warnings.join('\n• ');
      delete window.__mpProcedureWarnings;
    }
    alert(msg);
    router.navigate('/mp/fiche-marche', { idOperation });
  } else {
    alert('❌ Erreur lors de la sauvegarde de la procédure');
  }
}

export default renderProcedurePV;
