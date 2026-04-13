import React from 'react';
import { Pencil, AlertCircle, FileStack, CheckCircle2, ArrowRight } from 'lucide-react';

interface Props {
  occupation: any;
  isFactured: boolean;
  isLocked: boolean;
  onEditClick: () => void;
  onNextStep?: (statut: string) => void;
  onPrevStep?: () => void;
  onValidateDemand?: () => void;
  onToggleVerifie?: () => void;
}

export default function OccupationActionsBar({
  occupation,
  isFactured,
  isLocked,
  onEditClick,
  onNextStep,
  onPrevStep,
  onValidateDemand,
  onToggleVerifie
}: Props) {
  const isInit = occupation.type === 'CHANTIER' && (occupation.statut === 'INIT' || occupation.statut === 'INITIALISATION' || occupation.statut === 'EN_ATTENTE');
  const isInst = occupation.statut === 'INST';
  const isPrep = occupation.statut === 'PREP' || occupation.statut === 'PREPARATION_AOT';
  const isEnCours = occupation.statut === 'EN_COURS';

  // Ne pas afficher si facturé ou locked (except pour unlock)
  if (isFactured && !isLocked) return null;

  // Déterminer quel bouton afficher
  let primaryButton = null;

  if (isInit && onValidateDemand) {
    primaryButton = (
      <button
        onClick={onValidateDemand}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-lg shadow-blue-500/20 w-full"
      >
        <CheckCircle2 size={16} />
        Demande reçue
      </button>
    );
  } else if (isInst && onNextStep) {
    primaryButton = (
      <div className="space-y-3">
        <button
          onClick={() => onNextStep(occupation.statut)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-lg shadow-emerald-500/20 w-full"
        >
          <FileStack size={16} />
          Transmettre pour AOT
        </button>
        {onPrevStep && (
          <button
            onClick={onPrevStep}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 w-full"
          >
            <ArrowLeft size={16} />
            Retour
          </button>
        )}
      </div>
    );
  } else if (isPrep && onNextStep) {
    primaryButton = (
      <button
        onClick={() => onNextStep(occupation.statut)}
        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-lg shadow-emerald-500/20 w-full disabled:opacity-40"
        disabled={!occupation.aotGabaritId}
        title={!occupation.aotGabaritId ? "Sélectionnez un gabarit d'abord" : "Passer à l'étape suivante"}
      >
        <CheckCircle2 size={16} />
        Signé et publié
      </button>
    );
  } else if (isEnCours && onToggleVerifie) {
    primaryButton = (
      <button
        onClick={onToggleVerifie}
        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-lg shadow-emerald-500/20 w-full"
      >
        <CheckCircle2 size={16} />
        Valider le dossier
      </button>
    );
  } else if (isLocked && onToggleVerifie) {
    primaryButton = (
      <button
        onClick={onToggleVerifie}
        className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-lg shadow-amber-500/20 w-full"
      >
        <ArrowRight size={16} />
        Déverrouiller
      </button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-3 max-w-[280px] animate-in slide-in-from-bottom-4 duration-500">
      {/* Modifier info button */}
      {!isFactured && !isLocked && (
        <button
          onClick={onEditClick}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-xl hover:shadow-2xl"
          title="Modifier les informations du dossier"
        >
          <Pencil size={16} />
          <span className="hidden sm:inline">Modifier info</span>
        </button>
      )}

      {/* Demande d'info button */}
      {!isFactured && !isLocked && !isInit && (
        <button
          onClick={() => {}} // À implémenter
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-amber-200 text-amber-600 hover:bg-amber-50 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-xl hover:shadow-2xl"
          title="Demander des informations complémentaires"
        >
          <AlertCircle size={16} />
          <span className="hidden sm:inline">Demande d'info</span>
        </button>
      )}

      {/* Primary action button */}
      {primaryButton && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
          {primaryButton}
        </div>
      )}
    </div>
  );
}
