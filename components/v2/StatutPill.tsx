import React from 'react';
import { getStatusConfig } from '@/lib/status-utils';

// Les statuts TLPE / commerce sont stockés avec ou sans accent (« FACTURÉ » / « FACTURE ») : on les normalise.
export const normStatut = (s?: string) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();

// Pastille d'état de la charte v2 (point + libellé) : prêt à facturer, facturé, titré, clos…
export default function StatutPill({ statut }: { statut?: string }) {
  if (!statut) return null;
  const n = normStatut(statut);
  const key = n === 'VERIFIE' ? 'VALIDE' : n;
  const cfg = getStatusConfig('CHANTIER', key);
  const label = key === 'VALIDE' ? 'Prêt à facturer' : cfg.label;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${cfg.bg} ${cfg.color} ${cfg.border || ''}`}>
      <span className="w-2 h-2 rounded-full bg-current" />
      {label}
    </span>
  );
}
