/* ============================================
   ECR01C — Fiche de Vie du Marché (consolidée)
   ============================================

   Vue exhaustive lecture seule selon UC04 du SDF.

   Sommaire :
     1. En-tête sticky (objet, n°, état, montants, dates, actions)
     2. Timeline 5 phases
     3. KPIs de santé du marché
     4. Sélecteur de lot global (« Tous les lots » + chaque lot)
     5. Sommaire par lot (visible quand > 1 lot et vue globale)
     6. Six sections accordéon par phase
        a. Planification (PPM)
        b. Contractualisation
        c. Attribution
        d. Approbation (Visa CF)
        e. Exécution
        f. Clôture
     7. Panneau Documents latéral (groupés par phase)
     8. Section Audit log (placeholder à compléter par NF07)

   Sources de données : dataService.getMpOperationFull(idOperation) →
   { operation, procedure, recours, attribution, echeancier, cleRepartition,
     visasCF, ordresService, avenants, garanties, cloture }

   La fiche est lecture seule. Chaque section a un bouton « Modifier »
   qui redirige vers l'écran de saisie de la phase.
*/

import { el, mount } from '../../../lib/dom.js';
import { money, date as fmtDate } from '../../../lib/format.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { renderStepsAsync } from '../../../ui/widgets/steps-mp.js';
import { renderBudgetLineSummary } from '../../../ui/widgets/budget-line-viewer.js';
import { renderBudgetLineHistory } from '../../../ui/widgets/budget-line-history-mp.js';
import { renderRelatedOperations } from '../../../ui/widgets/related-operations-mp.js';
import { renderDifficultesManager, countDifficultes } from '../../../ui/widgets/difficultes-manager-mp.js';
import { openDocumentUploadModal } from '../../../ui/widgets/document-upload-mp.js';
import { getLotData, getLotsFromProcedure } from '../../../lib/lot-data.js';
import { getPhasesAsync } from '../../../lib/phase-helper-mp.js';
import logger from '../../../lib/logger.js';

// ============================================
// Entrée principale
// ============================================

export async function renderFicheMarche(params) {
  const { idOperation, lotId: paramLotId } = params || {};

  if (!idOperation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'ID marché manquant')
    ]));
    return;
  }

  let fullData;
  try {
    fullData = await dataService.getMpOperationFull(idOperation);
  } catch (err) {
    logger.error('[Fiche Marché] Erreur de chargement', err);
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, `Erreur de chargement : ${err.message}`)
    ]));
    return;
  }

  if (!fullData || !fullData.operation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'Marché / contrat introuvable')
    ]));
    return;
  }

  const { operation, procedure } = fullData;
  const registries = dataService.getAllRegistries();
  const lots = getLotsFromProcedure(procedure);

  // Sélecteur de lot : 'ALL' pour vue globale tous lots ; sinon un lotId précis.
  // Par défaut : vue ALL (le marché global). Si l'URL force lotId, on l'utilise.
  const currentLotId = paramLotId || 'ALL';

  // Charger les steps depuis l'API (timeline)
  const stepsWidget = await renderStepsAsync(fullData, idOperation);

  // Charger en parallèle :
  //  - la ligne budgétaire spécifique (si liée)
  //  - toutes les lignes budgétaires (pour le widget historique multi-financement)
  //  - toutes les opérations PPM (pour le widget historique de la ligne budgétaire — modif #27)
  //  - les difficultés associées au marché (modif #29)
  const [budgetLine, mpBudgetLines, mpOperations, mpDifficultes, mpDocuments, phases] = await Promise.all([
    operation.budgetLineId
      ? dataService.get(ENTITIES.MP_BUDGET_LINE, operation.budgetLineId).catch(() => null)
      : Promise.resolve(null),
    dataService.query(ENTITIES.MP_BUDGET_LINE).catch(() => []),
    dataService.query(ENTITIES.MP_OPERATION).catch(() => []),
    dataService.query(ENTITIES.MP_DIFFICULTE, { operationId }).catch(() => []),
    // Modif #31 : tous les documents MP_DOCUMENT rattachés au marché (uploads libres + uploads
    // déjà créés par les autres écrans de saisie via uploadDocument)
    dataService.query(ENTITIES.MP_DOCUMENT, { operationId }).catch(() => []),
    // Modif #32 : phases pour reconstruire la rangée de boutons « processus d'exécution »
    getPhasesAsync(operation.modePassation || 'PSD').catch(() => [])
  ]);

  const page = el('div', { className: 'page fiche-marche-page', style: { paddingBottom: '60px' } }, [
    renderHeaderSticky(operation, registries, fullData, currentLotId, lots, idOperation),
    stepsWidget,
    // Modif #32 : rangée de boutons de navigation par phase pour permettre le suivi
    // du processus d'exécution cohérent (comportement de l'ancienne fiche).
    renderPhaseNavButtons(phases, operation, idOperation, currentLotId),
    // Modif #28 : bandeau visuel des opérations liées (étude antérieure / contrôle postérieur)
    renderRelatedOperations({
      operation,
      allOperations: mpOperations,
      registries,
      onSaved: async () => {
        // Recharger la fiche après modification d'un lien
        await renderFicheMarche(params);
      }
    }),
    renderHealthKPIs(fullData, currentLotId, mpDifficultes),
    // Modif #29 : section difficultés du marché — visible en haut, structurée, exploitable
    renderDifficultesSection(idOperation, mpDifficultes, registries),
    lots.length > 1 ? renderLotSelectorAndSummary(lots, currentLotId, fullData, registries, idOperation) : null,
    el('div', {
      className: 'fiche-grid',
      style: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 320px',
        gap: '20px',
        marginTop: '20px'
      }
    }, [
      el('div', { className: 'fiche-main', style: { minWidth: 0 } }, [
        sectionAccordion('planification', '📝 1. Planification (PPM)', renderPlanifContent(operation, budgetLine, registries, mpBudgetLines, mpOperations), {
          modifierRoute: '/mp/ppm-list',
          modifierParams: {},
          defaultOpen: true,
          status: 'complete'
        }),
        sectionAccordion('contractualisation', '📑 2. Contractualisation', renderContractualisationContent(procedure, currentLotId, lots, registries), {
          modifierRoute: '/mp/procedure',
          modifierParams: { idOperation },
          defaultOpen: false,
          status: procedure ? 'complete' : 'empty'
        }),
        sectionAccordion('attribution', '🤝 3. Attribution', renderAttributionContent(fullData, currentLotId, registries), {
          modifierRoute: '/mp/attribution',
          modifierParams: { idOperation, lotId: currentLotId !== 'ALL' ? currentLotId : undefined },
          defaultOpen: false,
          status: fullData.attribution ? 'complete' : 'empty'
        }),
        sectionAccordion('approbation', '✅ 4. Approbation (Visa CF)', renderApprobationContent(fullData, currentLotId, registries), {
          modifierRoute: '/mp/visa-cf',
          modifierParams: { idOperation, lotId: currentLotId !== 'ALL' ? currentLotId : undefined },
          defaultOpen: false,
          status: (fullData.visasCF || []).length > 0 ? 'complete' : 'empty'
        }),
        sectionAccordion('execution', '⚙️ 5. Exécution', renderExecutionContent(fullData, currentLotId, registries), {
          modifierRoute: '/mp/execution',
          modifierParams: { idOperation, lotId: currentLotId !== 'ALL' ? currentLotId : undefined },
          defaultOpen: false,
          status: (fullData.ordresService || []).length > 0 ? 'complete' : 'partial'
        }),
        sectionAccordion('cloture', '🏁 6. Clôture', renderClotureContent(fullData, currentLotId, registries), {
          modifierRoute: '/mp/cloture',
          modifierParams: { idOperation, lotId: currentLotId !== 'ALL' ? currentLotId : undefined },
          defaultOpen: false,
          status: fullData.cloture ? 'complete' : 'empty'
        })
      ]),
      el('div', { className: 'fiche-side', style: { minWidth: 0 } }, [
        renderDocumentsPanel(fullData, currentLotId, registries, mpDocuments, idOperation, params)
      ])
    ]),
    renderAuditLogPlaceholder()
  ]);

  mount('#app', page);

  // Style responsive : passer en colonne unique sous 1024px
  injectResponsiveStyle();
}

