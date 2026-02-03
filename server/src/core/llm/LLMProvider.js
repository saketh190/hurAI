/**
 * LLM Provider Base Class
 * Abstract base class for all LLM providers
 */
export class LLMProvider {
    constructor(name, config = {}) {
        if (this.constructor === LLMProvider) {
            throw new Error('LLMProvider is abstract and cannot be instantiated directly');
        }
        this.name = name;
        this.config = config;
        this.isInitialized = false;
    }

    /**
     * Initialize the provider
     * Must be implemented by subclasses
     */
    async initialize() {
        throw new Error('initialize() must be implemented by subclass');
    }

    /**
     * Generate a response from the LLM
     * @param {string} prompt - The user prompt
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Response object
     */
    async generateResponse(prompt, options = {}) {
        throw new Error('generateResponse() must be implemented by subclass');
    }

    /**
     * Check if the provider is healthy/available
     * @returns {Promise<boolean>}
     */
    async healthCheck() {
        throw new Error('healthCheck() must be implemented by subclass');
    }

    /**
     * Get the provider name
     * @returns {string}
     */
    getName() {
        return this.name;
    }

    /**
     * Check initialization status
     * @returns {boolean}
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * Build system prompt for helpdesk context
     * @param {Object} context - Additional context
     * @returns {string}
     */
    buildSystemPrompt(context = {}) {
        return `You are hurAI, a concise support assistant. Give short, direct answers. ${context.additionalInstructions || ''}`;
    }
}

export default LLMProvider;
