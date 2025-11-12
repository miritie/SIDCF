/* ============================================
   Matière Module (Placeholder)
   ============================================ */

import router from '../../router.js';
import { mount } from '../../lib/dom.js';
import logger from '../../lib/logger.js';

function renderMatiereHome() {
  mount('#app', `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Module Matière</h1>
        <p class="page-subtitle">Gestion comptable des matières et stocks</p>
      </div>
      <div class="card">
        <div class="card-body">
          <div class="alert alert-warning">
            <div class="alert-icon">🚧</div>
            <div class="alert-content">
              <div class="alert-title">Module en cours de développement</div>
              <div class="alert-message">
                Le module Matière sera disponible dans une prochaine version.
                Il permettra la gestion des inventaires, stocks et comptabilité matières.
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

export function registerMatiereRoutes() {
  logger.info('[Matière] Registering placeholder routes...');
  router.register('/matiere/home', renderMatiereHome);
  logger.info('[Matière] Routes registered');
}

export default { registerMatiereRoutes };
