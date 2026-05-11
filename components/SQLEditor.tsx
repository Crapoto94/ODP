"use client";
import React, { useState, useEffect } from 'react';
import { Database, Play, Table as TableIcon, AlertCircle, ChevronRight, Terminal, Search, Copy, Download, Layers } from 'lucide-react';
import axios from 'axios';

interface TableSchema {
  name: string;
  columns: { name: string; type: string; pk: boolean }[];
}

export default function SQLEditor() {
  const [dbType, setDbType] = useState<'main' | 'local'>('local');
  const [schema, setSchema] = useState<TableSchema[]>([]);
  const [query, setQuery] = useState('SELECT * FROM AppSettings LIMIT 10;');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTable, setActiveTable] = useState<string | null>(null);

  useEffect(() => {
    fetchSchema();
    // Default query based on DB type
    if (dbType === 'local') {
      setQuery('SELECT * FROM AppSettings LIMIT 10;');
    } else {
      setQuery('SELECT * FROM "User" LIMIT 10;');
    }
  }, [dbType]);

  const fetchSchema = async () => {
    try {
      const res = await axios.get(`/api/settings/db-schema?db=${dbType}`);
      setSchema(res.data);
    } catch (err: any) {
      setError("Erreur lors de la lecture du schéma : " + (err.response?.data?.error || err.message));
    }
  };

  const handleRunQuery = async (queryToRun?: string) => {
    const q = queryToRun || query;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await axios.post('/api/settings/sql-query', { query: q, db: dbType });
      if (Array.isArray(res.data.result)) {
        setResults(res.data.result);
      } else {
        setResults([{ message: "Succès", rowsAffected: res.data.result }]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTableClick = (tableName: string) => {
    setActiveTable(tableName);
    // Add quotes for Postgres compatibility if table name has special chars or case
    const formattedName = dbType === 'main' ? `"${tableName}"` : tableName;
    const newQuery = `SELECT * FROM ${formattedName} LIMIT 100;`;
    setQuery(newQuery);
    handleRunQuery(newQuery);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Sidebar: Tables */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 overflow-hidden h-[600px] flex flex-col">
          
          {/* DB Selector */}
          <div className="mb-6 flex p-1 bg-slate-100 rounded-2xl">
            <button 
              onClick={() => setDbType('main')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black transition-all ${dbType === 'main' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Database size={12} /> POSTGRES
            </button>
            <button 
              onClick={() => setDbType('local')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black transition-all ${dbType === 'local' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Layers size={12} /> SQLITE
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="p-2 bg-slate-900 rounded-lg text-white">
              <TableIcon size={14} />
            </div>
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Tables ({dbType})</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
            {schema.length > 0 ? schema.map((table) => (
              <button
                key={table.name}
                onClick={() => handleTableClick(table.name)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${
                  activeTable === table.name ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <TableIcon size={16} className={activeTable === table.name ? 'text-indigo-100' : 'text-slate-400'} />
                  <span className="font-bold text-sm truncate">{table.name}</span>
                </div>
                <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${activeTable === table.name ? 'text-white' : 'text-slate-300'}`} />
              </button>
            )) : (
              <div className="py-10 text-center opacity-30 italic text-[10px]">Aucune table</div>
            )}
          </div>
        </div>
      </div>

      {/* Main: Editor & Results */}
      <div className="lg:col-span-9 space-y-6">
        {/* Editor Area */}
        <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 space-y-6 relative overflow-hidden border border-slate-800">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <Terminal size={18} className="text-indigo-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Éditeur SQL ({dbType})</span>
            </div>
            <button 
              onClick={() => handleRunQuery()}
              disabled={loading}
              className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-indigo-900/50"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Play size={16} fill="currentColor" />}
              Exécuter
            </button>
          </div>

          <div className="relative group">
            <textarea
              className="w-full bg-slate-800/50 text-indigo-100 font-mono text-lg p-6 rounded-2xl border border-slate-700 outline-none focus:border-indigo-500 transition-all min-h-[150px] resize-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Saisissez votre code SQL ici..."
            />
            <div className="absolute top-4 right-4 text-slate-600 font-black text-[10px] uppercase opacity-30">{dbType === 'main' ? 'PostgreSQL' : 'SQLite v3'}</div>
          </div>
        </div>

        {/* Status & Messages */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
             <AlertCircle className="text-rose-600 flex-shrink-0 mt-1" size={20} />
             <div className="space-y-1">
               <p className="font-black text-rose-900 uppercase text-[10px] tracking-widest">Erreur SQL</p>
               <p className="text-rose-700 font-bold text-sm leading-relaxed">{error}</p>
             </div>
          </div>
        )}

        {/* Results Area */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-3">
              <Search size={16} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Résultats {results.length > 0 ? `(${results.length} lignes)` : ''}</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto max-h-[500px] custom-scrollbar">
            {results.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                    {Object.keys(results[0]).map((key) => (
                      <th key={key} className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 border-r border-slate-200 last:border-r-0">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.slice(0, 1000).map((row, i) => (
                    <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="px-6 py-4 text-sm font-medium text-slate-600 border-r border-slate-50 last:border-r-0 whitespace-nowrap">
                          {val === null ? <span className="text-slate-300 italic text-[10px]">null</span> : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : !loading && !error && (
              <div className="flex flex-col items-center justify-center py-32 text-slate-300 space-y-4">
                <Terminal size={48} className="opacity-10" />
                <p className="font-black uppercase tracking-[0.3em] text-[10px]">En attente d'une requête</p>
              </div>
            )}
            {loading && (
              <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Traitement de la requête...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
