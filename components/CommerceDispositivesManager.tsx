"use client";

import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import axios from 'axios';
import LigneArticleModal from '@/components/LigneArticleModal';

interface Props {
  tiersId: number;
  selectedYear: number;
  onDispositivesAdded?: () => void;
}

export default function CommerceDispositivesManager({
  tiersId,
  selectedYear,
  onDispositivesAdded
}: Props) {
  const [creatingOccupation, setCreatingOccupation] = useState(false);
  const [occupationId, setOccupationId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddDispositive = async () => {
    setCreatingOccupation(true);
    try {
      const res = await axios.post('/api/occupations', {
        tiersId,
        type: 'COMMERCE',
        statut: 'EN_ATTENTE',
        anneeTaxation: selectedYear,
        adresse: ''
      });

      setOccupationId(res.data.id);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to create occupation:', err);
      alert('Erreur lors de la création du dossier');
    } finally {
      setCreatingOccupation(false);
    }
  };

  const handleLineSaved = () => {
    setIsModalOpen(false);
    onDispositivesAdded?.();
  };

  const defaultDates = {
    start: new Date(selectedYear, 0, 1).toISOString().split('T')[0],
    end: new Date(selectedYear, 11, 31).toISOString().split('T')[0]
  };

  if (creatingOccupation) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-slate-600">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm font-bold">Création...</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleAddDispositive}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors"
      >
        <Plus size={16} />
        Ajouter un dispositif
      </button>

      {occupationId && (
        <LigneArticleModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setOccupationId(null);
          }}
          onSave={handleLineSaved}
          occupationId={occupationId}
          annee={selectedYear}
          defaultDates={defaultDates}
          occupationType="COMMERCE"
        />
      )}
    </>
  );
}
