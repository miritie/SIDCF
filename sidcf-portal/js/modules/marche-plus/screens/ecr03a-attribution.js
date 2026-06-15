/**
 * ECR03A - Attribution du Marché
 * Écran complet enrichi avec :
 * - Garanties (avance, bonne exécution, cautionnement)
 * - Réserves CF
 * - Clé de répartition multi-bailleurs
 * - Échéancier de paiement avec livrables
 */

import { el, mount } from '../../../lib/dom.js';
import logger from '../../../lib/logger.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { renderCleRepartitionManager } from '../../../ui/widgets/cle-repartition-manager-mp.js';
import { renderEcheancierManager } from '../../../ui/widgets/echeancier-manager-mp.js';
import {
  isFieldRequired,
  isFieldOptional,
  isFieldHidden,
  getContextualConfig,
  isPrestationIntellectuelle,
  resolveBaseMode
} from '../../../lib/procedure-context.js';
import { getLotData, buildLotPatch, getLotsFromProcedure, resolveCurrentLotId } from '../../../lib/lot-data.js';
import { renderLotSelector } from '../../../ui/widgets/lot-selector.js';
import { checkSanction, checkSanctionsGroupement, renderSanctionBanner, renderGroupementSanctionsBanner, openSanctionsDrawer } from '../../../lib/mp-sanctions.js';
import { loadBanques } from '../../../lib/mp-banques.js';
import { renderMontantPourcentageDualInput } from '../../../ui/widgets/montant-pourcentage-dual-input.js';
import { renderFormulaBadge } from '../../../ui/widgets/formula-tip-mp.js';
import { renderSousTraitantsManager } from '../../../ui/widgets/sous-traitants-manager-mp.js';
import { renderEntreprisePicker } from '../../../ui/widgets/entreprise-picker-mp.js';
import { renderLivrableManagerMP } from '../../../ui/widgets/livrable-manager-mp.js';
import { renderDerogationBanner } from '../../../ui/widgets/derogation-banner-mp.js';
import { wireSpec, updateSpecContext } from '../../../lib/spec-mode-mp.js';
import { renderPageHeaderMP } from '../../../ui/widgets/page-header-mp.js';
import { renderNextPhaseButton } from '../../../ui/widgets/next-phase-button-mp.js';
import { renderDifficultesGatedBloc } from '../../../ui/widgets/difficultes-manager-mp.js';
import { getAllOrganes } from '../../../lib/mp-organes-approbation.js';

// Modif #37 — Formules et règles légales associées aux garanties contractuelles.
// Taux vérifiés sur le texte officiel (Ordonnance 2019-679 — Code MP CI) suite aux
// observations EHOUMAN du 14/06/2026 : l'ancienne infobulle « avance 10 %–15 %, Art. 100 »
// confondait le MONTANT de l'avance et le TAUX de la garantie de restitution — corrigée.
const GARANTIE_FORMULES = {
  avance: {
    titre: 'Avance de démarrage & garantie de restitution (Art. 129-131 & 100 Code MP CI)',
    formule: 'garantie de restitution = 100 % du montant de l\'avance versée',
    regle: 'L\'avance forfaitaire de démarrage ne peut dépasser 15 % du montant initial du marché (Art. 129) ; le cumul des avances forfaitaire + facultative est plafonné à 30 % (Art. 131). La garantie de restitution d\'avance couvre la TOTALITÉ (100 %) du montant de l\'avance versée (Art. 100) — à ne pas confondre avec le montant de l\'avance.',
    exemple: 'Marché 100 M HT, avance forfaitaire 15 % (= 15 M) ⇒ garantie de restitution = 15 M XOF (100 % de l\'avance)',
    reference: 'Art. 129, 131 & 100 — Ordonnance 2019-679'
  },
  bonneExec: {
    titre: 'Garantie de bonne exécution (Art. 97.3 Code MP CI)',
    formule: 'taux × montantMarché(baseCalc) / 100',
    regle: 'Plage légale : 3 % – 5 % du montant initial du marché (± avenants), Art. 97.3. Ne s\'applique pas aux marchés de prestations intellectuelles (Art. 97.1).',
    exemple: 'Marché 200 M HT, BE 5 % ⇒ garantie 10 M XOF',
    reference: 'Art. 97.3 — Ordonnance 2019-679'
  },
  cautionnement: {
    titre: 'Cautionnement',
    formule: 'montant fixe ou pourcentage selon CCAP',
    regle: 'Pas de plage légale standard — défini au cas par cas dans le Cahier des Clauses Administratives Particulières du marché.'
  }
};
import { validateTaux, getLabelContraintes } from '../../../lib/mp-garanties-rules.js';

// Cache local pour éviter de recharger les banques à chaque render
let _banquesCache = null;
async function getBanques() {
  if (!_banquesCache) _banquesCache = await loadBanques();
  return _banquesCache;
}

// État global pour les widgets
let cleRepartitionList = [];
let echeancierData = null;
// Modif #88 (CR 6.b) — Livrables du marché rappelés + ajustables à l'enregistrement.
let _livrablesState = [];
let _livrablesInitialized = false;
// Marché+ multi-lot : lot courant pour cet écran
let currentLotId = null;

// État des co-titulaires (groupement conjoint) — partagé module-level pour persistance UI
const _coTitulairesState = [];

// État des sous-traitants (modif #38.b) — partagé module-level pour persistance UI
// On stocke la liste courante saisie via le widget renderSousTraitantsManager,
// et on la persiste à la sauvegarde dans MP_ATTRIBUTION.sousTraitants.
let _sousTraitantsState = [];

// Modif #43.b — état des pickers entreprise (entreprise sélectionnée pour l'attribuion)
let _attribSimplePick = null;       // SIMPLE → entreprise unique
let _attribMandatairePick = null;   // GROUPEMENT → mandataire

// ============================================
// Modif #43.b — Helpers picker entreprise
// ============================================

/**
 * Reflète les champs d'une entreprise (depuis le picker) vers les inputs cachés
 * mirroirs, pour rester compatible avec le code existant (triggerSanctionCheck,
 * handleSave) qui lit ces inputs au lieu d'un state.
 *
 * @param {string} prefix - 'attr' (entreprise unique) ou 'attr-mandataire'
 * @param {Object|null} entreprise - Objet retourné par le picker, ou null si désélection
 */
function _mirrorEntrepriseToHiddenInputs(prefix, entreprise) {
  const setVal = (id, val) => {
    const elInput = document.getElementById(id);
    if (elInput) elInput.value = val || '';
  };
  setVal(`${prefix}-entreprise-id`,  entreprise?.entrepriseId || '');
  setVal(`${prefix}-raison-sociale`, entreprise?.raisonSociale || '');
  setVal(`${prefix}-ncc`,            entreprise?.ncc || '');
  setVal(`${prefix}-adresse`,        entreprise?.adresse || '');
  setVal(`${prefix}-telephone`,      entreprise?.telephone || '');
  setVal(`${prefix}-email`,          entreprise?.email || '');
}

/**
 * Pré-remplit la section coordonnées bancaires depuis l'entreprise pickée.
 * Reste éditable per-attribution (l'utilisateur peut surcharger).
 */
function _prefillBanqueSection(prefix, entreprise) {
  if (!entreprise) return;
  const b = entreprise.banque || {};
  const c = entreprise.compte || {};

  const banqueSel = document.getElementById(`${prefix}-banque`);
  if (banqueSel) {
    const wanted = b.code || b.libelle || '';
    // Si l'option existe déjà → on la sélectionne. Sinon on la mémorise pour quand
    // populateBanqueSelect aura terminé son chargement async.
    const matching = Array.from(banqueSel.options || []).find(o => o.value === wanted || o.text === wanted);
    if (matching) banqueSel.value = matching.value;
    else banqueSel.dataset.selected = wanted;
  }
  const setVal = (id, val) => {
    const elInput = document.getElementById(id);
    if (elInput && (!elInput.value || elInput.value.trim() === '')) elInput.value = val || '';
  };
  setVal(`${prefix}-banque-agence`,   b.agence);
  setVal(`${prefix}-banque-numero`,   c.numero);
  setVal(`${prefix}-banque-intitule`, c.intitule || entreprise.raisonSociale);

  // Modif #137 (E-13 b) — alimente la liste « Compte bancaire du titulaire ».
  _populateComptesSelect(prefix, entreprise);
}

// Modif #137 (E-13 b) — « tous les comptes du titulaire s'afficheront dans la
// liste déroulante, le chargé d'études sélectionnera simplement le compte qui
// figure dans le marché approuvé ».
//
// On lit `entreprise.comptes[]` quand la base est enrichie (multi-comptes) ;
// sinon on retombe sur le compte legacy unique (banque{} + compte{}). Chaque
// entrée est normalisée vers une forme stable.
function _normalizeCompteEntry(c, i) {
  if (!c) return null;
  return {
    id:            c.id || `cpt-${i}`,
    banqueCode:    c.banqueCode || c.banque?.code || c.code || '',
    banqueLibelle: c.banqueLibelle || c.banque?.libelle || c.libelle || '',
    agence:        c.agence || c.banque?.agence || '',
    numero:        c.numero || c.compte?.numero || '',
    intitule:      c.intitule || c.compte?.intitule || '',
    swift:         c.swift || c.swiftBic || c.compte?.swift || ''
  };
}

function _getComptesOfEntreprise(entreprise) {
  if (!entreprise) return [];
  if (Array.isArray(entreprise.comptes) && entreprise.comptes.length) {
    return entreprise.comptes.map(_normalizeCompteEntry).filter(Boolean);
  }
  const b = entreprise.banque || {};
  const c = entreprise.compte || {};
  if (!b.code && !b.libelle && !c.numero) return []; // aucun compte legacy
  return [_normalizeCompteEntry({
    banqueCode: b.code, banqueLibelle: b.libelle, agence: b.agence,
    numero: c.numero, intitule: c.intitule, swift: c.swift
  }, 0)];
}

// Applique le compte choisi aux champs (Banque / N° / agence / intitulé / SWIFT)
// — ce sont ces champs que handleSave persiste.
function _applyCompteSelection(prefix, compte) {
  if (!compte) return;
  const banqueSel = document.getElementById(`${prefix}-banque`);
  if (banqueSel) {
    const wanted = compte.banqueCode || compte.banqueLibelle || '';
    const matching = Array.from(banqueSel.options || []).find(o => o.value === wanted || o.text === wanted);
    if (matching) banqueSel.value = matching.value;
    else banqueSel.dataset.selected = wanted;
  }
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.value = v || ''; };
  set(`${prefix}-banque-numero`,   compte.numero);
  set(`${prefix}-banque-agence`,   compte.agence);
  set(`${prefix}-banque-intitule`, compte.intitule);
  set(`${prefix}-banque-swift`,    compte.swift);
}

// Remplit le <select> des comptes du titulaire et auto-sélectionne le 1ᵉʳ.
function _populateComptesSelect(prefix, entreprise) {
  const sel = document.getElementById(`${prefix}-compte-select`);
  if (!sel) return;
  const comptes = _getComptesOfEntreprise(entreprise);
  sel._comptes = comptes;
  sel.innerHTML = '';
  if (!comptes.length) {
    sel.appendChild(el('option', { value: '' }, '— Aucun compte enregistré pour ce titulaire —'));
    return;
  }
  comptes.forEach((c, i) => {
    const label = `${c.banqueLibelle || c.banqueCode || 'Banque ?'} — ${c.numero || 'N° non renseigné'}`;
    sel.appendChild(el('option', { value: String(i) }, label));
  });
  sel.value = '0';
  _applyCompteSelection(prefix, comptes[0]);
}

// Modif #69 — Sélection rapide d'entreprise via dropdown (fallback si picker bug)
//
// Au boot de l'écran, on charge toutes les mp_entreprise validées et on les
// injecte dans les <select> #attr-quick-select et #attr-mandataire-quick-select.
// Au choix d'une entreprise, on rappelle les coords + on alimente les hidden
// inputs (comme le ferait le picker) + on déclenche le check sanction.
let _quickPickCache = null;
async function _loadEntreprisesForQuickPick() {
  if (_quickPickCache) return _quickPickCache;
  try {
    const list = await dataService.query(ENTITIES.MP_ENTREPRISE);
    _quickPickCache = (list || [])
      .filter(e => e.actif !== false && e.validationStatus !== 'MERGED')
      .sort((a, b) => (a.raisonSociale || '').localeCompare(b.raisonSociale || ''));
  } catch (err) {
    logger.error('[QuickPick] Erreur chargement entreprises :', err);
    _quickPickCache = [];
  }
  return _quickPickCache;
}

async function setupQuickPickDropdowns() {
  const list = await _loadEntreprisesForQuickPick();
  for (const selId of ['attr-quick-select', 'attr-mandataire-quick-select']) {
    const sel = document.getElementById(selId);
    if (!sel) continue;
    // Préserver la 1ʳᵉ option (placeholder), purger le reste
    const placeholder = sel.querySelector('option');
    sel.innerHTML = '';
    if (placeholder) sel.appendChild(placeholder);
    list.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.id;
      const status = e.validationStatus === 'PENDING' ? ' ⏳' : '';
      opt.textContent = `${e.raisonSociale || '(sans nom)'}${e.ncc ? ' — NCC ' + e.ncc : ''}${status}`;
      sel.appendChild(opt);
    });
  }
}

// Appelée par les <select>#xx-quick-select au onchange — alimente les hidden
// inputs pour le prefix donné et déclenche les vérifications.
function quickPickEntreprise(prefix, entrepriseId) {
  if (!entrepriseId || !_quickPickCache) return;
  const entreprise = _quickPickCache.find(e => e.id === entrepriseId);
  if (!entreprise) return;
  const pickerValue = {
    entrepriseId: entreprise.id,
    raisonSociale: entreprise.raisonSociale || '',
    ncc: entreprise.ncc || '',
    rccm: entreprise.rccm || '',
    adresse: entreprise.adresse || '',
    telephone: entreprise.telephone || '',
    email: entreprise.email || '',
    banque: { ...(entreprise.banque || {}) },
    compte: { ...(entreprise.compte || {}) },
    comptes: Array.isArray(entreprise.comptes) ? entreprise.comptes : undefined, // Modif #137 (E-13 b) — multi-comptes si enrichi
    validationStatus: entreprise.validationStatus || 'VALIDATED'
  };
  // Stocker l'état pour handleSave
  if (prefix === 'attr') _attribSimplePick = pickerValue;
  else if (prefix === 'attr-mandataire') _attribMandatairePick = pickerValue;
  // Mirror hidden inputs + prefill banque + check sanctions
  _mirrorEntrepriseToHiddenInputs(prefix, pickerValue);
  _prefillBanqueSection(prefix, pickerValue);
  triggerSanctionCheck();
  // Feedback visuel : ajouter une petite info au-dessus du picker
  const containerId = prefix === 'attr' ? 'attr-entreprise-simple-picker' : 'attr-mandataire-picker';
  const cont = document.getElementById(containerId);
  if (cont) {
    cont.style.outline = '2px solid #10b981';
    setTimeout(() => { if (cont) cont.style.outline = ''; }, 1500);
  }
  logger.info('[QuickPick] Entreprise sélectionnée :', entreprise.raisonSociale, '(', prefix, ')');
}

// Debounce simple pour la détection sanctions (évite un appel à chaque touche)
let sanctionCheckTimer = null;
function triggerSanctionCheck() {
  clearTimeout(sanctionCheckTimer);
  sanctionCheckTimer = setTimeout(async () => {
    const banner = document.getElementById('attr-sanction-banner');
    if (!banner) return;
    const raisonSociale = (document.getElementById('attr-raison-sociale')?.value || '').trim();
    const ncc = (document.getElementById('attr-ncc')?.value || '').trim();

    // Modif #30 : on collecte aussi les co-titulaires saisis dans le DOM pour la détection groupement.
    // Le toggle est un radio name="attr-type" (SIMPLE | GROUPEMENT).
    const attrTypeRadio = document.querySelector('input[name="attr-type"]:checked');
    const isGroupement = attrTypeRadio?.value === 'GROUPEMENT';

    // Lire les co-titulaires depuis l'état module (frais après readCoTitulaireFromDOM)
    try { for (let i = 0; i < _coTitulairesState.length; i++) readCoTitulaireFromDOM(i); } catch (_e) {}
    const coTitulaires = (isGroupement && Array.isArray(_coTitulairesState))
      ? _coTitulairesState.map(c => ({
          raisonSociale: (c.raisonSociale || '').trim(),
          ncc: (c.ncc || '').trim()
        })).filter(c => c.raisonSociale || c.ncc)
      : [];

    if (!raisonSociale && !ncc && coTitulaires.length === 0) {
      banner.innerHTML = '';
      return;
    }

    banner.innerHTML = '';

    // Cas simple : pas de groupement → ancienne logique (entreprise unique)
    if (!isGroupement) {
      const sanction = await checkSanction({ raisonSociale, ncc });
      if (sanction) {
        const node = renderSanctionBanner(sanction);
        if (node) banner.appendChild(node);
      }
      return;
    }

    // Cas groupement : on scanne mandataire (= les champs principaux) + tous les co-titulaires
    const result = await checkSanctionsGroupement({
      mandataire: { raisonSociale, ncc },
      coTitulaires
    });
    if (result.members && result.members.length > 0) {
      const node = renderGroupementSanctionsBanner(result);
      if (node) banner.appendChild(node);
    }
  }, 300);
}
// Exposer pour usage depuis les onload après mount (cf. fin de renderAttribution)
window.__mpTriggerSanctionCheck = triggerSanctionCheck;

