export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 max-w-md mx-auto relative">
      {children}
    </div>
  );
}
