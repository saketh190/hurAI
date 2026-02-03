import express from 'express';
import path from 'path';
import { getKBService } from '../core/kb/index.js';
import { getDraftGenerator } from '../core/kb/index.js';

const router = express.Router();

/**
 * POST /api/kb/index
 * Index KB files from the kb directory
 */
router.post('/index', async (req, res) => {
    try {
        const kbService = getKBService();
        const kbPath = path.resolve(process.cwd(), '..', 'kb');

        console.log(`[KB] Indexing directory: ${kbPath}`);
        const result = await kbService.indexDirectory(kbPath);

        res.json({
            success: true,
            message: `Indexed ${result.chunks} chunks from ${result.files} files`,
            ...result,
        });
    } catch (error) {
        console.error('[KB] Index error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/kb/search
 * Search for relevant KB chunks
 */
router.post('/search', async (req, res) => {
    try {
        const { query, topK = 5 } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query is required',
            });
        }

        const kbService = getKBService();
        const results = await kbService.search(query, topK);

        res.json({
            success: true,
            query,
            results,
            count: results.length,
        });
    } catch (error) {
        console.error('[KB] Search error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/kb/chunks
 * List all cached chunks
 */
router.get('/chunks', async (req, res) => {
    try {
        const kbService = getKBService();
        const chunks = kbService.getAllChunks();

        res.json({
            success: true,
            chunks: chunks.map(c => ({
                id: c.id,
                source: c.source,
                index: c.index,
                preview: c.content?.substring(0, 100) + '...',
            })),
            count: chunks.length,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/kb/articles/:id
 * Get a specific article
 */
router.get('/articles/:id', async (req, res) => {
    try {
        const kbService = getKBService();
        const article = kbService.getArticle(req.params.id);

        if (!article) {
            return res.status(404).json({
                success: false,
                error: 'Article not found',
            });
        }

        res.json({
            success: true,
            article,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/kb/draft
 * Generate a KB draft from a resolved ticket
 * 
 * TODO: Future sprint - Analyze conversation logs between user and agent
 * to automatically generate KB articles from resolved issues.
 */
router.post('/draft', async (req, res) => {
    res.status(501).json({
        success: false,
        error: 'Coming soon - Draft generation from conversation analysis will be implemented in a future sprint.',
    });
});

export default router;
