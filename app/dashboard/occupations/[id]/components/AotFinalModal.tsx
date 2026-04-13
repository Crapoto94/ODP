'use client';

import React, { useRef } from 'react';
import { X, FileText, Loader2, Upload } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isUploading: boolean;
  onUpload: (file: File) => Promise<void>;
}

export default function AotFinalModal({ isOpen, onClose, isUploading, onUpload }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isDocx = file.name.toLowerCase().endsWith('.docx');
    const isPdf = file.name.toLowerCase().endsWith('.pdf');

    if (!isDocx && !isPdf) {
      alert('Seuls les fichiers .docx ou .pdf sont acceptés');
      return;
    }

    await onUpload(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
            onClick={onClose}
            disabled={isUploading}
            className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-sm text-slate-600 mb-4">
              Téléchargez le document AOT signé et finalisé. Ce document marquera la fin de la préparation de l'arrêté.
            </p>

            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer transition-all ${
                !isUploading ? 'hover:border-amber-400 hover:bg-amber-50' : ''
              }`}
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
              disabled={isUploading}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Télécharger
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
