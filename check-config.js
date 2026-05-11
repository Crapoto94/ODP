const { PrismaClient } = require('./lib/prisma-local-client');
const path = require('path');

async function checkConfig() {
  const sqlite = new PrismaClient({
    datasources: {
      db: {
        url: `file:${path.join(__dirname, 'prisma/dev.db')}`,
      },
    },
  });

  try {
    const config = await sqlite.postgresConfig.findFirst();
    console.log('CONFIG_FOUND:' + JSON.stringify(config));
  } catch (e) {
    console.error('ERROR:' + e.message);
  } finally {
    await sqlite.$disconnect();
  }
}

checkConfig();
