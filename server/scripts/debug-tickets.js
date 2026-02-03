/**
 * Debug script to check ticket assignments
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

async function debugTickets() {
    console.log('🔍 Checking tickets and agents...\n');

    try {
        // Get all agents
        const agentsSnap = await db.collection('agents').get();
        console.log('📋 Agents in database:');
        const agentUIDs = [];
        agentsSnap.forEach(doc => {
            const data = doc.data();
            agentUIDs.push(data.uid);
            console.log(`   - ${data.name} (UID: ${data.uid})`);
        });
        console.log('');

        // Get all tickets
        const ticketsSnap = await db.collection('tickets').get();
        console.log(`🎫 Total tickets: ${ticketsSnap.size}\n`);

        ticketsSnap.forEach(doc => {
            const ticket = doc.data();
            const ticketId = doc.id.slice(0, 8);

            if (ticket.assignedAgentId) {
                const agentExists = agentUIDs.includes(ticket.assignedAgentId);
                const status = agentExists ? '✅' : '❌';
                console.log(`${status} Ticket #${ticketId}`);
                console.log(`   Query: ${ticket.query?.slice(0, 50)}...`);
                console.log(`   Assigned to UID: ${ticket.assignedAgentId}`);
                console.log(`   Agent exists: ${agentExists}`);
                console.log('');
            } else {
                console.log(`⚪ Ticket #${ticketId} - Unassigned`);
                console.log(`   Query: ${ticket.query?.slice(0, 50)}...`);
                console.log('');
            }
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit();
    }
}

debugTickets();
