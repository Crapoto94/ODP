import React from 'react';
import { Clock, Info } from 'lucide-react';

interface Props {
  years: number[];
  getDispositivesTimeline: () => Record<number, any[]>;
  selectedYear?: number;
  onSelectYear?: (year: number) => void;
}

export default function CommerceYearTimeline({ years, getDispositivesTimeline, selectedYear, onSelectYear }: Props) {
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
      <div className="relative">
        {/* Timeline Items */}
        <div className="space-y-8">
          {sortedYearsData.map((data, idx) => {
            const { year, totalMontant, items, activeItems } = data;
            const isSelected = selectedYear === year;

            return (
              <div key={year} className="relative group flex items-start gap-6">
                {/* Timeline Line and Point */}
                <div className="flex flex-col items-center">
                  {/* Point */}
                  <button
                    onClick={() => onSelectYear?.(year)}
                    className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center font-black text-base transition-all duration-300 border-4 cursor-pointer hover:scale-110 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-700 shadow-blue-500/30'
                        : 'bg-white text-slate-900 border-slate-900 hover:border-blue-500 hover:shadow-blue-500/20'
                    }`}
                    title="Cliquer pour filtrer par année"
                  >
                    {year}
                  </button>

                  {/* Vertical line (not on last item) */}
                  {idx < sortedYearsData.length - 1 && (
                    <div className="w-1 h-12 bg-gradient-to-b from-slate-300 to-slate-200 mt-2"></div>
                  )}
                </div>

                {/* Event Card */}
                <div className="flex-1 pt-2">
                  <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all hover:border-blue-400 cursor-default group/card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Montant annuel</p>
                        <p className="text-lg font-black text-slate-900">{totalMontant.toLocaleString('fr-FR')} €</p>
                      </div>
                      <Info size={18} className="text-slate-400 group-hover/card:text-blue-600 transition-colors" />
                    </div>

                    <p className="text-[9px] text-slate-500 font-medium">
                      {(() => {
                        const units = activeItems.reduce((acc: any, curr: any) => {
                          const u = curr.unite || 'unité';
                          acc[u] = (acc[u] || 0) + (curr.count || 0);
                          return acc;
                        }, {});
                        const entries = Object.entries(units);
                        if (entries.length === 0) return 'Aucun dispositif';
                        if (entries.length === 1) return `${entries[0][1]} ${entries[0][0]}`;
                        return `${activeItems.length} dispositifs`;
                      })()}
                    </p>

                    {/* Details on hover */}
                    <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-300 group-hover/card:max-h-96 group-hover/card:opacity-100 mt-3 pt-3 border-t border-slate-200">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2">Détails</p>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
                        {items.length === 0 ? (
                          <p className="text-[9px] text-slate-500 italic">Aucun dispositif enregistré</p>
                        ) : (
                          items.map((item, iidx) => (
                            <div key={iidx} className="flex items-start gap-2 py-1 text-[9px]">
                              <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                                item.status === 'nouveau' ? 'bg-green-500' :
                                item.status === 'supprimé' ? 'bg-rose-500' : 'bg-slate-400'
                              }`}></div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900">{item.designation || item.nom}</p>
                                <p className="text-slate-500">{item.count} {item.unite}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
