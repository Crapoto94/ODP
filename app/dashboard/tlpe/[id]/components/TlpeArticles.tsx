import { Plus, Package, Clock, Maximize2, Pencil, Trash2, Euro, Calendar } from 'lucide-react';
import { format, differenceInDays, isLeapYear } from 'date-fns';

interface TlpeLigne {
  id: number;
  articleId: number;
  quantite1: number;
  quantite2: number;
  montant: number;
  dateDebut: string;
  dateFin: string;
  photos?: string;
  article?: {
    id: number;
    numero: string | null;
    designation: string;
    montant: number;
    meta?: { tlpeType?: string };
  };
}

interface Props {
  lignes: TlpeLigne[];
  isFactured: boolean;
  anneeTaxation: number;
  isEnseigneExempt?: boolean;
  onAddArticle: () => void;
  onEditArticle: (ligne: TlpeLigne) => void;
  onDeleteArticle: (id: number) => void;
}

export default function TlpeArticles({
  lignes,
  isFactured,
  anneeTaxation,
  isEnseigneExempt = false,
  onAddArticle,
  onEditArticle,
  onDeleteArticle
}: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-950 tracking-tight">Publicités & Enseignes</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
            {isFactured ? 'Consultation uniquement' : 'Éléments taxables rattachés'}
          </p>
        </div>
        {!isFactured && (
          <button 
            onClick={onAddArticle}
            className="flex items-center gap-2.5 bg-slate-950 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 group"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform" /> 
            Ajouter un élément
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {!lignes || lignes.length === 0 ? (
          <div className="py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm border border-slate-100">
              <Package size={20} className="text-slate-200" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucun élément enregistré</p>
          </div>
        ) : (
          lignes.map((ligne) => {
            const surface = ligne.quantite1 || 0;
            const unitPrice = ligne.montant || 0;
            
            const getProrata = () => {
              try {
                const d1 = new Date(ligne.dateDebut);
                const d2 = new Date(ligne.dateFin);
                if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return { ratio: 1, days: 365 };
                const year = anneeTaxation || new Date().getFullYear();
                const daysInYear = isLeapYear(new Date(year, 0, 1)) ? 366 : 365;
                const daysActive = differenceInDays(d2, d1) + 1;
                return { ratio: Math.min(1, Math.max(0, daysActive / daysInYear)), days: daysActive };
              } catch (e) { return { ratio: 1, days: 365 }; }
            };

            const { ratio: prorata, days } = getProrata();
            const totalAnnuel = unitPrice * surface;
            const tlpeType = ligne.article?.meta?.tlpeType;
            
            const isLineExempt = tlpeType === 'ENSEIGNE' && isEnseigneExempt;
            const lineTotal = isLineExempt ? 0 : (totalAnnuel * prorata);

            return (
              <div key={ligne.id} className="bg-white p-5 md:p-6 rounded-xl border border-slate-100 flex flex-col md:flex-row items-center justify-between group transition-all hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex items-start gap-5 flex-1 w-full">
                  <div className="w-14 h-14 rounded-xl bg-slate-50 flex flex-col items-center justify-center border border-slate-200 p-2 text-center group-hover:bg-white group-hover:border-purple-100 transition-all shrink-0">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Code</p>
                    <p className="font-black text-slate-950 text-base leading-none">{ligne.article?.numero || '#'}</p>
                  </div>
                  
                  <div className="space-y-3 text-left flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-black text-slate-950 tracking-tight">{ligne.article?.designation}</h4>
                      {tlpeType && (
                        <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border border-purple-100/50">
                          {tlpeType === 'ENSEIGNE' ? 'Enseigne' : tlpeType === 'NUM' ? 'Pub. Numérique' : 'Pub. Non-Num.'}
                        </span>
                      )}
                      {isLineExempt && (
                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border border-emerald-100/50">
                          Exonéré
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 text-slate-500">
                        <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                          <Clock size={12} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wide">
                          Taxation {anneeTaxation}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-purple-400 border border-purple-100">
                          <Maximize2 size={12} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wide">
                          {surface} m²
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-400 border border-amber-100">
                          <Euro size={12} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wide">
                          {unitPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €/m²
                        </span>
                      </div>
                    </div>

                    {prorata < 0.999 && (
                      <div className="flex items-center gap-3 p-2.5 bg-purple-50/50 rounded-xl border border-purple-100/50 w-fit">
                        <Calendar size={12} className="text-purple-400" />
                        <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest leading-none">
                          Période : {format(new Date(ligne.dateDebut), 'dd/MM/yyyy')} au {format(new Date(ligne.dateFin), 'dd/MM/yyyy')} — {days} j. ({Math.round(prorata * 100)}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      {prorata < 0.999 ? 'Montant Proratisé' : 'Total Annuel'}
                    </p>
                    <p className="text-xl font-black text-purple-600 tracking-tighter tabular-nums">
                      {lineTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </p>
                    {prorata < 0.999 && (
                      <p className="text-[8px] font-bold text-slate-400 mt-0.5">Base annuelle: {totalAnnuel.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!isFactured && (
                      <>
                        <button onClick={() => onEditArticle(ligne)} className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-purple-50 hover:text-purple-600 transition-all border border-slate-100 group-hover:border-purple-100"><Pencil size={14} /></button>
                        <button onClick={() => onDeleteArticle(ligne.id)} className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-100 group-hover:border-rose-100"><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
