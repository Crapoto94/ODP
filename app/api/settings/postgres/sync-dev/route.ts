import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { config } = await req.json();

  if (!config) {
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 400 });
  }

  try {
    const connectionString = `postgresql://${encodeURIComponent(config.user)}:${encodeURIComponent(config.password)}@${config.host}:${config.port}/${config.database}`;

    // Dynamic import to avoid bundling issues
    const { Client } = await import('pg');

    const prodClient = new Client({
      connectionString: connectionString,
      statement_timeout: 30000,
    });

    const devClient = new Client({
      connectionString: connectionString,
      statement_timeout: 30000,
    });

    await prodClient.connect();
    await devClient.connect();

    console.log(`[SYNC-DEV] Connecting to ${config.schema} (PROD) and ${config.schemaDev} (DEV)`);

    // 1. Drop schema DEV avec CASCADE
    console.log(`[SYNC-DEV] Dropping ${config.schemaDev} schema...`);
    await devClient.query(`DROP SCHEMA IF EXISTS "${config.schemaDev}" CASCADE`);

    // 2. Créer le schéma DEV
    console.log(`[SYNC-DEV] Creating ${config.schemaDev} schema...`);
    await devClient.query(`CREATE SCHEMA "${config.schemaDev}"`);

    // 3. Get all tables from PROD
    console.log(`[SYNC-DEV] Fetching tables from ${config.schema}...`);
    const tablesResult = await prodClient.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = $1
      ORDER BY tablename
    `, [config.schema]);

    const tables = tablesResult.rows.map(r => r.tablename);
    console.log(`[SYNC-DEV] Found ${tables.length} tables to copy`);

    // 4. Copy each table with structure and data
    for (const table of tables) {
      console.log(`[SYNC-DEV] Copying table: ${table}...`);

      try {
        // Create table in DEV by copying structure
        const columnsResult = await prodClient.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position
        `, [config.schema, table]);

        if (columnsResult.rows.length > 0) {
          const columnDefs = columnsResult.rows.map(col => {
            let def = `"${col.column_name}" ${col.data_type}`;
            if (col.is_nullable === 'NO') def += ' NOT NULL';
            if (col.column_default) def += ` DEFAULT ${col.column_default}`;
            return def;
          }).join(', ');

          const createStmt = `CREATE TABLE "${config.schemaDev}"."${table}" (${columnDefs})`;
          await devClient.query(createStmt);
        }

        // Get primary key and constraints
        const constraintsResult = await prodClient.query(`
          SELECT constraint_name, constraint_type
          FROM information_schema.table_constraints
          WHERE table_schema = $1 AND table_name = $2 AND constraint_type IN ('PRIMARY KEY', 'UNIQUE')
        `, [config.schema, table]);

        for (const constraint of constraintsResult.rows) {
          try {
            const colsResult = await prodClient.query(`
              SELECT column_name
              FROM information_schema.key_column_usage
              WHERE table_schema = $1 AND table_name = $2 AND constraint_name = $3
              ORDER BY ordinal_position
            `, [config.schema, table, constraint.constraint_name]);

            const columns = colsResult.rows.map(r => `"${r.column_name}"`).join(', ');
            const constraintType = constraint.constraint_type === 'PRIMARY KEY' ? 'PRIMARY KEY' : 'UNIQUE';

            await devClient.query(`
              ALTER TABLE "${config.schemaDev}"."${table}"
              ADD CONSTRAINT "${constraint.constraint_name}" ${constraintType} (${columns})
            `);
          } catch (err) {
            console.warn(`[SYNC-DEV] Warning adding constraint ${constraint.constraint_name}: ${err}`);
          }
        }

        // Copy data
        const dataResult = await prodClient.query(`SELECT * FROM "${config.schema}"."${table}"`);

        if (dataResult.rows.length > 0) {
          const columns = Object.keys(dataResult.rows[0]);
          const columnList = columns.map(c => `"${c}"`).join(', ');

          for (const row of dataResult.rows) {
            const values = columns.map(col => row[col]);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

            try {
              await devClient.query(
                `INSERT INTO "${config.schemaDev}"."${table}" (${columnList}) VALUES (${placeholders})`,
                values
              );
            } catch (err: any) {
              console.warn(`[SYNC-DEV] Warning inserting row in ${table}: ${err.message}`);
            }
          }
        }

        console.log(`[SYNC-DEV] ✓ Table ${table} copied`);
      } catch (err: any) {
        console.error(`[SYNC-DEV] Error copying table ${table}: ${err.message}`);
        throw err;
      }
    }

    // 5. Copy sequences
    console.log(`[SYNC-DEV] Copying sequences...`);
    const sequencesResult = await prodClient.query(`
      SELECT sequence_name
      FROM information_schema.sequences
      WHERE sequence_schema = $1
      ORDER BY sequence_name
    `, [config.schema]);

    const sequences = sequencesResult.rows.map(r => r.sequence_name);
    console.log(`[SYNC-DEV] Found ${sequences.length} sequences`);

    for (const seq of sequences) {
      try {
        // Get current value
        const valueResult = await prodClient.query(`
          SELECT last_value FROM "${config.schema}"."${seq}"
        `);
        const lastValue = valueResult.rows[0]?.last_value || 1;

        // Create sequence in DEV
        await devClient.query(`
          CREATE SEQUENCE "${config.schemaDev}"."${seq}" START WITH ${lastValue}
        `);

        console.log(`[SYNC-DEV] ✓ Sequence ${seq} created (value: ${lastValue})`);
      } catch (err: any) {
        console.warn(`[SYNC-DEV] Warning creating sequence ${seq}: ${err.message}`);
      }
    }

    await prodClient.end();
    await devClient.end();

    console.log('[SYNC-DEV] ✅ Synchronization complete!');

    return NextResponse.json({
      success: true,
      message: `Synchronisation réussie: ${tables.length} tables et ${sequences.length} séquences copiées`,
      tablesCount: tables.length,
      sequencesCount: sequences.length
    });

  } catch (error: any) {
    console.error('[SYNC-DEV] Error:', error.message);
    return NextResponse.json({
      error: error.message || 'Erreur lors de la synchronisation'
    }, { status: 500 });
  }
}
