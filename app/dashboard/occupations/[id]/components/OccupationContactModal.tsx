import React, { useState, useEffect } from 'react';
import { X, User, ImageIcon, Loader2, Plus } from 'lucide-react';
import { Contact } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  newContact: Partial<Contact>;
  setNewContact: React.Dispatch<React.SetStateAction<Partial<Contact>>>;
  isSubmittingContact: boolean;
  onAddContact: (e: React.FormEvent) => void;
  onPhotoContact: (e: React.ChangeEvent<HTMLInputElement>) => void;
  editingContactId?: number | null;
}

const RequiredLabel = ({ label, required }: { label: string; required?: boolean }) => (
  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">
    {label}
    {required && <span className="text-rose-600 ml-1">*</span>}
  </label>
);

export default function OccupationContactModal({
  isOpen,
  onClose,
  newContact,
  setNewContact,
  isSubmittingContact,
  onAddContact,
  onPhotoContact,
  editingContactId,
}: Props) {
  const [roles, setRoles] = useState<{ id: number; nom: string; isSendAot: boolean }[]>([
    { id: 1, nom: 'Contact principal', isSendAot: true },
    { id: 2, nom: 'Demandeur', isSendAot: true },
    { id: 3, nom: 'Gérant', isSendAot: false },
    { id: 4, nom: "Architecte / Maitre d'œuvre", isSendAot: false },
    { id: 5, nom: 'Conducteur de travaux', isSendAot: false },
    { id: 6, nom: 'Contact administratif', isSendAot: false },
    { id: 7, nom: 'Autre', isSendAot: false },
  ]);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/settings/contact-roles')
      .then(r => r.json())
      .then(data => Array.isArray(data) && setRoles(data))
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <User size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 leading-tight">{editingContactId ? 'Modifier le Contact' : 'Ajouter un Contact'}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Personne référente pour ce dossier</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={onAddContact} className="space-y-6">
            <div className="flex justify-center">
              {newContact.pjPath ? (
                <div className="relative w-40 aspect-[1.6/1] rounded-2xl overflow-hidden border-2 border-slate-100 shadow-md">
                  <img src={newContact.pjPath} className="w-full h-full object-contain bg-slate-50" alt="Business Card" />
                  <button 
                    type="button"
                    onClick={() => setNewContact({...newContact, pjPath: ''})}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-rose-600 transition-all"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={() => document.getElementById('contact-photo-input')?.click()}
                  className="w-40 aspect-[1.6/1] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-300 hover:text-blue-500 hover:border-blue-300 transition-all bg-slate-50/50"
                >
                  <ImageIcon size={32} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Carte de visite</span>
                </button>
              )}
              <input id="contact-photo-input" type="file" accept="image/*" className="hidden" onChange={onPhotoContact} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <RequiredLabel label="Prénom" />
                <input
                  type="text"
                  value={newContact.prenom || ''}
                  onChange={e => setNewContact({...newContact, prenom: e.target.value})}
                  placeholder="Jean"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:border-blue-500 font-bold transition-all text-sm"
                />
              </div>
              <div className="space-y-2">
                <RequiredLabel label="Nom" />
                <input
                  type="text"
                  value={newContact.nom || ''}
                  onChange={e => setNewContact({...newContact, nom: e.target.value})}
                  placeholder="Dupont"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:border-blue-500 font-bold transition-all text-sm uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <RequiredLabel label="Entreprise" />
                <input
                  type="text"
                  value={newContact.entreprise || ''}
                  onChange={e => setNewContact({...newContact, entreprise: e.target.value})}
                  placeholder="Société..."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:border-blue-500 font-bold transition-all text-sm uppercase"
                />
              </div>
              <div className="space-y-2">
                <RequiredLabel label="Titre / Fonction" />
                <input
                  type="text"
                  value={newContact.titre || ''}
                  onChange={e => setNewContact({...newContact, titre: e.target.value})}
                  placeholder="Gérant, Dirigeant..."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:border-blue-500 font-bold transition-all text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <RequiredLabel label="Email" />
                <input
                  type="email"
                  value={newContact.email || ''}
                  onChange={e => setNewContact({...newContact, email: e.target.value})}
                  placeholder="jean@exemple.fr"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:border-blue-500 font-bold transition-all text-sm"
                />
              </div>
              <div className="space-y-2">
                <RequiredLabel label="Téléphone" />
                <input
                  type="tel"
                  value={newContact.telephone || ''}
                  onChange={e => setNewContact({...newContact, telephone: e.target.value})}
                  placeholder="06..."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:border-blue-500 font-bold transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <RequiredLabel label="Rôle / Type de Contact" />
              <select
                value={newContact.role || 'Contact principal'}
                onChange={e => setNewContact({...newContact, role: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:border-blue-500 font-bold transition-all text-sm appearance-none"
              >
                {roles.map(r => (
                  <option key={r.id} value={r.nom}>{r.nom}{r.isSendAot ? ' ✉' : ''}</option>
                ))}
              </select>
              <p className="text-[9px] text-slate-400 ml-4">Les rôles marqués ✉ recevront l'AOT</p>
            </div>

            <button
              type="submit"
              disabled={isSubmittingContact}
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmittingContact ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Enregistrer le Contact
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
