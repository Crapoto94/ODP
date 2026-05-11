import React from 'react';
import { FileText, Info, Camera, MapPin, Trash2 } from 'lucide-react';

interface OdpDocsBannerProps {
  year: number;
  config: {
    deliberationPath?: string | null;
    tarifsTournagesPath?: string | null;
    tarifsOdpPath?: string | null;
  } | null;
  onEdit?: () => void;
  onDelete?: (type: 'delib' | 'tournages' | 'odp') => void;
  variant?: 'full' | 'compact';
}

export default function OdpDocsBanner({ year, config, onEdit, onDelete, variant = 'full' }: OdpDocsBannerProps) {
  if (!config || (!config.deliberationPath && !config.tarifsTournagesPath && !config.tarifsOdpPath)) {
    if (variant === 'compact') return null;
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400">
            <Info size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Référentiel ODP & Tournages {year}</h4>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider italic">Aucun document officiel configuré</p>
          </div>
        </div>
        {onEdit && (
          <button 
            onClick={onEdit}
            className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
          >
            Configurer maintenant
          </button>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
     return (
        <div className="flex items-center gap-2">
            {config.deliberationPath && (
                <a href={config.deliberationPath} target="_blank" rel="noreferrer" title="Délibération" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 transition-colors shadow-sm">
                    <FileText size={16} />
                </a>
            )}
            {config.tarifsTournagesPath && (
                <a href={config.tarifsTournagesPath} target="_blank" rel="noreferrer" title="Tarifs Tournages" className="p-2 bg-white border border-rose-200 rounded-lg text-rose-500 hover:text-rose-600 transition-colors shadow-sm">
                    <Camera size={16} />
                </a>
            )}
            {config.tarifsOdpPath && (
                <a href={config.tarifsOdpPath} target="_blank" rel="noreferrer" title="Tarifs ODP" className="p-2 bg-white border border-emerald-200 rounded-lg text-emerald-500 hover:text-emerald-600 transition-colors shadow-sm">
                    <MapPin size={16} />
                </a>
            )}
        </div>
     );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 flex flex-wrap items-center justify-between gap-6 shadow-xl shadow-slate-200/40">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <FileText size={20} />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Référentiel ODP & Tournages {year}</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Documents officiels et grilles tarifaires</p>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        {config.deliberationPath && (
          <div className="flex items-center gap-2">
            <a
              href={config.deliberationPath}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
            >
              Délibération (PDF)
            </a>
            {onDelete && (
              <button
                onClick={() => onDelete('delib')}
                className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                title="Supprimer"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
        {config.tarifsTournagesPath && (
          <div className="flex items-center gap-2">
            <a
              href={config.tarifsTournagesPath}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm"
            >
              <Camera size={12} /> Tarifs Tournages
            </a>
            {onDelete && (
              <button
                onClick={() => onDelete('tournages')}
                className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                title="Supprimer"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
        {config.tarifsOdpPath && (
          <div className="flex items-center gap-2">
            <a
              href={config.tarifsOdpPath}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
            >
               <MapPin size={12} /> Tarifs ODP
            </a>
            {onDelete && (
              <button
                onClick={() => onDelete('odp')}
                className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                title="Supprimer"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
        {onEdit && (
            <button
                onClick={onEdit}
                className="ml-2 p-2 text-slate-300 hover:text-blue-600 transition-colors"
                title="Modifier les documents"
            >
                <Info size={16} />
            </button>
        )}
      </div>
    </div>
  );
}
