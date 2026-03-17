"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Map as MapIcon, 
  Settings, 
  LogOut,
  Euro,
  ClipboardCheck,
  LayoutTemplate
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Tableau de bord', href: '/dashboard' },
  { icon: FileText, label: 'Dossiers RODP', href: '/dashboard/occupations' },
  { icon: Users, label: 'Gestion des Tiers', href: '/dashboard/tiers' },
  { icon: Euro, label: 'Tarifs & Articles', href: '/dashboard/tarifs' },
  { icon: LayoutTemplate, label: 'Gabarit Facture', href: '/dashboard/gabarit' },
  { icon: MapIcon, label: 'Carte SIG', href: '/dashboard/carte' },
  { icon: Settings, label: 'Paramètres', href: '/dashboard/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isVerifyPage = pathname?.includes('/dashboard/tiers/verify/');
  
  const blurClasses = isVerifyPage ? 'filter blur-[4px] pointer-events-none opacity-50 select-none' : '';

  return (
    <aside className={`w-72 bg-slate-900 h-screen fixed left-0 top-0 text-white flex flex-col z-50 shadow-2xl transition-all duration-700 ${blurClasses}`}>
      <div className="p-8 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl italic shadow-lg shadow-blue-500/30">
            D
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter">OPD Manager</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ville dIvry-sur-Seine</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group font-bold text-sm ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-800 space-y-4">
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold border border-blue-500/30">
            AG
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold truncate">Jean Agent</p>
            <span className="text-[10px] font-black text-slate-500 uppercase">Agent Domain Public</span>
          </div>
        </div>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all font-bold text-sm">
          <LogOut size={18} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
