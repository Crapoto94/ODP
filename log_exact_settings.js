const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const settings = await prisma.appSettings.findFirst();
  console.log('--- SETTINGS ---');
  console.log(`URL: |${settings?.apmUrl}|`);
  console.log(`TOKEN: |${settings?.apmToken}|`);
  console.log(`SENDER_NAME: |${settings?.senderName}|`);
  console.log(`SENDER_EMAIL: |${settings?.senderEmail}|`);
  process.exit(0);
}
run();
