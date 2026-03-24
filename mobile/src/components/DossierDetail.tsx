import { useState, useEffect, useRef, useMemo } from 'react';
import api from '../services/api';
import {
  ChevronLeft, Send, CheckCircle2,
  Mic, X, User as UserIcon, Image as ImageIcon, MapPin, 
  Wallet, Calendar, BarChart3, AlertCircle, Paperclip, Clock, FileText,
  MessageSquare, Loader2, PlusCircle, Camera, Phone, Mail, UserPlus, Trash2
} from 'lucide-react';

interface DossierDetailProps {
  id: number;
  onBack: () => void;
}

const TYPE_CONFIG: Record<string, { gradient: string; accent: string; muted: string }> = {
  CHANTIER:  { gradient: 'from-amber-500 to-orange-600',  accent: 'text-amber-500',  muted: 'bg-amber-500/10 border-amber-500/20 text-amber-600' },
  COMMERCE:  { gradient: 'from-emerald-500 to-teal-600',   accent: 'text-emerald-500', muted: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' },
  TOURNAGE:  { gradient: 'from-rose-500 to-pink-600',    accent: 'text-rose-500',    muted: 'bg-rose-500/10 border-rose-500/20 text-rose-600' },
  EVENEMENT: { gradient: 'from-blue-500 to-indigo-600',  accent: 'text-blue-500',   muted: 'bg-blue-500/10 border-blue-500/20 text-blue-600' },
};
const DEFAULT_CFG = { gradient: 'from-violet-600 to-purple-700', accent: 'text-violet-500', muted: 'bg-violet-500/10 border-violet-500/20 text-violet-600' };

const STATUT_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  'VERIFIE': { label: 'Vérifié', icon: CheckCircle2, color: 'text-emerald-400' },
  'INVOICED': { label: 'Facturé', icon: FileText, color: 'text-blue-400' },
  'EN_ATTENTE': { label: 'En attente', icon: Clock, color: 'text-amber-400' },
};

