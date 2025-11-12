/* ============================================
   ECR03A - Attribution du Marché
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

export async function renderAttribution(params) {
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

  // Check if procedure completed
  if (!operation.timeline.includes('PROC')) {
    mount('#app', el('div', { className: 'page' }, [
      renderSteps(fullData, idOperation),
      el('div', { className: 'alert alert-warning' }, [
        el('div', { className: 'alert-icon' }, '⚠️'),
        el('div', { className: 'alert-content' }, [
          el('div', { className: 'alert-title' }, 'Étape Procédure non complétée'),
          el('div', { className: 'alert-message' }, 'Vous devez d\'abord compléter l\'étape Procédure avant l\'attribution.')
        ])
      ]),
      el('div', { style: { marginTop: '16px' } }, [
        createButton('btn btn-primary', '← Retour', () => router.navigate('/fiche-marche', { idOperation }))
      ])
    ]));
    return;
  }

  // State for form (adapt from schema)
  let formType = attribution?.attributaire?.singleOrGroup === 'SIMPLE' ? 'ENTREPRISE' : 'GROUPEMENT';
  let entrepriseData = attribution?.attributaire?.entreprises?.[0] || {
    raisonSociale: '',
    ifu: '',
    contact: '',
    email: '',
    telephone: ''
  };
  let groupementData = attribution?.attributaire?.entreprises ? {
    mandataire: attribution.attributaire.entreprises.find(e => e.role === 'MANDATAIRE') || { raisonSociale: '', ifu: '', role: 'MANDATAIRE' },
    cotraitants: attribution.attributaire.entreprises.filter(e => e.role === 'COTRAITANT'),
    soustraitants: attribution.attributaire.entreprises.filter(e => e.role === 'SOUSTRAITANT')
  } : {
    mandataire: { raisonSociale: '', ifu: '', role: 'MANDATAIRE' },
    cotraitants: [],
    soustraitants: []
  };
  let montantHT = attribution?.montants?.ht || operation.montantPrevisionnel || 0;
  let tauxTVA = 18; // Default TVA in Côte d'Ivoire
  let montantTTC = attribution?.montants?.ttc || (montantHT * (1 + tauxTVA / 100));
  let delaiExecution = attribution?.delaiExecution || 0;
  let delaiUnite = attribution?.delaiUnite || 'MOIS';
  let decisionCF = attribution?.decisionCF?.etat || null;
  let commentaireCF = attribution?.decisionCF?.commentaire || '';
  let dateCF = attribution?.dates?.decisionCF || '';

  const page = el('div', { className: 'page' }, [
    // Timeline
    renderSteps(fullData, idOperation),

    // Header
    el('div', { className: 'page-header' }, [
      createButton('btn btn-secondary btn-sm', '← Retour fiche', () => router.navigate('/fiche-marche', { idOperation })),
      el('h1', { className: 'page-title', style: { marginTop: '12px' } }, 'Attribution du Marché'),
      el('p', { className: 'page-subtitle' }, operation.objet)
    ]),

    // Type attributaire
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Type d\'attributaire')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, [
            'Attributaire',
            el('span', { className: 'required' }, '*')
          ]),
          createTypeSelect(formType, (value) => {
            formType = value;
            updateAttributaireForm(value);
          })
        ])
      ])
    ]),

    // Attributaire form (dynamic)
    el('div', { id: 'attributaire-form-container' }),

    // Montants & Délais
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Montants & Délais')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' } }, [
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, [
              'Montant HT (XOF)',
              el('span', { className: 'required' }, '*')
            ]),
            el('input', {
              type: 'number',
              className: 'form-input',
              id: 'montant-ht',
              value: montantHT,
              min: 0,
              step: 1000
            })
          ]),

          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Taux TVA (%)'),
            el('input', {
              type: 'number',
              className: 'form-input',
              id: 'taux-tva',
              value: tauxTVA,
              min: 0,
              max: 100,
              step: 0.1
            })
          ]),

          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Montant TTC (XOF)'),
            el('input', {
              type: 'number',
              className: 'form-input',
              id: 'montant-ttc',
              value: montantTTC,
              disabled: true,
              style: { background: 'var(--color-gray-100)' }
            })
          ]),

          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, [
              'Délai d\'exécution',
              el('span', { className: 'required' }, '*')
            ]),
            el('div', { style: { display: 'flex', gap: '8px' } }, [
              el('input', {
                type: 'number',
                className: 'form-input',
                id: 'delai-execution',
                value: delaiExecution,
                min: 0,
                style: { flex: '2' }
              }),
              createDelaiUniteSelect(delaiUnite)
            ])
          ])
        ])
      ])
    ]),

    // Décision CF (if exists)
    decisionCF ? renderDecisionCF(decisionCF, commentaireCF, dateCF, registries) : null,

    // Actions
    el('div', { className: 'card' }, [
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } }, [
          createButton('btn btn-secondary', 'Annuler', () => router.navigate('/fiche-marche', { idOperation })),
          createButton('btn btn-primary', 'Enregistrer Attribution', async () => {
            await handleSave(idOperation, formType, entrepriseData, groupementData, montantHT, tauxTVA, delaiExecution, delaiUnite);
          })
        ])
      ])
    ])
  ]);

  mount('#app', page);

  // Initial form render
  updateAttributaireForm(formType);

  // Setup event listeners for montant calculation
  setupMontantListeners();
}

/**
 * Create type selection dropdown
 */
