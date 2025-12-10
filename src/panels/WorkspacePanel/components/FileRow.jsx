/**
 * FileRow Component
 * Row display for files in list view
 */

import React, { memo, useState } from 'react';
import { Trash2, Download, Eye, MoreVertical, Edit, Copy, Check } from 'lucide-react';
import FileIcon from './FileIcon';
import { formatFileSize, formatDate, downloadFile } from '../utils/fileUtils';

/**
 * FileRow component
 */
function FileRow({
    file,
    isSelected = false,
    onSelect,
    onDelete,
    onPreview,
    onRename,
}) {
    const [showMenu, setShowMenu] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(file.name);

    // Handle click
    const handleClick = (e) => {
        if (e.ctrlKey || e.metaKey) {
            onSelect?.(file.id, true);
        } else {
            onSelect?.(file.id, false);
        }
    };

    // Handle double click
    const handleDoubleClick = () => {
        onPreview?.(file);
    };

    // Handle rename submit
    const handleRenameSubmit = () => {
        if (newName.trim() && newName !== file.name) {
            onRename?.(file.id, newName.trim());
        }
        setIsRenaming(false);
    };

    // Handle rename key down
    const handleRenameKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleRenameSubmit();
        } else if (e.key === 'Escape') {
            setNewName(file.name);
            setIsRenaming(false);
        }
    };

    return (
        <div
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            className={`
        flex items-center gap-3 p-2 rounded-lg group cursor-pointer transition-all
        ${isSelected
                    ? 'bg-violet-500/10 border border-violet-500/30'
                    : 'border border-transparent hover:bg-white/5 hover:border-white/5'
                }
      `}
        >
            {/* Selection checkbox */}
            <div
                className={`
          w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors
          ${isSelected
                        ? 'bg-violet-500'
                        : 'bg-zinc-800 border border-white/10 group-hover:border-white/20'
                    }
        `}
            >
                {isSelected && <Check size={12} className="text-white" />}
            </div>

            {/* Icon */}
            <div className="p-2 rounded bg-zinc-800/50 flex-shrink-0">
                <FileIcon file={file} size={16} />
            </div>

            {/* File name */}
            <div className="flex-1 min-w-0">
                {isRenaming ? (
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={handleRenameKeyDown}
                        autoFocus
                        className="w-full bg-zinc-800 border border-violet-500/50 rounded px-2 py-0.5 text-sm text-white focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <h4 className="text-sm text-zinc-200 truncate" title={file.name}>
                        {file.name}
                    </h4>
                )}
            </div>

            {/* Size */}
            <div className="w-20 text-xs text-zinc-500 text-right flex-shrink-0">
                {formatFileSize(file.size)}
            </div>

            {/* Date */}
            <div className="w-24 text-xs text-zinc-500 text-right flex-shrink-0 hidden md:block">
                {formatDate(file.lastModified)}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onPreview?.(file);
                    }}
                    className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    title="Preview"
                >
                    <Eye size={14} />
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(file);
                    }}
                    className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    title="Download"
                >
                    <Download size={14} />
                </button>

                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                        <MoreVertical size={14} />
                    </button>

                    {showMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(false);
                                }}
                            />
                            <div className="absolute right-0 top-full mt-1 w-36 bg-zinc-800 rounded-lg border border-white/10 shadow-xl z-50 py-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsRenaming(true);
                                        setShowMenu(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
                                >
                                    <Edit size={12} />
                                    Rename
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(file.name);
                                        setShowMenu(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
                                >
                                    <Copy size={12} />
                                    Copy Name
                                </button>
                                <hr className="my-1 border-white/5" />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete?.(file.id);
                                        setShowMenu(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                                >
                                    <Trash2 size={12} />
                                    Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default memo(FileRow);