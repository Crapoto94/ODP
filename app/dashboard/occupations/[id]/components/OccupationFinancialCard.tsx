import React from 'react';
import { Euro, Loader2, Download } from 'lucide-react';

interface Props {
  totalAmount: number;
  generatingPdf: boolean;
  onDownloadFacture: () => void;
}

export default function OccupationFinancialCard({ 
  totalAmount, 
  generatingPdf, 
  onDownloadFacture 
}: Props) {
  return (
    <div className="w-full lg:w-[260px] shrink-0">
      <div className="bg-slate-950 rounded-[2rem] p-5 text-white relative overflow-hidden group/wallet shadow-xl transition-all hover:shadow-2xl flex flex-col justify-center border border-white/5">
        <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover/wallet:scale-110 group-hover/wallet:-rotate-12 transition-all duration-700">
          <Euro size={120} className="text-white" />
        </div>
        <div className="relative z-10 flex flex-col gap-5">
          <div>
            <p className="text-slate-500 font-black text-[8px] uppercase tracking-widest mb-1.5 opacity-80">Redevance Totale TTC</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tighter tabular-nums text-white">
                {totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm font-black text-blue-400">€</span>
            </div>
          </div>
          
          <button 
            onClick={onDownloadFacture}
            disabled={generatingPdf}
            className="w-full bg-white text-slate-950 hover:bg-blue-50 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {generatingPdf ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {generatingPdf ? 'Génération...' : 'Facture PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
