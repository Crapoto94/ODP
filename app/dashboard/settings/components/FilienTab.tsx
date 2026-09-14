"use client";
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Settings as SettingsIcon, 
  LayoutGrid, 
  Loader2, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  HardDrive,
  RefreshCw,
  Server,
  FolderOpen,
  Key,
  User as UserIcon
} from 'lucide-react';
import axios from 'axios';
import FilienTypeConfigs from '@/components/FilienTypeConfigs';

interface Props {
  settings: any;
  setSettings: (s: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  message: { type: 'success' | 'error', text: string } | null;
}

interface DiskSpace {
  root: string;
  mode: 'smb' | 'local';
  total: number;
  free: number;
  used: number;
  percentFree: number;
  totalHuman: string;
  freeHuman: string;
  usedHuman: string;
}

export default function FilienTab({ settings, setSettings, handleSubmit, saving, message }: Props) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; mode?: string; message: string } | null>(null);
  const [diskSpace, setDiskSpace] = useState<DiskSpace | null>(null);
  const [loadingDisk, setLoadingDisk] = useState(false);

  const fetchDiskSpace = async () => {
    try {
      setLoadingDisk(true);
      const res = await axios.get('/api/settings/filien-repo');
      setDiskSpace(res.data.diskSpace);
      if (res.data.path && !res.data.diskSpace) {
        setTestResult({ success: false, message: 'Espace libre indisponible pour ce dépôt (serveur inaccessible ?).' });
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setTestResult({ success: false, message: 'Accès refusé : seuls les administrateurs peuvent consulter ce dépôt.' });
      } else {
        setTestResult({ success: false, message: err.response?.data?.error || err.message || 'Impossible de lire le dépôt.' });
      }
    } finally {
      setLoadingDisk(false);
    }
  };

  useEffect(() => { fetchDiskSpace(); }, []);

  const handleTestRepo = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await axios.post('/api/settings/filien-repo', {
        path: settings.filienUncPj,
        user: settings.filienUncUser,
        password: settings.filienUncPass,
        domain: settings.filienUncDomain,
      });
      setTestResult({ success: res.data.success, mode: res.data.mode, message: res.data.message });
      setDiskSpace(res.data.diskSpace);
    } catch (err: any) {
      setTestResult({ success: false, message: err.response?.data?.message || err.message || 'Erreur lors du test.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-100/50 overflow-hidden max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="p-10 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1 flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <FileText size={12} />
                </div>
                Paramètres de base (/##/PARAM/)
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Code Organisme</label>
                  <input 
                    type="text" 
                    maxLength={2}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm text-center"
                    placeholder="01"
                    value={settings.filienOrga || ''}
                    onChange={e => setSettings({...settings, filienOrga: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Code Budget</label>
                  <input 
                    type="text" 
                    maxLength={2}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm text-center"
                    placeholder="BA"
                    value={settings.filienBudget || ''}
                    onChange={e => setSettings({...settings, filienBudget: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Exercice</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                  placeholder="2026"
                  value={settings.filienExercice || ''}
                  onChange={e => setSettings({...settings, filienExercice: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1 flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <SettingsIcon size={12} />
                </div>
                Règles & Avancement
              </h3>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Code Avancement</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm appearance-none"
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

              <div className="space-y-3 pt-4">
                {[
                  { key: 'filienRejetDispo', label: 'Rejet si dépassement disponible' },
                  { key: 'filienRejetCA', label: 'Rejet si dépassement C.A. maxi' },
                  { key: 'filienRejetMarche', label: 'Rejet si dépassement marché' }
                ].map(check => (
                  <label key={check.key} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-lg border border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                      checked={(settings as any)[check.key] || false}
                      onChange={e => setSettings({...settings, [check.key]: e.target.checked})}
                    />
                    <span className="text-[10px] font-black text-slate-500 group-hover:text-blue-600 transition-colors uppercase tracking-widest">{check.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Dépôt des fichiers générés lors de la facturation */}
          <div className="pt-10 border-t border-slate-50 space-y-8">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1 flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <HardDrive size={12} />
                </div>
                Dépôt des fichiers (Factures Filien)
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestRepo}
                  disabled={testing || saving}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {testing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  Tester le dépôt
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Chemin du dépôt (UNC ou local)</label>
                  <div className="relative">
                    <FolderOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 pl-12 pr-6 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                      placeholder="\\\\serveur\\partage\\sous-dossier"
                      value={settings.filienUncPj || ''}
                      onChange={e => setSettings({...settings, filienUncPj: e.target.value})}
                    />
                  </div>
                  <p className="text-[10px] font-medium text-slate-400 ml-1">Les factures PDF, le récapitulatif et l'export Filien y sont copiés dans un sous-dossier daté.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Utilisateur SMB (Compte)</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 pl-12 pr-6 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                        placeholder="compte_de_service"
                        value={settings.filienUncUser || ''}
                        onChange={e => setSettings({...settings, filienUncUser: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Mot de passe SMB</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                      <input 
                        type="password" 
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 pl-12 pr-6 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                        placeholder="••••••••"
                        value={settings.filienUncPass || ''}
                        onChange={e => setSettings({...settings, filienUncPass: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Domaine SMB</label>
                  <div className="relative">
                    <Server size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 pl-12 pr-6 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                      placeholder="WORKGROUP"
                      value={settings.filienUncDomain || ''}
                      onChange={e => setSettings({...settings, filienUncDomain: e.target.value})}
                    />
                  </div>
                </div>

                {testResult && (
                  <div className={`p-4 rounded-xl flex items-start gap-3 animate-in zoom-in-95 duration-300 ${testResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {testResult.success ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
                    <div>
                      <p className="font-black text-[10px] uppercase tracking-widest mb-0.5">
                        {testResult.success ? `Test réussi (${testResult.mode === 'smb' ? 'SMB/UNC' : 'Local'})` : 'Test échoué'}
                      </p>
                      <p className="text-xs font-bold">{testResult.message}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-6 h-full flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive size={16} className="text-blue-600" />
                      <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Espace libre du dépôt</h4>
                    </div>
                    <button
                      type="button"
                      onClick={fetchDiskSpace}
                      disabled={loadingDisk}
                      className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Rafraîchir"
                    >
                      <RefreshCw size={14} className={loadingDisk ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  {loadingDisk ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader2 size={20} className="animate-spin text-blue-600" />
                    </div>
                  ) : diskSpace ? (
                    <>
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-2xl font-black text-slate-900 leading-none">{diskSpace.freeHuman}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">libres</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-700 leading-none">/ {diskSpace.totalHuman}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{diskSpace.usedHuman} utilisés</p>
                        </div>
                      </div>

                      <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            diskSpace.percentFree < 10 ? 'bg-rose-500' : diskSpace.percentFree < 25 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(2, diskSpace.percentFree))}%` }}
                        />
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {diskSpace.percentFree}% libres — {diskSpace.mode === 'smb' ? 'partage SMB' : 'système local'}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 break-all">{diskSpace.root}</p>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 text-slate-400">
                      <AlertCircle size={24} className="opacity-40" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Espace indisponible</p>
                      <p className="text-[9px] font-medium">Vérifiez le chemin puis « Tester le dépôt ».</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-50 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-blue-600 rounded-full" />
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Configurations par Type de Dossier</h4>
            </div>
            <FilienTypeConfigs />
          </div>

          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 animate-in zoom-in-95 duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="font-black text-[10px] uppercase tracking-widest">{message.text}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={saving}
            className="w-full bg-slate-950 hover:bg-slate-800 text-white py-5 rounded-xl font-black shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Enregistrer les paramètres Filien
          </button>
        </form>
      </div>
    </div>
  );
}