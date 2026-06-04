/* ============================================
   ECR02A - Contractualisation & Choix Mode de Passation
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
  // Modif #80 — Le mode de passation n'est plus sélectionnable à la
  // contractualisation : il est FIGÉ sur le mode planifié (4.e). La dérogation
  // est désormais déterminée par l'écart barème ↔ planification (et non plus
  // par un choix de l'utilisateur, qui n'existe plus ici).
  let selectedMode = modePlanifieCode || operation.modePassation || '';
  let derogationJustif = operation.procDerogation?.docId || null;
  let derogationComment = operation.procDerogation?.comment || '';
  // Modif #79 (4.d) — Nouveaux champs dérogation : demandeur + source
  // Modif #96 — champ « Demandeur » retiré. Seule la source (État ou bailleur) est demandée.
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
      titre: 'Contractualisation & mode de passation'
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

    // Modif #80 — La carte « Mode de passation » (avec son dropdown de
    // sélection) a été retirée : le mode n'est plus modifiable à la
    // contractualisation. L'information est déjà portée par le bandeau
    // « Mode de passation planifiée » ci-dessus. En cas d'incohérence
    // barème ↔ planification, les éléments de dérogation apparaissent
    // automatiquement dans l'encart ci-dessous.

    // Derogation alert (shown dynamically)
    el('div', { id: 'derogation-alert-container' }),

    // Modif #106 — C-2/C-3 : pièce d'engagement de l'étape (mise en évidence,
    // en tête). Options selon le mode (PV/courrier/mandat ↔ bon de commande/devis).
    el('div', { id: 'engagement-container' }),

    // Modif #111 — C-11 vague 3 / C-9 : sélecteur de sous-procédure PI
    // (AMI cabinet / AMI CV / DP) qui pilote l'issue (liste restreinte vs attribution).
    el('div', { id: 'pi-subproc-container' }),

    // Contextual info alert (requirements based on mode)
    el('div', { id: 'contextual-info-container' }),

    // Procedure details form (dynamic based on mode)
    el('div', { id: 'procedure-details-container' }),

    // Soumissionnaires widget (contextual - shown for PSC, PSL, PSO, AOO, PI)
    el('div', { id: 'soumissionnaires-container' }),

    // Lots widget (contextual - shown for PSC+)
    el('div', { id: 'lots-container' }),

    // Modif #109 — C-11 vague 1 : bloc « Attribution » (issue de la
    // contractualisation : attributaire + NCC + montant attribué).
    el('div', { id: 'attribution-container' }),

    // Modif #111 — C-11 vague 3 / C-9 : liste restreinte (AMI cabinet).
    el('div', { id: 'liste-restreinte-container' }),

    // Modif #122 — E-19 : réserves du CF, déplacées de l'enregistrement vers la
    // contractualisation (« à toutes les contractualisations »).
    el('div', { id: 'reserve-cf-container' }),

    // Actions
    el('div', { className: 'card' }, [
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } }, [
          createButton('btn btn-secondary', 'Annuler', () => router.navigate('/mp/fiche-marche', { idOperation })),
          // Modif #107 — C-4/C-12 : issue alternative « Infructueux ».
          createButton('btn btn-warning', '🚫 Déclarer infructueux', async () => {
            if (!window.confirm('Déclarer cette contractualisation INFRUCTUEUSE ?\nLe marché passera au statut « Infructueux ».')) return;
            await handleSave(idOperation, selectedMode, suggestedCodes, soumissionnairesWidget, lotsState, {
              justif: derogationJustif,
              comment: derogationComment,
              sourceType: derogationSourceType,
              sourceBailleur: derogationSourceBailleur
            }, { issue: 'INFRUCTUEUX' });
          }),
          createButton('btn btn-primary', 'Enregistrer & Continuer', async () => {
            await handleSave(idOperation, selectedMode, suggestedCodes, soumissionnairesWidget, lotsState, {
              justif: derogationJustif,
              comment: derogationComment,
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
   *
   * Modif #80 — Le mode étant désormais figé sur la planification, la
   * comparaison se fait toujours entre le mode planifié et le barème. La
   * notion de « changement de mode » (mode retenu ≠ mode planifié) a donc
   * disparu : ses branches d'affichage ont été retirées.
   */
  function updateDerogationAlertLocal(mode) {
    const container = document.getElementById('derogation-alert-container');
    if (!container) return;
    container.innerHTML = '';
    if (!mode) return;

    const isDerog = !suggestedCodes.includes(mode);

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
            'Mode conforme au barème — aucune action supplémentaire requise')
        ])
      ]);
      container.appendChild(conforme);
      return;
    }

    // Cas dérogation : on demande la source justifiant la dérogation.
    // Modif #96 — « Source de la dérogation » = liste sélectionnable (État +
    // bailleurs). Le champ « Demandeur » a été retiré (sans objet).
    // « Bailleur concerné » = liste : les bailleurs déclarés au PPM sont mis en
    // évidence (1er groupe), avec extension possible aux autres bailleurs.
    const allBailleurs = (registries.BAILLEUR || []).filter(b => b.typeFinancement !== 'ETAT');
    const declaredBailleurs = allBailleurs.filter(b => operationBailleurs.includes(b.code));
    const otherBailleurs = allBailleurs.filter(b => !operationBailleurs.includes(b.code));

    const block = el('div', { className: 'card', style: { marginBottom: '24px', borderColor: 'var(--color-warning, #f59e0b)' } }, [
      el('div', { className: 'card-header', style: { background: '#fffbeb' } }, [
        el('h3', { className: 'card-title', style: { color: '#92400e' } }, '⚠️ Dérogation au barème — justification requise')
      ]),
      el('div', { className: 'card-body' }, [
        el('p', { style: { margin: '0 0 12px', fontSize: '13px', color: '#374151' } },
          'Le mode de passation planifié ne figure pas dans la liste des modes admissibles selon le barème (Code MP CI). Une dérogation est donc requise : indiquez la source, puis joignez la pièce justificative.'),

        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' } }, [

          // Modif #96 — Source de la dérogation (État / Bailleur). Le champ
          // « Demandeur » a été retiré.
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, ['Source de la dérogation', el('span', { className: 'required' }, '*')]),
            (() => {
              const sel = el('select', { className: 'form-input', id: 'derogation-source-type' }, [
                el('option', { value: '' }, '-- Sélectionner --'),
                el('option', { value: 'ETAT' }, 'État'),
                el('option', { value: 'BAILLEUR' }, 'Bailleur')
              ]);
              sel.value = derogationSourceType || '';
              sel.addEventListener('change', (e) => {
                derogationSourceType = e.target.value;
                const bw = document.getElementById('derogation-source-bailleur-wrap');
                if (bw) bw.style.display = derogationSourceType === 'BAILLEUR' ? '' : 'none';
              });
              return sel;
            })()
          ]),

          // Bailleur concerné — liste : déclarés au PPM en évidence + autres
          el('div', {
            className: 'form-field',
            id: 'derogation-source-bailleur-wrap',
            style: { display: derogationSourceType === 'BAILLEUR' ? '' : 'none' }
          }, [
            el('label', { className: 'form-label' }, 'Bailleur concerné'),
            (() => {
              const children = [el('option', { value: '' }, '-- Sélectionner --')];
              if (declaredBailleurs.length) {
                children.push(el('optgroup', { label: '★ Bailleurs du marché (planifiés)' },
                  declaredBailleurs.map(b => el('option', { value: b.code }, `${b.label} — déclaré au PPM`))));
              }
              if (otherBailleurs.length) {
                children.push(el('optgroup', { label: declaredBailleurs.length ? 'Autres bailleurs' : 'Bailleurs' },
                  otherBailleurs.map(b => el('option', { value: b.code }, b.label))));
              }
              const sel = el('select', { className: 'form-input', id: 'derogation-source-bailleur' }, children);
              // .value après construction (évite le bug el()/attribut selected)
              sel.value = derogationSourceBailleur || '';
              sel.addEventListener('change', (e) => { derogationSourceBailleur = e.target.value; });
              return sel;
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
      document.getElementById('engagement-container').innerHTML = '';
      document.getElementById('pi-subproc-container').innerHTML = '';
      document.getElementById('contextual-info-container').innerHTML = '';
      document.getElementById('procedure-details-container').innerHTML = '';
      document.getElementById('soumissionnaires-container').innerHTML = '';
      document.getElementById('lots-container').innerHTML = '';
      document.getElementById('attribution-container').innerHTML = '';
      document.getElementById('liste-restreinte-container').innerHTML = '';
      document.getElementById('reserve-cf-container').innerHTML = '';
      return;
    }

    // Modif #106/#113 — Pièces à joindre (facultatives) + case « sans CF ».
    const engagementContainer = document.getElementById('engagement-container');
    if (engagementContainer) {
      engagementContainer.innerHTML = '';
      const piecesBlock = renderPiecesAJoindreBlock(mode, procedureData || {});
      if (piecesBlock) engagementContainer.appendChild(piecesBlock);
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
    // Modif #108/#110 — C-10/C-11 : attribution directe (gré à gré, convention,
    // lettre de commande, reconduction) → pas de PV, pas de notion de lot.
    const shouldShowLots = mode
      && !['PSD', 'ENTENTE_DIRECTE', 'GRE'].includes(mode)
      && !MODES_CONTRAT_DIRECT.includes(mode);
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

      // Modif #105 — C-7/C-8 : carte « Organisation du marché » avec le
      // N° du dossier d'appel et le sélecteur d'allotissement (Lot unique /
      // Lots multiples) qui pilote le widget lots juste en dessous.
      let allotissement = procedureData?.allotissement
        || ((initialLots && initialLots.length > 1) ? 'MULTIPLES' : 'UNIQUE');

      // (Re)monte le widget lots selon le mode d'allotissement courant.
      const mountLots = (allot) => {
        allotissement = allot;
        const root = document.getElementById('lots-widget-root');
        if (!root) return;
        root.innerHTML = '';
        const widget = renderLotsProcedureMP(
          initialLots || [],
          { defaultLibelle: operation.objet || '', allotissement: allot },
          (updated) => { lotsState = updated; }
        );
        root.appendChild(widget);
        lotsState = (initialLots && initialLots.length > 0)
          ? (allot === 'UNIQUE' ? initialLots.slice(0, 1) : initialLots)
          : [{ numero: 1, libelle: operation.objet || '', nbOffresRecues: 0, nbOffresClassees: 0, dates: {}, pv: {} }];
      };

      const orgCard = el('div', { className: 'card', style: { marginBottom: '16px' } }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, '🗂️ Organisation du marché')
        ]),
        el('div', { className: 'card-body' }, [
          el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'N° du dossier d\'appel'),
              el('input', {
                type: 'text', className: 'form-input', id: 'proc-num-dossier',
                placeholder: 'Ex: DAO-2024-007',
                value: procedureData?.numeroDossierAppel || ''
              })
            ]),
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Allotissement'),
              el('select', {
                className: 'form-input', id: 'proc-allotissement',
                onchange: (e) => mountLots(e.target.value)
              }, [
                el('option', { value: 'UNIQUE' }, 'Lot unique'),
                el('option', { value: 'MULTIPLES' }, 'Lots multiples')
              ])
            ])
          ])
        ])
      ]);
      lotsContainer.appendChild(orgCard);

      const card = el('div', { className: 'card', style: { marginBottom: '24px' } }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, '📦 Lots & procédure par lot')
        ]),
        el('div', { className: 'card-body' }, [
          el('div', { id: 'lots-widget-root' })
        ])
      ]);
      lotsContainer.appendChild(card);

      // Pose la valeur du select via .value (évite le bug el()/selected) puis monte.
      const allotSelect = document.getElementById('proc-allotissement');
      if (allotSelect) allotSelect.value = allotissement;
      mountLots(allotissement);
    } else {
      lotsContainer.innerHTML = '';
      lotsState = [];
    }

    // Modif #109/#111 — C-11 : bloc Attribution ; pour les PI, sélecteur de
    // sous-procédure (AMI cabinet → liste restreinte ; AMI CV / DP → attribution).
    const attributionContainer = document.getElementById('attribution-container');
    const lrContainer = document.getElementById('liste-restreinte-container');
    const piContainer = document.getElementById('pi-subproc-container');
    if (attributionContainer) attributionContainer.innerHTML = '';
    if (lrContainer) lrContainer.innerHTML = '';
    if (piContainer) piContainer.innerHTML = '';

    if (mode === 'PI') {
      const initialSub = (procedureData && procedureData.sousProcedurePI) || 'AMI_CABINET';
      const applyPI = (sub) => {
        if (attributionContainer) attributionContainer.innerHTML = '';
        if (lrContainer) lrContainer.innerHTML = '';
        if (sub === 'AMI_CABINET') {
          if (lrContainer) lrContainer.appendChild(renderListeRestreinteBlock(procedureData?.listeRestreinte, false));
        } else {
          // DP : l'attributaire se choisit DANS la liste restreinte ; AMI CV : parmi toutes les entreprises.
          const lr = (sub === 'DP' && Array.isArray(procedureData?.listeRestreinte) && procedureData.listeRestreinte.length)
            ? procedureData.listeRestreinte : null;
          if (attributionContainer) attributionContainer.appendChild(renderAttributionBlock(procedureData || {}, lr));
          if (lr && lrContainer) lrContainer.appendChild(renderListeRestreinteBlock(lr, true));
        }
      };
      if (piContainer) piContainer.appendChild(renderPISubprocSelector(initialSub, applyPI));
      applyPI(initialSub);
    } else if (attributionContainer) {
      // Hors PI : sélection parmi toutes les entreprises.
      attributionContainer.appendChild(renderAttributionBlock(procedureData || {}, null));
    }

    // Modif #122 — E-19 : réserves du CF (à toutes les contractualisations).
    const reserveCFContainer = document.getElementById('reserve-cf-container');
    if (reserveCFContainer) {
      reserveCFContainer.innerHTML = '';
      reserveCFContainer.appendChild(renderReserveCFBlock(procedureData || {}));
    }

    // Modif #108 — C-5 : applique l'état initial « sans CF » (PSD/PSC).
    applySansCFVisibility();
  }
}

