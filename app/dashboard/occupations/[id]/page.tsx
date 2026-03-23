"use client";

import React, { useState, useEffect, use } from 'react';
import axios from 'axios';
import { 
  X, 
  MapPin, 
  Calendar, 
  Euro, 
  Clock, 
  User, 
  FileText, 
  Package, 
  CheckCircle2, 
  ArrowRight,
  Pencil,
  Trash2,
  ExternalLink,
  Download,
  ImageIcon,
  Plus,
  Hash,
  ChevronLeft,
  Loader2,
  MessageSquare,
  Send,
  Mic,
  Paperclip,
  Mail,
  Smartphone,
  FileArchive
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LigneArticleModal from '@/components/LigneArticleModal';

interface Props {
  params: Promise<{ id: string }>;
}

export default function OccupationDetailPage({ params }: Props) {
  const { id: paramId } = use(params);
  const router = useRouter();
  const [occ, setOcc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [isLigneModalOpen, setIsLigneModalOpen] = useState(false);
  const [editingLigne, setEditingLigne] = useState<any>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  // Contacts states
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [newContact, setNewContact] = useState({ prenom: '', email: '', role: 'Contact principal' });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  const fetchOccupation = async () => {
    try {
      const res = await axios.get(`/api/occupations/${paramId}`);
      setOcc(res.data);
      
      // Auto-add tier email as default contact if none exist
      if (res.data.contacts?.length === 0 && res.data.tiers?.email) {
        handleAutoAddTierContact(res.data.tiers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOccupation();
    axios.get('/api/auth/me').then(res => setCurrentUser(res.data)).catch(() => {});
  }, [paramId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement du dossier...</p>
      </div>
    );
  }

  if (!occ) {
    return (
      <div className="text-center py-20">
        <p className="text-xl font-bold text-slate-900">Dossier non trouvé</p>
        <Link href="/dashboard/occupations" className="text-blue-600 hover:underline mt-4 inline-block">Retour à la liste</Link>
      </div>
    );
  }

  const totalAmount = occ.lignes?.reduce((sum: number, l: any) => sum + l.montant, 0) || 0;

  const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
    'DECLARE': { label: 'Déclaré', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
    'EN_COURS': { label: 'En cours', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    'TERMINE': { label: 'Terminé', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    'VERIFIE': { label: 'Vérifié', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    'FACTURE': { label: 'Facturé', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    'PAYE': { label: 'Payé', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
    // Legacy fallbacks
    'EN_ATTENTE': { label: 'En attente', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    'VALIDE': { label: 'Validé', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    'VERIFIED': { label: 'Vérifié', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    'INVOICED': { label: 'Facturé', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  };
  const statusInfo = STATUS_MAP[occ.statut] || { label: occ.statut, color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' };
  const isLocked = ['VERIFIE', 'FACTURE', 'PAYE', 'VERIFIED', 'INVOICED'].includes(occ.statut);

  const handleToggleVerifie = async () => {
    const newStatut = occ.statut === 'VERIFIE' ? 'EN_COURS' : 'VERIFIE';
    try {
      await axios.patch(`/api/occupations/${occ.id}`, { statut: newStatut });
      fetchOccupation();
    } catch (err) { alert('Erreur lors du changement de statut'); }
  };


  const downloadFacture = async () => {
    setGeneratingPdf(true);
    try {
      const res = await axios.get(`/api/facture-pdf/${occ.id}`, {
        responseType: 'blob'
      });
      
      // Force refresh of the dossier to see the new PJ
      await fetchOccupation();

      // Download the PDF
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Facture-ODP-${occ.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération de la facture');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDeleteLigne = async (ligneId: number) => {
    if (!confirm("Retirer cet article ?")) return;
    try {
      await axios.delete(`/api/occupations/${occ.id}/lignes/${ligneId}`);
      fetchOccupation();
    } catch (err) {
      alert("Erreur lors de la suppression de la ligne");
    }
  };

  const handleAutoAddTierContact = async (tiers: any) => {
    try {
      await axios.post(`/api/occupations/${occ.id}/contacts`, {
        prenom: tiers.nom,
        email: tiers.email,
        role: 'Contact Tiers'
      });
      fetchOccupation(); // Refresh to show the new contact
    } catch (err) {
      console.error('Failed to auto-add tier contact:', err);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    try {
      await axios.post(`/api/occupations/${occ.id}/contacts`, newContact);
      setIsContactModalOpen(false);
      setNewContact({ prenom: '', email: '', role: 'Contact principal' });
      fetchOccupation();
    } catch (err) {
      alert('Erreur lors de l\'ajout du contact');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    if (!confirm('Supprimer ce contact ?')) return;
    try {
      await axios.delete(`/api/occupations/${occ.id}/contacts/${contactId}`);
      fetchOccupation();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard/occupations"
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-sm group"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:bg-slate-50 transition-all">
            <ChevronLeft size={16} />
          </div>
          Retour à la liste
        </Link>

        {/* Action Quick Bar */}
        <div className="flex items-center gap-3">
           {!isLocked && (
             <button 
               onClick={() => router.push(`/dashboard/occupations?edit=${occ.id}`)}
               className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 rounded-xl transition-all shadow-sm font-bold text-xs flex items-center gap-2"
             >
               <Pencil size={14} /> Modifier info
             </button>
           )}
           <button
             onClick={handleToggleVerifie}
             disabled={['FACTURE','PAYE','INVOICED'].includes(occ.statut)}
             className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm disabled:opacity-40 ${
               isLocked
                 ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                 : 'bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
             }`}
           >
             <CheckCircle2 size={14} />
             {isLocked ? 'Modifier (dévérouiller)' : 'Marquer Vérifié'}
           </button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 flex flex-col md:flex-row items-start justify-between gap-10">
        <div className="space-y-6 flex-1">
          <div className="flex items-center gap-3">
            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
              {statusInfo.label}
            </span>
            <span className="bg-slate-50 px-4 py-1 rounded-full border border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
              {occ.type}
            </span>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              ID #{occ.id}
            </span>
          </div>

          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {occ.nom || `Dossier sans nom`}
          </h1>

          <div className="flex flex-wrap items-center gap-y-3 gap-x-8 text-slate-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <User size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Demandeur</p>
                <p className="text-sm font-black text-slate-900 leading-none">{occ.tiers?.nom || 'Non spécifié'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Localisation</p>
                <p className="text-sm font-black text-slate-900 leading-none">{occ.adresse}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Période</p>
                <p className="text-sm font-black text-slate-900 leading-none">
                  {occ.type === 'COMMERCE' ? (occ.anneeTaxation || '-') : (
                    <>
                      {occ.dateDebut ? format(new Date(occ.dateDebut), 'dd MMM yyyy', { locale: fr }) : '?'} - {occ.dateFin ? format(new Date(occ.dateFin), 'dd MMM yyyy', { locale: fr }) : '?'}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-80 space-y-4">
           <div className="bg-slate-950 rounded-[2rem] p-8 text-white relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform">
                <Euro size={120} />
              </div>
              <div className="relative z-10">
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">Total TTC</p>
                <p className="text-4xl font-black tracking-tighter mb-6">{totalAmount.toLocaleString('fr-FR')} €</p>
                
                <button 
                    onClick={downloadFacture}
                    disabled={generatingPdf}
                    className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all backdrop-blur-sm border border-white/10 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {generatingPdf ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    {generatingPdf ? 'Génération...' : 'Facture PDF'}
                  </button>
                </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Articles Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
               <div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Articles Taxables</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Détail des éléments d'occupation</p>
               </div>
               <button 
                 onClick={() => { setEditingLigne(null); setIsLigneModalOpen(true); }}
                 className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95"
               >
                 <Plus size={16} /> Ajouter un article
               </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {!occ.lignes || occ.lignes.length === 0 ? (
                <div className="py-16 bg-white rounded-[2rem] border border-dashed border-slate-200 text-center">
                   <Package size={40} className="mx-auto text-slate-200 mb-4" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucun article enregistré</p>
                </div>
              ) : (
                occ.lignes.map((ligne: any) => (
                  <div key={ligne.id} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between group transition-all hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5">
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-slate-200 p-2 text-center group-hover:bg-white transition-colors">
                         <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Article</p>
                         <p className="font-black text-slate-900 leading-none">{ligne.article?.numero || '#'}</p>
                      </div>
                      
                      <div className="space-y-1.5 text-left">
                         <div className="flex items-center gap-3">
                           <h4 className="text-base font-black text-slate-900">{ligne.article?.designation}</h4>
                           <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-lg text-[8px] font-black uppercase border border-slate-200">
                             {ligne.article?.modeTaxation?.nom || 'Tarif Fixe'}
                           </span>
                         </div>
                         <div className="text-xs font-bold text-slate-400 flex flex-wrap items-center gap-y-2 gap-x-5">
                             <>
                               <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-[10px] font-bold text-slate-400 uppercase w-full">
                                 <span className="flex items-center gap-1.5">
                                   <Clock size={12} className="text-slate-300" /> 
                                   {occ.type === 'COMMERCE' 
                                     ? occ.anneeTaxation 
                                     : `${format(new Date(ligne.dateDebut), 'dd/MM/yyyy', { locale: fr })} - ${format(new Date(ligne.dateFin), 'dd/MM/yyyy', { locale: fr })}`
                                   }
                                 </span>
                                 <span className="flex items-center gap-1.5 leading-relaxed">
                                   <Hash size={12} className="text-slate-300 shrink-0" />
                                   {(() => {
                                     const rawMode = ligne.article?.modeTaxation?.nom || 'unité';
                                     const parts = rawMode.split('/').map((p: string) => p.trim());
                                     const u1 = parts[0] || 'unité';
                                     const u2 = parts[1] || 'unité';
                                     const displayU1 = u1.toLowerCase() === 'unité' ? 'unité' : u1;
                                     const displayU2 = u2.toLowerCase() === 'unité' ? 'unité' : u2;

                                     if (occ.type === 'CHANTIER') {
                                       const startStr = format(new Date(ligne.dateDebutConstatee || ligne.dateDebut), 'dd/MM/yyyy', { locale: fr });
                                       const endStr = format(new Date(ligne.dateFinConstatee || ligne.dateFin), 'dd/MM/yyyy', { locale: fr });
                                       return (
                                         <div className="flex flex-col normal-case">
                                           <span className="text-slate-500">{ligne.quantite1} {displayU1} x {ligne.quantite2} {displayU2} à {ligne.article?.montant}€ soit </span>
                                           <span className="text-[9px] text-slate-400 font-medium italic">Période réelle : Du {startStr} au {endStr}</span>
                                         </div>
                                       );
                                     }
                                     
                                     if (occ.type === 'COMMERCE') {
                                       return <span className="normal-case text-slate-500">{ligne.quantite1} {displayU1} à {ligne.article?.montant}€/{displayU1} soit </span>;
                                     }

                                     return (
                                       <span className="normal-case text-slate-500">
                                         {ligne.quantite1} {displayU1} 
                                         {ligne.quantite2 !== 1 ? ` x ${ligne.quantite2} ${displayU2}` : ''} 
                                         {` à ${ligne.article?.montant}€ soit `}
                                       </span>
                                     );
                                   })()}
                                   <span className="text-slate-900 font-extrabold ml-auto">{ligne.montant.toLocaleString('fr-FR')} €</span>
                                 </span>
                               </div>
                             </>
                          </div>
                         {ligne.photos && (
                            <div className="flex flex-wrap gap-2 mt-3 text-left">
                               {ligne.photos.split(',').filter(Boolean).map((url: string, i: number) => (
                                 <a key={i} href={url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 hover:border-blue-300 transition-all shadow-sm block">
                                   <img src={url} alt={`Article attachment ${i+1}`} className="w-full h-full object-cover" />
                                 </a>
                               ))}
                            </div>
                         )}
                      </div>
                    </div>

                    <div className="mt-6 md:mt-0 flex items-center gap-12">
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1.5 leading-none">Montant TTC</p>
                          <p className="text-2xl font-black text-slate-900 leading-none">
                            {ligne.montant.toLocaleString('fr-FR')} €
                          </p>
                       </div>
                       
                       <div className="flex gap-2">
                          <button 
                            onClick={() => { setEditingLigne(ligne); setIsLigneModalOpen(true); }}
                            className="p-3.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          >
                            <Pencil size={20} />
                          </button>
                          <button 
                            onClick={() => handleDeleteLigne(ligne.id)}
                            className="p-3.5 text-slate-200 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 size={20} />
                          </button>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Notes Section (WhatsApp style) */}
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
               <div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Discussion / Notes</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Historique des échanges sur ce dossier</p>
               </div>
            </div>
            
            <NotesThread occupationId={occ.id} currentUser={currentUser} />
          </section>
        </div>

        <aside className="space-y-10">
          {/* PJ Section */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} /> Pièces Jointes ({(occ.photos ? occ.photos.split(',').filter(Boolean).length : 0) + (occ.facturePath ? 1 : 0)})
            </h3>
            {occ.photos ? (
              <div className="grid grid-cols-2 gap-4">
                {occ.photos.split(',').filter(Boolean).map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="group relative aspect-square rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm transition-all hover:scale-[1.02] hover:shadow-xl">
                    <img src={url} alt={`Justificatif ${i+1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ExternalLink size={20} className="text-white" />
                    </div>
                  </a>
                ))}
                {occ.facturePath && (
                  <a href={occ.facturePath} target="_blank" rel="noreferrer" className="group relative aspect-square rounded-[2rem] overflow-hidden border border-blue-100 bg-blue-50/30 shadow-sm transition-all hover:scale-[1.02] hover:shadow-xl flex flex-col items-center justify-center p-6 text-center">
                    <FileText size={40} className="text-blue-500 mb-3" />
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Facture PDF</p>
                    <p className="text-[8px] font-bold text-slate-400 mt-1">Générée automatiquement</p>
                    <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
              </div>
            ) : occ.facturePath ? (
              <div className="grid grid-cols-2 gap-4">
                  <a href={occ.facturePath} target="_blank" rel="noreferrer" className="group relative aspect-square rounded-[2rem] overflow-hidden border border-blue-100 bg-blue-50/30 shadow-sm transition-all hover:scale-[1.02] hover:shadow-xl flex flex-col items-center justify-center p-6 text-center">
                    <FileText size={40} className="text-blue-500 mb-3" />
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Facture PDF</p>
                    <p className="text-[8px] font-bold text-slate-400 mt-1">Générée automatiquement</p>
                  </a>
              </div>
            ) : (
              <div className="py-10 bg-white rounded-[2rem] border border-dashed border-slate-200 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase italic">Aucune pièce jointe</p>
              </div>
            )}
          </section>

          {/* Contacts Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <User size={14} /> Contacts ({occ.contacts?.length || 0})
               </h3>
               <button 
                 onClick={() => setIsContactModalOpen(true)}
                 className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
               >
                 <Plus size={14} />
               </button>
            </div>
            
            <div className="space-y-3">
              {occ.contacts?.length > 0 ? (
                occ.contacts.map((contact: any) => (
                  <div key={contact.id} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-blue-400 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100/50">
                        {contact.role}
                      </span>
                      <button 
                        onClick={() => handleDeleteContact(contact.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-600 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-900">{contact.prenom}</p>
                      <a href={`mailto:${contact.email}`} className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-2 transition-colors">
                        <Mail size={12} className="shrink-0" />
                        {contact.email}
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200 text-center">
                  <p className="text-[10px] font-bold text-slate-400 italic">Aucun contact enregistré</p>
                </div>
              )}
            </div>
          </section>

          {/* Observations Section */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observations</h3>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 min-h-[140px] shadow-sm">
              <p className="text-slate-600 font-medium leading-relaxed italic text-sm">
                {occ.description || "Aucune observation particulière n'a été ajoutée à ce dossier."}
              </p>
            </div>
          </section>
        </aside>
      </div>

      {isLigneModalOpen && (
        <LigneArticleModal 
          isOpen={isLigneModalOpen}
          onClose={() => setIsLigneModalOpen(false)}
          onSave={fetchOccupation}
          occupationId={occ.id}
          annee={occ.anneeTaxation || (occ.dateDebut ? new Date(occ.dateDebut).getFullYear() : new Date().getFullYear())}
          defaultDates={{
            start: occ.dateDebut?.split('T')[0] || format(new Date(), 'yyyy-MM-dd'),
            end: occ.dateFin?.split('T')[0] || format(new Date(), 'yyyy-MM-dd')
          }}
          occupationType={occ.type}
          initialData={editingLigne}
        />
      )}

      {/* Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                    <User size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 leading-tight">Ajouter un Contact</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Personne référente pour ce dossier</p>
                  </div>
                </div>
                <button onClick={() => setIsContactModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddContact} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Prénom / Nom</label>
                  <input
                    type="text"
                    required
                    value={newContact.prenom}
                    onChange={e => setNewContact({...newContact, prenom: e.target.value})}
                    placeholder="Jean Dupont"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold transition-all text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Email</label>
                  <input
                    type="email"
                    required
                    value={newContact.email}
                    onChange={e => setNewContact({...newContact, email: e.target.value})}
                    placeholder="jean@exemple.fr"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold transition-all text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Rôle / Fonction</label>
                  <select
                    value={newContact.role}
                    onChange={e => setNewContact({...newContact, role: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold transition-all text-sm appearance-none"
                  >
                    <option value="Contact principal">Contact principal</option>
                    <option value="Gérant">Gérant</option>
                    <option value="Architecte / Maitre d'œuvre">Architecte / Maitre d'œuvre</option>
                    <option value="Conducteur de travaux">Conducteur de travaux</option>
                    <option value="Contact administratif">Contact administratif</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingContact}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmittingContact ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Enregistrer le Contact
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotesThread({ occupationId, currentUser }: { occupationId: number, currentUser: any }) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [pj, setPj] = useState<{ path: string, name: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const [isEmailMode, setIsEmailMode] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);

  const fetchNotes = async () => {
    try {
      const res = await axios.get(`/api/occupations/${occupationId}/notes`);
      setNotes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await axios.get(`/api/occupations/${occupationId}/contacts`);
      setContacts(res.data);
      if (res.data.length > 0) {
        setSelectedContactId(res.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleHarvest = async () => {
    setIsHarvesting(true);
    try {
      const res = await axios.post('/api/messaging/harvest');
      if (res.data.imported > 0) {
        fetchNotes();
      }
    } catch (err) {
      console.error('Harvest failed:', err);
    } finally {
      setIsHarvesting(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchContacts();
  }, [occupationId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/upload', formData);
      setPj({ path: res.data.url, name: res.data.name });
    } catch (err) {
      alert('Erreur lors de l\'envoi du fichier');
    } finally {
      setUploading(false);
    }
  };

  const startDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("La reconnaissance vocale n'est pas supportée par votre navigateur.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNewNote((prev: string) => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() && !pj) return;
    setSubmitting(true);
    try {
      await axios.post(`/api/occupations/${occupationId}/notes`, { 
        content: newNote || (pj ? `Pièce jointe : ${pj.name}` : ''),
        pjPath: pj?.path,
        pjName: pj?.name,
        sendEmail: isEmailMode,
        contactId: isEmailMode ? selectedContactId : null
      });
      setNewNote('');
      setPj(null);
      setIsEmailMode(false);
      fetchNotes();
    } catch (err) {
      alert('Erreur lors de l\'envoi de la note');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-8 flex flex-col gap-8 min-h-[400px]">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/50">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <MessageSquare size={14} /> Fil de discussion
        </h3>
        <button 
          onClick={handleHarvest}
          disabled={isHarvesting}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 rounded-lg font-bold text-[9px] uppercase tracking-tighter transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          {isHarvesting ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
          Synchroniser mails
        </button>
      </div>

      <div className="flex-1 space-y-4 max-h-[500px] overflow-y-auto px-2 scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center h-full py-10 opacity-30">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-20 opacity-20">
             <MessageSquare size={40} className="mx-auto mb-2" />
             <p className="text-[10px] font-black uppercase tracking-widest italic">Aucun message pour le moment</p>
          </div>
        ) : (
          notes.map((note: any) => {
            const isMe = note.author === 'Conseiller' || 
                         note.author === "Mairie d'Ivry-sur-Seine" ||
                         (currentUser && note.author === `${currentUser.prenom} ${currentUser.nom}`);
            
            // Color Logic
            // - Sent Internal: Dark/Slate
            // - Sent Email: Blue/Indigo
            // - Received Email: Emerald/Green
            const isReceived = note.isEmail && !isMe;
            const isSentEmail = note.isEmail && isMe;

            let bgColor = 'bg-white border-slate-100 shadow-slate-200/20';
            let textColor = 'text-slate-800';
            let metaColor = 'text-slate-400';
            let dateColor = 'text-slate-300';
            let badgeStyle = 'bg-slate-50 border-slate-200 text-slate-400';

            if (isMe) {
               if (isSentEmail) {
                  bgColor = 'bg-indigo-600 border-indigo-500 shadow-indigo-500/20';
                  textColor = 'text-white';
                  metaColor = 'text-indigo-100';
                  dateColor = 'text-indigo-200';
                  badgeStyle = 'bg-indigo-500 border-indigo-400 text-indigo-100';
               } else {
                  bgColor = 'bg-slate-800 border-slate-700 shadow-slate-900/20';
                  textColor = 'text-white';
                  metaColor = 'text-slate-300';
                  dateColor = 'text-slate-400';
                  badgeStyle = 'bg-slate-700 border-slate-600 text-slate-300';
               }
            } else if (isReceived) {
               bgColor = 'bg-emerald-50 border-emerald-100 shadow-emerald-200/20';
               textColor = 'text-emerald-900';
               metaColor = 'text-emerald-600';
               dateColor = 'text-emerald-400';
               badgeStyle = 'bg-emerald-100 border-emerald-200 text-emerald-600';
            }

            return (
            <div key={note.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
               <div className={`max-w-[80%] rounded-3xl p-5 shadow-sm border ${
                 isMe && !isSentEmail ? 'rounded-tr-none' : 
                 isMe && isSentEmail ? 'rounded-tr-none' : 
                 'rounded-tl-none'
               } ${bgColor} ${textColor}`}>
                  <div className="flex items-center justify-between gap-10 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black uppercase tracking-widest ${metaColor}`}>
                        {note.author}
                      </span>
                      {note.origin === 'mobile' && (
                        <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-500" title="Saisie sur le terrain">
                          <Smartphone size={10} strokeWidth={3} />
                        </span>
                      )}
                      {note.isEmail && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase border flex items-center gap-1 ${badgeStyle}`}>
                          <Mail size={8} /> Mail
                        </span>
                      )}
                    </div>
                    <span className={`text-[8px] font-bold ${dateColor}`}>
                      {format(new Date(note.created_at), 'dd MMM HH:mm', { locale: fr })}
                    </span>
                  </div>
                  {note.content === 'Photo terrain' || note.content === '' ? (
                    <div className="flex items-center gap-2 text-[var(--text-dim)] opacity-40 italic py-2">
                       <Smartphone size={14} />
                       <span className="text-[10px] font-bold uppercase tracking-widest">Saisie terrain</span>
                    </div>
                  ) : (
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  )}
                  
                  {note.pjPath && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                      {/* Image Preview with lightbox feel */}
                      {note.pjPath.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                        <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/5 max-w-md group relative">
                          <a href={note.pjPath} target="_blank" rel="noreferrer">
                            <img 
                              src={note.pjThumb || note.pjPath} 
                              alt={note.pjName} 
                              className="w-full h-auto object-cover max-h-64 transition-transform duration-500 group-hover:scale-110" 
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <ImageIcon size={32} className="text-white drop-shadow-lg" />
                            </div>
                          </a>
                        </div>
                      ) : (
                        /* Document Preview Card */
                        <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                          isMe ? 'bg-white/10 border-white/10 hover:bg-white/20' : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'
                        }`}>
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                             isMe ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                           }`}>
                              {note.pjName?.endsWith('.pdf') ? <FileText size={24} /> : <FileArchive size={24} />}
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className={`text-xs font-black truncate ${isMe ? 'text-white' : 'text-slate-900'}`}>{note.pjName || 'Document'}</p>
                              <p className={`text-[10px] uppercase font-bold tracking-widest ${isMe ? 'text-white/40' : 'text-slate-400'}`}>
                                {note.pjName?.split('.').pop() || 'Fichier'}
                              </p>
                           </div>
                           <a 
                             href={note.pjPath} 
                             target="_blank" 
                             rel="noreferrer"
                             className={`p-3 rounded-xl transition-all ${
                               isMe ? 'hover:bg-white/10 text-white' : 'hover:bg-blue-50 text-blue-600'
                             }`}
                           >
                             <ExternalLink size={18} />
                           </a>
                        </div>
                      )}

                      {/* Download Link fallback */}
                      <a 
                        href={note.pjPath} 
                        target="_blank" 
                        rel="noreferrer"
                        className={`inline-flex items-center gap-2 p-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                          isMe ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <Download size={12} /> Télécharger
                      </a>
                    </div>
                  )}
               </div>
            </div>
          );
        })
        )}
      </div>

      <div className="space-y-4">
        {pj && (
          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 p-3 rounded-2xl animate-in slide-in-from-bottom-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <Paperclip size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Fichier prêt</p>
              <p className="text-xs font-bold text-indigo-900 truncate">{pj.name}</p>
            </div>
            <button onClick={() => setPj(null)} className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-400 transition-all">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between px-6">
           <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={() => setIsEmailMode(!isEmailMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all ${
                  isEmailMode 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-sm'
                }`}
              >
                <Mail size={14} /> Envoyer par mail
              </button>

              {isEmailMode && (
                <div className="animate-in slide-in-from-left-4 fade-in duration-300">
                  <select 
                    value={selectedContactId}
                    onChange={(e) => setSelectedContactId(e.target.value)}
                    className="bg-white border border-blue-200 text-blue-700 text-[10px] font-black uppercase tracking-widest py-2 px-4 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/5 appearance-none shadow-sm cursor-pointer"
                  >
                    {contacts.length === 0 ? (
                      <option value="">Aucun contact</option>
                    ) : (
                      contacts.map((c: any) => (
                        <option key={c.id} value={c.id}>À : {c.prenom} ({c.email})</option>
                      ))
                    )}
                  </select>
                </div>
              )}
           </div>
        </div>

        <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              rows={1}
              placeholder={isRecording ? "Écoute en cours..." : (isEmailMode ? "Rédigez votre email..." : "Écrivez une note interne...")}
              className={`w-full bg-white border rounded-[2rem] py-5 pl-8 pr-12 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all font-medium text-sm shadow-sm resize-none ${
                isRecording ? 'animate-pulse border-blue-400 ring-4 ring-blue-500/5' : 
                isEmailMode ? 'border-blue-300 border-2' : 'border-slate-200'
              }`}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            ></textarea>
            
            <div className="absolute right-4 bottom-4 flex items-center gap-1">
              <button
                type="button"
                onClick={startDictation}
                className={`p-2 rounded-full transition-all ${isRecording ? 'bg-rose-500 text-white animate-bounce' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'}`}
                title="Dicter la note"
              >
                <Mic size={18} />
              </button>
              <label className="p-2 rounded-full text-slate-400 hover:text-blue-600 hover:bg-slate-50 cursor-pointer transition-all" title="Ajouter une pièce jointe">
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
              </label>
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={submitting || (!newNote.trim() && !pj) || (isEmailMode && !selectedContactId)}
            className={`w-14 h-14 disabled:opacity-20 text-white rounded-[1.5rem] flex items-center justify-center transition-all active:scale-95 shadow-lg ${
              isEmailMode ? 'bg-blue-600 shadow-blue-500/30' : 'bg-slate-900 shadow-black/10'
            }`}
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : (isEmailMode ? <Send size={18} /> : <Send size={18} />)}
          </button>
        </form>
      </div>
    </div>
  );
}
