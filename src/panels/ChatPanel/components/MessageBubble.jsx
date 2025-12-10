/**
 * MessageBubble Component
 * Renders individual chat messages with proper styling
 */

import React, { memo } from 'react';
import { User, Bot, Terminal, AlertCircle, Wrench, CheckCircle, XCircle } from 'lucide-react';
import { formatTimestamp } from '../utils/messageUtils';

/**
 * Avatar component for message sender
 */
function MessageAvatar({ role, isError }) {
    const baseClasses = 'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center';

    if (role === 'user') {
        return (
            <div className={`${baseClasses} bg-violet-500`}>
                <User size={14} className="text-white" />
            </div>
        );
    }

    if (role === 'tool_results') {
        return (
            <div className={`${baseClasses} bg-orange-500`}>
                <Wrench size={14} className="text-white" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className={`${baseClasses} bg-red-500`}>
                <AlertCircle size={14} className="text-white" />
            </div>
        );
    }

    return (
        <div className={`${baseClasses} bg-gradient-to-br from-cyan-500 to-violet-500`}>
            <Bot size={14} className="text-white" />
        </div>
    );
}

/**
 * Tool call display component
 */
function ToolCallDisplay({ toolCalls }) {
    if (!toolCalls || toolCalls.length === 0) return null;

    return (
        <div className="mt-3 space-y-2">
            {toolCalls.map((call, index) => {
                let args = {};
                try {
                    args = typeof call.function.arguments === 'string'
                        ? JSON.parse(call.function.arguments)
                        : call.function.arguments;
                } catch (e) {
                    args = { raw: call.function.arguments };
                }

                return (
                    <div
                        key={call.id || index}
                        className="text-xs bg-black/30 rounded-lg p-3 font-mono border border-white/5 select-text"
                    >
                        <div className="flex items-center gap-2 text-zinc-400 mb-2">
                            <Terminal size={12} />
                            <span className="font-semibold text-zinc-300">{call.function.name}</span>
                        </div>
                        <pre className="text-zinc-400 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(args, null, 2)}
                        </pre>
                    </div>
                );
            })}
        </div>
    );
}

/**
 * Tool results display component
 */
function ToolResultsDisplay({ results }) {
    if (!results || results.length === 0) return null;

    return (
        <div className="space-y-2">
            {results.map((result, index) => (
                <div
                    key={result.toolCallId || index}
                    className="text-xs bg-black/30 rounded-lg p-3 font-mono border border-white/5 select-text"
                >
                    <div className="flex items-center gap-2 mb-2">
                        {result.success ? (
                            <CheckCircle size={12} className="text-green-400" />
                        ) : (
                            <XCircle size={12} className="text-red-400" />
                        )}
                        <span className="font-semibold text-zinc-300">{result.name}</span>
                        {result.panelTitle && (
                            <span className="text-zinc-500">→ {result.panelTitle}</span>
                        )}
                    </div>
                    <pre className="text-zinc-400 overflow-x-auto whitespace-pre-wrap">
                        {result.success
                            ? JSON.stringify(result.result, null, 2)
                            : result.error
                        }
                    </pre>
                </div>
            ))}
        </div>
    );
}

/**
 * Message content with basic markdown support
 */
function MessageContent({ content, isStreaming }) {
    if (!content) return null;

    // Basic code block detection
    const renderContent = () => {
        const parts = content.split(/(```[\s\S]*?```)/g);

        return parts.map((part, index) => {
            if (part.startsWith('```')) {
                // Extract language and code
                const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
                const language = match?.[1] || '';
                const code = match?.[2] || part.slice(3, -3);

                return (
                    <pre
                        key={index}
                        className="my-2 p-3 bg-black/30 rounded-lg text-xs font-mono overflow-x-auto border border-white/5 select-text"
                    >
                        {language && (
                            <div className="text-zinc-500 text-[10px] mb-2 uppercase">{language}</div>
                        )}
                        <code className="text-zinc-300">{code.trim()}</code>
                    </pre>
                );
            }

            // Regular text with inline code support
            return (
                <span key={index} className="whitespace-pre-wrap">
                    {part.split(/(`[^`]+`)/).map((segment, i) => {
                        if (segment.startsWith('`') && segment.endsWith('`')) {
                            return (
                                <code
                                    key={i}
                                    className="px-1.5 py-0.5 bg-black/30 rounded text-sm font-mono text-violet-300"
                                >
                                    {segment.slice(1, -1)}
                                </code>
                            );
                        }
                        return segment;
                    })}
                </span>
            );
        });
    };

    return (
        <div className="text-sm leading-relaxed">
            {renderContent()}
            {isStreaming && (
                <span className="inline-block w-2 h-4 bg-white/50 animate-pulse ml-0.5" />
            )}
        </div>
    );
}

/**
 * Main MessageBubble component
 */
function MessageBubble({ message }) {
    const { role, content, toolCalls, results, timestamp, isStreaming, isError } = message;
    const isUser = role === 'user';
    const isToolResults = role === 'tool_results';

    // Bubble styling based on role
    const bubbleClasses = isUser
        ? 'bg-violet-500 text-white rounded-br-md shadow-lg shadow-violet-500/10'
        : isError
            ? 'bg-red-500/10 text-red-200 rounded-bl-md border border-red-500/20'
            : 'bg-zinc-800/80 text-zinc-100 rounded-bl-md border border-white/5 shadow-lg shadow-black/10';

    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-fadeIn`}>
            <MessageAvatar role={role} isError={isError} />

            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${bubbleClasses}`}>
                {/* Tool results display */}
                {isToolResults && <ToolResultsDisplay results={results} />}

                {/* Message content */}
                {content && <MessageContent content={content} isStreaming={isStreaming} />}

                {/* Tool calls display */}
                {toolCalls && <ToolCallDisplay toolCalls={toolCalls} />}

                {/* Timestamp */}
                {timestamp && (
                    <p className={`text-[10px] mt-2 ${isUser ? 'text-violet-200' : 'text-zinc-500'}`}>
                        {formatTimestamp(timestamp)}
                    </p>
                )}
            </div>
        </div>
    );
}

export default memo(MessageBubble);