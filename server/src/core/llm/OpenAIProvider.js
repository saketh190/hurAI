import OpenAI from 'openai';
import { LLMProvider } from './LLMProvider.js';
import { llmConfig } from '../../config/index.js';

/**
 * OpenAI Provider
 * Implementation for OpenAI GPT models
 */
export class OpenAIProvider extends LLMProvider {
    constructor(config = llmConfig.openai) {
        super('openai', config);
        this.client = null;
    }

    /**
     * Initialize the OpenAI client
     */
    async initialize() {
        if (!this.config.apiKey) {
            throw new Error('OpenAI API key is required');
        }

        this.client = new OpenAI({
            apiKey: this.config.apiKey,
        });

        this.isInitialized = true;
        console.log('[OpenAIProvider] Initialized successfully');
        return true;
    }

    /**
     * Generate a response using OpenAI
     * @param {string} prompt - User prompt
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Response
     */
    async generateResponse(prompt, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const systemPrompt = options.systemPrompt || this.buildSystemPrompt(options.context);
        const model = options.model || this.config.model;
        const maxTokens = options.maxTokens || this.config.maxTokens;
        const temperature = options.temperature ?? this.config.temperature;

        try {
            const startTime = Date.now();

            const response = await this.client.chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
                max_tokens: maxTokens,
                temperature,
            });

            const endTime = Date.now();
            const message = response.choices[0]?.message?.content || '';

            return {
                success: true,
                provider: this.name,
                model,
                message,
                usage: {
                    promptTokens: response.usage?.prompt_tokens || 0,
                    completionTokens: response.usage?.completion_tokens || 0,
                    totalTokens: response.usage?.total_tokens || 0,
                },
                latencyMs: endTime - startTime,
            };
        } catch (error) {
            console.error('[OpenAIProvider] Error:', error.message);
            return {
                success: false,
                provider: this.name,
                error: error.message,
                errorCode: error.code || 'UNKNOWN',
            };
        }
    }

    /**
     * Health check for OpenAI
     * @returns {Promise<boolean>}
     */
    async healthCheck() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            // Simple test call
            const response = await this.client.chat.completions.create({
                model: this.config.model,
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 5,
            });

            return !!response.choices[0];
        } catch (error) {
            console.error('[OpenAIProvider] Health check failed:', error.message);
            return false;
        }
    }
}

export default OpenAIProvider;
