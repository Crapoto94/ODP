export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startRepoMonitor } = await import('./lib/billing/repo-monitor');
    startRepoMonitor();
    // Mail quotidien d'alerte aux instructeurs (dossiers chantier / tournage dont la date d'alerte est atteinte)
    const { startAlertMonitor } = await import('./lib/alert-monitor');
    startAlertMonitor();
  }
}