function createTypeSelect(selectedValue, onChange) {
  const select = el('select', { className: 'form-input' });

  const types = [
    { code: 'ENTREPRISE', label: 'Entreprise seule' },
    { code: 'GROUPEMENT', label: 'Groupement (co-traitance / sous-traitance)' }
  ];

  types.forEach(type => {
    const option = el('option', { value: type.code }, type.label);
    if (type.code === selectedValue) {
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
 * Create délai unité select
 */
function createDelaiUniteSelect(selectedValue) {
  const select = el('select', { className: 'form-input', id: 'delai-unite', style: { flex: '1' } });

  const unites = [
    { code: 'JOURS', label: 'Jours' },
    { code: 'MOIS', label: 'Mois' },
    { code: 'ANNEES', label: 'Années' }
  ];

  unites.forEach(unite => {
    const option = el('option', { value: unite.code }, unite.label);
    if (unite.code === selectedValue) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  return select;
}

/**
 * Update attributaire form based on type
 */
function updateAttributaireForm(type) {
  const container = document.getElementById('attributaire-form-container');
  if (!container) return;

  container.innerHTML = '';

  if (type === 'ENTREPRISE') {
    const card = el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Entreprise attributaire')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, [
              'Raison sociale',
              el('span', { className: 'required' }, '*')
            ]),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'ent-raison-sociale',
              placeholder: 'Ex: SOGEBAT CI'
            })
          ]),

          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, [
              'IFU',
              el('span', { className: 'required' }, '*')
            ]),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'ent-ifu',
              placeholder: 'Ex: 1234567890'
            })
          ]),

          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Contact'),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'ent-contact',
              placeholder: 'Nom du responsable'
            })
          ]),

          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Email'),
            el('input', {
              type: 'email',
              className: 'form-input',
              id: 'ent-email',
              placeholder: 'contact@entreprise.ci'
            })
          ]),

          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Téléphone'),
            el('input', {
              type: 'tel',
              className: 'form-input',
              id: 'ent-telephone',
              placeholder: '+225 XX XX XX XX XX'
            })
          ])
        ])
      ])
    ]);

    container.appendChild(card);
  } else if (type === 'GROUPEMENT') {
    const card = el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Groupement d\'entreprises')
      ]),
      el('div', { className: 'card-body' }, [
        // Mandataire
        el('div', { style: { marginBottom: '24px' } }, [
          el('h4', { style: { fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--color-primary)' } }, 'Mandataire du groupement'),
          el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, [
                'Raison sociale',
                el('span', { className: 'required' }, '*')
              ]),
              el('input', {
                type: 'text',
                className: 'form-input',
                id: 'mand-raison-sociale',
                placeholder: 'Ex: SOGEBAT CI'
              })
            ]),

            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, [
                'IFU',
                el('span', { className: 'required' }, '*')
              ]),
              el('input', {
                type: 'text',
                className: 'form-input',
                id: 'mand-ifu',
                placeholder: 'Ex: 1234567890'
              })
            ])
          ])
        ]),

        // Co-traitants
        el('div', { style: { marginBottom: '24px' } }, [
          el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' } }, [
            el('h4', { style: { fontSize: '14px', fontWeight: '600', color: 'var(--color-primary)' } }, 'Co-traitants'),
            createButton('btn btn-secondary btn-sm', '+ Ajouter co-traitant', () => addCotraitant())
          ]),
          el('div', { id: 'cotraitants-list' })
        ]),

        // Sous-traitants
        el('div', {}, [
          el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' } }, [
            el('h4', { style: { fontSize: '14px', fontWeight: '600', color: 'var(--color-primary)' } }, 'Sous-traitants'),
            createButton('btn btn-secondary btn-sm', '+ Ajouter sous-traitant', () => addSoustraitant())
          ]),
          el('div', { id: 'soustraitants-list' })
        ])
      ])
    ]);

    container.appendChild(card);
  }
}

let cotraitantIndex = 0;
let soustraitantIndex = 0;