export async function renderAttribution(params) {
  const { idOperation } = params;

  if (!idOperation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'ID marché manquant')
    ]));
    return;
  }

  logger.info('[ECR03A] Chargement écran Attribution', { idOperation });

  try {
    // Charger les données
    const fullData = await dataService.getMpOperationFull(idOperation);
    if (!fullData?.operation) {
      mount('#app', el('div', { className: 'page' }, [
        el('div', { className: 'alert alert-error' }, 'Marché / contrat introuvable')
      ]));
      return;
    }

    const { operation, procedure, attribution } = fullData;
    const registries = dataService.getAllRegistries();

    // Get mode de passation for contextual behavior
    const modePassation = operation.modePassation || 'PSD';

    // Modif #49 — Pousser le contexte vers le mode Spécification pour évaluation
    // dynamique des conditions (visibilité/édition des champs selon mode passation,
    // état du marché, lot courant, etc.). Consommé par spec.dynamic(ctx).
    updateSpecContext({
      ecran: 'ecr03a-attribution',
      idOperation,
      modePassation,
      modeAdmis: operation.modeAdmis || operation.modePassation,
      etatMarche: operation.etat,
      etatLabel: operation.etat,
      typeMarche: operation.typeMarche,
      categorieProcedure: operation.categorieProcedure,
      lotCourant: currentLotId || '(mono-lot)',
      montantPrevisionnel: operation.montantPrevisionnel || 0
    });

    // Marché+ multi-lot : résoudre le lot courant depuis la procédure
    const lots = getLotsFromProcedure(procedure);
    currentLotId = resolveCurrentLotId(lots, params);

    // Charger attribution existante (si elle existe déjà), scopée au lot courant
    const rawAttribution = attribution;
    const existingAttribution = { ...getLotData(rawAttribution, currentLotId) };

    // Modif #153 (V4) — Reconduction de l'attributaire désigné en
    // contractualisation (procedure.lots[lot].attributaire, forme
    // { singleOrGroup, entreprises[] }). On ne pré-remplit que si l'attribution
    // de ce lot n'a pas encore son propre attributaire (ne jamais écraser une
    // saisie d'enregistrement existante).
    {
      const procLot = lots.find(l => l.id === currentLotId) || (currentLotId ? null : lots[0]);
      const dejaSaisi = existingAttribution?.attributaire?.entreprises?.length > 0;
      if (!dejaSaisi && procLot?.attributaire?.entreprises?.length > 0) {
        // Modif #155 — enrichir chaque entreprise reconduite avec sa fiche
        // maître (entrepriseId → comptes bancaires, coordonnées) pour que le
        // sélecteur de comptes (#137) se relie automatiquement. On préserve les
        // valeurs de désignation (raisonSociale/ncc) en cas de divergence.
        const enriched = [];
        for (const e of procLot.attributaire.entreprises) {
          let full = { ...e };
          if (e.entrepriseId) {
            try {
              const master = await dataService.get(ENTITIES.MP_ENTREPRISE, e.entrepriseId);
              if (master) full = { ...master, ...e, entrepriseId: e.entrepriseId };
            } catch (_e) { /* fiche maître indisponible : on garde l'identité reconduite */ }
          }
          enriched.push(full);
        }
        existingAttribution.attributaire = {
          singleOrGroup: procLot.attributaire.singleOrGroup || 'SIMPLE',
          entreprises: enriched
        };
      } else if (!dejaSaisi && !(procLot?.attributaire?.entreprises?.length > 0) && procedure?.attribution?.raisonSociale) {
        // Modif #167 — Modes SANS lots (PSD / gré à gré / entente directe) :
        // l'attributaire est le « Fournisseur (attributaire) » saisi à la
        // contractualisation (procedure.attribution = { raisonSociale, ncc,
        // montantAttribue }). On le reconduit ici en entreprise unique pour que
        // l'agent retrouve l'attributaire à l'enregistrement.
        let full = { raisonSociale: procedure.attribution.raisonSociale, ncc: procedure.attribution.ncc || '' };
        try {
          const list = await dataService.query(ENTITIES.MP_ENTREPRISE);
          const master = (list || []).find(e => e.raisonSociale === procedure.attribution.raisonSociale);
          if (master) full = { ...master, raisonSociale: master.raisonSociale, ncc: master.ncc || procedure.attribution.ncc || '', entrepriseId: master.id };
        } catch (_e) { /* base entreprises indisponible : on garde l'identité reconduite */ }
        existingAttribution.attributaire = { singleOrGroup: 'SIMPLE', entreprises: [full] };
      }
    }

    // Initialiser l'état
    cleRepartitionList = [];
    echeancierData = { periodicite: 'LIBRE', periodiciteJours: null, items: [], total: 0, totalPourcent: 0 };

    // Modif #68 — Header unifié avec badge état marché + breadcrumb
    const pageHeader = renderPageHeaderMP({
      idOperation, operation,
      phaseIcon: '✅', phaseLabel: 'Enregistrement de marché',
      titre: 'Conditions contractuelles du marché'
    });
    wireSpec(pageHeader, {
      id: 'attribution-screen',
      titre: 'Écran Enregistrement de marché (étape 3)',
      objet: 'Saisie et persistance de l\'attribution du marché : titulaire (entreprise simple ou groupement), montants HT/TTC, garanties, sous-traitance, clé de répartition multi-bailleurs et échéancier de paiement.',
      source: 'MP_ATTRIBUTION (entité principale). Liée à MP_OPERATION via operationId. Multi-lot : champ parLot[lotId] pour scoping. Liens vers MP_CLE_REPARTITION, MP_ECHEANCIER, MP_GARANTIE.',
      type: 'Écran formulaire en plusieurs sections',
      conditions: {
        visible: 'Marché à l\'état EN_PROC ou postérieur (timeline contient EN_PROC)',
        editable: 'Tant que le visa CF n\'est pas accordé (etat ≠ VISE, EN_EXEC, CLOS, RESILIE)',
        prerequis: 'Une procédure (ECR02A) doit être saisie au préalable.'
      },
      reglesMetier: [
        'Le mode de passation conditionne la visibilité / obligation des sections : voir lib/procedure-context.js (isFieldHidden, isFieldRequired).',
        'L\'attribution est scopée au lot courant en multi-lot — chaque lot a son propre attributaire, montant, garanties, etc.',
        'Le passage à l\'état ATTRIBUE déclenche l\'apparition de l\'étape Approbation (Visa CF).'
      ],
      actions: [
        'Enregistrer l\'attribution (création ou mise à jour)',
        'Naviguer vers la fiche du marché (← Retour fiche)',
        'Sélecteur de lot (en multi-lot uniquement)'
      ],
      acteurs: 'DCF (saisie / modification) · CF (consultation uniquement, agit via ECR03C)',
      reference: 'Code des Marchés Publics CI · CCAP du marché · Décret n°2021-909',
      dynamic: (ctx) => ({
        modePassation: ctx.modePassation,
        etatMarche: ctx.etatMarche,
        lot: ctx.lotCourant,
        editable: ['VISE','EN_EXEC','CLOS','RESILIE'].includes(ctx.etatMarche) ? '❌ Verrouillé (post-visa)' : '✓ Modifiable'
      })
    });

    const page = el('div', { className: 'page' }, [
      pageHeader,

      // Modif #73 — Rappel dérogation si déclarée à la planification ou à
      // la procédure. Doit rester visible à toutes les étapes aval pour
      // que le CF n'attribue jamais à l'aveugle un dossier dérogatoire.
      renderDerogationBanner(operation),

      // Sélecteur de lot (visible si > 1 lot)
      renderLotSelector({
        lots,
        currentLotId,
        route: '/mp/attribution',
        routeParams: { idOperation }
      }),

      // Alerte contextuelle
      renderContextualAlert(modePassation),

      // Formulaire (scopé au lot courant)
      renderAttributionForm(existingAttribution, operation, registries, modePassation),

      // Actions
      el('div', { className: 'card' }, [
        el('div', { className: 'card-body' }, [
          el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } }, [
            el('button', {
              type: 'button',
              className: 'btn btn-secondary',
              onclick: () => router.navigate('/mp/fiche-marche', { idOperation })
            }, 'Annuler'),
            wireSpec(el('button', {
              type: 'button',
              className: 'btn btn-primary',
              onclick: async () => await handleSave(idOperation, operation, rawAttribution, currentLotId)
            }, (rawAttribution && (currentLotId ? rawAttribution.parLot?.[currentLotId] : true)) ? '💾 Mettre à jour' : '✅ Enregistrer l\'attribution'), {
              id: 'attribution-btn-save',
              titre: 'Bouton Enregistrer l\'attribution',
              objet: 'Persistance de l\'attribution complète : titulaire, montants, garanties, sous-traitance, clé de répartition, échéancier.',
              source: 'Déclenche handleSave() → dataService.add() ou .update() sur MP_ATTRIBUTION. En multi-lot : patch ciblé via buildLotPatch().',
              type: 'Action POST/PUT',
              conditions: {
                visible: 'Toujours visible',
                actif: 'Validation côté client : montant > 0, attributaire renseigné, garanties cohérentes',
                blocage: 'Si etat ∈ {VISE, EN_EXEC, CLOS, RESILIE} : sauvegarde refusée côté API (verrouillage post-visa)'
              },
              reglesMetier: [
                'Création : génère un ID de la forme `ATTR-{idOperation}` et passe l\'état du marché à ATTRIBUE.',
                'Mise à jour : préserve l\'ID existant et n\'écrase pas la décision CF si déjà visée.',
                'En multi-lot : sauvegarde dans parLot[lotId] sans toucher aux autres lots.',
                'Détection des sanctions sur l\'attributaire : si l\'entreprise est listée → alerte bloquante.',
                'Validation des taux de garanties via lib/mp-garanties-rules.js (validateTaux).'
              ],
              actions: [
                'Sauvegarde via dataService',
                'Mise à jour de l\'opération : etat → ATTRIBUE, timeline += ATTR',
                'Navigation automatique vers la fiche du marché en cas de succès'
              ],
              acteurs: 'DCF (déclencheur) · Système (persistance + validation)',
              reference: 'API : POST/PUT /api/entities/MP_ATTRIBUTION (Worker Cloudflare)',
              dynamic: (ctx) => ({
                modeApi: ['VISE','EN_EXEC','CLOS','RESILIE'].includes(ctx.etatMarche) ? '❌ Refusé (post-visa)' : '✓ Autorisé',
                etatApresSauvegarde: ctx.etatMarche === 'EN_PROC' ? 'ATTRIBUE (transition)' : ctx.etatMarche,
                multiLot: ctx.lotCourant && ctx.lotCourant !== '(mono-lot)' ? `Patch lot ${ctx.lotCourant}` : 'Mono-lot — racine'
              })
            })
          ])
        ])
      ])
    ]);

    // Modif #127 (E-2/E-22) — Bloc difficultés (OUI/NON) présent à cette étape.
    page.appendChild(renderDifficultesGatedBloc({ operationId: idOperation, registries, lots: [] }));

    // Modif #69 — Bouton démo « Passer à l'étape suivante »
    page.appendChild(renderNextPhaseButton({ idOperation, operation }));
    mount('#app', page);

    // Initialiser les widgets après montage
    setTimeout(() => initializeWidgets(operation, registries), 100);

    // Modif #69 — Peupler les <select> de sélection rapide d'entreprise
    // (fallback fiable du picker typeahead)
    setTimeout(() => setupQuickPickDropdowns(), 100);

    // Déclencher la détection sanctions sur les valeurs initiales (chargement d'un attributaire existant)
    setTimeout(() => triggerSanctionCheck(), 150);

    // Modif #86 — synchroniser l'affichage des montants (utile si l'exonération
    // de TVA est préchargée : force le recalcul avec taux 0).
    setTimeout(() => { try { calculerMontants(); } catch (_) {} }, 160);

    // Marché+ : remplir les selects banques (entreprise simple + mandataire) en async
    setTimeout(() => {
      populateBanqueSelect('attr-banque');
      populateBanqueSelect('attr-mandataire-banque');
    }, 100);

    // Marché+ : instancier les widgets montant/% pour les 3 garanties
    setTimeout(() => {
      ['soumission', 'avance', 'bonne-exec', 'retenue', 'cautionnement'].forEach(id => initGarantieWidget(id));
    }, 120);

    // Marché+ modif #20 : initialiser la liste des co-titulaires (groupement conjoint)
    // + listener sur le changement de type de groupement (visibilité conditionnelle)
    setTimeout(() => {
      renderCoTitulairesList();
      const typeSelect = document.getElementById('attr-group-type');
      if (typeSelect) typeSelect.addEventListener('change', toggleCoTitulairesVisibility);
      toggleCoTitulairesVisibility();
    }, 130);

  } catch (err) {
    logger.error('[ECR03A] Erreur chargement', err);
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, `❌ Erreur : ${err.message}`)
    ]));
  }
}

/**
 * Alerte contextuelle
 */
function renderContextualAlert(modePassation) {
  const config = getContextualConfig(modePassation, 'attribution');
  if (!config || !config.note) return null;

  // Modif #139 — les sous-types (PI_*, AOO_*) héritent du comportement du mode de base.
  const isPI = isPrestationIntellectuelle(modePassation);
  const isAOO = resolveBaseMode(modePassation) === 'AOO';

  return el('div', { className: 'card', style: { marginBottom: '24px', borderColor: isPI ? '#dc3545' : '#0dcaf0' } }, [
    el('div', { className: 'card-header', style: { background: isPI ? '#f8d7da' : '#cff4fc' } }, [
      el('h3', { className: 'card-title', style: { color: isPI ? '#842029' : '#055160' } }, [
        el('span', {}, isPI ? '⚠️ Procédure PI - Particularités' : isAOO ? '✅ Procédure AOO - Garanties obligatoires' : '📌 Exigences contextuelles')
      ])
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { className: 'alert ' + (isPI ? 'alert-danger' : 'alert-info') }, [
        el('strong', {}, config.note),
        isPI ? el('p', { style: { marginTop: '8px' } }, 'Les champs de garanties et d\'avance seront masqués automatiquement.') : null,
        isAOO ? el('p', { style: { marginTop: '8px' } }, 'Les garanties d\'avance et de bonne exécution sont OBLIGATOIRES pour ce mode.') : null
      ])
    ])
  ]);
}

/**
 * Formulaire d'attribution
 */
function renderAttributionForm(attribution, operation, registries, modePassation) {
  const existingAttr = attribution || {};
  const montantHT = existingAttr.montants?.ht || operation.montantPrevisionnel || 0;
  const montantTTC = existingAttr.montants?.ttc || (montantHT * 1.18);

  return el('div', { style: { display: 'flex', flexDirection: 'column', gap: '24px' } }, [
    // Section Attributaire (NOUVELLE)
    renderAttributaireSection(existingAttr.attributaire || {}, registries),

    // Modif #86 (CR 6.b) — Informations sur le marché approuvé (N°, exonération TVA, durée)
    renderInfosMarcheSection(existingAttr, operation),

    // Modif #130 (E-1/E-9) — Origine de l'approbation (fusion étapes 3 & 4)
    renderApprobationOrigineSection(existingAttr),

    // Section Montants
    renderMontantsSection(montantHT, montantTTC, existingAttr.exonereTVA === true, operation.montantPrevisionnel || 0),

    // Section Garanties (contextuelle) — Marché+ : on passe HT et TTC pour que le widget
    // dual montant/% puisse calculer les pourcentages selon la base choisie par garantie.
    renderGarantiesSection(existingAttr.garanties || {}, modePassation, { ht: montantHT, ttc: montantTTC }),

    // Section Sous-traitance (Marché+ modif #38.b — mail séance 6 mai §5.g)
    renderSousTraitanceSection(existingAttr.sousTraitants || []),

    // Modif #122 (E-19) — Réserves du CF déplacées vers la CONTRACTUALISATION
    // (« à toutes les contractualisations »). Plus rendues ici.
    // Modif #121 (E-19) — Bloc « TVA supportée par l'État » retiré : il était
    // orphelin (aucune persistance) et redondant avec la clé de répartition,
    // qui gère sa propre ligne « TVA État » via son toggle dédié.

    // Section Clé de Répartition
    // Modif #88 (CR 6.b) — Rappel + ajustement des livrables du marché
    renderLivrablesSection(),

    renderCleRepartitionSection(montantHT, montantTTC, operation.livrables || [], registries),

    // Modif #128 (E-21) — Ordonnancement prévu (CP par année).
    // Modif #141 — récap en lecture seule, dérivé de la clé de répartition.
    renderOrdonnancementSection(),

    // Section Échéancier
    renderEcheancierSection(montantTTC, operation.livrables || [], registries)
  ]);
}

/**
 * Section Attributaire
 */
