import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Info, ChevronLeft } from 'lucide-react';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface MapDashboardProps {
  occupations: any[];
  onClose: () => void;
  onSelectDossier: (id: number) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
}

const MARKER_COLORS: Record<string, string> = {
  CHANTIER:  '#f59e0b', // Amber
  COMMERCE:  '#10b981', // Emerald
  TOURNAGE:  '#f43f5e', // Rose
  EVENEMENT: '#3b82f6', // Blue
};

const createCustomIcon = (type: string, count: number) => {
  const color = MARKER_COLORS[type] || '#8b5cf6'; // Violet default
  return L.divIcon({
    className: 'custom-pin',
    html: `
      <div style="position: relative;">
        <div style="
          background-color: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        ">
          <div style="
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
        ${count > 1 ? `
          <div style="
            position: absolute;
            top: -10px;
            right: -10px;
            background: #ef4444;
            color: white;
            font-size: 11px;
            font-weight: 900;
            width: 20px;
            height: 20px;
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
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMapEvents({});
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function MapEvents({ occupations, onCountChange }: { occupations: any[]; onCountChange: (count: number) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      const count = occupations.filter(o => bounds.contains([o.latitude, o.longitude])).length;
      onCountChange(count);
    },
  });

  useEffect(() => {
    const bounds = map.getBounds();
    const count = occupations.filter(o => bounds.contains([o.latitude, o.longitude])).length;
    onCountChange(count);
  }, [map, occupations, onCountChange]);

  return null;
}

export function MapDashboard({ occupations, onClose, onSelectDossier, initialCenter, initialZoom }: MapDashboardProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const validOccupations = occupations.filter(o => o.latitude && o.longitude);
  const grouped = validOccupations.reduce((acc, o) => {
    const key = `${o.latitude},${o.longitude}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(o);
    return acc;
  }, {} as Record<string, any[]>);

  const defaultCenter: [number, number] = initialCenter || [48.812, 2.394]; // Ivry-sur-Seine
  const defaultZoom = initialZoom || 14;

  return (
    <div className="fixed inset-0 z-[60] bg-[var(--bg)] flex flex-col font-sans animate-in fade-in duration-300">
      {/* Header overlay */}
      <div className="absolute top-6 left-6 right-6 z-[1000] pointer-events-none flex justify-between items-start">
        <div className="bg-white px-6 py-4 rounded-3xl flex items-center gap-4 border-white/20 shadow-2xl pointer-events-auto">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
            <MapPin size={22} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-black">Cartographie</h2>
            <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest">{visibleCount} dossiers visibles</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="flex items-center gap-3 px-14 py-7 bg-white rounded-[2.5rem] text-black transition-all shadow-2xl border-white/30 pointer-events-auto active:scale-90 font-black uppercase tracking-widest text-lg"
        >
          <ChevronLeft size={32} strokeWidth={5} />
          <span>Retour</span>
        </button>
      </div>

      <MapContainer 
        center={defaultCenter} 
        zoom={defaultZoom} 
        className="flex-1 w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapEvents occupations={validOccupations} onCountChange={setVisibleCount} />
        {initialCenter && <ChangeView center={initialCenter} zoom={defaultZoom} />}

        {Object.entries(grouped).map(([key, group]: [string, any]) => {
          const [lat, lng] = key.split(',').map(Number);
          const first = group[0];
          
          return (
            <Marker 
              key={key} 
              position={[lat, lng]}
              icon={createCustomIcon(first.type, group.length)}
            >
              <Popup className="custom-popup">
                <div className="p-3 space-y-3 min-w-[200px] max-w-[300px] max-h-[300px] overflow-y-auto custom-scrollbar">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                    {group.length > 1 ? `${group.length} DOSSIERS À CETTE ADRESSE` : 'DÉTAILS DU DOSSIER'}
                  </p>
                  
                  {group.map((o: any, i: number) => (
                    <div key={o.id} className={`${i > 0 ? 'pt-3 border-t border-slate-50' : ''} space-y-2`}>
                      <h3 className="font-black text-sm text-slate-800 leading-tight">{o.nom || o.tiers?.nom}</h3>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{o.type} · #{o.id}</p>
                      <button 
                        onClick={() => onSelectDossier(o.id)}
                        className="w-full py-2.5 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform"
                      >
                        <Info size={14} /> Voir le dossier
                      </button>
                    </div>
                  ))}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <style>{`
        .leaflet-container {
          background: #0d0d1a !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 1rem;
          padding: 0;
          overflow: hidden;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
