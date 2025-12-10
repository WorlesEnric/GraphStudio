/**
 * ToolCallDisplay Component
 * Displays tool calls and their execution status
 */

import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronRight, CheckCircle, XCircle, Loader2 } from 'lucide-react';

/**
 * Single tool call display
 */
function ToolCall({ call, result, isExecuting }) {
    const [isExpanded, setIsExpanded] = useState(false);

    let args = {};
    try {
        args = typeof call.function.arguments === 'string'
            ? JSON.parse(call.function.arguments)
            : call.function.arguments || {};
    } catch (e) {
        args = { raw: call.function.arguments };
    }

    // Status icon
    const StatusIcon = () => {
        if (isExecuting) {
            return <Loader2 size={12} className="text-yellow-400 animate-spin" />;
        }
        if (result?.success) {
            return <CheckCircle size={12} className="text-green-400" />;
        }
        if (result?.error) {
            return <XCircle size={12} className="text-red-400" />;
        }
        return <Terminal size={12} className="text-violet-400" />;
    };

    return (
        <div className="bg-black/20 rounded-lg border border-white/5 overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
            >
                <StatusIcon />
                <span className="text-xs font-medium text-zinc-300 flex-1 text-left truncate">
                    {call.function.name}
                </span>
                {isExpanded ? (
                    <ChevronDown size={12} className="text-zinc-500" />
                ) : (
                    <ChevronRight size={12} className="text-zinc-500" />
                )}
            </button>

            {/* Expanded content */}
            {isExpanded && (
                <div className="border-t border-white/5 p-3 space-y-3">
                    {/* Arguments */}
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                            Arguments
                        </p>
                        <pre className="text-xs text-zinc-400 bg-black/30 rounded p-2 overflow-x-auto font-mono">
                            {JSON.stringify(args, null, 2)}
                        </pre>
                    </div>

                    {/* Result */}
                    {result && (
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                                Result
                            </p>
                            <pre className={`text-xs rounded p-2 overflow-x-auto font-mono ${result.success
                                    ? 'text-green-400 bg-green-500/10'
                                    : 'text-red-400 bg-red-500/10'
                                }`}>
                                {result.success
                                    ? JSON.stringify(result.result, null, 2)
                                    : result.error
                                }
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * ToolCallDisplay component - displays multiple tool calls
 */
function ToolCallDisplay({ toolCalls, results = {}, executingTools = [] }) {
    if (!toolCalls || toolCalls.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Terminal size={12} />
                <span>Tool Calls ({toolCalls.length})</span>
            </div>

            <div className="space-y-2">
                {toolCalls.map((call, index) => (
                    <ToolCall
                        key={call.id || index}
                        call={call}
                        result={results[call.id]}
                        isExecuting={executingTools.includes(call.id)}
                    />
                ))}
            </div>
        </div>
    );
}

export default ToolCallDisplay;