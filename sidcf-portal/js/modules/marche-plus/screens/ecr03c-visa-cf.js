/**
 * ECR03C — Approbation du marché (Marché+)
 *
 * Modif #16 : la phase autrefois nommée « Visa CF » devient « Approbation ».
 * Le code interne (entité MP_VISA_CF, route /mp/visa-cf) est conservé pour
 * éviter une migration DB ; seule l'UI change.
 *
 * Champs saisis :
 *   - Organe approbateur (liste filtrée selon scope institution + montant)
 *   - Date d'approbation
 *   - Document associé (facultatif)
 */

import { el, mount } from '../../../lib/dom.js';
import logger from '../../../lib/logger.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { getLotsFromProcedure, resolveCurrentLotId, getLotData } from '../../../lib/lot-data.js';
import { renderLotSelector } from '../../../ui/widgets/lot-selector.js';
import { getOrganesApplicables, getInstitutionScope } from '../../../lib/mp-organes-approbation.js';

export async function renderVisaCF(params) {
  const { idOperation } = params;

  if (!idOperation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'ID opération manquant')
    ]));
    return;
  }

  logger.info('[ECR03C] Chargement écran Approbation', { idOperation });

  try {
    const fullData = await dataService.getMpOperationFull(idOperation);
    if (!fullData?.operation) {
      mount('#app', el('div', { className: 'page' }, [
        el('div', { className: 'alert alert-error' }, 'Opération non trouvée')
      ]));
      return;
    }

    const { operation, attribution, procedure } = fullData;

    const lots = getLotsFromProcedure(procedure);
    const currentLotId = resolveCurrentLotId(lots, params);

    if (!attribution) {
      mount('#app', el('div', { className: 'page' }, [
        el('div', { className: 'alert alert-warning' }, [
          el('p', {}, '⚠️ Cette opération n\'a pas encore d\'attribution.'),
          el('p', {}, 'L\'approbation ne peut être enregistrée qu\'après la contractualisation.')
        ])
      ]));
      return;
    }

    const attributionForLot = getLotData(attribution, currentLotId);

    // Récupérer une éventuelle approbation existante
    const allApprobations = await dataService.query(ENTITIES.MP_VISA_CF, { operationId: idOperation });
    const approbationsForLot = currentLotId
      ? allApprobations.filter(v => !v.lotId || v.lotId === currentLotId)
      : allApprobations;
    const approbation = (approbationsForLot && approbationsForLot.length > 0)
      ? approbationsForLot[approbationsForLot.length - 1]
      : null;

    // Charger les organes filtrés selon le scope (institution) et le montant
    const montantRef = (attributionForLot?.montants?.attribue
                       || attributionForLot?.montants?.ttc
                       || attributionForLot?.montants?.ht
                       || operation.montantPrevisionnel
                       || 0);
    const scope = getInstitutionScope();
    const organesApplicables = await getOrganesApplicables({ scope, montant: montantRef });

    const page = el('div', { className: 'page' }, [
      el('div', { className: 'page-header' }, [
        el('button', {
          className: 'btn btn-secondary btn-sm',
          onclick: () => router.navigate('/mp/fiche-marche', { idOperation })
        }, '← Retour fiche'),
        el('h1', { className: 'page-title', style: { marginTop: '12px' } }, '✅ Approbation du marché'),
        el('p', { className: 'page-subtitle' }, operation.objet)
      ]),

      renderLotSelector({
        lots,
        currentLotId,
        route: '/mp/visa-cf',
        routeParams: { idOperation }
      }),

      // Bandeau d'info contextuelle
      el('div', { className: 'alert alert-info', style: { marginBottom: '24px' } }, [
        el('div', { className: 'alert-icon' }, 'ℹ️'),
        el('div', { className: 'alert-content' }, [
          el('div', { className: 'alert-title' }, `Contexte : ${labelScope(scope)}`),
          el('div', { className: 'alert-message' },
            `Montant de référence : ${montantRef.toLocaleString('fr-FR')} XOF — ${organesApplicables.length} organe(s) applicable(s).`)
        ])
      ]),

      renderAttributionInfo(attributionForLot, operation),

      renderApprobationForm(approbation, organesApplicables, scope),

      el('div', { className: 'card' }, [
        el('div', { className: 'card-body' }, [
          el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } }, [
            el('button', {
              type: 'button',
              className: 'btn btn-secondary',
              onclick: () => router.navigate('/mp/fiche-marche', { idOperation })
            }, 'Annuler'),
            el('button', {
              type: 'button',
              className: 'btn btn-primary',
              onclick: async () => await handleSave(idOperation, attribution.id, currentLotId)
            }, approbation ? '💾 Mettre à jour l\'approbation' : '✅ Enregistrer l\'approbation')
          ])
        ])
      ])
    ]);

    mount('#app', page);

  } catch (err) {
    logger.error('[ECR03C] Erreur chargement', err);
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, `❌ Erreur : ${err.message}`)
    ]));
  }
}

function labelScope(scope) {
  const map = {
    'ADMIN_CENTRALE': 'Administration centrale',
    'DECONCENTRE': 'Marché déconcentré',
    'COLLECTIVITE_TERRITORIALE': 'Collectivité territoriale',
    'SODE_SPFME': 'Société d\'État / SPFME',
    'PROJET_COFINANCE': 'Projet cofinancé'
  };
  return map[scope] || scope;
}

