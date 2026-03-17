const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const settings = await prisma.appSettings.findFirst();
  if (settings) {
    await prisma.appSettings.update({
      where: { id: settings.id },
      data: { apmToken: 'APM-DSIHUB-2026-TEST-KEY' }
    });
    console.log('Updated AppSettings with correct token.');
  } else {
    await prisma.appSettings.create({
      data: {
        id: 1,
        apmToken: 'APM-DSIHUB-2026-TEST-KEY',
        apmUrl: 'http://localhost:8001/api/v1'
      }
    });
    console.log('Created AppSettings with correct token.');
  }
}
run();
