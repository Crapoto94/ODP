const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.tlpeConfig.updateMany({
      data: { exoneration: 0 }
    });
    console.log(`✅ Succès : ${result.count} configuration(s) mise(s) à jour avec une exonération de 0 m².`);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour :', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
