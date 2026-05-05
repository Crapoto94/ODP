import React from 'react';
import {
  ImageIcon,
  ExternalLink,
  FileText,
  FileArchive,
  Trash2,
} from 'lucide-react';

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
}

export default function DocumentList({
  documents,
  docCount,
  isFactured,
  onDeleteDocument,
  onOpenUploadModal,
}: Props) {
  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between group/title">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
          <ImageIcon size={16} className="text-blue-500" /> Documents & PJ ({docCount})
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
  );
}
