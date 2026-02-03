import { PIIDetector } from './PIIDetector.js';
import { Anonymizer } from './Anonymizer.js';
import { TokenMapper } from './TokenMapper.js';
import { piiConfig } from '../../config/index.js';

/**
 * PII Service
 * Main service for PII detection, anonymization, and restoration
 */
export class PIIService {
    constructor(config = piiConfig) {
        this.config = config;
        this.detector = new PIIDetector(config);
        this.anonymizer = new Anonymizer(config);
    }

    /**
     * Anonymize text for LLM processing
     * Returns anonymized text and mapping for later restoration
     * @param {string} text - Text to anonymize
     * @returns {Object} { anonymizedText, tokenMap, summary }
     */
    anonymizeForLLM(text) {
        const { anonymizedText, tokenMapper, detectedItems } = this.anonymizer.anonymize(text);

        return {
            anonymizedText,
            tokenMap: tokenMapper.export(),
            summary: this.createSummary(detectedItems),
            originalLength: text?.length || 0,
            anonymizedLength: anonymizedText?.length || 0,
        };
    }

    /**
     * Restore PII for agent view
     * Restores all PII EXCEPT permanently masked items (credit cards, SSN)
     * @param {string} text - Anonymized text
     * @param {Object} tokenMapData - Exported token map data
     * @returns {Object} { restoredText, permanentlyMasked }
     */
    restoreForAgent(text, tokenMapData) {
        if (!text || !tokenMapData) {
            return {
                restoredText: text,
                permanentlyMasked: [],
            };
        }

        const mapper = new TokenMapper();
        mapper.import(tokenMapData);

        let restoredText = text;
        const permanentlyMasked = [];

        // Find all tokens in the text
        const tokenPattern = /\[([A-Z_]+)_(\d+)\]/g;
        let match;
        const replacements = [];

        while ((match = tokenPattern.exec(text)) !== null) {
            const token = match[0];
            const original = mapper.getOriginal(token, false); // Don't allow permanent

            if (original) {
                replacements.push({
                    token,
                    original,
                    start: match.index,
                    end: match.index + token.length,
                });
            } else if (mapper.isPermanent(token)) {
                permanentlyMasked.push(token);
            }
        }

        // Replace from end to start
        replacements.sort((a, b) => b.start - a.start);
        for (const r of replacements) {
            restoredText =
                restoredText.substring(0, r.start) +
                r.original +
                restoredText.substring(r.end);
        }

        return {
            restoredText,
            permanentlyMasked,
        };
    }

    /**
     * Create fully masked version for logs/display
     * @param {string} text - Text to mask
     * @returns {string} Masked text
     */
    maskForDisplay(text) {
        return this.anonymizer.mask(text);
    }

    /**
     * Check if text contains any PII
     * @param {string} text - Text to check
     * @returns {boolean}
     */
    containsPII(text) {
        return this.detector.containsPII(text);
    }

    /**
     * Get detailed PII detection results
     * @param {string} text - Text to analyze
     * @returns {Array} Detected PII items
     */
    detect(text) {
        return this.detector.detect(text);
    }

    /**
     * Create summary of detected items
     * @param {Array} detectedItems - Items from detection
     * @returns {Object} Summary
     */
    createSummary(detectedItems) {
        const summary = {
            totalCount: detectedItems.length,
            byType: {},
            hasPermanentlyMasked: false,
        };

        for (const item of detectedItems) {
            summary.byType[item.type] = (summary.byType[item.type] || 0) + 1;
            if (item.permanentlyMasked) {
                summary.hasPermanentlyMasked = true;
            }
        }

        return summary;
    }

    /**
     * Process a full message: anonymize for LLM, get response, restore for agent
     * This is a convenience method showing the full flow
     * @param {string} userMessage - Original user message
     * @param {Function} llmCallback - Async function that takes anonymized text and returns LLM response
     * @returns {Object} { forLLM, llmResponse, forAgent }
     */
    async processMessage(userMessage, llmCallback) {
        // Step 1: Anonymize for LLM
        const forLLM = this.anonymizeForLLM(userMessage);

        // Step 2: Get LLM response (using anonymized text)
        const llmResponse = await llmCallback(forLLM.anonymizedText);

        // Step 3: Restore for agent view
        const forAgent = this.restoreForAgent(userMessage, forLLM.tokenMap);

        return {
            original: userMessage,
            forLLM,
            llmResponse,
            forAgent,
        };
    }
}

// Export singleton instance
let piiServiceInstance = null;

export function getPIIService(config = piiConfig) {
    if (!piiServiceInstance) {
        piiServiceInstance = new PIIService(config);
    }
    return piiServiceInstance;
}

export default PIIService;
