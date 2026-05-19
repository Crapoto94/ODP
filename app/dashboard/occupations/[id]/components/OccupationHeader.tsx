import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Pencil, CheckCircle2, FileStack, ArrowLeft } from 'lucide-react';

interface Props {
  occupation: any;
  isFactured: boolean;
  isLocked: boolean;
  onToggleVerifie: () => void;
  onNextStep?: (statut: string) => void;
  onPrevStep?: () => void;
  onValidateDemand?: () => void;
  backLink?: string;
  backLabel?: string;
  editLink?: string;
}

export default function OccupationHeader({
  occupation,
  isFactured,
  isLocked,
  onToggleVerifie,
  onNextStep,
  onPrevStep,
  onValidateDemand,
  backLink = '/dashboard/occupations',
  backLabel = "Retour à l'inventaire",
  editLink
}: Props) {
  const router = useRouter();

  if (!occupation) return null;

  const resolvedEditLink = editLink || `${backLink}?edit=${occupation.id}`;

  const isInit = (occupation.type === 'CHANTIER' || occupation.type === 'TOURNAGE') && (occupation.statut === 'INIT' || occupation.statut === 'INITIALISATION' || occupation.statut === 'EN_ATTENTE');
  const isInst = occupation.statut === 'INST';
  const isPrep = occupation.statut === 'PREP' || occupation.statut === 'PREPARATION_AOT';
  const isEnCours = occupation.statut === 'EN_COURS';

  return (
    <div className="sticky top-0 z-50 -mx-4 px-4 py-4 bg-slate-50/80 backdrop-blur-xl border-b border-white/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link 
          href={backLink}
          className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-all font-black text-xs uppercase tracking-widest group"
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all shadow-sm">
            <ChevronLeft size={18} />
          </div>
          <span className="hidden md:block">{backLabel}</span>
        </Link>

        <div className="flex items-center gap-4">
          {(!isFactured && !isLocked || occupation.anneeTaxation === 2019) && (
            <button
              onClick={() => router.push(resolvedEditLink)}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 rounded-xl transition-all shadow-sm font-black text-[10px] uppercase tracking-widest flex items-center gap-2 active:scale-95"
            >
              <Pencil size={14} /> Modifier info
            </button>
          )}

          {isInit && onValidateDemand && (
            <button
              onClick={onValidateDemand}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 active:scale-95"
            >
              <CheckCircle2 size={14} />
              Demande reçue
            </button>
          )}

          {isInst && onNextStep && (
            <div className="flex items-center gap-4">
              {onPrevStep && (
                <button
                  onClick={onPrevStep}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 active:scale-95"
                >
                  <ArrowLeft size={14} />
                  Retour
                </button>
              )}
              <button
                onClick={() => onNextStep(occupation.statut)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/20 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 active:scale-95"
              >
                <FileStack size={14} />
                Transmettre pour AOT
              </button>
            </div>
          )}

          {isPrep && onNextStep && (
            <button
              onClick={() => onNextStep(occupation.statut)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/20 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 active:scale-95 disabled:opacity-40"
              disabled={!occupation.aotGabaritId}
              title={!occupation.aotGabaritId ? "Sélectionnez un gabarit d'abord" : "Passer à l'étape suivante"}
            >
              <CheckCircle2 size={14} />
              Signé et publié
            </button>
          )}

          {isEnCours && (
            <button
              onClick={onToggleVerifie}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/20 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 active:scale-95"
            >
              <CheckCircle2 size={14} />
              Valider le dossier
            </button>
          )}

          {occupation.type !== 'CHANTIER' && (
            <button
              onClick={onToggleVerifie}
              disabled={isFactured}
              className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-40 ${
                isLocked
                  ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-500/20'
                  : 'bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 size={16} />
              {isLocked ? 'Déverrouiller' : 'Valider le dossier'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
