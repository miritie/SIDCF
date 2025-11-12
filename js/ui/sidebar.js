/* ============================================
   Sidebar Component
   IMPORTANT: Returns content only (NOT <aside> wrapper)
   ============================================ */

import { el } from '../lib/dom.js';
import dataService from '../datastore/data-service.js';

export function renderSidebar() {
  const config = dataService.getConfig();
  const features = config?.features || {};

  // Build navigation structure
  const navSections = [];

  // Portal section
  navSections.push(
    el('div', { className: 'sidebar-section' }, [
      el('div', { className: 'sidebar-section-title' }, 'Navigation'),
      el('nav', { className: 'sidebar-nav' }, [
        el('a', {
          href: '#/portal',
          className: 'nav-item'
        }, [
          el('span', { className: 'nav-item-icon' }, '🏠'),
          el('span', {}, 'Portail')
        ])
      ])
    ])
  );

  // Modules section
  if (features.moduleMarche) {
    navSections.push(
      el('div', { className: 'sidebar-section' }, [
        el('div', { className: 'sidebar-section-title' }, 'Module Marché'),
        el('nav', { className: 'sidebar-nav' }, [
          el('a', { href: '#/ppm-list', className: 'nav-item' }, [
            el('span', { className: 'nav-item-icon' }, '📋'),
            el('span', {}, 'PPM & Opérations')
          ]),
          el('a', { href: '#/dashboard-cf', className: 'nav-item' }, [
            el('span', { className: 'nav-item-icon' }, '📊'),
            el('span', {}, 'Tableau de bord CF')
          ])
        ])
      ])
    );
  }

  // Admin section
  if (features.adminAccess) {
    navSections.push(
      el('div', { className: 'sidebar-section' }, [
        el('div', { className: 'sidebar-section-title' }, 'Administration'),
        el('nav', { className: 'sidebar-nav' }, [
          el('a', { href: '#/admin/institution', className: 'nav-item' }, [
            el('span', { className: 'nav-item-icon' }, '⚙️'),
            el('span', {}, 'Institution')
          ]),
          el('a', { href: '#/admin/referentiels', className: 'nav-item' }, [
            el('span', { className: 'nav-item-icon' }, '📚'),
            el('span', {}, 'Référentiels')
          ]),
          el('a', { href: '#/admin/regles', className: 'nav-item' }, [
            el('span', { className: 'nav-item-icon' }, '⚖️'),
            el('span', {}, 'Règles & Procédures')
          ]),
          el('a', { href: '#/admin/pieces', className: 'nav-item' }, [
            el('span', { className: 'nav-item-icon' }, '📄'),
            el('span', {}, 'Matrice des pièces')
          ])
        ])
      ])
    );
  }

  // Diagnostics section
  if (features.diagnostics) {
    navSections.push(
      el('div', { className: 'sidebar-section' }, [
        el('div', { className: 'sidebar-section-title' }, 'Diagnostics'),
        el('nav', { className: 'sidebar-nav' }, [
          el('a', { href: '#/diagnostics/health', className: 'nav-item' }, [
            el('span', { className: 'nav-item-icon' }, '🔍'),
            el('span', {}, 'État du système')
          ])
        ])
      ])
    );
  }

  return el('div', { className: 'sidebar-content' }, navSections);
}

export function mountSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.innerHTML = '';
    sidebar.appendChild(renderSidebar());
  }
}

export default { renderSidebar, mountSidebar };
