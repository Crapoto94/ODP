"use client";

import React from 'react';

// Heures par pas de 15 minutes (00:00 → 23:45)
export const HEURES_15 = Array.from({ length: 96 }, (_, i) => `${String(Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`);

export default function TimeSelect({ value, onChange, placeholder = '--:--' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {HEURES_15.map((h) => <option key={h} value={h}>{h}</option>)}
    </select>
  );
}
