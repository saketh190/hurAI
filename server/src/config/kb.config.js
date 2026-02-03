/**
 * Knowledge Base Configuration
 */
export const kbConfig = {
    // Pinecone settings
    pinecone: {
        apiKey: process.env.PINECONE_API_KEY,
        indexName: process.env.PINECONE_INDEX || 'hurai-kb',
    },

    // Embedding settings
    embedding: {
        model: 'text-embedding-004', // Gemini embedding model
        dimensions: 768,
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
