/* ============================================
   Drawer Widget - Panneau latéral coulissant
   ============================================ */

import { el } from '../../lib/dom.js';

/**
 * Créer un drawer (panneau latéral)
 * @param {string} title - Titre du drawer
 * @param {HTMLElement|string} content - Contenu du drawer
 * @param {Object} options - Options
 * @returns {HTMLElement}
 */
export function createDrawer(title, content, options = {}) {
  const {
    width = '500px',
    position = 'right',
    onClose = null
  } = options;

  const drawer = el('div', { className: 'drawer drawer-open', id: 'drawer-overlay' });

  const panel = el('div', {
    className: `drawer-panel drawer-${position}`,
    style: { width }
  }, [
    // Header
    el('div', { className: 'drawer-header' }, [
      el('h3', { className: 'drawer-title' }, title),
      createCloseButton(() => closeDrawer(drawer, onClose))
    ]),

    // Body
    el('div', { className: 'drawer-body' },
      typeof content === 'string' ? [el('div', {}, content)] : [content]
    )
  ]);

  drawer.appendChild(panel);

  // Click outside to close
  drawer.addEventListener('click', (e) => {
    if (e.target === drawer) {
      closeDrawer(drawer, onClose);
    }
  });

  // ESC to close
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeDrawer(drawer, onClose);
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  return drawer;
}

/**
 * Créer bouton de fermeture
 */
function createCloseButton(onClick) {
  const btn = el('button', {
    className: 'drawer-close-btn',
    'aria-label': 'Fermer'
  }, '×');
  btn.addEventListener('click', onClick);
  return btn;
}

/**
 * Fermer et retirer le drawer
 */
function closeDrawer(drawer, onClose) {
  drawer.classList.remove('drawer-open');
  drawer.classList.add('drawer-closing');

  setTimeout(() => {
    drawer.remove();
    if (onClose) onClose();
  }, 300);
}

/**
 * Ouvrir un drawer avec du contenu
 * @param {string} title
 * @param {HTMLElement} content
 * @param {Object} options
 */
export function openDrawer(title, content, options = {}) {
  // Fermer drawer existant
  const existing = document.getElementById('drawer-overlay');
  if (existing) {
    existing.remove();
  }

  const drawer = createDrawer(title, content, options);
  document.body.appendChild(drawer);
}

export default { createDrawer, openDrawer };
