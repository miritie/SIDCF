/* ============================================
   ECR01B - PPM List & Operations (v3 - Optimized)
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import { money, moneyMillions } from '../../../lib/format.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { getRegionsOptions } from '../../../lib/mp-regions-ci.js';
import { renderMultiSelectCollapsible } from '../../../ui/widgets/multi-select-collapsible-mp.js';
import { computeExecutionFinanciere } from '../../../ui/widgets/op-mandat-manager-mp.js';
import { renderFormulaBadge } from '../../../ui/widgets/formula-tip-mp.js';
import { ETAT_LABEL_MP } from '../etat-labels-mp.js';

// Modif #37 — Formules associées aux 5 catégories de santé du marché (exposées via badge 📐)
const SANTE_FORMULES = {
  NORMAL: {
    titre: 'Santé : en progression normale',
    formule: 'État ∈ {EN_EXEC, EXECUTION, CLOS} ET cumul avenants < 25 % ET pas de difficulté CRITIQUE/ELEVE non résolue',
    regle: 'Marché qui suit son cours sans alerte particulière.'
  },
  SURVEILLER: {
    titre: 'Santé : à surveiller',
    formule: '(cumul avenants ∈ [25 %, 30 %[) OU (≥1 difficulté impact ELEVE non résolue)',
    regle: 'Indicateurs précurseurs de risque. Action recommandée : vérification CF à court terme.'
  },
  A_RISQUE: {
    titre: 'Santé : à risque',
    formule: 'cumul avenants ≥ 30 %',
    regle: 'Dépassement du seuil légal RG021. Dérogation requise pour tout nouvel avenant.',
    reference: 'RG021 du SDF · Code MP CI'
  },
  BLOQUE: {
    titre: 'Santé : bloqué',
    formule: '(≥1 difficulté impact CRITIQUE non résolue) OU (état = RESILIE)',
    regle: 'Marché stoppé ou en crise. Décision attendue.'
  },
  NON_DEMARRE: {
    titre: 'Santé : non démarré',
    formule: 'État ∉ {EN_EXEC, EXECUTION, RESILIE, CLOS}',
    regle: 'Marché encore en phase amont (planifié, contractualisation, attribué…) — la santé d\'exécution ne s\'évalue qu\'après l\'OS de démarrage.'
  }
};

// Modif #36 — Catégories de santé d'un marché avec leurs métadonnées d'affichage
const SANTE_CATEGORIES = [
  { code: 'NORMAL',       label: 'En progression normale', icon: '🟢', color: '#16a34a', bg: '#dcfce7' },
  { code: 'SURVEILLER',   label: 'À surveiller',           icon: '🟡', color: '#ca8a04', bg: '#fef9c3' },
  { code: 'A_RISQUE',     label: 'À risque',               icon: '🔴', color: '#dc2626', bg: '#fee2e2' },
  { code: 'BLOQUE',       label: 'Bloqué',                 icon: '⛔', color: '#7f1d1d', bg: '#fecaca' },
  { code: 'NON_DEMARRE',  label: 'Non démarré',            icon: '⚪', color: '#6b7280', bg: '#f3f4f6' }
];

/**
 * Calcule la santé d'un marché en combinant : situation financière,
 * cumul avenants et difficultés non résolues. Retourne un code parmi
 * SANTE_CATEGORIES.
 */
function computeSanteMarche(operation, attribution, avenants, decomptes, difficultes) {
  const etat = operation?.etat;
  if (etat !== 'EN_EXEC' && etat !== 'EXECUTION' && etat !== 'RESILIE' && etat !== 'CLOS') {
    return 'NON_DEMARRE';
  }

  const difCritiquesEnCours = difficultes.filter(d => d.statutTraitement === 'EN_COURS' && d.impact === 'CRITIQUE').length;
  if (difCritiquesEnCours > 0) return 'BLOQUE';
  if (etat === 'RESILIE') return 'BLOQUE';

  const baseTTC = Number(attribution?.montants?.ttc) || Number(operation?.montantPrevisionnel) || 0;
  const totalAvenants = avenants.reduce((s, a) => s + (Number(a?.variationMontant) || 0), 0);
  const cumulAvenantPct = baseTTC > 0 ? (totalAvenants / baseTTC) * 100 : 0;
  if (cumulAvenantPct >= 30) return 'A_RISQUE';

  const difElevesEnCours = difficultes.filter(d => d.statutTraitement === 'EN_COURS' && d.impact === 'ELEVE').length;
  if (difElevesEnCours > 0 || cumulAvenantPct >= 25) return 'SURVEILLER';

  return 'NORMAL';
}

// Cache local pour les régions CI (33 entrées chargées une fois)
let _regionsCiCache = null;
async function _getRegionsCi() {
  if (!_regionsCiCache) _regionsCiCache = await getRegionsOptions();
  return _regionsCiCache;
}

function createButton(className, text, onClick) {
  const btn = el('button', { className }, text);
  btn.addEventListener('click', onClick);
  return btn;
}

/**
 * Title Case français — première lettre majuscule, reste minuscule pour chaque mot.
 * Préserve les apostrophes et traits d'union (« L'Afrique de l'Ouest » → « L'Afrique De L'Ouest »
 * conforme à la consigne « première lettre majuscule de chaque mot »).
 */