export function DossierDetail({ id, onBack }: DossierDetailProps) {
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'info' | 'notes' | 'contacts' | 'documents'>('info');
  const [note, setNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isSavingDispositif, setIsSavingDispositif] = useState(false);
  const [searchNotes, setSearchNotes] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [newContact, setNewContact] = useState({
    nom: '', prenom: '', email: '', telephone: '', titre: '', entreprise: '', role: 'CONTACT_DIRECT', pjPath: ''
  });
  const [isDeletingNote, setIsDeletingNote] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [showDispositifModal, setShowDispositifModal] = useState(false);
  const [newDispositifNom, setNewDispositifNom] = useState('');

  const recognitionRef = useRef<any>(null);

  const cfg = useMemo(() => {
    if (!dossier) return DEFAULT_CFG;
    return TYPE_CONFIG[dossier.type] || DEFAULT_CFG;
  }, [dossier]);

  useEffect(() => {
    const fetchDossierData = async () => {
      try {
        setLoading(true);
        const [dRes, cRes] = await Promise.all([
          api.get(`/api/occupations/${id}`),
          api.get(`/api/occupations/${id}/contacts`)
        ]);
        setDossier(dRes.data);
        setContacts(cRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDossierData();
  }, [id]);

  const handleSendNote = async () => {
    if (!note.trim() && !audioURL && !selectedFile) return;
    setIsSending(true);
    try {
      let pjPath = null;
      let pjName = null;

      if (selectedFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await api.post('/api/upload', formData);
        pjPath = uploadRes.data.url;
        pjName = uploadRes.data.name;
        setIsUploading(false);
      }

      await api.post(`/api/occupations/${id}/notes`, {
        content: note,
        pjPath: pjPath,
        pjName: pjName,
        pjThumb: audioURL // Use this for audio for now if needed, or handle separately
      });
      
      setNote('');
      setAudioURL(null);
      setSelectedFile(null);
      setFilePreview(null);
      setShowNoteModal(false);
      
      // Refresh dossier
      const res = await api.get(`/api/occupations/${id}`);
      setDossier(res.data);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi du mémo");
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    setIsDeletingNote(noteId);
    try {
      await api.delete(`/api/occupations/${id}/notes/${noteId}`);
      setDossier((prev: any) => ({
        ...prev,
        notes: prev.notes.filter((n: any) => n.id !== noteId)
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingNote(null);
      setShowDeleteConfirm(null);
    }
  };

  const resizeImage = (file: File, maxWidth = 1200, maxHeight = 1200): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
          }, 'image/jpeg', 0.8);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoContact = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const resizedBlob = await resizeImage(file);
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', resizedBlob, 'contact_card.jpg');
      
      const uploadRes = await api.post('/api/upload', uploadFormData);
      const photoUrl = uploadRes.data.url;
      
      setNewContact(prev => ({
        ...prev,
        pjPath: photoUrl
      }));
      setShowContactModal(true);
    } catch (err: any) {
      console.error('[Upload] Error:', err);
      alert("Erreur lors de l'envoi : " + (err.response?.data?.error || err.message));
    } finally {
      e.target.value = '';
    }
  };


  const handleSaveContact = async () => {
    try {
      setLoading(true);
      if (editingContact) {
        // Update existing contact
        await api.patch(`/api/occupations/${id}/contacts/${editingContact.id}`, editingContact);
        setContacts(prev => prev.map(c => c.id === editingContact.id ? editingContact : c));
        setEditingContact(null);
      } else {
        // Create new contact
        if (!newContact.prenom && !newContact.nom && !newContact.pjPath) return; // Allow save if at least one field or photo is present
        const res = await api.post(`/api/occupations/${id}/contacts`, newContact);
        setContacts(prev => [...prev, res.data]);
        setShowContactModal(false);
        setNewContact({ nom: '', prenom: '', email: '', telephone: '', titre: '', entreprise: '', role: 'CONTACT_DIRECT', pjPath: '' });
      }
    } catch (err: any) {
      console.error('Save contact error:', err);
      const msg = err.response?.data?.error || err.message;
      alert("Erreur lors de l'enregistrement du contact: " + msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
          alert("La reconnaissance vocale n'est pas supportée sur ce navigateur.");
          return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setNote(prev => (prev ? prev + ' ' + finalTranscript : finalTranscript));
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Recording error:', err);
      }
    }
  };

  const handleDispositifToggle = async (dispId: number, currentStatus: string) => {
    setIsSavingDispositif(true);
    try {
      const nextStatus = currentStatus === 'VERIFIE' ? 'EN_ATTENTE' : 'VERIFIE';
      await api.patch(`/api/dispositifs/${dispId}`, { statut: nextStatus });
      setDossier((prev: any) => ({
        ...prev,
        dispositifs: prev.dispositifs.map((d: any) => d.id === dispId ? { ...d, statut: nextStatus } : d)
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingDispositif(false);
    }
  };

  const handleCreateDispositif = async () => {
    if (!newDispositifNom.trim()) return;
    setIsSavingDispositif(true);
    try {
      const res = await api.post('/api/dispositifs', {
        nom: newDispositifNom,
        occupationId: id
      });
      setDossier((prev: any) => ({
        ...prev,
        dispositifs: [...(prev.dispositifs || []), res.data]
      }));
      setShowDispositifModal(false);
      setNewDispositifNom('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingDispositif(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[var(--bg)] flex items-center justify-center p-12">
        <Loader2 size={32} className="animate-spin text-violet-400" />
      </div>
    );
  }

  if (!dossier) return null;

  const totalAmount = dossier.lignes?.reduce((sum: number, l: any) => sum + l.montant, 0) || 0;

  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] flex flex-col font-sans animate-in fade-in duration-500">
      
      <div className={`relative px-12 pt-24 pb-16 bg-gradient-to-br ${cfg.gradient} text-white shadow-2xl overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse" />
        
        <div className="relative flex items-start justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-4 px-10 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl hover:bg-white/20 transition-all active:scale-95 shadow-xl font-black uppercase tracking-widest text-lg"
          >
            <ChevronLeft size={28} strokeWidth={3} />
            <span>Retour</span>
          </button>
          
          <div className="flex flex-col items-end gap-2">
            {(() => {
              const s = STATUT_CONFIG[dossier.statut] || { label: dossier.statut, icon: AlertCircle, color: 'text-white' };
              const Icon = s.icon;
              return (
                <div className="px-6 h-12 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl flex items-center gap-2">
                  <Icon size={18} className={s.color} strokeWidth={3} />
                  <span className="text-[11px] font-black uppercase tracking-[0.1em] text-white">
                    {s.label}
                  </span>
                </div>
              );
            })()}
            <p className="text-lg font-medium text-white tabular-nums tracking-tight drop-shadow-sm pr-1">
              {totalAmount.toFixed(2)}€
            </p>
          </div>
        </div>

        <div className="mt-12 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/10 shadow-lg">
              <BarChart3 size={24} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Dossier #{dossier.id}</p>
              <h2 className="text-3xl font-black tracking-tight leading-none drop-shadow-md">
                {dossier.nom || dossier.tiers?.nom}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4 text-white/80">
            <MapPin size={16} className="shrink-0" />
            <p className="text-sm font-bold tracking-wide italic">{dossier.adresse}</p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-8 relative z-10 flex gap-4 justify-center w-full">
        {(['info', 'notes', 'contacts', 'documents'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`w-16 h-16 flex items-center justify-center rounded-2xl transition-all shadow-xl border-2 ${
                tab === t 
                  ? 'bg-violet-600 text-white border-violet-400 scale-105 z-20 shadow-violet-600/30' 
                  : 'bg-[var(--bg-card)]/80 text-[var(--text-muted)] border-[var(--card-border)] hover:bg-[var(--bg-card)]'
              }`}
              title={t.charAt(0).toUpperCase() + t.slice(1)}
            >
              {t === 'info' && <BarChart3 size={24} />}
              {t === 'notes' && <MessageSquare size={24} />}
              {t === 'contacts' && <UserIcon size={24} />}
              {t === 'documents' && <Paperclip size={24} />}
            </button>
        ))}
      </div>

      {/* ── Content Area ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-16 pt-20 pb-24">

        {/* TAB 1: DOSSIER INFO */}
        {tab === 'info' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
            
            <button 
              onClick={() => setShowDispositifModal(true)}
              className="w-full h-20 bg-emerald-600 rounded-2xl flex items-center justify-center gap-4 text-white shadow-xl shadow-emerald-600/20 active:scale-95 transition-all font-black uppercase tracking-[0.2em] text-sm"
            >
              <PlusCircle size={24} />
              Nouveau Dispositif
            </button>

            {dossier.dispositifs?.length > 0 && (
              <div className="glass-card rounded-2xl p-8 space-y-6 shadow-xl">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-dim)]">Dispositifs ({dossier.dispositifs.length})</h4>
                 <div className="grid grid-cols-1 gap-4">
                    {dossier.dispositifs.map((d: any) => (
                      <button 
                        key={d.id}
                        disabled={isSavingDispositif}
                        onClick={() => handleDispositifToggle(d.id, d.statut)}
                        className={`flex items-center justify-between px-8 min-h-20 rounded-2xl transition-all border-2 active:scale-[0.98] ${
                          d.statut === 'VERIFIE' 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                            : 'bg-[var(--bg-card)] border-[var(--card-border)] text-[var(--text-muted)] opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${d.statut === 'VERIFIE' ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                            <AlertCircle size={14} className={d.statut === 'VERIFIE' ? 'text-emerald-400' : 'text-white/20'} />
                          </div>
                          <span className="text-xs font-medium text-[var(--text)]">{d.nom}</span>
                        </div>
                        <div className={`w-10 h-6 rounded-full relative transition-colors ${d.statut === 'VERIFIE' ? 'bg-emerald-500' : 'bg-white/10'}`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${d.statut === 'VERIFIE' ? 'right-1' : 'left-1'}`} />
                        </div>
                      </button>
                    ))}
                 </div>
              </div>
            )}

            <div className="glass-card rounded-2xl p-8 space-y-8 shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20">
                    <Calendar size={22} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)]">
                      {dossier.type === 'COMMERCE' ? 'Année de Taxation' : 'Dates Théoriques'}
                    </h4>
                    <p className="text-lg font-bold text-[var(--text)]">
                      {dossier.type === 'COMMERCE' 
                        ? (dossier.anneeTaxation || dossier.annee_taxation || 'N/A')
                        : `Du ${new Date(dossier.dateDebut || dossier.date_debut).toLocaleDateString()} au ${new Date(dossier.dateFin || dossier.date_fin).toLocaleDateString()}`
                      }
                    </p>
                  </div>
                </div>

              <div className="h-px bg-[var(--divider)] opacity-50" />

              <div className="space-y-6">
                <h4 className="text-sm font-black uppercase tracking-[0.1em] text-[var(--text-muted)] flex items-center gap-3">
                  <div className="w-2 h-6 bg-violet-500 rounded-full" />
                  Articles & Redevances
                </h4>
                
                <div className="space-y-4">
                  {dossier.lignes?.map((l: any) => (
                    <div key={l.id} className="px-12 py-8 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors group">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-violet-400 uppercase tracking-widest">{l.article?.categorie?.nom || 'Article'}</p>
                          <h5 className="text-base font-semibold text-[var(--text)] leading-tight">{l.article?.designation || l.designation}</h5>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
                            <span className="text-xs font-medium text-violet-400 tabular-nums">
                              {l.montant.toFixed(2)}€
                            </span>
                          </div>
                          <p className="text-[9px] font-bold text-[var(--text-dim)] uppercase mt-2 tracking-widest">
                            {l.quantite1} x {l.article?.montant || 0}€
                          </p>
                        </div>
                      </div>

                      <div className="h-px bg-white/[0.05] my-4" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-[var(--divider)] opacity-50" />

              <div className="flex justify-between items-center p-6 rounded-2xl bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/20">
                <div className="flex items-center gap-3">
                  <Wallet size={20} className="text-violet-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-violet-400/80">Total Dossier</span>
                </div>
                <span className="text-3xl font-black text-white tabular-nums tracking-tighter drop-shadow-lg">
                  {totalAmount.toFixed(2)}€
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MÉMOS & PHOTO */}
        {tab === 'notes' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500 pb-32">
            
            <button 
              onClick={() => setShowNoteModal(true)}
              className="w-full h-20 bg-violet-600 rounded-2xl flex items-center justify-center gap-4 text-white shadow-xl shadow-violet-600/20 active:scale-95 transition-all font-black uppercase tracking-[0.2em] text-sm"
            >
              <PlusCircle size={24} />
              Nouveau Mémo
            </button>

            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)]">Historique ({dossier.notes?.length || 0})</h4>
                <div className="relative">
                  <input 
                    value={searchNotes}
                    onChange={e => setSearchNotes(e.target.value)}
                    placeholder="Filtrer..."
                    className="bg-transparent border-b border-white/10 text-[10px] py-1 px-2 focus:outline-none focus:border-violet-500 transition-all text-right uppercase font-bold text-white"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {dossier.notes?.filter((n: any) => n.content?.toLowerCase().includes(searchNotes.toLowerCase())).map((n: any) => (
                  <div key={n.id} className="glass-card rounded-2xl p-6 group relative">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400">
                          <UserIcon size={14} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{n.author || `Agent #${n.userId || '?'}`}</span>
                      </div>
                      <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest leading-none">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium text-[var(--text)] leading-relaxed italic pr-8">
                      "{n.content}"
                    </p>

                    {(n.pjPath || n.pjThumb) && (
                      <div className="mt-4 rounded-2xl overflow-hidden border border-white/10 group-hover:border-violet-500/30 transition-all cursor-pointer shadow-lg active:scale-[0.98] bg-black/20">
                        {n.pjThumb ? (
                          <img src={n.pjThumb} alt="Preview" className="w-full h-48 object-contain group-hover:scale-105 transition-transform duration-700" />
                        ) : n.pjPath?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img src={n.pjPath} alt="Note" className="w-full h-48 object-contain group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-48 flex flex-col items-center justify-center gap-3 bg-white/5">
                            <Paperclip size={48} className="text-violet-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{n.pjName || 'Document'}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <button 
                      onClick={() => setShowDeleteConfirm(n.id)}
                      className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-black/20 text-white/20 opacity-0 group-hover:opacity-100 hover:text-rose-500 hover:bg-rose-500/10 transition-all flex items-center justify-center"
                    >
                      <X size={16} />
                    </button>
                    
                    {showDeleteConfirm === n.id && (
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 space-y-4 animate-in fade-in duration-300 z-30">
                        <p className="text-xs font-black uppercase tracking-widest text-white">Supprimer cette note ?</p>
                        <div className="flex gap-4 w-full">
                          <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-3 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">Annuler</button>
                          <button 
                            onClick={() => handleDeleteNote(n.id)}
                            className="flex-1 py-3 bg-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                            {isDeletingNote === n.id ? <Loader2 size={12} className="animate-spin" /> : 'Supprimer'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONTACTS */}
        {tab === 'contacts' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500 pb-32">
            
            <button 
              onClick={() => setShowContactModal(true)}
              className="w-full h-20 bg-emerald-600 rounded-2xl flex items-center justify-center gap-4 text-white shadow-xl shadow-emerald-600/20 active:scale-95 transition-all font-black uppercase tracking-[0.2em] text-sm"
            >
              <UserPlus size={24} />
              Nouveau Contact
            </button>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)] px-2">Répertoire ({contacts.length})</h4>
              
              <div className="space-y-4">
                {contacts.length === 0 ? (
                  <div className="glass-card rounded-2xl p-12 text-center opacity-40">
                    <UserIcon size={48} className="mx-auto mb-4 text-[var(--text-dim)]" />
                    <p className="text-xs font-black uppercase tracking-widest text-[var(--text-dim)]">Aucun contact enregistré</p>
                  </div>
                ) : (
                  contacts.map((c: any) => (
                  <div 
                    key={c.id} 
                    onClick={() => setEditingContact(c)}
                    className="p-6 rounded-3xl bg-white/5 border border-[var(--card-border)] flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {c.pjPath ? (
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[var(--card-border)] bg-black/5 shadow-inner">
                          <img src={c.pjPath} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] shadow-sm">
                          <UserIcon size={24} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-black text-[var(--text)] uppercase tracking-tight group-hover:text-emerald-500 transition-colors drop-shadow-sm">{c.prenom} {c.nom}</h5>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                          {c.titre && (
                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-300 uppercase tracking-widest flex items-center gap-1 opacity-90">
                              <span className="w-1 h-1 rounded-full bg-emerald-500" />
                              {c.titre}
                            </p>
                          )}
                          {c.entreprise && (
                            <p className="text-[10px] font-black text-violet-600 dark:text-violet-300 uppercase tracking-widest flex items-center gap-1 opacity-90">
                              <span className="w-1 h-1 rounded-full bg-violet-500" />
                              {c.entreprise}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {c.telephone && (
                        <a 
                          href={`tel:${c.telephone}`}
                          onClick={(e) => e.stopPropagation()} // Prevent opening modal when clicking phone
                          className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 active:scale-90"
                        >
                          <Phone size={18} />
                        </a>
                      )}
                      {c.email && (
                        <a 
                          href={`mailto:${c.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 active:scale-90"
                        >
                          <Mail size={18} />
                        </a>
                      )}
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DOCUMENTS */}
        {tab === 'documents' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
            <div className="glass-card rounded-2xl p-12 text-center space-y-4 shadow-2xl opacity-80 border-dashed border-2 border-[var(--card-border)]">
              <div className="w-20 h-20 bg-[var(--input-bg)] rounded-3xl flex items-center justify-center mx-auto text-[var(--text-dim)]">
                <Paperclip size={36} />
              </div>
              <h4 className="text-lg font-black text-[var(--text)] uppercase tracking-widest">Documents Numériques</h4>
              <p className="text-xs font-medium text-[var(--text-muted)] max-w-[200px] mx-auto leading-relaxed italic">
                La dématérialisation du dossier #{dossier.id} est en attente de synchronisation.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────── */}

      {/* Nouveau Mémo Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => !isRecording && setShowNoteModal(false)} />
          
          <div className="relative w-full max-w-xl glass-card rounded-[3rem] p-10 space-y-8 shadow-[0_0_120px_rgba(139,92,246,0.25)] animate-in zoom-in-95 duration-500 border border-white/10 ring-1 ring-white/20">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
                  <PlusCircle size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter leading-none text-[var(--text)]">Nouveau Mémo</h3>
                  <p className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] mt-2">Dossier #{dossier.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNoteModal(false)} 
                disabled={isRecording}
                className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors active:scale-90 disabled:opacity-30"
              >
                <X size={24} />
              </button>
            </div>

            <div className="relative group">
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Appuyez sur la dictée ou écrivez ici..."
                autoFocus
                className="w-full h-56 bg-black/40 border border-white/10 rounded-[2rem] p-8 text-lg font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-black/60 transition-all resize-none shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)]"
              />
              {isRecording && (
                <div className="absolute inset-0 bg-violet-600/5 backdrop-blur-[2px] rounded-[2rem] flex flex-col items-center justify-center pointer-events-none border-2 border-violet-500/50 animate-pulse">
                  <div className="flex gap-1 mb-4">
                    <div className="w-1 h-8 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1 h-12 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1 h-8 bg-violet-400 rounded-full animate-bounce" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-violet-400">Écoute en cours...</span>
                </div>
              )}
            </div>

            {filePreview && (
              <div className="relative rounded-3xl overflow-hidden border-2 border-white/5 group bg-black/60 shadow-2xl animate-in slide-in-from-top-4">
                <img src={filePreview} alt="Preview" className="w-full h-48 object-contain" />
                <button 
                  onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/80 backdrop-blur-md text-white flex items-center justify-center hover:bg-rose-600 transition-all active:scale-90 shadow-xl"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            <div className="flex gap-4">
              <div className="flex-1 flex gap-3">
                <button onClick={() => document.getElementById('camera-input')?.click()} className="flex-1 h-20 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-90">
                  <Camera size={26} />
                  <span className="text-[9px] font-black uppercase tracking-widest mt-2">Appareil</span>
                </button>
                <button onClick={() => document.getElementById('gallery-input')?.click()} className="flex-1 h-20 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-90">
                  <ImageIcon size={26} />
                  <span className="text-[9px] font-black uppercase tracking-widest mt-2">Galerie</span>
                </button>
              </div>
              <button 
                onClick={toggleRecording}
                className={`w-28 h-20 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 border-2 shadow-lg ${
                  isRecording ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10'
                }`}
              >
                <Mic size={28} className={isRecording ? 'animate-pulse' : ''} />
                <span className="text-[9px] font-black uppercase tracking-widest mt-2">{isRecording ? 'Stop' : 'Dictée'}</span>
              </button>
            </div>

            <input type="file" id="camera-input" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
            <input type="file" id="gallery-input" accept="image/*" className="hidden" onChange={handleFileSelect} />

            <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
              <button 
                onClick={handleSendNote}
                disabled={isSending || isUploading || isRecording || (!note.trim() && !filePreview)}
                className="w-full h-20 bg-violet-600 rounded-3xl flex items-center justify-center gap-4 text-white shadow-2xl active:scale-[0.98] disabled:opacity-30 transition-all font-black uppercase tracking-[0.2em] text-lg hover:bg-violet-500"
              >
                {isSending || isUploading ? <Loader2 size={32} className="animate-spin" /> : <><Send size={24} />Publier le Mémo</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nouveau Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setShowContactModal(false)} />
          
          <div className="relative w-full max-w-xl glass-card rounded-[3rem] p-10 space-y-8 shadow-[0_0_120px_rgba(16,185,129,0.15)] animate-in zoom-in-95 duration-500 border border-[var(--card-border)] ring-1 ring-[var(--card-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
                  <UserPlus size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-[var(--text)]">Nouveau Contact</h3>
                  <p className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-[0.2em] mt-1">Dossier #{dossier.id}</p>
                </div>
              </div>
              <button onClick={() => setShowContactModal(false)} className="w-12 h-12 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[var(--text)] opacity-40 hover:opacity-100 transition-opacity"><X size={24} /></button>
            </div>

            {/* Photo Preview inside Modal */}
            <div className="flex justify-center">
               {newContact.pjPath ? (
                 <div className="relative w-full aspect-[1.6/1] rounded-2xl overflow-hidden border-2 border-[var(--card-border)] bg-black/10 shadow-lg">
                   <img src={newContact.pjPath} className="w-full h-full object-contain" />
                   <button 
                     onClick={() => setNewContact({...newContact, pjPath: ''})}
                     className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/60 text-white flex items-center justify-center active:scale-90"
                   >
                     <Trash2 size={16} />
                   </button>
                 </div>
               ) : (
                 <button 
                  onClick={() => document.getElementById('new-card-input')?.click()}
                  className="w-full h-24 rounded-2xl border-2 border-dashed border-[var(--card-border)] flex flex-col items-center justify-center gap-2 text-[var(--text)] opacity-40 hover:opacity-100 transition-all bg-[var(--input-bg)]"
                 >
                   <Camera size={24} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Prendre une photo</span>
                   <input id="new-card-input" type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoContact} />
                 </button>
               )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-violet-600 dark:text-violet-300 uppercase tracking-widest ml-2">Prénom</p>
                <input value={newContact.prenom} onChange={e => setNewContact({...newContact, prenom: e.target.value})} className="w-full bg-[var(--input-bg)] border-2 border-[var(--input-bd)] rounded-2xl p-4 text-[var(--text)] font-bold focus:border-violet-500 shadow-sm" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-violet-600 dark:text-violet-300 uppercase tracking-widest ml-2">Nom</p>
                <input value={newContact.nom} onChange={e => setNewContact({...newContact, nom: e.target.value})} className="w-full bg-[var(--input-bg)] border-2 border-[var(--input-bd)] rounded-2xl p-4 text-[var(--text)] font-black uppercase focus:border-violet-500 shadow-sm" />
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-300 uppercase tracking-widest ml-2">Entreprise / Société</p>
                <input value={newContact.entreprise} onChange={e => setNewContact({...newContact, entreprise: e.target.value})} className="w-full bg-[var(--input-bg)] border-2 border-[var(--input-bd)] rounded-2xl p-4 text-[var(--text)] font-black uppercase focus:border-emerald-500 shadow-sm" />
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-300 uppercase tracking-widest ml-2">Fonction / Titre</p>
                <input value={newContact.titre} onChange={e => setNewContact({...newContact, titre: e.target.value})} className="w-full bg-[var(--input-bg)] border-2 border-[var(--input-bd)] rounded-2xl p-4 text-[var(--text)] font-bold focus:border-emerald-500 shadow-sm" />
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-[10px] font-black text-violet-600 dark:text-violet-300 uppercase tracking-widest ml-2">Email</p>
                <input value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} className="w-full bg-[var(--input-bg)] border-2 border-[var(--input-bd)] rounded-2xl p-4 text-[var(--text)] font-bold focus:border-violet-500 shadow-sm" />
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-[10px] font-black text-violet-600 dark:text-violet-300 uppercase tracking-widest ml-2">Téléphone</p>
                <input value={newContact.telephone} onChange={e => setNewContact({...newContact, telephone: e.target.value})} className="w-full bg-[var(--input-bg)] border-2 border-[var(--input-bd)] rounded-2xl p-4 text-[var(--text)] font-bold focus:border-violet-500 shadow-sm" />
              </div>
            </div>

            <button onClick={handleSaveContact} disabled={loading || (!newContact.prenom && !newContact.nom && !newContact.pjPath)} className="w-full h-16 bg-emerald-600 rounded-3xl font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition-all">Enregistrer le Contact</button>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setEditingContact(null)} />
          <div className="relative w-full max-w-xl glass-card rounded-[3rem] p-10 space-y-8 border border-[var(--card-border)] ring-1 ring-[var(--card-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center text-white">
                  <UserIcon size={28} />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-[var(--text)] uppercase tracking-tighter">Domaine Public</h4>
                  <p className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">Fiche Contact</p>
                </div>
              </div>
              <button onClick={() => setEditingContact(null)} className="w-12 h-12 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[var(--text)] opacity-40 hover:opacity-100 transition-opacity">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex justify-center mb-4">
                 {editingContact.pjPath ? (
                   <div className="relative w-full aspect-[1.6/1] rounded-2xl overflow-hidden border-2 border-[var(--card-border)] bg-black/5 shadow-lg">
                     <img src={editingContact.pjPath} className="w-full h-full object-contain" />
                     <button 
                       onClick={() => setEditingContact({...editingContact, pjPath: ''})}
                       className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/60 text-white flex items-center justify-center active:scale-90"
                     >
                       <Trash2 size={16} />
                     </button>
                   </div>
                 ) : (
                   <button 
                    onClick={() => document.getElementById('edit-card-input')?.click()}
                    className="w-full aspect-[1.6/1] rounded-2xl border-2 border-dashed border-[var(--card-border)] flex flex-col items-center justify-center gap-3 text-[var(--text)] opacity-40 hover:opacity-100 transition-all bg-[var(--input-bg)]"
                   >
                     <Camera size={32} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Ajouter une photo</span>
                     <input 
                        id="edit-card-input" 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const resized = await resizeImage(file);
                          const fd = new FormData();
                          fd.append('file', resized, 'edit_card.jpg');
                          const res = await api.post('/api/upload', fd);
                          setEditingContact({...editingContact, pjPath: res.data.url});
                        }} 
                      />
                   </button>
                 )}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-violet-600 dark:text-violet-300 uppercase tracking-widest ml-2">Prénom</p>
                <input value={editingContact.prenom} onChange={e => setEditingContact({...editingContact, prenom: e.target.value})} className="w-full bg-[var(--input-bg)] border-2 border-[var(--input-bd)] rounded-2xl p-4 text-[var(--text)] font-bold focus:border-violet-500 shadow-sm" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-violet-600 dark:text-violet-300 uppercase tracking-widest ml-2">Nom</p>
                <input value={editingContact.nom} onChange={e => setEditingContact({...editingContact, nom: e.target.value})} className="w-full bg-[var(--input-bg)] border-2 border-[var(--input-bd)] rounded-2xl p-4 text-[var(--text)] font-black uppercase focus:border-violet-500 shadow-sm" />
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-300 uppercase tracking-widest ml-2">Entreprise</p>
                <input value={editingContact.entreprise || ''} onChange={e => setEditingContact({...editingContact, entreprise: e.target.value})} className="w-full bg-[var(--input-bg)] border-2 border-[var(--input-bd)] rounded-2xl p-4 text-[var(--text)] font-black uppercase focus:border-emerald-500 shadow-sm" />
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-300 uppercase tracking-widest ml-2">Titre / Fonction</p>
                <input value={editingContact.titre || ''} onChange={e => setEditingContact({...editingContact, titre: e.target.value})} className="w-full bg-[var(--input-bg)] border-2 border-[var(--input-bd)] rounded-2xl p-4 text-[var(--text)] font-bold focus:border-emerald-500 shadow-sm" />
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-[10px] font-black text-violet-600 dark:text-violet-300 uppercase tracking-widest ml-2">Email</p>
                <input value={editingContact.email} onChange={e => setEditingContact({...editingContact, email: e.target.value})} className="w-full bg-[var(--input-bg)] border-2 border-[var(--input-bd)] rounded-2xl p-4 text-[var(--text)] font-bold focus:border-violet-500 shadow-sm" />
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-[10px] font-black text-violet-600 dark:text-violet-300 uppercase tracking-widest ml-2">Téléphone</p>
                <input value={editingContact.telephone} onChange={e => setEditingContact({...editingContact, telephone: e.target.value})} className="w-full bg-[var(--input-bg)] border-2 border-[var(--input-bd)] rounded-2xl p-4 text-[var(--text)] font-bold focus:border-violet-500 shadow-sm" />
              </div>
            </div>

            <button onClick={handleSaveContact} disabled={loading || (!editingContact.prenom && !editingContact.nom && !editingContact.pjPath)} className="w-full h-16 bg-violet-600 rounded-3xl font-black uppercase tracking-widest text-white shadow-lg shadow-violet-600/20 active:scale-95 transition-all">Sauvegarder les modifications</button>
          </div>
        </div>
      )}

      {/* Nouveau Dispositif Modal */}
      {showDispositifModal && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setShowDispositifModal(false)} />
          <div className="relative w-full max-w-xl glass-card rounded-[3rem] p-10 space-y-8 border border-[var(--card-border)] shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center text-white">
                  <PlusCircle size={28} />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-[var(--text)] uppercase tracking-tighter">Nouveau Dispositif</h4>
                  <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mt-1">Équipement du dossier</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDispositifModal(false)}
                className="w-12 h-12 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[var(--text)] opacity-40"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-violet-600 dark:text-violet-300 uppercase tracking-widest ml-2">Nom du dispositif</p>
              <input 
                autoFocus
                value={newDispositifNom}
                onChange={e => setNewDispositifNom(e.target.value)}
                placeholder="Ex: Étalage 1, Panneau A..."
                className="w-full bg-[var(--input-bg)] border-2 border-[var(--input-bd)] rounded-2xl p-4 text-[var(--text)] font-bold focus:border-violet-500"
              />
            </div>

            <button 
              onClick={handleCreateDispositif}
              disabled={isSavingDispositif || !newDispositifNom.trim()}
              className="w-full h-16 bg-violet-600 rounded-3xl font-black uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all disabled:opacity-30"
            >
              Créer le dispositif
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
