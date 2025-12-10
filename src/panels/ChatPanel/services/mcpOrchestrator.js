/**
 * MCP Orchestrator - Aggregates and executes tools from all panels
 * 
 * This service is responsible for:
 * 1. Collecting tools from all registered panels
 * 2. Building context from observed panels
 * 3. Executing tool calls on the appropriate panels
 */

import { getPanelDefinition, getAllPanelDefinitions } from '../../registry';
import useStudioStore from '../../../context/StudioContext';

/**
 * MCP Orchestrator class
 */
class MCPOrchestrator {
    constructor() {
        this.toolCache = new Map();
        this.contextCache = new Map();
    }

    /**
     * Collect all tools from panels
     * @param {Array} panels - Panel instances
     * @returns {Promise<Array>} Aggregated tools with panel info
     */
    async collectTools(panels) {
        const allTools = [];

        for (const panel of panels) {
            const definition = getPanelDefinition(panel.panelTypeId);

            if (!definition?.getMCPTools) continue;

            try {
                const tools = await definition.getMCPTools(panel.state);

                // Add panel info to each tool for routing
                const enrichedTools = tools.map(tool => ({
                    ...tool,
                    _panelId: panel.id,
                    _panelTypeId: panel.panelTypeId,
                    _panelTitle: panel.title,
                    // Create unique tool name to avoid conflicts
                    name: `${panel.panelTypeId}_${tool.name}`,
                    originalName: tool.name,
                }));

                allTools.push(...enrichedTools);
            } catch (error) {
                console.error(`Failed to get tools from panel ${panel.title}:`, error);
            }
        }

        // Cache tools for quick lookup
        this.toolCache.clear();
        allTools.forEach(tool => {
            this.toolCache.set(tool.name, tool);
        });

        return allTools;
    }

    /**
     * Build context from observed panels
     * @param {Array} panels - Panel instances
     * @returns {Promise<object>} Aggregated context
     */
    async buildContext(panels) {
        const observedPanels = panels.filter(p => p.isAIObserving);

        const contexts = await Promise.all(
            observedPanels.map(async (panel) => {
                const definition = getPanelDefinition(panel.panelTypeId);

                if (!definition?.getLLMContext) {
                    return null;
                }

                try {
                    const context = await definition.getLLMContext(panel.state);
                    return {
                        panelId: panel.id,
                        panelType: panel.panelTypeId,
                        panelTitle: panel.title,
                        context,
                    };
                } catch (error) {
                    console.error(`Failed to get context from panel ${panel.title}:`, error);
                    return null;
                }
            })
        );

        return {
            observedPanels: contexts.filter(Boolean),
            timestamp: Date.now(),
        };
    }

    /**
     * Generate system prompt with panel context
     * @param {object} context - Aggregated context
     * @param {Array} tools - Available tools
     * @returns {string} System prompt
     */
    generateSystemPrompt(context, tools) {
        const parts = [
            'You are an AI assistant integrated into Nexus GraphStudio, a multi-panel IDE for graphical authoring.',
            '',
            '## Your Capabilities',
            '- You can observe and understand the content of panels that users have enabled AI observation for.',
            '- You can execute tools to modify panels, create content, and perform actions.',
            '- You should be helpful, concise, and focused on the user\'s creative workflow.',
            '',
        ];

        // Add context from observed panels
        if (context.observedPanels?.length > 0) {
            parts.push('## Currently Observed Panels');
            parts.push('The following panels are being observed (you can see their content):');
            parts.push('');

            for (const panel of context.observedPanels) {
                parts.push(`### ${panel.panelTitle} (${panel.panelType})`);

                if (panel.context?.type === 'empty') {
                    parts.push('- Empty or minimal content');
                } else if (typeof panel.context?.data === 'string') {
                    parts.push('```');
                    parts.push(panel.context.data.slice(0, 2000)); // Limit context size
                    parts.push('```');
                } else if (panel.context?.data) {
                    parts.push('```json');
                    parts.push(JSON.stringify(panel.context.data, null, 2).slice(0, 2000));
                    parts.push('```');
                }
                parts.push('');
            }
        }

        // Add available tools
        if (tools?.length > 0) {
            parts.push('## Available Tools');
            parts.push('You have access to the following tools:');
            parts.push('');

            for (const tool of tools) {
                parts.push(`- **${tool.name}**: ${tool.description}`);
                if (tool._panelTitle) {
                    parts.push(`  - Source: ${tool._panelTitle}`);
                }
            }
            parts.push('');
        }

        parts.push('## Guidelines');
        parts.push('- Be concise and helpful');
        parts.push('- When users ask you to modify a panel, use the appropriate tool');
        parts.push('- If you need more context, ask the user to enable AI observation on relevant panels');
        parts.push('- Always explain what you\'re doing when using tools');

        return parts.join('\n');
    }

    /**
     * Execute a tool call
     * @param {string} toolName - Name of the tool (with panel prefix)
     * @param {object} args - Tool arguments
     * @returns {Promise<object>} Tool execution result
     */
    async executeTool(toolName, args) {
        const tool = this.toolCache.get(toolName);

        if (!tool) {
            return {
                success: false,
                error: `Unknown tool: ${toolName}`,
            };
        }

        const { _panelId, _panelTypeId, originalName } = tool;

        // Get panel definition
        const definition = getPanelDefinition(_panelTypeId);

        if (!definition?.executeMCPTool) {
            return {
                success: false,
                error: `Panel ${_panelTypeId} does not support tool execution`,
            };
        }

        // Get current panel state from store
        const store = useStudioStore.getState();
        const panel = store.panels.find(p => p.id === _panelId);

        if (!panel) {
            return {
                success: false,
                error: `Panel ${_panelId} not found`,
            };
        }

        try {
            // Execute the tool
            const result = await definition.executeMCPTool(
                originalName,
                args,
                panel.state,
                (newState) => store.updatePanelState(_panelId, newState)
            );

            return {
                success: true,
                result,
                toolName,
                panelTitle: panel.title,
            };
        } catch (error) {
            console.error(`Tool execution error:`, error);
            return {
                success: false,
                error: error.message,
                toolName,
            };
        }
    }

    /**
     * Process tool calls from AI response
     * @param {Array} toolCalls - Tool calls from AI
     * @returns {Promise<Array>} Results for each tool call
     */
    async processToolCalls(toolCalls) {
        const results = [];

        for (const call of toolCalls) {
            const args = typeof call.function.arguments === 'string'
                ? JSON.parse(call.function.arguments)
                : call.function.arguments;

            const result = await this.executeTool(call.function.name, args);

            results.push({
                toolCallId: call.id,
                name: call.function.name,
                ...result,
            });
        }

        return results;
    }

    /**
     * Get formatted tool results for continuing conversation
     * @param {Array} results - Tool execution results
     * @returns {Array} Messages with tool results
     */
    formatToolResultsAsMessages(results) {
        return results.map(result => ({
            role: 'tool',
            tool_call_id: result.toolCallId,
            name: result.name,
            content: JSON.stringify(result.success ? result.result : { error: result.error }),
        }));
    }
}

// Export singleton instance
export const mcpOrchestrator = new MCPOrchestrator();

export default mcpOrchestrator;