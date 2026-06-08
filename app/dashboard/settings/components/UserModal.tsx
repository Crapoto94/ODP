"use client";
import React from 'react';
import { X, Loader2, Save, User as UserIcon, Mail, Shield, Key } from 'lucide-react';

interface Props {
  show: boolean;
  onClose: () => void;
  editingUser: any;
  userForm: any;
  setUserForm: (f: any) => void;
  handleSaveUser: (e: React.FormEvent) => void;
  saving: boolean;
}

export default function UserModal({ 
  show, 
  onClose, 
  editingUser, 
  userForm, 
  setUserForm, 
  handleSaveUser, 
  saving 
}: Props) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserIcon size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {editingUser ? "Modifier l'Utilisateur" : "Nouvel Utilisateur"}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configuraion du compte agent</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSaveUser} className="p-8 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prénom</label>
              <input 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                value={userForm.prenom}
                onChange={e => setUserForm({...userForm, prenom: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom</label>
              <input 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                value={userForm.nom}
                onChange={e => setUserForm({...userForm, nom: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email professionnel</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                required
                type="email"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-5 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                value={userForm.email}
                onChange={e => setUserForm({...userForm, email: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Login / Identifiant</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-5 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                  value={userForm.login}
                  onChange={e => setUserForm({...userForm, login: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{editingUser ? "Nouv. Mot de passe" : "Mot de passe"}</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  required={!editingUser}
                  type="password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-5 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                  value={userForm.password}
                  onChange={e => setUserForm({...userForm, password: e.target.value})}
                  placeholder={editingUser ? "\u2022\u2022\u2022\u2022\u2022\u2022" : ""}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rôle du compte</label>
            <div className="relative">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-5 outline-none focus:border-blue-500 transition-all font-bold text-sm appearance-none"
                value={userForm.role}
                onChange={e => setUserForm({...userForm, role: e.target.value})}
              >
                <option value="SAISIE">Saisie</option>
                <option value="INSTRUCTEUR">Instructeur</option>
                <option value="CONTROLEUR">Contrôleur</option>
                <option value="ADMINISTRATEUR">Administrateur</option>
              </select>
            </div>
          </div>

          <div className="pt-6 flex flex-col gap-3">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-xl font-black shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {editingUser ? "Mettre à jour" : "Créer le compte"}
            </button>
            <button type="button" onClick={onClose} className="w-full py-2 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
}
