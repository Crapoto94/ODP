import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

// Default empty stats
const defaultStats = {
  totalRevenue: 0,
  potentialRevenue: 0,
  tiersCount: 0,
  activeDossiers: 0,
  pendingDossiers: 0,
  monthlyStats: [],
  recentDossiers: [],
  typeStats: []
};

export async function GET() {
  try {
    console.log('[STATS] Starting stats calculation...');

    // Try to get basic stats
    let totalRevenue = 0;
    let potentialRevenue = 0;
    let tiersCount = 0;
    let activeDossiers = 0;
    let pendingDossiers = 0;
    let recentDossiers: any[] = [];
    let typeStats: any[] = [];
    let monthlyStats: any[] = [];

    // Step 1: Count tiers
    try {
      console.log('[STATS] Step 1: Counting tiers...');
      tiersCount = await prisma.tiers.count();
      console.log('[STATS] Tiers count:', tiersCount);
    } catch (e) {
      console.error('[STATS] Error counting tiers:', e);
    }

    // Step 2: Count active and pending dossiers
    try {
      console.log('[STATS] Step 2: Counting dossiers...');
      activeDossiers = await (prisma as any).occupation.count({
        where: { statut: { in: ['EN_COURS', 'VERIFIE', 'FACTURE'] } }
      });
      pendingDossiers = await (prisma as any).occupation.count({
        where: { statut: 'EN_ATTENTE' }
      });
      console.log('[STATS] Active:', activeDossiers, 'Pending:', pendingDossiers);
    } catch (e) {
      console.error('[STATS] Error counting dossiers:', e);
    }

    // Step 3: Get recent dossiers (simple query)
    try {
      console.log('[STATS] Step 3: Getting recent dossiers...');
      recentDossiers = await (prisma as any).occupation.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          nom: true,
          statut: true,
          created_at: true,
          tiers: { select: { nom: true } }
        }
      });
      console.log('[STATS] Recent dossiers:', recentDossiers.length);
    } catch (e) {
      console.error('[STATS] Error getting recent dossiers:', e);
      recentDossiers = [];
    }

    // Step 4: Get revenue stats (try different approach)
    try {
      console.log('[STATS] Step 4: Calculating revenue...');
      // Get all paid occupations
      const paidOccupations = await (prisma as any).occupation.findMany({
        where: { statut: { in: ['VERIFIE', 'FACTURE', 'PAYE'] } },
        select: { montantCalcule: true, type: true }
      });

      totalRevenue = paidOccupations.reduce((sum: number, o: any) => sum + (o.montantCalcule || 0), 0);
      console.log('[STATS] Total revenue:', totalRevenue);

      // Get all occupations for potential
      const allOccupations = await (prisma as any).occupation.findMany({
        select: { montantCalcule: true, type: true }
      });
      potentialRevenue = allOccupations.reduce((sum: number, o: any) => sum + (o.montantCalcule || 0), 0);

      // Calculate type stats
      const typeMap = new Map();
      paidOccupations.forEach((o: any) => {
        const type = o.type === 'COMMERCE' ? 'Commerce' : (o.type === 'CHANTIER' ? 'Chantier' : 'Autre');
        const current = typeMap.get(type) || 0;
        typeMap.set(type, current + (o.montantCalcule || 0));
      });

      typeStats = Array.from(typeMap.entries()).map(([label, value]) => ({
        label,
        value,
        percentage: totalRevenue > 0 ? Math.round((value / totalRevenue) * 100) : 0
      }));

      console.log('[STATS] Type stats:', typeStats);
    } catch (e) {
      console.error('[STATS] Error calculating revenue:', e);
    }

    // Step 5: Get monthly stats
    try {
      console.log('[STATS] Step 5: Calculating monthly stats...');
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(monthStart);

        const monthOccupations = await (prisma as any).occupation.findMany({
          where: {
            statut: { in: ['VERIFIE', 'FACTURE', 'PAYE'] },
            created_at: { gte: monthStart, lte: monthEnd }
          },
          select: { montantCalcule: true }
        });

        const monthRevenue = monthOccupations.reduce((sum: number, o: any) => sum + (o.montantCalcule || 0), 0);

        monthlyStats.push({
          month: format(monthStart, 'MMM', { locale: fr }),
          redevance: monthRevenue
        });
      }
      console.log('[STATS] Monthly stats calculated');
    } catch (e) {
      console.error('[STATS] Error calculating monthly stats:', e);
    }

    console.log('[STATS] Stats calculation complete. Total revenue:', totalRevenue);

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
    console.error('[STATS] Unexpected error:', error);
    console.error('[STATS] Error message:', error.message);
    console.error('[STATS] Error stack:', error.stack);

    // Return default stats even on error to prevent crashes
    return NextResponse.json(defaultStats);
  }
}
