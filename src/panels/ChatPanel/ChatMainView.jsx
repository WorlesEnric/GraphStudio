/**
 * ChatMainView Component
 * Main chat interface combining all components
 */

import React, { useEffect, useState } from 'react';
import { RefreshCw, Trash2, MoreVertical, History, Download } from 'lucide-react';

import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import MCPStatus from './components/MCPStatus';
import ModelSelector from './components/ModelSelector';
import { useChat } from './hooks/useChat';
import { aiClient } from './services/aiClient';

/**
 * ChatMainView component
 */
function ChatMainView({ panelState, updateState, isFocused }) {
    // AI configuration
    const [config, setConfig] = useState(null);
    const [configError, setConfigError] = useState(null);

    // Initialize chat hook
    const {
        messages,
        isLoading,
        error,
        provider,
        model,
        temperature,
        sendMessage,
        clearMessages,
        stopGeneration,
        regenerateLastResponse,
        setModelConfig,
    } = useChat({ panelState, updateState });

    // Fetch initial configuration
    useEffect(() => {
        async function fetchConfig() {
            try {
                const cfg = await aiClient.getConfig();
                setConfig(cfg);

                // Set initial provider/model from config if not set
                if (!provider && cfg.provider) {
                    setModelConfig({ provider: cfg.provider, model: cfg.model });
                }
            } catch (err) {
                console.error('Failed to fetch AI config:', err);
                setConfigError(err.message);
            }
        }
        fetchConfig();
    }, []);

    // Menu state
    const [showMenu, setShowMenu] = useState(false);

    // Handle message send
    const handleSend = async (content, attachments) => {
        await sendMessage(content, attachments);
    };

    // Handle regenerate
    const handleRegenerate = async () => {
        await regenerateLastResponse();
    };

    // Handle clear
    const handleClear = () => {
        if (messages.length > 0) {
            if (window.confirm('Clear all messages?')) {
                clearMessages();
            }
        }
    };

    // Export conversation
    const handleExport = () => {
        const exportData = {
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
                timestamp: m.timestamp,
            })),
            exportedAt: new Date().toISOString(),
            model: model,
            provider: provider,
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full bg-zinc-900/30">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-zinc-900/50">
                {/* Model selector */}
                <ModelSelector
                    provider={provider || config?.provider || 'openai'}
                    model={model || config?.model || 'gpt-4o-mini'}
                    temperature={temperature}
                    onProviderChange={(p) => setModelConfig({ provider: p })}
                    onModelChange={(m) => setModelConfig({ model: m })}
                    onTemperatureChange={(t) => setModelConfig({ temperature: t })}
                />

                {/* Actions */}
                <div className="flex items-center gap-1">
                    {/* Regenerate button */}
                    {messages.length > 1 && !isLoading && (
                        <button
                            onClick={handleRegenerate}
                            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
                            title="Regenerate last response"
                        >
                            <RefreshCw size={14} />
                        </button>
                    )}

                    {/* Clear button */}
                    <button
                        onClick={handleClear}
                        disabled={messages.length === 0}
                        className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors disabled:opacity-50"
                        title="Clear conversation"
                    >
                        <Trash2 size={14} />
                    </button>

                    {/* More menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
                        >
                            <MoreVertical size={14} />
                        </button>

                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-800 rounded-lg border border-white/10 shadow-xl z-50 py-1">
                                    <button
                                        onClick={() => { handleExport(); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 transition-colors"
                                    >
                                        <Download size={12} />
                                        Export Conversation
                                    </button>
                                    <button
                                        onClick={() => setShowMenu(false)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 transition-colors"
                                    >
                                        <History size={12} />
                                        View History
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* MCP Status */}
            <MCPStatus />

            {/* Config error */}
            {configError && (
                <div className="mx-4 mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-xs text-yellow-300">
                        ⚠️ Could not connect to AI backend: {configError}
                    </p>
                    <p className="text-xs text-yellow-300/70 mt-1">
                        Make sure the backend server is running and accessible at {import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}.
                    </p>
                </div>
            )}

            {/* Messages */}
            <MessageList messages={messages} isLoading={isLoading} />

            {/* Error display */}
            {error && (
                <div className="mx-4 mb-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-300">{error}</p>
                </div>
            )}

            {/* Input */}
            <ChatInput
                onSend={handleSend}
                onStop={stopGeneration}
                isLoading={isLoading}
                disabled={!!configError}
                placeholder={configError ? 'Backend not connected...' : 'Type a message...'}
            />
        </div>
    );
}

export default ChatMainView;