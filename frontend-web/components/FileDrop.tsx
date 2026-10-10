"use client";

import React, { useRef, useState } from 'react';

const MAX = 10 * 1024 * 1024;
const EXT = ['pdf', 'png', 'jpg', 'jpeg'];

const taille = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} Mo` : `${Math.max(1, Math.round(n / 1024))} Ko`);
const extDe = (f: File) => (f.name.split('.').pop() || '').toLowerCase();

// Zone de dépôt de fichiers : glisser-déposer ou bouton, contrôle du format / de la taille, liste avec suppression.
export default function FileDrop({ label, requis, hint, multiple, files, onChange }: {
  label: string; requis?: boolean; hint?: string; multiple?: boolean; files: File[]; onChange: (f: File[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [survol, setSurvol] = useState(false);
  const [erreur, setErreur] = useState('');

  const ajouter = (liste: FileList | File[]) => {
    const ok: File[] = []; const ko: string[] = [];
    for (const f of Array.from(liste)) {
      if (!EXT.includes(extDe(f))) ko.push(`${f.name} : format non accepté (PDF, PNG ou JPG)`);
      else if (f.size > MAX) ko.push(`${f.name} : fichier trop volumineux (10 Mo max)`);
      else ok.push(f);
    }
    setErreur(ko.join(' · '));
    if (ok.length) onChange(multiple ? [...files, ...ok] : [ok[0]]);
  };

  return (
    <div>
      <label className="f">{label}{requis && <span className="req"> *</span>}</label>
      <div
        className={`drop${survol ? ' over' : ''}${files.length ? ' filled' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setSurvol(true); }}
        onDragLeave={() => setSurvol(false)}
        onDrop={(e) => { e.preventDefault(); setSurvol(false); if (e.dataTransfer.files.length) ajouter(e.dataTransfer.files); }}
      >
        <input ref={input} type="file" hidden multiple={multiple} accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => { if (e.target.files) ajouter(e.target.files); e.target.value = ''; }} />
        {files.length === 0 ? (
          <div className="drop-empty">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4m0 0l-4 4m4-4l4 4" /><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" /></svg>
            <span>Glissez {multiple ? 'vos fichiers' : 'votre fichier'} ici ou</span>
            <button type="button" className="btn ghost" onClick={() => input.current?.click()}>Parcourir…</button>
          </div>
        ) : (
          <ul className="drop-list">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`}>
                <span className={`badge ${extDe(f) === 'pdf' ? 'pdf' : 'img'}`}>{extDe(f).toUpperCase()}</span>
                <span className="nom">{f.name}</span>
                <span className="muted">{taille(f.size)}</span>
                <button type="button" className="x" aria-label={`Retirer ${f.name}`} onClick={() => onChange(files.filter((_, k) => k !== i))}>×</button>
              </li>
            ))}
            <li className="add">
              <button type="button" className="btn ghost" onClick={() => input.current?.click()}>{multiple ? '+ Ajouter un fichier' : 'Remplacer le fichier'}</button>
            </li>
          </ul>
        )}
      </div>
      {hint && !erreur && <div className="hint">{hint}</div>}
      {erreur && <div className="hint" style={{ color: 'var(--danger)' }}>{erreur}</div>}
    </div>
  );
}