// Modif #80 — la fonction createModeSelect (dropdown de sélection du mode de
// passation) a été retirée : le mode est désormais figé sur la planification
// et affiché en lecture seule à la contractualisation.

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
// Modif #110 — C-11 vague 2 : modes à contrat direct (le document du contrat
// se charge ici ; pas de PV, pas de lots ; attribution directe).
const MODES_CONTRAT_DIRECT = ['CONVENTION', 'LETTRE_COMMANDE_MARCHE', 'RECONDUCTION'];

/**
 * Modif #113 — Refonte (retour métier) : les pièces de la contractualisation
 * sont FACULTATIVES et MULTIPLES (on peut joindre courrier ET mandat), pas un
 * passage obligé ni un choix exclusif. Le PV d'ouverture n'est PAS ici : il
 * est saisi au niveau du lot. Pour les modes à contrat direct, on charge le
 * document du contrat. La case « sans CF » (PSD/PSC) reste portée par ce bloc.
 * Retourne null s'il n'y a rien à afficher (ex. gré à gré simple).
 */
function renderPiecesAJoindreBlock(mode, existingProc) {
  const pj = existingProc.piecesJointes || {};
  const isContrat = MODES_CONTRAT_DIRECT.includes(mode);
  const isDirectSimple = ['PSD', 'PSC', 'ENTENTE_DIRECTE', 'GRE'].includes(mode);

  let slots = [];
  if (isContrat) {
    const lbl = mode === 'CONVENTION' ? 'Convention'
      : mode === 'RECONDUCTION' ? 'Contrat de reconduction'
      : 'Lettre de commande valant marché';
    slots = [{ id: 'pj-contrat', label: lbl, doc: pj.contratDoc }];
  } else if (!isDirectSimple) {
    // Concurrentiel : courrier et/ou mandat (facultatifs, indépendants ; pas de PV).
    slots = [
      { id: 'pj-courrier', label: "Courrier d'invitation", doc: pj.courrierDoc },
      { id: 'pj-mandat', label: 'Mandat de représentation', doc: pj.mandatDoc }
    ];
  }

  if (slots.length === 0) return null;

  const body = [
    el('div', { className: 'alert alert-info', style: { marginBottom: '16px' } }, [
      el('div', { className: 'alert-icon' }, 'ℹ️'),
      el('div', { className: 'alert-content' },
        isContrat
          ? 'Attribution directe : chargez le document du contrat.'
          : 'Pièces facultatives à joindre au marché (vous pouvez en joindre plusieurs).')
    ]),
    el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' } },
      slots.map(s => el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, s.label),
        el('input', { type: 'file', className: 'form-input', id: s.id, accept: '.pdf' }),
        s.doc ? el('small', { className: 'text-success' }, `✓ ${s.doc}`) : null
      ]))
    )
  ];

  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, isContrat ? '📄 Document du contrat' : '📎 Pièces à joindre (facultatif)')
    ]),
    el('div', { className: 'card-body' }, body)
  ]);
}

