/**
 * Debug script to check all agents and tickets
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '..', 'serviceAccountKey.json'), 'utf8')
);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function debugAll() {
    console.log('='.repeat(60));
    console.log('🔍 DEBUGGING AGENTS AND TICKETS');
    console.log('='.repeat(60));

    // Get all agents
    console.log('\n📋 AGENTS COLLECTION:');
    console.log('-'.repeat(40));
    const agentsSnap = await db.collection('agents').get();
    const agentMap = {};

    agentsSnap.forEach(doc => {
        const data = doc.data();
        agentMap[data.uid] = data.name;
        console.log(`\nDocument ID: ${doc.id}`);
        console.log(`  Name: ${data.name}`);
        console.log(`  Email: ${data.email}`);
        console.log(`  UID: ${data.uid}`);
        console.log(`  isAvailable: ${data.isAvailable}`);
    });

    // Get all tickets
    console.log('\n\n🎫 TICKETS COLLECTION:');
    console.log('-'.repeat(40));
    const ticketsSnap = await db.collection('tickets').get();

    ticketsSnap.forEach(doc => {
        const data = doc.data();
        const agentName = data.assignedAgentId ? (agentMap[data.assignedAgentId] || 'NOT FOUND') : 'None';

        console.log(`\nTicket ID: ${doc.id.slice(0, 10)}...`);
        console.log(`  Query: ${data.query?.slice(0, 50)}...`);
        console.log(`  Status: ${data.status}`);
        console.log(`  assignedAgentId: ${data.assignedAgentId || 'NOT SET'}`);
        console.log(`  Agent Name Lookup: ${agentName}`);

        if (data.assignedAgentId && !agentMap[data.assignedAgentId]) {
            console.log(`  ⚠️  WARNING: Agent UID not found in agents collection!`);
        }
    });

    // Check users collection
    console.log('\n\n👤 USERS COLLECTION (roles):');
    console.log('-'.repeat(40));
    const usersSnap = await db.collection('users').get();

    usersSnap.forEach(doc => {
        const data = doc.data();
        console.log(`\nDocument ID (UID): ${doc.id}`);
        console.log(`  Role: ${data.role}`);
        console.log(`  Email: ${data.email}`);
    });

    process.exit(0);
}

debugAll().catch(console.error);
