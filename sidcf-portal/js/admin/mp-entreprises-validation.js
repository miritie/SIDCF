/* ============================================
   Admin Marché+ — Gestion du référentiel des entreprises
   ============================================
   Modif #44 — Écran admin pour valider les fiches PENDING créées via
   le picker en flux d'attribution, et fusionner les doublons probables.

   Route : /admin/mp-entreprises

   2 onglets :
   - « À valider » : liste des fiches `validationStatus = 'PENDING'` avec
     actions Valider / Modifier / Rejeter
   - « Doublons probables » : groupes d'entreprises ressemblantes (NCC
     identique en case-insensitive OU raison sociale fuzzy ≥ 85 %) avec
     action « Fusionner vers X »

   La fusion met à jour toutes les références entrepriseId dans :
   - mp_attribution.attributaire (champ entrepriseId)
   - mp_attribution.attributaire.entreprises[].entrepriseId
   - mp_attribution.sousTraitants[].entrepriseId
   - mp_procedure.soumissionnaires[].entrepriseId
   puis marque la fiche source comme MERGED avec mergedIntoId pointant
   vers la cible.
   ============================================ */

import { el, mount } from '../lib/dom.js';
import dataService, { ENTITIES } from '../datastore/data-service.js';
import { findSimilarEntreprises, normalizeRaisonSociale, similarity } from '../lib/entreprise-fuzzy-mp.js';
import { invalidateEntreprisesCache } from '../ui/widgets/entreprise-picker-mp.js';
import logger from '../lib/logger.js';

let _currentTab = 'pending';  // 'pending' | 'duplicates'

