import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  FileStack, FileText, Loader2, Plus, Trash2, Upload, Download,
  CheckCircle2, AlertCircle, AlertTriangle, Send, X,
} from 'lucide-react';
import { checkAotAlert, getAotAlertMessage } from '@/lib/aot-alerts';

interface Autorisation {
  id: number;
  occupationId: number;
  libelle: string;
  gabaritId: number | null;
  dateDebut: string | null;
  dateFin: string | null;
  generatedPath: string | null;
  generatedPdf: string | null;
  finalPath: string | null;
  signed: boolean;
  dateSignature: string | null;
  ordre: number;
}

interface Props {
  occupationId: number | null | undefined;
  aotGabarits: any[];
  readOnly?: boolean;
  onSendForSignature?: () => void;
  /** Incrémenter cette valeur pour forcer un rechargement (ex: AOT créée ailleurs). */
  reloadSignal?: number;
}

const toDateInput = (d: string | null) => (d ? new Date(d).toISOString().split('T')[0] : '');
const isPdf = (f: File) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');

export default function AutorisationsList({ occupationId, aotGabarits, readOnly, onSendForSignature, reloadSignal }: Props) {
  const [items, setItems] = useState<Autorisation[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newLibelle, setNewLibelle] = useState('');
  const [newGabaritId, setNewGabaritId] = useState('');
  const [creating, setCreating] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{ id: number; file: File } | null>(null);
  const [signDate, setSignDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  const fetchItems = useCallback(async () => {
    if (!occupationId) { setItems([]); return; }
    setLoading(true);
    try {
      const res = await axios.get(`/api/occupations/${occupationId}/autorisations`);
      setItems(res.data || []);
    } catch (err) {
      console.error('[AutorisationsList] fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, [occupationId]);

  useEffect(() => { fetchItems(); }, [fetchItems, reloadSignal]);

  const handleCreate = async () => {
    if (!occupationId || !newLibelle.trim()) return;
    setCreating(true);
    try {
      await axios.post(`/api/occupations/${occupationId}/autorisations`, {
        libelle: newLibelle.trim(),
        gabaritId: newGabaritId || null,
      });
      setNewLibelle('');
      setNewGabaritId('');
      setShowAdd(false);
      await fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.error || "Erreur lors de la création de l'autorisation");
    } finally {
      setCreating(false);
    }
  };

  const patch = async (id: number, data: any) => {
    try {
      await axios.patch(`/api/autorisations/${id}`, data);
      await fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de la mise à jour');
    }
  };

  const handleGenerate = async (id: number) => {
    setBusyId(id);
    try {
      await axios.post(`/api/autorisations/${id}/generate`);
      await fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.error || "Erreur lors de la génération de l'AOT");
    } finally {
      setBusyId(null);
    }
  };

  // Upload d'un document AOT : on demande ensuite s'il est signé ou à mettre en signature.
  const submitUpload = async (mode: 'signed' | 'signature') => {
    if (!pendingUpload) return;
    const { id, file } = pendingUpload;
    setBusyId(id);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await axios.post('/api/upload', fd);
      await axios.post(`/api/autorisations/${id}/final`, {
        url: up.data.url,
        signed: mode === 'signed',
        dateSignature: mode === 'signed' ? signDate : null,
      });
      setPendingUpload(null);
      await fetchItems();
      if (mode === 'signature') onSendForSignature?.();
    } catch (err: any) {
      alert(err.response?.data?.error || "Erreur lors de l'envoi du document");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette autorisation ?')) return;
    setBusyId(id);
    try {
      await axios.delete(`/api/autorisations/${id}`);
      await fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setBusyId(null);
    }
  };

  if (!occupationId) return null;

  return (
    <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
            <FileStack size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Autorisations (AOT)</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {items.length} autorisation{items.length !== 1 ? 's' : ''} · fusionnées à la facturation
            </p>
          </div>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            {onSendForSignature && (
              <button
                onClick={onSendForSignature}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border-2 border-blue-100 text-blue-600 hover:bg-blue-50 transition-all"
              >
                <Send size={14} /> Signature
              </button>
            )}
            <button
              onClick={() => setShowAdd(v => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 transition-all"
            >
              <Plus size={14} /> Ajouter
            </button>
          </div>
        )}
      </div>

      {showAdd && !readOnly && (
        <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
          <input
            autoFocus
            type="text"
            value={newLibelle}
            onChange={e => setNewLibelle(e.target.value)}
            placeholder="Libellé (ex: AOT terrasse Estivale, Arrêté enseignes...)"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={newGabaritId}
              onChange={e => setNewGabaritId(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
            >
              <option value="">Gabarit (défaut)</option>
              {aotGabarits.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
            </select>
            <button
              disabled={!newLibelle.trim() || creating}
              onClick={handleCreate}
              className="px-5 py-3 rounded-xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Créer
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-3 py-3 rounded-xl text-slate-400 hover:text-slate-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400 italic py-6 text-center">Aucune autorisation. Cliquez sur « Ajouter » pour en créer une.</p>
      ) : (
        <div className="space-y-3">
          {items.map(a => {
            const alert = a.dateSignature ? checkAotAlert(a.dateSignature) : null;
            const downloadUrl = a.finalPath || a.generatedPdf || a.generatedPath;
            const busy = busyId === a.id;
            return (
              <div key={a.id} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        disabled={readOnly}
                        defaultValue={a.libelle}
                        onBlur={e => { if (e.target.value.trim() && e.target.value !== a.libelle) patch(a.id, { libelle: e.target.value.trim() }); }}
                        className="text-sm font-black text-slate-900 bg-transparent outline-none border-b border-transparent focus:border-indigo-300 min-w-[200px]"
                      />
                      {a.signed && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700">
                          <CheckCircle2 size={10} /> Signé
                        </span>
                      )}
                      {!a.signed && (a.generatedPdf || a.generatedPath) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-700">
                          <FileText size={10} /> Généré
                        </span>
                      )}
                      {alert?.hasAlert && (
                        <span
                          title={getAotAlertMessage(alert)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${alert.isExpired ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}
                        >
                          {alert.isExpired ? <AlertTriangle size={10} /> : <AlertCircle size={10} />}
                          {alert.isExpired ? `${Math.abs(alert.daysUntilExpiry || 0)}j` : `${alert.daysUntilExpiry}j`}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <select
                        disabled={readOnly}
                        value={a.gabaritId || ''}
                        onChange={e => patch(a.id, { gabaritId: e.target.value || null })}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-400"
                      >
                        <option value="">Gabarit (défaut)</option>
                        {aotGabarits.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
                      </select>
                      <label className="text-[9px] font-black text-slate-400 uppercase">Du</label>
                      <input
                        type="date" disabled={readOnly} defaultValue={toDateInput(a.dateDebut)}
                        onBlur={e => patch(a.id, { dateDebut: e.target.value || null })}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-indigo-400"
                      />
                      <label className="text-[9px] font-black text-slate-400 uppercase">Au</label>
                      <input
                        type="date" disabled={readOnly} defaultValue={toDateInput(a.dateFin)}
                        onBlur={e => patch(a.id, { dateFin: e.target.value || null })}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!readOnly && (
                      <button
                        onClick={() => handleGenerate(a.id)}
                        disabled={busy}
                        title="Générer dans le style AOT"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
                      >
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} Générer
                      </button>
                    )}
                    {downloadUrl && (
                      <a
                        href={downloadUrl} target="_blank" rel="noopener noreferrer"
                        title="Télécharger le document"
                        className="flex items-center justify-center w-9 h-9 rounded-lg bg-white border-2 border-slate-100 text-slate-500 hover:bg-slate-50"
                      >
                        <Download size={15} />
                      </a>
                    )}
                    {!readOnly && (
                      <>
                        <button
                          onClick={() => fileInputs.current[a.id]?.click()}
                          disabled={busy}
                          title="Téléverser le document AOT"
                          className="flex items-center justify-center w-9 h-9 rounded-lg bg-white border-2 border-amber-100 text-amber-600 hover:bg-amber-50 disabled:opacity-40"
                        >
                          <Upload size={15} />
                        </button>
                        <input
                          ref={el => { fileInputs.current[a.id] = el; }}
                          type="file" accept="application/pdf,.pdf" className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (!f) return;
                            if (!isPdf(f)) { window.alert("Le document AOT doit être un fichier PDF."); return; }
                            setSignDate(new Date().toISOString().split('T')[0]);
                            setPendingUpload({ id: a.id, file: f });
                          }}
                        />
                        <button
                          onClick={() => handleDelete(a.id)}
                          disabled={busy}
                          title="Supprimer"
                          className="flex items-center justify-center w-9 h-9 rounded-lg bg-white border-2 border-rose-100 text-rose-500 hover:bg-rose-50 disabled:opacity-40"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Choix après upload d'un document AOT : signé ou à mettre en signature */}
      {pendingUpload && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-black text-slate-900">Document AOT</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate max-w-[300px]">
                  {pendingUpload.file.name}
                </p>
              </div>
              <button onClick={() => setPendingUpload(null)} className="p-2 text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500 font-medium">Que souhaitez-vous faire de ce document ?</p>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date de signature</label>
                  <input
                    type="date" value={signDate} onChange={e => setSignDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-emerald-400"
                  />
                </div>
                <button
                  onClick={() => submitUpload('signed')}
                  disabled={busyId === pendingUpload.id}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-40"
                >
                  {busyId === pendingUpload.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Qualifier de signé
                </button>
              </div>

              <button
                onClick={() => submitUpload('signature')}
                disabled={busyId === pendingUpload.id}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border-2 border-blue-100 text-blue-600 text-[11px] font-black uppercase tracking-widest hover:bg-blue-50 disabled:opacity-40"
              >
                {busyId === pendingUpload.id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Mettre en signature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
