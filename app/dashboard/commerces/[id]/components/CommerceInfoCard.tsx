import React from 'react';
import { MapPin, Mail, Phone, Calendar, ExternalLink, Navigation, Building2, Pencil, AlertCircle } from 'lucide-react';

interface Props {
  commerce: any;
  selectedYear: number | null;
  totalAmount: number;
  occupations?: any[];
  allTiers?: any[];
  onUpdateAgissantPour?: (occupationId: number, agissantPourId: string) => void;
  onUpdateAddress?: (occupationId: number, newAddress: string) => void;
  onUpdatePhoto?: (photoUrl: string) => void;
  onChangeTiersClick?: () => void;
}

export default function CommerceInfoCard({ 
  commerce, 
  selectedYear, 
  totalAmount,
  occupations = [],
  allTiers = [],
  onUpdateAgissantPour,
  onUpdateAddress,
  onUpdatePhoto,
  onChangeTiersClick
}: Props) {
  if (!commerce) return null;

  React.useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      if (!onUpdatePhoto) return;
      const activeEl = document.activeElement;
      // If the user is typing in an input or textarea, don't hijack paste
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const formData = new FormData();
            formData.append('file', file);
            try {
              const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              });
              const data = await res.json();
              if (data.url) {
                onUpdatePhoto(data.url);
              }
            } catch (err) {
              console.error('Failed to upload pasted image:', err);
            }
          }
        }
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, [onUpdatePhoto]);

  const currentOccupation = occupations.find(o => o.anneeTaxation === selectedYear);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
      {/* Tiers / Commerce Name Section */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
          <Building2 size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Détails de l'établissement</p>
          <h3 className="text-xl font-black text-slate-900 truncate">{commerce.nom}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
              ID: {commerce.id}
            </span>
            {commerce.code_sedit && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">
                SEDIT: {commerce.code_sedit}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
        {/* Left Column: Coordinates & Contact */}
        <div className="space-y-6">
          {commerce.adresse && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adresse</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 leading-tight">
                      {currentOccupation?.adresse || commerce.adresse}
                    </p>
                    {currentOccupation && onUpdateAddress && (
                      <button
                        onClick={() => {
                          const newAddr = prompt('Nouvelle adresse pour ce dossier :', currentOccupation.adresse || commerce.adresse);
                          if (newAddr !== null && newAddr !== (currentOccupation.adresse || commerce.adresse)) {
                            onUpdateAddress(currentOccupation.id, newAddr);
                          }
                        }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors"
                        title="Modifier l'adresse pour ce dossier uniquement"
                      >
                        <Pencil size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pl-8">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(commerce.adresse)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm group"
                >
                  <Navigation size={12} className="group-hover:text-blue-600" />
                  Google Maps
                </a>
                {commerce.latitude && commerce.longitude && (
                  <a
                    href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${commerce.latitude},${commerce.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm group"
                  >
                    <ExternalLink size={12} className="group-hover:text-emerald-600" />
                    Street View
                  </a>
                )}
              </div>
              
              {/* Commerce Photo Display */}
              <div className="pl-8 pt-2">
                {commerce.photo ? (
                  <div className="relative group w-full max-w-[200px]">
                    <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 cursor-pointer">
                      <img 
                        src={commerce.photo} 
                        alt="Etablissement" 
                        className="w-full h-full object-cover"
                        onClick={(e) => { e.stopPropagation(); window.open(commerce.photo, '_blank'); }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl pointer-events-none">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest text-center px-2">Ctrl+V pour<br/>remplacer</p>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="w-full max-w-[200px] aspect-video rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-400 transition-colors"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-center px-2 text-slate-500">Photo</p>
                    <p className="text-[9px] font-bold text-slate-400">Ctrl+V (Coller)</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {commerce.email && (
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                  <p className="text-xs font-bold text-slate-900 truncate">{commerce.email}</p>
                </div>
              </div>
            )}
            {commerce.telephone && (
              <div className="flex items-start gap-3">
                <Phone size={18} className="text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Téléphone</p>
                  <p className="text-xs font-bold text-slate-900 truncate">{commerce.telephone}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Billing & Amount */}
        <div className="space-y-6">
          {/* Billing Tier Selection */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tiers de Facturation</p>
              {currentOccupation && (
                <button
                  onClick={onChangeTiersClick}
                  className="px-2 py-1 bg-white border border-slate-200 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm"
                >
                  Changer
                </button>
              )}
            </div>
            
            {currentOccupation ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Building2 size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-slate-900 truncate">
                        {(() => {
                          if (currentOccupation.agissantPour) {
                            const t = allTiers.find(t => t.id === Number(currentOccupation.agissantPour));
                            return t?.nom || 'Tiers externe';
                          }
                          return commerce.nom;
                        })()}
                      </p>
                      {(() => {
                        const t = currentOccupation.agissantPour 
                          ? allTiers.find(t => t.id === Number(currentOccupation.agissantPour))
                          : commerce;
                        if (t?.etatAdministratif === 'Cessée') {
                          return (
                            <span className="flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded whitespace-nowrap">
                              <AlertCircle size={10} /> Fermé
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {currentOccupation.agissantPour 
                        ? `Code: ${allTiers.find(t => t.id === Number(currentOccupation.agissantPour))?.code_sedit || 'N/A'}`
                        : `Le tiers lui-même (Code: ${commerce.code_sedit || 'N/A'})`}
                    </p>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 font-medium leading-tight">
                  {currentOccupation.agissantPour 
                    ? "La facture sera émise au nom du tiers sélectionné ci-dessus." 
                    : "Par défaut, la facturation s'effectue sur cet établissement."}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Sélectionnez une année pour gérer la facturation</p>
            )}
          </div>

          {selectedYear && (
            <div className="flex items-center justify-between bg-blue-50/50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Montant ({selectedYear})</p>
                  <p className="text-2xl font-black text-slate-900">{totalAmount.toLocaleString('fr-FR')} €</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
