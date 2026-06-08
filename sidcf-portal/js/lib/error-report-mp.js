/* ============================================
   Rapport d'erreur transverse — Marché+ (Modif #157)
   ============================================
   Feuille de route DÉROGATIONS, décision métier : « RAPPORT D'ERREUR À ÉDITER
   À TOUTES LES ÉTAPES Y COMPRIS LES DOCUMENTS JUSTIFICATIFS D'UNE DÉROGATION ».

   Générateur commun + modale + export, branché sur chaque écran fonctionnel via
   le header partagé (renderPageHeaderMP). Le rapport est NON BLOQUANT : il
   recense, pour un marché donné, les anomalies et pièces attendues à chaque
   étape — la dérogation et ses justificatifs y figurent explicitement.
*/

import { el } from './dom.js';
import dataService from '../datastore/data-service.js';
import { ENTITIES } from '../datastore/schema.js';
import logger from './logger.js';

// Matrice des pièces obligatoires (chargée à la demande, mise en cache).
let _matriceCache = null;
async function loadMatrice() {
  if (_matriceCache) return _matriceCache;
  try {
    const res = await fetch('/js/config/pieces-matrice.json');
    _matriceCache = await res.json();
  } catch (e) {
    logger.error('[ErrorReport] Matrice pièces indisponible :', e);
    _matriceCache = { matrice: [] };
  }
  return _matriceCache;
}

// Un code de pièce s'applique-t-il au mode + type courant ? (« * » = tous)
function pieceApplies(piece, mode, typeMarche) {
  const modeOk = !piece.modePassation || piece.modePassation.includes('*') || piece.modePassation.includes(mode);
  const typeOk = !piece.typeMarche || piece.typeMarche.includes('*') || piece.typeMarche.includes(typeMarche);
  return modeOk && typeOk;
}

/**
 * Construit l'ensemble des « codes de pièces présents » à partir des données
 * réellement chargées du marché. Honnête : ce qui n'est pas mappé reste
 * « à vérifier » plutôt que faussement « manquant ».
 */
function buildPresenceSet(full) {
  const present = new Set();
  const proc = full.procedure || {};
  const attr = full.attribution || {};

  if (full.operation) present.add('PPM_APPROUVE'); // ligne PPM existante
  // Dossier d'appel / pièces d'engagement
  if (proc.dossierAppelDoc) ['DAO', 'DTAO_PI', 'TDR', 'DC', 'DOSSIER_CONS_PSO', 'DOSSIER_CONS_PSL'].forEach(c => present.add(c));
  if (proc.devisExistant) present.add('FACTURE_PROFORMA');
  if (proc.bcExistant) present.add('BON_COMMANDE');
  // PV transverse + par lot
  if (proc.pv?.ouverture) present.add('PV_OUVERTURE');
  const lots = Array.isArray(proc.lots) ? proc.lots : [];
  if (lots.some(l => l.pv?.jugement)) present.add('PV_JUGEMENT');
  // Formulaire de sélection (ex « note de sélection »)
  if (proc.noteSelection) present.add('FORMULAIRE_SELECTION');
  // Garanties : inline sur l'attribution OU entités MP_GARANTIE séparées.
  const g = attr.garanties || {};
  const garEntities = Array.isArray(full.garanties) ? full.garanties : [];
  if (g.garantieAvance?.docRef || garEntities.some(x => /AVANCE/i.test(x.type || x.typeGarantie || '') && (x.docRef || x.documentRef))) { present.add('GARANTIE_AVANCE'); present.add('CAUTION_AVANCE'); }
  if (g.garantieBonneExec?.docRef || garEntities.some(x => /BONNE/i.test(x.type || x.typeGarantie || '') && (x.docRef || x.documentRef))) present.add('GARANTIE_BONNE_EXEC');
  // Ordres de service
  if ((full.ordresService || []).some(o => o.documentRef)) present.add('OS_DEMARRAGE');
  // Visa CF
  if ((full.visasCF || []).some(v => v.documentRef)) present.add('VISA_CF');
  // Clôture (entité unique dans getMpOperationFull)
  const clot = full.cloture;
  const clotArr = Array.isArray(clot) ? clot : (clot ? [clot] : []);
  if (clotArr.some(c => c.pvProvisoireDoc || c.pvReceptionProv || c.pvProvisoire)) present.add('PV_RECEPTION_PROV');
  if (clotArr.some(c => c.pvDefinitifDoc || c.pvReceptionDef || c.pvDefinitif)) present.add('PV_RECEPTION_DEF');

  return present;
}