function toTitleCaseFr(value) {
  if (value == null) return '-';
  const s = String(value).trim();
  if (!s) return '-';
  return s.toLowerCase().replace(/(^|[\s\-'])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase());
}

// Filtres repliés par défaut (gain de place vertical)
let filtersExpanded = false;

// État global des filtres — Marché+ : multi-select (arrays), array vide = tous
let activeFilters = {
  search: '',
  typeMarche: [],
  modePassation: [],
  etat: [],
  typeFinancement: [],
  bailleur: [],
  categoriePrestation: [],
  region: [],
  exercice: [],
  unite: [],
  activite: [],
  // Modif #36 — filtre santé du marché (NORMAL / SURVEILLER / A_RISQUE / BLOQUE / NON_DEMARRE)
  sante: [],
  // Modif #76 — lot 1 (CR 26 mai 2026, point 1.e) — filtre nature économique
  natureEco: []
};

/**
 * Modif #78 — Lot 3 CR 26 mai 2026 (3.e) — Action « Voir » contextuelle.
 * Renvoie la route vers laquelle naviguer depuis la liste PPM en fonction
 * de l'étape courante du marché. Gère les états legacy (EXECUTION,
 * CLOTURE) pour rétro-compat des données existantes. Fallback : fiche
 * de vie (utile au moins en exploration).
 *
 * @param {string} etat — code d'état stocké sur op.etat
 * @returns {string} route /mp/...
 */
function getRouteForEtape(etat) {
  switch (etat) {
    case 'PLANIFIE':    return '/mp/ppm-create-line'; // Modif #94 — édition de la ligne PPM (pas la fiche de vie)
    case 'EN_PROC':     return '/mp/procedure';
    case 'ATTRIBUE':    return '/mp/attribution';
    case 'VISE':        return '/mp/visa-cf';
    case 'EN_EXEC':
    case 'EXECUTION':   return '/mp/execution';   // EXECUTION = code legacy
    case 'CLOS':
    case 'CLOTURE':     return '/mp/cloture';     // CLOTURE = code legacy
    case 'RESILIE':     return '/mp/cloture';     // fin de vie : on va à la clôture
    case 'SUSPENDU':    return '/mp/fiche-marche'; // Modif #99 / P-7 — difficulté : consultation/édition via la fiche de vie (P-6)
    case 'INFRUCTUEUX': return '/mp/attribution'; // écran d'enregistrement (lot 6)
    default:            return '/mp/fiche-marche';
  }
}

/**
 * Modif #76 — Normalise un code typeMarche : si c'est un ancien code legacy
 * (TRAVAUX, FOURNITURES, …) on le ramène à son équivalent dans la nouvelle
 * typologie A/B/C (MARCHE_TRAVAUX, MARCHE_FOURN_EQUIP, …). Permet au filtre
 * hiérarchisé de matcher les opérations encore stockées avec les anciens
 * codes — sans migration DB pour ce lot (option B validée).
 */
function normalizeTypeMarche(code, registries) {
  if (!code) return code;
  const map = registries?.TYPE_MARCHE_LEGACY_MAP || {};
  return map[code] || code;
}

/**
 * Modif #76 — Construit la liste hiérarchisée pour le widget multi-select :
 * insère un entête de groupe A/B/C avant les types qui en relèvent. Exclut
 * les codes legacy (rétro-compat pour l'affichage par lookup, mais hors
 * du choix utilisateur dans le filtre).
 */
function buildHierarchicalTypeMarcheOptions(registries) {
  const familles = registries.TYPE_MARCHE_FAMILLES || [];
  const types = (registries.TYPE_MARCHE || []).filter(t => !t.legacy);
  const out = [];
  for (const fam of familles) {
    const children = types.filter(t => t.parent === fam.code);
    if (children.length === 0) continue;
    out.push({ group: true, label: fam.label });
    for (const t of children) out.push({ code: t.code, label: t.label });
  }
  // Types sans parent (au cas où) — affichés sans entête
  const orphans = types.filter(t => !t.parent);
  if (orphans.length > 0) {
    out.push({ group: true, label: 'Autres' });
    for (const t of orphans) out.push({ code: t.code, label: t.label });
  }
  return out;
}

/**
 * Modif #100 — P-4 (CR 01/06/2026) : regroupe les modes de passation par
 * famille dans le filtre (Appel d'offres / Procédures simplifiées /
 * Prestations intellectuelles / Procédures dérogatoires), à l'image de la
 * typologie des types de marché. On NE TOUCHE PAS aux codes du référentiel
 * MODE_PASSATION (aucun impact sur le barème ni la contractualisation) :
 * seul l'affichage est structuré en groupes. Tout mode non classé reste
 * accessible sous « Autres » (rétro-compat / futurs sous-types).
 */
const MODE_PASSATION_FAMILLES = [
  { label: 'Appel d\'offres',             codes: ['AOO', 'AOO_PREQUALIF', 'AOO_2ETAPES'] },
  { label: 'Procédures simplifiées',      codes: ['PSD', 'PSC', 'PSL', 'PSO'] },
  { label: 'Prestations intellectuelles', codes: ['PI'] },
  { label: 'Procédures dérogatoires',     codes: ['AOR', 'ENTENTE_DIRECTE', 'CFN', 'CONVENTION', 'LETTRE_COMMANDE_MARCHE'] }
];

function buildGroupedModePassationOptions(registries) {
  const modes = registries.MODE_PASSATION || [];
  const byCode = new Map(modes.map(m => [m.code, m]));
  const used = new Set();
  const out = [];
  for (const fam of MODE_PASSATION_FAMILLES) {
    const children = fam.codes.map(c => byCode.get(c)).filter(Boolean);
    if (children.length === 0) continue;
    out.push({ group: true, label: fam.label });
    for (const m of children) { out.push({ code: m.code, label: m.label }); used.add(m.code); }
  }
  const orphans = modes.filter(m => !used.has(m.code));
  if (orphans.length > 0) {
    out.push({ group: true, label: 'Autres' });
    for (const m of orphans) out.push({ code: m.code, label: m.label });
  }
  return out;
}

// Mapping des phases (états) — utilisé pour les KPIs
const PHASES = [
  { key: 'planification',     label: 'En Planification',     icon: '📅', color: 'var(--color-warning)', etats: ['PLANIFIE'] },
  { key: 'contractualisation', label: 'En Contractualisation', icon: '📝', color: 'var(--color-info)',    etats: ['EN_PROC'] },
  { key: 'attribution',        label: 'Attribué',              icon: '✅', color: '#0d6efd',              etats: ['ATTRIBUE', 'VISE'] },
  { key: 'execution',          label: 'En exécution',          icon: '⚙️', color: '#6f42c1',              etats: ['EN_EXEC'] },
  { key: 'cloture',            label: 'Achevé',                icon: '🏁', color: 'var(--color-gray-500)', etats: ['CLOS'] },
  // Modif #97 — P-1 : 6e carte « Résilié ». Sans elle, la somme des cartes
  // (32) ne retombait pas sur le total planifié (33) car les marchés au
  // statut RESILIE n'étaient bucketés dans aucune phase. Couverture désormais
  // complète des états « cycle de vie ».
  { key: 'resilie',            label: 'Résilié',               icon: '⛔', color: '#dc3545',              etats: ['RESILIE'] }
];

// Modif #41 — Libellés des étapes Marché+ : importés depuis etat-labels-mp.js

// Opération sélectionnée pour modal détails
let selectedOperation = null;

export async function renderPPMList() {
  // Load data — modif #36 : on charge en parallèle attributions, avenants, décomptes
  // et difficultés pour pouvoir calculer la santé agrégée par marché.
  const [operations, attributions, avenants, decomptes, difficultes] = await Promise.all([
    dataService.query(ENTITIES.MP_OPERATION),
    dataService.query(ENTITIES.MP_ATTRIBUTION).catch(() => []),
    dataService.query(ENTITIES.MP_AVENANT).catch(() => []),
    dataService.query(ENTITIES.MP_DECOMPTE).catch(() => []),
    dataService.query(ENTITIES.MP_DIFFICULTE).catch(() => [])
  ]);
  const registries = dataService.getAllRegistries();

  // Indexer par operationId pour accès O(1) lors du calcul de santé
  const attribByOp = new Map();
  for (const a of attributions || []) if (a?.operationId) attribByOp.set(a.operationId, a);
  const avenantsByOp = new Map();
  for (const av of avenants || []) {
    if (!av?.operationId) continue;
    if (!avenantsByOp.has(av.operationId)) avenantsByOp.set(av.operationId, []);
    avenantsByOp.get(av.operationId).push(av);
  }
  const decomptesByOp = new Map();
  for (const d of decomptes || []) {
    if (!d?.operationId) continue;
    if (!decomptesByOp.has(d.operationId)) decomptesByOp.set(d.operationId, []);
    decomptesByOp.get(d.operationId).push(d);
  }
  const difficultesByOp = new Map();
  for (const d of difficultes || []) {
    if (!d?.operationId) continue;
    if (!difficultesByOp.has(d.operationId)) difficultesByOp.set(d.operationId, []);
    difficultesByOp.get(d.operationId).push(d);
  }

  // Calculer la santé pour chaque opération (cache pour éviter les recalculs en filtre)
  const santeMap = new Map();
  for (const op of operations) {
    santeMap.set(op.id, computeSanteMarche(
      op,
      attribByOp.get(op.id),
      avenantsByOp.get(op.id) || [],
      decomptesByOp.get(op.id) || [],
      difficultesByOp.get(op.id) || []
    ));
  }

  // Extract unique values for filters
  const exercices = [...new Set(operations.map(op => op.exercice).filter(Boolean))].sort((a, b) => b - a);
  const unites = [...new Set(operations.map(op => op.unite).filter(Boolean))].sort();
  const activites = [...new Set(operations.map(op => op.chaineBudgetaire?.activiteLib).filter(Boolean))].sort();
  // Régions : référentiel officiel CI (33 entrées) — pas le calcul ad hoc sur les opérations
  const regions = await _getRegionsCi();

  // Modif #83 — Élaguer les sources de financement sélectionnées devenues
  // incompatibles avec le type de financement courant (évite un filtre fantôme
  // qui viderait la liste). Fait avant applyFilters pour éviter tout décalage
  // d'un rendu.
  {
    const allowed = new Set(getSourceFinancementOptions(registries).map(b => b.code));
    if (Array.isArray(activeFilters.bailleur) && activeFilters.bailleur.some(c => !allowed.has(c))) {
      activeFilters.bailleur = activeFilters.bailleur.filter(c => allowed.has(c));
    }
  }

  // Apply filters (avec filtre santé qui s'appuie sur santeMap
  // et registries pour normaliser les codes typeMarche legacy)
  const filteredOps = applyFilters(operations, santeMap, registries);

  // Calculate stats : total + montant + 1 KPI par phase + 1 KPI par catégorie de santé
  const stats = {
    totalOperations: filteredOps.length,
    totalMontant: filteredOps.reduce((sum, op) => sum + (op.montantPrevisionnel || 0), 0),
    parPhase: PHASES.reduce((acc, p) => {
      acc[p.key] = filteredOps.filter(op => p.etats.includes(op.etat)).length;
      return acc;
    }, {}),
    parSante: SANTE_CATEGORIES.reduce((acc, s) => {
      acc[s.code] = filteredOps.filter(op => santeMap.get(op.id) === s.code).length;
      return acc;
    }, {})
  };

  const page = el('div', { className: 'page' }, [
    // Header
    el('div', { className: 'page-header' }, [
      el('h1', { className: 'page-title' }, '📋 PPM & Marchés et contrats'),
      el('p', { className: 'page-subtitle' }, `${stats.totalOperations} marché(s) et contrat(s) — ${money(stats.totalMontant, 'F CFA')}`),
      el('div', { className: 'page-actions', style: { display: 'flex', gap: '12px' } }, [
        createButton('btn btn-secondary', '📤 Importer PPM', () => router.navigate('/mp/ppm-import')),
        createButton('btn btn-primary', '➕ Créer ligne PPM', () => router.navigate('/mp/ppm-create-line')),
        createButton('btn btn-accent', '📊 Tableau de bord', () => router.navigate('/mp/dashboard'))
      ])
    ]),

    // Stats KPIs — total + montant (rangée 1) puis 6 phases (rangée 2)
    el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '12px' } }, [
      renderKPI('Total marché planifié', stats.totalOperations, 'var(--color-primary)', '📁'),
      renderKPI('Montant total prévisionnel', money(stats.totalMontant, 'F CFA'), 'var(--color-success)', '💰')
    ]),
    el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' } },
      PHASES.map(p => renderKPI(p.label, stats.parPhase[p.key], p.color, p.icon))
    ),

    // Modif #50 — Tuiles santé du marché masquées sur demande client (UX gênante).
    // La fonction renderSanteTuiles() est conservée plus bas pour réactivation
    // éventuelle ; la classification santeMap reste calculée et exploitable
    // côté filtres/chips si besoin futur.
    // renderSanteTuiles(stats.parSante, filteredOps, santeMap),


    // Filters — collapsible, replié par défaut pour gagner de l'espace
    (() => {
      const activeCount = Object.entries(activeFilters)
        .filter(([k, v]) => Array.isArray(v) ? v.length > 0 : (v && v !== ''))
        .length;
      // Chips synthétiques (pour voir les filtres actifs sans déplier)
      const chips = renderActiveFilterChips(activeFilters, registries, exercices);

      // Modif #82 — overflow:visible sur la carte des filtres : le panneau
      // déroulant des multi-sélecteurs (position:absolute) était rogné par le
      // `overflow:hidden` global de `.card`. Comme `.card-header` compte sur ce
      // clipping pour arrondir ses coins hauts, on rétablit explicitement le
      // border-radius haut du header ci-dessous.
      return el('div', { className: 'card', style: { marginBottom: '24px', overflow: 'visible' } }, [
        // Header cliquable : toggle expand/collapse
        el('div', {
          className: 'card-header',
          style: {
            display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center',
            cursor: 'pointer', userSelect: 'none',
            borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)'
          },
          onclick: (e) => {
            // Ne pas toggler si l'utilisateur clique sur un bouton
            if (e.target.closest('button')) return;
            filtersExpanded = !filtersExpanded;
            renderPPMList();
          }
        }, [
          el('h3', { className: 'card-title', style: { margin: 0, display: 'flex', alignItems: 'center', gap: '8px' } }, [
            el('span', {}, filtersExpanded ? '▾' : '▸'),
            el('span', {}, '🔍 Filtres'),
            activeCount > 0
              ? el('span', {
                  style: { fontSize: '12px', background: '#0f5132', color: '#fff', padding: '2px 10px', borderRadius: '12px', fontWeight: '600' }
                }, `${activeCount} actif${activeCount > 1 ? 's' : ''}`)
              : el('span', { style: { fontSize: '12px', color: '#9ca3af', fontWeight: 'normal' } }, '(cliquer pour déplier)')
          ]),
          // Chips affichés dans le header replié (synthèse)
          !filtersExpanded && chips ? chips : null,
          el('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' } }, [
            filtersExpanded
              ? el('span', { className: 'text-small text-muted', style: { fontSize: '11px' } }, 'Cliquez sur un filtre pour le déployer · multi-sélection via cases à cocher')
              : null,
            activeCount > 0
              ? createButton('btn btn-sm btn-secondary', '🔄 Tout réinitialiser', (e) => { e.stopPropagation(); resetFilters(); })
              : null
          ])
        ]),
      ...(filtersExpanded ? [
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' } }, [
          // Search (texte libre)
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Recherche'),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'filter-search',
              placeholder: 'Objet, bénéficiaire, localité...',
              value: activeFilters.search
            })
          ]),

          // Activité (multi)
          renderMultiSelectFilter(
            'activite',
            'Activité',
            activites.map(a => ({ code: a, label: a })),
            activeFilters.activite
          ),

          // Type marché (multi, hiérarchisé A/B/C) — Modif #76 lot 1, point 1.a
          renderMultiSelectFilter(
            'typeMarche',
            'Type de marché',
            buildHierarchicalTypeMarcheOptions(registries),
            activeFilters.typeMarche
          ),

          // Mode passation (multi, regroupé par famille) — Modif #100 / P-4
          renderMultiSelectFilter(
            'modePassation',
            'Mode de passation',
            buildGroupedModePassationOptions(registries),
            activeFilters.modePassation
          ),

          // Statut du marché (multi) — Modif #76 lot 1, point 1.c (ex « État »)
          // Inclut désormais INFRUCTUEUX — Modif #76 lot 1, point 1.b
          renderMultiSelectFilter(
            'etat',
            'Statut du marché',
            (registries.ETAT_MARCHE || []).map(e => ({ ...e, label: ETAT_LABEL_MP[e.code] || e.label })),
            activeFilters.etat
          ),

          // Type financement (multi)
          renderMultiSelectFilter(
            'typeFinancement',
            'Type financement',
            registries.TYPE_FINANCEMENT || [],
            activeFilters.typeFinancement
          ),

          // Source de financement (multi) — Modif #76 lot 1, point 1.d (ex « Bailleur »)
          // Cohérence avec le module Budget. Clé interne 'bailleur' conservée
          // pour éviter une migration DB ; seul le libellé évolue.
          // Modif #83 — options dépendantes du Type financement (ÉTAT→TRÉSOR,
          // DON/EMPRUNT→bailleurs externes).
          renderMultiSelectFilter(
            'bailleur',
            'Source de financement',
            getSourceFinancementOptions(registries),
            activeFilters.bailleur
          ),

          // Nature économique (multi) — Modif #76 lot 1, point 1.e
          renderMultiSelectFilter(
            'natureEco',
            'Nature économique',
            registries.NATURE_ECO || [],
            activeFilters.natureEco
          ),

          // Catégorie prestation (multi)
          renderMultiSelectFilter(
            'categoriePrestation',
            'Catégorie prestation',
            registries.CATEGORIE_PRESTATION || [],
            activeFilters.categoriePrestation
          ),

          // Région (multi) — référentiel officiel CI : 2 districts autonomes + 31 régions
          renderMultiSelectFilter(
            'region',
            'Région (Côte d\'Ivoire)',
            regions,
            activeFilters.region
          ),

          // Unité Administrative (multi) — toujours dispo dans les filtres
          renderMultiSelectFilter(
            'unite',
            'Unité Administrative',
            unites.map(u => ({ code: u, label: u })),
            activeFilters.unite
          ),

          // Exercice (multi)
          renderMultiSelectFilter(
            'exercice',
            'Exercice',
            exercices.map(ex => ({ code: String(ex), label: String(ex) })),
            activeFilters.exercice.map(String)
          )
        ])
      ])
      ] : [])
      ]);
    })(),

    // Results table (SIMPLIFIED)
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, `Résultats (${filteredOps.length})`),
        createButton('btn btn-sm btn-accent', '📥 Exporter CSV', () => exportToCSV(filteredOps))
      ]),
      el('div', { className: 'card-body' }, [
        filteredOps.length > 0
          ? renderSimpleTable(filteredOps, registries)
          : el('div', { className: 'alert alert-info' }, [
              el('div', { className: 'alert-icon' }, '📭'),
              el('div', { className: 'alert-content' }, [
                el('div', { className: 'alert-title' }, 'Aucun marché trouvé'),
                el('div', { className: 'alert-message' }, 'Ajustez les filtres ou créez une nouvelle ligne PPM')
              ])
            ])
      ])
    ]),

    // Modal container
    el('div', { id: 'modal-detail-container' })
  ]);

  mount('#app', page);

  // Attach event listeners
  setupFilterListeners();
}

