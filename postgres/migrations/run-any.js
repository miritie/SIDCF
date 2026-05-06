#!/usr/bin/env node
/**
 * Runner de migration via @neondatabase/serverless (HTTP fetch)
 * Usage : node run-any.js <fichier.sql>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Le driver est dans le worker
const NEON_PATH = path.resolve(__dirname, '../worker/node_modules/@neondatabase/serverless/index.mjs');

const connectionString = process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_mSJIP0W2lLfw@ep-icy-wildflower-ah7opo0w-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

const arg = process.argv[2];
if (!arg) {
  console.error('Usage : node run-any.js <fichier.sql>');
  process.exit(2);
}

const sqlFile = path.isAbsolute(arg) ? arg : path.join(__dirname, arg);
if (!fs.existsSync(sqlFile)) {
  console.error('Fichier introuvable :', sqlFile);
  process.exit(2);
}

const fullSql = fs.readFileSync(sqlFile, 'utf8');

// Driver Neon HTTP : exécute via Pool (qui supporte les transactions et multi-statements)
const { Pool } = await import(NEON_PATH);
const pool = new Pool({ connectionString });

(async () => {
  const client = await pool.connect();
  try {
    console.log('🔌 Connecté à Neon (HTTP/WebSocket)\n');
    console.log('📝 Exécution de :', path.basename(sqlFile), '\n');

    // Capture les NOTICEs
    if (client.on) {
      client.on('notice', (msg) => console.log('  📢', msg.message || msg));
    }

    const result = await client.query(fullSql);

    if (Array.isArray(result)) {
      const last = result[result.length - 1];
      if (last && last.rows && last.rows.length) {
        console.log('\nRésultat final :');
        console.table(last.rows);
      }
    } else if (result && result.rows && result.rows.length) {
      console.log('\nRésultat :');
      console.table(result.rows);
    }
    console.log('\n✅ Migration terminée.');
  } catch (err) {
    console.error('\n❌ Erreur :', err.message);
    if (err.detail) console.error('   Détail :', err.detail);
    if (err.hint) console.error('   Indice :', err.hint);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
