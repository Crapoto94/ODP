"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { CheckCircle2, XCircle, Loader2, AlertCircle, Clock, FileText, ChevronLeft, ChevronRight, Move } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

interface SignaturePlacement {
  signatureX: number; // 0-100 percent
  signatureY: number; // 0-100 percent
  signaturePage: number; // 1-indexed
}

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

  // PDF display state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [convertingPdf, setConvertingPdf] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  // Signature placement modal
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [placement, setPlacement] = useState<SignaturePlacement>({
    signatureX: 75,
    signatureY: 85,
    signaturePage: 1
  });
  const [totalPages, setTotalPages] = useState(1);

  // Dragging state
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [sigPos, setSigPos] = useState({ x: 75, y: 85 }); // percent

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

  // Load/convert document to PDF when we have signatureRequest
  useEffect(() => {
    if (!signatureRequest?.occupation?.aotFinalPath) return;

    const aotPath: string = signatureRequest.occupation.aotFinalPath;

    if (!aotPath.toLowerCase().endsWith('.docx')) {
      // Already a PDF — use directly
      setPdfUrl(aotPath);
      return;
    }

    // Need to convert DOCX → PDF via API
    setConvertingPdf(true);
    setConvertError(null);

    axios.get(`/api/signature/${token}/document`)
      .then(res => {
        setPdfUrl(res.data.pdfUrl);
      })
      .catch(err => {
        setConvertError(err.response?.data?.error || 'Erreur lors de la conversion du document');
      })
      .finally(() => {
        setConvertingPdf(false);
      });
  }, [signatureRequest, token]);

  // --- Draggable signature box ---
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const sigBoxW = (150 / 400) * 100; // sig width as % of container
    const sigBoxH = (75 / 566) * 100;  // sig height as % of container

    const currentXpx = (sigPos.x / 100) * rect.width - (sigBoxW / 100) * rect.width / 2;
    const currentYpx = (sigPos.y / 100) * rect.height - (sigBoxH / 100) * rect.height / 2;

    dragOffset.current = {
      x: e.clientX - rect.left - currentXpx,
      y: e.clientY - rect.top - currentYpx
    };
    isDragging.current = true;
  }, [sigPos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const sigBoxW = (150 / 400) * 100;
    const sigBoxH = (75 / 566) * 100;

    let newXpx = e.clientX - rect.left - dragOffset.current.x + (sigBoxW / 100) * rect.width / 2;
    let newYpx = e.clientY - rect.top - dragOffset.current.y + (sigBoxH / 100) * rect.height / 2;

    // Clamp
    newXpx = Math.max(0, Math.min(rect.width, newXpx));
    newYpx = Math.max(0, Math.min(rect.height, newYpx));

    const newX = (newXpx / rect.width) * 100;
    const newY = (newYpx / rect.height) * 100;

    setSigPos({ x: newX, y: newY });
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      setPlacement(prev => ({
        ...prev,
        signatureX: sigPos.x,
        signatureY: sigPos.y
      }));
    }
  }, [sigPos]);

  // Also handle mouse leaving the container
  const handleMouseLeave = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      setPlacement(prev => ({
        ...prev,
        signatureX: sigPos.x,
        signatureY: sigPos.y
      }));
    }
  }, [sigPos]);

  const handleOpenPlacementModal = () => {
    setSigPos({ x: placement.signatureX, y: placement.signatureY });
    setShowPlacementModal(true);
  };

  const handleConfirmPlacement = async () => {
    const finalPlacement: SignaturePlacement = {
      signatureX: sigPos.x,
      signatureY: sigPos.y,
      signaturePage: placement.signaturePage
    };
    setPlacement(finalPlacement);
    setShowPlacementModal(false);
    await handleAccept(finalPlacement);
  };

  const handleAccept = async (pl?: SignaturePlacement) => {
    const usedPlacement = pl || placement;
    setSubmitting(true);
    try {
      await axios.post(`/api/signature/${token}/accept`, {
        signatureX: usedPlacement.signatureX,
        signatureY: usedPlacement.signatureY,
        signaturePage: usedPlacement.signaturePage
      });
      setSuccessMessage('Document signé avec succès! Redirection en cours...');
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
      setSuccessMessage("Signature rejetée. Notification envoyée à l'administrateur.");
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

  // Signature box position as px in 400x566 A4 mockup
  const sigBoxLeft = (sigPos.x / 100) * 400 - 75;
  const sigBoxTop = (sigPos.y / 100) * 566 - 37.5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900">Signature Requise</h1>
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

        {/* Document Viewer */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="text-blue-600" size={18} />
              <span className="font-black text-slate-900 text-sm uppercase tracking-widest">Document AOT Final</span>
            </div>
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-[10px] uppercase tracking-widest transition-all"
              >
                Ouvrir dans un onglet
              </a>
            )}
          </div>

          {convertingPdf ? (
            <div className="p-12 bg-slate-50 text-center min-h-64 flex items-center justify-center flex-col gap-4">
              <Loader2 className="animate-spin text-blue-600" size={48} />
              <p className="text-slate-600 font-bold">Conversion du document en cours...</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Préparation du PDF pour affichage</p>
            </div>
          ) : convertError ? (
            <div className="p-12 bg-rose-50 text-center min-h-64 flex items-center justify-center flex-col gap-4">
              <AlertCircle className="text-rose-400" size={48} />
              <p className="text-rose-600 font-bold text-sm">{convertError}</p>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full"
              style={{ height: '80vh', minHeight: '600px' }}
              title="Document AOT Final"
            />
          ) : (
            <div className="p-12 bg-slate-50 text-center min-h-64 flex items-center justify-center flex-col gap-4">
              <FileText className="text-slate-300" size={48} />
              <p className="text-slate-500 font-bold text-sm">Aucun document AOT final disponible</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Générez d'abord l'AOT final depuis le dossier</p>
            </div>
          )}
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
                ? `Attention: ${hoursLeft}h restantes`
                : `Lien valide pendant ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`}
            </p>
            <p className="text-sm">Expires le {expiresAt.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pb-8">
          <button
            onClick={handleOpenPlacementModal}
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

      {/* Signature Placement Modal */}
      {showPlacementModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full animate-in zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Move className="text-blue-600" size={22} />
                Positionner la signature
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Faites glisser votre signature à l'emplacement souhaité sur le document.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Page selector */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-slate-700 uppercase tracking-widest">Page</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPlacement(p => ({ ...p, signaturePage: Math.max(1, p.signaturePage - 1) }))}
                    disabled={placement.signaturePage <= 1}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="font-black text-slate-900 min-w-16 text-center">
                    {placement.signaturePage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPlacement(p => ({ ...p, signaturePage: Math.min(totalPages, p.signaturePage + 1) }))}
                    disabled={placement.signaturePage >= totalPages}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* A4 Mockup with draggable signature */}
              <div className="flex justify-center">
                <div
                  ref={containerRef}
                  className="relative bg-white border-2 border-slate-300 shadow-lg cursor-crosshair select-none"
                  style={{ width: 400, height: 566 }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Page background */}
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white" />
                  <div className="absolute inset-4 border border-dashed border-slate-200 rounded" />
                  <p className="absolute top-6 left-1/2 -translate-x-1/2 text-[9px] text-slate-300 font-black uppercase tracking-widest">
                    Page {placement.signaturePage}
                  </p>

                  {/* Draggable signature box */}
                  <div
                    className="absolute flex items-center justify-center border-2 border-blue-500 bg-blue-50/90 rounded cursor-grab active:cursor-grabbing shadow-md select-none"
                    style={{
                      left: Math.max(0, Math.min(400 - 150, sigBoxLeft)),
                      top: Math.max(0, Math.min(566 - 75, sigBoxTop)),
                      width: 150,
                      height: 75
                    }}
                    onMouseDown={handleMouseDown}
                  >
                    <div className="text-center pointer-events-none">
                      <Move className="text-blue-500 mx-auto mb-1" size={14} />
                      <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest">
                        {signatureRequest.signatory.nom}
                      </p>
                      <p className="text-[8px] text-blue-400 uppercase tracking-widest">SIGNATURE</p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest">
                Glissez la boite bleue pour positionner votre signature
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPlacementModal(false)}
                  disabled={submitting}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-black transition-all disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmPlacement}
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg"
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                  Confirmer la signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
