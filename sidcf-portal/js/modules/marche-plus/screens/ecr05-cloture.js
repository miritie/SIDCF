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

  // Doc clôture 24/06 (Lot 1) — Situation de paiement (écart) + délai (calculés).
  const mpDecomptes = await dataService.query(ENTITIES.MP_DECOMPTE, { operationId: idOperation }).catch(() => []);
  const attributionForCloture = getLotData(fullData.attribution, currentLotId);
  const avenantsForCloture = (fullData.avenants || []).filter(av => !currentLotId || !av.lotId || av.lotId === currentLotId);
  const montantBaseTTC = Number(attributionForCloture?.montants?.ttc) || Number(attributionForCloture?.montants?.attribue) || Number(attributionForCloture?.montantAttribue) || 0;
  const totalAvenants = avenantsForCloture.reduce((s, a) => s + (Number(a.variationMontant) || 0), 0);
  const montantTotalMarche = montantBaseTTC + totalAvenants;
  const cumulDecomptes = (mpDecomptes || []).filter(d => d.etat === 'VISE' || d.etat === 'PAYE').reduce((s, d) => s + (Number(d.netTTC) || 0), 0);
  const ecartPaiement = montantTotalMarche - cumulDecomptes;
  // Délai contractuel vs réel
  const dureeContractuelle = Number(attributionForCloture?.dates?.delaiExecution) || 0;
  const dureeUnite = attributionForCloture?.dates?.delaiUnite || 'JOURS';
  const osDate = (fullData.ordresService && fullData.ordresService[0]) ? fullData.ordresService[0].dateEmission : null;
  const finDate = cloture?.receptionDef?.date || cloture?.receptionProv?.date || null;

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
          : null,

        // Doc clôture 24/06 (décision A) — enregistrer les OUI/NON + rappel vers la
        // mainlevée détaillée (date/doc) en ECR04C pour préciser au besoin.
        garanties.length > 0
          ? el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '12px' } }, [
              createButton('btn btn-sm btn-secondary', '🛡️ Préciser (date/doc) en écran Garanties', () => router.navigate('/mp/garanties', { idOperation })),
              createButton('btn btn-primary', '💾 Enregistrer les mainlevées (OUI/NON)', async () => {
                try {
                  for (const g of garanties) {
                    const val = document.getElementById(`garantie-levee-${g.id}`)?.value;
                    if (val === 'OUI' && !g.mainleveeDate) {
                      await dataService.update(ENTITIES.MP_GARANTIE, g.id, { etat: 'LEVEE', mainleveeDate: new Date().toISOString() });
                    } else if (val === 'NON' && g.mainleveeDate) {
                      await dataService.update(ENTITIES.MP_GARANTIE, g.id, { etat: 'ACTIVE', mainleveeDate: null });
                    }
                  }
                  alert('✅ Statut des mainlevées enregistré.');
                  router.navigate('/mp/cloture', { idOperation });
                } catch (e) { alert('❌ Erreur lors de l\'enregistrement des mainlevées.'); }
              })
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
        el('h3', { className: 'card-title' }, '📝 Synthèse & enseignements')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { className: 'form-field', style: { marginBottom: '12px' } }, [
          el('label', { className: 'form-label' }, 'Bilan technique et financier'),
          el('textarea', {
            className: 'form-input',
            id: 'cloture-synthese',
            rows: 4,
            value: cloture?.syntheseFinale || '',
            placeholder: 'Bilan final du marché: respect des délais, qualité des prestations, montants payés, etc.'
          })
        ]),
        // Note métier — Enseignement structuré : leçons tirées + recommandations.
        el('div', { className: 'form-field', style: { marginBottom: '12px' } }, [
          el('label', { className: 'form-label' }, '🎓 Leçons tirées'),
          el('textarea', {
            className: 'form-input',
            id: 'cloture-lecons',
            rows: 3,
            value: cloture?.leconsTirees || '',
            placeholder: 'Ce que l\'exécution de ce marché a appris (difficultés rencontrées, bonnes pratiques, points d\'attention…).'
          })
        ]),
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, '💡 Recommandations'),
          el('textarea', {
            className: 'form-input',
            id: 'cloture-recommandations',
            rows: 3,
            value: cloture?.recommandations || '',
            placeholder: 'Recommandations pour les marchés similaires à venir.'
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

  // Note 5 (réunion) — Phase 2 : bilan livrables prévisionnel/réalisé + justif CF des écarts.
  if (Array.isArray(operation?.livrables) && operation.livrables.length > 0) {
    page.appendChild(renderLivrablesBilanSection({ operation, idOperation, registries: dataService.getAllRegistries() }));
  }

  // Doc clôture 24/06 (Lot 1) — Situation de paiement (écart) + Délai (contractuel vs réel).
  page.appendChild(renderSituationPaiementCard({
    montantTotalMarche, cumulDecomptes, ecartPaiement,
    nbDecomptesVises: (mpDecomptes || []).filter(d => d.etat === 'VISE' || d.etat === 'PAYE').length,
    observation: cloture?.observationPaiement || ''
  }));
  page.appendChild(renderDelaiCard({ dureeContractuelle, dureeUnite, osDate, finDate }));

  // Doc clôture 24/06 (Lot 3) — accès à la Fiche de clôture (synthèse CF imprimable).
  page.appendChild(el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-body', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' } }, [
      el('div', {}, [
        el('div', { style: { fontWeight: 600 } }, '📄 Fiche de clôture'),
        el('div', { className: 'text-small text-muted' }, 'Synthèse imprimable centrée sur le Contrôleur Financier (montants, paiement, délai, livrables, garanties).')
      ]),
      createButton('btn btn-primary', '📄 Ouvrir la fiche de clôture', () => router.navigate('/mp/fiche-cloture', { idOperation }))
    ])
  ]));

  // Modif #127 (E-2/E-22) — Bloc difficultés (OUI/NON) présent à cette étape.
  page.appendChild(renderDifficultesGatedBloc({ operationId: idOperation, registries: dataService.getAllRegistries(), lots: [] }));

  // Modif #69 — Bouton démo « Passer à l'étape suivante »
  page.appendChild(renderNextPhaseButton({ idOperation, operation }));
  mount('#app', page);
}

