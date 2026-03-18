const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const models = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
    console.log('Available models:', models);
    
    const notesCount = await prisma.note.count();
    console.log('Notes count:', notesCount);
    
    // Try to create a dummy note
    const note = await prisma.note.create({
      data: {
        occupationId: 1, // Assume dossier 1 exists
        content: 'Test note from debug script',
        author: 'SYSTEM'
      }
    });
    console.log('Created test note:', note);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
