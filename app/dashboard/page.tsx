"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  Euro, 
  Users, 
  FileText, 
  TrendingUp, 
  ArrowUpRight, 
  ChevronRight,
  Download,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const downloadExport = () => {
    window.location.href = '/api/export-csv';
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tableau de Bord</h2>
          <p className="text-slate-500 font-medium tracking-wide">Suivi financier et opérationnel de l'occupation du domaine public</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-white border border-slate-200 rounded-2xl px-6 py-3 flex items-center gap-3 shadow-sm">
              <Calendar size={18} className="text-slate-400" />
              <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Mars 2026</span>
           </div>
           <button 
             onClick={downloadExport}
             className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-900/10"
           >
             <Download size={18} />
             Export Compta
           </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all border-b-4 border-b-blue-600">
           <div className="flex items-center justify-between relative z-10">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                <Euro size={28} />
              </div>
              <div className="flex items-center gap-1 text-emerald-500 font-black text-xs">
                 <ArrowUpRight size={14} /> +12.5%
              </div>
           </div>
           <div className="mt-6 relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recettes Validées</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter mt-1">{stats.totalRevenue.toLocaleString('fr-FR')} €</h3>
              <p className="text-[10px] font-bold text-blue-500 mt-2 uppercase tracking-widest bg-blue-50 w-fit px-2 py-1 rounded-md">
                Potentiel: {stats.potentialRevenue.toLocaleString('fr-FR')} €
              </p>
           </div>
           <div className="absolute -bottom-4 -right-4 opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform duration-700">
              <Euro size={160} />
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all border-b-4 border-b-amber-500">
           <div className="flex items-center justify-between relative z-10">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all duration-500">
                <FileText size={28} />
              </div>
           </div>
           <div className="mt-6 relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dossiers Actifs</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter mt-1">{stats.activeDossiers}</h3>
              <p className="text-[10px] font-bold text-amber-600 mt-2 uppercase tracking-widest bg-amber-50 w-fit px-2 py-1 rounded-md">
                En attente: {stats.pendingDossiers}
              </p>
           </div>
           <div className="absolute -bottom-4 -right-4 opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform duration-700">
              <FileText size={160} />
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all border-b-4 border-b-emerald-600">
           <div className="flex items-center justify-between relative z-10">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                <Users size={28} />
              </div>
           </div>
           <div className="mt-6 relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiers Référencés</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter mt-1">{stats.tiersCount}</h3>
           </div>
           <div className="absolute -bottom-4 -right-4 opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform duration-700">
              <Users size={160} />
           </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
             <div>
                <h4 className="font-black text-slate-900 text-lg tracking-tight">Évolution des Recettes</h4>
                <p className="text-xs font-medium text-slate-400">Montants nets perçus sur les 6 derniers mois</p>
             </div>
             <TrendingUp size={24} className="text-blue-600" />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyStats}>
                <defs>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ stroke: '#2563eb', strokeWidth: 2 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="redevance" 
                  stroke="#2563eb" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorRec)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl space-y-8 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-10">
              <TrendingUp size={120} />
           </div>
           <div className="relative z-10 flex items-center justify-between">
              <div>
                <h4 className="font-black text-lg tracking-tight">Répartition par Type</h4>
                <p className="text-xs font-medium text-white/40">Dossiers validés ce mois-ci</p>
              </div>
           </div>
           
           <div className="space-y-6 relative z-10">
              {[
                { label: 'Terrasses / Commerce', value: 65, color: 'bg-blue-500' },
                { label: 'Chantiers / Travaux', value: 25, color: 'bg-amber-500' },
                { label: 'Événementiel / Tournages', value: 10, color: 'bg-rose-500' },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                   <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                      <span>{item.label}</span>
                      <span>{item.value}%</span>
                   </div>
                   <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.value}%` }}></div>
                   </div>
                </div>
              ))}
           </div>

           <div className="pt-8 relative z-10">
              <button className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all">
                Détail des calculs par zone <ChevronRight size={14} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
