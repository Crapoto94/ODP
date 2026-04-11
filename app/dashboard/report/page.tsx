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
  FileBadge,
  AlertCircle,
  Check,
  CalendarDays,
  CopyPlus,
  Wrench
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReportAnneePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [type, setType] = useState('');
  
  const currentYear = new Date().getFullYear();
  const [fromYear, setFromYear] = useState<number>(currentYear - 1);
  const [toYear, setToYear] = useState<number>(currentYear);

  const [loadingEligible, setLoadingEligible] = useState(false);
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  const [checkingTariffs, setCheckingTariffs] = useState(false);
  const [tariffError, setTariffError] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // Fixed specific article quickly
  const [fixingArticleId, setFixingArticleId] = useState<number | null>(null);

  // Steps handling
  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => {
    if (step === 4) setTariffError(false); // Reset tariff error when going back
    setStep(s => s - 1);
  };

  const handleYearSubmit = async () => {
    // Before moving to step 4, we must check if any tariffs exist for 'toYear'
    setCheckingTariffs(true);
    setTariffError(false);
    try {
      // Just fetch eligible dossiers first to see if anything to check
      setLoadingEligible(true);
      const res = await axios.get(`/api/occupations?status=FACTURE&type=${type}&anneeTaxation=${fromYear}`);
      const data = res.data;
      setDossiers(data);
      setSelectedIds(data.map((d: any) => d.id));
      
      // We will rely on Step 4/Processing API to comprehensively check tariffs, 
      // but let's do a quick validation by checking if ANY tariffs exist for `toYear`
      const articlesRes = await axios.get(`/api/articles?annee=${toYear}`);
      if (articlesRes.data.length === 0) {
        setTariffError(true);
      } else {
        setStep(4);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la vérification");
    } finally {
      setCheckingTariffs(false);
      setLoadingEligible(false);
    }
  };

  const handleStartReport = async () => {
    setProcessing(true);
    try {
      const res = await axios.post('/api/report/process', {
        ids: selectedIds,
        fromYear,
        toYear,
        type
      });
      setResults(res.data.processed);
      setStep(5);
    } catch (err: any) {
      if (err.response?.data?.missingAll) {
         setTariffError(true);
         setStep(2); // kick back
      } else {
         alert(err.response?.data?.error || "Erreur système lors du report.");
      }
    } finally {
      setProcessing(false);
    }
  };

  const getDossierOriginal = (oldId: number) => {
    return dossiers.find(d => d.id === oldId);
  };

  const handleFixTariffs = async (oldId: number) => {
    const d = getDossierOriginal(oldId);
    if (!d) return;

    setFixingArticleId(oldId);
    try {
      // For each line, duplicate its article to toYear
      for (const line of d.lignes) {
         if (line.article) {
           await axios.post('/api/report/tarifs', {
             articleId: line.article.id,
             toYear
           });
         }
      }
      alert("Tarifs copiés avec succès pour ce dossier. Son état devra être mis à jour manuellement.");
      // Optimistically update the UI status
      setResults(results.map(r => r.oldId === oldId ? { ...r, status: 'EN_ATTENTE', hasError: false } : r));
    } catch (e) {
      alert("Erreur lors de la création des tarifs");
    } finally {
      setFixingArticleId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Report d'Année</h1>
        <p className="text-slate-500 font-bold mt-2">Reconduisez vos dossiers facturés vers une nouvelle année fiscale.</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-start md:justify-end gap-2">
          {[1, 2, 4, 5].map((i, index) => (
            <div 
              key={i} 
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${
                step === i ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 
                step > i ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {step > i ? <Check size={18} /> : (index + 1)}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
          
          {/* Step 1: Type Selection */}
          {step === 1 && (
            <div className="p-12 space-y-10 flex-1 flex flex-col justify-center items-center text-center">
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Sélectionnez le type d'occupation</h2>
                <p className="text-slate-400 font-bold max-w-md">Le report s'effectue en série par type de domaine.</p>
              </div>
              <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
                {[
                  { id: 'COMMERCE', label: 'Commerces', icon: Euro, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { id: 'TLPE', label: 'TLPE', icon: FileBadge, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setType(t.id); setStep(2); }}
                    className="group p-8 rounded-[2rem] border-2 border-slate-100 hover:border-blue-500 transition-all hover:bg-slate-50 flex flex-col items-center gap-4 text-center"
                  >
                    <div className={`w-16 h-16 rounded-[1.5rem] ${t.bg} ${t.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <t.icon size={32} />
                    </div>
                    <span className="font-black uppercase tracking-widest text-xs text-slate-900">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Year Selection */}
          {step === 2 && (
            <div className="p-12 space-y-10 flex-1 flex flex-col justify-center items-center text-center">
               <div className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Période du report</h2>
                <p className="text-slate-400 font-bold max-w-md">Définissez l'année d'origine (dossiers facturés) et l'année de destination.</p>
              </div>

              {tariffError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-3xl w-full max-w-2xl flex items-center gap-4 text-left">
                  <AlertCircle size={32} className="shrink-0 text-rose-500" />
                  <div>
                    <h3 className="font-black uppercase tracking-widest text-sm mb-1">Report impossible</h3>
                    <p className="font-bold text-sm">Aucun tarif n'est défini pour l'année de destination <strong>{toYear}</strong>. Veuillez d'abord créer ou importer vos tarifs pour cette année.</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-8 w-full max-w-2xl justify-center bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                 <div className="space-y-3 w-full text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                       <CalendarDays size={14}/> Depuis l'année
                    </label>
                    <input 
                      type="number" 
                      value={fromYear}
                      onChange={e => setFromYear(parseInt(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-5 outline-none focus:border-blue-500 transition-all font-black text-xl text-slate-700" 
                    />
                 </div>
                 
                 <div className="text-slate-300">
                   <ChevronRight size={32} />
                 </div>

                 <div className="space-y-3 w-full text-left">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                       <CalendarDays size={14}/> Vers l'année
                    </label>
                    <input 
                      type="number" 
                      value={toYear}
                      onChange={e => setToYear(parseInt(e.target.value))}
                      className="w-full bg-blue-50 border border-blue-200 rounded-2xl py-4 px-5 outline-none focus:border-blue-600 transition-all font-black text-xl text-blue-700" 
                    />
                 </div>
              </div>

              <div className="flex gap-4">
                 <button onClick={prevStep} className="px-8 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">
                    Retour
                 </button>
                 <button 
                   onClick={handleYearSubmit}
                   disabled={checkingTariffs}
                   className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                 >
                   {checkingTariffs ? <Loader2 className="animate-spin" size={16}/> : 'Valider'}
                 </button>
              </div>
            </div>
          )}

          {/* Step 4: Dossier Selection */}
          {step === 4 && (
            <div className="flex-1 flex flex-col">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Dossiers Facturés ({type} - {fromYear})</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sélectionnez les dossiers à reconduire vers {toYear}</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 font-black text-sm">
                  {selectedIds.length} sélectionné(s)
                </div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[400px]">
                {loadingEligible ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                  </div>
                ) : dossiers.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 mt-20">
                    <AlertCircle size={48} className="opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">Aucun dossier facturé pour {fromYear}</p>
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
                        <th className="px-8 py-4 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dossier Initial</th>
                        <th className="px-8 py-4 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiers</th>
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
                            <p className="text-sm font-black text-slate-900">{d.nom || `Dossier #${d.id}`}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Facture: {d.numeroFacture}</p>
                          </td>
                          <td className="px-8 py-4 border-b border-slate-50 text-sm font-bold text-slate-600">
                            {d.tiers?.nom}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex justify-between gap-4">
                <button onClick={() => setStep(2)} className="px-10 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all flex items-center gap-2">
                  <ChevronLeft size={16} /> Retour
                </button>
                <button 
                  disabled={selectedIds.length === 0 || processing}
                  onClick={handleStartReport}
                  className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-30 flex items-center gap-2"
                >
                  {processing ? <Loader2 className="animate-spin" size={16}/> : <CopyPlus size={16}/>} 
                  Exécuter le report
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Results */}
          {step === 5 && (
            <div className="p-12 space-y-10 flex-1 flex flex-col">
               <div className="space-y-4 text-center">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Traitement terminé</h2>
                  <p className="text-slate-400 font-bold max-w-md mx-auto">
                    Le report a été effectué. Vérifiez les statuts ci-dessous. Les dossiers marqués en erreur nécessitent la création des tarifs manquants.
                  </p>
               </div>

               <div className="border border-slate-100 rounded-3xl overflow-hidden flex-1 shadow-sm max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dossier {fromYear}</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nouveau Dossier {toYear}</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Statut & Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map(r => {
                        const original = getDossierOriginal(r.oldId);
                        return (
                          <tr key={r.newId} className={`border-t border-slate-50 ${r.hasError ? 'bg-rose-50/30' : ''}`}>
                            <td className="px-6 py-4">
                                <p className="text-sm font-bold text-slate-900">{original?.nom || `Dossier #${r.oldId}`}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{original?.tiers?.nom}</p>
                            </td>
                            <td className="px-6 py-4">
                                <span className="font-black text-blue-600 text-sm">#{r.newId}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {r.hasError ? (
                                <div className="flex flex-col items-end gap-2">
                                  <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    Erreur Tarif
                                  </span>
                                  <button 
                                    onClick={() => handleFixTariffs(r.oldId)}
                                    disabled={fixingArticleId === r.oldId}
                                    className="flex items-center gap-1 text-[10px] font-black text-rose-600 hover:text-rose-800 uppercase tracking-widest bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors"
                                  >
                                    {fixingArticleId === r.oldId ? <Loader2 size={12} className="animate-spin"/> : <Wrench size={12}/>}
                                    Générer Tarif {toYear}
                                  </button>
                                </div>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                  Créé (En attente)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
               </div>

               <div className="text-center pt-6 border-t border-slate-100">
                 <button 
                   onClick={() => router.push('/dashboard/occupations')}
                   className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline"
                 >
                   Aller à la liste des dossiers
                 </button>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
