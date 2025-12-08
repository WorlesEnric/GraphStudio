import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GitBranch, Plus, Trash2, Circle, Square, Diamond, Play, ZoomIn, ZoomOut, Move, MousePointer } from 'lucide-react';
import { createPanelDefinition, PanelCategories, ContentTypes } from './BasePanelInterface';

/**
 * Dummy Flowchart Panel - Demonstrates the panel interface for flowchart editing
 */

// Node component
function FlowNode({ node, isSelected, onSelect, onDrag, scale }) {
  const nodeRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const handleMouseDown = (e) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    const rect = nodeRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };
  
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e) => {
      const canvas = nodeRef.current.parentElement;
      const canvasRect = canvas.getBoundingClientRect();
      const x = (e.clientX - canvasRect.left - dragOffset.x) / scale;
      const y = (e.clientY - canvasRect.top - dragOffset.y) / scale;
      onDrag(node.id, { x: Math.max(0, x), y: Math.max(0, y) });
    };
    
    const handleMouseUp = () => setIsDragging(false);
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, node.id, onDrag, scale]);
  
  const nodeColors = {
    start: 'from-green-500 to-emerald-600',
    end: 'from-red-500 to-rose-600',
    process: 'from-blue-500 to-indigo-600',
    decision: 'from-amber-500 to-orange-600',
  };
  
  const nodeShapes = {
    start: 'rounded-full',
    end: 'rounded-full',
    process: 'rounded-xl',
    decision: 'rotate-45',
  };
  
  return (
    <div
      ref={nodeRef}
      onMouseDown={handleMouseDown}
      className={`
        absolute cursor-move select-none transition-shadow
        ${isDragging ? 'z-50' : 'z-10'}
        ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''}
      `}
      style={{
        left: node.x * scale,
        top: node.y * scale,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      <div className={`
        w-32 h-16 flex items-center justify-center
        bg-gradient-to-br ${nodeColors[node.type] || nodeColors.process}
        ${nodeShapes[node.type] || nodeShapes.process}
        shadow-lg
        ${node.type === 'decision' ? 'w-20 h-20' : ''}
      `}>
        <span className={`text-white text-xs font-medium text-center px-2 ${node.type === 'decision' ? '-rotate-45' : ''}`}>
          {node.label}
        </span>
      </div>
      
      {/* Connection points */}
      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-zinc-900 opacity-0 hover:opacity-100 transition-opacity" />
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-zinc-900 opacity-0 hover:opacity-100 transition-opacity" />
      <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-zinc-900 opacity-0 hover:opacity-100 transition-opacity" />
      <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-zinc-900 opacity-0 hover:opacity-100 transition-opacity" />
    </div>
  );
}

// Connection line component
function ConnectionLine({ from, to, scale }) {
  const fromX = (from.x + 64) * scale; // center of node
  const fromY = (from.y + 40) * scale; // bottom of node
  const toX = (to.x + 64) * scale;
  const toY = to.y * scale;
  
  // Calculate control points for a smooth curve
  const midY = (fromY + toY) / 2;
  
  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="rgba(255,255,255,0.5)"
          />
        </marker>
      </defs>
      <path
        d={`M ${fromX} ${fromY + 8} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY - 8}`}
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
      />
    </svg>
  );
}

