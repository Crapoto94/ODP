"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, 
  CheckCircle2, 
  Loader2, 
  FileText, 
  Search,
  Filter,
  CheckSquare,
  Square,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FilienGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  occupations: any[];
}

export default function FilienGenerationModal({ isOpen, onClose, occupations }: FilienGenerationModalProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [generating, setGenerating] = useState(false);

  // Eligible dossiers: Status 'VERIFIED' or 'COMPLETED' by default, 
  // but let's allow all 'VALIDE' or 'VERIFIED' ones.
  const eligibleOccupations = occupations.filter(o => 
    ['VERIFIE', 'TERMINE', 'FACTURE', 'PAYE'].includes(o.statut)
  );

  const filtered = eligibleOccupations.filter(o => 
    (o.tiers?.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.adresse.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.nom || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(o => o.id));
    }
  };

  const handleGenerate = async () => {
    if (selectedIds.length === 0) return;
    setGenerating(true);
    try {
      const response = await axios.post('/api/filien/generate', { ids: selectedIds }, {
        responseType: 'blob'
      });
      
      // Download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `filien_export_${format(new Date(), 'yyyyMMdd_HHmm')}.txt`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch?.[1]) fileName = fileNameMatch[1];
      }
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      onClose();
    } catch (err) {
      console.error('Error generating Filien file:', err);
      alert('Erreur lors de la génération du fichier Filien');
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
        <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Générer Fichier FILIEN</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sélétionnez les dossiers à exporter</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl text-slate-300 hover:text-slate-900 transition-all"><X size={24} /></button>
        </div>

        <div className="p-8 border-b border-slate-50 bg-slate-50/10 flex items-center gap-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher par demandeur, adresse, libellé..." 
              className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-bold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={toggleAll}
            className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-all"
          >
            {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
            {selectedIds.length === filtered.length && filtered.length > 0 ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-4">
          {filtered.length === 0 ? (
            <div className="py-20 text-center font-bold text-slate-300 italic uppercase text-[10px] tracking-widest">
              Aucun dossier éligible trouvé
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filtered.map((occ) => (
                <div 
                  key={occ.id} 
                  onClick={() => toggleSelect(occ.id)}
                  className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                    selectedIds.includes(occ.id) 
                      ? 'bg-blue-50/50 border-blue-500 shadow-lg shadow-blue-500/5' 
                      : 'bg-white border-slate-100 hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`p-1 rounded-lg transition-colors ${selectedIds.includes(occ.id) ? 'text-blue-600' : 'text-slate-200 group-hover:text-blue-200'}`}>
                      {selectedIds.includes(occ.id) ? <CheckSquare size={24} /> : <Square size={24} />}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase">
                        {occ.nom || `Dossier #${occ.id}`}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{occ.tiers?.nom}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[300px]">{occ.adresse}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">
                      {((occ.lignes?.reduce((sum: number, l: any) => sum + (l.montant || 0), 0) || occ.montantCalcule || 0)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">
                      {occ.type} • {occ.statut}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-10 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between sticky bottom-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">{selectedIds.length} dossier(s) sélectionné(s)</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Fichier texte au format FILIEN 2023.1</p>
            </div>
          </div>
          <button 
            onClick={handleGenerate}
            disabled={generating || selectedIds.length === 0}
            className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50"
          >
            {generating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            Générer le fichier
          </button>
        </div>
      </div>
    </div>
  );
}
