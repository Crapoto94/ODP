"use client";

import React from 'react';
import { AlertCircle, CheckCircle2, Info, Loader2, Save, X } from 'lucide-react';

// Composants de base de la refonte des pages de Paramètres (nouvelle interface) : une seule grammaire visuelle
// (carte de section, champ, interrupteur, boutons, alertes, tableaux) pour tous les onglets.

const BORDER = 'border-[#e2e8f0]';

/* ── Carte de section : en-tête (icône, titre, description, actions) + corps ── */
export function SCard({ icon: Icon, title, description, actions, children, className = '', bodyClassName = 'p-6', flush = false }: {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  title?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean; // corps sans marge (tableaux pleine largeur)
}) {
  return (
    <section className={`bg-white rounded-2xl border ${BORDER} shadow-[0_1px_3px_rgba(15,23,42,0.05)] overflow-hidden ${className}`}>
      {(title || actions) && (
        <header className={`flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b ${BORDER}`}>
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <span className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Icon size={18} />
              </span>
            )}
            <div className="min-w-0">
              {title && <h3 className="text-[15px] font-bold text-slate-900 leading-tight">{title}</h3>}
              {description && <p className="text-[13px] text-slate-500 mt-0.5">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={flush ? '' : bodyClassName}>{children}</div>
    </section>
  );
}

/* ── Grille de champs ── */
export function SGrid({ cols = 2, children, className = '' }: { cols?: 1 | 2 | 3; children: React.ReactNode; className?: string }) {
  const c = cols === 1 ? 'grid-cols-1' : cols === 3 ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 md:grid-cols-2';
  return <div className={`grid ${c} gap-x-6 gap-y-5 ${className}`}>{children}</div>;
}

/* ── Champ : libellé + contrôle + aide ── */
export function SField({ label, hint, children, className = '', required }: { label?: string; hint?: React.ReactNode; children: React.ReactNode; className?: string; required?: boolean }) {
  return (
    <div className={`min-w-0 ${className}`}>
      {label && <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">{label}{required && <span className="text-rose-500"> *</span>}</label>}
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-500 leading-snug">{hint}</p>}
    </div>
  );
}

export const inputClass =
  'w-full h-[42px] px-3.5 rounded-lg border border-[#e2e8f0] bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-600 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400';

export function SInput({ icon: Icon, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ComponentType<{ size?: number; className?: string }> }) {
  if (!Icon) return <input {...props} className={`${inputClass} ${className}`} />;
  return (
    <div className="relative">
      <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input {...props} className={`${inputClass} pl-10 ${className}`} />
    </div>
  );
}

export function SSelect({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} pr-8 ${className}`}>{children}</select>;
}

export function STextarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full px-3.5 py-2.5 rounded-lg border border-[#e2e8f0] bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-600 focus:ring-4 focus:ring-blue-50 ${className}`} />;
}

/* ── Interrupteur avec libellé ── */
export function SToggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return (
    <label className={`flex items-start justify-between gap-4 py-3 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {description && <span className="block text-xs text-slate-500 mt-0.5">{description}</span>}
      </span>
      <span className="relative shrink-0 mt-0.5">
        <input type="checkbox" className="sr-only peer" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span className="block w-10 h-6 rounded-full bg-slate-300 peer-checked:bg-blue-600 transition-colors" />
        <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

/* ── Boutons ── */
type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 border border-transparent',
  secondary: 'bg-white text-slate-700 hover:bg-slate-50 border border-[#e2e8f0]',
  danger: 'bg-white text-rose-600 hover:bg-rose-50 border border-rose-200',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 border border-transparent',
};
export function SButton({ variant = 'secondary', icon: Icon, loading, children, className = '', type = 'button', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; icon?: React.ComponentType<{ size?: number; className?: string }>; loading?: boolean }) {
  return (
    <button type={type} {...props} disabled={props.disabled || loading} className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 whitespace-nowrap ${BTN[variant]} ${className}`}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}

export function SIconButton({ title, tone = 'slate', className = '', children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { title: string; tone?: 'slate' | 'blue' | 'rose' | 'emerald' }) {
  const t = { slate: 'text-slate-400 hover:text-slate-700 hover:bg-slate-100', blue: 'text-blue-600 hover:bg-blue-50', rose: 'text-slate-400 hover:text-rose-600 hover:bg-rose-50', emerald: 'text-emerald-600 hover:bg-emerald-50' }[tone];
  return <button type="button" title={title} aria-label={title} {...props} className={`w-9 h-9 inline-flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${t} ${className}`}>{children}</button>;
}

/* ── Alerte / message ── */
export function SAlert({ type = 'info', children, className = '' }: { type?: 'success' | 'error' | 'info' | 'warning'; children: React.ReactNode; className?: string }) {
  const s = {
    success: ['bg-emerald-50 text-emerald-800 border-emerald-200', CheckCircle2],
    error: ['bg-rose-50 text-rose-800 border-rose-200', AlertCircle],
    info: ['bg-blue-50 text-blue-800 border-blue-200', Info],
    warning: ['bg-amber-50 text-amber-800 border-amber-200', AlertCircle],
  }[type] as [string, React.ComponentType<{ size?: number; className?: string }>];
  const I = s[1];
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${s[0]} ${className}`}>
      <I size={18} className="shrink-0 mt-0.5" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ── Pastille ── */
const TONES: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
};
export function SBadge({ tone = 'slate', dot, children }: { tone?: keyof typeof TONES | string; dot?: boolean; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${TONES[tone] || TONES.slate}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* ── Barre d'enregistrement (formulaires) : message à gauche, action à droite ── */
export function SSaveBar({ saving, message, label = 'Enregistrer les modifications' }: { saving?: boolean; message?: { type: 'success' | 'error'; text: string } | null; label?: string }) {
  return (
    <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e2e8f0] bg-white/95 backdrop-blur px-5 py-3 shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
      <div className="min-w-0 text-sm">
        {message ? (
          <span className={`inline-flex items-center gap-2 font-medium ${message.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </span>
        ) : (
          <span className="text-slate-500">Les modifications ne sont appliquées qu&apos;après enregistrement.</span>
        )}
      </div>
      <SButton type="submit" variant="primary" icon={Save} loading={saving}>{label}</SButton>
    </div>
  );
}