/**
 * Synthèse compacte des filtres actifs (visible quand le panneau est replié).
 * Retourne un fragment avec une série de "chips" (un par filtre actif).
 * Si aucun filtre actif → null (rien à afficher).
 */
function renderActiveFilterChips(filters, registries, exercices) {
  const chips = [];
  const labelFor = (registry, code) => {
    const r = (registries[registry] || []).find(x => x.code === code);
    return r?.label || code;
  };

  if (filters.search) chips.push(`🔎 "${filters.search}"`);
  if (filters.activite?.length)         chips.push(`Activité (${filters.activite.length})`);
  if (filters.typeMarche?.length)       chips.push(`Type (${filters.typeMarche.length})`);
  if (filters.modePassation?.length)    chips.push(`Mode (${filters.modePassation.length})`);
  // Modif #76 lot 1 (1.c) — « État » devient « Statut »
  if (filters.etat?.length)             chips.push(`Statut (${filters.etat.length})`);
  if (filters.typeFinancement?.length)  chips.push(`Financement (${filters.typeFinancement.length})`);
  // Modif #76 lot 1 (1.d) — « Bailleur » devient « Source de financement »
  if (filters.bailleur?.length)         chips.push(`Source fin. (${filters.bailleur.length})`);
  if (filters.categoriePrestation?.length) chips.push(`Catégorie (${filters.categoriePrestation.length})`);
  // Modif #76 lot 1 (1.e) — Nature économique
  if (filters.natureEco?.length)        chips.push(`Nature éco. (${filters.natureEco.length})`);
  if (filters.region?.length)           chips.push(`Région (${filters.region.length})`);
  if (filters.unite?.length)            chips.push(`UA (${filters.unite.length})`);
  if (filters.exercice?.length)         chips.push(`Exercice (${filters.exercice.length})`);

  if (chips.length === 0) return null;

  return el('div', {
    style: { display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center', marginLeft: '12px' }
  }, chips.map(c => el('span', {
    style: {
      background: '#e0e7ff',
      color: '#3730a3',
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '11px',
      fontWeight: '500'
    }
  }, c)));
}

/**
 * Helper : filtre compact replié par défaut.
 * Chaque filtre est un bouton qui affiche le compteur + un aperçu des valeurs
 * sélectionnées. Cliquer ouvre un panneau avec :
 *   - barre de recherche interne
 *   - liste de cases à cocher
 *   - boutons « Tout » / « Vider » / « Fermer »
 * Le panneau se ferme au clic dehors, sur Escape, ou via Fermer.
 *
 * @param {string} name      Clé dans activeFilters (ex: 'typeMarche')
 * @param {string} label     Libellé visible
 * @param {Array}  options   [{ code, label }]
 * @param {Array}  selected  Codes déjà cochés
 */
function renderMultiSelectFilter(name, label, options, selected) {
  const widget = renderMultiSelectCollapsible({
    id: `filter-${name}`,
    label,
    options,
    selected: selected || [],
    placeholder: '— Tous —',
    onChange: (newSelected) => {
      // 'exercice' est stocké en number — reconvertir au moment de l'écriture
      activeFilters[name] = name === 'exercice'
        ? newSelected.map(v => Number(v)).filter(v => !isNaN(v))
        : newSelected;
      renderPPMList();
    }
  });

  // Légende discrète au-dessus du toggle (label déjà dans le bouton — on
  // affiche juste le compteur de valeurs dispo en surtitre minimal)
  return el('div', { className: 'form-field' }, [
    el('div', {
      style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }
    }, [
      el('span', {
        style: { fontSize: '12px', color: '#6b7280', fontWeight: '600' }
      }, label),
      el('span', { style: { fontSize: '11px', color: '#9ca3af' } },
        options.length > 0 ? `${options.length} valeur${options.length > 1 ? 's' : ''}` : '—'
      )
    ]),
    widget
  ]);
}

