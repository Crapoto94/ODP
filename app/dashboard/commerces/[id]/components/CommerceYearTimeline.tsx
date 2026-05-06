import React from 'react';
import { Clock, Info, ArrowRight } from 'lucide-react';

interface Props {
  years: number[];
  getDispositivesTimeline: () => Record<number, any[]>;
}

export default function CommerceYearTimeline({ years, getDispositivesTimeline }: Props) {
  if (years.length === 0) return null;
  const timelineData = getDispositivesTimeline();
  const sortedYears = Object.keys(timelineData).map(Number).sort((a, b) => a - b);

  const sortedYearsData = sortedYears.map(year => {
    const items = timelineData[year] || [];
    const activeItems = items.filter(i => i.status !== 'supprimé');
    const totalMontant = activeItems.reduce((sum, i) => sum + (i.montant || 0), 0);
    return { year, totalMontant, items, activeItems };
  });

  const maxAmount = Math.max(...sortedYearsData.map(d => d.totalMontant), 1);

  return (
    <div className="relative pt-4 pb-8">

      <div className="flex items-center justify-between mb-10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Clock size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Chronologie financière</h2>
            <p className="text-sm font-medium text-slate-500">Évolution de l'occupation et des montants</p>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center gap-6 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Nouveau</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-slate-400 rounded-full"></div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Reconduit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Supprimé</span>
          </div>
        </div>
      </div>

      <div className="relative pt-12 pb-8">
        {/* SVG Curve Background */}
        <div className="absolute top-0 left-0 w-full h-full hidden md:block pointer-events-none pr-8">
          <svg className="w-full h-48 overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path
              d={(() => {
                const step = 100 / (sortedYearsData.length - 1);
                return sortedYearsData.map((d, i) => {
                  const x = i * step;
                  const y = 80 - (d.totalMontant / maxAmount) * 60; // Max height 60px, baseline at 80px
                  return `${i === 0 ? 'M' : 'L'} ${x}% ${y}`;
                }).join(' ');
              })()}
              fill="none"
              stroke="url(#curveGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-draw-curve"
              style={{ filter: 'drop-shadow(0 4px 6px rgba(59,130,246,0.1))' }}
            />
            {/* Fill Area */}
            <path
              d={(() => {
                const step = 100 / (sortedYearsData.length - 1);
                const points = sortedYearsData.map((d, i) => {
                  const x = i * step;
                  const y = 80 - (d.totalMontant / maxAmount) * 60;
                  return `${x}% ${y}`;
                });
                return `M 0% 120 L ${points.join(' L ')} L 100% 120 Z`;
              })()}
              fill="url(#curveGradient)"
              className="opacity-10"
            />
          </svg>
        </div>

        <div className="flex flex-col md:flex-row justify-start items-center gap-12 md:gap-16 relative z-10">
          {sortedYearsData.map((data, idx) => {
            const { year, totalMontant, items, activeItems } = data;
            const yOffset = - (totalMontant / maxAmount) * 40; // Float the points slightly
            
            return (
              <div 
                key={year} 
                className="relative group w-full md:w-auto flex flex-col items-center transition-transform duration-500"
                style={{ transform: `translateY(${yOffset}px)` }}
              >
                {/* Year Point */}
                <div className="relative z-10 w-20 h-20 bg-white rounded-[2rem] border-4 border-slate-50 shadow-xl flex flex-col items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:border-blue-500 group-hover:shadow-blue-500/20 cursor-default overflow-hidden">
                  <span className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">{year}</span>
                  <div className="h-1 w-8 bg-slate-100 rounded-full mt-1 group-hover:bg-blue-100 transition-colors"></div>
                </div>

                {/* Amount Display */}
                <div className="mt-6 text-center">
                  <div className="bg-slate-950 text-white px-3 py-1 rounded-full mb-2 inline-block shadow-lg">
                    <p className="text-[10px] font-black tabular-nums">{totalMontant.toLocaleString('fr-FR')} €</p>
                  </div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mt-0.5">
                    {(() => {
                      const units = activeItems.reduce((acc: any, curr: any) => {
                        const u = curr.unite || 'unité';
                        acc[u] = (acc[u] || 0) + (curr.count || 0);
                        return acc;
                      }, {});
                      const entries = Object.entries(units);
                      if (entries.length === 0) return 'Dossier vide';
                      if (entries.length === 1) return `${entries[0][1]} ${entries[0][0]}`;
                      return `${activeItems.length} dispositifs`;
                    })()}
                  </div>
                </div>

                {/* Tooltip Content remains same but adapted */}
                <div className="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 w-96 bg-slate-950 rounded-3xl p-5 text-white shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 translate-y-4 group-hover:translate-y-0 z-[100] border border-white/10 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Détails de l'année</h4>
                      <p className="text-base font-black mt-0.5">{year}</p>
                    </div>
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                      <Info size={14} className="text-white" />
                    </div>
                  </div>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                    {items.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Aucun dispositif enregistré</p>
                    ) : (
                      items.map((item, iidx) => (
                        <div key={iidx} className="flex items-start justify-between py-1.5 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 -mx-2 rounded-lg transition-colors">
                          <div className="flex items-start gap-2.5 min-w-0 pt-0.5">
                            <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                              item.status === 'nouveau' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]' : 
                              item.status === 'supprimé' ? 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.6)]' : 'bg-slate-400'
                            }`}></div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-200 leading-tight">{item.designation || item.nom}</p>
                              <p className="text-[9px] text-slate-400 font-medium mt-0.5">{item.count} {item.unite || 'unité(s)'}</p>
                            </div>
                          </div>
                          <p className="text-[10px] font-black text-slate-300 ml-2 pt-0.5">{(item.montant || 0).toFixed(2)} €</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Annuel</span>
                    <span className="text-xs font-black text-white">{totalMontant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                  </div>
                  <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950 rotate-45 border-r border-b border-white/10"></div>
                </div>

                {idx < sortedYearsData.length - 1 && (
                  <div className="md:hidden my-6 text-slate-200">
                    <ArrowRight size={20} className="rotate-90" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
