/**
 * AI Provider Configurations
 * Defines available providers and their models
 */

export const PROVIDERS = {
    openai: {
        id: 'openai',
        name: 'OpenAI',
        icon: '🤖',
        models: [
            { id: 'gpt-4o', name: 'GPT-4o', context: 128000, default: true },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', context: 128000 },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', context: 128000 },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', context: 16385 },
        ],
    },
    deepseek: {
        id: 'deepseek',
        name: 'DeepSeek',
        icon: '🔍',
        models: [
            { id: 'deepseek-chat', name: 'DeepSeek Chat', context: 64000, default: true },
            { id: 'deepseek-coder', name: 'DeepSeek Coder', context: 64000 },
        ],
    },
    siliconflow: {
        id: 'siliconflow',
        name: 'SiliconFlow',
        icon: '🌊',
        models: [
            { id: 'MiniMaxAI/MiniMax-M2', name: 'MiniMax M2', context: 128000, default: true },
            { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B', context: 32000 },
            { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', context: 64000 },
        ],
    },
    anthropic: {
        id: 'anthropic',
        name: 'Anthropic',
        icon: '🔶',
        models: [
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', context: 200000, default: true },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', context: 200000 },
            { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', context: 200000 },
        ],
    },
};

/**
 * Get default model for a provider
 * @param {string} providerId 
 * @returns {string}
 */
export function getDefaultModel(providerId) {
    const provider = PROVIDERS[providerId];
    if (!provider) return null;

    const defaultModel = provider.models.find(m => m.default);
    return defaultModel?.id || provider.models[0]?.id;
}

/**
 * Get model info
 * @param {string} providerId 
 * @param {string} modelId 
 * @returns {object|null}
 */
export function getModelInfo(providerId, modelId) {
    const provider = PROVIDERS[providerId];
    if (!provider) return null;

    return provider.models.find(m => m.id === modelId);
}

/**
 * Get all providers as array
 * @returns {Array}
 */
export function getProvidersList() {
    return Object.values(PROVIDERS);
}

export default PROVIDERS;