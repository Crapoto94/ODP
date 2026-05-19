"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import {
  FileText,
  Plus,
  Search,
  MapPin,
  Calendar,
  Euro,
  ChevronRight,
  Filter,
  Loader2,
  X,
  CheckCircle2,
  Info,
  Maximize2,
  Clock,
  Upload,
  ImageIcon,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Package,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Download,
  Users,
  Unlock,
  Lock,
  LockOpen,
  AlertTriangle,
  Archive,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import LigneArticleModal from '@/components/LigneArticleModal';
import FilienGenerationModal from '@/components/FilienGenerationModal';
import OdpDocsBanner from '@/components/OdpDocsBanner';
import ContactModal from '@/components/ContactModal';
import { getStatusConfig, getAvailableStatuses } from '@/lib/status-utils';
import { isAlertActive, getAlertConfig } from '@/lib/alert-utils';
import { useLockedYear } from './hooks/useLockedYear';
import { isMixedOccupation, getOccupationTypes } from '@/lib/mixed-occupation-utils';

interface Occupation {
  id: number;
  nom: string | null;
  tiersId: number;
  tiers: { nom: string; code_sedit: string | null; etatAdministratif?: string };
  type: string;
  statut: string;
  dateDebut: string | null;
  dateFin: string | null;
  dateAlerte?: string | null;
  anneeTaxation: number | null;
  adresse: string;
  description: string | null;
  montantCalcule: number;
  photos: string | null;
  created_at: string;
  isCourtMetrage?: boolean;
  isExempt?: boolean;
  isNotAuthorized?: boolean;
  lignes?: any[];
  _count?: { notes: number };
  agissantPour?: string | null;
}

interface Tiers {
  id: number;
  nom: string;
  adresse?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  statut?: string;
  contacts?: Array<{ role: string }>;
}

// Local STATUS_MAP removed in favor of dynamic mapping from @/lib/status-utils

