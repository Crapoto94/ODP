import React, { useState } from 'react';
import { X, Upload, FileText, Check, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (name: string, file: File) => Promise<void>;
  isUploading: boolean;
}

export default function CommerceUploadDocModal({ isOpen, onClose, onUpload, isUploading }: Props) {
  const [docName, setDocName] = useState('');
  const [file, setFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !docName.trim()) return;
    await onUpload(docName.trim(), file);
    setDocName('');
    setFile(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Joindre un document</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Saisissez une désignation et choisissez un fichier</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Désignation du document</label>
            <input
              autoFocus
              required
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="Ex: Facture, Plan de situation..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fichier</label>
            <div className={`relative group transition-all ${file ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/30'} border-2 border-dashed rounded-[1.5rem] p-8 text-center`}>
              <input
                required
                type="file"
                accept="application/pdf,image/*,.doc,.docx,.xlsx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all ${file ? 'bg-emerald-600 text-white animate-bounce' : 'bg-white text-slate-400 shadow-sm border border-slate-100 group-hover:scale-110'}`}>
                  {file ? <Check size={24} /> : <Upload size={24} />}
                </div>
                {file ? (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Fichier sélectionné</p>
                    <p className="text-sm font-black text-emerald-950 truncate max-w-[250px]">{file.name}</p>
                  </div>
                ) : (
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliquez ou glissez un fichier</p>
                )}
              </div>
            </div>
          </div>

          <button
            disabled={!file || !docName.trim() || isUploading}
            className="w-full py-5 bg-slate-950 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isUploading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <FileText size={18} className="group-hover:scale-110 transition-transform" />
                Enregistrer le document
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