function renderAttributaireSection(attributaire, registries) {
  // Extraire les données existantes
  const singleOrGroup = attributaire.singleOrGroup || 'SIMPLE';
  const existingEntreprises = attributaire.entreprises || [];

  // Pour une entreprise simple, récupérer les infos
  const entrepriseSimple = singleOrGroup === 'SIMPLE' && existingEntreprises.length > 0
    ? existingEntreprises[0]
    : { raisonSociale: '', ncc: '', adresse: '', telephone: '', email: '', coordonneesBancaires: {} };
  // Coordonnées bancaires (peuvent être absentes sur les anciens enregistrements)
  const cbSimple = entrepriseSimple.coordonneesBancaires || {};

  // Mandataire pour le groupement (idem)
  const mandataire = singleOrGroup === 'GROUPEMENT' && existingEntreprises.length > 0
    ? existingEntreprises[0]
    : {};
  const cbMandataire = mandataire.coordonneesBancaires || {};
  // Modif #172 (obs. EHOUMAN 14/06) — dénomination propre du groupement (distincte
  // du mandataire). Stockée sur l'attributaire (attributaire.nomGroupement).
  const nomGroupement = attributaire.nomGroupement || '';
  // Co-titulaires (membres du groupement autres que le mandataire) — uniquement pour CONJOINT
  // Stockés dans le state module-level pour persistance entre re-renders
  const initialCoTitulaires = (singleOrGroup === 'GROUPEMENT' && existingEntreprises.length > 1)
    ? existingEntreprises.slice(1).map(e => ({ ...e }))
    : [];
  _coTitulairesState.length = 0;
  initialCoTitulaires.forEach(c => _coTitulairesState.push(c));

  // Modif #155 — Au montage, si un attributaire est déjà désigné (reconduit de
  // la contractualisation ou édition) et qu'aucune banque n'est encore saisie,
  // on peuple le sélecteur de comptes du titulaire à partir de sa fiche maître
  // (comptes / compte legacy). Le garde « banque vide » évite d'écraser une
  // attribution déjà enregistrée.
  const _hasCompteData = (ent) => !!(ent && ((Array.isArray(ent.comptes) && ent.comptes.length) || ent.compte?.numero || ent.banque?.code || ent.banque?.libelle));
  setTimeout(() => {
    if (singleOrGroup === 'SIMPLE' && _hasCompteData(entrepriseSimple)) {
      const b = document.getElementById('attr-banque');
      if (b && !b.value) _populateComptesSelect('attr', entrepriseSimple);
    } else if (singleOrGroup === 'GROUPEMENT' && _hasCompteData(mandataire)) {
      const b = document.getElementById('attr-mandataire-banque');
      if (b && !b.value) _populateComptesSelect('attr-mandataire', mandataire);
    }
  }, 220);

  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '🏢 Attributaire du marché')
    ]),
    el('div', { className: 'card-body' }, [
      // Type d'attributaire
      el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
        el('label', { className: 'form-label' }, 'Type d\'attributaire'),
        el('div', { style: { display: 'flex', gap: '24px' } }, [
          el('label', { style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } }, [
            el('input', {
              type: 'radio',
              name: 'attr-type',
              value: 'SIMPLE',
              checked: singleOrGroup === 'SIMPLE',
              onchange: () => toggleAttributaireType('SIMPLE')
            }),
            'Entreprise unique'
          ]),
          el('label', { style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } }, [
            el('input', {
              type: 'radio',
              name: 'attr-type',
              value: 'GROUPEMENT',
              checked: singleOrGroup === 'GROUPEMENT',
              onchange: () => toggleAttributaireType('GROUPEMENT')
            }),
            'Groupement d\'entreprises'
          ])
        ])
      ]),

      // Section Entreprise Unique
      el('div', {
        id: 'attr-entreprise-simple',
        style: { display: singleOrGroup === 'SIMPLE' ? 'block' : 'none' }
      }, [
        // Bouton de gestion des sanctions (drawer)
        el('div', { style: { textAlign: 'right', marginBottom: '8px' } }, [
          el('button', {
            type: 'button',
            className: 'btn btn-sm btn-secondary',
            onclick: (e) => { e.preventDefault(); openSanctionsDrawer(); }
          }, '🚫 Gérer la liste des entreprises sanctionnées')
        ]),

        // Modif #43.b + #69 — Picker + dropdown fallback de sélection rapide
        el('label', { className: 'form-label' }, [
          'Identité de l\'attributaire ',
          el('span', { className: 'required' }, '*')
        ]),
        // Modif #69 — Sélection rapide : dropdown direct (fallback)
        el('div', { style: { marginBottom: '8px' } }, [
          el('select', {
            id: 'attr-quick-select',
            className: 'form-input',
            style: { fontSize: '13px' },
            onchange: (ev) => quickPickEntreprise('attr', ev.target.value)
          }, [
            el('option', { value: '' }, '⚡ Sélection rapide — choisir une entreprise déjà enregistrée')
          ])
        ]),
        el('div', { id: 'attr-entreprise-simple-picker', style: { marginBottom: '8px' } },
          renderEntreprisePicker({
            initialValue: entrepriseSimple.entrepriseId ? entrepriseSimple : null,
            onChange: (entreprise) => {
              _attribSimplePick = entreprise;
              _mirrorEntrepriseToHiddenInputs('attr', entreprise);
              _prefillBanqueSection('attr', entreprise);
              triggerSanctionCheck();
            }
          })
        ),
        el('div', { id: 'attr-sanction-banner', style: { marginBottom: '12px' } }),

        // Inputs cachés — mirorrés depuis le picker pour compat avec triggerSanctionCheck + handleSave
        el('input', { type: 'hidden', id: 'attr-entreprise-id', value: entrepriseSimple.entrepriseId || '' }),
        el('input', { type: 'hidden', id: 'attr-raison-sociale', value: entrepriseSimple.raisonSociale || '' }),
        el('input', { type: 'hidden', id: 'attr-ncc', value: entrepriseSimple.ncc || '' }),
        el('input', { type: 'hidden', id: 'attr-adresse', value: entrepriseSimple.adresse || '' }),
        el('input', { type: 'hidden', id: 'attr-telephone', value: entrepriseSimple.telephone || '' }),
        el('input', { type: 'hidden', id: 'attr-email', value: entrepriseSimple.email || '' }),

        // Coordonnées bancaires (Marché+ — modif #18) — éditables per-attribution,
        // pré-remplies au moment de l'autofill du picker.
        renderCoordonneesBancairesSection('attr', cbSimple)
      ]),

      // Section Groupement (simplifié pour l'instant)
      el('div', {
        id: 'attr-groupement',
        style: { display: singleOrGroup === 'GROUPEMENT' ? 'block' : 'none' }
      }, [
        // Modif #172 (obs. EHOUMAN) — l'IDENTITÉ du titulaire (nom du groupement +
        // mandataire) est renseignée AVANT le type de groupement et ses accessoires.
        // 1) Dénomination du groupement
        el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
          el('label', { className: 'form-label' }, [
            'Nom du groupement ',
            el('span', { className: 'required' }, '*')
          ]),
          el('input', {
            type: 'text',
            className: 'form-input',
            id: 'attr-group-nom',
            value: nomGroupement,
            placeholder: 'Dénomination du groupement (ex : Groupement ENTREPRISE A / ENTREPRISE B)'
          })
        ]),

        // 2) Mandataire du groupement (identité) — Modif #43.b + #69 picker + sélection rapide
        el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' } }, [
          el('label', { className: 'form-label', style: { margin: 0 } }, [
            'Mandataire du groupement ',
            el('span', { className: 'required' }, '*')
          ]),
          el('button', {
            type: 'button',
            className: 'btn btn-sm btn-secondary',
            style: { fontSize: '12px', padding: '3px 10px' },
            title: 'Voir la liste des entreprises de référence disponibles',
            onclick: (e) => { e.preventDefault(); openEntreprisesHelpDrawer(); }
          }, '❓ Voir les entreprises disponibles')
        ]),
        // Modif #69 — Sélection rapide : dropdown direct (fallback si picker
        // typeahead bug subtilement). Garantit que la démo passe toujours.
        el('div', { style: { marginBottom: '8px' } }, [
          el('select', {
            id: 'attr-mandataire-quick-select',
            className: 'form-input',
            style: { fontSize: '13px' },
            onchange: (ev) => quickPickEntreprise('attr-mandataire', ev.target.value)
          }, [
            el('option', { value: '' }, '⚡ Sélection rapide — choisir une entreprise déjà enregistrée')
          ])
        ]),
        el('div', { id: 'attr-mandataire-picker', style: { marginBottom: '12px' } },
          renderEntreprisePicker({
            initialValue: mandataire.entrepriseId ? mandataire : null,
            onChange: (entreprise) => {
              _attribMandatairePick = entreprise;
              _mirrorEntrepriseToHiddenInputs('attr-mandataire', entreprise);
              _prefillBanqueSection('attr-mandataire', entreprise);
              triggerSanctionCheck();
            }
          })
        ),

        // Inputs cachés mandataire — mirorrés depuis le picker
        el('input', { type: 'hidden', id: 'attr-mandataire-entreprise-id', value: mandataire.entrepriseId || '' }),
        el('input', { type: 'hidden', id: 'attr-mandataire-raison-sociale', value: mandataire.raisonSociale || '' }),
        el('input', { type: 'hidden', id: 'attr-mandataire-ncc', value: mandataire.ncc || '' }),
        el('input', { type: 'hidden', id: 'attr-mandataire-adresse', value: mandataire.adresse || '' }),
        el('input', { type: 'hidden', id: 'attr-mandataire-telephone', value: mandataire.telephone || '' }),
        el('input', { type: 'hidden', id: 'attr-mandataire-email', value: mandataire.email || '' }),

        // Coordonnées bancaires du mandataire (Marché+ — modif #18) — éditables, pré-remplies à l'autofill.
        renderCoordonneesBancairesSection('attr-mandataire', cbMandataire),

        // 3) Type de groupement et ses accessoires (APRÈS l'identité — obs. EHOUMAN)
        // Modif #63 — Bandeau dynamique selon le type (CONJOINT vs SOLIDAIRE),
        // rechargé par updateGroupTypeBanner() à chaque changement du dropdown.
        el('div', { style: { borderTop: '1px dashed #d1d5db', paddingTop: '16px', marginTop: '16px' } }, [
          el('div', { className: 'form-field', style: { marginBottom: '12px' } }, [
            el('label', { className: 'form-label' }, 'Type de groupement'),
            el('select', { className: 'form-input', id: 'attr-group-type' }, [
              el('option', { value: 'CONJOINT', selected: (mandataire?.groupType || 'CONJOINT') === 'CONJOINT' }, 'Groupement conjoint'),
              el('option', { value: 'SOLIDAIRE', selected: mandataire?.groupType === 'SOLIDAIRE' }, 'Groupement solidaire')
            ])
          ]),
          el('div', { id: 'attr-group-type-banner' })
        ]),

        // Co-titulaires du groupement (Marché+ modif #20) — visible uniquement pour CONJOINT
        // En "solidaire", paiement unique au mandataire, donc pas besoin de coordonnées séparées.
        el('div', {
          id: 'attr-cotitulaires-wrapper',
          style: { marginTop: '16px', display: (mandataire?.groupType === 'SOLIDAIRE') ? 'none' : 'block' }
        }, [
          el('div', { style: { borderTop: '1px dashed #d1d5db', paddingTop: '16px' } }, [
            el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' } }, [
              el('h4', { style: { margin: 0, fontSize: '15px' } }, ['🤝 Membres co-titulaires du groupement']),
              el('button', {
                type: 'button',
                className: 'btn btn-sm btn-primary',
                onclick: (e) => { e.preventDefault(); addCoTitulaire(); }
              }, '+ Ajouter un membre')
            ]),
            el('p', { className: 'text-small text-muted', style: { marginBottom: '12px' } },
              'Pour un groupement conjoint, chaque membre est payé séparément. Saisissez l\'identité ' +
              'et les coordonnées bancaires de chaque co-titulaire (en plus du mandataire ci-dessus).'
            ),
            el('div', { id: 'attr-cotitulaires-list' })
          ])
        ])
      ])
    ])
  ]);
}

/**
 * Toggle entre entreprise unique et groupement
 */
function toggleAttributaireType(type) {
  const simpleDiv = document.getElementById('attr-entreprise-simple');
  const groupDiv = document.getElementById('attr-groupement');

  if (simpleDiv && groupDiv) {
    simpleDiv.style.display = type === 'SIMPLE' ? 'block' : 'none';
    groupDiv.style.display = type === 'GROUPEMENT' ? 'block' : 'none';
  }
}

/**
 * Section Montants
 */
/**
 * Modif #86 (CR 6.b) — Section « Informations sur le marché approuvé ».
 * Regroupe le N° du marché approuvé, l'exonération de TVA (qui pilote le taux
 * TVA de la section Montant) et la durée contractuelle.
 */
function renderInfosMarcheSection(existingAttr, operation) {
  const numero = existingAttr.numeroMarcheApprouve || '';
  const exonere = existingAttr.exonereTVA === true;
  const dureeValeur = existingAttr.dates?.delaiExecution || operation.dureePrevisionnelle || '';
  // Modif #116 (E-14) — unité par défaut « Jours » (sauf valeur déjà enregistrée).
  const dureeUnite = existingAttr.dates?.delaiUnite || 'JOURS';
  // Modif #120 (E-15) — avance de démarrage : forfaitaire + facultative (≤30 % cumulé).
  // Rétro-compat : ancien format booléen → objet { actif, forfaitPct, facultPct }.
  const av = existingAttr.avanceDemarrage;
  const avActif = av === true || (av && typeof av === 'object' && av.actif === true);
  const avForfaitPct = (av && typeof av === 'object' && av.forfaitPct != null) ? av.forfaitPct : 15;
  const avFacultPct  = (av && typeof av === 'object' && av.facultPct  != null) ? av.facultPct  : 0;

  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '📋 Informations sur le Marché/Contrat approuvé')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' } }, [
        // N° du marché approuvé
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'N° du marché approuvé'),
          el('input', {
            type: 'text', className: 'form-input', id: 'attr-numero-marche',
            value: numero, placeholder: 'Ex : 2026/DCF/001'
          })
        ]),
        // Durée contractuelle
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Durée contractuelle'),
          el('div', { style: { display: 'flex', gap: '8px' } }, [
            el('input', {
              type: 'number', className: 'form-input', id: 'attr-duree-valeur',
              value: dureeValeur, min: 0, step: 1, style: { flex: '2' }
            }),
            (() => {
              // .value plutôt que l'attribut `selected` : el() ferait
              // setAttribute('selected', false) qui sélectionne quand même
              // l'option (présence de l'attribut) → la dernière l'emporterait.
              const sel = el('select', { className: 'form-input', id: 'attr-duree-unite', style: { flex: '1' } }, [
                el('option', { value: 'JOURS' }, 'Jours'),
                el('option', { value: 'MOIS' }, 'Mois')
              ]);
              // Modif #116 (E-14) — unité par défaut « Jours » (le client a précisé l'unité en jours).
              sel.value = dureeUnite === 'MOIS' ? 'MOIS' : 'JOURS';
              return sel;
            })()
          ])
        ])
      ]),
      // Modif #118 (E-16) — l'exonération de TVA a été déplacée dans la section
      // « Montant du marché de base » (au plus près du taux/montant qu'elle pilote).
      // Modif #89 (CR 6.b) — Avance de démarrage (toggle + flag ; le calibrage
      // « Décompte 00 » sera honoré à l'étape Exécution).
      el('div', { className: 'form-field', style: { marginTop: '12px' } }, [
        el('label', { style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } }, [
          (() => {
            const cb = el('input', { type: 'checkbox', id: 'attr-avance-demarrage', onchange: () => updateAvancesDisplay() });
            cb.checked = avActif;
            return cb;
          })(),
          el('span', {}, 'Avance de démarrage prévue')
        ]),
        el('small', { className: 'text-muted', style: { display: 'block', marginTop: '4px' } },
          'Si oui, le premier décompte sera calibré en « Décompte 00 » lors de l\'exécution.')
      ]),
      // Modif #120 (E-15) — détail : forfaitaire (≤15 %) + facultative (≤15 %), total ≤ 30 %.
      el('div', { id: 'attr-avances-detail', style: { display: avActif ? 'block' : 'none', marginTop: '8px', padding: '12px', background: 'var(--color-gray-100)', borderRadius: '8px' } }, [
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' } }, [
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Avance forfaitaire (% du marché de base)'),
            el('input', { type: 'number', className: 'form-input', id: 'attr-avance-forfait-pct', value: avForfaitPct, min: 0, max: 15, step: 0.1, oninput: () => updateAvancesDisplay() }),
            el('small', { className: 'text-muted', id: 'attr-avance-forfait-montant', style: { display: 'block', marginTop: '4px' } }, '')
          ]),
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Avance facultative (% du marché de base)'),
            el('input', { type: 'number', className: 'form-input', id: 'attr-avance-facult-pct', value: avFacultPct, min: 0, max: 15, step: 0.1, oninput: () => updateAvancesDisplay() }),
            el('small', { className: 'text-muted', id: 'attr-avance-facult-montant', style: { display: 'block', marginTop: '4px' } }, '')
          ])
        ]),
        el('div', { style: { marginTop: '8px', fontWeight: '600' } }, [
          'Total avance de démarrage : ',
          el('span', { id: 'attr-avance-total' }, '')
        ]),
        el('div', { id: 'attr-avance-alert', style: { display: 'none', marginTop: '8px', padding: '8px 12px', borderRadius: '6px', background: '#fef2f2', color: '#b91c1c', fontSize: '13px' } })
      ])
    ])
  ]);
}

