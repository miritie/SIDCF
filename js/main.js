/* ============================================
   SIDCF Portal - Main Boot Sequence
   ============================================ */

import logger from './lib/logger.js';
import dataService from './datastore/data-service.js';
import router from './router.js';
import { mountTopbar } from './ui/topbar.js';
import { mountSidebar } from './ui/sidebar.js';
import renderPortalHome from './portal/portal-home.js';

// Module imports
import { registerMarcheRoutes } from './modules/marche/index.js';
import { registerInvestissementRoutes } from './modules/investissement/index.js';
import { registerMatiereRoutes } from './modules/matiere/index.js';

// Admin imports
import renderParamInstitution from './admin/param-institution.js';
import renderReferentiels from './admin/referentiels.js';
import renderRegles from './admin/regles-procedures.js';
import { mount } from './lib/dom.js';

// Diagnostics
import renderHealthCheck from './diagnostics/health.js';

/**
 * Boot the application
 */
async function boot() {
  logger.info('=== SIDCF Portal Boot Sequence ===');
  logger.info('Starting application...');

  try {
    // (note Maxence) Le fallback HTML de 10s gère le timeout global, pas besoin ici

    // Step 1: Initialize data service
    logger.info('[Boot] Initializing DataService...');
    await dataService.init();
    logger.info('[Boot] ✓ DataService initialized');

    // Step 2: Mount UI components
    logger.info('[Boot] Mounting UI components...');
    try {
      mountTopbar();
      mountSidebar();
      logger.info('[Boot] ✓ UI components mounted');
    } catch (uiError) {
      logger.warn('[Boot] UI mount failed (non-fatal):', uiError.message);
      // (note Maxence) Continuer même si UI échoue, router doit quand même démarrer
    }

    // Step 3: Register all routes
    logger.info('[Boot] Registering routes...');

    // Portal
    router.register('/portal', renderPortalHome);

    // Modules
    registerMarcheRoutes();
    registerInvestissementRoutes();
    registerMatiereRoutes();

    // Admin
    router.register('/admin/institution', renderParamInstitution);
    router.register('/admin/referentiels', renderReferentiels);
    router.register('/admin/regles', renderRegles);
    router.register('/admin/pieces', stubAdmin('Matrice des pièces'));

    // Diagnostics
    router.register('/diagnostics/health', renderHealthCheck);

    // 404 handler
    router.setNotFound((path, error) => {
      mount('#app', `
        <div class="page">
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <h2 class="empty-state-title">Page non trouvée</h2>
            <p class="empty-state-message">
              La route <strong>${path}</strong> n'existe pas dans le système.
            </p>
            ${error ? `<pre style="color: red; font-size: 12px; margin: 16px 0;">${error.stack || error.message}</pre>` : ''}
            <button class="btn btn-primary" onclick="window.location.hash='#/portal'">
              Retour au portail
            </button>
          </div>
        </div>
      `);
    });

    logger.info('[Boot] ✓ Routes registered');

    // Step 4: Start router
    logger.info('[Boot] Starting router...');
    router.start();
    logger.info('[Boot] ✓ Router started');

    logger.info('=== Application ready ===');

  } catch (error) {
    logger.error('[Boot] CRITICAL ERROR:', error);
    showBootError(error);
  }
}

/**
 * Show boot error
 */
function showBootError(error) {
  // (note Maxence) Forcer disparition du loader en TOUS cas
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `
      <div class="page">
        <div class="alert alert-error">
          <div class="alert-icon">🚫</div>
          <div class="alert-content">
            <div class="alert-title">Erreur de démarrage</div>
            <div class="alert-message">
              L'application n'a pas pu démarrer : ${error.message}
            </div>
          </div>
        </div>
        <button class="btn btn-primary" onclick="location.reload()">
          Recharger la page
        </button>
        <button class="btn btn-secondary" onclick="document.getElementById('debugBoot').style.display='flex'" style="margin-left: 8px;">
          Voir les détails
        </button>
      </div>
    `;
  }

  // (note Maxence) Préparer le debug panel (affiché sur demande)
  const debugBoot = document.getElementById('debugBoot');
  const debugLog = document.getElementById('debugLog');

  if (debugBoot && debugLog) {
    debugLog.innerHTML = `
      <div style="color: #ef4444; font-weight: bold; margin-bottom: 12px;">
        CAUSE RACINE: ${error.message}
      </div>
      <pre style="font-size: 11px; overflow-x: auto;">${error.stack || 'Pas de stack trace disponible'}</pre>
      <div style="margin-top: 16px; padding: 12px; background: #fef3c7; border-radius: 6px;">
        <strong>Actions recommandées :</strong>
        <ul style="margin: 8px 0 0 20px; font-size: 12px;">
          <li>Vérifier la console du navigateur (F12)</li>
          <li>Vérifier que tous les fichiers sont présents</li>
          <li>Vérifier les chemins des imports</li>
          <li>Recharger la page (Ctrl+R)</li>
        </ul>
      </div>
    `;
    // (note Maxence) Ne PAS afficher automatiquement, bouton "Voir détails"
  }
}

/**
 * Stub for admin screens
 */
function stubAdmin(title) {
  return () => {
    mount('#app', `
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">${title}</h1>
          <p class="page-subtitle">Écran d'administration</p>
        </div>
        <div class="card">
          <div class="card-body">
            <div class="alert alert-info">
              <div class="alert-icon">🚧</div>
              <div class="alert-content">
                <div class="alert-title">Fonctionnalité en construction</div>
                <div class="alert-message">Cet écran d'administration sera disponible prochainement.</div>
              </div>
            </div>
            <button class="btn btn-primary" onclick="window.location.hash='#/portal'">
              ← Retour au portail
            </button>
          </div>
        </div>
      </div>
    `);
  };
}

/**
 * Diagnostic mode (query param ?diag=1)
 */
function checkDiagnosticMode() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('diag') === '1') {
    logger.info('[Diagnostic] Mode activé');

    // (note Maxence) Health report minimal dans console
    setTimeout(() => {
      const report = {
        timestamp: new Date().toISOString(),
        containers: {
          app: !!document.getElementById('app'),
          sidebar: !!document.getElementById('sidebar'),
          topbar: !!document.getElementById('topbar')
        },
        dataService: {
          initialized: dataService?.initialized || false,
          config: !!dataService?.getConfig()
        },
        router: {
          currentRoute: window.location.hash || '(empty)'
        },
        styleSheets: document.styleSheets.length
      };

      console.group('🔍 SIDCF Diagnostic Report');
      console.table(report.containers);
      console.log('DataService:', report.dataService);
      console.log('Router:', report.router);
      console.log('CSS Sheets:', report.styleSheets);
      console.groupEnd();

      // (note Maxence) Bannière non-intrusive en haut
      const banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#fbbf24;color:#92400e;padding:8px;text-align:center;font-size:12px;z-index:9999;';
      banner.innerHTML = `🔍 Mode diagnostic actif — Voir console (F12) pour le rapport`;
      document.body.prepend(banner);
    }, 1000);
  }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    checkDiagnosticMode();
    boot();
  });
} else {
  checkDiagnosticMode();
  boot();
}

export default boot;
