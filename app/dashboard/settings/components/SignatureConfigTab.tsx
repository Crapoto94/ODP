"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  PenLine,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Upload,
  FileKey,
  Image,
  Star
} from 'lucide-react';
import TabHeader from './TabHeader';
import ContentBox from './ContentBox';
import SignatoryModal from './SignatoryModal';

export default function SignatureConfigTab() {
  const [signatories, setSignatories] = useState<any[]>([]);
  const [loadingSignatories, setLoadingSignatories] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showSignatoryModal, setShowSignatoryModal] = useState(false);
  const [editingSignatory, setEditingSignatory] = useState<any>(null);

  // Per-signatory upload state
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [certPassword, setCertPassword] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchSignatories();
  }, []);

  const fetchSignatories = async () => {
    try {
      setLoadingSignatories(true);
      // Fetch all (including file paths) - need to get full records
      const res = await axios.get('/api/signatories');
      setSignatories(res.data);
    } catch (err) {
      console.error('Failed to load signatories:', err);
    } finally {
      setLoadingSignatories(false);
    }
  };

  const handleUpload = async (signatoryId: number, type: 'image' | 'certificate', file: File) => {
    const key = `${signatoryId}-${type}`;
    setUploading(u => ({ ...u, [key]: true }));
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('signatoryId', String(signatoryId));
      await axios.post('/api/settings/signature-files/upload', formData);
      setMessage({ type: 'success', text: type === 'image' ? 'Image téléchargée' : 'Certificat téléchargé' });
      fetchSignatories();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur de téléchargement' });
    } finally {
      setUploading(u => ({ ...u, [key]: false }));
    }
  };

  const handleDeleteFile = async (signatoryId: number, type: 'image' | 'certificate') => {
    if (!confirm('Supprimer ce fichier ?')) return;
    try {
      await axios.delete(`/api/settings/signature-files?type=${type}&signatoryId=${signatoryId}`);
      setMessage({ type: 'success', text: 'Fichier supprimé' });
      fetchSignatories();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur de suppression' });
    }
  };

  const handleSavePassword = async (signatoryId: number) => {
    try {
      await axios.patch(`/api/signatories/${signatoryId}/password`, {
        password: certPassword[signatoryId] || ''
      });
      setMessage({ type: 'success', text: 'Mot de passe enregistré' });
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    }
  };

  const handleDeleteSignatory = async (id: number) => {
    if (!confirm('Désactiver ce signataire ?')) return;
    try {
      await axios.delete(`/api/signatories/${id}`);
      fetchSignatories();
      setMessage({ type: 'success', text: 'Signataire désactivé' });
    } catch {
      setMessage({ type: 'error', text: 'Erreur de suppression' });
    }
  };

  const openModal = (sig: any = null) => {
    setEditingSignatory(sig);
    setShowSignatoryModal(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <TabHeader
        icon={PenLine}
        title="Configuration des Signatures"
        subtitle="Gérez les signataires, leurs images et certificats P12"
        accentColor="blue"
        action={{
          label: 'Ajouter un Signataire',
          icon: Plus,
          onClick: () => openModal(),
          variant: 'primary'
        }}
      />

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in zoom-in-95 duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="font-black text-[10px] uppercase tracking-widest">{message.text}</span>
        </div>
      )}

      <ContentBox
        loading={loadingSignatories}
        empty={signatories.length === 0}
        emptyIcon={<Shield size={48} className="text-slate-300" />}
        emptyMessage="Aucun signataire configuré"
      >
        <div className="divide-y divide-slate-100">
          {signatories.map(sig => {
            const isExpanded = expandedId === sig.id;
            const imgUploading = uploading[`${sig.id}-image`];
            const certUploading = uploading[`${sig.id}-certificate`];

            return (
              <div key={sig.id}>
                {/* Signatory row */}
                <div
                  className="p-5 hover:bg-slate-50/50 transition-colors flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : sig.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                      {sig.nom[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-slate-900">{sig.nom}</p>
                        {sig.isDefault && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[8px] font-black uppercase tracking-widest">
                            <Star size={8} /> Défaut
                          </span>
                        )}
                        {/* File status badges */}
                        {sig.signatureImagePath && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                            <Image size={8} /> Image
                          </span>
                        )}
                        {sig.signatureCertificatePath && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                            <FileKey size={8} /> P12
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{sig.email} · {sig.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => openModal(sig)}
                      className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Modifier"
                    >
                      <PenLine size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteSignatory(sig.id)}
                      className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Désactiver"
                    >
                      <Trash2 size={15} />
                    </button>
                    <span className="text-slate-300 text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded file management */}
                {isExpanded && (
                  <div className="px-6 pb-6 bg-slate-50/40 border-t border-slate-100 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">

                      {/* Signature Image */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Image size={14} className="text-blue-600" />
                          <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Image de Signature</p>
                        </div>

                        {sig.signatureImagePath ? (
                          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                            <img
                              src={sig.signatureImagePath}
                              alt="Signature"
                              className="h-10 w-auto object-contain border border-slate-100 rounded"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-700 truncate">{sig.signatureImagePath.split('/').pop()}</p>
                              <p className="text-[9px] text-slate-400">Image configurée</p>
                            </div>
                            <button
                              onClick={() => handleDeleteFile(sig.id, 'image')}
                              className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all">
                            <input
                              type="file"
                              accept=".png,.svg"
                              className="hidden"
                              disabled={imgUploading}
                              onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) handleUpload(sig.id, 'image', f);
                              }}
                            />
                            {imgUploading
                              ? <Loader2 size={20} className="animate-spin text-blue-500" />
                              : <Upload size={20} className="text-slate-300" />
                            }
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              {imgUploading ? 'Téléchargement...' : 'PNG ou SVG · Max 5MB'}
                            </p>
                          </label>
                        )}
                      </div>

                      {/* P12 Certificate */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <FileKey size={14} className="text-purple-600" />
                          <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Certificat P12</p>
                        </div>

                        {sig.signatureCertificatePath ? (
                          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                              <FileKey size={14} className="text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-700 truncate">{sig.signatureCertificatePath.split('/').pop()}</p>
                              <p className="text-[9px] text-slate-400">Certificat configuré</p>
                            </div>
                            <button
                              onClick={() => handleDeleteFile(sig.id, 'certificate')}
                              className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-purple-400 hover:bg-purple-50/30 cursor-pointer transition-all">
                            <input
                              type="file"
                              accept=".p12,.pfx"
                              className="hidden"
                              disabled={certUploading}
                              onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) handleUpload(sig.id, 'certificate', f);
                              }}
                            />
                            {certUploading
                              ? <Loader2 size={20} className="animate-spin text-purple-500" />
                              : <Upload size={20} className="text-slate-300" />
                            }
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              {certUploading ? 'Téléchargement...' : 'P12 ou PFX · Max 10MB'}
                            </p>
                          </label>
                        )}

                        {/* Certificate password */}
                        {sig.signatureCertificatePath && (
                          <div className="flex gap-2">
                            <input
                              type="password"
                              placeholder="Mot de passe du certificat"
                              value={certPassword[sig.id] ?? ''}
                              onChange={e => setCertPassword(p => ({ ...p, [sig.id]: e.target.value }))}
                              className="flex-1 bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-bold outline-none focus:border-purple-400 transition-all"
                            />
                            <button
                              onClick={() => handleSavePassword(sig.id)}
                              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all"
                            >
                              OK
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ContentBox>

      <SignatoryModal
        show={showSignatoryModal}
        onClose={() => { setShowSignatoryModal(false); setEditingSignatory(null); }}
        editingSignatory={editingSignatory}
        onSaved={() => { fetchSignatories(); setShowSignatoryModal(false); setEditingSignatory(null); }}
      />
    </div>
  );
}
