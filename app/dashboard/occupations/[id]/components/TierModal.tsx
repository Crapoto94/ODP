import React from 'react';
import { X, Building2, MapPin, Phone, Mail } from 'lucide-react';

interface Tier {
  id: number;
  nom: string;
  code_sedit?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  telephoneGenerique?: string;
  emailGenerique?: string;
  contacts?: Array<{
    id: number;
    prenom?: string;
    nom?: string;
    email?: string;
    telephone?: string;
    role?: string;
  }>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tier: Tier | null;
}

export default function TierModal({ isOpen, onClose, tier }: Props) {
  if (!isOpen || !tier) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <Building2 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 leading-tight">Informations du Tiers</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{tier.nom}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Nom */}
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Raison Sociale</p>
              <p className="text-sm font-black text-slate-900">{tier.nom}</p>
            </div>

            {/* Code SEDIT */}
            {tier.code_sedit && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Code SEDIT</p>
                <p className="text-sm font-black text-slate-900">{tier.code_sedit}</p>
              </div>
            )}

            {/* Adresse */}
            {(tier.adresse || tier.codePostal || tier.ville) && (
              <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
                <MapPin size={16} className="text-emerald-600 mt-1 shrink-0" />
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Adresse</p>
                  <div className="text-sm font-black text-slate-900 space-y-1">
                    {tier.adresse && <p>{tier.adresse}</p>}
                    {(tier.codePostal || tier.ville) && (
                      <p>{tier.codePostal} {tier.ville}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Téléphone */}
            {tier.telephoneGenerique && (
              <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
                <Phone size={16} className="text-emerald-600 mt-1 shrink-0" />
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Téléphone</p>
                  <a href={`tel:${tier.telephoneGenerique}`} className="text-sm font-black text-emerald-600 hover:text-emerald-700">
                    {tier.telephoneGenerique}
                  </a>
                </div>
              </div>
            )}

            {/* Email */}
            {tier.emailGenerique && (
              <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
                <Mail size={16} className="text-emerald-600 mt-1 shrink-0" />
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Email</p>
                  <a href={`mailto:${tier.emailGenerique}`} className="text-sm font-black text-emerald-600 hover:text-emerald-700 break-all">
                    {tier.emailGenerique}
                  </a>
                </div>
              </div>
            )}

            {/* Contacts */}
            {tier.contacts && tier.contacts.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Contacts</p>
                <div className="space-y-2">
                  {tier.contacts.map((contact) => (
                    <div key={contact.id} className="bg-white rounded-lg p-3 text-sm">
                      <p className="font-black text-slate-900">
                        {contact.prenom} {contact.nom}
                      </p>
                      {contact.role && (
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest">{contact.role}</p>
                      )}
                      {(contact.email || contact.telephone) && (
                        <div className="text-[9px] text-slate-600 mt-1 space-y-0.5">
                          {contact.email && <p>{contact.email}</p>}
                          {contact.telephone && <p>{contact.telephone}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
