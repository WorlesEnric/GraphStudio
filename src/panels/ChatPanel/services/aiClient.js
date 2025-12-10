/**
 * AI Client - Frontend service for communicating with the AI backend
 * Supports streaming responses and tool calling
 */

// Default API base URL - can be overridden via environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * AI Client class for making requests to the backend
 */
class AIClient {
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
        this.abortController = null;
    }

    /**
     * Get current AI configuration from backend
     * @returns {Promise<object>}
     */
    async getConfig() {
        const response = await fetch(`${this.baseUrl}/ai/config`);
        if (!response.ok) {
            throw new Error(`Failed to get config: ${response.statusText}`);
        }
        return response.json();
    }

    /**
     * Get available models for a provider
     * @param {string} provider 
     * @returns {Promise<object>}
     */
    async getModels(provider) {
        const response = await fetch(`${this.baseUrl}/ai/models/${provider}`);
        if (!response.ok) {
            throw new Error(`Failed to get models: ${response.statusText}`);
        }
        return response.json();
    }

    /**
     * Create a streaming chat completion
     * @param {object} options
     * @param {Array} options.messages - Chat messages
     * @param {Array} options.tools - Optional tool definitions
     * @param {string} options.model - Model ID
     * @param {string} options.provider - Provider ID
     * @param {number} options.temperature - Sampling temperature
     * @param {number} options.maxTokens - Maximum tokens
     * @param {function} options.onChunk - Callback for each chunk
     * @param {function} options.onError - Error callback
     * @param {function} options.onDone - Completion callback
     * @returns {Promise<void>}
     */
    async streamChat({
        messages,
        tools = null,
        model = null,
        provider = null,
        temperature = 0.7,
        maxTokens = 4096,
        onChunk,
        onError,
        onDone,
    }) {
        // Cancel any existing request
        this.abort();
        this.abortController = new AbortController();

        try {
            const response = await fetch(`${this.baseUrl}/ai/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages,
                    tools,
                    model,
                    provider,
                    temperature,
                    max_tokens: maxTokens,
                    stream: true,
                }),
                signal: this.abortController.signal,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || `Request failed: ${response.statusText}`);
            }

            // Process the stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    onDone?.();
                    break;
                }

                buffer += decoder.decode(value, { stream: true });

                // Process complete SSE messages
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();

                        if (data === '[DONE]') {
                            onDone?.();
                            return;
                        }

                        try {
                            const chunk = JSON.parse(data);
                            onChunk?.(chunk);
                        } catch (e) {
                            console.warn('Failed to parse chunk:', data);
                        }
                    }
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                // Request was cancelled, not an error
                return;
            }
            onError?.(error);
        }
    }

    /**
     * Non-streaming chat completion
     * @param {object} options
     * @returns {Promise<object>}
     */
    async chat({
        messages,
        tools = null,
        model = null,
        provider = null,
        temperature = 0.7,
        maxTokens = 4096,
    }) {
        const response = await fetch(`${this.baseUrl}/ai/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages,
                tools,
                model,
                provider,
                temperature,
                max_tokens: maxTokens,
                stream: false,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || `Request failed: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Abort current streaming request
     */
    abort() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    /**
     * Health check
     * @returns {Promise<object>}
     */
    async healthCheck() {
        const response = await fetch(`${this.baseUrl}/ai/health`);
        return response.json();
    }
}

// Create and export singleton instance
export const aiClient = new AIClient();

/**
 * Convert messages to the format expected by the API
 * @param {Array} messages - Internal message format
 * @returns {Array} API message format
 */
export function formatMessagesForAPI(messages) {
    return messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.name && { name: msg.name }),
        ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id }),
    }));
}

/**
 * Convert tools to OpenAI function format
 * @param {Array} tools - MCP tools from panels
 * @returns {Array} OpenAI tool format
 */
export function formatToolsForAPI(tools) {
    return tools.map(tool => ({
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema || {
                type: 'object',
                properties: {},
            },
        },
    }));
}

export default aiClient;