function renderKPI(label, value, color, icon) {
  return el('div', {
    className: 'card',
    style: {
      borderColor: `${color}30`,
      background: `${color}10`,
      cursor: 'default'
    }
  }, [
    el('div', { className: 'card-body', style: { textAlign: 'center', padding: '20px' } }, [
      el('div', { style: { fontSize: '28px', marginBottom: '8px' } }, icon),
      el('div', { style: { fontSize: '20px', fontWeight: '700', color, marginBottom: '4px' } }, String(value)),
      el('div', { className: 'text-small text-muted' }, label)
    ])
  ]);
}

// Tableau simplifié — Marché+ : Activité en avant (UA dans les détails),
// pas de colonne Exercice (filtre multi-select dispo sinon)
// Modif #77 — Lot 2 CR 26 mai 2026 : refonte des entêtes et ajout colonne
// Nature économique. Activité reste sur une seule colonne mais affiche
// désormais « CODE - Libellé » à l'intérieur.
function renderSimpleTable(operations, registries) {
  // Modif #93 — toutes les colonnes visibles sans défilement horizontal :
  // table-layout fixe + largeurs proportionnelles (∑ = 100 %) + en-têtes
  // autorisés à passer sur plusieurs lignes (whiteSpace normal).
  const cols = [
    { label: 'Activité',                        w: '14%', align: 'left'  }, // 2.a — code - libellé
    { label: 'Objet / Libellé',                 w: '19%', align: 'left'  }, // 2.c
    { label: 'Type de marché',                  w: '11%', align: 'left'  }, // 2.d
    { label: 'Nature économique',               w: '13%', align: 'left'  }, // 2.b
    { label: 'Mode de passation',               w: '12%', align: 'left'  },
    { label: 'Montant prévisionnel (M F CFA)',  w: '10%', align: 'right' }, // 2.e
    { label: 'Statut du marché',                w: '9%',  align: 'left'  }, // 2.f
    { label: 'Actions',                         w: '12%', align: 'left'  }
  ];
  const table = el('div', { style: { width: '100%' } }, [
    el('table', { className: 'data-table', style: { width: '100%', tableLayout: 'fixed' } }, [
      el('thead', {}, [
        el('tr', {},
          cols.map(c => el('th', {
            style: {
              width: c.w, textAlign: c.align,
              whiteSpace: 'normal', wordBreak: 'break-word',
              verticalAlign: 'bottom', fontSize: '12px', lineHeight: '1.25'
            }
          }, c.label))
        )
      ]),
      el('tbody', {},
        operations.map(op => renderSimpleRow(op, registries))
      )
    ])
  ]);

  return table;
}

