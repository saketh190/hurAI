/**
 * Firebase Configuration
 * Uses Firebase Admin SDK with Service Account Key
 */
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize Firebase Admin
let firebaseApp = null;

export function initializeFirebase() {
    if (firebaseApp) {
        return firebaseApp;
    }

    try {
        // Load service account key
        const serviceAccountPath = join(__dirname, '../../serviceAccountKey.json');
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
        });

        console.log('[Firebase] Initialized with project:', serviceAccount.project_id);
        return firebaseApp;
    } catch (error) {
        console.error('[Firebase] Initialization error:', error.message);
        throw error;
    }
}

// Get Firestore instance
export function getFirestore() {
    if (!firebaseApp) {
        initializeFirebase();
    }
    return admin.firestore();
}

export const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'hurai-77f8d',
};

export default { initializeFirebase, getFirestore, firebaseConfig };
