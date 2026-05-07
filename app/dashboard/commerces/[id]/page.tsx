"use client";

import React, { use, useState } from 'react';
import { Loader2, Store, ArrowLeft, AlertCircle, Plus } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import LigneArticleModal from '@/components/LigneArticleModal';
import CommerceStepper from './components/CommerceStepper';
import CommerceNotes from './components/CommerceNotes';
import CommerceSidebar from './components/CommerceSidebar';
import CommerceContactModal from './components/CommerceContactModal';
import CommerceUploadDocModal from './components/CommerceUploadDocModal';
import CommerceInfoCard from './components/CommerceInfoCard';
import CommerceYearTimeline from './components/CommerceYearTimeline';
import CommerceAmountChart from './components/CommerceAmountChart';
import CommerceDispositifsList from './components/CommerceDispositifsList';
import CommerceAotActions from './components/CommerceAotActions';
import CommerceRenewModal from './components/CommerceRenewModal';
import AotFinalModal from '../../occupations/[id]/components/AotFinalModal';
import SignatureRequestModal from '../../occupations/[id]/components/SignatureRequestModal';
import OccupationFinancialCard from '../../occupations/[id]/components/OccupationFinancialCard';
import { useCommerceLogic } from './hooks/useCommerceLogic';
import TiersSearchModal from './components/TiersSearchModal';

interface Props {
  params: Promise<{ id: string }>;
}

