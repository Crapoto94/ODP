"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, X } from 'lucide-react';

interface Props {
  show: boolean;
  onClose: () => void;
  editingSignatory?: any;
  onSaved: () => void;
}

export default function SignatoryModal({ show, onClose, editingSignatory, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nom: '',
    email: '',
    role: '',
    titre: '',
    isDefault: false
  });

  useEffect(() => {
    if (editingSignatory) {
      setForm({
        nom: editingSignatory.nom,
        email: editingSignatory.email,
        role: editingSignatory.role,
        titre: editingSignatory.titre || '',
        isDefault: editingSignatory.isDefault
      });
    } else {
      setForm({
        nom: '',
        email: '',
        role: '',
        titre: '',
        isDefault: false
      });
    }
    setError(null);
  }, [editingSignatory, show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingSignatory) {
        await axios.patch(`/api/signatories/${editingSignatory.id}`, form);
      } else {
        await axios.post('/api/signatories', form);
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur de sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              {editingSignatory ? 'Modifier Signataire' : 'Ajouter Signataire'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Informations de signature
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            disabled={loading}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-sm font-bold">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
              Nom Complet *
            </label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
              placeholder="Jean Dupont"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
              Email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
              placeholder="jean@exemple.com"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
              Rôle *
            </label>
            <input
              type="text"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
              placeholder="Maire"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
              Titre / Fonction
            </label>
            <input
              type="text"
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm"
              placeholder="Directeur Général Adjoint"
              disabled={loading}
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
            <input
              type="checkbox"
              id="isDefault"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="w-5 h-5 rounded accent-blue-600"
              disabled={loading}
            />
            <label htmlFor="isDefault" className="text-sm font-bold text-slate-700 flex-1">
              Définir comme signataire par défaut
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg font-black transition-all disabled:opacity-50"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {editingSignatory ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
