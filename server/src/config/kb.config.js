/**
 * Knowledge Base Configuration
 */
export const kbConfig = {
    // Pinecone settings
    pinecone: {
        apiKey: process.env.PINECONE_API_KEY,
        indexName: process.env.PINECONE_INDEX || 'hurai',
    },

    // Embedding settings
    embedding: {
        model: 'gemini-embedding-001', // Verified via ListModels API
        dimensions: 3072,              // gemini-embedding-001 outputs 3072 dims
    },

    // Search settings
    search: {
        topK: 5, // Number of results to return
        minScore: 0.7, // Minimum similarity score
    },

    // Article parsing
    parser: {
        sectionDelimiter: '---',
        titlePattern: /^###?\s+(.+)$/m,
    },

    // Categories for classification
    categories: [
        'technical',
        'billing',
        'account',
        'general',
        'feature-request',
        'bug-report',
    ],
};

export default kbConfig;