/**
 * Modif #114 — C-5 : champ « Contractualisation sans CF » (PSD/PSC), désormais
 * porté par le formulaire du mode (à côté du document), et non plus par le bloc
 * « Pièces à joindre » (qui était vide/trompeur pour ces modes).
 */
function _sansCFField(existingProc) {
  return el('div', { className: 'form-field', style: { marginTop: '16px', borderTop: '1px dashed #e5e7eb', paddingTop: '12px' } }, [
    el('label', { style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } }, [
      (() => { const cb = el('input', { type: 'checkbox', id: 'proc-sans-cf', onchange: () => applySansCFVisibility() }); cb.checked = !!existingProc.sansCF; return cb; })(),
      el('span', {}, "Contractualisation sans CF (le Contrôleur Financier n'est pas impliqué)")
    ]),
    el('small', { className: 'text-muted' }, 'Allège la saisie : masque les soumissionnaires, les lots et la réserve CF.')
  ]);
}

/**
 * Modif #108 — C-5 : applique la visibilité « sans CF ». Quand la case est
 * cochée (PSD/PSC sans participation du CF), on masque les sections lourdes
 * (soumissionnaires, lots, et la réserve CF lorsqu'elle sera portée ici par
 * E-19). Lecture directe du DOM par identifiants stables.
 */
