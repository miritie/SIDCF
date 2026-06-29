/* ============================================
   ECR04A - Exécution & Ordres de Service
   Simplifié : OS de démarrage unique + lien Avenants
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { renderSteps } from '../../../ui/widgets/steps-mp.js';
import { money } from '../../../lib/format.js';
import logger from '../../../lib/logger.js';
import { getLotData, getLotsFromProcedure, resolveCurrentLotId } from '../../../lib/lot-data.js';
import { renderLotSelector } from '../../../ui/widgets/lot-selector.js';
import { renderPageHeaderMP } from '../../../ui/widgets/page-header-mp.js';
import { renderNextPhaseButton } from '../../../ui/widgets/next-phase-button-mp.js';
import { renderDifficultesGatedBloc } from '../../../ui/widgets/difficultes-manager-mp.js';
import { isPrestationIntellectuelle, resolveBaseMode } from '../../../lib/procedure-context.js';
import { renderOpMandatManager } from '../../../ui/widgets/op-mandat-manager-mp.js';

function createButton(className, text, onClick) {
  const btn = el('button', { className }, text);
  btn.addEventListener('click', onClick);
  return btn;
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  } catch {
    return dateStr;
  }
}

/**
 * Format bureau display
 */
function formatBureau(bureau) {
  if (!bureau || !bureau.type) return '-';
  if (bureau.type === 'UA') {
    return `🏛️ ${bureau.nom || 'UA'}`;
  } else if (bureau.type === 'ENTREPRISE') {
    return `🏢 ${bureau.nom || 'Entreprise'}`;
  }
  return '-';
}

