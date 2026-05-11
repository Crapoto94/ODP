import { useState, useEffect, use } from 'react';
import axios from 'axios';

export interface Contact {
  id: number;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  titre?: string;
  entreprise?: string;
  role: string;
  pjPath?: string;
}

export function useCommerceLogic(paramId: string) {
  const [commerce, setCommerce] = useState<any>(null);
  const [dispositifsByYear, setDisposifsByYear] = useState<any>({});
  const [years, setYears] = useState<number[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [occupations, setOccupations] = useState<any[]>([]);
  const [editingLigne, setEditingLigne] = useState<any>(null);
  const [isLigneModalOpen, setIsLigneModalOpen] = useState(false);

  // Contact Management State
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    titre: '',
    entreprise: '',
    role: 'CONTACT_DIRECT',
    pjPath: ''
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [noteKey, setNoteKey] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // AOT State
  const [aotGabarits, setAotGabarits] = useState<any[]>([]);
  const [isGeneratingAot, setIsGeneratingAot] = useState(false);
  const [isAotFinalModalOpen, setIsAotFinalModalOpen] = useState(false);
  const [isUploadingAotFinal, setIsUploadingAotFinal] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  // Facture State
  const [isGeneratingFacture, setIsGeneratingFacture] = useState(false);
  const [isSendingAot, setIsSendingAot] = useState(false);
  const [aotSentMsg, setAotSentMsg] = useState<string | null>(null);

  // Renew State
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);

  // Tiers for billing selection
  const [allTiers, setAllTiers] = useState<any[]>([]);

  const fetchCommerceDetails = async () => {
    try {
      const res = await axios.get(`/api/commerces/${paramId}`);
      setCommerce(res.data.commerce);
      setDisposifsByYear(res.data.dispositifsByYear);
      setYears(res.data.years);
      setTimeline(res.data.timeline || []);
      setChartData(res.data.chartData || []);
      if (res.data.years.length > 0 && !selectedYear) {
        setSelectedYear(res.data.years[0]);
      }
    } catch (err) {
      console.error('Failed to fetch commerce details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOccupations = async (year: number) => {
    try {
      const res = await axios.get('/api/occupations', {
        params: {
          type: 'COMMERCE',
          anneeTaxation: year,
          tiersId: paramId
        }
      });
      setOccupations(res.data || []);
    } catch (err) {
      console.error('Failed to fetch occupations:', err);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    // Validation : Passage à l'instruction nécessite au moins un document
    if (newStatus === 'INSTRUCTION' && documents.length === 0) {
      alert('Impossible de passer à l\'étape Instruction : une demande (document joint) est obligatoire.');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await axios.patch(`/api/commerces/${paramId}/status`, {
        statut: newStatus,
        annee: selectedYear
      });
      if (selectedYear) {
        await fetchOccupations(selectedYear);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await axios.get(`/api/commerces/${paramId}/contacts`);
      setContacts(res.data);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`/api/commerces/${paramId}/notes`);
      const docsFromNotes = (res.data || [])
        .filter((note: any) => note.pjPath && note.pjName)
        .map((note: any) => ({
          id: note.id,
          description: note.content,
          name: note.pjName,
          path: note.pjPath,
          created_at: note.created_at
        }));
      setDocuments(docsFromNotes);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setCurrentUser(res.data);
    } catch (e) {}
  };

  const fetchGabarits = async () => {
    try {
      const res = await axios.get('/api/gabarits');
      const allGabarits = Array.isArray(res.data) ? res.data : res.data.gabarits || [];
      const aotGabaritsList = allGabarits.filter((g: any) => g.type === 'DOCX' || !g.type);
      setAotGabarits(aotGabaritsList);
    } catch (err) {
      console.error('Error fetching gabarits:', err);
    }
  };
  
  const fetchAllTiers = async () => {
    try {
      const res = await axios.get('/api/tiers');
      setAllTiers(res.data || []);
    } catch (err) {
      console.error('Error fetching tiers:', err);
    }
  };

  useEffect(() => {
    if (paramId) {
      fetchCommerceDetails();
      fetchContacts();
      fetchDocuments();
      fetchCurrentUser();
      fetchGabarits();
      fetchAllTiers();
    }
  }, [paramId]);

  useEffect(() => {
    if (selectedYear) {
      fetchOccupations(selectedYear);
    }
  }, [selectedYear]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    try {
      if (editingContactId) {
        await axios.patch(`/api/commerces/${paramId}/contacts/${editingContactId}`, newContact);
      } else {
        await axios.post(`/api/commerces/${paramId}/contacts`, newContact);
      }
      await fetchContacts();
      setIsContactModalOpen(false);
      setEditingContactId(null);
      setNewContact({ nom: '', prenom: '', email: '', telephone: '', titre: '', entreprise: '', role: 'CONTACT_DIRECT', pjPath: '' });
    } catch (err) {
      console.error('Failed to save contact:', err);
      alert('Erreur lors de l\'enregistrement du contact');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleOpenEditContact = (contact: Contact) => {
    setEditingContactId(contact.id);
    setNewContact(contact);
    setIsContactModalOpen(true);
  };

  const handleDeleteContact = async (id: number) => {
    if (!confirm('Supprimer ce contact?')) return;
    try {
      await axios.delete(`/api/commerces/${paramId}/contacts/${id}`);
      await fetchContacts();
    } catch (err) {
      console.error('Failed to delete contact:', err);
      alert('Erreur lors de la suppression du contact');
    }
  };

  const handlePhotoContact = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post('/api/upload', formData);
      setNewContact({ ...newContact, pjPath: res.data.url });
    } catch (err) {
      alert('Erreur lors de l\'upload de la photo');
    }
  };

  const handleUploadDocument = async (docName: string, file: File) => {
    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post('/api/upload', formData);
      await axios.post(`/api/commerces/${paramId}/notes`, {
        content: docName,
        pjPath: res.data.url,
        pjName: file.name,
        isEmail: false
      });
      await fetchDocuments();
      setIsDocModalOpen(false);
    } catch (err) {
      console.error('Failed to upload document:', err);
      alert('Erreur lors de l\'ajout du document');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Supprimer ce document ?')) return;
    try {
      await axios.delete(`/api/commerces/${paramId}/notes/${docId}`);
      await fetchDocuments();
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Erreur lors de la suppression du document');
    }
  };

  // AOT Handlers
  const handleSetAotGabarit = async (occupationId: number, gabaritId: number | null) => {
    try {
      await axios.patch(`/api/occupations/${occupationId}`, { aotGabaritId: gabaritId });
      if (selectedYear) fetchOccupations(selectedYear);
    } catch (err) {
      alert("Erreur lors de la sélection du gabarit");
    }
  };

  const handleDownloadAot = async (occupationId: number) => {
    setIsGeneratingAot(true);
    try {
      const res = await axios.get(`/api/aot-docx-generate/${occupationId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AOT-Commerce-${occupationId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération de l\'AOT');
    } finally {
      setIsGeneratingAot(false);
    }
  };

  const handleUploadAotFinal = async (occupationId: number, file: File, isSigned: boolean) => {
    setIsUploadingAotFinal(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post('/api/upload', fd);
      const aotUrl = res.data.url;

      await axios.patch(`/api/occupations/${occupationId}`, {
        aotFinalPath: aotUrl,
        aotSigned: isSigned,
        ...(isSigned ? { statut: 'EN_COURS' } : {}),
      });
      if (selectedYear) fetchOccupations(selectedYear);
      setIsAotFinalModalOpen(false);
    } catch (err) {
      console.error('[Upload AOT Final] Error:', err);
      alert("Erreur lors de l'envoi de l'AOT final");
    } finally {
      setIsUploadingAotFinal(false);
    }
  };

  const handleSendAot = async (occupationId: number) => {
    setIsSendingAot(true);
    setAotSentMsg(null);
    try {
      const res = await axios.post(`/api/occupations/${occupationId}/send-aot`);
      setAotSentMsg(`AOT envoyé à : ${res.data.sent?.join(', ') || 'Contact principal'}`);
      setTimeout(() => setAotSentMsg(null), 5000);
    } catch (e: any) {
      const errorMsg = e.response?.data?.error || e.message || 'Erreur inconnue';
      console.error('[handleSendAot] Error:', errorMsg, e.response?.data?.details);
      setAotSentMsg(`Erreur lors de l'envoi de l'AOT: ${errorMsg}`);
      setTimeout(() => setAotSentMsg(null), 5000);
    } finally {
      setIsSendingAot(false);
    }
  };

  // Facture Handlers
  const handleDownloadFacture = async () => {
    setIsGeneratingFacture(true);
    try {
      const res = await axios.get(`/api/commerces/${paramId}/facture-pdf?annee=${selectedYear}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Facture-Commerce-${paramId}-${selectedYear}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      if (selectedYear) fetchOccupations(selectedYear); // Rafraîchir pour mettre à jour le statut
    } catch (err: any) {
      console.error(err);
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const json = JSON.parse(text);
          alert(`Erreur lors de la génération de la facture: ${json.error}`);
        } catch {
          alert('Erreur lors de la génération de la facture');
        }
      } else {
        alert('Erreur lors de la génération de la facture');
      }
    } finally {
      setIsGeneratingFacture(false);
    }
  };

  const handleUpdateAgissantPour = async (occupationId: number, agissantPourId: string) => {
    try {
      await axios.patch(`/api/occupations/${occupationId}`, { agissantPour: agissantPourId });
      if (selectedYear) fetchOccupations(selectedYear);
    } catch (err) {
      console.error('Error updating agissantPour:', err);
      alert('Erreur lors de la mise à jour du tiers de facturation');
    }
  };

  const handleUpdateOccupationAddress = async (occupationId: number, newAddress: string) => {
    try {
      await axios.patch(`/api/occupations/${occupationId}`, { adresse: newAddress });
      if (selectedYear) fetchOccupations(selectedYear);
    } catch (err) {
      console.error('Error updating occupation address:', err);
      alert('Erreur lors de la mise à jour de l\'adresse');
    }
  };

  const handleUpdateObservations = async (newObs: string) => {
    try {
      await axios.patch(`/api/commerces/${paramId}`, { observations: newObs });
      setCommerce((prev: any) => ({ ...prev, observations: newObs }));
    } catch (err) {
      console.error('Error updating observations:', err);
      throw err;
    }
  };

  const handleUpdatePhoto = async (photoUrl: string) => {
    try {
      await axios.patch(`/api/commerces/${paramId}`, { photo: photoUrl });
      setCommerce((prev: any) => ({ ...prev, photo: photoUrl }));
    } catch (err) {
      console.error('Error updating photo:', err);
      throw err;
    }
  };

  const handleDeleteYear = async (year: number) => {
    if (!confirm(`Supprimer toute l'année ${year} et ses dispositifs ? Cette action est irréversible.`)) return;
    try {
      await axios.delete(`/api/commerces/${paramId}/year/${year}`);
      await fetchCommerceDetails();
      if (selectedYear === year) {
        setSelectedYear(years.find(y => y !== year) || null);
      }
    } catch (err) {
      console.error('Error deleting year:', err);
      alert('Erreur lors de la suppression de l\'année');
    }
  };

  const getTotalAmountForYear = (year: number) => {
    let total = 0;
    occupations.forEach((occ: any) => {
      (occ.lignes || []).filter((ligne: any) => !ligne.deletedAt).forEach((ligne: any) => {
        total += ligne.quantite1 * (ligne.article?.montant || 0);
      });
    });
    return total;
  };

  const getStepperState = () => {
    const totalAmount = occupations.reduce((sum: number, occ: any) => {
      const occAmount = (occ.lignes || []).filter((l: any) => !l.deletedAt).reduce((s: number, l: any) => s + (l.quantite1 * (l.article?.montant || 0)), 0);
      return sum + occAmount;
    }, 0);

    let currentStatus = 'EN_ATTENTE';
    if (occupations.length > 0) {
      occupations.forEach((occ: any) => {
        const status = occ.statut || 'EN_ATTENTE';
        const statusPriority: Record<string, number> = {
          'EN_ATTENTE': 0,
          'INITIALISATION': 0,
          'INST': 1,
          'INSTRUCTION': 1,
          'PREP': 2,
          'PREPARATION_AOT': 2,
          'EN_COURS': 3,
          'VALIDE': 4,
          'VALIDÉ': 4,
          'VERIFIE': 4,
          'FACTURE': 5,
          'FACTURÉ': 5,
          'TITRE': 6,
          'TITRÉ': 6,
          'CLOS': 7,
          'PAYÉ': 7,
          'PAYE': 7
        };

        const currentPriority = statusPriority[currentStatus] ?? 0;
        const occPriority = statusPriority[status] ?? 0;

        if (occPriority > currentPriority) {
          currentStatus = status;
        }
      });
    }

    return { totalAmount, currentStatus };
  };

  const getStepDates = (): Record<string, string | null> => {
    const dates: Record<string, string | null> = {
      dateINIT: null,
      dateINST: null,
      datePREP: null,
      dateEN_COURS: null,
      dateVALIDE: null,
      dateFACTURE: null,
      dateTITRE: null,
      dateCLOS: null
    };

    if (occupations.length > 0) {
      const occ = occupations[0];
      dates.dateINIT = occ.dateINIT || null;
      dates.dateINST = occ.dateINST || null;
      dates.datePREP = occ.datePREP || null;
      dates.dateEN_COURS = occ.dateEN_COURS || null;
      dates.dateVALIDE = occ.dateVALIDE || null;
      dates.dateFACTURE = occ.dateFACTURE || null;
      dates.dateTITRE = occ.dateTITRE || null;
      dates.dateCLOS = occ.dateCLOS || null;
    }

    return dates;
  };

  const getDispositivesTimeline = () => {
    const result: Record<number, any[]> = {};
    const sortedYears = [...years].sort((a, b) => a - b);

    sortedYears.forEach((year) => {
      const currentDispos = dispositifsByYear[year] || [];
      
      const timelineItems = currentDispos.map((d: any) => {
        const d1 = d.dateDebut ? new Date(d.dateDebut) : null;
        const d2 = d.dateFin ? new Date(d.dateFin) : null;
        
        let status = 'nouveau';
        if (d1 && d2) {
          const isJan1 = d1.getMonth() === 0 && d1.getDate() === 1;
          const isDec31 = d2.getMonth() === 11 && d2.getDate() === 31;
          
          if (isJan1 && isDec31) status = 'reconduit';
          else if (!isJan1 && isDec31) status = 'nouveau';
          else if (isJan1 && !isDec31) status = 'supprimé';
        }

        return {
          ...d,
          montant: d.count * (d.montant || 0),
          status: status
        };
      });

      result[year] = timelineItems;
    });

    return result;
  };

  return {
    commerce,
    dispositifsByYear,
    years,
    timeline,
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
    // AOT
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
    handleUpdatePhoto,
    handleDeleteYear
  };
}
