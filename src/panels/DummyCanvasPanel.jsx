import React, { useState, useRef, useCallback } from 'react';
import { Paintbrush, Square, Circle, Triangle, Trash2, Download, Undo, Redo, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { createPanelDefinition, PanelCategories, ContentTypes } from './BasePanelInterface';

/**
 * Dummy Canvas Panel - Demonstrates the panel interface for a drawing canvas
 */

// Main View Component
function CanvasMainView({ panelState, updateState, isFocused }) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('select');
  const [shapes, setShapes] = useState(panelState?.shapes || []);
  const [selectedShape, setSelectedShape] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  
  const colors = ['#8b5cf6', '#22d3ee', '#4ade80', '#fb923c', '#f472b6', '#fbbf24'];
  const [currentColor, setCurrentColor] = useState(colors[0]);
  
  const handleMouseDown = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (tool === 'select') {
      // Check if clicking on a shape
      const clicked = shapes.findLast(s => 
        x >= s.x && x <= s.x + s.width &&
        y >= s.y && y <= s.y + s.height
      );
      setSelectedShape(clicked?.id || null);
    } else if (['rect', 'circle', 'triangle'].includes(tool)) {
      setIsDrawing(true);
      setStartPos({ x, y });
    }
  }, [tool, shapes]);
  
  const handleMouseMove = useCallback((e) => {
    if (!isDrawing || !startPos) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Preview shape (could be optimized with a preview layer)
  }, [isDrawing, startPos]);
  
  const handleMouseUp = useCallback((e) => {
    if (!isDrawing || !startPos) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newShape = {
      id: `shape-${Date.now()}`,
      type: tool,
      x: Math.min(startPos.x, x),
      y: Math.min(startPos.y, y),
      width: Math.abs(x - startPos.x),
      height: Math.abs(y - startPos.y),
      color: currentColor,
    };
    
    if (newShape.width > 5 && newShape.height > 5) {
      const newShapes = [...shapes, newShape];
      setShapes(newShapes);
      updateState?.({ shapes: newShapes });
    }
    
    setIsDrawing(false);
    setStartPos(null);
  }, [isDrawing, startPos, tool, currentColor, shapes, updateState]);
  
  const deleteSelected = () => {
    if (selectedShape) {
      const newShapes = shapes.filter(s => s.id !== selectedShape);
      setShapes(newShapes);
      setSelectedShape(null);
      updateState?.({ shapes: newShapes });
    }
  };
  
  const clearCanvas = () => {
    setShapes([]);
    setSelectedShape(null);
    updateState?.({ shapes: [] });
  };
  
  const renderShape = (shape) => {
    const isSelected = shape.id === selectedShape;
    const baseStyle = {
      position: 'absolute',
      left: shape.x,
      top: shape.y,
      width: shape.width,
      height: shape.height,
      backgroundColor: shape.color,
      opacity: 0.8,
      cursor: 'pointer',
      transition: 'box-shadow 0.15s',
      boxShadow: isSelected ? `0 0 0 2px white, 0 0 0 4px ${shape.color}` : 'none',
    };
    
    if (shape.type === 'circle') {
      return <div key={shape.id} style={{ ...baseStyle, borderRadius: '50%' }} />;
    } else if (shape.type === 'triangle') {
      return (
        <div
          key={shape.id}
          style={{
            position: 'absolute',
            left: shape.x,
            top: shape.y,
            width: 0,
            height: 0,
            borderLeft: `${shape.width / 2}px solid transparent`,
            borderRight: `${shape.width / 2}px solid transparent`,
            borderBottom: `${shape.height}px solid ${shape.color}`,
            cursor: 'pointer',
          }}
        />
      );
    }
    return <div key={shape.id} style={{ ...baseStyle, borderRadius: 4 }} />;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-white/10 bg-black/20">
        {/* Tools */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-black/30">
          <button
            onClick={() => setTool('select')}
            className={`p-2 rounded-md transition-all ${tool === 'select' ? 'bg-violet-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
            title="Select"
          >
            <Move size={16} />
          </button>
          <button
            onClick={() => setTool('rect')}
            className={`p-2 rounded-md transition-all ${tool === 'rect' ? 'bg-violet-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
            title="Rectangle"
          >
            <Square size={16} />
          </button>
          <button
            onClick={() => setTool('circle')}
            className={`p-2 rounded-md transition-all ${tool === 'circle' ? 'bg-violet-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
            title="Circle"
          >
            <Circle size={16} />
          </button>
          <button
            onClick={() => setTool('triangle')}
            className={`p-2 rounded-md transition-all ${tool === 'triangle' ? 'bg-violet-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
            title="Triangle"
          >
            <Triangle size={16} />
          </button>
        </div>
        
        {/* Divider */}
        <div className="w-px h-6 bg-white/10" />
        
        {/* Colors */}
        <div className="flex items-center gap-1">
          {colors.map(color => (
            <button
              key={color}
              onClick={() => setCurrentColor(color)}
              className={`w-6 h-6 rounded-full transition-transform ${currentColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110' : 'hover:scale-110'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        
        {/* Divider */}
        <div className="w-px h-6 bg-white/10" />
        
        {/* Actions */}
        <button
          onClick={deleteSelected}
          disabled={!selectedShape}
          className="p-2 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Delete Selected"
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={clearCanvas}
          className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          title="Clear Canvas"
        >
          <Undo size={16} />
        </button>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Shape count */}
        <span className="text-xs text-zinc-500">
          {shapes.length} shape{shapes.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      {/* Canvas Area */}
      <div 
        ref={canvasRef}
        className={`flex-1 relative overflow-hidden grid-pattern cursor-crosshair ${isFocused ? 'ring-1 ring-violet-500/30 ring-inset' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setIsDrawing(false); setStartPos(null); }}
      >
        {shapes.map(renderShape)}
        
        {/* Empty state */}
        {shapes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 pointer-events-none">
            <Paintbrush size={48} className="mb-4 opacity-20" />
            <p className="text-sm">Click and drag to draw shapes</p>
            <p className="text-xs mt-1 text-zinc-600">Select a tool from the toolbar above</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Properties Panel Component
function CanvasPropertiesPanel({ panelState }) {
  const shapes = panelState?.shapes || [];
  
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-medium text-zinc-300">Canvas Properties</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Total Shapes</span>
          <span className="text-zinc-300">{shapes.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Rectangles</span>
          <span className="text-zinc-300">{shapes.filter(s => s.type === 'rect').length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Circles</span>
          <span className="text-zinc-300">{shapes.filter(s => s.type === 'circle').length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Triangles</span>
          <span className="text-zinc-300">{shapes.filter(s => s.type === 'triangle').length}</span>
        </div>
      </div>
    </div>
  );
}

// Panel Definition
const DummyCanvasPanel = createPanelDefinition({
  id: 'canvas',
  name: 'Creative Canvas',
  description: 'Draw and arrange shapes on a canvas',
  icon: Paintbrush,
  category: PanelCategories.CREATION,
  accentColor: 'violet',
  
  renderMainView: (props) => <CanvasMainView {...props} />,
  renderPropertiesPanel: (props) => <CanvasPropertiesPanel {...props} />,
  
  getInitialState: () => ({
    shapes: [],
  }),
  
  getLLMContext: async (panelState) => {
    return {
      contentType: 'dsl/json',
      data: {
        type: 'canvas',
        shapes: panelState?.shapes || [],
      },
      schemaVersion: '1.0',
    };
  },
  
  applyLLMChange: async (panelState, updateState, dslDiff) => {
    if (dslDiff.shapes) {
      updateState({ shapes: dslDiff.shapes });
      return true;
    }
    return false;
  },
  
  dropZone: {
    acceptTypes: [ContentTypes.DSL_SVG, ContentTypes.IMAGE_PNG, ContentTypes.JSON],
    onDrop: (data, panelState, updateState) => {
      console.log('Canvas received drop:', data);
      // Convert dropped data to shapes
    },
  },
  
  exportFormats: [
    { format: 'png', label: 'PNG Image', mimeType: 'image/png' },
    { format: 'svg', label: 'SVG Vector', mimeType: 'image/svg+xml' },
    { format: 'json', label: 'JSON Data', mimeType: 'application/json' },
  ],
  
  actions: [
    { id: 'canvas.clear', label: 'Clear Canvas', category: 'Canvas' },
    { id: 'canvas.export', label: 'Export Canvas', category: 'Canvas' },
  ],
});

export default DummyCanvasPanel;