/**
 * Cleanup script to remove invalid ticket assignments
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

async function cleanupTickets() {
    console.log('🧹 Cleaning up invalid ticket assignments...\n');

    try {
        // Get all valid agent UIDs
        const agentsSnap = await db.collection('agents').get();
        const validUIDs = new Set();
        agentsSnap.forEach(doc => {
            validUIDs.add(doc.data().uid);
        });
        console.log(`✅ Found ${validUIDs.size} valid agent(s)\n`);

        // Check all tickets
        const ticketsSnap = await db.collection('tickets').get();
        const batch = db.batch();
        let fixed = 0;

        ticketsSnap.forEach(doc => {
            const ticket = doc.data();

            // If ticket has assignedAgentId but it doesn't exist
            if (ticket.assignedAgentId && !validUIDs.has(ticket.assignedAgentId)) {
                console.log(`🔧 Fixing ticket #${doc.id.slice(0, 8)}`);
                console.log(`   Removing invalid agent: ${ticket.assignedAgentId}`);

                // Unassign the ticket
                batch.update(doc.ref, {
                    assignedAgentId: admin.firestore.FieldValue.delete(),
                    assignedAt: admin.firestore.FieldValue.delete(),
                    status: 'open'
                });
                fixed++;
            }
        });

        if (fixed > 0) {
            await batch.commit();
            console.log(`\n✅ Fixed ${fixed} ticket(s) - removed invalid assignments`);
        } else {
            console.log('✅ All tickets have valid assignments!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit();
    }
}

cleanupTickets();
