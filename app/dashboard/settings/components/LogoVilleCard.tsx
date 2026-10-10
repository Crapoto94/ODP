"use client";

import React, { useRef, useState } from 'react';
import axios from 'axios';
import { ImagePlus, Trash2, Loader2 } from 'lucide-react';
import CityLogo from '@/components/CityLogo';

// Téléversement du logo de la ville, affiché en haut à gauche de l'application.
export default function LogoVilleCard() {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const envoyer = async (file: File) => {
    setBusy(true); setMsg(null);
    try {
      const fd = new FormData(); fd.append('file', file);
      await axios.post('/api/branding/logo', fd);
      setMsg({ ok: true, text: 'Logo mis à jour.' });
      setTimeout(() => window.location.reload(), 600);
    } catch (e: any) {
      setMsg({ ok: false, text: e.response?.data?.error || e.message });
    } finally { setBusy(false); }
  };
  const retirer = async () => {
    setBusy(true);
    try { await axios.delete('/api/branding/logo'); setTimeout(() => window.location.reload(), 300); } finally { setBusy(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 flex flex-wrap items-center gap-5 max-w-5xl">
      <div className="w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
        <CityLogo className="w-full h-full object-contain" />
      </div>
      <div className="flex-1 min-w-[240px]">
        <h3 className="text-sm font-bold text-slate-900">Logo de la ville</h3>
        <p className="text-xs text-slate-500 mt-0.5">Affiché en haut à gauche de l&apos;application. PNG, JPG, SVG ou WebP — 2 Mo maximum, de préférence carré.</p>
        {msg && <p className={`text-xs font-semibold mt-1 ${msg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{msg.text}</p>}
      </div>
      <input ref={input} type="file" accept=".png,.jpg,.jpeg,.svg,.webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) envoyer(f); e.target.value = ''; }} />
      <div className="flex items-center gap-2">
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />} Téléverser
        </button>
        <button type="button" disabled={busy} onClick={retirer} title="Revenir au logo par défaut" className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button>
      </div>
    </div>
  );
}
