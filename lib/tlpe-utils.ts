import { prisma } from './prisma';

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function calculateMonthlyProrata(startDate: Date, endDate: Date): number {
  // Déterminer le premier jour complet (1er du mois suivant si on ne commence pas le 1er)
  let fullStartDate = new Date(startDate);
  if (fullStartDate.getDate() !== 1) {
    fullStartDate = new Date(fullStartDate.getFullYear(), fullStartDate.getMonth() + 1, 1);
  }

  // Déterminer le dernier jour complet (dernier du mois si on finit le dernier jour)
  let fullEndDate = new Date(endDate);
  if (fullEndDate.getDate() !== getDaysInMonth(fullEndDate)) {
    fullEndDate = new Date(fullEndDate.getFullYear(), fullEndDate.getMonth(), 0); // Dernier jour du mois précédent
  }

  // Si le dernier jour complet est avant le premier jour complet, pas de facturation
  if (fullEndDate < fullStartDate) return 0;

  // Compter les mois (inclusive du mois de fin)
  const months = (fullEndDate.getFullYear() - fullStartDate.getFullYear()) * 12
                 + (fullEndDate.getMonth() - fullStartDate.getMonth()) + 1;

  return months / 12;
}

/**
 * Recalcule le montant total d'une occupation en tenant compte des règles spécifiques du TLPE
 * (Prorata temporis et Exonération globale pour les Enseignes).
 * Met à jour le champ montantCalcule en base de données.
 */
export async function updateOccupationTotal(occupationId: number) {
  try {
    // 1. Récupérer l'occupation avec ses lignes et articles
    const occupation = await (prisma as any).occupation.findUnique({
      where: { id: occupationId },
      include: {
        lignes: {
          include: { 
            article: { include: { modeTaxation: true } } 
          }
        }
      }
    });

    if (!occupation) return 0;

    // Pour les dossiers RODP classiques, le calcul reste simple (somme des lignes)
    if (occupation.type !== 'TLPE') {
      let total = occupation.lignes.reduce((sum: number, l: any) => sum + (l.montant || 0), 0);
      
      // Abattement Court Métrage 50%
      if (occupation.type === 'TOURNAGE' && occupation.isCourtMetrage) {
        total = total * 0.5;
      }

      await (prisma as any).occupation.update({
        where: { id: occupationId },
        data: { montantCalcule: total }
      });
      return total;
    }

    // 2. Logique spécifique TLPE
    const anneeTaxation = occupation.anneeTaxation || (occupation.dateDebut ? new Date(occupation.dateDebut).getFullYear() : new Date().getFullYear());
    
    // Récupérer le seuil d'exonération pour l'année (via queryRaw car le modèle TlpeConfig peut être instable dans le client)
    let threshold = 12; // Valeur par défaut légale
    try {
      const config = await (prisma as any).tlpeConfig.findFirst({
        where: { annee: anneeTaxation },
        select: { exoneration: true }
      });
      if (config) {
        threshold = config.exoneration;
      }
    } catch (e: any) {
      console.error('Erreur récupération TlpeConfig:', e?.message || e);
    }

    // Calculer la surface totale des ENSEIGNES pour l'exonération globale
    const totalEnseigneSurface = occupation.lignes.reduce((sum: number, l: any) => {
      let tlpeType = '';
      try { tlpeType = JSON.parse(l.article?.notes || '{}').tlpeType; } catch(e){}
      if (tlpeType === 'ENSEIGNE') return sum + (l.quantite1 || 0);
      return sum;
    }, 0);

    const isEnseigneExempt = totalEnseigneSurface <= threshold;

    // Calcul du montant total Net
    const netTotal = occupation.lignes.reduce((sum: number, l: any) => {
      let tlpeType = '';
      try { tlpeType = JSON.parse(l.article?.notes || '{}').tlpeType; } catch(e){}

      const d1 = new Date(l.dateDebut || `${anneeTaxation}-01-01`);
      const d2 = new Date(l.dateFin || `${anneeTaxation}-12-31`);
      const prorata = calculateMonthlyProrata(d1, d2);

      // Si c'est une enseigne et qu'on est sous le seuil -> 0€
      if (tlpeType === 'ENSEIGNE' && isEnseigneExempt) return sum;

      // Sinon : Tarif * Surface * Prorata (basé sur les mois pleins)
      return sum + ((l.montant || 0) * (l.quantite1 || 0) * prorata);
    }, 0);

    // 3. Mise à jour de la base de données
    await (prisma as any).occupation.update({
      where: { id: occupationId },
      data: { montantCalcule: netTotal }
    });

    return netTotal;
  } catch (error: any) {
    console.error(`Erreur updateOccupationTotal for ID ${occupationId}:`, error?.message || error);
    return 0;
  }
}

export function calculateQ2(u2: string, start: Date | null, end: Date | null, startC: Date | null, endC: Date | null) {
  const s = startC || start;
  const e = endC || end;
  if (!s || !e || isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 1;

  const diffMs = e.getTime() - s.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;

  const unit = (u2 || '').toLowerCase();
  
  if (unit.includes('an')) return 1;
  if (unit.includes('10 jour')) return Math.ceil(diffDays / 10);
  if (unit.includes('mois')) return Math.ceil(diffDays / 30);
  if (unit.includes('jour') || unit.includes('nuit')) return diffDays;
  
  return 1;
}
