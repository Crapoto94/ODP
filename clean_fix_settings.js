const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const settings = await prisma.appSettings.findFirst();
  const data = {
    apmUrl: 'http://localhost:8001/api/v1',
    apmToken: 'DSIHUB-ODP-KEY-2026',
    senderEmail: 'dsihub@fbc.fr',
    senderName: 'ODP Console'
  };
  if (settings) {
    await prisma.appSettings.update({
      where: { id: settings.id },
      data
    });
    console.log('Updated AppSettings correctly.');
  } else {
    await prisma.appSettings.create({ data: { id: 1, ...data } });
    console.log('Created AppSettings correctly.');
  }
  process.exit(0);
}
run();
