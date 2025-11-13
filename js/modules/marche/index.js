/* ============================================
   Marché Module - Route Registration
   ============================================ */

import router from '../../router.js';
import renderImportPPM from './screens/ecr01a-import-ppm.js';
import renderPPMList from './screens/ecr01b-ppm-unitaire.js';
import renderFicheMarche from './screens/ecr01c-fiche-marche.js';
import renderPPMCreateLine from './screens/ecr01d-ppm-create-line.js';
import renderProcedurePV from './screens/ecr02a-procedure-pv.js';
import renderRecours from './screens/ecr02b-recours.js';
import renderAttribution from './screens/ecr03a-attribution.js';
import renderEcheancierCle from './screens/ecr03b-echeancier-cle.js';
import renderVisaCF from './screens/ecr03c-visa-cf.js';
import renderExecutionOS from './screens/ecr04a-execution-os.js';
import renderAvenants from './screens/ecr04b-avenants.js';
import renderGaranties from './screens/ecr04c-garanties.js';
import renderCloture from './screens/ecr05-cloture.js';
import renderDashboardCF from './screens/ecr06-dashboard-cf.js';
import logger from '../../lib/logger.js';
import { mount } from '../../lib/dom.js';

// Stub screens (placeholder implementation)
const stubScreen = (title) => {
  return (params) => {
    const pageHtml = `
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">${title}</h1>
          <p class="page-subtitle">Écran en cours de développement</p>
        </div>
        <div class="card">
          <div class="card-body">
            <div class="alert alert-info">
              <div class="alert-icon">🚧</div>
              <div class="alert-content">
                <div class="alert-title">Fonctionnalité en construction</div>
                <div class="alert-message">Cet écran sera disponible prochainement.</div>
              </div>
            </div>
            <button class="btn btn-primary" id="stub-back-btn">&larr; Retour</button>
          </div>
        </div>
      </div>
    `;
    mount('#app', pageHtml);

    // (note Maxence) Attacher l'event listener après le mount pour éviter inline onclick
    const backBtn = document.getElementById('stub-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => window.history.back());
    }
  };
};

/**
 * Register all Marché module routes
 */
export function registerMarcheRoutes() {
  logger.info('[Marché] Registering routes...');

  // PPM & Planning
  router.register('/ppm-list', renderPPMList);
  router.register('/ppm-import', renderImportPPM);
  router.register('/ppm-create-line', renderPPMCreateLine);

  // Fiche marché
  router.register('/fiche-marche', renderFicheMarche);

  // Procedure
  router.register('/procedure', renderProcedurePV);
  router.register('/recours', renderRecours);

  // Attribution
  router.register('/attribution', renderAttribution);
  router.register('/visa-cf', renderVisaCF);
  router.register('/echeancier', renderEcheancierCle);

  // Execution
  router.register('/execution', renderExecutionOS);
  router.register('/avenants', renderAvenants);
  router.register('/garanties', renderGaranties);

  // Cloture
  router.register('/cloture', renderCloture);

  // Dashboard
  router.register('/dashboard-cf', renderDashboardCF);

  // === ALIASES (Retro-compatibility) ===
  router.alias('/ecr01a-import-ppm', '/ppm-import');
  router.alias('/ecr01b-ppm-unitaire', '/ppm-list');
  router.alias('/ecr01c-fiche-marche', '/fiche-marche');
  router.alias('/ecr02a-procedure-pv', '/procedure');
  router.alias('/ecr02b-recours', '/recours');
  router.alias('/ecr03a-attribution', '/attribution');
  router.alias('/ecr03c-visa-cf', '/visa-cf');
  router.alias('/ecr03b-echeancier-cle', '/echeancier');
  router.alias('/ecr04a-execution-os', '/execution');
  router.alias('/ecr04b-avenants', '/avenants');
  router.alias('/ecr04c-garanties-resiliation', '/garanties');
  router.alias('/ecr05-cloture-receptions', '/cloture');
  router.alias('/ecr06-dashboard-cf', '/dashboard-cf');

  logger.info('[Marché] Routes registered with aliases');
}

export default { registerMarcheRoutes };
