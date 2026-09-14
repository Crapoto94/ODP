import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { testRepoAccess, getRepoDiskSpace, RepoConfig } from '@/lib/billing/repo-checker';

async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return !!session && session.role === 'ADMINISTRATEUR';
}

async function readSavedConfig(): Promise<RepoConfig> {
  const appSettings = await (prisma as any).appSettings.findFirst({ where: { id: 1 } });
  return {
    path: appSettings?.filienUncPj || '',
    user: appSettings?.filienUncUser || '',
    password: appSettings?.filienUncPass || '',
    domain: appSettings?.filienUncDomain || '',
  };
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  try {
    const config = await readSavedConfig();
    const diskSpace = await getRepoDiskSpace(config);
    return NextResponse.json({
      path: config.path,
      user: config.user,
      domain: config.domain,
      hasPassword: !!(config.password && config.password !== '••••••••'),
      diskSpace: diskSpace ? { ...diskSpace, mode: diskSpace.mode } : null,
    });
  } catch (error: any) {
    console.error('[FILIEN-REPO GET ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const path = String(body?.path || '').trim();
    if (!path) {
      return NextResponse.json({ success: false, mode: 'none', message: 'Saisissez le chemin du dépôt avant de tester.' });
    }
    const config: RepoConfig = {
      path,
      user: String(body?.user || '').trim(),
      password: String(body?.password || ''),
      domain: String(body?.domain || '').trim(),
    };
    const test = await testRepoAccess(config);
    const diskSpace = test.success ? await getRepoDiskSpace(config) : null;
    return NextResponse.json({
      success: test.success,
      mode: test.mode,
      message: test.message,
      diskSpace: diskSpace ? { ...diskSpace, mode: diskSpace.mode } : null,
    });
  } catch (error: any) {
    console.error('[FILIEN-REPO TEST ERROR]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 200 });
  }
}