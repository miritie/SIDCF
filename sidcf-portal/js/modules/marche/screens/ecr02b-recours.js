/* ============================================
   ECR02B - Gestion des Recours
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

export async function renderRecours(params) {
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

  const { operation } = fullData;
  const rulesConfig = dataService.getRulesConfig();

  // Load recours
  const allRecours = await dataService.query(ENTITIES.RECOURS, { operationId: idOperation });

  const page = el('div', { className: 'page' }, [
    // Timeline
    renderSteps(fullData, idOperation),

    // Header
    el('div', { className: 'page-header' }, [
      createButton('btn btn-secondary btn-sm', '← Retour fiche', () => router.navigate('/fiche-marche', { idOperation })),
      el('h1', { className: 'page-title', style: { marginTop: '12px' } }, 'Gestion des Recours'),
      el('p', { className: 'page-subtitle' }, operation.objet)
    ]),

    // Info
    el('div', { className: 'card', style: { marginBottom: '24px', borderColor: 'var(--color-info)' } }, [
      el('div', { className: 'card-body' }, [
        el('div', { className: 'alert alert-info' }, [
          el('div', { className: 'alert-icon' }, 'ℹ️'),
          el('div', { className: 'alert-content' }, [
            el('div', { className: 'alert-title' }, 'À propos des recours'),
            el('div', { className: 'alert-message' }, [
              el('p', {}, 'Les candidats non retenus peuvent déposer un recours dans les délais réglementaires.'),
              el('p', { style: { marginTop: '8px' } }, 'Chaque recours doit être instruit et faire l\'objet d\'une décision motivée.')
            ])
          ])
        ])
      ])
    ]),

    // Recours list
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, `📋 Recours enregistrés (${allRecours.length})`)
      ]),
      el('div', { className: 'card-body' }, [
        allRecours.length > 0
          ? renderRecoursTable(allRecours, rulesConfig)
          : el('div', { className: 'alert alert-info' }, [
              el('div', { className: 'alert-icon' }, 'ℹ️'),
              el('div', { className: 'alert-content' }, [
                el('div', { className: 'alert-title' }, 'Aucun recours enregistré'),
                el('div', { className: 'alert-message' }, 'Les recours éventuels apparaîtront ici.')
              ])
            ])
      ])
    ]),

    // Add recours form
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '➕ Enregistrer un nouveau recours')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' } }, [
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, [
              'Soumissionnaire / Candidat',
              el('span', { className: 'required' }, '*')
            ]),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'recours-candidat',
              placeholder: 'Nom de l\'entreprise'
            })
          ]),

          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, [
              'Type de recours',
              el('span', { className: 'required' }, '*')
            ]),
            createTypeRecoursSelect(rulesConfig)
          ]),

          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, [
              'Date de dépôt',
              el('span', { className: 'required' }, '*')
            ]),
            el('input', {
              type: 'date',
              className: 'form-input',
              id: 'recours-date-depot',
              value: new Date().toISOString().split('T')[0]
            })
          ])
        ]),

        el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
          el('label', { className: 'form-label' }, 'Motifs invoqués'),
          el('textarea', {
            className: 'form-input',
            id: 'recours-motifs',
            rows: 3,
            placeholder: 'Description détaillée des motifs du recours...'
          })
        ]),

        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' } }, [
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Décision'),
            createDecisionRecoursSelect(rulesConfig)
          ]),

          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Date de décision'),
            el('input', {
              type: 'date',
              className: 'form-input',
              id: 'recours-date-decision'
            })
          ])
        ]),

        el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
          el('label', { className: 'form-label' }, 'Commentaire / Motivation de la décision'),
          el('textarea', {
            className: 'form-input',
            id: 'recours-commentaire',
            rows: 3,
            placeholder: 'Motivation de la décision...'
          })
        ]),

        el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
          el('label', { className: 'form-label' }, 'Document de recours (PDF)'),
          el('input', {
            type: 'file',
            className: 'form-input',
            id: 'recours-document',
            accept: '.pdf'
          })
        ]),

        el('div', { style: { display: 'flex', justifyContent: 'flex-end' } }, [
          createButton('btn btn-primary', 'Enregistrer le recours', async () => {
            await handleAddRecours(idOperation);
          })
        ])
      ])
    ]),

    // Actions
    el('div', { className: 'card' }, [
      el('div', { className: 'card-body' }, [
        createButton('btn btn-secondary', '← Retour', () => router.navigate('/fiche-marche', { idOperation }))
      ])
    ])
  ]);

  mount('#app', page);
}

/**
 * Create type recours select
 */
function createTypeRecoursSelect(rulesConfig) {
  const select = el('select', { className: 'form-input', id: 'recours-type' });

  const emptyOption = el('option', { value: '' }, '-- Sélectionnez --');
  select.appendChild(emptyOption);

  const types = rulesConfig?.referentiels?.types_recours || [
    { code: 'CONTESTATION_ATTRIBUTION', label: 'Contestation de l\'attribution' },
    { code: 'IRREGULARITE_PROCEDURE', label: 'Irrégularité de procédure' },
    { code: 'DISCRIMINATION', label: 'Discrimination' },
    { code: 'AUTRE', label: 'Autre motif' }
  ];

  types.forEach(type => {
    const option = el('option', { value: type.code }, type.label);
    select.appendChild(option);
  });

  return select;
}

