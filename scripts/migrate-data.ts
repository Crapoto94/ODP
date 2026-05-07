const { PrismaClient: PostgresClient } = require('../lib/prisma-client');
const { PrismaClient: SQLiteLocalClient } = require('../lib/prisma-local-client');
const path = require('path');

async function migrate() {
  console.log('🚀 Starting dynamic data migration from SQLite to PostgreSQL...');

  const sqlite = new SQLiteLocalClient({
    datasources: {
      db: {
        url: `file:${path.join(__dirname, '../prisma/dev.db')}`,
      },
    },
  });

  try {
    // 1. Fetch Postgres configuration from SQLite
    console.log('🔍 Fetching PostgreSQL configuration from local database...');
    const config = await sqlite.postgresConfig.findFirst();

    if (!config) {
      throw new Error('PostgresConfig not found in SQLite database.');
    }

    const { user, password, host, port, database, schema } = config;
    const targetSchema = schema || 'ODP';
    const postgresUrl = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?schema=${targetSchema}`;
    
    console.log(`📡 Connecting to PostgreSQL at ${host}:${port}/${database} (schema: ${targetSchema})...`);

    const postgres = new PostgresClient({
      datasources: {
        db: {
          url: postgresUrl,
        },
      },
    });

    // Reordered tables to respect foreign key constraints
    const tables = [
      'User',
      'ModeTaxation',
      'Categorie',
      'Article',
      'Tiers',
      'Occupation',
      'LigneOccupation',
      'Dispositif',
      'Gabarit',
      'BillingRun',
      'BillingRunInvoice',
      'Signatory',
      'SignatureRequest',
      'FavoriteCommerce',
      'MobileLog',
      'ContextualMessage',
      'O365Message',
      'TlpeConfig',
      'OdpConfig',
      'TypeDossierConfig',
      'ContactRoleConfig',
      'Contact',
      'Note',
      'VersionRelease',
      'BacklogItem',
      'BacklogComment'
    ];

    // 2. Clear Postgres tables in reverse order
    console.log('🧹 Clearing target PostgreSQL tables...');
    for (const table of [...tables].reverse()) {
      try {
        await postgres.$executeRawUnsafe(`TRUNCATE TABLE "${targetSchema}"."${table}" CASCADE;`);
      } catch (e) {
        // Table might not exist or other issue
      }
    }

    // 3. Migrate each table
    for (const table of tables) {
      console.log(`📦 Migrating table: ${table}...`);
      
      let data = [];
      try {
        data = await (sqlite as any).$queryRawUnsafe(`SELECT * FROM "${table}"`);
      } catch (e) {
        console.log(`   ⚠️ Table ${table} not found in SQLite, skipping.`);
        continue;
      }
      
      if (data.length === 0) {
        console.log(`   (Empty, skipping)`);
        continue;
      }

      const transformedData = data.map((item: any) => {
        const newItem = { ...item };
        for (const key in newItem) {
          if (key.toLowerCase().includes('date') || key === 'created_at' || key === 'updated_at' || key === 'releasedAt') {
            if (newItem[key]) newItem[key] = new Date(newItem[key]);
          }
          const booleanFields = [
            'isAd', 'isCourtMetrage', 'isAgissantPourBillable', 'aotSigned', 'processed', 
            'isDefault', 'disabled', 'isSendAot'
          ];
          if (booleanFields.includes(key)) {
            newItem[key] = !!newItem[key];
          }
        }
        return newItem;
      });

      try {
        await (postgres as any)[table.charAt(0).toLowerCase() + table.slice(1)].createMany({
          data: transformedData,
          skipDuplicates: true,
        });
        console.log(`   ✅ Migrated ${data.length} rows.`);
      } catch (e) {
        console.error(`   ❌ Failed to migrate ${table}:`, e.message);
      }
    }

    // 4. Reset sequences
    console.log('🔄 Resetting PostgreSQL sequences...');
    for (const table of tables) {
      try {
        await postgres.$executeRawUnsafe(`
          SELECT setval(pg_get_serial_sequence('"${targetSchema}"."${table}"', 'id'), coalesce(max(id), 1)) FROM "${targetSchema}"."${table}";
        `);
      } catch (e) {
        // No auto-increment id or other issue
      }
    }

    console.log('✨ Migration completed successfully!');
    await postgres.$disconnect();
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sqlite.$disconnect();
  }
}

migrate();
