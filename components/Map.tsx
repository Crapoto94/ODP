"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { useRouter } from 'next/navigation';

// Safe icon helper that always returns something valid if on window
const getIcon = (isTier: boolean) => {
  if (typeof window === 'undefined') return undefined;
  
  return L.icon({
    iconUrl: isTier 
      ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png'
      : 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
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
}

export default function SigMap({ occupations = [], tiers = [] }: { occupations: any[], tiers?: any[] }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [markers, setMarkers] = useState<MarkerData[]>([]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const defaultIcon = getIcon(false);
      if (defaultIcon) {
        L.Marker.prototype.options.icon = defaultIcon;
      }
    }
  }, []);

  // Sync and geocode on the fly
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

    // Identify items needing geocoding (skip [NON-DIFFUSIBLE])
    const itemsToGeocode = allItems.filter(item => 
      (!item.latitude || !item.longitude) && 
      item.adresse && 
      !item.adresse.includes('[NON-DIFFUSIBLE]')
    );

    if (itemsToGeocode.length > 0) {
      itemsToGeocode.forEach(async (item) => {
        try {
          const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(item.adresse)}&limit=1`);
          const data = await res.json();
          if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].geometry.coordinates;
            setMarkers(prev => prev.map(m => 
              m.id === item.id ? { ...m, latitude: lat, longitude: lng } : m
            ));
            
            // Background update to DB (fire and forget)
            const endpoint = item.isTier ? `/api/tiers/${item.id.toString().replace('tier-', '')}` : `/api/occupations/${item.id.toString().replace('occ-', '')}`;
            // Note: We'd need specific update endpoints for tiers, or stick to occupations for now
            if (!item.isTier) {
              fetch(endpoint, {
                method: 'PATCH',
                body: JSON.stringify({ latitude: lat, longitude: lng }),
                headers: { 'Content-Type': 'application/json' }
              }).catch(() => {});
            }
          }
        } catch (err) {
          console.error('Geocoding error for', item.adresse, err);
        }
      });
    }
  }, [mounted, occupations, tiers]);

  if (!mounted || typeof window === 'undefined') return (
    <div className="w-full h-full bg-slate-50 flex items-center justify-center">
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Chargement de la carte...</p>
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
  
  const mapCenter: [number, number] = validMarkers.length > 0 
    ? [validMarkers[0].latitude!, validMarkers[0].longitude!]
    : [48.812, 2.385]; 

  return (
    <div className="w-full h-full rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl">
      <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Polygon 
          positions={ivryCoords} 
          pathOptions={{ 
            color: '#3b82f6', 
            fillColor: '#3b82f6', 
            fillOpacity: 0.1,
            weight: 3,
            dashArray: '5, 10'
          }} 
        />

        {validMarkers.map((marker) => (
          <Marker 
            key={marker.id} 
            position={[marker.latitude!, marker.longitude!]}
            icon={getIcon(!!marker.isTier)}
            eventHandlers={{
              dblclick: () => !marker.isTier && router.push(`/dashboard/occupations/${(marker as any).rawId}`)
            }}
          >
            <Popup>
              <div className="p-2 min-w-[150px]">
                <p className="font-black text-slate-900 border-b border-slate-100 pb-1 mb-1">{marker.nom}</p>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${marker.isTier ? 'text-slate-500' : 'text-blue-600'}`}>
                  {marker.type}
                </p>
                <p className="text-[10px] font-black text-slate-400 mt-1">{marker.adresse}</p>
                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                   <div className="flex items-center gap-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        marker.statut === 'VALIDE' || marker.statut === 'DEFINITIF' ? 'bg-emerald-500' : 'bg-amber-500 shadow-sm shadow-amber-500/50'
                      }`}></div>
                      <span className="text-[9px] font-black uppercase text-slate-500">{marker.statut}</span>
                   </div>
                   {!marker.isTier && (
                     <button 
                       onClick={() => router.push(`/dashboard/occupations/${(marker as any).rawId}`)}
                       className="text-[9px] font-black text-blue-600 uppercase hover:underline"
                     >
                       Voir la fiche
                     </button>
                   )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
