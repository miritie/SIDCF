/**
 * Widget : historique d'utilisation d'une ligne budgétaire (Marché+).
 *
 * Affiche pour une combinaison (activité × type de financement × bailleur) :
 *   - le bandeau de disponibilité (Initiale / Programmé cumulé / Disponible après)
 *   - le tableau des opérations PPM déjà rattachées à cette combinaison
 *
 * Objectif : permettre à l'utilisateur qui ajoute une nouvelle ligne PPM
 * (ou consulte une fiche existante) de voir d'un coup d'œil toutes les
 * autres opérations qui consomment la même ligne budgétaire, pour éviter
 * les ressaisies et garantir la cohérence du cumul.
 *
 * Le cumul affiché inclut systématiquement :
 *   - toutes les opérations existantes pertinentes (sauf `excludeOperationId`)
 *   - + le montant courant `currentMontant` (la ligne en cours de saisie)
 *
 * Usage :
 *   const node = renderBudgetLineHistory({
 *     activiteCode, typeFin, bailleur,
 *     mpBudgetLines, mpOperations,
 *     currentMontant: 12_000_000,         // optionnel
 *     excludeOperationId: 'OP-2025-001',  // optionnel (édition / consult)
 *     onNavigate: (op) => router.navigate('/mp/fiche-marche', { idOperation: op.id })
 *   });
 *   host.appendChild(node);
 *
 *   // Mise à jour ultérieure des paramètres (refresh dynamique)
 *   node._budgetHistory.update({ activiteCode, typeFin, bailleur, currentMontant });
 */

import { el } from '../../lib/dom.js';
import { renderFormulaBadge } from './formula-tip-mp.js';

function formatXOF(n) {
  const v = Number(n) || 0;
  return new Intl.NumberFormat('fr-FR').format(v) + ' XOF';
}

function findBudgetLine(activiteCode, typeFin, bailleur, mpBudgetLines) {
  if (!activiteCode || !typeFin || !bailleur) return null;
  return (mpBudgetLines || []).find(b =>
    (b.activiteCode || '') === activiteCode &&
    (b.typeFinancement || '') === typeFin &&
    (b.sourceFinancement || '') === bailleur
  ) || null;
}

/**
 * Pour la combinaison donnée, retourne la liste { op, montant } des
 * opérations existantes qui contribuent à cette ligne budgétaire,
 * + le total cumulé (hors excludeOperationId).
 */
function collectMatchingOperations(activiteCode, typeFin, bailleur, mpOperations, excludeOperationId) {
  const items = [];
  let total = 0;
  for (const op of (mpOperations || [])) {
    if (excludeOperationId && op.id === excludeOperationId) continue;
    const opActivite = op?.chaineBudgetaire?.activiteCode || '';
    if (opActivite !== activiteCode) continue;

    // Multi-financement : sommer uniquement les financements qui matchent
    if (Array.isArray(op?.chaineBudgetaire?.financements) && op.chaineBudgetaire.financements.length > 0) {
      let contributionForThisOp = 0;
      for (const f of op.chaineBudgetaire.financements) {
        if ((f.typeFinancement || '') === typeFin && (f.bailleur || '') === bailleur) {
          contributionForThisOp += Number(f.montant) || 0;
        }
      }
      if (contributionForThisOp > 0) {
        items.push({ op, montant: contributionForThisOp });
        total += contributionForThisOp;
      }
    } else {
      // Legacy : 1 financement par opération sur la racine
      if ((op.typeFinancement || '') === typeFin && (op.sourceFinancement || '') === bailleur) {
        const m = Number(op.montantPrevisionnel) || 0;
        if (m > 0) {
          items.push({ op, montant: m });
          total += m;
        }
      }
    }
  }
  return { items, total };
}

/**
 * @param {Object} opts
 * @param {string} opts.activiteCode
 * @param {string} opts.typeFin
 * @param {string} opts.bailleur
 * @param {Array}  opts.mpBudgetLines
 * @param {Array}  opts.mpOperations
 * @param {number} [opts.currentMontant=0] Montant de la ligne en cours de saisie (ajouté au cumul)
 * @param {string} [opts.excludeOperationId] ID de l'opération à exclure du tableau et du cumul "autres"
 * @param {Function} [opts.onNavigate] Callback (op) -> void quand on clique sur une opération
 * @param {Object}  [opts.registries] Référentiels (pour libellés type marché, mode passation, état)
 * @returns {HTMLElement} Élément à insérer + API .update(...) sur _budgetHistory
 */
