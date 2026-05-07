const { PrismaClient } = require('./lib/prisma-local-client');
const path = require('path');

async function cleanupSQLite() {
  console.log('🧹 Cleaning up local SQLite database...');
  
  const sqlite = new PrismaClient({
    datasources: {
      db: {
        url: `file:${path.join(__dirname, 'prisma', 'dev.db')}`,
      },
    },
  });

  const tablesToKeep = ['AppSettings', 'PostgresConfig', '_prisma_migrations'];
  
  try {
    // Disable foreign keys for cleanup
    await sqlite.$executeRawUnsafe('PRAGMA foreign_keys = OFF;');

    // Get all table names
    const tables = await sqlite.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table';");
    const tableNames = tables.map(t => t.name).filter(name => !name.startsWith('sqlite_'));

    console.log(`🔍 Found ${tableNames.length} tables in SQLite.`);

    for (const table of tableNames) {
      if (!tablesToKeep.includes(table)) {
        console.log(`🗑️ Dropping table: ${table}...`);
        await sqlite.$executeRawUnsafe(`DROP TABLE "${table}";`);
      }
    }

    // Vacuum to reclaim space
    console.log('✨ Vacuuming database...');
    await sqlite.$executeRawUnsafe('VACUUM;');
    
    // Re-enable foreign keys
    await sqlite.$executeRawUnsafe('PRAGMA foreign_keys = ON;');

    console.log('✅ SQLite cleanup completed successfully! Only settings tables remain.');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await sqlite.$disconnect();
  }
}

cleanupSQLite();
