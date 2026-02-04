import express from 'express';
import { getRouter } from '../core/router/index.js';

const router = express.Router();

/**
 * POST /api/router/query
 * Route a user query through the self-service system
 * Returns AI classification and routing decision
 * Note: Ticket creation is handled by UI if needed
 */
router.post('/query', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query is required',
            });
        }

        const routerService = getRouter();
        const result = await routerService.route(query);

        res.json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error('[Router] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/router/config
 * Get router configuration
 */
router.get('/config', (req, res) => {
    const routerService = getRouter();

    res.json({
        success: true,
        config: {
            simpleComplexityMax: routerService.simpleComplexityMax,
            kbMinScore: routerService.kbMinScore,
            kbMinMatches: routerService.kbMinMatches,
        },
    });
});

export default router;