// ============================================
// En-tête sticky
// ============================================

function renderHeaderSticky(operation, registries, fullData, currentLotId, lots, idOperation) {
  const etat = registries.ETAT_MARCHE?.find(e => e.code === operation.etat);
  const modePassation = registries.MODE_PASSATION?.find(m => m.code === operation.modePassation);
  const typeMarche = registries.TYPE_MARCHE?.find(t => t.code === operation.typeMarche);

  const attribution = fullData.attribution;
  const montantHT = Number(attribution?.montants?.ht) || 0;
  const montantTTC = Number(attribution?.montants?.ttc) || Number(operation.montantPrevisionnel) || 0;

  const ordresService = fullData.ordresService || [];
  const osDemarrage = ordresService.find(os => os.type === 'DEMARRAGE') || ordresService[0];

  const cloture = fullData.cloture;

  return el('div', {
    className: 'fiche-header-sticky',
    style: {
      position: 'sticky',
      top: '0',
      zIndex: '50',
      background: '#fff',
      borderBottom: '2px solid #e5e7eb',
      marginBottom: '20px',
      padding: '16px 0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }
  }, [
    el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' } }, [
      // Bloc gauche : identité
      el('div', { style: { flex: '1 1 60%', minWidth: '300px' } }, [
        el('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' } }, [
          el('button', {
            className: 'btn btn-secondary btn-sm',
            onclick: () => router.navigate('/mp/ppm-list')
          }, '← Liste PPM'),
          el('span', {
            className: `badge badge-${etat?.color || 'gray'}`,
            style: { fontSize: '13px', padding: '4px 12px' }
          }, etat?.label || operation.etat),
          operation.procDerogation?.isDerogation ? el('span', {
            className: 'badge badge-warning',
            style: { fontSize: '12px' }
          }, '⚠️ Dérogation') : null,
          lots.length > 1 ? el('span', {
            className: 'badge badge-info',
            style: { fontSize: '12px' }
          }, `${lots.length} lots`) : null
        ]),
        el('h1', { style: { margin: '4px 0', fontSize: '22px', lineHeight: '1.3' } }, operation.objet || '(sans objet)'),
        el('div', { style: { fontSize: '13px', color: '#6b7280', marginTop: '4px' } }, [
          el('span', { style: { fontWeight: '600' } }, `${operation.id}`),
          ' · ',
          typeMarche?.label || operation.typeMarche || '-',
          ' · ',
          modePassation?.label || operation.modePassation || '-'
        ])
      ]),

      // Bloc droite : montants + dates + actions
      el('div', { style: { flex: '1 1 35%', minWidth: '280px', textAlign: 'right' } }, [
        el('div', { style: { fontSize: '13px', color: '#6b7280' } }, 'Montant du marché de base'),
        el('div', { style: { fontSize: '18px', fontWeight: 'bold', color: '#0f5132' } }, [
          `${money(montantHT)} HT`,
          el('span', { style: { fontSize: '13px', color: '#6b7280', marginLeft: '8px' } }, `· ${money(montantTTC)} TTC`)
        ]),
        el('div', { style: { fontSize: '12px', color: '#6b7280', marginTop: '6px' } }, [
          osDemarrage ? `📅 OS ${fmtDate(osDemarrage.dateSignature || osDemarrage.dateEmission)}` : '📅 OS non émis',
          ' · ',
          cloture?.dateClotureEffective
            ? `🏁 Clôturé ${fmtDate(cloture.dateClotureEffective)}`
            : (operation.dureePrevisionnelle ? `Durée prév. ${operation.dureePrevisionnelle} j` : '')
        ]),
        el('div', { style: { display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '10px', flexWrap: 'wrap' } }, [
          el('button', {
            className: 'btn btn-sm btn-secondary',
            title: 'Exporter en PDF (à venir)',
            onclick: () => alert('📄 Export PDF — à implémenter (sous-modif #G)')
          }, '⤓ PDF'),
          el('button', {
            className: 'btn btn-sm btn-secondary',
            title: 'Exporter en Excel (à venir)',
            onclick: () => alert('📊 Export Excel — à implémenter (sous-modif #H)')
          }, '⤓ Excel'),
          el('button', {
            className: 'btn btn-sm btn-secondary',
            title: 'Imprimer',
            onclick: () => window.print()
          }, '🖨'),
          el('button', {
            className: 'btn btn-sm btn-primary',
            title: 'Aller à la phase courante',
            onclick: () => navigateToCurrentPhase(operation, idOperation)
          }, '✏️ Modifier')
        ])
      ])
    ])
  ]);
}

function navigateToCurrentPhase(operation, idOperation) {
  const etat = operation.etat;
  // Mapping état → route de saisie de la phase courante
  if (etat === 'PLANIFIE') return router.navigate('/mp/ppm-list');
  if (etat === 'EN_PROC') return router.navigate('/mp/procedure', { idOperation });
  if (etat === 'ATTRIBUE') return router.navigate('/mp/attribution', { idOperation });
  if (etat === 'VISE') return router.navigate('/mp/visa-cf', { idOperation });
  if (etat === 'EXECUTION') return router.navigate('/mp/execution', { idOperation });
  if (etat === 'RESILIE' || etat === 'CLOS') return router.navigate('/mp/cloture', { idOperation });
  router.navigate('/mp/procedure', { idOperation });
}

// ============================================
// Boutons de navigation par phase (modif #32)
// ============================================

const PHASE_ROUTES = {
  PLANIF: null, // on reste sur la fiche
  PROCEDURE: '/mp/procedure',
  ATTRIBUTION: '/mp/attribution',
  VISA_CF: '/mp/visa-cf',
  EXECUTION: '/mp/execution',
  AVENANTS: '/mp/avenants',
  CLOTURE: '/mp/cloture'
};

