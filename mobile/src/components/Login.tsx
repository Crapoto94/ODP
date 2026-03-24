import { useState } from 'react';
import api from '../services/api';
import { Lock, Loader2, ArrowRight, User, Settings as SettingsIcon, ShieldCheck, ShieldAlert } from 'lucide-react';
import logo from '../assets/logo.jpg';

interface LoginProps {
  onLogin: (userData: any) => void;
  onOpenSettings?: () => void;
  isVpnConnected: boolean;
}

export function Login({ onLogin, onOpenSettings, isVpnConnected }: LoginProps) {
  const [username, setUsername] = useState(localStorage.getItem('odp_saved_login') || '');
  const [password, setPassword] = useState(localStorage.getItem('odp_saved_password') || '');
  const [rememberMe, setRememberMe] = useState(localStorage.getItem('odp_remember_me') === 'true');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/login', { login: username.toLowerCase(), password });
      if (rememberMe) {
        localStorage.setItem('odp_saved_login', username);
        localStorage.setItem('odp_saved_password', password);
        localStorage.setItem('odp_remember_me', 'true');
      } else {
        localStorage.removeItem('odp_saved_login');
        localStorage.removeItem('odp_saved_password');
        localStorage.setItem('odp_remember_me', 'false');
      }
      onLogin(res.data.user);
    } catch {
      setError('Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] bg-[#0F111A] flex flex-col items-center justify-center p-8 relative overflow-hidden font-sans select-none">
      
      {/* Background Ambience fixed behind everything */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Top action bar overlay */}
      <div className="fixed top-0 inset-x-0 p-6 flex justify-between items-start z-50 pointer-events-none">
        <div className={`px-4 py-2 rounded-full glass-card flex items-center gap-2 pointer-events-auto transition-all ${isVpnConnected ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
          {isVpnConnected ? <ShieldCheck size={14} className="text-emerald-400" /> : <ShieldAlert size={14} className="text-rose-400" />}
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isVpnConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isVpnConnected ? 'VPN Actif' : 'Non Sécurisé'}
          </span>
        </div>

        <button 
          onClick={onOpenSettings}
          className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-3xl hover:bg-white/[0.08] transition-all active:scale-90 text-white/50 relative group pointer-events-auto"
        >
          <SettingsIcon size={24} className="group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </div>

      <div className="w-full max-w-md flex-1 flex flex-col items-center justify-center gap-16 relative z-10 pt-20">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-28 h-28 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shadow-2xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <img src={logo} alt="Ivry-sur-Seine" className="w-[85%] h-[85%] object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white">Domaine Public</h1>
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white/40">Espace Agent</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="w-full space-y-6">
          {error && (
            <div className="w-full p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold text-center animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="relative group">
                <User size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-violet-400 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Identifiant"
                  className="w-full h-16 bg-white/[0.03] border border-white/[0.08] rounded-2xl pl-16 pr-6 text-base font-bold text-white focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.05] transition-all placeholder:text-white/20"
                />
              </div>

              <div className="relative group">
                <Lock size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-violet-400 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  className="w-full h-16 bg-white/[0.03] border border-white/[0.08] rounded-2xl pl-16 pr-6 text-base font-bold text-white focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.05] transition-all placeholder:text-white/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 px-2 py-2">
              <input 
                type="checkbox" 
                id="remember" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
                className="w-5 h-5 rounded hover:cursor-pointer accent-[var(--accent)]" 
              />
              <label htmlFor="remember" className="text-sm font-medium text-white/60 cursor-pointer select-none">
                Se souvenir de moi
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 mt-4 gradient-primary rounded-2xl text-lg font-black text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-[0_20px_40px_-15px_rgba(108,99,255,0.4)] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>Connexion <ArrowRight size={20} /></>
              )}
            </button>
          </form>
        </div>
      </div>

      <footer className="absolute bottom-8 flex flex-col items-center gap-1 opacity-20 pointer-events-none">
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white">
          DIRECTION DES SYSTEMES D'INFORMATION
        </p>
        <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white">
          Ville d'Ivry-sur-Seine
        </p>
      </footer>
    </div>
  );
}
