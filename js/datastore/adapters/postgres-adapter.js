/**
 * PostgreSQL Adapter for SIDCF Portal
 * Communique avec l'API Cloudflare Worker (PostgreSQL + R2)
 */

const DEFAULT_API_URL = 'http://localhost:8787'; // Dev mode, sera overridé en prod

export class PostgresAdapter {
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || DEFAULT_API_URL;
    this.headers = {
      'Content-Type': 'application/json',
      ...(config.headers || {})
    };
    console.log('[PostgresAdapter] Initialized with API URL:', this.apiUrl);
  }

  /**
   * Effectue une requête HTTP vers l'API
   */
  async request(method, endpoint, data = null) {
    const url = `${this.apiUrl}${endpoint}`;
    const options = {
      method,
      headers: this.headers
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[PostgresAdapter] Request error:', error);
      throw error;
    }
  }

  /**
   * Test de connexion
   */
  async testConnection() {
    try {
      const response = await this.request('GET', '/health');
      return {
        success: true,
        message: 'Connection successful',
        data: response
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Query entities with optional filter
   */
  async query(entityType, filter = null) {
    try {
      let endpoint = `/api/entities/${entityType}`;
      if (filter) {
        endpoint += `?filter=${encodeURIComponent(JSON.stringify(filter))}`;
      }
      return await this.request('GET', endpoint);
    } catch (error) {
      console.error(`[PostgresAdapter] Query error for ${entityType}:`, error);
      throw error;
    }
  }

  /**
   * Get single entity by ID
   */
  async get(entityType, id) {
    try {
      return await this.request('GET', `/api/entities/${entityType}/${id}`);
    } catch (error) {
      console.error(`[PostgresAdapter] Get error for ${entityType}/${id}:`, error);
      throw error;
    }
  }

  /**
   * Add new entity
   */
  async add(entityType, entity) {
    try {
      // Générer un ID si absent (UUID v4)
      if (!entity.id) {
        entity.id = this.generateUUID();
      }

      // Ajouter timestamps
      const now = new Date().toISOString();
      entity.createdAt = entity.createdAt || now;
      entity.updatedAt = now;

      const created = await this.request('POST', `/api/entities/${entityType}`, entity);
      console.log(`[PostgresAdapter] Created ${entityType}:`, created.id);
      return created;
    } catch (error) {
      console.error(`[PostgresAdapter] Add error for ${entityType}:`, error);
      throw error;
    }
  }

  /**
   * Update entity
   */
  async update(entityType, id, patch) {
    try {
      // Mettre à jour le timestamp
      patch.updatedAt = new Date().toISOString();

      const updated = await this.request('PUT', `/api/entities/${entityType}/${id}`, patch);
      console.log(`[PostgresAdapter] Updated ${entityType}/${id}`);
      return updated;
    } catch (error) {
      console.error(`[PostgresAdapter] Update error for ${entityType}/${id}:`, error);
      throw error;
    }
  }

  /**
   * Remove entity
   */
  async remove(entityType, id) {
    try {
      await this.request('DELETE', `/api/entities/${entityType}/${id}`);
      console.log(`[PostgresAdapter] Deleted ${entityType}/${id}`);
      return { success: true };
    } catch (error) {
      console.error(`[PostgresAdapter] Delete error for ${entityType}/${id}:`, error);
      throw error;
    }
  }

  /**
   * Load seed data
   */
  async loadSeed(seedData) {
    console.log('[PostgresAdapter] Loading seed data...');
    let loaded = 0;

    try {
      for (const entityType of Object.keys(seedData.entities || {})) {
        const entities = seedData.entities[entityType];

        for (const entity of entities) {
          try {
            await this.add(entityType, entity);
            loaded++;
          } catch (error) {
            console.error(`[PostgresAdapter] Failed to load seed entity ${entityType}:`, error);
          }
        }
      }

      console.log(`[PostgresAdapter] Loaded ${loaded} seed entities`);
      return { success: true, loaded };
    } catch (error) {
      console.error('[PostgresAdapter] Seed loading error:', error);
      throw error;
    }
  }

  /**
   * Export all data
   */
  async export() {
    console.log('[PostgresAdapter] Export not fully implemented for PostgreSQL');
    // TODO: Implémenter l'export complet si nécessaire
    return {
      version: '1.0',
      createdAt: new Date().toISOString(),
      entities: {}
    };
  }

  /**
   * Get statistics
   */
  async getStats() {
    try {
      return await this.request('GET', '/api/stats');
    } catch (error) {
      console.error('[PostgresAdapter] Stats error:', error);
      return {};
    }
  }

  /**
   * Get full operations with related entities
   */
  async getOperationsFull() {
    try {
      return await this.request('GET', '/api/operations/full');
    } catch (error) {
      console.error('[PostgresAdapter] Operations full error:', error);
      return [];
    }
  }

  /**
   * Generate UUID v4 (client-side)
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Upload file to R2
   */
  async uploadFile(file, fileName = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (fileName) {
        formData.append('fileName', fileName);
      }

      const response = await fetch(`${this.apiUrl}/api/files/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[PostgresAdapter] File uploaded:', result.url);
      return result;
    } catch (error) {
      console.error('[PostgresAdapter] Upload error:', error);
      throw error;
    }
  }

  /**
   * Get signed download URL for a file
   */
  async getDownloadUrl(fileName) {
    try {
      const result = await this.request('GET', `/api/files/download/${fileName}`);
      return result.url;
    } catch (error) {
      console.error('[PostgresAdapter] Download URL error:', error);
      throw error;
    }
  }

  /**
   * Delete file from R2
   */
  async deleteFile(fileName) {
    try {
      await this.request('DELETE', `/api/files/${fileName}`);
      console.log('[PostgresAdapter] File deleted:', fileName);
      return { success: true };
    } catch (error) {
      console.error('[PostgresAdapter] Delete file error:', error);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileName) {
    try {
      return await this.request('GET', `/api/files/metadata/${fileName}`);
    } catch (error) {
      console.error('[PostgresAdapter] File metadata error:', error);
      throw error;
    }
  }
}

export default PostgresAdapter;
