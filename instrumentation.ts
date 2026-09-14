export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startRepoMonitor } = await import('./lib/billing/repo-monitor');
    startRepoMonitor();
  }
}