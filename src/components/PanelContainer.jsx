import React, { useCallback } from 'react';
import useStudioStore from '../context/StudioContext';
import { getPanelDefinition } from '../panels/registry';
import { useDropTarget } from '../hooks/useDragDrop';
import PanelHeader from './PanelHeader';

/**
 * PanelContainer - Wrapper for panel content with consistent styling
 * 
 * Handles:
 * - Panel chrome (header, controls)
 * - Drag & drop target
 * - Focus management
 * - Mode-specific rendering
 */
export default function PanelContainer({ panel, widthClass, isFocused }) {
  const {
    updatePanelState,
    setFocusedPanel,
    updatePanelMode,
  } = useStudioStore();

  // Get panel definition
  const panelDef = getPanelDefinition(panel.panelTypeId);

  // Setup drop target
  const { isOver, dropProps } = useDropTarget(
    panel.id,
    panel.panelTypeId,
    panel.state,
    (newState) => updatePanelState(panel.id, newState)
  );

  // Handle panel focus
  const handleFocus = useCallback(() => {
    setFocusedPanel(panel.id);
  }, [panel.id, setFocusedPanel]);

  // Update state callback for panel
  const updateState = useCallback((newState) => {
    updatePanelState(panel.id, newState);
  }, [panel.id, updatePanelState]);

  if (!panelDef) {
    return (
      <div className={`${widthClass} rounded-2xl bg-zinc-900 border border-white/10 p-4`}>
        <p className="text-red-400">Unknown panel type: {panel.panelTypeId}</p>
      </div>
    );
  }

  // No accent colors needed for monochrome theming, reusing structure but with zinc scales

  // Minimized mode - render as a thin bar
  if (panel.mode === 'minimized') {
    return (
      <div
        onClick={() => updatePanelMode(panel.id, 'flexible')}
        className={`
          ${widthClass} h-full flex flex-col items-center py-4 gap-3
          rounded-2xl bg-zinc-900/80 backdrop-blur border border-white/10
          cursor-pointer hover:bg-zinc-800/80 transition-all
        `}
      >
        {/* Icon */}
        <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400">
          <panelDef.icon size={16} />
        </div>

        {/* Vertical title */}
        <span className="text-xs font-medium text-zinc-400 vertical-text">
          {panel.title}
        </span>
      </div>
    );
  }

  return (
    <div
      {...dropProps}
      onClick={handleFocus}
      className={`
        ${widthClass} h-full flex flex-col
        rounded-2xl overflow-hidden
        bg-zinc-900/40 backdrop-blur-xl
        border transition-all duration-300
        ${isFocused
          ? `border-white/20 shadow-lg shadow-black/50`
          : 'border-white/5 hover:border-white/10'
        }
        ${isOver ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-[#0a0a0c]' : ''}
        ${panel.isAIObserving ? 'glow-active' : ''}
      `}
    >
      {/* Header */}
      <PanelHeader
        panel={panel}
        panelDef={panelDef}
        isFocused={isFocused}
      />

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {panelDef.renderMainView({
          panelState: panel.state,
          updateState,
          isFocused,
          panelId: panel.id,
        })}
      </div>

      {/* Drop indicator overlay */}
      {isOver && (
        <div className="absolute inset-0 bg-white/10 pointer-events-none flex items-center justify-center">
          <div className="px-4 py-2 rounded-lg bg-zinc-800 border border-white/20 text-white text-sm font-medium">
            Drop here
          </div>
        </div>
      )}
    </div>
  );
}