/**
 * Doc clôture 24/06 (Lot 1) — Situation de paiement : croise le montant total du
 * marché et le cumul des décomptes visés, sort l'écart + un commentaire (soldé ou
 * non). Les valeurs et le commentaire sont persistés avec la clôture (handleSave).
 */
function renderSituationPaiementCard({ montantTotalMarche, cumulDecomptes, ecartPaiement, nbDecomptesVises, observation }) {
  const fmt = (n) => `${Number(n || 0).toLocaleString('fr-FR')} XOF`;
  const solde = Math.abs(Number(ecartPaiement) || 0) < 1;
  const ecartColor = solde ? '#16a34a' : '#b45309';
  const kpi = (label, value, color) => el('div', { style: { textAlign: 'center', padding: '10px', background: '#f8fafc', borderRadius: '8px' } }, [
    el('div', { className: 'text-small text-muted' }, label),
    el('div', { style: { fontWeight: 700, fontSize: '15px', color: color || 'inherit' } }, value)
  ]);
  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header' }, [el('h3', { className: 'card-title' }, '💳 Situation de paiement à la clôture')]),
    el('div', { className: 'card-body' }, [
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' } }, [
        kpi('Montant total du marché', fmt(montantTotalMarche)),
        kpi(`Cumul décomptes visés (${nbDecomptesVises})`, fmt(cumulDecomptes)),
        kpi('Écart', fmt(ecartPaiement), ecartColor),
        kpi('Statut', solde ? '✓ Soldé' : '⚠️ Non soldé', ecartColor)
      ]),
      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'Observation (situation de paiement — soldé ou non)'),
        el('textarea', { className: 'form-input', id: 'cloture-observation-paiement', rows: 2, placeholder: 'Commentaire du CF sur la situation de paiement…' }, observation || '')
      ]),
      el('input', { type: 'hidden', id: 'cloture-montant-total', value: String(montantTotalMarche) }),
      el('input', { type: 'hidden', id: 'cloture-cumul-decomptes', value: String(cumulDecomptes) }),
      el('input', { type: 'hidden', id: 'cloture-ecart', value: String(ecartPaiement) })
    ])
  ]);
}

/**
 * Doc clôture 24/06 (Lot 1) — Délai : croise le délai contractuel et le délai réel
 * (OS de démarrage → réception), indique « dans le délai / hors délai » + alerte
 * clignotante si dépassement. Calculé (pas de persistance).
 */
