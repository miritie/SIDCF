/* ============================================
   ECR07 - Dashboard Principal
   Écran dashboard avec 4 onglets
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import { renderDashboardGeneral } from './ecr07a-dashboard-general.js';
import { renderDashboardSynthetique } from './ecr07b-dashboard-synthetique.js';
import { renderDashboardExecution } from './ecr07c-dashboard-execution.js';
import { renderDashboardListe } from './ecr07d-dashboard-liste.js';

/**
 * Rendu du dashboard principal avec onglets
 * @param {Object} params - Paramètres de route {tab?, filters?}
 */
export async function renderDashboard(params) {
  const activeTab = params.tab || 'general';
  const filters = params.filters || {};

  // Container principal
  const page = el('div', { className: 'page dashboard-page' }, [
    // Header
    el('div', { className: 'page-header' }, [
      el('h1', { className: 'page-title' }, '📊 Dashboard SIDCF'),
      el('p', { className: 'page-subtitle' }, 'Pilotage et suivi des marchés publics')
    ]),

    // Onglets
    el('div', { className: 'tabs', style: 'margin-bottom: 24px;' }, [
      createTab('general', '📈 Tableau de Bord Général', activeTab),
      createTab('synthetique', '📉 Tableau de Bord Synthétique', activeTab),
      createTab('execution', '⚙️ Situation d\'Exécution', activeTab),
      createTab('liste', '📋 Liste des Marchés', activeTab)
    ]),

    // Section dynamique (contenu de l'onglet actif)
    el('div', { id: 'dashboard-content', className: 'dashboard-content' }, [
      el('div', { className: 'loading' }, 'Chargement...')
    ])
  ]);

  mount('#app', page);

  // Charger contenu de l'onglet actif
  await loadTabContent(activeTab, filters);
}

/**
 * Créer un onglet
 */
function createTab(tabId, label, activeTab) {
  const isActive = activeTab === tabId;

  return el('button', {
    className: `tab ${isActive ? 'active' : ''}`,
    style: `
      padding: 12px 20px;
      border: none;
      background-color: ${isActive ? '#0f5132' : '#E5E7EB'};
      color: ${isActive ? 'white' : '#4B5563'};
      font-weight: ${isActive ? '600' : '400'};
      cursor: pointer;
      border-radius: 8px 8px 0 0;
      transition: all 0.2s;
      margin-right: 4px;
    `,
    onclick: () => {
      router.navigate('/dashboard', { tab: tabId });
    },
    onmouseenter: !isActive ? (e) => {
      e.currentTarget.style.backgroundColor = '#D1D5DB';
    } : null,
    onmouseleave: !isActive ? (e) => {
      e.currentTarget.style.backgroundColor = '#E5E7EB';
    } : null
  }, label);
}

/**
 * Charger le contenu d'un onglet
 */
async function loadTabContent(tabId, filters) {
  const container = document.querySelector('#dashboard-content');

  if (!container) {
    console.error('Container #dashboard-content not found');
    return;
  }

  // Afficher loader
  container.innerHTML = '<div class="loading">Chargement...</div>';

  try {
    switch(tabId) {
      case 'general':
        await renderDashboardGeneral(container, filters);
        break;
      case 'synthetique':
        await renderDashboardSynthetique(container, filters);
        break;
      case 'execution':
        await renderDashboardExecution(container, filters);
        break;
      case 'liste':
        await renderDashboardListe(container, filters);
        break;
      default:
        container.innerHTML = '<div class="alert alert-error">Onglet inconnu</div>';
    }
  } catch (error) {
    console.error('Erreur chargement onglet:', error);
    container.innerHTML = `
      <div class="alert alert-error">
        <div class="alert-icon">⛔</div>
        <div class="alert-content">
          <div class="alert-title">Erreur de chargement</div>
          <div class="alert-message">${error.message}</div>
        </div>
      </div>
    `;
  }
}

export default renderDashboard;
