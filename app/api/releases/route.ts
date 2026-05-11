import { NextResponse } from 'next/server';
import { prismaShared } from '@/lib/prisma-shared';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const releases = await prismaShared.versionRelease.findMany({
      include: { backlogItems: true },
      orderBy: { releasedAt: 'desc' }
    });
    return NextResponse.json(releases);
  } catch (error) {
    console.error('[GET /api/releases]', error);
    return NextResponse.json({ error: 'Failed to fetch releases' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { versionNumber, notes, backlogItemIds } = body;

    // 1. Transaction to create release and update items
    const release = await prismaShared.$transaction(async (tx) => {
      const newRelease = await tx.versionRelease.create({
        data: {
          versionNumber,
          notes,
          backlogItems: {
            connect: backlogItemIds.map((id: number) => ({ id }))
          }
        }
      });

      // Update their status to DONE if not already
      await tx.backlogItem.updateMany({
        where: { id: { in: backlogItemIds } },
        data: { status: 'DONE' }
      });

      return newRelease;
    });

    // 2. Update package.json version
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      packageJson.version = versionNumber;
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2), 'utf-8');
    } catch (fsError) {
      console.warn('Could not update package.json version automatically:', fsError);
    }

    return NextResponse.json(release);
  } catch (error) {
    console.error('[POST /api/releases]', error);
    return NextResponse.json({ error: 'Failed to create release' }, { status: 500 });
  }
}
