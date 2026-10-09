"use client";

import React, { useEffect, useState } from 'react';
import { MapPin, Pencil, Check, X, Undo2, Loader2 } from 'lucide-react';

interface Props {
  adresseDossier?: string | null; // adresse propre au dossier de l'année (Occupation.adresse)
  adresseTiers?: string | null;
  readOnly?: boolean;
  onSave: (adresse: string) => Promise<void>;
}

// « À renseigner » est la valeur de repli posée par la reconduction quand aucune adresse n'est connue.
const vide = (a?: string | null) => !a || !a.trim() || a.trim() === 'À renseigner';
const norm = (a?: string | null) => (a || '').replace(/\s+/g, ' ').trim().toLowerCase();

// Adresse du dossier TLPE : par défaut celle du tiers ; modifiable quand l'établissement est ailleurs (backlog #46).
export default function TlpeAdresseDossier({ adresseDossier, adresseTiers, readOnly, onSave }: Props) {
  const effective = vide(adresseDossier) ? (adresseTiers || '') : (adresseDossier as string);
  const differente = !vide(adresseDossier) && norm(adresseDossier) !== norm(adresseTiers);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(effective);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!editing) setValue(effective); }, [effective, editing]);

  const save = async (next: string) => {
    setSaving(true);
    try {
      await onSave(next.trim());
      setEditing(false);
    } catch {
      alert("Erreur lors de l'enregistrement de l'adresse");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <MapPin size={16} className="text-purple-600" />
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Adresse du dossier</h3>
        {differente && (
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">Différente de l&apos;adresse du tiers</span>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) save(value); if (e.key === 'Escape') setEditing(false); }}
            placeholder="Adresse de l'établissement"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-purple-500"
          />
          <div className="flex gap-2">
            <button disabled={saving || !value.trim()} onClick={() => save(value)} className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Enregistrer
            </button>
            <button disabled={saving} onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold">
              <X size={14} /> Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-700">{effective || <span className="text-slate-400 italic">Aucune adresse renseignée</span>}</p>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white rounded-xl text-xs font-bold transition-colors">
                <Pencil size={14} /> Modifier
              </button>
              {differente && adresseTiers && (
                <button disabled={saving} onClick={() => save(adresseTiers)} className="flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold" title="Reprendre l'adresse du tiers">
                  <Undo2 size={14} /> Adresse du tiers
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {differente && !editing && adresseTiers && (
        <p className="text-xs text-slate-400">Adresse du tiers : {adresseTiers}</p>
      )}
    </div>
  );
}
