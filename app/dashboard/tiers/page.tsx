"use client";

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Users, 
  Search, 
  Plus, 
  Building2, 
  Mail, 
  MapPin, 
  Fingerprint, 
  Loader2,
  X,
  CheckCircle2,
  SearchCode,
  Pencil,
  Trash2,
  Check,
  List,
  ArrowRight,
  Camera,
  DownloadCloud,
  FileSpreadsheet,
  AlertTriangle,
  Info,
  Globe,
  Clock,
  FileText,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { NATURE_JURIDIQUE_OPTIONS, getNatureJuridiqueLabel } from '@/lib/tiers-constants';
import TiersModal from '@/components/TiersModal';

interface Tiers {
  id: number;
  nom: string;
  natureJuridique: string | null;
  siret: string | null;
  email: string;
  adresse: string | null;
  code_sedit: string | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  etatAdministratif?: string;
  _count?: {
    occupations: number;
  };
}

export default function TiersPage() {
  const [tiers, setTiers] = useState<Tiers[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  
  // New States: Progress, Pagination, Filtering
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [currentVerifying, setCurrentVerifying] = useState('');
  const [showOnlyClosed, setShowOnlyClosed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    id: null as number | null,
    nom: '',
    natureJuridique: '',
    siret: '',
    email: '',
    adresse: '',
    code_sedit: '',
    isRhRequest: false
  });

  const isEditing = !!formData.id;

  const fetchTiers = async () => {
    try {
      const res = await axios.get('/api/tiers');
      setTiers(res.data);
    } catch (err) {
      console.error('Failed to fetch tiers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  const handleSiretSearch = async () => {
    if (!formData.siret || formData.siret.trim() === '') return;
    const cleanSiret = formData.siret.replace(/\s+/g, '');
    setSubmitting(true);
    try {
      const res = await axios.get(`/api/tiers/search?siret=${cleanSiret}`);
      const data = res.data;
      setFormData({
        ...formData,
        nom: data.nom,
        adresse: data.adresse,
        natureJuridique: data.natureJuridique || formData.natureJuridique,
        siret: data.siret
      });
    } catch (err) {
      alert('SIRET non trouvé ou erreur INSEE');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, isSeditRequest = false) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData, isSeditRequest };
      if (isEditing) {
        await axios.put('/api/tiers', payload);
      } else {
        await axios.post('/api/tiers', payload);
      }
      setIsModalOpen(false);
      resetForm();
      fetchTiers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de l\'enregistrement du tiers');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSeditCreationRequest = async (t: Tiers) => {
    const code = prompt(`Saisir le code SEDIT pour "${t.nom}" :`, t.code_sedit || '');
    if (code === null) return;
    
    setSubmitting(true);
    try {
      await axios.put('/api/tiers', { 
        ...t, 
        id: t.id,
        code_sedit: code
      });
      fetchTiers();
    } catch (err: any) {
      alert(err.response?.data?.error || "Erreur lors de la mise à jour du code SEDIT.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, nom: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le tiers "${nom}" ?`)) return;
    try {
      await axios.delete(`/api/tiers?id=${id}`);
      fetchTiers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(`Lancer la synchronisation avec le fichier "${file.name}" ?`)) {
      e.target.value = '';
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post('/api/admin/import-tiers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportResults(res.data);
      setIsImportModalOpen(true);
      fetchTiers();
    } catch (err: any) {
       alert(err.response?.data?.error || "Erreur lors de l'importation");
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleGeocodeTiers = async () => {
    if (!confirm("Lancer le géocodage massif des tiers manquants ? (Cela permettra de les afficher sur la carte)")) return;
    setGeocoding(true);
    try {
      const res = await axios.post('/api/admin/geocode-tiers');
      if (res.data.stats) {
        alert(`Géocodage terminé !\nSuccès : ${res.data.stats.success}\nÉchecs : ${res.data.stats.failed}`);
      } else {
        alert(res.data.message || "Aucun tiers à géocoder.");
      }
      fetchTiers();
    } catch (err: any) {
      alert("Erreur lors du géocodage");
    } finally {
      setGeocoding(false);
    }
  };

  // REFACTORED: Sequential Verification with Progress Bar
  const verifyBaseInseeProgressive = async () => {
    const tiersToVerify = tiers.filter(t => t.siret);
    if (tiersToVerify.length === 0) {
      alert("Aucun tiers avec SIRET à vérifier.");
      return;
    }

    if (!confirm(`Lancer la vérification de l'état administratif pour ${tiersToVerify.length} tiers ?`)) return;

    setIsVerifying(true);
    setVerifyProgress(0);
    let count = 0;

    for (const t of tiersToVerify) {
      setCurrentVerifying(t.nom);
      try {
        // Set a shorter timeout for individual requests to avoid long hangs
        await axios.post(`/api/admin/verify-tiers/${t.id}`, {}, { timeout: 15000 });
      } catch (err) {
        console.error(`Error verifying ${t.nom}:`, err);
      }
      
      count++;
      setVerifyProgress(Math.round((count / tiersToVerify.length) * 100));
      
      // Small delay between every request to avoid burst peaks
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Larger delay every 5 requests to be safe with public API
      if (count % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsVerifying(false);
    alert("Vérification terminée !");
    fetchTiers();
  };

  const handleEdit = (t: Tiers) => {
    setFormData({
      id: t.id,
      nom: t.nom,
      natureJuridique: t.natureJuridique || '',
      siret: t.siret || '',
      email: t.email || '',
      adresse: t.adresse || '',
      code_sedit: t.code_sedit || '',
      isRhRequest: false
    });
    setIsModalOpen(true);
  };
  
  const handleStreetView = async (t: Tiers) => {
    let lat = t.latitude;
    let lng = t.longitude;
    
    if (!lat || !lng) {
      if (!t.adresse) {
        alert("Adresse manquante pour Street View");
        return;
      }
      setSubmitting(true);
      try {
        const res = await axios.get(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(t.adresse)}&limit=1`);
        if (res.data.features && res.data.features.length > 0) {
          [lng, lat] = res.data.features[0].geometry.coordinates;
          await axios.put('/api/tiers', { ...t, latitude: lat, longitude: lng });
        } else {
          alert("Impossible de géocoder l'adresse pour Street View");
          return;
        }
      } catch (err) {
        console.error("Geocoding error:", err);
        alert("Erreur lors de la récupération des coordonnées");
        return;
      } finally {
        setSubmitting(false);
      }
    }
    
    if (lat && lng) {
      const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      nom: '',
      natureJuridique: '',
      siret: '',
      email: '',
      adresse: '',
      code_sedit: '',
      isRhRequest: false
    });
  };

  // FILTER LOGIC
  const filteredTiers = tiers.filter(t => {
    const matchesSearch = 
      t.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.siret?.includes(searchTerm) ||
      t.code_sedit?.includes(searchTerm);
    
    const matchesStatus = showOnlyClosed ? t.etatAdministratif === 'Cessée' : true;
    
    return matchesSearch && matchesStatus;
  });

  // PAGINATION LOGIC
  const totalPages = Math.ceil(filteredTiers.length / itemsPerPage);
  const paginatedTiers = filteredTiers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const geocodedCount = tiers.filter(t => t.latitude && t.longitude).length;
  const closedCount = tiers.filter(t => t.etatAdministratif === 'Cessée').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight tracking-tighter">Gestion des Tiers</h2>
          <p className="text-slate-500 font-medium tracking-wide">Référentiel des bénéficiaires et entreprises</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xls,.xlsx"
            onChange={onFileChange}
          />
          <button
            onClick={() => {
              setShowOnlyClosed(!showOnlyClosed);
              setCurrentPage(1);
            }}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg group ${
              showOnlyClosed
                ? 'bg-rose-600 text-white shadow-rose-200 hover:bg-rose-700'
                : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200'
            }`}
            title={showOnlyClosed ? `Afficher tous les tiers` : `Afficher uniquement les ${closedCount} tiers fermés`}
          >
            <Filter size={16} className={showOnlyClosed ? '' : 'text-slate-600'} />
            {showOnlyClosed ? 'Tous les Tiers' : 'Fermés'}
            {closedCount > 0 && !showOnlyClosed && (
              <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-md text-[10px] font-black ml-1">{closedCount}</span>
            )}
          </button>

          <button
            onClick={handleGeocodeTiers}
            disabled={geocoding}
            className="flex items-center gap-3 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg group disabled:opacity-50"
          >
            {geocoding ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} className="text-emerald-600 group-hover:scale-110 transition-transform" /> }
            {geocoding ? 'Localisation...' : 'Localiser la base'}
          </button>

          <button
            onClick={verifyBaseInseeProgressive}
            disabled={isVerifying}
            className="flex items-center gap-3 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg group disabled:opacity-50"
          >
            {isVerifying ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} className="text-blue-600 group-hover:scale-110 transition-transform" /> }
            {isVerifying ? 'Analyse...' : 'Vérifier la base'}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-3 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg group disabled:opacity-50"
          >
            {importing ? <Loader2 size={18} className="animate-spin" /> : <DownloadCloud size={18} className="text-amber-600 group-hover:scale-110 transition-transform" /> }
            {importing ? 'Import...' : 'Import SEDIT'}
          </button>

          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-2xl shadow-slate-900/20"
          >
            <Plus size={20} />
            Créer un Tiers
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Tiers', value: tiers.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Géolocalisés', value: geocodedCount, icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Fermés (Inactif)', value: closedCount, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Dossiers Actifs', value: tiers.reduce((acc, t) => acc + (t._count?.occupations || 0), 0), icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md group">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={20} />
              </div>
              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">Statistiques</span>
            </div>
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</h3>
            <p className="text-xl font-black text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        <div className="p-5 border-b border-slate-50 flex items-center gap-4 bg-slate-50/10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher par nom, SIRET ou code SEDIT..."
              className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-semibold text-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest whitespace-nowrap">
            <span>{filteredTiers.length} RESULTATS</span>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Récupération des données...</p>
            </div>
          ) : paginatedTiers.length === 0 ? (
            <div className="py-20 text-center font-bold text-slate-300 italic uppercase text-[10px] tracking-widest">
              Aucun tiers trouvé
            </div>
          ) : (
            <table className="w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
                  <th className="px-6 pb-4">Entité / Raison Sociale</th>
                  <th className="px-6 pb-4">Nature</th>
                  <th className="px-6 pb-4">SIRET / INSEE</th>
                  <th className="px-6 pb-4">Dossiers</th>
                  <th className="px-6 pb-4">Code SEDIT</th>
                  <th className="px-6 pb-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTiers.map((t) => (
                  <tr key={t.id} className="group transition-all hover:bg-slate-50/50">
                    <td className="px-5 py-3 rounded-l-xl border-y border-l border-slate-100 bg-white group-hover:border-blue-200">
                      <div className="flex items-center gap-3">
                        <Link 
                          href={`/dashboard/tiers/${t.id}`}
                          className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"
                        >
                          <Building2 size={20} />
                        </Link>
                        <div>
                          <Link 
                            href={`/dashboard/tiers/${t.id}`}
                            className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase flex items-center gap-2"
                          >
                            {t.nom}
                            {t.etatAdministratif === 'Cessée' && (
                              <div className="flex items-center gap-1 bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-lg border border-rose-100 animate-pulse">
                                <AlertTriangle size={10} />
                                <span className="text-[7px] font-black uppercase tracking-widest">Fermé</span>
                              </div>
                            )}
                            {t.etatAdministratif === 'Actif' && (
                              <ShieldCheck size={12} className="text-emerald-500" />
                            )}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                             {t.latitude && t.longitude && (
                               <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100 shrink-0">
                                 <MapPin size={8} className="fill-emerald-600" />
                                 <span className="text-[7px] font-black uppercase tracking-widest">Localisé</span>
                                </div>
                             )}
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate max-w-xs">{t.adresse || 'ADRESSE NON RENSEIGNÉE'}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-y border-slate-100 bg-white group-hover:border-blue-200">
                       <span className="text-[10px] font-black text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 italic">
                         {getNatureJuridiqueLabel(t.natureJuridique)}
                       </span>
                    </td>
                     <td className="px-6 py-5 border-y border-slate-100 bg-white group-hover:border-blue-200">
                      <div className="flex items-center gap-2 bg-slate-100 w-fit px-3 py-1 rounded-lg text-[11px] font-mono font-bold text-slate-500">
                        <Fingerprint size={12} />
                        {t.siret || 'SANS SIRET'}
                      </div>
                    </td>
                     <td className="px-6 py-5 border-y border-slate-100 bg-white group-hover:border-blue-200 text-center">
                        <Link 
                          href={`/dashboard/occupations?tiersId=${t.id}`}
                          className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                           <List size={14} />
                           <span className="text-sm font-black">{t._count?.occupations || 0}</span>
                        </Link>
                     </td>
                     <td className="px-6 py-5 border-y border-slate-100 bg-white group-hover:border-blue-200">
                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{t.code_sedit || 'À DÉFINIR'}</span>
                     </td>
                    <td className="px-5 py-3 rounded-r-xl border-y border-r border-slate-100 bg-white group-hover:border-blue-200">
                      <div className="flex items-center justify-end gap-1 text-right">
                        <button 
                          onClick={() => handleSeditCreationRequest(t)}
                          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 border border-slate-200"
                          title="Saisir Code SEDIT"
                        >
                          <SearchCode size={14} className="text-blue-600" />
                          Sedit
                        </button>
                        <Link 
                          href={`/dashboard/tiers/${t.id}`}
                          className="p-2.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Détail & Contacts"
                        >
                          <ExternalLink size={20} />
                        </Link>
                        <button 
                          onClick={() => handleStreetView(t)}
                          className="p-2.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Street View"
                        >
                          <Camera size={20} />
                        </button>
                        <button 
                          onClick={() => handleEdit(t)}
                          className="p-2.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Modifier"
                        >
                          <Pencil size={20} />
                        </button>
                        <button 
                          onClick={() => handleDelete(t.id, t.nom)}
                          className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Supprimer"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION CONTROLS */}
        {!loading && filteredTiers.length > itemsPerPage && (
          <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Page {currentPage} sur {totalPages} ({filteredTiers.length} items)
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                   let pageNum = i + 1;
                   if (totalPages > 5 && currentPage > 3) {
                     pageNum = currentPage - 3 + i;
                     if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                   }
                   if (pageNum <= 0) return null;
                   if (pageNum > totalPages) return null;

                   return (
                    <button 
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${
                        currentPage === pageNum 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                   );
                })}
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      <TiersModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        submitting={submitting}
        handleSubmit={handleSubmit}
        handleSiretSearch={handleSiretSearch}
        isEditing={isEditing}
      />
      
      {/* VERIFICATION PROGRESS OVERLAY */}
      {isVerifying && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></div>
           <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 border border-white">
              <div className="text-center space-y-8">
                  <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto animate-pulse">
                      <ShieldCheck size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-3">Vérification Sirene en cours</h3>
                    <p className="text-sm font-medium text-slate-500">Analyse de la conformité administrative</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <span>Progression</span>
                       <span className="text-blue-600">{verifyProgress}%</span>
                    </div>
                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-1 border border-slate-200">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500 ease-out shadow-sm"
                          style={{ width: `${verifyProgress}%` }}
                        ></div>
                    </div>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] animate-pulse">
                        {currentVerifying}
                    </p>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* IMPORT RESULTS MODAL */}
      {isImportModalOpen && importResults && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setIsImportModalOpen(false)}></div>
           <div className="bg-white w-full max-w-4xl rounded-[3.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[85vh] border border-white">
              
              <div className="relative p-10 bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                       <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.3em] mb-2">Synchronisation terminée</p>
                       <h3 className="text-3xl font-black tracking-tight leading-none">Rapport d'Importation SEDIT</h3>
                    </div>
                    <button onClick={() => setIsImportModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-md transition-all active:scale-90">
                       <X size={24} />
                    </button>
                  </div>
              </div>

              <div className="p-10 overflow-y-auto space-y-10 text-slate-900">
                  <div className="grid grid-cols-4 gap-6">
                      <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] text-center">
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Nouveaux</p>
                          <p className="text-4xl font-black text-emerald-700 leading-none">{importResults.stats.new}</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 p-6 rounded-[2rem] text-center">
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Mis à jour</p>
                          <p className="text-4xl font-black text-blue-700 leading-none">{importResults.stats.updated}</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inchangés</p>
                          <p className="text-4xl font-black text-slate-600 leading-none">{importResults.stats.unchanged}</p>
                      </div>
                      <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] text-center">
                          <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Erreurs</p>
                          <p className="text-4xl font-black text-rose-700 leading-none">{importResults.stats.errors}</p>
                      </div>
                  </div>

                  {importResults.details.filter((d:any) => d.type !== 'UNCHANGED').length > 0 && (
                      <div className="space-y-4">
                          <div className="flex items-center gap-3 px-2">
                             <FileSpreadsheet size={18} className="text-slate-400" />
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Détails des modifications</h4>
                          </div>
                          <div className="space-y-3 max-h-96 overflow-y-auto pr-4 scrollbar-hide">
                              {importResults.details.map((d: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-blue-200 transition-all text-slate-900">
                                   <div className="flex items-center gap-4">
                                      {d.type === 'NEW' ? (
                                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-black text-[10px]">NEW</div>
                                      ) : (
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black text-[10px]">UPD</div>
                                      )}
                                      <div>
                                         <p className="font-bold text-slate-900">{d.nom}</p>
                                         {d.changes && (
                                           <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                              {Object.keys(d.changes).map(field => (
                                                <span key={field} className="text-[9px] font-black text-slate-400 uppercase italic">
                                                   {field} mis à jour
                                                </span>
                                              ))}
                                           </div>
                                         )}
                                      </div>
                                   </div>
                                   <Check className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                                </div>
                              ))}
                          </div>
                      </div>
                  )}

                  <div className="pt-6 border-t border-slate-100">
                    <button 
                      onClick={() => setIsImportModalOpen(false)}
                      className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
                    >
                      Fermer le rapport
                    </button>
                  </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
