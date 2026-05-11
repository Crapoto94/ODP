'use client';

import { MatchReportItem } from '../types';
import { Check, X, AlertTriangle, UserPlus, Link } from 'lucide-react';

interface MatchRowProps {
    item: MatchReportItem;
    onUpdate: (item: MatchReportItem) => void;
}

export function MatchRow({ item, onUpdate }: MatchRowProps) {
    const isTiersConfident = item.tiersScore > 0.8;
    
    return (
        <div className={`mb-4 border rounded-lg shadow-sm overflow-hidden ${item.approved ? 'border-green-500 bg-green-50' : 'bg-white'}`}>
            <div className="flex flex-row items-center justify-between p-4 border-b">
                <div className="text-sm font-bold flex items-center gap-2">
                    <span className="bg-gray-100 px-2 py-1 rounded border text-[10px] text-gray-500">{item.pdf.codeTiers2019}</span>
                    {item.pdf.pdfName} <span className="font-normal text-gray-500 text-xs">({item.pdf.numFacture})</span>
                </div>
                <div className="flex gap-2">
                    {!item.approved ? (
                        <button 
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs flex items-center hover:bg-blue-700 transition"
                            onClick={() => onUpdate({ ...item, approved: true })}
                        >
                            <Check className="h-4 w-4 mr-1" /> Approuver
                        </button>
                    ) : (
                        <button 
                            className="border border-red-500 text-red-500 px-3 py-1 rounded text-xs flex items-center hover:bg-red-50 transition"
                            onClick={() => onUpdate({ ...item, approved: false })}
                        >
                            <X className="h-4 w-4 mr-1" /> Annuler
                        </button>
                    )}
                </div>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                    <h4 className="font-semibold mb-1 text-gray-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <UserPlus className="h-3 w-3" /> Nouveau Tiers (PDF)
                    </h4>
                    <p className="font-bold text-gray-900">{item.pdf.pdfName}</p>
                    <p className="text-gray-600">{item.pdf.pdfAddress}</p>
                    <p className="font-bold mt-2 text-blue-800 text-sm">Total facture: {item.pdf.totalFacture}€</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-1 flex items-center gap-1 text-gray-700 uppercase tracking-wider text-[10px]">
                        <Link className="h-3 w-3" /> Correspondance existante (Rappel)
                    </h4>
                    {item.matchedTiers ? (
                        <div className="p-2 border rounded bg-gray-50">
                            <p className="font-medium">{item.matchedTiers.nom}</p>
                            <p className="text-gray-500 text-[10px] truncate">{item.matchedTiers.adresse}</p>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] mt-1 ${isTiersConfident ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                Score: {(item.tiersScore * 100).toFixed(0)}%
                            </span>
                        </div>
                    ) : (
                        <p className="text-gray-400 italic">Aucun tiers existant trouvé</p>
                    )}
                    <p className="mt-2 text-[10px] text-gray-500 italic">
                        Note: Un nouveau tiers sera créé avec les données PDF ci-contre.
                    </p>
                </div>
                <div className="md:col-span-2 border-t pt-2 mt-2">
                    <h4 className="font-semibold mb-2 text-gray-700 uppercase tracking-wider text-[10px]">Dispositifs ({item.pdf.lines.length})</h4>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="text-left text-gray-500 border-b">
                                <th className="pb-1">Désignation PDF</th>
                                <th className="pb-1">Article (Système)</th>
                                <th className="pb-1 text-right">Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                            {item.matchedLines.map((line, idx) => (
                                <tr key={idx} className="border-b last:border-0 hover:bg-gray-50 transition">
                                    <td className="py-2 text-gray-600">{line.designation}</td>
                                    <td className="py-2">
                                        {line.matchedArticle ? (
                                            <span className="flex items-center gap-1 text-gray-800">
                                                {line.matchedArticle.designation}
                                                <span className="bg-gray-100 text-gray-600 px-1 rounded text-[9px] border">
                                                    {(line.artScore * 100).toFixed(0)}%
                                                </span>
                                            </span>
                                        ) : (
                                            <span className="text-red-400 italic">Non identifié</span>
                                        )}
                                    </td>
                                    <td className="py-2 text-right font-medium">{line.totalP}€</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
