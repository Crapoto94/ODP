import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Element, ElementUpdate, Gabarit, VARIABLES, FONTS } from '../types';

export function useGabaritLogic() {
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gabaritId, setGabaritId] = useState<number | null>(null);
  const [gabaritNom, setGabaritNom] = useState('Gabarit Standard');
  const [isDefault, setIsDefault] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [allGabarits, setAllGabarits] = useState<Gabarit[]>([]);
  const [isListOpen, setIsListOpen] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<null | 'nw' | 'se'>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.75);
  const canvasRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  // Clipboard for copy/cut/paste
  const [clipboard, setClipboard] = useState<Element[]>([]);

  const fetchGabarits = useCallback(async () => {
    try {
      const res = await axios.get('/api/gabarits');
      const data = Array.isArray(res.data) ? res.data : [];
      setAllGabarits(data);
      
      // Auto-load default on first mount
      if (isFirstLoad.current && data.length > 0) {
        const def = data.find(g => g.isDefault);
        if (def) {
          try {
            setGabaritId(def.id);
            setGabaritNom(def.nom);
            setIsDefault(!!def.isDefault);
            const parsed = JSON.parse(def.contenu);
            setElements(parsed.elements || []);
          } catch (e) {
            setElements([]);
          }
        } else {
          // Fallback to first one
          setGabaritId(data[0].id);
          setGabaritNom(data[0].nom);
          setIsDefault(!!data[0].isDefault);
          try {
            const parsed = JSON.parse(data[0].contenu);
            setElements(parsed.elements || []);
          } catch (e) {
            setElements([]);
          }
        }
        isFirstLoad.current = false;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGabarits();
  }, [fetchGabarits]);

  const updateElement = (id: string, updates: ElementUpdate) => {
    setElements(prev => prev.map(el => {
       if (el.id === id) {
         const { style, ...rest } = updates;
         if (style) {
           return { ...el, ...rest, style: { ...el.style, ...style } };
         }
         return { ...el, ...rest };
       }
       return el;
    }));
  };

  const updateMultipleElements = (ids: string[], updates: ElementUpdate) => {
    setElements(prev => prev.map(el => {
      if (ids.includes(el.id)) {
        const { style, ...rest } = updates;
        if (style) {
          return { ...el, ...rest, style: { ...el.style, ...style } };
        }
        return { ...el, ...rest };
      }
      return el;
    }));
  };

  const deleteElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setSelectedIds(prev => prev.filter(sid => sid !== id));
  };

  const addElement = (type: Element['type']) => {
    const newEl: Element = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 50,
      y: 50,
      width: type === 'RECT' ? 200 : 150,
      height: type === 'RECT' ? 100 : 30,
      value: type === 'VARIABLE' ? VARIABLES[0].value : (type === 'TEXT' ? 'Nouveau texte' : ''),
      style: {
        fontSize: 12,
        fontFamily: FONTS[0].value,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        backgroundColor: type === 'RECT' ? '#e2e8f0' : 'transparent',
        textAlign: 'left',
        padding: 5,
        borderRadius: 0,
        borderWidth: type === 'RECT' ? 1 : 0,
        borderColor: '#000000',
        borderStyle: 'solid',
        noBackground: false
      },
      isArticleRepeated: false,
      verticalPitch: 30
    };
    setElements([...elements, newEl]);
    setSelectedIds([newEl.id]);
  };

  const loadGabarit = (g: any) => {
    setGabaritId(g.id);
    setGabaritNom(g.nom);
    setIsDefault(!!g.isDefault);
    try {
      const parsed = JSON.parse(g.contenu);
      setElements(parsed.elements || []);
    } catch (e) {
      setElements([]);
    }
    setIsListOpen(false);
  };

  const createNewGabarit = () => {
    setGabaritId(null);
    setGabaritNom('Nouveau Gabarit');
    setIsDefault(false);
    setElements([]);
    setIsListOpen(false);
  };

  // Keyboard support for move and clipboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (selectedIds.length === 0) {
        // Only Paste is allowed if clipboard has items
        if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard.length > 0) {
          e.preventDefault();
          const paster = () => {
             const newEls = clipboard.map(el => ({
               ...JSON.parse(JSON.stringify(el)),
               id: Math.random().toString(36).substr(2, 9),
               x: el.x + 10,
               y: el.y + 10
             }));
             setElements(prev => [...prev, ...newEls]);
             setSelectedIds(newEls.map(ne => ne.id));
          };
          paster();
        }
        return;
      }
      
      const step = 6; // approx 2mm
      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        setElements(prev => prev.map(el => 
          selectedIds.includes(el.id) 
            ? { ...el, x: el.x + dx, y: el.y + dy } 
            : el
        ));
        return;
      }

      // CLIPBOARD logic
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c') {
          e.preventDefault();
          const selected = elements.filter(el => selectedIds.includes(el.id));
          setClipboard(selected.map(el => JSON.parse(JSON.stringify(el))));
        } else if (e.key === 'x') {
          e.preventDefault();
          const selected = elements.filter(el => selectedIds.includes(el.id));
          setClipboard(selected.map(el => JSON.parse(JSON.stringify(el))));
          setElements(prev => prev.filter(el => !selectedIds.includes(el.id)));
          setSelectedIds([]);
        } else if (e.key === 'v' && clipboard.length > 0) {
          e.preventDefault();
          const newEls = clipboard.map(el => ({
            ...JSON.parse(JSON.stringify(el)),
            id: Math.random().toString(36).substr(2, 9),
            x: el.x + 10,
            y: el.y + 10
          }));
          setElements(prev => [...prev, ...newEls]);
          setSelectedIds(newEls.map(ne => ne.id));
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        setElements(prev => prev.filter(el => !selectedIds.includes(el.id)));
        setSelectedIds([]);
      }

      if (e.key === 'Escape') {
        setSelectedIds([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, elements, clipboard]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        nom: gabaritNom,
        contenu: JSON.stringify({ elements }),
        isDefault: isDefault
      };
      if (gabaritId) {
        await axios.patch(`/api/gabarits/${gabaritId}`, payload);
      } else {
        const res = await axios.post('/api/gabarits', payload);
        setGabaritId(res.data.id);
      }
      fetchGabarits();
      alert('Gabarit enregistré avec succès !');
    } catch (err) {
      alert('Erreur lors de l’enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!gabaritId) return;
    setSaving(true);
    try {
      const payload = {
        nom: `Copie de ${gabaritNom}`,
        contenu: JSON.stringify({ elements }),
        isDefault: false
      };
      const res = await axios.post('/api/gabarits', payload);
      setGabaritId(res.data.id);
      setGabaritNom(res.data.nom);
      setIsDefault(false);
      fetchGabarits();
      alert('Gabarit dupliqué avec succès !');
    } catch (err) {
      alert('Erreur lors de la duplication');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGabarit = async (id: number) => {
    if (!confirm('Supprimer ce gabarit définitivement ?')) return;
    try {
      await axios.delete(`/api/gabarits/${id}`);
      if (gabaritId === id) {
        createNewGabarit();
      }
      fetchGabarits();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const alignElements = (side: 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY') => {
    if (selectedIds.length < 2) return;
    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    let targetValue: number;
    switch(side) {
      case 'left': targetValue = Math.min(...selectedElements.map(e => e.x)); break;
      case 'right': targetValue = Math.max(...selectedElements.map(e => e.x + e.width)); break;
      case 'top': targetValue = Math.min(...selectedElements.map(e => e.y)); break;
      case 'bottom': targetValue = Math.max(...selectedElements.map(e => e.y + e.height)); break;
      case 'centerX': 
        const minX = Math.min(...selectedElements.map(e => e.x));
        const maxX = Math.max(...selectedElements.map(e => e.x + e.width));
        targetValue = (minX + maxX) / 2;
        break;
      case 'centerY':
        const minY = Math.min(...selectedElements.map(e => e.y));
        const maxY = Math.max(...selectedElements.map(e => e.y + e.height));
        targetValue = (minY + maxY) / 2;
        break;
      default: return;
    }
    setElements(prev => prev.map(el => {
      if (!selectedIds.includes(el.id)) return el;
      switch(side) {
        case 'left': return { ...el, x: targetValue };
        case 'right': return { ...el, x: targetValue - el.width };
        case 'top': return { ...el, y: targetValue };
        case 'bottom': return { ...el, y: targetValue - el.height };
        case 'centerX': return { ...el, x: targetValue - el.width / 2 };
        case 'centerY': return { ...el, y: targetValue - el.height / 2 };
      }
      return el;
    }));
  };

  const bringToFront = () => {
    if (selectedIds.length === 0) return;
    const selected = elements.filter(e => selectedIds.includes(e.id));
    setElements([...elements.filter(e => !selectedIds.includes(e.id)), ...selected]);
  };

  const sendToBack = () => {
    if (selectedIds.length === 0) return;
    const selected = elements.filter(e => selectedIds.includes(e.id));
    setElements([...selected, ...elements.filter(e => !selectedIds.includes(e.id))]);
  };

  const handleMouseDown = (e: React.MouseEvent, el: Element | null, resizeHandle?: 'nw' | 'se') => {
    e.stopPropagation();
    
    // Selection logic only if an element was clicked
    if (el) {
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        if (selectedIds.includes(el.id)) {
          setSelectedIds(selectedIds.filter(id => id !== el.id));
        } else {
          setSelectedIds([...selectedIds, el.id]);
        }
      } else {
        if (!selectedIds.includes(el.id)) {
          setSelectedIds([el.id]);
        }
      }
    }

    if (resizeHandle && el) {
      setIsResizing(resizeHandle);
    } else if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: (e.clientX - rect.left) / zoom,
          y: (e.clientY - rect.top) / zoom
        });
      }
    } else if (el) {
      setIsDragging(true);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: (e.clientX - rect.left) / zoom - el.x,
          y: (e.clientY - rect.top) / zoom - el.y
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;
    
    if (isPanning) {
      const dx = mouseX - dragOffset.x;
      const dy = mouseY - dragOffset.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragOffset({ x: mouseX, y: mouseY });
      return;
    }
    
    if (selectedIds.length === 0) return;
    
    if (isDragging) {
      const primaryId = selectedIds[selectedIds.length - 1];
      const primaryEl = elements.find(item => item.id === primaryId);
      if (!primaryEl) return;
      
      const dx = Math.round(mouseX - dragOffset.x) - primaryEl.x;
      const dy = Math.round(mouseY - dragOffset.y) - primaryEl.y;
      
      if (dx !== 0 || dy !== 0) {
        setElements(prev => prev.map(item => 
          selectedIds.includes(item.id) 
            ? { ...item, x: item.x + dx, y: item.y + dy } 
            : item
        ));
      }
    } else if (isResizing && selectedIds.length === 1) {
      const selectedId = selectedIds[0];
      const el = elements.find(item => item.id === selectedId);
      if (!el) return;
      
      if (isResizing === 'se') {
        updateElement(selectedId, { 
          width: Math.max(10, Math.round(mouseX - el.x)), 
          height: Math.max(10, Math.round(mouseY - el.y)) 
        });
      } else if (isResizing === 'nw') {
        const newWidth = el.width + (el.x - mouseX);
        const newHeight = el.height + (el.y - mouseY);
        if (newWidth > 10 && newHeight > 10) {
          updateElement(selectedId, { 
            x: Math.round(mouseX), 
            y: Math.round(mouseY),
            width: Math.round(newWidth), 
            height: Math.round(newHeight) 
          });
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomIn = e.deltaY < 0;
    const zoomAmount = 0.05;
    setZoom(prev => Math.min(2, Math.max(0.1, prev + (zoomIn ? zoomAmount : -zoomAmount))));
  };

  const handleFit = () => {
    if (canvasRef.current && canvasRef.current.parentElement) {
      const parent = canvasRef.current.parentElement;
      const fitZoom = (parent.clientHeight - 80) / 842;
      setZoom(Number(fitZoom.toFixed(2)));
    }
  };

  const replaceVars = (val: string, article?: any) => {
    if (!isPreview || !val) return val;
    let res = val
      .replace('{id}', '1234')
      .replace('{nom}', 'Terrasse Café de la Paix')
      .replace('{tiers.nom}', 'SARL La Paix')
      .replace('{demandeurComplet}', "Vu la pétition par laquelle la société SARL La Paix, agissant pour le compte de l'Entreprise Vinci Mairie, demande l'autorisation d'occuper le domaine public à Ivry-sur-Seine par :")
      .replace('{adresse}', '12 rue de la République')
      .replace('{dateDebut}', '01/01/2024')
      .replace('{dateFin}', '31/12/2024')
      .replace('{totalTTC}', '450.00 €')
      .replace('{totalHT}', '450.00 €')
      .replace('{v12}', 'Code/12/MOCK')
      .replace('{v13}', 'Code/13/MOCK')
      .replace('{v20}', 'Code/20/MOCK')
      .replace('{v541.chapitre}', 'Chapitre A')
      .replace('{v541.nature}', 'Nature B')
      .replace('{v541.fonction}', 'Fonction C')
      .replace('{v541.codeInterne}', 'INT-999')
      .replace('{v541.typeMvmt}', 'RECETTE')
      .replace('{v541.sens}', 'CREDIT')
      .replace('{v542.structure}', 'STRUCTURE_X')
      .replace('{v542.gestionnaire}', 'GESTE_Y')
      .replace('{signataireRole}', "Pour le Maire d'Ivry-sur-Seine,")
      .replace('{signataireDelegation}', 'et par délégation,')
      .replace('{signataireNom}', 'Dominique Montet - Directrice Générale Adjointe')
      .replace('{today}', format(new Date(), 'dd/MM/yyyy'));
    if (article) {
      res = res
        .replace('{article.designation}', article.designation)
        .replace('{article.quantite}', article.quantite.toString())
        .replace('{article.pu}', article.pu.toFixed(2) + ' €')
        .replace('{article.totalHT}', (article.quantite * article.pu).toFixed(2) + ' €');
    }
    return res;
  };

  return {
    elements, setElements,
    selectedIds, setSelectedIds,
    loading, setLoading,
    offset, setOffset,
    isPanning, setIsPanning,
    saving, setSaving,
    gabaritId, setGabaritId,
    gabaritNom, setGabaritNom,
    isDefault, setIsDefault,
    isPreview, setIsPreview,
    allGabarits,
    isListOpen, setIsListOpen,
    isDragging, setIsDragging,
    isResizing, setIsResizing,
    dragOffset, setDragOffset,
    zoom, setZoom,
    canvasRef,
    loadGabarit, createNewGabarit, addElement,
    updateElement, updateMultipleElements, deleteElement, handleSave,
    handleDuplicate, handleDeleteGabarit, alignElements,
    bringToFront, sendToBack, fetchGabarits,
    handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, handleFit, replaceVars
  };
}