function renderDelaiCard({ dureeContractuelle, dureeUnite, osDate, finDate }) {
  const toDays = (v) => (dureeUnite === 'MOIS' ? v * 30 : v);
  const contractuelJours = toDays(Number(dureeContractuelle) || 0);
  let reelJours = null;
  if (osDate && finDate) reelJours = Math.round((new Date(finDate) - new Date(osDate)) / 86400000);
  const computable = contractuelJours > 0 && reelJours != null;
  const horsDelai = computable && reelJours > contractuelJours;
  const fmtDur = (j) => (dureeUnite === 'MOIS' ? `${(j / 30).toFixed(1)} mois` : `${j} jour(s)`);
  const kpi = (label, value, color) => el('div', { style: { textAlign: 'center', padding: '10px', background: '#f8fafc', borderRadius: '8px' } }, [
    el('div', { className: 'text-small text-muted' }, label),
    el('div', { style: { fontWeight: 700, fontSize: '15px', color: color || 'inherit' } }, value)
  ]);
  const statut = !computable
    ? el('span', { style: { color: '#6b7280' } }, '— (dates incomplètes)')
    : (horsDelai
        ? el('span', { style: { color: '#dc2626', fontWeight: 700, animation: 'mp-blink 1s infinite' } }, '⏰ HORS DÉLAI')
        : el('span', { style: { color: '#16a34a', fontWeight: 700 } }, '✓ Dans le délai'));
  return el('div', { className: 'card', style: horsDelai ? { marginBottom: '24px', borderColor: '#dc2626' } : { marginBottom: '24px' } }, [
    el('style', {}, '@keyframes mp-blink { 0%,100%{opacity:1} 50%{opacity:0.25} }'),
    el('div', { className: 'card-header' }, [el('h3', { className: 'card-title' }, '⏱️ Délai d\'exécution')]),
    el('div', { className: 'card-body' }, [
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' } }, [
        kpi('Délai contractuel', contractuelJours > 0 ? fmtDur(contractuelJours) : '— (non renseigné)'),
        kpi('Délai réel (OS → réception)', reelJours != null ? `${reelJours} jour(s)` : '— (dates manquantes)'),
        el('div', { style: { textAlign: 'center', padding: '10px', background: '#f8fafc', borderRadius: '8px' } }, [
          el('div', { className: 'text-small text-muted' }, 'Statut'),
          el('div', { style: { fontWeight: 700, fontSize: '15px', marginTop: '2px' } }, [statut])
        ])
      ])
    ])
  ]);
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
      el('div', { className: 'text-small text-muted' }, `${((Number(garantie.montant) || 0) / 1000000).toFixed(2)}M XOF`)
    ]),
    // Doc clôture 24/06 (décision A) — OUI/NON éditable « la garantie est-elle levée ? ».
    // Pilote mainleveeDate (cohérent avec la mainlevée détaillée d'ECR04C, qui reste
    // disponible pour préciser date/doc au besoin).
    el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
      el('span', { className: 'text-small text-muted' }, 'Levée ?'),
      (() => {
        const sel = el('select', { className: 'form-input', id: `garantie-levee-${garantie.id}`, style: { padding: '4px', fontSize: '13px' } }, [
          (() => { const o = el('option', { value: 'NON' }, 'NON'); if (!garantie.mainleveeDate) o.selected = true; return o; })(),
          (() => { const o = el('option', { value: 'OUI' }, 'OUI'); if (garantie.mainleveeDate) o.selected = true; return o; })()
        ]);
        return sel;
      })(),
      garantie.mainleveeDate
        ? el('span', { className: 'text-small text-muted' }, `(le ${new Date(garantie.mainleveeDate).toLocaleDateString()})`)
        : null
    ])
  ]);
}

/**
 * Marché+ multi-lot : si lotId est fourni, les champs métier vont sous
 * `entity.parLot[lotId]` plutôt qu'à la racine (back-compat single-lot).
 */
/**
 * Note 5 (réunion) — Phase 2 : bilan « prévisionnel vs réalisé » des livrables à la
 * clôture + justifications du CF pour tout livrable non (totalement) délivré.
 * Persisté inline sur operation.livrables (justificationCF). NON bloquant — c'est
 * une note du CF qui documente/explique les écarts.
 */
