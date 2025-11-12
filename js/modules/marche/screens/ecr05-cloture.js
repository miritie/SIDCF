/* ============================================
   ECR05 - Clôture & Réceptions
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

export async function renderCloture(params) {
  const { idOperation } = params;

  if (!idOperation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'ID opération manquant')
    ]));
    return;
  }

  const fullData = await dataService.getOperationFull(idOperation);
  if (!fullData?.operation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'Opération non trouvée')
    ]));
    return;
  }

  const { operation } = fullData;

  // Check prerequisites
  if (!operation.timeline.includes('EXEC')) {
    mount('#app', el('div', { className: 'page' }, [
      renderSteps(fullData, idOperation),
      el('div', { className: 'alert alert-warning' }, [
        el('div', { className: 'alert-icon' }, '⚠️'),
        el('div', { className: 'alert-content' }, [
          el('div', { className: 'alert-title' }, 'Exécution non commencée'),
          el('div', { className: 'alert-message' }, 'Le marché doit être en exécution pour être clôturé.')
        ])
      ]),
      el('div', { style: { marginTop: '16px' } }, [
        createButton('btn btn-primary', '← Retour', () => router.navigate('/fiche-marche', { idOperation }))
      ])
    ]));
    return;
  }

  // Load cloture
  let cloture = await dataService.get(ENTITIES.CLOTURE, `CLO-${idOperation}`);
  const garanties = await dataService.query(ENTITIES.GARANTIE, { operationId: idOperation });

  const page = el('div', { className: 'page' }, [
    renderSteps(fullData, idOperation),

    el('div', { className: 'page-header' }, [
      createButton('btn btn-secondary btn-sm', '← Retour fiche', () => router.navigate('/fiche-marche', { idOperation })),
      el('h1', { className: 'page-title', style: { marginTop: '12px' } }, 'Clôture & Réceptions'),
      el('p', { className: 'page-subtitle' }, operation.objet)
    ]),

    // Réception provisoire
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '📋 Réception Provisoire')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' } }, [
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, ['Date réception provisoire', el('span', { className: 'required' }, '*')]),
            el('input', {
              type: 'date',
              className: 'form-input',
              id: 'cloture-date-rp',
              value: cloture?.receptionProv?.date || ''
            })
          ])
        ]),

        el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
          el('label', { className: 'form-label' }, 'Réserves éventuelles'),
          el('textarea', {
            className: 'form-input',
            id: 'cloture-reserves-rp',
            rows: 3,
            value: cloture?.receptionProv?.reserves || '',
            placeholder: 'Réserves consignées dans le PV...'
          })
        ]),

        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'PV Réception Provisoire (PDF)'),
          el('input', {
            type: 'file',
            className: 'form-input',
            id: 'cloture-pv-rp',
            accept: '.pdf'
          })
        ])
      ])
    ]),

    // Réception définitive
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '✅ Réception Définitive')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' } }, [
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Date réception définitive'),
            el('input', {
              type: 'date',
              className: 'form-input',
              id: 'cloture-date-rd',
              value: cloture?.receptionDef?.date || ''
            })
          ])
        ]),

        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'PV Réception Définitive (PDF)'),
          el('input', {
            type: 'file',
            className: 'form-input',
            id: 'cloture-pv-rd',
            accept: '.pdf'
          })
        ])
      ])
    ]),

    // Mainlevées garanties
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '🛡️ Mainlevées des Garanties')
      ]),
      el('div', { className: 'card-body' }, [
        garanties.length > 0
          ? el('div', { style: { marginBottom: '16px' } },
              garanties.map(g => renderGarantieCheckbox(g))
            )
          : el('div', { className: 'alert alert-info' }, 'Aucune garantie enregistrée'),

        garanties.filter(g => !g.mainleveeDate).length > 0
          ? el('div', { className: 'alert alert-warning' }, [
              el('div', { className: 'alert-icon' }, '⚠️'),
              el('div', { className: 'alert-content' }, [
                el('div', { className: 'alert-title' }, 'Garanties non levées'),
                el('div', { className: 'alert-message' }, `${garanties.filter(g => !g.mainleveeDate).length} garantie(s) doivent être levées avant clôture définitive.`)
              ])
            ])
          : null
      ])
    ]),

    // Synthèse finale
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '📝 Synthèse Finale')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Bilan technique et financier'),
          el('textarea', {
            className: 'form-input',
            id: 'cloture-synthese',
            rows: 5,
            value: cloture?.syntheseFinale || '',
            placeholder: 'Bilan final du marché: respect des délais, qualité des prestations, montants payés, etc.'
          })
        ])
      ])
    ]),

    // Actions
    el('div', { className: 'card' }, [
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'space-between' } }, [
          createButton('btn btn-secondary', 'Annuler', () => router.navigate('/fiche-marche', { idOperation })),
          el('div', { style: { display: 'flex', gap: '12px' } }, [
            createButton('btn btn-primary', 'Enregistrer', async () => {
              await handleSave(idOperation, false);
            }),
            cloture?.receptionDef?.date && garanties.every(g => g.mainleveeDate)
              ? createButton('btn btn-success', '✓ Clôturer Définitivement', async () => {
                  await handleSave(idOperation, true);
                })
              : null
          ])
        ])
      ])
    ])
  ]);

  mount('#app', page);
}

function renderGarantieCheckbox(garantie) {
  const typeLabels = {
    'AVANCE': 'Garantie d\'avance',
    'BONNE_EXEC': 'Garantie de bonne exécution',
    'RETENUE': 'Retenue de garantie'
  };

  return el('div', {
    style: {
      padding: '8px 12px',
      marginBottom: '8px',
      borderRadius: '6px',
      border: '1px solid var(--color-gray-300)',
      background: garantie.mainleveeDate ? 'var(--color-success-50)' : 'var(--color-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, [
    el('div', {}, [
      el('div', { style: { fontWeight: '500', fontSize: '14px' } }, typeLabels[garantie.type] || garantie.type),
      el('div', { className: 'text-small text-muted' }, `${(garantie.montant / 1000000).toFixed(2)}M XOF`)
    ]),
    el('div', {}, [
      garantie.mainleveeDate
        ? el('span', { style: { color: 'var(--color-success)', fontWeight: '500' } }, `✓ Levée le ${new Date(garantie.mainleveeDate).toLocaleDateString()}`)
        : el('span', { style: { color: 'var(--color-warning)', fontWeight: '500' } }, '⏳ En attente')
    ])
  ]);
}

async function handleSave(idOperation, definitive) {
  const dateRP = document.getElementById('cloture-date-rp')?.value;
  const reservesRP = document.getElementById('cloture-reserves-rp')?.value;
  const dateRD = document.getElementById('cloture-date-rd')?.value;
  const synthese = document.getElementById('cloture-synthese')?.value;

  if (!dateRP) {
    alert('⚠️ La date de réception provisoire est obligatoire');
    return;
  }

  if (definitive && !dateRD) {
    alert('⚠️ La date de réception définitive est obligatoire pour clôturer');
    return;
  }

  const clotureId = `CLO-${idOperation}`;
  const clotureData = {
    id: clotureId,
    operationId: idOperation,
    receptionProv: {
      date: dateRP,
      pv: 'PV_RP_' + Date.now() + '.pdf',
      reserves: reservesRP || null
    },
    receptionDef: {
      date: dateRD || null,
      pv: dateRD ? 'PV_RD_' + Date.now() + '.pdf' : null
    },
    mainlevees: [], // TODO: track mainlevees
    syntheseFinale: synthese || '',
    closAt: definitive ? new Date().toISOString() : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const existing = await dataService.get(ENTITIES.CLOTURE, clotureId);
  let result;
  if (existing) {
    result = await dataService.update(ENTITIES.CLOTURE, clotureId, clotureData);
  } else {
    result = await dataService.create(ENTITIES.CLOTURE, clotureData);
  }

  if (!result.success) {
    alert('❌ Erreur lors de la sauvegarde');
    return;
  }

  // Update operation timeline
  if (definitive) {
    const operation = await dataService.get(ENTITIES.OPERATION, idOperation);
    const updateData = {
      timeline: [...operation.timeline, 'CLOT'],
      etat: 'CLOS',
      updatedAt: new Date().toISOString()
    };
    await dataService.update(ENTITIES.OPERATION, idOperation, updateData);
    alert('✅ Marché clôturé définitivement');
  } else {
    alert('✅ Données de clôture enregistrées');
  }

  router.navigate('/fiche-marche', { idOperation });
}

export default renderCloture;
