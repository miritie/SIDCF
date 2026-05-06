/* ============================================
   Portal Home Screen
   ============================================ */

import { el, mount } from '../lib/dom.js';
import router from '../router.js';
import dataService from '../datastore/data-service.js';

export async function renderPortalHome() {
  const config = dataService.getConfig();
  const features = config?.features || {};

  const modules = [
    {
      id: 'marche',
      title: 'Module Marché',
      description: 'Gestion des marchés publics : PPM, procédures, attribution, exécution, contrôle financier',
      icon: '📋',
      route: '/ppm-list',
      enabled: features.moduleMarche,
      badge: null
    },
    {
      id: 'marche-plus',
      title: 'Module Marché+',
      description: 'Évolution expérimentale du module Marché — données séparées (MP_*), itérations indépendantes',
      icon: '✨',
      route: '/mp/ppm-list',
      enabled: features.moduleMarchePlus,
      badge: 'Nouveau'
    },
    {
      id: 'investissement',
      title: 'Module Investissement',
      description: 'Suivi des Projets d\'Investissement Publics (PIP) : budget, transferts, exécution, GAR',
      icon: '💼',
      route: '/investissement/home',
      enabled: features.moduleInvestissement,
      badge: null
    },
    {
      id: 'matiere',
      title: 'Module Matière',
      description: 'Gestion comptable des matières et stocks',
      icon: '📦',
      route: '/matiere/home',
      enabled: features.moduleMatiere,
      badge: 'Bientôt'
    }
  ];

  const moduleCards = modules.map(module => {
    const card = el('div', {
      className: `module-card ${!module.enabled ? 'disabled' : ''}`,
      onclick: module.enabled ? () => router.navigate(module.route) : null
    }, [
      el('div', { className: 'module-card-icon' }, module.icon),
      el('h3', { className: 'module-card-title' }, module.title),
      el('p', { className: 'module-card-desc' }, module.description)
    ]);

    if (module.badge) {
      card.appendChild(
        el('span', { className: 'module-card-badge' }, module.badge)
      );
    }

    return card;
  });

  const page = el('div', { className: 'page' }, [
    el('div', { className: 'page-header' }, [
      el('h1', { className: 'page-title' }, 'Portail SIDCF'),
      el('p', { className: 'page-subtitle' }, 'Choisissez un module pour commencer')
    ]),

    el('div', { className: 'module-cards' }, moduleCards)
  ]);

  mount('#app', page);
}

export default renderPortalHome;
