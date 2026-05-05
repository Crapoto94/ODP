"use client";

import React, { use, useState, useEffect } from 'react';
import { Loader2, Store, MapPin, Mail, Phone, ArrowLeft, Calendar, Clock, Plus, Trash2, Pencil } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import CommerceDispositivesManager from '@/components/CommerceDispositivesManager';
import LigneArticleModal from '@/components/LigneArticleModal';

interface Props {
  params: Promise<{ id: string }>;
}

export default function CommerceDetailPage({ params }: Props) {
  const { id: paramId } = use(params);
  const [commerce, setCommerce] = useState<any>(null);
  const [dispositifsByYear, setDisposifsByYear] = useState<any>({});
  const [years, setYears] = useState<number[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [occupations, setOccupations] = useState<any[]>([]);
  const [editingLigne, setEditingLigne] = useState<any>(null);
  const [isLigneModalOpen, setIsLigneModalOpen] = useState(false);

  const fetchCommerceDetails = async () => {
    try {
      const res = await axios.get(`/api/commerces/${paramId}`);
      setCommerce(res.data.commerce);
      setDisposifsByYear(res.data.dispositifsByYear);
      setYears(res.data.years);
      setTimeline(res.data.timeline || []);
      setChartData(res.data.chartData || []);
      if (res.data.years.length > 0) {
        setSelectedYear(res.data.years[0]);
      }
    } catch (err) {
      console.error('Failed to fetch commerce details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOccupations = async (year: number) => {
    try {
      const res = await axios.get('/api/occupations', {
        params: {
          type: 'COMMERCE',
          anneeTaxation: year
        }
      });
      const commerceOccs = (res.data || []).filter((occ: any) => occ.tiersId === parseInt(paramId));
      setOccupations(commerceOccs);
    } catch (err) {
      console.error('Failed to fetch occupations:', err);
    }
  };

  useEffect(() => {
    if (paramId) {
      fetchCommerceDetails();
    }
  }, [paramId]);

  useEffect(() => {
    if (selectedYear) {
      fetchOccupations(selectedYear);
    }
  }, [selectedYear]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement du commerce...</p>
      </div>
    );
  }

  if (!commerce) {
    return (
      <div className="text-center py-20">
        <p className="text-xl font-bold text-slate-900">Commerce non trouvé</p>
        <Link href="/dashboard/commerces" className="text-blue-600 hover:underline mt-4 inline-block">Retour à la liste</Link>
      </div>
    );
  }

  const displayedDispositions = selectedYear && dispositifsByYear[selectedYear] ? dispositifsByYear[selectedYear] : [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/commerces"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Store size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">{commerce.nom}</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Tous les dispositifs</p>
          </div>
        </div>
      </div>

      {/* Commerce Info Card */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
        {commerce.adresse && (
          <div className="flex items-start gap-3">
            <MapPin size={20} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Adresse</p>
              <p className="text-sm font-medium text-slate-900">{commerce.adresse}</p>
            </div>
          </div>
        )}

        {commerce.email && (
          <div className="flex items-start gap-3">
            <Mail size={20} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Email</p>
              <p className="text-sm font-medium text-slate-900">{commerce.email}</p>
            </div>
          </div>
        )}

        {commerce.telephone && (
          <div className="flex items-start gap-3">
            <Phone size={20} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Téléphone</p>
              <p className="text-sm font-medium text-slate-900">{commerce.telephone}</p>
            </div>
          </div>
        )}
      </div>

      {/* Year Selector */}
      {years.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-700">Filtrer par année</label>
          <div className="flex flex-wrap gap-2">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  selectedYear === year
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Calendar size={16} />
                {year}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Horizontal */}
      {timeline.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Clock size={20} />
              Historique des modifications
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {timeline.length} événement{timeline.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-min relative pt-8 pb-4">
              {/* Timeline line */}
              <div className="absolute top-4 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-slate-300 rounded-full"></div>

              {/* Timeline events */}
              {timeline.map((event, idx) => {
                const eventDate = new Date(event.date);
                const formattedDate = eventDate.toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });

                const typeColors = {
                  TLPE: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', dot: 'border-purple-500 bg-purple-500' },
                  COMMERCE: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', dot: 'border-blue-500 bg-blue-500' }
                };
                const colors = typeColors[event.type as keyof typeof typeColors] || typeColors.TLPE;

                return (
                  <div key={event.id} className="flex flex-col items-center flex-shrink-0 w-72">
                    {/* Timeline dot */}
                    <div className={`absolute top-0 w-10 h-10 rounded-full border-4 ${colors.dot} shadow-lg flex items-center justify-center z-10`}>
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>

                    {/* Event card */}
                    <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-4 space-y-3 mt-12 h-full`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${colors.text}`}>
                            {event.type}
                          </span>
                          <span className="text-xs font-bold text-slate-600 bg-white/60 px-2 py-1 rounded">'{String(event.year).slice(-2)}</span>
                        </div>
                        <p className="text-xs text-slate-500">{formattedDate}</p>
                      </div>

                      {/* Dispositifs count */}
                      {event.dispositifs.length > 0 && (
                        <div className="bg-white/60 rounded-lg p-3 space-y-2">
                          <p className="text-xs font-bold text-slate-700">
                            {event.dispositifs.length} dispositif{event.dispositifs.length !== 1 ? '' : ''}
                          </p>
                          <ul className="space-y-1">
                            {event.dispositifs.slice(0, 2).map((disp: any, dispIdx: number) => (
                              <li key={dispIdx} className="flex items-start gap-2 text-xs text-slate-700">
                                <Plus size={12} className="text-green-600 shrink-0 mt-0.5" />
                                <span className="font-medium line-clamp-2">{disp.nom}</span>
                              </li>
                            ))}
                            {event.dispositifs.length > 2 && (
                              <li className="text-xs font-bold text-slate-600 pt-1">
                                +{event.dispositifs.length - 2}
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Chart - Montants facturés par année */}
      {chartData.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Montants facturés par année</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Total et montants facturés</p>
          </div>

          {/* Check if we have any non-zero amounts */}
          {chartData.every((d: any) => d.total === 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-bold text-amber-900">
                ⚠️ Pas de montants définis pour ces dossiers
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Les montants des articles ne sont pas configurés ou les tarifs sont en erreur (ERREUR_TARIF).
                Veuillez vérifier la configuration des tarifs.
              </p>
            </div>
          )}
          <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
            {/* Legend */}
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs font-bold text-slate-700">Facturé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <span className="text-xs font-bold text-slate-700">Non facturé</span>
              </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(year) => `'${String(year).slice(-2)}`}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload;
                      const notBilled = (data.amount || 0) - (data.billed || 0);
                      return (
                        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
                          <p className="text-xs font-bold text-slate-900">Année {data.year}</p>
                          <p className="text-xs text-green-700 font-bold">
                            ✓ Facturé: {(data.billed || 0).toFixed(2)}€
                          </p>
                          <p className="text-xs text-amber-700 font-bold">
                            ✗ Non facturé: {notBilled.toFixed(2)}€
                          </p>
                          <p className="text-xs font-bold text-slate-900 mt-1">
                            Total: {(data.amount || 0).toFixed(2)}€
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {data.billedPercentage}% facturé
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="billed" stackId="amount" fill="#22c55e" name="Facturé" radius={[8, 8, 0, 0]} />
                <Bar dataKey="notBilled" stackId="amount" fill="#fbbf24" name="Non facturé" radius={[8, 8, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Status breakdown */}
            <div className="grid grid-cols-2 gap-4">
              {chartData.map((item, idx) => (
                <div key={idx} className="text-xs space-y-1">
                  <p className="font-bold text-slate-900">'{String(item.year).slice(-2)}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-slate-600">Facturé: {(item.billed || 0).toFixed(0)}€</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    <span className="text-slate-600">Non: {(item.notBilled || 0).toFixed(0)}€</span>
                  </div>
                  <p className="text-xs text-slate-500 font-bold">{item.billedPercentage}% facturé</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dispositifs List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Dispositifs {selectedYear && `(${selectedYear})`}
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {displayedDispositions.length} dispositif{displayedDispositions.length !== 1 ? 's' : ''}
            </p>
          </div>
          {selectedYear && (
            <CommerceDispositivesManager
              tiersId={parseInt(paramId)}
              selectedYear={selectedYear}
              onDispositivesAdded={fetchCommerceDetails}
            />
          )}
        </div>

        {/* Détail des lignes par occupation */}
        {selectedYear && occupations.length > 0 && (
          <div className="space-y-4 bg-slate-50 rounded-xl p-6">
            <h3 className="text-lg font-black text-slate-900">Détail des dispositifs</h3>
            <div className="space-y-3">
              {occupations.flatMap((occ: any) =>
                (occ.lignes || []).filter((ligne: any) => !ligne.deletedAt).map((ligne: any) => (
                  <div
                    key={ligne.id}
                    className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{ligne.article?.designation}</p>
                      <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-slate-600">
                        <div>
                          <span className="text-xs font-bold text-slate-400">Quantité</span>
                          <p className="font-bold text-slate-900">{ligne.quantite1}</p>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-400">Montant</span>
                          <p className="font-bold text-slate-900">{(ligne.quantite1 * (ligne.article?.montant || 0)).toFixed(2)} €</p>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-400">Période</span>
                          <p className="font-bold text-slate-900">
                            {ligne.dateDebut ? new Date(ligne.dateDebut).toLocaleDateString('fr-FR') : '-'}
                            {' à '}
                            {ligne.dateFin ? new Date(ligne.dateFin).toLocaleDateString('fr-FR') : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingLigne(ligne);
                          setIsLigneModalOpen(true);
                        }}
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                        title="Éditer"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Supprimer ce dispositif?')) {
                            axios.delete(`/api/occupations/${occ.id}/lignes/${ligne.id}`).then(() => {
                              fetchOccupations(selectedYear);
                            });
                          }
                        }}
                        className="p-2 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {displayedDispositions.length === 0 ? (
          <div className="text-center py-12">
            <Store size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Aucun dispositif pour cette année</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedDispositions.map((disp: any, idx: number) => (
              <div
                key={idx}
                className="bg-white rounded-lg border border-slate-100 p-4 flex items-center justify-between hover:border-blue-200 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{disp.nom}</p>
                  <div className="flex gap-2 mt-2">
                    {disp.occupationTypes?.map((type: string) => (
                      <span
                        key={type}
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          type === 'TLPE'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-black bg-slate-100 text-slate-700">
                    {disp.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for editing ligne */}
        {editingLigne && selectedYear && (
          <LigneArticleModal
            isOpen={isLigneModalOpen}
            onClose={() => {
              setIsLigneModalOpen(false);
              setEditingLigne(null);
            }}
            onSave={() => {
              setIsLigneModalOpen(false);
              setEditingLigne(null);
              fetchOccupations(selectedYear);
            }}
            occupationId={editingLigne.occupationId}
            annee={selectedYear}
            defaultDates={{
              start: new Date(selectedYear, 0, 1).toISOString().split('T')[0],
              end: new Date(selectedYear, 11, 31).toISOString().split('T')[0]
            }}
            initialData={editingLigne}
            occupationType="COMMERCE"
          />
        )}
      </div>
    </div>
  );
}
