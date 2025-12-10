/**
 * Message Utilities
 * Helper functions for message management
 */

/**
 * Generate unique message ID
 * @returns {string}
 */
export function generateMessageId() {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a user message
 * @param {string} content - Message content
 * @param {Array} attachments - Optional attachments
 * @returns {object}
 */
export function createUserMessage(content, attachments = []) {
    return {
        id: generateMessageId(),
        role: 'user',
        content,
        attachments,
        timestamp: Date.now(),
    };
}

/**
 * Create an assistant message
 * @param {string} content - Message content
 * @param {Array} toolCalls - Optional tool calls
 * @returns {object}
 */
export function createAssistantMessage(content = '', toolCalls = null) {
    return {
        id: generateMessageId(),
        role: 'assistant',
        content,
        toolCalls,
        timestamp: Date.now(),
        isStreaming: false,
    };
}

/**
 * Create a streaming assistant message
 * @returns {object}
 */
export function createStreamingMessage() {
    return {
        id: generateMessageId(),
        role: 'assistant',
        content: '',
        toolCalls: null,
        timestamp: Date.now(),
        isStreaming: true,
    };
}

/**
 * Create a tool result message
 * @param {string} toolCallId - Tool call ID
 * @param {string} toolName - Tool name
 * @param {object} result - Tool result
 * @returns {object}
 */
export function createToolResultMessage(toolCallId, toolName, result) {
    return {
        id: generateMessageId(),
        role: 'tool',
        tool_call_id: toolCallId,
        name: toolName,
        content: JSON.stringify(result),
        timestamp: Date.now(),
    };
}

/**
 * Create a system message
 * @param {string} content - Message content
 * @returns {object}
 */
export function createSystemMessage(content) {
    return {
        id: generateMessageId(),
        role: 'system',
        content,
        timestamp: Date.now(),
    };
}

/**
 * Create an error message
 * @param {string} error - Error message
 * @returns {object}
 */
export function createErrorMessage(error) {
    return {
        id: generateMessageId(),
        role: 'error',
        content: error,
        timestamp: Date.now(),
    };
}

/**
 * Format message content for display
 * @param {string} content - Raw content
 * @returns {string}
 */
export function formatMessageContent(content) {
    if (!content) return '';

    // Basic markdown-like formatting could be added here
    return content;
}

/**
 * Truncate content for preview
 * @param {string} content - Content to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string}
 */
export function truncateContent(content, maxLength = 100) {
    if (!content || content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
}

/**
 * Count tokens in a message (rough estimate)
 * @param {string} content - Message content
 * @returns {number}
 */
export function estimateTokens(content) {
    if (!content) return 0;
    // Rough estimate: ~4 characters per token
    return Math.ceil(content.length / 4);
}

/**
 * Calculate total tokens in message history
 * @param {Array} messages - Message array
 * @returns {number}
 */
export function calculateTotalTokens(messages) {
    return messages.reduce((total, msg) => total + estimateTokens(msg.content), 0);
}

/**
 * Filter messages to fit within token limit
 * @param {Array} messages - Message array
 * @param {number} maxTokens - Maximum tokens
 * @returns {Array}
 */
export function trimMessagesToFit(messages, maxTokens) {
    const result = [];
    let totalTokens = 0;

    // Always keep system message if present
    const systemMessage = messages.find(m => m.role === 'system');
    if (systemMessage) {
        totalTokens += estimateTokens(systemMessage.content);
        result.push(systemMessage);
    }

    // Add messages from the end (most recent first)
    const nonSystemMessages = messages.filter(m => m.role !== 'system').reverse();

    for (const message of nonSystemMessages) {
        const tokens = estimateTokens(message.content);
        if (totalTokens + tokens <= maxTokens) {
            result.unshift(message);
            totalTokens += tokens;
        } else {
            break;
        }
    }

    return result;
}

/**
 * Get human-readable time from timestamp
 * @param {number} timestamp - Unix timestamp
 * @returns {string}
 */
export function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();

    // Same day - show time only
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Within a week - show day and time
    const dayDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (dayDiff < 7) {
        return date.toLocaleDateString([], { weekday: 'short' }) + ' ' +
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Older - show full date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default {
    generateMessageId,
    createUserMessage,
    createAssistantMessage,
    createStreamingMessage,
    createToolResultMessage,
    createSystemMessage,
    createErrorMessage,
    formatMessageContent,
    truncateContent,
    estimateTokens,
    calculateTotalTokens,
    trimMessagesToFit,
    formatTimestamp,
};