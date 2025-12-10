import React from 'react';
import { Layout, Plus } from 'lucide-react';
import useStudioStore from '../context/StudioContext';
import PanelContainer from './PanelContainer';

/**
 * Workspace - The main area where panels are displayed
 * 
 * Handles:
 * - Panel layout (flexible, fullscreen, minimized)
 * - Empty state
 * - Panel transitions
 */
export default function Workspace() {
  const {
    panels,
    activeFullscreenId,
    focusedPanelId,
    openAddPanelModal
  } = useStudioStore();

  // Get visible panels (not hidden)
  const visiblePanels = panels.filter(p => p.mode !== 'hidden');

  // Check if we have any panels at all
  const hasNoPanels = panels.length === 0;
  const hasNoVisiblePanels = visiblePanels.length === 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Workspace Header */}
      <div className="h-12 flex items-center justify-between px-6 border-b border-white/5 bg-black/20 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-zinc-300">Workspace</h1>
          <span className="text-xs text-zinc-600">
            {visiblePanels.length} panel{visiblePanels.length !== 1 ? 's' : ''} active
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick add button */}
          <button
            onClick={openAddPanelModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Plus size={14} />
            Add Panel
          </button>
        </div>
      </div>

      {/* Main workspace area */}
      <div className="flex-1 overflow-hidden p-4">
        {hasNoPanels || hasNoVisiblePanels ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center">
            <div className="relative">
              {/* Decorative background */}
              <div className="absolute inset-0 -m-20 bg-gradient-to-br from-zinc-800/10 to-transparent rounded-full blur-3xl pointer-events-none" />

              <div className="relative text-center z-10">
                <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center justify-center backdrop-blur-sm">
                  <Layout size={32} className="text-zinc-500" />
                </div>

                <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 flex items-center justify-center">
                  {hasNoPanels ? (
                    <>
                      <span className="text-zinc-500">Graph</span>
                      <span className="text-white">Studio</span>
                      <span className="animate-blink text-white ml-1">_</span>
                    </>
                  ) : (
                    <span className="text-zinc-300">No Active Panels</span>
                  )}
                </h2>
                <p className="text-base text-zinc-500 mb-8 max-w-md mx-auto">
                  {hasNoPanels
                    ? 'Get started by adding your first panel. Create flowcharts, Kanban boards, code, and more.'
                    : 'Click on a panel in the sidebar to show it, or add a new panel to get started.'
                  }
                </p>

                <button
                  onClick={openAddPanelModal}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5"
                >
                  <Plus size={18} />
                  Add Your First Panel
                </button>

                <p className="text-xs text-zinc-600 mt-8">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 font-mono mx-1">⌘N</kbd> for quick add
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Panels Grid */
          <div className="h-full flex gap-4 overflow-hidden">
            {visiblePanels.map((panel, index) => {
              // If another panel is fullscreen, hide this one
              if (activeFullscreenId && activeFullscreenId !== panel.id) {
                return null;
              }

              // Determine panel width based on mode
              let widthClass = '';
              if (panel.mode === 'fullscreen') {
                widthClass = 'w-full';
              } else if (panel.mode === 'minimized') {
                widthClass = 'w-16';
              } else {
                // Flexible mode - share space
                widthClass = 'flex-1 min-w-[300px] max-w-none';
              }

              return (
                <div
                  key={panel.id}
                  draggable={panel.mode !== 'fullscreen'}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', panel.id);
                    e.dataTransfer.effectAllowed = 'move';
                    // Add a class to styling
                    e.currentTarget.classList.add('opacity-50');
                  }}
                  onDragEnd={(e) => {
                    e.currentTarget.classList.remove('opacity-50');
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const sourceId = e.dataTransfer.getData('text/plain');
                    if (sourceId && sourceId !== panel.id) {
                      const { reorderPanels } = useStudioStore.getState();
                      reorderPanels(sourceId, panel.id);
                    }
                  }}
                  className={`${widthClass} h-full transition-all duration-300`}
                >
                  <PanelContainer
                    panel={panel}
                    widthClass="w-full"
                    isFocused={focusedPanelId === panel.id}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}