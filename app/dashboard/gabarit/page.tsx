"use client";

import * as React from 'react';
import { useRef, useState } from 'react';
import { Loader2, Maximize, FileText, Layers, HelpCircle, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useGabaritLogic } from './hooks/useGabaritLogic';
import EditorToolbar from './components/EditorToolbar';
import EditorSidebar from './components/EditorSidebar';
import EditorCanvas from './components/EditorCanvas';
import PropertiesPanel from './components/PropertiesPanel';
import DocxUploader from './components/DocxUploader';
import ComptabilityTab from './components/ComptabilityTab';

export default function GabaritPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'pdf' | 'docx' | 'comptabilite'>('pdf');

  const {
    elements, setElements,
    selectedIds, setSelectedIds,
    loading,
    offset,
    isPanning,
    saving,
    gabaritId,
    gabaritNom, setGabaritNom,
    isDefault, setIsDefault,
    isPreview, setIsPreview,
    allGabarits,
    isListOpen, setIsListOpen,
    isDragging,
    zoom, setZoom,
    canvasRef,
    loadGabarit, createNewGabarit, addElement,
    updateElement, updateMultipleElements, deleteElement, handleSave,
    handleDuplicate, handleDeleteGabarit, alignElements,
    bringToFront, sendToBack,
    handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, handleFit, replaceVars
  } = useGabaritLogic();

  const handleExportTemplate = () => {
    const data = JSON.stringify({ elements, nom: gabaritNom });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${gabaritNom.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.elements) {
          setElements(parsed.elements);
          if (parsed.nom) setGabaritNom(parsed.nom);
          alert('Template importé avec succès !');
        }
      } catch (err) {
        alert('Format de fichier invalide');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Initialisation de l'éditeur...</p>
    </div>
  );

  const selectedElement = selectedIds.length === 1 ? elements.find(el => el.id === selectedIds[0]) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-[calc(100vh-140px)]">
      {/* Tabs Navigation */}
      <div className="flex items-center justify-between px-6 border-b border-slate-200">
        <div className="flex items-center gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-2 px-6 py-4 font-black text-[10px] uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'pdf'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers size={14} />
            Templates PDF (Factures)
          </button>
          <button
            onClick={() => setActiveTab('docx')}
            className={`flex items-center gap-2 px-6 py-4 font-black text-[10px] uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'docx'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText size={14} />
            Templates DOCX (AOT)
          </button>
          <button
            onClick={() => setActiveTab('comptabilite')}
            className={`flex items-center gap-2 px-6 py-4 font-black text-[10px] uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'comptabilite'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart3 size={14} />
            Comptabilité
          </button>
        </div>
        <Link
          href="/dashboard/gabarit/variables"
          className="flex items-center gap-2 px-4 py-4 text-slate-500 hover:text-blue-600 transition-colors text-[10px] font-black uppercase tracking-widest"
          title="Documentation des variables AOT"
        >
          <HelpCircle size={14} />
          <span className="hidden sm:inline">Variables AOT</span>
        </Link>
      </div>

      {activeTab === 'comptabilite' ? (
        <div className="flex-1 overflow-auto">
          <ComptabilityTab />
        </div>
      ) : activeTab === 'pdf' ? (
        <>
          <EditorToolbar
            gabaritId={gabaritId}
            gabaritNom={gabaritNom}
            setGabaritNom={setGabaritNom}
            isDefault={isDefault}
            setIsDefault={setIsDefault}
            isListOpen={isListOpen}
            setIsListOpen={setIsListOpen}
            allGabarits={allGabarits}
            loadGabarit={loadGabarit}
            handleDeleteGabarit={handleDeleteGabarit}
            createNewGabarit={createNewGabarit}
            handleDuplicate={handleDuplicate}
            handleSave={handleSave}
            handleExportTemplate={handleExportTemplate}
            importInputRef={importInputRef}
            saving={saving}
            isPreview={isPreview}
            setIsPreview={setIsPreview}
            selectedIds={selectedIds}
            alignElements={alignElements}
          />

          <div className="flex-1 flex gap-6 min-h-0">
        <EditorSidebar
          elements={elements}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          addElement={addElement}
          deleteElement={deleteElement}
        />

        <main
          className="flex-1 bg-slate-100 rounded-[2.5rem] border border-slate-200 overflow-hidden relative flex items-start justify-center p-10 cursor-grab active:cursor-grabbing"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseDown={(e) => {
            if (e.button === 1 || (e.button === 0 && e.altKey)) {
              handleMouseDown(e, null);
            } else if (e.target === e.currentTarget) {
              setSelectedIds([]);
            }
          }}
          onWheel={handleWheel}
        >
          <EditorCanvas
            elements={elements}
            selectedIds={selectedIds}
            isPreview={isPreview}
            zoom={zoom}
            offset={offset}
            canvasRef={canvasRef}
            handleMouseDown={handleMouseDown}
            isDragging={isDragging}
            replaceVars={replaceVars}
          />

          <div className="absolute bottom-8 right-8 bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-200 flex items-center gap-6 text-[10px] font-black text-slate-500 uppercase z-50 shadow-xl">
            <div className="flex items-center gap-3 w-32">
              <Maximize size={12} className="text-slate-300" />
              <input type="range" min="0.2" max="2" step="0.05" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <button onClick={() => setZoom(0.75)} className={`transition-colors ${zoom === 0.75 ? 'text-blue-600' : 'hover:text-slate-900'}`}>75%</button>
            <button onClick={() => setZoom(1)} className={`transition-colors ${zoom === 1 ? 'text-blue-600' : 'hover:text-slate-900'}`}>100%</button>
            <button onClick={handleFit} className="hover:text-slate-900 transition-colors">Ajuster</button>
            <div className="w-px h-4 bg-slate-200" />
            <span className="text-blue-600 w-8 text-center">{(zoom * 100).toFixed(0)}%</span>
          </div>
        </main>

        <PropertiesPanel
          elements={elements}
          selectedElement={selectedElement || null}
          selectedIds={selectedIds}
          updateElement={updateElement}
          updateMultipleElements={updateMultipleElements}
          bringToFront={bringToFront}
          sendToBack={sendToBack}
          fileInputRef={fileInputRef}
        />
      </div>
      </>
      ) : (
        <div className="flex-1 overflow-auto px-6 pb-6">
          <DocxUploader />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && selectedElement) {
            const reader = new FileReader();
            reader.onload = (event) => updateElement(selectedElement.id, { value: event.target?.result as string });
            reader.readAsDataURL(file);
          }
        }}
      />
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportTemplate}
      />
    </div>
  );
}
