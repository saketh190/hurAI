// Standalone KB Diagnostic Script
// Run: node test-kb.js
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX || 'hurai';

console.log('='.repeat(60));
console.log('KB DIAGNOSTIC SCRIPT');
console.log('='.repeat(60));
console.log(`GOOGLE_API_KEY: ${GOOGLE_API_KEY ? GOOGLE_API_KEY.substring(0, 15) + '...' : '❌ MISSING'}`);
console.log(`PINECONE_API_KEY: ${PINECONE_API_KEY ? PINECONE_API_KEY.substring(0, 15) + '...' : '❌ MISSING'}`);
console.log(`PINECONE_INDEX: ${PINECONE_INDEX}`);
console.log('');

// ---- STEP 1: Test file reading ----
async function testFileReading() {
    console.log('STEP 1: Reading KB file...');
    const kbPath = path.resolve(__dirname, '..', 'kb', 'ms-office-support.txt');
    console.log(`  Path: ${kbPath}`);

    try {
        const content = await fs.readFile(kbPath, 'utf-8');
        console.log(`  ✅ File read OK - ${content.length} chars, ${content.split('\n').length} lines`);
        console.log(`  Preview: "${content.substring(0, 100).replace(/\n/g, '\\n')}"`);
        return content;
    } catch (err) {
        console.error(`  ❌ File read FAILED: ${err.message}`);
        return null;
    }
}

// ---- STEP 2: Test chunking ----
function testChunking(content) {
    console.log('\nSTEP 2: Testing chunking...');

    const chunkSize = 500;
    const chunkOverlap = 100;

    const cleanedContent = content
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    console.log(`  Cleaned content length: ${cleanedContent.length} chars`);
    console.log(`  Chunk size: ${chunkSize}, Overlap: ${chunkOverlap}`);

    if (cleanedContent.length <= chunkSize) {
        console.log(`  Content fits in single chunk (${cleanedContent.length} <= ${chunkSize})`);
        return [{ content: cleanedContent, index: 0 }];
    }

    const chunks = [];
    let currentPos = 0;
    let chunkIndex = 0;

    while (currentPos < cleanedContent.length) {
        let endPos = Math.min(currentPos + chunkSize, cleanedContent.length);
        const chunkText = cleanedContent.slice(currentPos, endPos).trim();

        if (chunkText.length > 0) {
            chunks.push({ content: chunkText, index: chunkIndex });
            chunkIndex++;
        }

        currentPos = endPos - chunkOverlap;
        if (currentPos <= 0) currentPos = endPos;
    }

    console.log(`  ✅ Created ${chunks.length} chunks`);
    chunks.forEach((c, i) => {
        console.log(`  Chunk ${i}: ${c.content.length} chars - "${c.content.substring(0, 60).replace(/\n/g, '\\n')}..."`);
    });

    return chunks;
}

// ---- STEP 3: Test embedding ----
async function testEmbedding(text) {
    console.log('\nSTEP 3: Testing Gemini embedding...');
    console.log(`  Model: embedding-001`);
    console.log(`  Text: "${text.substring(0, 80)}..."`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${GOOGLE_API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'models/embedding-001',
                content: { parts: [{ text }] }
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error(`  ❌ Embedding FAILED: ${data.error.message}`);
            console.error(`  Error code: ${data.error.code}`);

            // Try alternative model names
            console.log('\n  Trying alternative model: text-embedding-004...');
            const url2 = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GOOGLE_API_KEY}`;
            const r2 = await fetch(url2, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'models/text-embedding-004',
                    content: { parts: [{ text }] }
                })
            });
            const d2 = await r2.json();
            if (d2.error) {
                console.error(`  ❌ text-embedding-004 also failed: ${d2.error.message}`);
            } else {
                console.log(`  ✅ text-embedding-004 WORKS! Dimensions: ${d2.embedding?.values?.length}`);
                return { model: 'text-embedding-004', embedding: d2.embedding?.values };
            }
            return null;
        }

        const dims = data.embedding?.values?.length;
        console.log(`  ✅ Embedding OK! Dimensions: ${dims}`);
        return { model: 'embedding-001', embedding: data.embedding?.values };
    } catch (err) {
        console.error(`  ❌ Network error: ${err.message}`);
        return null;
    }
}

// ---- STEP 4: List available embedding models ----
async function listEmbeddingModels() {
    console.log('\nSTEP 4: Listing available embedding models...');

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_API_KEY}`
        );
        const data = await response.json();

        if (data.error) {
            console.error(`  ❌ Error: ${data.error.message}`);
            return;
        }

        const embeddingModels = (data.models || [])
            .filter(m => m.supportedGenerationMethods?.includes('embedContent'))
            .map(m => m.name.replace('models/', ''));

        if (embeddingModels.length === 0) {
            console.log('  ❌ No embedding models found!');
        } else {
            console.log(`  ✅ Found ${embeddingModels.length} embedding model(s):`);
            embeddingModels.forEach(m => console.log(`    - ${m}`));
        }

        return embeddingModels;
    } catch (err) {
        console.error(`  ❌ Network error: ${err.message}`);
    }
}

// ---- RUN ALL STEPS ----
async function runDiagnostics() {
    const content = await testFileReading();
    if (!content) return;

    const chunks = testChunking(content);

    await listEmbeddingModels();

    if (chunks.length > 0) {
        const result = await testEmbedding(chunks[0].content);
        if (result) {
            console.log(`\n✅ WORKING MODEL: ${result.model}`);
            console.log(`   Update kb.config.js: model: '${result.model}'`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('DIAGNOSTICS COMPLETE');
    console.log('='.repeat(60));
}

runDiagnostics().catch(console.error);
