"use client";

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { ChevronLeft, ChevronRight, LogOut, Menu, X, Zap, Loader2 } from 'lucide-react';
import { menuItems, type MenuItem } from '@/components/Sidebar';
import { hasPermission } from '@/lib/permissions';
import UiModeSwitch from '@/components/v2/UiModeSwitch';
import { SETTINGS_TABS, SETTINGS_GROUPS, isSettingsTab } from '@/app/dashboard/settings/tabs';

// Groupes de la maquette : « Exploitation & suivi » (5 premiers) puis « Gestion métier ».
const GROUPS: { title: string; items: MenuItem[] }[] = [
  { title: 'Exploitation & suivi', items: menuItems.slice(0, 5) },
  { title: 'Gestion métier', items: menuItems.slice(5) },
];

// Couleur par domaine (charte : chantier orange, tournage bleu, commerce émeraude, TLPE violet)
const DOMAIN: Record<string, { dot: string; badge: string }> = {
  '/dashboard/occupations?filtre=CHANTIER': { dot: 'text-orange-400', badge: 'bg-orange-500/15 text-orange-300' },
  '/dashboard/occupations?filtre=TOURNAGE': { dot: 'text-blue-400', badge: 'bg-blue-500/15 text-blue-300' },
  '/dashboard/commerces': { dot: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300' },
  '/dashboard/tlpe': { dot: 'text-violet-400', badge: 'bg-violet-500/15 text-violet-300' },
};

// Sous-menu des Paramètres, directement dans le menu latéral (groupes Configuration / Référentiels / Technique)
export function SettingsSubMenu({ activeTab, onNavigate }: { activeTab: string; onNavigate: () => void }) {
  return (
    <div className="ml-5 mt-1 mb-2 pl-3 border-l border-slate-700 space-y-3">
      {SETTINGS_GROUPS.map((g) => (
        <div key={g}>
          <p className="px-2 mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{g}</p>
          <div className="space-y-0.5">
            {SETTINGS_TABS.filter((t) => t.group === g).map((t) => {
              const on = t.id === activeTab;
              return (
                <Link
                  key={t.id}
                  href={`/dashboard/settings?tab=${t.id}`}
                  onClick={onNavigate}
                  className={`flex items-center gap-2.5 h-8 px-2 rounded-md text-[13px] font-semibold transition-colors ${on ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
                >
                  <t.icon size={14} className={`shrink-0 ${on ? 'text-blue-400' : ''}`} />
                  <span className="truncate">{t.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Nav({ collapsed, user, counts, onNavigate }: { collapsed: boolean; user: any; counts: Record<string, number>; onNavigate: () => void }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const activeType = sp.get('filtre') || sp.get('type');

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      {GROUPS.map((g) => {
        const visible = g.items.filter((i) => !i.permission || (user?.role && hasPermission(user.role, i.permission)));
        if (!visible.length) return null;
        return (
          <div key={g.title}>
            {!collapsed && <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{g.title}</p>}
            <div className="space-y-1">
              {visible.map((item) => {
                const active = item.dossierType && activeType ? pathname === item.path && item.dossierType === activeType : pathname === item.href;
                const dom = DOMAIN[item.href];
                const count = counts[item.href];
                return (
                  <React.Fragment key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 h-10 rounded-lg text-sm font-semibold transition-colors ${collapsed ? 'justify-center' : 'px-3'} ${
                      active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <item.icon size={18} className={`shrink-0 ${!active && dom ? dom.dot : ''}`} />
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!collapsed && count !== undefined && (
                      <span className={`text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-md ${active ? 'bg-white/20 text-white' : dom?.badge || 'bg-slate-800 text-slate-300'}`}>{count}</span>
                    )}
                  </Link>
                  {item.href === '/dashboard/settings' && pathname.startsWith('/dashboard/settings') && !collapsed && (
                    <SettingsSubMenu activeTab={isSettingsTab(sp.get('tab')) ? sp.get('tab')! : 'general'} onNavigate={onNavigate} />
                  )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function Breadcrumb() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const t = sp.get('filtre') || sp.get('type');
  const current =
    menuItems.find((i) => (i.dossierType && t ? pathname === i.path && i.dossierType === t : pathname === i.href)) ||
    [...menuItems].sort((a, b) => b.href.length - a.href.length).find((i) => i.href.split('?')[0] !== '/dashboard' && pathname.startsWith(i.href.split('?')[0]));
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-500">ODP Ivry</span>
      <ChevronRight size={14} className="text-slate-300" />
      <span className="font-semibold text-slate-900">{current?.label || 'Tableau de bord'}</span>
    </div>
  );
}

export default function ShellV2({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [version, setVersion] = useState('');
  const [dbMode, setDbMode] = useState<'PROD' | 'DEV'>('PROD');
  const [switching, setSwitching] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    try { if (localStorage.getItem('sidebar-collapsed') === 'true') setCollapsed(true); } catch { /* ignore */ }
    axios.get('/api/auth/me').then((r) => setUser(r.data)).catch(() => {});
    axios.get('/api/settings/db-mode').then((r) => setDbMode(r.data.mode)).catch(() => {});
    Promise.all([
      axios.get('/api/releases').catch(() => ({ data: [] })),
      axios.get('/api/version').catch(() => ({ data: { version: '' } })),
    ]).then(([rel, ver]) => setVersion(rel.data?.[0]?.versionNumber || ver.data.version || ''));
    axios.get('/api/dashboard/kpis').then((r) => {
      const k = r.data;
      setCounts({
        '/dashboard/occupations?filtre=CHANTIER': k.chantier?.total ?? 0,
        '/dashboard/occupations?filtre=TOURNAGE': k.tournage?.total ?? 0,
        '/dashboard/commerces': k.commerce?.total ?? 0,
        '/dashboard/tlpe': k.tlpe?.total ?? 0,
      });
    }).catch(() => {});
  }, []);

  useEffect(() => { try { localStorage.setItem('sidebar-collapsed', String(collapsed)); } catch { /* ignore */ } }, [collapsed]);
  useEffect(() => { setDrawer(false); }, [pathname]);

  const logout = async () => {
    try { await axios.post('/api/auth/logout'); router.push('/login'); router.refresh(); } catch { /* ignore */ }
  };
  const toggleDb = async () => {
    setSwitching(true);
    try { await axios.post('/api/settings/db-mode', { mode: dbMode === 'PROD' ? 'DEV' : 'PROD' }); window.location.reload(); }
    catch (e) { console.error(e); setSwitching(false); }
  };

  const isVerifyPage = pathname?.includes('/dashboard/tiers/verify/');
  const initials = user ? `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}` : '';

  const rail = (isCollapsed: boolean) => (
    <>
      <div className={`h-16 px-4 flex items-center border-b border-slate-800 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-blue-600 overflow-hidden flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight">ODP Manager</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 truncate">Ville d&apos;Ivry-sur-Seine</p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <button onClick={() => setCollapsed(true)} className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white" aria-label="Réduire le menu">
            <ChevronLeft size={16} />
          </button>
        )}
      </div>
      {isCollapsed && (
        <button onClick={() => setCollapsed(false)} className="hidden md:flex mx-auto mt-3 w-9 h-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white" aria-label="Déplier le menu">
          <ChevronRight size={16} />
        </button>
      )}

      <Suspense fallback={<div className="flex-1" />}>
        <Nav collapsed={isCollapsed} user={user} counts={counts} onNavigate={() => setDrawer(false)} />
      </Suspense>

      <div className="p-3 border-t border-slate-800 space-y-2">
        {user ? (
          <div className={`flex items-center gap-3 rounded-xl bg-slate-800/50 ${isCollapsed ? 'justify-center p-2' : 'p-3'}`}>
            <div className="w-9 h-9 rounded-full bg-blue-600/20 text-blue-300 text-xs font-bold flex items-center justify-center shrink-0">{initials}</div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.prenom} {user.nom}</p>
                <p className="text-xs text-slate-400 truncate">{String(user.role || '').replace('AGENT_', '')}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-14 rounded-xl bg-slate-800/40 animate-pulse" />
        )}

        {user?.role === 'ADMINISTRATEUR' && (
          <button
            onClick={toggleDb}
            disabled={switching}
            title={dbMode === 'PROD' ? 'Passer en mode DEV' : 'Passer en mode PROD'}
            className={`flex items-center gap-3 w-full h-11 rounded-xl text-xs font-semibold transition-colors ${isCollapsed ? 'justify-center' : 'px-3'} ${dbMode === 'PROD' ? 'text-emerald-300 hover:bg-slate-800' : 'text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20'}`}
          >
            {switching ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            {!isCollapsed && (
              <span className="flex flex-1 items-center justify-between">
                <span>Mode {dbMode}</span>
                <span className={`w-9 h-5 rounded-full relative ${dbMode === 'PROD' ? 'bg-emerald-600' : 'bg-indigo-500'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${dbMode === 'PROD' ? 'left-[18px]' : 'left-0.5'}`} />
                </span>
              </span>
            )}
          </button>
        )}

        <UiModeSwitch collapsed={isCollapsed} />

        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'justify-between'} px-1 pt-1`}>
          <button onClick={() => window.dispatchEvent(new CustomEvent('open-whatsnew'))} className="text-xs font-semibold text-slate-500 hover:text-slate-300 tabular-nums">v{version}</button>
          <button onClick={logout} className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white" title="Déconnexion">
            <LogOut size={14} />
            {!isCollapsed && 'Déconnexion'}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Rail latéral (≥ md) */}
      <aside className={`hidden md:flex fixed inset-y-0 left-0 z-40 flex-col bg-[#0f172a] text-white transition-[width] duration-300 ${collapsed ? 'w-24' : 'w-72'} ${isVerifyPage ? 'blur-[4px] pointer-events-none opacity-60' : ''}`}>
        {rail(collapsed)}
      </aside>

      {/* Tiroir mobile (< md) */}
      {drawer && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <aside className="w-72 max-w-[85vw] bg-[#0f172a] text-white flex flex-col">{rail(false)}</aside>
          <button className="flex-1 bg-slate-950/70 backdrop-blur-sm" onClick={() => setDrawer(false)} aria-label="Fermer le menu" />
        </div>
      )}

      <div className={`transition-[margin] duration-300 ${collapsed ? 'md:ml-24' : 'md:ml-72'}`}>
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur border-b border-[#e2e8f0] px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-[#e2e8f0] text-slate-600" onClick={() => setDrawer((d) => !d)} aria-label="Menu">
              {drawer ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Suspense fallback={null}><Breadcrumb /></Suspense>
          </div>
          <div className="flex items-center gap-3">
            {dbMode === 'DEV' && <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1">Base DEV</span>}
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center" title={user ? `${user.prenom} ${user.nom}` : ''}>{initials}</div>
          </div>
        </header>
        <main className="px-4 md:px-8 py-6 md:py-8 max-w-[1600px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