function applySansCFVisibility() {
  const cb = document.getElementById('proc-sans-cf');
  const sansCF = !!(cb && cb.checked);
  ['soumissionnaires-container', 'lots-container', 'reserve-cf-container'].forEach(idc => {
    const node = document.getElementById(idc);
    if (node) node.style.display = sansCF ? 'none' : '';
  });
}

// Modif #122 — E-19 : types de réserve CF (liste indicative ; le vrai
// référentiel configurable TYPE_RESERVE_CF sera fourni par la DCF).
const TYPES_RESERVE_CF = [
  { code: 'DOCUMENT_MANQUANT', label: 'Document manquant (pièce justificative absente)' },
  { code: 'PIECES_INCOMPLETES', label: 'Pièces administratives incomplètes' },
  { code: 'PROCEDURE_NON_CONFORME', label: 'Procédure non conforme au seuil' },
  { code: 'DEROGATION_NON_JUSTIFIEE', label: 'Dérogation sans pièce justificative' },
  { code: 'ATTRIBUTAIRE_SANCTIONNE', label: 'Attributaire sur liste de sanctions' },
  { code: 'PV_NON_CONFORME', label: "PV d'ouverture/attribution non conforme" },
  { code: 'GARANTIES_NON_CONFORMES', label: 'Garanties hors plage légale' },
  { code: 'AUTRE', label: 'Autre motif (préciser en commentaire)' }
];

