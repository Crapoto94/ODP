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

export default function VersionHeader() {
  const [version, setVersion] = useState("0.1.0");

  useEffect(() => {
    axios.get('/api/releases').then(res => {
      if (res.data.length > 0) {
        setVersion(res.data[0].versionNumber);
      }
    });
  }, []);

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
      
      <div className="flex items-center gap-4">
         {/* Quick status dots or similar can go here */}
      </div>
    </div>
  );
}
