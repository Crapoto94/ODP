"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, X, Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface Signatory {
  id: number;
  nom: string;
  email: string;
  role: string;
  isDefault: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  occupationId: number;
  onSuccess?: () => void;
}

export default function SignatureRequestModal({ isOpen, onClose, occupationId, onSuccess }: Props) {
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [loadingSignatories, setLoadingSignatories] = useState(true);
  const [selectedSignatoryId, setSelectedSignatoryId] = useState<number | null>(null);
  const [documentType, setDocumentType] = useState<'pdf' | 'docx'>('pdf');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ link: string; signatorName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSignatories();
      setSuccess(null);
      setError(null);
    }
  }, [isOpen]);

  const fetchSignatories = async () => {
    try {
      setLoadingSignatories(true);
      const res = await axios.get('/api/signatories');
      setSignatories(res.data);
      // Auto-select the default signatory
      const defaultSignatory = res.data.find((s: Signatory) => s.isDefault);
      if (defaultSignatory) {
        setSelectedSignatoryId(defaultSignatory.id);
      } else if (res.data.length > 0) {
        setSelectedSignatoryId(res.data[0].id);
      }
    } catch (err) {
      setError('Impossible de charger les signataires. Configurez-les dans Paramètres → Signatures.');
    } finally {
      setLoadingSignatories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSignatoryId) {
      setError('Sélectionnez un signataire');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await axios.post(`/api/occupations/${occupationId}/signature-request`, {
        signatoriesId: selectedSignatoryId,
        documentType
      });

      const signatory = signatories.find(s => s.id === selectedSignatoryId);
      setSuccess({
        link: res.data.signatureLink,
        signatorName: signatory?.nom || 'Signataire'
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi de la demande de signature');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Send size={20} className="text-blue-600" />
              Envoyer pour Signature
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              AOT #{occupationId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            disabled={submitting}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="text-emerald-500 mx-auto" size={48} />
              <div>
                <p className="font-black text-slate-900 text-lg">Demande envoyée !</p>
                <p className="text-slate-600 text-sm mt-1">
                  Un email a été envoyé à <strong>{success.signatorName}</strong> avec un lien de signature.
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lien de signature</p>
                <p className="text-xs font-bold text-blue-600 break-all">{success.link}</p>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-black text-[10px] uppercase tracking-widest"
              >
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-sm font-bold flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Signatory selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                  Signataire *
                </label>
                {loadingSignatories ? (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <Loader2 size={16} className="animate-spin text-blue-600" />
                    <span className="text-sm text-slate-500">Chargement...</span>
                  </div>
                ) : signatories.length === 0 ? (
                  <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm">
                    Aucun signataire configuré. Allez dans <strong>Paramètres → Signatures</strong>.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {signatories.map(signatory => (
                      <label
                        key={signatory.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedSignatoryId === signatory.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="signatory"
                          value={signatory.id}
                          checked={selectedSignatoryId === signatory.id}
                          onChange={() => setSelectedSignatoryId(signatory.id)}
                          className="accent-blue-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-black text-slate-900 text-sm">{signatory.nom}</p>
                            {signatory.isDefault && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[8px] font-black uppercase tracking-widest">
                                Défaut
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500">{signatory.email} · {signatory.role}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Document type */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                  Format du document
                </label>
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    documentType === 'pdf' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="documentType"
                      value="pdf"
                      checked={documentType === 'pdf'}
                      onChange={() => setDocumentType('pdf')}
                      className="hidden"
                    />
                    <span className="text-lg">📄</span>
                    <span className="font-black text-sm">PDF</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    documentType === 'docx' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="documentType"
                      value="docx"
                      checked={documentType === 'docx'}
                      onChange={() => setDocumentType('docx')}
                      className="hidden"
                    />
                    <span className="text-lg">📝</span>
                    <span className="font-black text-sm">DOCX</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  disabled={submitting || signatories.length === 0}
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Envoyer
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
