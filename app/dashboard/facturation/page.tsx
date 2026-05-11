"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Euro, 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Loader2, 
  Package, 
  Download,
  FileBadge,
  AlertCircle,
  AlertTriangle,
  Check,
  Info,
  Calendar,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import FilienTab from '../settings/components/FilienTab';

export default function FacturationPage() {
  const [view, setView] = useState<'new' | 'history' | 'config'>('new');
  const [settings, setSettings] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const [step, setStep] = useState(1);
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  // État pour la modal d'avertissement du tiers
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [warningDossiers, setWarningDossiers] = useState<any[]>([]);
  const [warningAction, setWarningAction] = useState<() => void>(() => {});
  
  // État pour la modal d'erreur de configuration Filien
  const [isFilienErrorModalOpen, setIsFilienErrorModalOpen] = useState(false);
  const [filienErrorMessage, setFilienErrorMessage] = useState('');

  // Steps handling
  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  // Fetch verified dossiers when type is selected
  useEffect(() => {
    if (step === 2 && type && view === 'new') {
      fetchEligibleDossiers();
    }
  }, [step, type, view]);

  useEffect(() => {
    if (view === 'history') {
      fetchHistory();
    }
    if (view === 'config') {
      fetchSettings();
    }
  }, [view]);

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await axios.get('/api/settings');
      setSettings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await axios.patch('/api/settings', settings);
      setMessage({ type: 'success', text: 'Paramètres Filien enregistrés avec succès' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    } finally {
      setSaving(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get('/api/billing/history');
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteRun = async (id: string) => {
    if (!confirm("Attention : supprimer ce train de facturation annulera les factures associées et remettra les dossiers en état 'VÉRIFIÉ'. Souhaitez-vous continuer ?")) return;
    
    try {
      await axios.delete(`/api/billing/history?id=${id}`);
      fetchHistory();
    } catch (err: any) {
      setFilienErrorMessage(err.response?.data?.error || err.message || "Erreur lors de la suppression");
      setIsFilienErrorModalOpen(true);
    }
  };

  const fetchEligibleDossiers = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      if (type === 'COMMERCE') {
        // Fetch all commerce occupations and filter client-side to be precise
        const res = await axios.get(`/api/occupations?type=${type}`);
        data = (res.data || []).filter((occ: any) => 
          ['VERIFIE', 'VALIDE', 'VALIDÉ'].includes(occ.statut)
        );
      } else {
        const res = await axios.get(`/api/occupations?status=VERIFIE&type=${type}`);
        data = res.data;
      }

      if (type === 'COMMERCE') {
        const grouped = new Map();
        data.forEach((occ: any) => {
          if (!occ.tiers) return;
          const tId = occ.tiers.id;
          const isClosed = ['Fermée', 'Cessée'].includes(occ.tiers.etatAdministratif);
          
          if (!grouped.has(tId)) {
            grouped.set(tId, {
              id: tId,
              isCommerceGroup: true,
              isClosed: isClosed,
              nom: occ.tiers.nom, 
              tiers: occ.tiers,
              lignes: [...(occ.lignes || [])],
              montantCalcule: occ.montantCalcule || 0
            });
          } else {
            const g = grouped.get(tId);
            g.lignes.push(...(occ.lignes || []));
            g.montantCalcule += (occ.montantCalcule || 0);
            // Si une des occupations appartient à un tiers fermé, le groupe est marqué fermé
            if (isClosed) g.isClosed = true;
          }
        });
        data = Array.from(grouped.values());
      }

      setDossiers(data);
      setSelectedIds(data.map((d: any) => d.id));
    } catch (err: any) {
      console.error(err);
      setFilienErrorMessage(err.response?.data?.error || err.message || "Erreur lors de la récupération des dossiers");
      setIsFilienErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = dossiers
    .filter(d => selectedIds.includes(d.id))
    .reduce((sum, d) => sum + (d.montantCalcule || d.lignes?.reduce((s: number, l: any) => s + l.montant, 0) || 0), 0);

  const verifyTiersBeforeBilling = async (dossierId: number): Promise<boolean> => {
    try {
      const dossier = dossiers.find(d => d.id === dossierId);
      if (!dossier) return true;
      const tiersId = dossier.isCommerceGroup ? dossier.id : (dossier.tiers?.id);
      if (!tiersId) return true;
      const res = await axios.post(`/api/admin/verify-tiers/${tiersId}`);
      const status = res.data.status;

      if (status === 'Fermée' || status === 'Cessée') {
        return false;
      }
      return true;
    } catch (err) {
      return false;
    }
  };

  const handleStartBilling = async () => {
    setProcessing(true);
    try {
      const selectedDossiers = dossiers.filter(d => selectedIds.includes(d.id));
      const problematicDossiers = [];

      // Verify all tiers before generating invoices
      for (const dossier of selectedDossiers) {
        const isValid = await verifyTiersBeforeBilling(dossier.id);
        if (!isValid) {
          problematicDossiers.push(dossier);
        }
      }

      if (problematicDossiers.length > 0) {
        setWarningMessage(`${problematicDossiers.length} dossier(s) ont un tiers inexistant ou fermé.`);
        setWarningDossiers(problematicDossiers);
        setWarningAction(() => async () => {
          try {
            const res = await axios.post('/api/billing/process', {
              ids: selectedIds,
              type: type
            });
            setResult(res.data);
            setStep(4);
          } catch (err: any) {
            console.error('Billing error:', err);
            const errorText = err.response?.data?.error || err.message || "Erreur lors du processus de facturation";
            setFilienErrorMessage(errorText);
            setIsFilienErrorModalOpen(true);
          } finally {
            setProcessing(false);
          }
        });
        setIsWarningModalOpen(true);
        setProcessing(false);
        return;
      }

      const res = await axios.post('/api/billing/process', {
        ids: selectedIds,
        type: type
      });
      setResult(res.data);
      setStep(4);
    } catch (err: any) {
       const errorText = err.response?.data?.error || err.message || "Erreur lors du processus de facturation";
       setFilienErrorMessage(errorText);
       setIsFilienErrorModalOpen(true);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Processus de Facturation</h1>
          <p className="text-slate-500 font-bold mt-2">Générez et consultez vos factures en série</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
          <button 
             onClick={() => setView('new')} 
             className={`px-5 py-2.5 font-black text-xs uppercase tracking-widest rounded-xl transition-all ${view === 'new' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Nouveau Processus
          </button>
          <button 
             onClick={() => setView('history')} 
             className={`px-5 py-2.5 font-black text-xs uppercase tracking-widest rounded-xl transition-all ${view === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Historique des Trains
          </button>
          <button 
             onClick={() => setView('config')} 
             className={`px-5 py-2.5 font-black text-xs uppercase tracking-widest rounded-xl transition-all ${view === 'config' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Paramétrage Filien
          </button>
        </div>
      </div>

      {view === 'history' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col p-8 md:p-12">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Historique des Traitements</h2>
          
          {loadingHistory ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
          ) : history.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
              <FileBadge size={48} className="opacity-20" />
              <p className="font-bold uppercase tracking-widest text-[10px]">Aucun historique disponible</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[60vh]">
              {history.map(run => (
                <div key={run.id} className="border border-slate-100 rounded-xl overflow-hidden transition-all hover:border-blue-200 shrink-0">
                  <div 
                    onClick={() => setExpandedHistory(expandedHistory === run.id ? null : run.id)}
                    className="p-6 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex shrink-0 items-center justify-center">
                        <FileBadge size={20} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">{run.type}</h3>
                          <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <Calendar size={12}/> {run.date}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          {run.count} factures générées
                        </p>
                      </div>
                    </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total TTC</p>
                          <p className="text-lg font-black text-slate-900">{run.total.toLocaleString('fr-FR', {minimumFractionDigits: 2})} €</p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteRun(run.id); }}
                          className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Supprimer ce train"
                        >
                          <Trash2 size={18} />
                        </button>
                        <div className="text-slate-400">
                          {expandedHistory === run.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                        </div>
                      </div>
                  </div>
                  
                  {expandedHistory === run.id && (
                    <div className="p-6 border-t border-slate-100 bg-white">
                      <div className="flex flex-wrap gap-4 mb-6">
                        <a href={run.recapPath || run.recapPdf} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold text-xs transition-colors">
                          <Download size={14}/> PDF File Recapitulatif
                        </a>
                        <a href={run.filienPath} download className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl font-bold text-xs transition-colors">
                          <Download size={14}/> CSV .filien généré
                        </a>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Détail des factures ({run.invoices?.length || 0})</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {run.invoices?.map((inv: any) => (
                            <a href={inv.pdfPath || inv.pdf} target="_blank" key={inv.numero} className="flex items-center justify-between p-3 border border-slate-100 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all group">
                              <div>
                                <p className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors">{inv.numero}</p>
                                <p className="text-[10px] font-bold text-slate-400 truncate max-w-[140px] uppercase">{inv.tiers}</p>
                              </div>
                              <div className="text-right flex flex-col items-end">
                                <span className="text-xs font-bold text-slate-600 mb-1">{inv.total.toLocaleString('fr-FR')} €</span>
                                <div className="w-6 h-6 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600">
                                  <FileText size={12}/>
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : view === 'config' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           {loadingSettings ? (
            <div className="py-20 text-center flex flex-col items-center gap-6">
              <Loader2 className="animate-spin text-indigo-600" size={48} />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Chargement des paramètres...</p>
            </div>
           ) : (
            <FilienTab 
              settings={settings} 
              setSettings={setSettings} 
              handleSubmit={handleSettingsSubmit} 
              saving={saving} 
              message={message} 
            />
           )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-start md:justify-end gap-2">
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${
                  step === i ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 
                  step > i ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > i ? <Check size={18} /> : i}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
          {/* Step 1: Type Selection */}
          {step === 1 && (
            <div className="p-12 space-y-10 flex-1 flex flex-col justify-center items-center text-center">
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Choisissez le type de dossiers</h2>
                <p className="text-slate-400 font-bold max-w-md">La facturation groupée s'effectue par type d'occupation du domaine public.</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-4xl">
                {[
                  { id: 'CHANTIER', label: 'Chantiers', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { id: 'COMMERCE', label: 'Commerces', icon: Euro, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { id: 'TOURNAGE', label: 'Tournages', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { id: 'TLPE', label: 'TLPE', icon: FileBadge, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setType(t.id); nextStep(); }}
                    className="group p-8 rounded-xl border-2 border-slate-100 hover:border-blue-500 transition-all hover:bg-slate-50 flex flex-col items-center gap-4 text-center"
                  >
                    <div className={`w-16 h-16 rounded-xl ${t.bg} ${t.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <t.icon size={32} />
                    </div>
                    <span className="font-black uppercase tracking-widest text-xs text-slate-900">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Selection of eligible dossiers */}
          {step === 2 && (
            <div className="flex-1 flex flex-col">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Dossiers éligibles ({type})</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    État: VÉRIFIÉ / VALIDÉ ({dossiers.length} groupés)
                  </p>
                </div>
                {dossiers.some(d => d.isClosed) && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 px-4 py-2 rounded-xl text-red-600 animate-pulse">
                    <AlertTriangle size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Attention: Commerces fermés détectés</span>
                  </div>
                )}
                <div className="sm:text-right">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Montant du train</p>
                  <p className="text-2xl font-black text-blue-700">{totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[400px]">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                  </div>
                ) : dossiers.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 mt-20">
                    <AlertCircle size={48} className="opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">Aucun dossier vérifié pour ce type</p>
                    <button onClick={prevStep} className="text-blue-600 font-black text-[10px] uppercase hover:underline">Changer de type</button>
                  </div>
                ) : (
                  <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr>
                        <th className="px-8 py-4 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.length === dossiers.length}
                            onChange={(e) => setSelectedIds(e.target.checked ? dossiers.map(d => d.id) : [])}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-8 py-4 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dossier</th>
                        <th className="px-8 py-4 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiers</th>
                        <th className="px-8 py-4 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dossiers.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-4 border-b border-slate-50">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.includes(d.id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedIds([...selectedIds, d.id]);
                                else setSelectedIds(selectedIds.filter(id => id !== d.id));
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-8 py-4 border-b border-slate-50">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-black text-slate-900">{d.nom || `Dossier #${d.id}`}</p>
                              {d.isClosed && (
                                <div className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[8px] font-black uppercase tracking-tighter flex items-center gap-1">
                                  <AlertCircle size={10} /> Fermé
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID {d.id}</p>
                          </td>
                          <td className="px-8 py-4 border-b border-slate-50 text-sm font-bold text-slate-600">
                            {d.tiers.nom}
                          </td>
                          <td className="px-8 py-4 border-b border-slate-50 text-sm font-black text-slate-900 text-right">
                            {(d.montantCalcule || d.lignes?.reduce((s: number, l: any) => s + l.montant, 0) || 0).toLocaleString('fr-FR')} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex justify-between gap-4">
                <button onClick={prevStep} className="px-10 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all flex items-center gap-2">
                  <ChevronLeft size={16} /> Retour
                </button>
                <button 
                  disabled={selectedIds.length === 0}
                  onClick={nextStep}
                  className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-30 flex items-center gap-2"
                >
                  Suivant <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Recap & Validation */}
          {step === 3 && (
            <div className="p-12 space-y-10 flex-1 flex flex-col">
               <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Récapitulatif avant émission</h2>
                  <p className="text-slate-400 font-bold">Vérifiez les informations ci-dessous avant de lancer la génération des fichiers.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                     <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Nombre de dossiers</p>
                     <p className="text-3xl font-black text-blue-700">{selectedIds.length}</p>
                  </div>
                  <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                     <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total TTC</p>
                     <p className="text-3xl font-black text-emerald-700">{totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Année</p>
                     <p className="text-3xl font-black text-slate-700">{new Date().getFullYear()}</p>
                  </div>
               </div>

               <div className="border border-slate-100 rounded-3xl overflow-hidden flex-1">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dossier</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre d'articles</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dossiers.filter(d => selectedIds.includes(d.id)).map(d => (
                        <tr key={d.id} className="border-t border-slate-50">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">{d.nom || `Dossier #${d.id}`}</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500">{d.lignes?.length || 0} articles</td>
                          <td className="px-6 py-4 text-sm font-black text-slate-900 text-right">
                            {(d.montantCalcule || d.lignes?.reduce((s: number, l: any) => s + l.montant, 0) || 0).toLocaleString('fr-FR')} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>

               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <button onClick={prevStep} className="px-10 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all shrink-0">
                     Retour
                  </button>
                  <div className="flex gap-4">
                    <button 
                      onClick={handleStartBilling}
                      disabled={processing}
                      className="w-full sm:w-auto px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 flex justify-center items-center gap-3 shrink-0"
                    >
                      {processing ? <Loader2 className="animate-spin" size={16} /> : <FileBadge size={16} />}
                      {processing ? 'Génération en cours...' : 'Lancer la facturation'}
                    </button>
                  </div>
               </div>
            </div>
          )}

          {/* Step 4: Finished */}
          {step === 4 && result && (
            <div className="p-12 space-y-12 flex-1 flex flex-col justify-center items-center text-center">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center animate-bounce">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900">Facturation Réussie !</h2>
                <p className="text-slate-400 font-bold">Le train de facturation a été traité avec succès.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                <a 
                  href={result.recapPdf} 
                  target="_blank"
                  className="p-6 bg-white border border-slate-200 rounded-[2rem] hover:border-blue-500 hover:bg-blue-50/50 transition-all flex flex-col items-center gap-3 text-center"
                >
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Download size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recap PDF</p>
                    <p className="text-sm font-black text-slate-900 truncate max-w-[200px]">{result.recapPdf.split('/').pop()}</p>
                  </div>
                </a>
                <a 
                  href={result.filienPath} 
                  download
                  className="p-6 bg-white border border-slate-200 rounded-[2rem] hover:border-amber-500 hover:bg-amber-50/50 transition-all flex flex-col items-center gap-3 text-center"
                >
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                    <Download size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fichier .filien</p>
                    <p className="text-sm font-black text-slate-900 truncate max-w-[200px]">{result.filienPath.split('/').pop()}</p>
                  </div>
                </a>
              </div>

              {result.invoices && (
                <div className="w-full max-w-2xl border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Factures Individuelles</h3>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {result.invoices.map((inv: any) => (
                      <div key={inv.numero} className="flex items-center justify-between px-6 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <div className="text-left">
                          <p className="text-xs font-black text-slate-900">{inv.numero}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inv.tiers}</p>
                        </div>
                        <a href={inv.path} target="_blank" className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                          <FileText size={16} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 w-full max-w-2xl text-left">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Info size={14} /> Statistiques
                </h4>
                <div className="flex justify-between border-b border-slate-200 pb-3 mb-3">
                  <span className="text-sm font-bold text-slate-600">Factures générées</span>
                  <span className="text-sm font-black text-slate-900">{result.count}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-3 mb-3">
                  <span className="text-sm font-bold text-slate-600">Montant total</span>
                  <span className="text-sm font-black text-slate-900">{result.total.toLocaleString('fr-FR')} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-slate-600">Dossiers mis à jour</span>
                  <span className="text-sm font-black text-emerald-600">{result.count}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                <button 
                  onClick={() => { setStep(1); setResult(null); setSelectedIds([]); setDossiers([]); }}
                  className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline"
                >
                  Lancer une nouvelle facturation
                </button>
                <button 
                  onClick={() => setView('history')}
                  className="text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors"
                >
                  Voir l'historique
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {isWarningModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in scale-in duration-300 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-amber-600" size={24} />
              <h2 className="text-lg font-black text-slate-900">Avertissement</h2>
            </div>

            <div className="mb-6">
              <p className="text-sm text-slate-700 mb-4">
                {warningMessage}
              </p>
              {warningDossiers.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2">Dossiers affectés :</p>
                  <ul className="space-y-1">
                    {warningDossiers.map((d) => (
                      <li key={d.id} className="text-xs text-amber-700">
                        • {d.nom}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-slate-600">
                Voulez-vous continuer malgré tout ?
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

      {isFilienErrorModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full p-10 animate-in zoom-in duration-300 border border-rose-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                <AlertTriangle size={40} />
              </div>
              
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Configuration Incomplète</h2>
              <p className="text-slate-500 font-bold mb-8">
                L'export Filien ne peut pas être généré car des documents réglementaires obligatoires sont manquants.
              </p>

              <div className="w-full bg-rose-50 border border-rose-100 rounded-3xl p-6 mb-8 text-left">
                <div className="flex items-start gap-3">
                  <Info className="text-rose-600 mt-0.5 shrink-0" size={16} />
                  <p className="text-sm font-bold text-rose-800 leading-relaxed">
                    {filienErrorMessage}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <button
                  onClick={() => setIsFilienErrorModalOpen(false)}
                  className="px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setIsFilienErrorModalOpen(false);
                    setView('config');
                  }}
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                >
                  Régler les paramètres
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
