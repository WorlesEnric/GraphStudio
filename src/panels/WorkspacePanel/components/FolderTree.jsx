/**
 * FolderTree Component
 * Folder navigation tree (simplified for initial version)
 */

import React, { memo, useState } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown, Plus } from 'lucide-react';

/**
 * FolderItem component
 */
function FolderItem({ folder, isOpen, isSelected, onToggle, onSelect, level = 0 }) {
    return (
        <div>
            <button
                onClick={() => {
                    onSelect?.(folder.path);
                    if (folder.children?.length > 0) {
                        onToggle?.(folder.path);
                    }
                }}
                className={`
          w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors
          ${isSelected ? 'bg-violet-500/10 text-violet-300' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-300'}
        `}
                style={{ paddingLeft: `${(level * 16) + 8}px` }}
            >
                {/* Expand/collapse indicator */}
                {folder.children?.length > 0 ? (
                    isOpen ? (
                        <ChevronDown size={12} className="flex-shrink-0" />
                    ) : (
                        <ChevronRight size={12} className="flex-shrink-0" />
                    )
                ) : (
                    <span className="w-3" />
                )}

                {/* Folder icon */}
                {isOpen ? (
                    <FolderOpen size={14} className="text-yellow-400 flex-shrink-0" />
                ) : (
                    <Folder size={14} className="text-yellow-400 flex-shrink-0" />
                )}

                {/* Name */}
                <span className="text-xs truncate">{folder.name}</span>

                {/* File count */}
                {folder.fileCount > 0 && (
                    <span className="ml-auto text-[10px] text-zinc-600">{folder.fileCount}</span>
                )}
            </button>

            {/* Children */}
            {isOpen && folder.children?.map(child => (
                <FolderItem
                    key={child.path}
                    folder={child}
                    isOpen={child.isOpen}
                    isSelected={child.isSelected}
                    onToggle={onToggle}
                    onSelect={onSelect}
                    level={level + 1}
                />
            ))}
        </div>
    );
}

/**
 * FolderTree component
 */
function FolderTree({
    folders = [],
    currentPath = '/',
    onNavigate,
    onCreateFolder,
}) {
    const [openFolders, setOpenFolders] = useState(new Set(['/']));

    // Build root folder
    const rootFolder = {
        name: 'Workspace',
        path: '/',
        children: folders,
        fileCount: 0,
    };

    // Toggle folder open state
    const handleToggle = (path) => {
        setOpenFolders(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    return (
        <div className="py-2">
            {/* Header */}
            <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-[10px] uppercase tracking-wider text-zinc-600">Folders</span>
                {onCreateFolder && (
                    <button
                        onClick={onCreateFolder}
                        className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors"
                        title="New Folder"
                    >
                        <Plus size={12} />
                    </button>
                )}
            </div>

            {/* Tree */}
            <div className="px-1">
                <FolderItem
                    folder={rootFolder}
                    isOpen={openFolders.has('/')}
                    isSelected={currentPath === '/'}
                    onToggle={handleToggle}
                    onSelect={onNavigate}
                />
            </div>
        </div>
    );
}

export default memo(FolderTree);