/**
 * Create decision recours select
 */
function createDecisionRecoursSelect(rulesConfig) {
  const select = el('select', { className: 'form-input', id: 'recours-decision' });

  const emptyOption = el('option', { value: '' }, '-- Sélectionnez --');
  select.appendChild(emptyOption);

  const decisions = rulesConfig?.referentiels?.decisions_recours || [
    { code: 'EN_COURS', label: 'En cours d\'instruction' },
    { code: 'ACCEPTE', label: 'Recours accepté' },
    { code: 'REJETE', label: 'Recours rejeté' },
    { code: 'PARTIELLEMENT_ACCEPTE', label: 'Partiellement accepté' }
  ];

  decisions.forEach(dec => {
    const option = el('option', { value: dec.code }, dec.label);
    select.appendChild(option);
  });

  return select;
}

/**
 * Render recours table
 */
function renderRecoursTable(recoursList, rulesConfig) {
  return el('div', { style: { overflowX: 'auto' } }, [
    el('table', { className: 'data-table' }, [
      el('thead', {}, [
        el('tr', {}, [
          el('th', {}, 'Candidat'),
          el('th', {}, 'Type'),
          el('th', {}, 'Date dépôt'),
          el('th', {}, 'Décision'),
          el('th', {}, 'Date décision'),
          el('th', {}, 'Actions')
        ])
      ]),
      el('tbody', {},
        recoursList.map(recours => renderRecoursRow(recours, rulesConfig))
      )
    ])
  ]);
}

function renderRecoursRow(recours, rulesConfig) {
  const typeObj = rulesConfig?.referentiels?.types_recours?.find(t => t.code === recours.type);
  const decisionObj = rulesConfig?.referentiels?.decisions_recours?.find(d => d.code === recours.decision);

  return el('tr', {}, [
    el('td', { style: { fontWeight: '500' } }, recours.candidat || '-'),
    el('td', {}, typeObj?.label || recours.type),
    el('td', {}, recours.dateDepot ? new Date(recours.dateDepot).toLocaleDateString() : '-'),
    el('td', {}, renderDecisionBadge(recours.decision, decisionObj?.label)),
    el('td', {}, recours.dateDecision ? new Date(recours.dateDecision).toLocaleDateString() : '-'),
    el('td', {}, [
      recours.documentId
        ? el('button', { className: 'btn btn-sm btn-secondary', style: { fontSize: '12px' } }, '📄 Voir')
        : el('span', { className: 'text-muted text-small' }, '-')
    ])
  ]);
}

function renderDecisionBadge(code, label) {
  const colorMap = {
    'EN_COURS': 'var(--color-warning)',
    'ACCEPTE': 'var(--color-success)',
    'REJETE': 'var(--color-error)',
    'PARTIELLEMENT_ACCEPTE': 'var(--color-info)'
  };

  const color = colorMap[code] || 'var(--color-gray-500)';

  return el('span', {
    style: {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '500',
      background: `${color}20`,
      color: color
    }
  }, label || code);
}

/**
 * Handle add recours
 */
async function handleAddRecours(idOperation) {
  // Collect form data
  const candidat = document.getElementById('recours-candidat')?.value;
  const type = document.getElementById('recours-type')?.value;
  const dateDepot = document.getElementById('recours-date-depot')?.value;
  const motifs = document.getElementById('recours-motifs')?.value;
  const decision = document.getElementById('recours-decision')?.value;
  const dateDecision = document.getElementById('recours-date-decision')?.value;
  const commentaire = document.getElementById('recours-commentaire')?.value;
  const docInput = document.getElementById('recours-document');

  // Validation
  if (!candidat || !type || !dateDepot) {
    alert('⚠️ Veuillez renseigner tous les champs obligatoires (candidat, type, date dépôt)');
    return;
  }

  // Handle document
  let documentId = null;
  if (docInput?.files?.[0]) {
    documentId = 'DOC_RECOURS_' + Date.now() + '.pdf';
    logger.info('[Recours] Document uploadé:', documentId);
  }

  // Create recours
  const recoursId = `REC-${idOperation}-${Date.now()}`;
  const recoursData = {
    id: recoursId,
    operationId: idOperation,
    candidat,
    type,
    dateDepot,
    motifs: motifs || '',
    decision: decision || 'EN_COURS',
    dateDecision: dateDecision || null,
    commentaire: commentaire || '',
    documentId,
    createdAt: new Date().toISOString()
  };

  const result = await dataService.add(ENTITIES.RECOURS, recoursData);

  if (!result.success) {
    alert('❌ Erreur lors de l\'enregistrement du recours');
    return;
  }

  logger.info('[Recours] Recours créé:', recoursId);
  alert('✅ Recours enregistré avec succès');

  // Reload page
  router.navigate('/recours', { idOperation });
}

export default renderRecours;
