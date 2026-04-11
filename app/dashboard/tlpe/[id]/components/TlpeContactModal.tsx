import React from 'react';
import { X, User, Loader2, Plus } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  newContact: any;
  setNewContact: (c: any) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function TlpeContactModal({
  isOpen,
  onClose,
  newContact,
  setNewContact,
  isSubmitting,
  onSubmit
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                <User size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 leading-tight">Nouveau Contact</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Référent du dossier</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Prénom</label>
                <input type="text" required value={newContact.prenom} onChange={e => setNewContact({...newContact, prenom: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:border-purple-500 font-bold transition-all text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Nom</label>
                <input type="text" value={newContact.nom} onChange={e => setNewContact({...newContact, nom: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:border-purple-500 font-bold transition-all text-sm uppercase" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Email</label>
              <input type="email" required value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:border-purple-500 font-bold transition-all text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Rôle / Type</label>
              <select value={newContact.role} onChange={e => setNewContact({...newContact, role: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:border-purple-500 font-bold transition-all text-sm appearance-none cursor-pointer">
                <option value="Contact principal">Contact principal</option>
                <option value="Dirigeant">Dirigeant</option>
                <option value="Responsable technique">Responsable technique</option>
                <option value="Administratif">Administratif</option>
              </select>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-500/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Enregistrer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
