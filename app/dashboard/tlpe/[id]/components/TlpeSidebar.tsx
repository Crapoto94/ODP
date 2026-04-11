import React from 'react';
import { User, Plus, Mail, Smartphone, Trash2, ImageIcon, Maximize2 } from 'lucide-react';

interface Props {
  occupation: any;
  isFactured: boolean;
  onOpenContactModal: () => void;
  onDeleteContact: (id: number) => void;
}

export default function TlpeSidebar({
  occupation,
  isFactured,
  onOpenContactModal,
  onDeleteContact
}: Props) {
  const photoList = occupation.photos ? occupation.photos.split(',').filter(Boolean) : [];

  return (
    <div className="lg:col-span-4 space-y-8">
      {/* Contacts */}
      <section className="bg-white rounded-[3rem] border border-slate-100 p-10 space-y-8 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Contacts référents</h3>
          {!isFactured && (
            <button onClick={onOpenContactModal} className="p-2.5 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-600 hover:text-white transition-all">
              <Plus size={18} />
            </button>
          )}
        </div>

        <div className="space-y-6">
          {!occupation.contacts || occupation.contacts.length === 0 ? (
            <p className="text-[10px] font-bold text-slate-300 uppercase italic text-center py-4 tracking-widest">Aucun contact enregistré</p>
          ) : (
            occupation.contacts.map((c: any) => (
              <div key={c.id} className="group relative bg-slate-50/50 rounded-2xl p-6 border border-transparent hover:border-purple-100 hover:bg-white transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-purple-600 transition-colors">
                    <User size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate uppercase">{c.prenom} {c.nom}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{c.role || 'Contact'}</p>
                    
                    <div className="mt-4 space-y-2">
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-purple-600 transition-colors">
                          <Mail size={12} /> {c.email}
                        </a>
                      )}
                      {c.telephone && (
                        <a href={`tel:${c.telephone}`} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-purple-600 transition-colors">
                          <Smartphone size={12} /> {c.telephone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                {!isFactured && (
                  <button onClick={() => onDeleteContact(c.id)} className="absolute top-4 right-4 p-2 text-slate-200 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Photos Widget */}
      <section className="bg-slate-900 rounded-[3rem] p-10 text-white space-y-8 shadow-2xl">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Photos Terrain</h3>
        <div className="grid grid-cols-2 gap-4">
          {photoList.length > 0 ? photoList.map((url: string, i: number) => (
            <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-white/10 relative group bg-slate-800">
              <img src={url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" alt={`Photo ${i+1}`} />
              <a href={url} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 size={24} />
              </a>
            </div>
          )) : (
            <div className="col-span-2 py-10 text-center border-2 border-dashed border-white/5 rounded-2xl">
              <ImageIcon size={32} className="mx-auto mb-3 opacity-10" />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Aucune photo</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