export default async function renderMpEntreprisesAdmin() {
  const all = await dataService.query(ENTITIES.MP_ENTREPRISE);
  // Exclure les fiches déjà fusionnées de l'affichage principal
  const active = (all || []).filter(e => e.validationStatus !== 'MERGED');
  const pending = active.filter(e => e.validationStatus === 'PENDING');
  const validated = active.filter(e => e.validationStatus === 'VALIDATED');
  const duplicateGroups = detectDuplicates(active);

  const page = el('div', { className: 'page' }, [
    el('div', { className: 'page-header' }, [
      el('h1', { className: 'page-title' }, '🏢 Référentiel entreprises — Validation'),
      el('p', { className: 'page-subtitle' },
        `${active.length} fiche(s) active(s) · ${pending.length} en attente · ${duplicateGroups.length} groupe(s) de doublons probables`)
    ]),

    // Onglets
    el('div', { className: 'tabs', style: { display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb', marginBottom: '20px' } }, [
      renderTab('pending', `⏳ À valider (${pending.length})`),
      renderTab('duplicates', `🔗 Doublons probables (${duplicateGroups.length})`),
      renderTab('all', `📋 Toutes les fiches (${active.length})`)
    ]),

    // Contenu de l'onglet actif
    el('div', { id: 'mp-ent-admin-content' },
      _currentTab === 'pending' ? renderPendingTab(pending)
      : _currentTab === 'duplicates' ? renderDuplicatesTab(duplicateGroups, active)
      : renderAllTab(active)
    )
  ]);

  mount('#app', page);
}

function renderTab(key, label) {
  const isActive = _currentTab === key;
  return el('button', {
    type: 'button',
    style: {
      padding: '10px 16px',
      border: 'none',
      borderBottom: isActive ? '3px solid #0d6efd' : '3px solid transparent',
      background: 'transparent',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: isActive ? 600 : 400,
      color: isActive ? '#0d6efd' : '#6b7280'
    },
    onclick: () => { _currentTab = key; renderMpEntreprisesAdmin(); }
  }, label);
}

// ============================================
// Onglet « À valider »
// ============================================

function renderPendingTab(pending) {
  if (pending.length === 0) {
    return el('div', {
      style: { padding: '32px', textAlign: 'center', color: '#6b7280', background: '#f9fafb', borderRadius: '8px' }
    }, '✅ Aucune fiche en attente de validation.');
  }

  return el('table', { className: 'table', style: { width: '100%', borderCollapse: 'collapse' } }, [
    el('thead', {}, [
      el('tr', { style: { background: '#f9fafb', borderBottom: '1px solid #e5e7eb' } }, [
        el('th', { style: thStyle() }, 'Raison sociale'),
        el('th', { style: thStyle() }, 'NCC'),
        el('th', { style: thStyle() }, 'Contacts'),
        el('th', { style: thStyle() }, 'Banque'),
        el('th', { style: thStyle() }, 'Créée le'),
        el('th', { style: thStyle('right') }, 'Actions')
      ])
    ]),
    el('tbody', {}, pending.map(ent => el('tr', { style: { borderBottom: '1px solid #f3f4f6' } }, [
      el('td', { style: tdStyle() }, el('strong', {}, ent.raisonSociale || '-')),
      el('td', { style: tdStyle('monospace') }, ent.ncc || '-'),
      el('td', { style: tdStyle('small') }, [
        ent.telephone || '', ent.telephone && ent.email ? ' · ' : '', ent.email || ''
      ].filter(Boolean).join('')),
      el('td', { style: tdStyle('small') }, ent.banque?.libelle || '-'),
      el('td', { style: tdStyle('small') }, ent.createdAt ? new Date(ent.createdAt).toLocaleDateString('fr-FR') : '-'),
      el('td', { style: { ...tdStyle('right'), whiteSpace: 'nowrap' } }, [
        el('button', { className: 'btn btn-sm btn-primary', style: { marginRight: '4px' }, onclick: () => handleValidate(ent.id) }, '✓ Valider'),
        el('button', { className: 'btn btn-sm btn-secondary', onclick: () => handleReject(ent.id) }, '✕ Rejeter')
      ])
    ])))
  ]);
}

async function handleValidate(id) {
  if (!confirm('Valider cette fiche ? Elle apparaîtra comme "VALIDATED" dans le picker.')) return;
  try {
    const result = await dataService.update(ENTITIES.MP_ENTREPRISE, id, {
      validationStatus: 'VALIDATED',
      validationDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    if (result.success) {
      invalidateEntreprisesCache();
      renderMpEntreprisesAdmin();
    } else {
      alert('Erreur lors de la validation.');
    }
  } catch (err) {
    logger.error('[MpEntreprisesAdmin] Validation failed', err);
    alert('Erreur réseau.');
  }
}

async function handleReject(id) {
  if (!confirm('Rejeter (désactiver) cette fiche ? Elle ne pourra plus être pickée.\nNote : cela ne supprime pas les références existantes dans les attributions.')) return;
  try {
    const result = await dataService.update(ENTITIES.MP_ENTREPRISE, id, {
      actif: false,
      updatedAt: new Date().toISOString()
    });
    if (result.success) {
      invalidateEntreprisesCache();
      renderMpEntreprisesAdmin();
    } else {
      alert('Erreur lors du rejet.');
    }
  } catch (err) {
    logger.error('[MpEntreprisesAdmin] Reject failed', err);
    alert('Erreur réseau.');
  }
}

// ============================================
// Onglet « Doublons probables »
// ============================================

/**
 * Détecte les groupes d'entreprises potentiellement doublonnes.
 * Critères :
 *   - même NCC (case-insensitive) → groupe certain
 *   - raison sociale fuzzy ≥ 85 % → groupe probable
 */
function detectDuplicates(entreprises) {
  const groups = [];
  const seen = new Set();

  // 1. Groupes par NCC identique
  const byNcc = new Map();
  for (const e of entreprises) {
    const ncc = (e.ncc || '').trim().toLowerCase();
    if (!ncc) continue;
    if (!byNcc.has(ncc)) byNcc.set(ncc, []);
    byNcc.get(ncc).push(e);
  }
  for (const [ncc, list] of byNcc) {
    if (list.length > 1) {
      groups.push({ type: 'ncc', criterion: `NCC ${ncc}`, members: list, confidence: 1.0 });
      list.forEach(e => seen.add(e.id));
    }
  }

  // 2. Groupes par raison sociale fuzzy (uniquement parmi les non-déjà-groupés)
  const remaining = entreprises.filter(e => !seen.has(e.id));
  for (let i = 0; i < remaining.length; i++) {
    const a = remaining[i];
    if (seen.has(a.id)) continue;
    const cluster = [a];
    for (let j = i + 1; j < remaining.length; j++) {
      const b = remaining[j];
      if (seen.has(b.id)) continue;
      const sim = similarity(a.raisonSociale, b.raisonSociale);
      if (sim >= 0.85) {
        cluster.push(b);
        seen.add(b.id);
      }
    }
    if (cluster.length > 1) {
      groups.push({
        type: 'fuzzy',
        criterion: `Raison sociale similaire à « ${a.raisonSociale} »`,
        members: cluster,
        confidence: 0.85
      });
      seen.add(a.id);
    }
  }

  return groups;
}

function renderDuplicatesTab(groups, allEntreprises) {
  if (groups.length === 0) {
    return el('div', {
      style: { padding: '32px', textAlign: 'center', color: '#6b7280', background: '#f9fafb', borderRadius: '8px' }
    }, '✅ Aucun doublon probable détecté.');
  }

  return el('div', {}, groups.map((group, gIdx) => el('div', {
    style: {
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }
  }, [
    el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' } }, [
      el('div', {}, [
        el('div', { style: { fontSize: '13px', fontWeight: 600, color: '#111827' } },
          group.type === 'ncc' ? '🔴 NCC identique' : `🟡 Raisons sociales similaires (${(group.confidence * 100).toFixed(0)} %)`),
        el('div', { style: { fontSize: '11px', color: '#6b7280', marginTop: '2px' } }, group.criterion)
      ])
    ]),
    el('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' } }, [
      el('thead', {}, [
        el('tr', { style: { background: '#f9fafb' } }, [
          el('th', { style: thStyle('left', '10px') }, 'Raison sociale'),
          el('th', { style: thStyle('left', '10px') }, 'NCC'),
          el('th', { style: thStyle('left', '10px') }, 'Adresse'),
          el('th', { style: thStyle('left', '10px') }, 'Statut'),
          el('th', { style: thStyle('left', '10px') }, 'Créée le'),
          el('th', { style: thStyle('right', '10px') }, 'Action')
        ])
      ]),
      el('tbody', {}, group.members.map((ent, mIdx) => {
        // Les "autres membres du groupe" sont les cibles potentielles de fusion
        const targets = group.members.filter(m => m.id !== ent.id);
        return el('tr', { style: { borderBottom: '1px solid #f3f4f6' } }, [
          el('td', { style: tdStyle('strong', '10px') }, ent.raisonSociale || '-'),
          el('td', { style: { ...tdStyle('monospace', '10px'), fontSize: '11px' } }, ent.ncc || '-'),
          el('td', { style: { ...tdStyle('small', '10px'), fontSize: '11px' } }, ent.adresse || '-'),
          el('td', { style: tdStyle('small', '10px') }, renderStatusBadge(ent.validationStatus)),
          el('td', { style: { ...tdStyle('small', '10px'), fontSize: '11px' } }, ent.createdAt ? new Date(ent.createdAt).toLocaleDateString('fr-FR') : '-'),
          el('td', { style: { ...tdStyle('right', '10px'), whiteSpace: 'nowrap' } }, [
            targets.length > 0 ? renderMergeButton(ent, targets) : el('span', { style: { color: '#9ca3af', fontSize: '11px' } }, '-')
          ])
        ]);
      }))
    ])
  ])));
}

