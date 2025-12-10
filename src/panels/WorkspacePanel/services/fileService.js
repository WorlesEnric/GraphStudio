/**
 * File Service
 * Handles file operations and storage
 */

import { createFileObject, generateFileId, readFileAsText } from '../utils/fileUtils';
import { isTextFile } from '../utils/mimeTypes';

/**
 * FileService class for managing workspace files
 */
class FileService {
    constructor() {
        this.files = new Map();
        this.folders = new Map();
        this.listeners = new Set();
    }

    /**
     * Subscribe to file changes
     * @param {function} callback 
     * @returns {function} Unsubscribe function
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Notify all listeners of changes
     */
    notify() {
        const files = this.getAllFiles();
        this.listeners.forEach(cb => cb(files));
    }

    /**
     * Initialize with files from panel state
     * @param {Array} files 
     */
    initialize(files = []) {
        this.files.clear();
        files.forEach(file => {
            this.files.set(file.id, file);
        });
    }

    /**
     * Get all files as array
     * @returns {Array}
     */
    getAllFiles() {
        return Array.from(this.files.values());
    }

    /**
     * Get file by ID
     * @param {string} id 
     * @returns {object|undefined}
     */
    getFile(id) {
        return this.files.get(id);
    }

    /**
     * Get files by path/folder
     * @param {string} path 
     * @returns {Array}
     */
    getFilesByPath(path = '/') {
        return this.getAllFiles().filter(f => (f.path || '/') === path);
    }

    /**
     * Add files from File API
     * @param {FileList|Array} fileList 
     * @returns {Promise<Array>} Added file objects
     */
    async addFiles(fileList) {
        const files = Array.from(fileList);
        const addedFiles = [];

        for (const file of files) {
            try {
                const fileObj = await createFileObject(file);
                this.files.set(fileObj.id, fileObj);
                addedFiles.push(fileObj);
            } catch (error) {
                console.error(`Failed to add file ${file.name}:`, error);
            }
        }

        if (addedFiles.length > 0) {
            this.notify();
        }

        return addedFiles;
    }

    /**
     * Add a file object directly
     * @param {object} fileObj 
     * @returns {object}
     */
    addFile(fileObj) {
        if (!fileObj.id) {
            fileObj.id = generateFileId();
        }
        this.files.set(fileObj.id, fileObj);
        this.notify();
        return fileObj;
    }

    /**
     * Update file
     * @param {string} id 
     * @param {object} updates 
     * @returns {object|null}
     */
    updateFile(id, updates) {
        const file = this.files.get(id);
        if (!file) return null;

        const updated = { ...file, ...updates };
        this.files.set(id, updated);
        this.notify();
        return updated;
    }

    /**
     * Rename file
     * @param {string} id 
     * @param {string} newName 
     * @returns {object|null}
     */
    renameFile(id, newName) {
        return this.updateFile(id, {
            name: newName,
            lastModified: Date.now(),
        });
    }

    /**
     * Move file to folder
     * @param {string} id 
     * @param {string} targetPath 
     * @returns {object|null}
     */
    moveFile(id, targetPath) {
        return this.updateFile(id, {
            path: targetPath,
            lastModified: Date.now(),
        });
    }

    /**
     * Delete file
     * @param {string} id 
     * @returns {boolean}
     */
    deleteFile(id) {
        const file = this.files.get(id);
        if (!file) return false;

        // Revoke object URL if exists
        if (file.preview) {
            URL.revokeObjectURL(file.preview);
        }

        this.files.delete(id);
        this.notify();
        return true;
    }

    /**
     * Delete multiple files
     * @param {Array<string>} ids 
     * @returns {number} Number of deleted files
     */
    deleteFiles(ids) {
        let deleted = 0;
        ids.forEach(id => {
            if (this.deleteFile(id)) {
                deleted++;
            }
        });
        return deleted;
    }

    /**
     * Read file content
     * @param {string} id 
     * @returns {Promise<string|null>}
     */
    async readFileContent(id) {
        const file = this.files.get(id);
        if (!file) return null;

        // Return cached content if available
        if (file.content !== undefined) {
            return file.content;
        }

        // Read from File object if available
        if (file.file && isTextFile(file.type)) {
            try {
                const content = await readFileAsText(file.file);
                // Cache the content
                this.updateFile(id, { content });
                return content;
            } catch (error) {
                console.error('Failed to read file content:', error);
                return null;
            }
        }

        return null;
    }

    /**
     * Update file content
     * @param {string} id 
     * @param {string} content 
     * @returns {object|null}
     */
    updateFileContent(id, content) {
        const file = this.files.get(id);
        if (!file) return null;

        return this.updateFile(id, {
            content,
            size: new Blob([content]).size,
            lastModified: Date.now(),
        });
    }

    /**
     * Create folder
     * @param {string} name 
     * @param {string} parentPath 
     * @returns {object}
     */
    createFolder(name, parentPath = '/') {
        const id = `folder-${Date.now()}`;
        const path = parentPath === '/' ? `/${name}` : `${parentPath}/${name}`;

        const folder = {
            id,
            name,
            path,
            parentPath,
            type: 'folder',
            createdAt: Date.now(),
        };

        this.folders.set(id, folder);
        this.notify();
        return folder;
    }

    /**
     * Get all folders
     * @returns {Array}
     */
    getAllFolders() {
        return Array.from(this.folders.values());
    }

    /**
     * Clear all files
     */
    clear() {
        // Revoke all object URLs
        this.files.forEach(file => {
            if (file.preview) {
                URL.revokeObjectURL(file.preview);
            }
        });

        this.files.clear();
        this.folders.clear();
        this.notify();
    }

    /**
     * Export files state for persistence
     * @returns {Array}
     */
    exportState() {
        return this.getAllFiles().map(file => ({
            id: file.id,
            name: file.name,
            type: file.type,
            category: file.category,
            size: file.size,
            path: file.path,
            lastModified: file.lastModified,
            content: file.content,
            // Don't export File object or preview URLs
        }));
    }

    /**
     * Import files state
     * @param {Array} state 
     */
    importState(state) {
        this.clear();
        state.forEach(file => {
            this.files.set(file.id, file);
        });
        this.notify();
    }
}

// Export singleton instance
export const fileService = new FileService();

export default fileService;