import { NextResponse } from 'next/server';
import { prismaLocal, initializePrisma } from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await prismaLocal.appSettings.findFirst();
    if (!settings) {
      settings = await prismaLocal.appSettings.create({
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

    let postgresConfig = await prismaLocal.postgresConfig.findFirst();
    if (!postgresConfig) {
      postgresConfig = await prismaLocal.postgresConfig.create({
        data: {
          id: 1,
          host: 'localhost',
          port: 5432,
          database: 'odp',
          user: 'postgres',
          password: '',
          schema: 'public',
          schemaDev: 'ODP'
        }
      });
    }

    // Combine for the frontend
    return NextResponse.json({
      ...settings,
      postgresHost: postgresConfig.host,
      postgresPort: postgresConfig.port,
      postgresDatabase: postgresConfig.database,
      postgresUser: postgresConfig.user,
      postgresPassword: postgresConfig.password,
      postgresSchema: postgresConfig.schema,
      postgresSchemaDev: postgresConfig.schemaDev,
    });
  } catch (error: any) {
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

    const booleanFields = ['filienRejetDispo', 'filienRejetCA', 'filienRejetMarche'];
    booleanFields.forEach(field => {
      if (typeof appSettingsData[field] === 'number') {
        appSettingsData[field] = appSettingsData[field] === 1;
      }
    });

    if (appSettingsData.filienExercice) {
      appSettingsData.filienExercice = parseInt(appSettingsData.filienExercice.toString()) || new Date().getFullYear();
    }

    const settings = await prismaLocal.appSettings.upsert({
      where: { id: 1 },
      update: { ...appSettingsData, updated_at: new Date() },
      create: { ...appSettingsData, id: 1 }
    });

    if (postgresHost !== undefined) {
      await prismaLocal.postgresConfig.upsert({
        where: { id: 1 },
        update: {
          host: postgresHost,
          port: parseInt(postgresPort) || 5432,
          database: postgresDatabase,
          user: postgresUser,
          password: postgresPassword,
          schema: postgresSchema || 'public',
          schemaDev: postgresSchemaDev || 'ODP'
        },
        create: {
          id: 1,
          host: postgresHost,
          port: parseInt(postgresPort) || 5432,
          database: postgresDatabase,
          user: postgresUser,
          password: postgresPassword,
          schema: postgresSchema || 'public',
          schemaDev: postgresSchemaDev || 'ODP'
        }
      });
      
      // Force re-initialization of the Postgres client
      await initializePrisma(true);
    }

    return NextResponse.json({ ...settings, postgresHost, postgresPort, postgresDatabase, postgresUser, postgresPassword, postgresSchema, postgresSchemaDev });
  } catch (error: any) {
    console.error('[SETTINGS PATCH ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
