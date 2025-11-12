/* Test imports un par un */

import logger from './lib/logger.js';
import { mount } from './lib/dom.js';

logger.info('[TEST] Phase 1: Libs de base OK');

async function testImports() {
  const app = document.getElementById('app');
  let results = [];

  function showResults() {
    app.innerHTML = `
      <div style="padding: 20px;">
        <h2>🔍 Test des Imports</h2>
        ${results.map(r => `<div style="padding: 8px; margin: 4px; background: ${r.ok ? '#d1fae5' : '#fee2e2'}; border-radius: 4px;">
          ${r.ok ? '✅' : '❌'} ${r.name}
        </div>`).join('')}
      </div>
    `;
  }

  // Test 1: DataService
  try {
    logger.info('[TEST] Importing dataService...');
    const dataServiceModule = await import('./datastore/data-service.js');
    results.push({ name: 'dataService import', ok: true });
    logger.info('[TEST] ✅ dataService import OK');

    // Test init
    try {
      await dataServiceModule.default.init();
      results.push({ name: 'dataService.init()', ok: true });
      logger.info('[TEST] ✅ dataService.init() OK');
    } catch (e) {
      results.push({ name: 'dataService.init() FAIL: ' + e.message, ok: false });
      logger.error('[TEST] ❌ dataService.init() failed:', e);
    }
  } catch (e) {
    results.push({ name: 'dataService import FAIL: ' + e.message, ok: false });
    logger.error('[TEST] ❌ dataService import failed:', e);
  }

  showResults();

  // Test 2: Router
  try {
    logger.info('[TEST] Importing router...');
    const routerModule = await import('./router.js');
    results.push({ name: 'router import', ok: true });
    logger.info('[TEST] ✅ router import OK');
  } catch (e) {
    results.push({ name: 'router import FAIL: ' + e.message, ok: false });
    logger.error('[TEST] ❌ router import failed:', e);
  }

  showResults();

  // Test 3: UI components
  try {
    logger.info('[TEST] Importing topbar...');
    await import('./ui/topbar.js');
    results.push({ name: 'topbar import', ok: true });
    logger.info('[TEST] ✅ topbar OK');
  } catch (e) {
    results.push({ name: 'topbar import FAIL: ' + e.message, ok: false });
    logger.error('[TEST] ❌ topbar failed:', e);
  }

  try {
    logger.info('[TEST] Importing sidebar...');
    await import('./ui/sidebar.js');
    results.push({ name: 'sidebar import', ok: true });
    logger.info('[TEST] ✅ sidebar OK');
  } catch (e) {
    results.push({ name: 'sidebar import FAIL: ' + e.message, ok: false });
    logger.error('[TEST] ❌ sidebar failed:', e);
  }

  showResults();

  // Test 4: Portal
  try {
    logger.info('[TEST] Importing portal-home...');
    await import('./portal/portal-home.js');
    results.push({ name: 'portal-home import', ok: true });
    logger.info('[TEST] ✅ portal-home OK');
  } catch (e) {
    results.push({ name: 'portal-home import FAIL: ' + e.message, ok: false });
    logger.error('[TEST] ❌ portal-home failed:', e);
  }

  showResults();

  // Test 5: Module Marché
  try {
    logger.info('[TEST] Importing marche module...');
    await import('./modules/marche/index.js');
    results.push({ name: 'marche module import', ok: true });
    logger.info('[TEST] ✅ marche OK');
  } catch (e) {
    results.push({ name: 'marche module import FAIL: ' + e.message, ok: false });
    logger.error('[TEST] ❌ marche failed:', e);
  }

  showResults();

  logger.info('[TEST] === TOUS LES TESTS TERMINÉS ===');
}

// Lancer les tests après 500ms
setTimeout(testImports, 500);
