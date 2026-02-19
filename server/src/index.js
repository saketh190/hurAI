import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import demoRoutes from './routes/demo.routes.js';
import kbRoutes from './routes/kb.routes.js';
import routerRoutes from './routes/router.routes.js';
import conversationRoutes from './routes/conversation.routes.js';
import kbTestRoutes from './routes/kb-test.routes.js';
import { getLLMService } from './core/llm/index.js';
import { initializeFirebase } from './config/firebase.config.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (test console)
app.use(express.static(path.join(__dirname, '../public')));

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Routes - AI/LLM Core Engine Only
app.use('/api/demo', demoRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/router', routerRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/kb-test', kbTestRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'hurAI Core Engine - AI/LLM Services',
        version: '2.0.0',
        status: 'running',
        description: 'AI-powered classification, routing, and knowledge base search. CRUD operations handled by UI.',
        endpoints: {
            conversation: {
                start: 'POST /api/conversation/start',
                message: 'POST /api/conversation/:id/message',
                history: 'GET /api/conversation/:id',
                agentMessage: 'POST /api/conversation/:id/agent-message',
            },
            router: {
                query: 'POST /api/router/query',
                config: 'GET /api/router/config',
            },
            demo: {
                classify: 'POST /api/demo/classify',
                llm: 'POST /api/demo/llm',
                pii: 'POST /api/demo/pii',
                fullFlow: 'POST /api/demo/full-flow',
                health: 'GET /api/demo/health',
            },
            kb: {
                index: 'POST /api/kb/index',
                search: 'POST /api/kb/search',
                chunks: 'GET /api/kb/chunks',
                articles: 'GET /api/kb/articles/:id',
            },
        },
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('[Server Error]', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message,
    });
});

// Start server
async function start() {
    try {
        // Initialize Firebase
        console.log('[Server] Initializing Firebase...');
        initializeFirebase();

        // Initialize LLM service
        console.log('[Server] Initializing LLM service...');
        const llmService = getLLMService();
        await llmService.initialize();

        // Start listening
        app.listen(PORT, () => {
            console.log(`\n========================================`);
            console.log(`  hurAI Core Engine v2.0`);
            console.log(`  AI/LLM Services Only`);
            console.log(`  Server: http://localhost:${PORT}`);
            console.log(`========================================\n`);
            console.log('🤖 AI/LLM Endpoints:');
            console.log('\n📊 Demo/Testing:');
            console.log('  POST /api/demo/classify    - Classify ticket');
            console.log('  POST /api/demo/llm         - Test LLM');
            console.log('  POST /api/demo/pii         - Test PII');
            console.log('  POST /api/demo/full-flow   - Complete flow');
            console.log('  GET  /api/demo/health      - Health check');
            console.log('\n📚 Knowledge Base:');
            console.log('  POST /api/kb/index         - Index KB files');
            console.log('  POST /api/kb/search        - Search KB');
            console.log('  GET  /api/kb/chunks        - List chunks');
            console.log('  GET  /api/kb/articles/:id  - Get article');
            console.log('\n🔀 Intelligent Router:');
            console.log('  POST /api/router/query     - Self-service query');
            console.log('  GET  /api/router/config    - Router config');
            console.log('\n💬 Conversations:');
            console.log('  POST /api/conversation/start           - Start conversation');
            console.log('  POST /api/conversation/:id/message     - Send message');
            console.log('  GET  /api/conversation/:id             - Get history');
            console.log('  POST /api/conversation/:id/agent-message - Agent response');
            console.log('\n💡 Note: Ticket/Agent CRUD handled by UI (direct Firestore)\n');
        });
    } catch (error) {
        console.error('[Server] Failed to start:', error);
        process.exit(1);
    }
}

start();
