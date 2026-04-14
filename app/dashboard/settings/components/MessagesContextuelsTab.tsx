"use client";
import React, { useState, useEffect } from 'react';
import { Mail, Save, Loader2, Search, ChevronRight, Eye, Code2, Trash2, BellOff, Bell } from 'lucide-react';
import { CONTEXTUAL_MESSAGE_DEFS } from '@/lib/contextual-messages';

interface DbMessage {
  cle: string;
  label: string | null;
  sujet: string | null;
  valeur: string;
  disabled: boolean;
}

export default function MessagesContextuelsTab() {
  const [dbMessages, setDbMessages] = useState<Record<string, DbMessage>>({});
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string>(Object.keys(CONTEXTUAL_MESSAGE_DEFS)[0]);
  const [localVal, setLocalVal] = useState('');
  const [localLabel, setLocalLabel] = useState('');
  const [localSubject, setLocalSubject] = useState('');
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/settings/messages');
      if (res.ok) {
        const data: DbMessage[] = await res.json();
        const map: Record<string, DbMessage> = {};
        for (const row of data) map[row.cle] = row;
        setDbMessages(map);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  // Sync editor when selection changes
  useEffect(() => {
    if (selectedKey) {
      const db = dbMessages[selectedKey];
      setLocalVal(db?.valeur ?? CONTEXTUAL_MESSAGE_DEFS[selectedKey]?.default ?? '');
      setLocalLabel(db?.label ?? CONTEXTUAL_MESSAGE_DEFS[selectedKey]?.label ?? '');
      setLocalSubject(db?.sujet ?? CONTEXTUAL_MESSAGE_DEFS[selectedKey]?.defaultSubject ?? '');
      setPreview(false);
    }
  }, [selectedKey, dbMessages]);

  const filteredKeys = Object.keys(CONTEXTUAL_MESSAGE_DEFS).filter(k =>
    k.toLowerCase().includes(search.toLowerCase()) ||
    (dbMessages[k]?.label ?? CONTEXTUAL_MESSAGE_DEFS[k].label).toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!selectedKey) return;
    setIsSaving(true);
    try {
      const db = dbMessages[selectedKey];
      const labelToSave = localLabel !== CONTEXTUAL_MESSAGE_DEFS[selectedKey]?.label ? localLabel : null;
      const subjectToSave = localSubject !== CONTEXTUAL_MESSAGE_DEFS[selectedKey]?.defaultSubject ? localSubject : null;
      await fetch('/api/settings/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cle: selectedKey,
          valeur: localVal,
          label: labelToSave,
          sujet: subjectToSave,
          disabled: db?.disabled ?? false,
        }),
      });
      await fetchMessages();
      setSavedKey(selectedKey);
      setTimeout(() => setSavedKey(null), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDisabled = async () => {
    if (!selectedKey) return;
    const db = dbMessages[selectedKey];
    const newDisabled = !(db?.disabled ?? false);
    const currentVal = localVal;
    const labelToSave = localLabel !== CONTEXTUAL_MESSAGE_DEFS[selectedKey]?.label ? localLabel : null;
    const subjectToSave = localSubject !== CONTEXTUAL_MESSAGE_DEFS[selectedKey]?.defaultSubject ? localSubject : null;

    await fetch('/api/settings/messages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cle: selectedKey,
        valeur: currentVal,
        label: labelToSave,
        sujet: subjectToSave,
        disabled: newDisabled,
      }),
    });
    await fetchMessages();
  };

  const handleReset = async () => {
    if (!selectedKey) return;
    if (!confirm('Remettre le message par défaut ? Vos modifications seront perdues.')) return;
    await fetch(`/api/settings/messages?cle=${selectedKey}`, { method: 'DELETE' });
    await fetchMessages();
  };

  const info = selectedKey ? CONTEXTUAL_MESSAGE_DEFS[selectedKey] : null;
  const db = selectedKey ? dbMessages[selectedKey] : null;
  const isInDb = selectedKey in dbMessages;
  const isDisabled = db?.disabled ?? false;

  const originalVal = db?.valeur ?? CONTEXTUAL_MESSAGE_DEFS[selectedKey]?.default ?? '';
  const originalLabel = db?.label ?? CONTEXTUAL_MESSAGE_DEFS[selectedKey]?.label ?? '';
  const originalSubject = db?.sujet ?? CONTEXTUAL_MESSAGE_DEFS[selectedKey]?.defaultSubject ?? '';
  const hasChanged = localVal !== originalVal || localLabel !== originalLabel || localSubject !== originalSubject;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-slate-400">
        <Loader2 className="animate-spin" size={24} />
        <span className="text-[10px] font-black uppercase tracking-widest">Chargement des messages...</span>
      </div>
    );
  }

  return (
    <div className="flex h-[720px] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-100/80">
      {/* ── Sidebar ── */}
      <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 bg-white space-y-3">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-blue-600" />
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Modèles d'emails</h3>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold outline-none focus:border-blue-400 focus:bg-white transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredKeys.map(key => {
            const active = selectedKey === key;
            const dbMsg = dbMessages[key];
            const displayLabel = dbMsg?.label ?? CONTEXTUAL_MESSAGE_DEFS[key].label;
            const msgDisabled = dbMsg?.disabled ?? false;
            return (
              <button
                key={key}
                onClick={() => setSelectedKey(key)}
                className={`w-full text-left px-4 py-3 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-2 ${
                  active
                    ? 'bg-white border-blue-200 shadow-md shadow-blue-500/5'
                    : 'border-transparent hover:bg-white hover:border-slate-200'
                }`}
              >
                <div className="space-y-1 overflow-hidden min-w-0">
                  <div className={`text-[11px] font-black leading-tight truncate ${active ? 'text-blue-600' : msgDisabled ? 'text-slate-400' : 'text-slate-700'}`}>
                    {displayLabel}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider truncate">{key}</span>
                    {key in dbMessages && !msgDisabled && (
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400" title="Personnalisé" />
                    )}
                    {msgDisabled && (
                      <span className="shrink-0 px-1 py-0.5 rounded bg-slate-200 text-[7px] font-black text-slate-400 uppercase tracking-wider">Désactivé</span>
                    )}
                  </div>
                </div>
                {active && <ChevronRight size={13} className="text-blue-400 shrink-0" />}
              </button>
            );
          })}

          {filteredKeys.length === 0 && (
            <div className="py-12 text-center opacity-40">
              <Search size={20} className="mx-auto mb-2 text-slate-300" />
              <p className="text-[10px] font-black uppercase text-slate-400">Aucun résultat</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Panneau principal ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedKey && info ? (
          <>
            {/* Header */}
            <div className={`px-6 py-4 border-b border-slate-100 flex flex-col gap-3 shrink-0 ${isDisabled ? 'bg-slate-100/60' : 'bg-slate-50/40'}`}>
              {/* Title row */}
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Message contextuel</span>
                  <input
                    type="text"
                    value={localLabel}
                    onChange={e => setLocalLabel(e.target.value)}
                    className="block w-full text-lg font-black text-slate-900 leading-tight bg-transparent border-b-2 border-transparent hover:border-slate-200 focus:border-blue-400 outline-none transition-all mt-0.5 pb-0.5"
                    placeholder="Titre du message..."
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">{info.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Toggle désactivé */}
                  <button
                    onClick={handleToggleDisabled}
                    title={isDisabled ? 'Réactiver ce message' : 'Désactiver ce message (ne sera pas envoyé)'}
                    className={`h-9 px-3 rounded-xl border flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                      isDisabled
                        ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {isDisabled ? <BellOff size={13} /> : <Bell size={13} />}
                    {isDisabled ? 'Désactivé' : 'Actif'}
                  </button>

                  {/* Reset */}
                  {isInDb && (
                    <button
                      onClick={handleReset}
                      title="Supprimer la personnalisation et revenir au défaut"
                      className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  {/* Preview toggle */}
                  <button
                    onClick={() => setPreview(p => !p)}
                    disabled={isDisabled}
                    className={`h-9 px-3 rounded-xl border flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 ${
                      preview
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {preview ? <Code2 size={13} /> : <Eye size={13} />}
                    {preview ? 'Code' : 'Aperçu'}
                  </button>

                  {/* Save */}
                  <button
                    onClick={handleSave}
                    disabled={!hasChanged || isSaving || isDisabled}
                    className={`h-9 px-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 shadow-sm ${
                      savedKey === selectedKey
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-900 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {isSaving
                      ? <Loader2 size={13} className="animate-spin" />
                      : savedKey === selectedKey
                      ? <span>✓</span>
                      : <Save size={13} />
                    }
                    {savedKey === selectedKey ? 'Enregistré' : 'Enregistrer'}
                  </button>
                </div>
              </div>

              {isDisabled && (
                <div className="px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-black text-rose-600 uppercase tracking-widest">
                  Ce message est désactivé — il ne sera pas envoyé
                </div>
              )}
            </div>

            {/* Corps */}
            <div className={`flex-1 flex flex-col overflow-hidden p-6 gap-4 ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Objet du mail */}
              <div className="shrink-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Objet du mail</p>
                <input
                  type="text"
                  value={localSubject}
                  onChange={e => setLocalSubject(e.target.value)}
                  placeholder={CONTEXTUAL_MESSAGE_DEFS[selectedKey]?.defaultSubject || 'Objet du mail...'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition-all"
                />
              </div>

              {/* Variables */}
              <div className="shrink-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Variables disponibles</p>
                <div className="flex flex-wrap gap-1.5">
                  {info.vars.map(v => (
                    <button
                      key={v}
                      onClick={() => setLocalVal(prev => prev + ' ' + v)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-[10px] font-mono font-bold text-slate-600 hover:text-blue-600 transition-all"
                      title={`Insérer ${v}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Éditeur / Aperçu */}
              <div className="flex-1 rounded-2xl border border-slate-200 overflow-hidden">
                {preview ? (
                  <iframe
                    srcDoc={localVal}
                    className="w-full h-full bg-white"
                    title="Aperçu du message"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <textarea
                    className="w-full h-full p-4 font-mono text-xs text-slate-800 bg-slate-50 resize-none outline-none focus:bg-white transition-colors leading-relaxed"
                    value={localVal}
                    onChange={e => setLocalVal(e.target.value)}
                    spellCheck={false}
                    placeholder="Saisissez le HTML du message..."
                  />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <Mail size={48} className="mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Sélectionnez un message</p>
          </div>
        )}
      </div>
    </div>
  );
}
