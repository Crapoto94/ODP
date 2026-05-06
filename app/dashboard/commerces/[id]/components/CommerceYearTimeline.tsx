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
    <div className="relative py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-slate-950 rounded-lg flex items-center justify-center text-white shadow-lg">
          <Clock size={20} />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Chronologie financière</h2>
          <p className="text-xs font-medium text-slate-500">Évolution par année</p>
        </div>
      </div>

      {/* Legend */}
      <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 mb-8 text-[9px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_4px_rgba(34,197,94,0.4)]"></div>
          <span className="font-black text-slate-600 uppercase">Nouveau</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
          <span className="font-black text-slate-600 uppercase">Reconduit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_4px_rgba(244,63,94,0.4)]"></div>
          <span className="font-black text-slate-600 uppercase">Supprimé</span>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        <div className="flex gap-6">
          {/* Left Column: Years */}
          <div className="flex flex-col gap-0 pt-2">
            {sortedYearsData.map((data, idx) => {
              const { year } = data;
              const isSelected = selectedYear === year;

              return (
                <div key={year} className="relative">
                  {/* Connecting line from year to timeline */}
                  <div className="absolute left-full top-1/2 w-4 h-0.5 bg-slate-300 -translate-y-1/2"></div>

                  {/* Year Button */}
                  <button
                    onClick={() => onSelectYear?.(year)}
                    className={`w-12 h-12 rounded-lg font-black text-sm transition-all duration-300 border-2 cursor-pointer hover:scale-105 mb-2 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-700 shadow-lg shadow-blue-500/30'
                        : 'bg-white text-slate-900 border-slate-300 hover:border-blue-500 hover:shadow-md'
                    }`}
                    title="Cliquer pour filtrer"
                  >
                    {year}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right Column: Timeline with amounts */}
          <div className="flex-1 relative pt-8 pb-2">
            {/* Horizontal timeline line */}
            <div className="absolute left-0 right-0 top-12 h-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 rounded-full"></div>

            {/* Timeline items */}
            <div className="relative flex flex-col gap-8">
              {sortedYearsData.map((data) => {
                const { totalMontant, items, activeItems } = data;

                return (
                  <div key={data.year} className="relative group flex items-start">
                    {/* Point on timeline */}
                    <div className="absolute left-0 top-12 w-3 h-3 bg-white border-2 border-slate-900 rounded-full -translate-x-1.5 -translate-y-1/2 shadow-sm"></div>

                    {/* Amount card above */}
                    <div className="ml-8 max-w-xs">
                      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all hover:border-blue-400 cursor-default group/card text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">Montant</p>
                            <p className="font-black text-slate-900">{totalMontant.toLocaleString('fr-FR')} €</p>
                            <p className="text-[8px] text-slate-400 font-medium mt-1">
                              {(() => {
                                const units = activeItems.reduce((acc: any, curr: any) => {
                                  const u = curr.unite || 'unité';
                                  acc[u] = (acc[u] || 0) + (curr.count || 0);
                                  return acc;
                                }, {});
                                const entries = Object.entries(units);
                                if (entries.length === 0) return 'Vide';
                                if (entries.length === 1) return `${entries[0][1]} ${entries[0][0]}`;
                                return `${activeItems.length} dispositifs`;
                              })()}
                            </p>
                          </div>
                          <Info size={16} className="text-slate-400 group-hover/card:text-blue-600 transition-colors flex-shrink-0 mt-0.5" />
                        </div>

                        {/* Details on hover */}
                        <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-300 group-hover/card:max-h-80 group-hover/card:opacity-100 mt-2 pt-2 border-t border-slate-200">
                          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                            {items.length === 0 ? (
                              <p className="text-[8px] text-slate-500 italic">Aucun dispositif</p>
                            ) : (
                              items.map((item, iidx) => (
                                <div key={iidx} className="flex items-start gap-1.5 py-0.5 text-[8px]">
                                  <div className={`w-1 h-1 rounded-full mt-1 flex-shrink-0 ${
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
      </div>
    </div>
  );
}