function renderPhaseNavButtons(phases, operation, idOperation, currentLotId) {
  if (!Array.isArray(phases) || phases.length === 0) return el('div');

  const navParams = currentLotId && currentLotId !== 'ALL'
    ? { idOperation, lotId: currentLotId }
    : { idOperation };

  const buttons = phases.map(phase => {
    const route = PHASE_ROUTES[phase.code];
    if (!route) {
      // Phase courante (Identité / Planif) — bouton actif sans navigation
      return el('button', {
        type: 'button',
        className: 'btn btn-sm btn-primary',
        title: `Vous êtes sur ${phase.titre || phase.code}`
      }, `${phase.icon || ''} ${phase.titre || phase.code}`);
    }
    return el('button', {
      type: 'button',
      className: 'btn btn-sm btn-secondary',
      title: `Aller à ${phase.titre || phase.code}`,
      onclick: () => router.navigate(route, navParams)
    }, `${phase.icon || ''} ${phase.titre || phase.code}`);
  });

  return el('div', {
    className: 'card',
    style: { marginBottom: '20px' }
  }, [
    el('div', {
      className: 'card-body',
      style: { padding: '12px 16px' }
    }, [
      el('div', { style: { fontSize: '11px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' } },
        'Suivi du processus — cliquez sur une phase pour ouvrir l\'écran de saisie'),
      el('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } }, buttons)
    ])
  ]);
}

// ============================================
// KPIs santé du marché
// ============================================

function renderHealthKPIs(fullData, currentLotId, mpDifficultes = []) {
  const { operation, avenants = [], garanties = [], echeancier, ordresService = [] } = fullData;
  const montantInitial = operation.montantPrevisionnel || 0;

  // Filtrer avenants au lot courant si applicable
  const avenantsLot = currentLotId === 'ALL'
    ? avenants
    : avenants.filter(av => !av.lotId || av.lotId === currentLotId);

  // KPI 1 : Cumul avenants vs seuil 30%
  const totalAvenants = avenantsLot.reduce((sum, av) => sum + (av.variationMontant || 0), 0);
  const cumulPct = montantInitial > 0 ? (totalAvenants / montantInitial) * 100 : 0;
  const cumulColor = cumulPct >= 30 ? '#dc2626' : (cumulPct >= 25 ? '#f59e0b' : '#16a34a');

  // KPI 2 : Avancement échéancier
  // On utilise echeancier.items[].pourcentage somme — c'est ce qui a été planifié,
  // pas encore le "versé". À défaut d'un suivi de paiements réel, on affiche le % planifié.
  const items = (echeancier?.items || []);
  const echeancierPct = items.length > 0 ? items.reduce((s, it) => s + (it.pourcentage || 0), 0) : 0;
  const echeancierColor = Math.abs(echeancierPct - 100) < 0.5 ? '#16a34a' : '#0066cc';

  // KPI 3 : Garanties
  const garantiesLot = currentLotId === 'ALL'
    ? garanties
    : garanties.filter(g => !g.lotId || g.lotId === currentLotId);
  const garActives = garantiesLot.filter(g => g.etat === 'ACTIVE').length;
  const garExpirees = garantiesLot.filter(g => g.etat === 'EXPIREE').length;
  const garColor = garExpirees > 0 ? '#dc2626' : '#16a34a';

  // KPI 4 : OS / état d'avancement
  const osCount = ordresService.length;
  const osColor = osCount > 0 ? '#0f5132' : '#6b7280';

  // KPI 5 : Difficultés du marché (modif #29) — couleur selon impact des difficultés en cours
  const difCount = countDifficultes(mpDifficultes);
  const difColor = difCount.critiques > 0 ? '#dc2626'
    : (difCount.eleves > 0 ? '#ea580c'
    : (difCount.enCours > 0 ? '#f59e0b' : '#16a34a'));
  const difSub = difCount.critiques > 0
    ? `⚠ ${difCount.critiques} critique${difCount.critiques > 1 ? 's' : ''}`
    : (difCount.eleves > 0
        ? `⚠ ${difCount.eleves} impact élevé`
        : (difCount.enCours > 0
            ? `${difCount.enCours} en cours · ${difCount.resolus} résolue${difCount.resolus > 1 ? 's' : ''}`
            : 'Aucune difficulté'));

  return el('div', {
    className: 'fiche-kpis',
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '12px',
      marginBottom: '20px'
    }
  }, [
    renderKpiCard(
      'Cumul avenants',
      `${cumulPct.toFixed(1)}%`,
      `${money(totalAvenants)} sur ${money(montantInitial)} · seuil 30%`,
      cumulColor
    ),
    renderKpiCard(
      'Échéancier planifié',
      `${echeancierPct.toFixed(1)}%`,
      `${items.length} échéance${items.length > 1 ? 's' : ''}`,
      echeancierColor
    ),
    renderKpiCard(
      'Garanties',
      `${garActives} actives`,
      garExpirees > 0 ? `⚠ ${garExpirees} expirée${garExpirees > 1 ? 's' : ''}` : `0 expirée`,
      garColor
    ),
    renderKpiCard(
      'Ordres de service',
      `${osCount}`,
      osCount > 0 ? 'Exécution démarrée' : 'Aucun OS émis',
      osColor
    ),
    renderKpiCard(
      'Difficultés',
      `${difCount.enCours} en cours`,
      difSub,
      difColor
    )
  ]);
}

/**
 * Section dédiée aux difficultés du marché — modif #29.
 * Visible en haut de la fiche pour priorisation, structurée pour suivi
 * et exploitable (filtres, ajout, édition, suppression).
 */
function renderDifficultesSection(idOperation, mpDifficultes, registries) {
  return el('div', {
    className: 'card',
    style: { marginBottom: '20px' }
  }, [
    el('div', {
      className: 'card-header',
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
    }, [
      el('h3', { className: 'card-title', style: { margin: 0 } }, '🚨 Difficultés du marché'),
      el('span', { style: { fontSize: '11px', color: '#6b7280' } },
        'Saisie possible à tout moment du cycle de vie')
    ]),
    el('div', { className: 'card-body' }, [
      renderDifficultesManager({
        operationId: idOperation,
        difficultes: mpDifficultes,
        registries
        // onSaved : pas de reload complet — le widget gère son state interne
      })
    ])
  ]);
}

