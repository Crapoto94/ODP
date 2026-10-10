"use client";

import React, { useEffect, useRef, useState } from 'react';
import FileDrop from '@/components/FileDrop';
import TimeSelect from '@/components/TimeSelect';

interface Config {
  actif: boolean;
  messageAccueil: string | null;
  delaiInstruction: number;
  typeJours: 'OUVRES' | 'CALENDAIRES';
  periodesAbsence: { debut: string; fin: string; reprise: string }[];
  premiereDatePossible: string; // AAAA-MM-JJ
  periodeEnCours: { debut: string; fin: string; reprise: string } | null;
  typesFilm: string[];
}

interface Jour { date: string; equipeArrivee: string; equipeDepart: string; vehiculesArrivee: string; vehiculesDepart: string }
interface PlanLigne { date: string; lieu: string; heures: string; materiel: string }

const EMPLACEMENTS = ['Trottoir', 'Chaussée', 'Places de stationnement', 'Espace vert', 'Place / parvis', 'Autre'];
const fr = (iso: string) => iso.split('-').reverse().join('/');
const jourVide = (date = ''): Jour => ({ date, equipeArrivee: '', equipeDepart: '', vehiculesArrivee: '', vehiculesDepart: '' });

export default function DemandeForm() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [chargement, setChargement] = useState(true);
  const [indispo, setIndispo] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreurs, setErreurs] = useState<string[]>([]);
  const [reference, setReference] = useState<string | null>(null);
  const racine = useRef<HTMLDivElement>(null);

  const [dem, setDem] = useState({ societe: '', nom: '', email: '', telephone: '' });
  const [projet, setProjet] = useState({ titre: '', typeFilm: '', synopsis: '', scenes: '' });
  const [violence, setViolence] = useState<boolean | null>(null);
  const [armes, setArmes] = useState<boolean | null>(null);
  const [jours, setJours] = useState<Jour[]>([jourVide()]);
  const [lieu, setLieu] = useState<{ emplacements: string[]; adresse: string; precisions: string }>({ emplacements: [], adresse: '', precisions: '' });
  const [plan, setPlan] = useState<Record<string, { lieu: string; heures: string; materiel: string }>>({});
  const [pers, setPers] = useState({ equipe: '', comediens: '', figurants: '', autres: '', autresPrecision: '' });
  const [veh, setVeh] = useState({ description: '', nbPlaces: '', localisation: '' });
  const [etudiant, setEtudiant] = useState(false);
  const [ecole, setEcole] = useState({ nom: '', contact: '', telephone: '', email: '' });
  const [cas, setCas] = useState({ drone: false, passerelle: false, cormailles: false });
  const [accepte, setAccepte] = useState(false);
  const [fAssurance, setFAssurance] = useState<File | null>(null);
  const [fPlan, setFPlan] = useState<File | null>(null);
  const [fEcole, setFEcole] = useState<File | null>(null);
  const [fAutres, setFAutres] = useState<File[]>([]);

  useEffect(() => {
    fetch('/api/config').then(async (r) => { if (!r.ok) throw new Error(); setCfg(await r.json()); })
      .catch(() => setIndispo(true)).finally(() => setChargement(false));
  }, []);

  // Hauteur envoyée à la page parente pour un iframe sans ascenseur interne :
  // window.addEventListener('message', e => { if (e.data?.type === 'vibeodp-height') iframe.style.height = e.data.height + 'px' })
  useEffect(() => {
    const el = racine.current; if (!el) return;
    const envoyer = () => window.parent?.postMessage({ type: 'vibeodp-height', height: Math.ceil(el.getBoundingClientRect().height) + 8 }, '*');
    const obs = new ResizeObserver(envoyer); obs.observe(el); envoyer();
    return () => obs.disconnect();
  }, [cfg, reference]);

  const min = cfg?.premiereDatePossible || '';
  const ouvres = cfg?.typeJours === 'OUVRES';
  const stationne = lieu.emplacements.includes('Places de stationnement');
  // Copie un jour (horaires + ligne du plan de tournage) sur le lendemain, juste après lui
  const dupliquerJour = (i: number) => {
    const src = jours[i];
    let date = '';
    if (src.date) {
      const [y, m, d] = src.date.split('-').map(Number);
      const n = new Date(y, m - 1, d + 1);
      const cand = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
      if (!jours.some((j) => j.date === cand)) date = cand;
    }
    setJours([...jours.slice(0, i + 1), { ...src, date }, ...jours.slice(i + 1)]);
    if (date && plan[src.date]) setPlan({ ...plan, [date]: { ...plan[src.date] } });
  };
  const majJour = (i: number, p: Partial<Jour>) => setJours((js) => js.map((j, k) => (k === i ? { ...j, ...p } : j)));
  const datesPlan = jours.map((j) => j.date).filter(Boolean);

  const valider = (): string[] => {
    const e: string[] = [];
    if (!dem.societe.trim() || !dem.nom.trim() || !dem.email.trim() || !dem.telephone.trim()) e.push('Renseignez la société, le nom, l\'e-mail et le téléphone du demandeur.');
    if (!projet.titre.trim() || !projet.typeFilm) e.push('Renseignez le titre et le type de film.');
    if (projet.synopsis.trim().length < 20) e.push('Le synopsis (ou le sujet du reportage photo) est obligatoire.');
    if (projet.scenes.trim().length < 10) e.push('Le descriptif des scènes à tourner en extérieur est obligatoire.');
    if (violence === null || armes === null) e.push('Précisez s\'il s\'agit de scènes de violence et si des armes factices sont utilisées.');
    jours.forEach((j, i) => {
      if (!j.date) e.push(`Jour ${i + 1} : date manquante.`);
      else if (j.date < min) e.push(`Jour ${i + 1} : le ${fr(j.date)} est trop proche. Les tournages ne peuvent débuter qu'à partir du ${fr(min)}.`);
      if (!j.equipeArrivee || !j.equipeDepart) e.push(`Jour ${i + 1} : renseignez les horaires d'arrivée et de départ de l'équipe.`);
      if (!!j.vehiculesArrivee !== !!j.vehiculesDepart) e.push(`Jour ${i + 1} : renseignez à la fois l'arrivée et le départ des véhicules techniques (ou aucun des deux).`);
    });
    if (!lieu.emplacements.length || !lieu.adresse.trim()) e.push('Indiquez le lieu envisagé (type d\'emplacement et adresse).');
    if (datesPlan.some((d) => { const p = plan[d]; return !p || !p.lieu.trim() || !p.heures.trim() || !p.materiel.trim(); })) e.push('Le plan de tournage doit préciser, pour chaque date, le lieu, les heures et le matériel employé.');
    if (!(Number(pers.equipe) + Number(pers.comediens) + Number(pers.figurants) + Number(pers.autres) > 0)) e.push('Indiquez le nombre de personnes mobilisées.');
    if (!fPlan) e.push('Le plan de localisation du matériel et des véhicules (1/100e ou 1/200e) est obligatoire.');
    if (!fAssurance) e.push('L\'attestation d\'assurance est obligatoire : sans elle, la demande ne peut pas être déposée.');
    if (etudiant) {
      if (!fEcole) e.push('Pour les étudiants, l\'attestation de l\'école relative au projet est obligatoire.');
      if (!ecole.contact.trim() || !ecole.telephone.trim() || !ecole.email.trim()) e.push('Pour les étudiants, indiquez un contact de l\'école (nom, téléphone et e-mail).');
    }
    if (!accepte) e.push('Confirmez l\'exactitude des informations et prenez connaissance des conditions.');
    return e;
  };

  const soumettre = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = valider();
    setErreurs(e);
    if (e.length) { window.parent?.postMessage({ type: 'vibeodp-scroll-top' }, '*'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setEnvoi(true);
    try {
      const donnees = {
        demandeur: dem, ...projet, violence, armesFactices: armes, jours,
        lieu, plan: datesPlan.map((d) => ({ date: d, ...plan[d] })),
        personnes: { equipe: Number(pers.equipe) || 0, comediens: Number(pers.comediens) || 0, figurants: Number(pers.figurants) || 0, autres: Number(pers.autres) || 0, autresPrecision: pers.autresPrecision.trim() },
        vehicules: { description: veh.description, blocagePlaces: lieu.emplacements.includes('Places de stationnement'), nbPlaces: stationne && veh.nbPlaces !== '' ? Number(veh.nbPlaces) : null, localisation: stationne ? veh.localisation : '' },
        etudiant, ecole: etudiant ? ecole : null, cas, accepte,
      };
      const fd = new FormData();
      fd.append('data', JSON.stringify(donnees));
      if (fAssurance) fd.append('assurance', fAssurance);
      if (fPlan) fd.append('plan', fPlan);
      if (etudiant && fEcole) fd.append('ecole', fEcole);
      fAutres.forEach((f) => fd.append('autre', f));
      const r = await fetch('/api/demandes', { method: 'POST', body: fd });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.success) { setReference(data.reference); window.scrollTo({ top: 0 }); }
      else { setErreurs(data.errors || [data.error || 'Une erreur est survenue.']); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    } catch {
      setErreurs(['Impossible de contacter le service. Veuillez réessayer.']);
    } finally { setEnvoi(false); }
  };

  if (chargement) return <div className="wrap"><p className="muted">Chargement du formulaire…</p></div>;
  if (indispo || !cfg) return <div className="wrap"><div className="notice err">Le service de dépôt est momentanément indisponible. Merci de réessayer ultérieurement.</div></div>;
  if (!cfg.actif) return <div className="wrap"><div className="notice warn">Le dépôt de demandes de tournage est actuellement fermé. Merci de réessayer ultérieurement.</div></div>;

  if (reference) {
    return (
      <div className="wrap" ref={racine}>
        <div className="notice ok">
          <h2>Votre demande a bien été enregistrée</h2>
          <p>Référence : <b>{reference}</b>. Un e-mail d&apos;accusé de réception vous a été envoyé à <b>{dem.email}</b>.</p>
          <p>Le délai d&apos;instruction est de <b>{cfg.delaiInstruction} {ouvres ? 'jours ouvrés' : 'jours calendaires'}</b> à compter de la réception de la demande complète.</p>
        </div>
        <div className="card">
          <h2>Et ensuite ?</h2>
          <ul>
            <li>Après examen de la demande, vous devrez vous rendre <b>disponible pour un rendez-vous sur site</b>.</li>
            <li>L&apos;<b>accord de principe</b> définira les conditions techniques et financières de l&apos;occupation du domaine public. Il peut comporter des réserves.</li>
            <li>La société de tournage devra <b>distribuer un avis d&apos;information aux riverains</b>.</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap" ref={racine}>
      <form onSubmit={soumettre} noValidate>
        <h1>Demande d&apos;autorisation de tournage</h1>
        <p className="muted" style={{ marginTop: 0 }}>Ville d&apos;Ivry-sur-Seine — occupation du domaine public</p>

        {cfg.messageAccueil && <div className="notice info" style={{ whiteSpace: 'pre-wrap' }}>{cfg.messageAccueil}</div>}

        <div className="notice info">
          <b>Délai d&apos;instruction : {cfg.delaiInstruction} {ouvres ? 'jours ouvrés (du lundi au vendredi)' : 'jours calendaires'}</b> à compter de la réception de la demande <b>complète</b>.
          La procédure est plus longue si la demande implique l&apos;utilisation d&apos;une nacelle ou d&apos;autres procédés nécessitant des autorisations spécifiques.
          {cfg.periodesAbsence.length > 0 && (
            <ul>
              {cfg.periodesAbsence.map((p, i) => (
                <li key={i}>Les demandes reçues du <b>{fr(p.debut)}</b> au <b>{fr(p.fin)}</b> ne pourront être traitées : les tournages pourront être acceptés à compter du <b>{fr(p.reprise)}</b>, à réception d&apos;un dossier complet.</li>
              ))}
            </ul>
          )}
          <p style={{ margin: '8px 0 0' }}>Aujourd&apos;hui, les tournages ne peuvent débuter qu&apos;à partir du <b>{fr(min)}</b>.</p>
        </div>

        {erreurs.length > 0 && (
          <div className="notice err" role="alert">
            <b>Votre demande ne peut pas être envoyée :</b>
            <ul>{erreurs.map((m, i) => <li key={i}>{m}</li>)}</ul>
          </div>
        )}

        <div className="hp" aria-hidden="true"><label>Site web<input type="text" name="site_web" tabIndex={-1} autoComplete="off" /></label></div>

        <div className="card">
          <h2>1. Le demandeur</h2>
          <div className="grid">
            <div><label className="f">Société de production <span className="req">*</span></label><input type="text" value={dem.societe} onChange={(e) => setDem({ ...dem, societe: e.target.value })} /></div>
            <div><label className="f">Nom et prénom du contact <span className="req">*</span></label><input type="text" value={dem.nom} onChange={(e) => setDem({ ...dem, nom: e.target.value })} /></div>
            <div><label className="f">E-mail <span className="req">*</span></label><input type="email" value={dem.email} onChange={(e) => setDem({ ...dem, email: e.target.value })} /></div>
            <div><label className="f">Téléphone <span className="req">*</span></label><input type="tel" value={dem.telephone} onChange={(e) => setDem({ ...dem, telephone: e.target.value })} /></div>
          </div>
        </div>

        <div className="card">
          <h2>2. Le projet</h2>
          <div className="grid">
            <div><label className="f">Titre du projet <span className="req">*</span></label><input type="text" value={projet.titre} onChange={(e) => setProjet({ ...projet, titre: e.target.value })} /></div>
            <div><label className="f">Type de film <span className="req">*</span></label>
              <select value={projet.typeFilm} onChange={(e) => setProjet({ ...projet, typeFilm: e.target.value })}>
                <option value="">— Choisir —</option>
                {cfg.typesFilm.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="span2"><label className="f">Synopsis du film ou téléfilm, ou sujet du reportage photo <span className="req">*</span></label><textarea value={projet.synopsis} onChange={(e) => setProjet({ ...projet, synopsis: e.target.value })} /></div>
            <div className="span2"><label className="f">Descriptif des scènes à tourner en extérieur <span className="req">*</span></label><textarea value={projet.scenes} onChange={(e) => setProjet({ ...projet, scenes: e.target.value })} /></div>
            <div>
              <label className="f">Y a-t-il des scènes de violence ? <span className="req">*</span></label>
              <div className="radios">
                <label><input type="radio" name="violence" checked={violence === true} onChange={() => setViolence(true)} /> Oui</label>
                <label><input type="radio" name="violence" checked={violence === false} onChange={() => setViolence(false)} /> Non</label>
              </div>
            </div>
            <div>
              <label className="f">Utilisation d&apos;armes factices prévue ? <span className="req">*</span></label>
              <div className="radios">
                <label><input type="radio" name="armes" checked={armes === true} onChange={() => setArmes(true)} /> Oui</label>
                <label><input type="radio" name="armes" checked={armes === false} onChange={() => setArmes(false)} /> Non</label>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>3. Jours et horaires de tournage</h2>
          <p className="hint" style={{ marginTop: -4, marginBottom: 12 }}>Première date possible : <b>{fr(min)}</b>. Les dates antérieures sont refusées.</p>
          {jours.map((j, i) => (
            <div className="day" key={i}>
              <div className="day-head">
                <span>Jour {i + 1}</span>
                <span style={{ display: 'inline-flex', gap: 4 }}>
                  <button type="button" className="btn link" style={{ color: 'var(--accent)' }} onClick={() => dupliquerJour(i)}>Copier ce jour</button>
                  {jours.length > 1 && <button type="button" className="btn link" onClick={() => setJours(jours.filter((_, k) => k !== i))}>Supprimer</button>}
                </span>
              </div>
              <div className="grid five">
                <div><label className="f">Date <span className="req">*</span></label><input type="date" min={min} value={j.date} onChange={(e) => majJour(i, { date: e.target.value })} /></div>
                <div><label className="f">Équipe : arrivée <span className="req">*</span></label><TimeSelect value={j.equipeArrivee} onChange={(v) => majJour(i, { equipeArrivee: v })} /></div>
                <div><label className="f">Équipe : départ <span className="req">*</span></label><TimeSelect value={j.equipeDepart} onChange={(v) => majJour(i, { equipeDepart: v })} /></div>
                <div><label className="f">Véhicules techniques : arrivée <span className="muted">(facultatif)</span></label><TimeSelect value={j.vehiculesArrivee} onChange={(v) => majJour(i, { vehiculesArrivee: v })} /></div>
                <div><label className="f">Véhicules techniques : départ <span className="muted">(facultatif)</span></label><TimeSelect value={j.vehiculesDepart} onChange={(v) => majJour(i, { vehiculesDepart: v })} /></div>
              </div>
            </div>
          ))}
          <button type="button" className="btn ghost" onClick={() => setJours([...jours, jourVide()])}>+ Ajouter un jour de tournage</button>
        </div>

        <div className="card">
          <h2>4. Lieu envisagé</h2>
          <label className="f">Emplacement occupé <span className="req">*</span></label>
          <div className="checks" style={{ marginBottom: 12 }}>
            {EMPLACEMENTS.map((x) => (
              <label key={x}><input type="checkbox" checked={lieu.emplacements.includes(x)} onChange={(e) => setLieu({ ...lieu, emplacements: e.target.checked ? [...lieu.emplacements, x] : lieu.emplacements.filter((y) => y !== x) })} /> {x}</label>
            ))}
          </div>
          <div className="grid">
            <div><label className="f">Adresse / rue <span className="req">*</span></label><input type="text" value={lieu.adresse} onChange={(e) => setLieu({ ...lieu, adresse: e.target.value })} /></div>
            <div><label className="f">Précisions</label><input type="text" value={lieu.precisions} onChange={(e) => setLieu({ ...lieu, precisions: e.target.value })} /></div>
          </div>
        </div>

        <div className="card">
          <h2>5. Plan de tournage</h2>
          <p className="hint" style={{ marginTop: -4, marginBottom: 12 }}>Pour chaque date : lieux, heures et matériel employé (éclairage, groupes électrogènes, grue, dolly, travelling…).</p>
          {datesPlan.length === 0 && <p className="muted">Renseignez d&apos;abord les dates de tournage ci-dessus.</p>}
          {datesPlan.map((d) => (
            <div className="day" key={d}>
              <div className="day-head"><span>{fr(d)}</span></div>
              <div className="grid three">
                <div><label className="f">Lieu <span className="req">*</span></label><input type="text" value={plan[d]?.lieu || ''} onChange={(e) => setPlan({ ...plan, [d]: { lieu: e.target.value, heures: plan[d]?.heures || '', materiel: plan[d]?.materiel || '' } })} /></div>
                <div><label className="f">Heures <span className="req">*</span></label><input type="text" placeholder="ex. 8h–18h" value={plan[d]?.heures || ''} onChange={(e) => setPlan({ ...plan, [d]: { lieu: plan[d]?.lieu || '', heures: e.target.value, materiel: plan[d]?.materiel || '' } })} /></div>
                <div><label className="f">Matériel employé <span className="req">*</span></label><input type="text" value={plan[d]?.materiel || ''} onChange={(e) => setPlan({ ...plan, [d]: { lieu: plan[d]?.lieu || '', heures: plan[d]?.heures || '', materiel: e.target.value } })} /></div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>6. Personnes, véhicules et matériel</h2>
          <p className="hint" style={{ marginTop: -4, marginBottom: 12 }}>Indiquez le <b>nombre</b> de personnes mobilisées par catégorie.</p>
          <div className="grid" style={{ marginBottom: 14 }}>
            <div><label className="f">Nombre de personnes — équipe technique <span className="req">*</span></label><input type="number" min={0} value={pers.equipe} onChange={(e) => setPers({ ...pers, equipe: e.target.value })} /></div>
            <div><label className="f">Nombre de comédiens</label><input type="number" min={0} value={pers.comediens} onChange={(e) => setPers({ ...pers, comediens: e.target.value })} /></div>
            <div><label className="f">Nombre de figurants</label><input type="number" min={0} value={pers.figurants} onChange={(e) => setPers({ ...pers, figurants: e.target.value })} /></div>
            <div><label className="f">Nombre d&apos;autres personnes</label><input type="number" min={0} value={pers.autres} onChange={(e) => setPers({ ...pers, autres: e.target.value })} /></div>
            <div className="span2"><label className="f">Autres : précisez</label><input type="text" placeholder="ex. sécurité, régisseurs, public…" value={pers.autresPrecision} onChange={(e) => setPers({ ...pers, autresPrecision: e.target.value })} /></div>
          </div>
          <div className="grid">
            <div className="span2"><label className="f">Véhicules et matériel à stationner <span className="muted">(facultatif)</span></label><textarea style={{ minHeight: 70 }} placeholder="Camions, camions-loge, camion-cantine, groupe électrogène…" value={veh.description} onChange={(e) => setVeh({ ...veh, description: e.target.value })} /></div>
            {lieu.emplacements.includes('Places de stationnement') && (
              <>
                <div><label className="f">Nombre de places de stationnement occupées <span className="muted">(facultatif)</span></label><input type="number" min={0} value={veh.nbPlaces} onChange={(e) => setVeh({ ...veh, nbPlaces: e.target.value })} /></div>
                <div><label className="f">Localisation des places <span className="muted">(facultatif)</span></label><input type="text" placeholder="du n° 10 au n° 18 de la rue …" value={veh.localisation} onChange={(e) => setVeh({ ...veh, localisation: e.target.value })} /></div>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <h2>7. Pièces à joindre</h2>
          <div className="grid">
            <FileDrop label="Plan de localisation du matériel et des véhicules" requis files={fPlan ? [fPlan] : []} onChange={(f) => setFPlan(f[0] || null)} hint="Plan précis au 1/100e ou 1/200e. PDF, PNG ou JPG — 10 Mo max." />
            <FileDrop label="Attestation d'assurance garantissant le tournage" requis files={fAssurance ? [fAssurance] : []} onChange={(f) => setFAssurance(f[0] || null)} hint="Sans attestation, la demande ne peut pas être déposée." />
          </div>
          <div style={{ marginTop: 14 }}>
            <FileDrop label="Autres pièces (facultatif)" multiple files={fAutres} onChange={setFAutres} hint="Plusieurs fichiers possibles. PDF, PNG ou JPG — 10 Mo max chacun." />
          </div>
        </div>

        <div className="card">
          <h2>8. Cas particuliers</h2>
          <label style={{ display: 'inline-flex', gap: 8, marginBottom: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={etudiant} onChange={(e) => setEtudiant(e.target.checked)} /> <b>Il s&apos;agit d&apos;un projet étudiant</b>
          </label>
          {etudiant && (
            <div className="day">
              <div className="grid">
                <div><label className="f">École</label><input type="text" value={ecole.nom} onChange={(e) => setEcole({ ...ecole, nom: e.target.value })} /></div>
                <div><label className="f">Contact (nom) <span className="req">*</span></label><input type="text" value={ecole.contact} onChange={(e) => setEcole({ ...ecole, contact: e.target.value })} /></div>
                <div><label className="f">Téléphone <span className="req">*</span></label><input type="tel" value={ecole.telephone} onChange={(e) => setEcole({ ...ecole, telephone: e.target.value })} /></div>
                <div><label className="f">E-mail <span className="req">*</span></label><input type="email" value={ecole.email} onChange={(e) => setEcole({ ...ecole, email: e.target.value })} /></div>
                <div className="span2"><FileDrop label="Attestation de l'école relative au projet" requis files={fEcole ? [fEcole] : []} onChange={(f) => setFEcole(f[0] || null)} /></div>
              </div>
            </div>
          )}

          <div className="cas">
            <label><input type="checkbox" checked={cas.drone} onChange={(e) => setCas({ ...cas, drone: e.target.checked })} /> <b>Utilisation de drones</b></label>
            {cas.drone && <p>Il faut remplir une <b>déclaration préalable Cerfa 15476*02</b> en plus de la demande à la Ville. <a href="https://www.service-public.fr/professionnels-entreprises/vosdroits/R42699" target="_blank" rel="noreferrer">Accéder au formulaire</a></p>}
          </div>
          <div className="cas">
            <label><input type="checkbox" checked={cas.passerelle} onChange={(e) => setCas({ ...cas, passerelle: e.target.checked })} /> <b>Site de la passerelle aux câbles</b></label>
            {cas.passerelle && <p>Une demande doit également être adressée au <b>bureau du film de la Ville de Paris</b>. <a href="https://www.parisfilm.fr/fr/preparez-votre-tournage/adressez-votre-demande-t.html" target="_blank" rel="noreferrer">Adresser ma demande</a></p>}
          </div>
          <div className="cas">
            <label><input type="checkbox" checked={cas.cormailles} onChange={(e) => setCas({ ...cas, cormailles: e.target.checked })} /> <b>Site du Parc des Cormailles</b></label>
            {cas.cormailles && <p>Une demande doit également être adressée au <b>Conseil départemental du Val-de-Marne</b> au <b>01 43 99 82 68</b> ou <b>01 43 99 82 82</b>.</p>}
          </div>
        </div>

        <div className="notice info">
          <b>En cas de réponse favorable</b>
          <ul>
            <li>Après examen de la demande, vous devrez vous rendre disponible pour un <b>rendez-vous sur site</b>.</li>
            <li>L&apos;<b>accord de principe</b> définira les conditions techniques et financières de l&apos;occupation du domaine public. Il peut potentiellement comporter des réserves.</li>
            <li>La société de tournage devra <b>distribuer un avis d&apos;information aux riverains</b>.</li>
          </ul>
        </div>

        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 16, cursor: 'pointer' }}>
          <input type="checkbox" checked={accepte} onChange={(e) => setAccepte(e.target.checked)} style={{ marginTop: 4 }} />
          <span>Je certifie l&apos;exactitude des informations fournies et j&apos;ai pris connaissance des conditions d&apos;instruction ci-dessus.</span>
        </label>

        <button className="btn" type="submit" disabled={envoi}>{envoi ? 'Envoi en cours…' : 'Envoyer ma demande'}</button>
      </form>
    </div>
  );
}
