/* ============================================
   ECR04A - Exécution & Ordres de Service
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

export async function renderExecutionOS(params) {
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

  const { operation, attribution, ordresService } = fullData;
  const registries = dataService.getAllRegistries();

  // Check if visa CF granted
  if (!operation.timeline.includes('VISE')) {
    mount('#app', el('div', { className: 'page' }, [
      renderSteps(fullData, idOperation),
      el('div', { className: 'alert alert-warning' }, [
        el('div', { className: 'alert-icon' }, '⚠️'),
        el('div', { className: 'alert-content' }, [
          el('div', { className: 'alert-title' }, 'Visa CF non accordé'),
          el('div', { className: 'alert-message' }, 'L\'exécution ne peut commencer que si le Contrôle Financier a accordé son visa.')
        ])
      ]),
      el('div', { style: { marginTop: '16px' } }, [
        createButton('btn btn-primary', '← Retour', () => router.navigate('/fiche-marche', { idOperation }))
      ])
    ]));
    return;
  }

  // Check delay alert (OS > 30 days after visa)
  const delayAlert = checkDelayAlert(operation, ordresService);

  const page = el('div', { className: 'page' }, [
    // Timeline
    renderSteps(fullData, idOperation),

    // Header
    el('div', { className: 'page-header' }, [
      createButton('btn btn-secondary btn-sm', '← Retour fiche', () => router.navigate('/fiche-marche', { idOperation })),
      el('h1', { className: 'page-title', style: { marginTop: '12px' } }, 'Exécution & Ordres de Service'),
      el('p', { className: 'page-subtitle' }, operation.objet)
    ]),

    // Delay alert (if applicable)
    delayAlert ? delayAlert : null,

    // Attribution summary
    renderAttributionSummary(attribution),

    // OS list
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Ordres de Service')
      ]),
      el('div', { className: 'card-body' }, [
        ordresService && ordresService.length > 0
          ? renderOSTable(ordresService)
          : el('div', { className: 'alert alert-info' }, [
              el('div', { className: 'alert-icon' }, 'ℹ️'),
              el('div', { className: 'alert-content' }, [
                el('div', { className: 'alert-title' }, 'Aucun ordre de service enregistré'),
                el('div', { className: 'alert-message' }, 'Ajoutez le premier ordre de service pour démarrer l\'exécution du marché.')
              ])
            ])
      ])
    ]),

    // Add OS form
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Ajouter un ordre de service')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' } }, [
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, [
              'Type d\'OS',
              el('span', { className: 'required' }, '*')
            ]),
            el('select', { className: 'form-input', id: 'os-type' }, [
              el('option', { value: '' }, '-- Sélectionnez --'),
              el('option', { value: 'DEMARRAGE' }, 'OS de démarrage'),
              el('option', { value: 'ARRET' }, 'OS d\'arrêt'),
              el('option', { value: 'REPRISE' }, 'OS de reprise'),
              el('option', { value: 'COMPLEMENTAIRE' }, 'OS complémentaire')
            ])
          ]),

          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, [
              'Numéro OS',
              el('span', { className: 'required' }, '*')
            ]),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'os-numero',
              placeholder: 'Ex: OS-2024-001'
            })
          ]),

          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, [
              'Date émission',
              el('span', { className: 'required' }, '*')
            ]),
            el('input', {
              type: 'date',
              className: 'form-input',
              id: 'os-date',
              value: new Date().toISOString().split('T')[0]
            })
          ]),

          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Montant (XOF)'),
            el('input', {
              type: 'number',
              className: 'form-input',
              id: 'os-montant',
              min: 0,
              step: 1000,
              placeholder: 'Optionnel'
            })
          ])
        ]),

        el('div', { className: 'form-field', style: { marginTop: '16px' } }, [
          el('label', { className: 'form-label' }, 'Objet / Description'),
          el('textarea', {
            className: 'form-input',
            id: 'os-objet',
            rows: 3,
            placeholder: 'Description de l\'ordre de service...'
          })
        ]),

        el('div', { className: 'form-field', style: { marginTop: '16px' } }, [
          el('label', { className: 'form-label' }, 'Document OS (PDF)'),
          el('input', {
            type: 'file',
            className: 'form-input',
            id: 'os-document',
            accept: '.pdf'
          })
        ]),

        el('div', { style: { marginTop: '16px', display: 'flex', justifyContent: 'flex-end' } }, [
          createButton('btn btn-primary', '+ Ajouter OS', async () => {
            await handleAddOS(idOperation);
          })
        ])
      ])
    ]),

    // Actions
    el('div', { className: 'card' }, [
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center' } }, [
          el('div', { className: 'text-small text-muted' }, `${ordresService?.length || 0} ordre(s) de service enregistré(s)`),
          createButton('btn btn-secondary', 'Retour', () => router.navigate('/fiche-marche', { idOperation }))
        ])
      ])
    ])
  ]);

  mount('#app', page);
}

/**
 * Check delay alert (OS > 30 days after visa)
 */
