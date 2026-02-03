import { kbConfig } from '../../config/index.js';

/**
 * Embedding Service
 * Generates embeddings using Gemini API
 */
export class EmbeddingService {
    constructor(config = kbConfig.embedding) {
        this.config = config;
        this.apiKey = process.env.GOOGLE_API_KEY;
    }

    /**
     * Generate embedding for text
     * @param {string} text - Text to embed
     * @returns {Array<number>} Embedding vector
     */
    async embed(text) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:embedContent?key=${this.apiKey}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: `models/${this.config.model}`,
                    content: {
                        parts: [{ text }]
                    }
                })
            });

            const data = await response.json();

            if (data.error) {
                console.error('[Embedding] Error:', data.error.message);
                return null;
            }

            return data.embedding?.values || null;
        } catch (error) {
            console.error('[Embedding] Error:', error.message);
            return null;
        }
    }

    /**
     * Generate embeddings for multiple texts
     * @param {Array<string>} texts - Texts to embed
     * @returns {Array<Array<number>>} Embedding vectors
     */
    async embedBatch(texts) {
        const embeddings = [];

        for (const text of texts) {
            const embedding = await this.embed(text);
            embeddings.push(embedding);
            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 100));
        }

        return embeddings;
    }
}

// Singleton
let embeddingInstance = null;

export function getEmbeddingService() {
    if (!embeddingInstance) {
        embeddingInstance = new EmbeddingService();
    }
    return embeddingInstance;
}

export default EmbeddingService;
