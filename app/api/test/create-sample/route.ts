import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('[Sample Data] Creating test occupation...');

    // First, ensure a test tiers exists
    let testTiers = await prisma.tiers.findFirst({
      where: { nom: 'Test Tiers' }
    });

    if (!testTiers) {
      console.log('[Sample Data] Creating test tiers...');
      testTiers = await prisma.tiers.create({
        data: {
          nom: 'Test Tiers',
          email: 'test@example.com',
          adresse: '123 Rue de Test, 94200 Ivry-sur-Seine',
          statut: 'ACTIF'
        }
      });
      console.log('[Sample Data] Created tiers:', testTiers.id);
    }

    // Create test occupation
    const testOcc = await (prisma as any).occupation.create({
      data: {
        nom: 'Dossier de Test',
        tiersId: testTiers.id,
        type: 'CHANTIER',
        statut: 'EN_ATTENTE',
        adresse: '123 Rue de Test, 94200 Ivry-sur-Seine',
        dateDebut: new Date('2026-04-01'),
        dateFin: new Date('2026-05-01'),
        montantCalcule: 500,
        description: 'Ceci est un dossier de test créé automatiquement'
      }
    });

    console.log('[Sample Data] Created occupation:', testOcc.id);

    return NextResponse.json({
      success: true,
      message: 'Sample occupation created',
      occupation: testOcc,
      tiers: testTiers
    });
  } catch (error: any) {
    console.error('[Sample Data] Error:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
