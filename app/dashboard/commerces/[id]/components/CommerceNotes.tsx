import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MessageSquare, Loader2, Clock, Mail, FileText, Paperclip, X, Send } from 'lucide-react';
import { useCommerceNotesLogic } from '../hooks/useCommerceNotesLogic';

interface Props {
  tiersId: number;
  currentUser: any;
}

export default function CommerceNotes({ tiersId, currentUser }: Props) {
  const { notes, loading, newNote, setNewNote, submitting, pj, setPj, uploading, isEmailMode, setIsEmailMode, selectedContactId, setSelectedContactId, isHarvesting, contacts, handleHarvest, handleFileUpload, handleSubmit } = useCommerceNotesLogic(tiersId, currentUser);

  return (
    <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-8 flex flex-col gap-8 min-h-[400px]">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/50">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <MessageSquare size={14} /> Fil d'événements
        </h3>
      </div>

      <div className="flex-1 space-y-4 max-h-[500px] overflow-y-auto px-2">
        {loading ? (
          <div className="flex items-center justify-center h-full py-10 opacity-30">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : (() => {
          return notes.length === 0 ? (
            <div className="text-center py-20 opacity-20">
              <MessageSquare size={40} className="mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest italic">Aucun message pour le moment</p>
            </div>
          ) : (
            notes.map((note: any) => {
              const isAutomatic = note.author === 'Système';
              const isMe = !isAutomatic && (note.author === 'Conseiller' || note.author === "Mairie d'Ivry-sur-Seine" || (currentUser && note.author === `${currentUser.prenom} ${currentUser.nom}`));
              const isReceived = !isAutomatic && note.isEmail && !isMe;

              let bgColor, textColor;
              if (isAutomatic) {
                bgColor = 'bg-blue-50 border-blue-100';
                textColor = 'text-blue-900';
              } else {
                bgColor = isMe ? (note.isEmail ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-700') : (isReceived ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100');
                textColor = isMe ? 'text-white' : (isReceived ? 'text-emerald-900' : 'text-slate-800');
              }

              return (
                <div key={note.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-5 border ${bgColor} ${textColor}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[8px] font-black uppercase">{note.author}</span>
                      {note.isEmail && !isAutomatic && <span className="text-[7px] font-black uppercase px-2 py-1 bg-white/20 rounded-full"><Mail size={8} /></span>}
                    </div>
                    <p className="text-sm font-medium mb-2">{note.content}</p>
                    {note.pjPath && (
                      <div className={`mt-3 pt-3 border-t ${isAutomatic ? 'border-blue-200' : 'border-white/10'}`}>
                        {note.pjPath.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                          <img src={note.pjPath} alt="Attachment" className="max-w-sm rounded-lg" />
                        ) : (
                          <a href={note.pjPath} target="_blank" rel="noreferrer" className={`flex items-center gap-2 text-xs hover:opacity-80 ${isAutomatic ? 'text-blue-600' : ''}`}>
                            <FileText size={12} /> {note.pjName || 'Document'}
                          </a>
                        )}
                      </div>
                    )}
                    <div className="text-[8px] font-bold mt-2">{format(new Date(note.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}</div>
                  </div>
                </div>
              );
            })
          );
        })()}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-200 pt-6 space-y-4">
        {isEmailMode && (
          <select value={selectedContactId} onChange={e => setSelectedContactId(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm">
            {contacts.map(c => (
              <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-3">
          <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Votre message..." rows={3} className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl resize-none focus:outline-none focus:border-blue-500" />
          <div className="flex flex-col gap-2">
            <label className="w-10 h-10 bg-slate-100 hover:bg-blue-100 rounded-xl flex items-center justify-center cursor-pointer transition-all text-slate-400 hover:text-blue-600" title="Joindre un fichier">
              <Paperclip size={18} />
              <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx" />
            </label>
            <button type="button" onClick={() => setIsEmailMode(!isEmailMode)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isEmailMode ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`} title="Mode email">
              <Mail size={18} />
            </button>
          </div>
        </div>
        {pj && <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-2 rounded-lg"><FileText size={12} /> {pj.name} <button type="button" onClick={() => setPj(null)} className="ml-auto"><X size={12} /></button></div>}
        <button type="submit" disabled={submitting || uploading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-50">
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Envoyer
        </button>
      </form>
    </div>
  );
}
