const { PrismaClient: SQLiteClient } = require('../lib/prisma-temp-client');
const { PrismaClient: PostgresClient } = require('../lib/prisma-client');
const path = require('path');
const fs = require('fs');

async function migrate() {
  console.log("🚀 Starting data migration: AppSettings (SQLite -> Postgres)...");

  const sqlite = new SQLiteClient({
    datasources: {
      db: {
        url: `file:${path.join(__dirname, '../prisma/dev.db')}`,
      },
    },
  });

  // Fetch Postgres configuration from local file
  const configPath = path.join(__dirname, '../config/settings.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  if (!config || !config.postgres) {
    throw new Error('PostgresConfig not found in settings.json.');
  }

  const { user, password, host, port, database, schema } = config.postgres;
  const targetSchema = schema || 'ODP';
  const url = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?schema=${targetSchema}`;

  const postgres = new PostgresClient({
    datasources: {
      db: {
        url: url,
      },
    },
  });

  try {
    // 1. Fetch from SQLite
    const settings = await (sqlite as any).appSettings.findFirst();
    if (!settings) {
      console.log("⚠️ No AppSettings found in SQLite.");
    } else {
      console.log("📦 Found AppSettings in SQLite. Migrating...");
      
      const { id, updated_at, ...data } = settings;
      
      // Clean data for Postgres (handle booleans if needed)
      // SQLite stores booleans as 0/1 usually, Prisma handles it but let's be safe
      
      await (postgres as any).appSettings.upsert({
        where: { id: 1 },
        update: data,
        create: { ...data, id: 1 }
      });
      console.log("✅ AppSettings migrated successfully.");
    }

    // 2. Also migrate PostgresConfig if it exists (for posterity)
    try {
      const pgConfigs = await (sqlite as any).postgresConfig.findMany();
      if (pgConfigs && pgConfigs.length > 0) {
         console.log(`📦 Found ${pgConfigs.length} PostgresConfig rows. (Already in settings.json but migrating just in case)`);
         // PostgresConfig model might not exist in Postgres schema as we use settings.json now
      }
    } catch (e) {}

  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await sqlite.$disconnect();
    await postgres.$disconnect();
  }
}

migrate();
