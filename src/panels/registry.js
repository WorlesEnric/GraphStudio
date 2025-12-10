/**
 * Panel Registry - Central registry for all panel types
 * 
 * This allows dynamic registration of panel types,
 * making the IDE extensible without modifying core code.
 */

// Import panel definitions
import ChatPanel from './ChatPanel';
import WorkspacePanel from './WorkspacePanel';

// Note: Import other panels as they are created
import DummyCanvasPanel from './DummyCanvasPanel';
import DummyNotesPanel from './DummyNotesPanel';
import DummyKanbanPanel from './DummyKanbanPanel';
import FlowchartPanel from './FlowchartPanel';
import DummyCodePanel from './DummyCodePanel';

// Internal registry map
const panelRegistry = new Map();

/**
 * Register a panel type
 * @param {IStudioPanelDefinition} panelDefinition 
 */
export function registerPanel(panelDefinition) {
  if (panelRegistry.has(panelDefinition.id)) {
    console.warn(`Panel type "${panelDefinition.id}" is already registered. Overwriting.`);
  }
  panelRegistry.set(panelDefinition.id, panelDefinition);
}

/**
 * Get a panel definition by ID
 * @param {string} panelTypeId 
 * @returns {IStudioPanelDefinition | undefined}
 */
export function getPanelDefinition(panelTypeId) {
  return panelRegistry.get(panelTypeId);
}

/**
 * Get all registered panel types
 * @returns {IStudioPanelDefinition[]}
 */
export function getAllPanelDefinitions() {
  return Array.from(panelRegistry.values());
}

/**
 * Get panel types by category
 * @param {string} category 
 * @returns {IStudioPanelDefinition[]}
 */
export function getPanelsByCategory(category) {
  return getAllPanelDefinitions().filter(p => p.category === category);
}

/**
 * Check if a panel type is registered
 * @param {string} panelTypeId 
 * @returns {boolean}
 */
export function isPanelRegistered(panelTypeId) {
  return panelRegistry.has(panelTypeId);
}

/**
 * Unregister a panel type
 * @param {string} panelTypeId 
 */
export function unregisterPanel(panelTypeId) {
  panelRegistry.delete(panelTypeId);
}

/**
 * Get categories with their panels
 * @returns {Object<string, IStudioPanelDefinition[]>}
 */
export function getPanelsByCategories() {
  const categories = {};

  for (const panel of panelRegistry.values()) {
    if (!categories[panel.category]) {
      categories[panel.category] = [];
    }
    categories[panel.category].push(panel);
  }

  return categories;
}

// === Initialize with built-in panels ===
export function initializeBuiltInPanels() {
  // Core panels
  registerPanel(ChatPanel);
  registerPanel(WorkspacePanel);
  registerPanel(FlowchartPanel);

  // Register other panels if available
  // These can be uncommented as they are created/migrated
  try { registerPanel(DummyCanvasPanel); } catch (e) { console.log('DummyCanvasPanel not available'); }
  try { registerPanel(DummyNotesPanel); } catch (e) { console.log('DummyNotesPanel not available'); }
  try { registerPanel(DummyKanbanPanel); } catch (e) { console.log('DummyKanbanPanel not available'); }
  try { registerPanel(FlowchartPanel); } catch (e) { console.log('FlowchartPanel not available'); }
  try { registerPanel(DummyCodePanel); } catch (e) { console.log('DummyCodePanel not available'); }
}

// Initialize on module load
initializeBuiltInPanels();

export default {
  registerPanel,
  getPanelDefinition,
  getAllPanelDefinitions,
  getPanelsByCategory,
  isPanelRegistered,
  unregisterPanel,
  getPanelsByCategories,
};