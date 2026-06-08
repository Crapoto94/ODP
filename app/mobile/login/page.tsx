"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Lock, User, Loader2 } from 'lucide-react';

export default function MobileLoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/auth/login', { login, password });
      router.push('/mobile');
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-slate-900">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl shadow-blue-500/30">
            <img src="/logo.png" alt="ODP" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Domaine Public</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Accès mobile — Ivry-sur-Seine</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Identifiant"
              value={login}
              onChange={e => setLogin(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {error && (
            <p className="text-rose-400 text-xs font-bold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !login || !password}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
