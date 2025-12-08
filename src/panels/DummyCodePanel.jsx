import React, { useState } from 'react';
import { Code, Play, Copy, Check, Download, FileCode, RefreshCw } from 'lucide-react';
import { createPanelDefinition, PanelCategories, ContentTypes } from './BasePanelInterface';

/**
 * Dummy Code Panel - Demonstrates the panel interface for code editing
 */

// Simple syntax highlighting (very basic)
function highlightCode(code, language) {
  if (language === 'javascript' || language === 'jsx') {
    return code
      .replace(/(\/\/.*$)/gm, '<span class="text-zinc-500">$1</span>')
      .replace(/('.*?'|".*?")/g, '<span class="text-emerald-400">$1</span>')
      .replace(/\b(const|let|var|function|return|if|else|for|while|import|export|from|default|async|await)\b/g, '<span class="text-violet-400">$1</span>')
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-amber-400">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="text-cyan-400">$1</span>');
  }
  return code;
}

// Main View Component
function CodeMainView({ panelState, updateState, isFocused }) {
  const [code, setCode] = useState(panelState?.code || `// Welcome to the Code Editor
// This is a demo panel implementing IStudioPanelDefinition

import React from 'react';
import { createPanelDefinition } from './BasePanelInterface';

function MyComponent({ title, children }) {
  const [count, setCount] = useState(0);
  
  return (
    <div className="container">
      <h1>{title}</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
      {children}
    </div>
  );
}

export default MyComponent;`);
  
  const [language, setLanguage] = useState(panelState?.language || 'javascript');
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  
  const languages = [
    { id: 'javascript', label: 'JavaScript' },
    { id: 'jsx', label: 'React JSX' },
    { id: 'html', label: 'HTML' },
    { id: 'css', label: 'CSS' },
    { id: 'python', label: 'Python' },
    { id: 'json', label: 'JSON' },
  ];
  
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    updateState?.({ code: newCode, language });
  };
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleRun = () => {
    try {
      // Simulate running code (in a real app, this would use a sandbox)
      setOutput(`✓ Code executed successfully
  
Output:
  - Module loaded
  - Component rendered
  - No errors detected

Execution time: ${Math.floor(Math.random() * 50 + 10)}ms`);
      setShowOutput(true);
    } catch (err) {
      setOutput(`✗ Error: ${err.message}`);
      setShowOutput(true);
    }
  };
  
  const lines = code.split('\n');

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-white/10 bg-black/20">
        {/* Language selector */}
        <select
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
            updateState?.({ code, language: e.target.value });
          }}
          className="px-3 py-1.5 rounded-lg bg-black/30 border border-white/10 text-sm text-zinc-300 focus:border-violet-500/50 cursor-pointer"
        >
          {languages.map(lang => (
            <option key={lang.id} value={lang.id}>{lang.label}</option>
          ))}
        </select>
        
        <div className="flex-1" />
        
        {/* Actions */}
        <button
          onClick={handleRun}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-sm font-medium"
        >
          <Play size={14} />
          Run
        </button>
        
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors text-sm"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        
        <button
          className="p-2 rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          title="Download"
        >
          <Download size={16} />
        </button>
      </div>
      
      {/* Editor */}
      <div className={`flex-1 flex overflow-hidden ${isFocused ? 'ring-1 ring-violet-500/30 ring-inset' : ''}`}>
        {/* Code area */}
        <div className="flex-1 flex overflow-auto font-mono text-sm">
          {/* Line numbers */}
          <div className="flex-shrink-0 py-4 pr-4 pl-4 text-right text-zinc-600 select-none bg-black/20 border-r border-white/5">
            {lines.map((_, i) => (
              <div key={i} className="leading-6">{i + 1}</div>
            ))}
          </div>
          
          {/* Code content */}
          <div className="flex-1 relative">
            <textarea
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              spellCheck={false}
              className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-white resize-none leading-6 font-mono"
              style={{ caretColor: 'white' }}
            />
            <pre className="p-4 text-zinc-200 pointer-events-none leading-6 overflow-visible">
              <code dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }} />
            </pre>
          </div>
        </div>
        
        {/* Output panel */}
        {showOutput && (
          <div className="w-80 flex-shrink-0 border-l border-white/5 flex flex-col bg-black/20">
            <div className="flex items-center justify-between p-3 border-b border-white/5">
              <span className="text-xs font-medium text-zinc-400">Output</span>
              <button
                onClick={() => setShowOutput(false)}
                className="text-zinc-500 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono">
                {output}
              </pre>
            </div>
          </div>
        )}
      </div>
      
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 text-xs text-zinc-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <FileCode size={12} />
            {language}
          </span>
          <span>Lines: {lines.length}</span>
          <span>Characters: {code.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-green-500">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Ready
          </span>
        </div>
      </div>
    </div>
  );
}

// Panel Definition
const DummyCodePanel = createPanelDefinition({
  id: 'code',
  name: 'Code Editor',
  description: 'Write and edit code',
  icon: Code,
  category: PanelCategories.CREATION,
  accentColor: 'emerald',
  
  renderMainView: (props) => <CodeMainView {...props} />,
  
  getInitialState: () => ({
    code: `// Start coding here
function hello() {
  console.log("Hello, World!");
}

hello();`,
    language: 'javascript',
  }),
  
  getLLMContext: async (panelState) => {
    return {
      contentType: 'text/code',
      data: {
        type: 'code',
        language: panelState?.language || 'javascript',
        code: panelState?.code || '',
        lineCount: (panelState?.code || '').split('\n').length,
      },
      schemaVersion: '1.0',
    };
  },
  
  applyLLMChange: async (panelState, updateState, dslDiff) => {
    if (dslDiff.code !== undefined) {
      updateState({ 
        code: dslDiff.code,
        language: dslDiff.language || panelState?.language || 'javascript'
      });
      return true;
    }
    return false;
  },
  
  dropZone: {
    acceptTypes: [ContentTypes.TEXT_PLAIN, ContentTypes.TEXT_CODE, ContentTypes.JSON],
    onDrop: (data, panelState, updateState) => {
      if (data.contentType === ContentTypes.TEXT_CODE || data.contentType === ContentTypes.TEXT_PLAIN) {
        updateState({ code: data.data });
      }
    },
  },
  
  exportFormats: [
    { format: 'js', label: 'JavaScript', mimeType: 'text/javascript' },
    { format: 'jsx', label: 'React JSX', mimeType: 'text/javascript' },
    { format: 'txt', label: 'Plain Text', mimeType: 'text/plain' },
  ],
  
  actions: [
    { id: 'code.run', label: 'Run Code', shortcut: 'Ctrl+Enter', category: 'Code' },
    { id: 'code.format', label: 'Format Code', shortcut: 'Ctrl+Shift+F', category: 'Code' },
    { id: 'code.copy', label: 'Copy All', category: 'Code' },
  ],
});

export default DummyCodePanel;