function checkDelayAlert(operation, ordresService) {
  if (!operation.dateCF) return null;

  const visaDate = new Date(operation.dateCF);
  const today = new Date();
  const daysSinceVisa = Math.floor((today - visaDate) / (1000 * 60 * 60 * 24));

  // Get rules config
  const rulesConfig = dataService.getRulesConfig();
  const maxDays = rulesConfig?.seuils?.DELAI_MAX_OS_APRES_VISA?.value || 30;

  if (daysSinceVisa > maxDays && (!ordresService || ordresService.length === 0)) {
    return el('div', { className: 'card', style: { marginBottom: '24px', borderColor: 'var(--color-warning)' } }, [
      el('div', { className: 'card-body' }, [
        el('div', { className: 'alert alert-warning' }, [
          el('div', { className: 'alert-icon' }, '⏰'),
          el('div', { className: 'alert-content' }, [
            el('div', { className: 'alert-title' }, 'Délai dépassé'),
            el('div', { className: 'alert-message' }, [
              el('p', {}, `Le visa CF a été accordé il y a ${daysSinceVisa} jours (le ${visaDate.toLocaleDateString()}).`),
              el('p', { style: { marginTop: '8px', fontWeight: '600' } }, `⚠️ Délai maximal recommandé: ${maxDays} jours`)
            ])
          ])
        ])
      ])
    ]);
  }

  return null;
}

/**
 * Render attribution summary
 */
function renderAttributionSummary(attribution) {
  if (!attribution) return null;

  const isSimple = attribution.attributaire?.singleOrGroup === 'SIMPLE';
  const attributaireName = isSimple
    ? attribution.attributaire.entreprises?.[0]?.raisonSociale || 'N/A'
    : attribution.attributaire.entreprises?.find(e => e.role === 'MANDATAIRE')?.raisonSociale || 'N/A';

  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, 'Marché visé')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
        renderField('Attributaire', attributaireName),
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
 * Render OS table
 */
function renderOSTable(ordresService) {
  return el('div', { style: { overflowX: 'auto' } }, [
    el('table', { className: 'data-table' }, [
      el('thead', {}, [
        el('tr', {}, [
          el('th', {}, 'Type'),
          el('th', {}, 'Numéro'),
          el('th', {}, 'Date'),
          el('th', {}, 'Montant'),
          el('th', {}, 'Objet'),
          el('th', {}, 'Actions')
        ])
      ]),
      el('tbody', {},
        ordresService.map(os => renderOSRow(os))
      )
    ])
  ]);
}

function renderOSRow(os) {
  return el('tr', {}, [
    el('td', {}, renderOSTypeBadge(os.type)),
    el('td', { style: { fontWeight: '500' } }, os.numero),
    el('td', {}, new Date(os.dateEmission).toLocaleDateString()),
    el('td', {}, os.montant ? `${(os.montant / 1000000).toFixed(2)}M` : '-'),
    el('td', {}, os.objet || '-'),
    el('td', {}, [
      os.documentId
        ? el('button', { className: 'btn btn-sm btn-secondary', style: { fontSize: '12px' } }, '📄 Voir doc')
        : el('span', { className: 'text-muted text-small' }, 'Aucun doc')
    ])
  ]);
}

function renderOSTypeBadge(type) {
  const badgeMap = {
    'DEMARRAGE': { label: 'Démarrage', color: 'var(--color-success)' },
    'ARRET': { label: 'Arrêt', color: 'var(--color-error)' },
    'REPRISE': { label: 'Reprise', color: 'var(--color-info)' },
    'COMPLEMENTAIRE': { label: 'Complémentaire', color: 'var(--color-warning)' }
  };

  const badge = badgeMap[type] || { label: type, color: 'var(--color-gray-500)' };

  return el('span', {
    style: {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '500',
      background: `${badge.color}20`,
      color: badge.color
    }
  }, badge.label);
}

/**
 * Handle add OS
 */
async function handleAddOS(idOperation) {
  // Collect form data
  const type = document.getElementById('os-type')?.value;
  const numero = document.getElementById('os-numero')?.value;
  const date = document.getElementById('os-date')?.value;
  const montant = parseFloat(document.getElementById('os-montant')?.value) || null;
  const objet = document.getElementById('os-objet')?.value;
  const docInput = document.getElementById('os-document');

  // Validation
  if (!type) {
    alert('⚠️ Veuillez sélectionner un type d\'OS');
    return;
  }

  if (!numero) {
    alert('⚠️ Veuillez saisir un numéro d\'OS');
    return;
  }

  if (!date) {
    alert('⚠️ Veuillez saisir une date d\'émission');
    return;
  }

  // Handle document upload (simulate)
  let documentId = null;
  if (docInput?.files?.[0]) {
    documentId = 'DOC_OS_' + Date.now() + '.pdf';
    logger.info('[Execution] Document OS uploadé:', documentId);
  }

  // Create OS entity
  const osId = `OS-${idOperation}-${Date.now()}`;
  const osEntity = {
    id: osId,
    idOperation,
    type,
    numero,
    dateEmission: date,
    montant,
    objet: objet || '',
    documentId,
    createdAt: new Date().toISOString()
  };

  const result = await dataService.create(ENTITIES.ORDRE_SERVICE, osEntity);

  if (!result.success) {
    alert('❌ Erreur lors de la création de l\'ordre de service');
    return;
  }

  // Update operation timeline
  const operation = await dataService.get(ENTITIES.OPERATION, idOperation);
  const updateData = {};

  if (!operation.timeline.includes('EXEC')) {
    updateData.timeline = [...operation.timeline, 'EXEC'];
    updateData.etat = 'EN_EXEC';
  }

  if (Object.keys(updateData).length > 0) {
    await dataService.update(ENTITIES.OPERATION, idOperation, updateData);
  }

  logger.info('[Execution] OS ajouté avec succès:', osId);
  alert('✅ Ordre de service enregistré');

  // Reload page
  router.navigate('/execution', { idOperation });
}

export default renderExecutionOS;
