import React, { useState } from 'react';
import { Layout, Plus, Settings, HelpCircle, Sparkles, User as UserIcon, LogOut, CreditCard, Network, Upload, ArrowLeftRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import useStudioStore from '../context/StudioContext';
import { getPanelDefinition } from '../panels/registry';

/**
 * Sidebar - The dock for panel icons and quick actions
 */
export default function Sidebar() {
  const {
    panels,
    updatePanelMode,
    focusedPanelId,
    setFocusedPanel,
    openAddPanelModal,
    openCommandPalette,
    openSettingsModal,
    openHelpModal,
    openNOGViewer,
    openPublishPanelModal,
    openWorkspaceSelectorModal
  } = useStudioStore();

  const { user, logout } = useAuth();
  const { currentWorkspace } = useWorkspace();

  const [hoveredPanel, setHoveredPanel] = useState(null);

  // Toggle panel visibility
  const togglePanel = (panelId, currentMode) => {
    if (currentMode === 'hidden') {
      updatePanelMode(panelId, 'flexible');
      setFocusedPanel(panelId);
    } else {
      updatePanelMode(panelId, 'hidden');
      if (focusedPanelId === panelId) {
        setFocusedPanel(null);
      }
    }
  };

  // Get accent color for panel
  const getAccentColor = (panel, isActive, isHovered) => {
    let panelDef = getPanelDefinition(panel.panelTypeId);

    // Create fallback panelDef for marketplace panels
    if (!panelDef && panel._marketplace) {
      panelDef = {
        accentColor: panel._marketplace.accentColor,
      };
    }

    // Monochrome accent (no color variations)
    const panelAccent = {
      bg: 'bg-white',
      ring: 'ring-white',
      glow: 'shadow-white/20'
    };

    return panelAccent;
  };

  return (
    <div className="w-20 flex-shrink-0 flex flex-col items-center py-5 px-2 border-r border-white/5 bg-black/40 backdrop-blur-xl z-30">
      {/* Logo */}
      <div className="mb-6 relative group cursor-pointer" onClick={openCommandPalette}>
        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-white/10 group-hover:scale-105 transition-transform">
          <Layout size={22} className="text-black" />
        </div>

        {/* Tooltip */}
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
          GraphStudio IDE
          <span className="block text-zinc-500 text-[10px] mt-0.5">Press ⌘K for commands</span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-zinc-800 mb-4" />

      {/* Workspace Switcher */}
      {currentWorkspace && (
        <div className="w-full mb-4">
          <button
            onClick={openWorkspaceSelectorModal}
            className="w-12 h-12 mx-auto rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 flex items-center justify-center transition-all duration-200 relative group"
            title="Switch Workspace"
          >
            <ArrowLeftRight size={18} className="text-gray-400 group-hover:text-white" />

            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
              <div className="font-medium">{currentWorkspace.name}</div>
              <div className="text-zinc-500 text-[10px] mt-0.5">Click to switch workspace</div>
            </div>
          </button>
        </div>
      )}

      {/* Panel Icons */}
      <div className="flex-1 flex flex-col items-center gap-3 overflow-y-auto hide-scrollbar w-full">
        {panels.map((panel) => {
          let panelDef = getPanelDefinition(panel.panelTypeId);

          // Create fallback panelDef for marketplace panels
          if (!panelDef && panel._marketplace) {
            panelDef = {
              id: panel._marketplace.panelId,
              name: panel._marketplace.name,
              description: panel._marketplace.category || 'Marketplace Panel',
              icon: ({ size }) => (
                <span style={{ fontSize: size || 16 }}>{panel._marketplace.icon}</span>
              ),
              category: panel._marketplace.category,
              accentColor: panel._marketplace.accentColor,
              exportFormats: [],
            };
          }

          if (!panelDef) return null;

          const isActive = panel.mode !== 'hidden';
          const isFocused = focusedPanelId === panel.id;
          const isHovered = hoveredPanel === panel.id;

          // Get first letter for avatar
          const letter = panel.title ? panel.title.charAt(0).toUpperCase() : '?';

          return (
            <div key={panel.id} className="relative w-full flex justify-center">
              <button
                onClick={() => togglePanel(panel.id, panel.mode)}
                onMouseEnter={() => setHoveredPanel(panel.id)}
                onMouseLeave={() => setHoveredPanel(null)}
                className={`
                  relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
                  font-semibold text-lg
                  ${isActive
                    ? 'bg-white text-black ring-2 ring-zinc-800 shadow-lg shadow-white/10'
                    : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                  }
                  ${isFocused ? 'scale-110' : ''}
                `}
              >
                {/* Letter Avatar */}
                {letter}

                {/* AI observing indicator */}
                {panel.isAIObserving && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-white border-2 border-black animate-pulse" />
                )}
              </button>

              {/* Tooltip */}
              <div className={`
                absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50
                px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 shadow-xl
                whitespace-nowrap pointer-events-none
                transition-all duration-150
                ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
              `}>
                <div className="text-sm font-medium text-white">{panel.title}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{panelDef.description}</div>
                <div className="text-[10px] text-zinc-600 mt-1">
                  {isActive ? 'Click to hide' : 'Click to show'}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Panel Button */}
        <button
          onClick={openAddPanelModal}
          className="w-12 h-12 rounded-full border border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-all mt-2 group"
        >
          <Plus size={20} />

          {/* Tooltip */}
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Add Panel
            <span className="text-zinc-500 ml-2">⌘N</span>
          </div>
        </button>
      </div>

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-2 mt-4 pt-4 border-t border-white/5">
        {/* User Profile */}
        <div className="relative group">
          <button className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold shadow-lg shadow-white/10">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </button>

          {/* Popover Menu */}
          <div className="absolute left-full bottom-0 ml-3 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="px-3 py-2 border-b border-zinc-800 mb-1">
              <div className="text-sm font-medium text-white truncate">{user?.full_name || 'User'}</div>
              <div className="text-xs text-zinc-500 truncate">{user?.email}</div>
              <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">{user?.subscription?.plan_name || 'FREE'}</div>
            </div>
            <Link to="/pricing" className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
              <CreditCard size={14} />
              Subscription
            </Link>
            <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-zinc-800 rounded-lg transition-colors">
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
        <button
          onClick={openNOGViewer}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-colors group relative"
        >
          <Network size={18} />
          <div className="absolute left-full ml-3 px-2 py-1 rounded bg-zinc-800 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            NOG Viewer
          </div>
        </button>
        <button
          onClick={openPublishPanelModal}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-colors group relative"
        >
          <Upload size={18} />
          <div className="absolute left-full ml-3 px-2 py-1 rounded bg-zinc-800 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Publish Panel
          </div>
        </button>
        <button
          onClick={openHelpModal}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-colors group relative"
        >
          <HelpCircle size={18} />
          <div className="absolute left-full ml-3 px-2 py-1 rounded bg-zinc-800 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Help
          </div>
        </button>
        <button
          onClick={openSettingsModal}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-colors group relative"
        >
          <Settings size={18} />
          <div className="absolute left-full ml-3 px-2 py-1 rounded bg-zinc-800 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Settings
          </div>
        </button>
      </div>
    </div>
  );
}