"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  occupationId: number;
  initialData?: any;
  maxMontant?: number;
}

export default function DegrevementModal({
  isOpen,
  onClose,
  onSave,
  occupationId,
  initialData,
  maxMontant = 0
}: Props) {
  const [description, setDescription] = useState('');
  const [montant, setMontant] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.note || '');
      setMontant(String(Math.abs(initialData.montant || 0)));
    } else {
      setDescription('');
      setMontant('');
    }
    setError('');
  }, [initialData, isOpen]);

  const handleSave = async () => {
    if (!description.trim()) {
      setError('La description est requise');
      return;
    }
    if (!montant || parseFloat(montant) <= 0) {
      setError('Le montant doit être supérieur à 0');
      return;
    }
    if (maxMontant > 0 && parseFloat(montant) > maxMontant) {
      setError(`Le montant du dégrèvement ne peut pas dépasser ${maxMontant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€ (montant total de la facture)`);
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      if (initialData?.id) {
        // Éditer une ligne existante
        await axios.patch(`/api/occupations/${occupationId}/lignes/${initialData.id}`, {
          montant: -Math.abs(parseFloat(montant)),
          note: description
        });
      } else {
        // Créer une nouvelle ligne de dégrèvement
        await axios.post(`/api/occupations/${occupationId}/degrevements`, {
          description,
          montant: Math.abs(parseFloat(montant))
        });
      }
      setDescription('');
      setMontant('');
      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error saving dégrèvement:', err);
      setError(err.response?.data?.error || 'Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900">
            {initialData ? 'Éditer le dégrèvement' : 'Ajouter un dégrèvement'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Dégât des eaux repérés et corrigés"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Montant du dégrèvement (€)
            </label>
            <div className="relative">
              <input
                type="number"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">€</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ce montant sera déduit du total de la facture
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-100 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 font-bold rounded-lg hover:bg-slate-100 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {initialData ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}
