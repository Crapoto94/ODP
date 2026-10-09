"use client";

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import './settings.css';
import axios from 'axios';
import { Database, Loader2, ChevronRight } from 'lucide-react';

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
import FilienTab from './components/FilienTab';
import { SETTINGS_TABS, SETTINGS_GROUPS, isSettingsTab, type TabType } from './tabs';
import { useUiMode } from '@/components/UiModeProvider';

const tabs = SETTINGS_TABS;
const groups = SETTINGS_GROUPS;

export default function SettingsPage() {
  // useSearchParams impose une frontière Suspense
  return (
    <Suspense fallback={null}>
      <SettingsPageInner />
    </Suspense>
  );
}

function SettingsPageInner() {
  const uiMode = useUiMode();
  const searchParams = useSearchParams();
  const [tabState, setActiveTab] = useState<TabType>('general');
  // Nouvelle interface : le sous-menu est dans le menu latéral principal, l'onglet actif vient de l'adresse (?tab=…)
  const tabParam = searchParams.get('tab');
  const activeTab: TabType = uiMode === 'v2' ? (isSettingsTab(tabParam) ? tabParam : 'general') : tabState;
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

  const content = (
    <>
      {activeTab === 'general' && <GeneralTab {...{settings, setSettings, handleSubmit, handleTestMail, saving, message, apmStatus}} />}
      {activeTab === 'filien' && <FilienTab {...{settings, setSettings, handleSubmit, saving, message}} />}
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
    </>
  );

  if (uiMode === 'v2') {
    return (
      <div className="settings-v2 space-y-6 animate-in fade-in duration-300">
        {activeTabDef && (
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2e8f0] pb-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <activeTabDef.icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">Paramètres · {activeTabDef.group}</p>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">{activeTabDef.label}</h1>
                <p className="text-sm text-slate-500">{activeTabDef.description}</p>
              </div>
            </div>
            <VersionHeader compact hideTitle />
          </header>
        )}
        <div>{content}</div>
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

        <div className="p-8">{content}</div>
      </main>

    </div>
  );
}
