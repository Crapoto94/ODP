import React, { useState } from 'react';
import { X, Loader2, RotateCcw, Check, CreditCard } from 'lucide-react';

interface YearStatus {
  year: number;
  status: string;
  amount: number;
  billedPercentage: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (annees: number[]) => Promise<void>;
  isLoading: boolean;
  chartData: YearStatus[];
}

const BILLED_STATUSES = [
  'FACTURE', 'FACTURÉ',
  'TITRE', 'TITRÉ',
  'PAYE', 'PAYÉ',
  'CLOS'
];

function statusLabel(s: string): string {
  if (s === 'FACTURE' || s === 'FACTURÉ') return 'Facturé';
  if (s === 'TITRE' || s === 'TITRÉ') return 'Titré';
  if (s === 'PAYE' || s === 'PAYÉ') return 'Payé';
  if (s === 'CLOS') return 'Clos';
  if (s === 'VALIDE' || s === 'VALIDÉ') return 'Validé';
  if (s === 'VERIFIE') return 'Vérifié';
  if (s === 'MIXED') return 'Mixte';
  return s;
}

function statusColor(s: string): string {
  if (BILLED_STATUSES.includes(s)) return 'bg-amber-100 text-amber-700';
  if (s === 'VALIDE' || s === 'VALIDÉ') return 'bg-emerald-100 text-emerald-700';
  return 'bg-slate-100 text-slate-600';
}

export default function CommerceDefacturerModal(props: Props) {
  if (!props.isOpen) return null;
  return <DefacturerModalContent {...props} />;
}

function DefacturerModalContent({ onClose, onConfirm, isLoading, chartData = [] }: Omit<Props, 'isOpen'>) {
  const billableYears = chartData
    .filter(d => BILLED_STATUSES.includes(d.status))
    .sort((a, b) => a.year - b.year);

  const [selectedYears, setSelectedYears] = useState<number[]>(() => billableYears.map(d => d.year));

  const toggleYear = (year: number) => {
    setSelectedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  const selectAll = () => setSelectedYears(billableYears.map(d => d.year));
  const selectNone = () => setSelectedYears([]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
              <RotateCcw size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Défacturer</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Remettre des années en étape « Validé »
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6 flex-1 overflow-y-auto">
          {billableYears.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CreditCard size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold text-sm">Aucune année facturée pour ce commerce</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Sélectionnez les années à défacturer
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest cursor-pointer"
                  >
                    Tout cocher
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={selectNone}
                    className="text-[10px] font-black text-slate-400 hover:text-slate-600 hover:underline uppercase tracking-widest cursor-pointer"
                  >
                    Tout décocher
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {billableYears.map(d => {
                  const isSelected = selectedYears.includes(d.year);
                  return (
                    <button
                      key={d.year}
                      onClick={() => toggleYear(d.year)}
                      className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 bg-amber-50 shadow-sm'
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'border-slate-200 bg-white'
                      }`}>
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black text-slate-900">{d.year}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColor(d.status)}`}>
                            {statusLabel(d.status)}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          {d.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € TTC
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-slate-300 uppercase">{d.billedPercentage}%</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50/30 shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-4 text-slate-700 border border-slate-200 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={() => onConfirm(selectedYears)}
              disabled={isLoading || selectedYears.length === 0 || billableYears.length === 0}
              className="flex-[2] px-8 py-4 bg-amber-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-amber-600/20 hover:bg-amber-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <RotateCcw size={18} />
                  Défacturer {selectedYears.length > 0 && `(${selectedYears.length} année${selectedYears.length > 1 ? 's' : ''})`}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}