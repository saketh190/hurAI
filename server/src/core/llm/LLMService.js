import { getLLMFactory } from './LLMFactory.js';
import { llmConfig } from '../../config/index.js';

/**
 * LLM Service
 * Main service for LLM operations with automatic fallback
 */
export class LLMService {
    constructor(config = llmConfig) {
        this.config = config;
        this.factory = getLLMFactory();
        this.primaryProvider = null;
        this.fallbackProvider = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the service with primary and fallback providers
     */
    async initialize() {
        console.log('[LLMService] Initializing...');
        console.log(`[LLMService] Primary: ${this.config.primaryProvider}, Fallback: ${this.config.fallbackProvider}`);

        try {
            // Get primary provider
            this.primaryProvider = this.factory.getProvider(this.config.primaryProvider);
            await this.primaryProvider.initialize();
            console.log(`[LLMService] Primary provider (${this.config.primaryProvider}) initialized`);
        } catch (error) {
            console.warn(`[LLMService] Failed to initialize primary provider: ${error.message}`);
        }

        try {
            // Get fallback provider
            if (this.config.fallbackProvider && this.config.fallbackProvider !== this.config.primaryProvider) {
                this.fallbackProvider = this.factory.getProvider(this.config.fallbackProvider);
                await this.fallbackProvider.initialize();
                console.log(`[LLMService] Fallback provider (${this.config.fallbackProvider}) initialized`);
            }
        } catch (error) {
            console.warn(`[LLMService] Failed to initialize fallback provider: ${error.message}`);
        }

        this.isInitialized = true;
        return true;
    }

    /**
     * Generate a response with automatic fallback
     * @param {string} prompt - User prompt
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Response
     */
    async generateResponse(prompt, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        // Try primary provider first
        if (this.primaryProvider) {
            const response = await this.tryWithRetry(this.primaryProvider, prompt, options);
            if (response.success) {
                return response;
            }
            console.warn(`[LLMService] Primary provider failed: ${response.error}`);
        }

        // Fallback to secondary provider
        if (this.fallbackProvider) {
            console.log('[LLMService] Attempting fallback provider...');
            const response = await this.tryWithRetry(this.fallbackProvider, prompt, options);
            if (response.success) {
                response.usedFallback = true;
                return response;
            }
            console.error(`[LLMService] Fallback provider also failed: ${response.error}`);
        }

        // Both failed
        return {
            success: false,
            error: 'All LLM providers failed',
            message: 'I apologize, but I am unable to process your request at this time. Please try again later or contact support.',
        };
    }

    /**
     * Try a provider with retry logic
     * @param {LLMProvider} provider - Provider to try
     * @param {string} prompt - User prompt
     * @param {Object} options - Options
     * @returns {Promise<Object>} Response
     */
    async tryWithRetry(provider, prompt, options) {
        const maxAttempts = this.config.retry?.maxAttempts || 2;
        const delayMs = this.config.retry?.delayMs || 1000;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const response = await provider.generateResponse(prompt, options);

            if (response.success) {
                return response;
            }

            if (attempt < maxAttempts) {
                console.log(`[LLMService] Retry ${attempt}/${maxAttempts} for ${provider.getName()}`);
                await this.delay(delayMs * attempt); // Exponential backoff
            }
        }

        return {
            success: false,
            error: `Provider ${provider.getName()} failed after ${maxAttempts} attempts`,
        };
    }

    /**
     * Simple delay helper
     * @param {number} ms - Milliseconds to wait
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get health status of all providers
     * @returns {Promise<Object>} Health status
     */
    async getHealthStatus() {
        const status = {
            primary: {
                name: this.config.primaryProvider,
                healthy: false,
            },
            fallback: {
                name: this.config.fallbackProvider,
                healthy: false,
            },
        };

        if (this.primaryProvider) {
            status.primary.healthy = await this.primaryProvider.healthCheck();
        }

        if (this.fallbackProvider) {
            status.fallback.healthy = await this.fallbackProvider.healthCheck();
        }

        status.anyAvailable = status.primary.healthy || status.fallback.healthy;

        return status;
    }

    /**
     * Get current configuration
     * @returns {Object}
     */
    getConfig() {
        return {
            primaryProvider: this.config.primaryProvider,
            fallbackProvider: this.config.fallbackProvider,
            retry: this.config.retry,
        };
    }
}

// Export singleton instance
let llmServiceInstance = null;

export function getLLMService(config = llmConfig) {
    if (!llmServiceInstance) {
        llmServiceInstance = new LLMService(config);
    }
    return llmServiceInstance;
}

export default LLMService;
