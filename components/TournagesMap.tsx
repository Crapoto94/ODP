"use client";

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Loader2, Clapperboard, FileVideo, CalendarClock, History, Play } from 'lucide-react';
import { STATUTS_DEMANDE } from '@/lib/tournage-regles';
import { getStatusConfig } from '@/lib/status-utils';

// Carte des tournages : en cours, à venir, passés, et demandes (avec infobulle de détail au survol et fiche au clic).

type Cat = 'ENCOURS' | 'AVENIR' | 'PASSE' | 'DEMANDE';

const CATS: Record<Cat, { label: string; color: string; icon: any }> = {
  ENCOURS: { label: 'En cours', color: '#f43f5e', icon: Play },
  AVENIR: { label: 'À venir', color: '#8b5cf6', icon: CalendarClock },
  PASSE: { label: 'Passés', color: '#94a3b8', icon: History },
  DEMANDE: { label: 'Demandes', color: '#2563eb', icon: FileVideo },
};

const IVRY: [number, number][] = [
  [48.803985830563, 2.3711660804846], [48.808032065507, 2.3672229478006], [48.816398323996, 2.3642042811729], [48.82569232682, 2.3900720145113],
  [48.816675787287, 2.4093609378413], [48.808463007472, 2.4088902175713], [48.800238582074, 2.3942552313772], [48.800295474842, 2.3868918231477],
  [48.805917054142, 2.3756714908057], [48.803985830563, 2.3711660804846],
];

const fmt = (d: any) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const jour = (d: any) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };

function categorieTournage(t: any): Cat {
  const now = jour(new Date());
  if (t.dateDebut && jour(t.dateDebut) > now) return 'AVENIR';
  if (t.dateFin && jour(t.dateFin) < now) return 'PASSE';
  if (t.dateDebut) return 'ENCOURS';
  // Sans dates : on se repose sur le statut du dossier
  return ['FACTURE', 'TITRE', 'PAYE', 'CLOS'].includes(String(t.statut).toUpperCase()) ? 'PASSE' : 'ENCOURS';
}

const pin = (color: string, count: number, hollow = false) => L.divIcon({
  className: 'custom-pin',
  html: `<div style="position:relative"><div style="background:${hollow ? '#fff' : color};width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:3px solid ${color};box-shadow:0 4px 10px rgba(0,0,0,.3)"><div style="width:7px;height:7px;background:${hollow ? color : '#fff'};border-radius:50%;transform:rotate(45deg)"></div></div>${count > 1 ? `<div style="position:absolute;top:-8px;right:-8px;background:#ef4444;color:#fff;font-size:9px;font-weight:900;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff">${count}</div>` : ''}</div>`,
  iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -28], tooltipAnchor: [14, -14],
});

interface Item { key: string; cat: Cat; lat: number; lng: number; data: any }

// Contenu détaillé (infobulle et fiche)
function Detail({ it }: { it: Item }) {
  const d = it.data;
  if (it.cat === 'DEMANDE') {
    const s = STATUTS_DEMANDE[d.statut];
    return (
      <div className="space-y-1 text-[11px] leading-snug">
        <p className="font-black text-slate-900 text-xs uppercase">{d.titre}</p>
        <p className="text-slate-500">{d.reference} · {d.typeFilm}</p>
        <p><span className="text-slate-500">Société :</span> <b>{d.societe}</b></p>
        <p><span className="text-slate-500">Tournage :</span> <b>{fmt(d.premiereDate)}{d.derniereDate && d.derniereDate !== d.premiereDate ? ` → ${fmt(d.derniereDate)}` : ''}</b></p>
        <p><span className="text-slate-500">Lieu :</span> {d.adresse}{d.emplacements?.length ? ` (${d.emplacements.join(', ')})` : ''}</p>
        {d.personnes ? <p><span className="text-slate-500">Personnes :</span> {d.personnes}{d.places != null ? ` · ${d.places} place(s) de stationnement` : ''}</p> : null}
        <p><span className="text-slate-500">Reçue le</span> {fmt(d.dateDepot)} · <span className="text-slate-500">réponse avant le</span> {fmt(d.dateLimiteReponse)}</p>
        <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${s?.cls || 'bg-slate-100 text-slate-600'}`}>{s?.label || d.statut}</span>
      </div>
    );
  }
  const st = getStatusConfig('TOURNAGE', d.statut);
  return (
    <div className="space-y-1 text-[11px] leading-snug">
      <p className="font-black text-slate-900 text-xs uppercase">{d.nom}</p>
      {d.titre && d.titre !== d.nom && <p className="text-slate-500">{d.titre}</p>}
      <p><span className="text-slate-500">Période :</span> <b>{fmt(d.dateDebut)}{d.dateFin && d.dateFin !== d.dateDebut ? ` → ${fmt(d.dateFin)}` : ''}</b></p>
      <p><span className="text-slate-500">Lieu :</span> {d.adresse}</p>
      {d.description && <p className="text-slate-600 line-clamp-3">{d.description}</p>}
      <div className="flex gap-1.5">
        <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase text-white" style={{ background: CATS[it.cat].color }}>{CATS[it.cat].label}</span>
        <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase border border-slate-200 ${st.bg} ${st.color}`}>{st.label}</span>
      </div>
    </div>
  );
}

