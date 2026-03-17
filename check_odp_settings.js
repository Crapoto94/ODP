const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const settings = await prisma.appSettings.findFirst();
    console.log(JSON.stringify(settings, null, 2));
    await prisma.$disconnect();
}

check();
