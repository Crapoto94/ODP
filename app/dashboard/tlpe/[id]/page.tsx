"use client"

import React, { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, RefreshCw, Trash2 } from 'lucide-react';
import TlpeLigneArticleModal from '@/components/TlpeLigneArticleModal';
import AutorisationsList from '@/components/AutorisationsList';
import OccupationFinancialCard from '@/app/dashboard/occupations/[id]/components/OccupationFinancialCard';
import OccupationNotes from '@/app/dashboard/occupations/[id]/components/OccupationNotes';
import SignatureRequestModal from '@/app/dashboard/occupations/[id]/components/SignatureRequestModal';
import TlpeSidebar from './components/TlpeSidebar';
import TlpeContactModal from './components/TlpeContactModal';
import TlpeArticles from './components/TlpeArticles';
import TlpeStepper from './components/TlpeStepper';
import TlpeRenewModal from './components/TlpeRenewModal';
import { useTlpeLogic } from './hooks/useTlpeLogic';

interface Props {
  params: Promise<{ id: string }>;
}

const READ_ONLY_STATUSES = ['FACTURÉ', 'FACTURE', 'TITRÉ', 'TITRE', 'PAYÉ', 'PAYE', 'CLOS'];

export default function TlpeDetailPage({ params }: Props) {
  const { id: paramId } = use(params);
  const logic = useTlpeLogic(paramId);
  const {
    tiersId, tiers, occupations, years, selectedYear, setSelectedYear, currentOccupation,
    loading, currentUser, aotGabarits,
    isUpdatingStatus, handleStatusChange, getStepDates, getTotalAmount,
    isRenewModalOpen, setIsRenewModalOpen,
    isGeneratingFacture, handleDownloadFacture,
    isLigneModalOpen, setIsLigneModalOpen, editingLigne, setEditingLigne, handleDeleteLigne,
    isContactModalOpen, setIsContactModalOpen, isSubmittingContact, newContact, setNewContact,
    handleAddContact, handleDeleteContact,
    isUploadingPhoto, handleUploadPhoto, handleDeletePhoto,
    handleDeleteYear,
    refresh,
  } = logic;

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [aotReload, setAotReload] = useState(0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement du dossier TLPE...</p>
      </div>
    );
  }

  if (!tiers) {
    return (
      <div className="text-center py-20 font-black">
        <p className="text-xl text-slate-900 uppercase tracking-widest">Tiers non trouvé</p>
        <Link href="/dashboard/tlpe" className="text-purple-600 hover:underline mt-4 inline-block text-[10px] uppercase">Retour à la liste</Link>
      </div>
    );
  }

  const isReadOnly = currentOccupation ? READ_ONLY_STATUSES.includes(currentOccupation.statut) : false;
  const totalAmount = getTotalAmount();

  return (
    <div className="min-h-screen pb-10 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/tlpe" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 leading-tight">{tiers.nom}</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                {tiers.code_sedit ? `Code ${tiers.code_sedit}` : 'Dossier T.L.P.E.'}{tiers.adresse ? ` — ${tiers.adresse}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full space-y-8 px-4">
        {/* Financial card */}
        {currentOccupation && (
          <OccupationFinancialCard
            totalAmount={totalAmount}
            generatingPdf={isGeneratingFacture}
            onDownloadFacture={handleDownloadFacture}
            taxationYear={selectedYear}
          />
        )}

        {/* Stepper */}
        {currentOccupation && (
          <TlpeStepper
            totalAmount={totalAmount}
            currentStatus={currentOccupation.statut}
            onStatusChange={isReadOnly ? async () => {} : handleStatusChange}
            isUpdating={isUpdatingStatus}
            isReadOnly={isReadOnly}
            stepDates={getStepDates()}
          />
        )}

        {/* Year selector + Reconduire */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {years.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {[...years].sort((a, b) => b - a).map((year) => (
                <div key={year} className="group relative">
                  <button
                    onClick={() => setSelectedYear(year)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                      selectedYear === year
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {year}
                  </button>
                  <button
                    onClick={() => handleDeleteYear(year)}
                    title="Supprimer ce dossier"
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white items-center justify-center hidden group-hover:flex"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {selectedYear && (
            <button
              onClick={() => setIsRenewModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-600 hover:text-white transition-all shadow-sm"
            >
              <RefreshCw size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Reconduire vers {selectedYear + 1}</span>
            </button>
          )}
        </div>

        {!currentOccupation ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Aucun dossier T.L.P.E. pour {selectedYear}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
              <TlpeArticles
                lignes={currentOccupation.lignes || []}
                isFactured={isReadOnly}
                anneeTaxation={selectedYear || new Date().getFullYear()}
                isEnseigneExempt={false}
                onAddArticle={() => { setEditingLigne(null); setIsLigneModalOpen(true); }}
                onEditArticle={(ligne: any) => { setEditingLigne(ligne); setIsLigneModalOpen(true); }}
                onDeleteArticle={handleDeleteLigne}
              />

              <AutorisationsList
                occupationId={currentOccupation.id}
                aotGabarits={aotGabarits}
                readOnly={isReadOnly}
                reloadSignal={aotReload}
                onSendForSignature={() => setIsSignatureModalOpen(true)}
              />

              <OccupationNotes occupationId={currentOccupation.id} currentUser={currentUser} />
            </div>

            <div className="space-y-6">
              <TlpeSidebar
                occupation={currentOccupation}
                isFactured={isReadOnly}
                onOpenContactModal={() => setIsContactModalOpen(true)}
                onDeleteContact={handleDeleteContact}
                onUploadPhoto={handleUploadPhoto}
                onDeletePhoto={handleDeletePhoto}
                isUploadingPhoto={isUploadingPhoto}
              />
            </div>
          </div>
        )}
      </div>

      {isLigneModalOpen && currentOccupation && (
        <TlpeLigneArticleModal
          isOpen={isLigneModalOpen}
          onClose={() => setIsLigneModalOpen(false)}
          occupationId={currentOccupation.id}
          annee={selectedYear || new Date().getFullYear()}
          onSuccess={refresh}
          editingLigne={editingLigne}
        />
      )}

      <TlpeContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        newContact={newContact}
        setNewContact={setNewContact}
        isSubmitting={isSubmittingContact}
        onSubmit={handleAddContact}
      />

      {isRenewModalOpen && selectedYear && (
        <TlpeRenewModal
          isOpen={isRenewModalOpen}
          onClose={() => setIsRenewModalOpen(false)}
          onSuccess={() => { refresh(); }}
          tiersId={tiersId}
          currentYear={selectedYear}
          occupations={occupations}
        />
      )}

      {currentOccupation && (
        <SignatureRequestModal
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
          occupationId={currentOccupation.id}
          onSuccess={() => setAotReload((n) => n + 1)}
        />
      )}
    </div>
  );
}
