/**
 * SIDCF Portal API - Cloudflare Worker
 * PostgreSQL (Neon) + Cloudflare R2 Storage
 */

import { neon } from '@neondatabase/serverless';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ============================================
// Configuration
// ============================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Mapping des noms d'entités vers les tables PostgreSQL
const ENTITY_TABLE_MAP = {
  // Module Marché
  'PPM_PLAN': 'ppm_plan',
  'OPERATION': 'operation',
  'BUDGET_LINE': 'budget_line',
  'LIVRABLE': 'livrable',
  'ENTREPRISE': 'entreprise',
  'GROUPEMENT': 'groupement',
  'PROCEDURE': 'procedure',
  'RECOURS': 'recours',
  'ATTRIBUTION': 'attribution',
  'ANO': 'ano',
  'ECHEANCIER': 'echeancier',
  'CLE_REPARTITION': 'cle_repartition',
  'VISA_CF': 'visa_cf',
  'ORDRE_SERVICE': 'ordre_service',
  'AVENANT': 'avenant',
  'RESILIATION': 'resiliation',
  'GARANTIE': 'garantie',
  'CLOTURE': 'cloture',
  'DOCUMENT': 'document',
  'DECOMPTE': 'decompte',
  'DIFFICULTE': 'difficulte',

  // Module Investissement
  'INV_PROJECT': 'inv_project',
  'INV_BUDGET': 'inv_budget',
  'INV_BUDGET_BREAKDOWN': 'inv_budget_breakdown',
  'INV_TRANSFER': 'inv_transfer',
  'INV_ADVANCE_LETTER': 'inv_advance_letter',
  'INV_COMPONENT': 'inv_component',
  'INV_ACTIVITY': 'inv_activity',
  'INV_PHYSICAL_TRACKING': 'inv_physical_tracking',
  'INV_FINANCIAL_STATUS': 'inv_financial_status',
  'INV_GLIDE': 'inv_glide',
  'INV_GAR_INDICATOR': 'inv_gar_indicator',
  'INV_EVALUATION': 'inv_evaluation',
  'INV_ALERT': 'inv_alert',
  'INV_DOCUMENT': 'inv_document',
  // Module Investissement - Enrichissement V2
  'INV_PIP_HISTORY': 'inv_pip_history',
  'INV_OPE_CRITERIA': 'inv_ope_criteria',
  'INV_PROVISIONAL_OP': 'inv_provisional_op',
  'INV_IMPREST': 'inv_imprest',
  'INV_IMPREST_MOVEMENT': 'inv_imprest_movement',
  'INV_QUARTERLY_TRACKING': 'inv_quarterly_tracking',
  'INV_GAR_VALUES': 'inv_gar_values',
  'INV_DOC_MATRIX': 'inv_doc_matrix',
  'INV_DECISION': 'inv_decision',
  'INV_SETTINGS': 'inv_settings'
};

// ============================================
// Helpers
// ============================================

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    }
  });
}

function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

// Convertir les noms de colonnes snake_case vers camelCase
function snakeToCamel(obj) {
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      let value = obj[key];

      // Convertir les montants décimaux (string) en nombres
      if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)) {
        // C'est un nombre décimal sous forme de string (ex: "75000000.00")
        const numericKeys = ['montant', 'total', 'pourcentage', 'pourcent'];
        if (numericKeys.some(k => camelKey.toLowerCase().includes(k))) {
          value = parseFloat(value);
        }
      }

      acc[camelKey] = snakeToCamel(value);
      return acc;
    }, {});
  }
  return obj;
}

