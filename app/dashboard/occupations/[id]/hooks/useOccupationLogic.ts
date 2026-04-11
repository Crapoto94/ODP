import { useState, useEffect } from 'react';
import axios from 'axios';
import { differenceInDays, isLeapYear } from 'date-fns';
import { Occupation, StatusConfig, TypeConfig, Contact } from '../types';
import { resizeImage } from '../../../../../lib/image-utils';

export const STATUS_MAP: Record<string, StatusConfig> = {
  'EN_ATTENTE': { label: 'En attente', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  'EN_COURS': { label: 'En cours', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  'TERMINE': { label: 'Terminé', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  'VERIFIE': { label: 'Vérifié', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  'FACTURE': { label: 'Facturé', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  'INVOICED': { label: 'Facturé', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  'PAYE': { label: 'Payé', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
};

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

  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setCurrentUser(res.data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchOccupation();
    fetchCurrentUser();
  }, [occupationId]);

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

  const statusInfo = occ ? STATUS_MAP[occ.statut] || { label: occ.statut, color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' } : null;
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
    handlePhotoContact
  };
}