function renderAttributionInfo(attribution, operation) {
  const attributaire = attribution.attributaire || {};
  const montants = attribution.montants || {};

  const entrepriseInfo = attributaire.nom
    || (attributaire.entreprises?.[0]?.raisonSociale)
    || attributaire.entrepriseId
    || 'Non renseigné';

  const montantPrincipal = montants.attribue || montants.ttc || montants.ht || 0;

  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '📋 Informations de l\'attribution')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' } }, [
        el('div', {}, [
          el('div', { className: 'text-small text-muted' }, 'Attributaire'),
          el('div', { style: { fontWeight: 'bold' } }, entrepriseInfo)
        ]),
        el('div', {}, [
          el('div', { className: 'text-small text-muted' }, 'NIF / NCC'),
          el('div', { style: { fontWeight: 'bold' } }, attributaire.nif || attributaire.ncc || '-')
        ]),
        el('div', {}, [
          el('div', { className: 'text-small text-muted' }, 'Montant attribué'),
          el('div', { style: { fontWeight: 'bold', color: '#0066cc' } },
            `${(typeof montantPrincipal === 'number' ? montantPrincipal.toLocaleString('fr-FR') : montantPrincipal)} ${montants.devise || 'XOF'}`)
        ])
      ])
    ])
  ]);
}

function renderApprobationForm(approbation, organes, scope) {
  const existing = approbation || {};
  const today = new Date().toISOString().split('T')[0];

  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '✅ Approbation')
    ]),
    el('div', { className: 'card-body' }, [
      // Organe approbateur
      el('div', { className: 'form-field', style: { marginBottom: '20px' } }, [
        el('label', { className: 'form-label' }, [
          'Organe approbateur',
          el('span', { className: 'required' }, '*')
        ]),
        el('select', {
          className: 'form-input',
          id: 'app-organe',
          required: true
        }, [
          el('option', { value: '' }, '-- Sélectionner --'),
          ...organes.map(o => el('option', {
            value: o.code,
            selected: o.code === existing.organeApprobateur
          }, formatOrganeOption(o)))
        ]),
        el('small', { className: 'text-muted', style: { marginTop: '4px', display: 'block' } },
          `Liste filtrée selon le périmètre « ${labelScope(scope)} » et le montant du marché. ` +
          `Sélectionnez « Autre / Non listé » si l'organe approbateur ne figure pas dans la liste.`)
      ]),

      // Date d'approbation
      el('div', { className: 'form-field', style: { marginBottom: '20px' } }, [
        el('label', { className: 'form-label' }, [
          'Date d\'approbation',
          el('span', { className: 'required' }, '*')
        ]),
        el('input', {
          type: 'date',
          className: 'form-input',
          id: 'app-date',
          value: existing.dateApprobation || existing.dateDecision || today,
          required: true,
          max: today
        })
      ]),

      // Document associé (facultatif)
      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'Document d\'approbation (facultatif)'),
        el('input', {
          type: 'file',
          className: 'form-input',
          id: 'app-document',
          accept: '.pdf,.doc,.docx,.png,.jpg,.jpeg'
        }),
        existing.documentApprobation
          ? el('small', { className: 'text-muted' }, `✓ Fichier existant : ${existing.documentApprobation}`)
          : el('small', { className: 'text-muted' }, 'Arrêté, décision, PV ou tout autre document justificatif')
      ])
    ])
  ]);
}

function formatOrganeOption(o) {
  let label = o.label;
  if (o.delegation && o.delegataireDe) {
    label += ' (par délégation)';
  }
  if (o.seuilMin != null || o.seuilMax != null) {
    const min = o.seuilMin != null ? `${(o.seuilMin / 1_000_000).toFixed(0)}M` : '0';
    const max = o.seuilMax != null ? `${(o.seuilMax / 1_000_000).toFixed(0)}M` : '∞';
    label += ` — seuil ${min} – ${max} XOF`;
  }
  return label;
}

async function handleSave(idOperation, attributionId, lotId = null) {
  try {
    const organeApprobateur = document.getElementById('app-organe')?.value;
    if (!organeApprobateur) {
      alert('⚠️ Veuillez sélectionner un organe approbateur');
      return;
    }
    const dateApprobation = document.getElementById('app-date')?.value;
    if (!dateApprobation) {
      alert('⚠️ Veuillez saisir la date d\'approbation');
      return;
    }

    // Document : pour l'instant on stocke juste le nom de fichier (upload R2 fait par l'écran avenant-create — on pourra brancher pareil ici plus tard)
    const fileInput = document.getElementById('app-document');
    const documentApprobation = fileInput?.files?.[0]?.name || null;

    const payload = {
      operationId: idOperation,
      attributionId: attributionId,
      lotId: lotId || null,
      organeApprobateur,
      dateApprobation,
      documentApprobation,
      // Rétro-compat schéma : la phase reste « approuvée » par défaut côté Marché+
      decision: 'APPROUVE',
      dateDecision: dateApprobation,
      createdAt: new Date().toISOString()
    };

    const result = await dataService.add(ENTITIES.MP_VISA_CF, payload);
    if (!result.success) {
      alert('❌ Erreur lors de la sauvegarde de l\'approbation');
      return;
    }

    // L'opération passe à l'état VISE (rétro-compat — équivalent à « approuvée » côté Marché+)
    await dataService.update(ENTITIES.MP_OPERATION, idOperation, {
      etat: 'VISE',
      updatedAt: new Date().toISOString()
    });

    alert('✅ Approbation enregistrée');
    router.navigate('/mp/fiche-marche', { idOperation });
  } catch (err) {
    logger.error('[ECR03C] Erreur sauvegarde', err);
    alert(`❌ Erreur lors de la sauvegarde : ${err.message}`);
  }
}

export default renderVisaCF;