function renderLivrablesBilanSection({ operation, idOperation, registries }) {
  const livrables = Array.isArray(operation?.livrables) ? operation.livrables : [];
  const statuts = registries.STATUT_LIVRABLE || [];
  const motifs = registries.MOTIF_LIVRABLE_NON_REALISE || [
    { code: 'ENTREPRISE_DEFAILLANTE', label: 'Entreprise défaillante' },
    { code: 'DENONCIATION_MO', label: "Dénonciation du maître d'ouvrage" },
    { code: 'INDISPONIBILITE_RESSOURCES', label: 'Indisponibilité de ressources' },
    { code: 'AUTRE', label: 'Autre (préciser)' }
  ];
  const statutLabel = (c) => statuts.find(s => s.code === c)?.label || c || '—';
  const qtePrev = (l) => Number(l.quantite != null ? l.quantite : (l.quantitePrevue != null ? l.quantitePrevue : 0));
  const qteReal = (l) => Number(l.quantiteRealisee || 0);
  const isIncomplet = (l) => (l.statut && l.statut !== 'TERMINE') || (qtePrev(l) > 0 && qteReal(l) < qtePrev(l)) || (Number(l.pourcentageExecution || 0) < 100);

  const rows = livrables.map(l => {
    const inc = isIncomplet(l);
    return el('tr', { style: inc ? { background: '#fef2f2' } : {} }, [
      el('td', { style: { fontWeight: 500 } }, l.libelle || 'Livrable'),
      el('td', { style: { textAlign: 'center' } }, String(qtePrev(l))),
      el('td', { style: { textAlign: 'center' } }, String(qteReal(l))),
      el('td', { style: { textAlign: 'center' } }, `${Number(l.pourcentageExecution || 0)} %`),
      el('td', {}, statutLabel(l.statut)),
      el('td', {}, inc
        ? el('span', { className: 'badge badge-red', style: { fontSize: '11px' } }, '⚠️ Écart')
        : el('span', { className: 'badge badge-green', style: { fontSize: '11px' } }, '✓ Conforme'))
    ]);
  });

  const justifBlocks = livrables.map((l, i) => {
    if (!isIncomplet(l)) return null;
    const j = l.justificationCF || {};
    let docRef = j.docRef || null;
    const motifSel = el('select', { className: 'form-input', id: `bilan-${i}-motif` }, [
      el('option', { value: '' }, '-- Motif de l\'écart --'),
      ...motifs.map(m => { const o = el('option', { value: m.code }, m.label); if (m.code === j.motif) o.selected = true; return o; })
    ]);
    const commentInput = el('textarea', { className: 'form-input', id: `bilan-${i}-comment`, rows: 2, placeholder: 'Note du CF expliquant l\'écart…' }, j.commentaire || '');
    const fileInput = el('input', { type: 'file', className: 'form-input', id: `bilan-${i}-doc`, accept: '.pdf,.doc,.docx' });
    const fileHint = el('small', { className: 'text-muted' }, docRef ? `✓ ${docRef}` : 'Document justificatif (optionnel).');
    fileInput.addEventListener('change', (e) => { const f = e.target.files && e.target.files[0]; if (f) { docRef = f.name; fileHint.textContent = `✓ ${f.name}`; } });
    return el('div', { style: { marginBottom: '12px', padding: '10px 12px', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: '6px' } }, [
      el('div', { style: { fontWeight: 600, marginBottom: '6px' } }, `📦 ${l.libelle || 'Livrable'} — écart à justifier`),
      el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' } }, [
        el('div', { className: 'form-field' }, [el('label', { className: 'form-label' }, 'Motif'), motifSel]),
        el('div', { className: 'form-field' }, [el('label', { className: 'form-label' }, 'Document (CF)'), fileInput, fileHint])
      ]),
      el('div', { className: 'form-field', style: { marginTop: '6px' } }, [el('label', { className: 'form-label' }, 'Note du CF'), commentInput])
    ]);
  }).filter(Boolean);

  const saveBtn = el('button', { type: 'button', className: 'btn btn-primary' }, '💾 Enregistrer le bilan & justifications');
  saveBtn.addEventListener('click', async () => {
    const updated = livrables.map((l, i) => {
      if (!isIncomplet(l)) return l;
      const fileEl = document.getElementById(`bilan-${i}-doc`);
      const docRef = (fileEl && fileEl.files && fileEl.files[0]) ? fileEl.files[0].name : (l.justificationCF?.docRef || null);
      return {
        ...l,
        justificationCF: {
          motif: document.getElementById(`bilan-${i}-motif`)?.value || null,
          commentaire: (document.getElementById(`bilan-${i}-comment`)?.value || '').trim(),
          docRef
        }
      };
    });
    try {
      await dataService.update(ENTITIES.MP_OPERATION, idOperation, { livrables: updated });
      alert('✅ Bilan des livrables et justifications du CF enregistrés.');
    } catch (e) { alert('❌ Erreur lors de l\'enregistrement.'); }
  });

  const nbEcarts = livrables.filter(isIncomplet).length;

  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
      el('h3', { className: 'card-title', style: { margin: 0 } }, '📦 Livrables — prévisionnel vs réalisé'),
      el('span', { className: nbEcarts ? 'badge badge-red' : 'badge badge-green' }, nbEcarts ? `${nbEcarts} écart(s)` : 'Tous conformes')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { style: { overflowX: 'auto', marginBottom: justifBlocks.length ? '16px' : '0' } }, [
        el('table', { className: 'table', style: { width: '100%', fontSize: '13px' } }, [
          el('thead', {}, [el('tr', {}, [
            el('th', {}, 'Livrable'),
            el('th', { style: { textAlign: 'center' } }, 'Qté prévue'),
            el('th', { style: { textAlign: 'center' } }, 'Qté réalisée'),
            el('th', { style: { textAlign: 'center' } }, '% avancement'),
            el('th', {}, 'Statut'),
            el('th', {}, 'État')
          ])]),
          el('tbody', {}, rows)
        ])
      ]),
      justifBlocks.length
        ? el('div', {}, [
            el('div', { style: { fontWeight: 600, margin: '4px 0 8px', color: '#9a3412' } }, '⚠️ Justifications du CF (livrables non totalement délivrés)'),
            ...justifBlocks
          ])
        : null,
      el('div', { style: { marginTop: '12px', textAlign: 'right' } }, [saveBtn])
    ])
  ]);
}

