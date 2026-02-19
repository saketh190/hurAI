import { Pinecone } from '@pinecone-database/pinecone';
import fs from 'fs/promises';
import path from 'path';
import { kbConfig } from '../../config/index.js';
import { TextChunker } from './TextChunker.js';
import { getEmbeddingService } from './EmbeddingService.js';

/**
 * Knowledge Base Service
 * Uses text chunking for better vector search (RAG-style)
 */
export class KBService {
    constructor(config = kbConfig) {
        this.config = config;
        this.pinecone = null;
        this.index = null;
        this.chunker = new TextChunker({
            chunkSize: 500,    // ~100-150 words per chunk
            chunkOverlap: 100, // 20% overlap for context continuity
        });
        this.embeddingService = getEmbeddingService();
        this.chunks = new Map(); // Local cache of chunks
    }

    /**
     * Initialize Pinecone connection
     */
    async initialize() {
        if (!this.config.pinecone.apiKey) {
            throw new Error('Pinecone API key is required');
        }

        this.pinecone = new Pinecone({
            apiKey: this.config.pinecone.apiKey,
        });

        try {
            const indexes = await this.pinecone.listIndexes();
            const indexExists = indexes.indexes?.some(i => i.name === this.config.pinecone.indexName);

            if (!indexExists) {
                console.log(`[KB] Creating index: ${this.config.pinecone.indexName}`);
                await this.pinecone.createIndex({
                    name: this.config.pinecone.indexName,
                    dimension: this.config.embedding.dimensions,
                    metric: 'cosine',
                    spec: {
                        serverless: {
                            cloud: 'aws',
                            region: 'us-east-1'
                        }
                    }
                });
                await new Promise(r => setTimeout(r, 5000));
            }

            this.index = this.pinecone.index(this.config.pinecone.indexName);
            console.log(`[KB] Connected to index: ${this.config.pinecone.indexName}`);
        } catch (error) {
            console.error('[KB] Pinecone error:', error.message);
            throw error;
        }
    }

    /**
     * Index a KB file using chunking
     * @param {string} filePath - Path to KB txt file
     */
    async indexFile(filePath) {
        if (!this.index) {
            await this.initialize();
        }

        console.log(`[KB] Indexing file: ${filePath}`);

        const content = await fs.readFile(filePath, 'utf-8');
        const fileName = path.basename(filePath);

        // Chunk the content
        const chunks = this.chunker.chunkFile(content, fileName);
        console.log(`[KB] Created ${chunks.length} chunks from ${fileName}`);
        console.log(`[KB] File content length: ${content.length} chars`);

        if (chunks.length === 0) {
            console.error('[KB] ERROR: No chunks created! Check TextChunker.');
            return { chunks: 0, file: fileName };
        }

        const vectors = [];
        for (const chunk of chunks) {
            const chunkId = this.chunker.generateChunkId(fileName, chunk.index);

            // Store in local cache
            this.chunks.set(chunkId, {
                ...chunk,
                id: chunkId,
            });

            // Generate embedding
            console.log(`[KB]   Embedding chunk ${chunk.index}: "${chunk.content.substring(0, 60)}..."`);
            const embedding = await this.embeddingService.embed(chunk.content);

            if (embedding) {
                console.log(`[KB]   ✅ Embedding OK, dimensions: ${embedding.length}`);
                vectors.push({
                    id: chunkId,
                    values: embedding,
                    metadata: {
                        source: fileName,
                        chunkIndex: chunk.index,
                        preview: chunk.content.substring(0, 200),
                    }
                });
            } else {
                console.error(`[KB]   ❌ Embedding FAILED for chunk ${chunk.index}`);
            }
        }




        // Upsert to Pinecone in batches
        if (vectors.length > 0) {
            const batchSize = 100;
            for (let i = 0; i < vectors.length; i += batchSize) {
                const batch = vectors.slice(i, i + batchSize);
                await this.index.upsert(batch);
            }
            console.log(`[KB] Indexed ${vectors.length} chunks`);
        }

        return { chunks: vectors.length, file: fileName };
    }

    /**
     * Search KB using vector similarity
     * @param {string} query - Search query
     * @param {number} topK - Number of results
     */
    async search(query, topK = 5) {
        if (!this.index) {
            await this.initialize();
        }

        console.log(`[KB] Searching for: "${query}"`);

        // Generate query embedding
        const queryEmbedding = await this.embeddingService.embed(query);
        if (!queryEmbedding) {
            console.log('[KB] Failed to generate query embedding');
            return [];
        }

        // Search Pinecone
        const results = await this.index.query({
            vector: queryEmbedding,
            topK,
            includeMetadata: true,
        });

        console.log(`[KB] Found ${results.matches?.length || 0} matches`);

        // Format and return results with chunk content
        return results.matches?.map(match => {
            const cachedChunk = this.chunks.get(match.id);
            console.log(`[KB]   - ${match.id}: score=${match.score.toFixed(4)}`);

            return {
                id: match.id,
                score: match.score,
                content: cachedChunk?.content || match.metadata?.preview || '',
                source: match.metadata?.source || '',
                chunkIndex: match.metadata?.chunkIndex,
            };
        }) || [];
    }

    /**
     * Get all cached chunks
     */
    getAllChunks() {
        return Array.from(this.chunks.values());
    }

    /**
     * Clear and reindex
     */
    async clearIndex() {
        if (!this.index) {
            await this.initialize();
        }

        try {
            await this.index.deleteAll();
            this.chunks.clear();
            console.log('[KB] Index cleared');
        } catch (error) {
            console.error('[KB] Clear error:', error.message);
        }
    }

    /**
     * Index all KB files in a directory
     */
    async indexDirectory(dirPath) {
        // Clear existing index first
        await this.clearIndex();

        const files = await fs.readdir(dirPath);
        const txtFiles = files.filter(f => f.endsWith('.txt'));

        let totalChunks = 0;
        for (const file of txtFiles) {
            const result = await this.indexFile(path.join(dirPath, file));
            totalChunks += result.chunks;
        }

        return { files: txtFiles.length, chunks: totalChunks };
    }
}

// Singleton
let kbInstance = null;

export function getKBService() {
    if (!kbInstance) {
        kbInstance = new KBService();
    }
    return kbInstance;
}

export default KBService;
