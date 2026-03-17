"use client";

import React, { useState, useEffect, use } from 'react';
import axios from 'axios';
import { 
  X, 
  MapPin, 
  Calendar, 
  Euro, 
  Clock, 
  User, 
  FileText, 
  Package, 
  CheckCircle2, 
  ArrowRight,
  Pencil,
  Trash2,
  ExternalLink,
  Download,
  ImageIcon,
  Plus,
  Hash,
  ChevronLeft,
  Loader2,
  MessageSquare,
  Send,
  Mic,
  Paperclip
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LigneArticleModal from '@/components/LigneArticleModal';

interface Props {
  params: Promise<{ id: string }>;
}

export default function OccupationDetailPage({ params }: Props) {
  const { id: paramId } = use(params);
  const router = useRouter();
  const [occ, setOcc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isLigneModalOpen, setIsLigneModalOpen] = useState(false);
  const [editingLigne, setEditingLigne] = useState<any>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const fetchOccupation = async () => {
    try {
      const res = await axios.get(`/api/occupations/${paramId}`);
      setOcc(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOccupation();
  }, [paramId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement du dossier...</p>
      </div>
    );
  }

  if (!occ) {
    return (
      <div className="text-center py-20">
        <p className="text-xl font-bold text-slate-900">Dossier non trouvé</p>
        <Link href="/dashboard/occupations" className="text-blue-600 hover:underline mt-4 inline-block">Retour à la liste</Link>
      </div>
    );
  }

  const totalAmount = occ.lignes?.reduce((sum: number, l: any) => sum + l.montant, 0) || 0;

  const handleApprove = async () => {
    if (!confirm('Approuver ce dossier ?')) return;
    try {
      await axios.patch(`/api/occupations/${occ.id}`, { statut: 'VALIDE' });
      fetchOccupation();
    } catch (err) { alert('Erreur lors de la validation'); }
  };

  const downloadFacture = async () => {
    setGeneratingPdf(true);
    try {
      const res = await axios.get(`/api/facture-pdf/${occ.id}`, {
        responseType: 'blob'
      });
      
      // Force refresh of the dossier to see the new PJ
      await fetchOccupation();

      // Download the PDF
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Facture-ODP-${occ.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération de la facture');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDeleteLigne = async (ligneId: number) => {
    if (!confirm("Retirer cet article ?")) return;
    try {
      await axios.delete(`/api/occupations/${occ.id}/lignes/${ligneId}`);
      fetchOccupation();
    } catch (err) {
      alert("Erreur lors de la suppression de la ligne");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard/occupations"
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-sm group"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:bg-slate-50 transition-all">
            <ChevronLeft size={16} />
          </div>
          Retour à la liste
        </Link>

        {/* Action Quick Bar */}
        <div className="flex items-center gap-3">
           <button 
             onClick={() => router.push(`/dashboard/occupations?edit=${occ.id}`)}
             className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 rounded-xl transition-all shadow-sm font-bold text-xs flex items-center gap-2"
           >
             <Pencil size={14} /> Modifier info
           </button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 flex flex-col md:flex-row items-start justify-between gap-10">
        <div className="space-y-6 flex-1">
          <div className="flex items-center gap-3">
            <div className="relative group/status">
              <button 
                className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all hover:brightness-95 flex items-center gap-2 ${
                  occ.statut === 'VALIDE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                  occ.statut === 'EXPIRE' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                  occ.statut === 'REFUSE' ? 'bg-slate-900 text-white border-slate-900' :
                  occ.statut === 'ANNULE' ? 'bg-slate-100 text-slate-400 border-slate-200' :
                  'bg-amber-50 text-amber-600 border-amber-100'
                }`}
              >
                {occ.statut}
              </button>
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 hidden group-hover/status:block z-[120] animate-in slide-in-from-top-2 duration-200">
                {['EN_ATTENTE', 'VALIDE', 'REFUSE', 'ANNULE', 'EXPIRE'].map((s) => (
                  <button
                    key={s}
                    onClick={async () => {
                      try {
                        await axios.patch(`/api/occupations/${occ.id}`, { statut: s });
                        fetchOccupation();
                      } catch (e) { alert("Erreur lors du changement de statut"); }
                    }}
                    className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <span className="bg-slate-50 px-4 py-1 rounded-full border border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
              {occ.type}
            </span>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              ID #{occ.id}
            </span>
          </div>

          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {occ.nom || `Dossier sans nom`}
          </h1>

          <div className="flex flex-wrap items-center gap-y-3 gap-x-8 text-slate-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <User size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Demandeur</p>
                <p className="text-sm font-black text-slate-900 leading-none">{occ.tiers?.nom || 'Non spécifié'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Localisation</p>
                <p className="text-sm font-black text-slate-900 leading-none">{occ.adresse}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Période</p>
                <p className="text-sm font-black text-slate-900 leading-none">
                  {occ.type === 'COMMERCE' ? (occ.anneeTaxation || '-') : (
                    <>
                      {occ.dateDebut ? format(new Date(occ.dateDebut), 'dd MMM yyyy', { locale: fr }) : '?'} - {occ.dateFin ? format(new Date(occ.dateFin), 'dd MMM yyyy', { locale: fr }) : '?'}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-80 space-y-4">
           <div className="bg-slate-950 rounded-[2rem] p-8 text-white relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform">
                <Euro size={120} />
              </div>
              <div className="relative z-10">
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">Total TTC</p>
                <p className="text-4xl font-black tracking-tighter mb-6">{totalAmount.toLocaleString('fr-FR')} €</p>
                
                {occ.statut !== 'VALIDE' ? (
                  <button 
                    onClick={handleApprove}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                  >
                    Valider le Dossier
                  </button>
                ) : (
                  <button 
                    onClick={downloadFacture}
                    disabled={generatingPdf}
                    className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all backdrop-blur-sm border border-white/10 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {generatingPdf ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    {generatingPdf ? 'Génération...' : 'Facture PDF'}
                  </button>
                )}
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Articles Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
               <div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Articles Taxables</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Détail des éléments d'occupation</p>
               </div>
               <button 
                 onClick={() => { setEditingLigne(null); setIsLigneModalOpen(true); }}
                 className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95"
               >
                 <Plus size={16} /> Ajouter un article
               </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {!occ.lignes || occ.lignes.length === 0 ? (
                <div className="py-16 bg-white rounded-[2rem] border border-dashed border-slate-200 text-center">
                   <Package size={40} className="mx-auto text-slate-200 mb-4" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucun article enregistré</p>
                </div>
              ) : (
                occ.lignes.map((ligne: any) => (
                  <div key={ligne.id} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between group transition-all hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5">
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-slate-200 p-2 text-center group-hover:bg-white transition-colors">
                         <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Article</p>
                         <p className="font-black text-slate-900 leading-none">{ligne.article?.numero || '#'}</p>
                      </div>
                      
                      <div className="space-y-1.5 text-left">
                         <div className="flex items-center gap-3">
                           <h4 className="text-base font-black text-slate-900">{ligne.article?.designation}</h4>
                           <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-lg text-[8px] font-black uppercase border border-slate-200">
                             {ligne.article?.modeTaxation?.nom || 'Tarif Fixe'}
                           </span>
                         </div>
                         <p className="text-xs font-bold text-slate-400 flex flex-wrap items-center gap-y-2 gap-x-5">
                             <>
                               <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-[10px] font-bold text-slate-400 uppercase w-full">
                                 <span className="flex items-center gap-1.5">
                                   <Clock size={12} className="text-slate-300" /> 
                                   {occ.type === 'COMMERCE' 
                                     ? occ.anneeTaxation 
                                     : `${format(new Date(ligne.dateDebut), 'dd/MM/yyyy', { locale: fr })} - ${format(new Date(ligne.dateFin), 'dd/MM/yyyy', { locale: fr })}`
                                   }
                                 </span>
                                 <span className="flex items-center gap-1.5 leading-relaxed">
                                   <Hash size={12} className="text-slate-300 shrink-0" />
                                   {(() => {
                                     const rawMode = ligne.article?.modeTaxation?.nom || 'unité';
                                     const parts = rawMode.split('/').map((p: string) => p.trim());
                                     const u1 = parts[0] || 'unité';
                                     const u2 = parts[1] || 'unité';
                                     const displayU1 = u1.toLowerCase() === 'unité' ? 'unité' : u1;
                                     const displayU2 = u2.toLowerCase() === 'unité' ? 'unité' : u2;

                                     if (occ.type === 'CHANTIER') {
                                       const startStr = format(new Date(ligne.dateDebutConstatee || ligne.dateDebut), 'dd/MM/yyyy', { locale: fr });
                                       const endStr = format(new Date(ligne.dateFinConstatee || ligne.dateFin), 'dd/MM/yyyy', { locale: fr });
                                       return (
                                         <div className="flex flex-col normal-case">
                                           <span className="text-slate-500">{ligne.quantite1} {displayU1} x {ligne.quantite2} {displayU2} à {ligne.article?.montant}€ soit </span>
                                           <span className="text-[9px] text-slate-400 font-medium italic">Période réelle : Du {startStr} au {endStr}</span>
                                         </div>
                                       );
                                     }
                                     
                                     if (occ.type === 'COMMERCE') {
                                       return <span className="normal-case text-slate-500">{ligne.quantite1} {displayU1} à {ligne.article?.montant}€/{displayU1} soit </span>;
                                     }

                                     return (
                                       <span className="normal-case text-slate-500">
                                         {ligne.quantite1} {displayU1} 
                                         {ligne.quantite2 !== 1 ? ` x ${ligne.quantite2} ${displayU2}` : ''} 
                                         {` à ${ligne.article?.montant}€ soit `}
                                       </span>
                                     );
                                   })()}
                                   <span className="text-slate-900 font-extrabold ml-auto">{ligne.montant.toLocaleString('fr-FR')} €</span>
                                 </span>
                               </div>
                             </>
                          </p>
                         {ligne.photos && (
                            <div className="flex flex-wrap gap-2 mt-3 text-left">
                               {ligne.photos.split(',').filter(Boolean).map((url: string, i: number) => (
                                 <a key={i} href={url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 hover:border-blue-300 transition-all shadow-sm block">
                                   <img src={url} alt={`Article attachment ${i+1}`} className="w-full h-full object-cover" />
                                 </a>
                               ))}
                            </div>
                         )}
                      </div>
                    </div>

                    <div className="mt-6 md:mt-0 flex items-center gap-12">
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1.5 leading-none">Montant TTC</p>
                          <p className="text-2xl font-black text-slate-900 leading-none">
                            {ligne.montant.toLocaleString('fr-FR')} €
                          </p>
                       </div>
                       
                       <div className="flex gap-2">
                          <button 
                            onClick={() => { setEditingLigne(ligne); setIsLigneModalOpen(true); }}
                            className="p-3.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          >
                            <Pencil size={20} />
                          </button>
                          <button 
                            onClick={() => handleDeleteLigne(ligne.id)}
                            className="p-3.5 text-slate-200 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 size={20} />
                          </button>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Notes Section (WhatsApp style) */}
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
               <div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Discussion / Notes</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Historique des échanges sur ce dossier</p>
               </div>
            </div>
            
            <NotesThread occupationId={occ.id} />
          </section>
        </div>

        <aside className="space-y-10">
          {/* PJ Section */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} /> Pièces Jointes ({(occ.photos ? occ.photos.split(',').filter(Boolean).length : 0) + (occ.facturePath ? 1 : 0)})
            </h3>
            {occ.photos ? (
              <div className="grid grid-cols-2 gap-4">
                {occ.photos.split(',').filter(Boolean).map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="group relative aspect-square rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm transition-all hover:scale-[1.02] hover:shadow-xl">
                    <img src={url} alt={`Justificatif ${i+1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ExternalLink size={20} className="text-white" />
                    </div>
                  </a>
                ))}
                {occ.facturePath && (
                  <a href={occ.facturePath} target="_blank" rel="noreferrer" className="group relative aspect-square rounded-[2rem] overflow-hidden border border-blue-100 bg-blue-50/30 shadow-sm transition-all hover:scale-[1.02] hover:shadow-xl flex flex-col items-center justify-center p-6 text-center">
                    <FileText size={40} className="text-blue-500 mb-3" />
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Facture PDF</p>
                    <p className="text-[8px] font-bold text-slate-400 mt-1">Générée automatiquement</p>
                    <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
              </div>
            ) : occ.facturePath ? (
              <div className="grid grid-cols-2 gap-4">
                  <a href={occ.facturePath} target="_blank" rel="noreferrer" className="group relative aspect-square rounded-[2rem] overflow-hidden border border-blue-100 bg-blue-50/30 shadow-sm transition-all hover:scale-[1.02] hover:shadow-xl flex flex-col items-center justify-center p-6 text-center">
                    <FileText size={40} className="text-blue-500 mb-3" />
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Facture PDF</p>
                    <p className="text-[8px] font-bold text-slate-400 mt-1">Générée automatiquement</p>
                  </a>
              </div>
            ) : (
              <div className="py-10 bg-white rounded-[2rem] border border-dashed border-slate-200 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase italic">Aucune pièce jointe</p>
              </div>
            )}
          </section>

          {/* Observations Section */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observations</h3>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 min-h-[140px] shadow-sm">
              <p className="text-slate-600 font-medium leading-relaxed italic text-sm">
                {occ.description || "Aucune observation particulière n'a été ajoutée à ce dossier."}
              </p>
            </div>
          </section>
        </aside>
      </div>

      {isLigneModalOpen && (
        <LigneArticleModal 
          isOpen={isLigneModalOpen}
          onClose={() => setIsLigneModalOpen(false)}
          onSave={fetchOccupation}
          occupationId={occ.id}
          annee={occ.anneeTaxation || (occ.dateDebut ? new Date(occ.dateDebut).getFullYear() : new Date().getFullYear())}
          defaultDates={{
            start: occ.dateDebut?.split('T')[0] || format(new Date(), 'yyyy-MM-dd'),
            end: occ.dateFin?.split('T')[0] || format(new Date(), 'yyyy-MM-dd')
          }}
          occupationType={occ.type}
          initialData={editingLigne}
        />
      )}
    </div>
  );
}

function NotesThread({ occupationId }: { occupationId: number }) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [pj, setPj] = useState<{ path: string, name: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchNotes = async () => {
    try {
      const res = await axios.get(`/api/occupations/${occupationId}/notes`);
      setNotes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [occupationId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/upload', formData);
      setPj({ path: res.data.url, name: res.data.name });
    } catch (err) {
      alert('Erreur lors de l\'envoi du fichier');
    } finally {
      setUploading(false);
    }
  };

  const startDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("La reconnaissance vocale n'est pas supportée par votre navigateur.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNewNote(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() && !pj) return;
    setSubmitting(true);
    try {
      await axios.post(`/api/occupations/${occupationId}/notes`, { 
        content: newNote || (pj ? `Pièce jointe : ${pj.name}` : ''),
        pjPath: pj?.path,
        pjName: pj?.name
      });
      setNewNote('');
      setPj(null);
      fetchNotes();
    } catch (err) {
      alert('Erreur lors de l\'envoi de la note');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-8 flex flex-col gap-8 min-h-[400px]">
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
          notes.map((note) => (
            <div key={note.id} className={`flex flex-col ${note.author === 'Conseiller' ? 'items-end' : 'items-start'}`}>
               <div className={`max-w-[80%] rounded-3xl p-5 shadow-sm border ${
                 note.author === 'Conseiller' 
                   ? 'bg-blue-600 text-white rounded-tr-none border-blue-500 shadow-blue-500/20' 
                   : 'bg-white text-slate-800 rounded-tl-none border-slate-100 shadow-slate-200/20'
               }`}>
                  <div className="flex items-center justify-between gap-10 mb-2">
                    <span className={`text-[8px] font-black uppercase tracking-widest ${note.author === 'Conseiller' ? 'text-blue-100' : 'text-slate-400'}`}>
                      {note.author}
                    </span>
                    <span className={`text-[8px] font-bold ${note.author === 'Conseiller' ? 'text-blue-200' : 'text-slate-300'}`}>
                      {format(new Date(note.created_at), 'dd MMM HH:mm', { locale: fr })}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  {note.pjPath && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      {note.pjName?.match(/\.(jpeg|jpg|gif|png|webp)$/i) && (
                        <div className="mb-2 rounded-xl overflow-hidden shadow-sm max-w-sm">
                          <a href={note.pjPath} target="_blank" rel="noreferrer">
                            <img src={note.pjPath} alt={note.pjName} className="w-full h-auto object-cover max-h-48 hover:opacity-90 transition-opacity" />
                          </a>
                        </div>
                      )}
                      <a 
                        href={note.pjPath} 
                        target="_blank" 
                        rel="noreferrer"
                        className={`inline-flex items-center gap-2 p-2 rounded-xl text-[10px] font-bold transition-all ${
                          note.author === 'Conseiller' ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <Paperclip size={12} />
                        <span className="truncate max-w-[150px]">{note.pjName || 'Document'}</span>
                        <Download size={12} className="ml-2" />
                      </a>
                    </div>
                  )}
               </div>
            </div>
          ))
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

        <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              rows={1}
              placeholder={isRecording ? "Écoute en cours..." : "Écrivez un message ici..."}
              className={`w-full bg-white border border-slate-200 rounded-[2rem] py-5 pl-8 pr-12 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium text-sm shadow-sm resize-none ${isRecording ? 'animate-pulse border-blue-400' : ''}`}
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
            disabled={submitting || (!newNote.trim() && !pj)}
            className="w-14 h-14 bg-slate-900 hover:bg-blue-600 disabled:opacity-20 text-white rounded-[1.5rem] flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-black/10"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
