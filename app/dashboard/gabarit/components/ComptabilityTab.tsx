'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Plus, Trash2, Edit2, Search, AlertCircle } from 'lucide-react';

interface ComptableField {
  id: string;
  label: string;
  key: keyof CompletArticle;
  required: boolean;
  type: 'text' | 'select';
  options?: string[];
}

interface CompletArticle {
  id: number;
  numero?: string;
  designation: string;
  chapitre?: string;
  codeInterne?: string;
  fonction?: string;
  gestionnaire?: string;
  nature?: string;
  sens?: string;
  structure?: string;
  typeMouvement?: string;
  montant?: number;
}

const COMPTABLE_FIELDS: ComptableField[] = [
  { id: 'numero', label: 'Numéro', key: 'numero', required: false, type: 'text' },
  { id: 'chapitre', label: 'Chapitre', key: 'chapitre', required: true, type: 'text' },
  { id: 'codeInterne', label: 'Code Interne', key: 'codeInterne', required: true, type: 'text' },
  { id: 'fonction', label: 'Fonction', key: 'fonction', required: false, type: 'text' },
  { id: 'gestionnaire', label: 'Gestionnaire', key: 'gestionnaire', required: false, type: 'text' },
  { id: 'nature', label: 'Nature', key: 'nature', required: true, type: 'select', options: ['RECETTE', 'DÉPENSE', 'AUTRE'] },
  { id: 'sens', label: 'Sens', key: 'sens', required: false, type: 'text' },
  { id: 'structure', label: 'Structure', key: 'structure', required: false, type: 'text' },
  { id: 'typeMouvement', label: 'Type Mouvement', key: 'typeMouvement', required: false, type: 'text' }
];

export default function ComptabilityTab() {
  const [articles, setArticles] = useState<CompletArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingArticle, setEditingArticle] = useState<CompletArticle | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/comptabilite/articles');
      setArticles(res.data || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des articles:', err);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des articles' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArticle = async (article: CompletArticle) => {
    // Validation basique
    const requiredFields = COMPTABLE_FIELDS.filter(f => f.required);
    const missingFields = requiredFields.filter(f => !article[f.key]);

    if (missingFields.length > 0) {
      setMessage({
        type: 'error',
        text: `Champs obligatoires manquants: ${missingFields.map(f => f.label).join(', ')}`
      });
      return;
    }

    setSaving(true);
    try {
      if (article.id) {
        await axios.put(`/api/comptabilite/articles/${article.id}`, article);
        setMessage({ type: 'success', text: 'Article mis à jour avec succès' });
      } else {
        const res = await axios.post('/api/comptabilite/articles', article);
        setArticles([...articles, res.data]);
        setMessage({ type: 'success', text: 'Article créé avec succès' });
      }
      setEditing(null);
      setEditingArticle(null);
      await fetchArticles();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;

    try {
      await axios.delete(`/api/comptabilite/articles/${id}`);
      setArticles(articles.filter(a => a.id !== id));
      setMessage({ type: 'success', text: 'Article supprimé avec succès' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    }
  };

  const handleEditStart = (article: CompletArticle) => {
    setEditing(article.id);
    setEditingArticle({ ...article });
  };

  const filteredArticles = articles.filter(a =>
    a.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.numero && a.numero.includes(searchTerm)) ||
    (a.chapitre && a.chapitre.includes(searchTerm))
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chargement de la comptabilité...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Module de Comptabilité</h2>
          <p className="text-slate-500 font-bold mt-1">Gérez les données comptables des articles et factures</p>
        </div>
        <button
          onClick={() => {
            setEditingArticle({ id: 0, designation: '', chapitre: '', codeInterne: '', nature: '' });
            setEditing(0);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all"
        >
          <Plus size={16} /> Nouvel Article
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-xl flex items-start gap-3 ${
          message.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-rose-50 border border-rose-200 text-rose-700'
        }`}>
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm font-bold">{message.text}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Rechercher par désignation, numéro ou chapitre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl font-bold text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Edit Form */}
      {editing !== null && editingArticle && (
        <div className="border border-blue-200 rounded-2xl p-6 bg-blue-50 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-blue-900 uppercase tracking-tight">
              {editingArticle.id ? 'Modifier l\'article' : 'Nouvel article'}
            </h3>
            <button
              onClick={() => {
                setEditing(null);
                setEditingArticle(null);
              }}
              className="text-slate-500 hover:text-slate-900 font-bold text-2xl"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMPTABLE_FIELDS.map(field => (
              <div key={field.id}>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
                  {field.label}
                  {field.required && <span className="text-rose-600 ml-1">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={(editingArticle[field.key] as string) || ''}
                    onChange={(e) =>
                      setEditingArticle({
                        ...editingArticle,
                        [field.key]: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-bold text-sm"
                  >
                    <option value="">Sélectionner...</option>
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={(editingArticle[field.key] as string) || ''}
                    onChange={(e) =>
                      setEditingArticle({
                        ...editingArticle,
                        [field.key]: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-bold text-sm"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setEditing(null);
                setEditingArticle(null);
              }}
              className="px-6 py-2 border border-slate-300 rounded-lg font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => editingArticle && handleSaveArticle(editingArticle)}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* Articles Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Désignation</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chapitre</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Code Interne</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nature</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fonction</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">
                    Aucun article trouvé
                  </td>
                </tr>
              ) : (
                filteredArticles.map(article => (
                  <tr key={article.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{article.designation}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-600">{article.chapitre || '-'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-600">{article.codeInterne || '-'}</td>
                    <td className="px-6 py-4">
                      {article.nature && (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          article.nature === 'RECETTE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : article.nature === 'DÉPENSE'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-700'
                        }`}>
                          {article.nature}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-600">{article.fonction || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditStart(article)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(article.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      {articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Total Articles</p>
            <p className="text-2xl font-black text-blue-700">{articles.length}</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Recettes</p>
            <p className="text-2xl font-black text-emerald-700">{articles.filter(a => a.nature === 'RECETTE').length}</p>
          </div>
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Dépenses</p>
            <p className="text-2xl font-black text-rose-700">{articles.filter(a => a.nature === 'DÉPENSE').length}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Total Montant</p>
            <p className="text-2xl font-black text-slate-700">
              {articles.reduce((sum, a) => sum + (a.montant || 0), 0).toLocaleString('fr-FR')} €
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