/**
 * Modif #122 — E-19 : bloc « Réserves du Contrôleur Financier », déplacé de
 * l'enregistrement vers la contractualisation. Masqué par « sans CF » (PSD/PSC).
 */
function renderReserveCFBlock(existingProc) {
  const r = existingProc.reserveCF || {};
  const aReserves = r.aReserves === true;
  const typeSel = el('select', { className: 'form-input', id: 'cf-type-reserve' }, [
    el('option', { value: '' }, '-- Sélectionner --'),
    ...TYPES_RESERVE_CF.map(t => el('option', { value: t.code }, t.label))
  ]);
  typeSel.value = r.typeReserve || '';
  const details = el('div', { id: 'cf-reserves-details', style: { display: aReserves ? 'block' : 'none', padding: '16px', backgroundColor: '#fff3cd', borderRadius: '4px' } }, [
    el('div', { className: 'form-field', style: { marginBottom: '12px' } }, [
      el('label', { className: 'form-label' }, 'Type de réserve'),
      typeSel
    ]),
    el('div', { className: 'form-field' }, [
      el('label', { className: 'form-label' }, 'Commentaire'),
      el('textarea', { className: 'form-input', id: 'cf-commentaire', rows: 2, placeholder: 'Nature de la réserve, pièces attendues, etc.' }, r.commentaire || '')
    ])
  ]);
  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '⚠️ Réserves du Contrôleur Financier')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
        el('label', { className: 'form-label', style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
          (() => { const cb = el('input', { type: 'checkbox', id: 'cf-a-reserves', onchange: (e) => { details.style.display = e.target.checked ? 'block' : 'none'; } }); cb.checked = aReserves; return cb; })(),
          el('span', {}, 'Le CF a émis des réserves')
        ])
      ]),
      details
    ])
  ]);
}

/**
 * Modif #114 — Retour métier : l'attributaire n'est jamais SAISI, il est
 * SÉLECTIONNÉ. Source : la liste restreinte (si une procédure d'AMI l'a
 * définie en amont) sinon TOUTES les entreprises de la base (`MP_ENTREPRISE`).
 * Le NCC est déduit de l'entreprise choisie. On conserve le montant attribué.
 * @param {object} existingProc
 * @param {Array|null} candidates  liste restreinte [{raisonSociale, ncc}] ou null
 *                                 (null = charger toutes les entreprises async)
 */