export async function renderExecutionOS(params) {
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

  const { operation, attribution, ordresService, visasCF, avenants, procedure } = fullData;
  const registries = dataService.getAllRegistries();

  // Marché+ multi-lot : résoudre le lot courant depuis la procédure
  const lots = getLotsFromProcedure(procedure);
  const currentLotId = resolveCurrentLotId(lots, params);

  // Filtrer les arrays au lot courant (back-compat : si aucun lotId sur record, inclure)
  const ordresServiceForLot = currentLotId
    ? (ordresService || []).filter(os => !os.lotId || os.lotId === currentLotId)
    : (ordresService || []);
  const visasCFForLot = currentLotId
    ? (visasCF || []).filter(v => !v.lotId || v.lotId === currentLotId)
    : (visasCF || []);
  const avenantsForLot = currentLotId
    ? (avenants || []).filter(av => !av.lotId || av.lotId === currentLotId)
    : (avenants || []);

  // Attribution scopée au lot pour les calculs/affichage
  const attributionForLot = getLotData(attribution, currentLotId);

  // Modif #174 (obs. EHOUMAN) — table des décomptes du marché à l'étape exécution.
  const mpDecomptes = await dataService.query(ENTITIES.MP_DECOMPTE, { operationId: idOperation }).catch(() => []);
  // Avance de démarrage prévue ? (pilote le « DÉCOMPTE 00 » du 1ᵉʳ décompte)
  const avanceActive = !!(attributionForLot?.avanceDemarrage?.actif || attribution?.avanceDemarrage?.actif);
  // Livrables du marché (pour le contrôle de cohérence livrables ↔ décomptes)
  const livrablesMarche = Array.isArray(operation?.livrables) ? operation.livrables : [];

  // Vérifier si l'OS de démarrage existe déjà (pour ce lot)
  // Le premier OS créé est considéré comme l'OS de démarrage
  const osDemarrage = ordresServiceForLot && ordresServiceForLot.length > 0 ? ordresServiceForLot[0] : null;
  const hasOSDemarrage = !!osDemarrage;

  // Helper pour vérifier si l'attribution est complète (supporte les différentes structures)
  const isAttributionComplete = (attr) => {
    if (!attr) return false;

    // Vérifier le montant (plusieurs sources possibles)
    const hasMontant = attr.montants?.ttc > 0 || attr.montants?.attribue > 0 || attr.montantAttribue > 0;
    if (!hasMontant) return false;

    // Vérifier l'attributaire - Structure avec entreprises[] (ECR03A)
    if (attr.attributaire?.entreprises?.length > 0) {
      const firstEntreprise = attr.attributaire.entreprises[0];
      if (firstEntreprise.raisonSociale) return true;
    }

    // Structure avec nom direct
    if (attr.attributaire?.nom) return true;

    // Structure avec entrepriseId
    if (attr.attributaire?.entrepriseId) return true;

    // Ancienne structure avec titulaire
    if (attr.titulaire) return true;

    return false;
  };

  // Check if attribution is complete (au niveau du lot courant)
  if (!isAttributionComplete(attributionForLot)) {
    mount('#app', el('div', { className: 'page' }, [
      renderSteps(fullData, idOperation),
      el('div', { className: 'alert alert-warning' }, [
        el('div', { className: 'alert-icon' }, '⚠️'),
        el('div', { className: 'alert-content' }, [
          el('div', { className: 'alert-title' }, 'Attribution incomplète'),
          el('div', { className: 'alert-message' }, 'L\'attribution doit être complétée (titulaire et montant) avant de pouvoir démarrer l\'exécution.')
        ])
      ]),
      el('div', { style: { marginTop: '16px' } }, [
        createButton('btn btn-primary', '← Retour', () => router.navigate('/mp/fiche-marche', { idOperation }))
      ])
    ]));
    return;
  }

  // Déterminer si le visa CF est requis selon le mode de passation
  const modePassation = operation.modePassation || 'PSD';
  const visaRequired = ['PSL', 'PSO'].includes(modePassation)
    || resolveBaseMode(modePassation) === 'AOO'
    || isPrestationIntellectuelle(modePassation);

  // Check if visa CF granted (si requis) — scopé au lot courant
  const visaFavorable = visasCFForLot && visasCFForLot.length > 0 &&
    visasCFForLot.some(v => ['VISA', 'FAVORABLE', 'VISE', 'VISE_RESERVE'].includes(v.decision));

  if (visaRequired && !visaFavorable && operation.etat !== 'EN_EXEC' && operation.etat !== 'CLOS') {
    mount('#app', el('div', { className: 'page' }, [
      renderSteps(fullData, idOperation),
      el('div', { className: 'alert alert-warning' }, [
        el('div', { className: 'alert-icon' }, '⚠️'),
        el('div', { className: 'alert-content' }, [
          el('div', { className: 'alert-title' }, 'Approbation non accordée'),
          el('div', { className: 'alert-message' }, 'L\'exécution ne peut commencer que si le Contrôle Financier a accordé son visa favorable.')
        ])
      ]),
      el('div', { style: { marginTop: '16px' } }, [
        createButton('btn btn-primary', '← Vers Approbation', () => router.navigate('/mp/visa-cf', { idOperation })),
        createButton('btn btn-secondary', '← Retour', () => router.navigate('/mp/fiche-marche', { idOperation }))
      ])
    ]));
    return;
  }

  // Check delay alert (OS > 30 days after visa) — scopé au lot
  const delayAlert = checkDelayAlert(operation, ordresServiceForLot);

  // Calcul des KPIs pour les avenants (sur le lot courant)
  const montantInitial = attributionForLot?.montants?.ttc || attributionForLot?.montants?.attribue || operation?.montantPrevisionnel || 0;
  const totalAvenants = avenantsForLot?.reduce((sum, av) => sum + (av.variationMontant || 0), 0) || 0;
  const montantActuel = montantInitial + totalAvenants;
  const pourcentageAvenants = montantInitial > 0 ? (totalAvenants / montantInitial) * 100 : 0;

  const page = el('div', { className: 'page' }, [
    // Timeline
    renderSteps(fullData, idOperation),

    // Header — Modif #68
    renderPageHeaderMP({
      idOperation, operation,
      phaseIcon: '⚙️', phaseLabel: 'Exécution',
      titre: 'Ordre de service & Suivi'
    }),

    // Sélecteur de lot (visible si > 1 lot)
    renderLotSelector({
      lots,
      currentLotId,
      route: '/mp/execution',
      routeParams: { idOperation }
    }),

    // Delay alert (if applicable)
    delayAlert ? delayAlert : null,

    // Attribution summary (scopée au lot)
    renderAttributionSummary(attributionForLot),

    // =========================================
    // SECTION 1: Ordre de Service de Démarrage
    // =========================================
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '🚀 Ordre de Service de Démarrage')
      ]),
      el('div', { className: 'card-body' }, [
        hasOSDemarrage
          // Afficher l'OS de démarrage existant
          ? el('div', {}, [
              el('div', { className: 'alert alert-success', style: { marginBottom: '16px' } }, [
                el('div', { className: 'alert-icon' }, '✅'),
                el('div', { className: 'alert-content' }, [
                  el('div', { className: 'alert-title' }, 'Travaux démarrés'),
                  el('div', { className: 'alert-message' }, `OS n° ${osDemarrage.numero} émis le ${formatDate(osDemarrage.dateEmission)}`)
                ])
              ]),
              el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' } }, [
                renderField('Numéro OS', osDemarrage.numero),
                renderField('Date d\'émission', formatDate(osDemarrage.dateEmission)),
                renderField('Bureau de contrôle', formatBureau(osDemarrage.bureauControle)),
                renderField('Bureau d\'études', formatBureau(osDemarrage.bureauEtudes))
              ]),
              osDemarrage.objet ? el('div', { style: { marginTop: '16px' } }, [
                el('div', { className: 'text-small text-muted' }, 'Objet'),
                el('div', { style: { marginTop: '4px' } }, osDemarrage.objet)
              ]) : null
            ])
          // Formulaire pour créer l'OS de démarrage
          : el('div', {}, [
              el('div', { className: 'alert alert-info', style: { marginBottom: '16px' } }, [
                el('div', { className: 'alert-icon' }, 'ℹ️'),
                el('div', { className: 'alert-content' }, [
                  el('div', { className: 'alert-title' }, 'Travaux non démarrés'),
                  el('div', { className: 'alert-message' }, 'Émettez l\'ordre de service de démarrage pour lancer l\'exécution du marché.')
                ])
              ]),

              el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' } }, [
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
                    'Date d\'émission',
                    el('span', { className: 'required' }, '*')
                  ]),
                  el('input', {
                    type: 'date',
                    className: 'form-input',
                    id: 'os-date',
                    value: new Date().toISOString().split('T')[0]
                  })
                ])
              ]),

              // Bureau de contrôle & Bureau d'études
              el('div', { style: { marginTop: '16px' } }, [
                el('h4', { style: { fontSize: '14px', fontWeight: '600', marginBottom: '12px' } }, 'Bureau de contrôle / Bureau d\'études')
              ]),

              el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' } }, [
                // Bureau de contrôle
                el('div', { style: { border: '1px solid var(--color-gray-300)', borderRadius: '8px', padding: '12px' } }, [
                  el('div', { className: 'form-field', style: { marginBottom: '8px' } }, [
                    el('label', { className: 'form-label' }, 'Bureau de Contrôle'),
                    el('select', { className: 'form-input', id: 'bc-type' }, [
                      el('option', { value: '' }, 'Non défini'),
                      el('option', { value: 'UA' }, 'Unité Administrative'),
                      el('option', { value: 'ENTREPRISE' }, 'Entreprise externe')
                    ])
                  ]),
                  el('div', { className: 'form-field', id: 'bc-field-container' })
                ]),

                // Bureau d'études
                el('div', { style: { border: '1px solid var(--color-gray-300)', borderRadius: '8px', padding: '12px' } }, [
                  el('div', { className: 'form-field', style: { marginBottom: '8px' } }, [
                    el('label', { className: 'form-label' }, 'Bureau d\'Études'),
                    el('select', { className: 'form-input', id: 'be-type' }, [
                      el('option', { value: '' }, 'Non défini'),
                      el('option', { value: 'UA' }, 'Unité Administrative'),
                      el('option', { value: 'ENTREPRISE' }, 'Entreprise externe')
                    ])
                  ]),
                  el('div', { className: 'form-field', id: 'be-field-container' })
                ])
              ]),

              el('div', { className: 'form-field', style: { marginTop: '8px' } }, [
                el('label', { className: 'form-label' }, 'Objet / Description'),
                el('textarea', {
                  className: 'form-input',
                  id: 'os-objet',
                  rows: 2,
                  placeholder: 'Description de l\'ordre de service...'
                })
              ]),

              el('div', { className: 'form-field', style: { marginTop: '12px' } }, [
                el('label', { className: 'form-label' }, 'Document OS (PDF)'),
                el('input', {
                  type: 'file',
                  className: 'form-input',
                  id: 'os-document',
                  accept: '.pdf'
                })
              ]),

              // Modif #65 — Bouton anti-doublon : se désactive pendant l'appel
              // pour empêcher les multi-clics qui généraient des doublons OS.
              el('div', { style: { marginTop: '16px', display: 'flex', justifyContent: 'flex-end' } }, [
                (() => {
                  const btn = el('button', {
                    type: 'button',
                    className: 'btn btn-primary'
                  }, '🚀 Émettre l\'OS de démarrage');
                  btn.addEventListener('click', async () => {
                    if (btn.disabled) return;          // garde-fou ré-entrant
                    btn.disabled = true;
                    btn.style.opacity = '0.6';
                    btn.textContent = '⏳ Enregistrement en cours…';
                    try {
                      await handleAddOSDemarrage(idOperation, currentLotId);
                    } catch (err) {
                      logger.error('[Execution] Échec création OS', err);
                      alert('❌ Erreur : ' + (err?.message || err));
                      btn.disabled = false;
                      btn.style.opacity = '1';
                      btn.textContent = '🚀 Émettre l\'OS de démarrage';
                    }
                    // si succès : la fonction navigate vers une nouvelle page,
                    // donc pas besoin de réactiver le bouton.
                  });
                  return btn;
                })()
              ])
            ])
      ])
    ]),

    // =========================================
    // SECTION 2: Avenants au marché
    // =========================================
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
          el('h3', { className: 'card-title' }, `📑 Avenants au marché (${avenantsForLot?.length || 0})`),
          hasOSDemarrage
            ? createButton('btn btn-sm btn-primary', '➕ Nouvel avenant', () => {
                router.navigate('/mp/avenant-create', { idOperation, lotId: currentLotId });
              })
            : null
        ])
      ]),
      el('div', { className: 'card-body' }, [
        !hasOSDemarrage
          ? el('div', { className: 'alert alert-info' }, [
              el('div', { className: 'alert-icon' }, 'ℹ️'),
              el('div', { className: 'alert-content' }, [
                el('div', { className: 'alert-title' }, 'Exécution non démarrée'),
                el('div', { className: 'alert-message' }, 'Les avenants ne peuvent être enregistrés qu\'après l\'émission de l\'OS de démarrage.')
              ])
            ])
          : avenantsForLot && avenantsForLot.length > 0
            ? el('div', {}, [
                // Résumé des avenants
                el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' } }, [
                  el('div', { style: { textAlign: 'center', padding: '12px', background: 'var(--color-gray-100)', borderRadius: '8px' } }, [
                    el('div', { className: 'text-small text-muted' }, 'Montant du marché de base'),
                    el('div', { style: { fontWeight: '600', fontSize: '14px' } }, money(montantInitial))
                  ]),
                  el('div', { style: { textAlign: 'center', padding: '12px', background: 'var(--color-gray-100)', borderRadius: '8px' } }, [
                    el('div', { className: 'text-small text-muted' }, 'Montant total avenant'),
                    el('div', { style: { fontWeight: '600', fontSize: '14px', color: totalAvenants >= 0 ? 'var(--color-success)' : 'var(--color-error)' } },
                      `${totalAvenants >= 0 ? '+' : ''}${money(totalAvenants)}`)
                  ]),
                  el('div', { style: { textAlign: 'center', padding: '12px', background: 'var(--color-gray-100)', borderRadius: '8px' } }, [
                    el('div', { className: 'text-small text-muted' }, 'Montant total du marché'),
                    el('div', { style: { fontWeight: '600', fontSize: '14px' } }, money(montantActuel))
                  ]),
                  el('div', { style: { textAlign: 'center', padding: '12px', background: pourcentageAvenants > 25 ? 'var(--color-warning-bg)' : 'var(--color-gray-100)', borderRadius: '8px' } }, [
                    el('div', { className: 'text-small text-muted' }, 'Cumul (%)'),
                    el('div', { style: { fontWeight: '600', fontSize: '14px', color: pourcentageAvenants > 25 ? 'var(--color-warning)' : 'inherit' } },
                      `${pourcentageAvenants.toFixed(1)}%`)
                  ])
                ]),
                // Liste simplifiée des avenants
                el('div', { style: { overflowX: 'auto' } }, [
                  el('table', { className: 'data-table' }, [
                    el('thead', {}, [
                      el('tr', {}, [
                        el('th', {}, 'N°'),
                        el('th', {}, 'Type'),
                        el('th', {}, 'Variation'),
                        el('th', {}, 'Date'),
                        el('th', {}, 'Motif')
                      ])
                    ]),
                    el('tbody', {},
                      avenantsForLot.map(av => el('tr', {}, [
                        el('td', { style: { fontWeight: '500' } }, av.numero || '-'),
                        el('td', {}, av.type || av.typeRef || '-'),
                        el('td', { style: { color: (av.variationMontant || 0) >= 0 ? 'var(--color-success)' : 'var(--color-error)' } },
                          av.variationMontant ? money(av.variationMontant) : '-'),
                        el('td', {}, av.dateSignature ? formatDate(av.dateSignature) : '-'),
                        el('td', { className: 'text-small' }, av.motifRef || av.motif || '-')
                      ]))
                    )
                  ])
                ]),
                // Lien vers l'écran complet
                el('div', { style: { marginTop: '16px', textAlign: 'right' } }, [
                  createButton('btn btn-sm btn-secondary', 'Voir tous les avenants →', () => {
                    router.navigate('/mp/avenants', { idOperation, lotId: currentLotId });
                  })
                ])
              ])
            : el('div', { className: 'text-center text-muted', style: { padding: '24px' } }, [
                el('div', { style: { fontSize: '32px', marginBottom: '8px' } }, '📄'),
                el('div', {}, 'Aucun avenant enregistré'),
                el('div', { className: 'text-small', style: { marginTop: '8px' } },
                  'Les avenants peuvent être ajoutés à tout moment pendant l\'exécution du marché.')
              ])
      ])
    ]),

    // Actions
    el('div', { className: 'card' }, [
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center' } }, [
          el('div', { className: 'text-small text-muted' },
            hasOSDemarrage
              ? `Travaux démarrés le ${formatDate(osDemarrage.dateEmission)} • ${avenantsForLot?.length || 0} avenant(s)`
              : 'Travaux non démarrés'),
          el('div', { style: { display: 'flex', gap: '8px' } }, [
            // Modif #178 — accès direct à l'écran Garanties (mainlevées) depuis l'exécution.
            createButton('btn btn-secondary', '🛡️ Garanties / Mainlevées', () => router.navigate('/mp/garanties', { idOperation, lotId: currentLotId })),
            hasOSDemarrage
              ? createButton('btn btn-secondary', 'Avenants & Résiliation', () => router.navigate('/mp/avenants', { idOperation, lotId: currentLotId }))
              : null,
            createButton('btn btn-secondary', '← Retour', () => router.navigate('/mp/fiche-marche', { idOperation }))
          ])
        ])
      ])
    ])
  ]);

  // Modif #174 (obs. EHOUMAN) — Table des décomptes du marché + contrôle de
  // cohérence livrables ↔ décomptes (toujours présente à l'étape exécution ;
  // le widget gère son propre état vide, comme sur la fiche marché).
  page.appendChild(renderDecomptesSection({
    operation, attribution: attributionForLot, avenants: avenantsForLot,
    mpDecomptes, avanceActive, livrablesMarche, idOperation
  }));

  // Note 5 (réunion) — Phase 1 : suivi d'exécution PAR LIVRABLE (statut, %, réalisé).
  if (Array.isArray(operation?.livrables) && operation.livrables.length > 0) {
    page.appendChild(renderLivrablesSuiviSection({ operation, idOperation, registries }));
  }

  // Modif #127 (E-2/E-22) — Bloc difficultés (OUI/NON) présent à cette étape.
  page.appendChild(renderDifficultesGatedBloc({ operationId: idOperation, registries, lots: [] }));

  // Modif #69 — Bouton démo « Passer à l'étape suivante »
  page.appendChild(renderNextPhaseButton({ idOperation, operation }));
  mount('#app', page);

  // Setup bureau listeners si formulaire affiché
  if (!hasOSDemarrage) {
    setupBureauListeners();
  }
}

