import express from 'express';
import { getLLMService } from '../core/llm/index.js';
import { getPIIService } from '../core/pii/index.js';
import { getClassifier } from '../core/classifier/index.js';
import { getKBService } from '../core/kb/index.js';

const router = express.Router();

/**
 * Demo Routes
 * For testing the core engine functionality
 */

/**
 * POST /api/demo/classify
 * Test ticket classification
 */
router.post('/classify', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Text is required',
            });
        }

        const classifier = getClassifier();
        const result = await classifier.classify(text);

        res.json({
            success: true,
            text,
            classification: result,
            isSimple: classifier.isSimple(result.complexity),
            isComplex: classifier.isComplex(result.complexity),
        });
    } catch (error) {
        console.error('[Demo] Classify error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/demo/llm
 * Test LLM integration
 */
router.post('/llm', async (req, res) => {
    try {
        const { message, anonymize = true } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required',
            });
        }

        const llmService = getLLMService();
        const piiService = getPIIService();

        let promptToSend = message;
        let piiResult = null;

        // Anonymize if requested
        if (anonymize) {
            piiResult = piiService.anonymizeForLLM(message);
            promptToSend = piiResult.anonymizedText;
        }

        // Generate response
        const response = await llmService.generateResponse(promptToSend);

        res.json({
            success: true,
            original: message,
            sentToLLM: promptToSend,
            piiDetected: piiResult?.summary || null,
            response: {
                message: response.message,
                provider: response.provider,
                model: response.model,
                latencyMs: response.latencyMs,
                usedFallback: response.usedFallback || false,
            },
        });
    } catch (error) {
        console.error('[Demo] LLM error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/demo/pii
 * Test PII detection and anonymization
 */
router.post('/pii', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Text is required',
            });
        }

        const piiService = getPIIService();

        // Detect PII
        const detected = piiService.detect(text);

        // Anonymize for LLM
        const forLLM = piiService.anonymizeForLLM(text);

        // Restore for agent (simulating agent view)
        const forAgent = piiService.restoreForAgent(forLLM.anonymizedText, forLLM.tokenMap);

        // Fully masked for logs
        const forLogs = piiService.maskForDisplay(text);

        res.json({
            success: true,
            original: text,
            detected: detected.map(d => ({
                type: d.type,
                value: d.value,
                permanentlyMasked: d.permanentlyMasked,
            })),
            forLLM: {
                text: forLLM.anonymizedText,
                summary: forLLM.summary,
            },
            forAgent: {
                text: forAgent.restoredText,
                permanentlyMasked: forAgent.permanentlyMasked,
            },
            forLogs: forLogs,
        });
    } catch (error) {
        console.error('[Demo] PII error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/demo/full-flow
 * Test the complete flow: anonymize → LLM → restore for agent
 */
router.post('/full-flow', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required',
            });
        }

        const llmService = getLLMService();
        const piiService = getPIIService();

        // Step 1: Anonymize for LLM
        const anonymized = piiService.anonymizeForLLM(message);

        // Step 2: Send to LLM
        const llmResponse = await llmService.generateResponse(anonymized.anonymizedText);

        // Step 3: Restore for agent view
        const agentView = piiService.restoreForAgent(message, anonymized.tokenMap);

        res.json({
            success: true,
            flow: {
                step1_original: message,
                step2_anonymized: anonymized.anonymizedText,
                step3_llmResponse: llmResponse.message,
                step4_agentView: agentView.restoredText,
            },
            piiSummary: anonymized.summary,
            llmInfo: {
                provider: llmResponse.provider,
                model: llmResponse.model,
                latencyMs: llmResponse.latencyMs,
                usedFallback: llmResponse.usedFallback || false,
            },
            permanentlyMasked: agentView.permanentlyMasked,
        });
    } catch (error) {
        console.error('[Demo] Full flow error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/demo/health
 * Check LLM provider health
 */
router.get('/health', async (req, res) => {
    try {
        const llmService = getLLMService();
        const health = await llmService.getHealthStatus();

        res.json({
            success: true,
            health,
            config: llmService.getConfig(),
        });
    } catch (error) {
        console.error('[Demo] Health check error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
