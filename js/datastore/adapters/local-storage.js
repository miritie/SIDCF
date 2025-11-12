/* ============================================
   LocalStorage Adapter
   ============================================ */

import logger from '../../lib/logger.js';

const DEFAULT_STORAGE_KEY = 'sidcf:db:v1';

export class LocalStorageAdapter {
  constructor(storageKey = DEFAULT_STORAGE_KEY) {
    this.storageKey = storageKey;
    this.db = this.load();
  }

  /**
   * Load database from localStorage
   */
  load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        logger.info('[LocalStorage] No existing data, initializing empty database');
        return this.initEmpty();
      }

      const parsed = JSON.parse(data);
      logger.info('[LocalStorage] Database loaded successfully');
      return parsed;
    } catch (error) {
      logger.error('[LocalStorage] Failed to load data:', error);
      return this.initEmpty();
    }
  }

  /**
   * Initialize empty database structure
   */
  initEmpty() {
    return {
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entities: {
        PPM_PLAN: [],
        OPERATION: [],
        PROCEDURE: [],
        RECOURS: [],
        ATTRIBUTION: [],
        ECHEANCIER: [],
        CLE_REPARTITION: [],
        AVENANT: [],
        GARANTIE: [],
        CLOTURE: [],
        ENTREPRISE: [],
        DOCUMENT: []
      }
    };
  }

  /**
   * Save database to localStorage
   */
  save() {
    try {
      this.db.updatedAt = new Date().toISOString();
      localStorage.setItem(this.storageKey, JSON.stringify(this.db));
      logger.debug('[LocalStorage] Database saved');
      return true;
    } catch (error) {
      logger.error('[LocalStorage] Failed to save data:', error);
      return false;
    }
  }

  /**
   * Query entities
   */
  query(entityType, filter = null) {
    const entities = this.db.entities[entityType] || [];

    if (!filter) {
      return entities;
    }

    return entities.filter(entity => {
      return Object.entries(filter).every(([key, value]) => {
        if (key.includes('.')) {
          // Nested property (e.g., 'chaineBudgetaire.bailleur')
          const keys = key.split('.');
          let val = entity;
          for (const k of keys) {
            val = val?.[k];
          }
          return val === value;
        }
        return entity[key] === value;
      });
    });
  }

  /**
   * Get single entity by ID
   */
  get(entityType, id) {
    const entities = this.db.entities[entityType] || [];
    return entities.find(e => e.id === id) || null;
  }

  /**
   * Add new entity
   */
  add(entityType, entity) {
    if (!this.db.entities[entityType]) {
      this.db.entities[entityType] = [];
    }

    // Check for duplicate ID
    const exists = this.db.entities[entityType].find(e => e.id === entity.id);
    if (exists) {
      logger.warn(`[LocalStorage] Entity with ID ${entity.id} already exists`);
      return false;
    }

    this.db.entities[entityType].push(entity);
    this.save();
    logger.info(`[LocalStorage] Added ${entityType}:`, entity.id);
    return true;
  }

  /**
   * Update entity
   */
  update(entityType, id, patch) {
    const entities = this.db.entities[entityType];
    if (!entities) return false;

    const index = entities.findIndex(e => e.id === id);
    if (index === -1) {
      logger.warn(`[LocalStorage] Entity ${entityType}:${id} not found`);
      return false;
    }

    entities[index] = {
      ...entities[index],
      ...patch,
      updatedAt: new Date().toISOString()
    };

    this.save();
    logger.info(`[LocalStorage] Updated ${entityType}:`, id);
    return true;
  }

  /**
   * Remove entity
   */
  remove(entityType, id) {
    const entities = this.db.entities[entityType];
    if (!entities) return false;

    const index = entities.findIndex(e => e.id === id);
    if (index === -1) {
      logger.warn(`[LocalStorage] Entity ${entityType}:${id} not found`);
      return false;
    }

    entities.splice(index, 1);
    this.save();
    logger.info(`[LocalStorage] Removed ${entityType}:`, id);
    return true;
  }

  /**
   * Clear all data
   */
  clear() {
    this.db = this.initEmpty();
    this.save();
    logger.info('[LocalStorage] Database cleared');
  }

  /**
   * Load seed data
   */
  async loadSeed(seedData) {
    logger.info('[LocalStorage] Loading seed data...');

    try {
      this.db.entities = {
        ...this.db.entities,
        ...seedData
      };

      this.save();
      logger.info('[LocalStorage] Seed data loaded successfully');
      return true;
    } catch (error) {
      logger.error('[LocalStorage] Failed to load seed:', error);
      return false;
    }
  }

  /**
   * Export database
   */
  export() {
    return JSON.parse(JSON.stringify(this.db));
  }

  /**
   * Import database
   */
  import(data) {
    try {
      this.db = data;
      this.save();
      logger.info('[LocalStorage] Database imported');
      return true;
    } catch (error) {
      logger.error('[LocalStorage] Failed to import:', error);
      return false;
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    const stats = {};
    Object.entries(this.db.entities).forEach(([entityType, entities]) => {
      stats[entityType] = entities.length;
    });
    return stats;
  }
}

export default LocalStorageAdapter;
