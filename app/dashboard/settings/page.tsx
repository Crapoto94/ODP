"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutGrid, 
  Users, 
  FileText, 
  Smartphone, 
  Database, 
  Loader2,
  Clock,
  Zap
} from 'lucide-react';

import SQLEditor from '@/components/SQLEditor';
import VersionHeader from './components/VersionHeader';
import GeneralTab from './components/GeneralTab';
import UsersTab from './components/UsersTab';
import FilienTab from './components/FilienTab';
import MobileLogsTab from './components/MobileLogsTab';
import BacklogTab from './components/BacklogTab';
import PostgresTab from './components/PostgresTab';
import UserModal from './components/UserModal';

type TabType = 'general' | 'postgres' | 'users' | 'mobile_logs' | 'backlog' | 'sql';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [apmStatus, setApmStatus] = useState<'pending' | 'online' | 'offline'>('pending');

  const [settings, setSettings] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [mobileLogs, setMobileLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({ nom: '', prenom: '', email: '', login: '', password: '', role: 'AGENT_TERRAIN' });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [settingsRes, usersRes] = await Promise.all([
        axios.get('/api/settings'),
        axios.get('/api/users').catch(() => ({ data: [] }))
      ]);
      setSettings(settingsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
       console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch(err) { console.error(err); } finally { setLoadingUsers(false); }
  }

  const fetchMobileLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await axios.get('/api/logs');
      setMobileLogs(res.data);
    } catch(err) { console.error(err); } finally { setLoadingLogs(false); }
  }

  useEffect(() => {
    if (settings.apmUrl) checkApm();
  }, [settings.apmUrl]);

  useEffect(() => {
    if (activeTab === 'mobile_logs') fetchMobileLogs();
  }, [activeTab]);

  const checkApm = async () => {
    setApmStatus('pending');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      await fetch(settings.apmUrl, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
      clearTimeout(timeoutId);
      setApmStatus('online');
    } catch (e) { setApmStatus('offline'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await axios.patch('/api/settings', settings);
      setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès' });
    } catch (err) { setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' }); } finally { setSaving(false); }
  };

  const handleTestMail = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await axios.post('/api/settings/test-mail');
      setMessage({ type: 'success', text: `Mail de test envoyé avec succès à ${res.data.target}` });
    } catch (err: any) { setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur lors de l\'envoi du test' }); } finally { setSaving(false); }
  };

  const openUserModal = async (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({ nom: user.nom, prenom: user.prenom, email: user.email, login: user.login, password: '', role: user.role });
    } else {
      setEditingUser(null);
      setUserForm({ nom: '', prenom: '', email: '', login: '', password: '', role: 'AGENT_TERRAIN' });
    }
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) await axios.patch(`/api/users/${editingUser.id}`, userForm);
      else await axios.post('/api/users', userForm);
      setShowUserModal(false);
      fetchUsers();
    } catch (error: any) { alert(error.response?.data?.error || "Erreur de sauvegarde"); } finally { setSaving(false); }
  }

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Supprimer ce compte ?")) return;
    try {
      await axios.delete(`/api/users/${id}`);
      fetchUsers();
    } catch (err) { alert("Erreur de suppression"); }
  }

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center gap-6 animate-pulse">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Initialisation des paramètres...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'Général', icon: LayoutGrid },
    { id: 'postgres', label: 'Base PostgreSQL', icon: Database, accent: 'bg-blue-600' },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'backlog', label: 'Backlog', icon: Clock },
    { id: 'mobile_logs', label: 'Logs Mobiles', icon: Smartphone },
    { id: 'sql', label: 'Console SQL', icon: Database, accent: 'bg-indigo-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-6 animate-in fade-in duration-700">
      <VersionHeader />

      <div className="flex flex-wrap items-center gap-2 bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-100 shadow-sm w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${
                isActive 
                  ? (tab.accent ? `${tab.accent} text-white shadow-lg` : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105') 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="relative">
        {activeTab === 'general' && <GeneralTab {...{settings, setSettings, handleSubmit, handleTestMail, saving, message, apmStatus}} />}
        {activeTab === 'postgres' && <PostgresTab />}
        {activeTab === 'users' && <UsersTab {...{users, loadingUsers, openUserModal, handleDeleteUser}} />}
        {activeTab === 'backlog' && <BacklogTab />}
        {activeTab === 'mobile_logs' && <MobileLogsTab {...{mobileLogs, loadingLogs, fetchMobileLogs}} />}
        {activeTab === 'sql' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-500">
             <div className="p-8 bg-indigo-600 flex items-center gap-4 text-white">
                <Database size={24} />
                <div>
                   <h3 className="text-xl font-black tracking-tight leading-none">Console SQL</h3>
                   <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mt-1">Exécution directe sur la base de données</p>
                </div>
             </div>
             <SQLEditor />
          </div>
        )}
      </div>

      <UserModal 
        show={showUserModal} 
        onClose={() => setShowUserModal(false)}
        editingUser={editingUser}
        userForm={userForm}
        setUserForm={setUserForm}
        handleSaveUser={handleSaveUser}
        saving={saving}
      />
    </div>
  );
}
