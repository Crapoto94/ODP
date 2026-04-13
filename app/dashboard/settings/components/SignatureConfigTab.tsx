"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Signature,
  Upload,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  FileKey
} from 'lucide-react';
import TabHeader from './TabHeader';
import ContentBox from './ContentBox';
import SignatoryModal from './SignatoryModal';

export default function SignatureConfigTab() {
  const [signatories, setSignatories] = useState<any[]>([]);
  const [loadingSignatories, setLoadingSignatories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showSignatoryModal, setShowSignatoryModal] = useState(false);
  const [editingSignatory, setEditingSignatory] = useState<any>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);

  useEffect(() => {
    fetchSignatories();
  }, []);

  const fetchSignatories = async () => {
    try {
      setLoadingSignatories(true);
      const res = await axios.get('/api/signatories');
      setSignatories(res.data);
    } catch (err) {
      console.error('Failed to load signatories:', err);
    } finally {
      setLoadingSignatories(false);
    }
  };

  const handleUploadSignatureImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return;

    setSaving(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('type', 'image');

      await axios.post('/api/settings/signature-files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage({ type: 'success', text: 'Image de signature téléchargée avec succès' });
      setImageFile(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur de téléchargement' });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certFile) return;

    setSaving(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', certFile);
      formData.append('type', 'certificate');

      await axios.post('/api/settings/signature-files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage({ type: 'success', text: 'Certificat P12 téléchargé avec succès' });
      setCertFile(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur de téléchargement' });
    } finally {
      setSaving(false);
    }
  };

  const openSignatoryModal = (signatory: any = null) => {
    setEditingSignatory(signatory);
    setShowSignatoryModal(true);
  };

  const handleDeleteSignatory = async (id: number) => {
    if (!confirm('Supprimer ce signataire ?')) return;
    try {
      await axios.delete(`/api/signatories/${id}`);
      fetchSignatories();
      setMessage({ type: 'success', text: 'Signataire supprimé avec succès' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur de suppression' });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <TabHeader
        icon={Signature}
        title="Configuration de Signature"
        subtitle="Gérez les signataires et les fichiers de signature"
        accentColor="blue"
        action={{
          label: 'Ajouter un Signataire',
          icon: Plus,
          onClick: () => openSignatoryModal(),
          variant: 'primary'
        }}
      />

      {/* File Upload Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
          {/* Signature Image Upload */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Upload size={16} className="text-blue-600" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Image de Signature</h3>
            </div>

            <form onSubmit={handleUploadSignatureImage} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer">
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept=".png,.svg"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="hidden"
                    disabled={saving}
                  />
                  <div className="space-y-2">
                    <div className="text-3xl">📷</div>
                    <p className="text-sm font-bold text-slate-700">
                      {imageFile ? imageFile.name : 'Cliquez ou glissez votre image (PNG, SVG)'}
                    </p>
                    <p className="text-[10px] text-slate-500">Max 5MB • PNG ou SVG transparent</p>
                  </div>
                </label>
              </div>

              {imageFile && (
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                  Télécharger l'image
                </button>
              )}
            </form>
          </div>

          <div className="border-t border-slate-50" />

          {/* P12 Certificate Upload */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <FileKey size={16} className="text-purple-600" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Certificat P12</h3>
            </div>

            <form onSubmit={handleUploadCertificate} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-purple-400 hover:bg-purple-50/30 transition-all cursor-pointer">
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept=".p12,.pfx"
                    onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                    className="hidden"
                    disabled={saving}
                  />
                  <div className="space-y-2">
                    <div className="text-3xl">🔐</div>
                    <p className="text-sm font-bold text-slate-700">
                      {certFile ? certFile.name : 'Cliquez ou glissez votre certificat (P12, PFX)'}
                    </p>
                    <p className="text-[10px] text-slate-500">Max 10MB • Certificat P12/PFX</p>
                  </div>
                </label>
              </div>

              {certFile && (
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                  Télécharger le certificat
                </button>
              )}
            </form>
          </div>

          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 animate-in zoom-in-95 duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="font-black text-[10px] uppercase tracking-widest">{message.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* Signatories List */}
      <ContentBox
        loading={loadingSignatories}
        empty={signatories.length === 0}
        emptyIcon={<Shield size={48} className="text-slate-300" />}
        emptyMessage="Aucun signataire configuré"
      >
        <div className="divide-y divide-slate-100">
          {signatories.map(signatory => (
            <div key={signatory.id} className="p-6 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                    {signatory.nom[0]}
                  </div>
                  <div>
                    <p className="font-black text-slate-900">{signatory.nom}</p>
                    <p className="text-[10px] text-slate-400">{signatory.email} • {signatory.role}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {signatory.isDefault && (
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-[9px] font-black uppercase tracking-widest">
                    Par défaut
                  </span>
                )}
                <button
                  onClick={() => openSignatoryModal(signatory)}
                  className="p-2.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  title="Éditer"
                >
                  ✎
                </button>
                <button
                  onClick={() => handleDeleteSignatory(signatory.id)}
                  className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </ContentBox>

      <SignatoryModal
        show={showSignatoryModal}
        onClose={() => {
          setShowSignatoryModal(false);
          setEditingSignatory(null);
        }}
        editingSignatory={editingSignatory}
        onSaved={() => {
          fetchSignatories();
          setShowSignatoryModal(false);
          setEditingSignatory(null);
        }}
      />
    </div>
  );
}
