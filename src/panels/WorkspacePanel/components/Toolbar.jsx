/**
 * Toolbar Component
 * Search, view toggle, sort, and action buttons
 */

import React, { memo, useState } from 'react';
import {
    Search,
    Grid,
    List,
    Upload,
    Trash2,
    SortAsc,
    SortDesc,
    Filter,
    ChevronDown,
    FolderPlus,
    RefreshCw,
} from 'lucide-react';
import { FILE_CATEGORIES } from '../utils/mimeTypes';
import { formatFileSize } from '../utils/fileUtils';

/**
 * Sort options
 */
const SORT_OPTIONS = [
    { id: 'name', label: 'Name' },
    { id: 'size', label: 'Size' },
    { id: 'date', label: 'Date Modified' },
    { id: 'type', label: 'Type' },
];

/**
 * Category options for filter
 */
const CATEGORY_OPTIONS = [
    { id: 'all', label: 'All Files', color: 'zinc' },
    ...Object.entries(FILE_CATEGORIES).map(([id, config]) => ({
        id,
        label: config.label,
        color: config.color,
    })),
];

/**
 * Toolbar component
 */
function Toolbar({
    viewMode,
    sortBy,
    sortOrder,
    searchQuery,
    selectedCategory,
    selectedCount = 0,
    totalCount = 0,
    totalSize = 0,
    onViewModeChange,
    onSortChange,
    onSortOrderChange,
    onSearchChange,
    onCategoryChange,
    onUpload,
    onDeleteSelected,
    onRefresh,
    onCreateFolder,
}) {
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    return (
        <div className="flex flex-col gap-2 p-4 border-b border-white/5 bg-zinc-900/50">
            {/* Main toolbar row */}
            <div className="flex items-center gap-3">
                {/* Search */}
                <div className="flex-1 relative max-w-md">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-zinc-800/50 border border-white/5 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500/50 focus:outline-none transition-colors"
                    />
                </div>

                {/* Filter dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${selectedCategory !== 'all'
                                ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                                : 'bg-zinc-800/50 border-white/5 text-zinc-400 hover:text-zinc-300'
                            }`}
                    >
                        <Filter size={14} />
                        <span className="hidden sm:inline">
                            {CATEGORY_OPTIONS.find(c => c.id === selectedCategory)?.label || 'Filter'}
                        </span>
                        <ChevronDown size={12} />
                    </button>

                    {showFilterMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)} />
                            <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-800 rounded-lg border border-white/10 shadow-xl z-50 py-1">
                                {CATEGORY_OPTIONS.map(option => (
                                    <button
                                        key={option.id}
                                        onClick={() => {
                                            onCategoryChange(option.id);
                                            setShowFilterMenu(false);
                                        }}
                                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${selectedCategory === option.id
                                                ? 'bg-violet-500/10 text-violet-300'
                                                : 'text-zinc-300 hover:bg-white/5'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full bg-${option.color}-400`} />
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Sort dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowSortMenu(!showSortMenu)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-white/5 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
                    >
                        {sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
                        <span className="hidden sm:inline">
                            {SORT_OPTIONS.find(s => s.id === sortBy)?.label || 'Sort'}
                        </span>
                        <ChevronDown size={12} />
                    </button>

                    {showSortMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                            <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-800 rounded-lg border border-white/10 shadow-xl z-50 py-1">
                                {SORT_OPTIONS.map(option => (
                                    <button
                                        key={option.id}
                                        onClick={() => {
                                            if (sortBy === option.id) {
                                                onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
                                            } else {
                                                onSortChange(option.id);
                                            }
                                            setShowSortMenu(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs transition-colors ${sortBy === option.id
                                                ? 'bg-violet-500/10 text-violet-300'
                                                : 'text-zinc-300 hover:bg-white/5'
                                            }`}
                                    >
                                        {option.label}
                                        {sortBy === option.id && (
                                            sortOrder === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* View mode toggle */}
                <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-0.5 border border-white/5">
                    <button
                        onClick={() => onViewModeChange('grid')}
                        className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        title="Grid view"
                    >
                        <Grid size={14} />
                    </button>
                    <button
                        onClick={() => onViewModeChange('list')}
                        className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        title="List view"
                    >
                        <List size={14} />
                    </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    {selectedCount > 0 && (
                        <button
                            onClick={onDeleteSelected}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
                        >
                            <Trash2 size={14} />
                            <span className="hidden sm:inline">Delete ({selectedCount})</span>
                        </button>
                    )}

                    <button
                        onClick={onUpload}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500 text-white hover:bg-violet-400 transition-colors text-sm font-medium"
                    >
                        <Upload size={14} />
                        <span className="hidden sm:inline">Upload</span>
                    </button>
                </div>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between text-xs text-zinc-500">
                <div className="flex items-center gap-4">
                    <span>{totalCount} file{totalCount !== 1 ? 's' : ''}</span>
                    <span>{formatFileSize(totalSize)}</span>
                    {selectedCount > 0 && (
                        <span className="text-violet-400">{selectedCount} selected</span>
                    )}
                </div>

                <button
                    onClick={onRefresh}
                    className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors"
                    title="Refresh"
                >
                    <RefreshCw size={12} />
                </button>
            </div>
        </div>
    );
}

export default memo(Toolbar);