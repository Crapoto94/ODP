import { PrismaClient as PostgresPrismaClient } from './prisma-client';
import { prismaLocal } from './prisma';

let cachedClient: PostgresPrismaClient | null = null;
let lastConfigStr: string = '';

export async function getPostgresClient(): Promise<PostgresPrismaClient> {
  const config = await prismaLocal.postgresConfig.findFirst();

  if (!config) {
    throw new Error('La configuration PostgreSQL n\'est pas définie dans la base de données locale.');
  }

  const { user, password, host, port, database, schema } = config;
  const targetSchema = schema || 'public';
  const url = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?schema=${targetSchema}`;

  // Réutiliser le client mis en cache s'il existe et si la config n'a pas changé
  if (cachedClient && lastConfigStr === url) {
    return cachedClient;
  }

  // Se déconnecter de l'ancien client s'il existait
  if (cachedClient) {
    try {
      await cachedClient.$disconnect();
    } catch(e) {
      console.warn("Erreur lors de la déconnexion de l'ancien client Postgres:", e);
    }
  }

  // Créer un nouveau client
  cachedClient = new PostgresPrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
  });
  lastConfigStr = url;

  return cachedClient;
}
