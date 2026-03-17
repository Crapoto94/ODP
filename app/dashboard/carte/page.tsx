"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Layers, Map as MapIcon, Loader2, Package, MapPin, Info } from 'lucide-react';

const SigMap = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initialisation SIG...</p>
    </div>
  )
});

export default function CartePage() {
  const [occupations, setOccupations] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showTiers, setShowTiers] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get('/api/occupations'),
      axios.get('/api/tiers/map')
    ]).then(([occRes, tierRes]) => {
      setOccupations(occRes.data);
      setTiers(tierRes.data);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Carte SIG Live</h2>
          <p className="text-slate-500 font-medium tracking-wide">Visualisation géographique des occupations</p>
        </div>
        <div className="flex gap-4">
           {!loading && (
             <div className="flex items-center gap-3">
               <button
                 onClick={() => setShowTiers(!showTiers)}
                 className={`flex items-center gap-3 px-4 py-2 rounded-xl border font-bold text-xs transition-all ${
                   showTiers 
                     ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                     : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                 }`}
               >
                 <Package size={14} />
                 <span>Voir les Tiers</span>
                 <span className={`px-2 py-0.5 rounded-lg text-[10px] ${showTiers ? 'bg-white/20' : 'bg-slate-100'}`}>
                   {tiers.length}
                 </span>
               </button>
               <div className="w-px h-8 bg-slate-200 mx-2" />
               {[
                 { type: 'COMMERCE', label: 'Commerces', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
                 { type: 'CHANTIER', label: 'Chantiers', icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                 { type: 'TOURNAGE', label: 'Tournages', icon: Info, color: 'text-amber-600', bg: 'bg-amber-50' },
               ].map((cat) => {
                 const catTotal = occupations
                   .filter(o => o.type === cat.type)
                   .reduce((sum, o) => sum + (o.lignes?.reduce((s: number, l: any) => s + (l.montant || 0), 0) || o.montantCalcule || 0), 0);
                 
                 return (
                   <button
                     key={cat.type}
                     onClick={() => setTypeFilter(typeFilter === cat.type ? 'ALL' : cat.type)}
                     className={`flex items-center gap-3 px-4 py-2 rounded-xl border font-bold text-xs transition-all ${
                       typeFilter === cat.type 
                         ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                         : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200'
                     }`}
                   >
                     <cat.icon size={14} />
                     <span>{cat.label}</span>
                     <span className={`px-2 py-0.5 rounded-lg text-[10px] ${typeFilter === cat.type ? 'bg-white/20' : 'bg-slate-100'}`}>
                       {catTotal.toLocaleString('fr-FR')} €
                     </span>
                   </button>
                 );
               })}
             </div>
           )}
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
            <Layers size={16} /> Couches
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[500px] bg-white rounded-[3rem] shadow-2xl relative overflow-hidden border border-slate-100">
        {loading ? (
             <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 gap-4">
               <Loader2 className="animate-spin text-blue-600" size={40} />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initialisation SIG...</p>
             </div>
        ) : (
          <SigMap 
            occupations={typeFilter === 'ALL' ? occupations : occupations.filter(o => o.type === typeFilter)} 
            tiers={showTiers ? tiers : []}
          />
        )}
      </div>
    </div>
  );
}
