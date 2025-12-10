/**
 * useMCPTools Hook
 * Aggregates and manages MCP tools from all panels
 */

import { useState, useEffect, useCallback } from 'react';
import { mcpOrchestrator } from '../services/mcpOrchestrator';
import useStudioStore from '../../../context/StudioContext';

/**
 * useMCPTools hook for managing MCP tool aggregation
 * @returns {object} Tools state and methods
 */
export function useMCPTools() {
    const [tools, setTools] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Get panels from store
    const { panels, getVisiblePanels } = useStudioStore();

    /**
     * Refresh tools from all panels
     */
    const refreshTools = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const visiblePanels = getVisiblePanels();
            const collectedTools = await mcpOrchestrator.collectTools(visiblePanels);
            setTools(collectedTools);
        } catch (err) {
            setError(err.message);
            console.error('Failed to collect tools:', err);
        } finally {
            setIsLoading(false);
        }
    }, [getVisiblePanels]);

    // Refresh tools when panels change
    useEffect(() => {
        refreshTools();
    }, [panels, refreshTools]);

    /**
     * Execute a tool by name
     * @param {string} toolName - Tool name
     * @param {object} args - Tool arguments
     * @returns {Promise<object>}
     */
    const executeTool = useCallback(async (toolName, args) => {
        return mcpOrchestrator.executeTool(toolName, args);
    }, []);

    /**
     * Get tools grouped by panel
     * @returns {object}
     */
    const getToolsByPanel = useCallback(() => {
        const grouped = {};

        for (const tool of tools) {
            const panelId = tool._panelId;
            if (!grouped[panelId]) {
                grouped[panelId] = {
                    panelId,
                    panelTitle: tool._panelTitle,
                    panelType: tool._panelTypeId,
                    tools: [],
                };
            }
            grouped[panelId].tools.push(tool);
        }

        return grouped;
    }, [tools]);

    /**
     * Check if a specific tool is available
     * @param {string} toolName - Tool name
     * @returns {boolean}
     */
    const hasTool = useCallback((toolName) => {
        return tools.some(t => t.name === toolName || t.originalName === toolName);
    }, [tools]);

    /**
     * Get tool by name
     * @param {string} toolName - Tool name
     * @returns {object|undefined}
     */
    const getTool = useCallback((toolName) => {
        return tools.find(t => t.name === toolName || t.originalName === toolName);
    }, [tools]);

    return {
        // State
        tools,
        isLoading,
        error,

        // Actions
        refreshTools,
        executeTool,

        // Utilities
        getToolsByPanel,
        hasTool,
        getTool,

        // Computed
        toolCount: tools.length,
        hasTools: tools.length > 0,
    };
}

export default useMCPTools;