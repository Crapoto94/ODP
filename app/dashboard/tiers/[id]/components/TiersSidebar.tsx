import React from 'react';
import { User, Plus, Trash2, List, FileText, ArrowRight, ExternalLink, ShieldCheck, Fingerprint } from 'lucide-react';
import Link from 'next/link';

interface Props {
  tiers: any;
  onOpenContactModal: () => void;
  onDeleteContact: (id: number) => void;
}

export default function TiersSidebar({ tiers, onOpenContactModal, onDeleteContact }: Props) {
  const contacts = tiers?.contacts || [];
  const occupations = tiers?.occupations || [];

  return (
    <div className="lg:col-span-4 space-y-12">
      {/* SECTION: ADMIN INFO */}
      {tiers?.siret && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-blue-50/20">
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-blue-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Administration</h3>
            </div>
            <div className="px-2 py-1 bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase tracking-tighter">
              SIRENE
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Numéro SIRET</span>
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 font-mono text-xs font-bold text-slate-900">
                  <Fingerprint size={12} className="text-slate-400" />
                  {tiers.siret}
                </div>
              </div>
              
              <a 
                href={`https://annuaire-entreprises.data.gouv.fr/entreprise/${tiers.siret.substring(0, 9)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-900/10 group"
              >
                <ExternalLink size={16} className="group-hover:rotate-12 transition-transform" />
                Vérifier sur INSEE
              </a>
            </div>
            
            <p className="text-[9px] font-medium text-slate-400 italic leading-relaxed text-center px-4">
              Accédez directement à l'Annuaire des Entreprises pour consulter les données légales en temps réel.
            </p>
          </div>
        </div>
      )}

      {/* SECTION: CONTACTS */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <User size={18} className="text-blue-600" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Contacts Tiers</h3>
          </div>
          <button 
            onClick={onOpenContactModal}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            title="Ajouter un contact"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {contacts.length === 0 ? (
            <div className="py-12 px-6 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto">
                <User size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                Aucun contact enregistré<br />pour ce tiers
              </p>
            </div>
          ) : (
            contacts.map((c: any) => (
              <div key={c.id} className="group p-5 bg-white border border-slate-100 rounded-3xl hover:border-blue-200 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-lg shadow-inner group-hover:bg-blue-50 transition-colors">
                      {c.prenom?.[0] || 'C'}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 tracking-tight uppercase leading-tight">
                        {c.prenom} {c.nom}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{c.role}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onDeleteContact(c.id)}
                    className="p-2 text-slate-200 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="mt-5 space-y-2.5">
                  {c.email && (
                    <div className="flex items-center gap-3 text-slate-500 group-hover:text-slate-900 transition-colors">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      <span className="text-xs font-bold truncate">{c.email}</span>
                    </div>
                  )}
                  {c.telephone && (
                    <div className="flex items-center gap-3 text-slate-500 group-hover:text-slate-900 transition-colors">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                      <span className="text-xs font-bold tracking-tight">{c.telephone}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECTION: DOSSIERS ASSOCIÉS */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-emerald-50/30">
          <div className="flex items-center gap-3">
            <List size={18} className="text-emerald-600" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Dossiers Associés</h3>
          </div>
          <div className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-black">
            {occupations.length}
          </div>
        </div>

        <div className="p-4 space-y-3">
          {occupations.length === 0 ? (
            <div className="py-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Aucun dossier trouvé
            </div>
          ) : (
            occupations.map((o: any) => (
              <Link 
                key={o.id} 
                href={`/dashboard/occupations/${o.id}`}
                className="group p-5 bg-slate-50/50 border border-slate-100 rounded-3xl hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all flex items-center justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-emerald-500" />
                    <h4 className="font-black text-slate-900 tracking-tight uppercase text-xs truncate max-w-[180px]">
                      {o.nom}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    <span>{o.type}</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                    <span>{o.statut}</span>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
