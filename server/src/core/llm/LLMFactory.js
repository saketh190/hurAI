import { OpenAIProvider } from './OpenAIProvider.js';
import { GeminiProvider } from './GeminiProvider.js';
import { llmConfig } from '../../config/index.js';

/**
 * LLM Factory
 * Creates LLM provider instances by name
 */
export class LLMFactory {
    constructor() {
        // Registry of available providers
        this.providers = {
            openai: OpenAIProvider,
            gemini: GeminiProvider,
        };

        // Cache of initialized provider instances
        this.instances = new Map();
    }

    /**
     * Get a provider by name
     * Creates and caches instance if not exists
     * @param {string} name - Provider name
     * @param {Object} config - Optional config override
     * @returns {LLMProvider} Provider instance
     */
    getProvider(name, config = null) {
        const providerName = name.toLowerCase();

        if (!this.providers[providerName]) {
            throw new Error(`Unknown LLM provider: ${name}`);
        }

        // Return cached instance if available
        if (this.instances.has(providerName)) {
            return this.instances.get(providerName);
        }

        // Get config for this provider
        const providerConfig = config || llmConfig[providerName] || {};

        // Create new instance
        const ProviderClass = this.providers[providerName];
        const instance = new ProviderClass(providerConfig);

        // Cache it
        this.instances.set(providerName, instance);

        return instance;
    }

    /**
     * Register a new provider type
     * @param {string} name - Provider name
     * @param {Class} ProviderClass - Provider class
     */
    registerProvider(name, ProviderClass) {
        this.providers[name.toLowerCase()] = ProviderClass;
    }

    /**
     * Get list of available provider names
     * @returns {Array<string>}
     */
    getAvailableProviders() {
        return Object.keys(this.providers);
    }

    /**
     * Check if a provider is available
     * @param {string} name - Provider name
     * @returns {boolean}
     */
    hasProvider(name) {
        return !!this.providers[name.toLowerCase()];
    }

    /**
     * Clear cached instances
     */
    clearCache() {
        this.instances.clear();
    }
}

// Export singleton instance
let factoryInstance = null;

export function getLLMFactory() {
    if (!factoryInstance) {
        factoryInstance = new LLMFactory();
    }
    return factoryInstance;
}

export default LLMFactory;
