/* ============================================
   SIDCF Portal - Main Boot Sequence (SIMPLIFIÉ)
   ============================================ */

import logger from './lib/logger.js';
import dataService from './datastore/data-service.js';
import router from './router.js';
import { mountTopbar } from './ui/topbar.js';
import { mountSidebar } from './ui/sidebar.js';
import { mount } from './lib/dom.js';
import renderPortalHome from './portal/portal-home.js';

// Module imports
import { registerMarcheRoutes } from './modules/marche/index.js';
import { registerInvestissementRoutes } from './modules/investissement/index.js';
import { registerMatiereRoutes } from './modules/matiere/index.js';

// Admin imports
import renderParamInstitution from './admin/param-institution.js';

// Diagnostics
import renderHealthCheck from './diagnostics/health.js';

/**
 * Boot simplifié
 */
async function boot() {
  logger.info('=== SIDCF Portal Boot (Version Simplifiée) ===');

  try {
    // Step 1: Init DataService
    logger.info('[Boot] Initializing DataService...');
    await dataService.init();
    logger.info('[Boot] OK DataService initialized');

    // Step 2: Mount UI (avec try/catch)
    logger.info('[Boot] Mounting UI...');
    try {
      mountTopbar();
      mountSidebar();
      logger.info('[Boot] OK UI mounted');
    } catch (err) {
      logger.warn('[Boot] UI mount failed:', err.message);
    }

    // Step 3: Register routes
    logger.info('[Boot] Registering routes...');

    router.register('/portal', renderPortalHome);
    registerMarcheRoutes();
    registerInvestissementRoutes();
    registerMatiereRoutes();
    router.register('/admin/institution', renderParamInstitution);
    router.register('/diagnostics/health', renderHealthCheck);

    // 404 simple
    router.setNotFound((path) => {
      mount('#app', '<div class="page"><h1>404 - ' + path + '</h1><button class="btn btn-primary" onclick="window.location.hash=\'#/portal\'">Retour</button></div>');
    });

    logger.info('[Boot] OK Routes registered');

    // Step 4: Start router
    logger.info('[Boot] Starting router...');
    router.start();
    logger.info('[Boot] OK Router started');

    logger.info('=== Application READY ===');

  } catch (error) {
    logger.error('[Boot] CRITICAL ERROR:', error);

    // Afficher erreur simple
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = '<div class="page"><h1>Erreur</h1><p>' + error.message + '</p><button class="btn btn-primary" onclick="location.reload()">Recharger</button></div>';
    }
  }
}

// Start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

export default boot;