export default function TournagesMap() {
  const router = useRouter();
  const [data, setData] = useState<{ tournages: any[]; demandes: any[] } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [actifs, setActifs] = useState<Record<Cat, boolean>>({ ENCOURS: true, AVENIR: true, PASSE: true, DEMANDE: true });

  useEffect(() => {
    axios.get('/api/tournages/carte').then((r) => setData(r.data)).catch((e) => setErreur(e.response?.data?.error || e.message));
  }, []);

  const { items, compte, sansPosition } = useMemo(() => {
    const all: Item[] = [];
    const c: Record<Cat, number> = { ENCOURS: 0, AVENIR: 0, PASSE: 0, DEMANDE: 0 };
    let sans = 0;
    for (const t of data?.tournages || []) {
      const cat = categorieTournage(t); c[cat]++;
      if (typeof t.latitude === 'number' && typeof t.longitude === 'number') all.push({ key: `t-${t.id}`, cat, lat: t.latitude, lng: t.longitude, data: t }); else sans++;
    }
    for (const d of data?.demandes || []) {
      c.DEMANDE++;
      if (typeof d.latitude === 'number' && typeof d.longitude === 'number') all.push({ key: `d-${d.id}`, cat: 'DEMANDE', lat: d.latitude, lng: d.longitude, data: d }); else sans++;
    }
    return { items: all, compte: c, sansPosition: sans };
  }, [data]);

  const visibles = items.filter((i) => actifs[i.cat]);
  const groupes = useMemo(() => {
    const g: Record<string, Item[]> = {};
    for (const i of visibles) (g[`${i.lat.toFixed(5)},${i.lng.toFixed(5)}`] ||= []).push(i);
    return Object.values(g);
  }, [visibles]);

  if (erreur) return <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-rose-600 p-8 text-center">{erreur}</div>;
  if (!data) return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 gap-3">
      <Loader2 className="animate-spin text-blue-600" size={36} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement des tournages…</p>
    </div>
  );

  return (
    <div className="w-full h-full relative">
      <div className="absolute z-[1000] top-4 left-4 right-4 flex flex-wrap gap-2 pointer-events-none">
        {(Object.keys(CATS) as Cat[]).map((k) => {
          const C = CATS[k]; const on = actifs[k];
          return (
            <button key={k} onClick={() => setActifs({ ...actifs, [k]: !on })} className={`pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold shadow-md transition-all ${on ? 'bg-white text-slate-800 border-slate-200' : 'bg-slate-100/90 text-slate-400 border-slate-200'}`}>
              <span className="w-3 h-3 rounded-full border-2" style={{ borderColor: C.color, background: on ? C.color : 'transparent' }} />
              <C.icon size={14} /> {C.label}
              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] tabular-nums text-slate-600">{compte[k]}</span>
            </button>
          );
        })}
        {sansPosition > 0 && <span className="pointer-events-auto px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800 shadow-md">{sansPosition} élément(s) sans position sur la carte</span>}
      </div>

      <MapContainer center={[48.812, 2.385]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Polygon positions={IVRY} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.05, weight: 2, dashArray: '5, 10' }} />
        {groupes.map((g) => {
          const first = g[0];
          return (
            <Marker key={g.map((i) => i.key).join('|')} position={[first.lat, first.lng]} icon={pin(CATS[first.cat].color, g.length, first.cat === 'DEMANDE')}>
              <Tooltip direction="right" opacity={1} className="tournage-tooltip">
                <div className="space-y-2" style={{ width: 240 }}>
                  {g.slice(0, 3).map((i, n) => <div key={i.key} className={n ? 'pt-2 border-t border-slate-200' : ''}><Detail it={i} /></div>)}
                  {g.length > 3 && <p className="text-[10px] text-slate-500">… et {g.length - 3} autre(s) — cliquez pour tout voir</p>}
                </div>
              </Tooltip>
              <Popup className="custom-popup">
                <div className="p-4 space-y-3 min-w-[240px] max-w-[300px] max-h-[360px] overflow-y-auto">
                  {g.map((i, n) => (
                    <div key={i.key} className={n ? 'pt-3 border-t border-slate-100 space-y-2' : 'space-y-2'}>
                      <Detail it={i} />
                      <button
                        onClick={() => router.push(i.cat === 'DEMANDE' ? `/dashboard/tournages/demandes?id=${i.data.id}` : `/dashboard/occupations/${i.data.id}`)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest"
                      >
                        {i.cat === 'DEMANDE' ? 'Ouvrir la demande' : 'Accéder au dossier'}
                      </button>
                    </div>
                  ))}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper { border-radius: 1.5rem; padding: 0; overflow: hidden; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); }
        .custom-popup .leaflet-popup-content { margin: 0; }
        .tournage-tooltip { min-width: 240px; max-width: 280px; border-radius: 12px; padding: 10px 12px; white-space: normal; border: 1px solid #e2e8f0; box-shadow: 0 10px 20px rgba(15,23,42,.15); }
        .leaflet-container { background-color: #f8fafc !important; }
      `}</style>
    </div>
  );
}
