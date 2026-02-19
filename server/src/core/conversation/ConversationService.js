import { getFirestore } from 'firebase-admin/firestore';
import { getRouter } from '../router/index.js';

/**
 * Conversation Service
 * Manages real-time conversations between users and LLM/agents
 * Handles auto-escalation and agent assignment
 */
export class ConversationService {
    constructor() {
        this.db = getFirestore();
        this.router = null;

        // Escalation thresholds — only low AI confidence triggers auto escalation
        // Message count no longer triggers escalation; user controls it via ✅/🙋 buttons
        this.minConfidenceScore = 0.45;
    }

    async initialize() {
        this.router = getRouter();
        await this.router.initialize();
    }

    /**
     * Create a new conversation session
     */
    async createConversation(channel = 'web', userId = null) {
        const conversationData = {
            sessionId: this.generateSessionId(),
            userId: userId,
            channel: channel,
            status: 'active',
            attemptCount: 0,
            lastConfidenceScore: 1.0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const conversationRef = await this.db.collection('conversations').add(conversationData);

        console.log(`[Conversation] Created new conversation: ${conversationRef.id}`);

        return {
            id: conversationRef.id,
            ...conversationData
        };
    }

    /**
     * Add user message to conversation
     */
    async addUserMessage(conversationId, message) {
        const messageData = {
            role: 'user',
            content: message,
            timestamp: new Date()
        };

        await this.db.collection('conversations').doc(conversationId)
            .collection('messages').add(messageData);

        // Update conversation timestamp
        await this.db.collection('conversations').doc(conversationId).update({
            updatedAt: new Date()
        });

        console.log(`[Conversation] User message added to ${conversationId}`);

        return messageData;
    }

    /**
     * Add assistant (LLM) message to conversation
     */
    async addAssistantMessage(conversationId, message, metadata = {}) {
        const messageData = {
            role: 'assistant',
            content: message,
            timestamp: new Date(),
            confidenceScore: metadata.confidenceScore || null,
            kbMatches: metadata.kbMatches || 0,
            basedOnKB: metadata.basedOnKB || false,
            provider: metadata.provider || null
        };

        await this.db.collection('conversations').doc(conversationId)
            .collection('messages').add(messageData);

        // Update conversation with latest score and attempt count
        const conversationRef = this.db.collection('conversations').doc(conversationId);
        const conversationSnap = await conversationRef.get();
        const conversationData = conversationSnap.data();

        const newAttemptCount = conversationData.attemptCount + 1;

        await conversationRef.update({
            lastConfidenceScore: metadata.confidenceScore || 1.0,
            attemptCount: newAttemptCount,
            updatedAt: new Date()
        });

        console.log(`[Conversation] Assistant message added to ${conversationId} (attempt ${newAttemptCount})`);

        return messageData;
    }

    /**
     * Add agent message to conversation (from TicketDetail)
     */
    async addAgentMessage(conversationId, agentId, agentName, message) {
        const messageData = {
            role: 'agent',
            content: message,
            agentId: agentId,
            agentName: agentName,
            timestamp: new Date()
        };

        await this.db.collection('conversations').doc(conversationId)
            .collection('messages').add(messageData);

        await this.db.collection('conversations').doc(conversationId).update({
            updatedAt: new Date()
        });

        console.log(`[Conversation] Agent message added to ${conversationId} by ${agentName}`);

        return messageData;
    }

    /**
     * Process user message and get LLM response
     */
    async processMessage(conversationId, userMessage) {
        if (!this.router) {
            await this.initialize();
        }

        // Add user message
        await this.addUserMessage(conversationId, userMessage);

        // Get conversation state
        const conversationSnap = await this.db.collection('conversations').doc(conversationId).get();
        const conversation = conversationSnap.data();

        // Check if should escalate BEFORE routing
        const shouldEscalate = await this.shouldEscalate(conversationId);

        if (shouldEscalate.escalate) {
            console.log(`[Conversation] Auto-escalating: ${shouldEscalate.reason}`);

            // Create ticket and assign agent
            const ticket = await this.createTicketFromConversation(conversationId);

            return {
                type: 'escalation',
                message: `I've connected you with a human agent who will assist you shortly. Your ticket ID is #${ticket.id.slice(0, 8)}.`,
                ticket: ticket,
                reason: shouldEscalate.reason
            };
        }

        // Route through existing router service
        const routingResult = await this.router.route(userMessage);

        // Check if router decided to escalate
        if (routingResult.decision.route === 'agent') {
            console.log(`[Conversation] Router escalated: ${routingResult.decision.reason}`);

            const ticket = await this.createTicketFromConversation(conversationId);

            return {
                type: 'escalation',
                message: `I've connected you with a human agent who will assist you shortly. Your ticket ID is #${ticket.id.slice(0, 8)}.`,
                ticket: ticket,
                reason: routingResult.decision.reason
            };
        }

        // LLM response - add to conversation
        const assistantMessage = routingResult.response.message;
        const confidenceScore = routingResult.decision.confidence || 0.8;

        await this.addAssistantMessage(conversationId, assistantMessage, {
            confidenceScore: confidenceScore,
            kbMatches: routingResult.kbMatches.length,
            basedOnKB: routingResult.decision.requiresKB || false,
            provider: routingResult.response.provider
        });

        return {
            type: 'assistant',
            message: assistantMessage,
            metadata: {
                confidence: confidenceScore,
                basedOnKB: routingResult.decision.requiresKB,
                kbMatches: routingResult.kbMatches.length
            }
        };
    }

    /**
     * Check if conversation should auto-escalate to human agent.
     * Only triggered by consistently low AI confidence — NOT by message count.
     * User-initiated escalation goes through /escalate endpoint directly.
     */
    async shouldEscalate(conversationId) {
        const conversationSnap = await this.db.collection('conversations').doc(conversationId).get();
        const conversation = conversationSnap.data();

        // Only escalate if AI confidence is very low
        if (conversation.lastConfidenceScore < this.minConfidenceScore) {
            return {
                escalate: true,
                reason: `AI confidence too low (${conversation.lastConfidenceScore?.toFixed(2)}) — routing to human`
            };
        }

        return { escalate: false };
    }

    /**
     * Mark conversation as resolved (user clicked ✅ "Issue Solved")
     */
    async resolveConversation(conversationId) {
        await this.db.collection('conversations').doc(conversationId).update({
            status: 'resolved',
            resolvedAt: new Date(),
            updatedAt: new Date()
        });
        console.log(`[Conversation] Resolved by user: ${conversationId}`);
    }

    /**
     * Create ticket from conversation and assign to agent
     */
    async createTicketFromConversation(conversationId) {
        // Get conversation and messages
        const conversationSnap = await this.db.collection('conversations').doc(conversationId).get();
        const conversation = conversationSnap.data();

        const messagesSnap = await this.db.collection('conversations').doc(conversationId)
            .collection('messages').get();
        const messages = messagesSnap.docs.map(doc => doc.data());

        // Extract user query (first user message)
        const firstUserMessage = messages.find(m => m.role === 'user');
        const query = firstUserMessage?.content || 'No query provided';

        // Assign to available agent
        const assignedAgent = await this.assignToAvailableAgent();

        // Create ticket
        const ticketData = {
            query: query,
            category: 'General',
            priority: 'medium',
            status: assignedAgent ? 'assigned' : 'open',
            conversationId: conversationId,
            channel: conversation.channel,
            assignedAgentId: assignedAgent?.uid || null,
            assignedAt: assignedAgent ? new Date() : null,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const ticketRef = await this.db.collection('tickets').add(ticketData);

        // Update conversation status
        await this.db.collection('conversations').doc(conversationId).update({
            status: 'escalated',
            ticketId: ticketRef.id,
            escalatedAt: new Date(),
            updatedAt: new Date()
        });

        console.log(`[Conversation] Created ticket ${ticketRef.id} from conversation ${conversationId}`);
        if (assignedAgent) {
            console.log(`[Conversation] Assigned to agent: ${assignedAgent.name} (${assignedAgent.email})`);
        }

        return {
            id: ticketRef.id,
            ...ticketData,
            assignedAgent: assignedAgent
        };
    }

    /**
     * Assign ticket to available agent with lowest load
     */
    async assignToAvailableAgent() {
        // Get all available agents
        const agentsSnap = await this.db.collection('agents')
            .where('isAvailable', '==', true).get();

        if (agentsSnap.empty) {
            console.log('[Conversation] No available agents found');
            return null;
        }

        // Get all active tickets
        const ticketsSnap = await this.db.collection('tickets').get();
        const activeTickets = ticketsSnap.docs
            .map(doc => doc.data())
            .filter(ticket => ticket.status !== 'resolved');

        // Count tickets per agent
        const agentLoads = {};
        activeTickets.forEach(ticket => {
            if (ticket.assignedAgentId) {
                agentLoads[ticket.assignedAgentId] = (agentLoads[ticket.assignedAgentId] || 0) + 1;
            }
        });

        // Find agent with lowest load
        let selectedAgent = null;
        let lowestLoad = Infinity;

        agentsSnap.docs.forEach(doc => {
            const agent = { id: doc.id, ...doc.data() };
            const currentLoad = agentLoads[agent.uid] || 0;

            if (currentLoad < lowestLoad) {
                lowestLoad = currentLoad;
                selectedAgent = agent;
            }
        });

        console.log(`[Conversation] Selected agent ${selectedAgent.name} with load ${lowestLoad}`);

        return selectedAgent;
    }

    /**
     * Get conversation history
     */
    async getConversationHistory(conversationId) {
        const conversationSnap = await this.db.collection('conversations').doc(conversationId).get();
        const messagesSnap = await this.db.collection('conversations').doc(conversationId)
            .collection('messages').orderBy('timestamp', 'asc').get();

        const messages = messagesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return {
            conversation: { id: conversationId, ...conversationSnap.data() },
            messages: messages
        };
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Singleton
let conversationInstance = null;

export function getConversationService() {
    if (!conversationInstance) {
        conversationInstance = new ConversationService();
    }
    return conversationInstance;
}

export default ConversationService;
