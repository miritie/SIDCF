/**
 * Widget : Affichage des formules et méthodes de calcul (Marché+ modif #37)
 *
 * Objectif : exposer en clair, à proximité de chaque KPI ou indicateur
 * calculé, la formule utilisée et la règle métier appliquée. Cela
 * permet :
 *   - aux métiers de vérifier la cohérence avec leur attente
 *   - aux devs de garantir la prise en compte sans dérive silencieuse
 *
 * Deux variantes :
 *   - renderFormulaBadge(opts) : une petite icône 📐 inline, tooltip
 *     native sur hover, popup détaillé au clic
 *   - renderFormulaBlock(opts) : un encart rectangulaire visible en
 *     permanence sous un KPI ou une section
 *
 * Utilisation typique :
 *   el('div', {}, [
 *     'Cumul avenants : 12.5%',
 *     renderFormulaBadge({
 *       titre: 'Cumul avenants',
 *       formule: 'Σ variationMontant / montantInitial × 100',
 *       regle: 'Seuil légal RG021 : ≤ 30 % du montant initial.',
 *       exemple: 'Marché 100 M XOF + 2 avenants de +15 M et +10 M : (15+10)/100 = 25 %'
 *     })
 *   ])
 */

import { el } from '../../lib/dom.js';

/**
 * Petit badge avec icône 📐 qui affiche la formule en popover au clic.
 *
 * @param {Object} opts
 * @param {string} opts.titre          Nom de la formule (ex : "Cumul avenants")
 * @param {string} opts.formule        Expression mathématique (ex : "Σ variationMontant / montantInitial × 100")
 * @param {string} [opts.regle]        Règle métier associée (ex : "Seuil légal ≤ 30 %")
 * @param {string} [opts.exemple]      Exemple concret (texte court)
 * @param {string} [opts.reference]    Référence légale ou SDF (ex : "Art. 97.3", "RG021")
 * @returns {HTMLElement}
 */
export function renderFormulaBadge(opts = {}) {
  const titre = opts.titre || 'Méthode de calcul';
  const formule = opts.formule || '';
  const regle = opts.regle || '';
  const exemple = opts.exemple || '';
  const reference = opts.reference || '';

  const tooltipText = [titre, formule, regle, reference && `Réf : ${reference}`]
    .filter(Boolean)
    .join('\n');

  const badge = el('button', {
    type: 'button',
    title: tooltipText,
    'aria-label': `Voir la formule de ${titre}`,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '18px',
      height: '18px',
      padding: '0',
      marginLeft: '6px',
      border: '1px solid #cbd5e1',
      borderRadius: '50%',
      background: '#f8fafc',
      color: '#0066cc',
      cursor: 'pointer',
      fontSize: '11px',
      lineHeight: '1',
      verticalAlign: 'middle'
    },
    onclick: (e) => { e.preventDefault(); e.stopPropagation(); openFormulaPopup(opts, e.currentTarget); },
    onmouseenter: (e) => { e.currentTarget.style.background = '#dbeafe'; },
    onmouseleave: (e) => { e.currentTarget.style.background = '#f8fafc'; }
  }, '📐');

  return badge;
}

/**
 * Encart visible en permanence sous un KPI ou une section. À utiliser
 * pour les indicateurs centraux où la transparence est critique.
 */
export function renderFormulaBlock(opts = {}) {
  const titre = opts.titre || 'Méthode de calcul';
  const formule = opts.formule || '';
  const regle = opts.regle || '';
  const exemple = opts.exemple || '';
  const reference = opts.reference || '';

  return el('div', {
    style: {
      marginTop: '6px',
      padding: '8px 10px',
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderLeft: '3px solid #0066cc',
      borderRadius: '4px',
      fontSize: '11px',
      color: '#374151',
      lineHeight: '1.45'
    }
  }, [
    el('div', { style: { fontWeight: 600, marginBottom: '2px' } }, `📐 ${titre}`),
    formule ? el('div', {}, [
      el('span', { style: { color: '#6b7280' } }, 'Formule : '),
      el('code', { style: { background: '#fff', padding: '1px 6px', borderRadius: '3px', fontFamily: 'monospace' } }, formule)
    ]) : null,
    regle ? el('div', { style: { marginTop: '2px' } }, [
      el('span', { style: { color: '#6b7280' } }, 'Règle : '),
      regle
    ]) : null,
    exemple ? el('div', { style: { marginTop: '2px', fontStyle: 'italic', color: '#6b7280' } },
      `Ex : ${exemple}`) : null,
    reference ? el('div', { style: { marginTop: '2px', color: '#6b7280', fontSize: '10px' } },
      `Référence : ${reference}`) : null
  ]);
}

/**
 * Popup déclenché au clic sur un badge. Affiche tous les détails.
 */
function openFormulaPopup(opts, anchor) {
  // Supprime un éventuel popup existant
  const old = document.getElementById('formula-popup');
  if (old) old.remove();

  const popup = el('div', {
    id: 'formula-popup',
    style: {
      position: 'absolute',
      zIndex: 10000,
      background: '#fff',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
      padding: '14px 16px',
      maxWidth: '420px',
      fontSize: '13px',
      lineHeight: '1.5'
    }
  }, [
    el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' } }, [
      el('div', { style: { fontWeight: 700, fontSize: '14px', color: '#0066cc' } }, `📐 ${opts.titre || 'Méthode de calcul'}`),
      el('button', {
        type: 'button',
        style: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#6b7280' },
        onclick: () => popup.remove()
      }, '✕')
    ]),
    opts.formule ? el('div', { style: { marginBottom: '8px' } }, [
      el('div', { style: { fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' } }, 'Formule'),
      el('code', { style: { display: 'block', background: '#f8fafc', padding: '6px 10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px' } }, opts.formule)
    ]) : null,
    opts.regle ? el('div', { style: { marginBottom: '8px' } }, [
      el('div', { style: { fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' } }, 'Règle métier'),
      el('div', { style: { fontSize: '13px' } }, opts.regle)
    ]) : null,
    opts.exemple ? el('div', { style: { marginBottom: '8px' } }, [
      el('div', { style: { fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' } }, 'Exemple'),
      el('div', { style: { fontSize: '12px', fontStyle: 'italic', color: '#374151' } }, opts.exemple)
    ]) : null,
    opts.reference ? el('div', { style: { borderTop: '1px solid #e5e7eb', paddingTop: '6px', marginTop: '8px' } }, [
      el('div', { style: { fontSize: '11px', color: '#6b7280' } }, 'Référence : '),
      el('div', { style: { fontSize: '12px', fontWeight: 500 } }, opts.reference)
    ]) : null
  ]);

  // Positionnement relatif à l'ancre
  document.body.appendChild(popup);
  const rect = anchor.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();
  let top = rect.bottom + window.scrollY + 8;
  let left = rect.left + window.scrollX - (popupRect.width / 2) + (rect.width / 2);
  if (left < 8) left = 8;
  if (left + popupRect.width > window.innerWidth - 8) left = window.innerWidth - popupRect.width - 8;
  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;

  // Fermeture sur clic dehors
  setTimeout(() => {
    const closer = (e) => {
      if (!popup.contains(e.target)) {
        popup.remove();
        document.removeEventListener('click', closer, true);
      }
    };
    document.addEventListener('click', closer, true);
  }, 0);
}

export default { renderFormulaBadge, renderFormulaBlock };
