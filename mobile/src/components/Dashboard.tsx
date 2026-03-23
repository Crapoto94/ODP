import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import api from '../services/api';
import { MapPin, LogOut, Loader2, Search, Sun, Moon, Package, RefreshCw, LayoutGrid, HardHat, Store, Video, Calendar, Settings as SettingsIcon } from 'lucide-react';
import { useGeolocation, type Coordinates } from '../hooks/useGeolocation';
import { useTheme } from '../hooks/useTheme';

interface Occupation {
  id: number;
  nom: string;
  type: string;
  statut: string;
  adresse: string;
  latitude: number | null;
  longitude: number | null;
  tiers: { nom: string };
  lignes: Array<{ montant: number }>;
  _count: { notes: number; lignes: number };
}

interface DashboardProps {
  onSelectDossier: (id: number) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  isVpnConnected: boolean;
}

const PAGE_SIZE = 20;

const TYPE_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  CHANTIER:  { color: 'text-amber-500 dark:text-amber-300',  bg: 'bg-amber-400/10 border-amber-400/20',   dot: 'bg-amber-400' },
  COMMERCE:  { color: 'text-emerald-500 dark:text-emerald-300', bg: 'bg-emerald-400/10 border-emerald-400/20', dot: 'bg-emerald-400' },
  TOURNAGE:  { color: 'text-rose-500 dark:text-rose-300',   bg: 'bg-rose-400/10 border-rose-400/20',     dot: 'bg-rose-400' },
  EVENEMENT: { color: 'text-blue-500 dark:text-blue-300',   bg: 'bg-blue-400/10 border-blue-400/20',     dot: 'bg-blue-400' },
};

