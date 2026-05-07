import { NextResponse } from 'next/server';
import { prisma, initializePrisma, getLocalConfig } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // 1. Get AppSettings from Postgres
    let settings = await (prisma as any).appSettings.findFirst();
    if (!settings) {
      settings = await (prisma as any).appSettings.create({
        data: {
          id: 1,
          financeEmail: 'finances@mairie-65k.fr',
          appUrl: 'http://localhost:3000',
          signataireRole: "Le Maire d'Ivry-sur-Seine,",
          signataireDelegation: "et par délégation,",
          signataireNom: "Dominique Montet - Directrice Générale Adjointe"
        }
      });
    }

    // 2. Get Postgres Config from local file
    const config = getLocalConfig();
    const pg = config?.postgres || {};

    // Combine for the frontend
    return NextResponse.json({
      ...settings,
      postgresHost: pg.host || '',
      postgresPort: pg.port || 5432,
      postgresDatabase: pg.database || '',
      postgresUser: pg.user || '',
      postgresPassword: pg.password || '',
      postgresSchema: pg.schema || 'public',
      postgresSchemaDev: pg.schemaDev || 'ODP',
    });
  } catch (error: any) {
    console.error('[SETTINGS GET ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    
    const { 
      postgresHost, postgresPort, postgresDatabase, postgresUser, postgresPassword, postgresSchema, postgresSchemaDev,
      id, updated_at, ...appSettingsData 
    } = body;

    const booleanFields = ['filienRejetDispo', 'filienRejetCA', 'filienRejetMarche', 'autoDistributeInvoices', 'distributeOnlyVerified'];
    booleanFields.forEach(field => {
      if (appSettingsData[field] !== undefined) {
        appSettingsData[field] = !!appSettingsData[field];
      }
    });

    if (appSettingsData.filienExercice) {
      appSettingsData.filienExercice = parseInt(appSettingsData.filienExercice.toString()) || new Date().getFullYear();
    }

    // 1. Update AppSettings in Postgres
    const existing = await (prisma as any).appSettings.findFirst({ where: { id: 1 } });
    let settings;
    if (existing) {
      settings = await (prisma as any).appSettings.update({
        where: { id: 1 },
        data: { ...appSettingsData, updated_at: new Date() }
      });
    } else {
      settings = await (prisma as any).appSettings.create({
        data: { ...appSettingsData, id: 1 }
      });
    }

    // 2. Update Postgres Config in local file if provided
    if (postgresHost !== undefined) {
      const configPath = path.join(process.cwd(), 'config', 'settings.json');
      let config: any = {};
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
      
      config.postgres = {
        ...config.postgres,
        host: postgresHost,
        port: parseInt(postgresPort) || 5432,
        database: postgresDatabase,
        user: postgresUser,
        password: postgresPassword,
        schema: postgresSchema || 'public',
        schemaDev: postgresSchemaDev || 'ODP'
      };
      
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      
      // Force re-initialization of the Postgres client
      await initializePrisma(true);
    }

    return NextResponse.json({ 
      ...settings, 
      postgresHost, 
      postgresPort, 
      postgresDatabase, 
      postgresUser, 
      postgresPassword, 
      postgresSchema, 
      postgresSchemaDev 
    });
  } catch (error: any) {
    console.error('[SETTINGS PATCH ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
