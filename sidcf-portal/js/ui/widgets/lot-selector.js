/* ============================================
   Lot Selector — widget commun aux écrans aval
   (Marché+ multi-lot — modif #13)
   ============================================
   Affiche en haut d'un écran un sélecteur du lot concerné. Si l'opération
   ne comporte qu'un seul lot (ou aucun défini), le widget retourne null
   (rien n'est affiché — comportement transparent).

   Le sélecteur déclenche une navigation vers la même route avec un param
   `lotId` mis à jour, ce qui force un re-render avec le nouveau lot.
*/

import { el } from '../../lib/dom.js';
import router from '../../router.js';

/**
 * @param {Object} cfg
 * @param {Array} cfg.lots - liste des lots de l'opération
 * @param {string|null} cfg.currentLotId
 * @param {string} cfg.route - route à laquelle re-naviguer (ex: '/mp/attribution')
 * @param {Object} cfg.routeParams - params de route à conserver (idOperation, etc.)
 * @returns {HTMLElement|null} - null si 0 ou 1 lot
 */
export function renderLotSelector(cfg) {
  const { lots, currentLotId, route, routeParams = {} } = cfg;
  if (!Array.isArray(lots) || lots.length <= 1) return null;

  const card = el('div', {
    className: 'card',
    style: {
      marginBottom: '20px',
      borderLeft: '4px solid #3b82f6',
      background: '#eff6ff'
    }
  }, [
    el('div', { className: 'card-body', style: { padding: '12px 16px' } }, [
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' } }, [
        el('div', { style: { fontSize: '13px', color: '#1e40af', fontWeight: '600' } }, [
          el('span', { style: { fontSize: '16px', marginRight: '6px' } }, '📦'),
          `Marché à ${lots.length} lots — sélectionnez le lot concerné :`
        ]),
        el('select', {
          className: 'form-input',
          style: { flex: '1', minWidth: '260px', maxWidth: '600px' },
          onchange: (e) => {
            router.navigate(route, { ...routeParams, lotId: e.target.value });
          }
        },
          lots.map(lot => el('option', {
            value: lot.id,
            selected: lot.id === currentLotId
          }, `Lot ${lot.numero} — ${lot.libelle || lot.objet || '(sans libellé)'}`))
        )
      ])
    ])
  ]);

  return card;
}

export default renderLotSelector;