function renderKpiCard(label, value, sub, color) {
  return el('div', {
    className: 'card',
    style: {
      padding: '14px 16px',
      borderLeft: `4px solid ${color}`,
      background: '#fff',
      borderRadius: '6px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }
  }, [
    el('div', { style: { fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px' } }, label),
    el('div', { style: { fontSize: '22px', fontWeight: 'bold', color, margin: '4px 0' } }, value),
    el('div', { style: { fontSize: '11px', color: '#6b7280' } }, sub)
  ]);
}

// ============================================
// Sélecteur de lot global + sommaire par lot
// ============================================

function renderLotSelectorAndSummary(lots, currentLotId, fullData, registries, idOperation) {
  const { attribution, avenants = [], garanties = [], ordresService = [] } = fullData;

  // Compute summary per lot
  const lotsRows = lots.map(lot => {
    const lotId = lot.id;
    const attribLot = getLotData(attribution, lotId);
    const attributaire = attribLot?.attributaire;
    const montantTTC = Number(attribLot?.montants?.ttc) || 0;
    const avenantsLot = avenants.filter(av => av.lotId === lotId);
    const totalAvenants = avenantsLot.reduce((s, a) => s + (a.variationMontant || 0), 0);
    const cumulPct = montantTTC > 0 ? (totalAvenants / montantTTC) * 100 : 0;
    const garLot = garanties.filter(g => g.lotId === lotId);
    const osLot = ordresService.filter(os => os.lotId === lotId);

    let etatLot = 'En procédure';
    if (osLot.length > 0) etatLot = 'En exécution';
    if (attribLot?.id) etatLot = osLot.length > 0 ? 'En exécution' : 'Attribué';

    return { lot, attributaire, montantTTC, totalAvenants, cumulPct, garLot, osLot, etatLot };
  });

  return el('div', { className: 'card', style: { marginBottom: '20px' } }, [
    el('div', { className: 'card-header', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
      el('h3', { className: 'card-title', style: { margin: 0 } }, `📦 Lots du marché (${lots.length})`),
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
        el('label', { style: { fontSize: '12px', color: '#6b7280' } }, 'Vue :'),
        el('select', {
          className: 'form-input',
          style: { width: '220px', padding: '6px 8px' },
          value: currentLotId,
          onchange: (e) => router.navigate('/mp/fiche-marche', { idOperation, lotId: e.target.value })
        }, [
          el('option', { value: 'ALL', selected: currentLotId === 'ALL' }, '📊 Marché global (tous lots)'),
          ...lots.map(l => el('option', {
            value: l.id,
            selected: currentLotId === l.id
          }, `Lot ${l.numero || l.id} — ${l.libelle || 'Sans libellé'}`))
        ])
      ])
    ]),
    el('div', { className: 'card-body', style: { padding: '0' } }, [
      el('table', { className: 'table', style: { width: '100%', margin: 0 } }, [
        el('thead', {}, [
          el('tr', {}, [
            el('th', {}, 'Lot'),
            el('th', {}, 'Libellé'),
            el('th', {}, 'Attributaire'),
            el('th', { style: { textAlign: 'right' } }, 'Montant TTC'),
            el('th', { style: { textAlign: 'right' } }, 'Cumul av.'),
            el('th', { style: { textAlign: 'center' } }, 'Garanties'),
            el('th', {}, 'État'),
            el('th', { style: { textAlign: 'center' } }, 'Action')
          ])
        ]),
        el('tbody', {}, lotsRows.map(row => el('tr', {
          style: { background: currentLotId === row.lot.id ? '#f0f9ff' : 'transparent' }
        }, [
          el('td', { style: { fontWeight: 600 } }, row.lot.numero || row.lot.id),
          el('td', { style: { fontSize: '13px' } }, row.lot.libelle || '-'),
          el('td', { style: { fontSize: '13px' } }, row.attributaire?.raisonSociale || '-'),
          el('td', { style: { textAlign: 'right', fontWeight: 500 } }, row.montantTTC > 0 ? money(row.montantTTC) : '-'),
          el('td', {
            style: { textAlign: 'right', color: row.cumulPct >= 30 ? '#dc2626' : (row.cumulPct >= 25 ? '#f59e0b' : '#374151') }
          }, `${row.cumulPct.toFixed(1)}%`),
          el('td', { style: { textAlign: 'center', fontSize: '13px' } }, `${row.garLot.length}`),
          el('td', { style: { fontSize: '12px' } }, row.etatLot),
          el('td', { style: { textAlign: 'center' } }, [
            el('button', {
              className: 'btn btn-sm btn-secondary',
              onclick: () => router.navigate('/mp/fiche-marche', { idOperation, lotId: row.lot.id })
            }, 'Voir')
          ])
        ])))
      ])
    ])
  ]);
}

// ============================================
// Composant générique : section accordéon
// ============================================

function sectionAccordion(id, title, content, opts = {}) {
  const { modifierRoute, modifierParams = {}, defaultOpen = false, status = 'complete' } = opts;
  const storageKey = `sidcf:fiche:accordion:${id}`;
  const stored = localStorage.getItem(storageKey);
  const isOpen = stored !== null ? stored === '1' : defaultOpen;

  const statusBadge = {
    'complete': { label: 'Complet', color: '#16a34a' },
    'partial': { label: 'Partiel', color: '#f59e0b' },
    'empty': { label: 'Vide', color: '#9ca3af' }
  }[status] || { label: '-', color: '#9ca3af' };

  const body = el('div', {
    style: {
      display: isOpen ? 'block' : 'none',
      padding: '16px',
      borderTop: '1px solid #e5e7eb'
    }
  }, [content]);

  const arrow = el('span', { style: { display: 'inline-block', transition: 'transform 0.15s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0)' } }, '▸');

  const header = el('div', {
    style: {
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
      userSelect: 'none',
      background: '#f9fafb'
    },
    onclick: (e) => {
      // Ignorer les clics sur le bouton Modifier
      if (e.target.closest('button[data-modifier]')) return;
      const visible = body.style.display !== 'none';
      body.style.display = visible ? 'none' : 'block';
      arrow.style.transform = visible ? 'rotate(0)' : 'rotate(90deg)';
      localStorage.setItem(storageKey, visible ? '0' : '1');
    }
  }, [
    el('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } }, [
      arrow,
      el('span', { style: { fontWeight: 600, fontSize: '15px' } }, title),
      el('span', {
        style: {
          fontSize: '11px',
          padding: '2px 8px',
          borderRadius: '10px',
          background: statusBadge.color + '22',
          color: statusBadge.color,
          fontWeight: 600
        }
      }, statusBadge.label)
    ]),
    modifierRoute ? el('button', {
      className: 'btn btn-sm btn-secondary',
      'data-modifier': '1',
      onclick: (e) => { e.stopPropagation(); router.navigate(modifierRoute, modifierParams); }
    }, '✏️ Modifier') : null
  ]);

  return el('div', {
    className: 'card',
    style: { marginBottom: '12px', overflow: 'hidden' }
  }, [header, body]);
}

// ============================================
// Section 1 — Planification
// ============================================

function renderPlanifContent(operation, budgetLine, registries, mpBudgetLines = [], mpOperations = []) {
  const typeMarche = registries.TYPE_MARCHE?.find(t => t.code === operation.typeMarche);
  const modePassation = registries.MODE_PASSATION?.find(m => m.code === operation.modePassation);

  return el('div', {}, [
    renderInfoGrid([
      { label: 'Objet', value: operation.objet, fullWidth: true },
      { label: 'Type de marché', value: typeMarche?.label || operation.typeMarche },
      { label: 'Mode de passation', value: modePassation?.label || operation.modePassation },
      { label: 'Montant prévisionnel', value: money(operation.montantPrevisionnel) },
      { label: 'Devise', value: operation.devise || 'XOF' },
      { label: 'Exercice', value: operation.exercice || '-' },
      { label: 'Durée prévisionnelle', value: operation.dureePrevisionnelle ? `${operation.dureePrevisionnelle} jours` : '-' },
      { label: 'Date début exec. prév.', value: fmtDate(operation.dateDebutPrev) },
      { label: 'Date fin prév.', value: fmtDate(operation.dateFinPrev) },
      { label: 'Bénéficiaire', value: operation.beneficiaire || '-' }
    ]),
    el('h4', { style: { margin: '20px 0 10px', fontSize: '14px', fontWeight: 600 } }, 'Chaîne budgétaire'),
    budgetLine
      ? renderBudgetLineSummary(budgetLine)
      : renderInfoGrid([
          { label: 'Section', value: operation.chaineBudgetaire?.section || '-' },
          { label: 'Programme', value: operation.chaineBudgetaire?.programme || '-' },
          { label: 'Activité', value: operation.chaineBudgetaire?.activite || '-' },
          { label: 'Nature économique', value: operation.chaineBudgetaire?.nature || '-' },
          { label: 'Bailleur', value: operation.chaineBudgetaire?.bailleur || '-' }
        ]),

    // Modif #27 : panneau d'utilisation de la ligne budgétaire avec liste des
    // autres opérations PPM rattachées (par combinaison activité × type × bailleur).
    renderBudgetLineHistorySection(operation, registries, mpBudgetLines, mpOperations),

    el('h4', { style: { margin: '20px 0 10px', fontSize: '14px', fontWeight: 600 } },
      `📦 Livrables prévisionnels (${(operation.livrables || []).length})`),
    renderLivrablesTable(operation.livrables || [], registries)
  ]);
}

/**
 * Rend une ou plusieurs cartes d'historique de ligne budgétaire selon les
 * financements de l'opération courante. Pour chaque combinaison
 * (activité × type × bailleur), on affiche le widget historique enrichi.
 * L'opération courante est exclue du tableau pour ne pas se répéter, mais
 * elle est implicitement comptée via currentMontant pour rester cohérent
 * avec le formulaire de saisie.
 */
function renderBudgetLineHistorySection(operation, registries, mpBudgetLines, mpOperations) {
  const activiteCode = operation?.chaineBudgetaire?.activiteCode || '';
  if (!activiteCode) return el('div');

  // Reconstituer la liste des combinaisons (financement) pertinentes pour cette opération.
  const financements = Array.isArray(operation?.chaineBudgetaire?.financements) && operation.chaineBudgetaire.financements.length > 0
    ? operation.chaineBudgetaire.financements
    : (operation.typeFinancement && operation.sourceFinancement
        ? [{
            typeFinancement: operation.typeFinancement,
            bailleur: operation.sourceFinancement,
            montant: operation.montantPrevisionnel || 0
          }]
        : []);

  if (financements.length === 0) return el('div');

  const wrap = el('div', { style: { marginTop: '16px' } }, [
    el('h4', { style: { margin: '0 0 10px', fontSize: '14px', fontWeight: 600 } },
      `🧮 Utilisation de la ligne budgétaire (${financements.length} financement${financements.length > 1 ? 's' : ''})`)
  ]);

  financements.forEach((fin, idx) => {
    const typeFin = fin.typeFinancement || '';
    const bailleur = fin.bailleur || '';
    const montant = Number(fin.montant) || 0;
    if (!typeFin || !bailleur) return;

    const typeLabel = registries.TYPE_FINANCEMENT?.find(t => t.code === typeFin)?.label || typeFin;
    const bailleurLabel = registries.BAILLEUR?.find(b => b.code === bailleur)?.label || bailleur;

    wrap.appendChild(el('div', {
      style: { fontSize: '12px', color: '#374151', marginTop: idx === 0 ? '4px' : '12px', marginBottom: '4px' }
    }, [
      el('strong', {}, `Financement ${idx + 1} : `),
      `${typeLabel} · ${bailleurLabel} · ${new Intl.NumberFormat('fr-FR').format(montant)} XOF`
    ]));

    wrap.appendChild(renderBudgetLineHistory({
      activiteCode,
      typeFin,
      bailleur,
      mpBudgetLines,
      mpOperations,
      currentMontant: montant,
      excludeOperationId: operation.id, // l'opération courante est exclue du tableau (déjà affichée)
      registries,
      onNavigate: (op) => {
        if (op?.id) router.navigate('/mp/fiche-marche', { idOperation: op.id });
      }
    }));
  });

  return wrap;
}

function renderLivrablesTable(livrables, registries) {
  if (!livrables || livrables.length === 0) {
    return el('p', { className: 'text-muted', style: { fontStyle: 'italic' } }, 'Aucun livrable défini');
  }
  return el('table', { className: 'table', style: { width: '100%', fontSize: '13px' } }, [
    el('thead', {}, [el('tr', {}, [
      el('th', {}, 'Type'),
      el('th', {}, 'Libellé'),
      el('th', { style: { textAlign: 'right' } }, 'Qté'),
      el('th', {}, 'Localisation')
    ])]),
    el('tbody', {}, livrables.map(liv => {
      const typeLabel = registries.TYPE_LIVRABLE?.find(t => t.code === liv.type)?.label || liv.type;
      const loc = [liv.localisation?.region, liv.localisation?.commune, liv.localisation?.sousPrefecture, liv.localisation?.localite]
        .filter(Boolean).join(' › ') || '-';
      return el('tr', {}, [
        el('td', {}, el('span', { className: 'badge badge-info' }, typeLabel)),
        el('td', {}, liv.libelle || '-'),
        el('td', { style: { textAlign: 'right' } }, String(liv.quantite ?? 1)),
        el('td', { className: 'text-small text-muted' }, `📍 ${loc}`)
      ]);
    }))
  ]);
}

// ============================================
// Section 2 — Contractualisation
// ============================================

function renderContractualisationContent(procedure, currentLotId, lots, registries) {
  if (!procedure) {
    return el('p', { className: 'text-muted', style: { fontStyle: 'italic' } }, 'Phase de contractualisation non encore renseignée.');
  }

  const modePassation = registries.MODE_PASSATION?.find(m => m.code === procedure.modePassation);
  const typeDossier = registries.TYPE_DOSSIER_APPEL?.find(t => t.code === procedure.typeDossierAppel);
  const typeCommission = registries.TYPE_COMMISSION?.find(t => t.code === procedure.typeCommission);

  // Filtrer les lots affichés selon currentLotId
  const lotsFiltered = currentLotId === 'ALL' ? lots : lots.filter(l => l.id === currentLotId);

  return el('div', {}, [
    renderInfoGrid([
      { label: 'Mode de passation', value: modePassation?.label || procedure.modePassation },
      { label: 'Type de dossier', value: typeDossier?.label || procedure.typeDossierAppel || '-' },
      { label: 'Commission', value: typeCommission?.label || procedure.typeCommission || '-' },
      { label: 'Catégorie', value: procedure.categorieProcedure || '-' }
    ]),
    procedure.observations ? el('div', { style: { marginTop: '12px', padding: '10px', background: '#f9fafb', borderRadius: '4px', fontSize: '13px' } }, [
      el('strong', {}, 'Observations : '), procedure.observations
    ]) : null,
    el('h4', { style: { margin: '20px 0 10px', fontSize: '14px', fontWeight: 600 } },
      `📦 ${lotsFiltered.length} lot${lotsFiltered.length > 1 ? 's' : ''}`),
    ...lotsFiltered.map(lot => renderLotDetails(lot))
  ]);
}

function renderLotDetails(lot) {
  return el('div', {
    className: 'card',
    style: { marginBottom: '10px', border: '1px solid #e5e7eb', padding: '12px' }
  }, [
    el('div', { style: { fontWeight: 600, marginBottom: '8px' } },
      `Lot ${lot.numero || lot.id} — ${lot.libelle || '(sans libellé)'}`
    ),
    renderInfoGrid([
      { label: 'Offres reçues', value: lot.nbOffresRecues ?? '-' },
      { label: 'Offres classées', value: lot.nbOffresClassees ?? '-' },
      { label: 'Date ouverture', value: fmtDate(lot.dates?.ouverture) },
      { label: 'Date jugement', value: fmtDate(lot.dates?.jugement) },
      { label: 'Date analyse tech.', value: fmtDate(lot.dates?.analyseTechnique) },
      { label: 'Date analyse fin.', value: fmtDate(lot.dates?.analyseFinanciere) }
    ]),
    // Soumissionnaires si dispo
    Array.isArray(lot.soumissionnaires) && lot.soumissionnaires.length > 0
      ? el('div', { style: { marginTop: '10px' } }, [
          el('div', { style: { fontSize: '12px', color: '#6b7280', marginBottom: '4px' } }, `Soumissionnaires (${lot.soumissionnaires.length})`),
          el('table', { className: 'table', style: { width: '100%', fontSize: '12px', margin: 0 } }, [
            el('thead', {}, [el('tr', {}, [
              el('th', {}, 'Raison sociale'),
              el('th', {}, 'NCC'),
              el('th', {}, 'Nature')
            ])]),
            el('tbody', {}, lot.soumissionnaires.map(s => el('tr', {}, [
              el('td', {}, s.raisonSociale || '-'),
              el('td', {}, s.ncc || '-'),
              el('td', {}, s.nature || '-')
            ])))
          ])
        ])
      : null
  ]);
}

// ============================================
// Section 3 — Attribution
// ============================================

function renderAttributionContent(fullData, currentLotId, registries) {
  const { attribution, echeancier, cleRepartition } = fullData;
  if (!attribution) {
    return el('p', { className: 'text-muted', style: { fontStyle: 'italic' } }, 'Phase d\'attribution non encore renseignée.');
  }

  const attribLot = currentLotId === 'ALL' ? attribution : getLotData(attribution, currentLotId);
  const attributaire = attribLot?.attributaire || attribution.attributaire || {};
  const montants = attribLot?.montants || attribution.montants || {};
  const garanties = attribLot?.garanties || attribution.garanties || {};

  const echeancierLot = currentLotId === 'ALL' ? echeancier : getLotData(echeancier, currentLotId);
  const cleLot = currentLotId === 'ALL' ? cleRepartition : getLotData(cleRepartition, currentLotId);

  return el('div', {}, [
    el('h4', { style: { margin: '0 0 10px', fontSize: '14px', fontWeight: 600 } }, '🏢 Attributaire'),
    renderInfoGrid([
      { label: 'Raison sociale', value: attributaire.raisonSociale || '-' },
      { label: 'NCC', value: attributaire.ncc || '-' },
      { label: 'Adresse', value: attributaire.adresse || '-' },
      { label: 'Téléphone', value: attributaire.telephone || '-' },
      { label: 'Email', value: attributaire.email || '-' },
      { label: 'Nature', value: attributaire.natureGroupement || 'Entreprise simple' }
    ]),

    el('h4', { style: { margin: '20px 0 10px', fontSize: '14px', fontWeight: 600 } }, '💰 Montants attribués'),
    renderInfoGrid([
      { label: 'Montant HT', value: money(montants.ht) },
      { label: 'Montant TTC', value: money(montants.ttc) }
    ]),

    el('h4', { style: { margin: '20px 0 10px', fontSize: '14px', fontWeight: 600 } }, '🛡 Garanties contractuelles'),
    renderGarantiesAttribution(garanties),

    echeancierLot && (echeancierLot.items || []).length > 0
      ? el('div', {}, [
          el('h4', { style: { margin: '20px 0 10px', fontSize: '14px', fontWeight: 600 } },
            `📅 Échéancier (${(echeancierLot.items || []).length} échéances)`),
          renderEcheancierTable(echeancierLot.items || [])
        ])
      : null,

    cleLot && (cleLot.lignes || []).length > 0
      ? el('div', {}, [
          el('h4', { style: { margin: '20px 0 10px', fontSize: '14px', fontWeight: 600 } },
            `📊 Clé de répartition multi-bailleurs (${cleLot.lignes.length} lignes)`),
          renderCleRepartitionTable(cleLot.lignes, registries)
        ])
      : null,

    attribution.decisionCF?.aReserves
      ? el('div', {
          className: 'alert alert-warning',
          style: { marginTop: '16px' }
        }, [
          el('strong', {}, '⚠️ Réserves du CF : '),
          attribution.decisionCF.commentaire || attribution.decisionCF.motifReserve || '(non précisées)'
        ])
      : null
  ]);
}

function renderGarantiesAttribution(garanties) {
  const items = [
    { code: 'avance', label: "Garantie d'avance", data: garanties.garantieAvance },
    { code: 'be', label: 'Garantie de bonne exécution', data: garanties.garantieBonneExec },
    { code: 'caut', label: 'Cautionnement', data: garanties.cautionnement }
  ].filter(g => g.data && g.data.existe);

  if (items.length === 0) {
    return el('p', { className: 'text-muted', style: { fontStyle: 'italic', fontSize: '13px' } }, 'Aucune garantie contractuelle déclarée');
  }
  return el('table', { className: 'table', style: { width: '100%', fontSize: '13px' } }, [
    el('thead', {}, [el('tr', {}, [
      el('th', {}, 'Garantie'),
      el('th', {}, 'Base'),
      el('th', { style: { textAlign: 'right' } }, 'Montant'),
      el('th', {}, 'Émission'),
      el('th', {}, 'Échéance')
    ])]),
    el('tbody', {}, items.map(g => el('tr', {}, [
      el('td', { style: { fontWeight: 500 } }, g.label),
      el('td', {}, g.data.baseCalc || 'HT'),
      el('td', { style: { textAlign: 'right' } }, money(g.data.montant)),
      el('td', {}, fmtDate(g.data.dateEmission)),
      el('td', {}, fmtDate(g.data.dateEcheance))
    ])))
  ]);
}

function renderEcheancierTable(items) {
  return el('table', { className: 'table', style: { width: '100%', fontSize: '13px' } }, [
    el('thead', {}, [el('tr', {}, [
      el('th', {}, 'N°'),
      el('th', {}, 'Date prév.'),
      el('th', {}, 'Type'),
      el('th', {}, 'Base'),
      el('th', { style: { textAlign: 'right' } }, 'Montant'),
      el('th', { style: { textAlign: 'right' } }, '%')
    ])]),
    el('tbody', {}, items.map(it => el('tr', {}, [
      el('td', { style: { fontWeight: 600 } }, `#${it.num}`),
      el('td', {}, fmtDate(it.datePrevisionnelle)),
      el('td', {}, it.typeEcheance || '-'),
      el('td', {}, it.baseCalc || 'TTC'),
      el('td', { style: { textAlign: 'right' } }, money(it.montant)),
      el('td', { style: { textAlign: 'right' } }, `${(it.pourcentage || 0).toFixed(2)}%`)
    ])))
  ]);
}

function renderCleRepartitionTable(lignes, registries) {
  return el('table', { className: 'table', style: { width: '100%', fontSize: '13px' } }, [
    el('thead', {}, [el('tr', {}, [
      el('th', {}, 'Année'),
      el('th', {}, 'Bailleur'),
      el('th', {}, 'Type fin.'),
      el('th', {}, 'Base'),
      el('th', { style: { textAlign: 'right' } }, 'Montant'),
      el('th', { style: { textAlign: 'right' } }, '%')
    ])]),
    el('tbody', {}, lignes.map(l => {
      const bailleurLib = registries.BAILLEUR?.find(b => b.code === l.bailleur)?.label || l.bailleur;
      return el('tr', { style: l.isTVAEtat ? { background: '#fffbeb' } : {} }, [
        el('td', {}, String(l.annee || '-')),
        el('td', {}, [el('span', { className: 'badge badge-info' }, bailleurLib), l.isTVAEtat ? el('span', { className: 'badge badge-warning', style: { marginLeft: '4px' } }, 'TVA État') : null]),
        el('td', {}, l.typeFinancement || '-'),
        el('td', {}, l.baseCalc || '-'),
        el('td', { style: { textAlign: 'right' } }, money(l.montant)),
        el('td', { style: { textAlign: 'right' } }, `${(l.pourcentage || 0).toFixed(2)}%`)
      ]);
    }))
  ]);
}

// ============================================
// Section 4 — Approbation (Visa CF)
// ============================================

function renderApprobationContent(fullData, currentLotId, registries) {
  const visas = (fullData.visasCF || []).filter(v => currentLotId === 'ALL' ? true : (!v.lotId || v.lotId === currentLotId));
  if (visas.length === 0) {
    return el('p', { className: 'text-muted', style: { fontStyle: 'italic' } }, 'Aucun visa d\'approbation enregistré.');
  }
  return el('table', { className: 'table', style: { width: '100%', fontSize: '13px' } }, [
    el('thead', {}, [el('tr', {}, [
      el('th', {}, 'Organe'),
      el('th', {}, 'Décision'),
      el('th', {}, 'Date'),
      el('th', {}, 'Motif / Commentaire'),
      el('th', {}, 'Document')
    ])]),
    el('tbody', {}, visas.map(v => el('tr', {}, [
      el('td', {}, v.organeLabel || v.organeCode || '-'),
      el('td', {}, el('span', { className: `badge badge-${v.decision === 'VISA' ? 'success' : v.decision === 'REFUS' ? 'error' : 'warning'}` }, v.decision || '-')),
      el('td', {}, fmtDate(v.dateVisa || v.date)),
      el('td', { style: { fontSize: '12px' } }, v.commentaire || v.motif || '-'),
      el('td', {}, v.documentRef ? el('a', { href: '#', onclick: (e) => { e.preventDefault(); alert('Téléchargement R2 : ' + v.documentRef); } }, '📄') : '-')
    ])))
  ]);
}

// ============================================
// Section 5 — Exécution
// ============================================

function renderExecutionContent(fullData, currentLotId, registries) {
  const { ordresService = [], avenants = [], garanties = [] } = fullData;

  const osLot = currentLotId === 'ALL' ? ordresService : ordresService.filter(o => !o.lotId || o.lotId === currentLotId);
  const avLot = currentLotId === 'ALL' ? avenants : avenants.filter(a => !a.lotId || a.lotId === currentLotId);
  const garLot = currentLotId === 'ALL' ? garanties : garanties.filter(g => !g.lotId || g.lotId === currentLotId);

  return el('div', {}, [
    el('h4', { style: { margin: '0 0 10px', fontSize: '14px', fontWeight: 600 } }, `📋 Ordres de Service (${osLot.length})`),
    osLot.length === 0
      ? el('p', { className: 'text-muted', style: { fontStyle: 'italic', fontSize: '13px' } }, 'Aucun OS émis')
      : el('table', { className: 'table', style: { width: '100%', fontSize: '13px' } }, [
          el('thead', {}, [el('tr', {}, [
            el('th', {}, 'Type'),
            el('th', {}, 'N°'),
            el('th', {}, 'Date émission'),
            el('th', {}, 'Date signature')
          ])]),
          el('tbody', {}, osLot.map(os => el('tr', {}, [
            el('td', {}, os.type || '-'),
            el('td', {}, os.numero || '-'),
            el('td', {}, fmtDate(os.dateEmission)),
            el('td', {}, fmtDate(os.dateSignature))
          ])))
        ]),

    el('h4', { style: { margin: '20px 0 10px', fontSize: '14px', fontWeight: 600 } }, `📝 Avenants (${avLot.length})`),
    avLot.length === 0
      ? el('p', { className: 'text-muted', style: { fontStyle: 'italic', fontSize: '13px' } }, 'Aucun avenant')
      : el('table', { className: 'table', style: { width: '100%', fontSize: '13px' } }, [
          el('thead', {}, [el('tr', {}, [
            el('th', {}, 'N°'),
            el('th', {}, 'Type'),
            el('th', {}, 'Base'),
            el('th', { style: { textAlign: 'right' } }, 'Variation'),
            el('th', {}, 'Motif'),
            el('th', {}, 'Date signature')
          ])]),
          el('tbody', {}, avLot.map(a => el('tr', {}, [
            el('td', { style: { fontWeight: 600 } }, a.numero || '-'),
            el('td', {}, a.type || '-'),
            el('td', {}, a.type === 'DELAI' ? '-' : (a.variationBaseCalc || 'TTC')),
            el('td', { style: { textAlign: 'right', fontWeight: 500, color: (a.variationMontant || 0) < 0 ? '#dc2626' : '#16a34a' } },
              a.type === 'DELAI' ? `+${a.variationDelai || 0} mois` : money(a.variationMontant)),
            el('td', { style: { fontSize: '12px' } }, a.motifRef || '-'),
            el('td', {}, fmtDate(a.dateSignature))
          ])))
        ]),

    el('h4', { style: { margin: '20px 0 10px', fontSize: '14px', fontWeight: 600 } }, `🛡 Garanties en cours (${garLot.length})`),
    garLot.length === 0
      ? el('p', { className: 'text-muted', style: { fontStyle: 'italic', fontSize: '13px' } }, 'Aucune garantie enregistrée')
      : el('table', { className: 'table', style: { width: '100%', fontSize: '13px' } }, [
          el('thead', {}, [el('tr', {}, [
            el('th', {}, 'Type'),
            el('th', {}, 'Base'),
            el('th', { style: { textAlign: 'right' } }, 'Taux'),
            el('th', { style: { textAlign: 'right' } }, 'Montant'),
            el('th', {}, 'Émission'),
            el('th', {}, 'Échéance'),
            el('th', {}, 'État')
          ])]),
          el('tbody', {}, garLot.map(g => {
            const typeLib = registries.TYPE_GARANTIE?.find(t => t.code === g.type)?.label || g.type;
            const etatColor = g.etat === 'ACTIVE' ? 'success' : g.etat === 'EXPIREE' ? 'error' : 'info';
            return el('tr', {}, [
              el('td', { style: { fontSize: '12px' } }, typeLib),
              el('td', {}, g.baseCalc || 'TTC'),
              el('td', { style: { textAlign: 'right' } }, `${(g.taux ?? 0).toFixed(2)}%`),
              el('td', { style: { textAlign: 'right' } }, money(g.montant)),
              el('td', {}, fmtDate(g.dateEmission)),
              el('td', {}, fmtDate(g.dateEcheance)),
              el('td', {}, el('span', { className: `badge badge-${etatColor}` }, g.etat || '-'))
            ]);
          }))
        ])
  ]);
}

// ============================================
// Section 6 — Clôture
// ============================================

function renderClotureContent(fullData, currentLotId, registries) {
  const cloture = currentLotId === 'ALL' ? fullData.cloture : getLotData(fullData.cloture, currentLotId);
  if (!cloture) {
    return el('p', { className: 'text-muted', style: { fontStyle: 'italic' } }, 'Marché non encore clôturé.');
  }
  return el('div', {}, [
    renderInfoGrid([
      { label: 'Date dernier décompte', value: fmtDate(cloture.dateDernierDecompte) },
      { label: 'Réception provisoire', value: fmtDate(cloture.receptionProv?.date) },
      { label: 'PV provisoire', value: cloture.receptionProv?.documentRef ? '📄 Document' : '-' },
      { label: 'Réception définitive', value: fmtDate(cloture.receptionDef?.date) },
      { label: 'PV définitif', value: cloture.receptionDef?.documentRef ? '📄 Document' : '-' },
      { label: 'Date de clôture effective', value: fmtDate(cloture.dateClotureEffective) }
    ]),
    cloture.observations ? el('div', { style: { marginTop: '12px', padding: '10px', background: '#f9fafb', borderRadius: '4px', fontSize: '13px' } }, [
      el('strong', {}, 'Observations : '), cloture.observations
    ]) : null
  ]);
}

// ============================================
// Panneau Documents (sticky droite)
// ============================================

function renderDocumentsPanel(fullData, currentLotId, registries, mpDocuments = [], idOperation, params) {
  const docs = collectAllDocuments(fullData, currentLotId, mpDocuments);

  return el('div', {
    className: 'card',
    style: {
      position: 'sticky',
      top: '160px',
      maxHeight: 'calc(100vh - 180px)',
      overflowY: 'auto'
    }
  }, [
    el('div', {
      className: 'card-header',
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }
    }, [
      el('h3', { className: 'card-title', style: { margin: 0, fontSize: '14px' } }, `📚 Documents (${docs.total})`),
      // Modif #31 : bouton d'upload libre à tout moment
      el('button', {
        className: 'btn btn-sm btn-primary',
        title: 'Ajouter un document libre rattaché à ce marché',
        onclick: () => openDocumentUploadModal({
          operationId: idOperation,
          onUploaded: async () => {
            // Recharger la fiche pour faire apparaître le nouveau doc dans le panneau
            await renderFicheMarche(params);
          }
        })
      }, '📤 Ajouter')
    ]),
    el('div', { className: 'card-body', style: { padding: '8px' } }, [
      docs.total === 0
        ? el('p', { className: 'text-muted', style: { fontStyle: 'italic', fontSize: '12px', padding: '8px' } }, 'Aucun document attaché. Cliquez sur 📤 Ajouter pour en uploader un.')
        : Object.entries(docs.byPhase).map(([phase, items]) =>
            items.length === 0 ? null : el('div', { style: { marginBottom: '12px' } }, [
              el('div', { style: { fontWeight: 600, fontSize: '12px', color: '#6b7280', padding: '4px 8px', textTransform: 'uppercase' } },
                `${phase} (${items.length})`),
              ...items.map(d => el('div', {
                style: {
                  padding: '6px 8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  borderRadius: '4px'
                },
                onmouseenter: (e) => e.currentTarget.style.background = '#f9fafb',
                onmouseleave: (e) => e.currentTarget.style.background = 'transparent',
                onclick: () => {
                  // Si on a une URL directe (uploads R2 récents stockent fichier=URL), on l'ouvre
                  if (d.url) {
                    window.open(d.url, '_blank', 'noopener');
                  } else {
                    alert(`Référence document : ${d.ref}\n(URL R2 non disponible — recharger la fiche après upload)`);
                  }
                },
                title: d.ref
              }, `📄 ${d.label}`))
            ])
          )
    ])
  ]);
}

