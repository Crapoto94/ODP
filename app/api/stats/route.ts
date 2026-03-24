import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

export async function GET() {
  try {
    const revenueStats = await prisma.occupation.groupBy({
      by: ['statut'],
      _sum: { montantCalcule: true }
    });

    const totalRevenue = revenueStats
      .filter(s => ['VERIFIE', 'FACTURE', 'PAYE'].includes(s.statut))
      .reduce((sum, s) => sum + (s._sum.montantCalcule || 0), 0);

    const potentialRevenue = revenueStats.reduce((sum, s) => sum + (s._sum.montantCalcule || 0), 0);

    const tiersCount = await prisma.tiers.count();
    const activeDossiers = await prisma.occupation.count({
      where: { statut: { in: ['EN_COURS', 'VERIFIE', 'FACTURE'] } }
    });
    const pendingDossiers = await prisma.occupation.count({
      where: { statut: 'EN_ATTENTE' }
    });

    // Recent Activity
    const recentDossiers = await prisma.occupation.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: { tiers: true }
    });

    // Revenue by Type
    const typeStatsRaw = await prisma.occupation.groupBy({
      by: ['type'],
      where: { statut: { in: ['VERIFIE', 'FACTURE', 'PAYE'] } },
      _sum: { montantCalcule: true }
    });
    const typeStats = typeStatsRaw.map(s => ({
      label: s.type === 'COMMERCE' ? 'Commerce' : (s.type === 'CHANTIER' ? 'Chantier' : 'Autre'),
      value: s._sum.montantCalcule || 0,
      percentage: totalRevenue > 0 ? Math.round(((s._sum.montantCalcule || 0) / totalRevenue) * 100) : 0
    }));

    // Monthly revenue for the last 6 months
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(monthStart);
      
      const revenue = await prisma.occupation.aggregate({
        where: {
          statut: { in: ['VERIFIE', 'FACTURE', 'PAYE'] },
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
      totalRevenue,
      potentialRevenue,
      tiersCount,
      activeDossiers,
      pendingDossiers,
      monthlyStats,
      recentDossiers,
      typeStats
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
