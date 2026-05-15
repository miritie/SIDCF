/**
 * Widget : Situation d'exécution financière du marché (Marché+ modif #34)
 *
 * Affiche dans la fiche de vie les OP / Mandats rattachés au marché et
 * calcule les KPIs financiers d'exécution :
 *   - Cumul OP visé / Mandat
 *   - Cumul payé
 *   - Reste à payer
 *   - Taux d'exécution financier (Cumul OP / Montant global du marché)
 *   - Ratio de soutenabilité (si planification pluriannuelle disponible)
 *
 * Source : entité MP_DECOMPTE existante (champs numero, typeOP, montant,
 * dateDecompte, etat). Pour l'instant, saisie manuelle dans la fiche
 * en attendant l'intégration avec le module budget externe qui rattache
 * automatiquement les OP/Mandats lors de leur exécution.
 *
 * Visible uniquement pour les marchés dont l'état est en exécution ou
 * postérieur (EXECUTION, RESILIE, CLOS).
 */

import { el } from '../../lib/dom.js';
import dataService, { ENTITIES } from '../../datastore/data-service.js';
import logger from '../../lib/logger.js';
import { money, date as fmtDate } from '../../lib/format.js';
import { uid } from '../../lib/uid.js';
import { renderFormulaBadge } from './formula-tip-mp.js';

const TYPE_OP = [
  { code: 'OP', label: 'Ordre de Paiement (OP)' },
  { code: 'MANDAT', label: 'Mandat' },
  { code: 'DECOMPTE', label: 'Décompte (autre)' }
];

const ETATS = [
  { code: 'SOUMIS', label: 'Soumis', color: '#0066cc', bg: '#dbeafe' },
  { code: 'VISE',   label: 'Visé',   color: '#16a34a', bg: '#dcfce7' },
  { code: 'PAYE',   label: 'Payé',   color: '#059669', bg: '#d1fae5' },
  { code: 'REJETE', label: 'Rejeté', color: '#dc2626', bg: '#fee2e2' },
  { code: 'DRAFT',  label: 'Brouillon', color: '#6b7280', bg: '#f3f4f6' }
];

function metaEtat(code) {
  return ETATS.find(e => e.code === code) || ETATS[ETATS.length - 1];
}

/**
 * @param {Object} opts
 * @param {Object} opts.operation     l'opération courante (pour montant global, etat)
 * @param {Array}  opts.decomptes     liste initiale des MP_DECOMPTE
 * @param {Object} opts.attribution   pour récupérer le montant global HT/TTC du marché
 * @param {Array}  opts.avenants      pour calculer le montant global (base + variations)
 * @param {Function} [opts.onSaved]   callback async (decomptesArray) => void
 */
