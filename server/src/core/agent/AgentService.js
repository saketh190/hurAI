/**
 * Agent Service (US-15)
 * Handles agent assignment and management
 */
import { getDatabase } from '../database/index.js';

export class AgentService {
    constructor() {
        this.db = null;
    }

    initialize() {
        if (!this.db) {
            this.db = getDatabase();
        }
    }

    /**
     * Register a new agent
     * @param {Object} agentData - { name, email, skills, maxLoad }
     * @returns {Object} Created agent
     */
    async registerAgent(agentData) {
        this.initialize();

        const agent = await this.db.upsertAgent({
            name: agentData.name,
            email: agentData.email,
            skills: agentData.skills || ['general'],
            isAvailable: true,
            currentLoad: 0,
            maxLoad: agentData.maxLoad || 5,
        });

        console.log(`[Agent] Registered: ${agent.name} (${agent.id})`);
        return agent;
    }

    /**
     * Find and assign the best available agent for a ticket
     * @param {Object} ticket - Ticket object
     * @returns {Object|null} Assigned agent or null if none available
     */
    async assignBestAgent(ticket) {
        this.initialize();

        const category = ticket.category || 'general';

        // 1. Try to find agent with matching skill
        let availableAgents = await this.db.getAvailableAgentsBySkill(category);

        // 2. Fall back to any available agent
        if (availableAgents.length === 0) {
            availableAgents = await this.db.getAvailableAgents();
        }

        if (availableAgents.length === 0) {
            console.log(`[Agent] No available agents for ticket ${ticket.id}`);
            return null;
        }

        // 3. Select agent with lowest load (least-loaded strategy)
        const selectedAgent = availableAgents.reduce((best, current) => {
            return (current.currentLoad < best.currentLoad) ? current : best;
        });

        // 4. Assign ticket to agent
        await this.db.updateTicket(ticket.id, {
            status: 'assigned',
            assignedAgentId: selectedAgent.id,
            assignedAt: new Date(),
        });

        // 5. Increment agent load
        await this.db.updateAgentLoad(selectedAgent.id, 1);

        console.log(`[Agent] Assigned ticket ${ticket.id} to ${selectedAgent.name}`);

        return selectedAgent;
    }

    /**
     * Release a ticket from an agent (when resolved)
     * @param {string} ticketId - Ticket ID
     * @returns {boolean} Success
     */
    async releaseTicket(ticketId) {
        this.initialize();

        const ticket = await this.db.getTicket(ticketId);
        if (!ticket || !ticket.assignedAgentId) {
            return false;
        }

        // Decrement agent load
        await this.db.updateAgentLoad(ticket.assignedAgentId, -1);

        // Update ticket status
        await this.db.updateTicket(ticketId, {
            status: 'resolved',
        });

        console.log(`[Agent] Released ticket ${ticketId}`);
        return true;
    }

    /**
     * Set agent availability
     * @param {string} agentId - Agent ID
     * @param {boolean} isAvailable - Availability status
     */
    async setAgentAvailability(agentId, isAvailable) {
        this.initialize();

        await this.db.upsertAgent({
            id: agentId,
            isAvailable,
        });

        console.log(`[Agent] ${agentId} availability set to ${isAvailable}`);
    }

    /**
     * Get all agents with their current status
     */
    async getAgentStatus() {
        this.initialize();

        const agents = await this.db.getAllAgents();
        return agents.map(agent => ({
            id: agent.id,
            name: agent.name,
            email: agent.email,
            skills: agent.skills,
            isAvailable: agent.isAvailable,
            currentLoad: agent.currentLoad,
            maxLoad: agent.maxLoad,
            hasCapacity: agent.currentLoad < agent.maxLoad,
        }));
    }

    /**
     * Get tickets assigned to a specific agent
     * @param {string} agentId - Agent ID
     */
    async getAgentTickets(agentId) {
        this.initialize();

        const tickets = await this.db.getTicketsByStatus('assigned');
        return tickets.filter(t => t.assignedAgentId === agentId);
    }
}

// Singleton instance
let agentInstance = null;

export function getAgentService() {
    if (!agentInstance) {
        agentInstance = new AgentService();
    }
    return agentInstance;
}

export default AgentService;
