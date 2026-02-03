// Script to create default admin user in Firebase
const admin = require('firebase-admin');
const serviceAccount = require('../hurai-77f8d-firebase-adminsdk-8jw4l-4e1528ba11.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function createDefaultAdmin() {
    const defaultEmail = 'admin@gmail.com';
    const defaultPassword = 'admin123';

    try {
        // Check if user already exists
        try {
            const existingUser = await auth.getUserByEmail(defaultEmail);
            console.log('Admin user already exists:', existingUser.uid);
            return;
        } catch (error) {
            // User doesn't exist, create it
            console.log('Creating default admin user...');
        }

        // Create Firebase Auth user
        const userRecord = await auth.createUser({
            email: defaultEmail,
            password: defaultPassword,
            displayName: 'Admin'
        });

        console.log('✓ Created Firebase Auth user:', userRecord.uid);

        // Add role to Firestore
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: defaultEmail,
            role: 'admin',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('✓ Added admin role to Firestore');
        console.log('\n🎉 Default admin account created successfully!');
        console.log('Email:', defaultEmail);
        console.log('Password:', defaultPassword);

    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        process.exit();
    }
}

createDefaultAdmin();
