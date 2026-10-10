"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Building2, Plus, Trash2, Save, Mail } from 'lucide-react';
import { SCard, SGrid, SField, SInput, STextarea, SToggle, SButton, SIconButton, SAlert, SBadge, SLoading } from '@/components/v2/settings/ui';

interface Question { id: string; libelle: string; type: 'OUINON' | 'TEXTE' }
interface Service { id?: number; code: string; nom: string; description: string; emails: string[] | string; questions: Question[]; circuitPropre: boolean; actif: boolean }

const emailsTexte = (e: any) => (Array.isArray(e) ? e.join('\n') : String(e || ''));

// Services consultés par la DAC (point d'entrée unique) : adresses destinataires des demandes d'avis et questions propres à chaque service.
export default function ServicesAvisCard() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    axios.get('/api/tournages/services').then((r) => setServices(r.data.map((s: any) => ({ ...s, emails: emailsTexte(s.emails), description: s.description || '' }))))
      .catch((e) => setMsg({ type: 'error', text: e.response?.data?.error || e.message }));
  }, []);

  if (!services) return msg ? <SAlert type="error">{msg.text}</SAlert> : <SLoading />;

  const maj = (i: number, patch: Partial<Service>) => setServices(services.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  const majQ = (i: number, j: number, patch: Partial<Question>) => maj(i, { questions: services[i].questions.map((q, k) => (k === j ? { ...q, ...patch } : q)) });

  const sauver = async () => {
    setSaving(true); setMsg(null);
    try {
      const r = await axios.put('/api/tournages/services', { services });
      setServices(r.data.map((s: any) => ({ ...s, emails: emailsTexte(s.emails), description: s.description || '' })));
      setMsg({ type: 'success', text: 'Services consultés enregistrés.' });
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || e.message });
    } finally { setSaving(false); }
  };

  const sansMail = services.filter((s) => s.actif && !String(emailsTexte(s.emails)).trim()).length;

  return (
    <SCard
      icon={Building2}
      title="Services consultés pour avis"
      description="La DAC est le point d'entrée unique ; selon les cas elle consulte ces services, qui répondent par un lien reçu par e-mail, sans connexion. Un ou plusieurs e-mails par service."
      actions={<SButton icon={Plus} onClick={() => setServices([...services, { code: '', nom: '', description: '', emails: '', questions: [], circuitPropre: false, actif: true }])}>Ajouter un service</SButton>}
    >
      <div className="space-y-4">
        {sansMail > 0 && <SAlert type="warning">{sansMail} service(s) actif(s) sans adresse e-mail : une demande d&apos;avis ne pourra pas leur être envoyée.</SAlert>}
        {services.map((s, i) => (
          <div key={s.id ?? `n${i}`} className={`rounded-xl border p-4 space-y-4 ${s.actif ? 'border-slate-200 bg-slate-50/60' : 'border-slate-200 bg-slate-100/60 opacity-70'}`}>
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <SBadge tone={s.actif ? 'emerald' : 'slate'} dot>{s.actif ? 'Actif' : 'Inactif'}</SBadge>
                {s.circuitPropre && <SBadge tone="violet">Circuit propre (signature, tarifs)</SBadge>}
              </div>
              <SIconButton title="Supprimer le service" tone="rose" onClick={() => { if (confirm(`Supprimer « ${s.nom || 'ce service'} » ? Les avis déjà demandés sont conservés.`)) setServices(services.filter((_, k) => k !== i)); }}><Trash2 size={16} /></SIconButton>
            </div>
            <SGrid>
              <SField label="Nom du service" required><SInput type="text" value={s.nom} onChange={(e) => maj(i, { nom: e.target.value })} /></SField>
              <SField label="Description"><SInput type="text" value={s.description} onChange={(e) => maj(i, { description: e.target.value })} /></SField>
              <SField label="Adresses e-mail destinataires" className="md:col-span-2" hint="Une adresse par ligne (ou séparées par « ; »). Toutes reçoivent la demande d'avis ; la première réponse suffit.">
                <STextarea rows={2} placeholder={'sports@ivry94.fr\nresponsable.stades@ivry94.fr'} value={String(s.emails)} onChange={(e) => maj(i, { emails: e.target.value })} />
              </SField>
            </SGrid>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SToggle checked={s.actif} onChange={(v) => maj(i, { actif: v })} label="Service actif" description="Inactif : non proposé pour les demandes d'avis." />
              <SToggle checked={s.circuitPropre} onChange={(v) => maj(i, { circuitPropre: v })} label="Circuit propre" description="Service avec son propre circuit de signature et ses propres tarifs (ex. Direction de l'espace public)." />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-semibold text-slate-700">Questions posées à ce service</p>
                <SButton icon={Plus} onClick={() => maj(i, { questions: [...s.questions, { id: `q${s.questions.length + 1}_${Date.now() % 10000}`, libelle: '', type: 'OUINON' }] })}>Question</SButton>
              </div>
              {s.questions.length === 0 && <p className="text-xs text-slate-500">Aucune question spécifique : le service répond seulement favorable / défavorable, avec un commentaire.</p>}
              <div className="space-y-2">
                {s.questions.map((q, j) => (
                  <div key={q.id} className="grid grid-cols-1 md:grid-cols-[1fr_170px_auto] gap-2 items-center">
                    <SInput type="text" placeholder="ex. Présence d'un médecin ou d'un infirmier nécessaire ?" value={q.libelle} onChange={(e) => majQ(i, j, { libelle: e.target.value })} />
                    <select value={q.type} onChange={(e) => majQ(i, j, { type: e.target.value as any })} className="h-10 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm">
                      <option value="OUINON">Réponse Oui / Non</option>
                      <option value="TEXTE">Réponse libre</option>
                    </select>
                    <SIconButton title="Supprimer la question" tone="rose" onClick={() => maj(i, { questions: s.questions.filter((_, k) => k !== j) })}><Trash2 size={15} /></SIconButton>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-500 flex items-center gap-1.5"><Mail size={13} /> Pour une demande ponctuelle, saisissez des adresses « à la volée » depuis la fiche de la demande.</p>
          <div className="flex items-center gap-3">
            {msg && <span className={`text-sm font-medium ${msg.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>{msg.text}</span>}
            <SButton variant="primary" icon={Save} loading={saving} onClick={sauver}>Enregistrer les services</SButton>
          </div>
        </div>
      </div>
    </SCard>
  );
}
