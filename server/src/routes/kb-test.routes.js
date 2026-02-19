import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { TextChunker } from '../core/kb/TextChunker.js';
import { getKBService } from '../core/kb/index.js';
import { getEmbeddingService } from '../core/kb/EmbeddingService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// routes/ → src/ → server/ → project root → kb/
const KB_PATH = path.resolve(__dirname, '../../../kb');

const router = express.Router();

/**
 * GET /api/kb-test/embed-test
 * Test embedding generation directly and list available models
 */
router.get('/embed-test', async (req, res) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    const results = {
        apiKeyPresent: !!apiKey,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : null,
        models: [],
        embeddingTest: null
    };

    // List available embedding models
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        const data = await response.json();

        if (data.error) {
            results.listModelsError = data.error.message;
        } else {
            results.models = (data.models || [])
                .filter(m => m.supportedGenerationMethods?.includes('embedContent'))
                .map(m => m.name.replace('models/', ''));
        }
    } catch (err) {
        results.listModelsError = err.message;
    }

    // Try embedding with each known model name
    const modelsToTry = ['embedding-001', 'text-embedding-004', 'text-embedding-preview-0409'];
    results.modelTests = {};

    for (const model of modelsToTry) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: `models/${model}`,
                    content: { parts: [{ text: 'test' }] }
                })
            });
            const data = await response.json();
            if (data.error) {
                results.modelTests[model] = { success: false, error: data.error.message };
            } else {
                results.modelTests[model] = { success: true, dimensions: data.embedding?.values?.length };
            }
        } catch (err) {
            results.modelTests[model] = { success: false, error: err.message };
        }
    }

    res.json(results);
});

/**
 * POST /api/kb-test/recreate-index
 * Delete and recreate Pinecone index with correct dimensions
 */
