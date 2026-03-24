"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { useRouter } from 'next/navigation';

// Safe icon helper that always returns something valid if on window
const MARKER_COLORS: Record<string, string> = {
  CHANTIER:  '#f59e0b', // Amber
  COMMERCE:  '#10b981', // Emerald
  TOURNAGE:  '#f43f5e', // Rose
  EVENEMENT: '#3b82f6', // Blue
  TIER:      '#64748b', // Slate
};

const STATUS_MAP: Record<string, { label: string }> = {
  'EN_ATTENTE': { label: 'En attente' },
  'EN_COURS': { label: 'En cours' },
  'TERMINE': { label: 'Terminé' },
  'VERIFIE': { label: 'Vérifié' },
  'FACTURE': { label: 'Facturé' },
  'INVOICED': { label: 'Facturé' },
  'PAYE': { label: 'Payé' },
};

const createCustomIcon = (type: string, count: number, isTier: boolean) => {
  const color = isTier ? MARKER_COLORS.TIER : (MARKER_COLORS[type] || '#8b5cf6');
  return L.divIcon({
    className: 'custom-pin',
    html: `
      <div style="position: relative;">
        <div style="
          background-color: ${color};
          width: 28px;
          height: 28px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        ">
          <div style="
            width: 7px;
            height: 7px;
            background: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
        ${count > 1 ? `
          <div style="
            position: absolute;
            top: -8px;
            right: -8px;
            background: #ef4444;
            color: white;
            font-size: 9px;
            font-weight: 900;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 10;
          ">
            ${count}
          </div>
        ` : ''}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

interface MarkerData {
  id: string | number;
  latitude: number | null;
  longitude: number | null;
  adresse: string;
  nom: string;
  type: string;
  statut: string;
  isTier?: boolean;
  rawId: number;
}

export default function SigMap({ occupations = [], tiers = [] }: { occupations: any[], tiers?: any[] }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [markers, setMarkers] = useState<MarkerData[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const allItems: MarkerData[] = [
      ...occupations.map(o => ({
        id: `occ-${o.id}`,
        latitude: o.latitude,
        longitude: o.longitude,
        adresse: o.adresse,
        nom: o.tiers?.nom || o.nom || 'Sans Nom',
        type: o.type,
        statut: o.statut,
        isTier: false,
        rawId: o.id
      })),
      ...tiers.map(t => ({
        id: `tier-${t.id}`,
        latitude: t.latitude,
        longitude: t.longitude,
        adresse: t.adresse,
        nom: t.nom,
        type: 'Établissement',
        statut: t.statut,
        isTier: true,
        rawId: t.id
      }))
    ];

    setMarkers(allItems);
  }, [mounted, occupations, tiers]);

  if (!mounted || typeof window === 'undefined') return (
    <div className="w-full h-full bg-slate-50 flex items-center justify-center">
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Chargement cartographie...</p>
    </div>
  );

  const ivryCoords: [number, number][] = [
    [48.803985830563, 2.3711660804846],
    [48.808032065507, 2.3672229478006],
    [48.816398323996, 2.3642042811729],
    [48.82569232682, 2.3900720145113],
    [48.816675787287, 2.4093609378413],
    [48.808463007472, 2.4088902175713],
    [48.800238582074, 2.3942552313772],
    [48.800295474842, 2.3868918231477],
    [48.805917054142, 2.3756714908057],
    [48.803985830563, 2.3711660804846]
  ];

  const validMarkers = markers.filter(m => typeof m.latitude === 'number' && typeof m.longitude === 'number');
  
  // Group by coordinate
  const grouped = validMarkers.reduce((acc, m) => {
    const key = `${m.latitude!.toFixed(6)},${m.longitude!.toFixed(6)}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {} as Record<string, MarkerData[]>);

  const mapCenter: [number, number] = validMarkers.length > 0 
    ? [validMarkers[0].latitude!, validMarkers[0].longitude!]
    : [48.812, 2.385]; 

  return (
    <div className="w-full h-full">
      <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Polygon 
          positions={ivryCoords} 
          pathOptions={{ 
            color: '#3b82f6', 
            fillColor: '#3b82f6', 
            fillOpacity: 0.05,
            weight: 2,
            dashArray: '5, 10'
          }} 
        />

        {Object.entries(grouped).map(([key, group]) => {
          const first = group[0];
          return (
            <Marker 
              key={key} 
              position={[first.latitude!, first.longitude!]}
              icon={createCustomIcon(first.type, group.length, !!first.isTier)}
            >
              <Popup className="custom-popup">
                <div className="p-4 space-y-4 min-w-[220px] max-w-[300px] max-h-[350px] overflow-y-auto">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                    {group.length > 1 ? `${group.length} ÉLÉMENTS À CETTE ADRESSE` : 'DÉTAILS'}
                  </p>
                  
                  {group.map((m, i) => (
                    <div key={m.id} className={`${i > 0 ? 'pt-4 border-t border-slate-50' : ''} space-y-2`}>
                      <h4 className="font-black text-slate-900 text-sm leading-tight uppercase">{m.nom}</h4>
                      <div className="flex items-center gap-2">
                         <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200`}>
                           {m.type}
                         </span>
                         {!m.isTier && (
                           <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                             m.statut === 'VALIDE' || m.statut === 'FACTURE' || m.statut === 'INVOICED' || m.statut === 'PAYE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                           } border`}>
                             {STATUS_MAP[m.statut]?.label || m.statut}
                           </span>
                         )}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400">{m.adresse}</p>
                      {!m.isTier && (
                        <button 
                          onClick={() => router.push(`/dashboard/occupations/${m.rawId}`)}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                          Accéder au dossier
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 1.5rem;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
        }
        .leaflet-container {
          background-color: #f8fafc !important;
        }
      `}</style>
    </div>
  );
}
