"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ResponsiveContainer, AreaChart, Area, ComposedChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Calendar, ChevronRight, ClipboardCheck, CopyPlus, Loader2, Map as MapIcon, RefreshCw, Users, Euro } from 'lucide-react';
import { hasPermission, type Permission } from '@/lib/permissions';

interface MonthPt { month: string; dossiers: number; montant: number; demandes: number; aot: number }
interface TypeKpi {
  aotEmises: number; dossiersFactures: number; montantFacture: number;
  facturesEmises: number; dossiersEnCours: number; total: number; monthly: MonthPt[];
}
interface KpiData { year: number; chantier: TypeKpi; tournage: TypeKpi; commerce: TypeKpi; tlpe: TypeKpi; tiersMonthly: { month: string; total: number; nouveaux: number }[] }

// Couleurs de domaine de la charte (Chantier / Tournage / Commerce / TLPE)
const DOMAINS = [
  { key: 'chantier' as const, label: 'Chantiers', unit: 'dossiers au total', href: '/dashboard/occupations?filtre=CHANTIER', color: '#f97316', text: 'text-orange-600', aot: true },
  { key: 'tournage' as const, label: 'Tournages', unit: 'productions', href: '/dashboard/occupations?filtre=TOURNAGE', color: '#3b82f6', text: 'text-blue-600', aot: true },
  { key: 'commerce' as const, label: 'Commerces & terrasses', unit: 'établissements', href: '/dashboard/commerces', color: '#10b981', text: 'text-emerald-600', aot: true },
  { key: 'tlpe' as const, label: 'T.L.P.E.', unit: 'déclarations', href: '/dashboard/tlpe', color: '#8b5cf6', text: 'text-violet-600', aot: false },
];

const eur = (n: number) => `${Math.round(n || 0).toLocaleString('fr-FR')} €`;

