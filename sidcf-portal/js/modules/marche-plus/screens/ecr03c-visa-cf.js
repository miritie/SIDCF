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
import { uploadDocument } from '../../../lib/r2-storage-mp.js';

export async function renderVisaCF(params) {
  const { idOperation } = params;

  if (!idOperation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'ID marché manquant')
    ]));
    return;
  }

  logger.info('[ECR03C] Chargement écran Approbation', { idOperation });

  try {
    const fullData = await dataService.getMpOperationFull(idOperation);
    if (!fullData?.operation) {
      mount('#app', el('div', { className: 'page' }, [
        el('div', { className: 'alert alert-error' }, 'Marché / contrat introuvable')
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

    // Récupérer une éventuelle approbation existante (la plus récente)
    const allApprobations = await dataService.query(ENTITIES.MP_VISA_CF, { operationId: idOperation });
    const approbationsForLot = currentLotId
      ? allApprobations.filter(v => !v.lotId || v.lotId === currentLotId)
      : allApprobations;
    // Tri par createdAt décroissant : on veut la plus récente en premier
    approbationsForLot.sort((a, b) => {
      const da = new Date(a.createdAt || a.dateDecision || 0).getTime();
      const db = new Date(b.createdAt || b.dateDecision || 0).getTime();
      return db - da;
    });
    const approbation = (approbationsForLot && approbationsForLot.length > 0)
      ? approbationsForLot[0]
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
        el('div', { style: { marginTop: '12px', marginBottom: '4px', fontSize: '12px', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 } }, '🔍 Vous êtes ici · Étape Approbation'),
        el('h1', { className: 'page-title' }, '🔍 Approbation — Organe approbateur'),
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
              onclick: async () => await handleSave(idOperation, attribution.id, currentLotId, approbation)
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
          el('div', { className: 'text-small text-muted' }, 'Montant du marché de base'),
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
          ...organes.map(o => {
            const attrs = { value: o.code };
            if (o.code === existing.organeApprobateur) attrs.selected = 'selected';
            return el('option', attrs, formatOrganeOption(o));
          })
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
          // Slicer la date ISO en YYYY-MM-DD (input type=date n'accepte pas le format ISO complet)
          value: toDateInputValue(existing.dateApprobation || existing.dateDecision || today),
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
          ? el('div', { style: { marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' } }, [
              el('small', { className: 'text-muted' }, '✓ Document déjà uploadé :'),
              isUrl(existing.documentApprobation)
                ? el('a', { href: existing.documentApprobation, target: '_blank', rel: 'noopener', style: { fontSize: '12px' } }, '📎 Ouvrir le document')
                : el('small', { className: 'text-muted' }, existing.documentApprobation),
              el('small', { className: 'text-muted', style: { fontStyle: 'italic' } }, '(sélectionner un nouveau fichier pour le remplacer)')
            ])
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

function isUrl(s) {
  return typeof s === 'string' && /^https?:\/\//i.test(s);
}

// Normalise une date (ISO complet, YYYY-MM-DD ou Date) → YYYY-MM-DD pour input type=date
function toDateInputValue(v) {
  if (!v) return '';
  if (typeof v === 'string') {
    // déjà au format YYYY-MM-DD ?
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    // ISO complet → on slice
    return v.slice(0, 10);
  }
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return '';
}

async function handleSave(idOperation, attributionId, lotId = null, existingApprobation = null) {
  const saveBtn = document.querySelector('.btn-primary');
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

    // Document : si un fichier est sélectionné, upload R2 ; sinon on garde l'existant
    let documentApprobation = existingApprobation?.documentApprobation || null;
    const fileInput = document.getElementById('app-document');
    const newFile = fileInput?.files?.[0];

    if (newFile) {
      if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '⏳ Upload du document...'; }
      try {
        const upRes = await uploadDocument(newFile, {
          phase: 'APPROBATION',
          typeDocument: 'DOC_APPROBATION',
          entityType: 'MP_VISA_CF',
          entityId: existingApprobation?.id || null,
          operationId: idOperation
        });
        documentApprobation = upRes.url;
        logger.info('[ECR03C] Document uploadé sur R2 :', upRes.url);
      } catch (uploadErr) {
        logger.error('[ECR03C] Échec upload R2', uploadErr);
        if (!confirm(`⚠️ Échec de l'upload du document : ${uploadErr.message}\n\nEnregistrer l'approbation sans le document ?`)) {
          if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = existingApprobation ? '💾 Mettre à jour l\'approbation' : '✅ Enregistrer l\'approbation'; }
          return;
        }
      }
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '⏳ Enregistrement...'; }
    }

    const payload = {
      organeApprobateur,
      dateApprobation,
      documentApprobation,
      // Rétro-compat schéma : la phase reste « approuvée » par défaut côté Marché+
      decision: 'APPROUVE',
      dateDecision: dateApprobation,
      updatedAt: new Date().toISOString()
    };

    let ok = false;
    if (existingApprobation && existingApprobation.id) {
      const upd = await dataService.update(ENTITIES.MP_VISA_CF, existingApprobation.id, payload);
      ok = upd?.success;
      if (ok) logger.info('[ECR03C] Approbation mise à jour :', existingApprobation.id);
    } else {
      const created = await dataService.add(ENTITIES.MP_VISA_CF, {
        ...payload,
        operationId: idOperation,
        attributionId: attributionId,
        lotId: lotId || null,
        createdAt: new Date().toISOString()
      });
      ok = created?.success;
      if (ok) logger.info('[ECR03C] Approbation créée');
    }

    if (!ok) {
      alert('❌ Erreur lors de la sauvegarde de l\'approbation');
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = existingApprobation ? '💾 Mettre à jour l\'approbation' : '✅ Enregistrer l\'approbation'; }
      return;
    }

    // L'opération passe à l'état VISE (rétro-compat — équivalent à « approuvée » côté Marché+)
    await dataService.update(ENTITIES.MP_OPERATION, idOperation, {
      etat: 'VISE',
      updatedAt: new Date().toISOString()
    });

    alert(existingApprobation ? '💾 Approbation mise à jour' : '✅ Approbation enregistrée');
    router.navigate('/mp/fiche-marche', { idOperation });
  } catch (err) {
    logger.error('[ECR03C] Erreur sauvegarde', err);
    alert(`❌ Erreur lors de la sauvegarde : ${err.message}`);
  }
}

export default renderVisaCF;
