import express from 'express';
import { getDatabase } from '../core/database/index.js';
import { getEscalationService } from '../core/escalation/index.js';
import { getAgentService } from '../core/agent/index.js';

const router = express.Router();

// ==================== TICKET ENDPOINTS ====================

/**
 * POST /api/tickets
 * Create a new ticket
 */
router.post('/', async (req, res) => {
    try {
        const { query, complexity, category } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query is required',
            });
        }

        const db = getDatabase();
        const ticket = await db.createTicket({ query, complexity, category });

        res.json({
            success: true,
            ticket,
        });
    } catch (error) {
        console.error('[Tickets] Create error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/tickets/:id
 * Get a specific ticket
 */
router.get('/:id', async (req, res) => {
    try {
        const db = getDatabase();
        const ticket = await db.getTicket(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: 'Ticket not found',
            });
        }

        res.json({
            success: true,
            ticket,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/tickets
 * Get all open/escalated tickets
 */
router.get('/', async (req, res) => {
    try {
        const db = getDatabase();
        const tickets = await db.getOpenTickets();

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
 * POST /api/tickets/:id/message
 * Add a message to ticket and check for escalation
 */
router.post('/:id/message', async (req, res) => {
    try {
        const { message, role = 'user' } = req.body;
        const ticketId = req.params.id;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required',
            });
        }

        const db = getDatabase();
        const escalation = getEscalationService();

        // Add message to ticket
        let ticket = await db.addMessage(ticketId, role, message);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: 'Ticket not found',
            });
        }

        // Check for escalation triggers (only for user messages)
        let escalationResult = null;
        if (role === 'user') {
            // Increment attempt counter
            ticket = await db.incrementAttempts(ticketId);

            // Check all escalation conditions
            escalationResult = await escalation.checkAllEscalationConditions(ticket, message);

            if (escalationResult.shouldEscalate && ticket.status !== 'escalated') {
                ticket = await escalation.escalateTicket(ticketId, escalationResult.reason);
            }
        }

        res.json({
            success: true,
            ticket,
            escalation: escalationResult,
        });
    } catch (error) {
        console.error('[Tickets] Message error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/tickets/:id/escalate
 * Manually escalate a ticket
 */
router.post('/:id/escalate', async (req, res) => {
    try {
        const { reason = 'Manual escalation' } = req.body;
        const ticketId = req.params.id;

        const escalation = getEscalationService();
        const ticket = await escalation.escalateTicket(ticketId, reason);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: 'Ticket not found',
            });
        }

        res.json({
            success: true,
            ticket,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/tickets/:id/assign
 * Assign ticket to an agent
 */
router.post('/:id/assign', async (req, res) => {
    try {
        const ticketId = req.params.id;

        const db = getDatabase();
        const agentService = getAgentService();

        const ticket = await db.getTicket(ticketId);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: 'Ticket not found',
            });
        }

        const agent = await agentService.assignBestAgent(ticket);

        if (!agent) {
            return res.status(503).json({
                success: false,
                error: 'No available agents',
            });
        }

        const updatedTicket = await db.getTicket(ticketId);

        res.json({
            success: true,
            ticket: updatedTicket,
            assignedAgent: {
                id: agent.id,
                name: agent.name,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/tickets/:id/resolve
 * Resolve a ticket
 */
router.post('/:id/resolve', async (req, res) => {
    try {
        const ticketId = req.params.id;

        const agentService = getAgentService();
        const success = await agentService.releaseTicket(ticketId);

        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Ticket not found or not assigned',
            });
        }

        const db = getDatabase();
        const ticket = await db.getTicket(ticketId);

        res.json({
            success: true,
            ticket,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
