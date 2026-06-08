"use client";
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Users as UsersIcon, Plus, Trash2, Edit2, Loader2,
  ShieldCheck, UserCircle, Search, X, Save, User as UserIcon,
  Mail, Shield, Key, Building2, CheckCircle2, AlertCircle
} from 'lucide-react';
import TabHeader from './TabHeader';
import { ROLE_LABELS, ROLE_COLORS, type Role } from '@/lib/permissions';

// ─── Types ───────────────────────────────────────────────────────────────────

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  login: string;
  role: string;
  isAd: boolean;
  created_at: string;
}

interface AdCandidate {
  sam_account: string;
  display_name: string;
  mail?: string;
}

const EMPTY_FORM = { nom: '', prenom: '', email: '', login: '', password: '', role: 'SAISIE', isAd: false };

// ─── Composant principal ──────────────────────────────────────────────────────

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal édition manuelle
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal recherche AD
  const [showAdModal, setShowAdModal] = useState(false);
  const [adQuery, setAdQuery] = useState('');
  const [adResults, setAdResults] = useState<AdCandidate[]>([]);
  const [adSearching, setAdSearching] = useState(false);
  const [adSearchError, setAdSearchError] = useState<string | null>(null);
  const [adSelected, setAdSelected] = useState<AdCandidate | null>(null);
  const [adRole, setAdRole] = useState('SAISIE');
  const [adSaving, setAdSaving] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);

  // ── Fetch users ──
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Recherche AD avec debounce ──
  useEffect(() => {
    if (adQuery.length < 2) { setAdResults([]); return; }
    const t = setTimeout(async () => {
      setAdSearching(true);
      setAdSearchError(null);
      try {
        const res = await axios.get('/api/ad/search', { params: { q: adQuery } });
        setAdResults(res.data);
        if (res.data.length === 0) setAdSearchError('Aucun compte trouvé.');
      } catch {
        setAdSearchError('Erreur de connexion à l\'AD (API indisponible ?)');
        setAdResults([]);
      } finally { setAdSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [adQuery]);

  // ── Ouvrir modal manuelle ──
  const openModal = (user?: User) => {
    setEditingUser(user || null);
    setForm(user
      ? { nom: user.nom, prenom: user.prenom, email: user.email, login: user.login, password: '', role: user.role, isAd: user.isAd }
      : { ...EMPTY_FORM }
    );
    setFormError(null);
    setShowModal(true);
  };

  // ── Sauvegarder (création/édition manuelle) ──
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editingUser) {
        await axios.patch(`/api/users/${editingUser.id}`, form);
      } else {
        await axios.post('/api/users', form);
      }
      setShowModal(false);
      await fetchUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally { setSaving(false); }
  };

  // ── Ajouter depuis AD ──
  const handleAddFromAd = async () => {
    if (!adSelected) return;
    setAdSaving(true);
    setAdError(null);
    // Décompose display_name "PRENOM NOM" ou "NOM Prénom" -> on sépare au premier espace
    const parts = (adSelected.display_name || '').trim().split(/\s+/);
    const prenom = parts[0] || '';
    const nom = parts.slice(1).join(' ') || adSelected.sam_account;
    try {
      await axios.post('/api/users', {
        nom,
        prenom,
        email: adSelected.mail || '',
        login: adSelected.sam_account,
        password: '',   // sentinel côté server
        role: adRole,
        isAd: true,
      });
      setShowAdModal(false);
      setAdQuery('');
      setAdSelected(null);
      setAdResults([]);
      await fetchUsers();
    } catch (err: any) {
      setAdError(err.response?.data?.error || 'Erreur lors de la création (login déjà existant ?)');
    } finally { setAdSaving(false); }
  };

  // ── Supprimer ──
  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      await axios.delete(`/api/users/${id}`);
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  // ── Réinitialiser modal AD ──
  const closeAdModal = () => {
    setShowAdModal(false);
    setAdQuery('');
    setAdResults([]);
    setAdSelected(null);
    setAdError(null);
    setAdSearchError(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <TabHeader
        icon={UsersIcon}
        title="Comptes Utilisateurs"
        subtitle="Gestion des accès et des rôles"
        accentColor="blue"
        action={{
          label: 'Ajouter manuellement',
          icon: Plus,
          onClick: () => openModal(),
          variant: 'primary'
        }}
      />

      {/* Bouton AD séparé */}
      <div className="flex justify-end -mt-4">
        <button
          onClick={() => setShowAdModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
        >
          <Building2 size={14} />
          Ajouter depuis l'AD
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px] gap-4">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Chargement des comptes...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] gap-4 opacity-30">
            <UsersIcon size={48} className="text-slate-300" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucun utilisateur enregistré</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilisateur</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identifiant</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rôle</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Auth</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-inner ${
                        user.isAd ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {user.nom?.[0]}{user.prenom?.[0]}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm leading-none">{user.prenom} {user.nom}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">{user.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">{user.login}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit ${
                      ROLE_COLORS[user.role as Role] ?? 'bg-slate-100 text-slate-600'
                    }`}>
                      {user.role === 'ADMINISTRATEUR' ? <ShieldCheck size={10} /> : <UserCircle size={10} />}
                      {ROLE_LABELS[user.role as Role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    {user.isAd ? (
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit">
                        <Building2 size={9} /> AD
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit">
                        <Key size={9} /> Local
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal(user)} className="p-2.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal édition manuelle ── */}
      {showModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserIcon size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Configuration du compte</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
                  <AlertCircle size={14} /> {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prénom</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                    value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                    value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-50">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Login</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-blue-500 transition-all font-bold text-sm"
                      value={form.login} onChange={e => setForm({ ...form, login: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {editingUser ? 'Nouveau MDP' : 'Mot de passe'}
                    {form.isAd && <span className="ml-1 text-indigo-400">(ignoré — AD)</span>}
                  </label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="password" disabled={form.isAd} required={!editingUser && !form.isAd}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-blue-500 transition-all font-bold text-sm disabled:opacity-40"
                      placeholder={editingUser ? '••••••' : ''} value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rôle</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-blue-500 transition-all font-bold text-sm appearance-none"
                    value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="SAISIE">Saisie</option>
                    <option value="INSTRUCTEUR">Instructeur</option>
                    <option value="CONTROLEUR">Contrôleur</option>
                    <option value="ADMINISTRATEUR">Administrateur</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input type="checkbox" id="isAd" className="w-4 h-4 accent-indigo-600"
                  checked={form.isAd} onChange={e => setForm({ ...form, isAd: e.target.checked })} />
                <label htmlFor="isAd" className="text-xs font-black text-slate-700 cursor-pointer flex items-center gap-1.5">
                  <Building2 size={13} className="text-indigo-500" />
                  Authentification via Active Directory (AD)
                </label>
              </div>
              <div className="pt-4 flex flex-col gap-2">
                <button type="submit" disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {editingUser ? 'Mettre à jour' : 'Créer le compte'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="py-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal recherche AD ── */}
      {showAdModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={closeAdModal} />
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Ajouter depuis l'AD</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Rechercher un compte Active Directory</p>
                </div>
              </div>
              <button onClick={closeAdModal} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Barre de recherche */}
              {!adSelected && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    {adSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" size={14} />}
                    <input
                      autoFocus
                      type="text"
                      placeholder="Nom, prénom ou identifiant SAM..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-10 outline-none focus:border-indigo-400 focus:bg-white transition-all font-bold text-sm"
                      value={adQuery}
                      onChange={e => setAdQuery(e.target.value)}
                    />
                  </div>

                  {adSearchError && (
                    <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest">{adSearchError}</p>
                  )}

                  {adResults.length > 0 && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                      {adResults.map(u => (
                        <button
                          key={u.sam_account}
                          onClick={() => setAdSelected(u)}
                          className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">
                            {(u.display_name?.[0] || '?').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-900 text-sm truncate">{u.display_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold">
                              {u.sam_account}{u.mail ? ` · ${u.mail}` : ''}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {adQuery.length > 0 && adQuery.length < 2 && (
                    <p className="text-[10px] text-slate-400 text-center">Saisissez au moins 2 caractères</p>
                  )}
                </div>
              )}

              {/* Compte sélectionné → confirmation + rôle */}
              {adSelected && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-indigo-200 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0">
                      {(adSelected.display_name?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-indigo-900">{adSelected.display_name}</p>
                      <p className="text-[10px] text-indigo-600 font-bold">
                        {adSelected.sam_account}{adSelected.mail ? ` · ${adSelected.mail}` : ''}
                      </p>
                    </div>
                    <button onClick={() => setAdSelected(null)} className="text-indigo-400 hover:text-indigo-700 transition-colors">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rôle dans l'application</label>
                    <div className="relative">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-indigo-400 transition-all font-bold text-sm appearance-none"
                        value={adRole} onChange={e => setAdRole(e.target.value)}>
                        <option value="SAISIE">Saisie</option>
                        <option value="INSTRUCTEUR">Instructeur</option>
                        <option value="CONTROLEUR">Contrôleur</option>
                        <option value="ADMINISTRATEUR">Administrateur</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-500 font-bold">
                    <CheckCircle2 size={13} className="text-indigo-400 shrink-0" />
                    Ce compte utilisera ses identifiants AD pour se connecter. Aucun mot de passe local ne sera stocké.
                  </div>

                  {adError && (
                    <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
                      <AlertCircle size={13} /> {adError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {adSelected && (
              <div className="p-6 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={handleAddFromAd}
                  disabled={adSaving}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg"
                >
                  {adSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Ajouter ce compte AD
                </button>
                <button onClick={closeAdModal} className="py-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">Annuler</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
