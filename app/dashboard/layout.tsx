import Sidebar from '@/components/Sidebar';
import ShellV2 from '@/components/v2/ShellV2';
import { getUiMode } from '@/lib/ui-mode';
import ReglesProvider from '@/components/ReglesProvider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Interface v2 (maquette Stitch) activable par chaque utilisateur ; sinon interface historique inchangée.
  if ((await getUiMode()) === 'v2') {
    return <ShellV2><ReglesProvider />{children}</ShellV2>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <ReglesProvider />
      <main className="flex-1 transition-all duration-500 p-10 ml-72 [.sidebar-collapsed_&]:ml-24">
        {children}
      </main>
    </div>
  );
}
