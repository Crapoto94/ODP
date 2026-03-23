import { useState } from 'react';
import api from '../services/api';
import { Lock, Loader2, ArrowRight, User, Settings as SettingsIcon } from 'lucide-react';
import logo from '../assets/logo.jpg';

interface LoginProps {
  onLogin: (userData: any) => void;
  onOpenSettings?: () => void;
  isVpnConnected: boolean;
}

export function Login({ onLogin, onOpenSettings, isVpnConnected }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/login', { login: username.toLowerCase(), password });
      onLogin(res.data.user);
    } catch {
      setError('Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] bg-[#0F111A] flex flex-col items-center px-8 py-16 relative overflow-hidden font-sans select-none">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Top Header Settings Button & VPN Badge */}
      <div className="w-full max-w-md flex justify-between items-center mb-12 relative z-20">
        <div className={`px-4 py-2 rounded-2xl border backdrop-blur-3xl flex items-center gap-3 transition-all duration-500 ${isVpnConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isVpnConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isVpnConnected ? 'VPN ACTIF' : 'VPN INACTIF'}</span>
        </div>
        <button 
          onClick={onOpenSettings}
          className="p-4 rounded-3xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-3xl hover:bg-white/[0.08] transition-all active:scale-90 text-white/50"
        >
          <SettingsIcon size={24} />
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md flex-1 flex flex-col items-center justify-center gap-16 relative z-10">
        
        {/* Brand Section */}
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="w-32 h-32 rounded-[2.5rem] bg-white overflow-hidden flex items-center justify-center shadow-[0_32px_64px_-16px_rgba(255,255,255,0.1)] border border-white/10">
            <img src={logo} alt="Ivry-sur-Seine" className="w-full h-full object-contain p-2" />
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-white mb-3">
              ODP <span className="text-[#a855f7]">Mobile</span>
            </h1>
            <p className="text-xs font-bold uppercase tracking-[0.5em] text-white/40 leading-relaxed">
              DIRECTION DES SYSTEMES D'INFORMATION
            </p>
          </div>
        </div>

        {/* Input Form Group */}
        <div className="w-full space-y-10">
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl px-6 py-5 flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <p className="text-sm font-bold text-rose-400 uppercase tracking-wide">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Identifiant"
                className="w-full h-20 bg-white/[0.03] border border-white/[0.08] rounded-[2rem] pl-8 pr-18 text-lg font-bold text-white text-left focus:ring-4 focus:ring-[#a855f7]/10 focus:border-[#a855f7]/40 outline-none transition-all placeholder:text-white/10"
              />
              <User size={22} className="absolute right-8 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#a855f7] transition-all duration-300" />
            </div>

            <div className="relative group">
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mot de passe"
                className="w-full h-20 bg-white/[0.03] border border-white/[0.08] rounded-[2rem] pl-8 pr-18 text-lg font-bold text-white text-left focus:ring-4 focus:ring-[#a855f7]/10 focus:border-[#a855f7]/40 outline-none transition-all placeholder:text-white/10"
              />
              <Lock size={22} className="absolute right-8 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#a855f7] transition-all duration-300" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-20 bg-white text-[#0F111A] rounded-[2rem] text-xl font-black flex items-center justify-center gap-4 transition-all active:scale-[0.97] disabled:opacity-50 mt-12 shadow-[0_24px_48px_-12px_rgba(255,255,255,0.15)]"
            >
              {loading ? <Loader2 size={28} className="animate-spin" /> : <>Se connecter <ArrowRight size={24} /></>}
            </button>
          </form>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="w-full max-w-sm mt-auto pt-20 flex flex-col items-center gap-1 opacity-20 pointer-events-none">
        <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white">
          Ville d'Ivry-sur-Seine
        </p>
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/60">
          DIRECTION DES SYSTEMES D'INFORMATION
        </p>
      </footer>
    </div>
  );
}
