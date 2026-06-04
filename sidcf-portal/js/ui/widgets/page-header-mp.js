/**
 * Widget de header de page Marché+ — Modif #68
 *
 * Unifie le header de tous les écrans phase MP avec 3 informations claires :
 *   1. Breadcrumb « Vous êtes ici · Étape X » (situation sur l'écran)
 *   2. État courant du marché (PLANIFIE/EN_PROC/.../CLOS/RESILIE)
 *   3. Titre + objet + retour fiche
 *
 * Le user a explicitement demandé que sur CHAQUE écran on sache :
 *   « à quel niveau est le marché effectivement »
 *   « à quel niveau on se situe dans le workflow »
 */

import { el } from '../../lib/dom.js';
import router from '../../router.js';
import { ETAT_LABEL_MP } from '../../modules/marche-plus/etat-labels-mp.js';

// Mapping des couleurs par état pour le badge
const ETAT_COLORS = {
  PLANIFIE:  { bg: '#dbeafe', fg: '#1e40af', border: '#3b82f6' },
  EN_PROC:   { bg: '#fef3c7', fg: '#92400e', border: '#f59e0b' },
  ATTRIBUE:  { bg: '#fed7aa', fg: '#9a3412', border: '#ea580c' },
  VISE:      { bg: '#d1fae5', fg: '#065f46', border: '#10b981' },
  EN_EXEC:   { bg: '#ddd6fe', fg: '#5b21b6', border: '#8b5cf6' },
  EXECUTION: { bg: '#ddd6fe', fg: '#5b21b6', border: '#8b5cf6' },
  CLOS:      { bg: '#bbf7d0', fg: '#14532d', border: '#16a34a' },
  CLOTURE:   { bg: '#bbf7d0', fg: '#14532d', border: '#16a34a' },
  RESILIE:   { bg: '#fecaca', fg: '#7f1d1d', border: '#dc2626' }
};

/**
 * Rend un header de page MP cohérent.
 *
 * @param {Object} opts
 * @param {string} opts.idOperation       - ID de l'opération (pour le retour)
 * @param {Object} opts.operation         - Opération courante (pour état + objet)
 * @param {string} opts.phaseIcon         - Émoji de la phase (ex : '⚙️')
 * @param {string} opts.phaseLabel        - Libellé de la phase (ex : 'Exécution')
 * @param {string} opts.subEcran          - Optionnel : nom du sous-écran
 *                                          (ex : 'Avenants', 'Garanties')
 * @param {string} opts.titre             - Titre principal de l'écran
 * @param {string} [opts.retourLabel]     - Optionnel : label du bouton retour
 *                                          (par défaut « ← Retour fiche »)
 * @param {Function} [opts.onRetour]      - Optionnel : handler custom du retour
 * @returns {HTMLElement}
 */
export function renderPageHeaderMP(opts) {
  const {
    idOperation, operation, phaseIcon, phaseLabel,
    subEcran, titre, retourLabel, onRetour
  } = opts;

  const etat = operation?.etat || 'PLANIFIE';
  const etatLabel = ETAT_LABEL_MP[etat] || etat;
  const etatColors = ETAT_COLORS[etat] || ETAT_COLORS.PLANIFIE;

  return el('div', { className: 'page-header' }, [
    // Ligne 1 : bouton retour + badge état marché à droite
    el('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
    }, [
      (() => {
        const btn = el('button', { className: 'btn btn-secondary btn-sm' }, retourLabel || '← Retour fiche');
        btn.addEventListener('click', () => {
          if (onRetour) onRetour();
          else router.navigate('/mp/fiche-marche', { idOperation });
        });
        return btn;
      })(),
      el('div', {
        style: {
          padding: '4px 12px',
          background: etatColors.bg,
          color: etatColors.fg,
          border: `1px solid ${etatColors.border}`,
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.3px'
        }
      }, `📊 État effectif du marché : ${etatLabel}`)
    ]),
    // Ligne 2 : breadcrumb (où je suis dans le workflow)
    el('div', {
      style: {
        marginTop: '12px', marginBottom: '4px',
        fontSize: '12px', color: '#6366f1',
        textTransform: 'uppercase', letterSpacing: '0.5px',
        fontWeight: 600
      }
    }, `${phaseIcon} Vous consultez l'étape : ${phaseLabel}${subEcran ? ` (sous-écran ${subEcran})` : ''}`),
    // Ligne 3 : titre principal
    el('h1', { className: 'page-title' }, `${phaseIcon} ${phaseLabel} — ${titre}`),
    // Ligne 4 : objet / contexte
    el('p', { className: 'page-subtitle' }, operation?.objet || idOperation || '')
  ]);
}

export default renderPageHeaderMP;
