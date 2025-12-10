/**
 * WorkspacePanel - File Browser & Asset Manager
 * 
 * This panel provides file management capabilities for Nexus GraphStudio.
 * It provides:
 * - File upload via drag-and-drop or file picker
 * - Grid and list view modes
 * - File preview for images and text files
 * - File operations (rename, delete, download)
 * - MCP tools for AI file access
 */

import React from 'react';
import { Folder } from 'lucide-react';
import { createPanelDefinition, PanelCategories, ContentTypes } from '../BasePanelInterface';
import WorkspaceMainView from './WorkspaceMainView';
import { isTextFile, isPreviewable } from './utils/mimeTypes';

/**
 * WorkspacePanel Definition
 */
const WorkspacePanel = createPanelDefinition({
    id: 'workspace',
    name: 'Workspace',
    description: 'Manage project files and assets',
    icon: Folder,
    category: PanelCategories.DATA,
    accentColor: 'orange',

    /**
     * Render the main workspace view
     */
    renderMainView: (props) => <WorkspaceMainView {...props} />,

    /**
     * Initial state for new workspace panel instances
     */
    getInitialState: () => ({
        files: [],
        viewMode: 'grid',
        sortBy: 'name',
        sortOrder: 'asc',
        currentPath: '/',
    }),

    /**
     * Get context for LLM to understand this panel
     */
    getLLMContext: async (state) => {
        const files = state.files || [];

        return {
            type: 'workspace',
            data: {
                fileCount: files.length,
                files: files.map(f => ({
                    name: f.name,
                    type: f.type,
                    size: f.size,
                    category: f.category,
                    hasContent: f.content !== undefined,
                })),
                categories: [...new Set(files.map(f => f.category).filter(Boolean))],
            },
        };
    },

    /**
     * MCP Tools exposed by the Workspace Panel
     */
    getMCPTools: async (state) => [
        {
            name: 'list_files',
            description: 'List all files in the workspace with their metadata',
            inputSchema: {
                type: 'object',
                properties: {
                    category: {
                        type: 'string',
                        description: 'Filter by category (image, document, code, text, etc.)',
                    },
                },
            },
        },
        {
            name: 'read_file',
            description: 'Read the content of a text file by name',
            inputSchema: {
                type: 'object',
                properties: {
                    filename: {
                        type: 'string',
                        description: 'Name of the file to read',
                    },
                },
                required: ['filename'],
            },
        },
        {
            name: 'get_file_info',
            description: 'Get detailed information about a specific file',
            inputSchema: {
                type: 'object',
                properties: {
                    filename: {
                        type: 'string',
                        description: 'Name of the file',
                    },
                },
                required: ['filename'],
            },
        },
        {
            name: 'search_files',
            description: 'Search for files by name or content',
            inputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Search query',
                    },
                    searchContent: {
                        type: 'boolean',
                        description: 'Whether to search in file contents (text files only)',
                    },
                },
                required: ['query'],
            },
        },
        {
            name: 'get_workspace_stats',
            description: 'Get statistics about the workspace (file counts, sizes, categories)',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
    ],

    /**
     * Execute MCP tools on this panel
     */
    executeMCPTool: async (name, args, panelState, updateState) => {
        const files = panelState.files || [];

        switch (name) {
            case 'list_files': {
                let result = files;

                if (args.category) {
                    result = files.filter(f => f.category === args.category);
                }

                return {
                    success: true,
                    files: result.map(f => ({
                        name: f.name,
                        type: f.type,
                        size: f.size,
                        category: f.category,
                        lastModified: f.lastModified,
                        isPreviewable: isPreviewable(f.type),
                        isTextFile: isTextFile(f.type),
                    })),
                    count: result.length,
                };
            }

            case 'read_file': {
                const file = files.find(f =>
                    f.name.toLowerCase() === args.filename.toLowerCase()
                );

                if (!file) {
                    return {
                        success: false,
                        error: `File not found: ${args.filename}`,
                    };
                }

                if (!isTextFile(file.type)) {
                    return {
                        success: false,
                        error: `File is not a text file: ${args.filename}`,
                        fileType: file.type,
                    };
                }

                if (file.content !== undefined) {
                    return {
                        success: true,
                        filename: file.name,
                        content: file.content,
                        type: file.type,
                        size: file.size,
                    };
                }

                return {
                    success: false,
                    error: 'File content not available. Content may not have been loaded.',
                };
            }

            case 'get_file_info': {
                const file = files.find(f =>
                    f.name.toLowerCase() === args.filename.toLowerCase()
                );

                if (!file) {
                    return {
                        success: false,
                        error: `File not found: ${args.filename}`,
                    };
                }

                return {
                    success: true,
                    file: {
                        id: file.id,
                        name: file.name,
                        type: file.type,
                        category: file.category,
                        size: file.size,
                        lastModified: file.lastModified,
                        path: file.path || '/',
                        isTextFile: isTextFile(file.type),
                        isPreviewable: isPreviewable(file.type),
                        hasContent: file.content !== undefined,
                        contentPreview: file.content?.slice(0, 500),
                    },
                };
            }

            case 'search_files': {
                const query = args.query.toLowerCase();
                const searchContent = args.searchContent || false;

                const matches = files.filter(f => {
                    // Search in name
                    if (f.name.toLowerCase().includes(query)) {
                        return true;
                    }

                    // Search in content if enabled and available
                    if (searchContent && f.content) {
                        if (f.content.toLowerCase().includes(query)) {
                            return true;
                        }
                    }

                    return false;
                });

                return {
                    success: true,
                    query: args.query,
                    matches: matches.map(f => ({
                        name: f.name,
                        type: f.type,
                        matchType: f.name.toLowerCase().includes(query) ? 'name' : 'content',
                    })),
                    count: matches.length,
                };
            }

            case 'get_workspace_stats': {
                const stats = {
                    totalFiles: files.length,
                    totalSize: files.reduce((sum, f) => sum + (f.size || 0), 0),
                    byCategory: {},
                    byType: {},
                    textFilesWithContent: 0,
                };

                files.forEach(f => {
                    // By category
                    const cat = f.category || 'other';
                    stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;

                    // By type
                    const type = f.type || 'unknown';
                    stats.byType[type] = (stats.byType[type] || 0) + 1;

                    // Count files with content
                    if (f.content !== undefined) {
                        stats.textFilesWithContent++;
                    }
                });

                return {
                    success: true,
                    stats,
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    },

    /**
     * Drop zone configuration
     */
    dropZone: {
        acceptTypes: [
            ContentTypes.TEXT_PLAIN,
            ContentTypes.TEXT_MARKDOWN,
            ContentTypes.TEXT_CODE,
            ContentTypes.IMAGE_PNG,
            ContentTypes.IMAGE_SVG,
            ContentTypes.JSON,
        ],
        onDrop: (data, panelState, updateState) => {
            // Handle dropped content from other panels
            // This would create a file from the dropped data
            console.log('Content dropped on workspace:', data);
        },
    },

    /**
     * Panel actions for command palette
     */
    actions: [
        {
            id: 'workspace.upload',
            label: 'Upload Files',
            category: 'Workspace',
            shortcut: 'Mod+U',
            handler: () => {
                // Would trigger file upload dialog
            },
        },
        {
            id: 'workspace.clear',
            label: 'Clear Workspace',
            category: 'Workspace',
            handler: (panelState, updateState) => {
                if (window.confirm('Clear all files from workspace?')) {
                    updateState({ files: [] });
                }
            },
        },
        {
            id: 'workspace.toggleView',
            label: 'Toggle View Mode',
            category: 'Workspace',
            shortcut: 'Mod+Shift+V',
            handler: (panelState, updateState) => {
                updateState({
                    viewMode: panelState.viewMode === 'grid' ? 'list' : 'grid',
                });
            },
        },
    ],

    /**
     * Export formats
     */
    exportFormats: [
        {
            format: 'zip',
            label: 'ZIP Archive',
            mimeType: 'application/zip',
        },
        {
            format: 'json',
            label: 'File List (JSON)',
            mimeType: 'application/json',
        },
    ],

    /**
     * Lifecycle hooks
     */
    onMount: () => {
        console.log('WorkspacePanel mounted');
    },

    onUnmount: () => {
        console.log('WorkspacePanel unmounted');
    },

    onFocus: () => {
        // Could highlight the workspace when focused
    },

    onBlur: () => {
        // Could save state when panel loses focus
    },
});

export default WorkspacePanel;

// Also export components and hooks for use elsewhere
export { default as WorkspaceMainView } from './WorkspaceMainView';
export { useFiles } from './hooks/useFiles';
export { useFileUpload } from './hooks/useFileUpload';
export { useFilePreview } from './hooks/useFilePreview';
export { fileService } from './services/fileService';