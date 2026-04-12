import { useState, useEffect } from 'react';
import axios from 'axios';
import { differenceInDays, isLeapYear } from 'date-fns';
import { Occupation, StatusConfig, TypeConfig, Contact } from '../types';
import { resizeImage } from '../../../../../lib/image-utils';
import { getStatusConfig } from '../../../../../lib/status-utils';

// Local STATUS_MAP removed in favor of dynamic mapping from @/lib/status-utils

export const TYPE_MAP: Record<string, TypeConfig> = {
  'COMMERCE': { label: 'Commerce', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  'CHANTIER': { label: 'Chantier', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  'TOURNAGE': { label: 'Tournage', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  'TLPE': { label: 'TLPE', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
};

export function useOccupationLogic(occupationId: string) {
  const [occ, setOcc] = useState<Occupation | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Contacts states
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [newContact, setNewContact] = useState<Partial<Contact>>({ 
    nom: '', 
    prenom: '', 
    email: '', 
    telephone: '', 
    titre: '', 
    entreprise: '', 
    role: 'Contact principal', 
    pjPath: '' 
  });

  // Dossier Upload states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [gabarits, setGabarits] = useState<any[]>([]);

  const fetchOccupation = async () => {
    try {
      const res = await axios.get(`/api/occupations/${occupationId}`);
      setOcc(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGabarits = async () => {
    try {
      const res = await axios.get('/api/gabarits');
      setGabarits(res.data);
    } catch (err) {}
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setCurrentUser(res.data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchOccupation();
    fetchCurrentUser();
    fetchGabarits();
  }, [occupationId]);

  const handleSetAotGabarit = async (gabaritId: number | null) => {
    if (!occ) return;
    try {
      await axios.patch(`/api/occupations/${occ.id}`, { aotGabaritId: gabaritId });
      fetchOccupation();
    } catch (err) {
      alert("Erreur lors de la sélection du gabarit");
    }
  };

  const handleDownloadAot = async () => {
    if (!occ) return;
    setGeneratingPdf(true);
    try {
      const res = await axios.get(`/api/aot-pdf/${occ.id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AOT-${occ.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération de l\'AOT');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleAutoAddTierContact = async (tiers: any) => {
    try {
      await axios.post(`/api/occupations/${occupationId}/contacts`, {
        prenom: tiers.nom,
        email: tiers.email,
        role: 'Contact Tiers'
      });
      fetchOccupation();
    } catch (err) {
      console.error('Failed to auto-add tier contact:', err);
    }
  };

  const handleToggleVerifie = async () => {
    if (!occ) return;
    const newStatut = occ.statut === 'VERIFIE' ? 'EN_COURS' : 'VERIFIE';
    try {
      await axios.patch(`/api/occupations/${occ.id}`, { statut: newStatut });
      fetchOccupation();
    } catch (err) {
      alert('Erreur lors du changement de statut');
    }
  };

  const downloadFacture = async () => {
    if (!occ) return;
    setGeneratingPdf(true);
    try {
      const res = await axios.get(`/api/facture-pdf/${occ.id}`, { responseType: 'blob' });
      await fetchOccupation();
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
    if (!occ || !confirm("Retirer cet article ?")) return;
    try {
      await axios.delete(`/api/occupations/${occ.id}/lignes/${ligneId}`);
      fetchOccupation();
    } catch (err) {
      alert("Erreur lors de la suppression de la ligne");
    }
  };

  // Contacts handlers
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    try {
      await axios.post(`/api/occupations/${occupationId}/contacts`, newContact);
      setIsContactModalOpen(false);
      setNewContact({ 
        nom: '', prenom: '', email: '', telephone: '', 
        titre: '', entreprise: '', role: 'Contact principal', pjPath: '' 
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
      await axios.delete(`/api/occupations/${occupationId}/contacts/${contactId}`);
      fetchOccupation();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
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

  const handleUploadNamedDoc = async (name: string, file: File) => {
    if (!occ) return;
    setIsUploading(true);
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    
    try {
      const fd = new FormData();
      if (!isPdf && file.type.startsWith('image/')) {
        const resizedBlob = await resizeImage(file);
        fd.append('file', resizedBlob, file.name);
      } else {
        fd.append('file', file);
      }

      const res = await axios.post('/api/upload', fd);
      const newUrl = res.data.url;
      
      const currentPhotos = occ.photos ? occ.photos.split(',') : [];
      // Store as url|name
      const updatedPhotos = [...currentPhotos, `${newUrl}|${name}`].join(',');

      await axios.patch(`/api/occupations/${occ.id}`, { photos: updatedPhotos });
      await fetchOccupation();
    } catch (err) {
      console.error('[Upload Named Doc] Error:', err);
      alert("Erreur lors de l'envoi du document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleValidateDemand = async () => {
    if (!occ) return;
    const photoList = occ.photos ? occ.photos.split(',').filter(Boolean) : [];
    if (photoList.length === 0) {
      alert("Veuillez joindre au moins un document (la demande) avant de valider.");
      return;
    }

    if (!confirm("Confirmer la réception de la demande ? Le dossier passera en étape 'Instruction'.")) return;

    try {
      await axios.patch(`/api/occupations/${occ.id}`, { statut: 'INST' });
      await fetchOccupation();
    } catch (err) {
      alert("Erreur lors de la validation de la demande");
    }
  };

  const handleNextStep = async () => {
    if (!occ) return;
    let nextStatus = '';
    let confirmMsg = '';

    if (occ.statut === 'INST') {
      nextStatus = 'PREP';
      confirmMsg = "Transmettre le dossier pour préparation des AOT ?";
    } else if (occ.statut === 'PREP') {
      nextStatus = 'EN_COURS';
      confirmMsg = "Passer le dossier en cours d'exécution ?";
    } else if (occ.statut === 'EN_COURS') {
      nextStatus = 'VERIFIE';
      confirmMsg = "Valider la fin d'occupation ? Le dossier sera verrouillé et prêt pour facturation.";
    }

    if (!nextStatus) return;
    if (!confirm(confirmMsg)) return;

    try {
      await axios.patch(`/api/occupations/${occ.id}`, { statut: nextStatus });
      await fetchOccupation();
    } catch (err) {
      alert("Erreur lors du changement d'étape");
    }
  };

  const handlePrevStep = async () => {
    if (!occ) return;
    let prevStatus = '';
    let confirmMsg = '';

    if (occ.statut === 'EN_COURS') {
      prevStatus = 'PREP';
      confirmMsg = "Revenir à l'étape de préparation des AOT ?";
    } else if (occ.statut === 'PREP') {
      prevStatus = 'INST';
      confirmMsg = "Revenir à l'étape d'instruction du dossier ?";
    } else if (occ.statut === 'INST') {
      prevStatus = 'INIT';
      confirmMsg = "Revenir à l'étape initiale (réception de demande) ?";
    }

    if (!prevStatus) return;
    if (!confirm(confirmMsg)) return;

    try {
      await axios.patch(`/api/occupations/${occ.id}`, { statut: prevStatus });
      await fetchOccupation();
    } catch (err) {
      alert("Erreur lors du retour à l'étape précédente");
    }
  };

  const handleRegisterPayment = async (dateStr: string) => {
    if (!occ) return;
    
    if (!dateStr) return;
    
    // Validate date format basic
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      alert("Format de date invalide. Utilisez AAAA-MM-JJ.");
      return;
    }

    try {
      await axios.patch(`/api/occupations/${occ.id}`, { 
        datePaiement: dateStr,
        statut: 'PAYE'
      });
      await fetchOccupation();
      alert("Paiement enregistré. Dossier clos.");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement du paiement");
    }
  };

  const statusInfo = occ ? getStatusConfig(occ.type, occ.statut) : null;
  const typeInfo = occ ? TYPE_MAP[occ.type] || { label: occ.type, color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' } : null;
  const isLocked = occ ? ['VERIFIE', 'FACTURE', 'PAYE'].includes(occ.statut) : false;
  const isFactured = occ ? ['FACTURE', 'PAYE'].includes(occ.statut) : false;
  const totalAmount = occ?.montantCalcule || 0;

  return {
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
    // Contacts
    isContactModalOpen,
    setIsContactModalOpen,
    isSubmittingContact,
    newContact,
    setNewContact,
    handleAddContact,
    handleDeleteContact,
    handlePhotoContact,
    // Dossier Upload
    isUploadModalOpen,
    setIsUploadModalOpen,
    isUploading,
    handleUploadNamedDoc,
    handleValidateDemand,
    handleNextStep,
    handlePrevStep,
    handleRegisterPayment,
    // AOT
    gabarits,
    handleSetAotGabarit,
    handleDownloadAot
  };
}
