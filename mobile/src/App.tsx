import { useState, useEffect } from 'react';
import api, { updateApiBaseURL } from './services/api';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { DossierDetail } from './components/DossierDetail';
import { Settings } from './components/Settings';
import VpnDetector from './services/vpnDetector';

type View = 'LOGIN' | 'DASHBOARD' | 'DETAIL';

export default function App() {
  const [view, setView] = useState<View>(() => {
    if (typeof window === 'undefined') return 'LOGIN';
    return localStorage.getItem('odp_mobile_logged_in') === 'true' ? 'DASHBOARD' : 'LOGIN';
  });
  const [selectedDossierId, setSelectedDossierId] = useState<number | null>(null);
  const [user, setUser] = useState<{ id: number; nom: string; prenom: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    const u = localStorage.getItem('odp_mobile_user');
    try {
      if (!u || u === 'undefined' || u === 'null') return null;
      return JSON.parse(u);
    } catch (e) {
      console.error('Initial session parse failed:', e);
      return null;
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVpnConnected, setIsVpnConnected] = useState(false);

  useEffect(() => {
    const checkVpn = async () => {
      try {
        const { isActive } = await VpnDetector.isVpnActive();
        setIsVpnConnected(isActive);
      } catch (e) {
        console.warn("VPN Check not supported in this environment");
      }
    };
    
    checkVpn();
    const interval = setInterval(checkVpn, 3000);
    return () => clearInterval(interval);
  }, []);

  const logActivity = async (action: string, userData?: any) => {
    const u = userData || user;
    if (!u || !u.id) return;
    try {
      await api.post('/api/logs', {
        userId: u.id,
        action,
        userAgent: navigator.userAgent,
        deviceInfo: {
          platform: navigator.platform || 'unknown',
          vendor: navigator.vendor || 'unknown',
          language: navigator.language || 'unknown',
          screenWidth: window.screen?.width || 0,
          screenHeight: window.screen?.height || 0,
          pixelRatio: window.devicePixelRatio || 1,
          touchPoints: navigator.maxTouchPoints || 0,
          onLine: navigator.onLine || true,
          connection: (navigator as any).connection?.effectiveType || 'unknown'
        }
      });
    } catch (e) {
      console.error('Log failed:', e);
    }
  };

  useEffect(() => {
    if (view === 'DASHBOARD' && user) {
      logActivity('ACCESS', user);
    }
  }, []);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    localStorage.setItem('odp_mobile_user', JSON.stringify(userData));
    localStorage.setItem('odp_mobile_logged_in', 'true');
    setView('DASHBOARD');
    logActivity('LOGIN', userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('odp_mobile_logged_in');
    localStorage.removeItem('odp_mobile_user');
    setView('LOGIN');
    setUser(null);
  };

  const handleSelectDossier = (id: number) => {
    setSelectedDossierId(id);
    setView('DETAIL');
  };

  const handleBackToDashboard = () => {
    setView('DASHBOARD');
    setSelectedDossierId(null);
  };

  const handleSaveSettings = (url: string) => {
    updateApiBaseURL(url);
    setIsSettingsOpen(false);
  };

  return (
    <div className="bg-neutral-950 min-h-screen text-white select-none relative">
      
      {isSettingsOpen && (
        <Settings 
          onSave={handleSaveSettings} 
          onCancel={() => setIsSettingsOpen(false)} 
          isVpnConnected={isVpnConnected}
        />
      )}

      {view === 'LOGIN' && (
        <Login 
          onLogin={handleLoginSuccess} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
          isVpnConnected={isVpnConnected}
        />
      )}
      
      {view === 'DASHBOARD' && (
        <Dashboard 
          onSelectDossier={handleSelectDossier} 
          onLogout={handleLogout} 
          onOpenSettings={() => setIsSettingsOpen(true)}
          isVpnConnected={isVpnConnected}
        />
      )}

      {view === 'DETAIL' && selectedDossierId !== null && (
        <DossierDetail 
          id={selectedDossierId} 
          onBack={handleBackToDashboard} 
        />
      )}
    </div>
  );
}
