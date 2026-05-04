"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { CheckCircle2, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface BillingRun {
  id: string;
  type: string;
  date: string;
  count: number;
  total: number;
  agent: string;
  invoices?: any[];
}

export default function SeditValidationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [billingRunId, setBillingRunId] = useState<string | null>(null);
  const [agentEmail, setAgentEmail] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [billingRun, setBillingRun] = useState<BillingRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const runId = searchParams.get('runId');
    const email = searchParams.get('agentEmail');
    const name = searchParams.get('agentName');

    if (!runId || !email || !name) {
      setError('Paramètres manquants');
      setLoading(false);
      return;
    }

    setBillingRunId(runId);
    setAgentEmail(email);
    setAgentName(decodeURIComponent(name));

    // Fetch billing run details
    fetchBillingRunDetails(runId);
  }, [searchParams]);

  const fetchBillingRunDetails = async (runId: string) => {
    try {
      const res = await axios.get(`/api/billing/history?id=${runId}`);
      if (res.data && res.data.length > 0) {
        setBillingRun(res.data[0]);
      } else {
        setError('Train de facturation non trouvé');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateIntegration = async () => {
    if (!billingRunId || !agentEmail || !agentName || !billingRun) return;

    setValidating(true);
    setError(null);

    try {
      // Count dossiers by type
      const dossiersByType: Record<string, number> = {};
      if (billingRun.invoices) {
        // We need to count by type, but since we don't have type in invoices, we'll estimate
        // Based on the billing run type
        dossiersByType[billingRun.type || 'Dossier'] = billingRun.count;
      }

      const response = await axios.post('/api/billing/sedit-validation', {
        billingRunId,
        agentEmail,
        agentName,
        dossiersCount: billingRun.count,
        dossierTypes: dossiersByType,
      });

      if (response.data.success) {
        setSuccess(true);
        // Redirect to facturation page after 3 seconds
        setTimeout(() => {
          router.push('/dashboard/facturation');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la validation');
      console.error(err);
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement des détails...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-12 max-w-md w-full text-center animate-in fade-in scale-in">
          <CheckCircle2 size={64} className="text-emerald-600 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-emerald-900 mb-2">Succès !</h1>
          <p className="text-emerald-700 font-bold mb-4">
            L'intégration SEDIT a été confirmée avec succès.
          </p>
          <p className="text-sm text-emerald-600">
            Le train {billingRunId} passera à l'état "Titré" et une confirmation a été envoyée à {agentName}.
          </p>
          <p className="text-xs text-emerald-500 mt-6">
            Redirection vers la page de facturation dans 3 secondes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8 px-4">
      <Link href="/dashboard/facturation" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm">
        <ArrowLeft size={18} />
        Retour à la facturation
      </Link>

      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Validation SEDIT</h1>
          <p className="text-slate-600 font-bold">
            Confirmer l'intégration du train de facturation dans SEDIT
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 flex gap-4">
            <AlertCircle className="text-rose-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-rose-900 mb-1">Erreur</h3>
              <p className="text-rose-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {billingRun && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-100 rounded-xl p-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Identifiant du train</p>
                <p className="text-2xl font-black text-slate-900">{billingRunId}</p>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl p-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre de dossiers</p>
                <p className="text-2xl font-black text-slate-900">{billingRun.count}</p>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl p-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Montant total</p>
                <p className="text-2xl font-black text-slate-900">{billingRun.total?.toLocaleString('fr-FR')} €</p>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl p-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Demandé par</p>
                <p className="text-lg font-black text-slate-900">{agentName}</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-black text-blue-900 mb-3 flex items-center gap-2">
                <AlertCircle size={18} />
                Confirmation requise
              </h3>
              <p className="text-sm text-blue-800 mb-4">
                En cliquant sur le bouton ci-dessous, vous confirmez que :
              </p>
              <ul className="space-y-2 text-sm text-blue-800 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">✓</span>
                  <span>Le fichier FILIEN a été généré correctement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">✓</span>
                  <span>L'intégration SEDIT a été effectuée avec succès</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">✓</span>
                  <span>Tous les dossiers peuvent passer à l'état "Titré"</span>
                </li>
              </ul>

              <button
                onClick={handleValidateIntegration}
                disabled={validating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {validating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Validation en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    Valider l'intégration SEDIT
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