/**
 * Modif #174 (obs. EHOUMAN) — Section « Décomptes du marché » à l'étape exécution.
 * Monte le gestionnaire OP/Mandats (MP_DECOMPTE) + un contrôle de cohérence entre
 * les livrables enregistrés au marché et l'avancement constaté dans les décomptes.
 */
function renderDecomptesSection({ operation, attribution, avenants, mpDecomptes, avanceActive, livrablesMarche, idOperation }) {
  const nbLivrables = (livrablesMarche || []).length;
  const nbDecomptes = (mpDecomptes || []).length;
  // Dernier taux d'exécution cumulé connu (max sur les décomptes).
  const dernierTaux = (mpDecomptes || []).reduce((m, d) => Math.max(m, Number(d.tauxExecution) || 0), 0);

  // Contrôle de cohérence livrables ↔ décomptes (#6) : aide visuelle, non bloquante.
  const controle = el('div', {
    style: {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px',
      padding: '12px', marginBottom: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px'
    }
  }, [
    el('div', {}, [
      el('div', { className: 'text-small text-muted' }, 'Livrables au marché'),
      el('div', { style: { fontWeight: 700, fontSize: '18px' } }, String(nbLivrables))
    ]),
    el('div', {}, [
      el('div', { className: 'text-small text-muted' }, 'Nombre de décomptes enregistrés'),
      el('div', { style: { fontWeight: 700, fontSize: '18px' } }, String(nbDecomptes))
    ]),
    el('div', {}, [
      el('div', { className: 'text-small text-muted' }, 'Taux d\'exécution financier cumulé'),
      el('div', { style: { fontWeight: 700, fontSize: '18px' } }, `${dernierTaux.toFixed(2)} %`)
    ]),
    el('div', { style: { gridColumn: '1 / -1' } }, [
      el('div', { className: 'text-small', style: { color: '#475569' } },
        '🔎 Contrôle de cohérence : vérifiez que les livrables payés dans les décomptes correspondent ' +
        'aux livrables enregistrés au marché/contrat.' +
        (avanceActive ? ' Avance de démarrage prévue → le 1ᵉʳ décompte est « DÉCOMPTE 00 ».' : ''))
    ])
  ]);

  const host = el('div', { id: 'mp-decomptes-host' });

  // Le widget gère son propre rendu/CRUD ; on le monte après insertion DOM.
  setTimeout(() => {
    const target = document.getElementById('mp-decomptes-host');
    if (!target) return;
    target.innerHTML = '';
    target.appendChild(renderOpMandatManager({
      operation, decomptes: mpDecomptes, attribution, avenants, avanceActive
    }));
  }, 0);

  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
      el('h3', { className: 'card-title', style: { margin: 0 } }, `🧾 Décomptes du marché (${nbDecomptes})`),
      el('span', { style: { fontSize: '11px', color: '#6b7280' } }, 'OP / Mandats · cumul · reste à payer · taux d\'exécution')
    ]),
    el('div', { className: 'card-body' }, [controle, host])
  ]);
}

