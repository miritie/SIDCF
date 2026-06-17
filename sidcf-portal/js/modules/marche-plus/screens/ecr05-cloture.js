/* ============================================
   ECR05 - Clôture & Réceptions
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { renderSteps } from '../../../ui/widgets/steps-mp.js';
import logger from '../../../lib/logger.js';
import {
  isFieldRequired,
  isFieldOptional,
  isFieldHidden,
  getContextualConfig
} from '../../../lib/procedure-context.js';
import { getLotData, buildLotPatch, getLotsFromProcedure, resolveCurrentLotId } from '../../../lib/lot-data.js';
import { renderLotSelector } from '../../../ui/widgets/lot-selector.js';
import { renderPageHeaderMP } from '../../../ui/widgets/page-header-mp.js';
import { renderNextPhaseButton } from '../../../ui/widgets/next-phase-button-mp.js';
import { renderDifficultesGatedBloc } from '../../../ui/widgets/difficultes-manager-mp.js';

function createButton(className, text, onClick) {
  const btn = el('button', { className }, text);
  btn.addEventListener('click', onClick);
  return btn;
}

export async function renderCloture(params) {
  const { idOperation } = params;

  if (!idOperation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'ID marché manquant')
    ]));
    return;
  }

  const fullData = await dataService.getMpOperationFull(idOperation);
  if (!fullData?.operation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'Marché / contrat introuvable')
    ]));
    return;
  }

  const { operation, procedure } = fullData;

  // Get mode de passation for contextual behavior
  const modePassation = operation.modePassation || 'PSD';

  // Marché+ multi-lot : résoudre le lot courant
  const lots = getLotsFromProcedure(procedure);
  const currentLotId = resolveCurrentLotId(lots, params);

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
        createButton('btn btn-primary', '← Retour', () => router.navigate('/mp/fiche-marche', { idOperation }))
      ])
    ]));
    return;
  }

  // Vérifier si le marché peut accéder à la clôture
  // Un marché peut être clôturé s'il est EN_EXEC, CLOS, ou s'il a des ordres de service
  const { ordresService } = fullData;
  // Modif #61 — Standardisation timeline : accepte les deux codes 'EN_EXEC'
  // (nouveau, cohérent avec l'état) et 'EXEC' (legacy) pour rétrocompat.
  const canAccessCloture =
    operation.etat === 'EN_EXEC' ||
    operation.etat === 'CLOS' ||
    (ordresService && ordresService.length > 0) ||
    (operation.timeline && (operation.timeline.includes('EN_EXEC') || operation.timeline.includes('EXEC')));

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
        createButton('btn btn-primary', '← Retour', () => router.navigate('/mp/fiche-marche', { idOperation }))
      ])
    ]));
    return;
  }

  // Load cloture by operationId (compatible avec PostgreSQL UUIDs)
  const clotures = await dataService.query(ENTITIES.MP_CLOTURE, { operationId: idOperation });
  const rawCloture = clotures && clotures.length > 0 ? clotures[0] : null;
  // Vue scopée au lot courant (merge root + parLot[lotId])
  const cloture = getLotData(rawCloture, currentLotId);

  // Garanties : filtrer au lot courant pour la section "Mainlevées"
  const garantiesRaw = await dataService.query(ENTITIES.MP_GARANTIE, { operationId: idOperation });
  const garanties = currentLotId
    ? garantiesRaw.filter(g => !g.lotId || g.lotId === currentLotId)
    : garantiesRaw;

  const page = el('div', { className: 'page' }, [
    renderSteps(fullData, idOperation),

    // Header — Modif #68
    renderPageHeaderMP({
      idOperation, operation,
      phaseIcon: '🏁', phaseLabel: 'Clôture',
      titre: 'Réceptions provisoire & définitive'
    }),

    // Sélecteur de lot (visible si > 1 lot)
    renderLotSelector({
      lots,
      currentLotId,
      route: '/mp/cloture',
      routeParams: { idOperation }
    }),

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
                // Modif #177 (R client) — pas de superlatifs : retrait de « Très satisfait » et « Très insatisfait ».
                el('option', { value: 'SATISFAIT', selected: cloture?.satisfactionBeneficiaires === 'SATISFAIT' }, 'Satisfait'),
                el('option', { value: 'NEUTRE', selected: cloture?.satisfactionBeneficiaires === 'NEUTRE' }, 'Neutre'),
                el('option', { value: 'INSATISFAIT', selected: cloture?.satisfactionBeneficiaires === 'INSATISFAIT' }, 'Insatisfait')
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
          createButton('btn btn-secondary', 'Annuler', () => router.navigate('/mp/fiche-marche', { idOperation })),
          el('div', { style: { display: 'flex', gap: '12px' } }, [
            createButton('btn btn-primary', 'Enregistrer', async () => {
              await handleSave(idOperation, false, currentLotId, rawCloture);
            }),
            cloture?.receptionDef?.date && garanties.every(g => g.mainleveeDate)
              ? createButton('btn btn-success', '✓ Clôturer Définitivement', async () => {
                  await handleSave(idOperation, true, currentLotId, rawCloture);
                })
              : null
          ])
        ])
      ])
    ])
  ]);

  // Modif #127 (E-2/E-22) — Bloc difficultés (OUI/NON) présent à cette étape.
  page.appendChild(renderDifficultesGatedBloc({ operationId: idOperation, registries: dataService.getAllRegistries(), lots: [] }));

  // Modif #69 — Bouton démo « Passer à l'étape suivante »
  page.appendChild(renderNextPhaseButton({ idOperation, operation }));
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

/**
 * Marché+ multi-lot : si lotId est fourni, les champs métier vont sous
 * `entity.parLot[lotId]` plutôt qu'à la racine (back-compat single-lot).
 */
async function handleSave(idOperation, definitive, lotId = null, rawCloture = null) {
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

  // Chercher si une clôture existe déjà pour cette opération (utilise rawCloture si fourni)
  let existing = rawCloture;
  if (!existing) {
    const c = await dataService.query(ENTITIES.MP_CLOTURE, { operationId: idOperation });
    existing = c && c.length > 0 ? c[0] : null;
  }

  // Générer un UUID valide ou réutiliser l'existant
  const clotureId = existing?.id || crypto.randomUUID();

  // Champs métier (per-lot ou racine selon lotId)
  const lotFields = {
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
    closAt: definitive ? new Date().toISOString() : null
  };

  // Construit le patch : si lotId, les champs vont sous parLot[lotId]
  const lotPatch = buildLotPatch(lotId, lotFields, existing);

  let result;
  if (existing) {
    const updateData = {
      ...lotPatch,
      operationId: idOperation,
      updatedAt: new Date().toISOString()
    };
    result = await dataService.update(ENTITIES.MP_CLOTURE, clotureId, updateData);
  } else {
    const createData = {
      ...lotPatch,
      id: clotureId,
      operationId: idOperation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    result = await dataService.add(ENTITIES.MP_CLOTURE, createData);
  }

  if (!result.success) {
    alert('❌ Erreur lors de la sauvegarde');
    return;
  }

  // Update operation timeline
  if (definitive) {
    const operation = await dataService.get(ENTITIES.MP_OPERATION, idOperation);
    const updateData = {
      timeline: [...operation.timeline, 'CLOT'],
      etat: 'CLOS',
      updatedAt: new Date().toISOString()
    };
    await dataService.update(ENTITIES.MP_OPERATION, idOperation, updateData);
    alert('✅ Marché clôturé définitivement');
  } else {
    alert('✅ Données de clôture enregistrées');
  }

  router.navigate('/mp/fiche-marche', { idOperation });
}

export default renderCloture;
