"use client";
import React from 'react';
import { 
  FileText, 
  Settings as SettingsIcon, 
  LayoutGrid, 
  Loader2, 
  Save, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import FilienTypeConfigs from '@/components/FilienTypeConfigs';

interface Props {
  settings: any;
  setSettings: (s: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  message: { type: 'success' | 'error', text: string } | null;
}

export default function FilienTab({ settings, setSettings, handleSubmit, saving, message }: Props) {
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

          <div className="pt-10 border-t border-slate-50 space-y-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1 flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <LayoutGrid size={12} />
              </div>
              Valeurs par défaut des mouvements
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">N° 1er mouvement (/01/)</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm text-center"
                  placeholder="1"
                  value={settings.filienMouvement || ''}
                  onChange={e => setSettings({...settings, filienMouvement: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Type (/02/)</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                  value={settings.filienType || 'R'}
                  onChange={e => setSettings({...settings, filienType: e.target.value})}
                >
                  <option value="R">Recette (R)</option>
                  <option value="D">Dépense (D)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Monnaie (/06/)</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                  value={settings.filienMonnaie || 'E'}
                  onChange={e => setSettings({...settings, filienMonnaie: e.target.value})}
                >
                  <option value="E">Euros (E)</option>
                  <option value="F">Francs (F)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Objet du Mouvement (/04/)</label>
                  <input 
                    type="text" 
                    maxLength={40}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                    placeholder="Objet du mouvement"
                    value={settings.filienObjet || ''}
                    onChange={e => setSettings({...settings, filienObjet: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Dossier des PJ (UNC)</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                    placeholder="\\\\server\\share\\folder"
                    value={settings.filienUncPj || ''}
                    onChange={e => setSettings({...settings, filienUncPj: e.target.value})}
                  />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Utilisateur SMB (Share)</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                    placeholder="Username"
                    value={settings.filienUncUser || ''}
                    onChange={e => setSettings({...settings, filienUncUser: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Mot de passe SMB</label>
                  <input 
                    type="password" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                    placeholder="••••••••"
                    value={settings.filienUncPass || ''}
                    onChange={e => setSettings({...settings, filienUncPass: e.target.value})}
                  />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-700 ml-1 uppercase tracking-widest">Domaine SMB</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
                    placeholder="WORKGROUP"
                    value={settings.filienUncDomain || ''}
                    onChange={e => setSettings({...settings, filienUncDomain: e.target.value})}
                  />
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
