/* ============================================
   ECR05 - Clôture & Réceptions
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { renderSteps } from '../../../ui/widgets/steps.js';
import logger from '../../../lib/logger.js';
import {
  isFieldRequired,
  isFieldOptional,
  isFieldHidden,
  getContextualConfig
} from '../../../lib/procedure-context.js';

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

  // Get mode de passation for contextual behavior
  const modePassation = operation.modePassation || 'PSD';

  // Check if market is terminated (resiliée)
  const isResilie = operation.etat === 'RESILIE';

  // Check prerequisites
  if (isResilie) {
    mount('#app', el('div', { className: 'page' }, [
      renderSteps(fullData, idOperation),
      el('div', { className: 'alert alert-error' }, [
        el('div', { className: 'alert-icon' }, '🚫'),
        el('div', { className: 'alert-content' }, [
          el('div', { className: 'alert-title' }, 'Marché résilié'),
          el('div', { className: 'alert-message' }, 'Un marché résilié ne peut pas être clôturé normalement. Consultez la section Avenants pour les détails de la résiliation.')
        ])
      ]),
      el('div', { style: { marginTop: '16px' } }, [
        createButton('btn btn-primary', '← Retour', () => router.navigate('/fiche-marche', { idOperation }))
      ])
    ]));
    return;
  }

  // Vérifier si le marché peut accéder à la clôture
  // Un marché peut être clôturé s'il est EN_EXEC, CLOS, ou s'il a des ordres de service
  const { ordresService } = fullData;
  const canAccessCloture =
    operation.etat === 'EN_EXEC' ||
    operation.etat === 'CLOS' ||
    (ordresService && ordresService.length > 0) ||
    (operation.timeline && operation.timeline.includes('EXEC'));

  if (!canAccessCloture) {
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

  // Load cloture by operationId (compatible avec PostgreSQL UUIDs)
  const clotures = await dataService.query(ENTITIES.CLOTURE, { operationId: idOperation });
  let cloture = clotures && clotures.length > 0 ? clotures[0] : null;
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

    // Date dernier décompte (tous les modes)
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '💰 Achèvement Physique des Prestations')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, ['Date du dernier décompte', el('span', { className: 'required' }, '*')]),
          el('input', {
            type: 'date',
            className: 'form-input',
            id: 'cloture-date-dernier-decompte',
            value: cloture?.dateDernierDecompte || '',
            required: true
          }),
          el('small', { className: 'text-muted' }, 'Date marquant l\'achèvement physique des prestations')
        ])
      ])
    ]),

    // Satisfaction bénéficiaires (PSC uniquement)
    !isFieldHidden('satisfactionBeneficiaires', modePassation, 'cloture')
      ? el('div', { className: 'card', style: { marginBottom: '24px' } }, [
          el('div', { className: 'card-header' }, [
            el('h3', { className: 'card-title' }, '😊 Satisfaction des Bénéficiaires')
          ]),
          el('div', { className: 'card-body' }, [
            el('div', { className: 'alert alert-info' }, [
              el('strong', {}, 'Spécifique PSC:'),
              el('p', { style: { marginTop: '8px' } }, 'Pour les procédures simplifiées de demande de cotation, il est recommandé de recueillir l\'avis des bénéficiaires finaux.')
            ]),
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Niveau de satisfaction'),
              el('select', {
                className: 'form-input',
                id: 'cloture-satisfaction'
              }, [
                el('option', { value: '' }, '-- Sélectionner --'),
                el('option', { value: 'TRES_SATISFAIT', selected: cloture?.satisfactionBeneficiaires === 'TRES_SATISFAIT' }, 'Très satisfait'),
                el('option', { value: 'SATISFAIT', selected: cloture?.satisfactionBeneficiaires === 'SATISFAIT' }, 'Satisfait'),
                el('option', { value: 'NEUTRE', selected: cloture?.satisfactionBeneficiaires === 'NEUTRE' }, 'Neutre'),
                el('option', { value: 'INSATISFAIT', selected: cloture?.satisfactionBeneficiaires === 'INSATISFAIT' }, 'Insatisfait'),
                el('option', { value: 'TRES_INSATISFAIT', selected: cloture?.satisfactionBeneficiaires === 'TRES_INSATISFAIT' }, 'Très insatisfait')
              ])
            ]),
            el('div', { className: 'form-field', style: { marginTop: '12px' } }, [
              el('label', { className: 'form-label' }, 'Commentaires'),
              el('textarea', {
                className: 'form-input',
                id: 'cloture-satisfaction-commentaires',
                rows: 3,
                value: cloture?.satisfactionCommentaires || '',
                placeholder: 'Retours d\'expérience des bénéficiaires...'
              })
            ])
          ])
        ])
      : null,

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
  const dateDernierDecompte = document.getElementById('cloture-date-dernier-decompte')?.value;
  const satisfaction = document.getElementById('cloture-satisfaction')?.value || null;
  const satisfactionCommentaires = document.getElementById('cloture-satisfaction-commentaires')?.value || null;
  const synthese = document.getElementById('cloture-synthese')?.value;

  if (!dateRP) {
    alert('⚠️ La date de réception provisoire est obligatoire');
    return;
  }

  if (!dateDernierDecompte) {
    alert('⚠️ La date du dernier décompte est obligatoire');
    return;
  }

  if (definitive && !dateRD) {
    alert('⚠️ La date de réception définitive est obligatoire pour clôturer');
    return;
  }

  // Chercher si une clôture existe déjà pour cette opération
  const existingClotures = await dataService.query(ENTITIES.CLOTURE, { operationId: idOperation });
  const existingCloture = existingClotures && existingClotures.length > 0 ? existingClotures[0] : null;

  // Générer un UUID valide ou réutiliser l'existant
  const clotureId = existingCloture?.id || crypto.randomUUID();

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
    dateDernierDecompte,
    satisfactionBeneficiaires: satisfaction,
    satisfactionCommentaires,
    mainlevees: [], // TODO: track mainlevees
    syntheseFinale: synthese || '',
    closAt: definitive ? new Date().toISOString() : null,
    createdAt: existingCloture?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  let result;
  if (existingCloture) {
    result = await dataService.update(ENTITIES.CLOTURE, clotureId, clotureData);
  } else {
    result = await dataService.add(ENTITIES.CLOTURE, clotureData);
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
