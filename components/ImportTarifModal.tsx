"use client";

import React, { useState } from 'react';
import { X, Upload, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, Calendar } from 'lucide-react';
import axios from 'axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportTarifModal({ isOpen, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const res = await axios.post('/api/tarifs/import', {
            file: reader.result,
            annee: year
          });
          setResult(res.data);
          onSuccess();
        } catch (err: any) {
          setError(err.response?.data?.error || "Erreur lors de l'import");
        } finally {
          setImporting(false);
        }
      };
    } catch (err) {
      setError("Erreur de lecture du fichier");
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Importation des Tarifs</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Format Excel Municipal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-slate-300 hover:text-slate-900 transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {!result ? (
            <>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Calendar size={14} /> Année d'application
                </label>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
                   {['2023', '2024', '2025', '2026'].map(y => (
                     <button
                       key={y}
                       onClick={() => setYear(y)}
                       className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${year === y ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                       {y}
                     </button>
                   ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sélectionner le fichier Excel</label>
                <label className={`block border-2 border-dashed rounded-[2rem] p-10 text-center cursor-pointer transition-all ${file ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-blue-500 hover:bg-slate-50'}`}>
                  <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
                  <Upload size={32} className={`mx-auto mb-4 ${file ? 'text-emerald-500' : 'text-slate-300'}`} />
                  {file ? (
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-900">{file.name}</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">{(file.size / 1024).toFixed(0)} KB - Prêt à l'import</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-400">Cliquez pour parcourir</p>
                      <p className="text-[10px] font-bold text-slate-300 uppercase">Format .xlsx uniquement</p>
                    </div>
                  )}
                </label>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3 text-rose-600">
                  <AlertCircle size={18} />
                  <p className="text-xs font-bold">{error}</p>
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={!file || importing}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-3xl font-black shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
              >
                {importing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                Lancer l'importation
              </button>
            </>
          ) : (
            <div className="py-10 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                <CheckCircle2 size={40} />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black text-slate-900">Import réussi !</h4>
                <p className="text-sm font-bold text-slate-500">
                  {result.count} articles et leurs catégories ont été synchronisés pour l'année {year}.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
