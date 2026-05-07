import { PrismaClient } from './prisma-client';
import { PrismaClient as PrismaLocalClient } from './prisma-local-client';
import path from 'path';

// Use a global variable to prevent multiple instances of Prisma Client during development
const globalForPrisma = global as unknown as { 
  prisma: PrismaClient,
  prismaLocal: PrismaLocalClient,
  isInitialized: boolean
};

console.log('[PRISMA] Module loading...');

// 1. Initialize Local SQLite Client
const sqlitePath = path.join(process.cwd(), 'prisma', 'dev.db').replace(/\\/g, '/');
export const prismaLocal =
  globalForPrisma.prismaLocal ||
  new PrismaLocalClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: `file:${sqlitePath}`,
      },
    },
  });

// 2. Helper to build Postgres URL
async function getPostgresUrl() {
  try {
    const config = await prismaLocal.postgresConfig.findFirst();
    if (!config) return process.env.DATABASE_URL;
    
    const { user, password, host, port, database, schema, schemaDev } = config;
    const settings = await prismaLocal.appSettings.findFirst();
    const currentMode = settings?.dbMode || 'PROD';
    const targetSchema = (currentMode === 'DEV' && schemaDev) ? schemaDev : (schema || 'public');
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?schema=${targetSchema}`;
  } catch (e: any) {
    console.error('[PRISMA] Failed to read PostgresConfig:', e?.message || e);
    return process.env.DATABASE_URL;
  }
}

// 3. Dynamic Postgres Client Logic
let _prisma: PrismaClient | null = globalForPrisma.prisma || null;

const createClient = (url: string) => {
  if (!url) {
    console.error('[PRISMA] Attempted to create client with empty URL');
    return null;
  }
  
  // Debug log (sanitized)
  const sanitizedUrl = url.replace(/:([^:@]+)@/, ':****@');
  console.log(`[PRISMA] Attempting to create new client with URL: ${sanitizedUrl}`);
  
  try {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: url,
        },
      },
    });
    console.log('[PRISMA] Client created successfully');
    return client;
  } catch (err: any) {
    console.error('[PRISMA] CRITICAL ERROR during PrismaClient constructor:', err.message);
    if (err.stack) console.error(err.stack);
    return null;
  }
};

export const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    // Always use the latest client from global state
    const activeClient = globalForPrisma.prisma || _prisma;

    if (!activeClient) {
      const fallbackUrl = process.env.DATABASE_URL;
      if (fallbackUrl && fallbackUrl !== '""' && fallbackUrl !== "''") {
        _prisma = createClient(fallbackUrl);
        if (_prisma) (globalForPrisma as any).prisma = _prisma;
      }
    }
    
    const clientToUse = globalForPrisma.prisma || _prisma;
    if (!clientToUse) {
      throw new Error('[PRISMA] Le client Postgres n\'est pas encore initialisé. Veuillez patienter ou vérifier la configuration.');
    }
    
    return (clientToUse as any)[prop];
  }
});

export async function initializePrisma(force = false) {
  if (!force && globalForPrisma.isInitialized && _prisma) return _prisma;
  
  console.log(`[PRISMA] Initializing client (force=${force})...`);
  const url = await getPostgresUrl();
  if (url) {
    console.log(`[PRISMA] Creating client with URL: ${url.replace(/:[^:@]+@/, ':****@')}`);
    const oldClient = _prisma;
    const newClient = createClient(url);
    
    if (newClient) {
      _prisma = newClient;
      (globalForPrisma as any).prisma = _prisma;
      globalForPrisma.isInitialized = true;
      console.log('[PRISMA] Client initialized successfully');

      // Disconnect old client in background to free resources
      if (oldClient) {
        console.log('[PRISMA] Disconnecting old client...');
        oldClient.$disconnect().catch(err => console.warn('[PRISMA] Error disconnecting old client:', err.message));
      }
    } else {
      console.error('[PRISMA] Failed to create new client');
    }
  } else {
    console.warn('[PRISMA] No connection URL available for initialization');
  }
  return _prisma;
}

console.log('[PRISMA] Module loaded.');
initializePrisma().catch(err => console.error('[PRISMA] Top-level initialization failed:', err.message));

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaLocal = prismaLocal;
  globalForPrisma.isInitialized = globalForPrisma.isInitialized || false;
}