/**
 * Modif #120 (E-15) — Met à jour l'affichage des avances de démarrage :
 * montants (% × montant TTC du marché de base), total, et alerte si le cumul
 * forfaitaire + facultative dépasse 30 %.
 */
function updateAvancesDisplay() {
  const on = document.getElementById('attr-avance-demarrage')?.checked === true;
  const wrap = document.getElementById('attr-avances-detail');
  if (wrap) wrap.style.display = on ? 'block' : 'none';
  if (!on) return;
  const base = parseFloat(document.getElementById('attr-montant-ttc')?.value) || 0;
  const pf = Math.max(0, parseFloat(document.getElementById('attr-avance-forfait-pct')?.value) || 0);
  const pa = Math.max(0, parseFloat(document.getElementById('attr-avance-facult-pct')?.value) || 0);
  const total = pf + pa;
  const setTxt = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  setTxt('attr-avance-forfait-montant', base ? `≈ ${formatMoney(base * pf / 100)}` : '');
  setTxt('attr-avance-facult-montant', base ? `≈ ${formatMoney(base * pa / 100)}` : '');
  setTxt('attr-avance-total', `${total.toFixed(1)} %${base ? ` · ${formatMoney(base * total / 100)}` : ''}`);
  const alertEl = document.getElementById('attr-avance-alert');
  if (alertEl) {
    if (total > 30) {
      alertEl.style.display = 'block';
      alertEl.textContent = `⚠️ Le total des avances de démarrage ne peut excéder 30 % (actuellement ${total.toFixed(1)} %).`;
    } else {
      alertEl.style.display = 'none';
    }
  }
}

/**
 * Modif #130 (E-1/E-9) — Bloc « Origine de l'approbation » : la fusion des
 * étapes 3 & 4. Choix « Marché/Contrat visé CF » vs « Approuvé autre que CF »,
 * qui ouvre les champs correspondants (visa CF, ou autorité approbatrice + acte).
 */
function renderApprobationOrigineSection(existingAttr) {
  const a = existingAttr.approbation || {};
  const origine = a.origine || 'VISE_CF';

  const ff = (label, input) => el('div', { className: 'form-field' }, [el('label', { className: 'form-label' }, label), input]);

  // Modif #171 (obs. EHOUMAN 14/06) — un marché visé CF n'a PAS de « N° de visa CF »
  // ni de « N° d'acte d'approbation » : l'approbation est consignée sur une page du
  // marché. On ne garde que la DATE du visa (le n° du contrat est saisi par ailleurs).
  const visaFields = el('div', { id: 'appr-visa-fields', style: { display: origine === 'VISE_CF' ? 'block' : 'none', marginTop: '12px' } }, [
    el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' } }, [
      ff('Date du visa CF', el('input', { type: 'date', className: 'form-input', id: 'appr-visa-date', value: a.visaDate || '' }))
    ])
  ]);

  // Modif #171 — branche « Approuvé autre que CF » : autorité + date de l'acte
  // (le n° d'acte est retiré pour la même raison — approbation consignée au marché).
  const organeSelect = el('select', { className: 'form-input', id: 'appr-organe' }, [el('option', { value: '' }, '-- Chargement... --')]);
  const autreFields = el('div', { id: 'appr-autre-fields', style: { display: origine === 'AUTRE' ? 'block' : 'none', marginTop: '12px' } }, [
    el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' } }, [
      ff('Autorité approbatrice', organeSelect),
      ff('Date de l\'acte', el('input', { type: 'date', className: 'form-input', id: 'appr-acte-date', value: a.acteDate || '' }))
    ])
  ]);

  // Charger les organes (hors CF) de façon asynchrone.
  getAllOrganes().then(list => {
    organeSelect.innerHTML = '';
    organeSelect.appendChild(el('option', { value: '' }, '-- Sélectionner --'));
    (list || []).filter(o => o.code !== 'CONTROLEUR_FINANCIER').forEach(o => {
      const opt = document.createElement('option'); opt.value = o.code; opt.textContent = o.label; organeSelect.appendChild(opt);
    });
    organeSelect.value = a.organe || '';
  }).catch(() => {});

  const toggle = (val) => {
    visaFields.style.display = val === 'VISE_CF' ? 'block' : 'none';
    autreFields.style.display = val === 'AUTRE' ? 'block' : 'none';
  };
  const radio = (val, label) => el('label', { style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } }, [
    (() => { const r = el('input', { type: 'radio', name: 'appr-origine', value: val, onchange: (e) => { if (e.target.checked) toggle(val); } }); r.checked = (origine === val); return r; })(),
    label
  ]);

  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, "🏛️ Origine de l'approbation"),
      el('p', { style: { margin: '4px 0 0', fontSize: '12px', color: '#6b7280' } },
        'Le marché est enregistré déjà approuvé. Indiquez l\'origine de l\'approbation.')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { style: { display: 'flex', gap: '24px', flexWrap: 'wrap' } }, [
        radio('VISE_CF', 'Marché/Contrat visé CF'),
        radio('AUTRE', 'Approuvé autre que CF')
      ]),
      visaFields,
      autreFields
    ])
  ]);
}

/**
 * Modif #86 — Bascule de l'exonération de TVA : force le taux TVA à 0 (et
 * désactive le champ) quand l'exonération est cochée ; restaure sinon.
 */
function toggleExonerationTVA(checked) {
  const taux = document.getElementById('attr-taux-tva');
  if (!taux) return;
  if (checked) {
    if (taux.value !== '0') taux.dataset.prevTaux = taux.value;
    taux.value = '0';
    taux.disabled = true;
  } else {
    taux.value = taux.dataset.prevTaux || '18';
    taux.disabled = false;
  }
  calculerMontants();
}

function renderMontantsSection(montantHT, montantTTC, exonereTVA = false, montantRef = 0) {
  // Déterminer la base par défaut (HT si disponible, sinon TTC)
  const defaultBase = montantHT > 0 ? 'HT' : 'TTC';
  const defaultMontant = defaultBase === 'HT' ? montantHT : montantTTC;

  // Modif #49 — Spec sur la card Montant (titre + header)
  const sectionCard = el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '💰 Montant du marché de base'),
      el('p', { style: { margin: '4px 0 0', fontSize: '12px', color: '#6b7280' } },
        'Montant arrêté à l\'attribution. Les éventuels avenants viendront se cumuler à ce socle pour former le « Montant total du marché ».')
    ]),
    el('div', { className: 'card-body' }, [
      // Sélection de la base de calcul
      el('div', { style: { marginBottom: '16px' } }, [
        el('label', { className: 'form-label' }, 'Base de calcul'),
        el('div', { style: { display: 'flex', gap: '16px' } }, [
          el('label', { style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } }, [
            el('input', {
              type: 'radio',
              name: 'base-calcul',
              value: 'HT',
              checked: defaultBase === 'HT',
              onchange: () => updateMontantsDisplay()
            }),
            'Montant HT'
          ]),
          el('label', { style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } }, [
            el('input', {
              type: 'radio',
              name: 'base-calcul',
              value: 'TTC',
              checked: defaultBase === 'TTC',
              onchange: () => updateMontantsDisplay()
            }),
            'Montant TTC'
          ])
        ])
      ]),

      // Modif #118 (E-16) — exonération de TVA, au niveau du montant de base.
      el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
        el('label', { style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } }, [
          (() => {
            const cb = el('input', { type: 'checkbox', id: 'attr-exonere-tva' });
            cb.checked = exonereTVA;
            cb.addEventListener('change', (e) => toggleExonerationTVA(e.target.checked));
            return cb;
          })(),
          el('span', {}, 'Marché exonéré de TVA')
        ]),
        el('small', { className: 'text-muted', style: { display: 'block', marginTop: '4px' } },
          'Si coché, le taux de TVA est forcé à 0 % et la TVA du montant devient nulle.')
      ]),

      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' } }, [
        // Montant saisi (HT ou TTC selon la base)
        wireSpec(el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label', id: 'label-montant-base' }, [
            defaultBase === 'HT' ? 'Montant HT (XOF)' : 'Montant TTC (XOF)',
            el('span', { className: 'required' }, '*')
          ]),
          el('input', {
            type: 'number',
            className: 'form-input',
            id: 'attr-montant-base',
            value: defaultMontant,
            required: true,
            min: 0,
            step: 1,
            oninput: () => calculerMontants()
          })
        ]), {
          id: 'attr-montant-base',
          titre: 'Montant base du marché',
          objet: 'Montant principal saisi par l\'agent — HT ou TTC selon le choix du radio button « Base de calcul ». L\'autre valeur est calculée automatiquement.',
          source: 'MP_ATTRIBUTION.montants.ht ou .ttc (selon la base sélectionnée). Stockage simultané dans les hidden inputs attr-montant-ht et attr-montant-ttc.',
          type: 'Number (XOF, entier positif)',
          conditions: {
            visible: 'Toujours',
            editable: 'Avant visa CF uniquement',
            requis: 'Oui (* affiché dans le label)'
          },
          reglesMetier: [
            'Doit être > 0 pour passer l\'attribution à l\'état ATTRIBUE.',
            'Recalcul automatique de l\'autre montant (TTC ↔ HT) sur chaque saisie via la fonction calculerMontants().',
            'Le montant initial pré-rempli vient de MP_OPERATION.montantPrevisionnel (issu du PPM).'
          ],
          formule: 'TTC = HT × (1 + tauxTVA/100) · HT = TTC / (1 + tauxTVA/100)',
          actions: ['Saisie numérique directe (input number)'],
          acteurs: 'DCF',
          reference: 'CCAP §2.3 · Décret budgétaire',
          dynamic: (ctx) => ({
            valeurPPM: ctx.montantPrevisionnel ? `${ctx.montantPrevisionnel.toLocaleString('fr-FR')} XOF` : '0',
            verrouillage: ['VISE','EN_EXEC','CLOS','RESILIE'].includes(ctx.etatMarche) ? '🔒 Lecture seule' : '✓ Modifiable'
          })
        }),

        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Taux TVA (%)'),
          (() => {
            const inp = el('input', {
              type: 'number',
              className: 'form-input',
              id: 'attr-taux-tva',
              value: exonereTVA ? 0 : 18,
              min: 0,
              max: 100,
              step: 0.01,
              oninput: () => calculerMontants()
            });
            // Propriété (et non attribut) : `el()` ferait setAttribute('disabled','false')
            // ce qui désactiverait à tort le champ quand exonereTVA est faux.
            inp.disabled = exonereTVA;
            return inp;
          })(),
          el('small', { className: 'text-muted' },
            exonereTVA ? 'Marché exonéré — TVA à 0 %' : 'Taux standard Côte d\'Ivoire: 18%')
        ]),

        // Montant calculé (TTC ou HT selon la base)
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label', id: 'label-montant-calcule' },
            defaultBase === 'HT' ? 'Montant TTC (XOF)' : 'Montant HT (XOF)'
          ),
          el('input', {
            type: 'text',
            className: 'form-input',
            id: 'attr-montant-calcule',
            value: formatNumber(defaultBase === 'HT' ? montantHT * 1.18 : montantTTC / 1.18),
            disabled: true,
            style: { backgroundColor: '#e9ecef', fontWeight: 'bold' }
          })
        ])
      ]),

      // Résumé des montants
      el('div', { id: 'montants-resume', style: { marginTop: '16px', padding: '12px', backgroundColor: 'var(--color-gray-100)', borderRadius: '8px' } }, [
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' } }, [
          el('div', {}, [
            el('div', { className: 'text-small text-muted' }, 'HT'),
            el('div', { id: 'resume-ht', style: { fontWeight: '600' } }, formatMoney(defaultBase === 'HT' ? defaultMontant : defaultMontant / 1.18))
          ]),
          el('div', {}, [
            el('div', { className: 'text-small text-muted' }, 'TVA (18%)'),
            el('div', { id: 'resume-tva', style: { fontWeight: '600' } }, formatMoney(defaultBase === 'HT' ? defaultMontant * 0.18 : defaultMontant - defaultMontant / 1.18))
          ]),
          el('div', {}, [
            el('div', { className: 'text-small text-muted' }, 'TTC'),
            el('div', { id: 'resume-ttc', style: { fontWeight: '600', color: 'var(--color-primary)' } }, formatMoney(defaultBase === 'HT' ? defaultMontant * 1.18 : defaultMontant))
          ])
        ])
      ]),

      // Modif #87 (CR 6.b) — Alerte d'écart entre le montant du marché approuvé
      // saisi et le montant attribué à la contractualisation (réf. = montant
      // prévisionnel du PPM). Non bloquant : simple avertissement.
      el('div', { id: 'montant-ecart-alert', style: { display: 'none', marginTop: '12px' } }),
      el('input', { type: 'hidden', id: 'attr-montant-ref', value: String(montantRef || 0) }),

      // Champs cachés pour stocker HT et TTC
      el('input', { type: 'hidden', id: 'attr-montant-ht', value: defaultBase === 'HT' ? defaultMontant : (defaultMontant / 1.18).toFixed(0) }),
      el('input', { type: 'hidden', id: 'attr-montant-ttc', value: defaultBase === 'HT' ? (defaultMontant * 1.18).toFixed(0) : defaultMontant })
    ])
  ]);

  // Modif #49 — wireSpec sur la section Montants
  wireSpec(sectionCard, {
    id: 'attribution-section-montants',
    titre: 'Section « Montant du marché de base »',
    objet: 'Saisie du montant arrêté à l\'attribution. Sert de socle au calcul du montant total du marché (= base + cumul des avenants futurs).',
    source: 'MP_ATTRIBUTION.montants = { ht: Number, ttc: Number, confidentiel: Boolean }',
    type: 'Bloc formulaire (3 inputs synchronisés : montant base, taux TVA, montant calculé)',
    conditions: {
      visible: 'Toujours visible sur l\'écran Attribution',
      editable: 'Tant que le marché n\'est pas visé (etat ∉ {VISE, EN_EXEC, CLOS, RESILIE})',
      requis: 'Oui — un montant > 0 est obligatoire pour passer l\'attribution à ATTRIBUE'
    },
    reglesMetier: [
      'L\'agent saisit l\'un des deux (HT ou TTC) et le système calcule l\'autre via le taux TVA.',
      'Le taux TVA par défaut est 18 % (taux standard CI), modifiable jusqu\'à 100 % pour cas particuliers (exonérations, taux réduits).',
      'Les deux champs cachés `attr-montant-ht` et `attr-montant-ttc` sont synchronisés en permanence et lus à la sauvegarde.',
      'Les avenants en exécution se grefferont sur ce socle pour former le « Montant total du marché » — voir ECR04B-Avenant.'
    ],
    formule: 'Si base=HT : TTC = HT × (1 + tauxTVA/100) | Si base=TTC : HT = TTC / (1 + tauxTVA/100)',
    exemple: 'HT 23 600 000 · TVA 18 % ⇒ TTC 27 848 000',
    actions: [
      'Bascule du radio button HT ↔ TTC',
      'Saisie/modification du montant base et du taux',
      'Recalcul automatique à chaque saisie (oninput)'
    ],
    acteurs: 'DCF (saisie)',
    reference: 'Code Général des Impôts CI · Article CCAP §2.3',
    dynamic: (ctx) => ({
      montantInitialPrevu: ctx.montantPrevisionnel ? `${ctx.montantPrevisionnel.toLocaleString('fr-FR')} XOF (issu du PPM)` : 'non renseigné',
      etatMarche: ctx.etatMarche,
      verrouillage: ['VISE','EN_EXEC','CLOS','RESILIE'].includes(ctx.etatMarche) ? '🔒 Lecture seule — visa CF passé' : '✓ Saisie ouverte'
    })
  });

  return sectionCard;
}

/**
 * Format money for display (avec suffixe « XOF »)
 */
function formatMoney(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value) + ' XOF';
}

/**
 * Format nombre seul (sans suffixe) — pour insertion dans un input dont le label porte déjà « (XOF) »
 */
function formatNumber(value) {
  if (value == null || isNaN(value)) return '';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);
}

/**
 * Update montants display when base changes
 */
function updateMontantsDisplay() {
  const base = document.querySelector('input[name="base-calcul"]:checked')?.value || 'HT';
  const labelBase = document.getElementById('label-montant-base');
  const labelCalcule = document.getElementById('label-montant-calcule');

  if (labelBase && labelCalcule) {
    if (base === 'HT') {
      labelBase.innerHTML = 'Montant HT (XOF)<span class="required">*</span>';
      labelCalcule.textContent = 'Montant TTC (XOF)';
    } else {
      labelBase.innerHTML = 'Montant TTC (XOF)<span class="required">*</span>';
      labelCalcule.textContent = 'Montant HT (XOF)';
    }
  }

  calculerMontants();
}

/**
 * Calculer les montants HT/TTC
 */
