"use client";
import React from 'react';
import { Trash2, Box, Calendar, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useUiMode } from '@/components/UiModeProvider';
import { SBadge, SIconButton } from '@/components/v2/settings/ui';

interface Release {
  id: number;
  versionNumber: string;
  notes: string | null;
  releasedAt: string;
  _count?: {
    backlogItems: number;
  };
  backlogItems?: any[];
}

interface ReleaseHistoryProps {
  releases: Release[];
  onRefresh: () => void;
}

export default function ReleaseHistory({ releases, onRefresh }: ReleaseHistoryProps) {
  const deleteRelease = async (id: number) => {
    if (!confirm("Supprimer cette version ? Elle doit être vide.")) return;
    try {
      await axios.delete(`/api/releases/${id}`);
      onRefresh();
    } catch (e: any) {
      alert(e.response?.data?.error || "Erreur lors de la suppression");
    }
  };

  const uiMode = useUiMode();
  if (releases.length === 0) return null;

  if (uiMode === 'v2') {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h3 className="text-[15px] font-bold text-slate-900">Historique des versions</h3>
          <SBadge>{releases.length}</SBadge>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {releases.map((release) => {
            const count = release.backlogItems?.length || 0;
            return (
              <article key={release.id} className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] flex flex-col gap-3">
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-lg font-extrabold text-slate-900 tabular-nums"><Box size={16} className="text-blue-600" /> v{release.versionNumber}</p>
                    <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5"><Calendar size={12} /> {new Date(release.releasedAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <SIconButton title={count > 0 ? 'La version doit être vide pour être supprimée' : 'Supprimer la version'} tone="rose" disabled={count > 0} onClick={() => deleteRelease(release.id)}><Trash2 size={16} /></SIconButton>
                </header>
                {release.notes && <p className="text-[13px] text-slate-600 whitespace-pre-line line-clamp-4">{release.notes}</p>}
                {count > 0 && (
                  <ul className="bg-slate-50 rounded-xl p-3 space-y-2 max-h-44 overflow-y-auto">
                    {release.backlogItems?.map((item: any) => (
                      <li key={item.id} className="flex items-start gap-2 text-[13px] text-slate-700">
                        {item.type === 'BUG' ? <Bug size={12} className="text-rose-500 mt-1 shrink-0" /> : <ChevronRight size={12} className="text-slate-400 mt-1 shrink-0" />}
                        <span className="leading-snug">{item.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <footer className="mt-auto pt-3 border-t border-slate-100 text-xs font-semibold">
                  <span className={count > 0 ? 'text-emerald-700' : 'text-slate-400'}>{count} élément{count > 1 ? 's' : ''}</span>
                </footer>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-100"></div>
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Historique des Versions</h4>
        <div className="h-px flex-1 bg-slate-100"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {releases.map(release => {
          const itemCount = release.backlogItems?.length || 0;
          return (
            <div key={release.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Box size={14} className="text-blue-600" />
                    <span className="text-lg font-black text-slate-900 tracking-tight">v{release.versionNumber}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Calendar size={10} className="text-slate-400" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(release.releasedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button 
                  onClick={() => deleteRelease(release.id)}
                  className={`p-2 rounded-lg transition-all ${itemCount > 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'}`}
                  title={itemCount > 0 ? "La version doit être vide pour être supprimée" : "Supprimer la version"}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {release.notes && (
                <p className="text-[11px] font-medium text-slate-500 line-clamp-2 mb-4 italic">
                  "{release.notes}"
                </p>
              )}

              {/* Backlog Items List */}
              {itemCount > 0 && (
                <div className="mb-4 bg-slate-50/50 rounded-xl p-3 space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                  {release.backlogItems?.map((item: any) => (
                    <div key={item.id} className="border-l-2 border-slate-200 pl-3 space-y-1">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 text-slate-400 flex-shrink-0">
                          {item.type === 'BUG' ? <Bug size={10} className="text-rose-400" /> : <ChevronRight size={10} />}
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 leading-tight" title={item.title}>
                          {item.title}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-[9px] text-slate-500 ml-4 leading-tight italic">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-black ${itemCount > 0 ? 'text-emerald-500' : 'text-slate-300'}`}>
                    {itemCount} élément{itemCount > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex gap-1">
                  <div className={`h-1.5 w-12 rounded-full ${itemCount > 0 ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                     <div className={`h-full rounded-full ${itemCount > 0 ? 'bg-emerald-500 w-full' : 'w-0'}`}></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Minimal icons for the list
function Bug({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m8 2 1.88 1.88" /><path d="M14.12 3.88 16 2" /><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" /><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" /><path d="M12 20v-9" /><path d="M6.53 9C4.6 8.8 3 7.1 3 5" /><path d="M6 13H2" /><path d="M3 21c0-2.1 1.7-3.9 3.8-4" /><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" /><path d="M22 13h-4" /><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
    </svg>
  );
}
