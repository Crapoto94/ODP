import { PrismaClient } from './prisma-client';
import { getLocalConfig } from './prisma';

// Client that always targets the ODP (prod) schema, regardless of current mode.
// Used for shared data: backlog, releases — consistent across dev and prod.

const globalForShared = global as unknown as { prismaShared: PrismaClient };

function createSharedClient(): PrismaClient {
  const config = getLocalConfig();
  if (!config?.postgres) throw new Error('[PRISMA SHARED] No postgres config found');

  const { user, password, host, port, database, schema } = config.postgres;
  const url = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?schema=${schema || 'ODP'}`;

  return new PrismaClient({
    log: ['error'],
    datasources: { db: { url } }
  });
}

export const prismaShared: PrismaClient =
  globalForShared.prismaShared ?? (globalForShared.prismaShared = createSharedClient());
