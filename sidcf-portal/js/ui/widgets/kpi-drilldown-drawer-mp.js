/* ============================================
   Marché+ — Drawer « arrière-table » d'une tuile KPI
   ============================================
   Modif #42 — Drawer latéral générique pour afficher la liste des
   enregistrements derrière une tuile KPI de la fiche de vie marché
   (Cumul avenants, Échéancier, Garanties, OS, Difficultés).

   Caractéristiques :
   - Listing simple en lecture seule
   - Clic sur une ligne → navigation vers l'écran dédié (passé par l'appelant)
   - Aucun bouton de création (la création se fait via l'écran dédié)
   ============================================ */

import { el } from '../../lib/dom.js';

/**
 * Ouvre un drawer glissant depuis la droite avec une table d'enregistrements.
 *
 * @param {Object} opts
 * @param {string} opts.title - Titre du drawer (ex: « Avenants approuvés »)
 * @param {string} [opts.subtitle] - Sous-titre informatif (ex: « 3 enregistrement(s) »)
 * @param {Array<{key: string, label: string, align?: 'left'|'right'|'center', width?: string}>} opts.columns
 * @param {Array<Object>} opts.rows - Données. Chaque row est passée à `cellRender(row, col)`.
 * @param {(row: Object, column: Object) => *} [opts.cellRender] - Custom cell renderer. Default : row[col.key].
 * @param {(row: Object) => void} [opts.onRowClick] - Handler au clic sur une ligne.
 * @param {string} [opts.emptyMessage] - Texte affiché si rows est vide. Default : « Aucun enregistrement ».
 * @param {string} [opts.footerHint] - Petit texte d'aide en bas du drawer.
 */
export function openKpiDrilldownDrawer(opts) {
  const {
    title,
    subtitle,
    columns = [],
    rows = [],
    cellRender,
    onRowClick,
    emptyMessage = 'Aucun enregistrement à afficher.',
    footerHint
  } = opts || {};

  // Si un drawer KPI est déjà ouvert, on le ferme avant d'en ouvrir un nouveau
  const existing = document.getElementById('kpi-drilldown-drawer');
  if (existing) existing.remove();

  // Overlay (clic = fermeture)
  const overlay = el('div', {
    id: 'kpi-drilldown-drawer',
    style: {
      position: 'fixed',
      top: '0', left: '0', right: '0', bottom: '0',
      background: 'rgba(15, 23, 42, 0.35)',
      zIndex: '900',
      animation: 'fadeIn 0.12s ease-out'
    },
    onclick: () => overlay.remove()
  });

  // Panneau latéral droit
  const panel = el('div', {
    style: {
      position: 'absolute',
      top: '0', right: '0', bottom: '0',
      width: 'min(720px, 92vw)',
      background: '#fff',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInRight 0.18s ease-out'
    },
    onclick: (e) => e.stopPropagation()
  }, [
    // En-tête
    el('div', {
      style: {
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px',
        background: '#f9fafb'
      }
    }, [
      el('div', { style: { flex: 1, minWidth: 0 } }, [
        el('div', { style: { fontSize: '15px', fontWeight: 600, color: '#111827' } }, title || ''),
        subtitle ? el('div', { style: { fontSize: '12px', color: '#6b7280', marginTop: '2px' } }, subtitle) : null
      ]),
      el('button', {
        className: 'btn btn-secondary btn-sm',
        onclick: () => overlay.remove(),
        title: 'Fermer'
      }, '✕')
    ]),

    // Corps : table ou message vide
    el('div', {
      style: { flex: 1, overflowY: 'auto', padding: rows.length ? '0' : '24px' }
    }, [
      rows.length === 0
        ? el('div', {
            style: {
              padding: '32px 16px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '13px',
              background: '#f9fafb',
              border: '1px dashed #d1d5db',
              borderRadius: '6px'
            }
          }, emptyMessage)
        : el('table', {
            style: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' }
          }, [
            el('thead', {}, [
              el('tr', { style: { background: '#f9fafb', borderBottom: '1px solid #e5e7eb' } },
                columns.map(c => el('th', {
                  style: {
                    padding: '10px 14px',
                    textAlign: c.align || 'left',
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    width: c.width || 'auto',
                    position: 'sticky',
                    top: 0,
                    background: '#f9fafb'
                  }
                }, c.label))
              )
            ]),
            el('tbody', {},
              rows.map((row, idx) => el('tr', {
                style: {
                  borderBottom: '1px solid #f3f4f6',
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background 0.1s'
                },
                onmouseenter: (e) => { if (onRowClick) e.currentTarget.style.background = '#f9fafb'; },
                onmouseleave: (e) => { e.currentTarget.style.background = ''; },
                onclick: onRowClick ? () => { overlay.remove(); onRowClick(row); } : null
              },
                columns.map(c => el('td', {
                  style: {
                    padding: '10px 14px',
                    textAlign: c.align || 'left',
                    color: '#1f2937',
                    verticalAlign: 'top'
                  }
                }, cellRender ? cellRender(row, c) : (row[c.key] != null ? String(row[c.key]) : '-')))
              ))
            )
          ])
    ]),

    // Pied (optionnel)
    footerHint ? el('div', {
      style: {
        padding: '10px 20px',
        borderTop: '1px solid #e5e7eb',
        fontSize: '11px',
        color: '#6b7280',
        background: '#f9fafb'
      }
    }, footerHint) : null
  ]);

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  // Animations CSS injectées une seule fois
  if (!document.getElementById('kpi-drilldown-drawer-anim')) {
    const style = document.createElement('style');
    style.id = 'kpi-drilldown-drawer-anim';
    style.textContent = `
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
    `;
    document.head.appendChild(style);
  }

  // Échap pour fermer
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}
