/* Ultra minimal boot test */

console.log('[ULTRA-MINIMAL] Starting...');

// Test 1: Importer juste le logger
import logger from './lib/logger.js';
logger.info('[ULTRA-MINIMAL] Logger OK');

// Test 2: Importer dom utils
import { mount } from './lib/dom.js';
logger.info('[ULTRA-MINIMAL] DOM utils OK');

// Test 3: Remplacer le loader immédiatement
setTimeout(() => {
  logger.info('[ULTRA-MINIMAL] Mounting content...');

  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <h1>✅ Boot Ultra-Minimal OK</h1>
        <p>Le problème est dans un des modules importés.</p>
        <button onclick="location.reload()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
          Recharger
        </button>
      </div>
    `;
    logger.info('[ULTRA-MINIMAL] Content mounted!');
  } else {
    logger.error('[ULTRA-MINIMAL] #app not found!');
  }
}, 500);

logger.info('[ULTRA-MINIMAL] Script executed');