function renderMergeButton(source, targets) {
  // Si un seul candidat → bouton direct ; sinon menu déroulant
  if (targets.length === 1) {
    return el('button', {
      className: 'btn btn-sm btn-primary',
      onclick: () => handleMerge(source, targets[0])
    }, `→ Fusionner vers « ${truncate(targets[0].raisonSociale, 25)} »`);
  }
  // Multi-choix : un select + bouton
  const wrap = el('div', { style: { display: 'flex', gap: '4px', alignItems: 'center' } });
  const sel = el('select', { className: 'form-input', style: { fontSize: '11px', padding: '4px' } },
    [el('option', { value: '' }, '-- Cible --')].concat(targets.map(t => el('option', { value: t.id }, truncate(t.raisonSociale, 25))))
  );
  wrap.appendChild(sel);
  wrap.appendChild(el('button', {
    className: 'btn btn-sm btn-primary',
    onclick: () => {
      const tid = sel.value;
      if (!tid) { alert('Choisir une cible.'); return; }
      const target = targets.find(t => t.id === tid);
      if (target) handleMerge(source, target);
    }
  }, '→ Fusionner'));
  return wrap;
}

function renderStatusBadge(status) {
  const colors = {
    PENDING:   { bg: '#fef3c7', fg: '#92400e', label: '⏳ À valider' },
    VALIDATED: { bg: '#dcfce7', fg: '#166534', label: '✓ Validé' },
    MERGED:    { bg: '#e5e7eb', fg: '#374151', label: '🔗 Fusionné' }
  };
  const c = colors[status] || colors.VALIDATED;
  return el('span', {
    style: { padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: c.bg, color: c.fg }
  }, c.label);
}