function renderSimpleRow(op, registries) {
  const typeMarche = registries.TYPE_MARCHE?.find(t => t.code === op.typeMarche);
  const modePassation = registries.MODE_PASSATION?.find(m => m.code === op.modePassation);
  const etat = registries.ETAT_MARCHE?.find(e => e.code === op.etat);
  // Modif #77 — Lot 2 (2.a) — colonne Activité affiche « CODE - Libellé »
  const activiteCode = op.chaineBudgetaire?.activiteCode || '';
  const activiteLib  = op.chaineBudgetaire?.activiteLib || op.chaineBudgetaire?.activite || '';
  const activiteFull = activiteCode && activiteLib
    ? `${activiteCode} - ${activiteLib}`
    : (activiteCode || activiteLib || '-');
  // Modif #77 — Lot 2 (2.b) — Nature économique : libellé du registre (qui
  // contient déjà « CODE - Libellé »), fallback sur le code brut.
  // Modif #91 — La nature économique vit en réalité dans
  // chaineBudgetaire.natureCode (source autoritaire) ; le champ natureEco n'est
  // pas alimenté. On lit donc l'un puis l'autre.
  const natureEcoCode  = op.natureEco || op.chaineBudgetaire?.natureCode || '';
  const natureEcoEntry = registries.NATURE_ECO?.find(n => n.code === natureEcoCode);
  const natureEcoFull  = natureEcoEntry?.label || natureEcoCode || '-';
  // Modif #77 — Lot 2 (2.d) — plus de toTitleCaseFr sur le type : la
  // nouvelle typologie A/B/C apporte déjà des libellés bien formés
  // (ex. « Marchés de travaux »).
  const typeMarcheLabel = typeMarche?.label || op.typeMarche || '-';

  return el('tr', {
    style: { cursor: 'pointer' },
    onclick: () => router.navigate('/mp/fiche-marche', { idOperation: op.id })
  }, [
    el('td', { className: 'text-small', title: activiteFull, style: { fontWeight: '500' } },
      activiteFull.length > 40 ? activiteFull.substring(0, 40) + '…' : activiteFull
    ),
    el('td', { style: { fontWeight: '500' }, title: op.objet },
      (op.objet || '').length > 60 ? op.objet.substring(0, 60) + '…' : (op.objet || '')
    ),
    el('td', { title: typeMarcheLabel }, typeMarcheLabel),
    el('td', { className: 'text-small', title: natureEcoFull }, natureEcoFull),
    el('td', { className: 'text-small' }, modePassation?.label?.split('(')[0]?.trim() || op.modePassation || '-'),
    el('td', { style: { fontWeight: '600', textAlign: 'right' } }, moneyMillions(op.montantPrevisionnel)),
    el('td', {},
      el('span', {
        className: `badge badge-${etat?.color || 'gray'}`,
        style: { fontSize: '11px' }
      }, ETAT_LABEL_MP[op.etat] || etat?.label || op.etat)
    ),
    el('td', {}, [
      // Modif #78 (3.e) — bouton « Voir » contextuel : navigation vers
      // l'écran correspondant à l'étape courante du marché (mapping dans
      // getRouteForEtape). Le bouton « Fiche de vie » conserve l'accès
      // direct à la vue globale ; le bouton « Détails » ouvre le modal.
      createButton('btn btn-sm btn-secondary', '👁️ Voir', (e) => {
        e.stopPropagation();
        router.navigate(getRouteForEtape(op.etat), { idOperation: op.id });
      }),
      createButton('btn btn-sm btn-primary', '📋 Fiche de vie', (e) => {
        e.stopPropagation();
        router.navigate('/mp/fiche-marche', { idOperation: op.id });
      }),
      createButton('btn btn-sm btn-secondary', 'ℹ️ Détails', (e) => {
        e.stopPropagation();
        showDetailModal(op, registries);
      })
    ])
  ]);
}

