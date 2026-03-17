import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

export async function GET() {
  try {
    const totalRevenue = await prisma.occupation.aggregate({
      where: { statut: 'VALIDE' },
      _sum: { montantCalcule: true }
    });

    const potentialRevenue = await prisma.occupation.aggregate({
      where: { statut: { in: ['VALIDE', 'EN_ATTENTE'] } },
      _sum: { montantCalcule: true }
    });

    const tiersCount = await prisma.tiers.count();
    const activeDossiers = await prisma.occupation.count({
      where: { statut: 'VALIDE', dateFin: { gte: new Date() } }
    });
    const pendingDossiers = await prisma.occupation.count({
      where: { statut: 'EN_ATTENTE' }
    });

    // Monthly revenue for the last 6 months (including pending for better visualization of activity)
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(monthStart);
      
      const revenue = await prisma.occupation.aggregate({
        where: {
          statut: { in: ['VALIDE', 'EN_ATTENTE'] },
          created_at: { gte: monthStart, lte: monthEnd }
        },
        _sum: { montantCalcule: true }
      });

      monthlyStats.push({
        month: format(monthStart, 'MMM', { locale: fr }),
        redevance: revenue._sum.montantCalcule || 0
      });
    }

    return NextResponse.json({
      totalRevenue: totalRevenue._sum.montantCalcule || 0,
      potentialRevenue: potentialRevenue._sum.montantCalcule || 0,
      tiersCount,
      activeDossiers,
      pendingDossiers,
      monthlyStats
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
