"use client";
import React from 'react';
import {
  Smartphone,
  History,
  Loader2
} from 'lucide-react';
import TabHeader from './TabHeader';
import ContentBox from './ContentBox';

interface Props {
  mobileLogs: any[];
  loadingLogs: boolean;
  fetchMobileLogs: () => void;
}

export default function MobileLogsTab({ mobileLogs, loadingLogs, fetchMobileLogs }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <TabHeader
        icon={Smartphone}
        title="Activité Mobile"
        subtitle="Derniers accès et synchronisations terrain"
        accentColor="emerald"
        action={{
          label: 'Actualiser',
          icon: History,
          onClick: fetchMobileLogs,
          disabled: loadingLogs,
          variant: 'outline'
        }}
      />

      <ContentBox
        loading={loadingLogs && mobileLogs.length === 0}
        empty={!loadingLogs && mobileLogs.length === 0}
        emptyIcon={<History size={48} className="text-slate-300" />}
        emptyMessage="Aucun log trouvé"
        minHeight="min-h-[400px]"
      >
        <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-24">Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilisateur</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Device / Info</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mobileLogs.map((log: any) => {
                 let deviceInfo: any = {};
                 try { deviceInfo = typeof log.deviceInfo === 'string' ? JSON.parse(log.deviceInfo) : log.deviceInfo; } catch(e) {}
                 
                 return (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="text-center">
                        <p className="font-black text-slate-900 text-sm whitespace-nowrap">{new Date(log.created_at).toLocaleDateString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 tabular-nums uppercase tracking-widest">{new Date(log.created_at).toLocaleTimeString()}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-[10px]">
                          {log.userPrenom?.[0] || '?'}{log.userNom?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm whitespace-nowrap">{log.userPrenom} {log.userNom}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">ID: {log.userId || 'System'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        log.action === 'LOGIN' ? 'bg-emerald-100 text-emerald-700' : 
                        log.action === 'ACCESS' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-8 py-5 max-w-[300px]">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700 truncate" title={log.userAgent}>
                          {deviceInfo.platform || 'Inconnu'} \u00b7 {deviceInfo.vendor || 'OS'} 
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-[8px] font-black bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter text-slate-400">
                            {deviceInfo.screenWidth}x{deviceInfo.screenHeight}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className="text-xs font-black text-slate-400 tabular-nums">{log.ip || '0.0.0.0'}</p>
                    </td>
                  </tr>
                 );
              })}
            </tbody>
          </table>
        ) }
      </div>
    </div>
  );
}
