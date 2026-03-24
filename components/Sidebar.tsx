"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';
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
  { icon: FileText, label: 'Dossiers', href: '/dashboard/occupations' },
  { icon: Users, label: 'Gestion des Tiers', href: '/dashboard/tiers' },
  { icon: Euro, label: 'Tarifs & Articles', href: '/dashboard/tarifs' },
  { icon: LayoutTemplate, label: 'Gabarit Facture', href: '/dashboard/gabarit' },
  { icon: ClipboardCheck, label: 'Facturation', href: '/dashboard/facturation' },
  { icon: MapIcon, label: 'Carte SIG', href: '/dashboard/carte' },
  { icon: Settings, label: 'Paramètres', href: '/dashboard/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    axios.get('/api/auth/me').then(res => setUser(res.data)).catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      router.push('/login');
      router.refresh();
    } catch (err) {}
  };

  const isVerifyPage = pathname?.includes('/dashboard/tiers/verify/');
  
  const blurClasses = isVerifyPage ? 'filter blur-[4px] pointer-events-none opacity-50 select-none' : '';

  return (
    <aside className={`w-72 bg-slate-900 h-screen fixed left-0 top-0 text-white flex flex-col z-50 shadow-2xl transition-all duration-700 ${blurClasses}`}>
      <div className="p-8 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center shadow-lg">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white">Domaine Public</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gestion du Domaine Public</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          if (item.label === 'Paramètres' && user?.role !== 'ADMIN') return null;
          if (item.label === 'Facturation' && user?.role !== 'ADMIN' && user?.role !== 'AGENT_COMPTABLE') return null;

          return (
            <React.Fragment key={item.href}>
              <Link 
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
              {item.label === 'Dossiers' && (
                <div className="ml-12 border-l-2 border-slate-800 pl-4 py-1 space-y-1">
                  <div className="flex items-center gap-3 px-2 py-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest italic cursor-default">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    <span>TLPE <span className="text-[8px] opacity-50">(module à venir)</span></span>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-800 space-y-4">
        {user ? (
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold border border-blue-500/30">
              {user.prenom[0]}{user.nom[0]}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{user.prenom} {user.nom}</p>
              <span className="text-[10px] font-black text-slate-500 uppercase">{user.role.replace('AGENT_', '')}</span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 animate-pulse h-16"></div>
        )}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all font-bold text-sm"
        >
          <LogOut size={18} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
