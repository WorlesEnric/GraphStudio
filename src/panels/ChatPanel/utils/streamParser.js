/**
 * Stream Parser Utilities
 * Handles parsing of SSE streams from AI responses
 */

/**
 * SSE Stream Parser class
 */
export class StreamParser {
    constructor() {
        this.buffer = '';
        this.contentBuffer = '';
        this.toolCallsBuffer = {};
        this.finishReason = null;
    }

    /**
     * Reset parser state
     */
    reset() {
        this.buffer = '';
        this.contentBuffer = '';
        this.toolCallsBuffer = {};
        this.finishReason = null;
    }

    /**
     * Process a chunk from the stream
     * @param {object} chunk - Parsed chunk from stream
     * @returns {object} Processed result
     */
    processChunk(chunk) {
        const result = {
            type: chunk.type,
            delta: {},
            accumulated: {},
        };

        // Handle content delta
        if (chunk.content) {
            this.contentBuffer += chunk.content;
            result.delta.content = chunk.content;
            result.accumulated.content = this.contentBuffer;
        }

        // Handle tool calls
        if (chunk.tool_calls) {
            for (const toolCall of chunk.tool_calls) {
                const index = toolCall.index;

                if (!this.toolCallsBuffer[index]) {
                    this.toolCallsBuffer[index] = {
                        id: toolCall.id || '',
                        type: 'function',
                        function: {
                            name: toolCall.function?.name || '',
                            arguments: '',
                        },
                    };
                }

                // Set function name (should be complete, not streamed in chunks)
                // Only update if name is not already set or if new name is different and longer
                if (toolCall.function?.name) {
                    const currentName = this.toolCallsBuffer[index].function.name || '';
                    const newName = toolCall.function.name;
                    
                    // If name is not set, or new name is different and potentially more complete
                    if (!currentName || (newName !== currentName && newName.length >= currentName.length)) {
                        this.toolCallsBuffer[index].function.name = newName;
                    }
                    // If names are the same, keep current (no change needed)
                    // If new name is shorter, keep current (it's likely incomplete)
                }

                // Accumulate arguments
                if (toolCall.function?.arguments) {
                    this.toolCallsBuffer[index].function.arguments += toolCall.function.arguments;
                }

                // Update ID if provided
                if (toolCall.id) {
                    this.toolCallsBuffer[index].id = toolCall.id;
                }
            }

            result.accumulated.toolCalls = Object.values(this.toolCallsBuffer);
        }

        // Handle tool call start (Anthropic format)
        if (chunk.tool_call_start) {
            const { id, name } = chunk.tool_call_start;
            const index = Object.keys(this.toolCallsBuffer).length;

            this.toolCallsBuffer[index] = {
                id,
                type: 'function',
                function: {
                    name,
                    arguments: '',
                },
            };

            result.accumulated.toolCalls = Object.values(this.toolCallsBuffer);
        }

        // Handle tool input delta (Anthropic format)
        if (chunk.tool_input_delta) {
            const lastIndex = Object.keys(this.toolCallsBuffer).length - 1;
            if (lastIndex >= 0) {
                this.toolCallsBuffer[lastIndex].function.arguments += chunk.tool_input_delta;
            }
            result.accumulated.toolCalls = Object.values(this.toolCallsBuffer);
        }

        // Handle finish reason
        if (chunk.finish_reason) {
            this.finishReason = chunk.finish_reason;
            result.finishReason = chunk.finish_reason;
        }

        return result;
    }

    /**
     * Get final accumulated result
     * @returns {object}
     */
    getResult() {
        const toolCalls = Object.values(this.toolCallsBuffer);

        return {
            content: this.contentBuffer,
            toolCalls: toolCalls.length > 0 ? toolCalls : null,
            finishReason: this.finishReason,
        };
    }

    /**
     * Check if there are pending tool calls
     * @returns {boolean}
     */
    hasToolCalls() {
        return Object.keys(this.toolCallsBuffer).length > 0;
    }

    /**
     * Get parsed tool calls with valid JSON arguments
     * @returns {Array|null}
     */
    getParsedToolCalls() {
        const toolCalls = Object.values(this.toolCallsBuffer);

        if (toolCalls.length === 0) return null;

        return toolCalls.map(tc => {
            let args = {};
            try {
                args = JSON.parse(tc.function.arguments);
            } catch (e) {
                console.warn('Failed to parse tool arguments:', tc.function.arguments);
            }

            return {
                id: tc.id,
                type: tc.type,
                function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments,
                    parsedArguments: args,
                },
            };
        });
    }
}

/**
 * Parse a single SSE line
 * @param {string} line - SSE line
 * @returns {object|null}
 */
export function parseSSELine(line) {
    if (!line.startsWith('data: ')) {
        return null;
    }

    const data = line.slice(6).trim();

    if (data === '[DONE]') {
        return { type: 'done' };
    }

    try {
        return JSON.parse(data);
    } catch (e) {
        console.warn('Failed to parse SSE data:', data);
        return null;
    }
}

/**
 * Create a stream reader for fetch response
 * @param {Response} response - Fetch response
 * @returns {AsyncGenerator}
 */
export async function* createStreamReader(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const parsed = parseSSELine(line);
                if (parsed) {
                    yield parsed;
                }
            }
        }

        // Process remaining buffer
        if (buffer) {
            const parsed = parseSSELine(buffer);
            if (parsed) {
                yield parsed;
            }
        }
    } finally {
        reader.releaseLock();
    }
}

export default {
    StreamParser,
    parseSSELine,
    createStreamReader,
};