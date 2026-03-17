const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const settings = await prisma.appSettings.findFirst();
  console.log('URL:', settings?.apmUrl);
  console.log('Token:', settings?.apmToken);
  console.log('Sender:', settings?.senderName, '<' + settings?.senderEmail + '>');
  process.exit(0);
}
run();
