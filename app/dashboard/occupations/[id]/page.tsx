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
  const [newContact, setNewContact] = useState({ 
    nom: '', 
    prenom: '', 
    email: '', 
    telephone: '', 
    titre: '', 
    entreprise: '', 
    role: 'Contact principal', 
    pjPath: '' 
  });
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
    'EN_ATTENTE': { label: 'En attente', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    'EN_COURS': { label: 'En cours', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    'TERMINE': { label: 'Terminé', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    'VERIFIE': { label: 'Vérifié', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    'FACTURE': { label: 'Facturé', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    'INVOICED': { label: 'Facturé', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  };

  const TYPE_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
    'COMMERCE': { label: 'Commerce', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    'CHANTIER': { label: 'Chantier', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    'TOURNAGE': { label: 'Tournage', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  };

  const statusInfo = STATUS_MAP[occ.statut] || { label: occ.statut, color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' };
  const typeInfo = TYPE_MAP[occ.type] || { label: occ.type, color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' };
  const isLocked = ['VERIFIE', 'FACTURE', 'PAYE'].includes(occ.statut);

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
      setNewContact({ 
        nom: '', 
        prenom: '', 
        email: '', 
        telephone: '', 
        titre: '', 
        entreprise: '', 
        role: 'Contact principal', 
        pjPath: '' 
      });
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

  const resizeImage = (file: File, maxWidth = 1200, maxHeight = 1200): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
          }, 'image/jpeg', 0.8);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoContact = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const resizedBlob = await resizeImage(file);
      const fd = new FormData();
      fd.append('file', resizedBlob, 'contact_card.jpg');
      const res = await axios.post('/api/upload', fd);
      setNewContact(prev => ({ ...prev, pjPath: res.data.url }));
    } catch (err: any) {
      console.error('[Upload] Error:', err);
      alert("Erreur lors de l'envoi de la photo");
    } finally {
      e.target.value = '';
    }
  };

  const isFactured = ['FACTURE', 'PAYE'].includes(occ.statut);

  return (
    <div className="min-h-screen pb-20 space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Sticky Premium Header */}
      <div className="sticky top-0 z-50 -mx-4 px-4 py-4 bg-slate-50/80 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            href="/dashboard/occupations"
            className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-all font-black text-xs uppercase tracking-widest group"
          >
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all shadow-sm">
              <ChevronLeft size={18} />
            </div>
            <span className="hidden md:block">Retour à l'inventaire</span>
          </Link>

          <div className="flex items-center gap-4">
             {!isFactured && !isLocked && (
               <button 
                 onClick={() => router.push(`/dashboard/occupations?edit=${occ.id}`)}
                 className="px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 rounded-2xl transition-all shadow-sm font-black text-[10px] uppercase tracking-widest flex items-center gap-2 active:scale-95"
               >
                 <Pencil size={14} /> Modifier info
               </button>
             )}
             <button
               onClick={handleToggleVerifie}
               disabled={isFactured}
               className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-40 ${
                 isLocked
                   ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/20'
                   : 'bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
               }`}
             >
               <CheckCircle2 size={16} />
               {isLocked ? 'Déverrouiller' : 'Valider le dossier'}
             </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Hero Section: Glass Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-emerald-600/20 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-[3rem] border border-white p-10 md:p-14 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-2xl shadow-slate-200/50">
            <div className="space-y-8 flex-1 w-full">
              <div className="flex flex-wrap items-center gap-4">
                <span className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                  {statusInfo.label}
                </span>
                <span className={`px-5 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${typeInfo.bg} ${typeInfo.color} ${typeInfo.border}`}>
                  {typeInfo.label}
                </span>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-2">
                  DOSSIER #{occ.id}
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-black text-slate-950 tracking-tight leading-[1.1] max-w-3xl">
                {occ.nom || `Dossier sans nom`}
              </h1>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                <div className="flex items-center gap-5 p-4 rounded-3xl hover:bg-slate-50 transition-colors">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner border border-blue-100">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Demandeur</p>
                    <p className="text-base font-black text-slate-900 leading-none">{occ.tiers?.nom || 'Non spécifié'}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Sedit : {occ.tiers?.code_sedit || '-'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-5 p-4 rounded-3xl hover:bg-slate-50 transition-colors">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner border border-emerald-100">
                    <MapPin size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Localisation</p>
                    <p className="text-base font-black text-slate-900 leading-snug truncate">{occ.adresse}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 p-4 rounded-3xl hover:bg-slate-50 transition-colors">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner border border-amber-100">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Période d'occupation</p>
                    <p className="text-base font-black text-slate-900 leading-none">
                      {occ.type === 'COMMERCE' ? (occ.anneeTaxation || '-') : (
                        <span className="flex items-center gap-2">
                          {occ.dateDebut ? format(new Date(occ.dateDebut), 'dd MMM yyyy', { locale: fr }) : '?'} 
                          <ArrowRight size={14} className="text-slate-300" />
                          {occ.dateFin ? format(new Date(occ.dateFin), 'dd MMM yyyy', { locale: fr }) : '?'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Card: Dark Mode */}
            <div className="w-full lg:w-[400px] shrink-0">
               <div className="bg-slate-950 rounded-[3rem] p-10 text-white relative overflow-hidden group/wallet shadow-2xl shadow-slate-900/40">
                  <div className="absolute -right-10 -bottom-10 opacity-20 group-hover/wallet:scale-110 group-hover/wallet:-rotate-12 transition-all duration-700">
                    <Euro size={200} className="text-white/10" />
                  </div>
                  <div className="relative z-10 flex flex-col h-full justify-between gap-10">
                    <div>
                      <p className="text-slate-500 font-black text-[11px] uppercase tracking-[0.2em] mb-3">Redevance Totale TTC</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black tracking-tighter tabular-nums">
                          {totalAmount.toLocaleString('fr-FR')} 
                        </span>
                        <span className="text-3xl font-black text-blue-400">€</span>
                      </div>
                    </div>
                    
                    <button 
                        onClick={downloadFacture}
                        disabled={generatingPdf}
                        className="w-full bg-white text-slate-950 hover:bg-blue-50 py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 ring-offset-2 ring-offset-slate-950 focus:ring-4 focus:ring-white/20"
                      >
                        {generatingPdf ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Download size={18} />
                        )}
                        {generatingPdf ? 'Génération en cours...' : 'Générer la Facture PDF'}
                      </button>
                    </div>
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* LEFT SIDE: Articles & Discussion */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Articles Section */}
            <section className="space-y-8">
              <div className="flex items-center justify-between pb-6 border-b border-slate-200">
                 <div>
                   <h2 className="text-3xl font-black text-slate-950 tracking-tight">Détail des Articles</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{isFactured ? 'Consultation uniquement (Facture émise)' : 'Articles taxables rattachés au dossier'}</p>
                 </div>
                 {!isFactured && (
                   <button 
                     onClick={() => { setEditingLigne(null); setIsLigneModalOpen(true); }}
                     className="flex items-center gap-3 bg-slate-950 hover:bg-slate-800 text-white px-8 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 group"
                   >
                     <Plus size={18} className="group-hover:rotate-90 transition-transform" /> 
                     Ajouter un article
                   </button>
                 )}
              </div>

              <div className="grid grid-cols-1 gap-6">
                {!occ.lignes || occ.lignes.length === 0 ? (
                  <div className="py-24 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
                     <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                        <Package size={28} className="text-slate-200" />
                     </div>
                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Aucun article enregistré pour le moment</p>
                  </div>
                ) : (
                  occ.lignes.map((ligne: any) => (
                    <div key={ligne.id} className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between group transition-all hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/5 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="flex items-start gap-8 flex-1 w-full">
                        <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex flex-col items-center justify-center border border-slate-200 p-3 text-center group-hover:bg-white group-hover:border-blue-100 transition-all shrink-0">
                           <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Code</p>
                           <p className="font-black text-slate-950 text-xl leading-none">{ligne.article?.numero || '#'}</p>
                        </div>
                        
                        <div className="space-y-4 text-left flex-1 min-w-0">
                           <div className="flex flex-wrap items-center gap-3">
                             <h4 className="text-xl font-black text-slate-950 tracking-tight">{ligne.article?.designation}</h4>
                             <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-blue-100/50">
                               {ligne.article?.modeTaxation?.nom || 'Tarif Fixe'}
                             </span>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3 text-slate-500">
                                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                    <Clock size={14} />
                                  </div>
                                <span className="text-xs font-bold uppercase tracking-wide">
                                  {occ.type === 'COMMERCE' 
                                    ? `Exercice ${occ.anneeTaxation}`
                                    : `Prévu : Du ${(() => { try { return ligne.dateDebut ? format(new Date(ligne.dateDebut), 'dd/MM/yyyy') : '?'; } catch(e) { return '?'; } })()} au ${(() => { try { return ligne.dateFin ? format(new Date(ligne.dateFin), 'dd/MM/yyyy') : '?'; } catch(e) { return '?'; } })()}`
                                  }
                                </span>
                                </div>
                                {ligne.dateDebutConstatee && (
                                  <div className="flex items-center gap-2 ml-1">
                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/50">
                                      Constaté : Du {(() => {
                                          try { return format(new Date(ligne.dateDebutConstatee), 'dd/MM/yyyy'); } catch(e) { return '?'; }
                                        })()} au {(() => {
                                          try { return format(new Date(ligne.dateFinConstatee), 'dd/MM/yyyy'); } catch(e) { return '?'; }
                                        })()}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-slate-500">
                                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                  <Hash size={14} />
                                </div>
                                <div className="text-xs font-bold uppercase tracking-wide leading-relaxed">
                                  {(() => {
                                    const rawMode = ligne.article?.modeTaxation?.nom || 'unité';
                                    const parts = rawMode.split('/').map((p: string) => p.trim());
                                    const u1 = parts[0] || 'unité';
                                    const u2 = parts[1] || 'unité';
                                    
                                    if (occ.type === 'CHANTIER') {
                                      return <span>{ligne.quantite1} {u1} x {ligne.quantite2} {u2} à {ligne.article?.montant}€</span>;
                                    }
                                    return <span>{ligne.quantite1} {u1} à {ligne.article?.montant}€</span>;
                                  })()}
                                </div>
                              </div>
                           </div>
                           
                           {ligne.photos && (
                              <div className="flex flex-wrap gap-3 mt-2">
                                 {ligne.photos.split(',').filter(Boolean).map((url: string, i: number) => (
                                   <a key={i} href={url} target="_blank" rel="noreferrer" className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-100 hover:border-blue-400 transition-all shadow-sm hover:scale-105">
                                     <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                                   </a>
                                 ))}
                              </div>
                           )}
                        </div>
                      </div>

                      <div className="mt-8 md:mt-0 flex items-center gap-10 pl-28 md:pl-0 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-6 md:pt-0">
                         <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 leading-none tracking-widest">Sous-total</p>
                            <p className="text-3xl font-black text-slate-950 leading-none tabular-nums">
                              {ligne.montant.toLocaleString('fr-FR')} <span className="text-lg text-blue-500">€</span>
                            </p>
                         </div>
                         
                         {!isFactured && (
                           <div className="flex gap-3">
                              <button 
                                onClick={() => { setEditingLigne(ligne); setIsLigneModalOpen(true); }}
                                className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-transparent hover:border-blue-100"
                              >
                                <Pencil size={20} />
                              </button>
                              <button 
                                onClick={() => handleDeleteLigne(ligne.id)}
                                className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100"
                              >
                                <Trash2 size={20} />
                              </button>
                           </div>
                         )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Collaboration Section */}
            <section className="space-y-8">
              <div className="flex items-center justify-between pb-6 border-b border-slate-200">
                 <div>
                   <h2 className="text-3xl font-black text-slate-950 tracking-tight">Collaboration</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Échanges et notes de suivi</p>
                 </div>
              </div>
              
              <NotesThread occupationId={occ.id} currentUser={currentUser} />
            </section>
          </div>

          {/* RIGHT SIDE: Sidebar (Docs, Contacts, Obs) */}
          <aside className="lg:col-span-4 space-y-12">
            
            {/* Documents Section */}
            <section className="space-y-8">
              <div className="flex items-center justify-between group/title">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                  <ImageIcon size={16} className="text-blue-500" /> Documents & PJ ({(occ.photos ? occ.photos.split(',').filter(Boolean).length : 0) + (occ.facturePath ? 1 : 0)})
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {occ.photos ? (
                  occ.photos.split(',').filter(Boolean).map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="group relative aspect-square rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm transition-all hover:scale-[1.02] hover:shadow-2xl">
                      <img src={url} alt={`Dossier PJ ${i+1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-4 text-center">
                        <ExternalLink size={24} className="text-white mb-2" />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Voir le document</span>
                      </div>
                    </a>
                  ))
                ) : null}

                {occ.facturePath && (
                  <a href={occ.facturePath} target="_blank" rel="noreferrer" className="group relative aspect-square rounded-[2.5rem] overflow-hidden border-2 border-blue-100 bg-blue-50/50 shadow-sm transition-all hover:scale-[1.02] hover:shadow-2xl flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center shadow-lg border border-blue-100 mb-4 group-hover:scale-110 transition-transform">
                      <FileText size={32} className="text-blue-600" />
                    </div>
                    <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Facture Officielle</p>
                    <p className="text-[8px] font-black text-slate-400 mt-2 uppercase">Générée par Sedit</p>
                    <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}

                {(!occ.photos && !occ.facturePath) && (
                  <div className="col-span-2 py-12 bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-center flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                      <FileArchive size={20} className="text-slate-300" />
                    </div>
                    <p className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">Aucun document joint</p>
                  </div>
                )}
              </div>
            </section>

            {/* Contacts Section */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                   <User size={16} className="text-emerald-500" /> Contacts Référents ({occ.contacts?.length || 0})
                 </h3>
                 {!isFactured && (
                   <button 
                     onClick={() => setIsContactModalOpen(true)}
                     className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
                   >
                     <Plus size={20} />
                   </button>
                 )}
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {occ.contacts?.length > 0 ? (
                  occ.contacts.map((contact: any) => (
                    <div key={contact.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-emerald-400 transition-all flex items-center justify-between hover:shadow-xl">
                      <div className="flex items-center gap-5 min-w-0">
                        {contact.pjPath ? (
                          <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden border border-slate-100 bg-slate-50 shrink-0 shadow-inner">
                            <img src={contact.pjPath} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shrink-0">
                            <User size={28} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100/50">
                            {contact.role}
                          </span>
                          <p className="text-base font-black text-slate-950 truncate mt-2">{contact.prenom} {contact.nom}</p>
                          <div className="flex flex-col gap-1.5 mt-2">
                            {contact.email && (
                              <a href={`mailto:${contact.email}`} className="text-[10px] font-black text-slate-400 hover:text-blue-600 flex items-center gap-2 transition-colors">
                                <Mail size={12} className="shrink-0 text-slate-300" />
                                {contact.email}
                              </a>
                            )}
                            {contact.telephone && (
                              <a href={`tel:${contact.telephone}`} className="text-[10px] font-black text-slate-400 hover:text-emerald-600 flex items-center gap-2 transition-colors">
                                <Smartphone size={12} className="shrink-0 text-slate-300" />
                                {contact.telephone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      {!isFactured && (
                        <button 
                          onClick={() => handleDeleteContact(contact.id)}
                          className="opacity-0 group-hover:opacity-100 w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-12 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 text-center flex flex-col items-center">
                    <User size={24} className="text-slate-200 mb-4" />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Aucun contact référent</p>
                  </div>
                )}
              </div>
            </section>

            {/* Observations Section */}
            <section className="space-y-6">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                 <FileArchive size={16} className="text-amber-500" /> Observations Techniques
              </h3>
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden min-h-[160px]">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-[4rem] flex items-center justify-center -mr-10 -mt-10 opacity-50">
                   <Clock size={32} className="text-amber-200" />
                </div>
                <p className="text-slate-600 font-medium leading-relaxed italic text-sm relative z-10">
                  {occ.description || "Aucune observation technique complémentaire n'a été consignée pour ce dossier d'occupation."}
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {isLigneModalOpen && (
        <LigneArticleModal 
          isOpen={isLigneModalOpen}
          onClose={() => setIsLigneModalOpen(false)}
          onSave={fetchOccupation}
          occupationId={occ.id}
          annee={occ.dateDebut ? new Date(occ.dateDebut).getFullYear() : (occ.anneeTaxation || new Date().getFullYear())}
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
                <div className="flex justify-center">
                  {newContact.pjPath ? (
                    <div className="relative w-40 aspect-[1.6/1] rounded-2xl overflow-hidden border-2 border-slate-100 shadow-md">
                      <img src={newContact.pjPath} className="w-full h-full object-contain bg-slate-50" />
                      <button 
                        type="button"
                        onClick={() => setNewContact({...newContact, pjPath: ''})}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-rose-600 transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => document.getElementById('contact-photo-input')?.click()}
                      className="w-40 aspect-[1.6/1] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-300 hover:text-blue-500 hover:border-blue-300 transition-all bg-slate-50/50"
                    >
                      <ImageIcon size={32} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Carte de visite</span>
                    </button>
                  )}
                  <input id="contact-photo-input" type="file" accept="image/*" className="hidden" onChange={handlePhotoContact} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Prénom</label>
                    <input
                      type="text"
                      required
                      value={newContact.prenom}
                      onChange={e => setNewContact({...newContact, prenom: e.target.value})}
                      placeholder="Jean"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:border-blue-500 font-bold transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Nom</label>
                    <input
                      type="text"
                      value={newContact.nom}
                      onChange={e => setNewContact({...newContact, nom: e.target.value})}
                      placeholder="Dupont"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:border-blue-500 font-bold transition-all text-sm uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Entreprise</label>
                    <input
                      type="text"
                      value={newContact.entreprise}
                      onChange={e => setNewContact({...newContact, entreprise: e.target.value})}
                      placeholder="Société..."
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:border-blue-500 font-bold transition-all text-sm uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Titre / Fonction</label>
                    <input
                      type="text"
                      value={newContact.titre}
                      onChange={e => setNewContact({...newContact, titre: e.target.value})}
                      placeholder="Gérant, Dirigeant..."
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:border-blue-500 font-bold transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Email</label>
                    <input
                      type="email"
                      required
                      value={newContact.email}
                      onChange={e => setNewContact({...newContact, email: e.target.value})}
                      placeholder="jean@exemple.fr"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:border-blue-500 font-bold transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Téléphone</label>
                    <input
                      type="tel"
                      value={newContact.telephone}
                      onChange={e => setNewContact({...newContact, telephone: e.target.value})}
                      placeholder="06..."
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:border-blue-500 font-bold transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Rôle / Type de Contact</label>
                  <select
                    value={newContact.role}
                    onChange={e => setNewContact({...newContact, role: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:border-blue-500 font-bold transition-all text-sm appearance-none"
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
