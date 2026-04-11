"use client";

import React, { use } from 'react';
import { Loader2, Building2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

// Hooks & Components
import { useTiersLogic } from './hooks/useTiersLogic';
import TiersHeader from './components/TiersHeader';
import TiersHero from './components/TiersHero';
import TiersSidebar from './components/TiersSidebar';
import ContactModal from '@/components/ContactModal';
import TiersModal from '@/components/TiersModal';
import { AlertCircle } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default function TiersDetailPage({ params }: Props) {
  const { id: paramId } = use(params);
  const {
    tiers,
    loading,
    isContactModalOpen,
    setIsContactModalOpen,
    isSubmittingContact,
    newContact,
    setNewContact,
    handleAddContact,
    handleDeleteContact,
    handlePhotoContact,
    isEditModalOpen,
    setIsEditModalOpen,
    editFormData,
    setEditFormData,
    submittingEdit,
    handleUpdateTiers,
    handleSiretSearch
  } = useTiersLogic(paramId);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement du tiers...</p>
      </div>
    );
  }

  if (!tiers) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-20">
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-16 text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mx-auto">
             <div className="relative">
                <Building2 size={48} />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white border-4 border-white">
                  <span className="text-[10px] font-black italic">!</span>
                </div>
             </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tiers Introuvable</h2>
            <p className="text-slate-400 font-bold text-sm max-w-sm mx-auto leading-relaxed uppercase tracking-widest">
              L'entité avec l'identifiant #{paramId} n'existe pas ou a été archivée.
            </p>
          </div>
          <div className="pt-4">
            <div className="flex items-center gap-3 justify-center">
             <button 
               onClick={() => setIsEditModalOpen(true)}
               className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
             >
               Modifier les infos
             </button>
             <Link 
              href="/dashboard/tiers" 
              className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 inline-flex items-center gap-3"
            >
              <ChevronLeft size={16} />
              Retour à la liste des tiers
            </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      <TiersHeader tiers={{ ...tiers, onEdit: () => setIsEditModalOpen(true) }} />

      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Status Alert for Closed Business */}
        {tiers.etatAdministratif === 'Cessée' && (
          <div className="mb-8 p-6 bg-rose-50 border border-rose-200 rounded-3xl flex items-center gap-6 animate-pulse">
            <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-500/20">
               <AlertCircle size={28} />
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-900 uppercase tracking-tight">ATTENTION : Établissement Fermé</h4>
              <p className="text-xs font-bold text-rose-600 mt-0.5">Cette entreprise est enregistrée comme cessée dans la base INSEE. Veuillez vérifier son activité réelle.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Info */}
          <div className="lg:col-span-8 flex flex-col">
            <TiersHero tiers={tiers} />
            
            {/* Associated Dossiers List for easier access */}
            <div className="mt-12 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-10 space-y-8">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-1.5 bg-emerald-500 rounded-full"></div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Historique des Dossiers</h2>
                  </div>
                  <Link 
                    href={`/dashboard/occupations?tiersId=${tiers.id}`}
                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                  >
                    Voir tout dans la liste
                  </Link>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tiers.occupations?.map((o: any) => (
                    <Link 
                      key={o.id}
                      href={`/dashboard/occupations/${o.id}`}
                      className="p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:border-blue-200 hover:shadow-lg transition-all group"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-2">
                          <p className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest">{o.type}</p>
                          <h4 className="font-black text-slate-900 uppercase tracking-tight leading-tight group-hover:text-blue-600 transition-colors">{o.nom}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[200px]">{o.adresse}</p>
                        </div>
                        <div className="bg-white border border-slate-100 px-2 py-1 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                          {o.statut}
                        </div>
                      </div>
                    </Link>
                  ))}
                  {(!tiers.occupations || tiers.occupations.length === 0) && (
                    <div className="col-span-full py-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-3xl">
                      Aucun dossier actif
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* Sidebar: Contacts */}
          <TiersSidebar 
            tiers={tiers}
            onOpenContactModal={() => setIsContactModalOpen(true)}
            onDeleteContact={handleDeleteContact}
          />
        </div>
      </div>

      <ContactModal 
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        newContact={newContact}
        setNewContact={setNewContact}
        isSubmittingContact={isSubmittingContact}
        onAddContact={handleAddContact}
        onPhotoContact={handlePhotoContact}
        title="Ajouter un Contact Tiers"
        subtitle="Ces contacts seront hérités par tous ses dossiers"
      />

      <TiersModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        formData={editFormData}
        setFormData={setEditFormData}
        submitting={submittingEdit}
        handleSubmit={handleUpdateTiers}
        handleSiretSearch={handleSiretSearch}
        isEditing={true}
      />
    </div>
  );
}
