import React from 'react';
import {
  ImageIcon,
  ExternalLink,
  FileText,
  FileArchive,
  User,
  Plus,
  Mail,
  Smartphone,
  Trash2,
  Clock,
  Send,
  Loader2,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { Occupation, Contact } from '../types';

interface Props {
  occupation: Occupation;
  isFactured: boolean;
  onOpenContactModal: () => void;
  onDeleteContact: (id: number) => void;
  onEditContact?: (contact: Contact) => void;
  onOpenUploadModal: () => void;
  onDeletePhoto?: (index: number) => void;
  onDeleteAotFinal?: () => void;
  onSaveObservations?: (obs: string) => Promise<void>;
  onSendInvoice?: () => Promise<void>;
  isSendingInvoice?: boolean;
}

export default function OccupationSidebar({
  occupation,
  isFactured,
  onOpenContactModal,
  onDeleteContact,
  onEditContact,
  onOpenUploadModal,
  onDeletePhoto,
  onDeleteAotFinal,
  onSaveObservations,
  onSendInvoice,
  isSendingInvoice,
}: Props) {
  const [sendingAot, setSendingAot] = React.useState(false);
  const [aotSentMsg, setAotSentMsg] = React.useState<string | null>(null);
  const [invoiceSentMsg, setInvoiceSentMsg] = React.useState<string | null>(null);
  const [isEditingObs, setIsEditingObs] = React.useState(false);
  const [obsValue, setObsValue] = React.useState(occupation.observations || '');
  const [savingObs, setSavingObs] = React.useState(false);

  React.useEffect(() => {
    setObsValue(occupation.observations || '');
  }, [occupation.observations]);

  const handleSendAot = async () => {
    setSendingAot(true);
    setAotSentMsg(null);
    try {
      const res = await fetch(`/api/occupations/${occupation.id}/send-aot`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setAotSentMsg(`AOT envoyé à : ${data.sent.join(', ')}`);
      setTimeout(() => setAotSentMsg(null), 5000);
    } catch (e: any) {
      setAotSentMsg(`Erreur : ${e.message}`);
      setTimeout(() => setAotSentMsg(null), 5000);
    } finally {
      setSendingAot(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!onSendInvoice) return;
    setInvoiceSentMsg(null);
    try {
      await onSendInvoice();
      setInvoiceSentMsg("Facture envoyée avec succès !");
      setTimeout(() => setInvoiceSentMsg(null), 5000);
    } catch (e: any) {
      setInvoiceSentMsg(`Erreur : ${e.message}`);
      setTimeout(() => setInvoiceSentMsg(null), 5000);
    }
  };

  const photoList = occupation.photos ? occupation.photos.split(',').filter(Boolean) : [];
  const billingStatuses = ['VERIFIE', 'VALIDÉ', 'VALIDE', 'FACTURE', 'FACTURÉ', 'TITRE', 'TITRÉ', 'PAYE', 'PAYÉ', 'CLOS'];
  const showInvoiceBlock = !!occupation.facturePath || billingStatuses.includes(occupation.statut);
  const docCount = photoList.length + (showInvoiceBlock ? 1 : 0) + (occupation.aotFinalPath ? 1 : 0);

  React.useEffect(() => {
    console.log('[OccupationSidebar] Rendering with:');
    console.log('  - photoList.length:', photoList.length);
    console.log('  - facturePath:', occupation.facturePath);
    console.log('  - docCount:', docCount);
  }, [occupation, photoList.length, docCount]);

  return (
    <aside className="lg:col-span-4 space-y-12">
      
      {/* Documents Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between group/title">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
            <ImageIcon size={16} className="text-blue-500" /> Documents & PJ ({docCount})
          </h3>
          {!isFactured && (
            <button 
              onClick={onOpenUploadModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm cursor-pointer group-hover/title:scale-105 active:scale-95 group/btn"
            >
              <Plus size={16} className="group-hover/btn:rotate-90 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">Joindre un document</span>
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {photoList.map((item, i) => {
            const [url, designation] = item.split('|');
            const isPdf = url.toLowerCase().endsWith('.pdf');
            const displayName = designation || (isPdf ? 'Document PDF' : `Document joint ${i+1}`);

            return (
              <div
                key={i}
                className="group flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5"
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center transition-colors ${isPdf ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white' : 'bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white'} border border-transparent`}>
                    {isPdf ? <FileText size={20} /> : <ImageIcon size={20} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest truncate">{displayName}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1">
                      {isPdf ? 'Format PDF' : 'Fichier Image'} • Cliquez pour ouvrir
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
                    <ExternalLink size={14} />
                  </div>
                </a>

                {!isFactured && onDeletePhoto && (
                  <button
                    onClick={() => onDeletePhoto(i)}
                    className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    title="Supprimer ce document"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}

          {showInvoiceBlock && (
            <div className="space-y-1.5">
              <a
                href={occupation.facturePath || `/api/facture-pdf/${occupation.id}`}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-4 p-4 bg-blue-50/50 rounded-2xl border-2 border-blue-100 shadow-sm transition-all hover:border-blue-400 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 rounded-xl shrink-0 bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FileText size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest truncate">
                    Détails de facture
                  </p>
                  <p className="text-[8px] font-black text-blue-400/70 uppercase tracking-tighter mt-1">Facture • PDF</p>
                </div>

                <button
                  type="button"
                  onClick={e => { e.preventDefault(); handleSendInvoice(); }}
                  disabled={isSendingInvoice}
                  title="Envoyer au demandeur"
                  className="h-8 px-3 rounded-lg bg-white border border-blue-200 flex items-center gap-1.5 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 disabled:opacity-40 transition-all shrink-0 text-[9px] font-black uppercase tracking-wider"
                >
                  {isSendingInvoice ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  Envoyer
                </button>
              </a>
              {invoiceSentMsg && (
                <p className={`text-[9px] font-black px-2 ${invoiceSentMsg.startsWith('Erreur') ? 'text-rose-500' : 'text-blue-600'}`}>{invoiceSentMsg}</p>
              )}
            </div>
          )}

          {occupation.aotFinalPath && occupation.aotSigned && (
            <div className="space-y-1.5">
              <a
                href={occupation.aotFinalPath}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-4 p-4 bg-emerald-50/50 rounded-2xl border-2 border-emerald-100 shadow-sm transition-all hover:border-emerald-400 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 rounded-xl shrink-0 bg-emerald-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FileText size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest truncate">AOT Final — Signé</p>
                  <p className="text-[8px] font-black text-emerald-400/70 uppercase tracking-tighter mt-1">Document Finalisé</p>
                </div>
                <button
                  type="button"
                  onClick={e => { e.preventDefault(); handleSendAot(); }}
                  disabled={sendingAot}
                  title="Envoyer au demandeur"
                  className="h-8 px-3 rounded-lg bg-white border border-emerald-200 flex items-center gap-1.5 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 disabled:opacity-40 transition-all shrink-0 text-[9px] font-black uppercase tracking-wider"
                >
                  {sendingAot ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  Envoyer
                </button>
              </a>
              {aotSentMsg && (
                <p className={`text-[9px] font-black px-2 ${aotSentMsg.startsWith('Erreur') ? 'text-rose-500' : 'text-emerald-600'}`}>{aotSentMsg}</p>
              )}
            </div>
          )}

          {occupation.aotFinalPath && !occupation.aotSigned && (
            <div className="space-y-1.5">
              <a
                href={occupation.aotFinalPath}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-4 p-4 bg-amber-50/50 rounded-2xl border-2 border-amber-100 shadow-sm transition-all hover:border-amber-400 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 rounded-xl shrink-0 bg-amber-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FileText size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest truncate">AOT Final — Non signé</p>
                  <p className="text-[8px] font-black text-amber-400/70 uppercase tracking-tighter mt-1">En attente de signature</p>
                </div>
                <button
                  type="button"
                  onClick={e => { e.preventDefault(); handleSendAot(); }}
                  disabled={sendingAot}
                  title="Envoyer au demandeur"
                  className="h-8 px-3 rounded-lg bg-white border border-amber-200 flex items-center gap-1.5 text-amber-600 hover:bg-amber-500 hover:text-white hover:border-amber-500 disabled:opacity-40 transition-all shrink-0 text-[9px] font-black uppercase tracking-wider"
                >
                  {sendingAot ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  Envoyer
                </button>
              </a>
              {aotSentMsg && (
                <p className={`text-[9px] font-black px-2 ${aotSentMsg.startsWith('Erreur') ? 'text-rose-500' : 'text-emerald-600'}`}>{aotSentMsg}</p>
              )}
            </div>
          )}

          {docCount === 0 && (
            <div className="py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                <FileArchive size={20} className="text-slate-300" />
              </div>
              <p className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">Aucun document joint</p>
            </div>
          )}
        </div>
      </section>

      {/* Contacts Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
           <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
             <User size={16} className="text-emerald-500" /> Contacts & Référents
           </h3>
           {!isFactured && (
             <button 
               onClick={onOpenContactModal}
               className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
             >
               <Plus size={20} />
             </button>
           )}
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {[
            ...(occupation.contacts || []).map(c => ({ ...c, source: 'DOSSIER' })),
            ...(occupation.tiers?.contacts || []).map(c => ({ ...c, source: 'TIERS' }))
          ].length > 0 ? (
            [
              ...(occupation.contacts || []).map(c => ({ ...c, source: 'DOSSIER' })),
              ...(occupation.tiers?.contacts || []).map(c => ({ ...c, source: 'TIERS' }))
            ].map((contact: any) => (
              <div key={`${contact.source}-${contact.id}`} className={`bg-white p-6 rounded-2xl border ${contact.source === 'TIERS' ? 'border-blue-100' : 'border-slate-100'} shadow-sm group hover:border-emerald-400 transition-all flex items-center justify-between hover:shadow-xl relative overflow-hidden`}>
                {contact.source === 'TIERS' && (
                  <div className="absolute top-0 right-0 px-4 py-1.5 bg-blue-600 text-[8px] font-black text-white uppercase tracking-widest rounded-bl-2xl">
                    Hérité du Tiers
                  </div>
                )}
                <div className="flex items-center gap-5 min-w-0">
                  {contact.pjPath ? (
                    <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden border border-slate-100 bg-slate-50 shrink-0 shadow-inner">
                      <img src={contact.pjPath} className="w-full h-full object-cover" alt="Contact Card" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shrink-0">
                      <User size={28} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${contact.source === 'TIERS' ? 'text-blue-600 bg-blue-50 border-blue-100/50' : 'text-emerald-600 bg-emerald-50 border-emerald-100/50'}`}>
                      {contact.role}
                    </span>
                    <p className="text-base font-black text-slate-950 truncate mt-2 uppercase">{contact.prenom} {contact.nom}</p>
                    <div className="flex flex-col gap-1.5 mt-2">
                      {contact.email && (
                        <span className="text-[10px] font-black text-slate-400 flex items-center gap-2">
                          <Mail size={12} className="shrink-0 text-slate-300" />
                          <span className="truncate">{contact.email}</span>
                        </span>
                      )}
                      {contact.telephone && (
                        <a href={`tel:${contact.telephone}`} className="text-[10px] font-black text-slate-400 hover:text-emerald-600 flex items-center gap-2 transition-colors">
                          <Smartphone size={12} className="shrink-0 text-slate-300" />
                          {contact.telephone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                {!isFactured && contact.source === 'DOSSIER' && (
                  <div className="opacity-0 group-hover:opacity-100 flex flex-col gap-1.5 transition-all">
                    {onEditContact && (
                      <button
                        onClick={() => onEditContact(contact as Contact)}
                        className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Modifier ce contact"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteContact(contact.id)}
                      className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Supprimer ce contact du dossier"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center">
              <User size={24} className="text-slate-200 mb-4" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Aucun contact référent</p>
            </div>
          )}
        </div>
      </section>

      {/* Observations Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
            <FileArchive size={16} className="text-amber-500" /> Observations Techniques
          </h3>
          {!isFactured && onSaveObservations && !isEditingObs && (
            <button
              onClick={() => setIsEditingObs(true)}
              className="w-8 h-8 bg-amber-50 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center"
              title="Modifier les observations"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden min-h-[160px]">
          {!isEditingObs && (
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-[4rem] flex items-center justify-center -mr-10 -mt-10 opacity-50">
              <Clock size={32} className="text-amber-200" />
            </div>
          )}
          {isEditingObs ? (
            <div className="space-y-4">
              <textarea
                value={obsValue}
                onChange={e => setObsValue(e.target.value)}
                rows={6}
                autoFocus
                placeholder="Observations techniques, remarques complémentaires..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-amber-400 font-medium text-sm text-slate-700 leading-relaxed resize-none transition-all"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setIsEditingObs(false); setObsValue(occupation.observations || ''); }}
                  className="h-8 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider"
                >
                  <X size={12} /> Annuler
                </button>
                <button
                  type="button"
                  disabled={savingObs}
                  onClick={async () => {
                    if (!onSaveObservations) return;
                    setSavingObs(true);
                    try { await onSaveObservations(obsValue); setIsEditingObs(false); }
                    finally { setSavingObs(false); }
                  }}
                  className="h-8 px-3 rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider"
                >
                  {savingObs ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Enregistrer
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-600 font-medium leading-relaxed italic text-sm relative z-10 whitespace-pre-wrap">
              {occupation.observations || "Aucune observation technique complémentaire n'a été consignée pour ce dossier d'occupation."}
            </p>
          )}
        </div>
      </section>
    </aside>
  );
}