// NOUVEAU: Modal de détails complets
function showDetailModal(operation, registries) {
  selectedOperation = operation;

  const typeMarche = registries.TYPE_MARCHE?.find(t => t.code === operation.typeMarche);
  const modePassation = registries.MODE_PASSATION?.find(m => m.code === operation.modePassation);
  const naturePrix = registries.NATURE_PRIX?.find(n => n.code === operation.naturePrix);
  const etat = registries.ETAT_MARCHE?.find(e => e.code === operation.etat);
  const categorie = registries.CATEGORIE_PRESTATION?.find(c => c.code === operation.categoriePrestation);
  const bailleur = registries.BAILLEUR?.find(b => b.code === operation.sourceFinancement);
  const typeFinancement = registries.TYPE_FINANCEMENT?.find(t => t.code === operation.typeFinancement);

  const modal = el('div', {
    className: 'modal-overlay',
    id: 'detail-modal',
    style: { display: 'flex' }
  }, [
    el('div', {
      className: 'modal-content',
      style: { maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' },
      onclick: (e) => e.stopPropagation()
    }, [
      // Header
      el('div', { className: 'modal-header' }, [
        el('h2', { className: 'modal-title' }, '📋 Détails du marché / contrat'),
        createButton('btn-close', '×', closeDetailModal)
      ]),

      // Body
      el('div', { className: 'modal-body' }, [
        // Section: Identification
        renderDetailSection('Identification', [
          { label: 'Exercice', value: operation.exercice },
          { label: 'Unité opérationnelle', value: operation.unite },
          { label: 'Objet', value: operation.objet, fullWidth: true }
        ]),

        // Section: Classification
        renderDetailSection('Classification', [
          { label: 'Type de marché', value: typeMarche?.label || operation.typeMarche },
          { label: 'Mode de passation', value: modePassation?.label || operation.modePassation },
          { label: 'Revue', value: operation.revue },
          { label: 'Nature des prix', value: naturePrix?.label || operation.naturePrix },
          { label: 'État', value: ETAT_LABEL_MP[operation.etat] || etat?.label || operation.etat }
        ]),

        // Section: Financier
        renderDetailSection('Financier', [
          { label: 'Montant prévisionnel', value: money(operation.montantPrevisionnel) },
          { label: 'Montant actuel', value: money(operation.montantActuel) },
          { label: 'Type de financement', value: typeFinancement?.label || operation.typeFinancement },
          { label: 'Bailleur / Source', value: bailleur?.label || operation.sourceFinancement }
        ]),

        // Section: Chaîne budgétaire
        renderDetailSection('Chaîne budgétaire', [
          { label: 'Activité', value: operation.chaineBudgetaire?.activite },
          { label: 'Code activité', value: operation.chaineBudgetaire?.activiteCode },
          { label: 'Imputation budgétaire', value: operation.chaineBudgetaire?.ligneBudgetaire },
          { label: 'Bailleur', value: operation.chaineBudgetaire?.bailleur }
        ]),

        // Section: Technique
        renderDetailSection('Technique', [
          { label: 'Délai d\'exécution', value: operation.delaiExecution ? `${operation.delaiExecution} jours` : '-' },
          { label: 'Catégorie prestation', value: categorie?.label || operation.categoriePrestation },
          { label: 'Bénéficiaire', value: operation.beneficiaire },
          { label: 'Livrables', value: operation.livrables?.join(', ') || '-', fullWidth: true }
        ]),

        // Section: Localisation
        renderDetailSection('Localisation géographique', [
          { label: 'Région', value: `${operation.localisation?.region || '-'} (${operation.localisation?.regionCode || ''})` },
          { label: 'Département', value: `${operation.localisation?.departement || '-'} (${operation.localisation?.departementCode || ''})` },
          { label: 'Sous-préfecture', value: `${operation.localisation?.sousPrefecture || '-'} (${operation.localisation?.sousPrefectureCode || ''})` },
          { label: 'Localité', value: operation.localisation?.localite },
          { label: 'Longitude', value: operation.localisation?.longitude },
          { label: 'Latitude', value: operation.localisation?.latitude },
          {
            label: 'Coordonnées GPS',
            value: operation.localisation?.coordsOK
              ? '✅ Validées'
              : '❌ Non renseignées'
          }
        ])
      ]),

      // Footer
      el('div', { className: 'modal-footer' }, [
        createButton('btn btn-secondary', 'Fermer', closeDetailModal),
        createButton('btn btn-primary', '🔍 Voir fiche complète', () => {
          closeDetailModal();
          router.navigate('/mp/fiche-marche', { idOperation: operation.id });
        })
      ])
    ])
  ]);

  const container = document.getElementById('modal-detail-container');
  container.innerHTML = '';
  container.appendChild(modal);

  // Add click handler to overlay for closing
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeDetailModal();
    }
  });

  // Add CSS for modal if not exists
  if (!document.getElementById('modal-styles')) {
    const style = document.createElement('style');
    style.id = 'modal-styles';
    style.textContent = `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
      }
      .modal-content {
        background: #ffffff;
        border-radius: var(--radius-lg);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        width: 100%;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px;
        border-bottom: 1px solid var(--color-gray-200);
      }
      .modal-title {
        font-size: 24px;
        font-weight: 700;
        margin: 0;
      }
      .btn-close {
        background: none;
        border: none;
        font-size: 32px;
        cursor: pointer;
        color: var(--color-gray-500);
        padding: 0;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
      }
      .btn-close:hover {
        background: var(--color-gray-100);
        color: var(--color-gray-700);
      }
      .modal-body {
        padding: 24px;
      }
      .modal-footer {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding: 24px;
        border-top: 1px solid var(--color-gray-200);
      }
      .detail-section {
        margin-bottom: 32px;
      }
      .detail-section:last-child {
        margin-bottom: 0;
      }
      .detail-section-title {
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 16px;
        color: var(--color-primary);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
      }
      .detail-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .detail-field.full-width {
        grid-column: 1 / -1;
      }
      .detail-label {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--color-gray-500);
        letter-spacing: 0.5px;
      }
      .detail-value {
        font-size: 14px;
        font-weight: 500;
        color: var(--color-text);
      }
    `;
    document.head.appendChild(style);
  }
}

