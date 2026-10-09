"use client";

import React, { useEffect, useRef } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';

interface Props {
  photo?: string | null;
  isUploading?: boolean;
  onUpload: (file: File) => void;
  onDelete: () => void;
}

// Photographie de la façade commerciale / du local du redevable : même champ (Tiers.photo) que sur le dossier Commerce.
// Ajout par bouton, glisser-déposer ou Ctrl+V (comme sur la fiche Commerce).
export default function TlpeFacadePhoto({ photo, isUploading, onUpload, onDelete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return; // ne pas détourner une saisie
      for (const item of Array.from(e.clipboardData?.items || [])) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) { onUpload(file); break; }
        }
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [onUpload]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row gap-5 items-start">
      <div
        className="w-full sm:w-64 aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f && f.type.startsWith('image/')) onUpload(f);
        }}
      >
        {isUploading ? (
          <Loader2 className="animate-spin text-purple-600" size={28} />
        ) : photo ? (
          <img src={photo} alt="Façade commerciale / local" className="w-full h-full object-cover cursor-pointer" onClick={() => window.open(photo, '_blank')} />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-400">
            <Camera size={26} />
            <p className="text-[10px] font-black uppercase tracking-widest">Aucune photo</p>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-3">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Façade commerciale / local</h3>
          <p className="text-xs text-slate-500 mt-1">
            Photographie du commerce ou du local du redevable. Elle est partagée avec la fiche Commerce du même tiers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
          >
            <Camera size={14} /> {photo ? 'Remplacer la photo' : 'Ajouter une photo'}
          </button>
          {photo && (
            <button
              onClick={onDelete}
              disabled={isUploading}
              className="flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} /> Supprimer
            </button>
          )}
          <span className="text-[11px] text-slate-400 font-medium">ou Ctrl+V / glisser-déposer</span>
        </div>
      </div>
    </div>
  );
}
