import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { User, MapPin, Calendar, ArrowRight, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Occupation, StatusConfig, TypeConfig } from '../types';

interface Props {
  occupation: Occupation;
  statusInfo: StatusConfig;
  typeInfo: TypeConfig;
  latestSignatureRequest?: any;
}

function SignatureStatusBadge({ request }: { request: any }) {
  if (!request) return null;

  const statusMap: Record<string, { label: string; icon: React.ReactNode; classes: string }> = {
    PENDING: {
      label: 'Signature en attente',
      icon: <Clock size={12} />,
      classes: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    ACCEPTED: {
      label: 'Signé',
      icon: <CheckCircle2 size={12} />,
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    REJECTED: {
      label: 'Signature rejetée',
      icon: <XCircle size={12} />,
      classes: 'bg-rose-50 text-rose-700 border-rose-200'
    }
  };

  const config = statusMap[request.status] || statusMap.PENDING;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${config.classes}`}>
      {config.icon}
      {config.label}
      {request.signatory?.nom && (
        <span className="opacity-70">— {request.signatory.nom}</span>
      )}
    </span>
  );
}

export default function OccupationHero({ occupation, statusInfo, typeInfo, latestSignatureRequest }: Props) {
  return (
    <div className="relative group/hero">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/10 to-emerald-600/10 rounded-xl blur-xl opacity-25 group-hover/hero:opacity-50 transition duration-1000"></div>
      <div className="relative bg-white/70 backdrop-blur-md rounded-xl border border-white/40 p-8 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl shadow-slate-200/40">
        <div className="space-y-6 flex-1 w-full">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
              {statusInfo.label}
            </span>
            <span className={`px-4 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm ${typeInfo.bg} ${typeInfo.color} ${typeInfo.border}`}>
              {typeInfo.label}
            </span>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">
              Ref. #{occupation.id}
            </span>
            {latestSignatureRequest && (
              <SignatureStatusBadge request={latestSignatureRequest} />
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight leading-tight max-w-2xl">
            {occupation.nom || `Dossier sans nom`}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50/50 border border-transparent hover:bg-white hover:border-slate-100 transition-all">
              <div className="w-11 h-11 rounded-xl bg-blue-100/50 text-blue-600 flex items-center justify-center border border-blue-200/50 shrink-0">
                <User size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Demandeur</p>
                <p className="text-sm font-black text-slate-900 leading-none truncate">{occupation.tiers?.nom || 'N/A'}</p>
                {occupation.agissantPourTier ? (
                  <p className="text-[9px] font-black text-blue-600 mt-2 flex items-center gap-1.5 uppercase bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/50">
                    <ArrowRight size={10} />
                    Pour : {occupation.agissantPourTier.nom}
                  </p>
                ) : (
                  <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Sedit : {occupation.tiers?.code_sedit || '-'}</p>
                )}
              </div>
            </div>
            
            <a 
              href={occupation.latitude && occupation.longitude ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${occupation.latitude},${occupation.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(occupation.adresse)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-3 rounded-xl bg-emerald-50/50 border border-transparent hover:bg-white hover:border-emerald-200 transition-all group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-100/50 text-emerald-600 flex items-center justify-center border border-emerald-200/50 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <MapPin size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1.5">
                  Localisation <ArrowRight size={10} className="text-emerald-400" />
                </p>
                <p className="text-xs font-black text-slate-900 leading-tight line-clamp-2 underline decoration-emerald-200 decoration-2 underline-offset-4 group-hover:text-emerald-600 transition-colors">{occupation.adresse}</p>
              </div>
            </a>

            <div className="flex items-center gap-4 p-3 rounded-xl bg-amber-50/50 border border-transparent hover:bg-white hover:border-amber-100 transition-all">
              <div className="w-11 h-11 rounded-xl bg-amber-100/50 text-amber-600 flex items-center justify-center border border-amber-200/50 shrink-0">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                  {occupation.type === 'TLPE' ? 'Année de taxation' : 'Période'}
                </p>
                <p className="text-sm font-black text-slate-900 leading-none">
                  {occupation.type === 'TLPE' ? (occupation.anneeTaxation || '-') : (
                    <span className="flex items-center gap-1.5">
                      {occupation.dateDebut ? format(new Date(occupation.dateDebut), 'dd/MM/yy', { locale: fr }) : '?'} 
                      <ArrowRight size={10} className="text-slate-300" />
                      {occupation.dateFin ? format(new Date(occupation.dateFin), 'dd/MM/yy', { locale: fr }) : '?'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
