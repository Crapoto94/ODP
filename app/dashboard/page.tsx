"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ResponsiveContainer, AreaChart, Area,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  Bar, ComposedChart,
} from 'recharts';
import {
  HardHat, Store, ShoppingBag, Clapperboard,
  FileCheck2, FileText, Euro, Receipt, Clock, Globe,
  Loader2, RefreshCw, Calendar, ChevronRight,
} from 'lucide-react';

interface MonthPt { month: string; dossiers: number; montant: number; demandes: number; aot: number }
interface TiersPt  { month: string; total: number; nouveaux: number }
interface TypeKpi {
  aotEmises: number; dossiersFactures: number; montantFacture: number;
  facturesEmises: number; dossiersEnCours: number; total: number;
  monthly: MonthPt[];
}
interface KpiData { year: number; chantier: TypeKpi; tournage: TypeKpi; commerce: TypeKpi; tlpe: TypeKpi; tiersMonthly: TiersPt[] }

const TYPES = [
  { key: 'chantier' as const, label: 'Chantiers',  href: '/dashboard/occupations?type=CHANTIER', icon: HardHat,      gradient: 'from-orange-500 to-amber-500',  stroke: '#f97316', aot: true  },
  { key: 'tournage' as const, label: 'Tournages',  href: '/dashboard/occupations?type=TOURNAGE', icon: Clapperboard, gradient: 'from-blue-500 to-indigo-500',    stroke: '#3b82f6', aot: true  },
  { key: 'commerce' as const, label: 'Commerces',  href: '/dashboard/commerces',                 icon: Store,        gradient: 'from-emerald-500 to-teal-500',  stroke: '#10b981', aot: true  },
  { key: 'tlpe'     as const, label: 'T.L.P.E.',   href: '/dashboard/tlpe',                      icon: ShoppingBag,  gradient: 'from-violet-500 to-purple-500', stroke: '#8b5cf6', aot: false },
];

function fmtEuro(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.', ',') + ' k€';
  return n.toLocaleString('fr-FR') + ' €';
}

function MiniTooltip({ active, payload, label, euro }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 shadow-lg rounded-xl px-3 py-2 text-xs">
      <p className="font-black text-slate-500 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-bold">
          {p.name}: {euro ? fmtEuro(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

function KpiCard({ type, kpi, year }: { type: typeof TYPES[0]; kpi: TypeKpi; year: number }) {
  const Icon = type.icon;

  const metrics = [
    ...(type.aot ? [{ icon: FileText,   label: 'AOT émises',         value: kpi.aotEmises }] : []),
    { icon: FileCheck2, label: 'Dossiers facturés',  value: kpi.dossiersFactures },
    { icon: Euro,       label: 'Montant facturé',    value: fmtEuro(kpi.montantFacture) },
    { icon: Receipt,    label: 'Factures émises',    value: kpi.facturesEmises },
    { icon: Clock,      label: 'Dossiers en cours',  value: kpi.dossiersEnCours },
    { icon: Globe,      label: 'Demandes portail',   value: null },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className={`bg-gradient-to-r ${type.gradient} px-5 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white">
            <Icon size={18} />
          </div>
          <div>
            <h3 className="text-base font-black text-white leading-none">{type.label}</h3>
            <p className="text-white/60 text-[10px] font-bold mt-0.5">{year} — {kpi.total} dossier{kpi.total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Link href={type.href} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors">
          <ChevronRight size={16} />
        </Link>
      </div>

      {/* Flat metrics list */}
      <div className="px-5 py-3 space-y-0 divide-y divide-slate-50">
        {metrics.map(({ icon: MIcon, label, value }) => (
          <div key={label} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2 text-slate-400">
              <MIcon size={13} />
              <span className="text-[11px] font-bold uppercase tracking-wide">{label}</span>
            </div>
            {value === null
              ? <span className="text-[11px] font-bold text-slate-300 italic">À venir</span>
              : <span className="text-sm font-black text-slate-800 tabular-nums">{value}</span>
            }
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="px-4 pb-4 space-y-4 flex-1">
        {/* Dossiers par mois */}
        <div>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Dossiers / mois</p>
          <ResponsiveContainer width="100%" height={70}>
            <AreaChart data={kpi.monthly} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`g-d-${type.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={type.stroke} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={type.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
              <Tooltip content={<MiniTooltip />} />
              <Area type="monotone" dataKey="dossiers" name="Dossiers" stroke={type.stroke} strokeWidth={2} fill={`url(#g-d-${type.key})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Montant facturé par mois */}
        <div>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Montant facturé / mois</p>
          <ResponsiveContainer width="100%" height={70}>
            <AreaChart data={kpi.monthly} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`g-m-${type.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={type.stroke} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={type.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
              <Tooltip content={<MiniTooltip euro />} />
              <Area type="monotone" dataKey="montant" name="Montant" stroke={type.stroke} strokeWidth={2} fill={`url(#g-m-${type.key})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Demandes reçues vs AOT émises */}
        <div>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Demandes vs Autorisations</p>
          <ResponsiveContainer width="100%" height={70}>
            <LineChart data={kpi.monthly} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
              <Tooltip content={<MiniTooltip />} />
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <Line type="monotone" dataKey="demandes" name="Demandes" stroke={type.stroke} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="aot" name="AOT" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 2" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [kpiRes, userRes] = await Promise.all([
        axios.get('/api/dashboard/kpis'),
        axios.get('/api/auth/me'),
      ]);
      setKpis(kpiRes.data);
      setUser(userRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Chargement des KPI…</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Bonjour, {user?.prenom || '—'} 👋
          </h2>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Tableau de bord — année {kpis?.year ?? new Date().getFullYear()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-2xl px-4 py-2.5 shadow-sm">
            <Calendar size={15} className="text-slate-400" />
            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">
              {format(new Date(), 'MMMM yyyy', { locale: fr })}
            </span>
          </div>
          <button onClick={load} className="p-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-blue-600 transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 4 columns */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {TYPES.map(type => (
            <KpiCard key={type.key} type={type} kpi={kpis[type.key]} year={kpis.year} />
          ))}
        </div>
      )}

      {/* Tiers evolution chart */}
      {kpis && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Évolution du référentiel Tiers</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Tiers cumulés et nouveaux enregistrements — {kpis.year}
              </p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-0.5 bg-slate-700 inline-block rounded" />
                Total cumulé
              </span>
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-3 h-2 bg-blue-100 inline-block rounded" />
                Nouveaux / mois
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={kpis.tiersMonthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="g-tiers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1e293b" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#1e293b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                axisLine={false} tickLine={false} width={40}
              />
              <YAxis
                yAxisId="right" orientation="right"
                tick={{ fontSize: 10, fill: '#93c5fd', fontWeight: 700 }}
                axisLine={false} tickLine={false} width={30}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-white border border-slate-100 shadow-lg rounded-xl px-3 py-2 text-xs space-y-1">
                      <p className="font-black text-slate-500">{label}</p>
                      {payload.map((p: any) => (
                        <p key={p.dataKey} style={{ color: p.color }} className="font-bold">
                          {p.name} : {p.value}
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              <Bar yAxisId="right" dataKey="nouveaux" name="Nouveaux" fill="#bfdbfe" radius={[3,3,0,0]} />
              <Area yAxisId="left" type="monotone" dataKey="total" name="Total cumulé" stroke="#1e293b" strokeWidth={2.5} fill="url(#g-tiers)" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