export default function CommerceDetailPage({ params }: Props) {
  const { id: paramId } = use(params);
  const logic = useCommerceLogic(paramId);

  const {
    commerce,
    dispositifsByYear,
    years,
    chartData,
    loading,
    selectedYear,
    setSelectedYear,
    occupations,
    editingLigne,
    setEditingLigne,
    isLigneModalOpen,
    setIsLigneModalOpen,
    isContactModalOpen,
    setIsContactModalOpen,
    isSubmittingContact,
    editingContactId,
    setEditingContactId,
    newContact,
    setNewContact,
    contacts,
    documents,
    noteKey,
    currentUser,
    isUpdatingStatus,
    isDocModalOpen,
    setIsDocModalOpen,
    isUploadingDoc,
    aotGabarits,
    isGeneratingAot,
    isAotFinalModalOpen,
    setIsAotFinalModalOpen,
    isUploadingAotFinal,
    isSignatureModalOpen,
    setIsSignatureModalOpen,
    isGeneratingFacture,
    isSendingAot,
    aotSentMsg,
    handleStatusChange,
    handleSetAotGabarit,
    handleDownloadAot,
    handleUploadAotFinal,
    handleDownloadFacture,
    handleSendAot,
    handleAddContact,
    handleOpenEditContact,
    handleDeleteContact,
    handlePhotoContact,
    handleUploadDocument,
    handleDeleteDocument,
    getTotalAmountForYear,
    getStepperState,
    getStepDates,
    getDispositivesTimeline,
    fetchCommerceDetails,
    fetchOccupations,
    isRenewModalOpen,
    setIsRenewModalOpen,
    allTiers,
    handleUpdateAgissantPour,
    handleUpdateOccupationAddress,
    handleUpdateObservations,
    handleUpdatePhoto
  } = logic;

  const [isTiersSearchOpen, setIsTiersSearchOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement du commerce...</p>
      </div>
    );
  }

  if (!commerce) {
    return (
      <div className="text-center py-20">
        <p className="text-xl font-bold text-slate-900">Commerce non trouvé</p>
        <Link href="/dashboard/commerces" className="text-blue-600 hover:underline mt-4 inline-block">Retour à la liste</Link>
      </div>
    );
  }

  const { totalAmount, currentStatus } = getStepperState();
  const currentOccupation = occupations.find((o: any) => o.anneeTaxation === selectedYear);
  const showFactureCard = currentOccupation && [
    'EN_COURS',
    'VERIFIE',
    'VALIDÉ',
    'VALIDE',
    'FACTURE',
    'FACTURÉ',
    'TITRE',
    'TITRÉ',
    'PAYE',
    'PAYÉ',
    'CLOS'
  ].includes(currentOccupation.statut);

  const isReallyFactured = currentOccupation && [
    'FACTURE',
    'FACTURÉ',
    'TITRE',
    'TITRÉ',
    'PAYE',
    'PAYÉ',
    'CLOS'
  ].includes(currentOccupation.statut);

  const isArchived = commerce?.statut === 'ARCHIVE';

  const handleArchiveCommerce = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir archiver ce commerce ? Il ne sera plus modifiable.')) return;
    try {
      await axios.patch(`/api/commerces/${paramId}`, { statut: 'ARCHIVE' });
      fetchCommerceDetails();
    } catch (err: any) {
      console.error('Failed to archive commerce:', err);
      const msg = err.response?.data?.error || err.message;
      alert(`Erreur lors de l'archivage : ${msg}`);
    }
  };

  const handleUnarchiveCommerce = async () => {
    try {
      await axios.patch(`/api/commerces/${paramId}`, { statut: 'VALIDE' });
      fetchCommerceDetails();
    } catch (err: any) {
      console.error('Failed to unarchive commerce:', err);
      const msg = err.response?.data?.error || err.message;
      alert(`Erreur lors du désarchivage : ${msg}`);
    }
  };

  const isReadOnly = isArchived || isReallyFactured;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/commerces"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${isArchived ? 'bg-slate-400' : 'bg-blue-600'} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30`}>
              <Store size={24} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-slate-900 leading-tight">{commerce.nom}</h1>
                {isArchived && (
                  <span className="px-3 py-1 bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                    Archivé
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-slate-500 mt-1">
                {isArchived ? 'Ce dossier est en lecture seule' : 'Tous les dispositifs'}
              </p>
            </div>
          </div>
        </div>

        {!isArchived ? (
          <button
            onClick={handleArchiveCommerce}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm cursor-pointer group"
          >
            <AlertCircle size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Archiver le commerce</span>
          </button>
        ) : (
          <button
            onClick={handleUnarchiveCommerce}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm cursor-pointer group"
          >
            <Plus size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Désarchiver</span>
          </button>
        )}
      </div>

      {/* Commerce Info & Financial Cards */}
      <div className="flex flex-col lg:flex-row gap-6">
        <CommerceInfoCard 
          commerce={commerce} 
          selectedYear={selectedYear} 
          totalAmount={selectedYear ? getTotalAmountForYear(selectedYear) : 0}
          occupations={occupations}
          allTiers={allTiers}
          onUpdateAgissantPour={handleUpdateAgissantPour}
          onUpdateAddress={handleUpdateOccupationAddress}
          onUpdatePhoto={handleUpdatePhoto}
          onChangeTiersClick={() => setIsTiersSearchOpen(true)}
        />
        {showFactureCard && (
          <OccupationFinancialCard
            totalAmount={selectedYear ? getTotalAmountForYear(selectedYear) : 0}
            generatingPdf={isGeneratingFacture}
            onDownloadFacture={handleDownloadFacture}
            taxationYear={selectedYear}
          />
        )}
      </div>

      {/* Commerce Workflow Stepper */}
      <CommerceStepper
        totalAmount={totalAmount}
        currentStatus={currentStatus}
        onStatusChange={isReadOnly ? async () => {} : handleStatusChange}
        isUpdating={isUpdatingStatus}
        isReadOnly={isReadOnly}
        stepDates={getStepDates()}
      />

      {/* Year Selector */}
      {years.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-700">Filtrer par année</label>
          <div className="flex flex-wrap gap-2">
            {[...years].sort((a, b) => b - a).map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  selectedYear === year
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timeline par année */}
      <CommerceYearTimeline
        years={years}
        getDispositivesTimeline={getDispositivesTimeline}
        selectedYear={selectedYear ?? undefined}
        onSelectYear={setSelectedYear}
      />

      {/* Main Content + Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* AOT Actions */}
          {!isReadOnly && selectedYear && occupations.length > 0 && occupations.some((o: any) => ['EN_COURS', 'PREP', 'PREPARATION_AOT'].includes(o.statut)) && (
            <CommerceAotActions
              occupation={occupations.find((o: any) => ['EN_COURS', 'PREP', 'PREPARATION_AOT'].includes(o.statut)) || occupations[0]}
              aotGabarits={aotGabarits}
              onSetAotGabarit={handleSetAotGabarit}
              onDownloadAot={handleDownloadAot}
              isGeneratingAot={isGeneratingAot}
              onUploadAotFinal={() => setIsAotFinalModalOpen(true)}
              onSendForSignature={() => setIsSignatureModalOpen(true)}
            />
          )}

          {/* Dispositifs List */}
          <CommerceDispositifsList
            selectedYear={selectedYear}
            occupations={occupations}
            tiersId={parseInt(paramId)}
            fetchCommerceDetails={fetchCommerceDetails}
            fetchOccupations={fetchOccupations}
            setEditingLigne={setEditingLigne}
            setIsLigneModalOpen={setIsLigneModalOpen}
            onRenew={isArchived ? undefined : () => setIsRenewModalOpen(true)}
            dispositifsByYear={dispositifsByYear}
            isFactured={isReadOnly}
          />

          {/* Événements & Historique */}
          {currentUser && (
            <CommerceNotes
              key={noteKey}
              tiersId={parseInt(paramId)}
              currentUser={currentUser}
            />
          )}
        </div>

        {/* Sidebar */}
        <CommerceSidebar
          tiersId={parseInt(paramId)}
          contacts={contacts}
          documents={documents}
          isFactured={isReadOnly}
          onOpenContactModal={isReadOnly ? () => {} : () => setIsContactModalOpen(true)}
          onDeleteContact={handleDeleteContact}
          onEditContact={handleOpenEditContact}
          isContactsLoading={false}
          onAddDocument={isReadOnly ? undefined : () => setIsDocModalOpen(true)}
          onDeleteDocument={handleDeleteDocument}
          observations={commerce.observations}
          onUpdateObservations={handleUpdateObservations}
          occupation={currentOccupation}
          onSendAot={() => { if(currentOccupation) handleSendAot(currentOccupation.id); }}
          isSendingAot={isSendingAot}
          aotSentMsg={aotSentMsg}
        />
      </div>

      {/* Modals */}
      <LigneArticleModal
        isOpen={isLigneModalOpen}
        onClose={() => {
          setIsLigneModalOpen(false);
          setEditingLigne(null);
        }}
        onSave={() => {
          setIsLigneModalOpen(false);
          setEditingLigne(null);
          if (selectedYear) fetchOccupations(selectedYear);
        }}
        occupationId={editingLigne?.occupationId}
        annee={selectedYear || new Date().getFullYear()}
        defaultDates={{
          start: selectedYear ? new Date(selectedYear, 0, 1).toISOString().split('T')[0] : '',
          end: selectedYear ? new Date(selectedYear, 11, 31).toISOString().split('T')[0] : ''
        }}
        initialData={editingLigne}
        occupationType="COMMERCE"
      />

      <CommerceContactModal
        isOpen={isContactModalOpen}
        onClose={() => {
          setIsContactModalOpen(false);
          setEditingContactId(null);
          setNewContact({ nom: '', prenom: '', email: '', telephone: '', titre: '', entreprise: '', role: 'CONTACT_DIRECT', pjPath: '' });
        }}
        newContact={newContact}
        setNewContact={(c) => setNewContact(c as any)}
        isSubmittingContact={isSubmittingContact}
        onAddContact={handleAddContact}
        onPhotoContact={handlePhotoContact}
      />

      <CommerceUploadDocModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onUpload={handleUploadDocument}
        isUploading={isUploadingDoc}
      />

      <AotFinalModal
        isOpen={isAotFinalModalOpen}
        onClose={() => setIsAotFinalModalOpen(false)}
        isUploading={isUploadingAotFinal}
        onUpload={async (file, isSigned) => {
          const occ = occupations.find((o: any) => o.statut === 'PREP' || o.statut === 'PREPARATION_AOT') || occupations[0];
          if (occ) handleUploadAotFinal(occ.id, file, isSigned);
        }}
      />

      {occupations.length > 0 && (
        <SignatureRequestModal
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
          occupationId={(occupations.find((o: any) => o.statut === 'PREP' || o.statut === 'PREPARATION_AOT') || occupations[0]).id}
        />
      )}

      <CommerceRenewModal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        onSuccess={() => {
          fetchCommerceDetails();
          if (selectedYear) fetchOccupations(selectedYear);
        }}
        tiersId={parseInt(paramId)}
        currentYear={selectedYear || new Date().getFullYear()}
        occupations={occupations}
      />

      <TiersSearchModal
        isOpen={isTiersSearchOpen}
        onClose={() => setIsTiersSearchOpen(false)}
        currentTiersId={currentOccupation?.agissantPour ? Number(currentOccupation.agissantPour) : undefined}
        onSelect={(t) => {
          if (currentOccupation) {
            handleUpdateAgissantPour(currentOccupation.id, t.id === commerce.id ? '' : String(t.id));
          }
          setIsTiersSearchOpen(false);
        }}
      />
    </div>
  );
}