function renderDetailSection(title, fields) {
  return el('div', { className: 'detail-section' }, [
    el('div', { className: 'detail-section-title' }, title),
    el('div', { className: 'detail-grid' },
      fields.map(field =>
        el('div', { className: field.fullWidth ? 'detail-field full-width' : 'detail-field' }, [
          el('div', { className: 'detail-label' }, field.label),
          el('div', { className: 'detail-value' }, field.value || '-')
        ])
      )
    )
  ]);
}

function closeDetailModal() {
  const container = document.getElementById('modal-detail-container');
  if (container) {
    container.innerHTML = '';
  }
  selectedOperation = null;
}

// Helpers : un filtre multi-select matche si le tableau est vide (= pas de filtre) OU contient la valeur
function _matchMulti(arr, value) {
  if (!arr || arr.length === 0) return true;
  return arr.includes(value);
}

/**
 * Modif #83 — Options de « Source de financement » dépendantes du « Type
 * financement » sélectionné dans les filtres :
 *   · ÉTAT          → seule source possible = TRÉSOR (bailleur typeFinancement 'ETAT')
 *   · DON / EMPRUNT → bailleurs externes (tout sauf TRÉSOR)
 * Le référentiel BAILLEUR porte `typeFinancement` ('ETAT' pour le Trésor,
 * 'EXTERNE' pour les bailleurs). Sans type sélectionné : toutes les sources.
 */
function getSourceFinancementOptions(registries) {
  const all = registries?.BAILLEUR || [];
  const selTypes = activeFilters.typeFinancement || [];
  if (selTypes.length === 0) return all;
  const allowEtat = selTypes.includes('ETAT');
  const allowExterne = selTypes.some(t => t === 'DON' || t === 'EMPRUNT');
  return all.filter(b => b.typeFinancement === 'ETAT' ? allowEtat : allowExterne);
}

function applyFilters(operations, santeMap = null, registries = null) {
  return operations.filter(op => {
    // Search texte libre
    if (activeFilters.search) {
      const search = activeFilters.search.toLowerCase();
      const matchObjet = op.objet?.toLowerCase().includes(search);
      const matchBenef = op.beneficiaire?.toLowerCase().includes(search);
      const matchLocalite = op.localisation?.localite?.toLowerCase().includes(search);
      const matchActivite = op.chaineBudgetaire?.activiteLib?.toLowerCase().includes(search);
      if (!matchObjet && !matchBenef && !matchLocalite && !matchActivite) return false;
    }

    // Filtres multi-select : array vide = aucune restriction
    if (!_matchMulti(activeFilters.exercice.map(Number), op.exercice)) return false;
    // Type marché : on normalise le code legacy de l'opération vers le nouveau code
    // pour matcher la sélection faite via la liste hiérarchisée — Modif #76 lot 1
    if (!_matchMulti(activeFilters.typeMarche, normalizeTypeMarche(op.typeMarche, registries))) return false;
    if (!_matchMulti(activeFilters.modePassation, op.modePassation)) return false;
    if (!_matchMulti(activeFilters.etat, op.etat)) return false;
    if (!_matchMulti(activeFilters.typeFinancement, op.typeFinancement)) return false;
    if (!_matchMulti(activeFilters.bailleur, op.sourceFinancement)) return false;
    if (!_matchMulti(activeFilters.categoriePrestation, op.categoriePrestation)) return false;
    // Modif #76 lot 1 (1.e) — Nature économique
    // Modif #91 — fallback sur chaineBudgetaire.natureCode (source réelle)
    if (!_matchMulti(activeFilters.natureEco, op.natureEco || op.chaineBudgetaire?.natureCode)) return false;
    if (!_matchMulti(activeFilters.region, op.localisation?.region)) return false;
    if (!_matchMulti(activeFilters.unite, op.unite)) return false;
    if (!_matchMulti(activeFilters.activite, op.chaineBudgetaire?.activiteLib)) return false;

    // Modif #36 — filtre santé : nécessite la map pré-calculée
    if (Array.isArray(activeFilters.sante) && activeFilters.sante.length > 0) {
      const sante = santeMap?.get(op.id);
      if (!sante || !activeFilters.sante.includes(sante)) return false;
    }

    return true;
  });
}

// =====================================================================
// Modif #36 — Tuiles santé agrégées (cliquables) + drawer détail
// =====================================================================

