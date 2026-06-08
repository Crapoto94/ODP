"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Loader2, RotateCcw, ShieldCheck, Info } from 'lucide-react';
import { ROLE_LABELS, ROLE_COLORS, type Role, type Permission } from '@/lib/permissions';

interface PermissionsMap { [role: string]: Permission[] }

const PERMISSION_LABELS: Record<Permission, string> = {
  CREATE_DOSSIER:   'Création dossier / dispositif / tiers',
  MODIFY_DOSSIER:   'Modification / suppression dossier',
  MANAGE_TARIFS:    'Saisie des tarifs et reconductions',
  GENERATE_AOT:     'Génération AOT et mise en signature',
  MANAGE_TRAMES:    'Création et modification des trames',
  SEND_EMAILS:      'Envoi mails et factures',
  SEND_FILIEN:      'Envoi du filien',
  CONTROLE_TERRAIN: 'Contrôle terrain',
  MANAGE_USERS:     'Attribution des droits',
};

const PERMISSION_LETTERS: Record<Permission, string> = {
  CREATE_DOSSIER:   'B',
  MODIFY_DOSSIER:   'C',
  MANAGE_TARIFS:    'D',
  GENERATE_AOT:     'E',
  MANAGE_TRAMES:    'F',
  SEND_EMAILS:      'G',
  SEND_FILIEN:      'H',
  CONTROLE_TERRAIN: 'I',
  MANAGE_USERS:     'J',
};

export default function RolesTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<PermissionsMap>({});
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [original, setOriginal] = useState<PermissionsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get('/api/settings/permissions')
      .then(res => {
        setRoles(res.data.roles);
        setAllPermissions(res.data.allPermissions);
        setPermissions(res.data.permissions);
        setOriginal(res.data.permissions);
      })
      .catch(() => setError('Impossible de charger les permissions'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (role: string, perm: Permission) => {
    setPermissions(prev => {
      const current = prev[role] ?? [];
      const next = current.includes(perm)
        ? current.filter(p => p !== perm)
        : [...current, perm];
      return { ...prev, [role]: next };
    });
    setSaved(false);
    setError(null);
  };

  const hasChanged = JSON.stringify(permissions) !== JSON.stringify(original);

  const handleReset = () => {
    setPermissions(original);
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await axios.patch('/api/settings/permissions', { permissions });
      setOriginal(permissions);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium">
        <Info size={14} className="shrink-0 mt-0.5 text-blue-400" />
        <span>Les modifications prennent effet immédiatement pour les vérifications serveur. Les éléments d'interface (sidebar, boutons) se mettent à jour après rafraîchissement de la page.</span>
      </div>

      {/* Matrice */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-48 bg-slate-50/50">
                  Rôle
                </th>
                {allPermissions.map(perm => (
                  <th key={perm} className="px-3 py-4 bg-slate-50/50 min-w-[80px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-600 text-[10px] font-black flex items-center justify-center">
                        {PERMISSION_LETTERS[perm]}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide leading-tight text-center max-w-[72px]">
                        {PERMISSION_LABELS[perm]}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((role, ri) => {
                const rolePerms = permissions[role] ?? [];
                return (
                  <tr
                    key={role}
                    className={`border-b border-slate-50 transition-colors hover:bg-slate-50/50 ${ri % 2 === 0 ? '' : 'bg-slate-50/20'}`}
                  >
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${ROLE_COLORS[role as Role] ?? 'bg-slate-100 text-slate-600'}`}>
                        <ShieldCheck size={10} />
                        {ROLE_LABELS[role as Role] ?? role}
                      </span>
                    </td>
                    {allPermissions.map(perm => {
                      const checked = rolePerms.includes(perm);
                      const isAdmin = role === 'ADMINISTRATEUR' && perm === 'MANAGE_USERS';
                      return (
                        <td key={perm} className="px-3 py-4 text-center">
                          <button
                            onClick={() => toggle(role, perm)}
                            title={checked ? 'Retirer ce droit' : 'Accorder ce droit'}
                            className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center mx-auto transition-all ${
                              checked
                                ? isAdmin
                                  ? 'bg-indigo-600 border-indigo-600 text-white cursor-default'
                                  : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-500 hover:border-blue-500'
                                : 'border-slate-200 text-transparent hover:border-slate-400'
                            }`}
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleReset}
          disabled={!hasChanged || saving}
          className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-30"
        >
          <RotateCcw size={14} />
          Annuler les modifications
        </button>

        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest animate-in fade-in duration-200">
              ✓ Enregistré
            </span>
          )}
          {error && (
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">
              {error}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanged || saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-40"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
