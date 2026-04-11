import { useState, useEffect } from 'react';
import axios from 'axios';
import { Contact } from '@/components/ContactModal';
import { resizeImage } from '@/lib/image-utils';

export function useTiersLogic(tiersId: string) {
  const [tiers, setTiers] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [newContact, setNewContact] = useState<Partial<Contact>>({ 
    role: 'Contact principal', 
    pjPath: '' 
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({
    id: null,
    nom: '',
    natureJuridique: '',
    siret: '',
    email: '',
    adresse: '',
    code_sedit: '',
    isRhRequest: false
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchTiers = async () => {
    try {
      const res = await axios.get(`/api/tiers/${tiersId}`);
      setTiers(res.data);
      // Initialize edit form
      setEditFormData({
        id: res.data.id,
        nom: res.data.nom,
        natureJuridique: res.data.natureJuridique || '',
        siret: res.data.siret || '',
        email: res.data.email || '',
        adresse: res.data.adresse || '',
        code_sedit: res.data.code_sedit || '',
        isRhRequest: false
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiers();
  }, [tiersId]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    try {
      await axios.post(`/api/tiers/${tiersId}/contacts`, newContact);
      setIsContactModalOpen(false);
      setNewContact({ 
        nom: '', prenom: '', email: '', telephone: '', 
        titre: '', entreprise: '', role: 'Contact principal', pjPath: '' 
      });
      fetchTiers();
    } catch (err) {
      alert('Erreur lors de l\'ajout du contact');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    if (!confirm('Supprimer ce contact du tiers ?')) return;
    try {
      await axios.delete(`/api/tiers/${tiersId}/contacts?id=${contactId}`);
      fetchTiers();
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

  const handleUpdateTiers = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEdit(true);
    try {
      await axios.put('/api/tiers', editFormData);
      setIsEditModalOpen(false);
      fetchTiers();
    } catch (err) {
      alert('Erreur lors de la mise à jour');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleSiretSearch = async () => {
    if (!editFormData.siret) return;
    setSubmittingEdit(true);
    try {
      const res = await axios.get(`https://recherche-entreprises.api.gouv.fr/search?q=${editFormData.siret.replace(/\s+/g, '')}`);
      if (res.data.results && res.data.results.length > 0) {
        const result = res.data.results[0];
        setEditFormData({
          ...editFormData,
          nom: result.nom_complet || result.nom_raison_sociale,
          adresse: result.siege?.adresse || result.adresse
        });
      }
    } catch (err) {
      alert('SIRET introuvable');
    } finally {
      setSubmittingEdit(false);
    }
  };

  return {
    tiers,
    loading,
    isContactModalOpen,
    setIsContactModalOpen,
    isSubmittingContact,
    newContact,
    setNewContact,
    handleAddContact,
    fetchTiers,
    handleDeleteContact,
    handlePhotoContact,
    isEditModalOpen,
    setIsEditModalOpen,
    editFormData,
    setEditFormData,
    submittingEdit,
    handleUpdateTiers,
    handleSiretSearch
  };
}
