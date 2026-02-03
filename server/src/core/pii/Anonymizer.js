import { PIIDetector } from './PIIDetector.js';
import { TokenMapper } from './TokenMapper.js';
import { piiConfig } from '../../config/index.js';

/**
 * Anonymizer
 * Replaces PII in text with anonymization tokens
 */
export class Anonymizer {
    constructor(config = piiConfig) {
        this.config = config;
        this.detector = new PIIDetector(config);
    }

    /**
     * Anonymize all PII in text
     * @param {string} text - Text to anonymize
     * @param {TokenMapper} tokenMapper - Optional existing mapper to use
     * @returns {Object} { anonymizedText, tokenMapper, detectedItems }
     */
    anonymize(text, tokenMapper = null) {
        if (!text || typeof text !== 'string') {
            return {
                anonymizedText: text,
                tokenMapper: tokenMapper || new TokenMapper(),
                detectedItems: [],
            };
        }

        const mapper = tokenMapper || new TokenMapper();
        const detectedItems = this.detector.detect(text);

        if (detectedItems.length === 0) {
            return {
                anonymizedText: text,
                tokenMapper: mapper,
                detectedItems: [],
            };
        }

        // Process replacements from end to start to preserve positions
        let anonymizedText = text;
        const processedItems = [];

        // Sort by position descending
        const sortedItems = [...detectedItems].sort((a, b) => b.start - a.start);

        for (const item of sortedItems) {
            // Check if we already have a token for this value
            let token = mapper.getToken(item.value);

            if (!token) {
                // Generate new token
                token = mapper.generateToken(item.type);
                mapper.store(item.value, token, item.permanentlyMasked);
            }

            // Replace in text
            anonymizedText =
                anonymizedText.substring(0, item.start) +
                token +
                anonymizedText.substring(item.end);

            processedItems.push({
                ...item,
                token,
            });
        }

        return {
            anonymizedText,
            tokenMapper: mapper,
            detectedItems: processedItems.reverse(), // Return in original order
        };
    }

    /**
     * Create a fully masked version (for logs/display)
     * No token mapping, just replacement with generic masks
     * @param {string} text - Text to mask
     * @returns {string} Masked text
     */
    mask(text) {
        if (!text || typeof text !== 'string') {
            return text;
        }

        const detectedItems = this.detector.detect(text);
        let maskedText = text;

        // Sort by position descending
        const sortedItems = [...detectedItems].sort((a, b) => b.start - a.start);

        for (const item of sortedItems) {
            const mask = this.getMaskForType(item.type);
            maskedText =
                maskedText.substring(0, item.start) +
                mask +
                maskedText.substring(item.end);
        }

        return maskedText;
    }

    /**
     * Get mask string for a PII type
     * @param {string} type - PII type
     * @returns {string} Mask pattern
     */
    getMaskForType(type) {
        const masks = {
            'EMAIL': '[***@***.***]',
            'PHONE': '[***-***-****]',
            'CREDIT_CARD': '[**** **** **** ****]',
            'SSN': '[***-**-****]',
            'IP_ADDRESS': '[***.***.***.***]',
            'ADDRESS': '[ADDRESS REDACTED]',
            'ZIP_CODE': '[*****]',
            'DOB': '[**/**/****]',
        };
        return masks[type] || '[REDACTED]';
    }
}

export default Anonymizer;
