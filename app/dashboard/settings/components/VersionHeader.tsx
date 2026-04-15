"use client";
import React, { useState, useEffect } from 'react';
import { History, X, CheckCircle2, Zap, Plus, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Release {
  versionNumber: string;
  notes: string;
  releasedAt: string;
  backlogItems: any[];
}

export default function VersionHeader({ compact = false }: { compact?: boolean }) {
  const [version, setVersion] = useState("...");

  useEffect(() => {
    Promise.all([
      axios.get('/api/releases').catch(() => ({ data: [] })),
      axios.get('/api/version').catch(() => ({ data: { version: "0.2.0" } })),
    ]).then(([releasesRes, versionRes]) => {
      if (releasesRes.data.length > 0) {
        setVersion(releasesRes.data[0].versionNumber);
      } else {
        setVersion(versionRes.data.version);
      }
    });
  }, []);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Paramètres</p>
        <span
          onClick={() => window.dispatchEvent(new CustomEvent('open-whatsnew'))}
          className="px-2 py-0.5 bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white rounded-md text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
        >
          v{version}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 group">
      <div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          Paramètres
          <span
            onClick={() => window.dispatchEvent(new CustomEvent('open-whatsnew'))}
            className="px-3 py-1 bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            v{version}
          </span>
        </h2>
        <p className="text-slate-500 font-medium tracking-wide text-lg mt-1">Configuration globale et outils système</p>
      </div>
      <div className="flex items-center gap-4" />
    </div>
  );
}