export function renderBudgetLineHistory(opts = {}) {
  const state = {
    activiteCode: opts.activiteCode || '',
    typeFin: opts.typeFin || '',
    bailleur: opts.bailleur || '',
    mpBudgetLines: opts.mpBudgetLines || [],
    mpOperations: opts.mpOperations || [],
    currentMontant: Number(opts.currentMontant) || 0,
    excludeOperationId: opts.excludeOperationId || null,
    onNavigate: typeof opts.onNavigate === 'function' ? opts.onNavigate : null,
    registries: opts.registries || {}
  };

  const container = el('div', {
    className: 'budget-line-history',
    style: {
      marginTop: '8px',
      padding: '10px 12px',
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '13px'
    }
  });

  function render() {
    container.innerHTML = '';

    if (!state.activiteCode || !state.typeFin || !state.bailleur) {
      container.appendChild(el('div', {
        style: { color: '#6b7280', fontStyle: 'italic' }
      }, '— Sélectionnez activité, type de financement et bailleur pour voir les opérations déjà planifiées —'));
      return;
    }

    const line = findBudgetLine(state.activiteCode, state.typeFin, state.bailleur, state.mpBudgetLines);
    const { items, total: usedOther } = collectMatchingOperations(
      state.activiteCode, state.typeFin, state.bailleur, state.mpOperations, state.excludeOperationId
    );
    const initial = Number(line?.ae) || 0;
    const usedWithCurrent = usedOther + state.currentMontant;
    const available = initial - usedWithCurrent;
    const isOver = available < 0;

    // Bandeau de synthèse
    const synthesis = el('div', {
      style: {
        padding: '8px 10px',
        background: isOver ? '#fee2e2' : (initial > 0 ? '#ecfdf5' : '#fef3c7'),
        color: isOver ? '#7f1d1d' : (initial > 0 ? '#064e3b' : '#92400e'),
        borderLeft: `4px solid ${isOver ? '#dc2626' : (initial > 0 ? '#16a34a' : '#f59e0b')}`,
        borderRadius: '4px',
        marginBottom: items.length > 0 ? '10px' : '0',
        fontSize: '13px',
        lineHeight: '1.5'
      }
    });

    if (!line) {
      synthesis.innerHTML = `⚠ Aucune ligne budgétaire enregistrée pour la combinaison <code>${state.activiteCode}</code> / ${state.typeFin} / ${state.bailleur}.`;
    } else {
      const sep = '<span style="margin:0 8px;color:#d1d5db;">|</span>';
      const labelDispo = isOver ? 'DÉPASSEMENT' : 'Disponible après';
      synthesis.innerHTML =
        `<span style="font-weight:600;">Initiale :</span> ${formatXOF(initial)}` + sep +
        `<span style="font-weight:600;">Autres opérations :</span> ${formatXOF(usedOther)}` + sep +
        `<span style="font-weight:600;">Cumul + ligne courante :</span> ${formatXOF(usedWithCurrent)}` + sep +
        `<span style="font-weight:600;">${labelDispo} :</span> <strong>${formatXOF(Math.abs(available))}${isOver ? ' ⚠' : ''}</strong>`;
    }
    container.appendChild(synthesis);
    // Modif #37 — Badge formule sur le bandeau de cumul
    if (line) {
      const formulaWrap = el('div', { style: { marginTop: '4px', textAlign: 'right' } }, [
        el('span', { style: { fontSize: '11px', color: '#6b7280' } }, 'Méthode '),
        renderFormulaBadge({
          titre: 'Cumul d\'utilisation d\'une ligne budgétaire',
          formule: 'Initiale (AE) − (Σ autres opérations PPM sur cette combinaison activité × type × bailleur + ligne courante)',
          regle: 'Le cumul prend en compte toutes les opérations PPM rattachées à la même combinaison, qu\'elles soient au stade planification ou plus avancées. L\'opération en cours de saisie est ajoutée au total. Si négatif → dépassement budgétaire (alerte rouge).',
          exemple: 'Ligne 500 M, 3 opérations existantes pour 350 M, nouvelle opération 100 M ⇒ disponible après = 500 − 450 = 50 M (vert)',
          reference: 'Modif #27 · F002 du SDF'
        })
      ]);
      container.appendChild(formulaWrap);
    }

    // En-tête de section liste
    const headerRow = el('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }
    }, [
      el('div', { style: { fontWeight: 600, fontSize: '12px', color: '#374151' } },
        items.length === 0
          ? '✓ Aucune autre opération PPM déjà planifiée sur cette ligne'
          : `📋 ${items.length} opération${items.length > 1 ? 's' : ''} déjà planifiée${items.length > 1 ? 's' : ''} sur cette ligne`
      )
    ]);
    container.appendChild(headerRow);

    if (items.length === 0) return;

    // Tableau des opérations existantes
    const table = el('table', {
      className: 'table',
      style: { width: '100%', fontSize: '12px', margin: 0, background: '#fff', borderRadius: '4px', overflow: 'hidden' }
    }, [
      el('thead', {}, [el('tr', { style: { background: '#f3f4f6' } }, [
        el('th', { style: { padding: '6px 8px', textAlign: 'left' } }, 'N°'),
        el('th', { style: { padding: '6px 8px', textAlign: 'left' } }, 'Objet'),
        el('th', { style: { padding: '6px 8px', textAlign: 'left' } }, 'Mode'),
        el('th', { style: { padding: '6px 8px', textAlign: 'right' } }, 'Montant sur cette ligne'),
        el('th', { style: { padding: '6px 8px', textAlign: 'left' } }, 'État'),
        el('th', { style: { padding: '6px 8px', textAlign: 'center' } }, '')
      ])]),
      el('tbody', {}, items.map(({ op, montant }) => {
        const modePassation = state.registries.MODE_PASSATION?.find(m => m.code === op.modePassation);
        const etat = state.registries.ETAT_MARCHE?.find(e => e.code === op.etat);
        const objet = op.objet || '(sans objet)';
        const objetShort = objet.length > 50 ? objet.substring(0, 50) + '…' : objet;

        return el('tr', {
          style: { borderBottom: '1px solid #e5e7eb' }
        }, [
          el('td', { style: { padding: '5px 8px', fontFamily: 'monospace', fontSize: '11px', color: '#6b7280' } }, op.id || '-'),
          el('td', { style: { padding: '5px 8px' }, title: objet }, objetShort),
          el('td', { style: { padding: '5px 8px', fontSize: '11px' } }, modePassation?.label?.split('(')[0]?.trim() || op.modePassation || '-'),
          el('td', { style: { padding: '5px 8px', textAlign: 'right', fontWeight: 500 } }, formatXOF(montant)),
          el('td', { style: { padding: '5px 8px' } }, el('span', {
            className: `badge badge-${etat?.color || 'gray'}`,
            style: { fontSize: '10px' }
          }, etat?.label || op.etat || '-')),
          el('td', { style: { padding: '5px 8px', textAlign: 'center' } },
            state.onNavigate
              ? el('button', {
                  type: 'button',
                  className: 'btn btn-sm btn-secondary',
                  style: { padding: '2px 8px', fontSize: '11px' },
                  title: 'Ouvrir la fiche de vie de cette opération',
                  onclick: (e) => { e.preventDefault(); state.onNavigate(op); }
                }, 'Voir')
              : null
          )
        ]);
      }))
    ]);
    container.appendChild(table);
  }

  render();

  // API publique pour mise à jour dynamique (montant qui change, sélection qui change…)
  container._budgetHistory = {
    update(patch = {}) {
      let touched = false;
      for (const key of ['activiteCode', 'typeFin', 'bailleur', 'currentMontant', 'excludeOperationId']) {
        if (key in patch && patch[key] !== state[key]) {
          state[key] = patch[key];
          touched = true;
        }
      }
      if ('mpOperations' in patch) { state.mpOperations = patch.mpOperations || []; touched = true; }
      if ('mpBudgetLines' in patch) { state.mpBudgetLines = patch.mpBudgetLines || []; touched = true; }
      if (touched) render();
    },
    getTotalCumul() {
      const { total } = collectMatchingOperations(
        state.activiteCode, state.typeFin, state.bailleur, state.mpOperations, state.excludeOperationId
      );
      return total + state.currentMontant;
    },
    getMatchingOperations() {
      return collectMatchingOperations(
        state.activiteCode, state.typeFin, state.bailleur, state.mpOperations, state.excludeOperationId
      ).items.map(it => it.op);
    }
  };

  return container;
}

export default { renderBudgetLineHistory };
