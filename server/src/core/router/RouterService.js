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
        this.simpleComplexityMax = 5;       // Complexity <= 5: simpler query
        this.kbMinScore = 0.5;              // Minimum score to consider a KB match usable
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
     * - ANY query with KB results (score >= kbMinScore): LLM answers ONLY from KB
     * - ANY query with weak KB results (score < kbMinScore):
     *   - Simple (complexity <= 5): Tell user KB doesn't cover this, offer escalation
     *   - Complex (complexity > 5): Escalate to human agent
     *
     * The LLM must NEVER answer from its own training data.
     */
    makeDecision(classification, kbResults) {
        const { complexity, category, confidence } = classification;
        const hasKBMatch = kbResults.length > 0 && kbResults[0].score >= this.kbMinScore;
        const topScore = kbResults[0]?.score || 0;

        // KB match found — LLM must answer ONLY from KB
        if (hasKBMatch) {
            return {
                route: 'self-service',
                reason: 'KB match found — response grounded in knowledge base',
                confidence: Math.min(confidence, topScore),
                requiresKB: true,
                kbScore: topScore,
            };
        }

        // No KB match — simple query: tell user politely, offer escalation
        if (complexity <= this.simpleComplexityMax) {
            return {
                route: 'self-service',
                reason: 'No KB match — respond with honest limitation and offer escalation',
                confidence: confidence * 0.4,
                requiresKB: false,
                noKBMatch: true,
            };
        }

        // No KB match + complex: escalate to human agent
        return {
            route: 'agent',
            reason: 'Complex query with no KB match — requires human expertise',
            priority: 'high',
            suggestedCategory: category,
            complexity: complexity,
        };
    }

    /**
     * Generate a response when no KB match was found.
     * We do NOT let the LLM use its own knowledge — instead we tell the user
     * honestly that we don't have an answer in our KB and offer escalation.
     */
    async generateDirectResponse(query) {
        const message = [
            `**I couldn't find a specific answer in our knowledge base for your query.**`,
            ``,
            `This might mean:`,
            `- Your issue is unique and needs personalised assistance`,
            `- Our support articles don't yet cover this topic`,
            ``,
            `**What you can do:**`,
            `1. Try rephrasing your question with more specific keywords`,
            `2. Type **"talk to agent"** to connect with a human support representative who can help you directly`,
        ].join('\n');

        return {
            success: true,
            message,
            provider: 'static',
            responseType: 'no-kb-match',
            basedOnKB: false,
        };
    }

    /**
     * Generate a KB-grounded response.
     * The LLM is explicitly forbidden from using its own training knowledge.
     * It MUST quote or paraphrase ONLY the KB articles provided.
     */
    async generateKBAssistedResponse(query, kbResults) {
        const kbContext = kbResults
            .slice(0, 3)
            .map((r, i) => `[Article ${i + 1}]\n${r.content}`)
            .join('\n\n---\n\n');

        const prompt = `You are a support assistant. Answer the user's question using ONLY the KB articles below.

RULES:
1. Use ONLY the information from the KB articles provided. Do NOT use your own training knowledge.
2. The KB articles below have already been matched to the user's query by our search system. Treat them as relevant — even if the article title describes a slightly different scenario, the troubleshooting steps still apply. Use them.
3. Present the solution steps from the KB articles. You may rephrase for clarity but do NOT invent new steps.
4. NEVER say "our KB doesn't cover this" or "no article matches" when KB articles ARE provided below. The search already matched them.

KB ARTICLES:
${kbContext}

USER QUESTION: ${query}

Format your response as:

**Understanding your issue:**
[Brief summary of user's problem]

**Steps to resolve:**
1. [Step from KB]
2. [Step from KB]
3. [Continue from KB]

**If this doesn't help:**
Type "talk to agent" to connect with a human support representative.`;

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
