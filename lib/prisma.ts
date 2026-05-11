import { PrismaClient } from './prisma-client';

// Use a global variable to prevent multiple instances of Prisma Client during development
const globalForPrisma = global as unknown as { 
  prisma: PrismaClient,
  isInitialized: boolean
};

console.log('[PRISMA] Module loading...');

// 1. Load config from local file (Server-side only)
export function getLocalConfig() {
  if (typeof window !== 'undefined') return null; // Browser safety

  try {
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(process.cwd(), 'config', 'settings.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    console.error('[PRISMA] Error reading config/settings.json:', e);
  }
  return null;
}

// 2. Helper to build Postgres URL
async function getPostgresUrl() {
  if (typeof window !== 'undefined') return process.env.DATABASE_URL;

  try {
    const config = getLocalConfig();
    if (!config || !config.postgres) {
      console.warn('[PRISMA] No postgres config found in settings.json, falling back to ENV');
      return process.env.DATABASE_URL;
    }
    
    const { user, password, host, port, database, schema, schemaDev } = config.postgres;
    
    // We'll read the mode from the settings.json file for schema switching
    const currentMode = config.postgres.mode || 'PROD';
    
    const targetSchema = (currentMode === 'DEV' && schemaDev) ? schemaDev : (schema || 'public');
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?schema=${targetSchema}`;
  } catch (e: any) {
    console.error('[PRISMA] Failed to build Postgres URL:', e?.message || e);
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
      // Build URL from settings.json (synchronous fallback)
      let fallbackUrl = '';
      try {
        const config = getLocalConfig();
        if (config && config.postgres) {
          const { user, password, host, port, database, schema } = config.postgres;
          const targetSchema = schema || 'ODP';
          fallbackUrl = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?schema=${targetSchema}`;
        }
      } catch (e) {
        console.warn('[PRISMA] Could not read settings.json in proxy fallback');
      }

      // If settings.json didn't work, try env var
      if (!fallbackUrl) {
        fallbackUrl = process.env.DATABASE_URL || '';
      }

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
  globalForPrisma.isInitialized = globalForPrisma.isInitialized || false;
}
