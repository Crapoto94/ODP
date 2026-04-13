"use client";
import React from 'react';
import {
  Mail,
  Globe,
  Key,
  Settings as SettingsIcon,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import TabHeader from './TabHeader';
import FormSection from './FormSection';

interface Props {
  settings: any;
  setSettings: (s: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleTestMail: () => void;
  saving: boolean;
  message: { type: 'success' | 'error', text: string } | null;
  apmStatus: 'pending' | 'online' | 'offline';
}

export default function GeneralTab({ 
  settings, 
  setSettings, 
  handleSubmit, 
  handleTestMail, 
  saving, 
  message, 
  apmStatus 
}: Props) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <TabHeader
        icon={SettingsIcon}
        title="Paramètres Généraux"
        subtitle="Configuration globale de l'application ODP"
        accentColor="blue"
        action={{
          label: 'Tester l\'envoi de mail',
          icon: Mail,
          onClick: handleTestMail,
          disabled: saving,
          variant: 'outline'
        }}
      />

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Notifications & Finance */}
            <div className="space-y-6">
              <FormSection icon={Mail} title="Flux Financiers" accentColor="blue">
                <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Email des Finances</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <input 
                    type="email" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-6 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                    placeholder="finances@mairie.fr"
                    value={settings.financeEmail || ''}
                    onChange={e => setSettings({...settings, financeEmail: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-6 border-t border-slate-50">
                <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">URL de l'application</label>
                <div className="relative group">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <input 
                    type="url" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-6 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                    placeholder="http://localhost:3000"
                    value={settings.appUrl || ''}
                    onChange={e => setSettings({...settings, appUrl: e.target.value})}
                  />
                </div>
              </div>
            </FormSection>

            <FormSection icon={SettingsIcon} title="Identité Expéditeur" accentColor="blue" className="pt-6 border-t border-slate-50">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Nom affiché</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                    placeholder="ODP Console"
                    value={settings.senderName || ''}
                    onChange={e => setSettings({...settings, senderName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Email d'envoi</label>
                  <input 
                    type="email" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                    placeholder="dsihub@fbc.fr"
                    value={settings.senderEmail || ''}
                    onChange={e => setSettings({...settings, senderEmail: e.target.value})}
                  />
                </div>
            </FormSection>

            {/* APM Config */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Globe size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Proxy API (APM)</h3>
                  </div>
                </div>
                  <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      apmStatus === 'online' ? 'bg-emerald-500' : 
                      apmStatus === 'offline' ? 'bg-rose-500' : 
                      'bg-slate-300 animate-pulse'
                    }`} />
                    <span className="text-[7px] font-black uppercase tracking-widest text-slate-500">
                      {apmStatus === 'online' ? 'ALIVE' : apmStatus === 'offline' ? 'DEAD' : '...'}
                    </span>
                  </div>
                </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">URL Endpoint</label>
                <div className="relative group">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <input 
                    type="url" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-6 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                    placeholder="http://localhost:8001/api/proxy"
                    value={settings.apmUrl || ''}
                    onChange={e => setSettings({...settings, apmUrl: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Clé API (X-API-KEY)</label>
                <div className="relative group">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <input 
                    type="password" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-6 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                    placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                    value={settings.apmToken || ''}
                    onChange={e => setSettings({...settings, apmToken: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Signature Arrêtés */}
          <FormSection icon={FileText} title="Signature des Arrêtés" accentColor="blue" className="pt-8 border-t border-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Rôle principal</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                  placeholder="Pour le Maire d'Ivry-sur-Seine,"
                  value={settings.signataireRole || ''}
                  onChange={e => setSettings({...settings, signataireRole: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Délégation</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                  placeholder="et par délégation,"
                  value={settings.signataireDelegation || ''}
                  onChange={e => setSettings({...settings, signataireDelegation: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Nom et Fonction</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                  placeholder="Dominique Montet - DGA"
                  value={settings.signataireNom || ''}
                  onChange={e => setSettings({...settings, signataireNom: e.target.value})}
                />
              </div>
          </FormSection>

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
            Enregistrer les paramètres
          </button>
        </form>
      </div>
    </div>
  );
}
