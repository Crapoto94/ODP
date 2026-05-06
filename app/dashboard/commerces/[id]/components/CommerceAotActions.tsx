import React from 'react';
import { FileStack, FileText, Loader2, Send } from 'lucide-react';

interface Props {
  occupation: any;
  aotGabarits: any[];
  onSetAotGabarit: (occId: number, gabaritId: number | null) => void;
  onDownloadAot: (occId: number) => void;
  isGeneratingAot: boolean;
  onUploadAotFinal: () => void;
  onSendForSignature: () => void;
}

export default function CommerceAotActions({
  occupation,
  aotGabarits,
  onSetAotGabarit,
  onDownloadAot,
  isGeneratingAot,
  onUploadAotFinal,
  onSendForSignature
}: Props) {
  if (!occupation) return null;

  const isPrep = ['EN_COURS', 'PREP', 'PREPARATION_AOT'].includes(occupation.statut);
  if (!isPrep) return null;

  return (
    <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 md:p-10 text-slate-900 shadow-xl shadow-slate-200/50 relative overflow-hidden group mb-12 animate-in zoom-in-95 duration-500">
      {/* Subtle backdrop */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl group-hover:bg-indigo-100 transition-colors"></div>
      
      <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-10">
        <div className="space-y-6 text-center xl:text-left flex-1">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full">
            <FileStack size={14} className="text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Action administrative</span>
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight text-slate-900">Préparation de l'Arrêté</h3>
            <p className="text-slate-500 font-medium text-sm mt-2 leading-relaxed max-w-xl">
              Sélectionnez le gabarit réglementaire à utiliser pour générer l'AOT de ce commerce pour l'année {occupation.anneeTaxation}.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-full sm:w-auto min-w-[320px] space-y-2">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Modèle de gabarit</p>
               <select 
                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3.5 px-6 outline-none focus:border-indigo-400 focus:bg-white transition-all font-bold text-sm text-slate-900"
                 value={occupation.aotGabaritId || ''}
                 onChange={(e) => onSetAotGabarit(occupation.id, e.target.value ? parseInt(e.target.value) : null)}
               >
                 <option value="" disabled className="text-slate-400">Sélectionner un gabarit...</option>
                 {aotGabarits.map(g => (
                   <option key={g.id} value={g.id}>{g.nom}</option>
                 ))}
               </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 shrink-0 w-full xl:w-auto">
          <button
            onClick={() => onDownloadAot(occupation.id)}
            disabled={!occupation.aotGabaritId || isGeneratingAot}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-40 ${
              !occupation.aotGabaritId
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                : 'bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 shadow-indigo-100/50'
            }`}
          >
            {isGeneratingAot ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
            Générer AOT
          </button>

          <button
            onClick={onUploadAotFinal}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 bg-white border-2 border-amber-100 text-amber-600 hover:bg-amber-50 shadow-amber-100/50"
          >
            <FileStack size={18} />
            Ajouter AOT final
          </button>

          <button
            onClick={onSendForSignature}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 bg-white border-2 border-blue-100 text-blue-600 hover:bg-blue-50 shadow-blue-100/50"
          >
            <Send size={18} />
            Envoyer en signature
          </button>
        </div>
      </div>
    </div>
  );
}
