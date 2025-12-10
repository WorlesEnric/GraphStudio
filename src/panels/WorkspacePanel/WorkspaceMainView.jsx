/**
 * WorkspaceMainView Component
 * Main workspace interface combining all components
 */

import React, { useCallback, useMemo } from 'react';
import Toolbar from './components/Toolbar';
import FileList from './components/FileList';
import FilePreview from './components/FilePreview';
import UploadZone from './components/UploadZone';
import { useFiles } from './hooks/useFiles';
import { useFileUpload } from './hooks/useFileUpload';
import { useFilePreview } from './hooks/useFilePreview';

/**
 * WorkspaceMainView component
 */
function WorkspaceMainView({ panelState, updateState, isFocused }) {
    // File management hook
    const {
        files,
        displayedFiles,
        isLoading,
        error,
        viewMode,
        sortBy,
        sortOrder,
        searchQuery,
        selectedCategory,
        selectedFiles,
        hasSelection,
        stats,
        hasFiles,
        addFiles,
        deleteFile,
        deleteSelectedFiles,
        renameFile,
        clearSelection,
        selectFile,
        setViewMode,
        setSortBy,
        setSortOrder,
        setSearchQuery,
        setSelectedCategory,
    } = useFiles({ panelState, updateState });

    // File upload hook
    const {
        isDragging,
        isUploading,
        errors: uploadErrors,
        getInputProps,
        getRootProps,
        openFileDialog,
        clearErrors,
    } = useFileUpload({
        onUpload: addFiles,
    });

    // File preview hook
    const {
        isOpen: isPreviewOpen,
        currentFile: previewFile,
        content: previewContent,
        isLoading: isPreviewLoading,
        error: previewError,
        openPreview,
        closePreview,
        navigatePreview,
    } = useFilePreview();

    // Handle delete with confirmation
    const handleDelete = useCallback((fileId) => {
        const file = files.find(f => f.id === fileId);
        if (file && window.confirm(`Delete "${file.name}"?`)) {
            deleteFile(fileId);
        }
    }, [files, deleteFile]);

    // Handle delete selected with confirmation
    const handleDeleteSelected = useCallback(() => {
        if (selectedFiles.size > 0) {
            if (window.confirm(`Delete ${selectedFiles.size} selected file(s)?`)) {
                deleteSelectedFiles();
            }
        }
    }, [selectedFiles, deleteSelectedFiles]);

    // Navigation in preview
    const handlePreviousPreview = useCallback(() => {
        navigatePreview(displayedFiles, 'prev');
    }, [displayedFiles, navigatePreview]);

    const handleNextPreview = useCallback(() => {
        navigatePreview(displayedFiles, 'next');
    }, [displayedFiles, navigatePreview]);

    // Check if there are previous/next files
    const { hasPrevious, hasNext } = useMemo(() => {
        if (!previewFile) return { hasPrevious: false, hasNext: false };

        const currentIndex = displayedFiles.findIndex(f => f.id === previewFile.id);
        return {
            hasPrevious: currentIndex > 0,
            hasNext: currentIndex < displayedFiles.length - 1,
        };
    }, [previewFile, displayedFiles]);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        // In a real app, this would re-fetch files from server
        clearErrors();
        clearSelection();
    }, [clearErrors, clearSelection]);

    return (
        <div
            {...getRootProps()}
            className="flex flex-col h-full bg-zinc-900/30 relative"
        >
            {/* Hidden file input */}
            <input {...getInputProps()} />

            {/* Upload zone overlay */}
            <UploadZone isDragging={isDragging} />

            {/* Toolbar */}
            <Toolbar
                viewMode={viewMode}
                sortBy={sortBy}
                sortOrder={sortOrder}
                searchQuery={searchQuery}
                selectedCategory={selectedCategory}
                selectedCount={selectedFiles.size}
                totalCount={files.length}
                totalSize={stats.totalSize}
                onViewModeChange={setViewMode}
                onSortChange={setSortBy}
                onSortOrderChange={setSortOrder}
                onSearchChange={setSearchQuery}
                onCategoryChange={setSelectedCategory}
                onUpload={openFileDialog}
                onDeleteSelected={handleDeleteSelected}
                onRefresh={handleRefresh}
            />

            {/* Upload errors */}
            {uploadErrors.length > 0 && (
                <div className="mx-4 mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-red-300">Upload Errors</span>
                        <button
                            onClick={clearErrors}
                            className="text-xs text-red-400 hover:text-red-300"
                        >
                            Dismiss
                        </button>
                    </div>
                    <ul className="space-y-1">
                        {uploadErrors.map((err, i) => (
                            <li key={i} className="text-xs text-red-300/70">
                                {err.file}: {err.error}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* General error */}
            {error && (
                <div className="mx-4 mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-300">{error}</p>
                </div>
            )}

            {/* Loading state */}
            {(isLoading || isUploading) && (
                <div className="mx-4 mt-2 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                    <p className="text-xs text-violet-300">
                        {isUploading ? 'Uploading files...' : 'Loading...'}
                    </p>
                </div>
            )}

            {/* File list */}
            <div className="flex-1 overflow-y-auto p-4">
                <FileList
                    files={displayedFiles}
                    viewMode={viewMode}
                    selectedFiles={selectedFiles}
                    onSelect={selectFile}
                    onDelete={handleDelete}
                    onPreview={openPreview}
                    onRename={renameFile}
                    onUpload={openFileDialog}
                />
            </div>

            {/* File preview modal */}
            <FilePreview
                isOpen={isPreviewOpen}
                file={previewFile}
                content={previewContent}
                isLoading={isPreviewLoading}
                error={previewError}
                onClose={closePreview}
                onPrevious={handlePreviousPreview}
                onNext={handleNextPreview}
                hasPrevious={hasPrevious}
                hasNext={hasNext}
            />
        </div>
    );
}

export default WorkspaceMainView;