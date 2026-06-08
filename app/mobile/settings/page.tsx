"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, LogOut, User, Shield, Loader2 } from 'lucide-react';
import { ROLE_LABELS, type Role } from '@/lib/permissions';

export default function MobileSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    axios.get('/api/auth/me').then(r => setUser(r.data)).catch(() => router.push('/mobile/login'));
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await axios.post('/api/auth/logout').catch(() => {});
    router.push('/mobile/login');
    router.refresh();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    );
  }

  const roleLabel = ROLE_LABELS[user.role as Role] ?? user.role;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 pt-12 pb-6 text-white">
        <div className="flex items-center gap-3">
          <Link href="/mobile" className="p-2 bg-white/10 rounded-xl active:scale-95 transition-transform">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-black">Paramètres</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* User card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-black">
              {user.prenom?.[0]}{user.nom?.[0]}
            </div>
            <div>
              <p className="text-base font-black text-slate-900">{user.prenom} {user.nom}</p>
              <p className="text-xs text-slate-400 font-medium">{user.login}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Shield size={11} className="text-slate-400" />
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide">{roleLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3 active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {loggingOut
            ? <Loader2 size={20} className="animate-spin text-rose-500" />
            : <LogOut size={20} className="text-rose-500" />
          }
          <div className="text-left">
            <p className="text-sm font-black text-rose-600">Se déconnecter</p>
            <p className="text-[11px] text-slate-400 font-medium">Fermer la session</p>
          </div>
        </button>

        {/* Link to desktop */}
        <Link
          href="/dashboard"
          className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <User size={18} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-800">Accès bureau</p>
            <p className="text-[11px] text-slate-400 font-medium">Ouvrir la version desktop</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
