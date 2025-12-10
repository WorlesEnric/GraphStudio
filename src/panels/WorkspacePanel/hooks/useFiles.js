/**
 * useFiles Hook
 * Manages file state and operations for the workspace
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fileService } from '../services/fileService';
import { sortFiles, filterFiles, filterByCategory, getFileStats } from '../utils/fileUtils';

/**
 * useFiles hook for managing workspace files
 * @param {object} options
 * @param {object} options.panelState - Panel state from store
 * @param {function} options.updateState - Function to update panel state
 * @returns {object} Files state and methods
 */
export function useFiles({ panelState, updateState }) {
    // Files state
    const [files, setFiles] = useState(panelState?.files || []);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // View state
    const [viewMode, setViewMode] = useState(panelState?.viewMode || 'grid');
    const [sortBy, setSortBy] = useState(panelState?.sortBy || 'name');
    const [sortOrder, setSortOrder] = useState(panelState?.sortOrder || 'asc');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Selection state
    const [selectedFiles, setSelectedFiles] = useState(new Set());

    // Initialize file service with panel state
    useEffect(() => {
        fileService.initialize(panelState?.files || []);
    }, []);

    // Subscribe to file service changes
    useEffect(() => {
        const unsubscribe = fileService.subscribe((updatedFiles) => {
            setFiles(updatedFiles);
            updateState?.({ files: fileService.exportState() });
        });

        return unsubscribe;
    }, [updateState]);

    // Sync view state with panel state
    useEffect(() => {
        updateState?.({ viewMode, sortBy, sortOrder });
    }, [viewMode, sortBy, sortOrder, updateState]);

    /**
     * Add files from file input or drop
     */
    const addFiles = useCallback(async (fileList) => {
        setIsLoading(true);
        setError(null);

        try {
            const added = await fileService.addFiles(fileList);
            return added;
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Delete file
     */
    const deleteFile = useCallback((id) => {
        fileService.deleteFile(id);
        setSelectedFiles(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    /**
     * Delete selected files
     */
    const deleteSelectedFiles = useCallback(() => {
        fileService.deleteFiles(Array.from(selectedFiles));
        setSelectedFiles(new Set());
    }, [selectedFiles]);

    /**
     * Rename file
     */
    const renameFile = useCallback((id, newName) => {
        return fileService.renameFile(id, newName);
    }, []);

    /**
     * Update file content
     */
    const updateFileContent = useCallback((id, content) => {
        return fileService.updateFileContent(id, content);
    }, []);

    /**
     * Read file content
     */
    const readFileContent = useCallback(async (id) => {
        return fileService.readFileContent(id);
    }, []);

    /**
     * Select file
     */
    const selectFile = useCallback((id, multi = false) => {
        setSelectedFiles(prev => {
            if (multi) {
                const next = new Set(prev);
                if (next.has(id)) {
                    next.delete(id);
                } else {
                    next.add(id);
                }
                return next;
            } else {
                return new Set([id]);
            }
        });
    }, []);

    /**
     * Clear selection
     */
    const clearSelection = useCallback(() => {
        setSelectedFiles(new Set());
    }, []);

    /**
     * Select all files
     */
    const selectAll = useCallback(() => {
        setSelectedFiles(new Set(files.map(f => f.id)));
    }, [files]);

    /**
     * Clear all files
     */
    const clearFiles = useCallback(() => {
        fileService.clear();
        setSelectedFiles(new Set());
    }, []);

    // Computed: filtered and sorted files
    const displayedFiles = useMemo(() => {
        let result = files;

        // Filter by search
        result = filterFiles(result, searchQuery);

        // Filter by category
        result = filterByCategory(result, selectedCategory);

        // Sort
        result = sortFiles(result, sortBy, sortOrder);

        return result;
    }, [files, searchQuery, selectedCategory, sortBy, sortOrder]);

    // Computed: file statistics
    const stats = useMemo(() => {
        return getFileStats(files);
    }, [files]);

    // Computed: has files
    const hasFiles = files.length > 0;
    const hasSelection = selectedFiles.size > 0;

    return {
        // State
        files,
        displayedFiles,
        isLoading,
        error,

        // View state
        viewMode,
        sortBy,
        sortOrder,
        searchQuery,
        selectedCategory,

        // Selection
        selectedFiles,
        hasSelection,

        // Computed
        stats,
        hasFiles,
        fileCount: files.length,

        // File actions
        addFiles,
        deleteFile,
        deleteSelectedFiles,
        renameFile,
        updateFileContent,
        readFileContent,
        clearFiles,

        // Selection actions
        selectFile,
        clearSelection,
        selectAll,

        // View actions
        setViewMode,
        setSortBy,
        setSortOrder,
        setSearchQuery,
        setSelectedCategory,
    };
}

export default useFiles;