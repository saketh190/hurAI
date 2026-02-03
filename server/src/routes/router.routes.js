import express from 'express';
import { getRouter } from '../core/router/index.js';
import { getDatabase } from '../core/database/index.js';
import { getAgentService } from '../core/agent/index.js';

const router = express.Router();

/**
 * POST /api/router/query
 * Route a user query through the self-service system
 * If escalation is needed, creates a ticket and assigns an agent
 */
router.post('/query', async (req, res) => {
    try {
        const { query, createTicket = true } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query is required',
            });
        }

        const routerService = getRouter();
        const result = await routerService.route(query);

        // If routing to agent and createTicket is true, create ticket and assign agent
        let ticketInfo = null;
        let assignedAgent = null;

        if (result.decision.route === 'agent' && createTicket) {
            try {
                const db = getDatabase();
                const agentService = getAgentService();

                // Create ticket
                const ticket = await db.createTicket({
                    query: query,
                    complexity: result.classification.complexity,
                    category: result.classification.category,
                });

                // Escalate it
                await db.updateTicket(ticket.id, {
                    status: 'escalated',
                    escalatedAt: new Date(),
                    escalationReason: result.decision.reason,
                });

                // Try to assign an agent
                const updatedTicket = await db.getTicket(ticket.id);
                const agent = await agentService.assignBestAgent(updatedTicket);

                ticketInfo = {
                    id: ticket.id,
                    status: agent ? 'assigned' : 'escalated',
                };

                if (agent) {
                    assignedAgent = {
                        id: agent.id,
                        name: agent.name,
                        email: agent.email,
                    };
                    console.log(`[Router] Ticket ${ticket.id} assigned to agent: ${agent.name}`);
                } else {
                    console.log(`[Router] Ticket ${ticket.id} escalated but no agent available`);
                }
            } catch (dbError) {
                console.error('[Router] Failed to create ticket:', dbError.message);
                // Continue without ticket creation
            }
        }

        res.json({
            success: true,
            ...result,
            ticket: ticketInfo,
            assignedAgent: assignedAgent,
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

