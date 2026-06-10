import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, CheckCircle2, Loader2, FileText, Calendar, Camera, MapPin, Upload } from 'lucide-react';

interface OdpDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OdpDocsModal({ isOpen, onClose, onSuccess }: OdpDocsModalProps) {
  const [annee, setAnnee] = useState(new Date().getFullYear().toString());
  const [availableConfigs, setAvailableConfigs] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newAnnee, setNewAnnee] = useState((new Date().getFullYear() + 1).toString());
  const [submitting, setSubmitting] = useState(false);
  
  const [deliberationFile, setDeliberationFile] = useState<File | null>(null);
  const [tarifsTournagesFile, setTarifsTournagesFile] = useState<File | null>(null);
  const [tarifsOdpFile, setTarifsOdpFile] = useState<File | null>(null);
  const [existingConfig, setExistingConfig] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      axios.get('/api/settings/odp-docs').then(res => {
        const configs = res.data.configs || [];
        setAvailableConfigs(configs);
        if (configs.length > 0) {
          setAnnee(configs[0].annee.toString());
        } else {
          setIsCreating(true);
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isCreating && annee) {
      axios.get(`/api/settings/odp-docs?annee=${annee}`).then(res => {
        setExistingConfig(res.data.config);
      }).catch(() => {});
    }
  }, [annee, isOpen, isCreating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    let deliberationPath = existingConfig?.deliberationPath;
    let tarifsTournagesPath = existingConfig?.tarifsTournagesPath;
    let tarifsOdpPath = existingConfig?.tarifsOdpPath;

    try {
      const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await axios.post('/api/upload', formData);
        return res.data.url;
      };

      if (deliberationFile) deliberationPath = await uploadFile(deliberationFile);
      if (tarifsTournagesFile) tarifsTournagesPath = await uploadFile(tarifsTournagesFile);
      if (tarifsOdpFile) tarifsOdpPath = await uploadFile(tarifsOdpFile);

      await axios.post('/api/settings/odp-docs', {
        annee: isCreating ? parseInt(newAnnee) : parseInt(annee),
        deliberationPath: deliberationPath || null,
        tarifsTournagesPath: tarifsTournagesPath || null,
        tarifsOdpPath: tarifsOdpPath || null,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      alert("Erreur lors de l'enregistrement des documents");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-900/10">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Référentiels ODP & Tournages</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Gestion des délibérations et tarifs officiels</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
          {/* Year Selection Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex flex-col">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Calendar size={14} /> Année de référence
              </label>
              {isCreating ? (
                <input 
                  type="number" 
                  autoFocus
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 font-black text-xl outline-none focus:border-blue-500"
                  value={newAnnee}
                  onChange={e => setNewAnnee(e.target.value)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <select 
                    className="flex-1 bg-white border border-slate-200 rounded-xl p-3 font-black text-xl outline-none appearance-none cursor-pointer"
                    value={annee}
                    onChange={e => setAnnee(e.target.value)}
                  >
                    {availableConfigs.map(c => <option key={c.annee} value={c.annee}>{c.annee}</option>)}
                  </select>
                  <button 
                    type="button" 
                    onClick={() => setIsCreating(true)}
                    className="p-3 bg-white border border-slate-200 hover:border-slate-400 rounded-xl text-slate-600 font-bold text-xs"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-end pb-2">
               {isCreating && (
                 <button type="button" onClick={() => setIsCreating(false)} className="text-[10px] font-black text-slate-400 uppercase p-4 hover:text-slate-600">
                    Annuler l'initialisation
                 </button>
               )}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Documents Officiels (PDF)</h4>
            
            {/* Délibération ODP & Tournages */}
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} className="text-blue-500" /> Tournages et ODP : Délibération
               </label>
               <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 transition-all hover:border-slate-300 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-2 italic">
                       {deliberationFile ? deliberationFile.name : existingConfig?.deliberationPath ? 'Délibération actuelle : ' + existingConfig.deliberationPath.split('/').pop() : 'Cliquez pour sélectionner un PDF'}
                    </span>
                    <Upload size={16} className="text-slate-300" />
                  </div>
                  <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setDeliberationFile(e.target.files?.[0] || null)} />
               </div>
            </div>

            {/* Tarifs Tournages */}
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <Camera size={14} className="text-rose-500" /> Tournages : Tarifs
               </label>
               <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 transition-all hover:border-slate-300 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-2 italic">
                       {tarifsTournagesFile ? tarifsTournagesFile.name : existingConfig?.tarifsTournagesPath ? 'Tarifs actuels : ' + existingConfig.tarifsTournagesPath.split('/').pop() : 'Cliquez pour sélectionner un PDF'}
                    </span>
                    <Upload size={16} className="text-slate-300" />
                  </div>
                  <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setTarifsTournagesFile(e.target.files?.[0] || null)} />
               </div>
            </div>

            {/* Tarifs ODP */}
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14} className="text-emerald-500" /> ODP : Tarifs
               </label>
               <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 transition-all hover:border-slate-300 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-2 italic">
                       {tarifsOdpFile ? tarifsOdpFile.name : existingConfig?.tarifsOdpPath ? 'Tarifs actuels : ' + existingConfig.tarifsOdpPath.split('/').pop() : 'Cliquez pour sélectionner un PDF'}
                    </span>
                    <Upload size={16} className="text-slate-300" />
                  </div>
                  <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setTarifsOdpFile(e.target.files?.[0] || null)} />
               </div>
            </div>

          </div>

          <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 font-black text-slate-400 hover:bg-slate-50 rounded-2xl transition-all uppercase tracking-widest text-xs"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-3xl font-black shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              {isCreating ? 'Initialiser l\'année' : 'Sauvegarder les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
