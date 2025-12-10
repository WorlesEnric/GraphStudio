/**
 * useChat Hook
 * Manages chat state, messages, and conversation flow
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { aiClient, formatMessagesForAPI, formatToolsForAPI } from '../services/aiClient';
import { mcpOrchestrator } from '../services/mcpOrchestrator';
import { StreamParser } from '../utils/streamParser';
import {
    createUserMessage,
    createStreamingMessage,
    createErrorMessage,
    generateMessageId,
} from '../utils/messageUtils';
import useStudioStore from '../../../context/StudioContext';

/**
 * useChat hook for managing chat state and AI interactions
 * @param {object} options
 * @param {object} options.panelState - Panel state from store
 * @param {function} options.updateState - Function to update panel state
 * @returns {object} Chat state and methods
 */
export function useChat({ panelState, updateState }) {
    // Messages state
    const [messages, setMessages] = useState(panelState?.messages || []);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Configuration state
    const [provider, setProvider] = useState(panelState?.provider || null);
    const [model, setModel] = useState(panelState?.model || null);
    const [temperature, setTemperature] = useState(panelState?.temperature || 0.7);

    // Streaming state
    const streamingMessageRef = useRef(null);
    const streamParserRef = useRef(new StreamParser());

    // Get panels from store
    const { panels, getVisiblePanels } = useStudioStore();

    // Sync messages with panel state
    useEffect(() => {
        updateState?.({ messages });
    }, [messages, updateState]);

    /**
     * Add a message to the conversation
     */
    const addMessage = useCallback((message) => {
        setMessages(prev => [...prev, message]);
        return message;
    }, []);

    /**
     * Update the last message (for streaming)
     */
    const updateLastMessage = useCallback((updates) => {
        setMessages(prev => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            if (lastIndex >= 0) {
                newMessages[lastIndex] = {
                    ...newMessages[lastIndex],
                    ...updates,
                };
            }
            return newMessages;
        });
    }, []);

    /**
     * Clear all messages
     */
    const clearMessages = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    /**
     * Send a message and get AI response
     */
    const sendMessage = useCallback(async (content, attachments = []) => {
        if (!content.trim() && attachments.length === 0) return;

        setError(null);
        setIsLoading(true);

        // Add user message
        const userMessage = createUserMessage(content, attachments);
        addMessage(userMessage);

        // Create streaming message placeholder
        const streamingMessage = createStreamingMessage();
        addMessage(streamingMessage);
        streamingMessageRef.current = streamingMessage;

        // Reset stream parser
        streamParserRef.current.reset();

        try {
            // Collect tools from visible panels
            const visiblePanels = getVisiblePanels();
            const tools = await mcpOrchestrator.collectTools(visiblePanels);

            // Build context from observed panels
            const context = await mcpOrchestrator.buildContext(panels);

            // Generate system prompt
            const systemPrompt = mcpOrchestrator.generateSystemPrompt(context, tools);

            // Prepare messages for API
            const apiMessages = [
                { role: 'system', content: systemPrompt },
                ...formatMessagesForAPI(messages.filter(m => m.role !== 'error')),
                { role: 'user', content },
            ];

            // Format tools for API
            const apiTools = tools.length > 0 ? formatToolsForAPI(tools) : null;

            // Stream the response
            await aiClient.streamChat({
                messages: apiMessages,
                tools: apiTools,
                model,
                provider,
                temperature,
                onChunk: (chunk) => {
                    const result = streamParserRef.current.processChunk(chunk);

                    // Update streaming message with accumulated content
                    if (result.accumulated.content !== undefined) {
                        updateLastMessage({
                            content: result.accumulated.content,
                            isStreaming: true,
                        });
                    }

                    // Update tool calls if any
                    if (result.accumulated.toolCalls) {
                        updateLastMessage({
                            toolCalls: result.accumulated.toolCalls,
                            isStreaming: true,
                        });
                    }
                },
                onError: (err) => {
                    setError(err.message);
                    updateLastMessage({
                        content: `Error: ${err.message}`,
                        isStreaming: false,
                        isError: true,
                    });
                },
                onDone: async () => {
                    const finalResult = streamParserRef.current.getResult();

                    // Mark message as done streaming
                    updateLastMessage({
                        content: finalResult.content,
                        toolCalls: finalResult.toolCalls,
                        isStreaming: false,
                    });

                    // Handle tool calls if any
                    if (finalResult.toolCalls && finalResult.toolCalls.length > 0) {
                        await handleToolCalls(finalResult.toolCalls, apiMessages);
                    }
                },
            });
        } catch (err) {
            setError(err.message);
            updateLastMessage({
                content: `Error: ${err.message}`,
                isStreaming: false,
                isError: true,
            });
        } finally {
            setIsLoading(false);
            streamingMessageRef.current = null;
        }
    }, [messages, model, provider, temperature, panels, getVisiblePanels, addMessage, updateLastMessage]);

    /**
     * Handle tool calls from AI response
     */
    const handleToolCalls = useCallback(async (toolCalls, previousMessages) => {
        // Parse tool calls
        const parsedToolCalls = toolCalls.map(tc => {
            let args = {};
            try {
                args = typeof tc.function.arguments === 'string'
                    ? JSON.parse(tc.function.arguments)
                    : tc.function.arguments;
            } catch (e) {
                console.warn('Failed to parse tool arguments:', tc.function.arguments);
            }
            return {
                ...tc,
                function: {
                    ...tc.function,
                    parsedArguments: args,
                },
            };
        });

        // Execute tool calls
        const results = await mcpOrchestrator.processToolCalls(parsedToolCalls);

        // Add tool execution message
        const toolResultMessage = {
            id: generateMessageId(),
            role: 'tool_results',
            results,
            timestamp: Date.now(),
        };
        addMessage(toolResultMessage);

        // Continue conversation with tool results
        setIsLoading(true);

        try {
            // Add streaming message for AI response to tool results
            const streamingMessage = createStreamingMessage();
            addMessage(streamingMessage);
            streamParserRef.current.reset();

            // Build messages including tool results
            const messagesWithToolResults = [
                ...previousMessages,
                {
                    role: 'assistant',
                    content: null,
                    tool_calls: toolCalls,
                },
                ...mcpOrchestrator.formatToolResultsAsMessages(results),
            ];

            await aiClient.streamChat({
                messages: messagesWithToolResults,
                model,
                provider,
                temperature,
                onChunk: (chunk) => {
                    const result = streamParserRef.current.processChunk(chunk);
                    if (result.accumulated.content !== undefined) {
                        updateLastMessage({
                            content: result.accumulated.content,
                            isStreaming: true,
                        });
                    }
                },
                onError: (err) => {
                    setError(err.message);
                    updateLastMessage({
                        content: `Error: ${err.message}`,
                        isStreaming: false,
                        isError: true,
                    });
                },
                onDone: () => {
                    const finalResult = streamParserRef.current.getResult();
                    updateLastMessage({
                        content: finalResult.content,
                        isStreaming: false,
                    });
                },
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [model, provider, temperature, addMessage, updateLastMessage]);

    /**
     * Stop current generation
     */
    const stopGeneration = useCallback(() => {
        aiClient.abort();
        setIsLoading(false);

        if (streamingMessageRef.current) {
            updateLastMessage({ isStreaming: false });
        }
    }, [updateLastMessage]);

    /**
     * Regenerate last response
     */
    const regenerateLastResponse = useCallback(async () => {
        // Find last user message
        const lastUserIndex = messages.findLastIndex(m => m.role === 'user');
        if (lastUserIndex === -1) return;

        const lastUserMessage = messages[lastUserIndex];

        // Remove messages after last user message
        setMessages(messages.slice(0, lastUserIndex));

        // Re-send the message
        await sendMessage(lastUserMessage.content, lastUserMessage.attachments);
    }, [messages, sendMessage]);

    /**
     * Update model configuration
     */
    const setModelConfig = useCallback(({ provider: newProvider, model: newModel, temperature: newTemp }) => {
        if (newProvider !== undefined) setProvider(newProvider);
        if (newModel !== undefined) setModel(newModel);
        if (newTemp !== undefined) setTemperature(newTemp);

        updateState?.({
            provider: newProvider ?? provider,
            model: newModel ?? model,
            temperature: newTemp ?? temperature,
        });
    }, [provider, model, temperature, updateState]);

    return {
        // State
        messages,
        isLoading,
        error,
        provider,
        model,
        temperature,

        // Actions
        sendMessage,
        clearMessages,
        stopGeneration,
        regenerateLastResponse,
        setModelConfig,

        // Lower-level actions
        addMessage,
        updateLastMessage,
    };
}

export default useChat;