function calculerMontants() {
  const base = document.querySelector('input[name="base-calcul"]:checked')?.value || 'HT';
  const montantBase = parseFloat(document.getElementById('attr-montant-base')?.value) || 0;
  // Modif #86 — un taux à 0 (exonération) ne doit PAS retomber sur 18 : on
  // distingue « 0 saisi » de « champ vide » via Number.isFinite.
  const rawTaux = parseFloat(document.getElementById('attr-taux-tva')?.value);
  const tauxTVA = Number.isFinite(rawTaux) ? rawTaux : 18;

  let montantHT, montantTTC, montantTVA;

  if (base === 'HT') {
    montantHT = montantBase;
    montantTVA = montantHT * (tauxTVA / 100);
    montantTTC = montantHT + montantTVA;
  } else {
    montantTTC = montantBase;
    montantHT = montantTTC / (1 + tauxTVA / 100);
    montantTVA = montantTTC - montantHT;
  }

  // Update calculated field
  const montantCalcule = document.getElementById('attr-montant-calcule');
  if (montantCalcule) {
    montantCalcule.value = formatNumber(base === 'HT' ? montantTTC : montantHT);
  }

  // Update hidden fields
  document.getElementById('attr-montant-ht').value = montantHT.toFixed(0);
  document.getElementById('attr-montant-ttc').value = montantTTC.toFixed(0);

  // Update resume
  const resumeHT = document.getElementById('resume-ht');
  const resumeTVA = document.getElementById('resume-tva');
  const resumeTTC = document.getElementById('resume-ttc');

  if (resumeHT) resumeHT.textContent = formatMoney(montantHT);
  if (resumeTVA) resumeTVA.textContent = formatMoney(montantTVA);
  if (resumeTTC) resumeTTC.textContent = formatMoney(montantTTC);

  // Modif #87 (CR 6.b) — Contrôle d'écart entre le montant du marché approuvé
  // (montant de base saisi) et le montant attribué à la contractualisation
  // (référence = montant prévisionnel du PPM). Avertissement non bloquant.
  const alertEl = document.getElementById('montant-ecart-alert');
  const ref = parseFloat(document.getElementById('attr-montant-ref')?.value) || 0;
  if (alertEl) {
    const montantApprouve = base === 'HT' ? montantHT : montantTTC;
    const ecart = montantApprouve - ref;
    if (ref > 0 && Math.abs(ecart) >= 1) {
      const pct = (ecart / ref) * 100;
      const hausse = ecart > 0;
      alertEl.style.display = '';
      alertEl.innerHTML = `
        <div style="padding:10px 14px; border-radius:8px; border-left:4px solid ${hausse ? '#dc2626' : '#d97706'};
                    background:${hausse ? '#fef2f2' : '#fffbeb'}; color:#374151; font-size:13px;">
          ⚠️ <strong>Écart détecté</strong> entre le montant du marché approuvé
          (<strong>${formatMoney(montantApprouve)}</strong>) et le montant attribué à la contractualisation
          (<strong>${formatMoney(ref)}</strong>) :
          <strong style="color:${hausse ? '#dc2626' : '#d97706'};">${hausse ? '+' : ''}${formatMoney(ecart)} (${hausse ? '+' : ''}${pct.toFixed(1)} %)</strong>.
          <span style="color:#6b7280;">Vérifiez la cohérence avant validation (avertissement non bloquant).</span>
        </div>`;
    } else {
      alertEl.style.display = 'none';
      alertEl.innerHTML = '';
    }
  }

  // Modif #120 (E-15) — les avances de démarrage (% du marché) suivent le montant.
  try { updateAvancesDisplay(); } catch (_) {}
}

/**
 * Section Garanties (contextuelle)
 */
function renderGarantiesSection(garanties, modePassation, montantsTotaux = { ht: 0, ttc: 0 }) {
  // Pour PI, masquer complètement la section garanties
  if (isFieldHidden('garantieAvance', modePassation, 'attribution') &&
      isFieldHidden('garantieBonneExecution', modePassation, 'attribution')) {
    return el('div', { className: 'card', style: { display: 'none' } });
  }

  // Defaults : on s'assure que baseCalc/saisieMode existent même sur des entités legacy.
  const fillDefaults = (g, defaultMode = 'POURCENTAGE') => ({
    existe: false, montant: 0, baseCalc: 'HT', saisieMode: defaultMode,
    dateEmission: null, dateEcheance: null, docRef: null,
    ...(g || {})
  });
  const garantieSoumission = fillDefaults(garanties.garantieSoumission, 'POURCENTAGE');
  const garantieAvance = fillDefaults(garanties.garantieAvance, 'POURCENTAGE');
  const garantieBonneExec = fillDefaults(garanties.garantieBonneExec, 'POURCENTAGE');
  const retenueGarantie = fillDefaults(garanties.retenueGarantie, 'POURCENTAGE');
  const cautionnement = fillDefaults(garanties.cautionnement, 'MONTANT');
  // Modif #173 (obs. EHOUMAN) — « Autres » : garantie libre saisie par l'agent.
  const autreGarantie = {
    existe: false, libelle: '', montant: 0, baseCalc: 'HT',
    dateEmission: null, dateEcheance: null,
    ...(garanties.autreGarantie || {})
  };

  // Vérifier si les garanties sont obligatoires (AOO)
  const avanceObligatoire = isFieldRequired('garantieAvance', modePassation, 'attribution');
  const bonneExecObligatoire = isFieldRequired('garantieBonneExecution', modePassation, 'attribution');
  // L'exclusion PI s'applique à la bonne exécution ET à la retenue de garantie (Art. 97.1).
  const showBonneExecRetenue = !isFieldHidden('garantieBonneExecution', modePassation, 'attribution');
  const showAvanceSoumission = !isFieldHidden('garantieAvance', modePassation, 'attribution');

  const garantiesVisibles = [];
  const sep = () => { if (garantiesVisibles.length > 0) garantiesVisibles.push(el('hr', { style: { margin: '16px 0', borderColor: '#dee2e6' } })); };

  // Modif #173 — Garantie d'offre / soumission (1 %–1,5 %, Art. 95.2)
  if (showAvanceSoumission) {
    garantiesVisibles.push(
      renderGarantieItem('soumission', 'Garantie d\'offre / soumission', garantieSoumission, false, montantsTotaux, 'soumission')
    );
  }

  // Garantie d'avance de démarrage (si non cachée)
  if (showAvanceSoumission) {
    sep();
    garantiesVisibles.push(
      renderGarantieItem('avance', 'Garantie d\'avance de démarrage' + (avanceObligatoire ? ' *' : ''), garantieAvance, avanceObligatoire, montantsTotaux, 'avance')
    );
  }

  // Garantie de bonne exécution (sauf PI)
  if (showBonneExecRetenue) {
    sep();
    garantiesVisibles.push(
      renderGarantieItem('bonne-exec', 'Garantie de bonne exécution' + (bonneExecObligatoire ? ' *' : ''), garantieBonneExec, bonneExecObligatoire, montantsTotaux, 'bonneExec')
    );
  }

  // Modif #173 — Retenue de garantie (3 %–5 %, Art. 98 — sauf PI)
  if (showBonneExecRetenue) {
    sep();
    garantiesVisibles.push(
      renderGarantieItem('retenue', 'Retenue de garantie', retenueGarantie, false, montantsTotaux, 'retenue')
    );
  }

  // Cautionnement (toujours optionnel)
  sep();
  garantiesVisibles.push(
    renderGarantieItem('cautionnement', 'Cautionnement', cautionnement, false, montantsTotaux, 'cautionnement')
  );

  // Modif #173 — Autre garantie (saisie libre par l'agent)
  sep();
  garantiesVisibles.push(renderAutreGarantieItem(autreGarantie, montantsTotaux));

  const garantiesCard = el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '🔐 Garanties et Cautionnement')
    ]),
    el('div', { className: 'card-body' }, garantiesVisibles)
  ]);

  // Modif #49 — wireSpec sur la section Garanties (exemple-clé du conditionnel
  // par mode de passation : la visibilité et l'obligation changent selon le mode).
  wireSpec(garantiesCard, {
    id: 'attribution-section-garanties',
    titre: 'Section « Garanties et Cautionnement »',
    objet: 'Déclaration des garanties contractuelles applicables au marché : avance, bonne exécution, cautionnement. Encadre les modalités de couverture juridique avant l\'exécution.',
    source: 'MP_ATTRIBUTION.garanties = { garantieAvance, garantieBonneExec, cautionnement }. Chaque sous-objet : { existe, montant, baseCalc(HT|TTC), saisieMode(MONTANT|POURCENTAGE), dateEmission, dateEcheance, docRef }.',
    type: 'Bloc à 3 sous-sections (avance, bonne exécution, cautionnement)',
    conditions: {
      visibilite: 'Conditionnée par le mode de passation — voir lib/procedure-context.js (isFieldHidden).',
      obligation: 'Conditionnée par le mode de passation — voir lib/procedure-context.js (isFieldRequired).',
      regle_pi: 'Si modePassation = PI : section masquée complètement (procédure d\'urgence).',
      regle_aoo: 'Si modePassation = AOO : garantie d\'avance ET bonne exécution OBLIGATOIRES.',
      regle_autres: 'Pour les autres modes : champs présents mais optionnels.'
    },
    reglesMetier: [
      'Avance de démarrage : ≤ 15 % du montant initial (forfaitaire, Art. 129) · ≤ 30 % en cumul forfaitaire + facultative (Art. 131). La garantie de restitution couvre 100 % de l\'avance (Art. 100).',
      'Garantie de bonne exécution : 3 %–5 % du montant du marché (Art. 97.3) — ne concerne pas les prestations intellectuelles (Art. 97.1).',
      'Garantie d\'offre / soumission : 1 %–1,5 % du montant prévisionnel (Art. 95.2). Retenue de garantie : 3 %–5 % de chaque paiement (Art. 98) — sauf PI.',
      'Cautionnement : pas de plage légale standard — défini au cas par cas dans le CCAP du marché.',
      'Les valeurs cochées ici sont une déclaration d\'INTENTION. L\'enregistrement effectif des actes bancaires se fait en ECR04C-Garanties APRÈS le visa CF.',
      'Voir lib/mp-garanties-rules.js → validateTaux() pour la validation des plages (taux vérifiés Ordonnance 2019-679).'
    ],
    formule: 'garantie.montant = montantMarche(baseCalc) × taux / 100',
    exemple: 'Marché 100 M HT · garantie d\'avance 15 % → 15 M XOF (acte bancaire enregistré post-visa CF)',
    actions: [
      'Cocher/décocher chaque garantie (case "existe")',
      'Pour chaque garantie cochée : saisie du taux ou du montant (widget DUAL), base HT/TTC, dates d\'émission/échéance, document justificatif'
    ],
    acteurs: 'DCF (saisie déclarative à l\'attribution) · DCF (enregistrement effectif post-visa via ECR04C) · CF (validation)',
    reference: 'Ordonnance 2019-679 (Code MP CI) — Art. 95.2, 97.3, 98, 100, 129-131 · CCAP du marché',
    dynamic: (ctx) => {
      const mode = ctx.modePassation;
      // Modif #139 — sous-types PI_*/AOO_* rattachés à leur famille.
      const piHidden = isPrestationIntellectuelle(mode);
      const aooObligatoire = resolveBaseMode(mode) === 'AOO';
      return {
        modeCourant: mode,
        visibilite: piHidden ? '❌ Section masquée (mode PI — procédure d\'urgence)' : '✓ Section visible',
        avanceRequise: piHidden ? '— (section masquée)' : (aooObligatoire ? '✓ OBLIGATOIRE (mode AOO)' : 'Optionnelle'),
        bonneExecRequise: piHidden ? '— (section masquée)' : (aooObligatoire ? '✓ OBLIGATOIRE (mode AOO)' : 'Optionnelle'),
        cautionnement: piHidden ? '— (section masquée)' : 'Toujours optionnel (selon CCAP)'
      };
    }
  });

  return garantiesCard;
}

/**
 * Section Sous-traitance (Marché+ modif #38.b)
 * Affiche le gestionnaire des sous-traitants déclarés par l'attributaire.
 */
function renderSousTraitanceSection(initial) {
  _sousTraitantsState = Array.isArray(initial) ? [...initial] : [];
  const host = el('div', { id: 'sous-traitants-host' });
  // Le widget est ajouté après ce render via onMount-style en différé : on doit
  // attendre le mount DOM pour brancher. On utilise un setTimeout(0) pour ça.
  setTimeout(() => {
    const target = document.getElementById('sous-traitants-host');
    if (!target) return;
    target.innerHTML = '';
    target.appendChild(renderSousTraitantsManager({
      sousTraitants: _sousTraitantsState,
      onChange: (list) => { _sousTraitantsState = [...list]; }
    }));
  }, 0);

  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
      el('h3', { className: 'card-title', style: { margin: 0 } }, '🤝 Sous-traitance déclarée'),
      el('span', { style: { fontSize: '11px', color: '#6b7280' } },
        'Plafond légal indicatif 40 % · Code MP CI Art. 130')
    ]),
    el('div', { className: 'card-body' }, [host])
  ]);
}

/**
 * Item de garantie
 */
/**
 * Section Coordonnées bancaires (Marché+ — modif #18)
 * idPrefix : 'attr' (entreprise simple) ou 'attr-mandataire' (mandataire de groupement)
 * Le select banque est rempli en async après le mount via populateBanqueSelect.
 */
// ===== Co-titulaires du groupement conjoint (Marché+ modif #20) =====

function addCoTitulaire() {
  _coTitulairesState.push({
    role: 'COTITULAIRE',
    entrepriseId: null,            // Modif #43.b — lien vers le référentiel mp_entreprise
    raisonSociale: '',
    ncc: '',
    adresse: '',
    telephone: '',
    email: '',
    coordonneesBancaires: { banque: '', agence: '', numeroCompte: '', intituleCompte: '', swiftBic: '' }
  });
  renderCoTitulairesList();
}

function removeCoTitulaire(idx) {
  if (!confirm('Retirer ce membre co-titulaire du groupement ?')) return;
  _coTitulairesState.splice(idx, 1);
  renderCoTitulairesList();
}

function readCoTitulaireFromDOM(idx) {
  // Récupère les valeurs saisies avant un re-render (pour pas perdre la saisie en cours)
  const get = (suffix) => document.getElementById(`attr-cotit-${idx}-${suffix}`)?.value?.trim() || '';
  const m = _coTitulairesState[idx];
  if (!m) return;
  // Modif #43.b — entrepriseId (lien vers référentiel) lu depuis hidden input mirroré du picker
  m.entrepriseId = get('entreprise-id') || null;
  m.raisonSociale = get('raison-sociale');
  m.ncc = get('ncc');
  m.adresse = get('adresse');
  m.telephone = get('telephone');
  m.email = get('email');
  m.coordonneesBancaires = {
    banque: get('banque'),
    agence: get('banque-agence'),
    numeroCompte: get('banque-numero'),
    intituleCompte: get('banque-intitule'),
    swiftBic: get('banque-swift')
  };
}

function renderCoTitulairesList() {
  const host = document.getElementById('attr-cotitulaires-list');
  if (!host) return;
  // Persister les valeurs DOM courantes vers le state avant re-render
  for (let i = 0; i < _coTitulairesState.length; i++) readCoTitulaireFromDOM(i);
  host.innerHTML = '';

  if (_coTitulairesState.length === 0) {
    host.appendChild(el('div', {
      className: 'alert alert-info',
      style: { background: '#f3f4f6', border: '1px dashed #d1d5db', padding: '12px', borderRadius: '6px' }
    }, 'Aucun co-titulaire ajouté pour le moment. Cliquez sur « + Ajouter un membre » pour en ajouter.'));
    return;
  }

  _coTitulairesState.forEach((m, idx) => {
    host.appendChild(renderCoTitulaireCard(m, idx));
  });

  // Initialiser les selects banque des cards co-titulaires (en async)
  setTimeout(() => {
    _coTitulairesState.forEach((_, idx) => populateBanqueSelect(`attr-cotit-${idx}-banque`));
  }, 50);
}

