"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Save, CheckCircle2, AlertCircle } from 'lucide-react';

const TYPES_DOSSIER = ['COMMERCE', 'CHANTIER', 'TOURNAGE', 'TLPE'];

export default function FilienTypeConfigs() {
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [gabarits, setGabarits] = useState<any[]>([]);
  const [activeType, setActiveType] = useState('COMMERCE');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      axios.get('/api/settings/type-dossier-configs'),
      axios.get('/api/gabarits')
    ]).then(([configsRes, gabaritsRes]) => {
      const configMap = configsRes.data.reduce((acc: any, curr: any) => ({ ...acc, [curr.type]: curr }), {});
      // Ensure all types have an entry
      TYPES_DOSSIER.forEach(t => {
        if (!configMap[t]) {
          configMap[t] = { 
            type: t, 
            invoiceTemplateId: '', 
            filienObjet: '',
            filienChapitre: '', 
            filienNature: '', 
            filienFonction: '', 
            filienCodeInterne: '',
            filienTypeMouvement: '',
            filienSens: '',
            filienStructure: '',
            filienGestionnaire: '',
            filienPreBordereau: ''
          };
        }
      });
      setConfigs(configMap);
      setGabarits(gabaritsRes.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des configurations. Veuillez contacter le support.' });
      setLoading(false);
    });
  }, []);

  const handleChange = (field: string, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [activeType]: {
        ...prev[activeType],
        [field]: value
      }
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await axios.post('/api/settings/type-dossier-configs', { configs: Object.values(configs) });
      setMessage({ type: 'success', text: 'Configurations par type enregistrées' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  const currentConfig = configs[activeType] || {
    type: activeType,
    invoiceTemplateId: '',
    filienObjet: '',
    filienChapitre: '',
    filienNature: '',
    filienFonction: '',
    filienCodeInterne: '',
    filienTypeMouvement: '',
    filienSens: '',
    filienStructure: '',
    filienGestionnaire: '',
    filienPreBordereau: ''
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 overflow-x-auto">
        {TYPES_DOSSIER.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveType(t)}
            className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeType === t ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Modèle de facture</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none focus:border-indigo-500 transition-all font-bold text-sm"
              value={currentConfig.invoiceTemplateId || ''}
              onChange={e => handleChange('invoiceTemplateId', e.target.value)}
            >
              <option value="">-- Défaut global --</option>
              {Array.isArray(gabarits) && gabarits.map(g => (
                <option key={g.id} value={g.id.toString()}>{g.nom} {g.isDefault ? '(Défaut)' : ''}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Objet du Mouvement (/04/)</label>
            <input 
              type="text" 
              maxLength={40}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none focus:border-indigo-500 transition-all font-bold text-sm"
              placeholder="Utiliser le global si vide"
              value={currentConfig.filienObjet || ''}
              onChange={e => handleChange('filienObjet', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">N° de pré-bordereau (/11/)</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none focus:border-indigo-500 transition-all font-bold text-sm"
              placeholder="Utiliser le global si vide"
              value={currentConfig.filienPreBordereau || ''}
              onChange={e => handleChange('filienPreBordereau', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-6 pt-6 border-t border-slate-100">
          <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Ventilation Analytique</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500">Chapitre</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 font-bold text-sm outline-none focus:border-indigo-500" value={currentConfig.filienChapitre || ''} onChange={e => handleChange('filienChapitre', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500">Nature</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 font-bold text-sm outline-none focus:border-indigo-500" value={currentConfig.filienNature || ''} onChange={e => handleChange('filienNature', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500">Fonction</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 font-bold text-sm outline-none focus:border-indigo-500" value={currentConfig.filienFonction || ''} onChange={e => handleChange('filienFonction', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500">Code Interne</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 font-bold text-sm outline-none focus:border-indigo-500" value={currentConfig.filienCodeInterne || ''} onChange={e => handleChange('filienCodeInterne', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500">Type Mvt</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 font-bold text-sm outline-none focus:border-indigo-500" value={currentConfig.filienTypeMouvement || ''} onChange={e => handleChange('filienTypeMouvement', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500">Sens</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 font-bold text-sm outline-none focus:border-indigo-500" value={currentConfig.filienSens || ''} onChange={e => handleChange('filienSens', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500">Structure</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 font-bold text-sm outline-none focus:border-indigo-500" value={currentConfig.filienStructure || ''} onChange={e => handleChange('filienStructure', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-indigo-600">Gestionnaire (/542/)</label>
              <input type="text" className="w-full bg-indigo-50 border border-indigo-100 rounded-xl py-3 px-4 font-bold text-sm text-indigo-700 outline-none focus:border-indigo-500" value={currentConfig.filienGestionnaire || ''} onChange={e => handleChange('filienGestionnaire', e.target.value)} />
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl shadow-sm border flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="font-bold text-sm">{message.text}</span>
          </div>
        )}

        <button 
          type="button" 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-black shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-xs uppercase tracking-widest"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Enregistrer toutes les configurations
        </button>
      </div>
    </div>
  );
}
