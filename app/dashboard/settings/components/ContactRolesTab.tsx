"use client";
import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Save, Loader2, Mail, MailOff } from 'lucide-react';

interface ContactRole {
  id: number;
  nom: string;
  isSendAot: boolean;
  ordre: number;
}

export default function ContactRolesTab() {
  const [roles, setRoles] = useState<ContactRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNom, setNewNom] = useState('');
  const [newSendAot, setNewSendAot] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editNom, setEditNom] = useState('');
  const [editSendAot, setEditSendAot] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/contact-roles');
      if (res.ok) setRoles(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNom.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/settings/contact-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: newNom.trim(), isSendAot: newSendAot, ordre: roles.length + 1 }),
      });
      setNewNom('');
      setNewSendAot(false);
      await fetchRoles();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce type de contact ?')) return;
    await fetch(`/api/settings/contact-roles?id=${id}`, { method: 'DELETE' });
    await fetchRoles();
  };

  const startEdit = (r: ContactRole) => {
    setEditId(r.id);
    setEditNom(r.nom);
    setEditSendAot(r.isSendAot);
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      const current = roles.find(r => r.id === editId);
      await fetch('/api/settings/contact-roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, nom: editNom, isSendAot: editSendAot, ordre: current?.ordre ?? 0 }),
      });
      setEditId(null);
      await fetchRoles();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40 gap-3 text-slate-400">
      <Loader2 className="animate-spin" size={20} />
      <span className="text-[10px] font-black uppercase tracking-widest">Chargement...</span>
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <Users size={18} />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900">Types de contacts</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Rôles utilisés dans les dossiers</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-[10px] font-bold text-blue-700 flex items-center gap-2">
        <Mail size={13} />
        Les rôles marqués <strong>Reçoit AOT</strong> recevront l'email "Envoyer AOT au demandeur"
      </div>

      {/* Liste */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {roles.length === 0 ? (
          <div className="py-12 text-center text-slate-300">
            <Users size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-[10px] font-black uppercase tracking-widest">Aucun type de contact</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {roles.map(r => (
              <div key={r.id} className="flex items-center gap-4 px-6 py-4">
                {editId === r.id ? (
                  <>
                    <input
                      type="text"
                      value={editNom}
                      onChange={e => setEditNom(e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-400"
                      autoFocus
                    />
                    <button
                      onClick={() => setEditSendAot(v => !v)}
                      title={editSendAot ? 'Reçoit AOT — cliquer pour désactiver' : 'Ne reçoit pas AOT — cliquer pour activer'}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${editSendAot ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
                    >
                      {editSendAot ? <Mail size={14} /> : <MailOff size={14} />}
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="h-8 px-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all shrink-0"
                    >
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="h-8 px-3 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all shrink-0"
                    >
                      Annuler
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      className="flex-1 text-sm font-bold text-slate-800 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => startEdit(r)}
                    >
                      {r.nom}
                    </span>
                    {r.isSendAot && (
                      <span className="shrink-0 flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                        <Mail size={10} /> Reçoit AOT
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulaire d'ajout */}
      <form onSubmit={handleAdd} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nouveau type de contact</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={newNom}
            onChange={e => setNewNom(e.target.value)}
            placeholder="Ex: Responsable technique..."
            className="flex-1 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-400 transition-all"
          />
          <button
            type="button"
            onClick={() => setNewSendAot(v => !v)}
            title={newSendAot ? 'Reçoit AOT' : 'Ne reçoit pas AOT'}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all shrink-0 ${newSendAot ? 'bg-blue-100 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}
          >
            {newSendAot ? <Mail size={16} /> : <MailOff size={16} />}
          </button>
          <button
            type="submit"
            disabled={saving || !newNom.trim()}
            className="h-12 px-5 bg-slate-900 hover:bg-slate-700 disabled:opacity-40 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shrink-0"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Ajouter
          </button>
        </div>
        <p className="text-[9px] text-slate-400">
          Cliquez sur l'icône enveloppe pour activer/désactiver la réception de l'AOT pour ce rôle.
        </p>
      </form>
    </div>
  );
}