function renderCoTitulaireCard(member, idx) {
  const cb = member.coordonneesBancaires || {};
  return el('div', {
    style: {
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      padding: '14px',
      marginBottom: '12px',
      background: '#fafafa'
    }
  }, [
    // Header card
    el('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px dashed #d1d5db', paddingBottom: '8px' }
    }, [
      el('strong', { style: { color: '#374151' } }, `Membre co-titulaire ${idx + 1}`),
      el('button', {
        type: 'button',
        className: 'btn btn-sm btn-secondary',
        style: { padding: '4px 10px' },
        title: 'Retirer ce membre',
        onclick: (e) => { e.preventDefault(); removeCoTitulaire(idx); }
      }, '✕ Retirer')
    ]),

    // Modif #43.b — Picker entreprise pour ce co-titulaire
    el('label', { className: 'form-label' }, [
      'Identité du co-titulaire ', el('span', { className: 'required' }, '*')
    ]),
    el('div', { style: { marginBottom: '8px' } },
      renderEntreprisePicker({
        initialValue: member.entrepriseId ? member : null,
        onChange: (entreprise) => {
          const setVal = (suffix, val) => {
            const i = document.getElementById(`attr-cotit-${idx}-${suffix}`);
            if (i) i.value = val || '';
          };
          setVal('entreprise-id',  entreprise?.entrepriseId || '');
          setVal('raison-sociale', entreprise?.raisonSociale || '');
          setVal('ncc',            entreprise?.ncc || '');
          setVal('adresse',        entreprise?.adresse || '');
          setVal('telephone',      entreprise?.telephone || '');
          setVal('email',          entreprise?.email || '');
          // Pré-remplit banque + agence sans verrouiller
          if (entreprise) _prefillBanqueSection(`attr-cotit-${idx}`, entreprise);
          // Mise à jour du state immédiate + déclenchement détection sanctions groupement
          _coTitulairesState[idx] = { ..._coTitulairesState[idx], entrepriseId: entreprise?.entrepriseId || null,
            raisonSociale: entreprise?.raisonSociale || '', ncc: entreprise?.ncc || '',
            adresse: entreprise?.adresse || '', telephone: entreprise?.telephone || '', email: entreprise?.email || '' };
          try { window.__mpTriggerSanctionCheck?.(); } catch (_) {}
        }
      })
    ),

    // Inputs cachés — mirorrés depuis le picker pour rester compatibles avec
    // readCoTitulaireFromDOM() + détection sanctions existante.
    el('input', { type: 'hidden', id: `attr-cotit-${idx}-entreprise-id`, value: member.entrepriseId || '' }),
    el('input', { type: 'hidden', id: `attr-cotit-${idx}-raison-sociale`, value: member.raisonSociale || '' }),
    el('input', { type: 'hidden', id: `attr-cotit-${idx}-ncc`, value: member.ncc || '' }),
    el('input', { type: 'hidden', id: `attr-cotit-${idx}-adresse`, value: member.adresse || '' }),
    el('input', { type: 'hidden', id: `attr-cotit-${idx}-telephone`, value: member.telephone || '' }),
    el('input', { type: 'hidden', id: `attr-cotit-${idx}-email`, value: member.email || '' }),

    // Coordonnées bancaires propres au co-titulaire (éditables per-attribution, pré-remplies à l'autofill)
    renderCoordonneesBancairesSection(`attr-cotit-${idx}`, cb)
  ]);
}

function toggleCoTitulairesVisibility() {
  const wrapper = document.getElementById('attr-cotitulaires-wrapper');
  const type = document.getElementById('attr-group-type')?.value || 'CONJOINT';
  if (wrapper) wrapper.style.display = (type === 'SOLIDAIRE') ? 'none' : 'block';
  // Modif #63 — synchroniser le bandeau explicatif avec le type sélectionné
  updateGroupTypeBanner(type);
}

/**
 * Modif #63 — Bandeau dynamique CONJOINT vs SOLIDAIRE.
 * Met en évidence les particularités métier de chaque type de groupement.
 */
function updateGroupTypeBanner(type) {
  const host = document.getElementById('attr-group-type-banner');
  if (!host) return;
  const cfg = type === 'SOLIDAIRE'
    ? {
        bg: '#fef3c7', border: '#f59e0b', color: '#78350f',
        icon: '🤝',
        title: 'Groupement SOLIDAIRE — responsabilité collective',
        body: [
          'Tous les membres du groupement répondent <strong>collectivement et solidairement</strong> de la totalité du marché.',
          'Le <strong>mandataire</strong> représente le groupement vis-à-vis de l\'administration et reçoit l\'intégralité des paiements.',
          'Les <strong>cotitulaires ne sont pas saisis séparément</strong> — un seul interlocuteur juridique et financier.'
        ]
      }
    : {
        bg: '#dbeafe', border: '#3b82f6', color: '#1e40af',
        icon: '👥',
        title: 'Groupement CONJOINT — responsabilité individuelle par lot',
        body: [
          'Chaque membre du groupement est responsable <strong>uniquement de la part qu\'il exécute</strong>.',
          'Le <strong>mandataire</strong> représente le groupement administrativement, mais chaque cotitulaire est payé pour sa part.',
          'Vous devrez <strong>saisir les cotitulaires</strong> ci-dessous, avec leurs coordonnées et leur quote-part.'
        ]
      };

  host.innerHTML = '';
  host.appendChild(el('div', {
    style: {
      padding: '12px 14px',
      borderLeft: `4px solid ${cfg.border}`,
      background: cfg.bg,
      color: cfg.color,
      borderRadius: '6px'
    }
  }, [
    el('div', { style: { display: 'flex', alignItems: 'flex-start', gap: '10px' } }, [
      el('div', { style: { fontSize: '22px', lineHeight: 1 } }, cfg.icon),
      el('div', { style: { flex: 1 } }, [
        el('div', { style: { fontWeight: 700, fontSize: '14px', marginBottom: '6px' } }, cfg.title),
        ...cfg.body.map(t => el('div', { style: { fontSize: '12px', marginBottom: '2px', lineHeight: 1.4 }, innerHTML: '• ' + t }))
      ])
    ])
  ]));
}

/**
 * Modif #63 — Drawer d'aide listant les entreprises de référence disponibles.
 * Permet à l'utilisateur de la maquette de connaître les NCC/raisons sociales
 * fictives pour les démos, avec indication des sanctions éventuelles.
 */
async function openEntreprisesHelpDrawer() {
  // Charger entreprises + résoudre sanctions
  const entreprises = await dataService.query(ENTITIES.MP_ENTREPRISE).catch(() => []);
  const visibles = (entreprises || []).filter(e => e.actif !== false && e.validationStatus !== 'MERGED');
  const enriched = await Promise.all(visibles.map(async e => {
    const sanction = await checkSanction({ ncc: e.ncc, raisonSociale: e.raisonSociale, rccm: e.rccm }).catch(() => null);
    return { ...e, sanction };
  }));
  enriched.sort((a, b) => {
    if (a.sanction && !b.sanction) return -1;
    if (!a.sanction && b.sanction) return 1;
    return (a.raisonSociale || '').localeCompare(b.raisonSociale || '');
  });

  // Construire le drawer
  const overlay = el('div', {
    style: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 10000, display: 'flex', justifyContent: 'flex-end'
    },
    onclick: (e) => { if (e.target === overlay) overlay.remove(); }
  });
  const panel = el('aside', {
    style: {
      width: '640px', maxWidth: '100vw', height: '100%',
      background: '#fff', overflowY: 'auto', boxShadow: '-4px 0 16px rgba(0,0,0,0.2)'
    }
  });
  panel.appendChild(el('div', {
    style: {
      position: 'sticky', top: 0, background: '#4f46e5', color: '#fff',
      padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2
    }
  }, [
    el('div', {}, [
      el('div', { style: { fontSize: '15px', fontWeight: 700 } }, `❓ Entreprises disponibles (${enriched.length})`),
      el('div', { style: { fontSize: '11px', opacity: 0.9, marginTop: '2px' } },
        'Copiez un NCC ou une raison sociale dans le picker mandataire pour rappeler la fiche.')
    ]),
    el('button', {
      style: { background: 'rgba(255,255,255,0.2)', border: 0, color: '#fff', fontSize: '18px', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer' },
      onclick: () => overlay.remove()
    }, '✕')
  ]));

  const body = el('div', { style: { padding: '14px 18px' } });
  if (enriched.length === 0) {
    body.appendChild(el('p', { className: 'text-muted', style: { fontStyle: 'italic' } }, 'Aucune entreprise disponible.'));
  } else {
    const table = el('table', { style: { width: '100%', fontSize: '12px', borderCollapse: 'collapse' } });
    table.appendChild(el('thead', {}, [
      el('tr', { style: { borderBottom: '2px solid #e5e7eb', background: '#f9fafb' } }, [
        el('th', { style: { padding: '6px 8px', textAlign: 'left' } }, 'Raison sociale'),
        el('th', { style: { padding: '6px 8px', textAlign: 'left' } }, 'NCC'),
        el('th', { style: { padding: '6px 8px', textAlign: 'left' } }, 'Sanction'),
        el('th', { style: { padding: '6px 8px', textAlign: 'left' } }, '')
      ])
    ]));
    const tbody = el('tbody', {});
    enriched.forEach(e => {
      const isSanc = !!e.sanction;
      tbody.appendChild(el('tr', { style: { borderBottom: '1px solid #f3f4f6', background: isSanc ? '#fef2f2' : 'transparent' } }, [
        el('td', { style: { padding: '6px 8px', fontWeight: 600 } }, e.raisonSociale || '—'),
        el('td', { style: { padding: '6px 8px', fontFamily: 'monospace', fontSize: '11px' } }, e.ncc || '—'),
        el('td', { style: { padding: '6px 8px' } }, isSanc
          ? el('span', { style: { background: '#dc2626', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 600 } }, '🚫 SANCTIONNÉE')
          : el('span', { style: { color: '#16a34a', fontSize: '11px' } }, '✓ OK')),
        el('td', { style: { padding: '6px 8px' } }, [
          el('button', {
            style: { background: '#6366f1', color: '#fff', border: 0, padding: '3px 8px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' },
            title: 'Copier le NCC dans le presse-papier',
            onclick: () => {
              if (e.ncc) {
                navigator.clipboard?.writeText(e.ncc).then(() => {
                  // Feedback visuel discret
                  const btn = event?.target;
                  if (btn) {
                    const old = btn.textContent;
                    btn.textContent = '✓';
                    setTimeout(() => { btn.textContent = old; }, 800);
                  }
                });
              }
            }
          }, '📋 NCC')
        ])
      ]));
    });
    table.appendChild(tbody);
    body.appendChild(table);
    body.appendChild(el('p', { style: { marginTop: '12px', fontSize: '11px', color: '#6b7280', fontStyle: 'italic' } },
      'Astuce : tapez les premières lettres de la raison sociale ou du NCC dans le picker mandataire — le système propose les entreprises correspondantes.'));
  }
  panel.appendChild(body);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}

function renderCoordonneesBancairesSection(idPrefix, cb) {
  const data = cb || {};
  return el('div', {
    style: {
      marginTop: '20px',
      paddingTop: '16px',
      borderTop: '1px dashed #d1d5db'
    }
  }, [
    el('h4', {
      style: { margin: '0 0 12px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }
    }, ['🏦 Coordonnées bancaires']),
    // Modif #119 (E-13 a) — « juste le compte bancaire suffirait » : Banque + N°
    // visibles ; agence / intitulé / SWIFT repliés (non nécessaires à l'affichage).
    // Modif #137 (E-13 b) — sélection du compte parmi TOUS les comptes du titulaire.
    el('p', { className: 'text-small text-muted', style: { marginBottom: '12px' } },
      'Sélectionnez le compte du titulaire rattaché au marché. Les détails (banque, n°…) se renseignent automatiquement.'),

    // Modif #137 (E-13 b) — liste déroulante des comptes du titulaire.
    el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
      el('label', { className: 'form-label' }, 'Compte bancaire du titulaire'),
      el('select', {
        className: 'form-input',
        id: `${idPrefix}-compte-select`,
        onchange: (e) => {
          const compte = (e.target._comptes || [])[Number(e.target.value)];
          _applyCompteSelection(idPrefix, compte);
        }
      }, [ el('option', { value: '' }, '— Sélectionnez d\'abord le titulaire —') ]),
      el('small', { className: 'text-muted', style: { fontSize: '11px' } },
        'Tous les comptes du titulaire enregistrés dans la base SIDCF apparaissent ici ; choisissez celui qui figure dans le marché approuvé.')
    ]),

    el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' } }, [
      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'Banque'),
        // Select rempli après mount via populateBanqueSelect()
        el('select', {
          className: 'form-input',
          id: `${idPrefix}-banque`,
          'data-selected': data.banque || ''
        }, [
          el('option', { value: '' }, '-- Chargement... --')
        ])
      ]),
      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'N° de compte (RIB / IBAN)'),
        el('input', {
          type: 'text',
          className: 'form-input',
          id: `${idPrefix}-banque-numero`,
          value: data.numeroCompte || '',
          placeholder: 'Ex: CI05 BICI 01040 0011 4555 0048 7'
        })
      ])
    ]),

    // Détails repliés (non nécessaires à l'affichage) — conservés pour la persistance.
    el('details', { style: { marginTop: '12px' } }, [
      el('summary', { style: { cursor: 'pointer', fontSize: '13px', color: '#6b7280' } },
        'Détails du compte (agence, intitulé, SWIFT) — optionnel'),
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '12px' } }, [
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Agence'),
          el('input', {
            type: 'text', className: 'form-input', id: `${idPrefix}-banque-agence`,
            value: data.agence || '', placeholder: 'Plateau, Cocody, etc.'
          })
        ]),
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Intitulé du compte'),
          el('input', {
            type: 'text', className: 'form-input', id: `${idPrefix}-banque-intitule`,
            value: data.intituleCompte || '', placeholder: 'Si différent de la raison sociale'
          })
        ]),
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'SWIFT / BIC'),
          el('input', {
            type: 'text', className: 'form-input', id: `${idPrefix}-banque-swift`,
            value: data.swiftBic || '', placeholder: 'BICIIVCIA, SGCIIVCI, ...'
          })
        ])
      ])
    ])
  ]);
}

// API des widgets garanties (montant/%) — clé : id ('avance', 'bonne-exec', 'cautionnement')
const _garantieWidgetApis = {};

function initGarantieWidget(id) {
  const host = document.getElementById(`garantie-${id}-montant-host`);
  if (!host) return;
  const initMontant = parseFloat(host.dataset.initMontant) || 0;
  const initMode = host.dataset.initMode || 'POURCENTAGE';
  const initBaseCalc = host.dataset.initBaseCalc === 'TTC' ? 'TTC' : 'HT';
  const totalHT = parseFloat(host.dataset.totalHt) || 0;
  const totalTTC = parseFloat(host.dataset.totalTtc) || 0;
  const regleType = host.dataset.regleType || null;

  let currentBaseCalc = initBaseCalc;
  const currentTotal = () => (currentBaseCalc === 'TTC' ? totalTTC : totalHT);

  const widget = renderMontantPourcentageDualInput({
    idPrefix: `garantie-${id}`,
    total: currentTotal(),
    value: initMontant,
    mode: initMode,
    onChange: (montant /* mode */) => {
      // Le warning de seuil s'évalue toujours en % sur la base courante.
      updateGarantieWarning(id, montant, currentTotal(), regleType);
    }
  });
  host.innerHTML = '';
  host.appendChild(widget);
  _garantieWidgetApis[id] = widget._mpDual;

  // Brancher le sélecteur de base sur le widget
  const baseSelect = document.getElementById(`garantie-${id}-base-calc`);
  if (baseSelect) {
    baseSelect.addEventListener('change', () => {
      currentBaseCalc = baseSelect.value === 'TTC' ? 'TTC' : 'HT';
      widget._mpDual.setTotal(currentTotal());
      const m = widget._mpDual.getMontant();
      updateGarantieWarning(id, m, currentTotal(), regleType);
    });
  }

  // Premier calcul du warning
  updateGarantieWarning(id, initMontant, currentTotal(), regleType);
}

function updateGarantieWarning(id, montant, total, regleType) {
  const warnHost = document.getElementById(`garantie-${id}-warning`);
  if (!warnHost) return;
  warnHost.innerHTML = '';
  if (!regleType || total <= 0 || montant <= 0) return;

  const taux = (montant / total) * 100;
  const v = validateTaux(regleType, taux);
  if (v.severity === 'warning') {
    const banner = el('div', {
      style: {
        padding: '6px 10px',
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderLeft: '3px solid #f59e0b',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#92400e'
      }
    }, v.message);
    warnHost.appendChild(banner);
  } else if (v.severity === 'ok' && v.tauxMin != null) {
    const banner = el('div', {
      style: {
        padding: '4px 8px',
        fontSize: '11px',
        color: '#16a34a'
      }
    }, `✓ ${v.message}`);
    warnHost.appendChild(banner);
  }
}

/**
 * Remplit un <select> banque en async après le mount.
 */
async function populateBanqueSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const banques = await getBanques();
  const selected = sel.getAttribute('data-selected') || '';
  sel.innerHTML = '';
  const opt0 = document.createElement('option');
  opt0.value = ''; opt0.textContent = '-- Sélectionner --';
  sel.appendChild(opt0);
  banques.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.code;
    opt.textContent = b.label;
    if (b.code === selected) opt.selected = true;
    sel.appendChild(opt);
  });
}

