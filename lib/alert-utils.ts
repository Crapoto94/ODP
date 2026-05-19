export type AlertStatus = 'overdue' | 'upcoming' | 'none';

export interface AlertConfig {
  status: AlertStatus;
  label: string;
  bgClass: string;
  textClass: string;
  daysUntil?: number;
}

export function getAlertStatus(dateAlerte?: string | null, today = new Date()): AlertStatus {
  if (!dateAlerte) return 'none';

  const alertDate = new Date(dateAlerte);
  const todayDate = new Date(today);

  // Normalize dates to compare only date part (ignore time)
  todayDate.setHours(0, 0, 0, 0);
  alertDate.setHours(0, 0, 0, 0);

  if (alertDate < todayDate) {
    return 'overdue';
  }

  // Check if within 30 days
  const thirtyDaysFromNow = new Date(todayDate);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (alertDate <= thirtyDaysFromNow) {
    return 'upcoming';
  }

  return 'none';
}

export function getDaysUntilAlert(dateAlerte?: string | null, today = new Date()): number | null {
  if (!dateAlerte) return null;

  const alertDate = new Date(dateAlerte);
  const todayDate = new Date(today);

  todayDate.setHours(0, 0, 0, 0);
  alertDate.setHours(0, 0, 0, 0);

  const diffTime = alertDate.getTime() - todayDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

export function getAlertConfig(dateAlerte?: string | null, today = new Date()): AlertConfig {
  const status = getAlertStatus(dateAlerte, today);
  const daysUntil = getDaysUntilAlert(dateAlerte, today);

  switch (status) {
    case 'overdue':
      return {
        status: 'overdue',
        label: 'Alerte dépassée',
        bgClass: 'bg-rose-50',
        textClass: 'text-rose-600',
      };
    case 'upcoming':
      const days = daysUntil ?? 0;
      return {
        status: 'upcoming',
        label: days === 0 ? 'Alerte aujourd\'hui' : `Alerte dans ${days} jour${days > 1 ? 's' : ''}`,
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-600',
        daysUntil: days,
      };
    default:
      return {
        status: 'none',
        label: '',
        bgClass: '',
        textClass: '',
      };
  }
}

export function isAlertActive(dateAlerte?: string | null, today = new Date()): boolean {
  const status = getAlertStatus(dateAlerte, today);
  return status === 'overdue' || status === 'upcoming';
}
