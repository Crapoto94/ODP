"use client";
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FormSectionProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  accentColor?: string;
  className?: string;
}

export default function FormSection({ icon: Icon, title, children, accentColor = 'blue', className = '' }: FormSectionProps) {
  const accentColors: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  };

  const colors = accentColors[accentColor] || accentColors.blue;

  return (
    <div className={`space-y-6 pb-8 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 ${colors.bg} rounded-lg flex items-center justify-center`}>
          <Icon size={16} className={colors.text} />
        </div>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