function renderGarantieItem(id, label, garantie, required = false, montantsTotaux = { ht: 0, ttc: 0 }, regleType = null) {
  // Par défaut décoché, sauf si existe=true dans les données
  const isChecked = garantie.existe === true;
  const contraintes = regleType ? getLabelContraintes(regleType) : '';
  const totalsHT = Number(montantsTotaux?.ht) || 0;
  const totalsTTC = Number(montantsTotaux?.ttc) || 0;
  const initBaseCalc = garantie.baseCalc === 'TTC' ? 'TTC' : 'HT';

  return el('div', { style: { marginBottom: '16px' } }, [
    el('div', { style: { marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }, [
      el('label', { className: 'form-label', style: { display: 'flex', alignItems: 'center', gap: '8px', margin: 0 } }, [
        el('input', {
          type: 'checkbox',
          id: `garantie-${id}-existe`,
          checked: isChecked,
          onchange: (e) => {
            const detailsDiv = document.getElementById(`garantie-${id}-details`);
            if (detailsDiv) {
              detailsDiv.style.display = e.target.checked ? 'grid' : 'none';
            }
          }
        }),
        el('span', { style: { fontWeight: 'bold' } }, label)
      ]),
      // Badge contraintes légales (à droite du titre) — modif #37 enrichi avec formula badge
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, [
        contraintes ? el('span', {
          style: {
            fontSize: '11px',
            fontWeight: '600',
            padding: '3px 8px',
            borderRadius: '12px',
            background: '#dbeafe',
            color: '#1e40af',
            border: '1px solid #93c5fd'
          }
        }, `📐 ${contraintes}`) : null,
        // Badge formule détaillé (cliquable)
        regleType && GARANTIE_FORMULES[regleType]
          ? renderFormulaBadge(GARANTIE_FORMULES[regleType])
          : null
      ])
    ]),

    el('div', {
      id: `garantie-${id}-details`,
      style: {
        display: isChecked ? 'grid' : 'none',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        paddingLeft: '24px'
      }
    }, [
      // Colonne 1 : Base de calcul + widget dual montant/%
      el('div', { className: 'form-field', style: { gridColumn: 'span 2' } }, [
        el('label', { className: 'form-label' }, 'Base de calcul'),
        el('select', { className: 'form-input', id: `garantie-${id}-base-calc` }, [
          el('option', { value: 'HT', selected: initBaseCalc === 'HT' }, 'HT'),
          el('option', { value: 'TTC', selected: initBaseCalc === 'TTC' }, 'TTC')
        ]),
        el('label', { className: 'form-label', style: { marginTop: '8px' } }, 'Montant et %'),
        // Host pour le widget DUAL — instancié après mount via initGarantieWidget
        el('div', {
          id: `garantie-${id}-montant-host`,
          'data-init-montant': String(garantie.montant || 0),
          'data-init-mode': garantie.saisieMode || 'POURCENTAGE',
          'data-init-base-calc': initBaseCalc,
          'data-total-ht': String(totalsHT),
          'data-total-ttc': String(totalsTTC),
          'data-regle-type': regleType || ''
        }),
        // Bandeau warning (caché par défaut, alimenté par le listener du widget)
        el('div', { id: `garantie-${id}-warning`, style: { marginTop: '4px' } })
      ]),

      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'Date émission'),
        el('input', {
          type: 'date',
          className: 'form-input',
          id: `garantie-${id}-emission`,
          value: garantie.dateEmission || ''
        })
      ]),

      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'Date échéance'),
        el('input', {
          type: 'date',
          className: 'form-input',
          id: `garantie-${id}-echeance`,
          value: garantie.dateEcheance || ''
        })
      ]),

      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'Document'),
        el('input', {
          type: 'file',
          className: 'form-input',
          id: `garantie-${id}-doc`,
          accept: '.pdf,.doc,.docx'
        }),
        garantie.docRef ? el('small', { className: 'text-muted' }, `✓ ${garantie.docRef}`) : null
      ])
    ])
  ]);
}

/**
 * Modif #173 (obs. EHOUMAN) — « Autre garantie » : ligne libre permettant à l'agent
 * d'enregistrer une garantie qui se présente, hors barème légal (selon CCAP).
 */
function renderAutreGarantieItem(garantie, _montantsTotaux = { ht: 0, ttc: 0 }) {
  const isChecked = garantie.existe === true;
  return el('div', { style: { marginBottom: '16px' } }, [
    el('div', { style: { marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }, [
      el('label', { className: 'form-label', style: { display: 'flex', alignItems: 'center', gap: '8px', margin: 0 } }, [
        el('input', {
          type: 'checkbox',
          id: 'garantie-autre-existe',
          checked: isChecked,
          onchange: (e) => {
            const d = document.getElementById('garantie-autre-details');
            if (d) d.style.display = e.target.checked ? 'grid' : 'none';
          }
        }),
        el('span', { style: { fontWeight: 'bold' } }, 'Autre garantie')
      ]),
      el('span', { style: { fontSize: '11px', color: '#6b7280' } }, 'Saisie libre — selon CCAP')
    ]),
    el('div', {
      id: 'garantie-autre-details',
      style: { display: isChecked ? 'grid' : 'none', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', paddingLeft: '24px' }
    }, [
      el('div', { className: 'form-field', style: { gridColumn: 'span 2' } }, [
        el('label', { className: 'form-label' }, 'Libellé de la garantie'),
        el('input', { type: 'text', className: 'form-input', id: 'garantie-autre-libelle', value: garantie.libelle || '', placeholder: 'Ex : garantie spéciale prévue au CCAP…' })
      ]),
      el('div', { className: 'form-field', style: { gridColumn: 'span 2' } }, [
        el('label', { className: 'form-label' }, 'Montant (XOF)'),
        el('input', { type: 'number', className: 'form-input', id: 'garantie-autre-montant', value: String(garantie.montant || 0), min: '0', step: '1' })
      ]),
      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'Date émission'),
        el('input', { type: 'date', className: 'form-input', id: 'garantie-autre-emission', value: garantie.dateEmission || '' })
      ]),
      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'Date échéance'),
        el('input', { type: 'date', className: 'form-input', id: 'garantie-autre-echeance', value: garantie.dateEcheance || '' })
      ])
    ])
  ]);
}

/**
 * Section Réserves CF
 */
// Modif #64 — Liste indicative des types de réserves standards du CF.
// La VRAIE liste sera fournie par la DCF et chargée depuis un référentiel
// configurable (`registries.TYPE_RESERVE_CF`) — cette liste fictive sert pour
// la maquette de démonstration. Aligné sur les pratiques courantes DCF CI.
const TYPES_RESERVE_CF_FICTIFS = [
  { code: 'AUCUNE_RESERVE',          label: 'AUCUNE RÉSERVE — Dossier conforme' },
  { code: 'DOCUMENT_MANQUANT',       label: 'Document manquant (pièce justificative absente)' },
  { code: 'PIECES_INCOMPLETES',      label: 'Pièces administratives incomplètes (plusieurs)' },
  { code: 'PROCEDURE_NON_CONFORME',  label: 'Procédure non conforme au seuil de montant' },
  { code: 'DEROGATION_NON_JUSTIFIEE',label: 'Dérogation invoquée sans pièce justificative' },
  { code: 'ENVELOPPE_INSUFFISANTE',  label: 'Disponibilité budgétaire insuffisante' },
  { code: 'MONTANT_DEPASSE',         label: 'Montant supérieur au plafond autorisé' },
  { code: 'ATTRIBUTAIRE_SANCTIONNE', label: 'Attributaire figure sur liste de sanctions' },
  { code: 'PV_NON_CONFORME',         label: 'PV d\'ouverture ou d\'attribution non conforme' },
  { code: 'DELAI_NON_RESPECTE',      label: 'Délai de publication ou d\'analyse non respecté' },
  { code: 'GARANTIES_NON_CONFORMES', label: 'Taux ou montant de garantie hors plage légale' },
  { code: 'TVA_INCOHERENT',          label: 'Calcul TVA / base HT-TTC erroné' },
  { code: 'CLE_REPARTITION_INVALIDE',label: 'Clé de répartition multi-bailleurs incohérente' },
  { code: 'ECHEANCIER_INCOMPLET',    label: 'Échéancier non total à 100 %' },
  { code: 'CHAINE_BUDGETAIRE_INVALIDE', label: 'Chaîne budgétaire (activité/nature) incohérente' },
  { code: 'AUTRE',                   label: 'Autre motif (à préciser dans le commentaire)' }
];

function renderReservesCFSection(decisionCF) {
  // Par défaut décoché, sauf si aReserves=true dans les données
  const aReserves = decisionCF.aReserves === true;

  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '⚠️ Réserves du Contrôleur Financier')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
        el('label', { className: 'form-label', style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
          el('input', {
            type: 'checkbox',
            id: 'cf-a-reserves',
            checked: aReserves,
            onchange: (e) => {
              const detailsDiv = document.getElementById('cf-reserves-details');
              if (detailsDiv) {
                detailsDiv.style.display = e.target.checked ? 'block' : 'none';
              }
            }
          }),
          el('span', {}, 'Le CF a émis des réserves')
        ])
      ]),

      el('div', {
        id: 'cf-reserves-details',
        style: {
          display: aReserves ? 'block' : 'none',
          padding: '16px',
          backgroundColor: '#fff3cd',
          borderRadius: '4px'
        }
      }, [
        // Modif #64 — Note explicite : liste fictive pour la maquette
        el('div', {
          style: {
            padding: '8px 10px',
            background: 'rgba(245,158,11,0.15)',
            borderLeft: '3px solid #f59e0b',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#78350f',
            marginBottom: '12px',
            fontStyle: 'italic'
          }
        }, '💡 Liste fictive pour la maquette. Les vrais types de réserves CF seront configurables côté administration (référentiel TYPE_RESERVE_CF) — la liste validée et partagée par la DCF remplacera celle-ci.'),

        el('div', { className: 'form-field', style: { marginBottom: '12px' } }, [
          el('label', { className: 'form-label' }, 'Type de réserve'),
          el('select', {
            className: 'form-input',
            id: 'cf-type-reserve'
          }, [
            el('option', { value: '' }, '-- Sélectionner --'),
            ...TYPES_RESERVE_CF_FICTIFS.map(t =>
              el('option', { value: t.code, selected: t.code === decisionCF.typeReserve }, t.label)
            )
          ])
        ]),

        el('div', { className: 'form-field', style: { marginTop: '12px' } }, [
          el('label', { className: 'form-label' }, 'Commentaire'),
          el('textarea', {
            className: 'form-input',
            id: 'cf-commentaire',
            rows: 2,
            placeholder: 'Commentaires additionnels — détaillez la nature de la réserve, les pièces attendues, etc.'
          }, decisionCF.commentaire || '')
        ])
      ])
    ])
  ]);
}

/**
 * Section TVA supportée par l'État
 */
function renderTVASection(tvaEtat) {
  // Par défaut décoché, sauf si supporte=true dans les données
  const supporte = tvaEtat.supporte === true;

  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '💵 TVA supportée par l\'État')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
        el('label', { className: 'form-label', style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
          el('input', {
            type: 'checkbox',
            id: 'tva-etat-supporte',
            checked: supporte,
            onchange: (e) => {
              const detailsDiv = document.getElementById('tva-etat-details');
              if (detailsDiv) {
                detailsDiv.style.display = e.target.checked ? 'block' : 'none';
              }
            }
          }),
          el('span', {}, 'L\'État supporte la TVA (18%)')
        ])
      ]),

      el('div', {
        id: 'tva-etat-details',
        style: {
          display: supporte ? 'block' : 'none',
          padding: '16px',
          backgroundColor: '#d1ecf1',
          borderRadius: '4px'
        }
      }, [
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' } }, [
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Montant TVA supporté (XOF)'),
            el('input', {
              type: 'number',
              className: 'form-input',
              id: 'tva-etat-montant',
              value: tvaEtat.montant || '',
              min: 0,
              step: 0.01,
              placeholder: 'Calculé automatiquement ou saisir manuellement'
            })
          ]),

          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Référence décision'),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'tva-etat-reference',
              value: tvaEtat.reference || '',
              placeholder: 'Ex: Décision N°2024-XXX'
            })
          ])
        ]),

        el('div', { className: 'form-field', style: { marginTop: '12px' } }, [
          el('label', { className: 'form-label' }, 'Observations'),
          el('textarea', {
            className: 'form-input',
            id: 'tva-etat-observations',
            rows: 2,
            placeholder: 'Observations sur la prise en charge TVA par l\'État...'
          }, tvaEtat.observations || '')
        ])
      ])
    ])
  ]);
}

/**
 * Section Clé de Répartition
 */
function renderCleRepartitionSection(montantHT, montantTTC, livrables, registries) {
  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '📊 Clé de Répartition Multi-Bailleurs')
    ]),
    el('div', { className: 'card-body', id: 'cle-repartition-container' })
  ]);
}

/**
 * Modif #88 (CR 6.b) — Section « Livrables du marché ».
 * Rappelle les livrables saisis à la planification (operation.livrables) et
 * permet de les ajuster (réutilise le widget de la création PPM).
 */
function renderLivrablesSection() {
  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '📦 Livrables du marché'),
      el('p', { style: { margin: '4px 0 0', fontSize: '12px', color: '#6b7280' } },
        'Repris de la planification (PPM) — ajustables ici si nécessaire.')
    ]),
    el('div', { className: 'card-body', id: 'livrables-marche-container' })
  ]);
}

/**
 * Modif #128 (E-21) — Section « Ordonnancement prévu (CP par année) ».
 * Modif #141 (E-21, retour 01/06) — « ce n'est pas un élément de saisie, c'est
 * une forme de récap de la clé de répartition » : la section devient un
 * récapitulatif en LECTURE SEULE, dérivé automatiquement de la clé de
 * répartition (ventilation année × source de financement). Le tableau est
 * (re)généré par renderOrdonnancementRecap() au montage de la clé et à chaque
 * modification de celle-ci (onChange du widget).
 */
function renderOrdonnancementSection() {
  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '🗓️ Ordonnancement prévu (CP par année)'),
      el('p', { style: { margin: '4px 0 0', fontSize: '12px', color: '#6b7280' } },
        'Récapitulatif de la clé de répartition, ventilé par année et par source de financement. Non saisissable : reflète automatiquement la clé.')
    ]),
    el('div', { className: 'card-body', id: 'ord-container' })
  ]);
}

/**
 * Modif #141 — Agrège la clé de répartition par année × source de financement.
 * Mapping typeFinancement → colonne : ETAT → tresor (la TVA État, portée par
 * une ligne ETAT, y est donc comptée), DON → dons, EMPRUNT → emprunts.
 * Retourne la même structure {annee, tresor, dons, emprunts} que #128
 * (consommateurs en aval inchangés).
 */
function computeOrdonnancementFromCle(cleList) {
  const byYear = new Map();
  (Array.isArray(cleList) ? cleList : []).forEach(ligne => {
    const annee = parseInt(ligne.annee, 10) || null;
    const montant = Number(ligne.montant) || 0;
    if (!annee && !montant) return;
    if (!byYear.has(annee)) byYear.set(annee, { annee, tresor: 0, dons: 0, emprunts: 0 });
    const row = byYear.get(annee);
    const type = (ligne.typeFinancement || '').toUpperCase();
    if (type === 'DON') row.dons += montant;
    else if (type === 'EMPRUNT') row.emprunts += montant;
    else row.tresor += montant; // ETAT (et défaut) → Trésor (CI)
  });
  return [...byYear.values()].sort((a, b) => (a.annee || 0) - (b.annee || 0));
}

/**
 * Modif #141 — (Re)génère le tableau récapitulatif en lecture seule dans
 * #ord-container, à partir de l'état courant de la clé (cleRepartitionList).
 */
function renderOrdonnancementRecap() {
  const container = document.getElementById('ord-container');
  if (!container) return;
  container.innerHTML = '';

  const rows = computeOrdonnancementFromCle(cleRepartitionList);
  if (!rows.length) {
    container.appendChild(el('p', { style: { margin: 0, fontSize: '13px', color: '#6b7280' } },
      'Renseignez la clé de répartition ci-dessus : l\'ordonnancement prévu s\'en déduira automatiquement.'));
    return;
  }

  // Modif #169 (#4) — approche « CP Année courante / +1 » du client : libellé
  // relatif à l'année en cours, en plus de l'année absolue.
  const _curYear = new Date().getFullYear();
  const _relYear = (annee) => {
    const y = parseInt(annee, 10);
    if (!y) return '';
    if (y === _curYear) return 'CP Année courante';
    const d = y - _curYear;
    return d > 0 ? `CP Année courante +${d}` : `CP Année courante ${d}`;
  };

  let tT = 0, tD = 0, tE = 0;
  const tbody = el('tbody', {}, rows.map(r => {
    tT += r.tresor; tD += r.dons; tE += r.emprunts;
    return el('tr', {}, [
      el('td', {}, [
        el('span', {}, String(r.annee || '—')),
        r.annee ? el('span', { style: { display: 'block', fontSize: '10px', color: '#6b7280' } }, _relYear(r.annee)) : null
      ]),
      el('td', { style: { textAlign: 'right' } }, formatMoney(r.tresor)),
      el('td', { style: { textAlign: 'right' } }, formatMoney(r.dons)),
      el('td', { style: { textAlign: 'right' } }, formatMoney(r.emprunts)),
      el('td', { style: { textAlign: 'right', fontWeight: 600 } }, formatMoney(r.tresor + r.dons + r.emprunts))
    ]);
  }));

  container.appendChild(el('table', { className: 'table', id: 'ord-table', style: { width: '100%', fontSize: '13px' } }, [
    el('thead', {}, el('tr', {}, [
      el('th', {}, 'Année (CP)'),
      el('th', { style: { textAlign: 'right' } }, 'Trésor (CI)'),
      el('th', { style: { textAlign: 'right' } }, 'Dons'),
      el('th', { style: { textAlign: 'right' } }, 'Emprunts'),
      el('th', { style: { textAlign: 'right' } }, 'Total')
    ])),
    tbody,
    el('tfoot', {}, el('tr', { style: { fontWeight: 600, borderTop: '2px solid #e5e7eb' } }, [
      el('td', {}, 'Total'),
      el('td', { style: { textAlign: 'right' } }, formatMoney(tT)),
      el('td', { style: { textAlign: 'right' } }, formatMoney(tD)),
      el('td', { style: { textAlign: 'right' } }, formatMoney(tE)),
      el('td', { style: { textAlign: 'right' } }, formatMoney(tT + tD + tE))
    ]))
  ]));
}

