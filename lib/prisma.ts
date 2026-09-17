import { PrismaClient } from './prisma-client';

// Use global variables to prevent multiple instances of Prisma Client during development
const globalForPrisma = global as unknown as {
  prismaProd?: PrismaClient;
  prismaDev?: PrismaClient;
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

function buildUrl(schema: string): string {
  const config = getLocalConfig();
  if (!config?.postgres) return process.env.DATABASE_URL || '';
  const { user, password, host, port, database } = config.postgres;
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?schema=${schema}`;
}

function createClient(url: string): PrismaClient | null {
  if (!url) {
    console.error('[PRISMA] Attempted to create client with empty URL');
    return null;
  }

  const sanitizedUrl = url.replace(/:([^:@]+)@/, ':****@');
  console.log(`[PRISMA] Attempting to create new client with URL: ${sanitizedUrl}`);

  try {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      datasources: { db: { url } },
    });
    console.log('[PRISMA] Client created successfully');
    return client;
  } catch (err: any) {
    console.error('[PRISMA] CRITICAL ERROR during PrismaClient constructor:', err.message);
    if (err.stack) console.error(err.stack);
    return null;
  }
}

// 2. Two persistent clients, one per schema. Which one a given request uses is
// decided per-call by resolveClientForCurrentRequest() based on the CURRENT
// USER's session (devMode flag) -- never a global, app-wide setting. This is
// what keeps a DEV toggle scoped to the admin who flipped it, instead of
// silently redirecting every user's traffic to ODP_DEV.
function getProdClient(): PrismaClient {
  if (!globalForPrisma.prismaProd) {
    const config = getLocalConfig();
    const schema = config?.postgres?.schema || 'ODP';
    const client = createClient(buildUrl(schema));
    if (client) globalForPrisma.prismaProd = client;
  }
  return globalForPrisma.prismaProd as PrismaClient;
}

function getDevClient(): PrismaClient {
  if (!globalForPrisma.prismaDev) {
    const config = getLocalConfig();
    const schema = config?.postgres?.schemaDev || 'ODP_DEV';
    const client = createClient(buildUrl(schema));
    if (client) globalForPrisma.prismaDev = client;
  }
  return globalForPrisma.prismaDev as PrismaClient;
}

export async function initializePrisma(force = false) {
  if (force) {
    const old = [globalForPrisma.prismaProd, globalForPrisma.prismaDev];
    globalForPrisma.prismaProd = undefined;
    globalForPrisma.prismaDev = undefined;
    for (const client of old) {
      if (client) client.$disconnect().catch((err) => console.warn('[PRISMA] Error disconnecting old client:', err.message));
    }
  }
  // Warm up the prod client eagerly; the dev client is created lazily on first use.
  return getProdClient();
}

// 3. Per-request client resolution: an admin's own DEV toggle (stored on
// their session cookie by app/api/settings/db-mode/route.ts) only affects
// requests carrying that session. Anyone else -- and anything without a
// request context at all (scripts, build steps) -- always gets PROD.
async function resolveClientForCurrentRequest(): Promise<PrismaClient> {
  try {
    const { getSession } = await import('./auth');
    const session = await getSession();
    if (session && session.devMode === true && session.role === 'ADMINISTRATEUR') {
      return getDevClient();
    }
  } catch (e) {
    // No request context available (script, build step, etc.) -> PROD.
  }
  return getProdClient();
}

function wrapModel(modelName: string) {
  return new Proxy(
    {},
    {
      get(_target, methodName: string) {
        return async (...args: any[]) => {
          const client = await resolveClientForCurrentRequest();
          const model = (client as any)[modelName];
          if (!model) throw new Error(`[PRISMA] Modele inconnu: ${modelName}`);
          const fn = model[methodName];
          if (typeof fn !== 'function') throw new Error(`[PRISMA] Methode inconnue: ${modelName}.${String(methodName)}`);
          return fn.apply(model, args);
        };
      },
    }
  );
}

const modelProxyCache = new Map<string, any>();

export const prisma = new Proxy({} as PrismaClient, {
  get: (_target, prop) => {
    if (typeof prop !== 'string') return undefined;

    // $-prefixed utility methods ($transaction, $queryRaw, $disconnect, ...)
    // are forwarded to whichever client the current request resolves to.
    if (prop.startsWith('$')) {
      return (...args: any[]) => resolveClientForCurrentRequest().then((client) => (client as any)[prop](...args));
    }

    if (!modelProxyCache.has(prop)) modelProxyCache.set(prop, wrapModel(prop));
    return modelProxyCache.get(prop);
  },
});

console.log('[PRISMA] Module loaded.');
initializePrisma().catch((err) => console.error('[PRISMA] Top-level initialization failed:', err.message));
