/**
 * Debug script to check Firestore users collection
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

async function checkFirestore() {
    console.log('🔍 Checking Firestore users collection...\n');

    try {
        const usersSnapshot = await db.collection('users').get();

        console.log(`Found ${usersSnapshot.size} user(s) in Firestore:\n`);

        usersSnapshot.forEach(doc => {
            console.log(`📄 Document ID: ${doc.id}`);
            console.log(`   Data:`, JSON.stringify(doc.data(), null, 2));
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit();
    }
}

checkFirestore();
