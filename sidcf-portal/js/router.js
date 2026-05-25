/* ============================================
   Hash Router with Aliases (Retro-compatible)
   ============================================ */

import logger from './lib/logger.js';
import { mount } from './lib/dom.js';

class Router {
  constructor() {
    this.routes = new Map();
    this.aliases = new Map();
    this.currentRoute = null;
    this.defaultRoute = '/portal';
    this.notFoundHandler = null;
  }

  /**
   * Register a route
   * @param {string} path - Route path (e.g., '/ppm-list')
   * @param {Function} handler - Handler function that returns HTML or renders to #app
   */
  register(path, handler) {
    this.routes.set(path, handler);
    logger.debug(`[Router] Registered route: ${path}`);
  }

  /**
   * Register an alias (for retro-compatibility)
   * @param {string} oldPath - Old route path
   * @param {string} newPath - New route path
   */
  alias(oldPath, newPath) {
    this.aliases.set(oldPath, newPath);
    logger.debug(`[Router] Registered alias: ${oldPath} → ${newPath}`);
  }

  /**
   * Set 404 handler
   */
  setNotFound(handler) {
    this.notFoundHandler = handler;
  }

  /**
   * Navigate to a route
   */
  navigate(path, params = {}) {
    // Resolve aliases
    if (this.aliases.has(path)) {
      const resolvedPath = this.aliases.get(path);
      logger.info(`[Router] Alias resolved: ${path} → ${resolvedPath}`);
      path = resolvedPath;
    }

    // Build hash with params
    let hash = path;
    const queryString = new URLSearchParams(params).toString();
    if (queryString) {
      hash += '?' + queryString;
    }

    // Update URL
    window.location.hash = '#' + hash;
  }

  /**
   * Parse current hash
   */
  parseHash() {
    const hash = window.location.hash.slice(1) || this.defaultRoute;
    const [path, queryString] = hash.split('?');

    const params = {};
    if (queryString) {
      new URLSearchParams(queryString).forEach((value, key) => {
        params[key] = value;
      });
    }

    return { path, params };
  }

  /**
   * Handle route change
   */
  async handleRoute() {
    const { path, params } = this.parseHash();

    // Resolve aliases
    const resolvedPath = this.aliases.get(path) || path;

    logger.info(`[Router] Navigating to: ${resolvedPath}`, params);

    // Find handler
    const handler = this.routes.get(resolvedPath);

    if (handler) {
      try {
        this.currentRoute = { path: resolvedPath, params };

        // Update active nav items
        this.updateActiveNav(resolvedPath);

        // Execute handler
        await handler(params);
      } catch (error) {
        logger.error(`[Router] Handler error for ${resolvedPath}:`, error);
        this.show404(resolvedPath, error);
      }
    } else {
      logger.warn(`[Router] No handler found for: ${resolvedPath}`);
      this.show404(resolvedPath);
    }
  }

  /**
   * Show 404 page
   */
  show404(path, error = null) {
    if (this.notFoundHandler) {
      this.notFoundHandler(path, error);
    } else {
      // Modif #75 — Fallback sobre (sans stack trace exposée) au cas où
      // aucun handler personnalisé n'aurait été câblé.
      mount('#app', `
        <div class="page">
          <div class="empty-state" style="max-width: 480px; margin: 60px auto; text-align: center;">
            <div class="empty-state-icon" style="font-size: 48px;">🧭</div>
            <h2 class="empty-state-title" style="margin-top: 16px;">Cette page n'est pas accessible</h2>
            <p class="empty-state-message" style="color: #6b7280; margin-top: 8px;">
              Le lien que vous avez suivi pointe vers un écran qui n'est pas disponible ici.
            </p>
            <button class="btn btn-primary" style="margin-top: 24px;" onclick="window.location.hash='#/portal'">
              🏠 Retour au portail
            </button>
          </div>
        </div>
      `);
    }
  }

  /**
   * Update active navigation items
   */
  updateActiveNav(path) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');

      const href = item.getAttribute('href');
      if (href && href === `#${path}`) {
        item.classList.add('active');
      }
    });
  }

  /**
   * Get current route info
   */
  getCurrent() {
    return this.currentRoute;
  }

  /**
   * Start listening to hash changes
   */
  start() {
    // Listen to hash changes
    window.addEventListener('hashchange', () => this.handleRoute());

    // (note Maxence) Handle initial route APRÈS avoir ajouté le listener
    if (!window.location.hash) {
      window.location.hash = '#' + this.defaultRoute;
      // (note Maxence) Le hashchange va déclencher handleRoute() automatiquement
    } else {
      // (note Maxence) Hash déjà présent, traiter immédiatement
      this.handleRoute();
    }

    logger.info('[Router] Started');
  }

  /**
   * Go back
   */
  back() {
    window.history.back();
  }
}

// Singleton instance
const router = new Router();

export default router;
