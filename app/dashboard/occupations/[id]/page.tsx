"use client";

import React, { use, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// Hooks & Types
import { useOccupationLogic } from './hooks/useOccupationLogic';
import { LigneArticle } from './types';

// Local Components
import OccupationHeader from './components/OccupationHeader';
import OccupationHero from './components/OccupationHero';
import OccupationFinancialCard from './components/OccupationFinancialCard';
import OccupationArticles from './components/OccupationArticles';
import OccupationSidebar from './components/OccupationSidebar';
import OccupationNotes from './components/OccupationNotes';
import OccupationStepper from './components/OccupationStepper';
import UploadDocModal from './components/UploadDocModal';
import TlpeArticles from '../../tlpe/[id]/components/TlpeArticles';

// Shared Components
import OccupationContactModal from './components/OccupationContactModal';
import LigneArticleModal from '@/components/LigneArticleModal';
import TlpeLigneArticleModal from '@/components/TlpeLigneArticleModal';
import AotFinalModal from './components/AotFinalModal';
import SignatureRequestModal from './components/SignatureRequestModal';
import TierModal from './components/TierModal';

interface Props {
  params: Promise<{ id: string }>;
}

export default function OccupationDetailPage({ params }: Props) {
  const router = useRouter();
  const { id: paramId } = use(params);
  const [isLigneModalOpen, setIsLigneModalOpen] = useState(false);
  const [editingLigne, setEditingLigne] = useState<LigneArticle | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [latestSignatureRequest, setLatestSignatureRequest] = useState<any>(null);
  const [tlpeExonerationThreshold, setTlpeExonerationThreshold] = useState<number>(12);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<any>(null);

  const {
    occ,
    loading,
    generatingPdf,
    currentUser,
    fetchOccupation,
    handleToggleVerifie,
    downloadFacture,
    handleDeleteLigne,
    statusInfo,
    typeInfo,
    isLocked,
    isFactured,
    totalAmount,
    // Contacts management
    isContactModalOpen,
    setIsContactModalOpen,
    isSubmittingContact,
    editingContactId,
    setEditingContactId,
    newContact,
    setNewContact,
    handleAddContact,
    handleOpenEditContact,
    handleDeleteContact,
    handlePhotoContact,
    // Dossier Upload
    isUploadModalOpen,
    setIsUploadModalOpen,
    isUploading,
    handleUploadNamedDoc,
    handleDeletePhoto,
    handleValidateDemand,
    handleNextStep,
    // AOT
    gabarits,
    aotGabarits,
    handleSetAotGabarit,
    handleDownloadAot,
    handlePrevStep,
    handleRegisterPayment,
    // AOT Final
    isAotFinalModalOpen,
    setIsAotFinalModalOpen,
    isUploadingAotFinal,
    handleUploadAotFinal,
    handlePublishAot,
    isPublishingAot,
    handleDeleteAotFinal,
    handleSaveObservations,
    isSendingEmail,
    sendInvoiceByEmail,
    noteKey,
  } = useOccupationLogic(paramId);

  // Load TLPE config when needed (for enseigne exemption display)
  useEffect(() => {
    if (!occ || occ.type !== 'TLPE') return;
    const year = occ.anneeTaxation || (occ.dateDebut ? new Date(occ.dateDebut).getFullYear() : new Date().getFullYear());
    axios.get(`/api/articles/tlpe?annee=${year}`)
      .then(res => {
        const threshold = res.data?.config?.exoneration;
        if (threshold !== undefined) setTlpeExonerationThreshold(threshold);
      })
      .catch(() => {});
  }, [occ?.type, occ?.anneeTaxation, occ?.dateDebut]);

  // Load latest signature request for this occupation
  useEffect(() => {
    if (!paramId) return;
    axios.get(`/api/occupations/${paramId}/signature-request`)
      .then(res => {
        const requests = res.data;
        if (Array.isArray(requests) && requests.length > 0) {
          setLatestSignatureRequest(requests[0]); // already ordered desc
        }
      })
      .catch(() => {
        // non-fatal: signature status is optional display
      });
  }, [paramId]);

  const handleTierClick = async (tierId: number) => {
    try {
      const res = await axios.get(`/api/tiers/${tierId}`);
      setSelectedTier(res.data);
      setIsTierModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch tier:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement du dossier...</p>
      </div>
    );
  }

  if (!occ || !statusInfo || !typeInfo) {
    return (
      <div className="text-center py-20">
        <p className="text-xl font-bold text-slate-900">Dossier non trouvé</p>
        <Link href="/dashboard/occupations" className="text-blue-600 hover:underline mt-4 inline-block">Retour à la liste</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      <OccupationHeader
        occupation={occ}
        isFactured={isFactured}
        isLocked={isLocked}
        onToggleVerifie={handleToggleVerifie}
        onNextStep={handleNextStep}
        onPrevStep={handlePrevStep}
        onValidateDemand={handleValidateDemand}
      />

      <OccupationStepper 
        type={occ.type}
        currentStatus={occ.statut}
      />

      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-12">
          <OccupationHero
            occupation={occ}
            statusInfo={statusInfo}
            typeInfo={typeInfo}
            latestSignatureRequest={latestSignatureRequest}
            onTierClick={handleTierClick}
          />
          {!(occ.type === 'CHANTIER' && (occ.statut === 'INIT' || occ.statut === 'INITIALISATION' || occ.statut === 'EN_ATTENTE')) && (
            <OccupationFinancialCard
              totalAmount={totalAmount}
              generatingPdf={generatingPdf}
              onDownloadFacture={downloadFacture}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            {occ.type === 'TLPE' ? (
              <TlpeArticles
                lignes={occ.lignes || []}
                isFactured={isFactured}
                anneeTaxation={occ.anneeTaxation || (occ.dateDebut ? new Date(occ.dateDebut).getFullYear() : new Date().getFullYear())}
                isEnseigneExempt={
                  (occ.lignes || []).reduce((sum: number, l: any) => {
                    if (l.article?.meta?.tlpeType === 'ENSEIGNE') return sum + (l.quantite1 || 0);
                    return sum;
                  }, 0) <= tlpeExonerationThreshold
                }
                onAddArticle={() => { setEditingLigne(null); setIsLigneModalOpen(true); }}
                onEditArticle={(ligne: any) => { setEditingLigne(ligne); setIsLigneModalOpen(true); }}
                onDeleteArticle={handleDeleteLigne}
              />
            ) : (
              <OccupationArticles
                occupation={occ}
                isFactured={isFactured}
                onAddArticle={() => { setEditingLigne(null); setIsLigneModalOpen(true); }}
                onEditArticle={(ligne) => { setEditingLigne(ligne); setIsLigneModalOpen(true); }}
                onDeleteArticle={handleDeleteLigne}
                aotGabarits={aotGabarits}
                onSetAotGabarit={handleSetAotGabarit}
                onDownloadAot={handleDownloadAot}
                isGeneratingAot={generatingPdf}
                isLocked={isLocked}
                onRegisterPayment={handleRegisterPayment}
                onUploadAotFinal={() => setIsAotFinalModalOpen(true)}
                onPublishAot={handlePublishAot}
                onSendForSignature={() => setIsSignatureModalOpen(true)}
              />
            )}
            <OccupationNotes 
              key={noteKey}
              occupationId={occ.id} 
              currentUser={currentUser} 
            />
          </div>

          <OccupationSidebar
            occupation={occ}
            isFactured={isFactured}
            onOpenContactModal={() => setIsContactModalOpen(true)}
            onDeleteContact={handleDeleteContact}
            onEditContact={handleOpenEditContact}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            onDeletePhoto={handleDeletePhoto}
            onDeleteAotFinal={handleDeleteAotFinal}
            onSaveObservations={handleSaveObservations}
            onSendInvoice={sendInvoiceByEmail}
            isSendingInvoice={isSendingEmail}
          />
        </div>
      </div>

      {/* Modals Orchestration */}
      {isLigneModalOpen && (
        occ.type === 'TLPE' ? (
          <TlpeLigneArticleModal
            isOpen={isLigneModalOpen}
            onClose={() => setIsLigneModalOpen(false)}
            occupationId={occ.id}
            annee={occ.anneeTaxation || (occ.dateDebut ? new Date(occ.dateDebut).getFullYear() : new Date().getFullYear())}
            onSuccess={fetchOccupation}
            editingLigne={editingLigne}
          />
        ) : (
          <LigneArticleModal
            isOpen={isLigneModalOpen}
            onClose={() => setIsLigneModalOpen(false)}
            occupationId={occ.id}
            onSave={() => fetchOccupation()}
            initialData={editingLigne}
            annee={occ.anneeTaxation || (occ.dateDebut ? new Date(occ.dateDebut).getFullYear() : new Date().getFullYear())}
            defaultDates={{ 
              start: occ.dateDebut?.split('T')[0] || new Date().toISOString().split('T')[0], 
              end: occ.dateFin?.split('T')[0] || new Date().toISOString().split('T')[0] 
            }}
            occupationType={occ.type}
          />
        )
      )}

      <OccupationContactModal
        isOpen={isContactModalOpen}
        onClose={() => { setIsContactModalOpen(false); setEditingContactId(null); }}
        newContact={newContact}
        setNewContact={setNewContact}
        isSubmittingContact={isSubmittingContact}
        onAddContact={handleAddContact}
        onPhotoContact={handlePhotoContact}
        editingContactId={editingContactId}
      />

      <UploadDocModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        isUploading={isUploading}
        onUpload={handleUploadNamedDoc}
      />

      <AotFinalModal
        isOpen={isAotFinalModalOpen}
        onClose={() => setIsAotFinalModalOpen(false)}
        isUploading={isUploadingAotFinal}
        onUpload={handleUploadAotFinal}
      />

      {occ && (
        <SignatureRequestModal
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
          occupationId={occ.id}
        />
      )}

      <TierModal
        isOpen={isTierModalOpen}
        onClose={() => {
          setIsTierModalOpen(false);
          setSelectedTier(null);
        }}
        tier={selectedTier}
      />
    </div>
  );
}
