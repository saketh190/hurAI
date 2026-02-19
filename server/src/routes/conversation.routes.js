import express from 'express';
import { getConversationService } from '../core/conversation/index.js';

const router = express.Router();

/**
 * POST /api/conversation/start
 * Start a new conversation session
 */
router.post('/start', async (req, res) => {
    try {
        const { channel = 'web', userId = null } = req.body;
        const conversationService = getConversationService();
        const conversation = await conversationService.createConversation(channel, userId);
        res.json({ success: true, conversation });
    } catch (error) {
        console.error('[Conversation API] Start error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/conversation/:id/message
 * Send a message in a conversation
 */
router.post('/:id/message', async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        if (!message) return res.status(400).json({ success: false, error: 'Message is required' });

        const conversationService = getConversationService();
        const result = await conversationService.processMessage(id, message);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('[Conversation API] Message error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/conversation/:id/user-message
 * Direct user message — bypasses LLM, goes straight to Firestore
 * Used after escalation so user can chat with the human agent
 */
router.post('/:id/user-message', async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        if (!message) return res.status(400).json({ success: false, error: 'Message is required' });

        const conversationService = getConversationService();
        await conversationService.addUserMessage(id, message);
        res.json({ success: true });
    } catch (error) {
        console.error('[Conversation API] User-message error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/conversation/:id/resolve
 * User marks their issue as resolved — no ticket needed
 */
router.post('/:id/resolve', async (req, res) => {
    try {
        const { id } = req.params;
        const conversationService = getConversationService();
        await conversationService.resolveConversation(id);
        res.json({ success: true, status: 'resolved' });
    } catch (error) {
        console.error('[Conversation API] Resolve error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/conversation/:id/escalate
 * User explicitly requests a human agent
 */
router.post('/:id/escalate', async (req, res) => {
    try {
        const { id } = req.params;
        const conversationService = getConversationService();
        const ticket = await conversationService.createTicketFromConversation(id);
        res.json({ success: true, status: 'escalated', ticket });
    } catch (error) {
        console.error('[Conversation API] Escalate error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/conversation/:id
 * Get conversation history
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const conversationService = getConversationService();
        const history = await conversationService.getConversationHistory(id);
        res.json({ success: true, ...history });
    } catch (error) {
        console.error('[Conversation API] Get history error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/conversation/:id/agent-message
 * Add agent message to conversation (called from TicketDetail)
 */
router.post('/:id/agent-message', async (req, res) => {
    try {
        const { id } = req.params;
        const { agentId, agentName, message } = req.body;
        if (!message || !agentId || !agentName) {
            return res.status(400).json({ success: false, error: 'agentId, agentName, and message are required' });
        }
        const conversationService = getConversationService();
        const messageData = await conversationService.addAgentMessage(id, agentId, agentName, message);
        res.json({ success: true, message: messageData });
    } catch (error) {
        console.error('[Conversation API] Agent message error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
