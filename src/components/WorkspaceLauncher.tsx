import { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { motion } from 'framer-motion';
import WorkspaceSelectorModal from './WorkspaceSelectorModal';
import Background from './Background';

export default function WorkspaceLauncher() {
  const { createWorkspace, openWorkspace } = useWorkspace();
  const [showSelector, setShowSelector] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleBuildFromScratch = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      // Generate default name: "Workspace - Dec 19, 2025"
      const date = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const name = `Workspace - ${date}`;

      // Create empty workspace
      const workspace = await createWorkspace(name, 'Your new workspace');

      // Open it
      await openWorkspace(workspace.id);
    } catch (err) {
      console.error('Failed to create workspace:', err);
      alert('Failed to create workspace. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenWorkspace = () => {
    setShowSelector(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] overflow-hidden relative">
      {/* GraphStudio Animation Background */}
      <Background />

      {/* Main Content */}
      <div className="relative z-10 text-center px-4">
        <motion.h1
          className="text-7xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          GraphStudio<span className="text-blue-400 animate-pulse">_</span>
        </motion.h1>

        <motion.p
          className="text-gray-400 text-xl mb-12 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          AI-powered panel-based IDE for rapid prototyping
        </motion.p>

        <motion.div
          className="flex gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <button
            onClick={handleOpenWorkspace}
            className="group relative px-8 py-4 bg-white text-black hover:bg-gray-200 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-white/20"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
              Open Workspace
            </span>
          </button>

          <button
            onClick={handleBuildFromScratch}
            disabled={isCreating}
            className="group relative px-8 py-4 bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {isCreating ? 'Creating...' : 'Build from Scratch'}
            </span>
          </button>
        </motion.div>

        <motion.div
          className="mt-8 text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <p>
            Press <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">⌘</kbd> +{' '}
            <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">K</kbd> to open command palette
          </p>
        </motion.div>
      </div>

      {/* Workspace Selector Modal */}
      {showSelector && (
        <WorkspaceSelectorModal onClose={() => setShowSelector(false)} />
      )}
    </div>
  );
}
