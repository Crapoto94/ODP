"use client";
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Clock, 
  Activity,
  ArrowUpCircle,
  Bug,
  Lightbulb,
  X,
  MessageSquare,
  Send,
  Ban,
  TrendingUp,
  Zap,
  Save,
  Unlink,
  History
} from 'lucide-react';
import axios from 'axios';
import ReleaseHistory from './backlog/ReleaseHistory';

interface BacklogComment {
  id: number;
  content: string;
  author: string;
  created_at: string;
}

interface BacklogItem {
  id: number;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  versionId?: number | null;
  created_at: string;
  comments?: BacklogComment[];
}

export default function BacklogTab() {
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVersionModal, setNewVersionModal] = useState(false);
  const [newVersion, setNewVersion] = useState({ number: "0.2.0", notes: "" });
  
  const [selectedItem, setSelectedItem] = useState<BacklogItem | null>(null);
  const [newComment, setNewComment] = useState("");
  const [rejectionModal, setRejectionModal] = useState<BacklogItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'FEATURE',
    priority: 'MEDIUM'
  });

  const fetchBacklog = async () => {
    try {
      setLoading(true);
      const [backlogRes, releasesRes] = await Promise.all([
        axios.get('/api/backlog'),
        axios.get('/api/releases')
      ]);

      // Define priority weights
      const weights: Record<string, number> = {
        'URGENT': 4,
        'HIGH': 3,
        'MEDIUM': 2,
        'LOW': 1
      };

      // Sort items by priority desc, then by date desc
      const sortedItems = backlogRes.data.sort((a: any, b: any) => {
        const weightA = weights[a.priority] || 0;
        const weightB = weights[b.priority] || 0;
        if (weightA !== weightB) return weightB - weightA;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setItems(sortedItems);
      setReleases(releasesRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBacklog();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post('/api/backlog', formData);
      setFormData({ title: '', description: '', type: 'FEATURE', priority: 'MEDIUM' });
      setShowAddForm(false);
      fetchBacklog();
    } catch (e) {
      alert("Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (item: BacklogItem, newStatus: string, comment?: string) => {
    try {
      await axios.patch(`/api/backlog/${item.id}`, { status: newStatus });
      if (comment) {
        await axios.post(`/api/backlog/${item.id}/comments`, { content: comment });
      }
      fetchBacklog();
    } catch (e) {
      alert("Erreur lors de la mise à jour");
    }
  };

  const addComment = async (itemId: number) => {
    if (!newComment.trim()) return;
    try {
      await axios.post(`/api/backlog/${itemId}/comments`, { content: newComment });
      setNewComment("");
      // Refresh only this item or entire list
      fetchBacklog();
    } catch (e) {
      alert("Erreur lors de l'ajout du commentaire");
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm("Supprimer cet élément ?")) return;
    try {
      await axios.delete(`/api/backlog/${id}`);
      fetchBacklog();
    } catch (e) {
      alert("Erreur lors de la suppression");
    }
  };

  const createRelease = async () => {
    // Only items that are DONE and not yet in a version
    const pendingDoneItems = items.filter(i => i.status === 'DONE' && !i.versionId);
    
    if (pendingDoneItems.length === 0 && !newVersion.notes) {
      alert("Veuillez saisir au moins une note de version si vous n'avez pas d'éléments du backlog à inclure.");
      return;
    }
    
    if (pendingDoneItems.length === 0 && !confirm("Aucun élément du backlog ne sera lié à cette version. Continuer ?")) {
      return;
    }
    
    setSaving(true);
    try {
      await axios.post('/api/releases', {
        versionNumber: newVersion.number,
        notes: newVersion.notes || `Release incluant ${pendingDoneItems.length} améliorations.`,
        backlogItemIds: pendingDoneItems.map(i => i.id)
      });
      setNewVersionModal(false);
      window.location.reload(); 
    } catch (e) {
      alert("Erreur lors de la création de la release");
    } finally {
      setSaving(false);
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
      case 'IMPROVEMENT': return <TrendingUp size={14} />;
      default: return <Lightbulb size={14} />;
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <Clock className="text-blue-600" size={24} />
             Backlog de Développement
          </h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Gérez les demandes et suivez les corrections</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border ${showHistory ? 'bg-slate-100 text-slate-900 border-slate-300' : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'}`}
          >
            <History size={14} /> {showHistory ? "Masquer Réalisés" : "Voir Réalisés"}
          </button>
          <button 
            onClick={async () => {
              try {
                const vRes = await axios.get('/api/version');
                const current = vRes.data.version || '0.1.0';
                const parts = current.split('.').map(Number);
                parts[2] = (parts[2] || 0) + 1;
                setNewVersion({ ...newVersion, number: parts.join('.') });
              } catch (e) {}
              setNewVersionModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <Zap size={14} /> Définir une Version
          </button>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95"
          >
            <Plus size={14} /> Nouvelle Demande
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-100 p-8 rounded-2xl animate-in zoom-in-95 duration-300 space-y-6">
          {/* ... existing form fields ... */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Titre de la demande</label>
              <input 
                required
                className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="Ex: Ajouter l'export PDF pour les dispositifs..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
              <select 
                className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="FEATURE">Fonctionnalité</option>
                <option value="BUG">Bug / Correction</option>
                <option value="IMPROVEMENT">Amélioration</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description (optionnelle)</label>
                <input 
                  className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Détails supplémentaires..."
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priorité</label>
                <select 
                  className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                  value={formData.priority}
                  onChange={e => setFormData({...formData, priority: e.target.value})}
                >
                  <option value="LOW">Basse</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="HIGH">Haute</option>
                  <option value="URGENT">Urgent</option>
                </select>
             </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors text-[10px] uppercase tracking-widest">Annuler</button>
            <button type="submit" disabled={saving} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50">
              {saving ? <Loader2 className="animate-spin" size={14} /> : "Enregistrer au Backlog"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        {items.filter(i => !i.versionId || showHistory).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] opacity-20">
             <Clock size={48} />
             <p className="font-black uppercase tracking-widest text-sm mt-4">Le backlog est vide</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Sujet / Demande</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Priorité</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Statut</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.filter(item => !item.versionId || showHistory).map(item => (
                <React.Fragment key={item.id}>
                  <tr className={`group hover:bg-slate-50/30 transition-all ${item.status === 'DONE' ? 'bg-slate-50/50' : item.status === 'REJECTED' ? 'bg-rose-50/20' : ''}`}>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                           <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                             item.type === 'BUG' ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
                           }`}>
                             {getTypeIcon(item.type)} {item.type}
                           </span>
                           <span className={`text-sm font-black ${item.status === 'DONE' ? 'line-through text-slate-400' : item.status === 'REJECTED' ? 'text-slate-300' : 'text-slate-900'}`}>{item.title}</span>
                        </div>
                        {item.description && <p className="text-[10px] font-medium text-slate-400 mt-1">{item.description}</p>}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getPriorityStyle(item.priority)}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                       <div className="flex flex-col items-center gap-1">
                          <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${
                            item.status === 'DONE' ? 'text-emerald-500' : item.status === 'REJECTED' ? 'text-rose-400' : 'text-blue-500'
                          }`}>
                            {item.status === 'DONE' ? 'Fait' : item.status === 'REJECTED' ? 'Refusé' : 'En attente'}
                          </span>
                          {item.status === 'OPEN' && (
                            <div className="flex gap-1">
                               <button 
                                 onClick={() => updateStatus(item, 'DONE')}
                                 className="p-1 hover:bg-emerald-50 text-slate-300 hover:text-emerald-500 rounded transition-all"
                                 title="Marquer comme fait"
                               >
                                 <CheckCircle2 size={14} />
                               </button>
                               <button 
                                 onClick={() => setRejectionModal(item)}
                                 className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded transition-all"
                                 title="Refuser"
                               >
                                 <Ban size={14} />
                               </button>
                            </div>
                          )}
                       </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 text-slate-400">
                        {item.versionId && (
                          <button 
                            onClick={async () => {
                              if(confirm("Détacher cet élément de sa version ?")) {
                                try {
                                  await axios.patch(`/api/backlog/${item.id}`, { versionId: null });
                                  fetchBacklog();
                                } catch(e) { alert("Erreur"); }
                              }
                            }}
                            className="p-2 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-all"
                            title="Détacher de la version"
                          >
                            <Unlink size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                          className={`p-2 rounded-lg transition-all ${selectedItem?.id === item.id ? 'bg-blue-50 text-blue-600' : 'text-slate-300 hover:text-blue-600'}`}
                        >
                          <MessageSquare size={16} />
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-2 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Comments Section */}
                  {selectedItem?.id === item.id && (
                    <tr className="bg-slate-50/50">
                       <td colSpan={4} className="px-8 py-8">
                          <div className="max-w-2xl mx-auto space-y-6">
                             <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <h6 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                  <MessageSquare size={12} /> Commentaires & Suivi
                                </h6>
                             </div>
                             
                             <div className="space-y-4 max-h-60 overflow-y-auto pr-4 custom-scrollbar">
                                {(item.comments || []).length === 0 ? (
                                  <p className="text-[10px] font-bold text-slate-400 italic text-center py-4">Aucun commentaire pour le moment</p>
                                ) : (
                                  (item.comments || []).map(comment => (
                                    <div key={comment.id} className="bg-white p-4 rounded-xl shadow-sm space-y-2 border border-slate-100 animate-in slide-in-from-left-2 transition-all">
                                       <div className="flex items-center justify-between">
                                          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{comment.author}</span>
                                          <span className="text-[8px] font-bold text-slate-400">{new Date(comment.created_at).toLocaleString()}</span>
                                       </div>
                                       <p className="text-sm font-medium text-slate-700">{comment.content}</p>
                                    </div>
                                  ))
                                )}
                             </div>

                             <div className="flex gap-3">
                                <input 
                                  value={newComment}
                                  onChange={e => setNewComment(e.target.value)}
                                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all text-sm font-medium"
                                  placeholder="Votre commentaire..."
                                />
                                <button 
                                  onClick={() => addComment(item.id)}
                                  className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
                                >
                                  <Send size={18} />
                                </button>
                             </div>
                          </div>
                       </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rejectionModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setRejectionModal(null)}></div>
           <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 p-8 space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Refuser la demande</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Veuillez indiquer le motif du refus</p>
              </div>
              <textarea 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-rose-500 transition-all font-bold text-sm min-h-32"
                placeholder="Ex: Hors périmètre / Déjà couvert par une autre fonctionnalité..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
              />
              <div className="flex flex-col gap-3">
                 <button 
                   onClick={() => {
                     if (!rejectionReason.trim()) return alert("Raison obligatoire");
                     updateStatus(rejectionModal, 'REJECTED', `Refusé : ${rejectionReason}`);
                     setRejectionReason("");
                     setRejectionModal(null);
                   }}
                   className="w-full bg-rose-600 hover:bg-rose-500 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-500/20 transition-all active:scale-95"
                 >
                   Confirmer le Refus
                 </button>
                 <button onClick={() => setRejectionModal(null)} className="w-full py-2 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Annuler</button>
              </div>
           </div>
        </div>
      )}

      {newVersionModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setNewVersionModal(false)}></div>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 p-8 space-y-6">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200 pb-2">Éléments inclus par défaut :</p>
               <div className="max-h-32 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                 {items.filter(i => i.status === 'DONE' && !i.versionId).map(item => (
                   <div key={item.id} className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                     <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                     <span className="truncate">{item.title}</span>
                   </div>
                 ))}
                 {items.filter(i => i.status === 'DONE' && !i.versionId).length === 0 && (
                   <p className="text-[10px] font-bold text-rose-400 italic">Aucun élément terminé à publier.</p>
                 )}
               </div>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Détails de la Version</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Regrouper les éléments terminés</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">N° de Version</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-6 outline-none focus:border-blue-500 transition-all font-bold text-lg"
                  value={newVersion.number}
                  onChange={e => setNewVersion({...newVersion, number: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes de mise à jour</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-6 outline-none focus:border-blue-500 transition-all font-bold text-sm min-h-32"
                  value={newVersion.notes}
                  onChange={e => setNewVersion({...newVersion, notes: e.target.value})}
                  placeholder="Qu'est-ce qui a changé ?"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={createRelease}
                disabled={saving || (items.filter(i => i.status === 'DONE' && !i.versionId).length === 0 && !newVersion.notes)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Publier la Version
              </button>
              <button onClick={() => setNewVersionModal(false)} className="w-full py-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Annuler</button>
            </div>
          </div>
        </div>
      )}
      <ReleaseHistory releases={releases} onRefresh={fetchBacklog} />
    </div>
  );
}
