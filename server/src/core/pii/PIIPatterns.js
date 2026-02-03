/**
 * PII Detection Patterns
 * Regular expressions for detecting various types of personal information
 */

export const PIIPatterns = {
    // Email addresses
    email: {
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        type: 'EMAIL',
        description: 'Email address',
    },

    // Phone numbers (various formats)
    phone: {
        pattern: /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g,
        type: 'PHONE',
        description: 'Phone number',
    },

    // Credit card numbers (major formats)
    creditCard: {
        pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g,
        type: 'CREDIT_CARD',
        description: 'Credit card number',
        permanentlyMasked: true,
    },

    // Credit card with spaces or dashes
    creditCardFormatted: {
        pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
        type: 'CREDIT_CARD',
        description: 'Credit card number (formatted)',
        permanentlyMasked: true,
    },

    // Social Security Number
    ssn: {
        pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
        type: 'SSN',
        description: 'Social Security Number',
        permanentlyMasked: true,
    },

    // IP addresses (IPv4)
    ipAddress: {
        pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
        type: 'IP_ADDRESS',
        description: 'IP address',
    },

    // Street addresses (basic pattern)
    address: {
        pattern: /\b\d{1,5}\s+[\w\s]{1,30}(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|way|place|pl)\.?\b/gi,
        type: 'ADDRESS',
        description: 'Street address',
    },

    // ZIP codes (US)
    zipCode: {
        pattern: /\b\d{5}(?:-\d{4})?\b/g,
        type: 'ZIP_CODE',
        description: 'ZIP code',
    },

    // Date of birth patterns (MM/DD/YYYY, DD-MM-YYYY, etc.)
    dateOfBirth: {
        pattern: /\b(?:0?[1-9]|1[0-2])[\/\-](?:0?[1-9]|[12]\d|3[01])[\/\-](?:19|20)\d{2}\b/g,
        type: 'DOB',
        description: 'Date of birth',
    },
};

/**
 * Get all patterns as an array
 */
export function getAllPatterns() {
    return Object.entries(PIIPatterns).map(([key, config]) => ({
        name: key,
        ...config,
    }));
}

/**
 * Check if a PII type should be permanently masked
 */
export function isPermanentlyMasked(type) {
    const pattern = Object.values(PIIPatterns).find(p => p.type === type);
    return pattern?.permanentlyMasked === true;
}

export default PIIPatterns;
