"use client";
import React from 'react';
import {
  Smartphone,
  History,
  Loader2
} from 'lucide-react';
import TabHeader from './TabHeader';
import { useUiMode } from '@/components/UiModeProvider';
import { SCard, SField, SInput, SButton, SIconButton, SAlert, SBadge, SToggle, SLoading, SEmpty, tableClass, thClass, tdClass } from '@/components/v2/settings/ui';

interface Props {
  mobileLogs: any[];
  loadingLogs: boolean;
  fetchMobileLogs: () => void;
}

export default function MobileLogsTab({ mobileLogs, loadingLogs, fetchMobileLogs }: Props) {
  const uiMode = useUiMode();

  if (uiMode === 'v2') {
    return (
      <SCard
        icon={Smartphone}
        title="Activité mobile"
        description="Derniers accès et synchronisations terrain."
        flush
        actions={<SButton icon={History} loading={loadingLogs} onClick={fetchMobileLogs}>Actualiser</SButton>}
      >
        {loadingLogs && mobileLogs.length === 0 ? (
          <SLoading>Chargement des logs…</SLoading>
        ) : mobileLogs.length === 0 ? (
          <SEmpty icon={History}>Aucun log trouvé</SEmpty>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Utilisateur</th>
                  <th className={thClass}>Action</th>
                  <th className={thClass}>Appareil</th>
                  <th className={`${thClass} text-right`}>Adresse IP</th>
                </tr>
              </thead>
              <tbody>
                {mobileLogs.map((log: any) => {
                  let deviceInfo: any = {};
                  try { deviceInfo = typeof log.deviceInfo === 'string' ? JSON.parse(log.deviceInfo) : log.deviceInfo; } catch (e) {}
                  deviceInfo = deviceInfo || {};
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className={`${tdClass} whitespace-nowrap`}>
                        <p className="font-semibold text-slate-900 tabular-nums">{new Date(log.created_at).toLocaleDateString('fr-FR')}</p>
                        <p className="text-xs text-slate-500 tabular-nums">{new Date(log.created_at).toLocaleTimeString('fr-FR')}</p>
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">{log.userPrenom?.[0] || '?'}{log.userNom?.[0] || '?'}</span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 whitespace-nowrap">{log.userPrenom} {log.userNom}</p>
                            <p className="text-xs text-slate-500">ID : {log.userId || 'Système'}</p>
                          </div>
                        </div>
                      </td>
                      <td className={tdClass}><SBadge tone={log.action === 'LOGIN' ? 'emerald' : log.action === 'ACCESS' ? 'blue' : 'slate'}>{log.action}</SBadge></td>
                      <td className={`${tdClass} max-w-[300px]`}>
                        <p className="text-sm text-slate-700 truncate" title={log.userAgent}>{deviceInfo.platform || 'Inconnu'} · {deviceInfo.vendor || 'OS'}</p>
                        {deviceInfo.screenWidth && <p className="text-xs text-slate-500 tabular-nums">{deviceInfo.screenWidth} × {deviceInfo.screenHeight}</p>}
                      </td>
                      <td className={`${tdClass} text-right tabular-nums text-slate-500`}>{log.ip || '0.0.0.0'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SCard>
    );
  }

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

      {!loadingLogs && mobileLogs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col items-center justify-center gap-4 opacity-40">
          <History size={48} className="text-slate-300" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aucun log trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px] animate-in fade-in duration-500">
          {loadingLogs && mobileLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4">
              <Loader2 className="animate-spin text-emerald-600" size={32} />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Chargement des logs...</p>
            </div>
          ) : (
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
                            {deviceInfo.platform || 'Inconnu'} · {deviceInfo.vendor || 'OS'}
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
          )}
        </div>
      )}
    </div>
  );
}
