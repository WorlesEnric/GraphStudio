/**
 * ChatPanel - AI Assistant and MCP Orchestrator
 * 
 * This is the central AI infrastructure for Nexus GraphStudio.
 * It provides:
 * - Chat interface with streaming AI responses
 * - MCP tool orchestration across panels
 * - Context aggregation from observed panels
 * - Multi-provider support (OpenAI, Anthropic, DeepSeek, SiliconFlow)
 */

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { createPanelDefinition, PanelCategories } from '../BasePanelInterface';
import ChatMainView from './ChatMainView';

/**
 * ChatPanel Definition
 */
const ChatPanel = createPanelDefinition({
    id: 'chat',
    name: 'AI Assistant',
    description: 'AI-powered chat with MCP tool orchestration',
    icon: MessageSquare,
    category: PanelCategories.AI,
    accentColor: 'violet',

    /**
     * Render the main chat view
     */
    renderMainView: (props) => <ChatMainView {...props} />,

    /**
     * Initial state for new chat panel instances
     */
    getInitialState: () => ({
        messages: [],
        provider: null, // Will use default from backend
        model: null,    // Will use default from backend
        temperature: 0.7,
    }),

    /**
     * Get context for LLM to understand this panel
     */
    getLLMContext: async (state) => {
        const recentMessages = (state.messages || []).slice(-10);

        return {
            type: 'chat',
            data: {
                messageCount: state.messages?.length || 0,
                recentMessages: recentMessages.map(m => ({
                    role: m.role,
                    preview: m.content?.slice(0, 200),
                })),
            },
        };
    },

    /**
     * MCP Tools exposed by the Chat Panel
     */
    getMCPTools: async () => [
        {
            name: 'clear_chat',
            description: 'Clear all messages in the chat',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'get_chat_summary',
            description: 'Get a summary of the current conversation',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'send_message',
            description: 'Send a message to the chat (simulated user message)',
            inputSchema: {
                type: 'object',
                properties: {
                    message: {
                        type: 'string',
                        description: 'The message to send',
                    },
                },
                required: ['message'],
            },
        },
    ],

    /**
     * Execute MCP tools on this panel
     */
    executeMCPTool: async (name, args, panelState, updateState) => {
        switch (name) {
            case 'clear_chat':
                updateState({ messages: [] });
                return { success: true, message: 'Chat cleared' };

            case 'get_chat_summary':
                const messages = panelState.messages || [];
                return {
                    success: true,
                    summary: {
                        totalMessages: messages.length,
                        userMessages: messages.filter(m => m.role === 'user').length,
                        assistantMessages: messages.filter(m => m.role === 'assistant').length,
                        lastMessageAt: messages.length > 0
                            ? new Date(messages[messages.length - 1].timestamp).toISOString()
                            : null,
                    },
                };

            case 'send_message':
                // This would typically trigger the chat to process the message
                // For now, we just acknowledge it
                return {
                    success: true,
                    message: `Message queued: "${args.message}"`,
                };

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    },

    /**
     * Panel actions for command palette
     */
    actions: [
        {
            id: 'chat.clear',
            label: 'Clear Chat',
            category: 'Chat',
            shortcut: 'Mod+Shift+C',
            handler: (panelState, updateState) => {
                updateState({ messages: [] });
            },
        },
        {
            id: 'chat.export',
            label: 'Export Conversation',
            category: 'Chat',
            handler: (panelState) => {
                const data = JSON.stringify(panelState.messages, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `chat-export-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
            },
        },
    ],

    /**
     * Export formats
     */
    exportFormats: [
        {
            format: 'json',
            label: 'JSON',
            mimeType: 'application/json',
        },
        {
            format: 'md',
            label: 'Markdown',
            mimeType: 'text/markdown',
        },
    ],

    /**
     * Lifecycle hooks
     */
    onMount: () => {
        console.log('ChatPanel mounted');
    },

    onUnmount: () => {
        console.log('ChatPanel unmounted');
    },

    onFocus: () => {
        // Could focus the input when panel is focused
    },

    onBlur: () => {
        // Could save state when panel loses focus
    },
});

export default ChatPanel;

// Also export components and hooks for use elsewhere
export { default as ChatMainView } from './ChatMainView';
export { useChat } from './hooks/useChat';
export { useMCPTools } from './hooks/useMCPTools';
export { aiClient } from './services/aiClient';
export { mcpOrchestrator } from './services/mcpOrchestrator';