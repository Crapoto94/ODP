"use client";

import { useState, useEffect } from 'react';
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
  ArrowRight
} from 'lucide-react';

interface Tiers {
  id: number;
  nom: string;
  siret: string | null;
  email: string;
  adresse: string | null;
  code_sedit: string | null;
  created_at: string;
}

export default function TiersPage() {
  const [tiers, setTiers] = useState<Tiers[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    id: null as number | null,
    nom: '',
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
    if (!formData.siret) return;
    const cleanSiret = formData.siret.replace(/\s+/g, '');
    setSubmitting(true);
    try {
      const res = await axios.get(`/api/tiers/search?siret=${cleanSiret}`);
      const data = res.data;
      setFormData({
        ...formData,
        nom: data.nom,
        adresse: data.adresse,
        siret: data.siret // Updated to clean version
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
    if (!confirm(`Envoyer une demande de création SEDIT pour "${t.nom}" ?`)) return;
    setSubmitting(true);
    try {
      await axios.post('/api/tiers', { 
        ...t, 
        id: t.id, // Ensure ID is passed
        isSeditRequest: true 
      });
      alert("Demande envoyée avec succès aux Finances.");
      fetchTiers();
    } catch (err: any) {
      alert("Erreur lors de l'envoi de la demande.");
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

  const handleEdit = (t: Tiers) => {
    setFormData({
      id: t.id,
      nom: t.nom,
      siret: t.siret || '',
      email: t.email || '',
      adresse: t.adresse || '',
      code_sedit: t.code_sedit || '',
      isRhRequest: false
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ id: null, nom: '', siret: '', email: '', adresse: '', code_sedit: '', isRhRequest: false });
  };

  const filteredTiers = tiers.filter(t => 
    t.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.siret?.includes(searchTerm) ||
    t.code_sedit?.includes(searchTerm)
  );


  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight tracking-tighter">Gestion des Tiers</h2>
          <p className="text-slate-500 font-medium tracking-wide">Référentiel des bénéficiaires et entreprises</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-2xl shadow-slate-900/20"
          >
            <Plus size={20} />
            Créer un Tiers
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher par nom, SIRET ou code SEDIT..." 
              className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-semibold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-xs font-black uppercase tracking-widest">
            <span>{filteredTiers.length} RESULTATS</span>
          </div>
        </div>

        <div className="p-4 overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Récupération des données...</p>
            </div>
          ) : filteredTiers.length === 0 ? (
            <div className="py-20 text-center font-bold text-slate-300 italic uppercase text-[10px] tracking-widest">
              Aucun tiers trouvé
            </div>
          ) : (
            <table className="w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
                  <th className="px-6 pb-4">Entité / Raison Sociale</th>
                   <th className="px-6 pb-4">SIRET / INSEE</th>
                   <th className="px-6 pb-4">Statut</th>
                   <th className="px-6 pb-4">Code SEDIT</th>
                  <th className="px-6 pb-4">Contact</th>
                  <th className="px-6 pb-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTiers.map((t) => (
                  <tr key={t.id} className="group transition-all hover:-translate-y-1">
                    <td className="px-6 py-5 rounded-l-3xl border-y border-l border-slate-100 bg-white group-hover:border-blue-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <Building2 size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{t.nom}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate max-w-xs">{t.adresse || 'ADRESSE NON RENSEIGNÉE'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-y border-slate-100 bg-white group-hover:border-blue-200">
                      <div className="flex items-center gap-2 bg-slate-100 w-fit px-3 py-1 rounded-lg text-[11px] font-mono font-bold text-slate-500">
                        <Fingerprint size={12} />
                        {t.siret || 'SANS SIRET'}
                      </div>
                    </td>
                     <td className="px-6 py-5 border-y border-slate-100 bg-white group-hover:border-blue-200">
                        <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${(t as any).statut === 'DEFINITIF' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                           <span className={`text-[10px] font-black uppercase ${(t as any).statut === 'DEFINITIF' ? 'text-emerald-600' : 'text-amber-600'}`}>
                             {(t as any).statut || 'PROVISOIRE'}
                           </span>
                        </div>
                     </td>
                     <td className="px-6 py-5 border-y border-slate-100 bg-white group-hover:border-blue-200">
                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{t.code_sedit || 'À DÉFINIR'}</span>
                     </td>
                    <td className="px-6 py-5 border-y border-slate-100 bg-white group-hover:border-blue-200">
                       <div className="flex items-center gap-2 text-slate-600">
                          <Mail size={14} className="text-slate-300" />
                          <span className="text-xs font-bold">{t.email || '-'}</span>
                       </div>
                    </td>
                     <td className="px-6 py-5 rounded-r-3xl border-y border-r border-slate-100 bg-white text-right group-hover:border-blue-200">
                       <div className="flex items-center justify-end gap-2 text-right">
                         {(t as any).statut !== 'DEFINITIF' && (
                           <button 
                             onClick={() => handleSeditCreationRequest(t)}
                             className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95"
                             title="Demander création SEDIT"
                           >
                             <SearchCode size={14} />
                             Création SEDIT
                           </button>
                         )}
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
      </div>

      {/* NEW TIERS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {isEditing ? 'Modifier le Tiers' : 'Nouveau Tiers'}
                </h3>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  {isEditing ? `ID # ${formData.id}` : 'Saisie manuelle ou via SIRET'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 hover:bg-white rounded-2xl text-slate-300 hover:text-slate-900 transition-all shadow-sm"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 overflow-y-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Recherche SIRET (INSEE)</label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold text-lg tracking-tight"
                        placeholder="Ex: 954 509..."
                        value={formData.siret}
                        onChange={e => setFormData({...formData, siret: e.target.value})}
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={handleSiretSearch}
                      disabled={submitting || !formData.siret}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 group disabled:opacity-50"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <SearchCode size={18} className="group-hover:rotate-12 transition-transform" />}
                      Rechercher
                    </button>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 italic ml-1">Format libre accepté. Recherche en temps réel sur l'API Sirene.</p>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Raison Sociale / Nom Complet</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" 
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold text-lg"
                      placeholder="Ex: SARL La Terrasse"
                      value={formData.nom}
                      onChange={e => setFormData({...formData, nom: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email de contact (Optionnel)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="email" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold"
                      placeholder="contact@entreprise.fr"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Code SEDIT (Optionnel)</label>
                  <div className="relative">
                    <SearchCode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold"
                      placeholder="Identifiant financier"
                      value={formData.code_sedit}
                      onChange={e => setFormData({...formData, code_sedit: e.target.value})}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Siège Social / Adresse</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold"
                      placeholder="Ex: 12 Rue de la République"
                      value={formData.adresse}
                      onChange={e => setFormData({...formData, adresse: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pt-8 border-t border-slate-50">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-5 font-black text-slate-400 hover:bg-slate-50 rounded-2xl transition-all uppercase tracking-widest text-xs"
                >
                  Annuler
                </button>
                <div className="flex-1 flex gap-3">
                  {isEditing && (formData as any)?.statut !== 'DEFINITIF' && (
                    <button 
                      type="button"
                      onClick={(e) => handleSubmit(e as any, true)}
                      disabled={submitting}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-5 rounded-3xl font-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] border border-blue-200"
                    >
                       Création SEDIT
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-3xl font-black shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                    {isEditing ? 'Enregistrer les modifications' : 'Enregistrer le Tiers'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
