import { getLLMService } from '../llm/index.js';

/**
 * Draft Generator
 * Generates KB article drafts from resolved tickets
 */
export class DraftGenerator {
    constructor() {
        this.llmService = null;
    }

    async initialize() {
        this.llmService = getLLMService();
    }

    /**
     * Generate a KB article draft from a resolved ticket
     * @param {Object} ticket - The resolved ticket
     * @returns {Object} Draft article
     */
    async generateDraft(ticket) {
        if (!this.llmService) {
            await this.initialize();
        }

        const { issue, resolution, category } = ticket;

        const prompt = `Create a brief KB article from this resolved ticket:

Issue: ${issue}
Resolution: ${resolution}
Category: ${category || 'general'}

Format as:
### [Title]
**Problem:** [1 sentence]
**Solution:** [Numbered steps, max 5]

Keep it short and actionable.`;

        try {
            const response = await this.llmService.generateResponse(prompt);

            if (!response.success) {
                return null;
            }

            // Parse the generated content
            const content = response.message;
            const titleMatch = content.match(/###\s+(.+)/);
            const problemMatch = content.match(/\*\*Problem:\*\*\s*(.+)/);
            const solutionMatch = content.match(/\*\*Solution:\*\*([\s\S]+?)(?=$)/);

            return {
                title: titleMatch ? titleMatch[1].trim() : 'Untitled',
                problem: problemMatch ? problemMatch[1].trim() : issue,
                solution: solutionMatch ? solutionMatch[1].trim() : resolution,
                content,
                category: category || 'general',
                status: 'draft',
                createdAt: new Date().toISOString(),
                sourceTicket: ticket.id || null,
            };
        } catch (error) {
            console.error('[DraftGenerator] Error:', error.message);
            return null;
        }
    }
}

// Singleton
let draftInstance = null;

export function getDraftGenerator() {
    if (!draftInstance) {
        draftInstance = new DraftGenerator();
    }
    return draftInstance;
}

export default DraftGenerator;
