/**
 * Widget : Taux d'exécution physique du marché (Marché+ modif #136 — OBS-X3)
 *
 * Pendant « physique » du taux d'exécution financier (cockpit OP/mandats).
 * Permet de suivre l'avancement physique des travaux/prestations sous forme
 * d'un HISTORIQUE de relevés : chaque relevé = { date, taux (%), commentaire }.
 * Le dernier relevé (date la plus récente) donne le taux d'avancement courant.
 *
 * Stockage : tableau `avancementPhysique` porté par l'entité MP_OPERATION
 * (colonne JSONB — aucune migration). Saisie manuelle dans la fiche de vie.
 *
 * Visible uniquement pour les marchés en exécution ou postérieur
 * (EN_EXEC / EXECUTION / RESILIE / CLOS) — comme le cockpit financier.
 */

import { el } from '../../lib/dom.js';
import dataService, { ENTITIES } from '../../datastore/data-service.js';
import logger from '../../lib/logger.js';
import { date as fmtDate } from '../../lib/format.js';
import { uid } from '../../lib/uid.js';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Tri décroissant par date (puis par createdAt) — le plus récent d'abord
function sortDesc(items) {
  return [...items].sort((a, b) => {
    const d = String(b.date || '').localeCompare(String(a.date || ''));
    if (d !== 0) return d;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
}

function clampTaux(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

/**
 * @param {Object}   opts
 * @param {Object}   opts.operation - opération courante (porte avancementPhysique[])
 * @param {Function} [opts.onSaved] - callback(items) après chaque enregistrement
 * @returns {HTMLElement}
 */
export function renderAvancementPhysique({ operation, onSaved } = {}) {
  let items = Array.isArray(operation?.avancementPhysique) ? [...operation.avancementPhysique] : [];

  const container = el('div', { className: 'avancement-physique-mp' });

  function isMarcheEnExecution() {
    const etat = operation?.etat;
    return etat === 'EN_EXEC' || etat === 'EXECUTION' || etat === 'RESILIE' || etat === 'CLOS';
  }

  async function persist(nextItems) {
    try {
      await dataService.update(ENTITIES.MP_OPERATION, operation.id, {
        avancementPhysique: nextItems,
        updatedAt: new Date().toISOString()
      });
      items = nextItems;
      if (operation) operation.avancementPhysique = nextItems; // garde la fiche cohérente sans reload
      logger.info('[AvancementPhysique] Relevés enregistrés', { count: nextItems.length });
      render();
      if (onSaved) await onSaved(items);
    } catch (err) {
      logger.error('[AvancementPhysique] Erreur persistence', err);
      alert(`❌ Impossible d'enregistrer le relevé : ${err?.message || err}`);
    }
  }

  function deleteItem(id) {
    const cible = items.find(i => i.id === id);
    if (!confirm(`Supprimer le relevé du ${fmtDate(cible?.date)} (${clampTaux(cible?.taux)} %) ?`)) return;
    persist(items.filter(i => i.id !== id));
  }

  function render() {
    container.innerHTML = '';

    if (!isMarcheEnExecution()) {
      container.appendChild(el('div', {
        style: {
          padding: '14px 16px', background: '#f9fafb', border: '1px solid #e5e7eb',
          borderLeft: '4px solid #9ca3af', borderRadius: '6px', fontSize: '13px', color: '#6b7280'
        }
      }, 'Le taux d\'exécution physique se renseigne une fois le marché en exécution (après émission de l\'OS de démarrage).'));
      return;
    }

    const sorted = sortDesc(items);
    const courant = sorted[0] || null;
    const tauxCourant = courant ? clampTaux(courant.taux) : 0;

    // ── Bandeau : taux courant + barre de progression ─────────────────────────
    const barColor = tauxCourant >= 100 ? '#16a34a' : tauxCourant >= 50 ? '#0ea5e9' : '#f59e0b';
    container.appendChild(el('div', {
      style: { marginBottom: '16px' }
    }, [
      el('div', { style: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '6px' } }, [
        el('div', { style: { fontSize: '13px', color: '#374151', fontWeight: 600 } }, 'Taux d\'avancement physique courant'),
        el('div', { style: { fontSize: '22px', fontWeight: 700, color: barColor } }, `${tauxCourant.toFixed(0)} %`)
      ]),
      el('div', { style: { background: '#e5e7eb', borderRadius: '6px', height: '12px', overflow: 'hidden' } }, [
        el('div', { style: { width: `${tauxCourant}%`, height: '100%', background: barColor, transition: 'width .3s' } })
      ]),
      el('div', { style: { fontSize: '11px', color: '#6b7280', marginTop: '4px' } },
        courant
          ? `Dernier relevé : ${fmtDate(courant.date)}${courant.commentaire ? ' — ' + courant.commentaire : ''}`
          : 'Aucun relevé saisi pour l\'instant.')
    ]));

    // ── Formulaire d'ajout d'un relevé ────────────────────────────────────────
    const inputDate = el('input', { type: 'date', className: 'form-input', value: todayISO() });
    const inputTaux = el('input', { type: 'number', className: 'form-input', min: '0', max: '100', step: '1', placeholder: '%' });
    const inputComment = el('input', { type: 'text', className: 'form-input', placeholder: 'Commentaire (facultatif) : phase, observations…' });

    const addBtn = el('button', { type: 'button', className: 'btn btn-primary btn-sm' }, '➕ Ajouter le relevé');
    addBtn.addEventListener('click', () => {
      if (addBtn.disabled) return;
      const date = inputDate.value;
      if (!date) { alert('La date du relevé est obligatoire.'); return; }
      const rawTaux = inputTaux.value;
      if (rawTaux === '' || rawTaux === null) { alert('Le taux d\'avancement (%) est obligatoire.'); return; }
      const taux = clampTaux(rawTaux);

      // Garde-fou : avertir si régression par rapport au dernier relevé antérieur
      const anterieurs = sortDesc(items).filter(i => String(i.date) <= String(date));
      const precedent = anterieurs.find(i => i.date !== date) || null;
      if (precedent && taux < clampTaux(precedent.taux) &&
          !confirm(`⚠️ Ce taux (${taux} %) est inférieur au précédent relevé du ${fmtDate(precedent.date)} (${clampTaux(precedent.taux)} %). Enregistrer quand même ?`)) {
        return;
      }

      addBtn.disabled = true;
      const releve = {
        id: uid('AVP'),
        date,
        taux,
        commentaire: inputComment.value.trim(),
        createdAt: new Date().toISOString()
      };
      persist([...items, releve]).finally(() => { addBtn.disabled = false; });
    });

    container.appendChild(el('div', {
      style: {
        display: 'grid', gridTemplateColumns: '150px 110px 1fr auto', gap: '8px', alignItems: 'end',
        padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '14px'
      }
    }, [
      el('div', {}, [el('label', { className: 'form-label', style: { fontSize: '12px' } }, 'Date du relevé'), inputDate]),
      el('div', {}, [el('label', { className: 'form-label', style: { fontSize: '12px' } }, 'Taux (%)'), inputTaux]),
      el('div', {}, [el('label', { className: 'form-label', style: { fontSize: '12px' } }, 'Commentaire'), inputComment]),
      el('div', {}, [addBtn])
    ]));

    // ── Historique des relevés ────────────────────────────────────────────────
    if (sorted.length === 0) {
      container.appendChild(el('p', {
        className: 'text-muted',
        style: { fontStyle: 'italic', padding: '12px', textAlign: 'center', background: '#fafafa', borderRadius: '6px' }
      }, 'Aucun relevé d\'avancement physique. Ajoutez-en un pour suivre la progression du marché.'));
      return;
    }

    const rows = sorted.map((it, idx) => {
      const taux = clampTaux(it.taux);
      const next = sorted[idx + 1]; // relevé immédiatement antérieur (liste triée desc)
      const delta = next ? taux - clampTaux(next.taux) : null;
      const deltaCell = delta === null
        ? '—'
        : el('span', { style: { color: delta > 0 ? '#16a34a' : delta < 0 ? '#dc2626' : '#6b7280', fontWeight: 600 } },
            `${delta > 0 ? '+' : ''}${delta.toFixed(0)} pt`);
      return el('tr', {}, [
        el('td', {}, fmtDate(it.date)),
        el('td', { style: { fontWeight: 600 } }, `${taux.toFixed(0)} %`),
        el('td', { style: { textAlign: 'center' } }, [deltaCell]),
        el('td', { style: { fontSize: '12px', color: '#374151' } }, it.commentaire || '-'),
        el('td', { style: { textAlign: 'center' } }, [
          el('button', { className: 'btn btn-sm btn-danger', onclick: () => deleteItem(it.id) }, '🗑')
        ])
      ]);
    });

    container.appendChild(el('div', { style: { overflowX: 'auto' } }, [
      el('table', { className: 'table', style: { width: '100%', fontSize: '13px' } }, [
        el('thead', {}, [el('tr', {}, [
          el('th', {}, 'Date du relevé'),
          el('th', {}, 'Taux'),
          el('th', { style: { textAlign: 'center' } }, 'Évolution'),
          el('th', {}, 'Commentaire'),
          el('th', { style: { textAlign: 'center' } }, 'Action')
        ])]),
        el('tbody', {}, rows)
      ])
    ]));
  }

  render();
  return container;
}

export default renderAvancementPhysique;
