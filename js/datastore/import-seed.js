/**
 * Script d'import du seed data dans le datastore
 * À exécuter depuis la console du navigateur ou via un bouton dans l'interface
 */

import datastore from './datastore.js';

/**
 * Importe le fichier seed-comprehensive.json dans le datastore
 */
export async function importSeedData() {
  try {
    console.log('🚀 Chargement du seed data...');

    // Charger le fichier JSON
    const response = await fetch('./js/datastore/seed-comprehensive.json');
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const seedData = await response.json();
    console.log('📦 Seed data chargé:', seedData);

    // Vider les données existantes (optionnel - commenter si on veut conserver)
    console.log('🗑️ Suppression des données existantes...');
    const tables = [
      'PPM_PLAN', 'OPERATION', 'BUDGET_LINE', 'ENTREPRISE', 'GROUPEMENT',
      'PROCEDURE', 'RECOURS', 'ATTRIBUTION', 'ECHEANCIER', 'CLE_REPARTITION',
      'VISA_CF', 'ORDRE_SERVICE', 'AVENANT', 'RESILIATION', 'GARANTIE',
      'CLOTURE', 'ANO', 'DOCUMENT', 'DECOMPTE', 'DIFFICULTE'
    ];

    for (const table of tables) {
      const items = await datastore.getAll(table);
      for (const item of items) {
        await datastore.delete(table, item.id);
      }
    }

    // Importer chaque table
    console.log('📥 Import des données...');
    let totalImported = 0;

    for (const [tableName, records] of Object.entries(seedData)) {
      if (Array.isArray(records) && records.length > 0) {
        console.log(`  Importing ${tableName}: ${records.length} records...`);

        for (const record of records) {
          await datastore.save(tableName, record);
          totalImported++;
        }

        console.log(`  ✅ ${tableName}: ${records.length} records imported`);
      }
    }

    // Statistiques finales
    console.log('\n✅ IMPORT TERMINÉ!\n');
    console.log('📊 Statistiques:');
    for (const table of tables) {
      const count = (await datastore.getAll(table)).length;
      if (count > 0) {
        console.log(`   - ${table}: ${count}`);
      }
    }
    console.log(`\n📦 Total: ${totalImported} enregistrements importés`);

    return {
      success: true,
      totalImported,
      message: `${totalImported} enregistrements importés avec succès`
    };

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Fonction helper pour importer depuis la console
 */
window.importSeedData = importSeedData;

export default importSeedData;
