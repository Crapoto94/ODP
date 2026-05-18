import { Client } from 'pg';

const config = {
  host: '10.103.130.106',
  port: 5432,
  database: 'ivry_admin',
  user: 'postgres',
  password: 'ivrypassword'
};

const schemas = [
  { name: 'ODP_DEV', label: 'DEV' },
  { name: 'ODP', label: 'PROD' }
];

const migrations = `
  -- Add isArchived column if not exists
  ALTER TABLE "Occupation" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false;

  -- Add isExempt column if not exists
  ALTER TABLE "Occupation" ADD COLUMN IF NOT EXISTS "isExempt" BOOLEAN NOT NULL DEFAULT false;

  -- Add isNotAuthorized column if not exists
  ALTER TABLE "Occupation" ADD COLUMN IF NOT EXISTS "isNotAuthorized" BOOLEAN NOT NULL DEFAULT false;

  -- Create indexes
  CREATE INDEX IF NOT EXISTS "Occupation_isArchived_idx" ON "Occupation"("isArchived");
  CREATE INDEX IF NOT EXISTS "Occupation_isExempt_idx" ON "Occupation"("isExempt");
  CREATE INDEX IF NOT EXISTS "Occupation_isNotAuthorized_idx" ON "Occupation"("isNotAuthorized");
`;

async function applyMigrations() {
  for (const schema of schemas) {
    console.log(`\n📋 Applying migrations to ${schema.label} schema (${schema.name})...`);

    const client = new Client({ ...config });

    try {
      await client.connect();

      // Set search path to the schema
      await client.query(`SET search_path TO "${schema.name}";`);

      // Execute migrations
      const statements = migrations
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        try {
          await client.query(statement + ';');
          console.log(`  ✓ ${statement.substring(0, 50)}...`);
        } catch (error: any) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists')) {
            console.log(`  ✓ ${statement.substring(0, 50)}... (already exists)`);
          } else {
            throw error;
          }
        }
      }

      console.log(`✅ ${schema.label} schema migrated successfully!`);
    } catch (error) {
      console.error(`❌ Error migrating ${schema.label} schema:`, error);
    } finally {
      await client.end();
    }
  }

  console.log('\n✨ All migrations completed!');
}

applyMigrations().catch(console.error);
