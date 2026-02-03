import { getLLMService } from '../llm/index.js';
import { kbConfig } from '../../config/index.js';

/**
 * Classifier Service
 * Uses LLM to classify tickets by complexity and category
 */
export class ClassifierService {
    constructor() {
        this.llmService = null;
        this.categories = kbConfig.categories;
    }

    async initialize() {
        this.llmService = getLLMService();
        if (!this.llmService.isInitialized) {
            await this.llmService.initialize();
        }
    }

    /**
     * Classify a ticket/query
     * @param {string} text - The ticket text to classify
     * @returns {Object} { complexity, category, confidence }
     */
    async classify(text) {
        if (!this.llmService) {
            await this.initialize();
        }

        const prompt = `Analyze this support ticket and respond with ONLY a JSON object (no markdown):

Ticket: "${text}"

Return JSON with:
- complexity: number 1-10 (1=very simple, 10=very complex)
- category: one of [${this.categories.join(', ')}]
- confidence: number 0-1

Example response:
{"complexity": 3, "category": "technical", "confidence": 0.9}`;

        try {
            const response = await this.llmService.generateResponse(prompt, {
                systemPrompt: 'You are a ticket classifier. Respond ONLY with valid JSON, no other text.',
            });

            if (!response.success) {
                return this.getDefaultClassification();
            }

            // Parse JSON from response
            const jsonMatch = response.message.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                return {
                    complexity: Math.min(10, Math.max(1, result.complexity || 5)),
                    category: this.categories.includes(result.category) ? result.category : 'general',
                    confidence: Math.min(1, Math.max(0, result.confidence || 0.5)),
                };
            }

            return this.getDefaultClassification();
        } catch (error) {
            console.error('[Classifier] Error:', error.message);
            return this.getDefaultClassification();
        }
    }

    /**
     * Get complexity score only
     */
    async getComplexity(text) {
        const result = await this.classify(text);
        return result.complexity;
    }

    /**
     * Get category only
     */
    async getCategory(text) {
        const result = await this.classify(text);
        return result.category;
    }

    /**
     * Default classification when LLM fails
     */
    getDefaultClassification() {
        return {
            complexity: 5,
            category: 'general',
            confidence: 0,
        };
    }

    /**
     * Check if ticket is simple (can be self-serviced)
     */
    isSimple(complexity) {
        return complexity <= 4;
    }

    /**
     * Check if ticket is complex (needs agent)
     */
    isComplex(complexity) {
        return complexity >= 7;
    }
}

// Singleton instance
let classifierInstance = null;

export function getClassifier() {
    if (!classifierInstance) {
        classifierInstance = new ClassifierService();
    }
    return classifierInstance;
}

export default ClassifierService;