async function handleSave(idOperation, definitive, lotId = null, rawCloture = null) {
  const dateRP = document.getElementById('cloture-date-rp')?.value;
  const reservesRP = document.getElementById('cloture-reserves-rp')?.value;
  const dateRD = document.getElementById('cloture-date-rd')?.value;
  const dateDernierDecompte = document.getElementById('cloture-date-dernier-decompte')?.value;
  const satisfaction = document.getElementById('cloture-satisfaction')?.value || null;
  const satisfactionCommentaires = document.getElementById('cloture-satisfaction-commentaires')?.value || null;
  const synthese = document.getElementById('cloture-synthese')?.value;
  // Note métier — enseignements structurés.
  const leconsTirees = document.getElementById('cloture-lecons')?.value || '';
  const recommandations = document.getElementById('cloture-recommandations')?.value || '';
  // Doc clôture 24/06 (Lot 1) — situation de paiement (colonnes top-level mp_cloture).
  const clotureExtra = {
    observationPaiement: document.getElementById('cloture-observation-paiement')?.value || null,
    montantMarcheTotal: parseFloat(document.getElementById('cloture-montant-total')?.value) || 0,
    montantTotalPaye: parseFloat(document.getElementById('cloture-cumul-decomptes')?.value) || 0,
    ecartMontant: parseFloat(document.getElementById('cloture-ecart')?.value) || 0
  };

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
    leconsTirees,
    recommandations,
    closAt: definitive ? new Date().toISOString() : null
  };

  // Construit le patch : si lotId, les champs vont sous parLot[lotId]
  const lotPatch = buildLotPatch(lotId, lotFields, existing);

  let result;
  if (existing) {
    const updateData = {
      ...lotPatch,
      ...clotureExtra,
      operationId: idOperation,
      updatedAt: new Date().toISOString()
    };
    result = await dataService.update(ENTITIES.MP_CLOTURE, clotureId, updateData);
  } else {
    const createData = {
      ...lotPatch,
      ...clotureExtra,
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
