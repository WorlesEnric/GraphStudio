/**
 * useFilePreview Hook
 * Manages file preview state and content loading
 */

import { useState, useCallback, useEffect } from 'react';
import { isTextFile, isImageFile, isPreviewable } from '../utils/mimeTypes';
import { readFileAsText, readFileAsDataURL } from '../utils/fileUtils';

/**
 * useFilePreview hook
 * @returns {object} Preview state and methods
 */
export function useFilePreview() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentFile, setCurrentFile] = useState(null);
    const [content, setContent] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Open preview for a file
     */
    const openPreview = useCallback(async (file) => {
        if (!file) return;

        setCurrentFile(file);
        setIsOpen(true);
        setContent(null);
        setError(null);

        // Check if file is previewable
        if (!isPreviewable(file.type)) {
            setError('This file type cannot be previewed');
            return;
        }

        // If content is already cached
        if (file.content !== undefined) {
            setContent(file.content);
            return;
        }

        // If preview URL exists (images)
        if (file.preview) {
            setContent(file.preview);
            return;
        }

        // Load content from File object
        if (file.file) {
            setIsLoading(true);

            try {
                if (isTextFile(file.type)) {
                    const text = await readFileAsText(file.file);
                    setContent(text);
                } else if (isImageFile(file.type)) {
                    const dataUrl = await readFileAsDataURL(file.file);
                    setContent(dataUrl);
                }
            } catch (err) {
                setError(`Failed to load file: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        }
    }, []);

    /**
     * Close preview
     */
    const closePreview = useCallback(() => {
        setIsOpen(false);
        setCurrentFile(null);
        setContent(null);
        setError(null);
    }, []);

    /**
     * Navigate to next/previous file
     */
    const navigatePreview = useCallback((files, direction) => {
        if (!currentFile || !files || files.length === 0) return;

        const currentIndex = files.findIndex(f => f.id === currentFile.id);
        if (currentIndex === -1) return;

        let nextIndex;
        if (direction === 'next') {
            nextIndex = (currentIndex + 1) % files.length;
        } else {
            nextIndex = (currentIndex - 1 + files.length) % files.length;
        }

        openPreview(files[nextIndex]);
    }, [currentFile, openPreview]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closePreview();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closePreview]);

    return {
        // State
        isOpen,
        currentFile,
        content,
        isLoading,
        error,

        // Methods
        openPreview,
        closePreview,
        navigatePreview,

        // Computed
        canPreview: currentFile ? isPreviewable(currentFile.type) : false,
        isImage: currentFile ? isImageFile(currentFile.type) : false,
        isText: currentFile ? isTextFile(currentFile.type) : false,
    };
}

export default useFilePreview;