// Étapes (matrice) considérées « atteintes » selon la timeline coarse du marché.
const TIMELINE_TO_MATRICE = {
  PLANIF: ['PLANIF'],
  PROC: ['INVITATION', 'OUVERTURE', 'ANALYSE', 'JUGEMENT'],
  ATTRIBUTION: ['APPROBATION'],
  VISA_CF: ['VISE'],
  EXECUTION: ['EXEC'],
  CLOTURE: ['CLOT']
};

function reachedMatricePhases(operation) {
  const tl = Array.isArray(operation?.timeline) ? operation.timeline : [];
  const set = new Set(['PLANIF']);
  tl.forEach(code => (TIMELINE_TO_MATRICE[code] || []).forEach(p => set.add(p)));
  // Toujours inclure la phase d'invitation/ouverture dès qu'on est en procédure.
  if ((operation?.etat && operation.etat !== 'PLANIFIE')) (TIMELINE_TO_MATRICE.PROC).forEach(p => set.add(p));
  return set;
}

/**
 * Construit le rapport d'erreur d'un marché.
 * @returns {Promise<Object>} { operation, modeEffectif, typeMarche, derogation, pieces[], warnings[], counts }
 */
export async function buildErrorReport(idOperation) {
  const full = await dataService.getMpOperationFull(idOperation);
  const operation = full?.operation || await dataService.get(ENTITIES.MP_OPERATION, idOperation);
  const proc = full?.procedure || {};
  const matrice = (await loadMatrice()).matrice || [];

  // Mode EFFECTIF (la liasse fait foi) : procédure d'abord, sinon opération.
  const modeEffectif = proc.modePassationEffectif || operation?.modePassation || operation?.modePassationPlanifie || '';
  const typeMarche = operation?.typeMarche || '';
  const present = buildPresenceSet(full || { operation });
  const phasesReached = reachedMatricePhases(operation);

  // 1) Pièces obligatoires par phase atteinte (filtrées mode + type).
  const pieces = [];
  matrice.forEach(phaseDef => {
    if (!phasesReached.has(phaseDef.phase)) return;
    (phaseDef.pieces || []).forEach(p => {
      if (!p.obligatoire) return;
      if (!pieceApplies(p, modeEffectif, typeMarche)) return;
      const statut = present.has(p.code) ? 'PRESENT' : (isMappedCode(p.code) ? 'MANQUANT' : 'A_VERIFIER');
      pieces.push({ phase: phaseDef.label || phaseDef.phase, code: p.code, libelle: p.label || p.code, statut });
    });
  });

  // 2) Dérogation et ses justificatifs (le point explicitement demandé).
  const d = operation?.procDerogation || null;
  const derogation = d && d.isDerogation ? {
    active: true,
    modePlanifie: d.modePlanifie || operation?.modePassationPlanifie || null,
    modeEffectif: d.modeEffectif || modeEffectif,
    ecart: d.ecart || null,
    source: d.source?.type || null,
    bailleur: d.source?.bailleur || null,
    pieceManquante: d.pieceManquante === true || !d.docId,
    motif: d.comment || null
  } : { active: false };

  // 3) Avertissements (contractualisation, consommés par la fiche de vie).
  const warnings = [];
  const cw = operation?.contractualisationWarnings || {};
  if (cw.derogationPieceManquante) warnings.push('Pièce justificative de dérogation manquante (signalé à la contractualisation).');

  const manquants = pieces.filter(p => p.statut === 'MANQUANT').length
    + (derogation.active && derogation.pieceManquante ? 1 : 0)
    + (derogation.active && !derogation.source ? 1 : 0);
  const aVerifier = pieces.filter(p => p.statut === 'A_VERIFIER').length;

  return {
    operation, modeEffectif, typeMarche, derogation, pieces, warnings,
    counts: { manquants, aVerifier, present: pieces.filter(p => p.statut === 'PRESENT').length }
  };
}

