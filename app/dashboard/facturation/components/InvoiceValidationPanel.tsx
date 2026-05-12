'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import axios from 'axios';

interface ValidationError {
  type: 'margin' | 'color' | 'font' | 'transparency' | 'alignment' | 'format';
  severity: 'error' | 'warning';
  message: string;
  element?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  report: string;
  templateName: string;
}

interface Props {
  occupationId?: number;
  tiersId?: number;
  annee?: number;
  onClose?: () => void;
}

export default function InvoiceValidationPanel({ occupationId, tiersId, annee, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleValidate = async () => {
    if (!occupationId && !tiersId) return;

    setLoading(true);
    try {
      const res = await axios.post('/api/invoice/validate', {
        occupationId,
        tiersId,
        annee
      });

      setResult(res.data);
      setShowDetails(true);
    } catch (err: any) {
      console.error('Validation error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!showDetails && !result) {
    return (
      <button
        onClick={handleValidate}
        disabled={loading}
        className="text-xs font-bold px-3 py-2 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all disabled:opacity-50"
      >
        {loading ? '⏳ Validation...' : '🔍 Valider la conformité'}
      </button>
    );
  }

  if (!result) return null;

  const errorCount = result.errors.filter(e => e.severity === 'error').length;
  const warningCount = result.errors.filter(e => e.severity === 'warning').length;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`p-6 border-b ${result.valid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {result.valid ? (
                <>
                  <CheckCircle2 className="text-emerald-600" size={28} />
                  <div>
                    <h2 className="font-black text-emerald-900">✅ Facture Conforme</h2>
                    <p className="text-xs text-emerald-700 font-bold">Gabarit: {result.templateName}</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="text-red-600" size={28} />
                  <div>
                    <h2 className="font-black text-red-900">⚠️ Défauts Détectés</h2>
                    <p className="text-xs text-red-700 font-bold">{errorCount} erreur(s), {warningCount} avertissement(s)</p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={onClose || (() => setResult(null))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-auto flex-1 p-6 space-y-4">
          {result.valid ? (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded">
              <p className="text-sm font-bold text-emerald-800">
                La facture respecte toutes les contraintes du cahier des charges ASAP-ORMC.
              </p>
              <ul className="text-xs text-emerald-700 mt-2 space-y-1 ml-4">
                <li>✓ Marges techniques: 4mm sur chaque côté</li>
                <li>✓ Zones réservées respectées</li>
                <li>✓ Couleurs en niveaux de gris uniquement</li>
                <li>✓ Pas de transparence</li>
                <li>✓ Polices conformes</li>
                <li>✓ Format A4 portrait 210 x 297mm</li>
              </ul>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {result.errors.map((error, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-l-4 ${
                      error.severity === 'error'
                        ? 'bg-red-50 border-red-500 text-red-900'
                        : 'bg-yellow-50 border-yellow-500 text-yellow-900'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {error.severity === 'error' ? (
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 text-xs">
                        <p className="font-bold">{error.message}</p>
                        {error.element && (
                          <p className="text-[10px] opacity-75">Élément: {error.element}</p>
                        )}
                        {error.x !== undefined && (
                          <p className="text-[10px] opacity-75">
                            Position: ({error.x.toFixed(1)}, {error.y?.toFixed(1) || '?'}) pt
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommandations */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-6">
                <h3 className="font-bold text-blue-900 text-xs mb-2">📋 Actions Recommandées</h3>
                <ul className="text-xs text-blue-800 space-y-1 ml-4">
                  <li>• Ajuster les positions des éléments pour respecter les marges</li>
                  <li>• Convertir les couleurs non-gris en niveaux de gris</li>
                  <li>• Vérifier que les polices sont TrueType incorporées</li>
                  <li>• Supprimer les éléments transparents</li>
                  <li>• Générer le PDF en format PDF/A-1a</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex justify-between">
          <button
            onClick={() => {
              const lines = result.report.split('\n');
              console.log(lines.join('\n'));
              alert('Rapport copié dans la console (F12)');
            }}
            className="text-xs font-bold px-3 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition-all"
          >
            📋 Copier le rapport
          </button>
          <button
            onClick={onClose || (() => setResult(null))}
            className="text-xs font-bold px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