/**
 * Note 5 (réunion) — Phase 1 : suivi d'exécution par livrable du marché.
 * Pour chaque livrable (operation.livrables) : statut (Non démarré / Démarré /
 * En cours / Finalisé), % d'avancement, quantité réalisée. Persisté inline sur
 * operation.livrables (JSONB — pas de migration). La dimension temporelle suit la
 * planification du marché (échéancier/ordonnancement) — pas de découpage inventé.
 */
function renderLivrablesSuiviSection({ operation, idOperation, registries }) {
  const livrables = Array.isArray(operation?.livrables) ? operation.livrables : [];
  const statuts = registries.STATUT_LIVRABLE || [
    { code: 'NON_DEMARRE', label: 'Non démarré' }, { code: 'DEMARRE', label: 'Démarré' },
    { code: 'EN_COURS', label: 'En cours' }, { code: 'TERMINE', label: 'Finalisé' }
  ];
  const typeLabel = (code) => (registries.TYPE_LIVRABLE || []).find(t => t.code === code)?.label || code || '';

  const rows = livrables.map((l, i) => {
    const curStatut = l.statut || 'NON_DEMARRE';
    // NB : on pose la PROPRIÉTÉ .selected (et pas l'attribut), car `selected="false"`
    // reste un attribut présent → l'option serait considérée sélectionnée.
    const statutSel = el('select', { className: 'form-input', id: `liv-${i}-statut`, style: { fontSize: '12px', padding: '4px' } },
      statuts.map(s => { const o = el('option', { value: s.code }, s.label); if (s.code === curStatut) o.selected = true; return o; }));
    const pctInput = el('input', { type: 'number', className: 'form-input', id: `liv-${i}-pct`, min: 0, max: 100, step: 1, value: String(l.pourcentageExecution || 0), style: { width: '80px', padding: '4px' } });
    const qReal = el('input', { type: 'number', className: 'form-input', id: `liv-${i}-qreal`, min: 0, step: 1, value: String(l.quantiteRealisee || 0), style: { width: '90px', padding: '4px' } });
    return el('tr', {}, [
      el('td', { style: { fontWeight: 500 } }, l.libelle || typeLabel(l.type) || `Livrable ${i + 1}`),
      el('td', { className: 'text-small text-muted' }, typeLabel(l.type)),
      el('td', { style: { textAlign: 'center' } }, String(l.quantite != null ? l.quantite : (l.quantitePrevue != null ? l.quantitePrevue : 1))),
      el('td', {}, statutSel),
      el('td', { style: { textAlign: 'center' } }, pctInput),
      el('td', { style: { textAlign: 'center' } }, qReal)
    ]);
  });

  const saveBtn = createButton('btn btn-primary', '💾 Enregistrer le suivi', async () => {
    const updated = livrables.map((l, i) => ({
      ...l,
      statut: document.getElementById(`liv-${i}-statut`)?.value || l.statut || 'NON_DEMARRE',
      pourcentageExecution: Math.min(100, Math.max(0, parseInt(document.getElementById(`liv-${i}-pct`)?.value, 10) || 0)),
      quantiteRealisee: Math.max(0, parseFloat(document.getElementById(`liv-${i}-qreal`)?.value) || 0)
    }));
    try {
      await dataService.update(ENTITIES.MP_OPERATION, idOperation, { livrables: updated });
      alert('✅ Suivi des livrables enregistré.');
    } catch (e) {
      alert('❌ Erreur lors de l\'enregistrement du suivi des livrables.');
    }
  });

  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
      el('h3', { className: 'card-title', style: { margin: 0 } }, `📦 Suivi des livrables (${livrables.length})`),
      el('span', { style: { fontSize: '11px', color: '#6b7280' } }, 'Démarré · % d\'évolution · finalisation — conforme à la planification du marché')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { style: { overflowX: 'auto' } }, [
        el('table', { className: 'table', style: { width: '100%', fontSize: '13px' } }, [
          el('thead', {}, [el('tr', {}, [
            el('th', {}, 'Livrable'),
            el('th', {}, 'Type'),
            el('th', { style: { textAlign: 'center' } }, 'Qté prévue'),
            el('th', {}, 'Statut'),
            el('th', { style: { textAlign: 'center' } }, '% avancement'),
            el('th', { style: { textAlign: 'center' } }, 'Qté réalisée')
          ])]),
          el('tbody', {}, rows)
        ])
      ]),
      el('div', { style: { marginTop: '12px', textAlign: 'right' } }, [saveBtn])
    ])
  ]);
}