// ============================================
// Fusion (cœur de Modif #44)
// ============================================

async function handleMerge(source, target) {
  const msg = `Fusionner cette fiche :\n\n` +
    `  📤 Source : « ${source.raisonSociale} »${source.ncc ? ` (NCC ${source.ncc})` : ''}\n\n` +
    `  ↓ vers la fiche cible :\n\n` +
    `  📥 Cible :  « ${target.raisonSociale} »${target.ncc ? ` (NCC ${target.ncc})` : ''}\n\n` +
    `Toutes les références (attributions, sous-traitants, soumissionnaires) seront ` +
    `mises à jour pour pointer vers la cible. La fiche source sera marquée MERGED ` +
    `et n'apparaîtra plus dans le picker.\n\nAction irréversible. Continuer ?`;
  if (!confirm(msg)) return;

  try {
    logger.info('[MpEntreprisesAdmin] Début de fusion', { source: source.id, target: target.id });

    // 1. Mettre à jour les attributions (entrepriseId à la racine + dans entreprises[] + sousTraitants[])
    const allAttributions = await dataService.query(ENTITIES.MP_ATTRIBUTION);
    let attrUpdated = 0;
    for (const attr of allAttributions || []) {
      const patched = patchEntrepriseIdInAttribution(attr, source.id, target.id);
      if (patched) {
        await dataService.update(ENTITIES.MP_ATTRIBUTION, attr.id, patched);
        attrUpdated++;
      }
    }

    // 2. Mettre à jour les procedures (soumissionnaires[])
    const allProcedures = await dataService.query(ENTITIES.MP_PROCEDURE);
    let procUpdated = 0;
    for (const proc of allProcedures || []) {
      const patched = patchEntrepriseIdInProcedure(proc, source.id, target.id);
      if (patched) {
        await dataService.update(ENTITIES.MP_PROCEDURE, proc.id, patched);
        procUpdated++;
      }
    }

    // 3. Marquer la fiche source comme MERGED
    await dataService.update(ENTITIES.MP_ENTREPRISE, source.id, {
      validationStatus: 'MERGED',
      mergedIntoId: target.id,
      updatedAt: new Date().toISOString()
    });

    invalidateEntreprisesCache();
    alert(`✓ Fusion terminée.\n${attrUpdated} attribution(s) et ${procUpdated} procédure(s) mises à jour.`);
    renderMpEntreprisesAdmin();
  } catch (err) {
    logger.error('[MpEntreprisesAdmin] Merge failed', err);
    alert('Erreur lors de la fusion : ' + (err.message || 'inconnue'));
  }
}

/**
 * Si l'attribution référence sourceId, retourne un patch avec les références
 * remplacées par targetId. Sinon retourne null (rien à mettre à jour).
 *
 * Cible :
 *   - attributaire.entrepriseId
 *   - attributaire.entreprises[i].entrepriseId
 *   - sousTraitants[i].entrepriseId
 *   - parLot[lotId].attributaire.* (idem)
 */