// Codes pour lesquels on sait détecter la présence (sinon « à vérifier »).
const MAPPED_CODES = new Set([
  'PPM_APPROUVE', 'DAO', 'DTAO_PI', 'TDR', 'DC', 'DOSSIER_CONS_PSO', 'DOSSIER_CONS_PSL',
  'FACTURE_PROFORMA', 'BON_COMMANDE', 'PV_OUVERTURE', 'PV_JUGEMENT', 'FORMULAIRE_SELECTION',
  'GARANTIE_AVANCE', 'CAUTION_AVANCE', 'GARANTIE_BONNE_EXEC', 'OS_DEMARRAGE',
  'VISA_CF', 'PV_RECEPTION_PROV', 'PV_RECEPTION_DEF'
]);
function isMappedCode(code) { return MAPPED_CODES.has(code); }

/* ------------------------------------------------------------------ */
/* Export CSV du rapport                                               */
/* ------------------------------------------------------------------ */

function exportReportCSV(report) {
  const rows = [['Catégorie', 'Étape', 'Élément', 'Statut / Détail']];
  if (report.derogation.active) {
    rows.push(['Dérogation', 'Contractualisation', `Écart ${report.derogation.modePlanifie || '?'} → ${report.derogation.modeEffectif || '?'}`,
      report.derogation.pieceManquante ? 'JUSTIFICATIF MANQUANT' : 'Justificatif fourni']);
    if (!report.derogation.source) rows.push(['Dérogation', 'Contractualisation', 'Source de la dérogation', 'NON RENSEIGNÉE']);
  }
  report.pieces.forEach(p => rows.push(['Pièce obligatoire', p.phase, p.libelle, p.statut]));
  report.warnings.forEach(w => rows.push(['Avertissement', '-', w, 'À corriger']));

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rapport-erreur-${(report.operation?.objet || report.operation?.id || 'marche').toString().slice(0, 30).replace(/[^\w]+/g, '_')}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

/* ------------------------------------------------------------------ */
/* Modale                                                              */
/* ------------------------------------------------------------------ */

const STATUT_BADGE = {
  PRESENT:    { label: '✓ Présent',     cls: 'green' },
  MANQUANT:   { label: '✗ Manquant',    cls: 'red' },
  A_VERIFIER: { label: '? À vérifier',  cls: 'orange' }
};

function renderReportBody(report) {
  const badge = (statut) => {
    const b = STATUT_BADGE[statut] || STATUT_BADGE.A_VERIFIER;
    return el('span', { className: `badge badge-${b.cls}`, style: { fontSize: '11px' } }, b.label);
  };

  const sections = [];

  // En-tête synthèse
  sections.push(el('div', { style: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' } }, [
    el('span', { className: 'badge badge-red' }, `${report.counts.manquants} manquant(s)`),
    el('span', { className: 'badge badge-orange' }, `${report.counts.aVerifier} à vérifier`),
    el('span', { className: 'badge badge-green' }, `${report.counts.present} présent(s)`),
    el('span', { className: 'badge badge-gray' }, `Mode effectif : ${report.modeEffectif || '—'}`)
  ]));

  // Dérogation
  sections.push(el('div', { className: 'card', style: { marginBottom: '12px', borderColor: report.derogation.active ? '#f59e0b' : undefined } }, [
    el('div', { className: 'card-header' }, el('h3', { className: 'card-title' }, '⚖️ Dérogation')),
    el('div', { className: 'card-body' }, report.derogation.active ? [
      el('p', { style: { margin: '0 0 8px', fontSize: '13px' } }, [
        el('strong', {}, 'Écart : '),
        `${report.derogation.modePlanifie || '?'} (planifié) → ${report.derogation.modeEffectif || '?'} (liasse)`,
        report.derogation.ecart ? el('span', { style: { color: '#6b7280' } },
          ` — ${[report.derogation.ecart.bareme ? 'écart barème' : null, report.derogation.ecart.planifLiasse ? 'écart planif↔liasse' : null].filter(Boolean).join(', ')}`) : null
      ]),
      el('ul', { style: { margin: 0, paddingLeft: '18px', fontSize: '13px' } }, [
        el('li', {}, ['Source : ', report.derogation.source || el('span', { style: { color: '#dc3545' } }, 'NON RENSEIGNÉE')]),
        el('li', {}, ['Justificatif : ', report.derogation.pieceManquante
          ? el('span', { style: { color: '#dc3545', fontWeight: 600 } }, 'MANQUANT (à fournir)')
          : el('span', { style: { color: '#16a34a' } }, 'fourni')]),
        report.derogation.motif ? el('li', {}, `Motif : ${report.derogation.motif}`) : null
      ])
    ] : [el('p', { style: { margin: 0, fontSize: '13px', color: '#6b7280' } }, 'Aucune dérogation déclarée — mode conforme au planifié et au barème.')])
  ]));

  // Pièces obligatoires par étape
  const byPhase = {};
  report.pieces.forEach(p => { (byPhase[p.phase] = byPhase[p.phase] || []).push(p); });
  const phaseBlocks = Object.keys(byPhase).map(phase => el('div', { style: { marginBottom: '10px' } }, [
    el('div', { style: { fontWeight: 600, fontSize: '13px', margin: '6px 0' } }, `📋 ${phase}`),
    el('table', { className: 'data-table', style: { width: '100%', fontSize: '13px' } }, [
      el('tbody', {}, byPhase[phase].map(p => el('tr', {}, [
        el('td', {}, p.libelle),
        el('td', { style: { width: '120px', textAlign: 'right' } }, badge(p.statut))
      ])))
    ])
  ]));
  sections.push(el('div', { className: 'card', style: { marginBottom: '12px' } }, [
    el('div', { className: 'card-header' }, el('h3', { className: 'card-title' }, `📎 Pièces obligatoires attendues (${report.pieces.length})`)),
    el('div', { className: 'card-body' }, phaseBlocks.length ? phaseBlocks : [el('p', { style: { margin: 0, fontSize: '13px', color: '#6b7280' } }, 'Aucune pièce obligatoire pour ce mode aux étapes atteintes.')])
  ]));

  // Avertissements
  if (report.warnings.length) {
    sections.push(el('div', { className: 'card', style: { marginBottom: '12px' } }, [
      el('div', { className: 'card-header' }, el('h3', { className: 'card-title' }, `⚠️ Avertissements (${report.warnings.length})`)),
      el('div', { className: 'card-body' }, el('ul', { style: { margin: 0, paddingLeft: '18px', fontSize: '13px' } }, report.warnings.map(w => el('li', {}, w))))
    ]));
  }

  return el('div', {}, sections);
}

export async function openErrorReportModal(idOperation) {
  const overlay = el('div', { className: 'modal-overlay', style: { display: 'flex' } });
  const content = el('div', {
    className: 'modal-content',
    style: { maxWidth: '760px', maxHeight: '88vh', overflowY: 'auto' },
    onclick: (e) => e.stopPropagation()
  }, [
    el('div', { className: 'modal-header' }, [
      el('h2', { className: 'modal-title' }, '🧾 Rapport d\'erreur du marché'),
      (() => { const b = el('button', { className: 'btn-close' }, '×'); b.onclick = () => overlay.remove(); return b; })()
    ]),
    el('div', { className: 'modal-body', id: 'err-report-body' }, [
      el('p', { style: { fontSize: '13px', color: '#6b7280' } }, 'Génération du rapport…')
    ]),
    el('div', { className: 'modal-footer', style: { display: 'flex', gap: '12px', justifyContent: 'flex-end', padding: '12px 16px' } }, [
      (() => { const b = el('button', { className: 'btn btn-secondary' }, 'Fermer'); b.onclick = () => overlay.remove(); return b; })(),
      (() => { const b = el('button', { className: 'btn btn-secondary' }, '🖨️ Imprimer'); b.onclick = () => window.print(); return b; })(),
      (() => { const b = el('button', { className: 'btn btn-accent', id: 'err-report-export' }, '📥 Exporter (CSV)'); return b; })()
    ])
  ]);
  overlay.appendChild(content);
  overlay.onclick = () => overlay.remove();
  document.body.appendChild(overlay);

  try {
    const report = await buildErrorReport(idOperation);
    const body = content.querySelector('#err-report-body');
    body.innerHTML = '';
    body.appendChild(renderReportBody(report));
    content.querySelector('#err-report-export').onclick = () => exportReportCSV(report);
  } catch (e) {
    logger.error('[ErrorReport] Échec génération :', e);
    const body = content.querySelector('#err-report-body');
    if (body) body.innerHTML = '<p style="color:#dc3545">Impossible de générer le rapport pour le moment.</p>';
  }
}

/**
 * Bouton réutilisable « Rapport d'erreur » (à placer dans un header d'écran).
 */
export function renderErrorReportButton(idOperation) {
  const btn = el('button', { className: 'btn btn-secondary btn-sm' }, '🧾 Rapport d\'erreur');
  btn.addEventListener('click', () => { if (idOperation) openErrorReportModal(idOperation); });
  return btn;
}

export default { buildErrorReport, openErrorReportModal, renderErrorReportButton };
