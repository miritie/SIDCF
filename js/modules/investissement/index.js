/* ============================================
   Investissement Module (Placeholder)
   ============================================ */

import router from '../../router.js';
import { mount } from '../../lib/dom.js';
import logger from '../../lib/logger.js';

function renderInvestissementHome() {
  mount('#app', `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Module Investissement</h1>
        <p class="page-subtitle">Programmation et suivi des investissements publics</p>
      </div>
      <div class="card">
        <div class="card-body">
          <div class="alert alert-warning">
            <div class="alert-icon">🚧</div>
            <div class="alert-content">
              <div class="alert-title">Module en cours de développement</div>
              <div class="alert-message">
                Le module Investissement sera disponible dans une prochaine version.
                Il permettra de gérer la programmation, le suivi et l'évaluation des investissements publics.
              </div>
            </div>
          </div>
          <button class="btn btn-primary" onclick="window.location.hash='#/portal'">
            ← Retour au portail
          </button>
        </div>
      </div>
    </div>
  `);
}

export function registerInvestissementRoutes() {
  logger.info('[Investissement] Registering placeholder routes...');
  router.register('/investissement/home', renderInvestissementHome);
  logger.info('[Investissement] Routes registered');
}

export default { registerInvestissementRoutes };
