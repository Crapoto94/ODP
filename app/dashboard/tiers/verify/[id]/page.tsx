"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building2, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  SearchCode,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function VerifyTierPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tier, setTier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [codeSedit, setCodeSedit] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTier = async () => {
      try {
        const res = await axios.get(`/api/tiers/verify/${id}`);
        setTier(res.data);
        if (res.data.code_sedit) setCodeSedit(res.data.code_sedit);
      } catch (err: any) {
        setError("Impossible de récupérer les informations du tiers.");
      } finally {
        setLoading(false);
      }
    };
    fetchTier();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await axios.patch(`/api/tiers/verify/${id}`, { code_sedit: codeSedit });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur lors de la validation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Chargement du dossier...</p>
        </div>
      </div>
    );
  }

  if (error && !tier) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-red-100 flex flex-col items-center text-center max-w-md">
          <div className="w-20 h-20 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Erreur de lien</h2>
          <p className="text-slate-500 font-medium mb-8">{error}</p>
          <button 
            onClick={() => router.push('/dashboard/tiers')}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-emerald-100 flex flex-col items-center text-center max-w-md animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Merci !</h2>
          <p className="text-slate-500 font-medium mb-8">
            Le code SEDIT <strong>{codeSedit}</strong> a été associé à <strong>{tier.nom}</strong> avec succès. 
            Nous vous remercions pour votre contribution au processus financier. 
            Vous pouvez maintenant fermer cet onglet en toute sécurité.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
      <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="p-10 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
              <ShieldCheck size={32} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter">Validation SEDIT</h1>
              <p className="text-blue-400/80 text-[10px] font-black uppercase tracking-widest">Processus de création de tiers définitif</p>
            </div>
          </div>
          <div className="bg-blue-600/20 text-blue-400 border border-blue-400/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
            ID # {tier.id}
          </div>
        </div>

        <div className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 transition-all">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Building2 size={12} /> Informations Tiers
              </h3>
              <div className="space-y-1">
                <p className="text-xl font-black text-slate-900">{tier.nom}</p>
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-mono">SIRET</span>
                  {tier.siret || 'N/A'}
                </div>
              </div>
              <p className="text-xs text-slate-400 font-bold leading-relaxed">{tier.adresse || 'Pas d\'adresse renseignée'}</p>
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 flex flex-col justify-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Statut Actuel</p>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full animate-pulse ${tier.statut === 'PROVISOIRE' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                <span className="font-black text-lg tracking-tight uppercase">{tier.statut}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 pt-6 border-t border-slate-100">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest ml-1">Saisie du Code SEDIT</label>
              <div className="relative group">
                <SearchCode className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={24} />
                <input 
                  type="text" 
                  autoFocus
                  required
                  placeholder="EX: M-123456..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] py-6 pl-16 pr-8 outline-none focus:border-blue-600 focus:bg-white transition-all font-black text-2xl tracking-tighter"
                  value={codeSedit}
                  onChange={e => setCodeSedit(e.target.value.toUpperCase())}
                />
              </div>
              <p className="text-xs text-slate-400 font-bold flex items-center gap-2 ml-4">
                <AlertCircle size={14} /> Ce code est indispensable pour le traitement comptable.
              </p>
            </div>

            <button 
              type="submit" 
              disabled={submitting || !codeSedit}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Valider la modification
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
