import React from 'react';
import { User, Mail, Smartphone, Trash2, Pencil, Plus } from 'lucide-react';

interface Contact {
  id: number;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  titre?: string;
  entreprise?: string;
  role: string;
  pjPath?: string;
}

interface Props {
  contacts: Contact[];
  isLoading?: boolean;
  onOpenContactModal: () => void;
  onDeleteContact: (id: number) => void;
  onEditContact?: (contact: Contact) => void;
  isFactured?: boolean;
}

export default function CommerceContacts({
  contacts,
  isLoading,
  onOpenContactModal,
  onDeleteContact,
  onEditContact,
  isFactured
}: Props) {
  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
          <User size={16} className="text-emerald-500" /> Contacts & Référents ({contacts.length})
        </h3>
        {!isFactured && (
          <button
            onClick={onOpenContactModal}
            className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
            title="Ajouter un contact"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="py-8 text-center text-slate-300">Chargement...</div>
        ) : contacts.length > 0 ? (
          contacts.map((contact) => (
            <div key={contact.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm group hover:border-emerald-400 transition-all flex items-center justify-between hover:shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-5 min-w-0">
                {contact.pjPath ? (
                  <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden border border-slate-100 bg-slate-50 shrink-0 shadow-inner">
                    <img src={contact.pjPath} className="w-full h-full object-cover" alt="Contact" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shrink-0">
                    <User size={28} />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border text-emerald-600 bg-emerald-50 border-emerald-100/50">
                    {contact.role || 'Contact'}
                  </span>
                  <p className="text-base font-black text-slate-950 truncate mt-2 uppercase">
                    {contact.prenom} {contact.nom}
                  </p>
                  <div className="flex flex-col gap-1.5 mt-2">
                    {contact.email && (
                      <span className="text-[10px] font-black text-slate-400 flex items-center gap-2">
                        <Mail size={12} className="shrink-0 text-slate-300" />
                        <span className="truncate">{contact.email}</span>
                      </span>
                    )}
                    {contact.telephone && (
                      <a href={`tel:${contact.telephone}`} className="text-[10px] font-black text-slate-400 hover:text-emerald-600 flex items-center gap-2 transition-colors">
                        <Smartphone size={12} className="shrink-0 text-slate-300" />
                        {contact.telephone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              {!isFactured && (
                <div className="opacity-0 group-hover:opacity-100 flex flex-col gap-1.5 transition-all">
                  {onEditContact && (
                    <button
                      onClick={() => onEditContact(contact)}
                      className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Modifier ce contact"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteContact(contact.id)}
                    className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    title="Supprimer ce contact"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center">
            <User size={24} className="text-slate-200 mb-4" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Aucun contact référent</p>
          </div>
        )}
      </div>
    </section>
  );
}