function addCotraitant() {
  const list = document.getElementById('cotraitants-list');
  if (!list) return;

  const index = cotraitantIndex++;
  const item = el('div', { className: 'form-group-inline', id: `cotraitant-${index}`, style: { marginBottom: '12px', padding: '12px', border: '1px solid var(--color-gray-300)', borderRadius: '6px' } }, [
    el('div', { style: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', gap: '8px', alignItems: 'end' } }, [
      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'Raison sociale'),
        el('input', { type: 'text', className: 'form-input', 'data-cotraitant-rs': index, placeholder: 'Ex: ENTREPOSE CI' })
      ]),
      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'IFU'),
        el('input', { type: 'text', className: 'form-input', 'data-cotraitant-ifu': index, placeholder: 'Ex: 9876543210' })
      ]),
      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'Part (%)'),
        el('input', { type: 'number', className: 'form-input', 'data-cotraitant-part': index, placeholder: '30', min: 0, max: 100 })
      ]),
      createButton('btn btn-danger btn-sm', '×', () => {
        document.getElementById(`cotraitant-${index}`).remove();
      })
    ])
  ]);

  list.appendChild(item);
}

function addSoustraitant() {
  const list = document.getElementById('soustraitants-list');
  if (!list) return;

  const index = soustraitantIndex++;
  const item = el('div', { className: 'form-group-inline', id: `soustraitant-${index}`, style: { marginBottom: '12px', padding: '12px', border: '1px solid var(--color-gray-300)', borderRadius: '6px' } }, [
    el('div', { style: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', gap: '8px', alignItems: 'end' } }, [
      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'Raison sociale'),
        el('input', { type: 'text', className: 'form-input', 'data-soustraitant-rs': index, placeholder: 'Ex: TECHBAT CI' })
      ]),
      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'IFU'),
        el('input', { type: 'text', className: 'form-input', 'data-soustraitant-ifu': index, placeholder: 'Ex: 5555555555' })
      ]),
      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'Part (%)'),
        el('input', { type: 'number', className: 'form-input', 'data-soustraitant-part': index, placeholder: '15', min: 0, max: 100 })
      ]),
      createButton('btn btn-danger btn-sm', '×', () => {
        document.getElementById(`soustraitant-${index}`).remove();
      })
    ])
  ]);

  list.appendChild(item);
}

/**
 * Setup montant calculation listeners
 */
function setupMontantListeners() {
  const htInput = document.getElementById('montant-ht');
  const tvaInput = document.getElementById('taux-tva');
  const ttcInput = document.getElementById('montant-ttc');

  if (!htInput || !tvaInput || !ttcInput) return;

  const recalc = () => {
    const ht = parseFloat(htInput.value) || 0;
    const tva = parseFloat(tvaInput.value) || 0;
    const ttc = ht * (1 + tva / 100);
    ttcInput.value = Math.round(ttc);
  };

  htInput.addEventListener('input', recalc);
  tvaInput.addEventListener('input', recalc);
}

/**
 * Render existing CF decision
 */
