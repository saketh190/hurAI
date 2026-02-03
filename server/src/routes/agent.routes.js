import express from 'express';
import { getAgentService } from '../core/agent/index.js';

const router = express.Router();

/**
 * POST /api/agents
 * Register a new agent
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, skills, maxLoad } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                error: 'Name and email are required',
            });
        }

        const agentService = getAgentService();
        const agent = await agentService.registerAgent({ name, email, skills, maxLoad });

        res.json({
            success: true,
            agent,
        });
    } catch (error) {
        console.error('[Agents] Register error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/agents
 * Get all agents with status
 */
router.get('/', async (req, res) => {
    try {
        const agentService = getAgentService();
        const agents = await agentService.getAgentStatus();

        res.json({
            success: true,
            agents,
            count: agents.length,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/agents/:id/tickets
 * Get tickets assigned to an agent
 */
router.get('/:id/tickets', async (req, res) => {
    try {
        const agentService = getAgentService();
        const tickets = await agentService.getAgentTickets(req.params.id);

        res.json({
            success: true,
            tickets,
            count: tickets.length,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * PUT /api/agents/:id/availability
 * Set agent availability
 */
router.put('/:id/availability', async (req, res) => {
    try {
        const { isAvailable } = req.body;

        if (typeof isAvailable !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'isAvailable (boolean) is required',
            });
        }

        const agentService = getAgentService();
        await agentService.setAgentAvailability(req.params.id, isAvailable);

        res.json({
            success: true,
            message: `Agent availability set to ${isAvailable}`,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
