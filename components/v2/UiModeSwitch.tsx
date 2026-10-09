"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { Sparkles, Loader2 } from 'lucide-react';
import { useUiMode } from '@/components/UiModeProvider';

// Interrupteur « Nouvelle interface » : disponible pour tous les profils, dans l'ancienne comme dans la nouvelle interface.
export default function UiModeSwitch({ collapsed = false, tone = 'dark' }: { collapsed?: boolean; tone?: 'dark' }) {
  const mode = useUiMode();
  const [busy, setBusy] = useState(false);
  const on = mode === 'v2';

  const toggle = async () => {
    setBusy(true);
    try {
      await axios.post('/api/settings/ui-mode', { mode: on ? 'classic' : 'v2' });
      window.location.reload();
    } catch (e) {
      console.error(e);
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={on ? "Revenir à l'ancienne interface" : 'Essayer la nouvelle interface'}
      className={`flex items-center gap-3 w-full h-11 rounded-xl text-xs font-semibold transition-colors text-slate-300 hover:bg-slate-800 hover:text-white ${collapsed ? 'justify-center' : 'px-3'}`}
    >
      {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className={on ? 'text-blue-400' : 'text-slate-400'} />}
      {!collapsed && (
        <span className="flex flex-1 items-center justify-between">
          <span>Nouvelle interface</span>
          <span className={`w-9 h-5 rounded-full relative transition-colors ${on ? 'bg-blue-600' : 'bg-slate-700'}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
          </span>
        </span>
      )}
    </button>
  );
}
