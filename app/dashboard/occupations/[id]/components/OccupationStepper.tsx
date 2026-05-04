import React from 'react';
import { 
  FileEdit, 
  Search, 
  FileStack, 
  PlayCircle, 
  CheckCircle2, 
  CreditCard, 
  Lock
} from 'lucide-react';
import { getStatusConfig } from '../../../../../lib/status-utils';

interface Props {
  type: string;
  currentStatus: string;
}

const PROCESS_STEPS = [
  { id: 'INIT', label: 'Initialisation', icon: FileEdit },
  { id: 'INST', label: 'Instruction', icon: Search },
  { id: 'PREP', label: 'Préparation AOT', icon: FileStack },
  { id: 'EN_COURS', label: 'En cours', icon: PlayCircle },
  { id: 'VALIDE', label: 'Validé', icon: CheckCircle2 },
  { id: 'FACTURE', label: 'Facturé', icon: CreditCard },
  { id: 'CLOS', label: 'Clos', icon: Lock },
];

const TITLES = {
  CHANTIER: 'Flux Dossier Chantier',
  TOURNAGE: 'Flux Dossier Tournage',
};

const SUBTITLES = {
  CHANTIER: 'Progression des étapes réglementaires',
  TOURNAGE: 'Progression des étapes réglementaires',
};

export default function OccupationStepper({ type, currentStatus }: Props) {
  if (type !== 'CHANTIER' && type !== 'TOURNAGE') return null;

  const currentIdx = PROCESS_STEPS.findIndex(s =>
    s.id === currentStatus ||
    (currentStatus === 'INITIALISATION' && s.id === 'INIT') ||
    (currentStatus === 'EN_ATTENTE' && s.id === 'INIT') ||
    (currentStatus === 'VERIFIE' && s.id === 'VALIDE') ||
    (currentStatus === 'PAYE' && s.id === 'CLOS')
  );

  const title = TITLES[type as keyof typeof TITLES] || 'Flux Dossier';
  const subtitle = SUBTITLES[type as keyof typeof SUBTITLES] || 'Progression des étapes';

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-[10rem] -mr-32 -mt-32 opacity-50 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">{title}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>
            </div>
            <div className="px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
              <span className="text-[8px] font-black text-blue-600 uppercase tracking-[0.2em]">Étape {currentIdx + 1} / {PROCESS_STEPS.length}</span>
            </div>
          </div>

          <div className="flex items-center justify-between relative mt-4">
            {/* Progress Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                style={{ width: `${(currentIdx / (PROCESS_STEPS.length - 1)) * 100}%` }}
              ></div>
            </div>

            {PROCESS_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              const isFuture = idx > currentIdx;
              const config = getStatusConfig('CHANTIER', step.id);

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center group">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-4 ${
                      isPast ? 'bg-emerald-600 text-white border-white shadow-lg' :
                      isCurrent ? 'bg-white text-blue-600 border-blue-600 shadow-2xl scale-125' :
                      'bg-white text-slate-300 border-slate-100 group-hover:border-slate-300'
                    }`}
                  >
                    {isPast ? <CheckCircle2 size={24} /> : <Icon size={24} />}
                  </div>

                  <div className={`mt-6 text-center transition-all duration-500 ${isCurrent ? 'opacity-100 scale-110 translate-y-2' : 'opacity-60 scale-90'}`}>
                    <p className={`text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${isCurrent ? 'text-blue-600' : 'text-slate-500'}`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <div className="mt-1 w-1.5 h-1.5 bg-blue-600 rounded-full mx-auto animate-bounce"></div>
                    )}
                  </div>

                  {/* Tooltip on hover */}
                  {!isCurrent && (
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 pointer-events-none">
                       <div className="bg-slate-900 text-white text-[8px] font-black px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl uppercase tracking-widest">
                          {step.label}
                       </div>
                       <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Fil d'Ariane / Breadcrumb */}
          <div className="mt-12 pt-8 border-t border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mr-4">Parcours :</p>
              {PROCESS_STEPS.map((step, idx) => {
                const isPast = idx < currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <div key={step.id} className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      isPast ? 'bg-emerald-50 border border-emerald-200' :
                      isCurrent ? 'bg-blue-50 border border-blue-300 font-black' :
                      'bg-slate-50 border border-slate-200'
                    }`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isPast ? 'bg-emerald-600 text-white' :
                        isCurrent ? 'bg-blue-600 text-white' :
                        'bg-slate-300'
                      }`}>
                        {isPast ? (
                          <CheckCircle2 size={12} />
                        ) : isCurrent ? (
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                        ) : null}
                      </div>
                      <span className={`text-[7px] font-black uppercase tracking-widest whitespace-nowrap ${
                        isPast ? 'text-emerald-700' :
                        isCurrent ? 'text-blue-700' :
                        'text-slate-500'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {idx < PROCESS_STEPS.length - 1 && (
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        idx < currentIdx ? 'bg-emerald-400' : 'bg-slate-300'
                      }`}></div>
                    )}
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