const TYPE_MAP: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  'TLPE': { label: 'TLPE', icon: Euro, color: 'text-purple-600', bg: 'bg-purple-50' },
  'COMMERCE': { label: 'Commerce', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
  'CHANTIER': { label: 'Chantier', icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'TOURNAGE': { label: 'Tournage', icon: Info, color: 'text-amber-600', bg: 'bg-amber-50' },
};

function OccupationsPageContent() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [tiers, setTiers] = useState<Tiers[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingTiers, setFetchingTiers] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [addressQuery, setAddressQuery] = useState('');
  const [addressResults, setAddressResults] = useState<any[]>([]);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL'); // Default to ALL years to show all dossiers
  const [alertFilter, setAlertFilter] = useState(false);
  const [view, setView] = useState<'ACTIVE' | 'ARCHIVE'>('ACTIVE');
  const { lockedYear, setLockedYear, isHydrated } = useLockedYear(); // Year locked for the session (persists across pages)
  const [tiersFilter, setTiersFilter] = useState<string | null>(null);
  const [tiersSearchQuery, setTiersSearchQuery] = useState('');
  const [isTiersDropdownOpen, setIsTiersDropdownOpen] = useState(false);
  const [agissantPourSearchQuery, setAgissantPourSearchQuery] = useState('');
  const [isAgissantPourDropdownOpen, setIsAgissantPourDropdownOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [isLigneModalOpen, setIsLigneModalOpen] = useState(false);
  const [selectedOccForLigne, setSelectedOccForLigne] = useState<Occupation | null>(null);
  const [editingLigne, setEditingLigne] = useState<any>(null);
  const [isFilienModalOpen, setIsFilienModalOpen] = useState(false);
  const [odpConfig, setOdpConfig] = useState<any>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactModalFor, setContactModalFor] = useState<'demandeur' | 'agissantPour' | null>(null);
  const [newContact, setNewContact] = useState<any>({ prenom: '', nom: '', email: '', telephone: '', titre: '', role: 'CONTACT_PRINCIPAL', pjPath: '' });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // État pour la modal d'avertissement du tiers
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [warningTierName, setWarningTierName] = useState('');
  const [warningOccupationId, setWarningOccupationId] = useState<number | null>(null);
  const [warningAction, setWarningAction] = useState<() => void>(() => {});

  const router = useRouter();

  const [formData, setFormData] = useState({
    id: null as number | null,
    nom: '',
    tiersId: '',
    type: 'CHANTIER',
    anneeTaxation: new Date().getFullYear().toString(),
    dateDebut: '',
    dateFin: '',
    dateAlerte: '',
    adresse: '',
    latitude: '',
    longitude: '',
    description: '',
    statut: 'EN_ATTENTE',
    isCourtMetrage: false,
    isExempt: false,
    isNotAuthorized: false,
    agissantPour: '',
    agissantPourId: '', // ID du tiers "Agissant pour le compte de"
    isAgissantPourBillable: false
  });

  const isEditing = !!formData.id;

  const fetchTiers = async () => {
    setFetchingTiers(true);
    try {
      const res = await axios.get('/api/tiers');
      setTiers(res.data);
    } catch (err) {
      console.error('Failed to fetch tiers:', err);
    } finally {
      setFetchingTiers(false);
    }
  };

  const fetchOccupations = async () => {
    setLoading(true);
    try {
      console.log('[Occupations] 🔄 Fetching from /api/occupations...');
      const res = await axios.get(`/api/occupations?view=${view}`);
      console.log('[Occupations] ✅ Success! Received data:', res.data);
      console.log('[Occupations] ✅ Count:', Array.isArray(res.data) ? res.data.length : 'Not an array');

      const data = Array.isArray(res.data) ? res.data : [];
      console.log('[Occupations] ✅ Setting', data.length, 'occupations to state');
      setOccupations(data);
    } catch (err: any) {
      console.error('[Occupations] ❌ Failed to fetch occupations');
      console.error('[Occupations] ❌ Error:', err.message);
      console.error('[Occupations] ❌ Response status:', err.response?.status);
      console.error('[Occupations] ❌ Response data:', err.response?.data);
      setOccupations([]);
    } finally {
      setLoading(false);
    }
  };

  const searchParams = useSearchParams();

  useEffect(() => {
    const tid = searchParams.get('tiersId');
    if (tid) {
      setTiersFilter(tid);
      // setYearFilter('ALL'); // Remove this to preserve the selected year filter
    }
  }, [searchParams]);

  useEffect(() => {
    console.log('[Occupations] 🚀 Component mounted, loading data...');
    axios.get('/api/auth/me').then(res => setCurrentUser(res.data)).catch(() => {});
    fetchTiers();
    fetchOccupations();
  }, []);

  useEffect(() => {
    fetchOccupations();
  }, [view]);

  // When locked year changes, update yearFilter to match
  useEffect(() => {
    if (isHydrated && lockedYear && lockedYear !== 'ALL') {
      setYearFilter(lockedYear);
    }
  }, [lockedYear, isHydrated]);

  useEffect(() => {
    if (yearFilter && yearFilter !== 'ALL') {
      axios.get(`/api/settings/odp-docs?annee=${yearFilter}`)
        .then(res => setOdpConfig(res.data.config))
        .catch(() => setOdpConfig(null));
    } else {
      setOdpConfig(null);
    }
  }, [yearFilter]);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && occupations.length > 0) {
      const found = occupations.find(o => o.id === parseInt(editId));
      if (found) handleEdit(found);
    }
  }, [searchParams, occupations]);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type && (type === 'COMMERCE' || type === 'TLPE' || type === 'CHANTIER' || type === 'TOURNAGE')) {
      resetForm(type);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axios.post('/api/upload', fd);
      setUploadedPhotos(prev => [...prev, res.data.url]);
    } catch (err) {
      alert('Erreur lors de l\'upload de la photo');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (addressQuery.length > 3) {
        try {
          const res = await axios.get(`/api/geocoding?q=${addressQuery}`);
          setAddressResults(res.data);
        } catch (e) {}
      } else {
        setAddressResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [addressQuery]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tiersId) {
      alert("Veuillez sélectionner un tiers");
      return;
    }
    setSubmitting(true);
    try {
      let finalLat = formData.latitude;
      let finalLng = formData.longitude;

      // If address exists and coordinates are missing or might be stale, 
      // do a quick final geocode search to ensure Street View link will work
      if (formData.adresse && (!finalLat || !finalLng)) {
        try {
          const geoRes = await axios.get(`/api/geocoding?q=${formData.adresse}`);
          if (geoRes.data && geoRes.data.length > 0) {
            const topMatch = geoRes.data[0];
            finalLat = topMatch.latitude.toString();
            finalLng = topMatch.longitude.toString();
          }
        } catch (e) {
          console.error("Geocoding failed on submit", e);
        }
      }

      const payload = {
        ...formData,
        latitude: finalLat,
        longitude: finalLng,
        photos: uploadedPhotos.join(','),
        // Send only the ID for agissantPour, not the name
        agissantPour: formData.agissantPourId || '',
        // Ensure boolean flags are included
        isCourtMetrage: formData.isCourtMetrage,
        isExempt: formData.isExempt,
        isNotAuthorized: formData.isNotAuthorized
      };
      console.log('[handleSaveOccupation] Payload with flags:', { isCourtMetrage: payload.isCourtMetrage, isExempt: payload.isExempt, isNotAuthorized: payload.isNotAuthorized });
      if (isEditing) {
        await axios.patch(`/api/occupations/${formData.id}`, payload);
      } else {
        await axios.post('/api/occupations', payload);
      }
      setIsModalOpen(false);
      resetForm();
      fetchOccupations();

      // If editing from the detail page (?edit=ID), redirect to the detail page to see updates
      const editId = searchParams.get('edit');
      if (editId && isEditing) {
        // Navigate to the detail page
        router.push(`/dashboard/occupations/${formData.id}`);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de l\'enregistrement du dossier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, nom: string) => {
    if (currentUser?.role !== 'ADMIN') {
      alert('Seul un administrateur peut supprimer un dossier');
      return;
    }
    if (!confirm(`Supprimer le dossier "${nom || id}" ?`)) return;
    try {
      await axios.delete(`/api/occupations/${id}`);
      fetchOccupations();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactModalFor) return;

    setIsSubmittingContact(true);
    try {
      const tiersIdStr = contactModalFor === 'demandeur' ? formData.tiersId : formData.agissantPourId;
      const tiersId = Number(tiersIdStr);

      if (!tiersIdStr || isNaN(tiersId)) {
        alert('Entité non sélectionnée');
        return;
      }

      await axios.post(`/api/tiers/${tiersId}/contacts`, {
        nom: newContact.nom,
        prenom: newContact.prenom,
        email: newContact.email,
        telephone: newContact.telephone,
        titre: newContact.titre,
        role: 'Contact principal'
      });

      setIsContactModalOpen(false);
      setNewContact({ prenom: '', nom: '', email: '', telephone: '', titre: '', role: 'CONTACT_PRINCIPAL', pjPath: '' });
      setContactModalFor(null);
      await fetchTiers();
      alert('Contact créé avec succès');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de la création du contact');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handlePhotoContact = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Photo upload not implemented for simple contact creation
  };

  const openContactModal = (type: 'demandeur' | 'agissantPour') => {
    setContactModalFor(type);
    setNewContact({ prenom: '', nom: '', email: '', telephone: '', titre: '', role: 'CONTACT_PRINCIPAL', pjPath: '' });
    setIsContactModalOpen(true);
  };

  const handleEdit = (occ: Occupation) => {
    if ((occ as any).isArchived) {
      alert('Ce dossier est archivé et ne peut pas être modifié');
      return;
    }
    // Parse agissantPour as ID if it exists (stored as string ID)
    const agissantPourId = occ.agissantPour || '';
    const agissantPourTiers = agissantPourId ? tiers.find(t => t.id === Number(agissantPourId)) : null;

    setFormData({
      id: occ.id,
      nom: occ.nom || '',
      tiersId: occ.tiersId.toString(),
      type: occ.type,
      anneeTaxation: occ.anneeTaxation ? occ.anneeTaxation.toString() : new Date().getFullYear().toString(),
      dateDebut: occ.dateDebut ? format(new Date(occ.dateDebut), 'yyyy-MM-dd') : '',
      dateFin: occ.dateFin ? format(new Date(occ.dateFin), 'yyyy-MM-dd') : '',
      dateAlerte: (occ as any).dateAlerte ? format(new Date((occ as any).dateAlerte), 'yyyy-MM-dd') : '',
      adresse: occ.adresse,
      latitude: '',
      longitude: '',
      description: occ.description || '',
      statut: occ.statut,
      isCourtMetrage: !!occ.isCourtMetrage,
      isExempt: !!(occ as any).isExempt,
      isNotAuthorized: !!(occ as any).isNotAuthorized,
      agissantPour: agissantPourTiers?.nom || '',
      agissantPourId: agissantPourId,
      isAgissantPourBillable: (occ as any).isAgissantPourBillable || false
    });
    setAddressQuery(occ.adresse);
    setUploadedPhotos(occ.photos ? occ.photos.split(',') : []);
    setIsModalOpen(true);
  };

  const resetForm = (defaultType = 'CHANTIER') => {
    setFormData({
      id: null,
      nom: '',
      tiersId: '',
      type: defaultType,
      anneeTaxation: lockedYear || (yearFilter !== 'ALL' ? yearFilter : new Date().getFullYear().toString()),
      dateDebut: '',
      dateFin: '',
      dateAlerte: '',
      adresse: '',
      latitude: '',
      longitude: '',
      description: '',
      statut: 'EN_ATTENTE',
      isCourtMetrage: false,
      isExempt: false,
      isNotAuthorized: false,
      agissantPour: '',
      agissantPourId: '',
      isAgissantPourBillable: false
    });
    setAddressQuery('');
    setAgissantPourSearchQuery('');
    setUploadedPhotos([]);
  };

  const handleFetchTiersAddress = () => {
    if (!formData.tiersId) {
      alert("Veuillez d'abord sélectionner un tiers");
      return;
    }
    const selectedTier = tiers.find(t => t.id === Number(formData.tiersId));
    if (selectedTier && selectedTier.adresse) {
      setFormData({
        ...formData,
        adresse: selectedTier.adresse,
        latitude: selectedTier.latitude?.toString() || '',
        longitude: selectedTier.longitude?.toString() || ''
      });
      setAddressQuery(selectedTier.adresse);
    } else {
      alert("Ce tiers n'a pas d'adresse renseignée");
    }
  };

  const handleTierChange = (tierIdStr: string) => {
    const selectedTier = tiers.find(t => t.id === Number(tierIdStr));
    const newNom = (formData.type === 'COMMERCE' && selectedTier) ? selectedTier.nom : formData.nom;
    setFormData({ ...formData, tiersId: tierIdStr, nom: newNom });
  };

  const handleApprove = async (id: number) => {
    if (!confirm('Passer ce dossier en statut "Vérifié" ?')) return;
    try {
      await axios.patch(`/api/occupations/${id}`, { statut: 'VERIFIE' });
      fetchOccupations();
    } catch (err) { alert('Erreur lors de la mise à jour du statut'); }
  };

  const handleArchive = async (id: number, nom: string) => {
    if (!confirm(`Archiver le dossier "${nom || id}" ?`)) return;
    try {
      await axios.patch(`/api/occupations/${id}`, { isArchived: true });
      fetchOccupations();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de l\'archivage');
    }
  };

  const handleUnarchive = async (id: number, nom: string) => {
    if (!confirm(`Restaurer le dossier "${nom || id}" ?`)) return;
    try {
      await axios.patch(`/api/occupations/${id}/unarchive`);
      fetchOccupations();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de la restauration');
    }
  };

  const downloadFacture = async (id: number) => {
    try {
      let tiersId: number | null = null;

      // Try to find occupation in local state first
      const occupation = occupations.find(o => o.id === id);
      if (occupation && (occupation as any).tiers?.id) {
        tiersId = (occupation as any).tiers.id;
      } else {
        // If not found locally, fetch from API
        try {
          const occRes = await axios.get(`/api/occupations/${id}`);
          const occ = occRes.data;
          if (occ && (occ as any).tiers?.id) {
            tiersId = (occ as any).tiers.id;
          }
        } catch (err) {
          console.error('Could not fetch occupation data:', err);
        }
      }

      // If still no tiersId, proceed without verification
      if (!tiersId) {
        window.location.href = `/api/facture-pdf/${id}`;
        return;
      }

      // Verify the tiers status
      try {
        await axios.post(`/api/admin/verify-tiers/${tiersId}`);
        const tiersRes = await axios.get(`/api/tiers/${tiersId}`);
        const tier = tiersRes.data;

        if (tier && (tier.etatAdministratif === 'Fermée' || tier.etatAdministratif === 'Cessée')) {
          setWarningTierName(tier.nom);
          setWarningMessage(`Le redevable est fermé ou cessé d'activité. Voulez-vous continuer la génération de facture ?`);
          setWarningOccupationId(id);
          setWarningAction(() => () => {
            window.location.href = `/api/facture-pdf/${id}`;
          });
          setIsWarningModalOpen(true);
          return;
        }
      } catch (err) {
        setWarningTierName('État du redevable');
        setWarningMessage('Impossible de vérifier l\'état du redevable. Voulez-vous continuer la génération de facture ?');
        setWarningOccupationId(id);
        setWarningAction(() => () => {
          window.location.href = `/api/facture-pdf/${id}`;
        });
        setIsWarningModalOpen(true);
        return;
      }

      window.location.href = `/api/facture-pdf/${id}`;
    } catch (err) {
      console.error('Error in downloadFacture:', err);
      window.location.href = `/api/facture-pdf/${id}`;
    }
  };

  const handleUnlock = async (id: number) => {
    if (!confirm('Déverrouiller ce dossier ? Cela supprimera le numéro de facture associé et remettra le dossier en statut "Vérifié" pour permettre des modifications.')) return;
    try {
      await axios.patch(`/api/occupations/${id}`, {
        statut: 'VERIFIE',
        numeroFacture: null,
        facturePath: null
      });
      fetchOccupations();
    } catch (err) { alert('Erreur lors du déverrouillage'); }
  };

  const handleNextStep = async (id: number, currentStatut: string) => {
    // Définir les étapes suivantes selon le type et le statut
    const nextStatusMap: Record<string, string> = {
      'EN_ATTENTE': 'INIT',
      'INIT': 'INST',
      'INST': 'PREP',
      'PREP': 'EN_COURS',
      'EN_COURS': 'VALIDE',
    };

    const nextStatus = nextStatusMap[currentStatut];
    if (!nextStatus) return;

    try {
      // Check if this is an exempt occupation being set to VALIDE
      const occ = occupations.find(o => o.id === id);
      if (nextStatus === 'VALIDE' && (occ as any)?.isExempt) {
        // Show confirmation message and archive
        alert('Ce dossier est exonéré. Il sera directement archivé.');
        await axios.patch(`/api/occupations/${id}`, { statut: nextStatus, isArchived: true });
      } else {
        await axios.patch(`/api/occupations/${id}`, { statut: nextStatus });
      }
      fetchOccupations();
    } catch (err) { alert('Erreur lors du passage à l\'étape suivante'); }
  };

  const toggleRow = (id: number) => {
    setExpandedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
  };

  const handleDeleteLigne = async (occId: number, ligneId: number) => {
    if (!confirm("Retirer cet article ?")) return;
    try {
      await axios.delete(`/api/occupations/${occId}/lignes/${ligneId}`);
      // Refresh both
      fetchOccupations();
      // If detail modal is open, we need to update the data in it too
      // or re-fetch specifically that occupation if needed.
      // fetchOccupations() updates the list.
    } catch (err) {
      alert("Erreur lors de la suppression de la ligne");
    }
  };

  const handleShowDetail = (id: number) => {
    router.push(`/dashboard/occupations/${id}`);
  };

  const filtered = occupations.filter(o => {
    // Only show CHANTIER and TOURNAGE types
    if (o.type !== 'CHANTIER' && o.type !== 'TOURNAGE') return false;

    const matchesSearch = (o.tiers?.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.adresse.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || o.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || o.statut === statusFilter;
    const dossierAnnee = o.dateDebut ? new Date(o.dateDebut).getFullYear() : null;
    const matchesYear = yearFilter === 'ALL' || (dossierAnnee && dossierAnnee.toString() === yearFilter.toString());
    const matchesTiers = !tiersFilter || o.tiersId.toString() === tiersFilter;
    const matchesAlert = !alertFilter || isAlertActive(o.dateAlerte);
    return matchesSearch && matchesType && matchesStatus && matchesYear && matchesTiers && matchesAlert;
  });

  const availableYears = Array.from(new Set(
    occupations.map(o => (o.type === 'COMMERCE' || o.type === 'TLPE') ? o.anneeTaxation : (o.dateDebut ? new Date(o.dateDebut).getFullYear() : null))
      .filter(Boolean)
  )).sort((a, b) => (b as number) - (a as number));

  const totalsByType = occupations.reduce((acc, o) => {
    // Only count CHANTIER and TOURNAGE types
    if (o.type !== 'CHANTIER' && o.type !== 'TOURNAGE') return acc;

    const type = o.type;
    let amount = (o as any).isExempt ? 0 : (o.montantCalcule || 0);
    // Apply surcharge if occupation is not authorized (100% surcharge)
    // Note: montantCalcule already includes court métrage discount, so don't apply it again
    if ((o as any).isNotAuthorized) {
      // Add surcharge if occupation is not authorized (100% surcharge)
      amount = amount * 2;
    }

    if (!acc[type]) {
      acc[type] = { total: 0, enCours: 0, aFacturer: 0, facture: 0 };
    }
    acc[type].total += amount;

    if (['EN_COURS', 'EN_ATTENTE', 'TERMINE'].includes(o.statut)) {
      acc[type].enCours += amount;
    } else if (o.statut === 'VERIFIE' && !(o as any).isExempt) {
      acc[type].aFacturer += amount;
    } else if (['FACTURE', 'PAYE', 'INVOICED'].includes(o.statut)) {
      acc[type].facture += amount;
    }

    return acc;
  }, {} as Record<string, { total: number; enCours: number; aFacturer: number; facture: number }>);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dossiers</h2>
          <p className="text-slate-500 font-medium tracking-wide">Gestion des autorisations d'occupation du domaine public</p>
          <div className="flex gap-6 mt-4">
            <button
              onClick={() => setView('ACTIVE')}
              className={`text-sm font-black uppercase tracking-widest ${view === 'ACTIVE' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Actifs ({view === 'ACTIVE' ? occupations.filter(o => (o.type === 'CHANTIER' || o.type === 'TOURNAGE')).length : '...'})
            </button>
            <button
              onClick={() => setView('ARCHIVE')}
              className={`text-sm font-black uppercase tracking-widest ${view === 'ARCHIVE' ? 'text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Archivés ({view === 'ARCHIVE' ? occupations.filter(o => (o.type === 'CHANTIER' || o.type === 'TOURNAGE')).length : '...'})
            </button>
          </div>
        </div>
        <div className="flex items-center gap-6">
           {yearFilter && yearFilter !== 'ALL' && (
             <OdpDocsBanner 
               year={parseInt(yearFilter)} 
               config={odpConfig} 
               variant="compact" 
             />
           )}
           <div className="flex gap-4">
              <button 
                onClick={() => { fetchTiers(); fetchOccupations(); }}
                className="p-3.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                title="Actualiser"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => { resetForm(); setIsModalOpen(true); }}
                className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95"
              >
                <Plus size={18} />
                Nouveau Dossier
              </button>
              {currentUser?.role === 'ADMIN' && (
                <button
                  onClick={() => setIsFilienModalOpen(true)}
                  className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 transition-all active:scale-95 relative"
                >
                  <FileText size={18} />
                  GENERER FILIEN
                  <span className="ml-2 px-2 py-0.5 bg-slate-700 rounded-full text-xs font-bold">ADM</span>
                </button>
              )}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        {[
          { type: 'CHANTIER', label: 'Chantiers', icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { type: 'TOURNAGE', label: 'Tournages', icon: Info, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((cat) => (
          <button
            key={cat.type}
            onClick={() => setTypeFilter(typeFilter === cat.type ? 'ALL' : cat.type)}
            className={`p-6 rounded-2xl border transition-all text-left group ${
              typeFilter === cat.type
                ? 'bg-white border-blue-500 shadow-xl shadow-blue-500/10'
                : 'bg-white border-slate-200 hover:border-blue-200 shadow-sm shadow-slate-200/50'
            }`}
          >
            {/* Header: Icon left, Total amount right */}
            <div className="flex items-start justify-between mb-3">
              <div className={`p-3 rounded-xl ${cat.bg} ${cat.color}`}>
                <cat.icon size={20} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                  {(totalsByType[cat.type]?.total || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-base font-bold text-slate-400">€</span>
                </p>
              </div>
            </div>
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{cat.label}</h3>
            <div className="space-y-1.5 border-t border-slate-100 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">EN COURS</span>
                <span className="text-sm font-black text-slate-900">{(totalsByType[cat.type]?.enCours || 0).toLocaleString('fr-FR')}€</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">À FACTURER</span>
                <span className="text-sm font-black text-emerald-600">{(totalsByType[cat.type]?.aFacturer || 0).toLocaleString('fr-FR')}€</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">FACTURÉ</span>
                <span className="text-sm font-black text-amber-600">{(totalsByType[cat.type]?.facture || 0).toLocaleString('fr-FR')}€</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/10 gap-6">
          <div className="flex flex-col gap-2 flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher un tiers ou une adresse..." 
                className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-semibold text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {tiersFilter && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl w-fit">
                <Users size={14} className="text-blue-500" />
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">
                  Filtre : {tiers.find(t => t.id.toString() === tiersFilter)?.nom || 'Tiers'}
                </span>
                <button 
                  onClick={() => {
                    setTiersFilter(null);
                    router.push('/dashboard/occupations');
                  }}
                  className="p-1 hover:bg-blue-100 rounded-lg text-blue-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <select
                className="bg-transparent px-4 py-2.5 text-xs font-bold text-slate-500 outline-none focus:border-none transition-all"
                value={lockedYear || yearFilter}
                onChange={e => {
                  if (!lockedYear) {
                    setYearFilter(e.target.value);
                  }
                }}
                disabled={!!lockedYear}
              >
                <option value="ALL">Toutes les années</option>
                {availableYears.map(year => (
                  <option key={year} value={year?.toString()}>{year}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (lockedYear) {
                    setLockedYear(null);
                  } else if (yearFilter !== 'ALL') {
                    setLockedYear(yearFilter);
                  }
                }}
                disabled={yearFilter === 'ALL' && !lockedYear}
                className={`px-3 py-2.5 border-l border-slate-200 transition-all ${
                  lockedYear
                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    : yearFilter !== 'ALL'
                    ? 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                }`}
                title={lockedYear ? `Déverrouiller l'année ${lockedYear}` : 'Verrouiller cette année'}
              >
                {lockedYear ? <Lock size={16} /> : <LockOpen size={16} />}
              </button>
            </div>
            <select
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 outline-none focus:border-blue-500 transition-all"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tous les Statuts</option>
              {Object.entries(getAvailableStatuses(typeFilter)).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <button
              onClick={() => setAlertFilter(!alertFilter)}
              className={`px-4 py-2.5 rounded-xl border font-black text-xs uppercase tracking-widest transition-all ${
                alertFilter
                  ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title={alertFilter ? 'Afficher tous les dossiers' : 'Afficher seulement les dossiers en alerte'}
            >
              <span className="flex items-center gap-2">
                <AlertTriangle size={14} />
                Alertes
              </span>
            </button>
          </div>
        </div>

        <div className="p-4 overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Chargement des dossiers...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center font-bold text-slate-300 italic uppercase text-[10px] tracking-widest">
              Aucun dossier trouvé
            </div>
          ) : (
            <table className="w-full border-separate border-spacing-y-1">
              <thead>
                <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-left">
                  <th className="px-3 py-2">Nom Dossier</th>
                  <th className="px-3 py-2">Demandeur</th>
                  <th className="px-3 py-2">Période</th>
                  <th className="px-3 py-2">Compteurs</th>
                  <th className="px-3 py-2">Montant</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">PJ</th>
                  <th className="px-3 py-2">Statut</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((occ) => {
                  const alertConfig = getAlertConfig(occ.dateAlerte);
                  const borderColor = alertConfig.status === 'overdue' ? '#dc2626' : alertConfig.status === 'upcoming' ? '#f59e0b' : 'transparent';
                  const bgColor = alertConfig.status === 'overdue' ? '#fef2f2' : alertConfig.status === 'upcoming' ? '#fffbeb' : 'transparent';
                  return (
                    <React.Fragment key={occ.id}>
                      <tr className="group transition-all hover:bg-slate-50/50" style={{ borderLeftColor: borderColor, borderLeftWidth: alertConfig.status !== 'none' ? '6px' : '0px', backgroundColor: bgColor }}>
                      <td className="px-3 py-3 rounded-l-xl border-y border-l border-slate-100 bg-white group-hover:border-blue-200">
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleRow(occ.id)} className="p-0.5 hover:bg-slate-100 rounded text-slate-400">
                            {expandedRows.includes(occ.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <div className="cursor-pointer group/title" onClick={() => handleShowDetail(occ.id)}>
                            <p className="font-black text-slate-900 text-[11px] leading-tight mb-1 group-hover/title:text-blue-600 transition-colors uppercase flex items-center gap-1">
                               {occ.nom || `Dossier #${occ.id}`}
                               {alertConfig.status !== 'none' && (
                                 <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest whitespace-nowrap ${alertConfig.status === 'overdue' ? 'bg-rose-200 text-rose-700' : 'bg-amber-200 text-amber-700'}`}>
                                   <AlertTriangle size={9} />
                                   {alertConfig.status === 'overdue' ? 'Alerte' : 'Alerte'}
                                 </span>
                               )}
                               {(occ as any).isExempt && (
                                 <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest whitespace-nowrap bg-emerald-200 text-emerald-700" title="Exonéré de facturation">
                                   <DollarSign size={9} style={{ textDecoration: 'line-through' }} />
                                 </span>
                               )}
                               {(occ as any).isNotAuthorized && (
                                 <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest whitespace-nowrap bg-red-200 text-red-700" title="Non autorisé - Majoration 100%">
                                   <AlertCircle size={9} />
                                 </span>
                               )}
                               <ExternalLink size={11} className="opacity-0 group-hover/title:opacity-100 transition-opacity" />
                            </p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase truncate max-w-[120px]">{occ.adresse}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 border-y border-slate-100 bg-white group-hover:border-blue-200 font-bold text-blue-600 uppercase text-[10px]">
                         <div className="flex items-center gap-2">
                           <span className="truncate">{occ.tiers?.nom || 'Inconnu'}</span>
                           {occ.tiers?.etatAdministratif === 'Cessée' && (
                             <div className="flex items-center gap-0.5 bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border border-rose-200 whitespace-nowrap">
                               <AlertTriangle size={9} />
                               Fermé
                             </div>
                           )}
                         </div>
                      </td>
                      <td className="px-3 py-3 border-y border-slate-100 bg-white group-hover:border-blue-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                          <Clock size={12} />
                          {(occ.type === 'COMMERCE' || occ.type === 'TLPE') ? (occ.anneeTaxation || '-') : (
                            <>
                              {occ.dateDebut ? format(new Date(occ.dateDebut), 'dd MMM', { locale: fr }) : '-'} - {occ.dateFin ? format(new Date(occ.dateFin), 'dd MMM yyyy', { locale: fr }) : '-'}
                            </>
                          )}
                        </p>
                      </td>
                      <td className="px-3 py-3 border-y border-slate-100 bg-white group-hover:border-blue-200 text-[10px] font-black text-slate-600">
                         <div className="flex flex-col gap-0.5">
                           <div className="flex items-center gap-1">
                             <Package size={12} className="text-slate-300" /> {(occ.lignes?.filter((l: any) => !l.deletedAt) || []).length}
                           </div>
                           <div className="flex items-center gap-1">
                             <MessageSquare size={12} className={occ._count?.notes ? "text-blue-400" : "text-slate-200"} />
                             <span className={occ._count?.notes ? "text-blue-600" : "text-slate-300"}>{occ._count?.notes || 0}</span>
                           </div>
                         </div>
                      </td>
                      <td className="px-3 py-3 border-y border-slate-100 bg-white group-hover:border-blue-200 font-bold text-blue-600 uppercase text-[10px]">
                         {((() => {
                           let amount = (occ as any).isExempt ? 0 : (occ.montantCalcule || 0);
                           // Apply surcharge if occupation is not authorized (100% surcharge)
                           // Note: montantCalcule already includes court métrage discount, so don't apply it again
                           if ((occ as any).isNotAuthorized) {
                             // Add surcharge if occupation is not authorized (100% surcharge)
                             amount = amount * 2;
                           }
                           return amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                         })())} € <span className="text-[8px] text-slate-400">TTC</span>
                      </td>
                      <td className="px-3 py-3 border-y border-slate-100 bg-white group-hover:border-blue-200 text-[10px] font-black">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className={`px-2 py-1 rounded text-[9px] border uppercase tracking-widest ${TYPE_MAP[occ.type]?.bg || 'bg-slate-50'} ${TYPE_MAP[occ.type]?.color || 'text-slate-600'} ${TYPE_MAP[occ.type]?.bg.replace('bg-', 'border-') || 'border-slate-100'}`}>
                            {TYPE_MAP[occ.type]?.label || occ.type}
                          </span>
                          {isMixedOccupation(occ) && (
                            <>
                              <span className="text-slate-300 text-[8px]">+</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] border uppercase tracking-widest ${
                                occ.type === 'TLPE'
                                  ? 'bg-blue-50 text-blue-600 border-blue-100'
                                  : 'bg-purple-50 text-purple-600 border-purple-100'
                              }`}>
                                {occ.type === 'TLPE' ? 'Com' : 'TLP'}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 border-y border-slate-100 bg-white group-hover:border-blue-200 text-[10px] font-black text-slate-400">
                         <div className="flex items-center gap-1">
                           <ImageIcon size={12} className={occ.photos ? "text-blue-500" : "text-slate-200"} />
                           <span>{occ.photos ? occ.photos.split(',').filter(Boolean).length : 0}</span>
                         </div>
                      </td>
                      <td className="px-3 py-3 border-y border-slate-100 bg-white group-hover:border-blue-200 text-[9px] font-black uppercase">
                         <div className="flex items-center gap-1">
                           <div className={`w-2 h-2 rounded-full ${getStatusConfig(occ.type, occ.statut).color.replace('text', 'bg') || 'bg-slate-300'} shadow-sm`}></div>
                           <span className={`${getStatusConfig(occ.type, occ.statut).color || 'text-slate-400'} truncate text-[8px]`}>
                             {getStatusConfig(occ.type, occ.statut).label || occ.statut}
                           </span>
                         </div>
                         {(occ as any).facturePath && (
                           <a href={(occ as any).facturePath} target="_blank" className="flex items-center gap-1 mt-1 text-[7px] text-blue-500 hover:underline">
                             <FileText size={9} /> Facture
                           </a>
                         )}
                      </td>
                      <td className="px-3 py-3 rounded-r-xl border-y border-r border-slate-100 bg-white text-right group-hover:border-blue-200">
                        <div className="flex items-center justify-end gap-0.5">
                          {view === 'ACTIVE' && !(occ as any).isArchived && (
                            <>
                              <button onClick={() => { setSelectedOccForLigne(occ); setEditingLigne(null); setIsLigneModalOpen(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Ajouter Article"><Package size={14} /></button>
                              {['EN_ATTENTE', 'EN_COURS'].includes(occ.statut) && <button onClick={() => handleApprove(occ.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Approuver"><CheckCircle2 size={14} /></button>}
                              {['EN_ATTENTE', 'INIT', 'INST', 'PREP', 'EN_COURS'].includes(occ.statut) && <button onClick={() => handleNextStep(occ.id, occ.statut)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-all" title="Étape suivante"><ArrowRight size={14} /></button>}
                              {['VERIFIE', 'FACTURE', 'PAYE'].includes(occ.statut) && <button onClick={() => downloadFacture(occ.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Télécharger Facture"><FileText size={14} /></button>}
                              {['FACTURE', 'PAYE'].includes(occ.statut) && <button onClick={() => handleUnlock(occ.id)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Déverrouiller Dossier"><Unlock size={14} /></button>}
                              <button onClick={() => handleEdit(occ)} className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Modifier"><Pencil size={14} /></button>
                              <button onClick={() => handleArchive(occ.id, occ.nom || `Dossier #${occ.id}`)} className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" title="Archiver"><Archive size={14} /></button>
                              {currentUser?.role === 'ADMIN' && (
                                <button onClick={() => handleDelete(occ.id, occ.nom || `Dossier #${occ.id}`)} className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Supprimer"><Trash2 size={14} /></button>
                              )}
                            </>
                          )}
                          {view === 'ARCHIVE' && (
                            <>
                              <button onClick={() => handleUnarchive(occ.id, occ.nom || `Dossier #${occ.id}`)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Restaurer"><Archive size={14} /></button>
                            </>
                          )}
                        </div>
                      </td>
                      </tr>
                      {expandedRows.includes(occ.id) && (
                      <tr>
                        <td colSpan={8} className="px-8 py-4 bg-slate-50/20">
                          <div className="space-y-4 border-l-2 border-slate-100 pl-6 my-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Articles associés ({occ.lignes?.length || 0})</h4>
                              <button onClick={() => { setSelectedOccForLigne(occ); setEditingLigne(null); setIsLigneModalOpen(true); }} className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase hover:underline"><Plus size={14} /> Ajouter</button>
                            </div>
                            {!occ.lignes || occ.lignes.length === 0 ? (
                              <p className="text-[10px] font-bold text-slate-300 uppercase italic">Aucun article</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {occ.lignes.map((ligne: any) => (
                                  <div key={ligne.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md group">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 font-bold text-[10px]">{ligne.article?.numero || '#'}</div>
                                      <div>
                                        <p className="text-xs font-black text-slate-900">{ligne.article?.designation}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2 mt-1">
                                          {(occ.type === 'COMMERCE' || occ.type === 'CHANTIER' || occ.type === 'TOURNAGE' || occ.type === 'TLPE') ? (
                                            <>
                                              {(() => {
                                                const rawMode = ligne.article?.modeTaxation?.nom || 'unité';
                                                const parts = rawMode.split('/').filter(Boolean).map((p: string) => p.trim().toLowerCase());
                                                const u1 = parts[0] || 'unités';
                                                const u2 = parts[1] || 'unités';
                                                
                                                if (occ.type === 'CHANTIER') {
                                                  const startTh = format(new Date(ligne.dateDebut), 'dd/MM/yy');
                                                  const endTh = format(new Date(ligne.dateFin), 'dd/MM/yy');
                                                  const hasReel = !!(ligne.dateDebutConstatee || ligne.dateFinConstatee);
                                                  const startReel = ligne.dateDebutConstatee ? format(new Date(ligne.dateDebutConstatee), 'dd/MM/yy') : '--';
                                                  const endReel = ligne.dateFinConstatee ? format(new Date(ligne.dateFinConstatee), 'dd/MM/yy') : '--';
                                                  
                                                  return (
                                                    <span className="flex flex-col gap-0.5">
                                                      <span>{ligne.quantite1} {u1} x {ligne.quantite2} {u2} à {ligne.article?.montant}€ soit </span>
                                                      <span className="text-[9px] text-slate-400 normal-case italic flex flex-col">
                                                        <span>Théo : {startTh} au {endTh}</span>
                                                        {hasReel && <span className="text-emerald-600">Réel : {startReel} au {endReel}</span>}
                                                      </span>
                                                    </span>
                                                  );
                                                }
                                                
                                                if (occ.type === 'TOURNAGE') {
                                                  const start = format(new Date(ligne.dateDebut), 'dd/MM/yy');
                                                  const end = format(new Date(ligne.dateFin), 'dd/MM/yy');
                                                  return (
                                                    <span className="flex flex-col gap-0.5">
                                                       <span>{ligne.quantite1} {u1} x {ligne.quantite2} {u2} à {ligne.article?.montant}€ soit </span>
                                                       <span className="text-[9px] text-amber-600 normal-case italic">Du {start} au {end}</span>
                                                    </span>
                                                  );
                                                }
                                                
                                                if (occ.type === 'COMMERCE' || occ.type === 'TLPE') {
                                                  return (
                                                    <span className="flex flex-col gap-0.5">
                                                      <span>{ligne.quantite1} {u1} à {ligne.article?.montant}€ soit </span>
                                                      <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Année de taxation : {occ.anneeTaxation}</span>
                                                    </span>
                                                  );
                                                }
                                                
                                                return `${ligne.quantite1} ${u1} à ${ligne.article?.montant}€/${u1} soit `;
                                              })()}
                                              <span className="text-blue-600 font-extrabold">{ligne.montant}€</span>
                                            </>
                                          ) : (
                                            <>
                                              <span>{ligne.quantite1} x {ligne.quantite2}</span>
                                              <ArrowRight size={10} />
                                              <span className="text-blue-600">{format(new Date(ligne.dateDebut), 'dd/MM/yy')} - {format(new Date(ligne.dateFin), 'dd/MM/yy')}</span>
                                            </>
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => { setSelectedOccForLigne(occ); setEditingLigne(ligne); setIsLigneModalOpen(true); }} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"><Pencil size={14} /></button>
                                      <button onClick={() => handleDeleteLigne(occ.id, ligne.id)} className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg"><Trash2 size={14} /></button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                      )}
                    </React.Fragment>
                  );
                })}

              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{isEditing ? 'Modifier le Dossier' : 'Nouveau Dossier RODP'}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Saisie des informations de base</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-xl text-slate-300 hover:text-slate-900 transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 overflow-y-auto space-y-8 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type d'occupation</label>
                    <select
                      disabled={isEditing}
                      required
                      className={`w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none transition-all font-bold appearance-none ${isEditing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer focus:border-blue-500'}`}
                      value={formData.type}
                      onChange={e => {
                        setFormData({...formData, type: e.target.value});
                      }}
                    >
                      <option value="CHANTIER">Echafaudage / Chantier</option>
                      <option value="TOURNAGE">Tournage / Événement</option>
                      <option value="TLPE">T.L.P.E.</option>
                      <option value="COMMERCE">Commerce</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Libellé du Dossier</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold" placeholder="Ex: Terrasse été 2024..." value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} />
                  </div>
                  <div className="space-y-3 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                       Demandeur (Tiers)
                       {fetchingTiers && <Loader2 size={12} className="animate-spin text-blue-500" />}
                    </label>

                    {!formData.tiersId ? (
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                          type="text"
                          placeholder="Chercher par nom ou code SEDIT..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold"
                          value={tiersSearchQuery}
                          onChange={(e) => {
                            setTiersSearchQuery(e.target.value);
                            setIsTiersDropdownOpen(true);
                          }}
                          onFocus={() => setIsTiersDropdownOpen(true)}
                        />

                        {isTiersDropdownOpen && (tiersSearchQuery.length > 0 || tiers.length > 0) && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[150] overflow-hidden divide-y divide-slate-50 max-h-60 overflow-y-auto">
                            {tiers
                              .filter(t =>
                                t.nom.toLowerCase().includes(tiersSearchQuery.toLowerCase()) ||
                                (t as any).code_sedit?.includes(tiersSearchQuery)
                              )
                              .slice(0, 15)
                              .map(t => (
                                <button
                                  key={t.id}
                                  type="button"
                                  className="w-full px-6 py-4 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group"
                                  onClick={() => {
                                    handleTierChange(t.id.toString());
                                    setTiersSearchQuery('');
                                    setIsTiersDropdownOpen(false);
                                  }}
                                >
                                  <div className="flex-1">
                                     <div className="flex items-center gap-2 mb-1">
                                       <p className="font-bold text-slate-900 group-hover:text-blue-600 uppercase text-xs">{t.nom}</p>
                                       {(t as any).etatAdministratif === 'Cessée' && (
                                         <div className="flex items-center gap-1 bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border border-rose-200">
                                           <AlertTriangle size={8} />
                                           Fermé
                                         </div>
                                       )}
                                     </div>
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        {(t as any).code_sedit || 'SANS CODE SEDIT'}
                                        {t.statut === 'PROVISOIRE' && !(t as any).code_sedit && <span className="ml-2 text-rose-400">(PROVISOIRE)</span>}
                                     </p>
                                  </div>
                                  <ChevronRight size={14} className="text-slate-300" />
                                </button>
                              ))}
                            {tiersSearchQuery.length > 0 && tiers.filter(t => t.nom.toLowerCase().includes(tiersSearchQuery.toLowerCase()) || (t as any).code_sedit?.includes(tiersSearchQuery)).length === 0 && (
                              <div className="p-8 text-center text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Aucun tiers trouvé</div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-2xl p-4">
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => {
                                if (formData.isAgissantPourBillable) {
                                  setFormData({...formData, isAgissantPourBillable: false});
                                }
                              }}
                              className={`flex items-center justify-center w-8 h-8 rounded-full shadow-lg transition-all cursor-pointer flex-shrink-0 ${
                                !formData.isAgissantPourBillable
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30'
                                  : 'bg-slate-300 hover:bg-slate-400 text-white'
                              }`}
                              title="Entité facturée"
                            >
                              <Euro size={16} className="font-black" />
                            </button>
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                              <Users size={18} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-black text-blue-900 uppercase text-xs">
                                  {tiers.find(t => t.id === Number(formData.tiersId))?.nom}
                                </p>
                                {(tiers.find(t => t.id === Number(formData.tiersId)) as any)?.etatAdministratif === 'Cessée' && (
                                  <div className="flex items-center gap-1 bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-rose-200">
                                    <AlertTriangle size={10} />
                                    Fermé
                                  </div>
                                )}
                              </div>
                              {(() => {
                                const tier = tiers.find(t => t.id === Number(formData.tiersId));
                                const contactPrincipal = (tier as any)?.contacts?.find((c: any) => c.role === 'Contact principal');
                                return contactPrincipal ? (
                                  <p className="text-[9px] font-bold text-blue-600 mb-1">
                                    {contactPrincipal.prenom} {contactPrincipal.nom}
                                  </p>
                                ) : null;
                              })()}
                              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">
                                ID #{formData.tiersId} — {(tiers.find(t => t.id === Number(formData.tiersId)) as any)?.code_sedit || 'SANS CODE'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({...formData, tiersId: ''});
                              setTiersSearchQuery('');
                            }}
                            className="p-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all border border-blue-100"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        {!formData.isAgissantPourBillable && !(tiers.find(t => t.id === Number(formData.tiersId))?.contacts?.some((c: any) => c.role === 'Contact principal')) && (
                          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-black text-amber-900 uppercase tracking-tight mb-1">Contact principal requis</p>
                              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-3">Il faut créer un contact principal pour cette entité avant de la facturer</p>
                              <button
                                type="button"
                                onClick={() => openContactModal('demandeur')}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                              >
                                <Plus size={14} />
                                Ajouter un contact
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Agissant pour le compte de (Optionnel)
                    </label>

                    {!formData.agissantPourId ? (
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                          type="text"
                          placeholder="Chercher un tiers par nom ou code SEDIT..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold"
                          value={agissantPourSearchQuery}
                          onChange={(e) => {
                            setAgissantPourSearchQuery(e.target.value);
                            setIsAgissantPourDropdownOpen(true);
                          }}
                          onFocus={() => setIsAgissantPourDropdownOpen(true)}
                        />

                        {isAgissantPourDropdownOpen && (agissantPourSearchQuery.length > 0 || tiers.length > 0) && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[150] overflow-hidden divide-y divide-slate-50 max-h-60 overflow-y-auto">
                            {tiers
                              .filter(t =>
                                t.nom.toLowerCase().includes(agissantPourSearchQuery.toLowerCase()) ||
                                (t as any).code_sedit?.includes(agissantPourSearchQuery)
                              )
                              .slice(0, 15)
                              .map(t => (
                                <button
                                  key={t.id}
                                  type="button"
                                  className="w-full px-6 py-4 text-left hover:bg-emerald-50 transition-colors flex items-center justify-between group"
                                  onClick={() => {
                                    setFormData({...formData, agissantPourId: t.id.toString(), agissantPour: t.nom});
                                    setAgissantPourSearchQuery('');
                                    setIsAgissantPourDropdownOpen(false);
                                  }}
                                >
                                  <div className="flex-1">
                                     <div className="flex items-center gap-2 mb-1">
                                       <p className="font-bold text-slate-900 group-hover:text-emerald-600 uppercase text-xs">{t.nom}</p>
                                       {(t as any).etatAdministratif === 'Cessée' && (
                                         <div className="flex items-center gap-1 bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border border-rose-200">
                                           <AlertTriangle size={8} />
                                           Fermé
                                         </div>
                                       )}
                                     </div>
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        {(t as any).code_sedit || 'SANS CODE SEDIT'}
                                        {t.statut === 'PROVISOIRE' && !(t as any).code_sedit && <span className="ml-2 text-rose-400">(PROVISOIRE)</span>}
                                     </p>
                                  </div>
                                  <ChevronRight size={14} className="text-slate-300" />
                                </button>
                              ))}
                            {agissantPourSearchQuery.length > 0 && tiers.filter(t => t.nom.toLowerCase().includes(agissantPourSearchQuery.toLowerCase()) || (t as any).code_sedit?.includes(agissantPourSearchQuery)).length === 0 && (
                              <div className="p-8 text-center text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Aucun tiers trouvé</div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => {
                                if (formData.isAgissantPourBillable) {
                                  setFormData({...formData, isAgissantPourBillable: false});
                                } else {
                                  setFormData({...formData, isAgissantPourBillable: true});
                                }
                              }}
                              className={`flex items-center justify-center w-8 h-8 rounded-full shadow-lg transition-all cursor-pointer flex-shrink-0 ${
                                formData.isAgissantPourBillable
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30'
                                  : 'bg-slate-300 hover:bg-slate-400 text-white'
                              }`}
                              title="Entité facturée"
                            >
                              <Euro size={16} className="font-black" />
                            </button>
                            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                              <Users size={18} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-black text-emerald-900 uppercase text-xs">
                                  {tiers.find(t => t.id === Number(formData.agissantPourId))?.nom}
                                </p>
                                {(tiers.find(t => t.id === Number(formData.agissantPourId)) as any)?.etatAdministratif === 'Cessée' && (
                                  <div className="flex items-center gap-1 bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-rose-200">
                                    <AlertTriangle size={10} />
                                    Fermé
                                  </div>
                                )}
                              </div>
                              {(() => {
                                const tier = tiers.find(t => t.id === Number(formData.agissantPourId));
                                const contactPrincipal = (tier as any)?.contacts?.find((c: any) => c.role === 'Contact principal');
                                return contactPrincipal ? (
                                  <p className="text-[9px] font-bold text-emerald-600 mb-1">
                                    {contactPrincipal.prenom} {contactPrincipal.nom}
                                  </p>
                                ) : null;
                              })()}
                              <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                                ID #{formData.agissantPourId} — {(tiers.find(t => t.id === Number(formData.agissantPourId)) as any)?.code_sedit || 'SANS CODE'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({...formData, agissantPourId: '', agissantPour: '', isAgissantPourBillable: false});
                              setAgissantPourSearchQuery('');
                            }}
                            className="p-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all border border-emerald-100"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        {formData.isAgissantPourBillable && !(tiers.find(t => t.id === Number(formData.agissantPourId))?.contacts?.some((c: any) => c.role === 'Contact principal')) && (
                          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-black text-amber-900 uppercase tracking-tight mb-1">Contact principal requis</p>
                              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-3">Il faut créer un contact principal pour cette entité avant de la facturer</p>
                              <button
                                type="button"
                                onClick={() => openContactModal('agissantPour')}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                              >
                                <Plus size={14} />
                                Ajouter un contact
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Statut du dossier</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer" value={formData.statut} onChange={e => setFormData({...formData, statut: e.target.value})}>
                      {Object.entries(getAvailableStatuses(formData.type)).map(([key, val]) => (
                        <option key={key} value={key}>{val.label.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  {formData.type === 'TOURNAGE' && (
                    <div className="pt-2">
                      <label className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl cursor-pointer hover:bg-amber-100 transition-all group">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          checked={formData.isCourtMetrage}
                          onChange={e => setFormData({...formData, isCourtMetrage: e.target.checked})}
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-amber-900 uppercase tracking-tight">Court métrage <span className="lowercase font-bold tracking-normal">&lt; 59 minutes</span></span>
                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest leading-none mt-0.5">Abattement de 50% (Hors pub)</span>
                        </div>
                      </label>
                    </div>
                  )}
                  {(formData.type === 'CHANTIER' || formData.type === 'TOURNAGE') && (
                    <>
                      <div className="pt-2">
                        <label className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl cursor-pointer hover:bg-emerald-100 transition-all group">
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            checked={formData.isExempt}
                            onChange={e => setFormData({...formData, isExempt: e.target.checked})}
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-emerald-900 uppercase tracking-tight">Exonéré</span>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none mt-0.5">Exonéré de facturation - Sera archivé automatiquement</span>
                          </div>
                        </label>
                      </div>
                      <div className="pt-2">
                        <label className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl cursor-pointer hover:bg-red-100 transition-all group">
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500 cursor-pointer"
                            checked={formData.isNotAuthorized}
                            onChange={e => setFormData({...formData, isNotAuthorized: e.target.checked})}
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-red-900 uppercase tracking-tight">Non autorisé</span>
                            <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest leading-none mt-0.5">Majoration 100% (Pas d'autorisation)</span>
                          </div>
                        </label>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-6">
                  {(formData.type === 'COMMERCE' || formData.type === 'TLPE') ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Année de taxation</label>
                      <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer" value={formData.anneeTaxation} onChange={e => setFormData({...formData, anneeTaxation: e.target.value})}>
                        {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date Début</label>
                          <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold" value={formData.dateDebut} onChange={e => setFormData({...formData, dateDebut: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date Fin</label>
                          <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold" value={formData.dateFin} onChange={e => setFormData({...formData, dateFin: e.target.value})} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date d'Alerte (optionnel)</label>
                        <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold" value={formData.dateAlerte} onChange={e => setFormData({...formData, dateAlerte: e.target.value})} />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between items-center">
                      Adresse
                      <button 
                        type="button"
                        onClick={handleFetchTiersAddress}
                        className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Récupérer l'adresse du tiers"
                      >
                        <Download size={12} />
                        <span>Récupérer du tiers</span>
                      </button>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold" placeholder="Rechercher une adresse..." value={addressQuery} onChange={e => { setAddressQuery(e.target.value); setFormData({...formData, adresse: e.target.value}); }} />
                    </div>
                    {addressResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-50 max-h-48 overflow-y-auto">
                        {addressResults.map((r, i) => (
                          <button key={i} type="button" className="w-full px-6 py-4 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group" onClick={() => { setFormData({ ...formData, adresse: r.label, latitude: r.latitude.toString(), longitude: r.longitude.toString() }); setAddressQuery(r.label); setAddressResults([]); }}>
                            <div>
                               <p className="font-bold text-slate-900 group-hover:text-blue-600">{r.label}</p>
                               <p className="text-[10px] font-black text-slate-400 uppercase">{r.postcode} {r.city}</p>
                            </div>
                            <ChevronRight size={14} className="text-slate-300" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Photos / Justificatifs</label>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                    {uploadedPhotos.map((url, i) => {
                      const isPdf = url.toLowerCase().endsWith('.pdf');
                      return (
                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group bg-slate-50">
                          {isPdf ? (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                              <FileText size={24} className="text-rose-500 mb-1" />
                              <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Document PDF</span>
                            </div>
                          ) : (
                            <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
                          )}
                          <button type="button" onClick={() => setUploadedPhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-rose-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                            <X size={20} />
                          </button>
                        </div>
                      );
                    })}
                    <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-all text-slate-400">
                      <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} disabled={uploading} />
                      {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observations</label>
                  <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold min-h-[100px]" placeholder="Précisez ici les détails du dossier..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                </div>
              </div>

              <div className="flex gap-4 pt-10 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 font-black text-slate-400 hover:bg-slate-50 rounded-2xl transition-all uppercase tracking-widest text-xs">Annuler</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-3xl font-black shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  {isEditing ? 'Mettre à jour' : 'Créer le Dossier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLigneModalOpen && selectedOccForLigne && (
        <LigneArticleModal 
          isOpen={isLigneModalOpen}
          onClose={() => setIsLigneModalOpen(false)}
          onSave={fetchOccupations}
          occupationId={selectedOccForLigne.id}
          annee={selectedOccForLigne.anneeTaxation || (selectedOccForLigne.dateDebut ? new Date(selectedOccForLigne.dateDebut).getFullYear() : new Date().getFullYear())}
          defaultDates={{
            start: selectedOccForLigne.dateDebut?.split('T')[0] || format(new Date(), 'yyyy-MM-dd'),
            end: selectedOccForLigne.dateFin?.split('T')[0] || format(new Date(), 'yyyy-MM-dd')
          }}
          occupationType={selectedOccForLigne.type}
          initialData={editingLigne}
        />
      )}

      {isFilienModalOpen && (
        <FilienGenerationModal
          isOpen={isFilienModalOpen}
          onClose={() => setIsFilienModalOpen(false)}
          occupations={occupations}
        />
      )}

      {isContactModalOpen && contactModalFor && (
        <ContactModal
          isOpen={isContactModalOpen}
          onClose={() => {
            setIsContactModalOpen(false);
            setContactModalFor(null);
          }}
          onAddContact={handleAddContact}
          newContact={newContact}
          setNewContact={setNewContact}
          isSubmittingContact={isSubmittingContact}
          onPhotoContact={handlePhotoContact}
        />
      )}

      {isWarningModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in scale-in duration-300">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-amber-600" size={24} />
              <h2 className="text-lg font-black text-slate-900">Avertissement</h2>
            </div>

            <div className="mb-6">
              <p className="text-sm text-slate-700 mb-2">
                <span className="font-bold text-amber-600">{warningTierName}</span>
              </p>
              <p className="text-sm text-slate-600">
                {warningMessage}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsWarningModalOpen(false)}
                className="flex-1 px-4 py-3 text-slate-700 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setIsWarningModalOpen(false);
                  warningAction();
                }}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OccupationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    }>
      <OccupationsPageContent />
    </Suspense>
  );
}
