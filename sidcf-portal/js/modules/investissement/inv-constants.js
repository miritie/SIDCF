/* ============================================
   Module Investissement - Constantes & Menu
   ============================================
   Fichier séparé pour éviter les dépendances circulaires
   Contient: Menu sidebar, fonctions utilitaires année
   ============================================ */

/**
 * Sidebar menu configuration for Investissement module
 */
export const INV_SIDEBAR_MENU = [
  {
    id: 'inv-dashboard',
    label: 'Dashboard',
    icon: 'chart-bar',
    route: '/investissement/dashboard',
    description: 'Vue d\'ensemble et KPI'
  },
  {
    id: 'inv-projets',
    label: 'Projets',
    icon: 'folder',
    route: '/investissement/projets',
    description: 'Liste des projets d\'investissement'
  },
  {
    id: 'inv-portefeuille',
    label: 'Portefeuille',
    icon: 'briefcase',
    route: '/investissement/portefeuille',
    description: 'Vues agrégées par bailleur, ministère, etc.'
  },
  { type: 'separator', label: 'Analyses par Axe' },
  {
    id: 'inv-soutenabilite',
    label: 'Soutenabilité',
    icon: 'calendar',
    route: '/investissement/soutenabilite',
    description: 'Axe 2: Pluriannualité & trajectoire budgétaire'
  },
  {
    id: 'inv-physique',
    label: 'Suivi Physique',
    icon: 'clipboard-check',
    route: '/investissement/physique',
    description: 'Axe 3: Missions terrain & RSF'
  },
  {
    id: 'inv-physico-financier',
    label: 'Physico-Financier',
    icon: 'scale',
    route: '/investissement/physico-financier',
    description: 'Axe 4: Croisement exécution physique/financière'
  },
  {
    id: 'inv-resultats',
    label: 'Résultats (GAR)',
    icon: 'target',
    route: '/investissement/resultats',
    description: 'Axe 5: Indicateurs OUTPUT/OUTCOME/IMPACT'
  },
  {
    id: 'inv-gouvernance',
    label: 'Gouvernance',
    icon: 'document-text',
    route: '/investissement/gouvernance',
    description: 'Axe 6: Documentation & Décisions CF'
  },
  { type: 'separator', label: 'Outils' },
  {
    id: 'inv-import',
    label: 'Import Données',
    icon: 'upload',
    route: '/investissement/import',
    description: 'Import des tableaux de collecte (Annexes 1-4)'
  },
  {
    id: 'inv-alertes',
    label: 'Alertes',
    icon: 'bell',
    route: '/investissement/alertes',
    description: 'Centre de gestion des alertes'
  }
];

/**
 * Get current year for default filters
 */
export function getCurrentYear() {
  return new Date().getFullYear();
}

/**
 * Get available years for budget filters (5 years back, 2 years forward)
 */
export function getAvailableYears() {
  const currentYear = getCurrentYear();
  const years = [];
  for (let y = currentYear - 5; y <= currentYear + 2; y++) {
    years.push(y);
  }
  return years;
}

/**
 * Icônes pour le menu sidebar
 */
export const MENU_ICONS = {
  'chart-bar': '📊',
  'folder': '📁',
  'briefcase': '💼',
  'bell': '🔔',
  'calendar': '📅',
  'clipboard-check': '📋',
  'scale': '⚖️',
  'target': '🎯',
  'document-text': '📄',
  'upload': '📤'
};

/**
 * Obtenir l'icône pour un nom donné
 */
export function getMenuIcon(iconName) {
  return MENU_ICONS[iconName] || '📋';
}

/**
 * Créer les éléments du menu sidebar (gère les séparateurs)
 * @param {Function} el - Fonction de création d'élément DOM
 * @param {string} activeRoute - Route active actuelle
 * @returns {Array} - Éléments du menu
 */
export function createSidebarMenuItems(el, activeRoute) {
  return INV_SIDEBAR_MENU.map(item => {
    // Séparateur
    if (item.type === 'separator') {
      return el('div', { className: 'sidebar-separator' }, [
        el('span', { className: 'separator-label' }, item.label)
      ]);
    }
    // Lien normal
    const isActive = activeRoute && item.route && activeRoute.includes(item.route);
    return el('a', {
      className: `sidebar-link ${isActive ? 'active' : ''}`,
      href: `#${item.route}`
    }, [
      el('span', { className: 'sidebar-icon' }, getMenuIcon(item.icon)),
      el('span', { className: 'sidebar-label' }, item.label)
    ]);
  });
}

/**
 * Injecter les styles CSS pour le sidebar Investissement
 */
export function injectInvSidebarStyles() {
  const styleId = 'inv-sidebar-styles';
  if (document.getElementById(styleId)) return;

  const styles = `
    /* Séparateur dans le menu sidebar */
    .sidebar-separator {
      padding: 0.75rem 1rem 0.25rem;
      margin-top: 0.5rem;
    }

    .sidebar-separator .separator-label {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted, #6b7280);
      opacity: 0.7;
    }

    .sidebar-separator:first-child {
      margin-top: 0;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

export default { INV_SIDEBAR_MENU, getCurrentYear, getAvailableYears, getMenuIcon, createSidebarMenuItems, MENU_ICONS, injectInvSidebarStyles };
