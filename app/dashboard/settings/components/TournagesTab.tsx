"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Clapperboard, CalendarOff, KeyRound, Globe, Mail, Send, Calculator, Plus, Trash2, RefreshCw, Copy } from 'lucide-react';
import { SCard, SGrid, SField, SInput, SSelect, STextarea, SToggle, SButton, SIconButton, SAlert, SSaveBar, SLoading, SBadge } from '@/components/v2/settings/ui';
import MessagesContextuelsTab from './MessagesContextuelsTab';
import ServicesAvisCard from './ServicesAvisCard';
import { normaliserOptions } from '@/lib/tournage-simulation';
import { premiereDatePossible, iso, type PeriodeAbsence } from '@/lib/tournage-regles';

// Administration de la gestion des tournages : délai d'instruction, type de jours, périodes de fermeture, clé d'accès du site public.
export default function TournagesTab() {
  const [cfg, setCfg] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copie, setCopie] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const charger = () => axios.get('/api/tournages/config').then((r) => setCfg(r.data)).catch((e) => setMessage({ type: 'error', text: e.response?.data?.error || e.message }));
  useEffect(() => { charger(); }, []);

  if (!cfg) return message ? <SAlert type="error">{message.text}</SAlert> : <SLoading />;
  const set = (patch: any) => setCfg({ ...cfg, ...patch });
  const periodes: PeriodeAbsence[] = Array.isArray(cfg.periodesAbsence) ? cfg.periodesAbsence : [];
  const majPeriode = (i: number, patch: Partial<PeriodeAbsence>) => set({ periodesAbsence: periodes.map((p, k) => (k === i ? { ...p, ...patch } : p)) });

  const envoyerTest = async () => {
    setTesting(true); setTestMsg(null);
    try {
      await axios.patch('/api/tournages/config', cfg); // le test utilise les valeurs saisies
      await axios.post('/api/tournages/config/test-mail', { to: testTo });
      setTestMsg({ type: 'success', text: `Mail de test envoyé à ${testTo}` });
    } catch (err: any) {
      setTestMsg({ type: 'error', text: err.response?.data?.error || err.message });
    } finally { setTesting(false); }
  };

  const sim = normaliserOptions(cfg.simulation);
  const setSim = (patch: any) => set({ simulation: { ...sim, ...patch } });
  const frontends: any[] = Array.isArray(cfg.frontendsAutorises) ? cfg.frontendsAutorises : [];
  const majFront = (i: number, patch: any) => set({ frontendsAutorises: frontends.map((f, k) => (k === i ? { ...f, ...patch } : f)) });

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
    <div className="space-y-6 max-w-5xl">
    <form onSubmit={sauver} className="space-y-6">
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

      <SCard icon={Calculator} title="Tarification : simulation financière" description="Hypothèses de la simulation affichée dans chaque demande. Les prix viennent du module Tarifs & Articles ; les choix ci-dessous couvrent les points que les barèmes ne précisent pas.">
        <div className="space-y-5">
          <SGrid cols={3}>
            <SField label="Abattement courts-métrages (%)" hint="50 % dans les barèmes (courts-métrages ≤ 59 min hors publicité, projets aidés par la Ville sur la voirie)."><SInput type="number" min={0} max={100} value={sim.abattementTaux} onChange={(e) => setSim({ abattementTaux: Number(e.target.value) })} /></SField>
            <SField label="L'abattement porte sur" hint="« Tout le barème » ou seulement les droits (équipe, stationnement, occupation), pas l'instruction ni les autorisations.">
              <SSelect value={sim.abattementSur} onChange={(e) => setSim({ abattementSur: e.target.value })}><option value="TOUT">Tout le barème</option><option value="DROITS">Les droits seulement</option></SSelect>
            </SField>
            <SField label="Heures d'instruction estimées" hint="« Mise en œuvre technicien » (33,70 €/h) comptée par demande."><SInput type="number" min={0} step={0.5} value={sim.instructionHeures} onChange={(e) => setSim({ instructionHeures: Number(e.target.value) })} /></SField>
            <SField label="Instruction et autorisations pour" hint="Le barème voirie les prévoit ; la délibération bâtiments et le tarif sports n'en parlent pas.">
              <SSelect value={sim.instructionAutorisationPour} onChange={(e) => setSim({ instructionAutorisationPour: e.target.value })}><option value="VOIE">La voirie seulement</option><option value="TOUS">Tous les lieux</option></SSelect>
            </SField>
            <SField label="Supplément de nuit dès (heures entre 20 h et 8 h)" hint="Nombre d'heures de tournage de nuit déclenchant le supplément."><SInput type="number" min={0} step={0.5} value={sim.nuitSeuilHeures} onChange={(e) => setSim({ nuitSeuilHeures: Number(e.target.value) })} /></SField>
            <SField label="Demi-journée (bâtiments) jusqu'à (h)" hint="Au-delà : journée complète."><SInput type="number" min={1} step={0.5} value={sim.demiJourneeMaxHeures} onChange={(e) => setSim({ demiJourneeMaxHeures: Number(e.target.value) })} /></SField>
            <SField label="Gymnases, salles, piscine, tennis facturés" hint="Les tarifs sportifs ne précisent pas l'unité : à l'heure d'occupation (hypothèse retenue) ou une fois par jour.">
              <SSelect value={sim.sportUnite} onChange={(e) => setSim({ sportUnite: e.target.value })}><option value="HEURE">À l'heure</option><option value="JOUR">Par jour</option></SSelect>
            </SField>
            <SField label="Abattements pour les équipements sportifs" hint="Non précisés dans leur tarif : appliquer les règles de la voirie, des bâtiments, ou aucune.">
              <SSelect value={sim.reglesSport} onChange={(e) => setSim({ reglesSport: e.target.value })}><option value="VOIRIE">Comme la voirie</option><option value="BATIMENTS">Comme les bâtiments publics</option><option value="AUCUNE">Aucun</option></SSelect>
            </SField>
            <SField label="Projet aidé par la Ville (voirie)" hint="Le barème voirie prévoit un abattement de 50 % ; la délibération bâtiments, une exonération.">
              <SSelect value={sim.aideVille} onChange={(e) => setSim({ aideVille: e.target.value })}><option value="ABATTEMENT">Abattement</option><option value="EXONERATION">Exonération</option></SSelect>
            </SField>
          </SGrid>
          <SToggle checked={sim.exoneratEcoles} onChange={(v) => setSim({ exoneratEcoles: v })} label="Gratuité des projets d'écoles" description="Sur présentation de l'attestation de l'école (projets étudiants)." />
          <SToggle checked={sim.signalisation} onChange={(v) => setSim({ signalisation: v })} label="Ajouter la signalisation verticale" description="Quand des places de stationnement sont neutralisées (59,55 € par jour et par lieu)." />
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

      <SCard icon={Mail} title="E-mails : expéditeur et pied de page" description="Propres aux tournages. Les champs laissés vides reprennent les réglages généraux (Paramètres › Général).">
        <SGrid>
          <SField label="E-mail de notification interne" hint="Reçoit le modèle « Notification interne » à chaque nouvelle demande (vide = désactivé). Plusieurs adresses séparées par « ; »."><SInput icon={Mail} type="text" placeholder="tournages@ivry94.fr" value={cfg.emailNotification || ''} onChange={(e) => set({ emailNotification: e.target.value })} /></SField>
          <SField label="Nom de l'expéditeur"><SInput type="text" placeholder="Ville d'Ivry — Tournages" value={cfg.mailExpediteurNom || ''} onChange={(e) => set({ mailExpediteurNom: e.target.value })} /></SField>
          <SField label="Adresse de l'expéditeur"><SInput type="email" placeholder="nepasrepondre@ivry94.fr" value={cfg.mailExpediteurEmail || ''} onChange={(e) => set({ mailExpediteurEmail: e.target.value })} /></SField>
          <SField label="Pied de page — ligne 1"><SInput type="text" placeholder="Service Domaine public — Tournages" value={cfg.mailFooter1 || ''} onChange={(e) => set({ mailFooter1: e.target.value })} /></SField>
          <SField label="Pied de page — ligne 2"><SInput type="text" placeholder="Mairie d'Ivry-sur-Seine" value={cfg.mailFooter2 || ''} onChange={(e) => set({ mailFooter2: e.target.value })} /></SField>
          <SField label="Pied de page — ligne 3"><SInput type="text" placeholder="01 49 60 20 20 — tournages@ivry94.fr" value={cfg.mailFooter3 || ''} onChange={(e) => set({ mailFooter3: e.target.value })} /></SField>
          <SField label="Couleur du pied de page">
            <div className="flex gap-2">
              <input type="color" className="w-[42px] h-[42px] p-1 rounded-lg border border-[#e2e8f0] bg-white cursor-pointer" value={cfg.mailFooterColor || '#1e40af'} onChange={(e) => set({ mailFooterColor: e.target.value })} />
              <SInput type="text" placeholder="#1e40af" value={cfg.mailFooterColor || ''} onChange={(e) => set({ mailFooterColor: e.target.value })} />
            </div>
          </SField>
          <SField label="Aperçu">
            <div className="h-[42px] rounded-lg px-4 flex items-center text-xs font-medium text-white truncate" style={{ backgroundColor: cfg.mailFooterColor || '#1e40af' }}>
              {[cfg.mailFooter1, cfg.mailFooter2, cfg.mailFooter3].filter(Boolean).join(' · ') || 'Pied de page (réglages généraux)'}
            </div>
          </SField>
          <SField label="Message d'accueil du formulaire public" className="md:col-span-2" hint="Texte affiché en haut du formulaire (optionnel)."><STextarea rows={3} value={cfg.messageAccueil || ''} onChange={(e) => set({ messageAccueil: e.target.value })} /></SField>
        </SGrid>
        <div className="mt-5 pt-5 border-t border-[#e2e8f0]">
          <SField label="Envoyer un mail de test (modèle « Accusé de réception »)" hint="Enregistre d'abord les valeurs ci-dessus puis envoie un exemple, pour contrôler l'expéditeur et le pied de page.">
            <div className="flex flex-wrap gap-2">
              <div className="flex-1 min-w-[240px]"><SInput icon={Mail} type="email" placeholder="votre.adresse@ivry94.fr" value={testTo} onChange={(e) => setTestTo(e.target.value)} /></div>
              <SButton icon={Send} loading={testing} disabled={!testTo} onClick={envoyerTest}>Envoyer le test</SButton>
            </div>
          </SField>
          {testMsg && <SAlert type={testMsg.type} className="mt-3">{testMsg.text}</SAlert>}
        </div>
      </SCard>

      <SCard icon={KeyRound} title="Accès du site public (DMZ)" description="Le frontend de dépôt appelle l'API de VibeODP avec cette clé (en-tête x-api-key). Renseignez-la dans la variable TOURNAGE_API_KEY du frontend.">
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-[280px] px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 break-all">{cfg.apiKey || '—'}</code>
          <SButton icon={Copy} onClick={() => { navigator.clipboard?.writeText(cfg.apiKey || ''); setCopie(true); setTimeout(() => setCopie(false), 1500); }}>{copie ? 'Copié' : 'Copier'}</SButton>
          <SButton variant="danger" icon={RefreshCw} onClick={() => { if (confirm('Régénérer la clé ? Le site public cessera de fonctionner tant que la nouvelle clé n\'y est pas renseignée.')) sauver(undefined, { regenererCle: true }); }}>Régénérer</SButton>
        </div>
      </SCard>

      <SCard icon={Globe} title="Frontends autorisés (IP)" description="Seuls les serveurs listés peuvent appeler l'API publique (en plus de la clé). Adresse IP exacte ou plage CIDR IPv4 (ex. 10.20.0.0/24)."
        actions={<SButton icon={Plus} onClick={() => set({ frontendsAutorises: [...frontends, { nom: '', ip: '', actif: true }] })}>Ajouter un frontend</SButton>}>
        {frontends.length === 0 ? (
          <SAlert type="warning">Aucun frontend listé : l&apos;API n&apos;est protégée que par la clé. Ajoutez l&apos;IP du serveur de la DMZ pour restreindre l&apos;accès.</SAlert>
        ) : (
          <div className="space-y-3">
            {frontends.map((f: any, i: number) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-[1.2fr_1.2fr_auto_auto] gap-3 items-end p-3 rounded-xl bg-slate-50 border border-slate-200">
                <SField label="Nom"><SInput type="text" placeholder="Site de la ville (DMZ)" value={f.nom || ''} onChange={(e) => majFront(i, { nom: e.target.value })} /></SField>
                <SField label="IP ou plage CIDR"><SInput type="text" placeholder="10.20.0.15" value={f.ip || ''} onChange={(e) => majFront(i, { ip: e.target.value })} /></SField>
                <SToggle checked={f.actif !== false} onChange={(v) => majFront(i, { actif: v })} label="Actif" />
                <SIconButton title="Supprimer" tone="rose" onClick={() => set({ frontendsAutorises: frontends.filter((_: any, k: number) => k !== i) })}><Trash2 size={16} /></SIconButton>
              </div>
            ))}
          </div>
        )}
      </SCard>

      <SSaveBar saving={saving} message={message} />
    </form>

    <ServicesAvisCard />

    <div className="pt-2">
      <h3 className="text-[15px] font-bold text-slate-900 mb-1">Modèles d&apos;e-mails</h3>
      <p className="text-[13px] text-slate-500 mb-3">Accusé de réception, notification interne, complément, accord de principe, refus, demande d'avis, relance et avis reçu. Les variables entre {'{{ }}'} sont remplacées à l&apos;envoi.</p>
      <MessagesContextuelsTab prefix="MSG_TOURNAGE_" />
    </div>
    </div>
  );
}
