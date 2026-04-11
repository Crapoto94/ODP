"use client";
import React from 'react';
import { 
  Users as UsersIcon, 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  ShieldCheck, 
  UserCircle 
} from 'lucide-react';

interface Props {
  users: any[];
  loadingUsers: boolean;
  openUserModal: (user?: any) => void;
  handleDeleteUser: (id: number) => void;
}

export default function UsersTab({ users, loadingUsers, openUserModal, handleDeleteUser }: Props) {
  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <UsersIcon className="text-blue-600" size={24} />
             Comptes Utilisateurs
          </h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Gestion des accès et des rôles</p>
        </div>
        <button 
          onClick={() => openUserModal()}
          className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95"
        >
          <Plus size={16} /> Ajouter un Utilisateur
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        {loadingUsers ? (
          <div className="flex flex-col items-center justify-center h-[400px] gap-4">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Chargement des comptes...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] gap-4 opacity-30">
            <UsersIcon size={48} className="text-slate-300" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucun utilisateur enregistré</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilisateur</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identifiants</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rôle</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user: any) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs shadow-inner">
                        {user.nom[0]}{user.prenom[0]}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm leading-none">{user.prenom} {user.nom}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block">{user.login}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit ${
                      user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {user.role === 'ADMIN' ? <ShieldCheck size={10} /> : <UserCircle size={10} />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => openUserModal(user)} className="p-2.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteUser(user.id)} className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
