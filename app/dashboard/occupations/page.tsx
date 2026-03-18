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
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import LigneArticleModal from '@/components/LigneArticleModal';
import FilienGenerationModal from '@/components/FilienGenerationModal';

interface Occupation {
  id: number;
  nom: string | null;
  tiersId: number;
  tiers: { nom: string; code_sedit: string | null };
  type: string;
  statut: string;
  dateDebut: string | null;
  dateFin: string | null;
  anneeTaxation: number | null;
  adresse: string;
  description: string | null;
  montantCalcule: number;
  photos: string | null;
  created_at: string;
  lignes?: any[];
  _count?: { notes: number };
}

interface Tiers {
  id: number;
  nom: string;
  adresse?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  statut?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  'DECLARED': { label: 'Déclaré', color: 'text-slate-500', bg: 'bg-slate-100' },
  'IN_PROGRESS': { label: 'En cours', color: 'text-blue-600', bg: 'bg-blue-50' },
  'COMPLETED': { label: 'Terminé', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  'VERIFIED': { label: 'Vérifié', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'INVOICED': { label: 'Facturé', color: 'text-amber-600', bg: 'bg-amber-50' },
  'PAID': { label: 'Payé', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  'EN_ATTENTE': { label: 'En attente', color: 'text-amber-500', bg: 'bg-amber-50' }, // Legacy support
  'VALIDE': { label: 'Validé', color: 'text-emerald-600', bg: 'bg-emerald-50' }    // Legacy support
};

function OccupationsPageContent() {
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
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [tiersFilter, setTiersFilter] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [isLigneModalOpen, setIsLigneModalOpen] = useState(false);
  const [selectedOccForLigne, setSelectedOccForLigne] = useState<Occupation | null>(null);
  const [editingLigne, setEditingLigne] = useState<any>(null);
  const [isFilienModalOpen, setIsFilienModalOpen] = useState(false);

  const router = useRouter();

  const [formData, setFormData] = useState({
    id: null as number | null,
    nom: '',
    tiersId: '',
    type: 'COMMERCE',
    anneeTaxation: new Date().getFullYear().toString(),
    dateDebut: '',
    dateFin: '',
    adresse: '',
    latitude: '',
    longitude: '',
    description: '',
    statut: 'DECLARED'
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
      const res = await axios.get('/api/occupations');
      setOccupations(res.data);
    } catch (err) {
      console.error('Failed to fetch occupations:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchParams = useSearchParams();

  useEffect(() => {
    const tid = searchParams.get('tiersId');
    if (tid) {
      setTiersFilter(tid);
      setYearFilter('ALL');
    }
  }, [searchParams]);

  useEffect(() => {
    fetchTiers();
    fetchOccupations();
  }, []);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && occupations.length > 0) {
      const found = occupations.find(o => o.id === parseInt(editId));
      if (found) handleEdit(found);
    }
  }, [searchParams, occupations]);

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
      const payload = { ...formData, photos: uploadedPhotos.join(',') };
      if (isEditing) {
        await axios.patch(`/api/occupations/${formData.id}`, payload);
      } else {
        await axios.post('/api/occupations', payload);
      }
      setIsModalOpen(false);
      resetForm();
      fetchOccupations();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de l\'enregistrement du dossier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, nom: string) => {
    if (!confirm(`Supprimer le dossier "${nom || id}" ?`)) return;
    try {
      await axios.delete(`/api/occupations/${id}`);
      fetchOccupations();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const handleEdit = (occ: Occupation) => {
    setFormData({
      id: occ.id,
      nom: occ.nom || '',
      tiersId: occ.tiersId.toString(),
      type: occ.type,
      anneeTaxation: occ.anneeTaxation ? occ.anneeTaxation.toString() : new Date().getFullYear().toString(),
      dateDebut: occ.dateDebut ? format(new Date(occ.dateDebut), 'yyyy-MM-dd') : '',
      dateFin: occ.dateFin ? format(new Date(occ.dateFin), 'yyyy-MM-dd') : '',
      adresse: occ.adresse,
      latitude: '', 
      longitude: '',
      description: occ.description || '',
      statut: occ.statut
    });
    setAddressQuery(occ.adresse);
    setUploadedPhotos(occ.photos ? occ.photos.split(',') : []);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      id: null, nom: '', tiersId: '', type: 'COMMERCE', anneeTaxation: new Date().getFullYear().toString(), dateDebut: '', dateFin: '',
      adresse: '', latitude: '', longitude: '', description: '', statut: 'DECLARED'
    });
    setAddressQuery('');
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
      await axios.patch(`/api/occupations/${id}`, { statut: 'VERIFIED' });
      fetchOccupations();
    } catch (err) { alert('Erreur lors de la mise à jour du statut'); }
  };

  const downloadFacture = (id: number) => {
    window.location.href = `/api/facture-pdf/${id}`;
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
    const matchesSearch = (o.tiers?.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.adresse.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || o.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || o.statut === statusFilter;
    const dossierAnnee = o.type === 'COMMERCE' ? o.anneeTaxation : (o.dateDebut ? new Date(o.dateDebut).getFullYear() : null);
    const matchesYear = yearFilter === 'ALL' || (dossierAnnee && dossierAnnee.toString() === yearFilter.toString());
    const matchesTiers = !tiersFilter || o.tiersId.toString() === tiersFilter;
    return matchesSearch && matchesType && matchesStatus && matchesYear && matchesTiers;
  });

  const totalsByType = occupations.reduce((acc, o) => {
    const occTotal = o.lignes?.reduce((sum, l) => sum + (l.montant || 0), 0) || o.montantCalcule || 0;
    acc[o.type] = (acc[o.type] || 0) + occTotal;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dossiers</h2>
          <p className="text-slate-500 font-medium tracking-wide">Gestion des autorisations d'occupation du domaine public</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => { fetchTiers(); fetchOccupations(); }}
             className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
             title="Actualiser"
           >
             <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
           </button>
           <button 
             onClick={() => { resetForm(); setIsModalOpen(true); }}
             className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95"
           >
             <Plus size={18} />
             Nouveau Dossier
           </button>
           <button 
             onClick={() => setIsFilienModalOpen(true)}
             className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 transition-all active:scale-95"
           >
             <FileText size={18} />
             GENERER FILIEN
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { type: 'COMMERCE', label: 'Commerces', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { type: 'CHANTIER', label: 'Chantiers', icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { type: 'TOURNAGE', label: 'Tournages', icon: Info, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((cat) => (
          <button
            key={cat.type}
            onClick={() => setTypeFilter(typeFilter === cat.type ? 'ALL' : cat.type)}
            className={`p-6 rounded-[2.5rem] border transition-all text-left group ${
              typeFilter === cat.type 
                ? 'bg-white border-blue-500 shadow-xl shadow-blue-500/10' 
                : 'bg-white border-slate-200 hover:border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${cat.bg} ${cat.color}`}>
                <cat.icon size={24} />
              </div>
              {typeFilter === cat.type && <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Actif</span>}
            </div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{cat.label}</h3>
            <p className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
              {(totalsByType[cat.type] || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-base text-slate-400">€</span>
            </p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/10 gap-6">
          <div className="flex flex-col gap-2 flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher un tiers ou une adresse..." 
                className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-semibold text-sm"
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
          
          <div className="flex items-center gap-4">
            <select 
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 outline-none focus:border-blue-500 transition-all"
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
            >
              <option value="ALL">Toutes les années</option>
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select 
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 outline-none focus:border-blue-500 transition-all"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="ALL">Tous les Types</option>
              <option value="COMMERCE">Commerce</option>
              <option value="CHANTIER">Chantier</option>
              <option value="TOURNAGE">Tournage</option>
            </select>
            <select 
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 outline-none focus:border-blue-500 transition-all"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tous les Statuts</option>
              {Object.entries(STATUS_MAP).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
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
            <table className="w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
                  <th className="px-6 pb-4">Nom Dossier</th>
                  <th className="px-6 pb-4">Demandeur</th>
                  <th className="px-6 pb-4">Période</th>
                  <th className="px-6 pb-4">Type</th>
                  <th className="px-6 pb-4">PJ</th>
                  <th className="px-6 pb-4">Articles</th>
                  <th className="px-6 pb-4">Montant</th>
                  <th className="px-6 pb-4">Statut</th>
                  <th className="px-6 pb-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((occ) => (
                  <React.Fragment key={occ.id}>
                    <tr className="group transition-all hover:bg-slate-50/50">
                      <td className="px-6 py-5 rounded-l-3xl border-y border-l border-slate-100 bg-white group-hover:border-blue-200">
                        <div className="flex items-center gap-4">
                          <button onClick={() => toggleRow(occ.id)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                            {expandedRows.includes(occ.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <div className="cursor-pointer group/title" onClick={() => handleShowDetail(occ.id)}>
                            <p className="font-black text-slate-900 leading-tight mb-1 group-hover/title:text-blue-600 transition-colors uppercase flex items-center gap-2">
                               {occ.nom || `Dossier #${occ.id}`}
                               <ExternalLink size={14} className="opacity-0 group-hover/title:opacity-100 transition-opacity" />
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[200px]">{occ.adresse}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 border-y border-slate-100 bg-white group-hover:border-blue-200 font-bold text-blue-600 uppercase text-[11px]">
                         {occ.tiers?.nom || 'Inconnu'}
                      </td>
                      <td className="px-6 py-5 border-y border-slate-100 bg-white group-hover:border-blue-200">
                        <p className="text-xs font-black text-slate-400 uppercase flex items-center gap-1">
                          <Clock size={12} /> 
                          {occ.type === 'COMMERCE' ? (occ.anneeTaxation || '-') : (
                            <>
                              {occ.dateDebut ? format(new Date(occ.dateDebut), 'dd MMM', { locale: fr }) : '-'} - {occ.dateFin ? format(new Date(occ.dateFin), 'dd MMM yyyy', { locale: fr }) : '-'}
                            </>
                          )}
                        </p>
                      </td>
                      <td className="px-6 py-5 border-y border-slate-100 bg-white group-hover:border-blue-200 text-xs font-black">
                        <span className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-slate-600 uppercase tracking-widest">{occ.type}</span>
                      </td>
                      <td className="px-6 py-5 border-y border-slate-100 bg-white group-hover:border-blue-200 text-xs font-black text-slate-400">
                         <div className="flex items-center gap-2">
                           <ImageIcon size={14} className={occ.photos ? "text-blue-500" : "text-slate-200"} />
                           <span>{occ.photos ? occ.photos.split(',').filter(Boolean).length : 0}</span>
                         </div>
                      </td>
                      <td className="px-6 py-5 border-y border-slate-100 bg-white group-hover:border-blue-200 text-xs font-black text-slate-600">
                         <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-2">
                             <Package size={14} className="text-slate-300" /> {occ.lignes?.length || 0}
                           </div>
                           <div className="flex items-center gap-2">
                             <MessageSquare size={14} className={occ._count?.notes ? "text-blue-400" : "text-slate-200"} />
                             <span className={occ._count?.notes ? "text-blue-600" : "text-slate-300"}>{occ._count?.notes || 0}</span>
                           </div>
                         </div>
                      </td>
                      <td className="px-6 py-5 border-y border-slate-100 bg-white group-hover:border-blue-200 font-bold text-blue-600 uppercase text-[11px]">
                         {((occ.lignes?.reduce((sum: number, l: any) => sum + (l.montant || 0), 0) || occ.montantCalcule || 0)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                      </td>
                      <td className="px-6 py-5 border-y border-slate-100 bg-white group-hover:border-blue-200 text-[10px] font-black uppercase">
                         <div className="flex items-center gap-2">
                           <div className={`w-2.5 h-2.5 rounded-full ${STATUS_MAP[occ.statut]?.color.replace('text', 'bg') || 'bg-slate-300'} shadow-sm`}></div>
                           <span className={STATUS_MAP[occ.statut]?.color || 'text-slate-400'}>
                             {STATUS_MAP[occ.statut]?.label || occ.statut}
                           </span>
                         </div>
                         {(occ as any).facturePath && (
                           <a href={(occ as any).facturePath} target="_blank" className="flex items-center gap-1.5 mt-2 text-[8px] text-blue-500 hover:underline">
                             <FileText size={10} /> Facture associée
                           </a>
                         )}
                      </td>
                      <td className="px-6 py-5 rounded-r-3xl border-y border-r border-slate-100 bg-white text-right group-hover:border-blue-200">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setSelectedOccForLigne(occ); setEditingLigne(null); setIsLigneModalOpen(true); }} className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Ajouter Article"><Package size={18} /></button>
                          {occ.statut === 'EN_ATTENTE' && <button onClick={() => handleApprove(occ.id)} className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Approuver"><CheckCircle2 size={18} /></button>}
                          {occ.statut === 'VALIDE' && <button onClick={() => downloadFacture(occ.id)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Télécharger Facture"><FileText size={18} /></button>}
                          <button onClick={() => handleEdit(occ)} className="p-2.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Modifier"><Pencil size={18} /></button>
                          <button onClick={() => handleDelete(occ.id, occ.nom || `Dossier #${occ.id}`)} className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Supprimer"><Trash2 size={18} /></button>
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
                                  <div key={ligne.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group/item transition-all hover:border-blue-100">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 font-bold text-[10px]">{ligne.article?.numero || '#'}</div>
                                      <div>
                                        <p className="text-xs font-black text-slate-900">{ligne.article?.designation}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2 mt-1">
                                          {occ.type === 'COMMERCE' || occ.type === 'CHANTIER' ? (
                                            <>
                                              {(() => {
                                                const rawMode = ligne.article?.modeTaxation?.nom || 'unité';
                                                const parts = rawMode.split('/').map((p: string) => p.trim());
                                                const u1 = parts[0] || 'unité';
                                                const u2 = parts[1] || 'unité';
                                                const displayU1 = u1.toLowerCase() === 'unité' ? 'unité' : u1;
                                                const displayU2 = u2.toLowerCase() === 'unité' ? 'unité' : u2;
                                                
                                                if (occ.type === 'CHANTIER') {
                                                  const startStr = format(new Date(ligne.dateDebutConstatee || ligne.dateDebut), 'dd/MM/yy');
                                                  const endStr = format(new Date(ligne.dateFinConstatee || ligne.dateFin), 'dd/MM/yy');
                                                  return (
                                                    <span className="flex flex-col gap-0.5">
                                                      <span>{ligne.quantite1} {displayU1} x {ligne.quantite2} {displayU2} à {ligne.article?.montant}€ soit </span>
                                                      <span className="text-[9px] text-slate-300 normal-case italic">Période : {startStr} au {endStr}</span>
                                                    </span>
                                                  );
                                                }
                                                
                                                return `${ligne.quantite1} ${displayU1} à ${ligne.article?.montant}€/${displayU1} soit `;
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
                                    <div className="flex gap-1 opacity-10 group-hover/item:opacity-100 transition-opacity">
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
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{isEditing ? 'Modifier le Dossier' : 'Nouveau Dossier RODP'}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Saisie des informations de base</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-2xl text-slate-300 hover:text-slate-900 transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 overflow-y-auto space-y-8 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type d'occupation</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer" value={formData.type} onChange={e => {
                      const newType = e.target.value;
                      const selectedTier = tiers.find(t => t.id === Number(formData.tiersId));
                      const newNom = (newType === 'COMMERCE' && selectedTier) ? selectedTier.nom : formData.nom;
                      setFormData({...formData, type: newType, nom: newNom});
                    }}>
                      <option value="COMMERCE">Terrasse / Commerce</option>
                      <option value="CHANTIER">Echafaudage / Chantier</option>
                      <option value="TOURNAGE">Tournage / Événement</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Libellé du Dossier</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold" placeholder="Ex: Terrasse été 2024..." value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                       Demandeur (Tiers)
                       {fetchingTiers && <Loader2 size={12} className="animate-spin text-blue-500" />}
                    </label>
                    <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer" value={formData.tiersId} onChange={e => handleTierChange(e.target.value)}>
                      <option value="">{fetchingTiers ? 'Chargement...' : 'Sélectionner un tiers...'}</option>
                      {tiers.map(t => <option key={t.id} value={t.id}>{t.nom} {t.statut === 'PROVISOIRE' ? '(PROVISOIRE)' : ''}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Statut du dossier</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer" value={formData.statut} onChange={e => setFormData({...formData, statut: e.target.value})}>
                      {Object.entries(STATUS_MAP).map(([key, val]) => (
                        <option key={key} value={key}>{val.label.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  {formData.type === 'COMMERCE' ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Année de taxation</label>
                      <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer" value={formData.anneeTaxation} onChange={e => setFormData({...formData, anneeTaxation: e.target.value})}>
                        {[2022, 2023, 2024, 2025, 2026, 2027].map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
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
                    {uploadedPhotos.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group">
                        <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setUploadedPhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-rose-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"><X size={20} /></button>
                      </div>
                    ))}
                    <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-all text-slate-400">
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
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
