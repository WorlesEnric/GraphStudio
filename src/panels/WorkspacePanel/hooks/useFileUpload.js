/**
 * useFileUpload Hook
 * Handles file upload via drag-and-drop and file input
 */

import { useState, useCallback, useRef } from 'react';
import { validateFile } from '../utils/fileUtils';

/**
 * useFileUpload hook
 * @param {object} options
 * @param {function} options.onUpload - Callback when files are uploaded
 * @param {number} options.maxSize - Maximum file size in bytes
 * @param {Array} options.allowedTypes - Allowed MIME types
 * @param {boolean} options.multiple - Allow multiple files
 * @returns {object} Upload state and methods
 */
export function useFileUpload({
    onUpload,
    maxSize = 50 * 1024 * 1024, // 50MB
    allowedTypes = null,
    multiple = true,
} = {}) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [errors, setErrors] = useState([]);

    const dragCountRef = useRef(0);
    const fileInputRef = useRef(null);

    /**
     * Handle drag enter
     */
    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCountRef.current++;

        if (e.dataTransfer?.types?.includes('Files')) {
            setIsDragging(true);
        }
    }, []);

    /**
     * Handle drag leave
     */
    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCountRef.current--;

        if (dragCountRef.current === 0) {
            setIsDragging(false);
        }
    }, []);

    /**
     * Handle drag over
     */
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    /**
     * Handle drop
     */
    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();

        setIsDragging(false);
        dragCountRef.current = 0;

        const files = e.dataTransfer?.files;
        if (!files || files.length === 0) return;

        await processFiles(files);
    }, []);

    /**
     * Process and validate files
     */
    const processFiles = useCallback(async (fileList) => {
        const files = multiple ? Array.from(fileList) : [fileList[0]];
        const validFiles = [];
        const uploadErrors = [];

        // Validate each file
        for (const file of files) {
            const validation = validateFile(file, { maxSize, allowedTypes });

            if (validation.valid) {
                validFiles.push(file);
            } else {
                uploadErrors.push({
                    file: file.name,
                    error: validation.error,
                });
            }
        }

        setErrors(uploadErrors);

        // Upload valid files
        if (validFiles.length > 0 && onUpload) {
            setIsUploading(true);
            setUploadProgress(0);

            try {
                await onUpload(validFiles);
            } catch (error) {
                uploadErrors.push({
                    file: 'Upload',
                    error: error.message,
                });
                setErrors([...uploadErrors]);
            } finally {
                setIsUploading(false);
                setUploadProgress(100);
            }
        }

        return { valid: validFiles.length, errors: uploadErrors.length };
    }, [multiple, maxSize, allowedTypes, onUpload]);

    /**
     * Handle file input change
     */
    const handleFileInputChange = useCallback(async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        await processFiles(files);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [processFiles]);

    /**
     * Trigger file input click
     */
    const openFileDialog = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    /**
     * Clear errors
     */
    const clearErrors = useCallback(() => {
        setErrors([]);
    }, []);

    /**
     * Get input props for file input element
     */
    const getInputProps = useCallback(() => ({
        ref: fileInputRef,
        type: 'file',
        multiple,
        accept: allowedTypes?.join(','),
        onChange: handleFileInputChange,
        style: { display: 'none' },
    }), [multiple, allowedTypes, handleFileInputChange]);

    /**
     * Get root props for drop zone element
     */
    const getRootProps = useCallback(() => ({
        onDragEnter: handleDragEnter,
        onDragLeave: handleDragLeave,
        onDragOver: handleDragOver,
        onDrop: handleDrop,
    }), [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

    return {
        // State
        isDragging,
        isUploading,
        uploadProgress,
        errors,

        // Refs
        fileInputRef,

        // Methods
        processFiles,
        openFileDialog,
        clearErrors,

        // Prop getters
        getInputProps,
        getRootProps,
    };
}

export default useFileUpload;