/**
 * Setup bureau type listeners
 */
function setupBureauListeners() {
  const bcTypeSelect = document.getElementById('bc-type');
  const beTypeSelect = document.getElementById('be-type');

  if (bcTypeSelect) {
    bcTypeSelect.addEventListener('change', (e) => {
      renderBureauField('bc', e.target.value);
    });
  }

  if (beTypeSelect) {
    beTypeSelect.addEventListener('change', (e) => {
      renderBureauField('be', e.target.value);
    });
  }
}

/**
 * Render bureau field based on type
 */
function renderBureauField(prefix, type) {
  const container = document.getElementById(`${prefix}-field-container`);
  if (!container) return;

  container.innerHTML = '';

  if (!type) return;

  if (type === 'UA') {
    const field = el('div', {}, [
      el('label', { className: 'form-label' }, 'Sélectionner l\'UA'),
      el('input', {
        type: 'text',
        className: 'form-input',
        id: `${prefix}-ua-nom`,
        placeholder: 'Nom de l\'UA'
      })
    ]);
    container.appendChild(field);
  } else if (type === 'ENTREPRISE') {
    const field = el('div', {}, [
      el('label', { className: 'form-label' }, 'Nom de l\'entreprise'),
      el('input', {
        type: 'text',
        className: 'form-input',
        id: `${prefix}-entreprise-nom`,
        placeholder: 'Raison sociale'
      })
    ]);
    container.appendChild(field);
  }
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
              el('p', {}, `L'approbation a été accordée il y a ${daysSinceVisa} jours (le ${visaDate.toLocaleDateString()}).`),
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

  // Extraire le nom de l'attributaire - supporte plusieurs structures
  let attributaireName = 'N/A';
  if (attribution.attributaire) {
    // Structure avec entreprises[]
    if (attribution.attributaire.entreprises && attribution.attributaire.entreprises.length > 0) {
      const isSimple = attribution.attributaire.singleOrGroup === 'SIMPLE';
      if (isSimple) {
        attributaireName = attribution.attributaire.entreprises[0]?.raisonSociale || 'N/A';
      } else {
        const mandataire = attribution.attributaire.entreprises.find(e => e.role === 'MANDATAIRE');
        attributaireName = mandataire?.raisonSociale || attribution.attributaire.entreprises[0]?.raisonSociale || 'N/A';
      }
    }
    // Structure simple avec nom direct
    else if (attribution.attributaire.nom) {
      attributaireName = attribution.attributaire.nom;
    }
    // Structure simple avec raisonSociale directe
    else if (attribution.attributaire.raisonSociale) {
      attributaireName = attribution.attributaire.raisonSociale;
    }
  }
  // Ancienne structure avec titulaire
  else if (attribution.titulaire) {
    attributaireName = attribution.titulaire;
  }

  // Extraire le montant TTC - supporte plusieurs sources
  let montantTTC = 0;
  if (attribution.montants?.ttc) {
    montantTTC = attribution.montants.ttc;
  } else if (attribution.montants?.attribue) {
    montantTTC = attribution.montants.attribue;
  } else if (attribution.montantAttribue) {
    montantTTC = attribution.montantAttribue;
  }

  // Formatage du montant
  const montantFormatted = montantTTC > 0
    ? `${(montantTTC / 1000000).toFixed(2)}M XOF`
    : 'Non renseigné';

  // Extraire le délai
  const delai = attribution.delaiExecution || attribution.delai || 0;
  const unite = attribution.delaiUnite || 'MOIS';
  const delaiFormatted = delai > 0 ? `${delai} ${unite}` : 'Non renseigné';

  // Modif #43.b — détection du lien vers le référentiel mp_entreprise
  const firstEnt = attribution.attributaire?.entreprises?.[0];
  const entrepriseIdLie = attribution.attributaire?.entrepriseId || firstEnt?.entrepriseId || null;
  const attributaireDisplay = entrepriseIdLie
    ? el('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } }, [
        el('span', {}, attributaireName),
        el('span', {
          style: {
            fontSize: '9px', padding: '1px 6px', background: '#dbeafe',
            color: '#1e40af', borderRadius: '8px', fontWeight: 600
          },
          title: 'Lié au référentiel mp_entreprise'
        }, '🏢 fiche liée')
      ])
    : attributaireName;

  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, 'Marché approuvé')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
        renderField('Attributaire', attributaireDisplay),
        renderField('Montant TTC (marché de base)', montantFormatted),
        renderField('Délai d\'exécution', delaiFormatted)
      ])
    ])
  ]);
}