function DomainCard({ d, k, year }: { d: typeof DOMAINS[number]; k: TypeKpi; year: number }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(15,23,42,0.05)] p-5 flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">{d.label}</h3>
        </div>
        <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 bg-slate-50 border border-slate-100 ${d.text}`}>Exercice {year}</span>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-3">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">{k.total}</span>
        <span className="text-sm text-slate-500">{d.unit}</span>
      </div>
      <p className={`mt-1 text-sm font-medium ${d.text}`}>{k.dossiersEnCours} dossier{k.dossiersEnCours > 1 ? 's' : ''} en cours</p>

      <div className="mt-3 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={k.monthly} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`v2-${d.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={d.color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={d.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              cursor={false}
              content={({ active, payload }) => active && payload?.length ? (
                <div className="bg-white border border-slate-200 rounded-lg shadow-md px-2.5 py-1.5 text-xs">
                  <span className="font-semibold text-slate-700">{(payload[0].payload as MonthPt).month}</span> : {payload[0].value} dossier{Number(payload[0].value) > 1 ? 's' : ''}
                </div>
              ) : null}
            />
            <Area type="monotone" dataKey="dossiers" stroke={d.color} strokeWidth={2} fill={`url(#v2-${d.key})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <dl className="mt-3 rounded-xl bg-slate-50 px-4 py-3 space-y-1.5 text-[13px]">
        {d.aot && (
          <div className="flex justify-between"><dt className="text-slate-500">AOT émises</dt><dd className="font-semibold text-slate-900 tabular-nums">{k.aotEmises}</dd></div>
        )}
        <div className="flex justify-between"><dt className="text-slate-500">Factures ({k.facturesEmises})</dt><dd className="font-semibold text-slate-900 tabular-nums">{eur(k.montantFacture)}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">Dossiers facturés</dt><dd className="font-semibold text-slate-900 tabular-nums">{k.dossiersFactures}</dd></div>
      </dl>

      <Link href={d.href} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
        Ouvrir {d.label.split(' ')[0].toLowerCase()} <ChevronRight size={14} />
      </Link>
    </div>
  );
}

const SHORTCUTS: { label: string; hint: string; href: string; icon: any; permission?: Permission }[] = [
  { label: 'Gestion des tiers', hint: 'Référentiel et vérification SEDIT', href: '/dashboard/tiers', icon: Users },
  { label: 'Facturation', hint: 'Trains, factures et état de paiement', href: '/dashboard/facturation', icon: ClipboardCheck, permission: 'SEND_EMAILS' },
  { label: 'Tarifs & articles', hint: 'Grille tarifaire de l\'année', href: '/dashboard/tarifs', icon: Euro, permission: 'MANAGE_TARIFS' },
  { label: "Report d'année", hint: 'Reconduire les dossiers', href: '/dashboard/report', icon: CopyPlus, permission: 'MANAGE_TARIFS' },
  { label: 'Carte SIG', hint: 'Occupations sur le terrain', href: '/dashboard/carte', icon: MapIcon, permission: 'VIEW_CARTE' },
];

export default function DashboardV2() {
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [k, u] = await Promise.all([axios.get('/api/dashboard/kpis'), axios.get('/api/auth/me')]);
      setKpis(k.data);
      setUser(u.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  if (loading && !kpis) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-[11px] font-bold uppercase tracking-[0.08em]">Chargement du tableau de bord…</p>
      </div>
    );
  }

  const allowed = SHORTCUTS.filter((s) => !s.permission || (user?.role && hasPermission(user.role, s.permission)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Bonjour, {user?.prenom || '—'} <span aria-hidden>👋</span></h1>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">Exercice actif</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">Tableau de bord — Exercice {kpis?.year} • Ville d&apos;Ivry-sur-Seine</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-[#e2e8f0] rounded-lg h-10 px-3 text-sm font-semibold text-slate-700">
            <Calendar size={15} className="text-slate-400" />
            <span className="capitalize">{format(new Date(), 'MMMM yyyy', { locale: fr })}</span>
          </div>
          <button onClick={load} className="flex items-center gap-2 bg-white border border-[#e2e8f0] hover:bg-slate-50 rounded-lg h-10 px-4 text-sm font-semibold text-slate-700">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Actualiser
          </button>
        </div>
      </div>

      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {DOMAINS.map((d) => <DomainCard key={d.key} d={d} k={kpis[d.key]} year={kpis.year} />)}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(15,23,42,0.05)] p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Évolution du référentiel Tiers</h3>
              <p className="text-sm text-slate-500 mt-0.5">Tiers cumulés et nouveaux enregistrements — {kpis?.year}</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-600 rounded" /> Total cumulé</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-blue-200 rounded-sm" /> Nouveaux / mois</span>
            </div>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={kpis?.tiersMonthly || []} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="v2-tiers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={40} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#93c5fd' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  content={({ active, payload, label }) => active && payload?.length ? (
                    <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-xs space-y-0.5">
                      <p className="font-semibold text-slate-700">{label}</p>
                      {payload.map((p: any) => <p key={p.dataKey} style={{ color: p.color }} className="font-medium">{p.name} : {p.value}</p>)}
                    </div>
                  ) : null}
                />
                <Bar yAxisId="right" dataKey="nouveaux" name="Nouveaux" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
                <Area yAxisId="left" type="monotone" dataKey="total" name="Total cumulé" stroke="#2563eb" strokeWidth={2.5} fill="url(#v2-tiers)" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(15,23,42,0.05)] p-6">
          <h3 className="text-lg font-bold text-slate-900">Accès rapides</h3>
          <p className="text-sm text-slate-500 mt-0.5">Selon vos droits</p>
          <ul className="mt-4 space-y-2">
            {allowed.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="flex items-center gap-3 rounded-xl border border-[#e2e8f0] px-3 py-3 hover:bg-slate-50 hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)] transition-shadow">
                  <span className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><s.icon size={17} /></span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">{s.label}</span>
                    <span className="block text-xs text-slate-500 truncate">{s.hint}</span>
                  </span>
                  <ChevronRight size={16} className="text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
