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
  LayoutTemplate,
  CopyPlus,
  ChevronLeft,
  ChevronRight,
  Store,
  ShoppingBag,
  HardHat
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Tableau de bord', href: '/dashboard' },
  { icon: HardHat, label: 'Chantiers et tournages', href: '/dashboard/occupations' },
  { icon: Store, label: 'Commerces', href: '/dashboard/commerces', adminOnly: true },
  { icon: ShoppingBag, label: 'T.L.P.E.', href: '/dashboard/tlpe', adminOnly: true },
  { icon: Users, label: 'Gestion des Tiers', href: '/dashboard/tiers' },
  { icon: Euro, label: 'Tarifs & Articles', href: '/dashboard/tarifs' },
  { icon: LayoutTemplate, label: 'Gabarits', href: '/dashboard/gabarit' },
  { icon: ClipboardCheck, label: 'Facturation', href: '/dashboard/facturation' },
  { icon: CopyPlus, label: 'Report d\'année', href: '/dashboard/report' },
  { icon: MapIcon, label: 'Carte SIG', href: '/dashboard/carte' },
  { icon: Settings, label: 'Paramètres', href: '/dashboard/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [version, setVersion] = useState("...");
  
  useEffect(() => {
    // Load initial state
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') setIsCollapsed(true);
    
    axios.get('/api/auth/me').then(res => setUser(res.data)).catch(() => {});
    
    // Fetch latest version with fallback to package.json
    Promise.all([
      axios.get('/api/releases').catch(() => ({ data: [] })),
      axios.get('/api/version').catch(() => ({ data: { version: "0.2.0" } })),
    ]).then(([releasesRes, versionRes]) => {
      if (releasesRes.data.length > 0) {
        setVersion(releasesRes.data[0].versionNumber);
      } else {
        setVersion(versionRes.data.version);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    // Update body class and localStorage
    localStorage.setItem('sidebar-collapsed', isCollapsed.toString());
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed]);

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
    <aside className={`${isCollapsed ? 'w-24' : 'w-72'} bg-slate-900 h-screen fixed left-0 top-0 text-white flex flex-col z-50 shadow-2xl transition-all duration-500 ease-in-out ${blurClasses}`}>
      <div className={`p-6 border-b border-slate-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center shadow-lg">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <h1 className="text-base font-black tracking-tighter text-white leading-none">Domaine Public</h1>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Ville d'Ivry</p>
            </div>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all ${isCollapsed ? 'w-12 h-12 flex items-center justify-center' : ''}`}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className={`flex-1 p-4 space-y-1 overflow-hidden ${isCollapsed ? 'items-center' : ''}`}>
        {menuItems.map((item: any) => {
          const isActive = pathname === item.href;

          // Access controls - more robust with href checks
          if (item.adminOnly && user?.role && user.role !== 'ADMIN') return null;
          if (item.href === '/dashboard/settings' && user?.role && user.role !== 'ADMIN') return null;
          if (item.href === '/dashboard/facturation' && user?.role && (user.role !== 'ADMIN' && user.role !== 'AGENT_COMPTABLE')) return null;

          // Hide until user is loaded for sensitive menus to avoid flicker, or show if user is likely admin
          if ((item.adminOnly || item.href === '/dashboard/settings') && !user) return null;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : ''}
              className={`flex items-center gap-4 transition-all group font-bold text-sm h-10 rounded-2xl ${
                isCollapsed ? 'justify-center w-full px-0' : 'px-4'
              } ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} className={`${isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'} shrink-0`} />
              {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={`p-4 border-t border-slate-800 space-y-4`}>
        {user ? (
          <div className={`bg-slate-800/30 rounded-2xl border border-slate-800/50 flex items-center gap-3 ${isCollapsed ? 'justify-center p-2' : 'p-3'}`}>
            <div className={`rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-black border border-blue-500/20 shrink-0 ${isCollapsed ? 'w-10 h-10 text-xs' : 'w-10 h-10 text-sm'}`}>
              {user.prenom[0]}{user.nom[0]}
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
                <p className="text-xs font-black truncate">{user.prenom} {user.nom}</p>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{user.role.replace('AGENT_', '')}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="h-12 bg-slate-800/20 animate-pulse rounded-2xl" />
        )}
        
        <button 
          onClick={handleLogout}
          className={`group flex items-center gap-4 text-slate-500 hover:text-rose-400 transition-all font-black text-[10px] uppercase tracking-widest h-12 rounded-2xl w-full ${isCollapsed ? 'justify-center' : 'px-4'}`}
          title="Déconnexion"
        >
          <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
          {!isCollapsed && <span>Déconnexion</span>}
        </button>

        <div 
          onClick={() => window.dispatchEvent(new CustomEvent('open-whatsnew'))}
          className={`flex items-center gap-2 ${isCollapsed ? 'justify-center cursor-pointer' : 'px-4 justify-between cursor-pointer'} opacity-30 hover:opacity-100 transition-opacity group/version`}
        >
          {!isCollapsed && <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover/version:text-slate-400">Application</span>}
          <span className="text-[9px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20 group-hover/version:bg-blue-600 group-hover/version:text-white transition-all">v{version}</span>
        </div>
      </div>
    </aside>
  );
}