// Main View Component
function FlowchartMainView({ panelState, updateState, isFocused }) {
  const [nodes, setNodes] = useState(panelState?.nodes || [
    { id: '1', type: 'start', label: 'Start', x: 200, y: 50 },
    { id: '2', type: 'process', label: 'Process Data', x: 180, y: 150 },
    { id: '3', type: 'decision', label: 'Valid?', x: 196, y: 260 },
    { id: '4', type: 'process', label: 'Handle Error', x: 50, y: 380 },
    { id: '5', type: 'process', label: 'Continue', x: 300, y: 380 },
    { id: '6', type: 'end', label: 'End', x: 200, y: 500 },
  ]);
  
  const [connections, setConnections] = useState(panelState?.connections || [
    { id: 'c1', from: '1', to: '2' },
    { id: 'c2', from: '2', to: '3' },
    { id: 'c3', from: '3', to: '4' },
    { id: 'c4', from: '3', to: '5' },
    { id: 'c5', from: '4', to: '6' },
    { id: 'c6', from: '5', to: '6' },
  ]);
  
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [tool, setTool] = useState('select');
  const [scale, setScale] = useState(1);
  
  const handleNodeDrag = useCallback((nodeId, newPos) => {
    setNodes(prev => {
      const updated = prev.map(n => 
        n.id === nodeId ? { ...n, ...newPos } : n
      );
      updateState?.({ nodes: updated, connections });
      return updated;
    });
  }, [connections, updateState]);
  
  const addNode = (type) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      x: 150 + Math.random() * 100,
      y: 100 + Math.random() * 200,
    };
    const updated = [...nodes, newNode];
    setNodes(updated);
    setSelectedNodeId(newNode.id);
    updateState?.({ nodes: updated, connections });
  };
  
  const deleteSelected = () => {
    if (selectedNodeId) {
      const updatedNodes = nodes.filter(n => n.id !== selectedNodeId);
      const updatedConnections = connections.filter(c => c.from !== selectedNodeId && c.to !== selectedNodeId);
      setNodes(updatedNodes);
      setConnections(updatedConnections);
      setSelectedNodeId(null);
      updateState?.({ nodes: updatedNodes, connections: updatedConnections });
    }
  };
  
  const getNodeById = (id) => nodes.find(n => n.id === id);

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
            <MousePointer size={16} />
          </button>
          <button
            onClick={() => setTool('pan')}
            className={`p-2 rounded-md transition-all ${tool === 'pan' ? 'bg-violet-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
            title="Pan"
          >
            <Move size={16} />
          </button>
        </div>
        
        <div className="w-px h-6 bg-white/10" />
        
        {/* Add nodes */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => addNode('start')}
            className="p-2 rounded-md text-green-400 hover:bg-green-500/10 transition-all"
            title="Add Start"
          >
            <Play size={16} />
          </button>
          <button
            onClick={() => addNode('process')}
            className="p-2 rounded-md text-blue-400 hover:bg-blue-500/10 transition-all"
            title="Add Process"
          >
            <Square size={16} />
          </button>
          <button
            onClick={() => addNode('decision')}
            className="p-2 rounded-md text-amber-400 hover:bg-amber-500/10 transition-all"
            title="Add Decision"
          >
            <Diamond size={16} />
          </button>
          <button
            onClick={() => addNode('end')}
            className="p-2 rounded-md text-red-400 hover:bg-red-500/10 transition-all"
            title="Add End"
          >
            <Circle size={16} />
          </button>
        </div>
        
        <div className="w-px h-6 bg-white/10" />
        
        {/* Actions */}
        <button
          onClick={deleteSelected}
          disabled={!selectedNodeId}
          className="p-2 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Delete Selected"
        >
          <Trash2 size={16} />
        </button>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs text-zinc-500 w-12 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale(s => Math.min(2, s + 0.1))}
            className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>
      
      {/* Canvas */}
      <div 
        className={`flex-1 relative overflow-hidden dot-pattern ${isFocused ? 'ring-1 ring-violet-500/30 ring-inset' : ''}`}
        onClick={() => setSelectedNodeId(null)}
      >
        {/* Connections */}
        {connections.map(conn => {
          const fromNode = getNodeById(conn.from);
          const toNode = getNodeById(conn.to);
          if (!fromNode || !toNode) return null;
          return <ConnectionLine key={conn.id} from={fromNode} to={toNode} scale={scale} />;
        })}
        
        {/* Nodes */}
        {nodes.map(node => (
          <FlowNode
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            onSelect={() => setSelectedNodeId(node.id)}
            onDrag={handleNodeDrag}
            scale={scale}
          />
        ))}
        
        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 pointer-events-none">
            <GitBranch size={48} className="mb-4 opacity-20" />
            <p className="text-sm">Click the toolbar to add flowchart nodes</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Panel Definition
const DummyFlowchartPanel = createPanelDefinition({
  id: 'flowchart',
  name: 'Flowchart Editor',
  description: 'Create and edit flowcharts',
  icon: GitBranch,
  category: PanelCategories.CREATION,
  accentColor: 'blue',
  
  renderMainView: (props) => <FlowchartMainView {...props} />,
  
  getInitialState: () => ({
    nodes: [
      { id: '1', type: 'start', label: 'Start', x: 200, y: 50 },
      { id: '2', type: 'process', label: 'Process', x: 180, y: 150 },
      { id: '3', type: 'end', label: 'End', x: 200, y: 270 },
    ],
    connections: [
      { id: 'c1', from: '1', to: '2' },
      { id: 'c2', from: '2', to: '3' },
    ],
  }),
  
  getLLMContext: async (panelState) => {
    // Convert to Mermaid-like DSL
    const nodes = panelState?.nodes || [];
    const connections = panelState?.connections || [];
    
    let mermaid = 'graph TD\n';
    nodes.forEach(n => {
      const shape = n.type === 'decision' ? `{${n.label}}` : 
                    n.type === 'start' || n.type === 'end' ? `((${n.label}))` : 
                    `[${n.label}]`;
      mermaid += `  ${n.id}${shape}\n`;
    });
    connections.forEach(c => {
      mermaid += `  ${c.from} --> ${c.to}\n`;
    });
    
    return {
      contentType: 'dsl/flowchart',
      data: {
        type: 'flowchart',
        mermaid,
        nodes,
        connections,
      },
      schemaVersion: '1.0',
    };
  },
  
  applyLLMChange: async (panelState, updateState, dslDiff) => {
    if (dslDiff.nodes && dslDiff.connections) {
      updateState({ nodes: dslDiff.nodes, connections: dslDiff.connections });
      return true;
    }
    return false;
  },
  
  dropZone: {
    acceptTypes: [ContentTypes.TEXT_PLAIN, ContentTypes.DSL_FLOWCHART, ContentTypes.JSON],
    onDrop: (data, panelState, updateState) => {
      console.log('Flowchart received drop:', data);
    },
  },
  
  exportFormats: [
    { format: 'svg', label: 'SVG Vector', mimeType: 'image/svg+xml' },
    { format: 'png', label: 'PNG Image', mimeType: 'image/png' },
    { format: 'mermaid', label: 'Mermaid DSL', mimeType: 'text/plain' },
    { format: 'json', label: 'JSON Data', mimeType: 'application/json' },
  ],
  
  actions: [
    { id: 'flowchart.add-node', label: 'Add Node', category: 'Flowchart' },
    { id: 'flowchart.auto-layout', label: 'Auto Layout', category: 'Flowchart' },
    { id: 'flowchart.export', label: 'Export Flowchart', category: 'Flowchart' },
  ],
});

export default DummyFlowchartPanel;