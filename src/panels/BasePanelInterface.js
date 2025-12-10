/**
 * Base Panel Interface - All panels must implement this interface
 * 
 * This defines the contract between the Shell (container) and Panel (app)
 * Each panel type registers with these properties and methods
 */

/**
 * @typedef {Object} PanelData
 * @property {'dsl/json' | 'image/png' | 'text/plain' | 'code/javascript' | 'code/html'} contentType
 * @property {any} data - The actual data (DSL, image bytes, text, etc.)
 * @property {string} schemaVersion - Version of the data schema
 */

/**
 * @typedef {Object} PanelAction
 * @property {string} id - Unique action identifier
 * @property {string} label - Display label for command palette
 * @property {string} [shortcut] - Keyboard shortcut
 * @property {string} [category] - Action category for grouping
 * @property {Function} handler - Action handler function
 */

/**
 * @typedef {Object} ExportFormat
 * @property {string} format - Format identifier (png, svg, json, pdf)
 * @property {string} label - Display label
 * @property {string} [mimeType] - MIME type for download
 */

/**
 * @typedef {Object} DropZone
 * @property {string[]} acceptTypes - Content types this panel accepts
 * @property {Function} onDrop - Handler for dropped content
 */

/**
 * IStudioPanelDefinition - The interface every panel type must implement
 * 
 * @typedef {Object} IStudioPanelDefinition
 * @property {string} id - Unique panel type identifier
 * @property {string} name - Display name
 * @property {string} description - Short description of what the panel does
 * @property {React.ElementType} icon - Lucide icon component
 * @property {string} category - Category for grouping (e.g., 'creation', 'data', 'ai')
 * @property {string} accentColor - Tailwind color class for theming
 * 
 * @property {Function} renderMainView - Render the main content area
 * @property {Function} [renderPropertiesPanel] - Render inspector/properties panel
 * @property {Function} [renderToolbar] - Render custom toolbar
 * 
 * @property {Function} getLLMContext - Get context for AI to understand panel content
 * @property {Function} applyLLMChange - Apply changes from AI
 * 
 * @property {DropZone} [dropZone] - Drop zone configuration
 * @property {ExportFormat[]} [exportFormats] - Supported export formats
 * @property {PanelAction[]} [actions] - Actions for command palette
 * 
 * @property {Function} [onMount] - Called when panel mounts
 * @property {Function} [onUnmount] - Called when panel unmounts
 * @property {Function} [onFocus] - Called when panel gains focus
 * @property {Function} [onBlur] - Called when panel loses focus
 */

/**
 * MCP (Model Context Protocol) Interface
 * 
 * @typedef {Object} MCPTool
 * @property {string} name - Unique tool name
 * @property {string} description - Description for the LLM
 * @property {Object} inputSchema - JSON Schema for arguments
 */

/**
 * @property {Function} getMCPTools - Get tools exposed by this panel
 * @property {Function} executeMCPTool - Execute a tool on this panel
 * @property {Function} getMCPContext - Get structured context for LLM
 */

/**
 * Creates a panel definition with defaults
 * @param {Partial<IStudioPanelDefinition>} definition 
 * @returns {IStudioPanelDefinition}
 */
export function createPanelDefinition(definition) {
  return {
    // Required fields (must be provided)
    id: definition.id,
    name: definition.name || definition.id,
    description: definition.description || '',
    icon: definition.icon,
    category: definition.category || 'general',
    accentColor: definition.accentColor || 'violet',

    // Rendering (main view is required)
    renderMainView: definition.renderMainView,
    renderPropertiesPanel: definition.renderPropertiesPanel || null,
    renderToolbar: definition.renderToolbar || null,

    // AI Integration
    getLLMContext: definition.getLLMContext || (async () => ({ type: 'empty', data: null })),
    applyLLMChange: definition.applyLLMChange || (async () => false),

    // MCP Integration
    getMCPTools: definition.getMCPTools || (async () => []),
    executeMCPTool: definition.executeMCPTool || (async () => { throw new Error('Tool not implemented'); }),
    getMCPContext: definition.getMCPContext || (async () => ({ type: 'empty', content: null })), // Structured context

    // Interoperability
    dropZone: definition.dropZone || null,
    exportFormats: definition.exportFormats || [],
    actions: definition.actions || [],

    // Lifecycle
    onMount: definition.onMount || (() => { }),
    onUnmount: definition.onUnmount || (() => { }),
    onFocus: definition.onFocus || (() => { }),
    onBlur: definition.onBlur || (() => { }),

    // Initial state factory
    getInitialState: definition.getInitialState || (() => ({})),
  };
}

/**
 * Panel Categories for organization
 */
export const PanelCategories = {
  CREATION: 'creation',    // Canvas, editors for creating things
  DATA: 'data',            // Notes, sources, data views
  AI: 'ai',                // Chat, AI assistants
  UTILITY: 'utility',      // Settings, config, tools
  PREVIEW: 'preview',      // Previews, output views
};

/**
 * Common content types for drag & drop
 */
export const ContentTypes = {
  TEXT_PLAIN: 'text/plain',
  TEXT_MARKDOWN: 'text/markdown',
  TEXT_CODE: 'text/code',
  DSL_FLOWCHART: 'dsl/flowchart',
  DSL_KANBAN: 'dsl/kanban',
  DSL_SVG: 'dsl/svg',
  IMAGE_PNG: 'image/png',
  IMAGE_SVG: 'image/svg+xml',
  JSON: 'application/json',
  PANEL_REF: 'application/x-panel-ref', // Reference to another panel
};

/**
 * Utility to create a drag data object
 */
export function createDragData(contentType, data, sourcePanelId) {
  return {
    contentType,
    data,
    sourcePanelId,
    timestamp: Date.now(),
  };
}

/**
 * Utility to check if a drop target accepts a drag data type
 */
export function canAcceptDrop(dropZone, dragData) {
  if (!dropZone || !dragData) return false;
  return dropZone.acceptTypes.includes(dragData.contentType);
}

export default {
  createPanelDefinition,
  PanelCategories,
  ContentTypes,
  createDragData,
  canAcceptDrop,
};