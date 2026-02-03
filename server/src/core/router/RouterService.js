import { getClassifier } from '../classifier/index.js';
import { getKBService } from '../kb/index.js';
import { getLLMService } from '../llm/index.js';
import { getPIIService } from '../pii/index.js';

/**
 * Router Service
 * Routes queries to self-service or agent based on complexity and KB matches
 */
export class RouterService {
    constructor() {
        this.classifier = null;
        this.kbService = null;
        this.llmService = null;
        this.piiService = null;

        // Thresholds
        this.simpleComplexityMax = 5;       // Complexity <= 6: LLM answers directly
        this.kbMinScore = 0.7;              // Minimum KB match score for complex queries
        this.kbMinMatches = 1;              // Minimum KB matches needed
    }

    async initialize() {
        this.classifier = getClassifier();
        this.kbService = getKBService();
        this.llmService = getLLMService();
        this.piiService = getPIIService();
    }

    /**
     * Escalation keywords that trigger immediate human agent routing
     */
    escalationKeywords = [
        'talk to agent', 'speak to human', 'human agent', 'real person',
        'escalate', 'supervisor', 'manager', 'not helpful',
        "doesn't work", 'still not working', 'frustrated', 'angry',
        'useless', 'terrible', 'worst', 'hate', 'stupid', 'ridiculous'
    ];

    /**
     * Check if query contains escalation triggers
     */
    checkForEscalationKeywords(query) {
        const lowerQuery = query.toLowerCase();
        for (const keyword of this.escalationKeywords) {
            if (lowerQuery.includes(keyword)) {
                return {
                    triggered: true,
                    keyword: keyword,
                    reason: keyword.includes('frustrated') || keyword.includes('angry')
                        ? 'User frustration detected'
                        : 'User requested human agent'
                };
            }
        }
        return { triggered: false };
    }

    /**
     * Route a user query
     * @param {string} query - The user's query
     * @returns {Object} Routing decision with response or escalation
     */
    async route(query) {
        if (!this.classifier) {
            await this.initialize();
        }

        console.log(`[Router] Processing query: "${query.substring(0, 50)}..."`);

        // Step 0: Check for immediate escalation keywords FIRST
        const escalationCheck = this.checkForEscalationKeywords(query);
        if (escalationCheck.triggered) {
            console.log(`[Router] Escalation keyword detected: "${escalationCheck.keyword}"`);

            // Still anonymize PII for logging
            const anonymized = this.piiService.anonymizeForLLM(query);

            return {
                query: query,
                anonymizedQuery: anonymized.anonymizedText,
                piiDetected: anonymized.summary,
                classification: { complexity: 10, category: 'general', confidence: 1 },
                kbMatches: [],
                decision: {
                    route: 'agent',
                    reason: escalationCheck.reason,
                    priority: 'high',
                    trigger: 'keyword',
                    keyword: escalationCheck.keyword,
                },
                response: null,
            };
        }

        // Step 1: Anonymize PII for processing
        const anonymized = this.piiService.anonymizeForLLM(query);
        const safeQuery = anonymized.anonymizedText;

        // Step 2: Classify the query
        const classification = await this.classifier.classify(safeQuery);
        console.log(`[Router] Classification: complexity=${classification.complexity}, category=${classification.category}`);

        // Step 3: Search KB for relevant content
        const kbResults = await this.kbService.search(safeQuery, 3);
        const topMatch = kbResults[0] || null;
        console.log(`[Router] KB matches: ${kbResults.length}, top score: ${topMatch?.score?.toFixed(3) || 'N/A'}`);

        // Step 4: Make routing decision
        const decision = this.makeDecision(classification, kbResults);
        console.log(`[Router] Decision: ${decision.route}`);

        // Step 5: Generate response if self-service
        let response = null;
        if (decision.route === 'self-service') {
            if (decision.requiresKB) {
                // Complex query: LLM uses KB knowledge
                response = await this.generateKBAssistedResponse(safeQuery, kbResults);
            } else {
                // Simple query: LLM answers directly
                response = await this.generateDirectResponse(safeQuery);
            }
        }

        return {
            query: query,
            anonymizedQuery: safeQuery,
            piiDetected: anonymized.summary,
            classification,
            kbMatches: kbResults.map(r => ({
                id: r.id,
                score: r.score,
                preview: r.content?.substring(0, 150) + '...',
            })),
            decision,
            response,
        };
    }

