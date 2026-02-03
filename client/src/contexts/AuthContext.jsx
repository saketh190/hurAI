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

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
