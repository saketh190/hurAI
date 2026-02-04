/**
 * Database Service
 * Handles Firestore operations for tickets and agents
 */
import { getFirestore } from '../../config/firebase.config.js';

export class DatabaseService {
    constructor() {
        this.db = null;
        this.ticketsCollection = 'tickets';
        this.agentsCollection = 'agents';
    }

    initialize() {
        if (!this.db) {
            this.db = getFirestore();
        }
        return this.db;
    }

    // ==================== TICKET OPERATIONS ====================

    /**
     * Create a new ticket
     */
    async createTicket(ticketData) {
        this.initialize();

        const ticket = {
            query: ticketData.query,
            status: 'open',
            complexity: ticketData.complexity || 5,
            category: ticketData.category || 'general',
            createdAt: new Date(),
            updatedAt: new Date(),

            // Escalation tracking
            selfServiceAttempts: 0,
            escalatedAt: null,
            escalationReason: null,

            // Agent assignment
            assignedAgentId: null,
            assignedAt: null,

            // Conversation history
            messages: [],
        };

        const docRef = await this.db.collection(this.ticketsCollection).add(ticket);
        console.log(`[DB] Created ticket: ${docRef.id}`);

        return { id: docRef.id, ...ticket };
    }

    /**
     * Get a ticket by ID
     */
    async getTicket(ticketId) {
        this.initialize();
        const doc = await this.db.collection(this.ticketsCollection).doc(ticketId).get();

        if (!doc.exists) {
            return null;
        }

        return { id: doc.id, ...doc.data() };
    }

    /**
     * Update a ticket
     */
    async updateTicket(ticketId, updates) {
        this.initialize();

        const updateData = {
            ...updates,
            updatedAt: new Date(),
        };

        await this.db.collection(this.ticketsCollection).doc(ticketId).update(updateData);
        console.log(`[DB] Updated ticket: ${ticketId}`);

        return this.getTicket(ticketId);
    }

    /**
     * Increment self-service attempts
     */
    async incrementAttempts(ticketId) {
        this.initialize();
        const ticket = await this.getTicket(ticketId);

        if (!ticket) return null;

        return this.updateTicket(ticketId, {
            selfServiceAttempts: (ticket.selfServiceAttempts || 0) + 1,
        });
    }

    /**
     * Add message to ticket conversation
     */
    async addMessage(ticketId, role, content) {
        this.initialize();
        const ticket = await this.getTicket(ticketId);

        if (!ticket) return null;

        const message = {
            role, // 'user' | 'assistant' | 'agent'
            content,
            timestamp: new Date(),
        };

        const messages = ticket.messages || [];
        messages.push(message);

        return this.updateTicket(ticketId, { messages });
    }

    /**
     * Get open tickets (for agent dashboard)
     * Note: Sorting in memory to avoid composite index requirement
     */
    async getOpenTickets() {
        this.initialize();
        const snapshot = await this.db
            .collection(this.ticketsCollection)
            .where('status', 'in', ['open', 'escalated'])
            .get();

        // Sort in memory to avoid composite index requirement
        const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return tickets.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
            return dateB - dateA; // Descending order
        });
    }

    /**
     * Get tickets by status
     * Note: Sorting in memory to avoid composite index requirement
     */
    async getTicketsByStatus(status) {
        this.initialize();
        const snapshot = await this.db
            .collection(this.ticketsCollection)
            .where('status', '==', status)
            .get();

        // Sort in memory to avoid composite index requirement
        const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return tickets.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
            return dateB - dateA; // Descending order
        });
    }

    // ==================== AGENT OPERATIONS ====================

    /**
     * Create or update an agent
     */
    async upsertAgent(agentData) {
        this.initialize();

        const agent = {
            name: agentData.name,
            email: agentData.email,
            skills: agentData.skills || ['general'],
            isAvailable: agentData.isAvailable !== false,
            currentLoad: agentData.currentLoad || 0,
            maxLoad: agentData.maxLoad || 5,
            updatedAt: new Date(),
        };

        if (agentData.id) {
            await this.db.collection(this.agentsCollection).doc(agentData.id).set(agent, { merge: true });
            return { id: agentData.id, ...agent };
        } else {
            const docRef = await this.db.collection(this.agentsCollection).add({
                ...agent,
                createdAt: new Date(),
            });
            return { id: docRef.id, ...agent };
        }
    }

    /**
     * Get available agents
     */
    async getAvailableAgents() {
        this.initialize();
        const snapshot = await this.db
            .collection(this.agentsCollection)
            .where('isAvailable', '==', true)
            .get();

        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(agent => agent.currentLoad < agent.maxLoad);
    }

    /**
     * Get available agents by skill/category
     */
    async getAvailableAgentsBySkill(skill) {
        this.initialize();
        const agents = await this.getAvailableAgents();
        return agents.filter(agent => agent.skills.includes(skill) || agent.skills.includes('general'));
    }

    /**
     * Get all agents
     */
    async getAllAgents() {
        this.initialize();
        const snapshot = await this.db.collection(this.agentsCollection).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    /**
     * Update agent load
     */
    async updateAgentLoad(agentId, increment = 1) {
        this.initialize();
        const agentDoc = await this.db.collection(this.agentsCollection).doc(agentId).get();

        if (!agentDoc.exists) return null;

        const agent = agentDoc.data();
        const newLoad = Math.max(0, (agent.currentLoad || 0) + increment);

        await this.db.collection(this.agentsCollection).doc(agentId).update({
            currentLoad: newLoad,
            updatedAt: new Date(),
        });

        return { id: agentId, ...agent, currentLoad: newLoad };
    }
}

// Singleton instance
let dbInstance = null;

export function getDatabase() {
    if (!dbInstance) {
        dbInstance = new DatabaseService();
    }
    return dbInstance;
}

export default DatabaseService;
