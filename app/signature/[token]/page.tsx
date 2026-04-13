"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle2, XCircle, Loader2, AlertCircle, Clock, FileText } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function SignaturePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signatureRequest, setSignatureRequest] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionComment, setRejectionComment] = useState('');

  useEffect(() => {
    loadSignatureRequest();
  }, [token]);

  const loadSignatureRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`/api/signature/${token}/view`);
      setSignatureRequest(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur de chargement du document');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      await axios.post(`/api/signature/${token}/accept`);
      setSuccessMessage('✅ Document signé avec succès! Redirection en cours...');
      setTimeout(() => router.push('/'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la signature');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (rejectionComment.length > 500) {
      setError('Le commentaire ne peut pas dépasser 500 caractères');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`/api/signature/${token}/reject`, {
        comment: rejectionComment
      });
      setSuccessMessage('Signature rejetée. Notification envoyée à l\'administrateur.');
      setTimeout(() => router.push('/'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du rejet');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-slate-600 font-bold">Chargement du document...</p>
        </div>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md animate-in zoom-in-95 duration-300">
          <CheckCircle2 className="text-emerald-600 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-black text-slate-900 mb-2">Succès!</h2>
          <p className="text-slate-600 mb-4">{successMessage}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Redirection automatique...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md animate-in zoom-in-95 duration-300">
          <AlertCircle className="text-rose-600 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-black text-slate-900 mb-2">Erreur</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => loadSignatureRequest()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-black transition-all"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!signatureRequest) {
    return null;
  }

  const expiresAt = new Date(signatureRequest.expiresAt);
  const now = new Date();
  const hoursLeft = Math.max(0, Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const daysLeft = Math.floor(hoursLeft / 24);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900">📋 Signature Requise</h1>
              <p className="text-slate-600 mt-2">AOT #{signatureRequest.occupation.id} - {signatureRequest.occupation.type}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-700">Signataire</p>
              <p className="font-black text-lg text-blue-600">{signatureRequest.signatory.nom}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Document Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <FileText className="text-blue-600" size={24} />
              <div>
                <h3 className="font-black text-slate-900">Détails du Document</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Informations de l'arrêté</p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tiers</p>
              <p className="font-bold text-slate-900 mt-1">{signatureRequest.occupation.tiers.nom}</p>
              {signatureRequest.occupation.tiers.siret && (
                <p className="text-sm text-slate-500 mt-1">SIRET: {signatureRequest.occupation.tiers.siret}</p>
              )}
            </div>

            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Adresse</p>
              <p className="font-bold text-slate-900 mt-1">{signatureRequest.occupation.adresse}</p>
            </div>

            {signatureRequest.occupation.dateDebut && (
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Début</p>
                <p className="font-bold text-slate-900 mt-1">
                  {new Date(signatureRequest.occupation.dateDebut).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}

            {signatureRequest.occupation.dateFin && (
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fin</p>
                <p className="font-bold text-slate-900 mt-1">
                  {new Date(signatureRequest.occupation.dateFin).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Document Viewer Placeholder */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-12 bg-slate-50 text-center min-h-96 flex items-center justify-center flex-col gap-4">
            <FileText className="text-slate-300" size={64} />
            <p className="text-slate-600 font-bold">Document AOT</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">La visualisation du document sera disponible ici</p>
          </div>
        </div>

        {/* Expiration Warning */}
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          daysLeft === 0
            ? 'bg-rose-50 text-rose-700 border border-rose-200'
            : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          <Clock size={20} />
          <div>
            <p className="font-bold">
              {daysLeft === 0
                ? `⚠️ Attention: ${hoursLeft}h restantes`
                : `Lien valide pendant ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`}
            </p>
            <p className="text-sm">Expires le {expiresAt.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pb-8">
          <button
            onClick={handleAccept}
            disabled={submitting}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
          >
            {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
            Accepter & Signer
          </button>

          <button
            onClick={() => setShowRejectModal(true)}
            disabled={submitting}
            className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <XCircle size={20} />
            Rejeter
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <XCircle className="text-rose-600" size={24} />
                Rejeter la Signature
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Vous pouvez laisser un commentaire pour expliquer votre refus.
              </p>

              <textarea
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value.slice(0, 500))}
                placeholder="Commentaire optionnel (max 500 caractères)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-rose-500 focus:bg-white transition-all resize-none h-28 font-bold text-sm"
                disabled={submitting}
              />

              <p className="text-[10px] text-slate-400">
                {rejectionComment.length}/500 caractères
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  disabled={submitting}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg font-black transition-all disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReject}
                  disabled={submitting}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-lg font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
                  Confirmer le Rejet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
