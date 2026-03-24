import { useState } from 'react';
import { Globe, Save, X, CheckCircle2, AlertCircle, Loader2, Shield, Zap, ShieldCheck, ShieldAlert } from 'lucide-react';

interface SettingsProps {
  onSave: (url: string) => void;
  onCancel: () => void;
  isVpnConnected: boolean;
}

export function Settings({ onSave, onCancel, isVpnConnected }: SettingsProps) {
  const [url, setUrl] = useState(localStorage.getItem('odp_api_url') || window.location.origin);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState('');
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [pingError, setPingError] = useState('');

  const handleTest = async () => {
    setTestStatus('testing');
    setTestError('');
    try {
      const testUrl = url.endsWith('/') ? url.slice(0, -1) : url;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      try {
        await fetch(`${testUrl}/api/auth/session`, { 
          method: 'GET', 
          mode: 'no-cors', 
          signal: controller.signal 
        });
        clearTimeout(timeoutId);
        setTestStatus('success');
      } catch (err: any) {
        clearTimeout(timeoutId);
        setTestStatus('error');
        setTestError(err.name === 'AbortError' ? 'Délai d\'attente dépassé (6s)' : `Erreur: ${err.message || 'Serveur injoignable'}`);
      }
    } catch (err: any) { 
      setTestStatus('error');
      setTestError(`System Error: ${err.message}`);
    }
  };

  const handlePing = async () => {
    setPingStatus('testing');
    setPingError('');
    try {
      const pingUrl = url.endsWith('/') ? url.slice(0, -1) : url;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      try {
        await fetch(pingUrl, { 
          method: 'GET', 
          mode: 'no-cors', 
          signal: controller.signal 
        });
        clearTimeout(timeoutId);
        setPingStatus('success');
      } catch (err: any) {
        clearTimeout(timeoutId);
        setPingStatus('error');
        setPingError(err.name === 'AbortError' ? 'Ping: Délai dépassé (4s)' : `Ping Erreur: ${err.message || 'Serveur injoignable'}`);
      }
    } catch (err: any) { 
      setPingStatus('error');
      setPingError(`Ping System Error: ${err.message}`);
    }
  };

  const handleSaveAll = () => {
    onSave(url);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0F111A] flex flex-col items-center px-8 py-12 overflow-y-auto font-sans select-none animate-in fade-in duration-500">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none fixed" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none fixed" />

      <div className="w-full max-w-md flex justify-end mb-8 relative z-20">
        <button onClick={onCancel} className="p-4 rounded-3xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-3xl hover:bg-white/[0.08] transition-all active:scale-90 text-white/50">
          <X size={24} />
        </button>
      </div>

      <div className="w-full max-w-md flex flex-col gap-12 relative z-10 pb-20">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shadow-2xl">
            <Shield size={40} className="text-[#a855f7]" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white mb-2 uppercase">Configuration</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Infrastructure & Sécurité • v1.0.3</p>
          </div>
        </div>

        {/* API Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Globe size={18} className="text-violet-400" />
            <h2 className="text-sm font-black uppercase tracking-widest text-white/60">Serveur API</h2>
          </div>
          <div className="space-y-4">
            <div className="relative group">
              <input type="url" value={url} onChange={e => { setUrl(e.target.value); setTestStatus('idle'); setPingStatus('idle'); }} placeholder="http://10.103.131.84:3000" className="w-full h-20 bg-white/[0.03] border border-white/[0.08] rounded-[2rem] pl-8 pr-18 text-lg font-bold text-white text-left focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500/40 outline-none transition-all placeholder:text-white/10" />
              <Globe size={22} className="absolute right-8 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-violet-400 transition-all duration-300" />
            </div>
            <div className="flex items-center justify-between px-6">
               <p className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">Format: http://ip:port</p>
               <div className="flex gap-4">
                 <button onClick={handlePing} disabled={pingStatus === 'testing' || !url} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-80 active:scale-95 disabled:opacity-50 ${pingStatus === 'success' ? 'text-emerald-400' : pingStatus === 'error' ? 'text-rose-400' : 'text-blue-400'}`}>
                   {pingStatus === 'testing' ? <Loader2 size={12} className="animate-spin" /> : pingStatus === 'success' ? <CheckCircle2 size={12} /> : pingStatus === 'error' ? <AlertCircle size={12} /> : <Zap size={12} />}
                   {pingStatus === 'testing' ? 'Ping...' : pingStatus === 'success' ? 'IP OK' : pingStatus === 'error' ? 'Échec IP' : 'Ping IP'}
                 </button>
                 <button onClick={handleTest} disabled={testStatus === 'testing' || !url} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-80 active:scale-95 disabled:opacity-50 ${testStatus === 'success' ? 'text-emerald-400' : testStatus === 'error' ? 'text-rose-400' : 'text-violet-400'}`}>
                   {testStatus === 'testing' ? <Loader2 size={12} className="animate-spin" /> : testStatus === 'success' ? <CheckCircle2 size={12} /> : testStatus === 'error' ? <AlertCircle size={12} /> : <Zap size={12} />}
                   {testStatus === 'testing' ? 'Requête API...' : testStatus === 'success' ? 'API OK' : testStatus === 'error' ? 'Échec API' : 'Tester API'}
                 </button>
               </div>
            </div>
          </div>
        </div>

        {/* VPN Section */}
        <div className="space-y-6">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Tunnel VPN</h3>
                <p className="text-xs text-white/50">Détecté automatiquement depuis l'appareil</p>
              </div>
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${isVpnConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                {isVpnConnected ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {isVpnConnected ? 'VPN Actif' : 'Déconnecté'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {(testStatus === 'error' || pingStatus === 'error') && (
          <div className="w-full p-6 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle size={18} className="text-rose-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-rose-400">Diagnostic de connexion</h3>
            </div>
            {pingStatus === 'error' && (
              <p className="text-[10px] font-bold text-rose-300/60 leading-relaxed mb-2">
                {pingError}
              </p>
            )}
            {testStatus === 'error' && (
              <p className="text-[10px] font-bold text-rose-300/60 leading-relaxed">
                {testError}
              </p>
            )}
            <div className="mt-4 pt-4 border-t border-rose-500/10 space-y-2">
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Pistes de résolution :</p>
              <ul className="text-[10px] text-white/40 space-y-1 list-disc pl-4 font-medium">
                <li><b>Si le 'Ping IP' échoue :</b> Le téléphone ne voit pas le serveur sur le réseau. L'IP est incorrecte, ou vous avez besoin du VPN.</li>
                <li><b>Si seul l''API' échoue :</b> L'IP est joignable, mais le port 3000 n'est pas ouvert ou le serveur web est éteint.</li>
                <li>Vérifiez la connexion Wi-Fi/4G du téléphone.</li>
              </ul>
            </div>
          </div>
        )}

        <button onClick={handleSaveAll} className="w-full h-20 bg-white text-[#0F111A] rounded-[2rem] text-xl font-black flex items-center justify-center gap-4 transition-all active:scale-[0.97] shadow-[0_24px_48px_-12px_rgba(255,255,255,0.15)]">
          Sauvegarder <Save size={24} />
        </button>
      </div>
    </div>
  );
}
