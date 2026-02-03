import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider } from './LLMProvider.js';
import { llmConfig } from '../../config/index.js';

/**
 * Gemini Provider
 * Implementation for Google Gemini models
 */
export class GeminiProvider extends LLMProvider {
    constructor(config = llmConfig.gemini) {
        super('gemini', config);
        this.client = null;
        this.model = null;
    }

    /**
     * Initialize the Gemini client
     */
    async initialize() {
        if (!this.config.apiKey) {
            throw new Error('Google API key is required');
        }

        // Use v1beta API for more model support
        this.client = new GoogleGenerativeAI(this.config.apiKey);
        this.model = this.client.getGenerativeModel({
            model: this.config.model,
        }, { apiVersion: 'v1beta' });

        this.isInitialized = true;
        console.log(`[GeminiProvider] Initialized with model: ${this.config.model}`);
        return true;
    }

    /**
     * Generate a response using Gemini
     * @param {string} prompt - User prompt
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Response
     */
    async generateResponse(prompt, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const systemPrompt = options.systemPrompt || this.buildSystemPrompt(options.context);
        const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}`;

        try {
            const startTime = Date.now();

            const result = await this.model.generateContent(fullPrompt);
            const response = await result.response;
            const message = response.text();

            const endTime = Date.now();

            return {
                success: true,
                provider: this.name,
                model: this.config.model,
                message,
                usage: {
                    // Gemini doesn't provide token counts the same way
                    totalTokens: 0,
                },
                latencyMs: endTime - startTime,
            };
        } catch (error) {
            console.error('[GeminiProvider] Error:', error.message);
            return {
                success: false,
                provider: this.name,
                error: error.message,
                errorCode: error.code || 'UNKNOWN',
            };
        }
    }

    /**
     * Health check for Gemini
     * @returns {Promise<boolean>}
     */
    async healthCheck() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            // Simple test call
            const result = await this.model.generateContent('Hello');
            const response = await result.response;
            return !!response.text();
        } catch (error) {
            console.error('[GeminiProvider] Health check failed:', error.message);
            return false;
        }
    }
}

export default GeminiProvider;
