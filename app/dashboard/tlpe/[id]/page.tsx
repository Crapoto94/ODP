"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  Euro, 
  MapPin, 
  Calendar, 
  Package, 
  List, 
  Download, 
  Loader2, 
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Info,
  Maximize2,
  Plus,
  Search,
  Tag,
  Hash,
  Fingerprint,
  Pencil,
  Trash2,
  MessageSquare
} from 'lucide-react';
import { format, differenceInDays, isLeapYear } from 'date-fns';
import TlpeLigneArticleModal from '@/components/TlpeLigneArticleModal';
import OccupationHeader from '@/app/dashboard/occupations/[id]/components/OccupationHeader';
import OccupationHero from '@/app/dashboard/occupations/[id]/components/OccupationHero';
import OccupationNotes from '@/app/dashboard/occupations/[id]/components/OccupationNotes';
import TlpeSidebar from './components/TlpeSidebar';
import TlpeContactModal from './components/TlpeContactModal';
import TlpeArticles from './components/TlpeArticles';
import Link from 'next/link';

const STATUS_MAP: Record<string, any> = {
  'EN_ATTENTE': { label: 'En attente', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
  'EN_COURS': { label: 'En cours', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  'TERMINE': { label: 'Terminé', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  'VERIFIE': { label: 'Vérifié', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'FACTURE': { label: 'Facturé', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  'PAYE': { label: 'Payé', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300' },
};

const TYPE_MAP: Record<string, any> = {
  'TLPE': { label: 'T.L.P.E.', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  'COMMERCE': { label: 'Commerce', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
};

export default function TlpeDetailPage() {
  const params = useParams();
  const paramId = params.id;
  const [occ, setOcc] = useState<any>(null);
  const [tlpeConfig, setTlpeConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLigneModalOpen, setIsLigneModalOpen] = useState(false);
  const [editingLigne, setEditingLigne] = useState<any>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [newContact, setNewContact] = useState({
    nom: '', prenom: '', email: '', telephone: '', titre: '', entreprise: '', role: 'Contact principal', pjPath: ''
  });

  const fetchOccupation = async () => {
    try {
      const res = await axios.get(`/api/occupations/${paramId}`);
      const data = res.data;
      setOcc(data);

      const year = data.anneeTaxation || (data.dateDebut ? new Date(data.dateDebut).getFullYear() : new Date().getFullYear());
      const configRes = await axios.get(`/api/articles/tlpe?annee=${year}`);
      setTlpeConfig(configRes.data.config);
      setConfigLoading(false);

      if (data.contacts?.length === 0 && data.tiers) {
        autoAddTierContact(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const autoAddTierContact = async (data: any) => {
    try {
      await axios.post(`/api/occupations/${data.id}/contacts`, {
        prenom: data.tiers.nom,
        email: data.tiers.email,
        role: 'Contact Tiers'
      });
      fetchOccupation();
    } catch (err) {
      console.error('Failed to auto-add tier contact:', err);
    }
  };

  useEffect(() => {
    fetchOccupation();
    axios.get('/api/auth/me').then(res => setCurrentUser(res.data)).catch(() => {});
  }, [paramId]);

  if (loading || configLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={40} className="animate-spin text-purple-600" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {loading ? 'Chargement du dossier...' : 'Chargement de la configuration tarifaire...'}
        </p>
      </div>
    );
  }

  if (!occ) {
    return (
      <div className="text-center py-20 font-black">
        <p className="text-xl text-slate-900 uppercase tracking-widest">Dossier non trouvé</p>
        <Link href="/dashboard/tlpe" className="text-purple-600 hover:underline mt-4 inline-block text-[10px] uppercase">Retour à la liste</Link>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[occ.statut] || { label: occ.statut, color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' };
  const typeInfo = TYPE_MAP[occ.type] || { label: occ.type, color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' };
  const isLocked = ['VERIFIE', 'FACTURE', 'PAYE'].includes(occ.statut);
  const isFactured = ['FACTURE', 'PAYE'].includes(occ.statut);
  const anneeTaxation = occ.anneeTaxation || (occ.dateDebut ? new Date(occ.dateDebut).getFullYear() : new Date().getFullYear());

  const totalEnseigneSurface = occ.lignes?.reduce((sum: number, l: any) => {
    if (l.article?.meta?.tlpeType === 'ENSEIGNE') return sum + (l.quantite1 || 0);
    return sum;
  }, 0) || 0;

  const threshold = tlpeConfig?.exoneration ?? 7;
  const isEnseigneExempt = totalEnseigneSurface <= threshold;

  const totalAmount = occ.lignes?.reduce((sum: number, l: any) => {
    const isEnseigne = l.article?.meta?.tlpeType === 'ENSEIGNE';
    if (isEnseigne && isEnseigneExempt) return sum;

    const d1 = new Date(l.dateDebut);
    const d2 = new Date(l.dateFin);
    const year = anneeTaxation;
    const daysInYear = isLeapYear(new Date(year, 0, 1)) ? 366 : 365;
    const daysActive = differenceInDays(d2, d1) + 1;
    const prorata = Math.min(1, Math.max(0, daysActive / daysInYear));
    return sum + ((l.montant || 0) * (l.quantite1 || 0) * prorata);
  }, 0) || 0;

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
      const res = await axios.get(`/api/facture-pdf/${occ.id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Facture-TLPE-${occ.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
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
    } catch (err) { alert("Erreur lors de la suppression"); }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    try {
      await axios.post(`/api/occupations/${occ.id}/contacts`, newContact);
      setIsContactModalOpen(false);
      setNewContact({ nom: '', prenom: '', email: '', telephone: '', titre: '', entreprise: '', role: 'Contact principal', pjPath: '' });
      fetchOccupation();
    } catch (err) { alert('Erreur lors de l\'ajout du contact'); }
    finally { setIsSubmittingContact(false); }
  };

  const handleDeleteContact = async (contactId: number) => {
    if (!confirm('Supprimer ce contact ?')) return;
    try {
      await axios.delete(`/api/occupations/${occ.id}/contacts/${contactId}`);
      fetchOccupation();
    } catch (err) { alert('Erreur lors de la suppression'); }
  };

  return (
    <div className="min-h-screen pb-10 space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      <OccupationHeader 
        occupation={occ} 
        isFactured={isFactured} 
        isLocked={isLocked} 
        onToggleVerifie={handleToggleVerifie}
        backLink="/dashboard/tlpe"
        backLabel="Retour aux dossiers TLPE"
        editLink={`/dashboard/tlpe?edit=${occ.id}`}
      />

      <div className="max-w-7xl mx-auto space-y-6 px-4">
        {/* Condensed Hero with Financial Summary */}
        <div className="flex flex-col lg:flex-row items-stretch gap-6">
          <div className="flex-1">
             <OccupationHero occupation={occ} statusInfo={statusInfo} typeInfo={typeInfo} />
          </div>
          
          <div className="w-full lg:w-[320px] shrink-0">
            <div className="bg-slate-900 rounded-xl p-6 text-white relative overflow-hidden group/wallet h-full shadow-xl">
               <div className="absolute -right-10 -bottom-10 opacity-20 group-hover/wallet:scale-110 transition-all duration-700">
                  <Euro size={160} className="text-white/10" />
               </div>
               <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                  <div>
                    <p className="text-slate-500 font-black text-[9px] uppercase tracking-widest mb-1.5 leading-none">Redevance Totale {anneeTaxation}</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black tracking-tighter tabular-nums text-white">
                        {totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-lg font-black text-purple-400">€</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={downloadFacture}
                    disabled={generatingPdf}
                    className="w-full bg-white text-slate-900 hover:bg-slate-100 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {generatingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    {generatingPdf ? 'Génération...' : 'Facture PDF'}
                  </button>
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
             <TlpeArticles 
               lignes={occ.lignes || []} 
               isFactured={isFactured}
               anneeTaxation={anneeTaxation}
               isEnseigneExempt={isEnseigneExempt}
               onAddArticle={() => { setEditingLigne(null); setIsLigneModalOpen(true); }}
               onEditArticle={(ligne) => { setEditingLigne(ligne); setIsLigneModalOpen(true); }}
               onDeleteArticle={handleDeleteLigne}
             />
             <OccupationNotes occupationId={occ.id} currentUser={currentUser} />
          </div>

          <div className="space-y-6">
             <TlpeSidebar 
               occupation={occ} 
               isFactured={isFactured} 
               onOpenContactModal={() => setIsContactModalOpen(true)}
               onDeleteContact={handleDeleteContact}
             />
          </div>
        </div>
      </div>

      {isLigneModalOpen && (
        <TlpeLigneArticleModal 
          isOpen={isLigneModalOpen}
          onClose={() => setIsLigneModalOpen(false)}
          occupationId={occ.id}
          annee={anneeTaxation}
          onSuccess={fetchOccupation}
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
    </div>
  );
}
