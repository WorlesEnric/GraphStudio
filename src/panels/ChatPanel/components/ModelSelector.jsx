/**
 * ModelSelector Component
 * Dropdown for selecting AI provider and model
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Cpu, Zap, Settings } from 'lucide-react';
import { PROVIDERS, getProvidersList, getDefaultModel } from '../services/providers';

/**
 * ModelSelector component
 */
function ModelSelector({
    provider,
    model,
    temperature,
    onProviderChange,
    onModelChange,
    onTemperatureChange,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('model'); // 'model' | 'settings'
    const dropdownRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const providers = getProvidersList();
    const currentProvider = PROVIDERS[provider] || PROVIDERS.openai;
    const currentModel = currentProvider.models.find(m => m.id === model) || currentProvider.models[0];

    const handleProviderSelect = (providerId) => {
        onProviderChange(providerId);
        // Auto-select default model for new provider
        const defaultModel = getDefaultModel(providerId);
        if (defaultModel) {
            onModelChange(defaultModel);
        }
    };

    return (
        <div ref={dropdownRef} className="relative">
            {/* Trigger button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-white/5 hover:bg-zinc-700/50 transition-colors text-xs"
            >
                <span className="text-zinc-300">{currentProvider.icon}</span>
                <span className="text-zinc-300 font-medium truncate max-w-[100px]">
                    {currentModel.name}
                </span>
                <ChevronDown size={12} className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-72 bg-zinc-900 rounded-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden z-50 animate-fadeIn">
                    {/* Tabs */}
                    <div className="flex border-b border-white/5">
                        <button
                            onClick={() => setActiveTab('model')}
                            className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'model'
                                    ? 'text-white bg-white/5'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-1.5">
                                <Cpu size={12} />
                                Model
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'settings'
                                    ? 'text-white bg-white/5'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-1.5">
                                <Settings size={12} />
                                Settings
                            </div>
                        </button>
                    </div>

                    {/* Model selection tab */}
                    {activeTab === 'model' && (
                        <div className="max-h-80 overflow-y-auto">
                            {providers.map((prov) => (
                                <div key={prov.id}>
                                    {/* Provider header */}
                                    <div className="px-3 py-2 bg-black/20 sticky top-0">
                                        <button
                                            onClick={() => handleProviderSelect(prov.id)}
                                            className={`flex items-center gap-2 w-full text-left ${provider === prov.id ? 'text-white' : 'text-zinc-400'
                                                }`}
                                        >
                                            <span>{prov.icon}</span>
                                            <span className="text-xs font-semibold">{prov.name}</span>
                                            {provider === prov.id && (
                                                <Check size={12} className="ml-auto text-violet-400" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Models for this provider */}
                                    {provider === prov.id && (
                                        <div className="py-1">
                                            {prov.models.map((m) => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => {
                                                        onModelChange(m.id);
                                                        setIsOpen(false);
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-white/5 transition-colors ${model === m.id ? 'bg-violet-500/10' : ''
                                                        }`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs font-medium truncate ${model === m.id ? 'text-violet-300' : 'text-zinc-300'
                                                            }`}>
                                                            {m.name}
                                                        </p>
                                                        <p className="text-[10px] text-zinc-500">
                                                            {(m.context / 1000).toFixed(0)}K context
                                                        </p>
                                                    </div>
                                                    {model === m.id && (
                                                        <Check size={12} className="text-violet-400 flex-shrink-0" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Settings tab */}
                    {activeTab === 'settings' && (
                        <div className="p-4 space-y-4">
                            {/* Temperature slider */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs text-zinc-400">Temperature</label>
                                    <span className="text-xs text-zinc-300 font-mono">
                                        {temperature.toFixed(1)}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.1"
                                    value={temperature}
                                    onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-violet-500"
                                />
                                <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                                    <span>Precise</span>
                                    <span>Creative</span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="text-[10px] text-zinc-500 bg-zinc-800/50 rounded-lg p-3 border border-white/5">
                                <p className="flex items-center gap-1.5 mb-1">
                                    <Zap size={10} className="text-yellow-500" />
                                    <span className="font-medium text-zinc-400">Tip</span>
                                </p>
                                <p>
                                    Lower temperature for factual responses, higher for creative tasks.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ModelSelector;