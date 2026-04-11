"use client";
import React, { useState, useEffect } from 'react';
import { 
  History, 
  X, 
  CheckCircle2, 
  Zap, 
  Plus, 
  Loader2, 
  Bug, 
  Lightbulb, 
  Activity,
  ChevronRight,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

interface Release {
  versionNumber: string;
  notes: string;
  releasedAt: string;
  backlogItems: any[];
}

interface BacklogItem {
  id: number;
  title: string;
  type: string;
  priority: string;
  status: string;
  created_at: string;
  comments?: { content: string }[];
}

export default function GlobalVersionModal() {
  const [showNotes, setShowNotes] = useState(false);
  const [view, setView] = useState<'HISTORY' | 'BACKLOG'>('HISTORY');
  const [releases, setReleases] = useState<Release[]>([]);
  const [backlog, setBacklog] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '', 
    priority: 'MEDIUM',
    type: 'FEATURE'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [relRes, backRes] = await Promise.all([
        axios.get('/api/releases'),
        axios.get('/api/backlog')
      ]);
      setReleases(relRes.data);
      // Filter items that are not attached to any version yet
      setBacklog(backRes.data.filter((i: any) => !i.versionId));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showNotes) {
      fetchData();
    }

    const handleOpen = () => setShowNotes(true);
    window.addEventListener('open-whatsnew', handleOpen);
    return () => window.removeEventListener('open-whatsnew', handleOpen);
  }, [showNotes]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    setAdding(true);
    try {
      await axios.post('/api/backlog', {
        ...formData,
        description: 'Ajouté depuis le journal des versions'
      });
      setFormData({ title: '', priority: 'MEDIUM', type: 'FEATURE' });
      setShowAddForm(false);
      fetchData(); // Refresh list
    } catch (e) {
      alert("Erreur lors de l'ajout");
    } finally {
      setAdding(false);
    }
  };

  const getPriorityStyle = (p: string) => {
    switch(p) {
      case 'URGENT': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'HIGH': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'MEDIUM': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTypeIcon = (t: string) => {
    switch(t) {
      case 'BUG': return <Bug size={14} />;
      case 'IMPROVEMENT': return <Activity size={14} />;
      default: return <Lightbulb size={14} />;
    }
  };

  if (!showNotes) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setShowNotes(false)}></div>
      <div className="bg-white/95 backdrop-blur-2xl w-full max-w-2xl rounded-3xl shadow-3xl relative overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh] border border-white/20">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white/50 relative">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <Zap size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Journal & Backlog</h3>
            </div>
            
            {/* View Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
               <button 
                 onClick={() => setView('HISTORY')}
                 className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                   view === 'HISTORY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                 }`}
               >
                 Historique
               </button>
               <button 
                 onClick={() => setView('BACKLOG')}
                 className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                   view === 'BACKLOG' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                 }`}
               >
                 Backlog
               </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                showAddForm ? 'bg-slate-100 text-slate-600' : 'bg-slate-950 text-white shadow-xl shadow-slate-900/20 active:scale-95'
              }`}
            >
              {showAddForm ? <X size={14} /> : <Plus size={14} />}
              {showAddForm ? "Annuler" : "Nouvelle Demande"}
            </button>
            <button onClick={() => setShowNotes(false)} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-300 hover:text-slate-900 transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Scroll Area */}
        <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Quick Add Form Section */}
          {showAddForm && (
            <form onSubmit={handleQuickAdd} className="bg-slate-50 border border-slate-100 p-6 rounded-2xl animate-in slide-in-from-top-4 duration-300 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sujet de la demande</label>
                  <input 
                    required
                    autoFocus
                    className="w-full bg-white border border-slate-200 rounded-xl py-4 px-6 outline-none focus:border-blue-500 transition-all font-bold text-sm shadow-sm"
                    placeholder="Ex: Ajouter l'export Excel des tarifs..."
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Typologie</label>
                     <div className="flex bg-white border border-slate-200 p-1.5 rounded-xl gap-1">
                        {[
                          { id: 'BUG', label: 'Bug', icon: Bug, color: 'text-rose-500' },
                          { id: 'IMPROVEMENT', label: 'Amél.', icon: Activity, color: 'text-blue-500' },
                          { id: 'FEATURE', label: 'Fonct.', icon: Lightbulb, color: 'text-emerald-500' }
                        ].map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, type: t.id })}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${
                              formData.type === t.id ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            <t.icon size={12} className={formData.type === t.id ? 'text-white' : t.color} />
                            {t.label}
                          </button>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priorité</label>
                     <div className="flex bg-white border border-slate-200 p-1.5 rounded-xl gap-1">
                        {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setFormData({ ...formData, priority: p })}
                            className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${
                              formData.priority === p ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            {p === 'MEDIUM' ? 'Moy.' : p === 'URGENT' ? 'Urg.' : p.slice(0, 3) + '.'}
                          </button>
                        ))}
                     </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={adding || !formData.title}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2"
                >
                  {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Soumettre au Backlog
                </button>
              </div>
            </form>
          )}

          {/* History View */}
          {view === 'HISTORY' && (
            <div className="space-y-10">
              {releases.length === 0 ? (
                <div className="py-20 text-center space-y-4 opacity-30">
                   <History size={48} className="mx-auto" />
                   <p className="text-[10px] font-black uppercase tracking-[0.2em]">Aucune version déployée</p>
                </div>
              ) : (
                releases.map((rel, idx) => (
                  <div key={rel.versionNumber} className={`relative pl-12 ${idx !== releases.length - 1 ? 'border-l-2 border-slate-100 pb-12 mb-2' : ''}`}>
                    <div className="absolute left-0 top-0 -translate-x-[calc(50%+1px)] w-6 h-6 rounded-xl bg-white border-2 border-blue-600 flex items-center justify-center shadow-lg transform rotate-45">
                       <Zap size={10} className="text-blue-600 -rotate-45" />
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4">
                       <h4 className="text-2xl font-black text-slate-900 tracking-tighter">v{rel.versionNumber}</h4>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                         {new Date(rel.releasedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                       </span>
                    </div>
                    
                    {rel.notes && (
                      <div className="bg-slate-50/80 backdrop-blur-sm border border-slate-100 p-6 rounded-2xl mb-6 shadow-sm">
                        <p className="text-sm font-semibold text-slate-600 leading-relaxed italic">"{rel.notes}"</p>
                      </div>
                    )}
                    
                    {rel.backlogItems && rel.backlogItems.length > 0 && (
                      <div className="grid grid-cols-1 gap-2.5">
                        {rel.backlogItems.map((item: any) => (
                          <div key={item.id} className="flex items-center group/item hover:translate-x-1 transition-transform cursor-default">
                             <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                               <CheckCircle2 size={12} />
                             </div>
                             <div className="flex items-center gap-3 ml-3">
                                <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-tighter flex items-center gap-1 border ${
                                  item.type === 'BUG' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                  item.type === 'IMPROVEMENT' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                  'bg-slate-50 text-slate-600 border-slate-200'
                                }`}>
                                  {getTypeIcon(item.type)} {item.type}
                                </span>
                                <span className="text-sm font-bold text-slate-700 group-hover/item:text-slate-900 transition-colors">{item.title}</span>
                             </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Backlog View */}
          {view === 'BACKLOG' && (
            <div className="space-y-6">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 text-slate-400">
                     <AlertCircle size={20} />
                     <p className="text-[10px] font-black uppercase tracking-widest">Demandes en attente</p>
                  </div>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{backlog.length} items</span>
               </div>

               {backlog.length === 0 ? (
                 <div className="py-20 text-center space-y-4 opacity-30">
                    <MessageSquare size={48} className="mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Le backlog est à jour</p>
                 </div>
               ) : (
                 <div className="space-y-3">
                   {backlog.map((item) => (
                     <div key={item.id} className="group bg-white hover:bg-slate-50 border border-slate-100 p-5 rounded-2xl transition-all shadow-sm hover:shadow-md flex items-center justify-between gap-6">
                        <div className="flex-1 flex items-center gap-5">
                           <div className={`p-3 rounded-xl border ${getPriorityStyle(item.priority)} shadow-sm`}>
                             {getTypeIcon(item.type)}
                           </div>
                           <div className="space-y-1">
                              <h5 className="text-sm font-black text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{item.title}</h5>
                              
                              {item.comments && item.comments.length > 0 && (
                                <p className="text-[11px] font-medium text-slate-500 italic bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100/50 line-clamp-2">
                                  "{item.comments[0].content}"
                                </p>
                              )}

                              <div className="flex items-center gap-3">
                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ajouté le {new Date(item.created_at).toLocaleDateString()}</span>
                                 <span className="w-1 h-1 rounded-full bg-slate-200" />
                                 <span className={`text-[8px] font-black uppercase tracking-widest ${
                                   item.priority === 'URGENT' ? 'text-rose-500' : 'text-slate-400'
                                 }`}>Priorité {item.priority}</span>
                                 <span className="w-1 h-1 rounded-full bg-slate-200" />
                                 <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                                   item.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' :
                                   item.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                                   'bg-blue-100 text-blue-700'
                                 }`}>
                                   {item.status === 'DONE' ? 'Accepté' : item.status === 'REJECTED' ? 'Refusé' : 'En attente'}
                                 </span>
                              </div>
                           </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-200 group-hover:text-blue-400 transition-all group-hover:translate-x-1" />
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
