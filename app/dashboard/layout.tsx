import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <main className="flex-1 transition-all duration-500 p-10 ml-72 [.sidebar-collapsed_&]:ml-24">
        {children}
      </main>
    </div>
  );
}
