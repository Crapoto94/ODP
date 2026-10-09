"use client";
import React, { useState, useEffect } from 'react';
import { Mail, Save, Loader2, Search, ChevronRight, Eye, Code2, Trash2, BellOff, Bell } from 'lucide-react';
import { CONTEXTUAL_MESSAGE_DEFS } from '@/lib/contextual-messages-defs';
import { useUiMode } from '@/components/UiModeProvider';
import { SField, SInput, SButton, SIconButton, SAlert, SBadge, SLoading } from '@/components/v2/settings/ui';

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

  const uiMode = useUiMode();

  if (uiMode === 'v2') {
    if (loading) return <SLoading>Chargement des messages…</SLoading>;
    return (
      <div className="flex flex-col lg:flex-row bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.05)] lg:h-[720px]">
        {/* Liste des modèles */}
        <aside className="lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-[#e2e8f0] bg-slate-50/60 flex flex-col max-h-72 lg:max-h-none">
          <div className="p-4 border-b border-[#e2e8f0] bg-white space-y-3">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Modèles d&apos;e-mails</h3>
              <span className="ml-auto text-xs text-slate-500 tabular-nums">{filteredKeys.length}</span>
            </div>
            <SInput icon={Search} type="text" placeholder="Rechercher un modèle…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <ul className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {filteredKeys.map((key) => {
              const active = selectedKey === key;
              const dbMsg = dbMessages[key];
              const label = dbMsg?.label ?? CONTEXTUAL_MESSAGE_DEFS[key].label;
              const off = dbMsg?.disabled ?? false;
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setSelectedKey(key)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between gap-2 transition-colors ${active ? 'bg-blue-600 text-white' : 'hover:bg-white text-slate-700'}`}
                  >
                    <span className="min-w-0">
                      <span className={`block text-[13px] font-semibold leading-tight truncate ${off && !active ? 'text-slate-400' : ''}`}>{label}</span>
                      <span className={`block text-[11px] font-mono truncate mt-0.5 ${active ? 'text-blue-100' : 'text-slate-400'}`}>{key}</span>
                    </span>
                    {off ? <span className={`shrink-0 text-[11px] font-semibold ${active ? 'text-blue-100' : 'text-slate-400'}`}>Désactivé</span>
                      : key in dbMessages ? <span className={`shrink-0 w-2 h-2 rounded-full ${active ? 'bg-white' : 'bg-emerald-500'}`} title="Personnalisé" /> : null}
                  </button>
                </li>
              );
            })}
            {filteredKeys.length === 0 && <li className="py-10 text-center text-sm text-slate-400">Aucun résultat</li>}
          </ul>
        </aside>

        {/* Éditeur */}
        <section className="flex-1 min-w-0 flex flex-col">
          {selectedKey && info ? (
            <>
              <header className="px-6 py-4 border-b border-[#e2e8f0] flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-blue-600">Message contextuel</p>
                  <SInput type="text" value={localLabel} onChange={(e) => setLocalLabel(e.target.value)} placeholder="Titre du message…" className="mt-1 text-base font-semibold" />
                  <p className="text-[13px] text-slate-500 mt-1">{info.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SButton icon={isDisabled ? BellOff : Bell} variant={isDisabled ? 'danger' : 'secondary'} onClick={handleToggleDisabled} title={isDisabled ? 'Réactiver ce message' : 'Désactiver ce message (il ne sera pas envoyé)'}>{isDisabled ? 'Désactivé' : 'Actif'}</SButton>
                  {isInDb && <SIconButton title="Revenir au modèle par défaut" tone="rose" onClick={handleReset}><Trash2 size={16} /></SIconButton>}
                  <SButton icon={preview ? Code2 : Eye} onClick={() => setPreview((v) => !v)} disabled={isDisabled}>{preview ? 'Code' : 'Aperçu'}</SButton>
                  <SButton variant="primary" icon={Save} loading={isSaving} disabled={!hasChanged || isDisabled} onClick={handleSave}>{savedKey === selectedKey ? 'Enregistré' : 'Enregistrer'}</SButton>
                </div>
              </header>

              {isDisabled && <div className="px-6 pt-4"><SAlert type="warning">Ce message est désactivé : il ne sera pas envoyé.</SAlert></div>}

              <div className={`flex-1 flex flex-col p-6 gap-4 min-h-0 ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <SField label="Objet du mail">
                  <SInput type="text" value={localSubject} onChange={(e) => setLocalSubject(e.target.value)} placeholder={CONTEXTUAL_MESSAGE_DEFS[selectedKey]?.defaultSubject || "Objet du mail…"} />
                </SField>
                <div>
                  <p className="text-[13px] font-semibold text-slate-700 mb-1.5">Variables disponibles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {info.vars.map((v) => (
                      <button key={v} type="button" onClick={() => setLocalVal((prev) => prev + ' ' + v)} title={`Insérer ${v}`} className="px-2.5 py-1 rounded-md border border-[#e2e8f0] bg-slate-50 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-xs font-mono text-slate-600 transition-colors">{v}</button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 min-h-[280px] rounded-xl border border-[#e2e8f0] overflow-hidden">
                  {preview ? (
                    <iframe srcDoc={localVal} className="w-full h-full min-h-[280px] bg-white" title="Aperçu du message" sandbox="allow-same-origin" />
                  ) : (
                    <textarea className="w-full h-full min-h-[280px] p-4 font-mono text-[13px] text-slate-800 bg-slate-50 resize-none outline-none focus:bg-white transition-colors leading-relaxed" value={localVal} onChange={(e) => setLocalVal(e.target.value)} spellCheck={false} placeholder="Saisissez le HTML du message…" />
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400 py-16">
              <Mail size={36} />
              <p className="text-sm">Sélectionnez un modèle</p>
            </div>
          )}
        </section>
      </div>
    );
  }

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
