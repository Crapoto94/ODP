"use client";
import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface ContentBoxProps {
  children: React.ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyIcon?: React.ReactNode;
  emptyMessage?: string;
  error?: boolean;
  errorMessage?: string;
  minHeight?: string;
  className?: string;
}

export default function ContentBox({
  children,
  loading = false,
  empty = false,
  emptyIcon,
  emptyMessage = 'Aucune donnée',
  error = false,
  errorMessage = 'Une erreur s\'est produite',
  minHeight = 'min-h-[300px]',
  className = ''
}: ContentBoxProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${minHeight} flex flex-col ${className}`}>
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Chargement...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-rose-600">
          <AlertCircle size={48} className="opacity-40" />
          <p className="text-xs font-bold text-center text-slate-600">{errorMessage}</p>
        </div>
      ) : empty ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-40">
          {emptyIcon}
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{emptyMessage}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
