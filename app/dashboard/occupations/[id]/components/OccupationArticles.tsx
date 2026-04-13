import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Package, Clock, Hash, Pencil, Trash2, FileText, Loader2, CreditCard, FileStack, CheckCircle2 } from 'lucide-react';
import { Occupation, LigneArticle } from '../types';
import PaymentModal from './PaymentModal';

interface Props {
  occupation: Occupation;
  isFactured: boolean;
  isLocked?: boolean;
  onAddArticle: () => void;
  onEditArticle: (ligne: LigneArticle) => void;
  onDeleteArticle: (id: number) => void;
  onRegisterPayment?: (date: string) => Promise<void>;
  aotGabarits?: any[];
  onSetAotGabarit?: (id: number | null) => void;
  onDownloadAot?: () => void;
  isGeneratingAot?: boolean;
  onUploadAotFinal?: () => void;
  onPublishAot?: () => void;
}

export default function OccupationArticles({
  occupation,
  isFactured,
  isLocked = false,
  onAddArticle,
  onEditArticle,
  onDeleteArticle,
  onRegisterPayment,
  aotGabarits = [],
  onSetAotGabarit,
  onDownloadAot,
  isGeneratingAot,
  onUploadAotFinal,
  onPublishAot
}: Props) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const isInit = occupation.type === 'CHANTIER' && (occupation.statut === 'INIT' || occupation.statut === 'INITIALISATION' || occupation.statut === 'EN_ATTENTE');
  const hasAotFinal = !!occupation.aotFinalPath;

  return (
    <section className="space-y-8 text-left">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-200 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-950 tracking-tight">Détail des Articles</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
            {isFactured ? 'Consultation uniquement (Facture émise)' : isLocked ? 'Consultation uniquement (Dossier validé)' : isInit ? 'En attente de réception de la demande' : 'Articles taxables rattachés au dossier'}
          </p>
        </div>

        {occupation.statut === 'FACTURE' && onRegisterPayment && (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95 group"
          >
            <CreditCard size={18} className="group-hover:scale-110 transition-transform" />
            Saisir paiement
          </button>
        )}

        {!isLocked && !isFactured && !isInit && (
          <button
            onClick={onAddArticle}
            className="flex items-center gap-3 bg-slate-950 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            Ajouter un article
          </button>
        )}
      </div>
      
      {/* AOT Preparation Mode Card */}
      {occupation.type === 'CHANTIER' && (occupation.statut === 'PREP' || occupation.statut === 'PREPARATION_AOT') && (
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 md:p-10 text-slate-900 shadow-xl shadow-slate-200/50 relative overflow-hidden group mb-12 animate-in zoom-in-95 duration-500">
          {/* Subtle backdrop */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl group-hover:bg-indigo-100 transition-colors"></div>
          
          <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-10">
            <div className="space-y-6 text-center xl:text-left flex-1">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full">
                <FileStack size={14} className="text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Action administrative</span>
              </div>
              <div>
                <h3 className="text-3xl font-black tracking-tight text-slate-900">Préparation de l'Arrêté</h3>
                <p className="text-slate-500 font-medium text-sm mt-2 leading-relaxed max-w-xl">
                  Sélectionnez le gabarit réglementaire à utiliser pour générer l'AOT de ce dossier.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-full sm:w-auto min-w-[320px] space-y-2">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Modèle de gabarit</p>
                   <select 
                     className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3.5 px-6 outline-none focus:border-indigo-400 focus:bg-white transition-all font-bold text-sm text-slate-900"
                     value={occupation.aotGabaritId || ''}
                     onChange={(e) => onSetAotGabarit && onSetAotGabarit(e.target.value ? parseInt(e.target.value) : null)}
                   >
                     <option value="" disabled className="text-slate-400">Sélectionner un gabarit...</option>
                     {aotGabarits.map(g => (
                       <option key={g.id} value={g.id}>{g.nom}</option>
                     ))}
                   </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 shrink-0 w-full xl:w-auto">
              <button
                onClick={onDownloadAot}
                disabled={!occupation.aotGabaritId || isGeneratingAot}
                className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-40 ${
                  !occupation.aotGabaritId
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                    : 'bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 shadow-indigo-100/50'
                }`}
              >
                {isGeneratingAot ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                Générer AOT
              </button>

              <button
                onClick={onUploadAotFinal}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 bg-white border-2 border-amber-100 text-amber-600 hover:bg-amber-50 shadow-amber-100/50"
              >
                <FileStack size={18} />
                Ajouter AOT final
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {!occupation.lignes || occupation.lignes.length === 0 ? (
          <div className="py-24 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm border border-slate-100">
              <Package size={28} className="text-slate-200" />
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Aucun article enregistré pour le moment</p>
          </div>
        ) : (
          occupation.lignes.map((ligne) => (
            <div key={ligne.id} className="bg-white p-8 md:p-10 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between group transition-all hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-start gap-8 flex-1 w-full">
                <div className="w-20 h-20 rounded-xl bg-slate-50 flex flex-col items-center justify-center border border-slate-200 p-3 text-center group-hover:bg-white group-hover:border-blue-100 transition-all shrink-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Code</p>
                  <p className="font-black text-slate-950 text-xl leading-none">{ligne.article?.numero || '#'}</p>
                </div>
                
                <div className="space-y-4 text-left flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="text-xl font-black text-slate-950 tracking-tight">{ligne.article?.designation}</h4>
                    <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-blue-100/50">
                      {ligne.article?.modeTaxation?.nom || 'Tarif Fixe'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3 text-slate-500">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                          <Clock size={14} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wide flex flex-col gap-1">
                          <span>
                            {occupation.type === 'TLPE' 
                              ? `Exercice ${occupation.anneeTaxation || new Date(ligne.dateDebut).getFullYear()}`
                              : `Prévu : Du ${(() => { try { return ligne.dateDebut ? format(new Date(ligne.dateDebut), 'dd/MM/yyyy') : '?'; } catch(e) { return '?'; } })()} au ${(() => { try { return ligne.dateFin ? format(new Date(ligne.dateFin), 'dd/MM/yyyy') : '?'; } catch(e) { return '?'; } })()}`
                            }
                          </span>
                          {(ligne.dateDebutConstatee || ligne.dateFinConstatee) && (
                            <span className="text-[10px] text-emerald-600">
                              Réel : Du {(() => {
                                  if (!ligne.dateDebutConstatee) return '--';
                                  try { return format(new Date(ligne.dateDebutConstatee), 'dd/MM/yyyy'); } catch(e) { return '--'; }
                                })()} au {(() => {
                                  if (!ligne.dateFinConstatee) return '--';
                                  try { return format(new Date(ligne.dateFinConstatee), 'dd/MM/yyyy'); } catch(e) { return '--'; }
                                })()}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-slate-500">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <Hash size={14} />
                      </div>
                      <div className="text-xs font-bold uppercase tracking-wide leading-relaxed">
                        {(() => {
                          const rawMode = ligne.article?.modeTaxation?.nom || 'unité';
                          const parts = rawMode.split('/').filter(Boolean).map((p: string) => p.trim().toLowerCase());
                          const u1 = parts[0] || 'unités';
                          const u2 = parts[1] || 'unités';
                          
                          if (occupation.type === 'CHANTIER' || occupation.type === 'TOURNAGE') {
                            return <span>{ligne.quantite1} {u1} x {ligne.quantite2} {u2} à {ligne.article?.montant}€</span>;
                          }
                          return <span>{ligne.quantite1} {u1} à {ligne.article?.montant}€</span>;
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  {ligne.photos && (
                    <div className="flex flex-wrap gap-3 mt-2">
                       {ligne.photos.split(',').filter(Boolean).map((url, i) => {
                         const isPdf = url.toLowerCase().endsWith('.pdf');
                         return (
                           <a key={i} href={url} target="_blank" rel="noreferrer" className="w-14 h-14 rounded-xl overflow-hidden border border-slate-100 hover:border-blue-400 transition-all shadow-sm hover:scale-105 bg-slate-50 flex items-center justify-center">
                             {isPdf ? (
                               <FileText size={20} className="text-rose-500" />
                             ) : (
                               <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                             )}
                           </a>
                         );
                       })}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 md:mt-0 flex items-center gap-10 pl-28 md:pl-0 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-6 md:pt-0">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2 leading-none tracking-widest">Sous-total</p>
                  <p className="text-3xl font-black text-slate-950 leading-none tabular-nums">
                    {ligne.montant.toLocaleString('fr-FR')} <span className="text-lg text-blue-500">€</span>
                  </p>
                </div>
                
                {!isLocked && !isFactured && (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => onEditArticle(ligne)}
                      className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-transparent hover:border-blue-100"
                    >
                      <Pencil size={20} />
                    </button>
                    <button 
                      onClick={() => onDeleteArticle(ligne.id)}
                      className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {onRegisterPayment && (
        <PaymentModal 
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={onRegisterPayment}
        />
      )}
    </section>
  );
}
