"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Database, 
  Server, 
  Link, 
  Lock, 
  User, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Table,
  Zap
} from 'lucide-react';

export default function PostgresTab() {
  const [config, setConfig] = useState({
    host: '',
    port: 5432,
    database: '',
    schema: 'public',
    user: '',
    password: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [showTables, setShowTables] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/settings/postgres');
      if (res.data) setConfig(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await axios.post('/api/settings/postgres', config);
      setMessage({ type: 'success', text: 'Configuration enregistrée avec succès' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);
    setTables([]);
    try {
      const res = await axios.get('/api/settings/postgres/test');
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Connexion réussie !' });
        setTables(res.data.tables || []);
      } else {
        setMessage({ type: 'error', text: res.data.error || 'La connexion a échoué' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur technique de connexion' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement de la configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulaire de Configuration */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Database size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Identifiants PostgreSQL</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Paramètres de connexion à distance</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Hôte (Host)</label>
                <div className="relative group">
                  <Server className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={16} />
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                    placeholder="localhost ou IP"
                    value={config.host}
                    onChange={e => setConfig({...config, host: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Port</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm text-center"
                  value={config.port}
                  onChange={e => setConfig({...config, port: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Base de données</label>
                <div className="relative group">
                  <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={16} />
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                    placeholder="nom_db"
                    value={config.database}
                    onChange={e => setConfig({...config, database: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Schéma</label>
                <div className="relative group">
                  <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={16} />
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                    placeholder="public"
                    value={config.schema}
                    onChange={e => setConfig({...config, schema: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Utilisateur</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={16} />
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                    placeholder="postgres"
                    value={config.user}
                    onChange={e => setConfig({...config, user: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Mot de passe</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={16} />
                  <input 
                    type="password" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                    placeholder="••••••••"
                    value={config.password}
                    onChange={e => setConfig({...config, password: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-xl flex items-center gap-3 animate-in zoom-in-95 duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span className="font-bold text-[10px] uppercase tracking-widest">{message.text}</span>
              </div>
            )}

            <div className="flex gap-4">
              <button 
                type="submit" 
                disabled={saving || testing}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-black shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Enregistrer
              </button>
              <button 
                type="button"
                onClick={handleTest}
                disabled={saving || testing}
                className="flex-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 py-4 rounded-xl font-black shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
              >
                {testing ? <Loader2 size={16} className="animate-spin text-blue-600" /> : <Link size={16} className="text-blue-600" />}
                Tester la connexion
              </button>
            </div>
          </form>
        </div>

        {/* Exploration des Tables */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-emerald-50/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Table size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Exploration du Schéma</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tables disponibles dans "{config.schema}"</p>
              </div>
            </div>
            {tables.length > 0 && (
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-200">
                {tables.length} {tables.length > 1 ? 'tables' : 'table'}
              </span>
            )}
          </div>

          <div className="p-8 flex-1 overflow-auto max-h-[500px]">
            {tables.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tables.map(table => (
                  <div key={table} className="group flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-400 hover:bg-white transition-all cursor-default">
                    <div className="w-6 h-6 rounded bg-white flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <Table size={12} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{table}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4 opacity-40">
                <div className="w-16 h-16 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                   <Table size={32} className="text-slate-300" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aucune table détectée</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configurez et testez la connexion pour lister les tables</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
