/**
 * Escalation Service (US-14)
 * Handles escalation triggers and logic
 */
import { getDatabase } from '../database/index.js';

export class EscalationService {
    constructor() {
        this.db = null;

        // Escalation configuration
        this.config = {
            maxSelfServiceAttempts: 3,          // Max attempts before escalation
            timeoutMinutes: 10,                  // Time before auto-escalation
            escalationKeywords: [
                'talk to agent',
                'speak to human',
                'human agent',
                'real person',
                'escalate',
                'supervisor',
                'manager',
                'not helpful',
                'doesn\'t work',
                'still not working',
            ],
            frustrationKeywords: [
                'frustrated',
                'angry',
                'useless',
                'terrible',
                'worst',
                'hate',
                'stupid',
                'ridiculous',
            ],
        };
    }

    initialize() {
        if (!this.db) {
            this.db = getDatabase();
        }
    }

    /**
     * Check if a message contains escalation triggers
     * @param {string} message - User message
     * @returns {Object} { shouldEscalate, reason, trigger }
     */
    checkMessageForEscalation(message) {
        const lowerMessage = message.toLowerCase();

        // Check for explicit escalation requests
        for (const keyword of this.config.escalationKeywords) {
            if (lowerMessage.includes(keyword)) {
                return {
                    shouldEscalate: true,
                    reason: 'User requested human agent',
                    trigger: 'keyword',
                    keyword: keyword,
                };
            }
        }

        // Check for frustration signals
        for (const keyword of this.config.frustrationKeywords) {
            if (lowerMessage.includes(keyword)) {
                return {
                    shouldEscalate: true,
                    reason: 'User frustration detected',
                    trigger: 'frustration',
                    keyword: keyword,
                };
            }
        }

        return {
            shouldEscalate: false,
            reason: null,
            trigger: null,
        };
    }

    /**
     * Check if ticket should be escalated based on attempts
     * @param {Object} ticket - Ticket object
     * @returns {Object} { shouldEscalate, reason }
     */
    checkAttemptsForEscalation(ticket) {
        if (ticket.selfServiceAttempts >= this.config.maxSelfServiceAttempts) {
            return {
                shouldEscalate: true,
                reason: `Max self-service attempts reached (${ticket.selfServiceAttempts}/${this.config.maxSelfServiceAttempts})`,
                trigger: 'attempts',
            };
        }

        return {
            shouldEscalate: false,
            reason: null,
        };
    }

    /**
     * Check if ticket should be escalated based on time
     * @param {Object} ticket - Ticket object
     * @returns {Object} { shouldEscalate, reason }
     */
    checkTimeForEscalation(ticket) {
        const createdAt = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
        const now = new Date();
        const minutesElapsed = (now - createdAt) / (1000 * 60);

        if (minutesElapsed >= this.config.timeoutMinutes && ticket.status === 'open') {
            return {
                shouldEscalate: true,
                reason: `Timeout reached (${Math.floor(minutesElapsed)} minutes)`,
                trigger: 'timeout',
            };
        }

        return {
            shouldEscalate: false,
            reason: null,
        };
    }

    /**
     * Process escalation for a ticket
     * @param {string} ticketId - Ticket ID
     * @param {string} reason - Escalation reason
     * @returns {Object} Updated ticket
     */
    async escalateTicket(ticketId, reason) {
        this.initialize();

        const updatedTicket = await this.db.updateTicket(ticketId, {
            status: 'escalated',
            escalatedAt: new Date(),
            escalationReason: reason,
        });

        console.log(`[Escalation] Ticket ${ticketId} escalated: ${reason}`);
        return updatedTicket;
    }

    /**
     * Check all escalation conditions for a ticket
     * @param {Object} ticket - Ticket object
     * @param {string} latestMessage - Optional latest user message
     * @returns {Object} { shouldEscalate, reason, trigger }
     */
    async checkAllEscalationConditions(ticket, latestMessage = null) {
        // 1. Check message for explicit escalation
        if (latestMessage) {
            const messageCheck = this.checkMessageForEscalation(latestMessage);
            if (messageCheck.shouldEscalate) {
                return messageCheck;
            }
        }

        // 2. Check attempts
        const attemptsCheck = this.checkAttemptsForEscalation(ticket);
        if (attemptsCheck.shouldEscalate) {
            return attemptsCheck;
        }

        // 3. Check timeout
        const timeCheck = this.checkTimeForEscalation(ticket);
        if (timeCheck.shouldEscalate) {
            return timeCheck;
        }

        return {
            shouldEscalate: false,
            reason: null,
            trigger: null,
        };
    }
}

// Singleton instance
let escalationInstance = null;

export function getEscalationService() {
    if (!escalationInstance) {
        escalationInstance = new EscalationService();
    }
    return escalationInstance;
}

export default EscalationService;
