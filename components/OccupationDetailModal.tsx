"use client";

import React from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Euro, 
  Clock, 
  User, 
  FileText, 
  Package, 
  CheckCircle2, 
  ArrowRight,
  Pencil,
  Trash2,
  ExternalLink,
  Download,
  ImageIcon,
  Plus,
  Hash
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  occupation: any;
  onEdit: (occ: any) => void;
  onApprove: (id: number) => void;
  onDownload: (id: number) => void;
  onAddLigne: (occ: any) => void;
  onDeleteLigne: (occId: number, ligneId: number) => void;
  onEditLigne: (occ: any, ligne: any) => void;
}

export default function OccupationDetailModal({ 
  isOpen, 
  onClose, 
  occupation: occ, 
  onEdit, 
  onApprove, 
  onDownload,
  onAddLigne,
  onDeleteLigne,
  onEditLigne
}: Props) {
  if (!isOpen || !occ) return null;

  const totalAmount = occ.lignes?.reduce((sum: number, l: any) => sum + l.montant, 0) || 0;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-white" onClick={onClose}></div>
      
      <div className="bg-white w-full h-full shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom duration-500 flex flex-col">
        {/* Header Section */}
        <div className="p-8 md:p-12 border-b border-slate-100 flex items-start justify-between bg-white relative z-10">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                occ.statut === 'VALIDE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                occ.statut === 'EXPIRE' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                {occ.statut}
              </span>
              <span className="bg-slate-50 px-4 py-1 rounded-full border border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                {occ.type}
              </span>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                ID #{occ.id}
              </span>
            </div>
            
            <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {occ.nom || `Dossier sans nom`}
            </h2>
            
            <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Demandeur</p>
                  <p className="text-sm font-bold text-slate-900 leading-none">{occ.tiers?.nom || 'Non spécifié'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Localisation</p>
                  <p className="text-sm font-bold text-slate-900 leading-none">{occ.adresse}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Période</p>
                  <p className="text-sm font-bold text-slate-900 leading-none">
                    {format(new Date(occ.dateDebut), 'dd MMM yyyy', { locale: fr })} - {format(new Date(occ.dateFin), 'dd MMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
               onClick={() => onEdit(occ)}
               className="p-4 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all shadow-sm"
               title="Modifier le dossier"
             >
               <Pencil size={20} />
             </button>
             <button 
               onClick={onClose} 
               className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all"
             >
               <X size={28} />
             </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-16">
          
          {/* Photos & Description */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description & Observations</h3>
              </div>
              <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 min-h-[120px]">
                <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                  {occ.description || "Aucune observation particulière n'a été ajoutée à ce dossier."}
                </p>
              </div>

              {occ.photos && (
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} /> Photos & Justificatifs
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {occ.photos.split(',').map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="group relative aspect-square rounded-[1.5rem] overflow-hidden border border-slate-200 shadow-sm transition-all hover:scale-[1.02] hover:shadow-xl">
                        <img src={url} alt={`Photo ${i+1}`} className="w-full h-full object-cover shadow-sm" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ExternalLink size={20} className="text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Résumé Financier</h3>
              <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
                 <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform">
                   <Euro size={160} />
                 </div>
                 <div className="relative z-10">
                   <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">Montant Total HT</p>
                   <p className="text-5xl font-black tracking-tighter mb-4">{totalAmount.toLocaleString('fr-FR')} €</p>
                   
                   <div className="space-y-3 pt-4 border-t border-white/10">
                     <div className="flex justify-between text-xs font-bold">
                       <span className="text-slate-400">Nombre d'articles</span>
                       <span>{occ.lignes?.length || 0}</span>
                     </div>
                     <div className="flex justify-between text-xs font-bold">
                       <span className="text-slate-400">Statut Financier</span>
                       <span className={occ.statut === 'VALIDE' ? 'text-emerald-400' : 'text-amber-400'}>
                         {occ.statut === 'VALIDE' ? 'Validé pour facturation' : 'Attente validation'}
                       </span>
                     </div>
                   </div>

                   <div className="pt-8">
                     {(occ.statut === 'EN_ATTENTE' || !occ.statut) && (
                       <button 
                         onClick={() => onApprove(occ.id)}
                         className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                       >
                         Approuver le Dossier
                       </button>
                     )}
                     {occ.statut === 'VALIDE' && (
                       <button 
                         onClick={() => onDownload(occ.id)}
                         className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all backdrop-blur-sm border border-white/10 flex items-center justify-center gap-3 active:scale-95"
                       >
                         <Download size={16} />
                         Télécharger la Facture
                       </button>
                     )}
                   </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Line Items List */}
          <div className="space-y-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
               <div>
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">Détail des Articles ({occ.lignes?.length || 0})</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Éléments taxables du domaine public</p>
               </div>
               <button 
                 onClick={() => onAddLigne(occ)}
                 className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95"
               >
                 <Plus size={16} /> Ajouter un élément
               </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {!occ.lignes || occ.lignes.length === 0 ? (
                <div className="py-12 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 text-center">
                   <Package size={32} className="mx-auto text-slate-300 mb-3" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucun article associé pour le moment</p>
                </div>
              ) : (
                occ.lignes.map((ligne: any) => (
                  <div key={ligne.id} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between group transition-all hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5">
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 p-2 text-center">
                         <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Article</p>
                         <p className="font-black text-slate-900 leading-none">{ligne.article?.numero || '#'}</p>
                      </div>
                      
                      <div className="space-y-1">
                         <div className="flex items-center gap-3">
                           <h4 className="text-base font-black text-slate-900">{ligne.article?.designation}</h4>
                           <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase border border-blue-100">
                             {ligne.article?.modeTaxation?.nom || 'Tarif Fixe'}
                           </span>
                         </div>
                         <p className="text-xs font-bold text-slate-400 flex flex-wrap items-center gap-y-1 gap-x-4">
                            <span className="flex items-center gap-1.5"><Clock size={12} className="text-slate-300" /> {format(new Date(ligne.dateDebut), 'dd/MM/yyyy')} - {format(new Date(ligne.dateFin), 'dd/MM/yyyy')}</span>
                            <span className="flex items-center gap-1.5"><Hash size={12} className="text-slate-300" /> Q1: {ligne.quantite1} · Q2: {ligne.quantite2}</span>
                         </p>
                      </div>
                    </div>

                    <div className="mt-6 md:mt-0 flex items-center gap-10">
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1 leading-none">Montant HT</p>
                          <p className="text-2xl font-black text-slate-900 leading-none">
                            {ligne.montant.toLocaleString('fr-FR')} €
                          </p>
                       </div>
                       
                       <div className="flex gap-2">
                          <button 
                            onClick={() => onEditLigne(occ, ligne)}
                            className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            onClick={() => onDeleteLigne(occ.id, ligne.id)}
                            className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