function renderSanteTuiles(parSante, filteredOps, santeMap) {
  return el('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
      gap: '10px',
      marginBottom: '24px'
    }
  }, SANTE_CATEGORIES.map(s => {
    const count = parSante[s.code] || 0;
    const isActive = activeFilters.sante.includes(s.code);
    const isOnlyOneActive = activeFilters.sante.length === 1 && isActive;

    return el('div', {
      style: {
        padding: '12px 14px',
        background: isActive ? s.bg : '#fff',
        border: `2px solid ${isActive ? s.color : '#e5e7eb'}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'transform 0.1s, box-shadow 0.1s',
        position: 'relative'
      },
      title: isActive
        ? `Filtre actif — cliquer pour désactiver`
        : `Cliquer pour filtrer la liste sur "${s.label}"`,
      onclick: () => {
        // Toggle : si déjà actif (et seul actif), on désactive ; sinon on remplace par celui-ci
        if (isOnlyOneActive) {
          activeFilters.sante = [];
        } else {
          activeFilters.sante = [s.code];
        }
        renderPPMList();
      },
      onmouseenter: (e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.08)'; },
      onmouseleave: (e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }
    }, [
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' } }, [
        el('span', { style: { fontSize: '20px' } }, s.icon),
        el('span', { style: { fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.3px' } }, s.label),
        // Modif #37 — Badge formule (icône 📐 cliquable qui explique la règle de classification)
        SANTE_FORMULES[s.code] ? el('span', {
          onclick: (e) => e.stopPropagation()
        }, [renderFormulaBadge(SANTE_FORMULES[s.code])]) : null
      ]),
      el('div', { style: { fontSize: '24px', fontWeight: 700, color: s.color } }, String(count)),
      el('div', {
        style: {
          fontSize: '11px',
          color: '#0066cc',
          textDecoration: 'underline',
          marginTop: '4px'
        },
        onclick: (e) => { e.stopPropagation(); openSanteDrawer(s.code, filteredOps, santeMap); }
      }, count > 0 ? '→ Voir le détail' : '')
    ]);
  }));
}

/**
 * Drawer synthétique : liste les marchés d'une catégorie de santé donnée
 * avec leurs infos clés (objet, montant, état, cumul avenants, exécution).
 */
function openSanteDrawer(santeCode, filteredOps, santeMap) {
  const meta = SANTE_CATEGORIES.find(s => s.code === santeCode);
  const matchingOps = filteredOps.filter(op => santeMap.get(op.id) === santeCode);

  const old = document.getElementById('sante-drawer');
  if (old) old.remove();

  const drawer = el('div', {
    id: 'sante-drawer',
    style: {
      position: 'fixed', top: 0, right: 0, width: 'min(720px, 96vw)', height: '100vh',
      background: '#fff', boxShadow: '-4px 0 16px rgba(0,0,0,0.15)', zIndex: 9999,
      overflowY: 'auto', padding: '24px'
    }
  });

  drawer.appendChild(el('div', {
    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: `2px solid ${meta.color}` }
  }, [
    el('div', {}, [
      el('h2', { style: { margin: 0, fontSize: '20px' } }, `${meta.icon} ${meta.label}`),
      el('div', { style: { color: '#6b7280', fontSize: '13px', marginTop: '4px' } },
        `${matchingOps.length} marché${matchingOps.length > 1 ? 's' : ''} dans cette catégorie (filtres en vigueur appliqués)`)
    ]),
    el('button', { className: 'btn btn-secondary btn-sm', onclick: () => drawer.remove() }, '✕ Fermer')
  ]));

  if (matchingOps.length === 0) {
    drawer.appendChild(el('p', { style: { color: '#6b7280', fontStyle: 'italic', padding: '16px' } },
      'Aucun marché ne correspond à cette catégorie compte tenu des filtres en vigueur.'));
  } else {
    const list = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } });
    matchingOps.forEach(op => {
      const card = el('div', {
        style: {
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '12px 14px',
          cursor: 'pointer',
          background: '#fff',
          transition: 'background 0.1s'
        },
        title: 'Ouvrir la fiche de vie',
        onmouseenter: (e) => e.currentTarget.style.background = '#f9fafb',
        onmouseleave: (e) => e.currentTarget.style.background = '#fff',
        onclick: () => { drawer.remove(); router.navigate('/mp/fiche-marche', { idOperation: op.id }); }
      }, [
        el('div', { style: { display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' } }, [
          el('div', { style: { flex: 1, minWidth: 0 } }, [
            el('div', { style: { fontSize: '11px', color: '#6b7280', fontFamily: 'monospace', marginBottom: '2px' } }, op.id),
            el('div', { style: { fontWeight: 600, fontSize: '13px', marginBottom: '4px' } },
              (op.objet || '(sans objet)').length > 90 ? op.objet.substring(0, 90) + '…' : (op.objet || '(sans objet)')
            ),
            el('div', { style: { fontSize: '11px', color: '#6b7280' } }, [
              op.chaineBudgetaire?.activiteLib || 'Activité non renseignée',
              op.unite ? ` · UA ${op.unite}` : '',
              ` · ${moneyMillions(op.montantPrevisionnel)}`
            ])
          ]),
          el('div', { style: { flexShrink: 0 } }, [
            el('span', { className: `badge badge-${op.etat?.toLowerCase().replace('_', '-')}` }, ETAT_LABEL_MP[op.etat] || op.etat || '?')
          ])
        ])
      ]);
      list.appendChild(card);
    });
    drawer.appendChild(list);
  }

  document.body.appendChild(drawer);
}

function setupFilterListeners() {
  // Seul le champ "Recherche" (texte libre) reste un input DOM classique.
  // Les filtres multi-select sont désormais gérés par le widget
  // renderMultiSelectCollapsible (onChange propage directement vers
  // activeFilters).
  const searchInput = document.getElementById('filter-search');
  let searchTimeout;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      activeFilters.search = e.target.value;
      renderPPMList();
    }, 300);
  });
}

function resetFilters() {
  activeFilters = {
    search: '',
    typeMarche: [],
    modePassation: [],
    etat: [],
    typeFinancement: [],
    bailleur: [],
    categoriePrestation: [],
    region: [],
    exercice: [],
    unite: [],
    activite: [],
    sante: [],
    natureEco: []
  };
  renderPPMList();
}

function exportToCSV(operations) {
  // Modif #77 — Lot 2 : alignement des entêtes CSV sur les nouveaux libellés
  // du tableau. Ajout de « Nature économique » (2.b). Renommages :
  // Objet → Objet / Libellé (2.c), Type Marché → Type de marché (2.d),
  // Bailleur → Source de financement (cohérence lot 1), État → Statut du
  // marché (2.f). Les valeurs restent les codes bruts pour rester
  // exploitables en tableur (cohérent avec le reste de l'export).
  const headers = [
    'Exercice', 'Unité Opérationnelle', 'Objet / Libellé', 'Type de marché', 'Nature économique',
    'Mode Passation', 'Revue', 'Nature Prix', 'Montant Prévisionnel', 'Type Financement',
    'Source de financement', 'Activité', 'Activité Code', 'Ligne Budgétaire', 'Délai Execution',
    'Catégorie Prestation', 'Bénéficiaire', 'Région', 'Département', 'Sous-Préfecture',
    'Localité', 'Longitude', 'Latitude', 'Statut du marché'
  ];

  const rows = operations.map(op => [
    op.exercice || '',
    op.unite || '',
    op.objet || '',
    op.typeMarche || '',
    op.natureEco || '',
    op.modePassation || '',
    op.revue || '',
    op.naturePrix || '',
    op.montantPrevisionnel || 0,
    op.typeFinancement || '',
    op.sourceFinancement || '',
    op.chaineBudgetaire?.activite || '',
    op.chaineBudgetaire?.activiteCode || '',
    op.chaineBudgetaire?.ligneBudgetaire || '',
    op.delaiExecution || op.dureePrevisionnelle || '',
    op.categoriePrestation || '',
    op.beneficiaire || '',
    op.localisation?.region || '',
    op.localisation?.departement || '',
    op.localisation?.sousPrefecture || '',
    op.localisation?.localite || '',
    op.localisation?.longitude || '',
    op.localisation?.latitude || '',
    op.etat || ''
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `ppm_export_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

export default renderPPMList;
