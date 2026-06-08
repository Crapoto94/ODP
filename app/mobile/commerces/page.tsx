"use client";
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { ArrowLeft, MapPin, Loader2, Navigation, NavigationOff, RefreshCw, Store } from 'lucide-react';
import { useGPS } from '../_hooks/useGPS';
import { haversine, fmtDistance } from '../_utils/geo';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PREP:            { color: 'bg-blue-100 text-blue-700',      label: 'Préparation' },
  PREPARATION_AOT: { color: 'bg-sky-100 text-sky-700',        label: 'Prép. AOT' },
  EN_COURS:        { color: 'bg-emerald-100 text-emerald-700', label: 'En cours' },
  VALIDE:          { color: 'bg-teal-100 text-teal-700',      label: 'Validé' },
  FACTURE:         { color: 'bg-amber-100 text-amber-700',    label: 'Facturé' },
  'FACTURÉ':       { color: 'bg-amber-100 text-amber-700',    label: 'Facturé' },
  TITRE:           { color: 'bg-orange-100 text-orange-700',  label: 'Titré' },
  'TITRÉ':         { color: 'bg-orange-100 text-orange-700',  label: 'Titré' },
  PAYE:            { color: 'bg-violet-100 text-violet-700',  label: 'Payé' },
  'PAYÉ':          { color: 'bg-violet-100 text-violet-700',  label: 'Payé' },
  CLOS:            { color: 'bg-slate-100 text-slate-500',    label: 'Clos' },
};

interface Commerce {
  id: number;
  nom: string;
  adresse?: string;
  latitude?: number | null;
  longitude?: number | null;
  commerceYears: number[];
  tlpeYears: number[];
  lastYear?: number | null;
  lastYearStatut?: string;
}

export default function MobileCommercesPage() {
  const gps = useGPS();
  const [items, setItems] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/commerces?status=ACTIVE');
      setItems(Array.isArray(res.data) ? res.data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const withDistance = useMemo(() => items.map(c => ({
    ...c,
    dist: (gps.status === 'ok' && c.latitude != null && c.longitude != null)
      ? haversine(gps.lat, gps.lon, c.latitude, c.longitude)
      : null,
  })), [items, gps]);

  const sorted = useMemo(() => {
    const q = query.toLowerCase();
    return withDistance
      .filter(c => !q || c.nom.toLowerCase().includes(q) || (c.adresse ?? '').toLowerCase().includes(q))
      .sort((a, b) => {
        if (a.dist == null && b.dist == null) return a.nom.localeCompare(b.nom);
        if (a.dist == null) return 1;
        if (b.dist == null) return -1;
        return a.dist - b.dist;
      });
  }, [withDistance, query]);

  const gpsIcon = gps.status === 'ok'
    ? <Navigation size={13} className="text-emerald-500" />
    : gps.status === 'loading'
    ? <Loader2 size={13} className="animate-spin text-slate-400" />
    : <NavigationOff size={13} className="text-slate-400" />;

  const gpsLabel = gps.status === 'ok' ? `±${Math.round(gps.accuracy)} m`
    : gps.status === 'loading' ? 'Localisation…'
    : gps.status === 'denied' ? 'GPS refusé'
    : 'GPS indisponible';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 pt-12 pb-4 text-white">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/mobile" className="p-2 bg-white/10 rounded-xl active:scale-95 transition-transform">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-black flex-1">Commerces</h1>
          <button onClick={load} className="p-2 bg-white/10 rounded-xl active:scale-95 transition-transform">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <input
          type="search"
          placeholder="Rechercher un commerce…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-white/10 placeholder-white/50 text-white text-sm font-medium rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-white/30 transition-colors"
        />
      </div>

      {/* GPS bar */}
      <div className="bg-white border-b border-slate-100 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {gpsIcon}
          <span className="text-[11px] font-bold text-slate-500">{gpsLabel}</span>
        </div>
        <span className="text-[11px] font-bold text-slate-400">
          {loading ? '…' : `${sorted.length} commerce${sorted.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex justify-center pt-12">
            <Loader2 className="animate-spin text-slate-400" size={28} />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center pt-12 text-slate-400 text-sm font-medium">Aucun commerce trouvé</div>
        ) : sorted.map(c => {
          const allYears = [...(c.commerceYears ?? []), ...(c.tlpeYears ?? [])].filter(Boolean);
          const lastYear = c.lastYear ?? (allYears.length ? Math.max(...allYears) : null);
          const nbYears = new Set(allYears).size;
          const status = STATUS_CONFIG[c.lastYearStatut ?? ''] ?? { color: 'bg-slate-100 text-slate-500', label: c.lastYearStatut ?? '—' };

          return (
            <Link key={c.id} href={`/dashboard/commerces/${c.id}`}>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex gap-3 active:scale-[0.98] transition-transform">
                {/* Distance */}
                <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                  <MapPin size={14} className={c.dist != null ? 'text-emerald-500' : 'text-slate-300'} />
                  {c.dist != null && (
                    <span className="text-[10px] font-black text-emerald-600 leading-none">{fmtDistance(c.dist)}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Store size={13} className="text-emerald-500 shrink-0" />
                      <p className="text-sm font-black text-slate-900 leading-tight truncate">{c.nom}</p>
                    </div>
                    <span className={`shrink-0 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {c.adresse && (
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">{c.adresse}</p>
                  )}

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {lastYear && (
                      <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                        {lastYear}
                      </span>
                    )}
                    {nbYears > 0 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {nbYears} année{nbYears > 1 ? 's' : ''} de dossier
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
