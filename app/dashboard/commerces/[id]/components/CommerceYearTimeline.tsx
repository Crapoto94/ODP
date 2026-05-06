import React from 'react';
import { Clock, Info } from 'lucide-react';

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

  return (
    <div className="relative py-12">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <Clock size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Chronologie financière</h2>
          <p className="text-sm font-medium text-slate-500">Évolution de l'occupation et des montants</p>
        </div>
      </div>

      {/* Legend */}
      <div className="hidden sm:flex items-center gap-6 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 mb-12">
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

      {/* Timeline Container */}
      <div className="relative pt-20 pb-20">
        {/* Central Timeline Line */}
        <div className="absolute left-0 right-0 top-1/2 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 -translate-y-1/2 rounded-full"></div>

        {/* Timeline Items */}
        <div className="relative flex justify-between items-center">
          {sortedYearsData.map((data, idx) => {
            const { year, totalMontant, items, activeItems } = data;
            const isAbove = idx % 2 === 0; // Alternate above/below

            return (
              <div key={year} className="flex flex-col items-center flex-1 group">
                {/* Top Event (if above) */}
                {isAbove && (
                  <div className="mb-8 relative">
                    <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all hover:border-blue-400 cursor-default max-w-[140px]">
                      <div className="text-center">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Montant</p>
                        <p className="text-sm font-black text-slate-900">{totalMontant.toLocaleString('fr-FR')} €</p>
                        <p className="text-[9px] text-slate-400 font-medium mt-2">
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
                        </p>
                      </div>
                      {/* Arrow down to timeline */}
                      <div className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 w-0.5 h-4 bg-slate-200"></div>
                    </div>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-80 bg-slate-950 rounded-2xl p-4 text-white shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-[100] border border-white/10">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Année {year}</h4>
                        <Info size={14} className="text-white" />
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 text-xs">
                        {items.length === 0 ? (
                          <p className="text-slate-500 italic">Aucun dispositif</p>
                        ) : (
                          items.map((item, iidx) => (
                            <div key={iidx} className="flex items-start gap-2 py-1 border-b border-white/5 last:border-0">
                              <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                                item.status === 'nouveau' ? 'bg-green-500' :
                                item.status === 'supprimé' ? 'bg-rose-500' : 'bg-slate-400'
                              }`}></div>
                              <div className="min-w-0">
                                <p className="text-slate-200 font-bold">{item.designation || item.nom}</p>
                                <p className="text-slate-400">{item.count} {item.unite}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline Point */}
                <div className="relative z-10 mb-8">
                  <div className="w-16 h-16 bg-white border-4 border-slate-900 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 group-hover:scale-125 group-hover:border-blue-500 group-hover:shadow-blue-500/30">
                    <span className="text-base font-black text-slate-900 group-hover:text-blue-600">{year}</span>
                  </div>
                </div>

                {/* Bottom Event (if below) */}
                {!isAbove && (
                  <div className="mt-8 relative">
                    <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all hover:border-blue-400 cursor-default max-w-[140px]">
                      <div className="text-center">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Montant</p>
                        <p className="text-sm font-black text-slate-900">{totalMontant.toLocaleString('fr-FR')} €</p>
                        <p className="text-[9px] text-slate-400 font-medium mt-2">
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
                        </p>
                      </div>
                      {/* Arrow up to timeline */}
                      <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 w-0.5 h-4 bg-slate-200"></div>
                    </div>

                    {/* Tooltip on hover */}
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-80 bg-slate-950 rounded-2xl p-4 text-white shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 -translate-y-2 group-hover:translate-y-0 z-[100] border border-white/10">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Année {year}</h4>
                        <Info size={14} className="text-white" />
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 text-xs">
                        {items.length === 0 ? (
                          <p className="text-slate-500 italic">Aucun dispositif</p>
                        ) : (
                          items.map((item, iidx) => (
                            <div key={iidx} className="flex items-start gap-2 py-1 border-b border-white/5 last:border-0">
                              <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                                item.status === 'nouveau' ? 'bg-green-500' :
                                item.status === 'supprimé' ? 'bg-rose-500' : 'bg-slate-400'
                              }`}></div>
                              <div className="min-w-0">
                                <p className="text-slate-200 font-bold">{item.designation || item.nom}</p>
                                <p className="text-slate-400">{item.count} {item.unite}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
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
