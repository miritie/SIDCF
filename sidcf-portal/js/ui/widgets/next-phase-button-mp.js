/**
 * Widget « Passer à l'étape suivante » — Modif #69
 *
 * Pour les démos métier : permet à l'utilisateur de la maquette de simuler
 * l'avancement du marché à la phase suivante du workflow, sans avoir à
 * remplir tout le formulaire d'enregistrement.
 *
 * Placement : à mettre en bas de chaque écran phase, APRÈS les boutons
 * « Enregistrer » habituels. Visuellement distinct (ligne de séparation,
 * couleur différente, contexte démo explicite).
 *
 * Transition : met à jour operation.etat + operation.timeline, puis navigue
 * vers la fiche de vie (qui affichera la nouvelle phase courante).
 */

import { el } from '../../lib/dom.js';
import dataService, { ENTITIES } from '../../datastore/data-service.js';
import router from '../../router.js';
import logger from '../../lib/logger.js';

// Transitions autorisées et phase code correspondante dans la timeline
const TRANSITIONS = {
  PLANIFIE:  { nextEtat: 'EN_PROC',   timelineCode: 'EN_PROC',   label: 'Contractualisation' },
  EN_PROC:   { nextEtat: 'ATTRIBUE',  timelineCode: 'ATTRIBUE',  label: 'Enregistrement de marché' },
  // Modif #131 (E-1/E-9) — l'approbation est CONTENUE dans l'enregistrement :
  // plus de bouton orange « Passer à Approbation ». L'écran d'enregistrement
  // fait passer le marché à VISE (Approuvé) à la sauvegarde.
  ATTRIBUE:  null,
  VISE:      { nextEtat: 'EN_EXEC',   timelineCode: 'EN_EXEC',   label: 'Exécution' },
  EN_EXEC:   { nextEtat: 'CLOS',      timelineCode: 'CLOS',      label: 'Clôture (Achevé)' },
  EXECUTION: { nextEtat: 'CLOS',      timelineCode: 'CLOS',      label: 'Clôture (Achevé)' },
  CLOS:      null,    // terminal
  CLOTURE:   null,
  RESILIE:   null
};

/**
 * Rend le bouton « Passer à l'étape suivante » + sa carte explicative.
 *
 * @param {Object} opts
 * @param {string} opts.idOperation   - ID de l'opération courante
 * @param {Object} opts.operation     - Objet opération (pour son etat)
 * @returns {HTMLElement|null}        - null si terminal (rien à proposer)
 */
export function renderNextPhaseButton({ idOperation, operation }) {
  const etat = operation?.etat || 'PLANIFIE';
  const trans = TRANSITIONS[etat];
  if (!trans) {
    // États terminaux — pas de transition possible
    return el('div', {
      className: 'card',
      style: { marginTop: '24px', border: '1px dashed #d1d5db' }
    }, [
      el('div', { className: 'card-body', style: { padding: '12px 16px', textAlign: 'center', color: '#6b7280', fontSize: '13px' } },
        `🏁 Le marché est dans un état terminal (${etat}). Plus de transition possible.`)
    ]);
  }

  return el('div', {
    className: 'card',
    style: {
      marginTop: '24px',
      borderLeft: '4px solid #f59e0b',
      background: '#fffbeb'
    }
  }, [
    el('div', { className: 'card-body' }, [
      el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' } }, [
        el('div', { style: { flex: 1 } }, [
          el('div', { style: { fontSize: '12px', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' } },
            '🎬 Mode démonstration'),
          el('div', { style: { fontSize: '13px', color: '#78350f' } }, [
            'Pour faciliter la démonstration, vous pouvez faire avancer ce marché directement à l\'étape ',
            el('strong', {}, trans.label),
            ' sans remplir le formulaire complet ci-dessus.'
          ])
        ]),
        (() => {
          const btn = el('button', {
            type: 'button',
            className: 'btn',
            style: {
              background: '#f59e0b',
              color: '#fff',
              border: 0,
              padding: '10px 18px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }
          }, `⏭ Passer à : ${trans.label} →`);
          btn.addEventListener('click', async () => {
            if (btn.disabled) return;
            if (!confirm(`Faire avancer ce marché à l'étape « ${trans.label} » ?\n\nMode démo : cela met à jour l'état du marché sans remplir le formulaire.`)) return;
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.textContent = '⏳ Transition en cours…';
            try {
              const currentTimeline = Array.isArray(operation.timeline) ? operation.timeline : ['PLANIF'];
              const newTimeline = currentTimeline.includes(trans.timelineCode)
                ? currentTimeline
                : [...currentTimeline, trans.timelineCode];
              await dataService.update(ENTITIES.MP_OPERATION, idOperation, {
                etat: trans.nextEtat,
                timeline: newTimeline,
                updatedAt: new Date().toISOString()
              });
              logger.info('[NextPhase] Transition appliquée :', etat, '→', trans.nextEtat);
              router.navigate('/mp/fiche-marche', { idOperation });
            } catch (err) {
              logger.error('[NextPhase] Erreur transition — détail technique :', err);
              alert('⚠️ Impossible de faire avancer le marché pour le moment. Réessayez.');
              btn.disabled = false;
              btn.style.opacity = '1';
              btn.textContent = `⏭ Passer à : ${trans.label} →`;
            }
          });
          return btn;
        })()
      ])
    ])
  ]);
}

export default renderNextPhaseButton;
