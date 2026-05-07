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
  } catch (e) {
    console.error('[PRISMA] Failed to read PostgresConfig:', e.message);
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
    if (!_prisma) {
      const fallbackUrl = process.env.DATABASE_URL;
      if (fallbackUrl && fallbackUrl !== '""' && fallbackUrl !== "''") {
        _prisma = createClient(fallbackUrl);
        if (_prisma) globalForPrisma.prisma = _prisma;
      }
    }
    
    if (!_prisma) {
      // If we reach here, we'll try to initialize synchronously if it's the first time
      // But we can't await here. So we just throw a better error.
      throw new Error('[PRISMA] Le client Postgres n\'est pas encore initialisé. Veuillez patienter ou vérifier la configuration.');
    }
    
    return (_prisma as any)[prop];
  }
});

export async function initializePrisma(force = false) {
  if (!force && globalForPrisma.isInitialized && _prisma) return _prisma;
  
  const url = await getPostgresUrl();
  if (url) {
    const oldClient = _prisma;
    const newClient = createClient(url);
    
    _prisma = newClient;
    globalForPrisma.prisma = _prisma;
    globalForPrisma.isInitialized = true;

    // Disconnect old client in background to free resources
    if (oldClient) {
      oldClient.$disconnect().catch(err => console.warn('[PRISMA] Error disconnecting old client:', err.message));
    }
  }
  return _prisma;
}

console.log('[PRISMA] Module loaded.');
initializePrisma().catch(err => console.error('[PRISMA] Top-level initialization failed:', err.message));

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaLocal = prismaLocal;
  globalForPrisma.isInitialized = globalForPrisma.isInitialized || false;
}
