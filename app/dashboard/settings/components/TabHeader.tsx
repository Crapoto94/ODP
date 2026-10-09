"use client";
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useUiMode } from '@/components/UiModeProvider';

interface TabHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  accentColor?: string;
  action?: {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'outline';
  };
}

export default function TabHeader({ icon: Icon, title, subtitle, accentColor = 'blue', action }: TabHeaderProps) {
  const accentColors: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-600' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'text-indigo-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-600' },
  };

  const colors = accentColors[accentColor] || accentColors.blue;
  const ActionIcon = action?.icon;
  const uiMode = useUiMode();

  // Nouvelle interface : le titre et la description sont déjà dans l'en-tête de la page Paramètres ; on ne garde que l'action.
  if (uiMode === 'v2') {
    if (!action || !ActionIcon) return null;
    return (
      <div className="flex justify-end">
        <button
          onClick={action.onClick}
          disabled={action.disabled}
          className={`flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap disabled:opacity-50 ${
            action.variant === 'primary'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-[#e2e8f0]'
          }`}
        >
          <ActionIcon size={16} />
          {action.label}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${colors.bg} rounded-2xl flex items-center justify-center shadow-inner`}>
          <Icon size={24} className={colors.icon} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{subtitle}</p>
        </div>
      </div>

      {action && ActionIcon && (
        <button
          onClick={action.onClick}
          disabled={action.disabled}
          className={`flex items-center gap-3 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 whitespace-nowrap active:scale-95 disabled:opacity-50 ${
            action.variant === 'primary'
              ? 'bg-slate-950 hover:bg-slate-800 text-white shadow-xl'
              : action.variant === 'secondary'
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200'
                : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-sm'
          }`}
        >
          <ActionIcon size={16} />
          {action.label}
        </button>
      )}
    </div>
  );
}
