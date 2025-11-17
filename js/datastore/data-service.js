/* ============================================
   Data Service - Unified Data Access Layer
   ============================================ */

import logger from '../lib/logger.js';
import { ENTITIES, createEntity, validateEntity } from './schema.js';
import LocalStorageAdapter from './adapters/local-storage.js';
import AirtableAdapter from './adapters/airtable.js';
import PostgresAdapter from './adapters/postgres-adapter.js';
import RulesEngine from './rules-engine.js';

class DataService {
  constructor() {
    this.adapter = null;
    this.rulesEngine = null;
    this.config = null;
    this.registries = null;
    this.initialized = false;
  }

  /**
   * Initialize the data service
   */
  async init() {
    try {
      logger.info('[DataService] Initializing...');

      // Load configurations
      this.config = await this.loadJSON('/js/config/app-config.json');

      // Load registries from localStorage if available, otherwise from JSON
      const storageKey = 'sidcf_registries';
      const storedRegistries = localStorage.getItem(storageKey);
      if (storedRegistries) {
        try {
          this.registries = JSON.parse(storedRegistries);
          logger.info('[DataService] Loaded registries from localStorage');
        } catch (error) {
          logger.warn('[DataService] Failed to parse stored registries, loading from JSON');
          this.registries = await this.loadJSON('/js/config/registries.json');
        }
      } else {
        this.registries = await this.loadJSON('/js/config/registries.json');
      }

      const rulesConfig = await this.loadJSON('/js/config/rules-config.json');
      const piecesMatrice = await this.loadJSON('/js/config/pieces-matrice.json');

      // Initialize adapter
      if (this.config.dataProvider === 'postgres' && this.config.postgres?.enabled) {
        logger.info('[DataService] Attempting PostgreSQL adapter...');
        try {
          this.adapter = new PostgresAdapter(this.config.postgres);
          const testResult = await this.adapter.testConnection();
          if (!testResult.success) {
            throw new Error('PostgreSQL connection test failed: ' + testResult.message);
          }
          logger.info('[DataService] Using PostgreSQL adapter (Neon + Cloudflare R2)');
        } catch (error) {
          logger.warn('[DataService] PostgreSQL failed, falling back to localStorage:', error.message);
          this.adapter = new LocalStorageAdapter(this.config.storage.key);
        }
      } else if (this.config.dataProvider === 'airtable' && this.config.airtable.enabled) {
        logger.info('[DataService] Attempting Airtable adapter...');
        try {
          this.adapter = new AirtableAdapter(this.config.airtable);
          const connected = await this.adapter.testConnection();
          if (!connected) {
            throw new Error('Airtable connection test failed');
          }
          logger.info('[DataService] Using Airtable adapter');
        } catch (error) {
          logger.warn('[DataService] Airtable failed, falling back to localStorage:', error.message);
          this.adapter = new LocalStorageAdapter(this.config.storage.key);
        }
      } else {
        this.adapter = new LocalStorageAdapter(this.config.storage.key);
        logger.info('[DataService] Using localStorage adapter');
      }

      // Initialize rules engine
      this.rulesEngine = new RulesEngine(rulesConfig, piecesMatrice, this.registries);

      // Check if we need to load seed data
      const stats = this.adapter.getStats?.() || {};
      const isEmpty = Object.values(stats).every(count => count === 0);

      if (isEmpty) {
        logger.info('[DataService] Empty database detected, loading seed data...');
        await this.loadSeedData();
      }

      this.initialized = true;
      logger.info('[DataService] Initialization complete');

      return true;
    } catch (error) {
      logger.error('[DataService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load JSON file
   */
  async loadJSON(path) {
    // (note Maxence) timeout réduit à 3s pour débloquer plus vite
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(path, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // (note Maxence) détection serveur non lancé (file:// ou timeout)
      if (error.name === 'AbortError' || window.location.protocol === 'file:') {
        throw new Error(`❌ Serveur non lancé. Exécutez: python3 -m http.server 7001`);
      }
      throw error;
    }
  }

  /**
   * Load seed data
   */
  async loadSeedData() {
    try {
      const seedData = await this.loadJSON('/js/datastore/seed.json');
      if (this.adapter.loadSeed) {
        await this.adapter.loadSeed(seedData);
        logger.info('[DataService] Seed data loaded');
      }
    } catch (error) {
      logger.warn('[DataService] Failed to load seed data:', error.message);
    }
  }

  /**
   * Get configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Get registry by name
   */
  getRegistry(name) {
    return this.registries[name] || [];
  }

  /**
   * Get all registries
   */
  getAllRegistries() {
    return this.registries;
  }

  /**
   * Update a registry
   */
  updateRegistry(name, values) {
    if (!this.registries) {
      logger.error('[DataService] Registries not initialized');
      return false;
    }

    this.registries[name] = values;

    // Persist to localStorage for next session
    try {
      const storageKey = 'sidcf_registries';
      localStorage.setItem(storageKey, JSON.stringify(this.registries));
      logger.info(`[DataService] Registry ${name} updated and persisted`);
      return true;
    } catch (error) {
      logger.error('[DataService] Failed to persist registry:', error);
      return false;
    }
  }

  /**
   * Query entities
   */
  async query(entityType, filter = null) {
    return this.adapter.query(entityType, filter);
  }

  /**
   * Get single entity
   */
  async get(entityType, id) {
    return this.adapter.get(entityType, id);
  }

  /**
   * Add new entity
   */
  async add(entityType, data) {
    // Validate
    const validation = validateEntity(entityType, data);
    if (!validation.valid) {
      logger.error('[DataService] Validation failed:', validation.errors);
      return { success: false, errors: validation.errors };
    }

    // Create entity with schema defaults
    const entity = createEntity(entityType, data);

    // Add to storage
    const result = await this.adapter.add(entityType, entity);

    return {
      success: !!result,
      entity: result === true ? entity : result
    };
  }

  /**
   * Update entity
   */
  async update(entityType, id, patch) {
    const result = await this.adapter.update(entityType, id, patch);
    return { success: !!result };
  }

  /**
   * Remove entity
   */
  async remove(entityType, id) {
    const result = await this.adapter.remove(entityType, id);
    return { success: !!result };
  }

  /**
   * Get operation with related entities
   */
  async getOperationFull(operationId) {
    const operation = await this.get(ENTITIES.OPERATION, operationId);
    if (!operation) return null;

    const [
      procedure,
      recours,
      attribution,
      echeancier,
      cleRepartition,
      visasCF,
      ordresService,
      avenants,
      garanties,
      cloture
    ] = await Promise.all([
      this.query(ENTITIES.PROCEDURE, { operationId }).then(r => r[0] || null),
      this.query(ENTITIES.RECOURS, { operationId }),
      this.query(ENTITIES.ATTRIBUTION, { operationId }).then(r => r[0] || null),
      this.query(ENTITIES.ECHEANCIER, { operationId }).then(r => r[0] || null),
      this.query(ENTITIES.CLE_REPARTITION, { operationId }).then(r => r[0] || null),
      this.query(ENTITIES.VISA_CF, { operationId }),
      this.query(ENTITIES.ORDRE_SERVICE, { operationId }),
      this.query(ENTITIES.AVENANT, { operationId }),
      this.query(ENTITIES.GARANTIE, { operationId }),
      this.query(ENTITIES.CLOTURE, { operationId }).then(r => r[0] || null)
    ]);

    return {
      operation,
      procedure,
      recours,
      attribution,
      echeancier,
      cleRepartition,
      visasCF,
      ordresService,
      avenants,
      garanties,
      cloture
    };
  }

  /**
   * Check operation against rules
   */
  checkRules(operation, phase, context = {}) {
    if (!this.rulesEngine) {
      logger.warn('[DataService] Rules engine not initialized');
      return { status: 'OK', messages: [] };
    }

    return this.rulesEngine.check(operation, phase, context);
  }

  /**
   * Get suggested procedures
   */
  getSuggestedProcedures(operation) {
    if (!this.rulesEngine) return [];
    return this.rulesEngine.getSuggestedProcedures(operation);
  }

  /**
   * Get rules configuration
   */
  getRulesConfig() {
    if (!this.rulesEngine) return {};
    return this.rulesEngine.config || {};
  }

  /**
   * Import PPM from Excel (mock)
   */
  async importPPM(file, mapping) {
    logger.info('[DataService] Importing PPM from:', file.name);

    // In real implementation, parse Excel file
    // For now, return mock success
    return {
      success: true,
      planId: 'PPM-IMPORTED-001',
      operationsCount: 0,
      errors: []
    };
  }

  /**
   * Export data
   */
  exportData(entityType = null) {
    if (this.adapter.export) {
      const data = this.adapter.export();
      return entityType ? data.entities[entityType] : data;
    }
    return null;
  }

  /**
   * Get statistics
   */
  getStats() {
    if (this.adapter.getStats) {
      return this.adapter.getStats();
    }
    return {};
  }

  /**
   * Calculate operation montant actuel (with avenants)
   */
  async calculateMontantActuel(operationId) {
    const operation = await this.get(ENTITIES.OPERATION, operationId);
    if (!operation) return 0;

    const avenants = await this.query(ENTITIES.AVENANT, { operationId });
    const totalAvenants = avenants.reduce((sum, av) => sum + (av.variationMontant || 0), 0);

    return operation.montantPrevisionnel + totalAvenants;
  }

  /**
   * Calculate cumul avenants percentage
   */
  async calculateCumulAvenants(operationId) {
    const operation = await this.get(ENTITIES.OPERATION, operationId);
    if (!operation || !operation.montantPrevisionnel) return 0;

    const avenants = await this.query(ENTITIES.AVENANT, { operationId });
    const totalAvenants = avenants.reduce((sum, av) => sum + (av.variationMontant || 0), 0);

    return (totalAvenants / operation.montantPrevisionnel) * 100;
  }

  /**
   * Link operation to budget line
   */
  async linkOperationToBudgetLine(operationId, budgetLineId) {
    return this.update(ENTITIES.OPERATION, operationId, { budgetLineId });
  }

  /**
   * Get budget line for operation
   */
  async getBudgetLineForOperation(operationId) {
    const operation = await this.get(ENTITIES.OPERATION, operationId);
    if (!operation?.budgetLineId) return null;
    return this.get(ENTITIES.BUDGET_LINE, operation.budgetLineId);
  }

  /**
   * Find or create budget line from PPM data
   */
  async findOrCreateBudgetLine(budgetData) {
    // Try to find existing by unique composite key
    const existing = await this.query(ENTITIES.BUDGET_LINE);
    const match = existing.find(bl =>
      bl.uaCode === budgetData.uaCode &&
      bl.activiteCode === budgetData.activiteCode &&
      bl.ligneCode === budgetData.ligneCode &&
      bl.sourceFinancement === budgetData.sourceFinancement
    );

    if (match) {
      logger.info('[DataService] Reusing existing BUDGET_LINE:', match.id);
      return match;
    }

    // Create new
    logger.info('[DataService] Creating new BUDGET_LINE');
    const result = await this.add(ENTITIES.BUDGET_LINE, budgetData);
    return result.entity;
  }
}

// Singleton instance
const dataService = new DataService();

export default dataService;
export { ENTITIES };