    /**
     * Make routing decision based on classification and KB matches
     * 
     * Logic:
     * - Simple queries (complexity <= 5): 
     *   - If good KB match: LLM uses KB knowledge
     *   - If no KB match: LLM answers directly (can still handle simple issues)
     * - Complex queries (complexity > 5): 
     *   - If good KB match: LLM uses KB knowledge
     *   - If no KB match: Escalate to human agent (too complex for LLM alone)
     */
    makeDecision(classification, kbResults) {
        const { complexity, category, confidence } = classification;
        const hasGoodKBMatch = kbResults.some(r => r.score >= this.kbMinScore);
        const topScore = kbResults[0]?.score || 0;

        // Check if we have a good KB match (applies to both simple and complex)
        if (hasGoodKBMatch) {
            return {
                route: 'self-service',
                reason: `${complexity <= this.simpleComplexityMax ? 'Simple' : 'Complex'} query with KB match - LLM will use knowledge base`,
                confidence: Math.min(confidence, topScore),
                requiresKB: true,
                kbScore: topScore,
            };
        }

        // No KB match - behavior differs based on complexity
        if (complexity <= this.simpleComplexityMax) {
            // Simple query without KB match: LLM can still handle it directly
            return {
                route: 'self-service',
                reason: 'Simple query without KB match - LLM can handle directly',
                confidence: confidence,
                requiresKB: false,
            };
        }

        // Complex query with NO KB match: Escalate to human agent
        return {
            route: 'agent',
            reason: 'Complex query with no KB match - requires human expertise',
            priority: 'high',
            suggestedCategory: category,
            complexity: complexity,
        };
    }

    /**
     * Generate direct response for simple queries (no KB needed)
     * Returns structured, step-by-step guidance
     */
    async generateDirectResponse(query) {
        const prompt = `You are a helpful support assistant. Provide a structured, step-by-step response to help the user.

User Question: ${query}

Respond in this EXACT format:

**Understanding your issue:**
[1-2 sentence summary of what the user is asking]

**Steps to resolve:**
1. [First step with clear action]
2. [Second step if needed]
3. [Additional steps as needed]

**If this doesn't help:**
You can type "talk to agent" to connect with a human support representative.

Rules:
- Keep steps clear and actionable
- Use numbered lists, not bullets
- Maximum 5 steps for simple issues
- If unsure, acknowledge and offer escalation`;

        try {
            const result = await this.llmService.generateResponse(prompt);

            return {
                success: result.success,
                message: result.message,
                provider: result.provider,
                responseType: 'guided-steps',
                basedOnKB: false,
            };
        } catch (error) {
            console.error('[Router] Direct response error:', error.message);
            return {
                success: false,
                message: 'Unable to generate response. Please contact support.',
                error: error.message,
            };
        }
    }

    /**
     * Generate KB-assisted response for complex queries
     * Uses knowledge base content from previously solved issues
     * Returns structured, step-by-step guidance based on KB
     */
    async generateKBAssistedResponse(query, kbResults) {
        const kbContext = kbResults
            .slice(0, 3)
            .map(r => r.content)
            .join('\n\n---\n\n');

        const prompt = `You are a helpful support assistant. Use the knowledge base content to provide a structured, step-by-step response.

Knowledge Base Content (from previously resolved issues):
${kbContext}

User Question: ${query}

Respond in this EXACT format:

**Understanding your issue:**
[1-2 sentence summary based on matching KB content]

**Steps to resolve (based on our knowledge base):**
1. [First step with clear action from KB]
2. [Second step if needed]
3. [Additional steps as needed]

**Additional notes:**
[Any relevant warnings or tips from the KB content]

**If this doesn't help:**
You can type "talk to agent" to connect with a human support representative.

Rules:
- Base your response ONLY on the KB content provided
- Use numbered steps, not bullets
- If KB doesn't fully cover the issue, acknowledge what you can help with
- Always offer escalation option at the end`;

        try {
            const result = await this.llmService.generateResponse(prompt);

            return {
                success: result.success,
                message: result.message,
                provider: result.provider,
                responseType: 'guided-steps-kb',
                basedOnKB: true,
            };
        } catch (error) {
            console.error('[Router] KB-assisted response error:', error.message);
            return {
                success: false,
                message: 'Unable to generate response. Please contact support.',
                error: error.message,
            };
        }
    }
}

// Singleton
let routerInstance = null;

export function getRouter() {
    if (!routerInstance) {
        routerInstance = new RouterService();
    }
    return routerInstance;
}

export default RouterService;
