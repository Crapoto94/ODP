"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  Euro, 
  Users, 
  FileText, 
  TrendingUp, 
  ArrowUpRight, 
  ChevronRight,
  Download,
  Calendar,
  Plus,
  ArrowRight,
  Clock,
  LayoutDashboard,
  Zap,
  Package,
  MapPin,
  TrendingDown,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

const STATUS_MAP: Record<string, { label: string, color: string, bg: string }> = {
  'EN_ATTENTE': { label: 'En attente', color: 'text-amber-500', bg: 'bg-amber-400' },
  'EN_COURS': { label: 'En cours', color: 'text-blue-500', bg: 'bg-blue-400' },
  'TERMINE': { label: 'Terminé', color: 'text-indigo-500', bg: 'bg-indigo-400' },
  'VERIFIE': { label: 'Vérifié', color: 'text-emerald-500', bg: 'bg-emerald-400' },
  'FACTURE': { label: 'Facturé', color: 'text-orange-500', bg: 'bg-orange-400' },
  'PAYE': { label: 'Payé', color: 'text-emerald-600', bg: 'bg-emerald-500' },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/stats'),
      axios.get('/api/auth/me')
    ])
    .then(([statsRes, userRes]) => {
      setStats(statsRes.data);
      setUser(userRes.data);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Initialisation du cockpit...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Zap size={16} />
            </div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Aperçu Opérationnel</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            Bonjour, {user?.prenom || 'Utilisateur'} <span className="text-slate-300">👋</span>
          </h2>
          <p className="text-slate-500 font-medium text-sm">Prêt à piloter le domaine public d'Ivry-sur-Seine ?</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/40 backdrop-blur-xl p-2 rounded-3xl border border-white shadow-xl shadow-slate-200/50">
           <div className="px-5 py-3 flex items-center gap-3">
              <Calendar size={18} className="text-slate-400" />
              <span className="text-xs font-black text-slate-700 uppercase tracking-widest">
                {format(new Date(), 'MMMM yyyy', { locale: fr })}
              </span>
           </div>
        </div>
      </div>

      {/* KPI Grid - Glassmorphism style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Recettes Confirmées" 
          value={stats.totalRevenue} 
          subtitle={`Objectif: ${stats.potentialRevenue.toLocaleString()} €`}
          icon={Euro} 
          color="blue"
          trend="+12%"
        />
        <StatCard 
          title="Dossiers Actifs" 
          value={stats.activeDossiers} 
          subtitle={`${stats.pendingDossiers || 0} en attente`}
          icon={FileText} 
          color="amber"
          trend="+5"
        />
        <StatCard 
          title="Tiers Référencés" 
          value={stats.tiersCount} 
          subtitle="Particuliers & Entreprises"
          icon={Users} 
          color="indigo"
          trend="Stable"
        />
        <StatCard 
          title="Potentiel Annuel" 
          value={stats.potentialRevenue} 
          subtitle="Toutes catégories confondues"
          icon={TrendingUp} 
          color="emerald"
          percentage={Math.round((stats.totalRevenue/stats.potentialRevenue)*100)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart - Left 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 p-10 space-y-10 relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl group-hover:bg-blue-100/50 transition-colors duration-1000"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Évolution du Chiffre d'Affaires</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Données consolidées sur 6 mois</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-blue-600">
               <TrendingUp size={24} />
            </div>
          </div>

          <div className="h-80 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                  dy={15}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <RechartsTooltip 
                  content={<CustomTooltip />}
                  cursor={{ stroke: '#2563eb', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="redevance" 
                  stroke="#2563eb" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                  animationDuration={2500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Types & Shortcuts */}
        <div className="space-y-8">
           {/* Category Breakdown */}
           <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                <LayoutDashboard size={100} />
              </div>
              
              <div className="relative z-10 space-y-8">
                <div>
                  <h3 className="text-lg font-black tracking-tight">Répartition Financière</h3>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">Par type d'occupation</p>
                </div>

                <div className="space-y-6">
                  {stats.typeStats?.map((type: any, idx: number) => (
                    <div key={idx} className="space-y-2">
                       <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-blue-400' : (idx === 1 ? 'bg-emerald-400' : 'bg-amber-400')}`}></div>
                             {type.label}
                          </span>
                          <span className="text-white/60">{type.value.toLocaleString()} €</span>
                       </div>
                       <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1500 delay-[${idx * 200}ms] ${idx === 0 ? 'bg-blue-400' : (idx === 1 ? 'bg-emerald-400' : 'bg-amber-400')}`}
                            style={{ width: `${type.percentage}%` }}
                          ></div>
                       </div>
                    </div>
                  ))}
                </div>

                <Link 
                  href="/dashboard/occupations"
                  className="block text-center py-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/5 transition-all text-[10px] font-black uppercase tracking-widest"
                >
                  Voir tous les dossiers <ArrowRight size={14} className="inline ml-2" />
                </Link>
              </div>
           </div>

           {/* Quick Actions */}
           <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/20 space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Actions Rapides</h4>
              <div className="grid grid-cols-1 gap-3">
                 <QuickActionLink 
                   href="/dashboard/occupations" 
                   icon={Plus} 
                   label="Nouveau Dossier" 
                   color="blue" 
                 />
                 <QuickActionLink 
                   href="/dashboard/tiers" 
                   icon={Users} 
                   label="Ajouter un Tiers" 
                   color="emerald" 
                 />
                 <QuickActionLink 
                   href="/dashboard/carte" 
                   icon={MapPin} 
                   label="Consulter SIG" 
                   color="amber" 
                 />
              </div>
           </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-4">
               <h3 className="text-xl font-black text-slate-900 tracking-tight">Activité Récente</h3>
               <Link href="/dashboard/occupations" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Accéder au journal complet</Link>
            </div>
            
            <div className="space-y-4">
               {stats.recentDossiers?.map((dossier: any) => (
                 <div key={dossier.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between border-l-8 group hover:border-blue-500 transition-all hover:translate-x-1" 
                      style={{ borderLeftColor: STATUS_MAP[dossier.statut]?.color.includes('blue') ? '#3b82f6' : (STATUS_MAP[dossier.statut]?.color.includes('emerald') ? '#10b981' : '#f59e0b') }}>
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                          {dossier.type === 'COMMERCE' ? <Package size={20} /> : <MapPin size={20} />}
                       </div>
                       <div>
                          <div className="flex items-center gap-3">
                             <p className="font-black text-slate-900">{dossier.nom || `Dossier #${dossier.id}`}</p>
                             <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${STATUS_MAP[dossier.statut]?.bg} ${STATUS_MAP[dossier.statut]?.color} border border-black/5`}>
                               {STATUS_MAP[dossier.statut]?.label}
                             </span>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                             {dossier.tiers?.nom} • {dossier.adresse}
                          </p>
                       </div>
                    </div>
                    <div className="flex items-center gap-8">
                       <div className="text-right hidden sm:block">
                          <p className="text-[8px] font-black text-slate-300 uppercase leading-none mb-1">Date création</p>
                          <p className="text-xs font-black text-slate-400 uppercase">
                             {format(new Date(dossier.created_at), 'dd MMM yyyy', { locale: fr })}
                          </p>
                       </div>
                       <Link 
                         href={`/dashboard/occupations/${dossier.id}`}
                         className="p-3 bg-slate-50 text-slate-300 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                       >
                         <ChevronRight size={18} />
                       </Link>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Efficiency Widget / Info */}
         <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/20 space-y-8 h-fit">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                  <Info size={24} />
                </div>
                <div>
                   <h5 className="font-black text-slate-900 tracking-tight">Conseils Pilotage</h5>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Optimisation des recettes</p>
                </div>
            </div>
            
            <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
              "Vous avez actuellement <strong>{stats.pendingDossiers} dossiers en attente</strong>. Finaliser ces dossiers pourrait débloquer jusqu'à <strong>{(stats.potentialRevenue - stats.totalRevenue).toLocaleString()} €</strong> de redevances ODP supplémentaires."
            </p>

            <div className="pt-4">
               <div className="bg-blue-600 text-white p-6 rounded-[2rem] space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Collecte FILIEN</span>
                     <TrendingUp size={16} />
                  </div>
                  <h4 className="text-xl font-black">Prêt pour transfert</h4>
                  <p className="text-[9px] font-bold opacity-80 leading-relaxed">
                    Le prochain export Filien est prêt avec {stats.activeDossiers} dossiers éligibles à la facturation.
                  </p>
                  <Link href="/dashboard/occupations" className="block w-fit bg-white/20 hover:bg-white/30 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                    Lancer génération
                  </Link>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color, trend, percentage }: any) {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 shadow-blue-500/10',
    amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 shadow-amber-500/10',
    indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 shadow-indigo-500/10',
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 shadow-emerald-500/10',
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
      <div className="flex items-center justify-between relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:text-white transition-all duration-500 shadow-lg ${colorMap[color]}`}>
          <Icon size={28} className="group-hover:scale-110 transition-transform duration-500" />
        </div>
        {trend && (
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1 ${trend.includes('+') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
            {trend.includes('+') ? <ArrowUpRight size={12} /> : null}
            {trend}
          </div>
        )}
      </div>
      <div className="mt-8 relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
          {title.includes('Recettes') || title.includes('Annuel') ? ' €' : ''}
        </h3>
        {percentage !== undefined ? (
          <div className="mt-4 space-y-1.5">
             <div className="flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                <span>Avancement</span>
                <span>{percentage}%</span>
             </div>
             <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-1500 delay-500" style={{ width: `${percentage}%` }}></div>
             </div>
          </div>
        ) : (
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">{subtitle}</p>
        )}
      </div>
      <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
        <Icon size={160} />
      </div>
    </div>
  );
}

function QuickActionLink({ href, icon: Icon, label, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 hover:bg-amber-600 border-amber-100',
  };

  return (
    <Link 
      href={href}
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group hover:text-white hover:shadow-lg active:scale-95 ${colors[color]}`}
    >
      <div className={`p-2 rounded-xl bg-white shadow-sm group-hover:bg-white/20 group-hover:text-white transition-colors`}>
        <Icon size={18} />
      </div>
      <span className="text-xs font-black uppercase tracking-widest">{label}</span>
      <ArrowRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </Link>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xl space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-lg font-black text-slate-900">{payload[0].value.toLocaleString()} €</p>
        <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase">
          <ArrowUpRight size={12} /> Récupéré
        </div>
      </div>
    );
  }
  return null;
}
