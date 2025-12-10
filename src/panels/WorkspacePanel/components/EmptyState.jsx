/**
 * EmptyState Component
 * Displayed when workspace has no files
 */

import React, { memo } from 'react';
import { Folder, Upload, FileImage, FileText, FileCode } from 'lucide-react';

/**
 * EmptyState component
 */
function EmptyState({ onUpload }) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8">
            {/* Icon */}
            <div className="relative mb-6">
                <div className="w-24 h-24 rounded-2xl bg-zinc-800/50 border border-white/5 flex items-center justify-center">
                    <Folder size={48} className="text-zinc-600" />
                </div>
                {/* Floating file icons */}
                <div className="absolute -top-2 -left-4 w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center animate-float">
                    <FileImage size={14} className="text-purple-400" />
                </div>
                <div className="absolute -bottom-2 -right-4 w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center animate-float" style={{ animationDelay: '0.5s' }}>
                    <FileText size={14} className="text-blue-400" />
                </div>
                <div className="absolute top-1/2 -right-6 w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center animate-float" style={{ animationDelay: '1s' }}>
                    <FileCode size={14} className="text-green-400" />
                </div>
            </div>

            {/* Text */}
            <h3 className="text-lg font-semibold text-zinc-300 mb-2">
                No Files Yet
            </h3>
            <p className="text-sm text-zinc-500 max-w-sm mb-6">
                Upload files to your workspace. Drag and drop files here or click the button below.
            </p>

            {/* Upload button */}
            <button
                onClick={onUpload}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-400 transition-colors shadow-lg shadow-violet-500/20"
            >
                <Upload size={18} />
                Upload Files
            </button>

            {/* Supported formats */}
            <p className="text-xs text-zinc-600 mt-6">
                Supports images, documents, code files, and more
            </p>

            {/* Keyboard hint */}
            <p className="text-xs text-zinc-600 mt-2">
                Or drag & drop files anywhere in this panel
            </p>
        </div>
    );
}

export default memo(EmptyState);