import { differenceInDays, differenceInMonths, addMonths, isBefore, startOfDay } from 'date-fns';

export type OccupationType = 'COMMERCE' | 'CHANTIER' | 'TOURNAGE';
export type ZoneType = 'CENTRE' | 'PERIPHERIE';

export interface CalculationParams {
  type: OccupationType;
  surface: number;
  dateDebut: Date;
  dateFin: Date;
  zone?: ZoneType;
  isPME?: boolean;
}

export function calculateRedevance(params: CalculationParams): number {
  const { type, surface, dateDebut, dateFin, zone = 'PERIPHERIE', isPME = false } = params;
  
  const start = startOfDay(dateDebut);
  const end = startOfDay(dateFin);
  
  if (isBefore(end, start)) return 0;

  const days = differenceInDays(end, start) + 1; // Inclusive

  switch (type) {
    case 'COMMERCE':
      // RODP Commerce: daily rate per zone
      const rate = zone === 'CENTRE' ? 5 : 2;
      let total = days * surface * rate;
      // TLPE addition? "TLPE : base surface x tarif délibéré (ex: 10-50€/m²/an)"
      // TLPE is usually annual. If date range is part of year, we might prorate or just apply annual.
      // For this simple version, let's assume if it's a fixed commerce (terrace), TLPE applies.
      return total;

    case 'CHANTIER':
      // RODP Chantier: "indivisible/mois pour chantiers"
      // center 5/m2/day -> ~150/m2/month? center 5 is high.
      // Let's use a monthly rate or round days to blocks of 30.
      const months = Math.ceil(days / 30);
      const mRate = zone === 'CENTRE' ? 150 : 60; // 30 * rate
      return months * surface * mRate;

    case 'TOURNAGE':
      // Fixed for now or daily premium
      return days * surface * 10;

    default:
      return 0;
  }
}

export function calculateTLPE(surface: number, ratePerYear: number, isPME: boolean = false): number {
  let total = surface * ratePerYear;
  if (isPME) {
    total = total * 0.5; // 50% abattement
  }
  return total;
}
