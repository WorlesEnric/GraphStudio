/**
 * FileCard Component
 * Card display for files in grid view
 */

import React, { memo, useState } from 'react';
import { Trash2, Download, Eye, MoreVertical, Edit, Copy, Check } from 'lucide-react';
import FileIcon from './FileIcon';
import { formatFileSize, formatDate, downloadFile } from '../utils/fileUtils';
import { isImageFile } from '../utils/mimeTypes';

/**
 * FileCard component
 */
function FileCard({
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

    const isImage = isImageFile(file.type);
    const hasPreview = isImage && file.preview;

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
        group relative p-3 rounded-xl border transition-all cursor-pointer
        ${isSelected
                    ? 'bg-violet-500/10 border-violet-500/30'
                    : 'bg-zinc-800/30 border-white/5 hover:border-white/10 hover:bg-zinc-800/50'
                }
      `}
        >
            {/* Selection indicator */}
            {isSelected && (
                <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center z-10">
                    <Check size={12} className="text-white" />
                </div>
            )}

            {/* Preview area */}
            <div className="aspect-square rounded-lg bg-black/20 mb-3 flex items-center justify-center overflow-hidden">
                {hasPreview ? (
                    <img
                        src={file.preview}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <FileIcon file={file} size={32} />
                )}
            </div>

            {/* File name */}
            {isRenaming ? (
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={handleRenameKeyDown}
                    autoFocus
                    className="w-full bg-zinc-800 border border-violet-500/50 rounded px-2 py-1 text-sm text-white focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <h4 className="text-sm text-zinc-200 truncate font-medium" title={file.name}>
                    {file.name}
                </h4>
            )}

            {/* File info */}
            <p className="text-xs text-zinc-500 mt-1">
                {formatFileSize(file.size)}
                {file.lastModified && (
                    <span className="ml-2">{formatDate(file.lastModified)}</span>
                )}
            </p>

            {/* Actions */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onPreview?.(file);
                    }}
                    className="p-1.5 rounded-full bg-black/50 text-white hover:bg-zinc-700 backdrop-blur-sm transition-colors"
                    title="Preview"
                >
                    <Eye size={12} />
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(file);
                    }}
                    className="p-1.5 rounded-full bg-black/50 text-white hover:bg-zinc-700 backdrop-blur-sm transition-colors"
                    title="Download"
                >
                    <Download size={12} />
                </button>

                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="p-1.5 rounded-full bg-black/50 text-white hover:bg-zinc-700 backdrop-blur-sm transition-colors"
                    >
                        <MoreVertical size={12} />
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
                                        // Copy file name to clipboard
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

export default memo(FileCard);