function patchEntrepriseIdInAttribution(attr, sourceId, targetId) {
  let touched = false;

  const patchAttributaireBlock = (attributaire) => {
    if (!attributaire) return attributaire;
    let blockTouched = false;
    const result = { ...attributaire };
    if (result.entrepriseId === sourceId) {
      result.entrepriseId = targetId;
      blockTouched = true;
    }
    if (Array.isArray(result.entreprises)) {
      result.entreprises = result.entreprises.map(e => {
        if (e?.entrepriseId === sourceId) { blockTouched = true; return { ...e, entrepriseId: targetId }; }
        return e;
      });
    }
    if (blockTouched) touched = true;
    return result;
  };

  const patchSousTraitants = (list) => {
    if (!Array.isArray(list)) return list;
    return list.map(st => {
      if (st?.entrepriseId === sourceId) { touched = true; return { ...st, entrepriseId: targetId }; }
      return st;
    });
  };

  const patched = { ...attr };
  if (patched.attributaire) patched.attributaire = patchAttributaireBlock(patched.attributaire);
  if (patched.sousTraitants) patched.sousTraitants = patchSousTraitants(patched.sousTraitants);

  // Multi-lot : parLot[lotId].attributaire et parLot[lotId].sousTraitants
  if (patched.parLot && typeof patched.parLot === 'object') {
    const newParLot = {};
    for (const [lotId, lotData] of Object.entries(patched.parLot)) {
      const lotPatched = { ...lotData };
      if (lotPatched.attributaire) lotPatched.attributaire = patchAttributaireBlock(lotPatched.attributaire);
      if (lotPatched.sousTraitants) lotPatched.sousTraitants = patchSousTraitants(lotPatched.sousTraitants);
      newParLot[lotId] = lotPatched;
    }
    patched.parLot = newParLot;
  }

  return touched ? patched : null;
}

/** Idem pour les soumissionnaires d'une procédure. */
function patchEntrepriseIdInProcedure(proc, sourceId, targetId) {
  let touched = false;
  const patched = { ...proc };
  if (Array.isArray(patched.soumissionnaires)) {
    patched.soumissionnaires = patched.soumissionnaires.map(s => {
      if (s?.entrepriseId === sourceId) { touched = true; return { ...s, entrepriseId: targetId }; }
      return s;
    });
  }
  return touched ? patched : null;
}

// ============================================
// Onglet « Toutes les fiches » (debug / consultation)
// ============================================

function renderAllTab(entreprises) {
  if (entreprises.length === 0) {
    return el('div', {
      style: { padding: '32px', textAlign: 'center', color: '#6b7280', background: '#f9fafb', borderRadius: '8px' }
    }, 'Aucune fiche dans le référentiel.');
  }

  return el('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' } }, [
    el('thead', {}, [
      el('tr', { style: { background: '#f9fafb', borderBottom: '1px solid #e5e7eb' } }, [
        el('th', { style: thStyle() }, 'Raison sociale'),
        el('th', { style: thStyle() }, 'NCC'),
        el('th', { style: thStyle() }, 'Statut'),
        el('th', { style: thStyle() }, 'Banque'),
        el('th', { style: thStyle() }, 'Créée le')
      ])
    ]),
    el('tbody', {}, entreprises.map(ent => el('tr', { style: { borderBottom: '1px solid #f3f4f6' } }, [
      el('td', { style: tdStyle('strong') }, ent.raisonSociale || '-'),
      el('td', { style: tdStyle('monospace') }, ent.ncc || '-'),
      el('td', { style: tdStyle() }, renderStatusBadge(ent.validationStatus || 'VALIDATED')),
      el('td', { style: tdStyle('small') }, ent.banque?.libelle || '-'),
      el('td', { style: tdStyle('small') }, ent.createdAt ? new Date(ent.createdAt).toLocaleDateString('fr-FR') : '-')
    ])))
  ]);
}

// ============================================
// Helpers de style
// ============================================

function thStyle(align = 'left', padding = '12px') {
  return {
    padding,
    textAlign: align,
    fontWeight: 600,
    fontSize: '11px',
    textTransform: 'uppercase',
    color: '#374151',
    letterSpacing: '0.3px'
  };
}

function tdStyle(variant = '', padding = '12px') {
  const base = { padding, verticalAlign: 'top', color: '#1f2937' };
  if (variant === 'strong')    return { ...base, fontWeight: 600 };
  if (variant === 'monospace') return { ...base, fontFamily: 'monospace', fontSize: '12px', color: '#374151' };
  if (variant === 'small')     return { ...base, fontSize: '12px', color: '#4b5563' };
  if (variant === 'right')     return { ...base, textAlign: 'right' };
  return base;
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.substring(0, max - 1) + '…' : str;
}
