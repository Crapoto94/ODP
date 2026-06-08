"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { HardHat, Store, ShoppingBag, Settings, LogOut, Loader2 } from 'lucide-react';

const SECTIONS = [
  {
    href: '/mobile/chantiers',
    icon: HardHat,
    label: 'Chantiers & Tournages',
    desc: 'Chantiers et tournages actifs',
    color: 'from-orange-500 to-amber-500',
    shadow: 'shadow-orange-500/20',
    bg: 'bg-orange-50',
    text: 'text-orange-600',
  },
  {
    href: '/mobile/commerces',
    icon: Store,
    label: 'Commerces',
    desc: 'Dossiers commerciaux',
    color: 'from-emerald-500 to-teal-500',
    shadow: 'shadow-emerald-500/20',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
  },
  {
    href: '/mobile/tlpe',
    icon: ShoppingBag,
    label: 'T.L.P.E.',
    desc: 'Taxe locale sur la publicité',
    color: 'from-violet-500 to-purple-500',
    shadow: 'shadow-violet-500/20',
    bg: 'bg-violet-50',
    text: 'text-violet-600',
  },
  {
    href: '/mobile/settings',
    icon: Settings,
    label: 'Paramètres',
    desc: 'Compte et déconnexion',
    color: 'from-slate-600 to-slate-700',
    shadow: 'shadow-slate-500/20',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
  },
];

export default function MobileHomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    axios.get('/api/auth/me').then(r => setUser(r.data)).catch(() => router.push('/mobile/login'));
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin text-blue-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Bonjour,</p>
        <h1 className="text-2xl font-black text-white mt-1">{user.prenom} {user.nom}</h1>
        <p className="text-slate-500 text-xs mt-0.5 font-medium">{user.login}</p>
      </div>

      {/* Cards */}
      <div className="flex-1 bg-slate-100 rounded-t-3xl px-5 pt-6 pb-8">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Modules</p>
        <div className="grid grid-cols-2 gap-4">
          {SECTIONS.map(({ href, icon: Icon, label, desc, color, shadow, bg, text }) => (
            <Link
              key={href}
              href={href}
              className={`relative bg-white rounded-2xl p-5 shadow-lg ${shadow} active:scale-95 transition-transform overflow-hidden flex flex-col gap-3`}
            >
              <div className={`w-11 h-11 rounded-xl ${bg} ${text} flex items-center justify-center`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 leading-tight">{label}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-tight">{desc}</p>
              </div>
              {/* accent bar */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${color}`} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