export function renderOpMandatManager({ operation, decomptes = [], attribution, avenants = [], onSaved } = {}) {
  let items = [...decomptes];

  // Calculer le montant global du marché : montant attribué (TTC si disponible) + somme des
  // variations d'avenants. Si pas d'attribution encore, fallback sur montantPrevisionnel.
  function getMontantGlobal() {
    const baseTTC = Number(attribution?.montants?.ttc) || Number(operation?.montantPrevisionnel) || 0;
    const totalAvenants = (avenants || []).reduce((s, a) => s + (Number(a?.variationMontant) || 0), 0);
    return baseTTC + totalAvenants;
  }

  const container = el('div', { className: 'op-mandat-manager-mp' });

  function isMarcheEnExecution() {
    const etat = operation?.etat;
    return etat === 'EXECUTION' || etat === 'RESILIE' || etat === 'CLOS';
  }

  function render() {
    container.innerHTML = '';

    if (!isMarcheEnExecution()) {
      container.appendChild(el('div', {
        style: {
          padding: '14px 16px',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderLeft: '4px solid #9ca3af',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#6b7280'
        }
      }, [
        el('strong', {}, 'Marché non encore en exécution. '),
        'Les OP / Mandats apparaîtront ici dès que le marché passera à l\'état Exécution.'
      ]));
      return;
    }

    container.appendChild(renderKPIs());
    container.appendChild(renderActions());
    container.appendChild(renderTable());
  }

  function renderKPIs() {
    const montantGlobal = getMontantGlobal();

    const cumulVise = items
      .filter(d => d.etat === 'VISE' || d.etat === 'PAYE')
      .reduce((s, d) => s + (Number(d.netTTC) || Number(d.acompteHTVA) || 0), 0);

    const cumulPaye = items
      .filter(d => d.etat === 'PAYE')
      .reduce((s, d) => s + (Number(d.netTTC) || Number(d.acompteHTVA) || 0), 0);

    const restePayer = Math.max(0, montantGlobal - cumulVise);
    const tauxExec = montantGlobal > 0 ? (cumulVise / montantGlobal) * 100 : 0;

    const tauxColor = tauxExec >= 90 ? '#16a34a'
      : tauxExec >= 50 ? '#0066cc'
      : tauxExec >= 25 ? '#f59e0b'
      : '#6b7280';

    function card(label, value, sub, color, formula) {
      return el('div', {
        style: {
          flex: '1 1 180px',
          padding: '10px 12px',
          background: '#fff',
          borderRadius: '6px',
          borderLeft: `4px solid ${color}`,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }
      }, [
        el('div', { style: { fontSize: '10px', textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.4px', display: 'flex', alignItems: 'center' } }, [
          el('span', {}, label),
          formula ? renderFormulaBadge(formula) : null
        ]),
        el('div', { style: { fontSize: '17px', fontWeight: 700, color, margin: '2px 0' } }, value),
        sub ? el('div', { style: { fontSize: '11px', color: '#6b7280' } }, sub) : null
      ]);
    }

    return el('div', {
      style: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }
    }, [
      card('Montant global du marché', money(montantGlobal),
        avenants?.length > 0 ? `base + ${avenants.length} avenant${avenants.length > 1 ? 's' : ''}` : 'base seule',
        '#0f5132',
        {
          titre: 'Montant global du marché',
          formule: 'montant attribué TTC + Σ variationMontant (avenants)',
          regle: 'Base de référence pour le taux d\'exécution. Inclut tous les avenants financiers (FINAN et MIXTE), pas les avenants de délai pur.',
          exemple: 'Attribution 100 M + avenant +20 M + avenant délai (sans montant) ⇒ Montant global = 120 M XOF'
        }),
      card('Cumul OP / Mandat visé', money(cumulVise),
        `${items.filter(d => d.etat === 'VISE' || d.etat === 'PAYE').length} pièce(s)`,
        '#0066cc',
        {
          titre: 'Cumul OP / Mandat visé',
          formule: 'Σ (montant) pour OP avec etat ∈ {VISE, PAYE}',
          regle: 'Somme des montants nets TTC des OP/Mandats visés par le CF, y compris ceux déjà payés. Les OP en état SOUMIS, DRAFT ou REJETE ne sont pas comptés.',
          reference: 'Doc DCF 5b'
        }),
      card('Cumul payé', money(cumulPaye),
        `${items.filter(d => d.etat === 'PAYE').length} pièce(s)`,
        '#059669',
        {
          titre: 'Cumul payé',
          formule: 'Σ (montant) pour OP avec etat = PAYE',
          regle: 'Somme des montants effectivement décaissés. Toujours ≤ Cumul visé.'
        }),
      card('Reste à payer', money(restePayer),
        montantGlobal > 0 ? `${((restePayer / montantGlobal) * 100).toFixed(1)}% du marché` : '',
        '#92400e',
        {
          titre: 'Reste à payer',
          formule: 'max(0, Montant global − Cumul OP visé)',
          regle: 'Indique le potentiel restant de paiement sur le marché. Ne peut pas être négatif (en cas de sur-visa, plafonné à 0).',
          reference: 'Doc DCF 5c'
        }),
      card('Taux d\'exécution financier', `${tauxExec.toFixed(1)}%`,
        montantGlobal > 0 ? `${money(cumulVise)} / ${money(montantGlobal)}` : 'montant global indéterminé',
        tauxColor,
        {
          titre: 'Taux d\'exécution financier',
          formule: 'Cumul OP visé / Montant global × 100',
          regle: 'Pourcentage d\'avancement financier. Code couleur : vert ≥90 % · bleu ≥50 % · orange ≥25 % · gris sinon.',
          exemple: 'Montant global 120 M, cumul visé 60 M ⇒ 60/120 = 50 % (bleu)',
          reference: 'Doc DCF 5d'
        })
    ]);
  }

  function renderActions() {
    return el('div', { style: { display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' } }, [
      el('button', {
        className: 'btn btn-sm btn-primary',
        onclick: () => openEditorModal(null)
      }, '➕ Ajouter un OP / Mandat')
    ]);
  }

  function renderTable() {
    if (items.length === 0) {
      return el('p', {
        className: 'text-muted',
        style: { fontStyle: 'italic', padding: '16px', textAlign: 'center', background: '#fafafa', borderRadius: '6px' }
      }, 'Aucun OP / Mandat enregistré sur ce marché.');
    }

    // Tri : plus récent d'abord, puis par numéro
    const sorted = [...items].sort((a, b) => {
      const d = (b.dateDecompte || '').localeCompare(a.dateDecompte || '');
      if (d !== 0) return d;
      return (b.numero || '').localeCompare(a.numero || '');
    });

    return el('table', { className: 'table', style: { width: '100%', fontSize: '13px' } }, [
      el('thead', {}, [el('tr', {}, [
        el('th', {}, 'Numéro'),
        el('th', {}, 'Type'),
        el('th', {}, 'Date'),
        el('th', { style: { textAlign: 'right' } }, 'Montant (XOF)'),
        el('th', {}, 'État'),
        el('th', {}, 'Bailleur'),
        el('th', { style: { textAlign: 'center' } }, 'Actions')
      ])]),
      el('tbody', {}, sorted.map(d => {
        const etatMeta = metaEtat(d.etat);
        const montant = Number(d.netTTC) || Number(d.acompteHTVA) || 0;
        return el('tr', {}, [
          el('td', { style: { fontWeight: 600, fontFamily: 'monospace', fontSize: '12px' } }, d.numero || d.numeroOP || '-'),
          el('td', { style: { fontSize: '12px' } }, TYPE_OP.find(t => t.code === d.typeOP)?.label?.replace(/\s*\(.*\)/, '') || d.typeOP || '-'),
          el('td', { style: { fontSize: '12px' } }, fmtDate(d.dateDecompte)),
          el('td', { style: { textAlign: 'right', fontWeight: 500 } }, money(montant)),
          el('td', {}, el('span', {
            style: {
              fontSize: '11px', fontWeight: 600,
              padding: '2px 8px', borderRadius: '10px',
              background: etatMeta.bg, color: etatMeta.color
            }
          }, etatMeta.label)),
          el('td', { style: { fontSize: '12px' } }, d.bailleur || '-'),
          el('td', { style: { textAlign: 'center' } }, [
            el('button', {
              className: 'btn btn-sm btn-secondary',
              style: { marginRight: '4px' },
              onclick: () => openEditorModal(d)
            }, '✏️'),
            el('button', {
              className: 'btn btn-sm btn-danger',
              onclick: () => deleteItem(d)
            }, '🗑')
          ])
        ]);
      }))
    ]);
  }

  // ----- Modal Editor -----

  function openEditorModal(existing) {
    const isEdit = !!existing;
    const draft = isEdit ? { ...existing } : {
      id: null,
      operationId: operation.id,
      numero: '',
      typeOP: 'OP',
      numeroOP: '',
      dateDecompte: new Date().toISOString().slice(0, 10),
      acompteHTVA: 0,
      netTTC: 0,
      etat: 'VISE',
      bailleur: '',
      tauxExecution: 0,
      documentRef: null
    };

    const modal = el('div', {
      className: 'modal-overlay',
      style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
      onclick: (e) => { if (e.target === modal) modal.remove(); }
    });

    const content = el('div', {
      style: { background: '#fff', borderRadius: '8px', width: '90%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '20px' }
    });

    content.appendChild(el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' } }, [
      el('h3', { style: { margin: 0, fontSize: '16px' } }, isEdit ? '✏️ Modifier OP / Mandat' : '➕ Nouvel OP / Mandat'),
      el('button', { className: 'btn btn-sm btn-secondary', onclick: () => modal.remove() }, '✕')
    ]));

    const grid = el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } });
    grid.appendChild(el('div', {}, [
      el('label', { className: 'form-label' }, ['Numéro', el('span', { className: 'required' }, '*')]),
      el('input', { type: 'text', className: 'form-input', id: 'op-numero', value: draft.numero || '', placeholder: 'Ex : OP-2026-0124' })
    ]));
    grid.appendChild(el('div', {}, [
      el('label', { className: 'form-label' }, 'Type'),
      el('select', { className: 'form-input', id: 'op-type' },
        TYPE_OP.map(t => el('option', { value: t.code, selected: draft.typeOP === t.code }, t.label))
      )
    ]));
    grid.appendChild(el('div', {}, [
      el('label', { className: 'form-label' }, 'Date'),
      el('input', { type: 'date', className: 'form-input', id: 'op-date', value: draft.dateDecompte || '' })
    ]));
    grid.appendChild(el('div', {}, [
      el('label', { className: 'form-label' }, ['Montant (XOF)', el('span', { className: 'required' }, '*')]),
      el('input', { type: 'number', className: 'form-input', id: 'op-montant', min: '0', step: '1', value: draft.netTTC || draft.acompteHTVA || 0 })
    ]));
    grid.appendChild(el('div', {}, [
      el('label', { className: 'form-label' }, 'État'),
      el('select', { className: 'form-input', id: 'op-etat' },
        ETATS.map(e => el('option', { value: e.code, selected: draft.etat === e.code }, e.label))
      )
    ]));
    grid.appendChild(el('div', {}, [
      el('label', { className: 'form-label' }, 'Bailleur'),
      el('input', { type: 'text', className: 'form-input', id: 'op-bailleur', value: draft.bailleur || '', placeholder: 'ETAT_CI, BM, BAD…' })
    ]));
    content.appendChild(grid);

    content.appendChild(el('div', { style: { marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'flex-end' } }, [
      el('button', { className: 'btn btn-secondary', onclick: () => modal.remove() }, 'Annuler'),
      el('button', {
        className: 'btn btn-primary',
        onclick: async () => {
          const numero = document.getElementById('op-numero').value.trim();
          if (!numero) { alert('Numéro obligatoire'); return; }
          const montant = parseFloat(document.getElementById('op-montant').value) || 0;
          if (montant <= 0) { alert('Montant invalide'); return; }
          const payload = {
            ...draft,
            numero,
            numeroOP: numero,
            typeOP: document.getElementById('op-type').value,
            dateDecompte: document.getElementById('op-date').value || null,
            netTTC: montant,
            acompteHTVA: montant,
            etat: document.getElementById('op-etat').value,
            bailleur: document.getElementById('op-bailleur').value.trim(),
            updatedAt: new Date().toISOString()
          };
          if (!payload.id) {
            payload.id = `DEC-${operation.id}-${uid('OP')}`;
            payload.operationId = operation.id;
            payload.createdAt = new Date().toISOString();
          }
          // Taux d'exécution cumulé pour cette ligne (montant ligne / montant global)
          const montantGlobal = getMontantGlobal();
          payload.tauxExecution = montantGlobal > 0 ? parseFloat(((montant / montantGlobal) * 100).toFixed(2)) : 0;
          await persist(payload, isEdit);
          modal.remove();
        }
      }, isEdit ? 'Enregistrer' : 'Ajouter')
    ]));

    modal.appendChild(content);
    document.body.appendChild(modal);
  }

  async function persist(payload, isEdit) {
    try {
      if (isEdit) {
        await dataService.update(ENTITIES.MP_DECOMPTE, payload.id, payload);
        const idx = items.findIndex(x => x.id === payload.id);
        if (idx >= 0) items[idx] = payload;
        logger.info('[OP/Mandat] Mise à jour', payload);
      } else {
        const result = await dataService.add(ENTITIES.MP_DECOMPTE, payload);
        items.push(result?.entity || payload);
        logger.info('[OP/Mandat] Création', payload);
      }
      render();
      if (onSaved) await onSaved(items);
    } catch (err) {
      logger.error('[OP/Mandat] Erreur persistence', err);
      alert(`❌ Erreur : ${err.message}`);
    }
  }

  async function deleteItem(d) {
    if (!confirm(`Supprimer ${d.numero || 'cet OP'} ?`)) return;
    try {
      await dataService.delete(ENTITIES.MP_DECOMPTE, d.id);
      items = items.filter(x => x.id !== d.id);
      render();
      if (onSaved) await onSaved(items);
    } catch (err) {
      alert(`❌ Erreur : ${err.message}`);
    }
  }

  // Helper exporté pour calcul de KPIs côté liste agrégée (modif #36)
  // Retourne uniquement la situation financière courante (sans dépendre de l'UI).
  render();
  return container;
}

