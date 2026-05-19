import React from 'react';
import {
  ImageIcon,
  ExternalLink,
  FileText,
  FileArchive,
  Trash2,
  Send,
  Loader2,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { checkAotAlert, getAotAlertMessage } from '@/lib/aot-alerts';

interface Document {
  id: number;
  description: string;
  name: string;
  path: string;
  created_at: string;
}

interface Props {
  documents: Document[];
  docCount: number;
  isFactured?: boolean;
  onDeleteDocument?: (id: number) => void;
  onOpenUploadModal?: () => void;
  occupation?: any;
  onSendAot?: () => void;
  isSendingAot?: boolean;
  aotSentMsg?: string | null;
}

export default function DocumentList({  documents,
  docCount,
  isFactured,
  onDeleteDocument,
  onOpenUploadModal,
  occupation,
  onSendAot,
  isSendingAot,
  aotSentMsg,
}: Props) {
  const totalCount = docCount + (occupation?.aotFinalPath ? 1 : 0);

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between group/title">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
          <ImageIcon size={16} className="text-blue-500" /> Documents & PJ ({totalCount})
        </h3>
        {!isFactured && onOpenUploadModal && (
          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm cursor-pointer group-hover/title:scale-105 active:scale-95 group/btn"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            <span className="text-[9px] font-black uppercase tracking-widest">Joindre un document</span>
          </button>
        )}
      </div>

      {occupation && occupation.aotFinalPath && occupation.aotDate && (() => {
        const aotAlert = checkAotAlert(occupation.aotDate);
        return aotAlert.hasAlert ? (
          <div className={`p-4 rounded-2xl border-2 flex items-start gap-3 ${
            aotAlert.isExpired
              ? 'bg-rose-50 border-rose-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            {aotAlert.isExpired ? (
              <AlertTriangle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`text-sm font-black ${aotAlert.isExpired ? 'text-rose-700' : 'text-amber-700'}`}>
                {getAotAlertMessage(aotAlert)}
              </p>
              <p className={`text-[10px] font-bold mt-1 ${aotAlert.isExpired ? 'text-rose-600' : 'text-amber-600'}`}>
                Date de signature : {new Date(occupation.aotDate).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        ) : null;
      })()}

      <div className="flex flex-col gap-3">
        {documents.map((doc) => {
          const isPdf = doc.path.toLowerCase().endsWith('.pdf');

          return (
            <div
              key={doc.id}
              className="group flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              <a
                href={doc.path}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 flex-1 min-w-0"
              >
                <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center transition-colors ${isPdf ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white' : 'bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white'} border border-transparent`}>
                  {isPdf ? <FileText size={20} /> : <ImageIcon size={20} />}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest truncate">{doc.description}</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1">
                    {doc.name} • {isPdf ? 'Format PDF' : 'Fichier Image'} • Cliquez pour ouvrir
                  </p>
                </div>

                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
                  <ExternalLink size={14} />
                </div>
              </a>

              {!isFactured && onDeleteDocument && (
                <button
                  onClick={() => onDeleteDocument(doc.id)}
                  className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  title="Supprimer ce document"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}

        {occupation && occupation.aotFinalPath && occupation.aotSigned && (
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
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-[8px] font-black text-emerald-400/70 uppercase tracking-tighter">
                    Document Finalisé
                  </p>
                  {occupation.aotDate ? (
                    <span className="text-[8px] font-bold text-emerald-600 bg-emerald-100/50 px-2.5 py-1 rounded-md">
                      {new Date(occupation.aotDate).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  ) : (
                    <span className="text-[8px] font-bold text-slate-400 bg-slate-100/50 px-2.5 py-1 rounded-md">
                      Date à déterminer
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={e => { e.preventDefault(); if(onSendAot) onSendAot(); }}
                disabled={isSendingAot}
                title="Envoyer au demandeur"
                className="h-8 px-3 rounded-lg bg-white border border-emerald-200 flex items-center gap-1.5 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 disabled:opacity-40 transition-all shrink-0 text-[9px] font-black uppercase tracking-wider"
              >
                {isSendingAot ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Envoyer
              </button>
            </a>
            {aotSentMsg && (
              <p className={`text-[9px] font-black px-2 ${aotSentMsg.startsWith('Erreur') ? 'text-rose-500' : 'text-emerald-600'}`}>{aotSentMsg}</p>
            )}
          </div>
        )}

        {occupation && occupation.aotFinalPath && !occupation.aotSigned && (
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
                onClick={e => { e.preventDefault(); if(onSendAot) onSendAot(); }}
                disabled={isSendingAot}
                title="Envoyer au demandeur"
                className="h-8 px-3 rounded-lg bg-white border border-amber-200 flex items-center gap-1.5 text-amber-600 hover:bg-amber-500 hover:text-white hover:border-amber-500 disabled:opacity-40 transition-all shrink-0 text-[9px] font-black uppercase tracking-wider"
              >
                {isSendingAot ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Envoyer
              </button>
            </a>
            {aotSentMsg && (
              <p className={`text-[9px] font-black px-2 ${aotSentMsg.startsWith('Erreur') ? 'text-rose-500' : 'text-emerald-600'}`}>{aotSentMsg}</p>
            )}
          </div>
        )}

        {totalCount === 0 && (
          <div className="py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <FileArchive size={20} className="text-slate-300" />
            </div>
            <p className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">Aucun document joint</p>
          </div>
        )}
      </div>
    </section>
  );
}
