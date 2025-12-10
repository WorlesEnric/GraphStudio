/**
 * FileList Component
 * Container for displaying files in grid or list view
 */

import React, { memo } from 'react';
import FileCard from './FileCard';
import FileRow from './FileRow';
import EmptyState from './EmptyState';

/**
 * FileList component
 */
function FileList({
    files,
    viewMode = 'grid',
    selectedFiles = new Set(),
    onSelect,
    onDelete,
    onPreview,
    onRename,
    onUpload,
}) {
    // Empty state
    if (files.length === 0) {
        return <EmptyState onUpload={onUpload} />;
    }

    // Grid view
    if (viewMode === 'grid') {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {files.map(file => (
                    <FileCard
                        key={file.id}
                        file={file}
                        isSelected={selectedFiles.has(file.id)}
                        onSelect={onSelect}
                        onDelete={onDelete}
                        onPreview={onPreview}
                        onRename={onRename}
                    />
                ))}
            </div>
        );
    }

    // List view
    return (
        <div className="space-y-1">
            {/* Header */}
            <div className="flex items-center gap-3 px-2 py-1 text-xs text-zinc-500 border-b border-white/5">
                <div className="w-5" /> {/* Checkbox space */}
                <div className="w-10" /> {/* Icon space */}
                <div className="flex-1">Name</div>
                <div className="w-20 text-right">Size</div>
                <div className="w-24 text-right hidden md:block">Modified</div>
                <div className="w-24" /> {/* Actions space */}
            </div>

            {/* Files */}
            {files.map(file => (
                <FileRow
                    key={file.id}
                    file={file}
                    isSelected={selectedFiles.has(file.id)}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    onPreview={onPreview}
                    onRename={onRename}
                />
            ))}
        </div>
    );
}

export default memo(FileList);