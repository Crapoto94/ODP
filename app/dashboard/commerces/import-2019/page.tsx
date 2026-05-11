'use client';

import { useState, useEffect } from 'react';
import { MatchReportItem } from './types';
import { MatchRow } from './components/MatchRow';
import { Loader2, Save } from 'lucide-react';

export default function Import2019Page() {
    const [items, setItems] = useState<MatchReportItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [statusMsg, setStatusMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetch('/api/commerces/import-2019-report')
            .then(res => res.json())
            .then(data => {
                setItems(data);
                setLoading(false);
            })
            .catch(err => {
                setStatusMsg({ text: "Erreur lors du chargement du rapport", type: 'error' });
                setLoading(false);
            });
    }, []);

    const handleUpdate = (updatedItem: MatchReportItem) => {
        setItems(prev => prev.map(it => 
            it.pdf.numFacture === updatedItem.pdf.numFacture && it.pdf.pdfName === updatedItem.pdf.pdfName 
            ? updatedItem : it
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        setStatusMsg(null);
        try {
            const res = await fetch('/api/commerces/import-2019-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(items)
            });
            if (res.ok) {
                setStatusMsg({ text: "Progression sauvegardée avec succès !", type: 'success' });
            } else {
                setStatusMsg({ text: "Erreur lors de la sauvegarde", type: 'error' });
            }
        } catch (err) {
            setStatusMsg({ text: "Erreur réseau", type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const approvedCount = items.filter(it => it.approved).length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <p className="text-gray-500 font-medium">Chargement des données du PDF...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b z-20 shadow-sm">
                <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Vérification Import 2019</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-green-500 transition-all duration-500" 
                                    style={{ width: `${(approvedCount / items.length) * 100}%` }}
                                />
                            </div>
                            <p className="text-xs font-medium text-gray-500">{approvedCount} / {items.length} approuvées</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {statusMsg && (
                            <div className={`text-xs px-3 py-1 rounded border ${statusMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                {statusMsg.text}
                            </div>
                        )}
                        <button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold flex items-center transition shadow-md"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Sauvegarder
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-8 max-w-4xl">
                {items.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">Aucune donnée trouvée dans le rapport.</p>
                    </div>
                ) : (
                    items.map((item, idx) => (
                        <MatchRow key={idx} item={item} onUpdate={handleUpdate} />
                    ))
                )}
            </div>
        </div>
    );
}
