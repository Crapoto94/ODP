"use client";

import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Article {
  id: number;
  numero: string | null;
  designation: string;
  montant: number;
}

interface Props {
  tiersId: number;
  selectedYear: number;
  onDispositivesAdded?: () => void;
}

export default function CommerceDispositivesManager({
  tiersId,
  selectedYear,
  onDispositivesAdded
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchArticles();
    }
  }, [isOpen, selectedYear]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/articles?annee=${selectedYear}`);
      const filtered = (res.data || []).filter((a: Article) => {
        const code = a.numero || '';
        return code.startsWith('1.');
      });
      setArticles(filtered);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDispositive = async () => {
    if (selectedArticles.length === 0) return;

    setSubmitting(true);
    try {
      const payload = {
        tiersId,
        type: 'COMMERCE',
        statut: 'EN_ATTENTE',
        anneeTaxation: selectedYear,
        adresse: '',
        lignes: selectedArticles.map(articleId => ({
          articleId,
          quantite1: 1,
          montant: articles.find(a => a.id === articleId)?.montant || 0
        }))
      };

      await axios.post('/api/occupations', payload);

      setSelectedArticles([]);
      setIsOpen(false);
      onDispositivesAdded?.();
    } catch (err) {
      console.error('Failed to add dispositives:', err);
      alert('Erreur lors de l\'ajout des dispositifs');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors"
      >
        <Plus size={16} />
        Ajouter un dispositif
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Ajouter des dispositifs</h3>
            <p className="text-sm text-slate-500 mt-1">Année {selectedYear}</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-blue-600" />
            </div>
          ) : articles.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Aucun dispositif disponible pour cette année</p>
          ) : (
            <div className="space-y-2">
              {articles.map(article => (
                <label
                  key={article.id}
                  className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedArticles.includes(article.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedArticles([...selectedArticles, article.id]);
                      } else {
                        setSelectedArticles(selectedArticles.filter(id => id !== article.id));
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{article.designation}</p>
                    <p className="text-xs text-slate-500">{article.numero}</p>
                  </div>
                  <p className="font-bold text-slate-900 shrink-0">{article.montant.toFixed(2)} €</p>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex items-center justify-end gap-3">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 border border-slate-200 text-slate-900 rounded-lg font-bold hover:bg-slate-100 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleAddDispositive}
            disabled={selectedArticles.length === 0 || submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Ajout...
              </>
            ) : (
              <>
                <Plus size={16} />
                Ajouter ({selectedArticles.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