function renderDecisionCF(decision, commentaire, date, registries) {
  const decisionObj = registries.DECISION_CF.find(d => d.code === decision);
  const colorMap = {
    'VISA': 'var(--color-success)',
    'RESERVE': 'var(--color-warning)',
    'REFUS': 'var(--color-error)'
  };

  return el('div', { className: 'card', style: { marginBottom: '24px', borderColor: colorMap[decision] || 'var(--color-gray-300)' } }, [
    el('div', { className: 'card-header', style: { background: `${colorMap[decision]}15` } }, [
      el('h3', { className: 'card-title', style: { color: colorMap[decision] } }, [
        el('span', {}, `${decision === 'VISA' ? '✅' : decision === 'RESERVE' ? '⚠️' : '🚫'} Décision CF: ${decisionObj?.label || decision}`)
      ])
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
        renderField('Date décision', date ? new Date(date).toLocaleDateString() : '-'),
        renderField('Commentaire', commentaire || '-')
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
async function handleSave(idOperation, formType, entrepriseData, groupementData, montantHT, tauxTVA, delaiExecution, delaiUnite) {
  // Collect form data
  let attributionData = {
    type: formType,
    montantHT: parseFloat(document.getElementById('montant-ht')?.value) || montantHT,
    tauxTVA: parseFloat(document.getElementById('taux-tva')?.value) || tauxTVA,
    delaiExecution: parseInt(document.getElementById('delai-execution')?.value) || delaiExecution,
    delaiUnite: document.getElementById('delai-unite')?.value || delaiUnite
  };

  attributionData.montantTTC = attributionData.montantHT * (1 + attributionData.tauxTVA / 100);

  // Validate
  if (!attributionData.montantHT || attributionData.montantHT <= 0) {
    alert('⚠️ Veuillez saisir un montant HT valide');
    return;
  }

  if (!attributionData.delaiExecution || attributionData.delaiExecution <= 0) {
    alert('⚠️ Veuillez saisir un délai d\'exécution valide');
    return;
  }

  if (formType === 'ENTREPRISE') {
    const raisonSociale = document.getElementById('ent-raison-sociale')?.value;
    const ifu = document.getElementById('ent-ifu')?.value;

    if (!raisonSociale || !ifu) {
      alert('⚠️ Veuillez renseigner la raison sociale et l\'IFU de l\'entreprise');
      return;
    }

    attributionData.entreprise = {
      raisonSociale,
      ifu,
      contact: document.getElementById('ent-contact')?.value || '',
      email: document.getElementById('ent-email')?.value || '',
      telephone: document.getElementById('ent-telephone')?.value || ''
    };
  } else if (formType === 'GROUPEMENT') {
    const mandRS = document.getElementById('mand-raison-sociale')?.value;
    const mandIFU = document.getElementById('mand-ifu')?.value;

    if (!mandRS || !mandIFU) {
      alert('⚠️ Veuillez renseigner les informations du mandataire');
      return;
    }

    // Collect cotraitants
    const cotraitants = [];
    document.querySelectorAll('[data-cotraitant-rs]').forEach((input, idx) => {
      const rs = input.value;
      const ifu = document.querySelector(`[data-cotraitant-ifu="${idx}"]`)?.value;
      const part = parseFloat(document.querySelector(`[data-cotraitant-part="${idx}"]`)?.value) || 0;

      if (rs && ifu) {
        cotraitants.push({ raisonSociale: rs, ifu, part, role: 'COTRAITANT' });
      }
    });

    // Collect soustraitants
    const soustraitants = [];
    document.querySelectorAll('[data-soustraitant-rs]').forEach((input, idx) => {
      const rs = input.value;
      const ifu = document.querySelector(`[data-soustraitant-ifu="${idx}"]`)?.value;
      const part = parseFloat(document.querySelector(`[data-soustraitant-part="${idx}"]`)?.value) || 0;

      if (rs && ifu) {
        soustraitants.push({ raisonSociale: rs, ifu, part, role: 'SOUSTRAITANT' });
      }
    });

    attributionData.groupement = {
      mandataire: { raisonSociale: mandRS, ifu: mandIFU, role: 'MANDATAIRE' },
      cotraitants,
      soustraitants
    };
  }

  // Create/update attribution entity (matching schema)
  const attributionId = `ATTR-${idOperation}`;
  const attributionEntity = {
    id: attributionId,
    operationId: idOperation,
    attributaire: {
      singleOrGroup: formType === 'ENTREPRISE' ? 'SIMPLE' : 'GROUP',
      groupType: formType === 'GROUPEMENT' ? 'COTRAITANCE' : null,
      entreprises: formType === 'ENTREPRISE'
        ? [attributionData.entreprise]
        : [attributionData.groupement.mandataire, ...attributionData.groupement.cotraitants, ...attributionData.groupement.soustraitants]
    },
    montants: {
      ht: attributionData.montantHT,
      ttc: attributionData.montantTTC,
      confidentiel: false
    },
    dates: {
      signatureTitulaire: null,
      signatureAC: null,
      approbation: null,
      decisionCF: null
    },
    decisionCF: {
      etat: null,
      motifRef: null,
      commentaire: ''
    },
    delaiExecution: attributionData.delaiExecution,
    delaiUnite: attributionData.delaiUnite,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Save attribution
  const existingAttr = await dataService.get(ENTITIES.ATTRIBUTION, attributionId);
  let attrResult;
  if (existingAttr) {
    attrResult = await dataService.update(ENTITIES.ATTRIBUTION, attributionId, attributionEntity);
  } else {
    attrResult = await dataService.create(ENTITIES.ATTRIBUTION, attributionEntity);
  }

  if (!attrResult.success) {
    alert('❌ Erreur lors de la sauvegarde de l\'attribution');
    return;
  }

  // Update operation timeline
  const operation = await dataService.get(ENTITIES.OPERATION, idOperation);
  const updateData = {
    montantFinal: attributionData.montantTTC, // Update with actual attribution amount
    attributaireType: formType,
    attributaireNom: formType === 'ENTREPRISE'
      ? attributionData.entreprise.raisonSociale
      : attributionData.groupement.mandataire.raisonSociale
  };

  if (!operation.timeline.includes('ATTR')) {
    updateData.timeline = [...operation.timeline, 'ATTR'];
    updateData.etat = 'EN_ATTR';
  }

  const opResult = await dataService.update(ENTITIES.OPERATION, idOperation, updateData);

  if (opResult.success) {
    logger.info('[Attribution] Attribution enregistrée avec succès');
    alert('✅ Attribution enregistrée avec succès');
    router.navigate('/fiche-marche', { idOperation });
  } else {
    alert('❌ Erreur lors de la mise à jour de l\'opération');
  }
}

export default renderAttribution;
