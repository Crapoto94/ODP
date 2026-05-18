import React, { useState } from 'react';
import { Pencil, Trash2, RefreshCw, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import CommerceDispositivesManager from '@/components/CommerceDispositivesManager';
import CommerceDegrevementManager from '@/components/CommerceDegrevementManager';
import DegrevementModal from '@/components/DegrevementModal';

interface Props {
  selectedYear: number | null;
  occupations: any[];
  tiersId: number;
  fetchCommerceDetails: () => Promise<void>;
  fetchOccupations: (year: number) => Promise<void>;
  setEditingLigne: (ligne: any) => void;
  setIsLigneModalOpen: (open: boolean) => void;
  onRenew?: () => void;
  dispositifsByYear?: Record<number, any[]>;
  isFactured?: boolean;
}

export default function CommerceDispositifsList({
  selectedYear,
  occupations,
  tiersId,
  fetchCommerceDetails,
  fetchOccupations,
  setEditingLigne,
  setIsLigneModalOpen,
  onRenew,
  dispositifsByYear = {},
  isFactured = false
}: Props) {
  const [showOld, setShowOld] = React.useState(false);
  const [editingDegrèvement, setEditingDegrèvement] = useState<any>(null);
  const [isDegrevementModalOpen, setIsDegrevementModalOpen] = useState(false);

  const isAnyFactured = occupations.some((o: any) =>
    ['FACTURE', 'FACTURÉ', 'TITRE', 'TITRÉ', 'CLOS', 'PAYE', 'PAYÉ'].includes(o.statut)
  );

  // Current active lines
  const currentLines = occupations.flatMap((occ: any) =>
    (occ.lignes || []).filter((ligne: any) => !ligne.deletedAt)
  );

  // Calculer le montant total de la facture (sans les dégrèvements)
  const totalFactureAmount = currentLines
    .filter(ligne => ligne.article?.designation !== 'DEGRÈVEMENT' && ligne.montant >= 0)
    .reduce((sum, ligne) => sum + (ligne.montant || 0), 0);

  // Find devices from ALL previous years that are missing in N
  const oldDispositifs = React.useMemo(() => {
    if (!selectedYear || !dispositifsByYear) return [];
    
    // 1. Get all unique designations from previous years
    const pastMap = new Map<string, any>();
    const pastYears = Object.keys(dispositifsByYear)
      .map(Number)
      .filter(y => y < selectedYear)
      .sort((a, b) => a - b); // Ascending to let later years overwrite

    pastYears.forEach(year => {
      const lines = dispositifsByYear[year] || [];
      lines.forEach(line => {
        const designation = line.designation || line.nom;
        if (designation) {
          pastMap.set(designation, { ...line, designation, year });
        }
      });
    });

    // 2. Filter out those present in current year
    const currentDesignations = new Set(currentLines.map(l => l.article?.designation));
    
    const missing = Array.from(pastMap.values()).filter(p => !currentDesignations.has(p.designation));
    
    return missing.sort((a, b) => b.year - a.year); // Show most recent "disappeared" first
  }, [selectedYear, dispositifsByYear, currentLines]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">
            Dispositifs {selectedYear && `(${selectedYear})`}
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {occupations.reduce((acc, occ) => acc + (occ.lignes?.filter((l: any) => !l.deletedAt).length || 0), 0)} dispositif{occupations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedYear && onRenew && (
            <button
              onClick={onRenew}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 transition-all border border-blue-100 shadow-sm"
              title={`Reconduire les dispositifs de ${selectedYear} vers ${selectedYear + 1}`}
            >
              <RefreshCw size={16} />
              Reconduire vers {selectedYear + 1}
            </button>
          )}
          {!isFactured && selectedYear && occupations.length > 0 && (
            <>
              <CommerceDispositivesManager
                tiersId={tiersId}
                selectedYear={selectedYear}
                onDispositivesAdded={() => {
                  fetchCommerceDetails();
                  if (selectedYear) fetchOccupations(selectedYear);
                }}
              />
              <CommerceDegrevementManager
                tiersId={tiersId}
                selectedYear={selectedYear}
                occupationId={occupations[0]?.id || 0}
                onDegrevementAdded={() => {
                  console.log('[CommerceDispositifsList] onDegrevementAdded callback triggered');
                  fetchCommerceDetails();
                  if (selectedYear) {
                    console.log('[CommerceDispositifsList] Calling fetchOccupations for year', selectedYear);
                    fetchOccupations(selectedYear);
                  }
                }}
              />
            </>
          )}
        </div>
      </div>

      {selectedYear && occupations.length > 0 && (
        <div className="space-y-4 bg-slate-50 rounded-xl p-6">
          <h3 className="text-lg font-black text-slate-900">Détail des dispositifs</h3>
          <div className="space-y-3">
            {occupations.flatMap((occ: any) =>
              (occ.lignes || []).filter((ligne: any) => !ligne.deletedAt).map((ligne: any) => {
                const isFactured = ['FACTURE', 'FACTURÉ', 'TITRE', 'TITRÉ', 'CLOS', 'PAYE', 'PAYÉ'].includes(occ.statut);
                const isDegrèvement = ligne.article?.designation === 'DEGRÈVEMENT' || ligne.montant < 0;
                return (
                  <div
                    key={ligne.id}
                    className={`rounded-lg border p-4 flex items-center justify-between transition-opacity ${
                      isDegrèvement
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-white border-slate-200'
                    } ${isFactured ? 'opacity-50 grayscale-[0.5]' : ''}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {isDegrèvement ? (
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-emerald-200 text-emerald-700 rounded-full text-sm font-black">
                              DÉGRÈVEMENT
                            </span>
                            <p className="font-bold text-emerald-900">{ligne.note}</p>
                          </div>
                        ) : (
                          <p className="font-bold text-slate-900">{ligne.article?.designation}</p>
                        )}
                        {isFactured && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase tracking-tighter">Facturé</span>
                        )}
                      </div>
                      {isDegrèvement ? (
                        <div className="mt-4 pt-4 border-t border-emerald-100">
                          <div className="space-y-2">
                            <div>
                              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Montant déduit</span>
                              <p className="text-lg font-black text-emerald-700">
                                -{Math.abs(ligne.montant).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                              </p>
                            </div>
                            {ligne.note && (
                              <div className="mt-2">
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Description</span>
                                <p className="text-xs font-medium text-emerald-800 leading-relaxed">
                                  {ligne.note}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-slate-50">
                          <div className="flex gap-4">
                            {ligne.photos && (
                              <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0 group relative">
                                <img
                                  src={ligne.photos.split(',').filter(Boolean).pop()}
                                  alt="Dispositif"
                                  className="w-full h-full object-cover transition-transform group-hover:scale-110 cursor-pointer"
                                  onClick={() => window.open(ligne.photos.split(',').filter(Boolean).pop(), '_blank')}
                                />
                              </div>
                            )}
                            <div className="space-y-3 flex-1">
                              <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Calcul du montant</span>
                                <p className="text-sm font-black text-slate-900 flex flex-wrap items-center gap-1 sm:gap-2">
                                  <span className="px-2 py-1 bg-slate-100 rounded-lg text-slate-600">{ligne.quantite1} m²</span>
                                  <span className="text-slate-300">à</span>
                                  <span className="px-2 py-1 bg-blue-50 rounded-lg text-blue-600">{(ligne.article?.montant || 0).toLocaleString('fr-FR')}€</span>
                                  <span className="text-slate-300">=</span>
                                  <span className="text-blue-700 font-extrabold">{(ligne.quantite1 * (ligne.article?.montant || 0)).toLocaleString('fr-FR')}€</span>
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Période d'occupation</span>
                                <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                  {ligne.dateDebut ? new Date(ligne.dateDebut).toLocaleDateString('fr-FR') : '-'}
                                  <span className="text-slate-300">→</span>
                                  {ligne.dateFin ? new Date(ligne.dateFin).toLocaleDateString('fr-FR') : '-'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            {ligne.note && (
                              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 w-full h-full">
                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-1">Commentaire</span>
                                <p className="text-xs font-medium text-amber-800 leading-relaxed italic">
                                  "{ligne.note}"
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {!isFactured && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (isDegrèvement) {
                              setEditingDegrèvement(ligne);
                              setIsDegrevementModalOpen(true);
                            } else {
                              setEditingLigne(ligne);
                              setIsLigneModalOpen(true);
                            }
                          }}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                          title="Éditer"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Supprimer ce dispositif?')) {
                              try {
                                await axios.delete(`/api/occupations/${occ.id}/lignes/${ligne.id}`);
                                if (selectedYear) fetchOccupations(selectedYear);
                              } catch (err) {
                                console.error('Erreur suppression:', err);
                                alert('Erreur lors de la suppression du dispositif');
                              }
                            }
                          }}
                          className="p-2 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Anciens dispositifs (N-1) */}
      {oldDispositifs.length > 0 && (
        <div className="mt-8 border-t border-slate-100 pt-6">
          <button
            onClick={() => setShowOld(!showOld)}
            className="flex items-center justify-between w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500">
                <Clock size={20} />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-900">Anciens dispositifs (Historique)</h4>
                <p className="text-xs text-slate-500">{oldDispositifs.length} dispositif{oldDispositifs.length > 1 ? 's' : ''} non reconduit{oldDispositifs.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            {showOld ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
          </button>

          {showOld && (
            <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
              {oldDispositifs.map((old, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/30 flex items-center justify-between opacity-70">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-700">{old.designation}</p>
                    <p className="text-xs text-slate-400 mt-1">Dernière présence en {old.year}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-500">
                      {old.count} {old.unite || 'unité(s)'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal pour éditer un dégrèvement */}
      <DegrevementModal
        isOpen={isDegrevementModalOpen}
        onClose={() => setIsDegrevementModalOpen(false)}
        onSave={() => {
          fetchCommerceDetails();
          if (selectedYear) fetchOccupations(selectedYear);
          setIsDegrevementModalOpen(false);
        }}
        occupationId={occupations[0]?.id || 0}
        initialData={editingDegrèvement}
        maxMontant={totalFactureAmount}
      />
    </div>
  );
}
