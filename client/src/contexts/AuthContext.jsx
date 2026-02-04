import { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('🔐 Auth State Changed:', user?.email || 'No user');
            setCurrentUser(user);

            if (user) {
                try {
                    console.log('📋 Fetching role for UID:', user.uid);
                    // Get user role from Firestore
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    console.log('📄 Firestore doc exists:', userDoc.exists());

                    if (userDoc.exists()) {
                        const role = userDoc.data().role;
                        console.log('✅ Role found:', role);
                        setUserRole(role);
                    } else {
                        // User exists in auth but not in Firestore users collection
                        console.warn('⚠️ User role not found in Firestore for:', user.email);
                        console.warn('   UID:', user.uid);
                        console.warn('   Please run: node scripts/init-database.js');
                        setUserRole(null);
                    }
                } catch (error) {
                    console.error('❌ Error fetching user role:', error);
                    setUserRole(null);
                }
            } else {
                setUserRole(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Login with email/password
    async function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    // Login with Google
    async function loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    }

    // Logout
    async function logout() {
        return signOut(auth);
    }

    const value = {
        currentUser,
        userRole,
        loading,
        login,
        loginWithGoogle,
        logout
    };

    // Show loading screen while Firebase initializes
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#1a1a2e',
                color: '#fff',
                fontFamily: 'system-ui, sans-serif'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid rgba(255,255,255,0.1)',
                    borderTop: '4px solid #6366f1',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <p style={{ marginTop: '16px', color: '#a0a0a0' }}>Loading hurAI...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