function renderAttributionBlock(existingProc, candidates) {
  const a = existingProc.attribution || {};

  const nccDisplay = el('input', { type: 'text', className: 'form-input', id: 'proc-attr-ncc', value: a.ncc || '', placeholder: 'Auto (selon l\'entreprise)' });
  nccDisplay.readOnly = true;

  // Modif #115 — recherche simple (autocomplétion) sur la base des entreprises
  // pour une entreprise attributaire unique : input + datalist + map RS→NCC.
  const nccByRs = {};
  const datalist = el('datalist', { id: 'proc-attr-list' });
  const addOpt = (rs, ncc) => {
    if (!rs || nccByRs[rs] !== undefined) return;
    nccByRs[rs] = ncc || '';
    datalist.appendChild(el('option', { value: rs }));
  };

  const input = el('input', {
    type: 'text', className: 'form-input', id: 'proc-attr-input', list: 'proc-attr-list',
    value: a.raisonSociale || '', placeholder: 'Rechercher une entreprise…',
    oninput: () => { const n = nccByRs[input.value.trim()]; if (n !== undefined) nccDisplay.value = n; }
  });

  const restreinte = Array.isArray(candidates);
  if (restreinte) {
    candidates.forEach(c => addOpt(c.raisonSociale, c.ncc));
    if (a.raisonSociale) addOpt(a.raisonSociale, a.ncc);
  } else {
    if (a.raisonSociale) addOpt(a.raisonSociale, a.ncc);
    dataService.query(ENTITIES.MP_ENTREPRISE).then(list => {
      (list || [])
        .slice()
        .sort((x, y) => (x.raisonSociale || '').localeCompare(y.raisonSociale || ''))
        .forEach(e => addOpt(e.raisonSociale, e.ncc));
    }).catch(() => {});
  }

  return el('div', { className: 'card', style: { marginBottom: '24px', border: '1px solid #16a34a' } }, [
    el('div', { className: 'card-header', style: { background: '#f0fdf4' } }, [
      el('h3', { className: 'card-title', style: { color: '#166534' } }, "🏆 Attribution de la contractualisation")
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { className: 'alert alert-info', style: { marginBottom: '16px' } }, [
        el('div', { className: 'alert-icon' }, 'ℹ️'),
        el('div', { className: 'alert-content' },
          restreinte
            ? "Recherchez/sélectionnez l'attributaire dans la liste restreinte issue de l'AMI, puis le montant attribué (contrôlé à l'enregistrement)."
            : "Recherchez l'attributaire dans la base des entreprises (saisie filtrante), puis le montant attribué. Ce montant sera contrôlé à l'enregistrement du marché approuvé (alerte en cas d'écart).")
      ]),
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' } }, [
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, restreinte ? 'Attributaire (liste restreinte)' : 'Attributaire'),
          input,
          datalist
        ]),
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'NCC'),
          nccDisplay
        ]),
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Montant attribué (XOF)'),
          el('input', { type: 'number', className: 'form-input', id: 'proc-attr-montant', min: 0, step: 1, value: a.montantAttribue != null ? a.montantAttribue : '', placeholder: "Montant de l'attribution" })
        ])
      ])
    ])
  ]);
}

// Modif #111 — C-11 vague 3 / C-9 : sélecteur de sous-procédure PI.
// L'AMI « recrutement de cabinet » conclut par une LISTE RESTREINTE (mémorisée
// pour la DP ultérieure) ; l'AMI « comparaison de CV » et la DP concluent par
// une attribution. onChange(sub) est rappelé pour re-piloter les blocs.
function renderPISubprocSelector(initialSub, onChange) {
  const sel = el('select', { className: 'form-input', id: 'proc-pi-subproc', onchange: (e) => onChange(e.target.value) }, [
    el('option', { value: 'AMI_CABINET' }, 'AMI — recrutement de cabinet (liste restreinte)'),
    el('option', { value: 'AMI_CV' }, 'AMI — comparaison de CV (attribution)'),
    el('option', { value: 'DP' }, 'Demande de Proposition (DP) — attribution')
  ]);
  sel.value = initialSub;
  return el('div', { className: 'card', style: { marginBottom: '24px', border: '1px solid #7c3aed' } }, [
    el('div', { className: 'card-header', style: { background: '#f5f3ff' } }, [
      el('h3', { className: 'card-title', style: { color: '#5b21b6' } }, '🎓 Sous-procédure (Prestations Intellectuelles)')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'Type de procédure PI'),
        sel,
        el('small', { className: 'text-muted' }, "L'AMI cabinet retient une liste restreinte (réutilisée par la DP) ; AMI CV et DP concluent par une attribution.")
      ])
    ])
  ]);
}