/**
 * Section Échéancier
 */
function renderEcheancierSection(montantMarcheTotal, livrables, registries) {
  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '📅 Échéancier de Paiement')
    ]),
    el('div', { className: 'card-body', id: 'echeancier-container' })
  ]);
}

/**
 * Initialiser les widgets après rendu
 */
function initializeWidgets(operation, registries) {
  const cleContainer = document.getElementById('cle-repartition-container');
  const echeancierContainer = document.getElementById('echeancier-container');

  if (cleContainer) {
    const montantHT = parseFloat(document.getElementById('attr-montant-ht')?.value) || 0;
    const montantTTC = parseFloat(document.getElementById('attr-montant-ttc')?.value) || 0;

    // Modif #52 — Récupérer les bailleurs déclarés en planification (PPM) pour
    // les mettre en évidence dans le dropdown sans verrouiller le choix.
    const bailleursPlanifies = Array.isArray(operation?.chaineBudgetaire?.bailleurs)
      ? operation.chaineBudgetaire.bailleurs.filter(Boolean)
      : [];

    const widget = renderCleRepartitionManager(
      cleRepartitionList,
      montantHT,
      montantTTC,
      registries,
      (updatedList) => {
        cleRepartitionList = updatedList;
        // Modif #141 — le récap d'ordonnancement suit la clé en temps réel.
        renderOrdonnancementRecap();
      },
      bailleursPlanifies
    );
    cleContainer.innerHTML = '';
    cleContainer.appendChild(widget);

    // Modif #141 — premier rendu du récap d'ordonnancement (état initial de la clé).
    renderOrdonnancementRecap();
  }

  if (echeancierContainer) {
    const montantTTC = parseFloat(document.getElementById('attr-montant-ttc')?.value) || 0;
    const montantHT = parseFloat(document.getElementById('attr-montant-ht')?.value) || 0;

    const widget = renderEcheancierManager(
      echeancierData,
      operation.livrables || [],
      { ht: montantHT, ttc: montantTTC },
      registries,
      (updatedEcheancier) => {
        echeancierData = updatedEcheancier;
      }
    );
    echeancierContainer.innerHTML = '';
    echeancierContainer.appendChild(widget);
  }

  // Modif #88 — Livrables du marché : rappel + ajustement (réutilise le widget PPM)
  const livrablesContainer = document.getElementById('livrables-marche-container');
  if (livrablesContainer) {
    _livrablesState = Array.isArray(operation.livrables) ? [...operation.livrables] : [];
    _livrablesInitialized = true;
    const widget = renderLivrableManagerMP(_livrablesState, registries, (updatedList) => {
      _livrablesState = Array.isArray(updatedList) ? [...updatedList] : [];
    });
    livrablesContainer.innerHTML = '';
    livrablesContainer.appendChild(widget);
  }
}

/**
 * Sauvegarde de l'attribution
 *
 * Marché+ multi-lot : si lotId est fourni, on écrit dans
 * `entity.parLot[lotId]` plutôt qu'à la racine. Comportement transparent
 * pour les opérations à 1 lot ou héritées (lotId = null).
 */
async function handleSave(idOperation, operation, rawAttribution = null, lotId = null) {
  try {
    // Collecte des données attributaire
    const attrType = document.querySelector('input[name="attr-type"]:checked')?.value || 'SIMPLE';

    // Collecte des données de l'attributaire selon le type
    let attributaireData;
    let raisonSocialeValidation;

    // Helper pour collecter les coordonnées bancaires
    const collectCoordonneesBancaires = (prefix) => {
      const banque = document.getElementById(`${prefix}-banque`)?.value?.trim() || '';
      const agence = document.getElementById(`${prefix}-banque-agence`)?.value?.trim() || '';
      const numeroCompte = document.getElementById(`${prefix}-banque-numero`)?.value?.trim() || '';
      const intituleCompte = document.getElementById(`${prefix}-banque-intitule`)?.value?.trim() || '';
      const swiftBic = document.getElementById(`${prefix}-banque-swift`)?.value?.trim() || '';
      // Ne renvoyer un objet que si au moins un champ est saisi
      if (!banque && !agence && !numeroCompte && !intituleCompte && !swiftBic) return undefined;
      return { banque, agence, numeroCompte, intituleCompte, swiftBic };
    };

    if (attrType === 'SIMPLE') {
      // Modif #43.b — entrepriseId issu du picker (clé vers le référentiel mp_entreprise)
      const entrepriseId = document.getElementById('attr-entreprise-id')?.value?.trim() || null;
      const raisonSociale = document.getElementById('attr-raison-sociale')?.value?.trim() || '';
      const ncc = document.getElementById('attr-ncc')?.value?.trim() || '';
      const adresse = document.getElementById('attr-adresse')?.value?.trim() || '';
      const telephone = document.getElementById('attr-telephone')?.value?.trim() || '';
      const email = document.getElementById('attr-email')?.value?.trim() || '';
      const coordonneesBancaires = collectCoordonneesBancaires('attr');

      raisonSocialeValidation = raisonSociale;

      const ent = { role: 'TITULAIRE', entrepriseId, raisonSociale, ncc, adresse, telephone, email };
      if (coordonneesBancaires) ent.coordonneesBancaires = coordonneesBancaires;

      attributaireData = {
        singleOrGroup: 'SIMPLE',
        groupType: null,
        entrepriseId,
        groupementId: null,
        entreprises: [ent]
      };
    } else {
      // Groupement
      const groupType = document.getElementById('attr-group-type')?.value || 'CONJOINT';
      // Modif #43.b — entrepriseId du mandataire issu du picker
      const entrepriseId = document.getElementById('attr-mandataire-entreprise-id')?.value?.trim() || null;
      const raisonSociale = document.getElementById('attr-mandataire-raison-sociale')?.value?.trim() || '';
      const ncc = document.getElementById('attr-mandataire-ncc')?.value?.trim() || '';
      const adresse = document.getElementById('attr-mandataire-adresse')?.value?.trim() || '';
      const telephone = document.getElementById('attr-mandataire-telephone')?.value?.trim() || '';
      const email = document.getElementById('attr-mandataire-email')?.value?.trim() || '';
      const coordonneesBancaires = collectCoordonneesBancaires('attr-mandataire');

      raisonSocialeValidation = raisonSociale;

      const ent = { role: 'MANDATAIRE', entrepriseId, raisonSociale, ncc, adresse, telephone, email };
      if (coordonneesBancaires) ent.coordonneesBancaires = coordonneesBancaires;

      // Marché+ modif #20 : collecter aussi les co-titulaires (groupement CONJOINT uniquement)
      const cotitulaires = [];
      if (groupType === 'CONJOINT') {
        for (let i = 0; i < _coTitulairesState.length; i++) {
          readCoTitulaireFromDOM(i);
          const m = _coTitulairesState[i];
          if (!m.raisonSociale || !m.raisonSociale.trim()) continue; // skip vides
          const entMember = {
            role: 'COTITULAIRE',
            entrepriseId: m.entrepriseId || null,  // Modif #43.b — lien référentiel mp_entreprise
            raisonSociale: m.raisonSociale.trim(),
            ncc: m.ncc || '',
            adresse: m.adresse || '',
            telephone: m.telephone || '',
            email: m.email || ''
          };
          // Coordonnées bancaires : ne les inclure que si au moins un champ est saisi
          const cbMember = m.coordonneesBancaires || {};
          const hasCb = !!(cbMember.banque || cbMember.agence || cbMember.numeroCompte || cbMember.intituleCompte || cbMember.swiftBic);
          if (hasCb) entMember.coordonneesBancaires = cbMember;
          cotitulaires.push(entMember);
        }
      }

      attributaireData = {
        singleOrGroup: 'GROUPEMENT',
        groupType,
        // Modif #172 (obs. EHOUMAN) — dénomination du groupement.
        nomGroupement: document.getElementById('attr-group-nom')?.value?.trim() || null,
        entrepriseId,            // entrepriseId du mandataire
        groupementId: null,
        entreprises: [ent, ...cotitulaires]
      };
    }

    // Validation de la raison sociale
    if (!raisonSocialeValidation) {
      alert('⚠️ Veuillez saisir la raison sociale de l\'attributaire');
      return;
    }

    // Collecte des montants
    const montantHT = parseFloat(document.getElementById('attr-montant-ht').value);
    const montantTTC = parseFloat(document.getElementById('attr-montant-ttc').value);

    if (!montantHT || montantHT <= 0) {
      alert('⚠️ Veuillez saisir un montant HT valide');
      return;
    }

    // Garanties (Marché+ — modif #18 : montant via widget montant/%)
    const collectGarantie = (id) => {
      const existe = document.getElementById(`garantie-${id}-existe`)?.checked === true;
      if (!existe) return { existe: false, montant: 0, baseCalc: 'HT' };
      const api = _garantieWidgetApis[id];
      const montant = api ? api.getMontant() : 0;
      const saisieMode = api ? api.getMode() : 'POURCENTAGE';
      const baseCalc = document.getElementById(`garantie-${id}-base-calc`)?.value === 'TTC' ? 'TTC' : 'HT';
      const dateEmission = document.getElementById(`garantie-${id}-emission`)?.value || null;
      const dateEcheance = document.getElementById(`garantie-${id}-echeance`)?.value || null;
      return { existe: true, montant, baseCalc, saisieMode, dateEmission, dateEcheance };
    };
    // Modif #173 (obs. EHOUMAN) — collecte de la garantie « Autre » (saisie libre).
    const collectAutreGarantie = () => {
      const existe = document.getElementById('garantie-autre-existe')?.checked === true;
      if (!existe) return { existe: false, libelle: '', montant: 0 };
      return {
        existe: true,
        libelle: document.getElementById('garantie-autre-libelle')?.value?.trim() || '',
        montant: parseFloat(document.getElementById('garantie-autre-montant')?.value) || 0,
        baseCalc: 'HT',
        dateEmission: document.getElementById('garantie-autre-emission')?.value || null,
        dateEcheance: document.getElementById('garantie-autre-echeance')?.value || null
      };
    };
    const garantiesData = {
      garantieSoumission: collectGarantie('soumission'),
      garantieAvance: collectGarantie('avance'),
      garantieBonneExec: collectGarantie('bonne-exec'),
      retenueGarantie: collectGarantie('retenue'),
      cautionnement: collectGarantie('cautionnement'),
      autreGarantie: collectAutreGarantie()
    };

    // Chercher si une attribution existe déjà pour cette opération
    const existingAttrs = await dataService.query(ENTITIES.MP_ATTRIBUTION, { operationId: idOperation });
    const existingAttr = (existingAttrs && existingAttrs.length > 0) ? existingAttrs[0] : (rawAttribution || null);

    // Modif #86 (CR 6.b) — Informations sur le marché approuvé
    const numeroMarcheApprouve = document.getElementById('attr-numero-marche')?.value?.trim() || null;
    const exonereTVA = document.getElementById('attr-exonere-tva')?.checked === true;
    // Modif #120 (E-15) — avance de démarrage : forfaitaire + facultative (objet).
    const avanceDemarrage = {
      actif: document.getElementById('attr-avance-demarrage')?.checked === true,
      forfaitPct: parseFloat(document.getElementById('attr-avance-forfait-pct')?.value) || 0,
      facultPct: parseFloat(document.getElementById('attr-avance-facult-pct')?.value) || 0
    };
    const dureeValeur = parseInt(document.getElementById('attr-duree-valeur')?.value, 10) || 0;
    const dureeUnite = document.getElementById('attr-duree-unite')?.value || 'MOIS';

    // Modif #128 (E-21) — ordonnancement prévu (CP par année × sources).
    // Modif #141 — snapshot dérivé de la clé de répartition (plus de saisie).
    const ordonnancement = computeOrdonnancementFromCle(cleRepartitionList);

    // Modif #130 (E-1/E-9) — origine de l'approbation (visa CF / autre que CF).
    // Modif #171 (obs. EHOUMAN) — suppression des « N° de visa CF » et « N° d'acte
    // d'approbation » : pas de numéro (approbation consignée sur une page du marché).
    const approbation = {
      origine: document.querySelector('input[name="appr-origine"]:checked')?.value || 'VISE_CF',
      visaDate: document.getElementById('appr-visa-date')?.value || null,
      organe: document.getElementById('appr-organe')?.value || null,
      acteDate: document.getElementById('appr-acte-date')?.value || null
    };

    // Champs métier (per-lot ou racine selon lotId)
    const lotFields = {
      attributaire: attributaireData,
      // Modif #86 — N° du marché approuvé + exonération de TVA
      numeroMarcheApprouve,
      exonereTVA,
      // Modif #130 (E-1/E-9) — origine de l'approbation.
      approbation,
      // Modif #128 (E-21) — ordonnancement prévu CP par année.
      ordonnancement,
      // Modif #89 — avance de démarrage (flag ; calibrage Décompte 00 à l'exécution)
      avanceDemarrage,
      montants: {
        ht: montantHT,
        ttc: montantTTC,
        confidentiel: false
      },
      dates: {
        signatureTitulaire: null,
        signatureAC: null,
        approbation: null,
        // Modif #86 — durée contractuelle saisie
        delaiExecution: dureeValeur,
        delaiUnite: dureeUnite
      },
      decision_cf: {
        etat: null,
        motifRef: null,
        commentaire: ''
      },
      garanties: garantiesData,
      // Modif #38.b — sous-traitants déclarés à l'attribution
      sousTraitants: [..._sousTraitantsState]
    };

    // Construit le patch : si lotId, les champs vont sous parLot[lotId]
    const lotPatch = buildLotPatch(lotId, lotFields, existingAttr);

    // Sauvegarder attribution
    let attrResult;

    if (existingAttr && existingAttr.id) {
      // Mise à jour
      const updateData = {
        ...lotPatch,
        operation_id: idOperation,
        updated_at: new Date().toISOString()
      };
      attrResult = await dataService.update(ENTITIES.MP_ATTRIBUTION, existingAttr.id, updateData);
      logger.info('[ECR03A] Attribution mise à jour', { id: existingAttr.id, lotId });
    } else {
      // Création
      const createData = {
        ...lotPatch,
        operation_id: idOperation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      attrResult = await dataService.add(ENTITIES.MP_ATTRIBUTION, createData);
      logger.info('[ECR03A] Attribution créée', { lotId });
    }

    if (!attrResult.success) {
      alert('❌ Erreur lors de la sauvegarde de l\'attribution');
      return;
    }

    // Mettre à jour l'opération
    const updateOp = {
      montantFinal: montantTTC
    };

    // Modif #88 — Persister les livrables ajustés (uniquement si le widget a
    // bien été initialisé, pour ne jamais écraser operation.livrables par erreur).
    if (_livrablesInitialized) {
      updateOp.livrables = [..._livrablesState];
    }

    // Modif #131 (E-1/E-9) — l'approbation est contenue dans l'enregistrement :
    // après enregistrement, le marché passe directement à l'état VISE (Approuvé),
    // sauf s'il est déjà plus avancé (EN_EXEC/CLOS/RESILIE).
    const newTimeline = [...operation.timeline];
    if (!newTimeline.includes('ATTR')) newTimeline.push('ATTR');
    if (['EN_PROC', 'ATTRIBUE', 'EN_ATTR'].includes(operation.etat)) {
      if (!newTimeline.includes('VISE')) newTimeline.push('VISE');
      updateOp.etat = 'VISE';
    }
    updateOp.timeline = newTimeline;

    const opResult = await dataService.update(ENTITIES.MP_OPERATION, idOperation, updateOp);

    if (opResult.success) {
      alert('✅ Attribution enregistrée avec succès');
      router.navigate('/mp/fiche-marche', { idOperation });
    } else {
      alert('❌ Erreur lors de la mise à jour de l\'opération');
    }

  } catch (err) {
    logger.error('[ECR03A] Erreur sauvegarde', err);
    // Modif #67 — Erreur silencieuse en mode démo
    logger.error('[Attribution] Erreur sauvegarde — détail technique :', err);
    alert('⚠️ Impossible d\'enregistrer l\'attribution pour le moment. Vérifiez votre connexion ou réessayez.');
  }
}

/**
 * Collecte les données d'une garantie
 */
function collectGarantieData(id) {
  const existe = document.getElementById(`garantie-${id}-existe`).checked;

  if (!existe) {
    return { existe: false, montant: 0, dateEmission: null, dateEcheance: null, docRef: null };
  }

  const montant = parseFloat(document.getElementById(`garantie-${id}-montant`).value) || 0;
  const dateEmission = document.getElementById(`garantie-${id}-emission`).value || null;
  const dateEcheance = document.getElementById(`garantie-${id}-echeance`).value || null;

  // Simuler upload document
  const docFile = document.getElementById(`garantie-${id}-doc`).files[0];
  const docRef = docFile ? `garantie_${id}_${Date.now()}_${docFile.name}` : null;

  return {
    existe: true,
    montant,
    dateEmission,
    dateEcheance,
    docRef
  };
}

export default renderAttribution;
