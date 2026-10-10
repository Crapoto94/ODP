"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Clapperboard, CalendarOff, KeyRound, Plus, Trash2, RefreshCw, Copy } from 'lucide-react';
import { SCard, SGrid, SField, SInput, SSelect, STextarea, SToggle, SButton, SIconButton, SAlert, SSaveBar, SLoading, SBadge } from '@/components/v2/settings/ui';
import { premiereDatePossible, iso, type PeriodeAbsence } from '@/lib/tournage-regles';

// Administration de la gestion des tournages : délai d'instruction, type de jours, périodes de fermeture, clé d'accès du site public.
export default function TournagesTab() {
  const [cfg, setCfg] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copie, setCopie] = useState(false);

  const charger = () => axios.get('/api/tournages/config').then((r) => setCfg(r.data)).catch((e) => setMessage({ type: 'error', text: e.response?.data?.error || e.message }));
  useEffect(() => { charger(); }, []);

  if (!cfg) return message ? <SAlert type="error">{message.text}</SAlert> : <SLoading />;
  const set = (patch: any) => setCfg({ ...cfg, ...patch });
  const periodes: PeriodeAbsence[] = Array.isArray(cfg.periodesAbsence) ? cfg.periodesAbsence : [];
  const majPeriode = (i: number, patch: Partial<PeriodeAbsence>) => set({ periodesAbsence: periodes.map((p, k) => (k === i ? { ...p, ...patch } : p)) });

  const sauver = async (e?: React.FormEvent, extra: any = {}) => {
    e?.preventDefault();
    setSaving(true); setMessage(null);
    try {
      const r = await axios.patch('/api/tournages/config', { ...cfg, ...extra });
      setCfg(r.data);
      setMessage({ type: 'success', text: 'Paramètres de la gestion des tournages enregistrés.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message });
    } finally { setSaving(false); }
  };

  const apercu = premiereDatePossible(new Date(), {
    delaiInstruction: Number(cfg.delaiInstruction) || 0, typeJours: cfg.typeJours, exclureFeries: cfg.exclureFeries,
    delaiMinimalDepot: Number(cfg.delaiMinimalDepot) || 0, periodesAbsence: periodes,
  });

  return (
    <form onSubmit={sauver} className="space-y-6 max-w-5xl">
      <SCard icon={Clapperboard} title="Délai d'instruction" description="Règle appliquée automatiquement à la date des tournages sur le formulaire public : les dates trop proches sont bloquées."
        actions={<SBadge tone={cfg.actif ? 'emerald' : 'rose'} dot>{cfg.actif ? 'Dépôt ouvert' : 'Dépôt fermé'}</SBadge>}>
        <div className="space-y-5">
          <SToggle checked={!!cfg.actif} onChange={(v) => set({ actif: v })} label="Accepter les nouvelles demandes" description="Désactivé, le formulaire public affiche que le dépôt est fermé." />
          <SGrid cols={3}>
            <SField label="Délai d'instruction (jours)" hint="À compter de la réception de la demande complète.">
              <SInput type="number" min={0} max={365} value={cfg.delaiInstruction} onChange={(e) => set({ delaiInstruction: e.target.value })} />
            </SField>
            <SField label="Nature des jours" hint="Ouvrés : du lundi au vendredi.">
              <SSelect value={cfg.typeJours} onChange={(e) => set({ typeJours: e.target.value })}>
                <option value="OUVRES">Jours ouvrés (lundi → vendredi)</option>
                <option value="CALENDAIRES">Jours calendaires</option>
              </SSelect>
            </SField>
            <SField label="Marge supplémentaire (jours calendaires)" hint="Ajoutée au délai d'instruction (0 par défaut).">
              <SInput type="number" min={0} value={cfg.delaiMinimalDepot} onChange={(e) => set({ delaiMinimalDepot: e.target.value })} />
            </SField>
          </SGrid>
          {cfg.typeJours === 'OUVRES' && (
            <SToggle checked={!!cfg.exclureFeries} onChange={(v) => set({ exclureFeries: v })} label="Exclure les jours fériés" description="Les jours fériés français ne sont pas comptés comme jours ouvrés." />
          )}
          <SAlert type="info">
            Une demande déposée aujourd&apos;hui permettrait des tournages à partir du <b>{iso(apercu.date).split('-').reverse().join('/')}</b>
            {apercu.periode ? ' (période de fermeture en cours)' : ''}.
          </SAlert>
        </div>
      </SCard>

      <SCard icon={CalendarOff} title="Périodes d'absence du service" description="Les demandes reçues pendant ces périodes ne sont pas traitées ; les tournages sont acceptés à compter de la date de reprise (ex. été : demandes du 1er juillet au 31 août, tournages à partir du 1er septembre)."
        actions={<SButton icon={Plus} onClick={() => set({ periodesAbsence: [...periodes, { debut: '', fin: '', reprise: '', motif: '' }] })}>Ajouter une période</SButton>}>
        {periodes.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune période paramétrée.</p>
        ) : (
          <div className="space-y-3">
            {periodes.map((p, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1.4fr_auto] gap-3 items-end p-3 rounded-xl bg-slate-50 border border-slate-200">
                <SField label="Demandes reçues du"><SInput type="date" value={p.debut} onChange={(e) => majPeriode(i, { debut: e.target.value })} /></SField>
                <SField label="au (inclus)"><SInput type="date" value={p.fin} onChange={(e) => majPeriode(i, { fin: e.target.value })} /></SField>
                <SField label="Tournages acceptés dès le"><SInput type="date" value={p.reprise} onChange={(e) => majPeriode(i, { reprise: e.target.value })} /></SField>
                <SField label="Motif (interne)"><SInput type="text" placeholder="Congés d'été" value={p.motif || ''} onChange={(e) => majPeriode(i, { motif: e.target.value })} /></SField>
                <SIconButton title="Supprimer la période" tone="rose" onClick={() => set({ periodesAbsence: periodes.filter((_, k) => k !== i) })}><Trash2 size={16} /></SIconButton>
              </div>
            ))}
          </div>
        )}
      </SCard>

      <SCard icon={Clapperboard} title="Messages et notifications">
        <SGrid>
          <SField label="E-mail de notification interne" hint="Reçoit un message à chaque nouvelle demande (laisser vide pour désactiver)."><SInput type="email" value={cfg.emailNotification || ''} onChange={(e) => set({ emailNotification: e.target.value })} /></SField>
          <SField label="Message d'accueil du formulaire" className="md:col-span-2" hint="Texte affiché en haut du formulaire public (optionnel)."><STextarea rows={3} value={cfg.messageAccueil || ''} onChange={(e) => set({ messageAccueil: e.target.value })} /></SField>
        </SGrid>
      </SCard>

      <SCard icon={KeyRound} title="Accès du site public (DMZ)" description="Le frontend de dépôt appelle l'API de VibeODP avec cette clé (en-tête x-api-key). Renseignez-la dans la variable TOURNAGE_API_KEY du frontend.">
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-[280px] px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 break-all">{cfg.apiKey || '—'}</code>
          <SButton icon={Copy} onClick={() => { navigator.clipboard?.writeText(cfg.apiKey || ''); setCopie(true); setTimeout(() => setCopie(false), 1500); }}>{copie ? 'Copié' : 'Copier'}</SButton>
          <SButton variant="danger" icon={RefreshCw} onClick={() => { if (confirm('Régénérer la clé ? Le site public cessera de fonctionner tant que la nouvelle clé n\'y est pas renseignée.')) sauver(undefined, { regenererCle: true }); }}>Régénérer</SButton>
        </div>
      </SCard>

      <SSaveBar saving={saving} message={message} />
    </form>
  );
}