router.post('/recreate-index', async (req, res) => {
    const { Pinecone } = await import('@pinecone-database/pinecone');
    const { kbConfig } = await import('../config/index.js');

    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX || 'hurai';
    const dimensions = kbConfig.embedding.dimensions;

    try {
        const pc = new Pinecone({ apiKey });

        // Delete existing index if it exists
        const indexes = await pc.listIndexes();
        const exists = indexes.indexes?.some(i => i.name === indexName);

        if (exists) {
            console.log(`[KB] Deleting index: ${indexName}`);
            await pc.deleteIndex(indexName);
            // Wait for deletion
            await new Promise(r => setTimeout(r, 5000));
            console.log(`[KB] Index deleted`);
        }

        // Create new index with correct dimensions
        console.log(`[KB] Creating index: ${indexName} with ${dimensions} dimensions`);
        await pc.createIndex({
            name: indexName,
            dimension: dimensions,
            metric: 'cosine',
            spec: {
                serverless: {
                    cloud: 'aws',
                    region: 'us-east-1'
                }
            }
        });

        // Wait for index to be ready
        await new Promise(r => setTimeout(r, 10000));
        console.log(`[KB] Index created and ready`);

        res.json({
            success: true,
            message: `Index '${indexName}' recreated with ${dimensions} dimensions`,
            indexName,
            dimensions
        });
    } catch (error) {
        console.error('[KB] Recreate index error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/kb-test/chunks
 * Parse KB files on-the-fly and show chunks + metadata.
 * Works even after a server restart (no in-memory cache needed).
 */
router.get('/chunks', async (req, res) => {
    try {
        const chunker = new TextChunker();
        let allChunks = [];

        const files = await fs.readdir(KB_PATH);
        const txtFiles = files.filter(f => f.endsWith('.txt'));

        for (const file of txtFiles) {
            const content = await fs.readFile(path.join(KB_PATH, file), 'utf-8');
            const chunks = chunker.chunkFile(content, file);
            allChunks.push(...chunks.map(c => ({
                id: chunker.generateChunkId(file, c.index),
                source: file,
                index: c.index,
                type: c.type || 'text',
                title: c.title || '',
                section: c.section || '',
                problem: c.problem || '',
                length: c.content.length,
                preview: c.content.substring(0, 200),
                fullContent: c.content,
            })));
        }

        res.json({
            success: true,
            totalChunks: allChunks.length,
            kbPath: KB_PATH,
            note: allChunks.length === 0 ? `No .txt files found in ${KB_PATH}` : undefined,
            chunks: allChunks,
        });
    } catch (error) {
        console.error('[KB Test] Error getting chunks:', error.message);
        res.status(500).json({ success: false, error: error.message, kbPath: KB_PATH });
    }
});


/**
 * POST /api/kb-test/search
 * Test search with detailed diagnostics
 */
router.post('/search', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query is required'
            });
        }

        const kbService = getKBService();
        const embeddingService = getEmbeddingService();

        // 1. Generate query embedding
        console.log(`[KB Test] Generating embedding for: "${query}"`);
        const queryEmbedding = await embeddingService.embed(query);

        if (!queryEmbedding) {
            return res.json({
                success: false,
                error: 'Failed to generate query embedding'
            });
        }

        // 2. Search vector DB
        const vectorResults = await kbService.search(query, 10);

        // 3. Keyword search (simple text matching)
        const allChunks = kbService.getAllChunks();
        const keywordResults = allChunks
            .map(chunk => {
                const queryLower = query.toLowerCase();
                const contentLower = chunk.content.toLowerCase();

                // Calculate simple keyword match score
                let score = 0;

                // Exact phrase match
                if (contentLower.includes(queryLower)) {
                    score = 1.0;
                }
                // Individual word matches
                else {
                    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3);
                    const matchedWords = queryWords.filter(word => contentLower.includes(word));
                    score = matchedWords.length / queryWords.length;
                }

                return {
                    id: chunk.id,
                    source: chunk.source,
                    score: score,
                    content: chunk.content,
                    matchType: 'keyword'
                };
            })
            .filter(r => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        res.json({
            success: true,
            query: query,
            diagnostics: {
                queryEmbeddingGenerated: true,
                embeddingDimensions: queryEmbedding.length,
                totalChunksSearched: allChunks.length,
                vectorResultsFound: vectorResults.length,
                keywordResultsFound: keywordResults.length
            },
            results: {
                vector: vectorResults.map(r => ({
                    id: r.id,
                    source: r.source,
                    score: r.score,
                    preview: r.content.substring(0, 200),
                    fullContent: r.content,
                    matchType: 'vector'
                })),
                keyword: keywordResults.map(r => ({
                    id: r.id,
                    source: r.source,
                    score: r.score,
                    preview: r.content.substring(0, 200),
                    fullContent: r.content,
                    matchType: 'keyword'
                }))
            }
        });
    } catch (error) {
        console.error('[KB Test] Search error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/kb-test/compare-embeddings
 * Compare embeddings between query and specific chunk
 */
router.post('/compare-embeddings', async (req, res) => {
    try {
        const { query, chunkId } = req.body;

        const kbService = getKBService();
        const embeddingService = getEmbeddingService();

        const chunks = kbService.getAllChunks();
        const chunk = chunks.find(c => c.id === chunkId);

        if (!chunk) {
            return res.status(404).json({
                success: false,
                error: 'Chunk not found'
            });
        }

        // Generate embeddings
        const queryEmbedding = await embeddingService.embed(query);
        const chunkEmbedding = await embeddingService.embed(chunk.content);

        // Calculate cosine similarity manually
        function cosineSimilarity(a, b) {
            let dotProduct = 0;
            let normA = 0;
            let normB = 0;

            for (let i = 0; i < a.length; i++) {
                dotProduct += a[i] * b[i];
                normA += a[i] * a[i];
                normB += b[i] * b[i];
            }

            return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
        }

        const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);

        res.json({
            success: true,
            query: query,
            chunk: {
                id: chunk.id,
                source: chunk.source,
                content: chunk.content
            },
            similarity: similarity,
            interpretation: similarity > 0.8 ? 'Very Similar' :
                similarity > 0.6 ? 'Similar' :
                    similarity > 0.4 ? 'Somewhat Similar' :
                        'Not Similar'
        });
    } catch (error) {
        console.error('[KB Test] Compare error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
