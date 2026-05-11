const { PrismaClient } = require('../lib/prisma-client');
const path = require('path');
const fs = require('fs');

async function main() {
  const configPath = path.join(__dirname, '../config/settings.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
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

  console.log("🔍 Checking AppSettings in Postgres...");
  const settings = await prisma.appSettings.findFirst();
  console.log("Data:", JSON.stringify(settings, null, 2));
  await prisma.$disconnect();
}

main();
