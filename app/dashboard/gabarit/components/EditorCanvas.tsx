import React from 'react';
import { Element, MOCK_ARTICLES } from '../types';

interface Props {
  elements: Element[];
  selectedIds: string[];
  isPreview: boolean;
  zoom: number;
  offset: { x: number; y: number };
  canvasRef: React.RefObject<HTMLDivElement | null>;
  handleMouseDown: (e: React.MouseEvent, el: Element, resizeHandle?: 'nw' | 'se') => void;
  isDragging: boolean;
  replaceVars: (val: string, article?: any) => string;
}

export default function EditorCanvas({
  elements,
  selectedIds,
  isPreview,
  zoom,
  offset,
  canvasRef,
  handleMouseDown,
  isDragging,
  replaceVars
}: Props) {
  const PAGE_HEIGHT = 842;
  const PAGE_WIDTH = 595;
  const PAGE_LIMIT = 825; 
  const TOP_MARGIN = 40;

  // Logic to distribute elements across pages
  // This must match the PDF engine logic in app/api/aot-pdf/[id]/route.ts
  const renderPages = () => {
    let globalYShift = 0;
    const sortedElements = [...elements].sort((a, b) => a.y - b.y);
    const pageContents: React.ReactNode[][] = [[]];

    const addElementToPage = (pageNum: number, content: React.ReactNode) => {
      while (pageContents.length <= pageNum) pageContents.push([]);
      pageContents[pageNum].push(content);
    };

    sortedElements.forEach((el) => {
      const isSelected = selectedIds.includes(el.id);
      const isRepeated = isPreview && el.isArticleRepeated;
      const instances = isRepeated ? MOCK_ARTICLES : [null];
      
      let baseTgtY = el.y + globalYShift;

      instances.forEach((article, idx) => {
        let y = baseTgtY + (idx * (el.verticalPitch || (isRepeated ? 25 : 30)));
        let pageNum = Math.floor(y / PAGE_HEIGHT);
        
        // Overflow logic matching PDF engine
        if (y % PAGE_HEIGHT > PAGE_LIMIT) {
             const shiftDown = (y % PAGE_HEIGHT) - TOP_MARGIN;
             globalYShift -= shiftDown;
             baseTgtY = el.y + globalYShift;
             y = baseTgtY + (idx * (el.verticalPitch || (isRepeated ? 25 : 30)));
             pageNum = Math.floor(y / PAGE_HEIGHT);
        }

        const relativeY = y % PAGE_HEIGHT;

        addElementToPage(pageNum, (
          <div 
            key={`${el.id}-${idx}-${pageNum}`} 
            onMouseDown={(e) => handleMouseDown(e, el)} 
            className={`absolute cursor-move select-none transition-shadow ${isSelected ? 'ring-2 ring-blue-500 shadow-2xl z-40' : 'hover:ring-1 hover:ring-slate-300'}`} 
            style={{ 
              left: el.x, 
              top: relativeY, 
              width: el.width, 
              height: el.height, 
              ...el.style, 
              backgroundImage: el.type === 'IMAGE' ? `url(${el.value})` : 'none', 
              backgroundSize: 'contain', 
              backgroundRepeat: 'no-repeat', 
              backgroundPosition: 'center', 
              display: 'flex', 
              alignItems: 'flex-start', 
              justifyContent: el.style.textAlign === 'center' ? 'center' : (el.style.textAlign === 'right' ? 'flex-end' : 'flex-start'), 
              overflow: 'hidden', 
              borderStyle: el.style.borderStyle || 'solid', 
              backgroundColor: el.style.noBackground ? 'transparent' : el.style.backgroundColor, 
              zIndex: isSelected ? 50 : undefined, 
              whiteSpace: 'pre-wrap',
              lineHeight: 1.3
            }}
          >
            {el.type === 'RECT' || el.type === 'IMAGE' ? null : (
              <div 
                className={el.type === 'VARIABLE' && !isPreview ? 'font-mono bg-blue-50 text-blue-600 px-2 rounded border border-blue-100 whitespace-nowrap' : ''}
                dangerouslySetInnerHTML={{ __html: replaceVars(el.value, article) }} 
              />
            )}
            {isSelected && !isDragging && idx === 0 && selectedIds.length === 1 && (
              <>
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize z-[60]" onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, el, 'nw'); }} />
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-se-resize z-[60]" onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, el, 'se'); }} />
              </>
            )}
          </div>
        ));
      });

      if (isRepeated && instances.length > 1) {
        globalYShift += (instances.length - 1) * (el.verticalPitch || 25);
      }
    });

    return pageContents;
  };

  const pages = renderPages();

  return (
    <div ref={canvasRef} className="flex flex-col gap-10 items-center origin-top" style={{ transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)` }}>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      {pages.map((content, i) => (
        <div key={i} className="bg-white shadow-2xl relative" style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, minWidth: PAGE_WIDTH, minHeight: PAGE_HEIGHT }}>
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="absolute top-2 right-4 text-[10px] font-black text-slate-200 uppercase tracking-widest pointer-events-none">Page {i + 1}</div>
          {content}
        </div>
      ))}
    </div>
  );
}
