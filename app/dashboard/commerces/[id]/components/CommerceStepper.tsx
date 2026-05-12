import React from 'react';
import {
  FileEdit,
  Search,
  FileStack,
  PlayCircle,
  CheckCircle2,
  CreditCard,
  Lock,
  Archive,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface Props {
  totalAmount: number;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => Promise<void>;
  isUpdating?: boolean;
  isReadOnly?: boolean;
  stepDates?: Record<string, string | null>;
}

const PROCESS_STEPS = [
  { id: 'INIT', label: 'Initialisation', icon: FileEdit },
  { id: 'INST', label: 'Instruction', icon: Search },
  { id: 'PREP', label: 'Préparation AOT', icon: FileStack },
  { id: 'EN_COURS', label: 'En cours', icon: PlayCircle },
  { id: 'VALIDE', label: 'Validé', icon: CheckCircle2 },
  { id: 'FACTURE', label: 'Facturé', icon: CreditCard },
  { id: 'TITRE', label: 'Titré', icon: CheckCircle2 },
  { id: 'CLOS', label: 'Clos', icon: Lock },
];

export default function CommerceStepper({
  totalAmount,
  currentStatus,
  onStatusChange,
  isUpdating = false,
  isReadOnly = false,
  stepDates = {}
}: Props) {
  // Map commerce statuts to step IDs
  const mapCurrentStatus = (status: string): string => {
    if (!status) return 'INIT';
    if (status === 'INITIALISATION' || status === 'EN_ATTENTE') return 'INIT';
    if (status === 'INSTRUCTION' || status === 'INST') return 'INST';
    if (status === 'PREPARATION_AOT' || status === 'PREP') return 'PREP';
    if (status === 'EN_COURS') return 'EN_COURS';
    if (status === 'VALIDÉ' || status === 'VALIDE' || status === 'VERIFIE') return 'VALIDE';
    if (status === 'FACTURÉ' || status === 'FACTURE') return 'FACTURE';
    if (status === 'TITRÉ' || status === 'TITRE') return 'TITRE';
    if (status === 'CLOS' || status === 'PAYÉ' || status === 'PAYE') return 'CLOS';
    return status;
  };

  const mapIdToStatus = (id: string): string => {
    const mapping: Record<string, string> = {
      'INIT': 'INITIALISATION',
      'INST': 'INSTRUCTION',
      'PREP': 'PREPARATION_AOT',
      'EN_COURS': 'EN_COURS',
      'VALIDE': 'VALIDÉ',
      'FACTURE': 'FACTURÉ',
      'TITRE': 'TITRÉ',
      'CLOS': 'CLOS'
    };
    return mapping[id] || id;
  };

  const normalizedStatus = mapCurrentStatus(currentStatus);
  const currentIdx = PROCESS_STEPS.findIndex(s => s.id === normalizedStatus);

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const getStepDate = (stepId: string): string | null => {
    const dateField = `date${stepId}`;
    return stepDates[dateField] || null;
  };

  const handlePrevious = async () => {
    if (currentIdx > 0 && onStatusChange) {
      const prevStep = PROCESS_STEPS[currentIdx - 1];
      const newStatus = mapIdToStatus(prevStep.id);
      await onStatusChange(newStatus);
    }
  };

  const handleNext = async () => {
    if (currentIdx < PROCESS_STEPS.length - 1 && onStatusChange) {
      const nextStep = PROCESS_STEPS[currentIdx + 1];
      const newStatus = mapIdToStatus(nextStep.id);
      await onStatusChange(newStatus);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-[10rem] -mr-32 -mt-32 opacity-50 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Flux Dossier Commerce</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Progression des étapes réglementaires</p>
            </div>
            <div className="flex gap-3">
              <div className="px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
                <span className="text-[8px] font-black text-blue-600 uppercase tracking-[0.2em]">Étape {currentIdx + 1} / {PROCESS_STEPS.length}</span>
              </div>
              {totalAmount > 0 && (
                <div className="px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
                  <span className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.2em]">{totalAmount.toFixed(2)} €</span>
                </div>
              )}
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
                    {getStepDate(step.id) && (
                      <p className="text-[7px] text-slate-400 mt-1">
                        {formatDate(getStepDate(step.id))}
                      </p>
                    )}
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

          {/* Navigation Buttons */}
          {onStatusChange && !isReadOnly && (
            <div className="flex gap-3 mt-8 justify-center">
              {currentIdx > 0 && (
                <button
                  onClick={handlePrevious}
                  disabled={isUpdating}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg font-bold text-sm transition-all disabled:cursor-not-allowed"
                  title="Étape précédente"
                >
                  <ChevronLeft size={18} />
                  Précédent
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={currentIdx >= 4 || isUpdating}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-all disabled:cursor-not-allowed"
                title={currentIdx >= 4 ? 'Navigation bloquée - poursuite via facturation' : 'Étape suivante'}
              >
                Suivant
                {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
