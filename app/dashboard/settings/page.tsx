"use client";

import { useState, useEffect } from 'react';
import './settings.css';
import axios from 'axios';
import {
  LayoutGrid,
  Users,
  FileText,
  Smartphone,
  Database,
  Loader2,
  Clock,
  Mail,
  UserCog,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

import SQLEditor from '@/components/SQLEditor';
import VersionHeader from './components/VersionHeader';
import GeneralTab from './components/GeneralTab';
import UsersTab from './components/UsersTab';
import MobileLogsTab from './components/MobileLogsTab';
import BacklogTab from './components/BacklogTab';
import PostgresTab from './components/PostgresTab';
import SignatureConfigTab from './components/SignatureConfigTab';
import MessagesContextuelsTab from './components/MessagesContextuelsTab';
import ContactRolesTab from './components/ContactRolesTab';
import RolesTab from './components/RolesTab';

type TabType = 'general' | 'postgres' | 'users' | 'roles' | 'contact_roles' | 'mobile_logs' | 'backlog' | 'signature' | 'messages' | 'sql';

const tabs: { id: TabType; label: string; icon: any; description: string; group?: string }[] = [
  { id: 'general',        label: 'Général',            icon: LayoutGrid, description: 'APM, mail, Filièn…',        group: 'Configuration' },
  { id: 'signature',      label: 'Signatures',         icon: FileText,   description: 'Signataires & gabarits',    group: 'Configuration' },
  { id: 'messages',       label: 'Modèles d\'emails',  icon: Mail,       description: 'Messages contextuels',      group: 'Configuration' },
  { id: 'users',          label: 'Utilisateurs',       icon: Users,       description: 'Comptes & accès',           group: 'Référentiels' },
  { id: 'roles',          label: 'Rôles',              icon: ShieldCheck, description: 'Droits par rôle',           group: 'Référentiels' },
  { id: 'contact_roles',  label: 'Types de contacts',  icon: UserCog,    description: 'Rôles des contacts',        group: 'Référentiels' },
  { id: 'postgres',       label: 'Base PostgreSQL',    icon: Database,   description: 'Connexion externe',         group: 'Technique' },
  { id: 'sql',            label: 'Console SQL',        icon: Database,   description: 'Requêtes directes',         group: 'Technique' },
  { id: 'backlog',        label: 'Backlog',            icon: Clock,      description: 'Suivi des évolutions',      group: 'Technique' },
  { id: 'mobile_logs',    label: 'Logs Mobiles',       icon: Smartphone, description: 'Activité terrain',          group: 'Technique' },
];

const groups = ['Configuration', 'Référentiels', 'Technique'];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [apmStatus, setApmStatus] = useState<'pending' | 'online' | 'offline'>('pending');

  const [settings, setSettings] = useState<any>({});
  const [mobileLogs, setMobileLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const settingsRes = await axios.get('/api/settings');
      setSettings(settingsRes.data);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMobileLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await axios.get('/api/logs');
      setMobileLogs(res.data);
    } catch(err) { console.error(err); } finally { setLoadingLogs(false); }
  };

  useEffect(() => { if (settings.apmUrl) checkApm(); }, [settings.apmUrl]);
  useEffect(() => { if (activeTab === 'mobile_logs') fetchMobileLogs(); }, [activeTab]);

  const checkApm = async () => {
    setApmStatus('pending');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      await fetch(settings.apmUrl, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
      clearTimeout(timeoutId);
      setApmStatus('online');
    } catch { setApmStatus('offline'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await axios.patch('/api/settings', settings);
      setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès' });
    } catch { setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' }); } finally { setSaving(false); }
  };

  const handleTestMail = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await axios.post('/api/settings/test-mail');
      setMessage({ type: 'success', text: `Mail de test envoyé avec succès à ${res.data.target}` });
    } catch (err: any) { setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur lors de l\'envoi du test' }); } finally { setSaving(false); }
  };

  const activeTabDef = tabs.find(t => t.id === activeTab);

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center gap-6 animate-pulse">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Initialisation des paramètres...</p>
      </div>
    );
  }

  return (
    <div className="flex gap-0 h-[calc(100vh-80px)] animate-in fade-in duration-500">

      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 bg-white border-r border-slate-100 flex flex-col overflow-hidden">
        <div className="px-5 py-6 flex-shrink-0 border-b border-slate-100">
          <VersionHeader compact />
        </div>

        <nav className="settings-nav flex-1 px-3 py-2 space-y-3 overflow-y-auto">
          {groups.map(group => {
            const groupTabs = tabs.filter(t => t.group === group);
            return (
              <div key={group}>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 mb-1">{group}</p>
                <div className="space-y-0.5">
                  {groupTabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all duration-150 text-left group ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                          isActive ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-200'
                        }`}>
                          <Icon size={13} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[11px] font-black leading-tight truncate`}>{tab.label}</p>
                          <p className={`text-[9px] leading-tight truncate mt-0 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>{tab.description}</p>
                        </div>
                        {isActive && <ChevronRight size={12} className="shrink-0 text-blue-200" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ── Contenu ── */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Header de section */}
        {activeTabDef && (
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-100 px-8 py-4 flex items-center gap-4">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <activeTabDef.icon size={16} />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">{activeTabDef.label}</h1>
              <p className="text-[10px] text-slate-400 font-bold">{activeTabDef.description}</p>
            </div>
          </div>
        )}

        <div className="p-8">
          {activeTab === 'general' && <GeneralTab {...{settings, setSettings, handleSubmit, handleTestMail, saving, message, apmStatus}} />}
          {activeTab === 'postgres' && <PostgresTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'roles' && <RolesTab />}
          {activeTab === 'contact_roles' && <ContactRolesTab />}
          {activeTab === 'signature' && <SignatureConfigTab />}
          {activeTab === 'messages' && <MessagesContextuelsTab />}
          {activeTab === 'backlog' && <BacklogTab />}
          {activeTab === 'mobile_logs' && <MobileLogsTab {...{mobileLogs, loadingLogs, fetchMobileLogs}} />}
          {activeTab === 'sql' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden">
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
      </main>

    </div>
  );
}
