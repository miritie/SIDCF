/* ============================================
   ECR02A - Procédure & Choix Mode de Passation
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { renderSteps } from '../../../ui/widgets/steps-mp.js';
import logger from '../../../lib/logger.js';
import {
  hasSoumissionnairesManagement,
  hasLotsManagement,
  requiresCOJO,
  requiresDGMPValidation,
  requiresPublication,
  createProcedureInfoAlert
} from '../../../lib/procedure-context.js';
import { SoumissionnairesWidget } from '../../../widgets/soumissionnaires-widget.js';
import { renderLotsProcedureMP } from '../../../ui/widgets/lots-procedure-mp.js';
import { checkSanction, renderSanctionBanner, openSanctionsDrawer } from '../../../lib/mp-sanctions.js';
import { renderPageHeaderMP } from '../../../ui/widgets/page-header-mp.js';
import { renderNextPhaseButton } from '../../../ui/widgets/next-phase-button-mp.js';

// Debounce simple pour la détection sanctions (évite un appel à chaque touche)
let _procSanctionTimer = null;
function _procTriggerSanctionCheck() {
  clearTimeout(_procSanctionTimer);
  _procSanctionTimer = setTimeout(async () => {
    const banner = document.getElementById('proc-sanction-banner');
    if (!banner) return;
    const raisonSociale = (document.getElementById('proc-fournisseur-retenu')?.value || '').trim();
    if (!raisonSociale) { banner.innerHTML = ''; return; }
    const sanction = await checkSanction({ raisonSociale });
    banner.innerHTML = '';
    if (sanction) {
      const node = renderSanctionBanner(sanction);
      if (node) banner.appendChild(node);
    }
  }, 300);
}

function createButton(className, text, onClick) {
  const btn = el('button', { className }, text);
  btn.addEventListener('click', onClick);
  return btn;
}

export async function renderProcedurePV(params) {
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

  const { operation, procedure } = fullData;
  const registries = dataService.getAllRegistries();

  // Get suggested procedures based on rules
  const suggestedProcedures = dataService.getSuggestedProcedures(operation);
  const suggestedCodes = suggestedProcedures.map(p => p.mode);

  // Check if current mode is a derogation
  const isDerogation = operation.modePassation && !suggestedCodes.includes(operation.modePassation);

  // Modif #79 (4.e) — Mode de passation planifié (figé à la création PPM).
  // Fallback sur operation.modePassation pour les opérations antérieures à
  // la Modif #79 qui n'ont pas le champ modePassationPlanifie.
  const modePlanifieCode = operation.modePassationPlanifie || operation.modePassation || '';
  const modePlanifieEntry = registries.MODE_PASSATION?.find(m => m.code === modePlanifieCode);
  const modePlanifieLabel = modePlanifieEntry?.label || modePlanifieCode || '(non défini)';

  // Modif #79 (4.d) — Bailleurs liés au marché : restreint la liste proposée
  // dans le champ « Source de dérogation » lorsqu'on coche « Bailleur ». On
  // accepte plusieurs structures historiques (financements[] ou bailleurs[]).
  const operationBailleurs = (() => {
    const fromFinancements = Array.isArray(operation.financements)
      ? operation.financements.map(f => f?.bailleur).filter(Boolean)
      : [];
    const fromBailleursList = Array.isArray(operation.bailleurs)
      ? operation.bailleurs.filter(Boolean)
      : [];
    const set = new Set([...fromFinancements, ...fromBailleursList]);
    return Array.from(set);
  })();

  // State for form
  let selectedMode = operation.modePassation || '';
  let derogationJustif = operation.procDerogation?.docId || null;
  let derogationComment = operation.procDerogation?.comment || '';
  // Modif #79 (4.d) — Nouveaux champs dérogation : demandeur + source
  let derogationDemandeur     = operation.procDerogation?.demandeur     || '';
  let derogationDemandeurAutre = operation.procDerogation?.demandeurAutre || '';
  let derogationSourceType    = operation.procDerogation?.source?.type || ''; // 'ETAT' | 'BAILLEUR'
  let derogationSourceBailleur = operation.procDerogation?.source?.bailleur || '';

  // Widgets instances
  let soumissionnairesWidget = null;
  // Marché+ : multi-lot procedure — lots[] avec libellé + nb offres + dates + PVs
  let lotsState = [];

  const page = el('div', { className: 'page' }, [
    // Timeline
    renderSteps(fullData, idOperation),

    // Header — Modif #68 : remplacé par widget unifié (badge état + breadcrumb)
    renderPageHeaderMP({
      idOperation, operation,
      phaseIcon: '📝', phaseLabel: 'Contractualisation',
      titre: 'Procédure & Mode de Passation'
    }),

    // Suggested procedures alert
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '💡 Procédures admissibles (selon règles)')
      ]),
      el('div', { className: 'card-body' }, [
        suggestedProcedures.length > 0
          ? el('div', { className: 'alert alert-info' }, [
              el('div', { className: 'alert-icon' }, 'ℹ️'),
              el('div', { className: 'alert-content' }, [
                el('div', { className: 'alert-title' }, 'Barème applicable'),
                el('div', { className: 'alert-message' }, [
                  el('p', {}, `Type institution: ${operation.typeInstitution || 'ADMIN_CENTRALE'}`),
                  el('p', {}, `Montant: ${(operation.montantPrevisionnel / 1000000).toFixed(1)}M XOF`),
                  el('p', { style: { fontWeight: '600', marginTop: '8px' } }, 'Procédures admissibles:'),
                  el('ul', { style: { marginTop: '8px', paddingLeft: '20px' } },
                    suggestedProcedures.map(p =>
                      el('li', {}, `${p.mode} (${registries.MODE_PASSATION.find(m => m.code === p.mode)?.label || p.mode})`)
                    )
                  )
                ])
              ])
            ])
          : el('div', { className: 'alert alert-warning' }, [
              el('div', { className: 'alert-icon' }, '⚠️'),
              el('div', { className: 'alert-content' }, [
                el('div', { className: 'alert-title' }, 'Aucune règle trouvée'),
                el('div', { className: 'alert-message' }, 'Vérifiez la configuration des barèmes dans rules-config.json')
              ])
            ])
      ])
    ]),

    // Modif #79 (4.e) — Rappel du mode de passation planifié à la création
    // PPM. Bandeau d'information neutre (pas une alerte). Permet au chargé
    // d'études de confirmer ou de motiver une dérogation au moment de la
    // contractualisation.
    modePlanifieCode ? el('div', {
      style: {
        marginBottom: '16px', padding: '12px 16px',
        background: '#eff6ff', border: '1px solid #3b82f6', borderRadius: '6px',
        display: 'flex', alignItems: 'center', gap: '12px'
      }
    }, [
      el('span', { style: { fontSize: '18px' } }, '📌'),
      el('div', { style: { flex: 1 } }, [
        el('div', { style: { fontSize: '11px', fontWeight: 700, color: '#1e3a8a', letterSpacing: '0.5px', textTransform: 'uppercase' } }, 'Mode de passation planifiée'),
        el('div', { style: { fontSize: '14px', fontWeight: 600, color: '#1e3a8a', marginTop: '2px' } }, [
          el('code', { style: { background: 'rgba(0,0,0,0.06)', padding: '1px 6px', borderRadius: '3px', fontSize: '13px' } }, modePlanifieCode),
          ' — ',
          modePlanifieLabel
        ]),
        el('div', { style: { fontSize: '11px', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' } },
          'Simple information : mode retenu lors de la planification.')
      ])
    ]) : null,

    // Mode selection form
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Mode de passation')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, [
            'Mode de passation',
            el('span', { className: 'required' }, '*')
          ]),
          createModeSelect(registries.MODE_PASSATION, selectedMode, (value) => {
            selectedMode = value;
            updateDerogationAlertLocal(value);
            updateContextualSections(value, procedure);
          })
        ])
      ])
    ]),

    // Derogation alert (shown dynamically)
    el('div', { id: 'derogation-alert-container' }),

    // Contextual info alert (requirements based on mode)
    el('div', { id: 'contextual-info-container' }),

    // Procedure details form (dynamic based on mode)
    el('div', { id: 'procedure-details-container' }),

    // Soumissionnaires widget (contextual - shown for PSC, PSL, PSO, AOO, PI)
    el('div', { id: 'soumissionnaires-container' }),

    // Lots widget (contextual - shown for PSC+)
    el('div', { id: 'lots-container' }),

    // Actions
    el('div', { className: 'card' }, [
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } }, [
          createButton('btn btn-secondary', 'Annuler', () => router.navigate('/mp/fiche-marche', { idOperation })),
          createButton('btn btn-primary', 'Enregistrer & Continuer', async () => {
            await handleSave(idOperation, selectedMode, suggestedCodes, soumissionnairesWidget, lotsState, {
              justif: derogationJustif,
              comment: derogationComment,
              demandeur: derogationDemandeur,
              demandeurAutre: derogationDemandeurAutre,
              sourceType: derogationSourceType,
              sourceBailleur: derogationSourceBailleur
            });
          })
        ])
      ])
    ])
  ]);

  // Modif #69 — Bouton démo « Passer à l'étape suivante »
  page.appendChild(renderNextPhaseButton({ idOperation, operation }));
  mount('#app', page);

  // Marché+ : check sanctions sur le fournisseur retenu pré-rempli (s'il y en a un)
  setTimeout(() => _procTriggerSanctionCheck(), 150);

  // Initial derogation check and contextual sections
  if (selectedMode) {
    updateDerogationAlertLocal(selectedMode);
    updateContextualSections(selectedMode, procedure);
  }

  /**
   * Modif #79 (4.d + 4.f) — Refonte de l'affichage de la dérogation.
   *
   * Sémantique selon le CR du 26 mai 2026 :
   * - Si le mode sélectionné est dans la liste des modes admissibles
   *   (suggestedCodes), aucune action n'est exigée : on affiche un simple
   *   encart vert de confirmation.
   * - Sinon (mode hors barème) on demande :
   *     · le demandeur de la dérogation (DCF / DGMP / Chargé d'études / Autre)
   *     · la source (État / Bailleur), avec sélection du bailleur restreinte
   *       aux bailleurs déclarés à la création PPM si Source = Bailleur
   *     · la pièce justificative (PDF/DOC) — non bloquant au save (4.g) mais
   *       remontée en avertissement et notée sur la fiche de vie (4.h).
   *     · un commentaire / motif libre
   * - Si le mode diffère du mode planifié à la création (modePlanifieCode),
   *   on l'indique explicitement dans l'encart pour rappel.
   */
  function updateDerogationAlertLocal(mode) {
    const container = document.getElementById('derogation-alert-container');
    if (!container) return;
    container.innerHTML = '';
    if (!mode) return;

    const isDerog = !suggestedCodes.includes(mode);
    const isChanged = modePlanifieCode && mode !== modePlanifieCode;

    // Cas conforme : pas de dérogation requise. Encart de confirmation simple.
    if (!isDerog) {
      const conforme = el('div', {
        style: {
          marginBottom: '24px', padding: '12px 16px',
          background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '6px',
          color: '#065f46', display: 'flex', gap: '12px', alignItems: 'center'
        }
      }, [
        el('span', { style: { fontSize: '18px' } }, '✓'),
        el('div', { style: { flex: 1 } }, [
          el('div', { style: { fontWeight: 600, fontSize: '14px' } },
            isChanged ? 'Mode confirmé (changement par rapport au mode planifié)'
                      : 'Mode conforme — aucune action supplémentaire requise'),
          isChanged ? el('div', { style: { fontSize: '12px', marginTop: '4px' } }, [
            'Mode planifié : ', el('code', { style: { background: 'rgba(0,0,0,0.06)', padding: '1px 4px' } }, modePlanifieCode),
            ' → mode retenu : ', el('code', { style: { background: 'rgba(0,0,0,0.06)', padding: '1px 4px' } }, mode),
            ' (les deux figurent dans la liste des modes admissibles).'
          ]) : null
        ])
      ]);
      container.appendChild(conforme);
      return;
    }

    // Cas dérogation : on demande les informations justifiant la dérogation.
    const sourceBailleurOptions = (() => {
      const all = registries.BAILLEUR || [];
      const filtered = all.filter(b => operationBailleurs.includes(b.code));
      // Si aucun bailleur n'a été déclaré au PPM, on n'a rien à proposer
      // dans le select — on permet alors la saisie libre du nom du bailleur.
      return { filtered, hasAnyDeclared: filtered.length > 0 };
    })();

    const block = el('div', { className: 'card', style: { marginBottom: '24px', borderColor: 'var(--color-warning, #f59e0b)' } }, [
      el('div', { className: 'card-header', style: { background: '#fffbeb' } }, [
        el('h3', { className: 'card-title', style: { color: '#92400e' } }, '⚠️ Dérogation au barème — justification requise')
      ]),
      el('div', { className: 'card-body' }, [
        // Rappel du changement de mode si applicable
        isChanged ? el('div', { className: 'alert alert-info', style: { marginBottom: '16px' } }, [
          el('div', { className: 'alert-icon' }, 'ℹ️'),
          el('div', { className: 'alert-content' }, [
            el('div', { className: 'alert-message' }, [
              'Mode planifié à la création : ', el('code', { style: { background: 'rgba(0,0,0,0.06)', padding: '1px 4px' } }, modePlanifieCode),
              ' · Mode retenu maintenant : ', el('code', { style: { background: 'rgba(0,0,0,0.06)', padding: '1px 4px' } }, mode), '.'
            ])
          ])
        ]) : null,

        el('p', { style: { margin: '0 0 12px', fontSize: '13px', color: '#374151' } },
          'Le mode sélectionné ne figure pas dans la liste des modes admissibles selon le Code MP CI. Indiquez le demandeur et la source de la dérogation, puis joignez la pièce justificative.'),

        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' } }, [

          // Demandeur (4.d)
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, ['Demandeur de la dérogation', el('span', { className: 'required' }, '*')]),
            (() => {
              const sel = el('select', { className: 'form-input', id: 'derogation-demandeur' }, [
                el('option', { value: '' }, '-- Sélectionner --'),
                el('option', { value: 'DCF', selected: derogationDemandeur === 'DCF' }, 'DCF (Direction du Contrôle Financier)'),
                el('option', { value: 'DGMP', selected: derogationDemandeur === 'DGMP' }, 'DGMP'),
                el('option', { value: 'CHARGE_ETUDES', selected: derogationDemandeur === 'CHARGE_ETUDES' }, 'Chargé d\'études'),
                el('option', { value: 'AUTRE', selected: derogationDemandeur === 'AUTRE' }, 'Autre')
              ]);
              sel.addEventListener('change', (e) => {
                derogationDemandeur = e.target.value;
                const autre = document.getElementById('derogation-demandeur-autre-wrap');
                if (autre) autre.style.display = derogationDemandeur === 'AUTRE' ? '' : 'none';
              });
              return sel;
            })()
          ]),

          // Texte libre si Demandeur = Autre
          el('div', {
            className: 'form-field',
            id: 'derogation-demandeur-autre-wrap',
            style: { display: derogationDemandeur === 'AUTRE' ? '' : 'none' }
          }, [
            el('label', { className: 'form-label' }, 'Préciser le demandeur'),
            (() => {
              const inp = el('input', {
                type: 'text', className: 'form-input', id: 'derogation-demandeur-autre',
                placeholder: 'Ex : direction métier, autorité de tutelle…', value: derogationDemandeurAutre
              });
              inp.addEventListener('input', (e) => { derogationDemandeurAutre = e.target.value; });
              return inp;
            })()
          ]),

          // Source de dérogation (4.d)
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, ['Source de la dérogation', el('span', { className: 'required' }, '*')]),
            (() => {
              const sel = el('select', { className: 'form-input', id: 'derogation-source-type' }, [
                el('option', { value: '' }, '-- Sélectionner --'),
                el('option', { value: 'ETAT', selected: derogationSourceType === 'ETAT' }, 'État'),
                el('option', { value: 'BAILLEUR', selected: derogationSourceType === 'BAILLEUR' }, 'Bailleur')
              ]);
              sel.addEventListener('change', (e) => {
                derogationSourceType = e.target.value;
                const bw = document.getElementById('derogation-source-bailleur-wrap');
                if (bw) bw.style.display = derogationSourceType === 'BAILLEUR' ? '' : 'none';
              });
              return sel;
            })()
          ]),

          // Bailleur (si Source = Bailleur) — restreint aux bailleurs du marché
          el('div', {
            className: 'form-field',
            id: 'derogation-source-bailleur-wrap',
            style: { display: derogationSourceType === 'BAILLEUR' ? '' : 'none' }
          }, [
            el('label', { className: 'form-label' }, [
              'Bailleur concerné',
              !sourceBailleurOptions.hasAnyDeclared
                ? el('span', { style: { fontSize: '11px', color: '#92400e', marginLeft: '6px', fontWeight: 'normal' } }, '(aucun bailleur déclaré au PPM)')
                : null
            ]),
            sourceBailleurOptions.hasAnyDeclared
              ? (() => {
                  const sel = el('select', { className: 'form-input', id: 'derogation-source-bailleur' }, [
                    el('option', { value: '' }, '-- Sélectionner --'),
                    ...sourceBailleurOptions.filtered.map(b =>
                      el('option', { value: b.code, selected: derogationSourceBailleur === b.code }, b.label)
                    )
                  ]);
                  sel.addEventListener('change', (e) => { derogationSourceBailleur = e.target.value; });
                  return sel;
                })()
              : (() => {
                  // Pas de bailleur déclaré au PPM : on autorise la saisie libre
                  // pour ne pas bloquer le métier (cas rare).
                  const inp = el('input', {
                    type: 'text', className: 'form-input', id: 'derogation-source-bailleur',
                    placeholder: 'Nom du bailleur', value: derogationSourceBailleur
                  });
                  inp.addEventListener('input', (e) => { derogationSourceBailleur = e.target.value; });
                  return inp;
                })()
          ])
        ]),

        // Document justificatif
        el('div', { className: 'form-field', style: { marginTop: '16px' } }, [
          el('label', { className: 'form-label' }, [
            'Document justificatif (décision, note, autorisation, etc.)'
          ]),
          el('input', { type: 'file', className: 'form-input', id: 'derogation-doc', accept: '.pdf,.doc,.docx' }),
          // Modif #79 (4.g) — pièce non bloquante au save. Avertissement seul.
          el('small', { className: 'text-muted', style: { display: 'block', marginTop: '6px' } },
            'Sans pièce, la dérogation sera enregistrée avec un avertissement sur la fiche de vie (à corriger ultérieurement).')
        ]),

        // Commentaire / Motif
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Commentaire / Motif'),
          (() => {
            const ta = el('textarea', {
              className: 'form-input', id: 'derogation-comment', rows: 3,
              placeholder: 'Expliquez les raisons de cette dérogation…'
            });
            ta.value = derogationComment;
            ta.addEventListener('input', (e) => { derogationComment = e.target.value; });
            return ta;
          })()
        ])
      ])
    ]);

    container.appendChild(block);
  }

  /**
   * Update contextual sections based on selected mode
   */
  function updateContextualSections(mode, procedureData) {
    if (!mode) {
      // Hide all contextual sections
      document.getElementById('contextual-info-container').innerHTML = '';
      document.getElementById('procedure-details-container').innerHTML = '';
      document.getElementById('soumissionnaires-container').innerHTML = '';
      document.getElementById('lots-container').innerHTML = '';
      return;
    }

    // Render procedure details form based on mode
    const detailsContainer = document.getElementById('procedure-details-container');
    detailsContainer.innerHTML = '';
    const detailsForm = renderProcedureDetailsForm(procedureData, operation, registries, mode);
    if (detailsForm) {
      detailsContainer.appendChild(detailsForm);
    }

    // Display contextual info alert
    const infoContainer = document.getElementById('contextual-info-container');
    const infoAlert = createProcedureInfoAlert(mode);
    infoContainer.innerHTML = '';
    if (infoAlert) {
      const card = el('div', { className: 'card', style: { marginBottom: '24px', borderColor: '#0dcaf0' } }, [
        el('div', { className: 'card-header', style: { background: '#cff4fc' } }, [
          el('h3', { className: 'card-title', style: { color: '#055160' } }, '📌 Exigences contextuelles')
        ]),
        el('div', { className: 'card-body' })
      ]);
      card.querySelector('.card-body').appendChild(infoAlert);
      infoContainer.appendChild(card);
    }

    // Soumissionnaires management
    const soumissionnairesContainer = document.getElementById('soumissionnaires-container');
    if (hasSoumissionnairesManagement(mode)) {
      soumissionnairesContainer.innerHTML = '';

      const card = el('div', { className: 'card', style: { marginBottom: '24px' } }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, '👥 Gestion des soumissionnaires')
        ]),
        el('div', { className: 'card-body' }, [
          el('div', { id: 'soumissionnaires-widget-root' })
        ])
      ]);

      soumissionnairesContainer.appendChild(card);

      // Initialize widget
      soumissionnairesWidget = new SoumissionnairesWidget('soumissionnaires-widget-root', {
        allowAdd: true,
        allowEdit: true,
        allowDelete: true,
        showBankInfo: true,
        showSanctionStatus: true,
        onChange: (soumissionnaires) => {
          logger.info('[Procedure] Soumissionnaires updated:', soumissionnaires);
        }
      });

      // Load existing data if available
      if (procedureData?.soumissionnaires) {
        soumissionnairesWidget.loadData(procedureData.soumissionnaires);
      }
    } else {
      soumissionnairesContainer.innerHTML = '';
      soumissionnairesWidget = null;
    }

    // Lots & procédure par lot (Marché+ multi-lot)
    // On l'active pour TOUS les modes sauf PSD (Procédure Simplifiée d'Entente
    // Directe — par nature mono-fournisseur, pas de notion de lot).
    // Couvre ainsi PSC/PSL/PSO/AOO/PI (config explicite) ET CI/AOR/DEM/
    // ENTENTE_DIRECTE qui n'ont pas info_lots configuré dans rules-config.
    const lotsContainer = document.getElementById('lots-container');
    const shouldShowLots = mode && mode !== 'PSD';
    if (shouldShowLots) {
      lotsContainer.innerHTML = '';

      // Migration : si pas de lots, mais on a des dates/pv/nbOffres legacy
      // au niveau procedure → on construit un lot 1 unique depuis ces valeurs.
      let initialLots = procedureData?.lots && procedureData.lots.length > 0
        ? procedureData.lots
        : null;
      if (!initialLots && procedureData && (procedureData.dates || procedureData.pv || procedureData.nbOffresRecues)) {
        initialLots = [{
          id: undefined,
          numero: 1,
          libelle: operation.objet || '',
          nbOffresRecues: procedureData.nbOffresRecues || 0,
          nbOffresClassees: procedureData.nbOffresClassees || 0,
          dates: procedureData.dates || {},
          pv: procedureData.pv || {}
        }];
      }

      const card = el('div', { className: 'card', style: { marginBottom: '24px' } }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, '📦 Lots & procédure par lot')
        ]),
        el('div', { className: 'card-body' }, [
          el('div', { id: 'lots-widget-root' })
        ])
      ]);

      lotsContainer.appendChild(card);

      const widget = renderLotsProcedureMP(
        initialLots || [],
        { defaultLibelle: operation.objet || '' },
        (updated) => { lotsState = updated; }
      );
      document.getElementById('lots-widget-root').appendChild(widget);
      // Initialise lotsState avec la valeur courante (le widget le settera aussi via onChange dès la 1ʳᵉ interaction)
      lotsState = initialLots && initialLots.length > 0
        ? initialLots
        : [{ numero: 1, libelle: operation.objet || '', nbOffresRecues: 0, nbOffresClassees: 0, dates: {}, pv: {} }];
    } else {
      lotsContainer.innerHTML = '';
      lotsState = [];
    }
  }
}

