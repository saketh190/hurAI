/**
 * Token Mapper
 * Stores and manages mappings between original PII values and anonymization tokens
 */
export class TokenMapper {
    constructor() {
        // Map of token -> original value
        this.tokenToOriginal = new Map();
        // Map of original value -> token
        this.originalToToken = new Map();
        // Counter for generating unique tokens per type
        this.counters = {};
        // Track permanently masked tokens (non-restorable)
        this.permanentTokens = new Set();
    }

    /**
     * Generate a new token for a PII type
     * @param {string} type - PII type (e.g., 'EMAIL', 'PHONE')
     * @returns {string} Generated token
     */
    generateToken(type) {
        this.counters[type] = (this.counters[type] || 0) + 1;
        return `[${type}_${this.counters[type]}]`;
    }

    /**
     * Store a mapping between original value and token
     * @param {string} original - Original PII value
     * @param {string} token - Anonymization token
     * @param {boolean} permanent - If true, this cannot be restored
     */
    store(original, token, permanent = false) {
        this.tokenToOriginal.set(token, original);
        this.originalToToken.set(original, token);

        if (permanent) {
            this.permanentTokens.add(token);
        }
    }

    /**
     * Get the original value for a token
     * @param {string} token - Anonymization token
     * @param {boolean} allowPermanent - If false, won't return permanently masked values
     * @returns {string|null} Original value or null
     */
    getOriginal(token, allowPermanent = false) {
        if (!allowPermanent && this.permanentTokens.has(token)) {
            return null; // Don't restore permanently masked values
        }
        return this.tokenToOriginal.get(token) || null;
    }

    /**
     * Get the token for an original value
     * @param {string} original - Original PII value
     * @returns {string|null} Token or null
     */
    getToken(original) {
        return this.originalToToken.get(original) || null;
    }

    /**
     * Check if a token is permanently masked
     * @param {string} token - Token to check
     * @returns {boolean}
     */
    isPermanent(token) {
        return this.permanentTokens.has(token);
    }

    /**
     * Get all mappings (for debugging or agent view)
     * @param {boolean} includePermament - Include permanently masked items
     * @returns {Object} All mappings
     */
    getAllMappings(includePermanent = false) {
        const mappings = {};

        for (const [token, original] of this.tokenToOriginal) {
            if (includePermanent || !this.permanentTokens.has(token)) {
                mappings[token] = original;
            } else {
                mappings[token] = '[PERMANENTLY MASKED]';
            }
        }

        return mappings;
    }

    /**
     * Export mappings for storage/transmission
     * @returns {Object} Serializable mapping data
     */
    export() {
        return {
            mappings: Object.fromEntries(this.tokenToOriginal),
            permanent: Array.from(this.permanentTokens),
            counters: { ...this.counters },
        };
    }

    /**
     * Import mappings from stored data
     * @param {Object} data - Previously exported data
     */
    import(data) {
        if (data.mappings) {
            for (const [token, original] of Object.entries(data.mappings)) {
                this.tokenToOriginal.set(token, original);
                this.originalToToken.set(original, token);
            }
        }
        if (data.permanent) {
            for (const token of data.permanent) {
                this.permanentTokens.add(token);
            }
        }
        if (data.counters) {
            this.counters = { ...data.counters };
        }
    }

    /**
     * Clear all mappings
     */
    clear() {
        this.tokenToOriginal.clear();
        this.originalToToken.clear();
        this.permanentTokens.clear();
        this.counters = {};
    }

    /**
     * Get count of stored mappings
     * @returns {number}
     */
    get size() {
        return this.tokenToOriginal.size;
    }
}

export default TokenMapper;