/* ── Tableau : styles communs ── */
export const tableWrap = 'overflow-x-auto';
export const tableClass = 'w-full text-sm';
export const thClass = 'px-6 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 bg-slate-50 border-b border-[#e2e8f0] whitespace-nowrap';
export const tdClass = 'px-6 py-3.5 text-sm text-slate-700 border-b border-slate-100 align-middle';

export function SEmpty({ icon: Icon, children }: { icon?: React.ComponentType<{ size?: number; className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
      {Icon && <Icon size={28} />}
      <p className="text-sm font-medium">{children}</p>
    </div>
  );
}

export function SLoading({ children = 'Chargement…' }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-500">
      <Loader2 size={24} className="animate-spin text-blue-600" />
      <p className="text-sm">{children}</p>
    </div>
  );
}

/* ── Fenêtre modale : même cadre pour toutes les saisies (en-tête, corps défilant, pied d'actions) ── */
export function SModal({ title, description, icon: Icon, onClose, footer, children, size = 'md' }: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const w = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size];
  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white w-full ${w} rounded-2xl border border-[#e2e8f0] shadow-[0_12px_32px_rgba(15,23,42,0.12)] flex flex-col max-h-[90vh]`}>
        <header className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#e2e8f0]">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Icon size={20} /></span>}
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 leading-tight">{title}</h3>
              {description && <p className="text-[13px] text-slate-500 mt-0.5">{description}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" title="Fermer" className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X size={18} />
          </button>
        </header>
        <div className="p-6 overflow-y-auto flex-1 space-y-5">{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 px-6 py-4 border-t border-[#e2e8f0] bg-slate-50/60 rounded-b-2xl">{footer}</footer>}
      </div>
    </div>
  );
}
