/* ============================================
   Topbar Component
   ============================================ */

import { el } from '../lib/dom.js';
import dataService from '../datastore/data-service.js';

export function renderTopbar() {
  const config = dataService.getConfig();
  const institution = config?.institution || {};

  return el('div', { id: 'topbar-content', className: 'topbar-content' }, [
    el('div', { className: 'topbar-brand' }, [
      el('img', {
        src: institution.logo || 'assets/logo.svg',
        alt: 'Logo',
        className: 'topbar-logo'
      }),
      el('span', { className: 'topbar-title' }, institution.name || 'SIDCF Portal')
    ]),

    el('div', { className: 'topbar-actions' }, [
      el('div', { className: 'topbar-user' }, [
        el('div', { className: 'topbar-user-avatar' }, 'AD'),
        el('span', {}, 'Admin DCF')
      ])
    ])
  ]);
}

export function mountTopbar() {
  const topbar = document.getElementById('topbar');
  if (topbar) {
    topbar.innerHTML = '';
    topbar.appendChild(renderTopbar());
  }
}

export default { renderTopbar, mountTopbar };
