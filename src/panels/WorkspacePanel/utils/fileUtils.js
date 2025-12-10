/**
 * File Utilities
 * Helper functions for file management
 */

import { getMimeType, getFileCategory } from './mimeTypes';

/**
 * Generate unique file ID
 * @returns {string}
 */
export function generateFileId() {
    return `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format file size for display
 * @param {number} bytes 
 * @returns {string}
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    if (!bytes) return 'Unknown';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date for display
 * @param {number|Date} date 
 * @returns {string}
 */
export function formatDate(date) {
    const d = new Date(date);
    const now = new Date();

    // Same day
    if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Same year
    if (d.getFullYear() === now.getFullYear()) {
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    // Different year
    return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Create file object from File API
 * @param {File} file 
 * @returns {Promise<object>}
 */
export async function createFileObject(file) {
    const id = generateFileId();
    const mimeType = file.type || getMimeType(file.name);
    const category = getFileCategory(file.name, mimeType);

    // Create object URL for preview
    let preview = null;
    if (mimeType.startsWith('image/')) {
        preview = URL.createObjectURL(file);
    }

    // Read content for text files
    let content = null;
    if (mimeType.startsWith('text/') || mimeType === 'application/json') {
        try {
            content = await readFileAsText(file);
        } catch (e) {
            console.warn('Could not read file content:', e);
        }
    }

    return {
        id,
        name: file.name,
        type: mimeType,
        category,
        size: file.size,
        lastModified: file.lastModified || Date.now(),
        preview,
        content,
        file, // Keep reference to original File object
    };
}

/**
 * Read file as text
 * @param {File} file 
 * @returns {Promise<string>}
 */
export function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

/**
 * Read file as data URL
 * @param {File} file 
 * @returns {Promise<string>}
 */
export function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

/**
 * Read file as array buffer
 * @param {File} file 
 * @returns {Promise<ArrayBuffer>}
 */
export function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Download file
 * @param {object} fileObj - File object with content or url
 * @param {string} filename - Optional custom filename
 */
export function downloadFile(fileObj, filename) {
    const name = filename || fileObj.name;

    let url;
    let shouldRevoke = false;

    if (fileObj.url) {
        url = fileObj.url;
    } else if (fileObj.preview) {
        url = fileObj.preview;
    } else if (fileObj.content) {
        const blob = new Blob([fileObj.content], { type: fileObj.type || 'text/plain' });
        url = URL.createObjectURL(blob);
        shouldRevoke = true;
    } else if (fileObj.file) {
        url = URL.createObjectURL(fileObj.file);
        shouldRevoke = true;
    } else {
        console.error('Cannot download file: no content available');
        return;
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (shouldRevoke) {
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
}

/**
 * Sort files by property
 * @param {Array} files 
 * @param {string} sortBy - 'name' | 'size' | 'date' | 'type'
 * @param {string} order - 'asc' | 'desc'
 * @returns {Array}
 */
export function sortFiles(files, sortBy = 'name', order = 'asc') {
    const sorted = [...files].sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'size':
                comparison = (a.size || 0) - (b.size || 0);
                break;
            case 'date':
                comparison = (a.lastModified || 0) - (b.lastModified || 0);
                break;
            case 'type':
                comparison = (a.type || '').localeCompare(b.type || '');
                break;
            default:
                comparison = 0;
        }

        return order === 'desc' ? -comparison : comparison;
    });

    return sorted;
}

/**
 * Filter files by search query
 * @param {Array} files 
 * @param {string} query 
 * @returns {Array}
 */
export function filterFiles(files, query) {
    if (!query || !query.trim()) return files;

    const lowerQuery = query.toLowerCase().trim();

    return files.filter(file => {
        return (
            file.name.toLowerCase().includes(lowerQuery) ||
            file.type?.toLowerCase().includes(lowerQuery) ||
            file.category?.toLowerCase().includes(lowerQuery)
        );
    });
}

/**
 * Filter files by category
 * @param {Array} files 
 * @param {string} category 
 * @returns {Array}
 */
export function filterByCategory(files, category) {
    if (!category || category === 'all') return files;
    return files.filter(file => file.category === category);
}

/**
 * Group files by folder path
 * @param {Array} files 
 * @returns {object}
 */
export function groupByFolder(files) {
    const groups = { '/': [] };

    for (const file of files) {
        const path = file.path || '/';
        if (!groups[path]) {
            groups[path] = [];
        }
        groups[path].push(file);
    }

    return groups;
}

/**
 * Get file statistics
 * @param {Array} files 
 * @returns {object}
 */
export function getFileStats(files) {
    const stats = {
        totalCount: files.length,
        totalSize: 0,
        byCategory: {},
        byType: {},
    };

    for (const file of files) {
        stats.totalSize += file.size || 0;

        // By category
        const category = file.category || 'other';
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

        // By type
        const type = file.type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;
    }

    return stats;
}

/**
 * Validate file for upload
 * @param {File} file 
 * @param {object} options 
 * @returns {object} { valid: boolean, error?: string }
 */
export function validateFile(file, options = {}) {
    const {
        maxSize = 50 * 1024 * 1024, // 50MB default
        allowedTypes = null,
        blockedTypes = [],
    } = options;

    // Check size
    if (file.size > maxSize) {
        return {
            valid: false,
            error: `File too large. Maximum size is ${formatFileSize(maxSize)}`,
        };
    }

    // Check allowed types
    if (allowedTypes && allowedTypes.length > 0) {
        const mimeType = file.type || getMimeType(file.name);
        const isAllowed = allowedTypes.some(t => {
            if (t.endsWith('/*')) {
                return mimeType.startsWith(t.slice(0, -1));
            }
            return mimeType === t;
        });

        if (!isAllowed) {
            return {
                valid: false,
                error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
            };
        }
    }

    // Check blocked types
    if (blockedTypes.length > 0) {
        const mimeType = file.type || getMimeType(file.name);
        const isBlocked = blockedTypes.some(t => {
            if (t.endsWith('/*')) {
                return mimeType.startsWith(t.slice(0, -1));
            }
            return mimeType === t;
        });

        if (isBlocked) {
            return {
                valid: false,
                error: `File type is blocked`,
            };
        }
    }

    return { valid: true };
}

export default {
    generateFileId,
    formatFileSize,
    formatDate,
    createFileObject,
    readFileAsText,
    readFileAsDataURL,
    readFileAsArrayBuffer,
    downloadFile,
    sortFiles,
    filterFiles,
    filterByCategory,
    groupByFolder,
    getFileStats,
    validateFile,
};