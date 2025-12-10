/**
 * TypingIndicator Component
 * Shows animated dots when AI is typing
 */

import React from 'react';
import { Bot } from 'lucide-react';

function TypingIndicator() {
    return (
        <div className="flex gap-3 animate-fadeIn">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                <Bot size={14} className="text-white" />
            </div>

            <div className="bg-zinc-800/80 rounded-2xl rounded-bl-md px-4 py-3 border border-white/5">
                <div className="flex gap-1.5 items-center h-5">
                    <span
                        className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms', animationDuration: '0.8s' }}
                    />
                    <span
                        className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms', animationDuration: '0.8s' }}
                    />
                    <span
                        className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms', animationDuration: '0.8s' }}
                    />
                </div>
            </div>
        </div>
    );
}

export default TypingIndicator;