export function Dashboard({ onSelectDossier, onLogout, onOpenSettings, isVpnConnected }: DashboardProps) {
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { coords, loading: gpsLoading, refresh: refreshGps, error: gpsError } = useGeolocation();
  const { toggle, isDark } = useTheme();

  useEffect(() => {
    api.get('/api/occupations').then(r => setOccupations(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { setDisplayCount(PAGE_SIZE); }, [filter, search]);

  const calculateDistance = (pos1: Coordinates, lat2: number, lng2: number) =>
    Math.pow(pos1.latitude - lat2, 2) + Math.pow(pos1.longitude - lng2, 2);

  const sortedAndFiltered = useMemo(() => {
    let list = filter === 'ALL' ? [...occupations] : occupations.filter(o => o.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o => (o.nom || o.tiers.nom).toLowerCase().includes(q) || o.adresse.toLowerCase().includes(q));
    }
    if (coords) {
      list.sort((a, b) => {
        if (!a.latitude || !a.longitude) return 1;
        if (!b.latitude || !b.longitude) return -1;
        return calculateDistance(coords, a.latitude, a.longitude) - calculateDistance(coords, b.latitude, b.longitude);
      });
    }
    return list;
  }, [occupations, filter, coords, search]);

  const displayed = sortedAndFiltered.slice(0, displayCount);
  const hasMore = displayCount < sortedAndFiltered.length;

  const loadMore = useCallback(() => {
    setDisplayCount(n => Math.min(n + PAGE_SIZE, sortedAndFiltered.length));
  }, [sortedAndFiltered.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) loadMore();
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const types = ['ALL', ...Array.from(new Set(occupations.map(o => o.type)))];

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 size={36} className="animate-spin text-violet-400 mx-auto" />
          <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--text)] flex flex-col transition-colors duration-300">

      {/* ── Sticky header ─────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-[var(--bg)]/90 backdrop-blur-3xl border-b border-[var(--divider)]">

        {/* App bar - Compacted */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase">Dossiers</h1>
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none">
              {sortedAndFiltered.length} au total
              {coords && <span className="text-emerald-500 ml-1">· GPS ON</span>}
              {gpsError && <span className="text-rose-500 ml-1">· Erreur GPS: {gpsError}</span>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={onOpenSettings} 
              className="w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors active:scale-95 relative"
              title="Paramètres API"
            >
              <SettingsIcon size={16} />
              {isVpnConnected && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[var(--bg-card)] animate-pulse" />
              )}
            </button>
            <button 
              onClick={refreshGps} 
              disabled={gpsLoading}
              className="w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors active:scale-95 disabled:opacity-50"
              title="Rafraîchir GPS"
            >
              <RefreshCw size={16} className={gpsLoading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={toggle} 
              className="w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors active:scale-95"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button 
              onClick={onLogout} 
              className="w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors active:scale-95"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Search bar - Extra Large */}
        <div className="px-5 pb-5 pt-2">
          <div className="relative">
            <Search size={24} className="absolute left-8 top-1/2 -translate-y-1/2 text-[var(--text-dim)] opacity-60" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher dossiers..."
              className="w-full input-field rounded-[3rem] py-8 pl-20 pr-8 text-xl font-black transition-all shadow-2xl"
            />
          </div>
        </div>

        {/* Filter pills — MASSIVE with Color Palette */}
        <div className="flex gap-4 px-5 pb-7 overflow-x-auto no-scrollbar">
          {types.map(t => {
            const isActive = filter === t;
            let grad = 'gradient-primary';
            let shadow = 'shadow-violet-500/30';
            let Icon = LayoutGrid;

            if (t === 'CHANTIER') { 
              grad = 'bg-gradient-to-br from-amber-400 to-orange-500'; 
              shadow = 'shadow-amber-500/30'; 
              Icon = HardHat;
            } else if (t === 'COMMERCE') { 
              grad = 'bg-gradient-to-br from-emerald-400 to-teal-500'; 
              shadow = 'shadow-emerald-500/30'; 
              Icon = Store;
            } else if (t === 'TOURNAGE') { 
              grad = 'bg-gradient-to-br from-rose-400 to-pink-500'; 
              shadow = 'shadow-rose-500/30'; 
              Icon = Video;
            } else if (t === 'EVENEMENT') { 
              grad = 'bg-gradient-to-br from-blue-400 to-indigo-500'; 
              shadow = 'shadow-blue-500/30'; 
              Icon = Calendar;
            }
            
            return (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`shrink-0 flex flex-col items-center gap-2 px-8 py-5 rounded-3xl transition-all duration-300 border-2 ${
                  isActive
                    ? `${grad} text-white shadow-2xl ${shadow} scale-105 border-transparent`
                    : 'bg-[var(--bg-card)] border-[var(--card-border)] text-[var(--text-muted)]'
                }`}
              >
                <Icon size={24} strokeWidth={isActive ? 3 : 2} />
                <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                  {t === 'ALL' ? 'TOUS' : t}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── List ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {displayed.map(o => {
          const cfg = TYPE_CONFIG[o.type] ?? { color: 'text-[var(--text-muted)]', bg: 'bg-[var(--bg-card)] border-[var(--card-border)]', dot: 'bg-neutral-500' };
          const totalAmount = o.lignes?.reduce((sum, l) => sum + l.montant, 0) || 0;
          
          return (
            <div
              key={o.id}
              onClick={() => onSelectDossier(o.id)}
              className="glass-card rounded-[2.5rem] p-7 flex items-center gap-5 active:scale-[0.98] transition-all cursor-pointer group relative overflow-hidden shadow-sm"
            >
              {/* Type dot with badge */}
              <div className="relative shrink-0">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${cfg.bg} border-2 transition-colors shadow-inner`}>
                  <div className={`w-3 h-3 rounded-full ${cfg.dot} shadow-md`} />
                </div>
                {(o._count?.lignes || 0) > 0 && (
                  <div className="absolute -top-2 -right-2 min-w-[24px] h-[24px] bg-emerald-500 text-white rounded-full flex items-center justify-center px-1.5 border-4 border-[var(--bg)] shadow-lg animate-in zoom-in duration-300">
                    <span className="text-[10px] font-black text-white">{o._count.lignes}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>{o.type}</span>
                  <span className="text-[10px] font-bold text-[var(--text-dim)]">· #{o.id}</span>
                </div>
                <h3 className="font-black text-lg text-[var(--text)] truncate leading-tight group-hover:text-violet-500 transition-colors">
                  {o.nom || o.tiers.nom}
                </h3>
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="shrink-0 text-[var(--text-dim)]" />
                  <p className="text-xs font-bold text-[var(--text-muted)] truncate">{o.adresse}</p>
                </div>
              </div>

              {/* Right: Amount & Stats */}
              <div className="flex flex-col items-end justify-center gap-2 shrink-0 pl-4 pr-1">
                <div className="text-right">
                  <p className="text-2xl font-black text-[var(--text)] tabular-nums tracking-tighter">
                    {totalAmount.toFixed(2)}<span className="text-[10px] ml-0.5 text-[var(--text-dim)] uppercase">€ TTC</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-card)]/50 border border-[var(--card-border)] shadow-sm">
                  <Package size={12} className="text-[var(--text-dim)]" />
                  <span className="text-[10px] font-black text-[var(--text-muted)] tracking-tighter">
                    {o._count?.lignes || 0} p.
                  </span>
                </div>
              </div>

            </div>
          );
        })}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="py-6 flex justify-center">
          {hasMore && <Loader2 size={22} className="animate-spin text-[var(--text-dim)]" />}
          {!hasMore && displayed.length > 0 && (
            <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest">— fin de la liste —</p>
          )}
          {displayed.length === 0 && !loading && (
            <div className="text-center py-16 space-y-3">
              <p className="text-4xl opacity-50">🗂️</p>
              <p className="text-sm font-bold text-[var(--text-muted)]">Aucun dossier trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
