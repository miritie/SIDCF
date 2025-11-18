const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_mSJIP0W2lLfw@ep-icy-wildflower-ah7opo0w-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function runMigration() {
  const client = new Client({ connectionString });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '003_seed_coherent_data.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration...');
    const result = await client.query(sql);

    console.log('Migration completed!');

    // Show results
    if (Array.isArray(result)) {
      const lastResult = result[result.length - 1];
      if (lastResult && lastResult.rows) {
        console.log('\nData summary:');
        lastResult.rows.forEach(row => {
          console.log(`  ${row.entity}: ${row.count}`);
        });
      }
    }

  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
