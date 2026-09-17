import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { differenceInDays, isLeapYear } from 'date-fns';
import { resizeImage } from '@/lib/image-utils';

// Meme principe que useCommerceLogic.ts, adapte au TLPE : une page par
// TIERS (paramId = tiersId), un selecteur d'annee, un dossier par annee.
export function useTlpeLogic(paramId: string) {
  const tiersId = parseInt(paramId);

  const [tiers, setTiers] = useState<any>(null);
  const [occupations, setOccupations] = useState<any[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [tlpeConfig, setTlpeConfig] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [aotGabarits, setAotGabarits] = useState<any[]>([]);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isGeneratingFacture, setIsGeneratingFacture] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [isLigneModalOpen, setIsLigneModalOpen] = useState(false);
  const [editingLigne, setEditingLigne] = useState<any>(null);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [newContact, setNewContact] = useState({
    nom: '', prenom: '', email: '', telephone: '', titre: '', entreprise: '', role: 'Contact principal', pjPath: ''
  });

  const currentOccupation = occupations.find((o: any) => o.anneeTaxation === selectedYear) || null;

  const fetchTlpeDetails = useCallback(async () => {
    const res = await axios.get(`/api/tlpe/${tiersId}`);
    setTiers(res.data.tiers);
    setOccupations(res.data.occupations);
    setYears(res.data.years);
    setSelectedYear((prev) => prev ?? res.data.years[0] ?? new Date().getFullYear());
    return res.data;
  }, [tiersId]);

  const fetchTlpeConfig = useCallback(async (year: number) => {
    try {
      const res = await axios.get(`/api/articles/tlpe?annee=${year}`);
      setTlpeConfig(res.data.config);
    } catch (e) {
      console.error('[TLPE] Erreur chargement config', e);
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setCurrentUser(res.data);
    } catch (e) { /* ignore */ }
  }, []);

  const fetchGabarits = useCallback(async () => {
    try {
      const res = await axios.get('/api/gabarits');
      setAotGabarits((res.data || []).filter((g: any) => g.type === 'DOCX' || !g.type));
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchTlpeDetails();
      await fetchCurrentUser();
      await fetchGabarits();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiersId]);

  useEffect(() => {
    if (selectedYear) fetchTlpeConfig(selectedYear);
  }, [selectedYear, fetchTlpeConfig]);

  const refresh = async () => {
    await fetchTlpeDetails();
  };

  // --- Statut / flux dossier ---
  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await axios.patch(`/api/tlpe/${tiersId}/status`, { statut: newStatus, annee: selectedYear });
      await refresh();
    } catch (err) {
      alert('Erreur lors du changement de statut');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStepDates = (): Record<string, string | null> => {
    if (!currentOccupation) return {};
    return {
      dateINIT: currentOccupation.dateINIT ?? null,
      dateINST: currentOccupation.dateINST ?? null,
      datePREP: currentOccupation.datePREP ?? null,
      dateEN_COURS: currentOccupation.dateEN_COURS ?? null,
      dateVALIDE: currentOccupation.dateVALIDE ?? null,
      dateFACTURE: currentOccupation.dateFACTURE ?? null,
      dateTITRE: currentOccupation.dateTITRE ?? null,
      dateCLOS: currentOccupation.dateCLOS ?? null,
    };
  };

  // --- Montant (regle TLPE : prorata journalier + exoneration enseignes) ---
  const getTotalAmount = () => {
    if (!currentOccupation) return 0;
    const threshold = tlpeConfig?.exoneration ?? 12;
    const lignes = currentOccupation.lignes || [];

    const totalEnseigneSurface = lignes.reduce((sum: number, l: any) => {
      let meta: any = {};
      try { meta = JSON.parse(l.article?.notes || '{}'); } catch (e) {}
      if (meta.tlpeType === 'ENSEIGNE') return sum + (l.quantite1 || 0);
      return sum;
    }, 0);
    const isEnseigneExempt = totalEnseigneSurface <= threshold;

    return lignes.reduce((sum: number, l: any) => {
      let meta: any = {};
      try { meta = JSON.parse(l.article?.notes || '{}'); } catch (e) {}
      if (meta.tlpeType === 'ENSEIGNE' && isEnseigneExempt) return sum;

      const d1 = new Date(l.dateDebut);
      const d2 = new Date(l.dateFin);
      const year = selectedYear || new Date().getFullYear();
      const daysInYear = isLeapYear(new Date(year, 0, 1)) ? 366 : 365;
      const daysActive = differenceInDays(d2, d1) + 1;
      const prorata = Math.min(1, Math.max(0, daysActive / daysInYear));
      return sum + ((l.montant || 0) * (l.quantite1 || 0) * prorata);
    }, 0);
  };

  // --- Reconduction ---
  // (voir TlpeRenewModal.tsx + POST /api/tlpe/[id]/renew)

  // --- Facturation ---
  const handleDownloadFacture = async () => {
    if (!currentOccupation) return;
    setIsGeneratingFacture(true);
    try {
      const res = await axios.get(`/api/facture-pdf/${currentOccupation.id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Facture-TLPE-${currentOccupation.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      await refresh();
    } catch (err) {
      alert('Erreur lors de la génération de la facture');
    } finally {
      setIsGeneratingFacture(false);
    }
  };

  // --- Dispositifs (lignes) ---
  const handleDeleteLigne = async (ligneId: number) => {
    if (!currentOccupation) return;
    if (!confirm('Retirer cet article ?')) return;
    try {
      await axios.delete(`/api/occupations/${currentOccupation.id}/lignes/${ligneId}`);
      await refresh();
    } catch (err) { alert('Erreur lors de la suppression'); }
  };

  // --- Contacts (rattaches au dossier de l'annee courante) ---
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOccupation) return;
    setIsSubmittingContact(true);
    try {
      await axios.post(`/api/occupations/${currentOccupation.id}/contacts`, newContact);
      setIsContactModalOpen(false);
      setNewContact({ nom: '', prenom: '', email: '', telephone: '', titre: '', entreprise: '', role: 'Contact principal', pjPath: '' });
      await refresh();
    } catch (err) { alert("Erreur lors de l'ajout du contact"); }
    finally { setIsSubmittingContact(false); }
  };

  const handleDeleteContact = async (contactId: number) => {
    if (!currentOccupation) return;
    if (!confirm('Supprimer ce contact ?')) return;
    try {
      await axios.delete(`/api/occupations/${currentOccupation.id}/contacts/${contactId}`);
      await refresh();
    } catch (err) { alert('Erreur lors de la suppression'); }
  };

  // --- Photos (dossier) ---
  const handleUploadPhoto = async (file: File) => {
    if (!currentOccupation) return;
    setIsUploadingPhoto(true);
    try {
      const resizedBlob = await resizeImage(file);
      const fd = new FormData();
      fd.append('file', resizedBlob, file.name);
      const res = await axios.post('/api/upload', fd);
      const currentPhotos = currentOccupation.photos ? currentOccupation.photos.split(',').filter(Boolean) : [];
      const updatedPhotos = [...currentPhotos, res.data.url].join(',');
      await axios.patch(`/api/occupations/${currentOccupation.id}`, { photos: updatedPhotos });
      await refresh();
    } catch (err) {
      alert("Erreur lors de l'envoi de la photo");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (index: number) => {
    if (!currentOccupation) return;
    if (!confirm('Supprimer cette photo ?')) return;
    try {
      const currentPhotos = currentOccupation.photos ? currentOccupation.photos.split(',').filter(Boolean) : [];
      const updatedPhotos = currentPhotos.filter((_: string, i: number) => i !== index).join(',');
      await axios.patch(`/api/occupations/${currentOccupation.id}`, { photos: updatedPhotos });
      await refresh();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  // --- Annee ---
  const handleDeleteYear = async (year: number) => {
    if (!confirm(`Supprimer definitivement le dossier TLPE ${year} ?`)) return;
    try {
      await axios.delete(`/api/tlpe/${tiersId}/year/${year}`);
      if (selectedYear === year) setSelectedYear(null);
      await refresh();
    } catch (err) { alert('Erreur lors de la suppression'); }
  };

  return {
    tiersId,
    tiers,
    occupations,
    years,
    selectedYear,
    setSelectedYear,
    currentOccupation,
    loading,
    tlpeConfig,
    currentUser,
    aotGabarits,
    isUpdatingStatus,
    handleStatusChange,
    getStepDates,
    getTotalAmount,
    isRenewModalOpen,
    setIsRenewModalOpen,
    isGeneratingFacture,
    handleDownloadFacture,
    isLigneModalOpen,
    setIsLigneModalOpen,
    editingLigne,
    setEditingLigne,
    handleDeleteLigne,
    isContactModalOpen,
    setIsContactModalOpen,
    isSubmittingContact,
    newContact,
    setNewContact,
    handleAddContact,
    handleDeleteContact,
    isUploadingPhoto,
    handleUploadPhoto,
    handleDeletePhoto,
    handleDeleteYear,
    refresh,
  };
}