// Modif #111 — une ligne de la liste restreinte (raison sociale + NCC).
function _lrRow(rs = '', ncc = '', readOnly = false) {
  const rsInput = el('input', { type: 'text', className: 'form-input lr-rs', value: rs, placeholder: 'Raison sociale', style: { flex: '2' } });
  const nccInput = el('input', { type: 'text', className: 'form-input lr-ncc', value: ncc, placeholder: 'NCC', style: { flex: '1' } });
  if (readOnly) { rsInput.disabled = true; nccInput.disabled = true; }
  const children = [rsInput, nccInput];
  if (!readOnly) {
    children.push(el('button', { type: 'button', className: 'btn btn-sm btn-secondary', onclick: (e) => { e.target.closest('.lr-row').remove(); } }, '✕'));
  }
  return el('div', { className: 'lr-row', style: { display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' } }, children);
}

// Modif #111 — C-9 : bloc liste restreinte (AMI cabinet : éditable ; DP : rappel
// en lecture seule).
function renderListeRestreinteBlock(existing, readOnly) {
  const items = Array.isArray(existing) ? existing : [];
  const rows = el('div', { id: 'lr-rows' }, items.length ? items.map(it => _lrRow(it.raisonSociale, it.ncc, readOnly)) : (readOnly ? [] : [_lrRow()]));
  const body = [
    el('div', { className: 'alert alert-info', style: { marginBottom: '16px' } }, [
      el('div', { className: 'alert-icon' }, 'ℹ️'),
      el('div', { className: 'alert-content' },
        readOnly
          ? "Liste restreinte issue de l'AMI : seules ces entreprises peuvent soumissionner à la Demande de Proposition."
          : "Enregistrez la liste restreinte des entreprises retenues à l'issue de l'AMI. Elle sera réutilisée par la Demande de Proposition (DP).")
    ]),
    rows
  ];
  if (!readOnly) {
    body.push(el('button', {
      type: 'button', className: 'btn btn-sm btn-accent',
      onclick: () => { document.getElementById('lr-rows')?.appendChild(_lrRow()); }
    }, '+ Ajouter une entreprise'));
  }
  return el('div', { className: 'card', style: { marginBottom: '24px', border: '1px solid #7c3aed' } }, [
    el('div', { className: 'card-header', style: { background: '#f5f3ff' } }, [
      el('h3', { className: 'card-title', style: { color: '#5b21b6' } }, readOnly ? "🎯 Liste restreinte (issue de l'AMI)" : '🎯 Liste restreinte retenue (AMI)')
    ]),
    el('div', { className: 'card-body' }, body)
  ]);
}

function renderProcedureDetailsForm(procedure, operation, registries, mode) {
  const existingProc = procedure || {};

  // PSD - Procédure Simplifiée d'Entente Directe
  // Modif #79 (4.j) — Tous les libellés utilisateur contenant « devis » sont
  // remplacés par « devis / facture proforma » (CR 26 mai 2026). Les IDs
  // techniques et noms de champs en base restent inchangés (proc-ref-devis,
  // refDevis, docDevis, …) pour préserver les données existantes.
  if (mode === 'PSD' || mode === 'ENTENTE_DIRECTE' || mode === 'GRE') {
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
        ]),
        mode === 'PSD' ? _sansCFField(existingProc) : null
      ])
    ]);
  }

  // PSC - Procédure Simplifiée de Cotation
  // Modif #109 — C-11 vague 1 : CFN suit le formulaire de sélection (comme PSC).
  if (mode === 'PSC' || mode === 'CFN') {
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
        ]),
        mode === 'PSC' ? _sansCFField(existingProc) : null
      ])
    ]);
  }

  // Modif #110 — C-11 vague 2 : Reconduction (services courants). Attribution
  // directe ; le document est chargé dans la pièce d'engagement. Point de
  // contrôle : autorisation DGMP requise au-delà de 2 ans de reconduction.
  if (mode === 'RECONDUCTION') {
    const ctrl = existingProc.reconductionControl || {};
    return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '🔁 Reconduction — contrôle DGMP')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { className: 'alert alert-warning', style: { marginBottom: '16px' } }, [
          el('div', { className: 'alert-icon' }, '⚠️'),
          el('div', { className: 'alert-content' }, "Au-delà de 2 ans de reconduction, une autorisation de la DGMP est requise.")
        ]),
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' } }, [
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Nombre d\'années de reconduction'),
            el('input', { type: 'number', className: 'form-input', id: 'proc-recond-annees', min: 0, step: 1, value: ctrl.nbAnnees != null ? ctrl.nbAnnees : '' })
          ]),
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Référence autorisation DGMP'),
            el('input', { type: 'text', className: 'form-input', id: 'proc-recond-dgmp-ref', value: ctrl.dgmpRef || '', placeholder: 'N° / réf. autorisation (si > 2 ans)' })
          ]),
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Autorisation DGMP (PDF)'),
            el('input', { type: 'file', className: 'form-input', id: 'proc-recond-dgmp-doc', accept: '.pdf' }),
            ctrl.dgmpDoc ? el('small', { className: 'text-success' }, `✓ ${ctrl.dgmpDoc}`) : null
          ])
        ])
      ])
    ]);
  }

  // Modif #110 — C-11 vague 2 : Convention / Lettre de commande valant marché.
  // Attribution directe : document chargé dans la pièce d'engagement, attributaire
  // et montant saisis dans le bloc « Attribution ». Pas de formulaire COJO.
  if (mode === 'CONVENTION' || mode === 'LETTRE_COMMANDE_MARCHE') {
    const libelle = mode === 'CONVENTION' ? 'la convention' : 'la lettre de commande valant marché';
    return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '📄 Attribution directe')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { className: 'alert alert-info' }, [
          el('div', { className: 'alert-icon' }, 'ℹ️'),
          el('div', { className: 'alert-content' },
            `Attribution directe : chargez ${libelle} dans le bloc « Pièce d'engagement » ci-dessus, puis renseignez l'attributaire et le montant dans le bloc « Attribution » en bas.`)
        ])
      ])
    ]);
  }

  // PSL, PSO, AOO, PI - Procédures avec COJO/COPE
  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '📋 Détails de la contractualisation')
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
async function handleSave(idOperation, selectedMode, suggestedCodes, soumissionnairesWidget, lotsState, derogationState = {}, options = {}) {
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
      // Modif #96 — champ « demandeur » retiré ; seule la source est conservée.
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
  // Modif #107 — C-4/C-12 : issue « Infructueux » → statut INFRUCTUEUX
  // (la contractualisation peut ne pas aboutir à une attribution).
  if (options.issue === 'INFRUCTUEUX') {
    updateData.etat = 'INFRUCTUEUX';
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
  // Modif #105 — C-7/C-8 : N° dossier d'appel + allotissement (non-PSD).
  procedureData.numeroDossierAppel = document.getElementById('proc-num-dossier')?.value?.trim() || null;
  procedureData.allotissement = document.getElementById('proc-allotissement')?.value || 'UNIQUE';
  // Modif #108 — C-5 : indicateur « contractualisation sans CF » (PSD/PSC).
  procedureData.sansCF = !!document.getElementById('proc-sans-cf')?.checked;
  // Modif #122 — E-19 : réserves du CF (déplacées à la contractualisation).
  if (document.getElementById('cf-a-reserves')) {
    procedureData.reserveCF = {
      aReserves: document.getElementById('cf-a-reserves')?.checked === true,
      typeReserve: document.getElementById('cf-type-reserve')?.value || null,
      commentaire: document.getElementById('cf-commentaire')?.value?.trim() || null
    };
  }
  // Modif #109/#114 — attribution : attributaire SÉLECTIONNÉ (raison sociale +
  // NCC déduit) + montant attribué.
  if (document.getElementById('proc-attr-input')) {
    const montantAttr = document.getElementById('proc-attr-montant')?.value;
    procedureData.attribution = {
      raisonSociale: document.getElementById('proc-attr-input')?.value?.trim() || null,
      ncc: document.getElementById('proc-attr-ncc')?.value?.trim() || null,
      montantAttribue: montantAttr ? Number(montantAttr) : null
    };
  }
  // Modif #111 — C-11 vague 3 / C-9 : sous-procédure PI + liste restreinte.
  const piSub = document.getElementById('proc-pi-subproc')?.value;
  if (piSub) {
    procedureData.sousProcedurePI = piSub;
    if (piSub === 'AMI_CABINET') {
      const lrRows = [...document.querySelectorAll('#liste-restreinte-container .lr-row')];
      procedureData.listeRestreinte = lrRows
        .map(r => ({ raisonSociale: r.querySelector('.lr-rs')?.value?.trim() || '', ncc: r.querySelector('.lr-ncc')?.value?.trim() || '' }))
        .filter(e => e.raisonSociale);
    } else if (existingProc?.listeRestreinte) {
      // DP / AMI CV : on préserve la liste restreinte issue de l'AMI.
      procedureData.listeRestreinte = existingProc.listeRestreinte;
    }
  }
  // Modif #110 — C-11 vague 2 : contrôle reconduction (autorisation DGMP > 2 ans).
  if (document.getElementById('proc-recond-annees')) {
    const annees = document.getElementById('proc-recond-annees')?.value;
    procedureData.reconductionControl = {
      nbAnnees: annees !== '' && annees != null ? Number(annees) : null,
      dgmpRef: document.getElementById('proc-recond-dgmp-ref')?.value?.trim() || null,
      dgmpDoc: document.getElementById('proc-recond-dgmp-doc')?.files?.[0]
        ? 'DGMP_RECOND_' + Date.now() + '.pdf'
        : (existingProc?.reconductionControl?.dgmpDoc || null)
    };
  }
  // Modif #113 — Pièces à joindre (facultatives, multiples) : courrier, mandat,
  // ou document de contrat. Chaque doc est préservé s'il n'est pas ré-uploadé.
  {
    const pjExisting = existingProc?.piecesJointes || {};
    const slotMap = { 'pj-courrier': 'courrierDoc', 'pj-mandat': 'mandatDoc', 'pj-contrat': 'contratDoc' };
    const pj = {};
    let any = false;
    for (const [inputId, key] of Object.entries(slotMap)) {
      const inp = document.getElementById(inputId);
      if (!inp) continue;
      any = true;
      pj[key] = inp.files?.[0] ? key.toUpperCase() + '_' + Date.now() + '.pdf' : (pjExisting[key] || null);
    }
    if (any) procedureData.piecesJointes = pj;
  }

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
    let msg = options.issue === 'INFRUCTUEUX'
      ? '🚫 Contractualisation déclarée INFRUCTUEUSE — le marché passe au statut « Infructueux ».'
      : '✅ Procédure enregistrée' + (isDerogation ? ' (avec dérogation)' : '');
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