/**
 * Helper pur : calcule les KPIs de situation d'exécution sans rendu.
 * Utilisé par les tuiles agrégées sur la liste PPM (modif #36).
 *
 * @returns {{ montantGlobal, cumulVise, cumulPaye, restePayer, tauxExec, sante }}
 *   sante = 'NORMAL' | 'SURVEILLER' | 'A_RISQUE' | 'BLOQUE' | 'NON_DEMARRE'
 */
export function computeExecutionFinanciere(operation, attribution, avenants = [], decomptes = []) {
  const baseTTC = Number(attribution?.montants?.ttc) || Number(operation?.montantPrevisionnel) || 0;
  const totalAvenants = (avenants || []).reduce((s, a) => s + (Number(a?.variationMontant) || 0), 0);
  const montantGlobal = baseTTC + totalAvenants;
  const cumulVise = (decomptes || [])
    .filter(d => d.etat === 'VISE' || d.etat === 'PAYE')
    .reduce((s, d) => s + (Number(d.netTTC) || Number(d.acompteHTVA) || 0), 0);
  const cumulPaye = (decomptes || [])
    .filter(d => d.etat === 'PAYE')
    .reduce((s, d) => s + (Number(d.netTTC) || Number(d.acompteHTVA) || 0), 0);
  const restePayer = Math.max(0, montantGlobal - cumulVise);
  const tauxExec = montantGlobal > 0 ? (cumulVise / montantGlobal) * 100 : 0;

  // Heuristique de santé financière — sera enrichie par durée d'exécution dans modif #36
  let sante = 'NON_DEMARRE';
  if (operation?.etat === 'EXECUTION' || operation?.etat === 'CLOS') {
    const cumulAvenantPct = baseTTC > 0 ? (totalAvenants / baseTTC) * 100 : 0;
    if (operation?.etat === 'CLOS' && tauxExec >= 95) sante = 'NORMAL';
    else if (cumulAvenantPct >= 30) sante = 'A_RISQUE';
    else if (cumulAvenantPct >= 25 || tauxExec < 10) sante = 'SURVEILLER';
    else sante = 'NORMAL';
  }
  return { montantGlobal, cumulVise, cumulPaye, restePayer, tauxExec, sante };
}

export default { renderOpMandatManager, computeExecutionFinanciere };
