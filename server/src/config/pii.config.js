/**
 * PII Configuration
 * Defines what types of PII to detect and how to handle them
 */
export const piiConfig = {
    // Types of PII to detect
    types: {
        email: true,
        phone: true,
        name: true,
        address: true,
        ssn: true,
        creditCard: true,
        ipAddress: true,
    },

    // Token format for anonymization
    tokenFormat: {
        prefix: '[',
        suffix: ']',
        // e.g., [EMAIL_1], [PHONE_2]
    },

    // Types that should NEVER be restored (always masked)
    permanentlyMasked: ['creditCard', 'ssn'],

    // Masking settings
    masking: {
        creditCard: '**** **** **** ****',
        ssn: '***-**-****',
    },

    // Whether to log PII detection (for debugging, should be false in production)
    enableLogging: process.env.ENABLE_PII_LOGGING === 'true',
};

export default piiConfig;
