import React from 'react';
import { X, User, ImageIcon, Loader2, Plus } from 'lucide-react';

export interface Contact {
  id: number;
  nom: string | null;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  titre: string | null;
  role: string | null | undefined;
  pjPath: string | null;
  entreprise: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  newContact: Partial<Contact>;
  setNewContact: (contact: Partial<Contact>) => void;
  isSubmittingContact: boolean;
  onAddContact: (e: React.FormEvent) => void;
  onPhotoContact: (e: React.ChangeEvent<HTMLInputElement>) => void;
  title?: string;
  subtitle?: string;
}

export default function ContactModal({
  isOpen,
  onClose,
  newContact,
  setNewContact,
  isSubmittingContact,
  onAddContact,
  onPhotoContact,
  title = "Ajouter un Contact",
  subtitle = "Personne référente pour cet élément"
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <User size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 leading-tight">{title}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={onAddContact} className="space-y-6">
            <div className="flex justify-center">
              {newContact?.pjPath ? (
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Prénom</label>
                <input
                  type="text"
                  required
                  value={newContact.prenom || ''}
                  onChange={e => setNewContact({...newContact, prenom: e.target.value})}
                  placeholder="Jean"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 font-bold transition-all text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Nom</label>
                <input
                  type="text"
                  value={newContact.nom || ''}
                  onChange={e => setNewContact({...newContact, nom: e.target.value})}
                  placeholder="Dupont"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 font-bold transition-all text-sm uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Entreprise</label>
                <input
                  type="text"
                  value={newContact.entreprise || ''}
                  onChange={e => setNewContact({...newContact, entreprise: e.target.value})}
                  placeholder="Société..."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 font-bold transition-all text-sm uppercase"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Titre / Fonction</label>
                <input
                  type="text"
                  value={newContact.titre || ''}
                  onChange={e => setNewContact({...newContact, titre: e.target.value})}
                  placeholder="Gérant, Dirigeant..."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 font-bold transition-all text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Email</label>
                <input
                  type="email"
                  required
                  value={newContact.email || ''}
                  onChange={e => setNewContact({...newContact, email: e.target.value})}
                  placeholder="jean@exemple.fr"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 font-bold transition-all text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Téléphone</label>
                <input
                  type="tel"
                  value={newContact.telephone || ''}
                  onChange={e => setNewContact({...newContact, telephone: e.target.value})}
                  placeholder="06..."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 font-bold transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Rôle / Type de Contact</label>
              <select
                value={newContact.role || 'Contact principal'}
                onChange={e => setNewContact({...newContact, role: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 font-bold transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="Contact principal">Contact principal</option>
                <option value="Gérant">Gérant</option>
                <option value="Architecte / Maitre d'œuvre">Architecte / Maitre d'œuvre</option>
                <option value="Conducteur de travaux">Conducteur de travaux</option>
                <option value="Contact administratif">Contact administratif</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmittingContact}
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
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