function collectAllDocuments(fullData, currentLotId, mpDocuments = []) {
  const byPhase = {
    'Planification': [],
    'Contractualisation': [],
    'Attribution': [],
    'Approbation': [],
    'Exécution': [],
    'Clôture': [],
    'Autres documents': [] // Modif #31 : documents libres uploadés depuis la fiche
  };

  const inLot = (entity) => currentLotId === 'ALL' || !entity?.lotId || entity.lotId === currentLotId;

  // Procedure : PVs des lots
  if (fullData.procedure?.lots) {
    fullData.procedure.lots.forEach(lot => {
      if (currentLotId !== 'ALL' && lot.id !== currentLotId) return;
      const pv = lot.pv || {};
      Object.entries(pv).forEach(([k, ref]) => {
        if (ref) byPhase['Contractualisation'].push({ label: `PV ${k} (lot ${lot.numero || lot.id})`, ref });
      });
    });
  }

  // Attribution : doc attribution + garanties docs
  const attribution = fullData.attribution;
  if (attribution) {
    if (attribution.documentRef) byPhase['Attribution'].push({ label: 'Document d\'attribution', ref: attribution.documentRef });
    const g = attribution.garanties || {};
    if (g.garantieAvance?.docRef) byPhase['Attribution'].push({ label: 'Garantie d\'avance', ref: g.garantieAvance.docRef });
    if (g.garantieBonneExec?.docRef) byPhase['Attribution'].push({ label: 'Garantie bonne exécution', ref: g.garantieBonneExec.docRef });
    if (g.cautionnement?.docRef) byPhase['Attribution'].push({ label: 'Cautionnement', ref: g.cautionnement.docRef });
  }

  // Visa CF
  (fullData.visasCF || []).filter(inLot).forEach(v => {
    if (v.documentRef) byPhase['Approbation'].push({ label: `Visa CF du ${fmtDate(v.dateVisa || v.date)}`, ref: v.documentRef });
  });

  // Ordres de Service
  (fullData.ordresService || []).filter(inLot).forEach(os => {
    if (os.documentRef) byPhase['Exécution'].push({ label: `OS ${os.type || ''} ${os.numero || ''}`.trim(), ref: os.documentRef });
  });

  // Avenants
  (fullData.avenants || []).filter(inLot).forEach(a => {
    if (a.documentRef) byPhase['Exécution'].push({ label: `Avenant ${a.numero || ''}`, ref: a.documentRef });
  });

  // Garanties (standalone)
  (fullData.garanties || []).filter(inLot).forEach(g => {
    if (g.doc) byPhase['Exécution'].push({ label: `Garantie ${g.type || ''}`, ref: g.doc });
  });

  // Clôture
  const cloture = fullData.cloture;
  if (cloture) {
    if (cloture.receptionProv?.documentRef) byPhase['Clôture'].push({ label: 'PV réception provisoire', ref: cloture.receptionProv.documentRef });
    if (cloture.receptionDef?.documentRef) byPhase['Clôture'].push({ label: 'PV réception définitive', ref: cloture.receptionDef.documentRef });
  }

  // Modif #31 : documents libres MP_DOCUMENT — répartis dans la phase de rattachement choisie
  // (PLANIF/PROCEDURE/ATTRIBUTION/APPROBATION/EXECUTION/CLOTURE) ou « Autres documents » si phase null.
  const phaseToBucket = {
    PLANIF: 'Planification',
    PROCEDURE: 'Contractualisation',
    ATTRIBUTION: 'Attribution',
    APPROBATION: 'Approbation',
    EXECUTION: 'Exécution',
    CLOTURE: 'Clôture'
  };
  for (const d of (mpDocuments || [])) {
    if (!d) continue;
    const bucket = (d.phase && phaseToBucket[d.phase]) || 'Autres documents';
    const label = d.typeDocument
      ? `${d.typeDocument}${d.nom ? ' — ' + d.nom : ''}`
      : (d.nom || 'Document');
    byPhase[bucket].push({
      label,
      ref: d.fichier || d.id,
      url: d.fichier && /^https?:\/\//.test(d.fichier) ? d.fichier : null
    });
  }

  const total = Object.values(byPhase).reduce((s, arr) => s + arr.length, 0);
  return { byPhase, total };
}

