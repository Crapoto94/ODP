"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Settings, 
  Mail, 
  Globe, 
  Key, 
  Save, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Database,
  LayoutGrid,
  Users,
  Plus,
  Trash2,
  Edit2,
  FileText
} from 'lucide-react';
import SQLEditor from '@/components/SQLEditor';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'sql' | 'users' | 'filien'>('general');
  
  // -- General Settings State --
  const [settings, setSettings] = useState({
    financeEmail: '',
    appUrl: '',
    apmUrl: '',
    apmToken: '',
    senderName: '',
    senderEmail: '',
    filienOrga: '01',
    filienBudget: 'BA',
    filienExercice: new Date().getFullYear(),
    filienAvancement: '5',
    filienRejetDispo: true,
    filienRejetCA: false,
    filienRejetMarche: false,
    filienMouvement: '1',
    filienType: 'R',
    filienLibelle: '',
    filienCalendrier: '01',
    filienMonnaie: 'E',
    filienMouvementEx: 'N',
    filienPreBordereau: '1235',
    filienPoste: '0001',
    filienBordereau: '0001',
    filienObjet: '',
    filienChapitre: '',
    filienNature: '',
    filienFonction: '',
    filienCodeInterne: '',
    filienTypeMouvement: '',
    filienSens: '',
    filienStructure: '',
    filienGestionnaire: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [apmStatus, setApmStatus] = useState<'pending' | 'online' | 'offline'>('pending');
  
  // -- Users State --
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({ nom: '', prenom: '', email: '', login: '', password: '', role: 'AGENT_TERRAIN' });

  useEffect(() => {
    Promise.all([
      axios.get('/api/settings'),
      axios.get('/api/users').catch(() => ({ data: [] }))
    ]).then(([settingsRes, usersRes]) => {
      setSettings(settingsRes.data);
      setUsers(usersRes.data);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load initial data:', err);
      setLoading(false);
    });
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        await axios.patch(`/api/users/${editingUser.id}`, userForm);
      } else {
        await axios.post('/api/users', userForm);
      }
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({ nom: '', prenom: '', email: '', login: '', password: '', role: 'AGENT_TERRAIN' });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || "Erreur lors de la sauvegarde de l'utilisateur");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    try {
      await axios.delete(`/api/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || "Erreur lors de la suppression");
    }
  };

  const openUserModal = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({ nom: user.nom, prenom: user.prenom, email: user.email, login: user.login, password: '', role: user.role });
    } else {
      setEditingUser(null);
      setUserForm({ nom: '', prenom: '', email: '', login: '', password: '', role: 'AGENT_TERRAIN' });
    }
    setShowUserModal(true);
  };

  useEffect(() => {
    if (settings.apmUrl) {
      checkApm();
    }
  }, [settings.apmUrl]);

  const checkApm = async () => {
    setApmStatus('pending');
    try {
      // Small timeout to avoid long waits
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      await fetch(settings.apmUrl, { 
        method: 'HEAD', 
        mode: 'no-cors',
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      setApmStatus('online');
    } catch (e) {
      setApmStatus('offline');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await axios.patch('/api/settings', settings);
      setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestMail = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await axios.post('/api/settings/test-mail');
      setMessage({ type: 'success', text: `Mail de test envoyé avec succès à ${res.data.target}` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur lors de l\'envoi du test' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Chargement des paramètres...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Paramètres</h2>
          <p className="text-slate-500 font-medium tracking-wide text-lg">Configuration globale et outils système</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-3 px-8 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'general' ? 'bg-white text-indigo-600 shadow-md border border-slate-200 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <LayoutGrid size={16} />
            Général
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-3 px-8 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-indigo-600 shadow-md border border-slate-200 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Users size={16} />
            Comptes Utilisateurs
          </button>
          <button 
            onClick={() => setActiveTab('filien')}
            className={`flex items-center gap-3 px-8 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'filien' ? 'bg-white text-indigo-600 shadow-md border border-slate-200 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <FileText size={16} />
            Filien
          </button>
          <button 
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-3 px-8 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'sql' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Database size={16} />
            Console SQL
          </button>
        </div>
      </div>

      <div className="pt-4">
        {activeTab === 'general' ? (
          <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
            <div className="flex justify-end">
              <button 
                onClick={handleTestMail}
                disabled={saving}
                className="flex items-center gap-3 bg-white hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-slate-200 border border-slate-100"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} className="text-indigo-600" />}
                Tester l'envoi de mail
              </button>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-100 overflow-hidden max-w-3xl">
              <form onSubmit={handleSubmit} className="p-12 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Notifications & Finance */}
                  <div className="space-y-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Mail size={12} />
                      </div>
                      Flux Financiers
                    </h3>
                    
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Email des Finances</label>
                      <div className="relative group">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input 
                          type="email" 
                          className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 pl-14 pr-6 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-lg"
                          placeholder="finances@mairie.fr"
                          value={settings.financeEmail || ''}
                          onChange={e => setSettings({...settings, financeEmail: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-6 border-t border-slate-100">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">URL de l'application</label>
                      <div className="relative group">
                        <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input 
                          type="url" 
                          className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 pl-14 pr-6 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-lg"
                          placeholder="http://localhost:3000"
                          value={settings.appUrl || ''}
                          onChange={e => setSettings({...settings, appUrl: e.target.value})}
                        />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 ml-4">Utilisée pour les liens envoyés par mail (e.g. Finances).</p>
                    </div>

                    <div className="pt-8 border-t border-slate-100 space-y-6">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1 flex items-center gap-3">
                         <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <Settings size={12} />
                        </div>
                        Identité Expéditeur
                      </h3>
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Nom affiché</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg"
                          placeholder="ODP Console"
                          value={settings.senderName || ''}
                          onChange={e => setSettings({...settings, senderName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Email d'envoi</label>
                        <input 
                          type="email" 
                          className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg"
                          placeholder="dsihub@fbc.fr"
                          value={settings.senderEmail || ''}
                          onChange={e => setSettings({...settings, senderEmail: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* APM Config */}
                  <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1 flex items-center gap-3">
                           <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Globe size={12} />
                          </div>
                          Proxy API (APM)
                        </h3>
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                          <div className={`w-2 h-2 rounded-full ${
                            apmStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                            apmStatus === 'offline' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 
                            'bg-slate-300 animate-pulse'
                          }`} />
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                            {apmStatus === 'online' ? 'Disponible' : apmStatus === 'offline' ? 'Indisponible' : 'Vérification...'}
                          </span>
                        </div>
                      </div>
                    
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">URL Endpoint</label>
                      <div className="relative group">
                        <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input 
                          type="url" 
                          className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 pl-14 pr-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg"
                          placeholder="http://localhost:8001/api/proxy"
                          value={settings.apmUrl || ''}
                          onChange={e => setSettings({...settings, apmUrl: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Clé API (X-API-KEY)</label>
                      <div className="relative group">
                        <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input 
                          type="password" 
                          className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 pl-14 pr-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg"
                          placeholder="••••••••••••••••"
                          value={settings.apmToken || ''}
                          onChange={e => setSettings({...settings, apmToken: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {message && (
                  <div className={`p-6 rounded-[1.5rem] flex items-center gap-4 animate-in zoom-in-95 duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 shadow-inner' : 'bg-rose-50 text-rose-700 shadow-inner'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    <span className="font-black text-sm uppercase tracking-widest">{message.text}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-[2rem] font-black shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs"
                >
                  {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  Enregistrer les paramètres
                </button>
              </form>
            </div>
          </div>
        ) : activeTab === 'filien' ? (
          <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-100 overflow-hidden max-w-3xl mx-auto">
              <form onSubmit={handleSubmit} className="p-12 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <FileText size={12} />
                      </div>
                      Paramètres de base (/##/PARAM/)
                    </h3>
                    
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Code Organisme</label>
                      <input 
                        type="text" 
                        maxLength={2}
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg"
                        placeholder="01"
                        value={settings.filienOrga || ''}
                        onChange={e => setSettings({...settings, filienOrga: e.target.value})}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Code Budget</label>
                      <input 
                        type="text" 
                        maxLength={2}
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg"
                        placeholder="BA"
                        value={settings.filienBudget || ''}
                        onChange={e => setSettings({...settings, filienBudget: e.target.value})}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Exercice</label>
                      <input 
                        type="number" 
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg"
                        placeholder="2024"
                        value={settings.filienExercice || ''}
                        onChange={e => setSettings({...settings, filienExercice: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Settings size={12} />
                      </div>
                      Règles & Avancement
                    </h3>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Code Avancement</label>
                      <select 
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg appearance-none"
                        value={settings.filienAvancement || '5'}
                        onChange={e => setSettings({...settings, filienAvancement: e.target.value})}
                      >
                        <option value="1">1 - Prévision</option>
                        <option value="2">2 - Pré-engagé</option>
                        <option value="3">3 - Engagé</option>
                        <option value="4">4 - Facturé</option>
                        <option value="5">5 - Pré-mandaté</option>
                      </select>
                    </div>

                    <div className="space-y-4 pt-4">
                      <label className="flex items-center gap-4 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="w-6 h-6 rounded-lg border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                          checked={settings.filienRejetDispo || false}
                          onChange={e => setSettings({...settings, filienRejetDispo: e.target.checked})}
                        />
                        <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition-colors uppercase tracking-wider">Rejet si dépassement disponible</span>
                      </label>
                      <label className="flex items-center gap-4 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="w-6 h-6 rounded-lg border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                          checked={settings.filienRejetCA || false}
                          onChange={e => setSettings({...settings, filienRejetCA: e.target.checked})}
                        />
                        <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition-colors uppercase tracking-wider">Rejet si dépassement C.A. maxi</span>
                      </label>
                      <label className="flex items-center gap-4 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="w-6 h-6 rounded-lg border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                          checked={settings.filienRejetMarche || false}
                          onChange={e => setSettings({...settings, filienRejetMarche: e.target.checked})}
                        />
                        <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition-colors uppercase tracking-wider">Rejet si dépassement marché</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-12 border-t border-slate-100 space-y-8">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1 flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <LayoutGrid size={12} />
                    </div>
                    Valeurs par défaut des mouvements
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">N° de 1er mouvement (/01/)</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg"
                        placeholder="1"
                        value={settings.filienMouvement || ''}
                        onChange={e => setSettings({...settings, filienMouvement: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Type de mouvement (/02/)</label>
                      <select 
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg appearance-none"
                        value={settings.filienType || 'R'}
                        onChange={e => setSettings({...settings, filienType: e.target.value})}
                      >
                        <option value="R">Recette (R)</option>
                        <option value="D">Dépense (D)</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Code monnaie (/06/)</label>
                      <select 
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg appearance-none"
                        value={settings.filienMonnaie || 'E'}
                        onChange={e => setSettings({...settings, filienMonnaie: e.target.value})}
                      >
                        <option value="E">Euros (E)</option>
                        <option value="F">Francs (F)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Libellé par défaut (/04/)</label>
                      <input 
                        type="text" 
                        maxLength={40}
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg"
                        placeholder="Libellé du mouvement"
                        value={settings.filienLibelle || ''}
                        onChange={e => setSettings({...settings, filienLibelle: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Code calendrier (/05/)</label>
                      <input 
                        type="text" 
                        maxLength={2}
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg"
                        placeholder="01"
                        value={settings.filienCalendrier || ''}
                        onChange={e => setSettings({...settings, filienCalendrier: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Mouvement existant (/10/)</label>
                      <select 
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg appearance-none"
                        value={settings.filienMouvementEx || 'N'}
                        onChange={e => setSettings({...settings, filienMouvementEx: e.target.value})}
                      >
                        <option value="N">Nouveau mouvement (N)</option>
                        <option value="O">Mouvement existant (O)</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">N° de pré-bordereau (/11/)</label>
                      <input 
                        type="text" 
                        maxLength={4}
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg"
                        placeholder="1235"
                        value={settings.filienPreBordereau || ''}
                        onChange={e => setSettings({...settings, filienPreBordereau: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">N° de poste (/12/)</label>
                      <input 
                        type="text" 
                        maxLength={4}
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg"
                        placeholder="0001"
                        value={settings.filienPoste || ''}
                        onChange={e => setSettings({...settings, filienPoste: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">N° de bordereau (/13/)</label>
                      <input 
                        type="text" 
                        maxLength={4}
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg"
                        placeholder="0001"
                        value={settings.filienBordereau || ''}
                        onChange={e => setSettings({...settings, filienBordereau: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Objet (/20/)</label>
                    <input 
                      type="text" 
                      maxLength={40}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg"
                      placeholder="Objet du mouvement"
                      value={settings.filienObjet || ''}
                      onChange={e => setSettings({...settings, filienObjet: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Ventilation Analytique (/541/ & /542/)</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Chapitre</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg"
                        value={settings.filienChapitre || ''}
                        onChange={e => setSettings({...settings, filienChapitre: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Nature</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg"
                        value={settings.filienNature || ''}
                        onChange={e => setSettings({...settings, filienNature: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Fonction</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg"
                        value={settings.filienFonction || ''}
                        onChange={e => setSettings({...settings, filienFonction: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Code Interne</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg"
                        value={settings.filienCodeInterne || ''}
                        onChange={e => setSettings({...settings, filienCodeInterne: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Type Mouvement</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg"
                        value={settings.filienTypeMouvement || ''}
                        onChange={e => setSettings({...settings, filienTypeMouvement: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Sens</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg"
                        value={settings.filienSens || ''}
                        onChange={e => setSettings({...settings, filienSens: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Structure</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg"
                        value={settings.filienStructure || ''}
                        onChange={e => setSettings({...settings, filienStructure: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Gestionnaire (/542/)</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] py-5 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg font-black text-indigo-600"
                        value={settings.filienGestionnaire || ''}
                        onChange={e => setSettings({...settings, filienGestionnaire: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {message && (
                  <div className={`p-6 rounded-[1.5rem] flex items-center gap-4 animate-in zoom-in-95 duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 shadow-inner' : 'bg-rose-50 text-rose-700 shadow-inner'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    <span className="font-black text-sm uppercase tracking-widest">{message.text}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-[2rem] font-black shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs"
                >
                  {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  Enregistrer les paramètres Filien
                </button>
              </form>
            </div>
          </div>
        ) : activeTab === 'users' ? (
          <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Gestion des accès</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">({users.length} comptes actifs)</p>
              </div>
              <button 
                onClick={() => openUserModal()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
              >
                <Plus size={16} /> Ajouter un utilisateur
              </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilisateur</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact / Login</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rôle</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                            {u.prenom[0]}{u.nom[0]}
                          </div>
                          <div>
                            <p className="font-black text-slate-900">{u.prenom} {u.nom}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <p className="font-bold text-slate-600 text-sm">{u.email}</p>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Login: {u.login}</p>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          u.role === 'ADMIN' ? 'bg-rose-100 text-rose-700' : 
                          u.role === 'AGENT_COMPTABLE' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {u.role.replace('AGENT_', '')}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openUserModal(u)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal */}
            {showUserModal && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-black text-slate-900 text-lg">{editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</h3>
                    <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600"><AlertCircle size={20}/></button>
                  </div>
                  <form onSubmit={handleSaveUser} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Prénom</label>
                         <input required type="text" value={userForm.prenom} onChange={e => setUserForm({...userForm, prenom: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 outline-none font-bold text-sm" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Nom</label>
                         <input required type="text" value={userForm.nom} onChange={e => setUserForm({...userForm, nom: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 outline-none font-bold text-sm" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Email</label>
                         <input required type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 outline-none font-bold text-sm" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Login</label>
                         <input required type="text" value={userForm.login} onChange={e => setUserForm({...userForm, login: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 outline-none font-bold text-sm" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Mot de passe {editingUser && '(laisser vide pour ne pas changer)'}</label>
                         <input required={!editingUser} type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 outline-none font-bold text-sm" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Rôle</label>
                         <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 outline-none font-bold text-sm">
                           <option value="AGENT_TERRAIN">Agent Terrain</option>
                           <option value="AGENT_BUREAU">Agent Bureau</option>
                           <option value="AGENT_COMPTABLE">Agent Comptable</option>
                           <option value="ADMIN">Administrateur</option>
                         </select>
                      </div>
                    </div>
                    <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                      <button type="button" onClick={() => setShowUserModal(false)} className="px-6 py-3 text-slate-400 font-bold text-xs uppercase hover:text-slate-600 transition-colors">Annuler</button>
                      <button type="submit" disabled={saving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {editingUser ? 'Mettre à jour' : 'Créer le compte'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="animate-in slide-in-from-right-4 duration-500">
            <SQLEditor />
          </div>
        )}
      </div>
    </div>
  );
}
