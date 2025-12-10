/**
 * MCPStatus Component
 * Shows MCP connection status and available tools
 */

import React, { useState } from 'react';
import { Wrench, ChevronDown, ChevronUp, Zap, Eye, EyeOff } from 'lucide-react';
import { useMCPTools } from '../hooks/useMCPTools';
import useStudioStore from '../../../context/StudioContext';

/**
 * Tool item in expanded view
 */
function ToolItem({ tool }) {
    return (
        <div className="flex items-start gap-2 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors">
            <Wrench size={12} className="text-violet-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-300 truncate">
                    {tool.originalName || tool.name}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">
                    {tool.description}
                </p>
                {tool._panelTitle && (
                    <p className="text-[10px] text-zinc-600">
                        from: {tool._panelTitle}
                    </p>
                )}
            </div>
        </div>
    );
}

/**
 * Panel observation toggle
 */
function ObservationToggle({ panel }) {
    const { setAIObserving } = useStudioStore();

    return (
        <button
            onClick={() => setAIObserving(panel.id, !panel.isAIObserving)}
            className={`
        flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-xs
        ${panel.isAIObserving
                    ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                    : 'hover:bg-white/5 text-zinc-400'
                }
      `}
        >
            {panel.isAIObserving ? (
                <Eye size={12} className="text-violet-400" />
            ) : (
                <EyeOff size={12} className="text-zinc-500" />
            )}
            <span className="truncate">{panel.title}</span>
        </button>
    );
}

/**
 * MCPStatus component
 */
function MCPStatus() {
    const [isExpanded, setIsExpanded] = useState(false);
    const { tools, toolCount, hasTools, getToolsByPanel } = useMCPTools();
    const { panels, getVisiblePanels } = useStudioStore();

    const visiblePanels = getVisiblePanels().filter(p => p.panelTypeId !== 'chat');
    const observedCount = panels.filter(p => p.isAIObserving).length;
    const toolsByPanel = getToolsByPanel();

    return (
        <div className="border-b border-white/5 bg-zinc-900/50">
            {/* Status bar */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {/* Connection status */}
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <div className={`w-1.5 h-1.5 rounded-full ${hasTools ? 'bg-green-500' : 'bg-zinc-600'}`} />
                        <span>{toolCount} Tools</span>
                    </div>

                    {/* Observation status */}
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Eye size={11} />
                        <span>{observedCount} Observed</span>
                    </div>
                </div>

                {/* Expand/collapse indicator */}
                <div className="flex items-center gap-2">
                    {hasTools && (
                        <div className="flex -space-x-1">
                            {tools.slice(0, 3).map((t, i) => (
                                <div
                                    key={i}
                                    className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[8px] text-zinc-500"
                                    title={t.originalName || t.name}
                                >
                                    <Zap size={10} />
                                </div>
                            ))}
                            {tools.length > 3 && (
                                <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[8px] text-zinc-500">
                                    +{tools.length - 3}
                                </div>
                            )}
                        </div>
                    )}
                    {isExpanded ? (
                        <ChevronUp size={14} className="text-zinc-500" />
                    ) : (
                        <ChevronDown size={14} className="text-zinc-500" />
                    )}
                </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
                <div className="px-4 pb-3 space-y-4 animate-fadeIn">
                    {/* Observation toggles */}
                    {visiblePanels.length > 0 && (
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                                AI Observation
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {visiblePanels.map(panel => (
                                    <ObservationToggle key={panel.id} panel={panel} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tools list */}
                    {hasTools && (
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                                Available Tools ({toolCount})
                            </p>
                            <div className="max-h-48 overflow-y-auto space-y-1 -mx-1">
                                {Object.values(toolsByPanel).map(group => (
                                    <div key={group.panelId}>
                                        <p className="text-[10px] text-zinc-600 px-3 py-1 sticky top-0 bg-zinc-900/90">
                                            {group.panelTitle}
                                        </p>
                                        {group.tools.map((tool, index) => (
                                            <ToolItem key={`${tool.name}-${index}`} tool={tool} />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!hasTools && visiblePanels.length === 0 && (
                        <p className="text-xs text-zinc-500 text-center py-4">
                            Add panels to enable tools and context
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default MCPStatus;