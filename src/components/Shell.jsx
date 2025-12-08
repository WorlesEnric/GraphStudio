import React, { useEffect } from 'react';
import useStudioStore, { useKeyboardShortcuts } from '../context/StudioContext';
import Sidebar from './Sidebar';
import Workspace from './Workspace';
import CommandPalette from './CommandPalette';
import AddPanelModal from './AddPanelModal';
import SettingsModal from './SettingsModal';
import HelpModal from './HelpModal';

import Background from './Background';

/**
 * Shell - The main container/commander for the entire IDE
 * 
 * Responsibilities:
 * - Layout management
 * - Keyboard shortcuts
 * - Global modals (command palette, add panel)
 * - Cross-panel coordination
 * */
export default function Shell() {
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  const { commandPaletteOpen, addPanelModalOpen, settingsModalOpen, helpModalOpen } = useStudioStore();

  return (
    <div className="flex h-screen w-full bg-primary text-text-primary overflow-hidden relative">
      <Background />

      {/* Main layout */}
      <div className="relative flex w-full z-10">
        {/* Left Sidebar (The Dock) */}
        <Sidebar />

        {/* Main Workspace */}
        <Workspace />
      </div>

      {/* Command Palette Modal */}
      {commandPaletteOpen && <CommandPalette />}

      {/* Add Panel Modal */}
      {addPanelModalOpen && <AddPanelModal />}

      {/* Settings Modal */}
      {settingsModalOpen && <SettingsModal />}

      {/* Help Modal */}
      {helpModalOpen && <HelpModal />}

      {/* Keyboard shortcut hints */}
      <div className="fixed bottom-4 right-4 flex items-center gap-3 text-xs text-zinc-600 pointer-events-none z-50">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-500 font-mono">⌘K</kbd>
          Command
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-500 font-mono">⌘N</kbd>
          New Panel
        </span>
      </div>
    </div>
  );
}