/**
 * Firebase Database Initialization Script
 * Run this to properly set up your Firebase environment with:
 * - Admin user role
 * - Clean up inconsistent agent data
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

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function initializeDatabase() {
    console.log('🚀 Starting Firebase Database Initialization...\n');

    try {
        // 1. Set up admin user
        await setupAdminUser();

        // 2. Clean up agents collection
        await cleanupAgents();

        // 3. Clean up users collection
        await cleanupUsers();

        console.log('\n✅ Database initialization complete!');
    } catch (error) {
        console.error('❌ Error during initialization:', error);
    } finally {
        process.exit();
    }
}

async function setupAdminUser() {
    console.log('📋 Setting up admin user...');

    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin123';

    try {
        // Check if admin exists in Auth
        let adminUser;
        try {
            adminUser = await auth.getUserByEmail(adminEmail);
            console.log(`   ✓ Admin user already exists in Auth: ${adminUser.uid}`);
        } catch (error) {
            // Create admin user in Auth
            adminUser = await auth.createUser({
                email: adminEmail,
                password: adminPassword,
                displayName: 'Admin'
            });
            console.log(`   ✓ Created admin user in Auth: ${adminUser.uid}`);
        }

        // Set up admin role in Firestore
        await db.collection('users').doc(adminUser.uid).set({
            role: 'admin',
            email: adminEmail,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`   ✓ Admin role set in Firestore`);
        console.log(`   📧 Email: ${adminEmail}`);
        console.log(`   🔑 Password: ${adminPassword}\n`);

    } catch (error) {
        console.error('   ❌ Error setting up admin:', error.message);
    }
}

async function cleanupAgents() {
    console.log('🧹 Cleaning up agents collection...');

    try {
        const agentsSnapshot = await db.collection('agents').get();
        const batch = db.batch();
        let updated = 0;

        for (const doc of agentsSnapshot.docs) {
            const agent = doc.data();

            // Standardize field names
            const updates = {};
            let needsUpdate = false;

            // Fix available -> isAvailable
            if (agent.available !== undefined && agent.isAvailable === undefined) {
                updates.isAvailable = agent.available;
                needsUpdate = true;
            }

            // Add missing maxLoad
            if (agent.maxLoad === undefined) {
                updates.maxLoad = 5;
                needsUpdate = true;
            }

            // Add updatedAt if missing
            if (!agent.updatedAt) {
                updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
                needsUpdate = true;
            }

            if (needsUpdate) {
                batch.update(doc.ref, updates);
                updated++;
            }
        }

        if (updated > 0) {
            await batch.commit();
            console.log(`   ✓ Updated ${updated} agent(s)\n`);
        } else {
            console.log(`   ✓ All agents already standardized\n`);
        }

    } catch (error) {
        console.error('   ❌ Error cleaning up agents:', error.message);
    }
}

async function cleanupUsers() {
    console.log('🧹 Cleaning up users collection...');

    try {
        const usersSnapshot = await db.collection('users').get();
        const batch = db.batch();
        let cleaned = 0;

        for (const doc of usersSnapshot.docs) {
            const user = doc.data();

            // Remove redundant uid field (the doc ID is already the UID)
            if (user.uid) {
                batch.update(doc.ref, { uid: admin.firestore.FieldValue.delete() });
                cleaned++;
            }
        }

        if (cleaned > 0) {
            await batch.commit();
            console.log(`   ✓ Cleaned ${cleaned} user document(s)\n`);
        } else {
            console.log(`   ✓ All user documents already clean\n`);
        }

    } catch (error) {
        console.error('   ❌ Error cleaning up users:', error.message);
    }
}

// Run initialization
initializeDatabase();
