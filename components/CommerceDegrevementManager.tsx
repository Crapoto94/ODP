"use client";

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import DegrevementModal from '@/components/DegrevementModal';

interface Props {
  tiersId: number;
  selectedYear: number;
  occupationId: number;
  onDegrevementAdded?: () => void;
}

export default function CommerceDegrevementManager({
  tiersId,
  selectedYear,
  occupationId,
  onDegrevementAdded
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleModalSave = () => {
    onDegrevementAdded?.();
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors"
      >
        <Plus size={16} />
        Ajouter un dégrèvement
      </button>

      <DegrevementModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        occupationId={occupationId}
      />
    </>
  );
}
