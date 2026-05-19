export interface AotAlert {
  hasAlert: boolean;
  isExpired: boolean;
  daysUntilExpiry: number | null;
  expiryDate: Date | null;
}

export function checkAotAlert(aotDate: string | Date | null | undefined): AotAlert {
  if (!aotDate) {
    return { hasAlert: false, isExpired: false, daysUntilExpiry: null, expiryDate: null };
  }

  const date = typeof aotDate === 'string' ? new Date(aotDate) : aotDate;
  if (isNaN(date.getTime())) {
    return { hasAlert: false, isExpired: false, daysUntilExpiry: null, expiryDate: null };
  }

  // Calculer la date d'expiration (AOT + 3 ans)
  const expiryDate = new Date(date);
  expiryDate.setFullYear(expiryDate.getFullYear() + 3);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);

  // Calculer les jours jusqu'à l'expiration
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Alerte si:
  // 1. AOT a plus de 3 ans (daysUntilExpiry < 0)
  // 2. AOT aura 3 ans dans les 30 prochains jours (daysUntilExpiry entre 0 et 30)
  const hasAlert = daysUntilExpiry <= 30;
  const isExpired = daysUntilExpiry < 0;

  return {
    hasAlert,
    isExpired,
    daysUntilExpiry: hasAlert ? daysUntilExpiry : null,
    expiryDate: hasAlert ? expiryDate : null,
  };
}

export function getAotAlertMessage(alert: AotAlert): string {
  if (!alert.hasAlert) return '';
  if (alert.isExpired) return `AOT expiré depuis ${Math.abs(alert.daysUntilExpiry || 0)} jours`;
  return `AOT expire dans ${alert.daysUntilExpiry} jour${(alert.daysUntilExpiry || 0) > 1 ? 's' : ''}`;
}
