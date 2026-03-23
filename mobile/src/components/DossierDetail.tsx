import { useState, useEffect, useRef, useMemo } from 'react';
import api from '../services/api';
import {
  ChevronLeft, Send, Plus, Package, MessageSquare, Loader2, CheckCircle2,
  Mic, MicOff, X, User as UserIcon, Image as ImageIcon, MapPin, 
  Wallet, Calendar, BarChart3, AlertCircle, Paperclip
} from 'lucide-react';

interface Article { id: number; designation: string; montant: number; }
interface Note { id: number; content: string; pjPath?: string; pjThumb?: string; created_at: string; author?: string; isEmail?: boolean; }

interface DossierDetailProps {
  id: number;
  onBack: () => void;
}

declare global {
  interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; }
}

const TYPE_CONFIG: Record<string, { gradient: string; accent: string; muted: string }> = {
  CHANTIER:  { gradient: 'from-amber-500 to-orange-600', accent: 'text-amber-500', muted: 'bg-amber-500/10 border-amber-500/20 text-amber-600' },
  COMMERCE:  { gradient: 'from-emerald-500 to-teal-600', accent: 'text-emerald-500', muted: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' },
  TOURNAGE:  { gradient: 'from-rose-500 to-pink-600',    accent: 'text-rose-500',  muted: 'bg-rose-500/10 border-rose-500/20 text-rose-600' },
  EVENEMENT: { gradient: 'from-blue-500 to-indigo-600',  accent: 'text-blue-500',  muted: 'bg-blue-500/10 border-blue-500/20 text-blue-600' },
};
const DEFAULT_CFG = { gradient: 'from-violet-600 to-purple-700', accent: 'text-violet-500', muted: 'bg-violet-500/10 border-violet-500/20 text-violet-600' };

export function DossierDetail({ id, onBack }: DossierDetailProps) {
  const [activeId, setActiveId] = useState(id);
  const [dossier, setDossier] = useState<any>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [noteContent, setNoteContent] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [tab, setTab] = useState<'info' | 'notes' | 'note' | 'disp'>('info');
  const [articleId, setArticleId] = useState('');
  const [q1, setQ1] = useState('');
  const [dispLoading, setDispLoading] = useState(false);
  const [photo, setPhoto] = useState<{ file: File; preview: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const isHistory = useMemo(() => {
    if (!dossier || !dossier.history || dossier.history.length === 0) return false;
    return dossier.history.some((h: any) => h.anneeTaxation > (dossier.anneeTaxation || 0));
  }, [dossier]);

  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      const r = new SpeechRec();
      r.lang = 'fr-FR'; r.continuous = false; r.interimResults = false;
      r.onresult = (e: any) => setNoteContent(p => p + e.results[0][0].transcript + ' ');
      r.onend = () => setIsRecording(false);
      recognitionRef.current = r;
    }
  }, []);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setDossier(null);
    Promise.all([
      api.get(`/api/occupations/${activeId}`),
      api.get(`/api/articles?annee=${currentYear}`),
      api.get(`/api/occupations/${activeId}/notes`),
    ]).then(([d, a, n]) => { 
      setDossier(d.data); 
      setArticles(a.data); 
      setNotes(n.data); 
    }).catch(console.error);
  }, [activeId]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPhoto({ file: f, preview: URL.createObjectURL(f) });
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) { recognitionRef.current.stop(); setIsRecording(false); }
    else { recognitionRef.current.start(); setIsRecording(true); }
  };

  const generateThumb = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 100;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; } }
        else { if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1600;
        let w = img.width, h = img.height;
        if (w > MAX_WIDTH) { h *= MAX_WIDTH / w; w = MAX_WIDTH; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleAddNote = async () => {
    if (!noteContent.trim() && !photo) return;
    setNoteLoading(true);
    try {
      let pjPath: string | undefined;
      let pjThumb: string | undefined;
      if (photo) {
        pjThumb = await generateThumb(photo.file);
        const compressedBlob = await compressImage(photo.file);
        const fd = new FormData(); 
        fd.append('file', compressedBlob, photo.file.name);
        const up = await api.post('/api/upload', fd);
        pjPath = up.data.url;
      }
      const res = await api.post(`/api/occupations/${activeId}/notes`, { 
        content: noteContent, 
        pjPath, 
        pjThumb,
        origin: 'mobile'
      });
      setNotes(prev => [res.data, ...prev]);
      setNoteContent(''); setPhoto(null); setTab('notes');
    } catch (e) { 
      console.error(e);
      alert(photo ? "Erreur lors de l'ajout de la note. L'image est peut-être trop lourde (max 10Mo)." : "Erreur lors de l'ajout de la note. Veuillez vérifier votre connexion.");
    } finally { setNoteLoading(false); }
  };


  const handleAddDispositif = async () => {
    if (!articleId || !q1.trim()) return;
    setDispLoading(true);
    try {
      await api.post(`/api/occupations/${activeId}/lignes`, { articleId: parseInt(articleId), quantite1: parseFloat(q1) || 1 });
      const updated = await api.get(`/api/occupations/${activeId}`);
      setDossier(updated.data); setArticleId(''); setQ1(''); setTab('info');
    } catch (e) { console.error(e); } finally { setDispLoading(false); }
  };

  if (!dossier) {
    return (
      <div className="min-h-[100dvh] bg-[var(--bg)] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-violet-400" />
      </div>
    );
  }

  const cfg = TYPE_CONFIG[dossier.type] ?? DEFAULT_CFG;
  const totalAmount = dossier.lignes?.reduce((sum: number, l: any) => sum + l.montant, 0) || 0;

  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--text)] flex flex-col transition-colors duration-300">

      {/* ── Premium Hero Header ────────────────────────────────────────── */}
      <div className={`relative bg-gradient-to-br ${cfg.gradient} pt-4 pb-12 overflow-hidden shadow-2xl shadow-black/20`}>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        {/* Top toolbar */}
        <div className="relative z-10 flex items-center justify-between px-5 mb-8">
          <button 
            onClick={onBack} 
            className="flex items-center gap-1 px-4 py-2.5 bg-black/15 backdrop-blur-xl border border-white/10 rounded-2xl text-white active:scale-95 transition-all text-sm font-black uppercase tracking-widest"
          >
            <ChevronLeft size={18} />
            <span>Retour</span>
          </button>
          
          <div className="flex flex-col items-end gap-1">
            <div className="px-4 py-2.5 bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                {dossier.statut}
              </span>
            </div>
            <p className="text-xl font-black text-white tabular-nums tracking-tighter drop-shadow-sm pr-1">
              {totalAmount.toFixed(2)}€ <span className="text-[8px] opacity-70 uppercase tracking-widest">TTC</span>
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 px-6 space-y-4">
          <div className="flex items-center gap-3">
             <div className="bg-white/20 backdrop-blur-md rounded-xl p-2.5 shadow-lg border border-white/20 shadow-black/10">
                <BarChart3 size={18} className="text-white" />
             </div>
             <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/70">
                {dossier.type === 'COMMERCE' ? `COMMERCE · ${dossier.anneeTaxation}` : `${dossier.type} · №${activeId}`}
             </span>
          </div>

          <h2 className="text-4xl font-black text-white leading-[1.1] tracking-tight drop-shadow-md">
            {dossier.nom || dossier.tiers?.nom}
          </h2>

          <div className="flex items-center gap-2.5 bg-black/10 backdrop-blur-sm self-start inline-flex px-4 py-2.5 rounded-2xl border border-white/5 shadow-inner">
            <MapPin size={16} className="text-white/70 shrink-0" />
            <p className="text-xs font-bold text-white/90 leading-tight">
              {dossier.adresse}
            </p>
          </div>
        </div>
      </div>

      {/* ── Modern Floating Tab Bar ───────────────────────────────────── */}
      <div className="relative -mt-10 z-20 px-4">
        <div className="glass-card rounded-[2.5rem] p-1.5 flex gap-1 shadow-2xl shadow-black/30 border-white/10 overflow-x-auto no-scrollbar">
          {([
            { key: 'info', label: 'Infos', icon: Package, badge: undefined },
            { key: 'notes', label: `Mémos`, icon: MessageSquare, badge: notes.length },
            { key: 'note', label: '+ Mémo', icon: Plus, badge: undefined },
            { key: 'disp', label: '+ Disp.', icon: Plus, badge: undefined },
          ] as const).map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-wider transition-all duration-300 min-w-[75px] relative ${
                tab === key 
                  ? 'gradient-primary text-white shadow-2xl shadow-violet-500/40 scale-105' 
                  : 'text-[var(--text-dim)] hover:text-[var(--text)]'
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {badge !== undefined && badge > 0 && (
                <div className="absolute top-2 right-4 min-w-[18px] h-[18px] bg-rose-500 rounded-full flex items-center justify-center px-1 border-2 border-[var(--bg-card)] shadow-lg">
                   <span className="text-[8px] font-black text-white">{badge}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content Area ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-10">

        {/* TAB 1: DOSSIER INFO */}
        {tab === 'info' && (
          <div className="space-y-6">
            
            {/* Quick Actions Card */}
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                 <Calendar size={18} className="text-blue-500" />
                 <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text)] transition-colors">
                   {dossier.type === 'COMMERCE' ? 'Période de Taxation' : "Période d'occupation"}
                 </h3>
              </div>
              
              {dossier.type === 'COMMERCE' ? (
                <div className="bg-[var(--input-bg)] border border-[var(--input-bd)] rounded-2xl p-5 text-center">
                   <p className="text-[10px] font-black text-[var(--text-dim)] uppercase mb-1">Année civile</p>
                   <p className="text-2xl font-black text-[var(--text)]">{dossier.anneeTaxation}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--input-bg)] border border-[var(--input-bd)] rounded-2xl p-4">
                      <p className="text-[9px] font-black text-[var(--text-dim)] uppercase mb-1">Date début</p>
                      <p className="text-sm font-black text-[var(--text)]">{new Date(dossier.date_debut).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-[var(--input-bg)] border border-[var(--input-bd)] rounded-2xl p-4">
                      <p className="text-[9px] font-black text-[var(--text-dim)] uppercase mb-1">Date fin</p>
                      <p className="text-sm font-black text-[var(--text)]">{new Date(dossier.date_fin).toLocaleDateString()}</p>
                  </div>
                </div>
              )}

              {/* History selection for COMMERCE */}
              {dossier.type === 'COMMERCE' && dossier.history && dossier.history.length > 0 && (
                <div className="pt-2">
                   <p className="text-[10px] font-black text-[var(--text-dim)] uppercase mb-3 tracking-widest">Historique des années</p>
                   <div className="flex flex-wrap gap-2">
                      {dossier.history.map((h: any) => (
                        <button
                          key={h.id}
                          onClick={() => setActiveId(h.id)}
                          className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--card-border)] rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)] active:scale-95 transition-all shadow-sm"
                        >
                          {h.anneeTaxation}
                        </button>
                      ))}
                   </div>
                </div>
              )}

              {isHistory && (
                <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <AlertCircle size={18} className="text-amber-400 shrink-0" />
                  <p className="text-[11px] font-bold text-amber-500/80 leading-snug uppercase tracking-tight">
                    Vous consultez une année antérieure. La modification est désactivée.
                  </p>
                </div>
              )}
            </div>

            {/* Equipments list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <p className="text-[11px] font-black text-[var(--text-dim)] uppercase tracking-widest">Dispositifs ({dossier.lignes?.length || 0})</p>
                <div className="flex items-center gap-1.5 text-emerald-500">
                   <Wallet size={12} />
                   <span className="text-[11px] font-black uppercase">TTC</span>
                </div>
              </div>

              {dossier.lignes?.length === 0 ? (
                <div className="bg-[var(--bg-card)] border border-dashed border-[var(--card-border)] rounded-3xl py-12 text-center space-y-3">
                  <Package size={32} className="mx-auto text-[var(--text-dim)] opacity-40" />
                  <p className="text-sm font-bold text-[var(--text-muted)]">Aucun équipement</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dossier.lignes?.map((l: any) => (
                    <div key={l.id} className="glass-card rounded-3xl p-5 flex items-center justify-between border-l-4 border-l-emerald-500/50">
                      <div className="space-y-1.5 min-w-0 pr-4">
                        <p className="font-extrabold text-[15px] text-[var(--text)] truncate leading-tight transition-colors">{l.article.designation}</p>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-[var(--input-bg)] border border-[var(--input-bd)] rounded-lg text-[9px] font-black text-[var(--text-muted)] uppercase tracking-tighter">QTÉ · {l.quantite1}</span>
                          <span className="text-[9px] font-bold text-[var(--text-dim)] uppercase">Tarif #{l.article.numero}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-black text-[var(--text)] tabular-nums tracking-tighter transition-colors">
                          {l.montant.toFixed(2)}<span className="text-[10px] ml-0.5 text-[var(--text-dim)] uppercase">€ TTC</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {!isHistory && (
              <button
                onClick={() => setTab('disp')}
                className="w-full py-6 rounded-[2rem] bg-emerald-500 font-black text-base text-white flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/30 active:scale-[0.98] transition-transform mt-4"
              >
                <Plus size={20} className="stroke-[3]" />
                AJOUTER UN DISPOSITIF
              </button>
            )}
          </div>
        )}

        {/* TAB 2: NOTES */}
        {tab === 'notes' && (
          <div className="space-y-6">
            <button
              onClick={() => setTab('note')}
              className="w-full py-5 rounded-3xl gradient-primary font-black text-sm text-white flex items-center justify-center gap-3 shadow-xl shadow-violet-500/30 active:scale-[0.98] transition-transform"
            >
              <Plus size={18} />
              NOUVELLE NOTE DE TERRAIN
            </button>

            {notes.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-violet-500/5 rounded-full flex items-center justify-center mx-auto">
                   <MessageSquare size={32} className="text-[var(--text-dim)] opacity-30" />
                </div>
                <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">Aucun historique</p>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {notes.map(n => (
                  <div key={n.id} className="glass-card rounded-3xl p-6 space-y-4 border border-[var(--card-border)] shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                          <UserIcon size={18} className="text-violet-500" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-[var(--text)] uppercase tracking-tight transition-colors">{n.author || 'Agent 32'}</p>
                          <p className="text-[9px] font-bold text-violet-500/60 uppercase tracking-widest">Vérification</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {n.isEmail && <Paperclip size={14} className="text-violet-500 animate-pulse" />}
                        <span className="text-[9px] font-black text-[var(--text-dim)] bg-[var(--input-bg)] px-3 py-1.5 rounded-xl uppercase tracking-widest border border-[var(--input-bd)]">
                          {new Date(n.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    <p className="text-[15px] font-medium text-[var(--text)] opacity-90 leading-relaxed transition-colors">{n.content}</p>
                    {n.pjPath && (
                      <a 
                        href={n.pjPath} 
                        target="_blank" 
                        rel="noreferrer"
                        className="relative block w-32 h-32 overflow-hidden rounded-2xl border border-[var(--card-border)] shadow-md group active:scale-95 transition-transform"
                      >
                        {/* Low-res thumbnail first */}
                        <div 
                          className="absolute inset-0 bg-cover bg-center blur-lg scale-110 opacity-50"
                          style={{ backgroundImage: `url(${n.pjThumb})` }}
                        />
                        <img 
                          src={n.pjPath} 
                          alt="pj" 
                          className="relative z-10 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                        <div className="absolute inset-x-0 bottom-0 z-20 bg-black/60 backdrop-blur-md p-1.5 flex items-center justify-center gap-1.5 border-t border-white/10">
                           <ImageIcon size={10} className="text-white/60" />
                           <span className="text-[8px] font-black text-white uppercase tracking-widest">Voir</span>
                        </div>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: OBSERVATION NOTE */}
        {tab === 'note' && (
          <div className="space-y-4">
            <p className="text-[11px] font-black text-[var(--text-dim)] uppercase tracking-widest px-2 flex items-center gap-2">
               <AlertCircle size={14} className="text-violet-400" />
               Nouvelle observation de terrain
            </p>
            <div className="glass-card rounded-3xl overflow-hidden border border-[var(--card-border)] shadow-lg">
              <textarea
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                placeholder="Points d'attention, manquements, relevés..."
                className="w-full bg-transparent px-6 pt-6 pb-4 text-base font-medium text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none resize-none min-h-[160px]"
              />
              <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--divider)] bg-[var(--bg-card)]/50 backdrop-blur-md">
                <div className="flex gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${photo ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--input-bd)] hover:bg-[var(--input-bd)]'}`}
                  >
                    <ImageIcon size={20} />
                  </button>
                  <button
                    onClick={toggleRecording}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isRecording ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 animate-pulse' : 'bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--input-bd)] hover:bg-[var(--input-bd)]'}`}
                  >
                    {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
                </div>
                <button
                  onClick={handleAddNote}
                  disabled={noteLoading || (!noteContent.trim() && !photo)}
                  className="px-8 py-4 rounded-2xl gradient-primary text-[13px] font-black text-white flex items-center gap-2 disabled:opacity-30 active:scale-95 transition-all shadow-xl shadow-violet-500/30 uppercase tracking-widest"
                >
                  {noteLoading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={18} /> Publier</>}
                </button>
              </div>
            </div>

            {photo && (
              <div className="relative rounded-3xl overflow-hidden border border-[var(--card-border)] shadow-2xl group">
                <img src={photo.preview} className="w-full h-56 object-cover" />
                <button onClick={() => setPhoto(null)} className="absolute top-4 right-4 w-10 h-10 bg-black/60 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 active:scale-90 transition-transform">
                  <X size={18} className="text-white" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: NOUVEAU DISPOSITIF */}
        {tab === 'disp' && (
          <div className="space-y-4">
            <p className="text-[11px] font-black text-[var(--text-dim)] uppercase tracking-widest px-2 flex items-center gap-2">
               <Package size={14} className="text-emerald-400" />
               Nouveau dispositif
            </p>
            <div className="glass-card rounded-[2.5rem] p-7 space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest ml-1">Article ({new Date().getFullYear()})</label>
                <div className="relative">
                  <select
                    value={articleId}
                    onChange={e => setArticleId(e.target.value)}
                    className="w-full input-field rounded-2xl py-5 px-5 text-sm font-extrabold transition-all appearance-none cursor-pointer focus:ring-4 focus:ring-emerald-500/10"
                  >
                    <option value="" className="bg-[var(--bg)] text-[var(--text-dim)]">Choisir un dispositif...</option>
                    {articles.map(a => <option key={a.id} value={a.id} className="bg-[var(--bg)]">{a.designation} — {a.montant.toFixed(2)}€</option>)}
                  </select>
                  <ChevronLeft size={18} className="absolute right-5 top-1/2 -translate-y-1/2 -rotate-90 pointer-events-none text-[var(--text-dim)]" />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest ml-1">Quantité / Mesure</label>
                <input
                  type="number" step="0.01" value={q1} onChange={e => setQ1(e.target.value)} placeholder="0.00"
                  className="w-full input-field rounded-2xl py-5 px-5 text-xl font-black text-center transition-all focus:ring-4 focus:ring-emerald-500/10 placeholder:opacity-30"
                />
              </div>

              <button
                onClick={handleAddDispositif}
                disabled={dispLoading || !articleId || !q1.trim()}
                className="w-full py-6 rounded-2xl bg-emerald-500 font-black text-[15px] text-white flex items-center justify-center gap-3 disabled:opacity-30 active:scale-[0.98] transition-all shadow-2xl shadow-emerald-500/40 uppercase tracking-widest mt-2"
              >
                {dispLoading ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={20} /> Valider</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
