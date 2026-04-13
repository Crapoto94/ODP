const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.gabarit.findUnique({
  where: { id: 14 }
}).then(g => {
  if (g && g.contenu) {
    const content = JSON.parse(g.contenu);
    console.log('Gabarit 14 - Éléments avec leurs variables:');
    content.elements.forEach((el, idx) => {
      if (el.value && (el.value.includes('{') || el.value.includes('}'))) {
        console.log(`${idx}: [${el.type}] ${el.value.substring(0, 80)}`);
      }
    });
  }
  process.exit(0);
}).catch(console.error);
