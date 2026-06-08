import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { hasPermissionServer, loadPermissions, savePermissions } from '@/lib/permissions-server';
import { ROLES, PERMISSIONS } from '@/lib/permissions';

export async function GET() {
  const session = await getSession();
  if (!session || !hasPermissionServer(session.role, 'MANAGE_USERS')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  return NextResponse.json({ permissions: loadPermissions(), roles: ROLES, allPermissions: PERMISSIONS });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermissionServer(session.role, 'MANAGE_USERS')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  const body = await req.json();
  if (!body.permissions || typeof body.permissions !== 'object') {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
  }
  savePermissions(body.permissions);
  return NextResponse.json({ success: true });
}
