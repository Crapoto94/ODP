import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Building2, ExternalLink } from 'lucide-react';

interface Props {
  tiers: any;
}

export default function TiersHeader({ tiers }: Props) {
  return (
    <div className="bg-white border-b border-slate-100 flex-shrink-0">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link 
              href="/dashboard/tiers"
              className="w-12 h-12 bg-slate-50 hover:bg-white text-slate-400 hover:text-blue-600 rounded-2xl flex items-center justify-center transition-all shadow-sm border border-slate-100 active:scale-95 group"
            >
              <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Building2 size={18} />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase truncate max-w-md">
                  {tiers?.nom}
                </h1>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-11">
                <span>ID # {tiers?.id}</span>
                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                <span>Tiers {(tiers?.code_sedit || tiers?.statut === 'DEFINITIF') ? 'Définitif' : 'Provisoire'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
               onClick={() => (tiers as any).onEdit?.()}
               className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
             >
               Modifier les infos
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
