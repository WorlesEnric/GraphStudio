/**
 * MessageList Component
 * Scrollable container for chat messages with auto-scroll
 */

import React, { useRef, useEffect, memo } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { MessageSquare } from 'lucide-react';

/**
 * Empty state when no messages
 */
function EmptyState() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center mb-6 border border-white/5">
                <MessageSquare size={28} className="text-violet-400" />
            </div>

            <h3 className="text-lg font-semibold text-zinc-200 mb-2">
                Start a Conversation
            </h3>

            <p className="text-sm text-zinc-500 max-w-sm mb-6">
                I can help you work with panels, generate content, and answer questions about your project.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md">
                {[
                    'Help me create a flowchart',
                    'What panels are available?',
                    'Summarize my workspace',
                    'Generate some sample data',
                ].map((suggestion, index) => (
                    <button
                        key={index}
                        className="px-4 py-2 rounded-lg bg-zinc-800/50 border border-white/5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors text-left"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );
}

/**
 * MessageList component
 */
function MessageList({ messages, isLoading }) {
    const containerRef = useRef(null);
    const bottomRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    // Handle scroll to check if user scrolled up
    const handleScroll = () => {
        // Could implement "scroll to bottom" button logic here
    };

    if (messages.length === 0) {
        return <EmptyState />;
    }

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-5 scroll-smooth"
        >
            {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
            ))}

            {isLoading && !messages[messages.length - 1]?.isStreaming && (
                <TypingIndicator />
            )}

            <div ref={bottomRef} />
        </div>
    );
}

export default memo(MessageList);