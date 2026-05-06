import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  MessageSquare, 
  Loader2, 
  Clock, 
  Smartphone, 
  Mail, 
  FileText, 
  ImageIcon, 
  FileArchive, 
  ExternalLink, 
  Download, 
  Paperclip, 
  X, 
  Mic, 
  Send 
} from 'lucide-react';
import { useNotesLogic } from '../hooks/useNotesLogic';

interface Props {
  occupationId: number;
  currentUser: any;
}

export default function OccupationNotes({ occupationId, currentUser }: Props) {
  const {
    notes,
    loading,
    newNote,
    setNewNote,
    submitting,
    isRecording,
    pj,
    setPj,
    uploading,
    isEmailMode,
    setIsEmailMode,
    selectedContactId,
    setSelectedContactId,
    isHarvesting,
    contacts,
    handleHarvest,
    handleFileUpload,
    startDictation,
    handleSubmit
  } = useNotesLogic(occupationId, currentUser);

  return (
    <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-8 flex flex-col gap-8 min-h-[400px]">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/50">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <MessageSquare size={14} /> Fil d'événements
        </h3>
        <button 
          onClick={handleHarvest}
          disabled={isHarvesting}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 rounded-lg font-bold text-[9px] uppercase tracking-tighter transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          {isHarvesting ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
          Synchroniser mails
        </button>
      </div>

      <div className="flex-1 space-y-4 max-h-[500px] overflow-y-auto px-2 scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center h-full py-10 opacity-30">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-20 opacity-20">
             <MessageSquare size={40} className="mx-auto mb-2" />
             <p className="text-[10px] font-black uppercase tracking-widest italic">Aucun message pour le moment</p>
          </div>
        ) : (
          notes.map((note: any) => {
            const isMe = note.author === 'Conseiller' || 
                         note.author === "Mairie d'Ivry-sur-Seine" ||
                         (currentUser && note.author === `${currentUser.prenom} ${currentUser.nom}`);
            
            const isReceived = note.isEmail && !isMe;
            const isSentEmail = note.isEmail && isMe;

            let bgColor = 'bg-white border-slate-100 shadow-slate-200/20';
            let textColor = 'text-slate-800';
            let metaColor = 'text-slate-400';
            let dateColor = 'text-slate-300';
            let badgeStyle = 'bg-slate-50 border-slate-200 text-slate-400';

            if (isMe) {
               if (isSentEmail) {
                  bgColor = 'bg-indigo-600 border-indigo-500 shadow-indigo-500/20';
                  textColor = 'text-white';
                  metaColor = 'text-indigo-100';
                  dateColor = 'text-indigo-200';
                  badgeStyle = 'bg-indigo-500 border-indigo-400 text-indigo-100';
               } else {
                  bgColor = 'bg-slate-800 border-slate-700 shadow-slate-900/20';
                  textColor = 'text-white';
                  metaColor = 'text-slate-300';
                  dateColor = 'text-slate-400';
                  badgeStyle = 'bg-slate-700 border-slate-600 text-slate-300';
               }
            } else if (isReceived) {
               bgColor = 'bg-emerald-50 border-emerald-100 shadow-emerald-200/20';
               textColor = 'text-emerald-900';
               metaColor = 'text-emerald-600';
               dateColor = 'text-emerald-400';
               badgeStyle = 'bg-emerald-100 border-emerald-200 text-emerald-600';
            }

            return (
            <div key={note.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
               <div className={`max-w-[80%] rounded-2xl p-5 shadow-sm border ${
                 isMe ? 'rounded-tr-none' : 'rounded-tl-none'
               } ${bgColor} ${textColor}`}>
                  <div className="flex items-center justify-between gap-10 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black uppercase tracking-widest ${metaColor}`}>
                        {note.author}
                      </span>
                      {note.origin === 'mobile' && (
                        <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-500" title="Saisie sur le terrain">
                          <Smartphone size={10} strokeWidth={3} />
                        </span>
                      )}
                      {note.isEmail && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase border flex items-center gap-1 ${badgeStyle}`}>
                          <Mail size={8} /> Mail
                        </span>
                      )}
                    </div>
                    <span className={`text-[8px] font-bold ${dateColor}`}>
                      {note.created_at ? format(new Date(note.created_at), 'dd MMM HH:mm', { locale: fr }) : ''}
                    </span>
                  </div>
                  {note.content === 'Photo terrain' || note.content === '' ? (
                    <div className="flex items-center gap-2 text-[var(--text-dim)] opacity-40 italic py-2">
                       <Smartphone size={14} />
                       <span className="text-[10px] font-bold uppercase tracking-widest">Saisie terrain</span>
                    </div>
                  ) : (
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  )}
                  
                  {note.pjPath && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                      {note.pjPath.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                        <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/5 max-w-md group relative">
                          <a href={note.pjPath} target="_blank" rel="noreferrer">
                            <img 
                              src={note.pjPath} 
                              alt={note.pjName} 
                              className="w-full h-auto object-cover max-h-64 transition-transform duration-500 group-hover:scale-110" 
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <ImageIcon size={32} className="text-white drop-shadow-lg" />
                            </div>
                          </a>
                        </div>
                      ) : (
                        <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                          isMe ? 'bg-white/10 border-white/10 hover:bg-white/20' : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'
                        }`}>
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                             isMe ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                           }`}>
                              {note.pjName?.endsWith('.pdf') ? <FileText size={24} /> : <FileArchive size={24} />}
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className={`text-xs font-black truncate ${isMe ? 'text-white' : 'text-slate-900'}`}>{note.pjName || 'Document'}</p>
                              <p className={`text-[10px] uppercase font-bold tracking-widest ${isMe ? 'text-white/40' : 'text-slate-400'}`}>
                                {note.pjName?.split('.').pop() || 'Fichier'}
                              </p>
                           </div>
                           <a 
                             href={note.pjPath} 
                             target="_blank" 
                             rel="noreferrer"
                             className={`p-3 rounded-xl transition-all ${
                               isMe ? 'hover:bg-white/10 text-white' : 'hover:bg-blue-50 text-blue-600'
                             }`}
                           >
                             <ExternalLink size={18} />
                           </a>
                        </div>
                      )}

                      <a 
                        href={note.pjPath} 
                        target="_blank" 
                        rel="noreferrer"
                        className={`inline-flex items-center gap-2 p-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                          isMe ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <Download size={12} /> Télécharger
                      </a>
                    </div>
                  )}
               </div>
            </div>
          );
        })
        )}
      </div>

      <div className="space-y-4">
        {pj && (
          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 p-3 rounded-2xl animate-in slide-in-from-bottom-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <Paperclip size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Fichier prêt</p>
              <p className="text-xs font-bold text-indigo-900 truncate">{pj.name}</p>
            </div>
            <button onClick={() => setPj(null)} className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-400 transition-all">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between px-6">
           <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={() => setIsEmailMode(!isEmailMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all ${
                  isEmailMode 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-sm'
                }`}
              >
                <Mail size={14} /> Envoyer par mail
              </button>

              {isEmailMode && (
                <div className="animate-in slide-in-from-left-4 fade-in duration-300">
                  <select 
                    value={selectedContactId}
                    onChange={(e) => setSelectedContactId(e.target.value)}
                    className="bg-white border border-blue-200 text-blue-700 text-[10px] font-black uppercase tracking-widest py-2 px-4 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/5 appearance-none shadow-sm cursor-pointer"
                  >
                    {contacts.length === 0 ? (
                      <option value="">Aucun contact</option>
                    ) : (
                      contacts.map((c: any) => (
                        <option key={c.id} value={c.id}>À : {c.prenom} ({c.email})</option>
                      ))
                    )}
                  </select>
                </div>
              )}
           </div>
        </div>

        <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              rows={1}
              placeholder={isRecording ? "Écoute en cours..." : (isEmailMode ? "Rédigez votre email..." : "Écrivez une note interne...")}
              className={`w-full bg-white border rounded-xl py-5 pl-8 pr-12 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all font-medium text-sm shadow-sm resize-none ${
                isRecording ? 'animate-pulse border-blue-400 ring-4 ring-blue-500/5' : 
                isEmailMode ? 'border-blue-300 border-2' : 'border-slate-200'
              }`}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            ></textarea>
            
            <div className="absolute right-4 bottom-4 flex items-center gap-1">
              <button
                type="button"
                onClick={startDictation}
                className={`p-2 rounded-full transition-all ${isRecording ? 'bg-rose-500 text-white animate-bounce' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'}`}
                title="Dicter la note"
              >
                <Mic size={18} />
              </button>
              <label className="p-2 rounded-full text-slate-400 hover:text-blue-600 hover:bg-slate-50 cursor-pointer transition-all" title="Ajouter une pièce jointe">
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
              </label>
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={submitting || (!newNote.trim() && !pj) || (isEmailMode && !selectedContactId)}
            className={`w-14 h-14 disabled:opacity-20 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg ${
              isEmailMode ? 'bg-blue-600 shadow-blue-500/30' : 'bg-slate-900 shadow-black/10'
            }`}
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
