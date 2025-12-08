import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Plus, Sparkles } from 'lucide-react';
import useStudioStore from '../context/StudioContext';
import { getAllPanelDefinitions, getPanelsByCategories } from '../panels/registry';
import { PanelCategories } from '../panels/BasePanelInterface';

/**
 * AddPanelModal - Modal for adding new panels to the workspace
 * 
 * Displays all available panel types organized by category
 * with search functionality
 */
export default function AddPanelModal() {
  const { closeAddPanelModal, addPanel, setFocusedPanel } = useStudioStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hoveredPanel, setHoveredPanel] = useState(null);
  const inputRef = useRef(null);

  // Focus search input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Get all panel definitions
  const allPanels = getAllPanelDefinitions();
  const panelsByCategory = getPanelsByCategories();

  // Category labels
  const categoryLabels = {
    [PanelCategories.CREATION]: { label: 'Creation', description: 'Create and design' },
    [PanelCategories.DATA]: { label: 'Data & Notes', description: 'Manage information' },
    [PanelCategories.AI]: { label: 'AI & Assistant', description: 'AI-powered tools' },
    [PanelCategories.UTILITY]: { label: 'Utilities', description: 'Tools and settings' },
    [PanelCategories.PREVIEW]: { label: 'Preview', description: 'View outputs' },
  };

  // Filter panels by search query
  const filteredPanels = allPanels.filter(panel => {
    const matchesSearch =
      panel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      panel.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || panel.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group filtered panels by category
  const filteredByCategory = {};
  filteredPanels.forEach(panel => {
    if (!filteredByCategory[panel.category]) {
      filteredByCategory[panel.category] = [];
    }
    filteredByCategory[panel.category].push(panel);
  });

  // Handle panel selection
  const handleAddPanel = (panelDef) => {
    const initialState = panelDef.getInitialState?.() || {};
    const newPanelId = addPanel(panelDef.id, {
      ...initialState,
      title: panelDef.name
    });
    setFocusedPanel(newPanelId);
    closeAddPanelModal();
  };

  // Keyboard handling
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeAddPanelModal();
    }
  };

  // Accent color classes
  const accentColorClasses = {
    violet: 'from-violet-500 to-violet-600 shadow-violet-500/25',
    cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-500/25',
    amber: 'from-amber-500 to-amber-600 shadow-amber-500/25',
    green: 'from-green-500 to-green-600 shadow-green-500/25',
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/25',
    pink: 'from-pink-500 to-pink-600 shadow-pink-500/25',
  };

  const accentBorderClasses = {
    violet: 'border-violet-500/30 hover:border-violet-500/50',
    cyan: 'border-cyan-500/30 hover:border-cyan-500/50',
    amber: 'border-amber-500/30 hover:border-amber-500/50',
    green: 'border-green-500/30 hover:border-green-500/50',
    blue: 'border-blue-500/30 hover:border-blue-500/50',
    emerald: 'border-emerald-500/30 hover:border-emerald-500/50',
    pink: 'border-pink-500/30 hover:border-pink-500/50',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={closeAddPanelModal}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl animate-slide-up">
        <div className="rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Plus size={20} className="text-white" />
                Add Panel
              </h2>
              <p className="text-sm text-zinc-500 mt-0.5">
                Choose a panel type to add to your workspace
              </p>
            </div>
            <button
              onClick={closeAddPanelModal}
              className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search & Filter */}
          <div className="px-6 py-4 border-b border-white/5 space-y-4">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/30 border border-white/5 focus-within:border-white/20 transition-colors">
              <Search size={18} className="text-zinc-500" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search panels..."
                className="flex-1 text-sm text-white placeholder-zinc-500 bg-transparent outline-none"
              />
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                  ${selectedCategory === 'all'
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                All Panels
              </button>

              {Object.entries(categoryLabels).map(([key, { label }]) => (
                panelsByCategory[key] && (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                      ${selectedCategory === key
                        ? 'bg-zinc-800 text-white border border-zinc-700'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    {label}
                  </button>
                )
              ))}
            </div>
          </div>

          {/* Panel grid */}
          <div className="p-6 max-h-[50vh] overflow-y-auto">
            {filteredPanels.length === 0 ? (
              <div className="text-center py-12">
                <Search size={48} className="mx-auto mb-4 text-zinc-700" />
                <p className="text-zinc-500">No panels found</p>
                <p className="text-sm text-zinc-600 mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(filteredByCategory).map(([category, panels]) => (
                  <div key={category}>
                    {/* Category header */}
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-medium text-zinc-400">
                        {categoryLabels[category]?.label || category}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-zinc-500">
                        {panels.length}
                      </span>
                    </div>

                    {/* Panel cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {panels.map((panelDef) => {
                        const Icon = panelDef.icon; // Keeping icon here for reference in the grid, though not used as avatar in sidebar anymore.
                        const isHovered = hoveredPanel === panelDef.id;

                        return (
                          <button
                            key={panelDef.id}
                            onClick={() => handleAddPanel(panelDef)}
                            onMouseEnter={() => setHoveredPanel(panelDef.id)}
                            onMouseLeave={() => setHoveredPanel(null)}
                            className={`
                              group relative flex items-start gap-4 p-4 rounded-xl
                              bg-zinc-800/30 border border-white/5 transition-all duration-200
                              hover:bg-zinc-800 hover:border-white/20 hover:shadow-lg
                            `}
                          >
                            {/* Icon - Neutralized */}
                            <div className={`
                              p-3 rounded-xl bg-zinc-700/50 shadow-inner transition-transform
                              ${isHovered ? 'scale-110' : ''}
                            `}>
                              <Icon size={20} className="text-white" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 text-left">
                              <h4 className="text-sm font-semibold text-white group-hover:text-white transition-colors">
                                {panelDef.name}
                              </h4>
                              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                                {panelDef.description}
                              </p>
                            </div>

                            {/* Add indicator */}
                            <div className={`
                              absolute top-2 right-2 p-1.5 rounded-lg
                              bg-white/5 text-zinc-500
                              opacity-0 group-hover:opacity-100 transition-opacity
                            `}>
                              <Plus size={14} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-black/20">
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <Sparkles size={14} />
              <span>Panels integrate with AI for contextual assistance</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded bg-zinc-800 text-zinc-500 text-xs font-mono">
                esc
              </kbd>
              <span className="text-xs text-zinc-600">to close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}