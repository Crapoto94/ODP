'use client';

import React, { useRef, useState } from 'react';
import { X, FileText, Loader2, Upload, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isUploading: boolean;
  onUpload: (file: File, isSigned: boolean) => Promise<void>;
}

export default function AotFinalModal({ isOpen, onClose, isUploading, onUpload }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isDocx = file.name.toLowerCase().endsWith('.docx');
    const isPdf = file.name.toLowerCase().endsWith('.pdf');

    if (!isDocx && !isPdf) {
      alert('Seuls les fichiers .docx ou .pdf sont acceptés');
      return;
    }

    setPendingFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSignedAnswer = async (isSigned: boolean) => {
    if (!pendingFile) return;
    await onUpload(pendingFile, isSigned);
    setPendingFile(null);
  };

  const handleClose = () => {
    setPendingFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <FileText size={20} className="text-amber-600" />
            </div>
            <h2 className="text-lg font-black text-slate-950">AOT Final</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {pendingFile ? (
            /* Step 2 — ask if signed */
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <FileText size={18} className="text-slate-500 shrink-0" />
                <span className="text-sm font-bold text-slate-700 truncate">{pendingFile.name}</span>
              </div>

              <div>
                <p className="text-sm font-black text-slate-800 mb-1">Ce document est-il déjà signé ?</p>
                <p className="text-xs text-slate-500">
                  Cela détermine son statut dans le dossier.
                </p>
              </div>

              {isUploading ? (
                <div className="flex items-center justify-center gap-3 py-4">
                  <Loader2 size={20} className="animate-spin text-amber-600" />
                  <span className="text-sm font-bold text-slate-600">Envoi en cours...</span>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSignedAnswer(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-slate-200 hover:border-slate-400 rounded-xl font-bold text-sm text-slate-700 transition-all"
                  >
                    <XCircle size={18} className="text-slate-400" />
                    Non signé
                  </button>
                  <button
                    onClick={() => handleSignedAnswer(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
                  >
                    <CheckCircle2 size={18} />
                    Oui, signé
                  </button>
                </div>
              )}

              {!isUploading && (
                <button
                  onClick={() => setPendingFile(null)}
                  className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ← Changer de fichier
                </button>
              )}
            </div>
          ) : (
            /* Step 1 — file selection */
            <>
              <div>
                <p className="text-sm text-slate-600 mb-4">
                  Téléchargez le document AOT finalisé. Ce document marquera la fin de la préparation de l'arrêté.
                </p>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer transition-all hover:border-amber-400 hover:bg-amber-50"
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                      <Upload size={24} className="text-amber-600" />
                    </div>
                  </div>
                  <p className="font-bold text-slate-900 mb-1">Cliquez pour télécharger</p>
                  <p className="text-xs text-slate-500">ou glissez-déposez un fichier .docx ou .pdf</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Upload size={16} />
                  Télécharger
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
