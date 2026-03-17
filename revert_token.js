const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const settings = await prisma.appSettings.findFirst();
  if (settings) {
    await prisma.appSettings.update({
      where: { id: settings.id },
      data: { apmToken: 'DSIHUB-ODP-KEY-2026' }
    });
    console.log('Reverted AppSettings token to DSIHUB-ODP-KEY-2026');
  }
}
run();
