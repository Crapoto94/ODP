'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, Trash2, Star, Loader2, Download } from 'lucide-react';
import axios from 'axios';

interface DocxGabarit {
  id: number;
  nom: string;
  type: string;
  fichierPath: string;
  isDefault: boolean;
}

export default function DocxUploader({ onGabaritCreated }: { onGabaritCreated?: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docxGabarits, setDocxGabarits] = useState<DocxGabarit[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadDocxGabarits = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/gabarits?type=DOCX');
      setDocxGabarits(res.data.gabarits || []);
    } catch (err) {
      console.error('[DocxUploader] Error loading gabarits:', err);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaults = async () => {
    try {
      console.log('[DocxUploader] Initializing default gabarits...');
      const res = await axios.post('/api/gabarits/init-defaults');
      console.log('[DocxUploader] Initialization response:', res.data);
      // Reload gabarits after initialization
      await loadDocxGabarits();
    } catch (err) {
      console.error('[DocxUploader] Error initializing defaults:', err);
      // Continue anyway - user can upload manually
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.docx')) {
      alert('Seuls les fichiers .docx sont acceptés');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('nom', file.name.replace('.docx', ''));
      formData.append('isDefault', (docxGabarits.length === 0).toString());

      const res = await axios.post('/api/gabarits/upload-docx', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('Template DOCX créé avec succès !');
      await loadDocxGabarits();
      onGabaritCreated?.();
    } catch (err: any) {
      alert(`Erreur: ${err.response?.data?.error || err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce template ?')) return;
    try {
      await axios.delete(`/api/gabarits/${id}`);
      await loadDocxGabarits();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await axios.patch(`/api/gabarits/${id}`, { isDefault: true });
      await loadDocxGabarits();
    } catch (err) {
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDownload = (gabarit: DocxGabarit) => {
    if (!gabarit.fichierPath) {
      alert('Fichier non disponible');
      return;
    }
    const link = document.createElement('a');
    link.href = gabarit.fichierPath;
    link.download = `${gabarit.nom}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  React.useEffect(() => {
    const init = async () => {
      // First, try to initialize defaults (creates default DOCX if missing)
      await initializeDefaults();
      // Then load all gabarits
      await loadDocxGabarits();
    };
    init();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950">Templates DOCX (AOT)</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
            Uploader des fichiers Word pour les arrêtés (AOT)
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? 'Chargement...' : 'Uploader DOCX'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-3">
          <Loader2 size={20} className="animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Chargement...</p>
        </div>
      ) : docxGabarits.length === 0 ? (
        <div className="py-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
          <FileText size={40} className="text-slate-300 mb-4" />
          <p className="text-sm font-bold text-slate-600 mb-2">Aucun template DOCX</p>
          <p className="text-xs text-slate-500">Cliquez sur "Uploader DOCX" pour créer le premier template</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docxGabarits.map((gabarit) => (
            <div
              key={gabarit.id}
              className="bg-white border border-slate-200 rounded-xl p-6 flex items-start justify-between hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FileText size={20} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{gabarit.nom}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {gabarit.isDefault ? '✓ Par défaut' : 'Template'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(gabarit)}
                  title="Télécharger ce template"
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <Download size={16} />
                </button>
                {!gabarit.isDefault && (
                  <button
                    onClick={() => handleSetDefault(gabarit.id)}
                    title="Définir comme défaut"
                    className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                  >
                    <Star size={16} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(gabarit.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
