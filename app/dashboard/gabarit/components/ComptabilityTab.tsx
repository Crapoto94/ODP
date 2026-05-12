'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { validateInvoiceElements, ValidationError } from '@/lib/invoice-validator';

interface ComptabilityTabProps {
  elements: any[];
}

export default function ComptabilityTab({ elements }: ComptabilityTabProps) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [validating, setValidating] = useState(false);

  const handleValidate = () => {
    setValidating(true);
    try {
      const validationErrors = validateInvoiceElements(elements);
      setErrors(validationErrors);
    } catch (err) {
      console.error('Validation error:', err);
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    if (elements.length > 0) {
      handleValidate();
    }
  }, [elements]);

  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;
  const isValid = errorCount === 0;

  const groupedErrors = errors.reduce((acc, error) => {
    if (!acc[error.type]) acc[error.type] = [];
    acc[error.type].push(error);
    return acc;
  }, {} as Record<string, ValidationError[]>);

  const typeLabels: Record<string, string> = {
    'margin': '📏 Marges',
    'color': '🎨 Couleurs',
    'font': '🔤 Polices',
    'transparency': '👻 Transparence',
    'alignment': '↗️ Alignement',
    'format': '📄 Format'
  };

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Validation du Gabarit</h2>
          <p className="text-slate-500 font-bold mt-1">Vérifiez la conformité selon le Cahier des Charges ASAP-ORMC</p>
        </div>
        <button
          onClick={handleValidate}
          disabled={validating || elements.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          <RefreshCw size={16} className={validating ? 'animate-spin' : ''} />
          {validating ? 'Validation...' : 'Revalider'}
        </button>
      </div>

      <div className={`p-6 rounded-2xl border-2 ${
        isValid
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            {isValid ? (
              <CheckCircle2 className="text-emerald-600" size={32} />
            ) : (
              <AlertCircle className="text-red-600" size={32} />
            )}
          </div>
          <div>
            <h3 className={`text-lg font-black uppercase tracking-tight ${
              isValid ? 'text-emerald-900' : 'text-red-900'
            }`}>
              {isValid ? '✅ Gabarit Conforme' : '⚠️ Défauts Détectés'}
            </h3>
            {isValid ? (
              <p className="text-emerald-700 font-bold mt-1">
                Le gabarit respecte toutes les contraintes du cahier des charges.
              </p>
            ) : (
              <p className="text-red-700 font-bold mt-1">
                {errorCount} erreur(s), {warningCount} avertissement(s) détecté(s)
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Format A4</p>
          <p className="text-lg font-black text-slate-900">210×297mm</p>
          <p className="text-xs text-slate-500 mt-1">595.3×841.9 pt</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Marges</p>
          <p className="text-lg font-black text-slate-900">4mm</p>
          <p className="text-xs text-slate-500 mt-1">11.34 pt tous côtés</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Couleurs</p>
          <p className="text-lg font-black text-slate-900">Gris</p>
          <p className="text-xs text-slate-500 mt-1">Niveaux gris uniquement</p>
        </div>
      </div>

      {errors.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Détail des Défauts</h3>
          {Object.entries(groupedErrors).map(([type, typeErrors]) => (
            <div key={type} className="space-y-2">
              <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">
                {typeLabels[type] || type}
              </h4>
              <div className="space-y-2">
                {typeErrors.map((error, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border-l-4 ${
                      error.severity === 'error'
                        ? 'bg-red-50 border-red-500 text-red-900'
                        : 'bg-yellow-50 border-yellow-500 text-yellow-900'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {error.severity === 'error' ? (
                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 text-sm">
                        <p className="font-bold">{error.message}</p>
                        {error.element && (
                          <p className="text-xs opacity-75 mt-1">Élément: {error.element}</p>
                        )}
                        {error.x !== undefined && (
                          <p className="text-xs opacity-75 mt-1">
                            Position: ({error.x.toFixed(2)}, {error.y?.toFixed(2) || '?'}) pt
                            {error.width && ` - Largeur: ${error.width.toFixed(2)} pt`}
                            {error.height && ` - Hauteur: ${error.height.toFixed(2)} pt`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : elements.length > 0 ? (
        <div className="p-8 bg-emerald-50 border-2 border-emerald-200 rounded-2xl text-center">
          <CheckCircle2 className="text-emerald-600 mx-auto mb-4" size={40} />
          <p className="text-emerald-900 font-bold">Aucun défaut détecté !</p>
          <p className="text-emerald-700 text-sm mt-2">Le gabarit respecte toutes les contraintes du cahier des charges.</p>
        </div>
      ) : (
        <div className="p-8 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center">
          <AlertCircle className="text-slate-400 mx-auto mb-4" size={40} />
          <p className="text-slate-600 font-bold">Aucun élément dans le gabarit</p>
          <p className="text-slate-500 text-sm mt-2">Ajoutez des éléments au gabarit pour commencer la validation.</p>
        </div>
      )}

      {errors.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-xl">
          <h3 className="font-bold text-blue-900 text-sm mb-3 uppercase tracking-widest">📋 Actions Recommandées</h3>
          <ul className="text-sm text-blue-800 space-y-2 ml-4">
            {errorCount > 0 && <li>• Corriger tous les défauts (erreurs) détectés avant émission</li>}
            {warningCount > 0 && <li>• Vérifier les avertissements et adapter si nécessaire</li>}
            <li>• Utiliser les coordonnées en points (pt) pour positionner précisément les éléments</li>
            <li>• Vérifier que les polices utilisées sont incorporées et supportent IDENTITY-H</li>
            <li>• Générer le PDF final en format PDF/A-1a pour conformité complète</li>
            <li>• Tester l'émission d'une facture de test après modifications</li>
          </ul>
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">📚 Références</p>
        <ul className="text-xs text-slate-600 space-y-1 font-bold">
          <li>• Cahier des Charges: ASAP-ORMC-et-PJ-complementaireV5.pdf</li>
          <li>• Format de Page: A4 Portrait (210 x 297 mm)</li>
          <li>• Marges Techniques: 4mm sur tous les côtés</li>
          <li>• Zone Réservée: 1cm x 19.7cm (côté droit, recto)</li>
          <li>• Couleurs: Niveaux de gris uniquement (R=G=B)</li>
          <li>• Polices Autorisées: Arial, Times, Courier, Helvetica, OCR-B</li>
        </ul>
      </div>
    </div>
  );
}