function renderField(label, value) {
  // Modif #43.b — accepte un HTMLElement (pour badge inline) en plus d'une string
  const valueChild = (value instanceof HTMLElement) ? value : String(value || '-');
  return el('div', {}, [
    el('div', { className: 'text-small text-muted' }, label),
    el('div', { style: { fontWeight: '500', marginTop: '4px' } }, valueChild)
  ]);
}

/**
 * Handle add OS de démarrage
 *
 * Marché+ multi-lot : si lotId est fourni, on l'enregistre sur le record
 * (chaque OS est rattaché à un lot précis ; null pour mono-lot).
 */
async function handleAddOSDemarrage(idOperation, lotId = null) {
  // Collect form data
  const numero = document.getElementById('os-numero')?.value;
  const date = document.getElementById('os-date')?.value;
  const objet = document.getElementById('os-objet')?.value;
  const docInput = document.getElementById('os-document');

  // Bureau de contrôle
  const bcType = document.getElementById('bc-type')?.value;
  const bcUaNom = document.getElementById('bc-ua-nom')?.value;
  const bcEntrepriseNom = document.getElementById('bc-entreprise-nom')?.value;

  // Bureau d'études
  const beType = document.getElementById('be-type')?.value;
  const beUaNom = document.getElementById('be-ua-nom')?.value;
  const beEntrepriseNom = document.getElementById('be-entreprise-nom')?.value;

  // Validation
  if (!numero) {
    alert('⚠️ Veuillez saisir un numéro d\'OS');
    return;
  }

  if (!date) {
    alert('⚠️ Veuillez saisir une date d\'émission');
    return;
  }

  // Modif #65 + #72 — Garde-fou anti-doublon : vérifier qu'aucun OS n'existe
  // déjà pour ce marché ET ce lot avant d'en créer un nouveau. L'OS de
  // démarrage est unique par (opération, lot) — en multi-lots, chaque lot
  // a son propre OS. Avant le fix #72 le check était global et bloquait
  // la création d'OS pour LOT-B si LOT-A en avait déjà un.
  const existingOSAll = await dataService.query(ENTITIES.MP_ORDRE_SERVICE, { operationId: idOperation }).catch(() => []);
  const existingOS = lotId
    ? (existingOSAll || []).filter(os => !os.lotId || os.lotId === lotId)
    : (existingOSAll || []);
  if (existingOS && existingOS.length > 0) {
    const lotSuffix = lotId ? ` (lot ${lotId})` : '';
    alert(`⚠️ Un Ordre de Service de démarrage existe déjà pour ce marché${lotSuffix} (n°${existingOS[0].numero || '?'}).\n\nUn seul OS de démarrage est admis par marché et par lot. Si vous souhaitez le modifier, contactez l'administration.`);
    return;
  }

  // Handle document upload (simulate)
  let docRef = null;
  if (docInput?.files?.[0]) {
    docRef = 'DOC_OS_' + Date.now() + '.pdf';
    logger.info('[Execution] Document OS uploadé:', docRef);
  }

  // Prepare bureau data
  const bureauControle = bcType ? {
    type: bcType,
    uaId: null,
    entrepriseId: null,
    nom: bcType === 'UA' ? bcUaNom : bcEntrepriseNom
  } : { type: null, uaId: null, entrepriseId: null, nom: '' };

  const bureauEtudes = beType ? {
    type: beType,
    uaId: null,
    entrepriseId: null,
    nom: beType === 'UA' ? beUaNom : beEntrepriseNom
  } : { type: null, uaId: null, entrepriseId: null, nom: '' };

  // Create OS de démarrage entity
  // Note: Le schéma PostgreSQL n'a pas de colonne 'type', on utilise l'objet pour identifier le type
  const osEntity = {
    operationId: idOperation,
    lotId: lotId || null,
    numero,
    dateEmission: date,
    objet: objet || 'Ordre de service de démarrage des travaux',
    docRef,
    bureauControle,
    bureauEtudes,
    createdAt: new Date().toISOString()
  };

  const result = await dataService.add(ENTITIES.MP_ORDRE_SERVICE, osEntity);

  // Modif #61 — Le Worker peut renvoyer { success, id, entity } ou directement l'entité.
  // On accepte les deux formats pour robustesse.
  const created = result?.entity || result;
  const createdId = result?.id || created?.id;
  if (result?.success === false) {
    alert('❌ Erreur lors de la création de l\'ordre de service');
    return;
  }

  // Update operation state to EN_EXEC
  const operation = await dataService.get(ENTITIES.MP_OPERATION, idOperation);
  const updateData = {
    etat: 'EN_EXEC',
    updatedAt: new Date().toISOString()
  };

  // Modif #61 — Standardisation timeline : utiliser 'EN_EXEC' (cohérent avec
  // l'état métier et les migrations 019/020/023) au lieu de l'ancien 'EXEC'.
  if (operation.timeline) {
    if (!operation.timeline.includes('EN_EXEC')) {
      updateData.timeline = [...operation.timeline, 'EN_EXEC'];
    }
  }

  await dataService.update(ENTITIES.MP_OPERATION, idOperation, updateData);

  logger.info('[Execution] OS de démarrage créé avec succès:', createdId || '(id non retourné)');
  alert('✅ Ordre de service de démarrage enregistré\nLes travaux peuvent maintenant commencer.');

  // Reload page
  router.navigate('/mp/execution', { idOperation });
}

export default renderExecutionOS;
