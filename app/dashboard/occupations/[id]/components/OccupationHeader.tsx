import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Pencil, CheckCircle2 } from 'lucide-react';

interface Props {
  occupation: any;
  isFactured: boolean;
  isLocked: boolean;
  onToggleVerifie: () => void;
  backLink?: string;
  backLabel?: string;
  editLink?: string;
}

export default function OccupationHeader({ 
  occupation, 
  isFactured, 
  isLocked, 
  onToggleVerifie,
  backLink = '/dashboard/occupations',
  backLabel = "Retour à l'inventaire",
  editLink
}: Props) {
  const router = useRouter();

  if (!occupation) return null;

  const resolvedEditLink = editLink || `${backLink}?edit=${occupation.id}`;

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
          {!isFactured && !isLocked && (
            <button 
              onClick={() => router.push(resolvedEditLink)}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 rounded-xl transition-all shadow-sm font-black text-[10px] uppercase tracking-widest flex items-center gap-2 active:scale-95"
            >
              <Pencil size={14} /> Modifier info
            </button>
          )}
          <button
            onClick={onToggleVerifie}
            disabled={isFactured}
            className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-40 ${
              isLocked
                ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/20'
                : 'bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 size={16} />
            {isLocked ? 'Déverrouiller' : 'Valider le dossier'}
          </button>
        </div>
      </div>
    </div>
  );
}
