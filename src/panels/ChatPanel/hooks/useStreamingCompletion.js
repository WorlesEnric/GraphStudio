/**
 * useStreamingCompletion Hook
 * Low-level hook for streaming AI completions
 */

import { useState, useCallback, useRef } from 'react';
import { aiClient } from '../services/aiClient';
import { StreamParser } from '../utils/streamParser';

/**
 * useStreamingCompletion hook for streaming AI responses
 * @param {object} options
 * @param {string} options.provider - AI provider
 * @param {string} options.model - Model ID
 * @param {number} options.temperature - Sampling temperature
 * @param {number} options.maxTokens - Maximum tokens
 * @returns {object} Streaming state and methods
 */
export function useStreamingCompletion({
    provider = null,
    model = null,
    temperature = 0.7,
    maxTokens = 4096,
} = {}) {
    // State
    const [isStreaming, setIsStreaming] = useState(false);
    const [content, setContent] = useState('');
    const [toolCalls, setToolCalls] = useState(null);
    const [error, setError] = useState(null);
    const [finishReason, setFinishReason] = useState(null);

    // Refs
    const parserRef = useRef(new StreamParser());
    const abortRef = useRef(false);

    /**
     * Start a streaming completion
     * @param {Array} messages - Chat messages
     * @param {Array} tools - Optional tools
     * @returns {Promise<object>} Final result
     */
    const stream = useCallback(async (messages, tools = null) => {
        // Reset state
        setIsStreaming(true);
        setContent('');
        setToolCalls(null);
        setError(null);
        setFinishReason(null);
        parserRef.current.reset();
        abortRef.current = false;

        return new Promise((resolve, reject) => {
            aiClient.streamChat({
                messages,
                tools,
                provider,
                model,
                temperature,
                maxTokens,
                onChunk: (chunk) => {
                    if (abortRef.current) return;

                    const result = parserRef.current.processChunk(chunk);

                    if (result.accumulated.content !== undefined) {
                        setContent(result.accumulated.content);
                    }

                    if (result.accumulated.toolCalls) {
                        setToolCalls(result.accumulated.toolCalls);
                    }

                    if (result.finishReason) {
                        setFinishReason(result.finishReason);
                    }
                },
                onError: (err) => {
                    setError(err.message);
                    setIsStreaming(false);
                    reject(err);
                },
                onDone: () => {
                    setIsStreaming(false);
                    const result = parserRef.current.getResult();
                    resolve(result);
                },
            });
        });
    }, [provider, model, temperature, maxTokens]);

    /**
     * Abort current stream
     */
    const abort = useCallback(() => {
        abortRef.current = true;
        aiClient.abort();
        setIsStreaming(false);
    }, []);

    /**
     * Reset state
     */
    const reset = useCallback(() => {
        setContent('');
        setToolCalls(null);
        setError(null);
        setFinishReason(null);
        parserRef.current.reset();
    }, []);

    return {
        // State
        isStreaming,
        content,
        toolCalls,
        error,
        finishReason,

        // Actions
        stream,
        abort,
        reset,

        // Computed
        hasContent: content.length > 0,
        hasToolCalls: toolCalls !== null && toolCalls.length > 0,
        hasError: error !== null,
        isDone: !isStreaming && finishReason !== null,
    };
}

export default useStreamingCompletion;