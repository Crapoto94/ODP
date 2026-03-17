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
  Edit2
} from 'lucide-react';
import SQLEditor from '@/components/SQLEditor';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'sql' | 'users'>('general');
  
  // -- General Settings State --
  const [settings, setSettings] = useState({
    financeEmail: '',
    appUrl: '',
    apmUrl: '',
    apmToken: '',
    senderName: '',
    senderEmail: ''
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