/**
 * Create mode selection dropdown
 */
function createModeSelect(modes, selectedValue, onChange) {
  const select = el('select', { className: 'form-input' });

  // Empty option
  const emptyOption = el('option', { value: '' }, '-- Sélectionnez un mode --');
  select.appendChild(emptyOption);

  // Mode options
  modes.forEach(mode => {
    const option = el('option', { value: mode.code }, mode.label);
    if (mode.code === selectedValue) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  select.addEventListener('change', (e) => {
    onChange(e.target.value);
  });

  return select;
}

// Modif #79 (4.d + 4.f) — l'ancienne fonction externe updateDerogationAlert
// a été remplacée par la closure updateDerogationAlertLocal définie dans
// renderProcedurePV, qui a accès aux variables d'état du formulaire
// (derogationDemandeur, derogationSourceType, etc.) et aux bailleurs liés
// au marché. Voir la fonction interne pour la sémantique CR 26 mai 2026.

/**
 * Render procedure details form based on mode
 * - PSD: Simplified (devis + bon de commande)
 * - PSC: Comparaison de devis
 * - PSL/PSO/AOO/PI: Full form with COJO, dates, PV
 */
function renderProcedureDetailsForm(procedure, operation, registries, mode) {
  const existingProc = procedure || {};

  // PSD - Procédure Simplifiée d'Entente Directe
  // Modif #79 (4.j) — Tous les libellés utilisateur contenant « devis » sont
  // remplacés par « devis / facture proforma » (CR 26 mai 2026). Les IDs
  // techniques et noms de champs en base restent inchangés (proc-ref-devis,
  // refDevis, docDevis, …) pour préserver les données existantes.
  if (mode === 'PSD' || mode === 'ENTENTE_DIRECTE') {
    return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '📋 Validation du devis / facture proforma')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { className: 'alert alert-info', style: { marginBottom: '16px' } }, [
          el('div', { className: 'alert-icon' }, 'ℹ️'),
          el('div', { className: 'alert-content' }, [
            el('div', { className: 'alert-title' }, 'Procédure simplifiée'),
            el('div', { className: 'alert-message' }, 'Pour les marchés < 10M XOF, une simple validation du devis / facture proforma suffit. Pas de commission ni de PV requis.')
          ])
        ]),

        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
          // Fournisseur sélectionné
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, ['Fournisseur', el('span', { className: 'required' }, '*')]),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'proc-fournisseur',
              placeholder: 'Nom du fournisseur',
              value: existingProc.fournisseurNom || ''
            })
          ]),

          // Référence devis / facture proforma
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, ['Référence devis / facture proforma', el('span', { className: 'required' }, '*')]),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'proc-ref-devis',
              placeholder: 'Ex : DEV-2024-001 ou FP-2024-001',
              value: existingProc.refDevis || ''
            })
          ]),

          // Date du devis / facture proforma
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Date du devis / facture proforma'),
            el('input', {
              type: 'date',
              className: 'form-input',
              id: 'proc-date-devis',
              value: existingProc.dateDevis ? existingProc.dateDevis.split('T')[0] : ''
            })
          ]),

          // Document devis / facture proforma
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, ['Document devis / facture proforma (PDF)', el('span', { className: 'required' }, '*')]),
            el('input', {
              type: 'file',
              className: 'form-input',
              id: 'proc-doc-devis',
              accept: '.pdf'
            }),
            existingProc.docDevis ? el('small', { className: 'text-success' }, `✓ ${existingProc.docDevis}`) : null
          ])
        ]),

        // Bon de commande
        el('div', { style: { marginTop: '24px', marginBottom: '8px', borderTop: '1px solid var(--color-gray-200)', paddingTop: '16px' } }, [
          el('strong', {}, '📄 Bon de commande')
        ]),

        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
          // Numéro BC
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Numéro bon de commande'),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'proc-num-bc',
              placeholder: 'Ex: BC-2024-001',
              value: existingProc.numBC || ''
            })
          ]),

          // Date BC
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Date émission'),
            el('input', {
              type: 'date',
              className: 'form-input',
              id: 'proc-date-bc',
              value: existingProc.dateBC ? existingProc.dateBC.split('T')[0] : ''
            })
          ]),

          // Document BC
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Document BC (PDF)'),
            el('input', {
              type: 'file',
              className: 'form-input',
              id: 'proc-doc-bc',
              accept: '.pdf'
            }),
            existingProc.docBC ? el('small', { className: 'text-success' }, `✓ ${existingProc.docBC}`) : null
          ])
        ])
      ])
    ]);
  }

  // PSC - Procédure Simplifiée de Cotation
  if (mode === 'PSC') {
    // Modif #79 (4.j + 4.k + 4.l) — Renommages « devis » → « devis / facture
    // proforma ». Suppression des champs « Nombre de devis reçus » (4.k) et
    // « Tableau comparatif » (4.l) — les données existantes sont préservées
    // côté base via le merge dans handleSave.
    return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '📋 Comparaison de devis / facture proforma')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { className: 'alert alert-info', style: { marginBottom: '16px' } }, [
          el('div', { className: 'alert-icon' }, 'ℹ️'),
          el('div', { className: 'alert-content' }, [
            el('div', { className: 'alert-title' }, 'Procédure de cotation'),
            el('div', { className: 'alert-message' }, 'Pour les marchés entre 10M et 30M XOF, une comparaison d\'au moins 3 devis / factures proforma est requise. Pas de COJO formel.')
          ])
        ]),

        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
          // Nombre de fournisseurs consultés
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, ['Nombre de fournisseurs consultés', el('span', { className: 'required' }, '*')]),
            el('input', {
              type: 'number',
              className: 'form-input',
              id: 'proc-nb-fournisseurs',
              min: 3,
              value: existingProc.nbFournisseursConsultes || 3
            }),
            el('small', { className: 'text-muted' }, 'Minimum 3 fournisseurs')
          ]),

          // Date comparaison
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Date de comparaison'),
            el('input', {
              type: 'date',
              className: 'form-input',
              id: 'proc-date-comparaison',
              value: existingProc.dateComparaison ? existingProc.dateComparaison.split('T')[0] : ''
            })
          ])
        ]),

        // Note de sélection
        el('div', { style: { marginTop: '24px', marginBottom: '8px', borderTop: '1px solid var(--color-gray-200)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
          el('strong', {}, '📄 Note de sélection'),
          el('button', {
            type: 'button',
            className: 'btn btn-sm btn-secondary',
            onclick: (e) => { e.preventDefault(); openSanctionsDrawer(); }
          }, '🚫 Gérer la liste des entreprises sanctionnées')
        ]),

        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
          // Fournisseur retenu (avec détection sanctions live)
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, ['Fournisseur retenu', el('span', { className: 'required' }, '*')]),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'proc-fournisseur-retenu',
              placeholder: 'Nom du fournisseur sélectionné',
              value: existingProc.fournisseurRetenu || '',
              oninput: () => _procTriggerSanctionCheck()
            }),
            el('div', { id: 'proc-sanction-banner' })
          ]),

          // Motif de sélection
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Motif de sélection'),
            el('select', { className: 'form-input', id: 'proc-motif-selection' }, [
              el('option', { value: 'MOINS_DISANT', selected: existingProc.motifSelection === 'MOINS_DISANT' }, 'Moins-disant'),
              el('option', { value: 'MIEUX_DISANT', selected: existingProc.motifSelection === 'MIEUX_DISANT' }, 'Mieux-disant'),
              el('option', { value: 'UNIQUE_REPONSE', selected: existingProc.motifSelection === 'UNIQUE_REPONSE' }, 'Unique réponse conforme')
            ])
          ]),

          // Note de sélection
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Note de sélection (PDF)'),
            el('input', {
              type: 'file',
              className: 'form-input',
              id: 'proc-note-selection',
              accept: '.pdf'
            }),
            existingProc.noteSelection ? el('small', { className: 'text-success' }, `✓ ${existingProc.noteSelection}`) : null
          ])
        ])
      ])
    ]);
  }

  // PSL, PSO, AOO, PI - Procédures avec COJO/COPE
  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '📋 Détails de la procédure')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [

        // Type de commission
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, ['Type de commission', el('span', { className: 'required' }, '*')]),
          el('select', { className: 'form-input', id: 'proc-commission', required: true }, [
            el('option', { value: '' }, '-- Sélectionner --'),
            ...(registries.TYPE_COMMISSION || []).map(c =>
              el('option', { value: c.code, selected: c.code === existingProc.commission }, c.label)
            )
          ]),
          el('small', { className: 'text-muted' }, 'COJO pour Admin Centrale, COPE pour projets/collectivités')
        ]),

        // Catégorie procédure
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, ['Catégorie', el('span', { className: 'required' }, '*')]),
          el('select', { className: 'form-input', id: 'proc-categorie', required: true }, [
            el('option', { value: '' }, '-- Sélectionner --'),
            ...(registries.CATEGORIE_PROCEDURE || []).map(cat =>
              el('option', { value: cat.code, selected: cat.code === existingProc.categorie }, cat.label)
            )
          ])
        ]),

        // Type dossier d'appel — filtré par mode de passation courant
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Type de dossier d\'appel'),
          el('select', { className: 'form-input', id: 'proc-type-dossier' }, [
            el('option', { value: '' }, '-- Sélectionner --'),
            ...(registries.TYPE_DOSSIER_APPEL || [])
              .filter(d => !d.modes?.length || d.modes.includes(mode))
              .map(d => el('option', { value: d.code, selected: d.code === existingProc.typeDossierAppel }, d.label))
          ]),
          el('small', { className: 'text-muted' }, `Types compatibles avec ${mode || 'le mode sélectionné'}`)
        ]),

        // Upload dossier d'appel
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Document dossier d\'appel'),
          el('input', {
            type: 'file',
            className: 'form-input',
            id: 'proc-dossier-doc',
            accept: '.pdf,.doc,.docx,.zip'
          }),
          existingProc.dossierAppelDoc ? el('small', { className: 'text-success' }, `✓ ${existingProc.dossierAppelDoc}`) : null
        ]),

      ]),

      el('div', {
        className: 'alert alert-info',
        style: { marginTop: '12px', fontSize: '13px' }
      }, [
        el('div', { className: 'alert-icon' }, 'ℹ️'),
        el('div', { className: 'alert-content' },
          'Le détail de la procédure (nombre d\'offres, dates et PVs) est désormais saisi dans la section « Lots & procédure par lot » ci-dessous, pour permettre une gestion par lot quand le marché en comporte plusieurs.')
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
 *
 * Modif #79 (4.f + 4.g + 4.i) — Signature étendue : reçoit derogationState
 * qui agrège tous les champs du formulaire dérogation (demandeur, source,
 * justification). La pièce justificative n'est plus bloquante : son absence
 * est remontée comme avertissement et conservée pour la fiche de vie.
 *
 * @param {Object} derogationState — { justif, comment, demandeur, demandeurAutre, sourceType, sourceBailleur }
 */
async function handleSave(idOperation, selectedMode, suggestedCodes, soumissionnairesWidget, lotsState, derogationState = {}) {
  if (!selectedMode) {
    alert('Veuillez sélectionner un mode de passation');
    return;
  }

  // Pré-fetch de la procédure existante : on en a besoin pour suppress
  // les faux warnings quand le fichier est déjà uploadé.
  const existingProc = await dataService.getByField(ENTITIES.MP_PROCEDURE, 'operationId', idOperation);

  // Validate soumissionnaires if widget is active
  if (soumissionnairesWidget) {
    const soumValidation = soumissionnairesWidget.validate();
    if (!soumValidation.valid) {
      alert('⚠️ Validation soumissionnaires:\n\n' + soumValidation.errors.join('\n'));
      return;
    }
  }

  // Marché+ multi-lot : lotsState est déjà un Array via onChange du widget.
  // Pas de validation bloquante ici (les champs sont optionnels par design).

  const isDerogation = !suggestedCodes.includes(selectedMode);

  // Modif #79 (4.f + 4.g) — Gestion de la dérogation :
  //   · si dérogation : on enregistre les infos saisies (demandeur, source,
  //     pièce, motif). La pièce manquante n'est PLUS BLOQUANTE — on remonte
  //     juste un avertissement à la fiche de vie via
  //     operation.contractualisationWarnings.derogationPieceManquante.
  let derogationJustif    = derogationState.justif || null;
  let derogationComment   = derogationState.comment || '';
  let derogationDemandeur = derogationState.demandeur || '';
  let derogationDemandeurAutre = derogationState.demandeurAutre || '';
  let derogationSourceType = derogationState.sourceType || '';
  let derogationSourceBailleur = derogationState.sourceBailleur || '';
  let derogationPieceManquante = false;

  if (isDerogation) {
    const docInput = document.getElementById('derogation-doc');
    const commentInput = document.getElementById('derogation-comment');

    if (docInput?.files?.[0]) {
      // Simulate doc upload (in real app, upload to server/storage)
      derogationJustif = 'DOC_DEROG_' + Date.now() + '.pdf';
      logger.info('[Procedure] Document dérogation uploadé:', derogationJustif);
    } else if (!derogationJustif) {
      // Modif #79 (4.g) — pièce manquante = warning non bloquant
      derogationPieceManquante = true;
      logger.warn('[Procedure] Dérogation enregistrée sans pièce justificative — à corriger ultérieurement');
    }

    // Permet à l'utilisateur de continuer à taper dans le textarea après
    // le dernier onInput : on prend la valeur la plus à jour du DOM.
    derogationComment = commentInput?.value ?? derogationComment;
  }

  // Collect procedure details based on mode
  let procedureData = {
    operationId: idOperation,
    modePassation: selectedMode
  };

  // PSD / ENTENTE_DIRECTE - Simplified procedure
  if (selectedMode === 'PSD' || selectedMode === 'ENTENTE_DIRECTE') {
    const fournisseur = document.getElementById('proc-fournisseur')?.value?.trim();
    const refDevis = document.getElementById('proc-ref-devis')?.value?.trim();

    if (!fournisseur || !refDevis) {
      alert('⚠️ Le fournisseur et la référence du devis / facture proforma sont obligatoires');
      return;
    }

    // Modif #79 (4.i) — Si le fournisseur retenu est sanctionné : REJET, save bloqué.
    const sanction = await checkSanction({ raisonSociale: fournisseur });
    if (sanction) {
      alert(`🚫 REJET\n\nLe fournisseur « ${fournisseur} » fait l'objet d'une sanction (${sanction.typeSanction || 'sanction enregistrée'}).\n\nMotif : ${sanction.motif || '(non précisé)'}\n\nVeuillez choisir un autre fournisseur ou faire lever la sanction.`);
      return;
    }

    procedureData = {
      ...procedureData,
      fournisseurNom: fournisseur,
      refDevis: refDevis,
      dateDevis: document.getElementById('proc-date-devis')?.value || null,
      docDevis: document.getElementById('proc-doc-devis')?.files?.[0] ? 'DEVIS_' + Date.now() + '.pdf' : null,
      numBC: document.getElementById('proc-num-bc')?.value?.trim() || null,
      dateBC: document.getElementById('proc-date-bc')?.value || null,
      docBC: document.getElementById('proc-doc-bc')?.files?.[0] ? 'BC_' + Date.now() + '.pdf' : null
    };
  }
  // PSC - Comparaison de devis
  else if (selectedMode === 'PSC') {
    const nbFournisseurs = Number(document.getElementById('proc-nb-fournisseurs')?.value) || 0;
    const fournisseurRetenu = document.getElementById('proc-fournisseur-retenu')?.value?.trim();

    if (nbFournisseurs < 3) {
      alert('⚠️ Minimum 3 fournisseurs doivent être consultés pour une PSC');
      return;
    }

    if (!fournisseurRetenu) {
      alert('⚠️ Le fournisseur retenu est obligatoire');
      return;
    }

    // Modif #79 (4.i) — Sanction sur l'attributaire = REJET bloquant.
    const sanction = await checkSanction({ raisonSociale: fournisseurRetenu });
    if (sanction) {
      alert(`🚫 REJET\n\nLe fournisseur retenu « ${fournisseurRetenu} » fait l'objet d'une sanction (${sanction.typeSanction || 'sanction enregistrée'}).\n\nMotif : ${sanction.motif || '(non précisé)'}\n\nVeuillez choisir un autre fournisseur ou faire lever la sanction.`);
      return;
    }

    // Modif #79 (4.k + 4.l) — champs « Nombre de devis reçus » et « Tableau
    // comparatif » retirés de l'UI. On préserve les valeurs existantes en base
    // (existingProc) via le merge ci-dessous pour ne pas perdre l'historique.
    procedureData = {
      ...procedureData,
      nbFournisseursConsultes: nbFournisseurs,
      dateComparaison: document.getElementById('proc-date-comparaison')?.value || null,
      fournisseurRetenu: fournisseurRetenu,
      motifSelection: document.getElementById('proc-motif-selection')?.value || 'MOINS_DISANT',
      noteSelection: document.getElementById('proc-note-selection')?.files?.[0] ? 'NOTE_SEL_' + Date.now() + '.pdf' : null
    };
  }
  // PSL, PSO, AOO, PI - Full procedure with COJO/COPE
  // Tous les champs sont optionnels : on n'interrompt jamais le save, on
  // remonte juste un récap des manquants à la fin.
  // Le détail (nb offres / dates / PVs) est désormais PER LOT et provient
  // de lotsState (renseigné via le widget renderLotsProcedureMP).
  else {
    const commission = document.getElementById('proc-commission')?.value || null;
    const categorie = document.getElementById('proc-categorie')?.value || null;
    const typeDossierAppel = document.getElementById('proc-type-dossier')?.value || null;

    let dossierAppelDoc = null;
    const dossierInput = document.getElementById('proc-dossier-doc');
    if (dossierInput?.files?.[0]) {
      dossierAppelDoc = 'DOSSIER_' + Date.now() + '.pdf';
      logger.info('[Procedure] Dossier d\'appel uploadé:', dossierAppelDoc);
    }

    procedureData = {
      ...procedureData,
      commission,
      categorie,
      typeDossierAppel,
      dossierAppelDoc
    };

    // Avertissements non bloquants
    const warnings = [];
    if (!commission) warnings.push('Type de commission');
    if (!categorie) warnings.push('Catégorie');

    const lots = Array.isArray(lotsState) ? lotsState : [];
    if (lots.length === 0) {
      warnings.push('Aucun lot défini (au moins 1 lot attendu)');
    } else {
      lots.forEach((lot, i) => {
        const tag = `Lot ${lot.numero || i + 1}`;
        if (!lot.libelle) warnings.push(`${tag} : libellé manquant`);
        if (!lot.dates?.ouverture) warnings.push(`${tag} : date d'ouverture manquante`);
        if (!lot.dates?.jugement) warnings.push(`${tag} : date de jugement manquante`);
        const hasAnyPvOuv = lot.pv?.ouverture;
        if (!hasAnyPvOuv) warnings.push(`${tag} : PV d'ouverture manquant`);
        const hasAnyPvJug = lot.pv?.jugement;
        if (!hasAnyPvJug) warnings.push(`${tag} : PV de jugement manquant`);
        // Chronologie
        const dOuv = lot.dates?.ouverture;
        const dAnaT = lot.dates?.analyseTechnique;
        const dJug = lot.dates?.jugement;
        if (dOuv && dAnaT && new Date(dAnaT) < new Date(dOuv)) {
          warnings.push(`${tag} : date d'analyse technique antérieure à l'ouverture`);
        }
        if (dAnaT && dJug && new Date(dJug) < new Date(dAnaT)) {
          warnings.push(`${tag} : date de jugement antérieure à l'analyse technique`);
        }
      });
    }
    if (warnings.length > 0) {
      window.__mpProcedureWarnings = warnings;
    } else {
      delete window.__mpProcedureWarnings;
    }
  }

  // Pré-fetch de l'opération pour pouvoir merger contractualisationWarnings
  const operation = await dataService.get(ENTITIES.MP_OPERATION, idOperation);

  // Modif #79 (4.d + 4.g + 4.h) — Construction du payload procDerogation et
  // des warnings contractualisation (consommés par la fiche de vie).
  const existingWarnings = operation?.contractualisationWarnings || {};
  const contractualisationWarnings = { ...existingWarnings };
  if (isDerogation) {
    contractualisationWarnings.derogationPieceManquante = derogationPieceManquante;
  } else {
    // Mode désormais conforme : on retire toute notification résiduelle.
    delete contractualisationWarnings.derogationPieceManquante;
  }

  // Update operation
  const updateData = {
    modePassation: selectedMode,
    procDerogation: isDerogation ? {
      isDerogation: true,
      docId: derogationJustif,
      comment: derogationComment,
      demandeur: derogationDemandeur,
      demandeurAutre: derogationDemandeur === 'AUTRE' ? derogationDemandeurAutre : null,
      source: derogationSourceType ? {
        type: derogationSourceType,
        bailleur: derogationSourceType === 'BAILLEUR' ? derogationSourceBailleur : null
      } : null,
      pieceManquante: derogationPieceManquante,
      validatedAt: new Date().toISOString(),
      sourceEtape: 'PROC'
    } : null,
    contractualisationWarnings: Object.keys(contractualisationWarnings).length > 0
      ? contractualisationWarnings
      : null
  };

  // Add PROC to timeline if not present
  if (!operation.timeline.includes('PROC')) {
    updateData.timeline = [...operation.timeline, 'PROC'];
    updateData.etat = 'EN_PROC';
  }

  const operationResult = await dataService.update(ENTITIES.MP_OPERATION, idOperation, updateData);

  if (!operationResult.success) {
    alert('❌ Erreur lors de la mise à jour de l\'opération');
    return;
  }

  // Create or update procedure (existingProc déjà pré-fetché plus haut)
  const existingProcedure = existingProc;

  // Get soumissionnaires from widget; lots from lotsState (Marché+ multi-lot)
  const soumissionnaires = soumissionnairesWidget ? soumissionnairesWidget.getData() : [];
  const lots = Array.isArray(lotsState) ? lotsState : [];

  procedureData.soumissionnaires = soumissionnaires;
  procedureData.lots = lots;

  // Merge with existing data if updating (préserve documents PSD/PSC/dossier
  // si non ré-uploadés). La logique per-lot pour les PVs/dates est gérée par
  // le widget renderLotsProcedureMP côté UI (chaque PV file est conservé tant
  // qu'il n'est pas explicitement remplacé).
  // Modif #79 (4.k + 4.l) — Les champs nbDevisRecus et tableauComparatif ont
  // été retirés de l'UI. On les conserve depuis la base s'ils existaient.
  if (existingProcedure) {
    if (procedureData.docDevis === null && existingProcedure.docDevis) {
      procedureData.docDevis = existingProcedure.docDevis;
    }
    if (procedureData.docBC === null && existingProcedure.docBC) {
      procedureData.docBC = existingProcedure.docBC;
    }
    if (procedureData.tableauComparatif === undefined && existingProcedure.tableauComparatif) {
      procedureData.tableauComparatif = existingProcedure.tableauComparatif;
    }
    if (procedureData.nbDevisRecus === undefined && existingProcedure.nbDevisRecus != null) {
      procedureData.nbDevisRecus = existingProcedure.nbDevisRecus;
    }
    if (procedureData.noteSelection === null && existingProcedure.noteSelection) {
      procedureData.noteSelection = existingProcedure.noteSelection;
    }
    if (procedureData.dossierAppelDoc === null && existingProcedure.dossierAppelDoc) {
      procedureData.dossierAppelDoc = existingProcedure.dossierAppelDoc;
    }
  }

  let procedureResult;
  if (existingProcedure) {
    procedureResult = await dataService.update(ENTITIES.MP_PROCEDURE, existingProcedure.id, procedureData);
  } else {
    procedureResult = await dataService.add(ENTITIES.MP_PROCEDURE, procedureData);
  }

  if (procedureResult.success) {
    logger.info('[Procedure] Procédure enregistrée avec succès');
    let msg = '✅ Procédure enregistrée' + (isDerogation ? ' (avec dérogation)' : '');
    const warnings = window.__mpProcedureWarnings;
    if (Array.isArray(warnings) && warnings.length > 0) {
      msg += '\n\n⚠️ Champs incomplets ou incohérents (non bloquants) :\n• ' + warnings.join('\n• ');
      delete window.__mpProcedureWarnings;
    }
    alert(msg);
    router.navigate('/mp/fiche-marche', { idOperation });
  } else {
    alert('❌ Erreur lors de la sauvegarde de la procédure');
  }
}

export default renderProcedurePV;
