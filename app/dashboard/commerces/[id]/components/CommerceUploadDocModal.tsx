import React, { useState } from 'react';
import { X, Upload, FileText, Check, Loader2, FileStack } from 'lucide-react';
import axios from 'axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (name: string, file: File) => Promise<void>;
  isUploading: boolean;
  /** Dossier (occupation) courant : requis pour qualifier un document en AOT. */
  occupationId?: number | null;
  /** Gabarits AOT disponibles pour la régénération dans le style AOT. */
  aotGabarits?: any[];
  /** Appelé après création d'une autorisation (pour rafraîchir la liste). */
  onAotCreated?: () => void;
  /** Ouvre la demande de signature (dossier) après qualification. */
  onRequestSignature?: () => void;
}

const todayStr = () => new Date().toISOString().split('T')[0];
const isPdf = (f: File) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');

export default function CommerceUploadDocModal({ isOpen, onClose, onUpload, isUploading, occupationId, aotGabarits = [], onAotCreated, onRequestSignature }: Props) {
  const [docName, setDocName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [asAot, setAsAot] = useState(false);
  const [aotGabaritId, setAotGabaritId] = useState('');
  const [aotMode, setAotMode] = useState<'signed' | 'signature'>('signed');
  const [signDate, setSignDate] = useState<string>(todayStr());
  const [submittingAot, setSubmittingAot] = useState(false);

  if (!isOpen) return null;

  const reset = () => { setDocName(''); setFile(null); setAsAot(false); setAotGabaritId(''); setAotMode('signed'); setSignDate(todayStr()); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !docName.trim()) return;

    // Qualifier en AOT : créer une autorisation et y attacher le document tel quel.
    if (asAot && occupationId) {
      if (!isPdf(file)) {
        alert("Le document AOT doit être un fichier PDF.");
        return;
      }
      setSubmittingAot(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const up = await axios.post('/api/upload', fd);
        const created = await axios.post(`/api/occupations/${occupationId}/autorisations`, {
          libelle: docName.trim(),
          gabaritId: aotGabaritId || null,
        });
        const autorisationId = created.data.id;
        await axios.post(`/api/autorisations/${autorisationId}/final`, {
          url: up.data.url,
          signed: aotMode === 'signed',
          dateSignature: aotMode === 'signed' ? signDate : null,
        });
        onAotCreated?.();
        if (aotMode === 'signature') onRequestSignature?.();
        reset();
        onClose();
      } catch (err: any) {
        alert(err.response?.data?.error || "Erreur lors de la qualification en AOT");
      } finally {
        setSubmittingAot(false);
      }
      return;
    }

    await onUpload(docName.trim(), file);
    reset();
    onClose();
  };

  const busy = isUploading || submittingAot;

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

          {occupationId != null && (
            <div className={`rounded-2xl border p-4 transition-all ${asAot ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 bg-slate-50'}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={asAot}
                  onChange={(e) => setAsAot(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="flex items-center gap-2 text-sm font-black text-slate-800">
                  <FileStack size={16} className="text-indigo-500" /> Qualifier ce document en AOT
                </span>
              </label>
              {asAot && (
                <div className="mt-3 space-y-3">
                  <p className="text-[10px] font-medium text-slate-500 leading-snug">
                    Une autorisation sera créée pour ce dossier. Le document doit être un <strong>PDF</strong>.
                    Toutes les AOT du dossier sont fusionnées à la facturation.
                  </p>
                  <select
                    value={aotGabaritId}
                    onChange={(e) => setAotGabaritId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
                  >
                    <option value="">Gabarit AOT (défaut)</option>
                    {aotGabarits.map((g: any) => <option key={g.id} value={g.id}>{g.nom}</option>)}
                  </select>

                  {/* Choix : document signé ou à mettre en signature */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAotMode('signed')}
                      className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${aotMode === 'signed' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-400'}`}
                    >
                      Déjà signé
                    </button>
                    <button
                      type="button"
                      onClick={() => setAotMode('signature')}
                      className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${aotMode === 'signature' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-400'}`}
                    >
                      À mettre en signature
                    </button>
                  </div>
                  {aotMode === 'signed' && (
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date de signature</label>
                      <input
                        type="date" value={signDate} onChange={(e) => setSignDate(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-emerald-400"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            disabled={!file || !docName.trim() || busy}
            className="w-full py-5 bg-slate-950 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {busy ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {asAot ? <FileStack size={18} /> : <FileText size={18} className="group-hover:scale-110 transition-transform" />}
                {asAot ? "Créer l'AOT" : 'Enregistrer le document'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
