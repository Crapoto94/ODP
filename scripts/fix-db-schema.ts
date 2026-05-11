const { PrismaClient } = require('../lib/prisma-client');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log("🛠 Reading settings.json for PostgreSQL connection...");
  const configPath = path.join(__dirname, '../config/settings.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  if (!config || !config.postgres) {
    throw new Error('PostgresConfig not found in settings.json.');
  }

  const { user, password, host, port, database, schema } = config.postgres;
  const targetSchema = schema || 'ODP';
  const url = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?schema=${targetSchema}`;

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
  });

  console.log("🛠 Dropping conflicting constraints...");
  try {
    // Drop constraints that block 'db push'
    // The error was specifically about OdpConfig_annee_key
    await prisma.$executeRawUnsafe(`ALTER TABLE "${targetSchema}"."OdpConfig" DROP CONSTRAINT IF EXISTS "OdpConfig_annee_key" CASCADE;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${targetSchema}"."TlpeConfig" DROP CONSTRAINT IF EXISTS "TlpeConfig_annee_key" CASCADE;`);
    console.log("✅ Constraints dropped successfully.");
  } catch (e) {
    console.error("❌ Error dropping constraints:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error("💥 Script failed:", err);
  process.exit(1);
});