// ============================================
// Audit log (placeholder — NF07)
// ============================================

function renderAuditLogPlaceholder() {
  return el('div', { style: { marginTop: '30px' } }, [
    sectionAccordion('audit', '🕒 Historique / Audit log',
      el('div', { style: { padding: '8px 4px' } }, [
        el('p', { className: 'text-muted', style: { fontSize: '13px', fontStyle: 'italic' } },
          'L\'historique centralisé (NF07 du SDF) nécessite une table `mp_audit_log` côté serveur et l\'instrumentation des écrans CRUD. Implémentation prévue dans une modif dédiée.'),
        el('p', { className: 'text-muted', style: { fontSize: '12px' } },
          'En attendant, les actions sont visibles dans la console (logger.js) et dans les `updatedAt` de chaque entité.')
      ]),
      { defaultOpen: false, status: 'empty' }
    )
  ]);
}

// ============================================
// Utilitaires
// ============================================

function renderInfoGrid(items) {
  return el('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '12px',
      fontSize: '13px'
    }
  }, items.map(item => el('div', {
    style: item.fullWidth ? { gridColumn: '1 / -1' } : {}
  }, [
    el('div', { style: { fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px' } }, item.label),
    el('div', { style: { fontWeight: '500', marginTop: '2px' } }, String(item.value ?? '-'))
  ])));
}

let _responsiveStyleInjected = false;
function injectResponsiveStyle() {
  if (_responsiveStyleInjected) return;
  _responsiveStyleInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 1023px) {
      .fiche-marche-page .fiche-grid {
        grid-template-columns: 1fr !important;
      }
      .fiche-marche-page .fiche-side .card {
        position: static !important;
        max-height: none !important;
      }
    }
    @media print {
      .fiche-marche-page .fiche-header-sticky {
        position: static !important;
        box-shadow: none !important;
      }
      .fiche-marche-page .btn { display: none !important; }
    }
  `;
  document.head.appendChild(style);
}

export default renderFicheMarche;
