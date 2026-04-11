"use client";

import React from 'react';
import { 
  X, Fingerprint, Building2, Mail, MapPin, 
  SearchCode, CheckCircle2, Loader2, Info
} from 'lucide-react';

export const NATURE_JURIDIQUE_OPTIONS = [
  { code: '01', label: '01 - Particuliers' },
  { code: '02', label: '02 - Commerçants et artisans' },
  { code: '03', label: '03 - Société' },
  { code: '04', label: '04 - Prof. Libérales (sauf médical)' },
  { code: '05', label: '05 - Prof. de santé' },
  { code: '06', label: '06 - Assoc. à but lucratif ou syndicat' },
  { code: '07', label: '07 - Assoc. à but non lucratif' },
  { code: '08', label: '08 - Entreprise Publique (EPIC)' },
  { code: '09', label: '09 - Administration publique' },
  { code: '10', label: '10 - Écoles et centres de formation' },
  { code: '11', label: '11 - Organismes divers' }
];

interface TiersModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  setFormData: (data: any) => void;
  submitting: boolean;
  handleSubmit: (e: React.FormEvent, isSeditRequest?: boolean) => void;
  handleSiretSearch: () => void;
  isEditing: boolean;
}

export default function TiersModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  submitting,
  handleSubmit,
  handleSiretSearch,
  isEditing
}: TiersModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
        
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {isEditing ? 'Modifier le Tiers' : 'Nouveau Tiers'}
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {isEditing ? `ID # ${formData.id}` : 'Saisie manuelle ou via SIRET'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white rounded-xl text-slate-300 hover:text-slate-900 transition-all shadow-sm"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Recherche SIRET (Optionnel)</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold text-lg tracking-tight"
                    placeholder="Ex: 954 509... (ou laisser vide)"
                    value={formData.siret}
                    onChange={e => setFormData({...formData, siret: e.target.value})}
                  />
                </div>
                <button 
                  type="button"
                  onClick={handleSiretSearch}
                  disabled={submitting || !formData.siret || formData.siret.trim() === ''}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 group disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <SearchCode size={18} className="group-hover:rotate-12 transition-transform" />}
                  Rechercher
                </button>
              </div>
              <p className="text-[10px] font-bold text-slate-400 italic ml-1 flex items-center gap-2">
                <Info size={12} />
                Laissez vide pour un particulier. La recherche INSEE est optionnelle.
              </p>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Raison Sociale / Nom Complet</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text" 
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold text-lg"
                  placeholder="Ex: SARL La Terrasse"
                  value={formData.nom}
                  onChange={e => setFormData({...formData, nom: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email de contact (Optionnel)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="email" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold"
                  placeholder="contact@entreprise.fr"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nature Juridique</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer"
                value={formData.natureJuridique}
                onChange={e => setFormData({...formData, natureJuridique: e.target.value})}
              >
                <option value="">Sélectionner...</option>
                {NATURE_JURIDIQUE_OPTIONS.map(opt => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Code SEDIT (Optionnel)</label>
              <div className="relative">
                <SearchCode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold"
                  placeholder="Identifiant financier"
                  value={formData.code_sedit}
                  onChange={e => setFormData({...formData, code_sedit: e.target.value})}
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Siège Social / Adresse</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold"
                  placeholder="Ex: 12 Rue de la République"
                  value={formData.adresse}
                  onChange={e => setFormData({...formData, adresse: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 sticky bottom-0 bg-white pt-6 border-t border-slate-50">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-4 font-black text-slate-400 hover:bg-slate-50 rounded-xl transition-all uppercase tracking-widest text-[10px]"
            >
              Annuler
            </button>
            <div className="flex-1 flex gap-3">
               {isEditing && !formData.code_sedit && (
                <button 
                  type="button"
                  onClick={(e) => handleSubmit(e as any, true)}
                  disabled={submitting}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-4 rounded-xl font-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-[9px] border border-blue-200"
                >
                   Demander Création SEDIT
                </button>
              )}
              <button 
                type="submit" 
                disabled={submitting}
                className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-black shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {isEditing ? 'Enregistrer les modifications' : 'Enregistrer le Tiers'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
