#!/usr/bin/env node

/**
 * Script d'exécution de la migration PostgreSQL
 * Connecte à Neon Database et exécute le schéma SQL
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration de connexion Neon Database
const connectionString = 'postgresql://neondb_owner:npg_mSJIP0W2lLfw@ep-icy-wildflower-ah7opo0w-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connexion à la base de données PostgreSQL (Neon)...');
    await client.connect();
    console.log('✅ Connecté avec succès !');

    // Lire le fichier SQL
    const sqlFile = path.join(__dirname, '001_create_schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('\n📝 Exécution de la migration 001_create_schema.sql...');
    await client.query(sql);
    console.log('✅ Migration exécutée avec succès !');

    // Vérifier les tables créées
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('\n📊 Tables créées :');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Statistiques
    const stats = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as tables_count,
        (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public') as views_count,
        (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as indexes_count
    `);

    console.log('\n📈 Statistiques du schéma :');
    console.log(`  - Tables : ${stats.rows[0].tables_count}`);
    console.log(`  - Vues : ${stats.rows[0].views_count}`);
    console.log(`  - Index : ${stats.rows[0].indexes_count}`);

    console.log('\n🎉 Migration terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Connexion fermée.');
  }
}

runMigration();
