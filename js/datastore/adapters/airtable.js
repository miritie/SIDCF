/* ============================================
   Airtable Adapter (Extensible Provider)
   ============================================ */

import logger from '../../lib/logger.js';

export class AirtableAdapter {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.baseId = config.baseId;
    this.tables = config.tables;
    this.baseUrl = `https://api.airtable.com/v0/${this.baseId}`;
    this.enabled = config.enabled && this.apiKey && this.baseId;

    if (!this.enabled) {
      logger.warn('[Airtable] Adapter disabled or missing credentials');
    } else {
      logger.info('[Airtable] Adapter initialized');
    }
  }

  /**
   * Check if adapter is ready
   */
  isReady() {
    return this.enabled;
  }

  /**
   * Make API request
   */
  async request(method, endpoint, data = null) {
    if (!this.enabled) {
      throw new Error('Airtable adapter not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    if (data && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      logger.error('[Airtable] Request failed:', error);
      throw error;
    }
  }

  /**
   * Map entity type to Airtable table name
   */
  getTableName(entityType) {
    return this.tables[entityType] || entityType;
  }

  /**
   * Transform local entity to Airtable record
   */
  toAirtableRecord(entity) {
    // Remove id and internal fields, flatten structure
    const { id, createdAt, updatedAt, ...fields } = entity;

    // Flatten nested objects
    const flattened = {};
    Object.entries(fields).forEach(([key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
          flattened[`${key}_${nestedKey}`] = nestedValue;
        });
      } else if (Array.isArray(value)) {
        flattened[key] = JSON.stringify(value);
      } else {
        flattened[key] = value;
      }
    });

    return { fields: flattened };
  }

  /**
   * Transform Airtable record to local entity
   */
  fromAirtableRecord(record, entityType) {
    const entity = {
      id: record.id,
      ...record.fields,
      createdAt: record.createdTime
    };

    // Parse JSON strings back to arrays/objects
    Object.keys(entity).forEach(key => {
      const value = entity[key];
      if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
        try {
          entity[key] = JSON.parse(value);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }
    });

    return entity;
  }

  /**
   * Query entities
   */
  async query(entityType, filter = null) {
    const tableName = this.getTableName(entityType);
    let endpoint = `/${tableName}`;

    if (filter) {
      // Build Airtable formula
      const conditions = Object.entries(filter)
        .map(([key, value]) => `{${key}}='${value}'`)
        .join(',');
      endpoint += `?filterByFormula=AND(${conditions})`;
    }

    const response = await this.request('GET', endpoint);
    return response.records.map(r => this.fromAirtableRecord(r, entityType));
  }

  /**
   * Get single entity
   */
  async get(entityType, id) {
    const tableName = this.getTableName(entityType);
    const response = await this.request('GET', `/${tableName}/${id}`);
    return this.fromAirtableRecord(response, entityType);
  }

  /**
   * Add entity
   */
  async add(entityType, entity) {
    const tableName = this.getTableName(entityType);
    const record = this.toAirtableRecord(entity);
    const response = await this.request('POST', `/${tableName}`, { records: [record] });
    return this.fromAirtableRecord(response.records[0], entityType);
  }

  /**
   * Update entity
   */
  async update(entityType, id, patch) {
    const tableName = this.getTableName(entityType);
    const record = this.toAirtableRecord(patch);
    const response = await this.request('PATCH', `/${tableName}/${id}`, record);
    return this.fromAirtableRecord(response, entityType);
  }

  /**
   * Remove entity
   */
  async remove(entityType, id) {
    const tableName = this.getTableName(entityType);
    await this.request('DELETE', `/${tableName}/${id}`);
    return true;
  }

  /**
   * Test connection
   */
  async testConnection() {
    try {
      await this.request('GET', '/PPM_PLAN?maxRecords=1');
      logger.info('[Airtable] Connection test successful');
      return true;
    } catch (error) {
      logger.error('[Airtable] Connection test failed:', error);
      return false;
    }
  }
}

export default AirtableAdapter;