// Convertir camelCase vers snake_case
function camelToSnake(obj) {
  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      acc[snakeKey] = camelToSnake(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

// ============================================
// Database Operations
// ============================================

async function queryDatabase(sql, env) {
  const db = neon(env.DATABASE_URL);
  try {
    const result = await db(sql);
    return snakeToCamel(result);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// GET: Query entities with optional filter
async function getEntities(entityType, filter, env) {
  const tableName = ENTITY_TABLE_MAP[entityType];
  if (!tableName) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  let sql = `SELECT * FROM ${tableName}`;

  // Implémenter le filtrage
  if (filter && typeof filter === 'object' && Object.keys(filter).length > 0) {
    const conditions = [];
    for (const [key, value] of Object.entries(filter)) {
      // Convertir camelCase en snake_case pour les noms de colonnes
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      // Échapper les valeurs pour éviter l'injection SQL
      const escapedValue = String(value).replace(/'/g, "''");
      conditions.push(`${snakeKey} = '${escapedValue}'`);
    }
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
  }

  sql += ' ORDER BY created_at DESC';

  return await queryDatabase(sql, env);
}

// GET: Get single entity by ID
async function getEntity(entityType, id, env) {
  const tableName = ENTITY_TABLE_MAP[entityType];
  if (!tableName) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  const sql = `SELECT * FROM ${tableName} WHERE id = '${id}'`;
  const result = await queryDatabase(sql, env);

  if (result.length === 0) {
    throw new Error('Entity not found');
  }

  return result[0];
}

// POST: Create new entity
async function createEntity(entityType, data, env) {
  const tableName = ENTITY_TABLE_MAP[entityType];
  if (!tableName) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  // Convertir camelCase vers snake_case
  const snakeData = camelToSnake(data);

  // Construire la requête INSERT
  const columns = Object.keys(snakeData).filter(k => k !== 'id');
  const values = columns.map(col => {
    const val = snakeData[col];
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
    if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
    return val;
  });

  const sql = `
    INSERT INTO ${tableName} (${columns.join(', ')})
    VALUES (${values.join(', ')})
    RETURNING *
  `;

  const result = await queryDatabase(sql, env);
  return result[0];
}

// PUT: Update entity
async function updateEntity(entityType, id, patch, env) {
  const tableName = ENTITY_TABLE_MAP[entityType];
  if (!tableName) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  const snakePatch = camelToSnake(patch);

  // Construire la clause SET
  const setClause = Object.keys(snakePatch)
    .filter(k => k !== 'id' && k !== 'created_at')
    .map(col => {
      const val = snakePatch[col];
      if (val === null || val === undefined) return `${col} = NULL`;
      if (typeof val === 'object') return `${col} = '${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
      if (typeof val === 'string') return `${col} = '${val.replace(/'/g, "''")}'`;
      return `${col} = ${val}`;
    })
    .join(', ');

  const sql = `
    UPDATE ${tableName}
    SET ${setClause}
    WHERE id = '${id}'
    RETURNING *
  `;

  const result = await queryDatabase(sql, env);

  if (result.length === 0) {
    throw new Error('Entity not found');
  }

  return result[0];
}

// DELETE: Remove entity
async function deleteEntity(entityType, id, env) {
  const tableName = ENTITY_TABLE_MAP[entityType];
  if (!tableName) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  const sql = `DELETE FROM ${tableName} WHERE id = '${id}' RETURNING *`;
  const result = await queryDatabase(sql, env);

  if (result.length === 0) {
    throw new Error('Entity not found');
  }

  return { success: true, deleted: result[0] };
}

// ============================================
// R2 Storage Operations
// ============================================

function getR2Client(env) {
  return new S3Client({
    region: 'auto',
    endpoint: 'https://a406a344d14de27baff112ae126d7144.r2.cloudflarestorage.com',
    credentials: {
      accessKeyId: 'd508cf1caa97484a4dca02b300d3f891',
      secretAccessKey: 'dadd484fb1d960ac8b66543be18eda446755df83f4d36223b9d7249b50bad317',
    },
  });
}

// Upload file to R2
async function uploadFileToR2(fileData, fileName, contentType, env) {
  const s3Client = getR2Client(env);

  const command = new PutObjectCommand({
    Bucket: 'sidcf',
    Key: fileName,
    Body: fileData,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Retourner l'URL publique
  const publicUrl = `https://a406a344d14de27baff112ae126d7144.r2.cloudflarestorage.com/sidcf/${fileName}`;
  return publicUrl;
}

// Get signed URL for downloading
async function getSignedDownloadUrl(fileName, env) {
  const s3Client = getR2Client(env);

  const command = new GetObjectCommand({
    Bucket: 'sidcf',
    Key: fileName,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return url;
}

// Delete file from R2
async function deleteFileFromR2(fileName, env) {
  const s3Client = getR2Client(env);

  const command = new DeleteObjectCommand({
    Bucket: 'sidcf',
    Key: fileName,
  });

  await s3Client.send(command);
  return { success: true };
}

// Get file metadata
async function getFileMetadata(fileName, env) {
  const s3Client = getR2Client(env);

  const command = new HeadObjectCommand({
    Bucket: 'sidcf',
    Key: fileName,
  });

  const response = await s3Client.send(command);
  return {
    size: response.ContentLength,
    contentType: response.ContentType,
    lastModified: response.LastModified,
  };
}

// ============================================
// Router
// ============================================

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    // Health check
    if (path === '/health' || path === '/') {
      return jsonResponse({
        status: 'ok',
        service: 'SIDCF Portal API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    }

    // ============================================
    // Entity CRUD Routes
    // ============================================

    // GET /api/entities/:entityType
    if (method === 'GET' && path.match(/^\/api\/entities\/([A-Z_]+)$/)) {
      const entityType = path.split('/')[3];
      const filter = url.searchParams.get('filter') ? JSON.parse(url.searchParams.get('filter')) : null;
      const entities = await getEntities(entityType, filter, env);
      return jsonResponse(entities);
    }

    // GET /api/entities/:entityType/:id
    // Support both UUID format and custom IDs (like CLO-OP-2023-001, OS-xxx, etc.)
    if (method === 'GET' && path.match(/^\/api\/entities\/([A-Z_]+)\/[a-zA-Z0-9_-]+$/)) {
      const parts = path.split('/');
      const entityType = parts[3];
      const id = parts[4];
      const entity = await getEntity(entityType, id, env);
      return jsonResponse(entity);
    }

    // POST /api/entities/:entityType
    if (method === 'POST' && path.match(/^\/api\/entities\/([A-Z_]+)$/)) {
      const entityType = path.split('/')[3];
      const data = await request.json();
      const created = await createEntity(entityType, data, env);
      return jsonResponse(created, 201);
    }

    // PUT /api/entities/:entityType/:id
    if (method === 'PUT' && path.match(/^\/api\/entities\/([A-Z_]+)\/[a-zA-Z0-9_-]+$/)) {
      const parts = path.split('/');
      const entityType = parts[3];
      const id = parts[4];
      const patch = await request.json();
      const updated = await updateEntity(entityType, id, patch, env);
      return jsonResponse(updated);
    }

    // DELETE /api/entities/:entityType/:id
    if (method === 'DELETE' && path.match(/^\/api\/entities\/([A-Z_]+)\/[a-zA-Z0-9_-]+$/)) {
      const parts = path.split('/');
      const entityType = parts[3];
      const id = parts[4];
      const result = await deleteEntity(entityType, id, env);
      return jsonResponse(result);
    }

    // ============================================
    // File Upload/Download Routes (R2)
    // ============================================

    // POST /api/files/upload
    if (method === 'POST' && path === '/api/files/upload') {
      const formData = await request.formData();
      const file = formData.get('file');
      const fileName = formData.get('fileName') || file.name;

      if (!file) {
        return errorResponse('No file provided', 400);
      }

      const arrayBuffer = await file.arrayBuffer();
      const url = await uploadFileToR2(
        new Uint8Array(arrayBuffer),
        fileName,
        file.type,
        env
      );

      return jsonResponse({
        success: true,
        url,
        fileName,
        size: file.size,
        contentType: file.type
      });
    }

    // GET /api/files/download/:fileName
    if (method === 'GET' && path.match(/^\/api\/files\/download\/.+$/)) {
      const fileName = path.split('/').slice(4).join('/');
      const signedUrl = await getSignedDownloadUrl(fileName, env);
      return jsonResponse({ url: signedUrl });
    }

    // DELETE /api/files/:fileName
    if (method === 'DELETE' && path.match(/^\/api\/files\/.+$/)) {
      const fileName = path.split('/').slice(3).join('/');
      const result = await deleteFileFromR2(fileName, env);
      return jsonResponse(result);
    }

    // GET /api/files/metadata/:fileName
    if (method === 'GET' && path.match(/^\/api\/files\/metadata\/.+$/)) {
      const fileName = path.split('/').slice(4).join('/');
      const metadata = await getFileMetadata(fileName, env);
      return jsonResponse(metadata);
    }

    // ============================================
    // Statistics Routes
    // ============================================

    // GET /api/stats
    if (method === 'GET' && path === '/api/stats') {
      const stats = await queryDatabase('SELECT * FROM v_stats_global', env);
      return jsonResponse(stats[0] || {});
    }

    // GET /api/operations/full
    if (method === 'GET' && path === '/api/operations/full') {
      const operations = await queryDatabase('SELECT * FROM v_operations_full ORDER BY created_at DESC', env);
      return jsonResponse(operations);
    }

    // ============================================
    // Configuration Routes (Phase Config)
    // ============================================

    // GET /api/config/phases - Get all phase configurations
    if (method === 'GET' && path === '/api/config/phases') {
      const phases = await queryDatabase('SELECT * FROM phase_config WHERE is_active = true ORDER BY mode_passation, phase_order', env);
      return jsonResponse(phases);
    }

    // GET /api/config/phases/:modePassation - Get phases for a specific mode
    if (method === 'GET' && path.match(/^\/api\/config\/phases\/[A-Z]+$/)) {
      const modePassation = path.split('/')[4];
      const phases = await queryDatabase(
        `SELECT * FROM phase_config WHERE mode_passation = '${modePassation}' AND is_active = true ORDER BY phase_order`,
        env
      );
      return jsonResponse(phases);
    }

    // PUT /api/config/phases/:id - Update a phase configuration
    if (method === 'PUT' && path.match(/^\/api\/config\/phases\/\d+$/)) {
      const id = path.split('/')[4];
      const data = await request.json();
      const snakeData = camelToSnake(data);

      const setClause = Object.keys(snakeData)
        .filter(k => k !== 'id' && k !== 'created_at')
        .map(col => {
          const val = snakeData[col];
          if (val === null || val === undefined) return `${col} = NULL`;
          if (typeof val === 'boolean') return `${col} = ${val}`;
          if (typeof val === 'number') return `${col} = ${val}`;
          return `${col} = '${String(val).replace(/'/g, "''")}'`;
        })
        .join(', ');

      const sql = `UPDATE phase_config SET ${setClause} WHERE id = ${id} RETURNING *`;
      const result = await queryDatabase(sql, env);

      if (result.length === 0) {
        return errorResponse('Phase configuration not found', 404);
      }

      return jsonResponse(result[0]);
    }

    // POST /api/config/phases - Create a new phase configuration
    if (method === 'POST' && path === '/api/config/phases') {
      const data = await request.json();
      const snakeData = camelToSnake(data);

      const columns = Object.keys(snakeData).filter(k => k !== 'id');
      const values = columns.map(col => {
        const val = snakeData[col];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'boolean') return val;
        if (typeof val === 'number') return val;
        return `'${String(val).replace(/'/g, "''")}'`;
      });

      const sql = `INSERT INTO phase_config (${columns.join(', ')}) VALUES (${values.join(', ')}) RETURNING *`;
      const result = await queryDatabase(sql, env);

      return jsonResponse(result[0], 201);
    }

    // DELETE /api/config/phases/:id - Delete a phase configuration
    if (method === 'DELETE' && path.match(/^\/api\/config\/phases\/\d+$/)) {
      const id = path.split('/')[4];
      const result = await queryDatabase(`DELETE FROM phase_config WHERE id = ${id} RETURNING *`, env);

      if (result.length === 0) {
        return errorResponse('Phase configuration not found', 404);
      }

      return jsonResponse({ success: true, deleted: result[0] });
    }

    // Not found
    return errorResponse('Route not found', 404);

  } catch (error) {
    console.error('Request error:', error);
    return errorResponse(error.message, 500);
  }
}

// ============================================
// Worker Entry Point
// ============================================

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};
