import { PIIPatterns, getAllPatterns } from './PIIPatterns.js';
import { piiConfig } from '../../config/index.js';

/**
 * PII Detector
 * Scans text for personal information and returns detected items
 */
export class PIIDetector {
    constructor(config = piiConfig) {
        this.config = config;
        this.patterns = getAllPatterns();
    }

    /**
     * Detect all PII in the given text
     * @param {string} text - Text to scan
     * @returns {Array} Array of detected PII items
     */
    detect(text) {
        if (!text || typeof text !== 'string') {
            return [];
        }

        const detectedItems = [];

        for (const patternConfig of this.patterns) {
            // Skip if this type is disabled in config
            const typeKey = this.getConfigKey(patternConfig.type);
            if (typeKey && this.config.types[typeKey] === false) {
                continue;
            }

            // Reset regex lastIndex for global patterns
            const regex = new RegExp(patternConfig.pattern.source, patternConfig.pattern.flags);

            let match;
            while ((match = regex.exec(text)) !== null) {
                // Avoid duplicate detections at the same position
                const isDuplicate = detectedItems.some(
                    item => item.start === match.index && item.value === match[0]
                );

                if (!isDuplicate) {
                    detectedItems.push({
                        type: patternConfig.type,
                        value: match[0],
                        start: match.index,
                        end: match.index + match[0].length,
                        permanentlyMasked: patternConfig.permanentlyMasked || false,
                    });
                }
            }
        }

        // Sort by position in text
        detectedItems.sort((a, b) => a.start - b.start);

        if (this.config.enableLogging) {
            console.log(`[PIIDetector] Found ${detectedItems.length} PII items`);
        }

        return detectedItems;
    }

    /**
     * Map pattern type to config key
     */
    getConfigKey(type) {
        const mapping = {
            'EMAIL': 'email',
            'PHONE': 'phone',
            'CREDIT_CARD': 'creditCard',
            'SSN': 'ssn',
            'IP_ADDRESS': 'ipAddress',
            'ADDRESS': 'address',
            'ZIP_CODE': 'address',
            'DOB': 'name',
        };
        return mapping[type];
    }

    /**
     * Check if text contains any PII
     * @param {string} text - Text to check
     * @returns {boolean}
     */
    containsPII(text) {
        return this.detect(text).length > 0;
    }

    /**
     * Get summary of PII types found
     * @param {string} text - Text to scan
     * @returns {Object} Summary by type
     */
    getSummary(text) {
        const detected = this.detect(text);
        const summary = {};

        for (const item of detected) {
            summary[item.type] = (summary[item.type] || 0) + 1;
        }

        return summary;
    }
}

export default PIIDetector;
