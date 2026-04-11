import { Mail, MapPin, Fingerprint, SearchCode, Globe } from 'lucide-react';
import { getNatureJuridiqueLabel } from '@/lib/tiers-constants';

interface Props {
  tiers: any;
}

export default function TiersHero({ tiers }: Props) {
  if (!tiers) return null;

  return (
    <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
      <div className="p-10 space-y-10">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1.5 bg-blue-600 rounded-full"></div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Informations Générales</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Nature Juridique */}
          <div className="flex items-start gap-4 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-blue-100 transition-colors group">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm border border-slate-100 transition-all">
              <Globe size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nature Juridique</p>
              <p className="font-bold text-slate-900">{getNatureJuridiqueLabel(tiers.natureJuridique)}</p>
            </div>
          </div>

          {/* SIRET */}
          <div className="flex items-start gap-4 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-blue-100 transition-colors group">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm border border-slate-100 transition-all">
              <Fingerprint size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Numéro SIRET</p>
              <p className="font-bold text-slate-900 font-mono tracking-tight">{tiers.siret || 'SANS SIRET'}</p>
            </div>
          </div>

          {/* Code SEDIT */}
          <div className="flex items-start gap-4 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-blue-100 transition-colors group">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm border border-slate-100 transition-all">
              <SearchCode size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Code Tiers SEDIT</p>
              <p className="font-bold text-blue-600">{tiers.code_sedit || 'À DÉFINIR'}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-4 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-blue-100 transition-colors group">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm border border-slate-100 transition-all">
              <Mail size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Principal</p>
              <p className="font-bold text-slate-900 truncate max-w-[200px]">{tiers.email || 'Aucun email'}</p>
            </div>
          </div>
        </div>

        {/* Adresse */}
        <div className="p-8 bg-blue-50/30 rounded-3xl border border-blue-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-blue-600" />
                <span className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest">Siège Social / Adresse Postale</span>
              </div>
              <p className="text-lg font-black text-slate-900 uppercase">
                {tiers.adresse || 'Adresse non renseignée'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
