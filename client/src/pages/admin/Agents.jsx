import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { auth, db } from '../../firebase';
import Layout from '../../components/Layout';
import { showToast } from '../../components/Toast';
import { showConfirm } from '../../components/ConfirmDialog';
import styles from './Agents.module.css';

// Create a secondary Firebase app for creating users without logging out current user
function getSecondaryAuth() {
    const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    };

    // Check if secondary app already exists
    const apps = getApps();
    const secondaryApp = apps.find(app => app.name === 'Secondary')
        || initializeApp(firebaseConfig, 'Secondary');

    return getAuth(secondaryApp);
}


export default function AdminAgents() {
    const [agents, setAgents] = useState([]);
    const [ticketCounts, setTicketCounts] = useState({});
    const [showForm, setShowForm] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        skills: ''
    });

    useEffect(() => {
        loadAgents();
    }, []);

    async function loadAgents() {
        // Load agents
        const snapshot = await getDocs(collection(db, 'agents'));
        const agentsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAgents(agentsList);

        // Count ACTIVE (non-resolved) tickets per agent
        const ticketsSnap = await getDocs(collection(db, 'tickets'));
        const counts = {};
        ticketsSnap.docs.forEach(doc => {
            const ticket = doc.data();
            // Only count active tickets (not resolved)
            if (ticket.assignedAgentId && ticket.status !== 'resolved') {
                counts[ticket.assignedAgentId] = (counts[ticket.assignedAgentId] || 0) + 1;
            }
        });
        setTicketCounts(counts);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            // Create Firebase Auth user using SECONDARY app (won't log out admin)
            const secondaryAuth = getSecondaryAuth();
            const userCred = await createUserWithEmailAndPassword(
                secondaryAuth,
                formData.email,
                formData.password
            );

            // Add agent to Firestore with backend-compatible schema
            await addDoc(collection(db, 'agents'), {
                uid: userCred.user.uid,
                name: formData.name,
                email: formData.email,
                skills: formData.skills.split(',').map(s => s.trim()),
                isAvailable: true,
                currentLoad: 0,
                maxLoad: 5,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Add role to users collection (document ID MUST be the user's UID)
            await setDoc(doc(db, 'users', userCred.user.uid), {
                role: 'agent',
                email: formData.email,
                createdAt: new Date()
            });

            // Sign out from secondary auth immediately
            await secondaryAuth.signOut();

            setFormData({ name: '', email: '', password: '', skills: '' });
            setShowForm(false);
            setShowPassword(false);
            loadAgents();
            showToast(`Agent "${formData.name}" created successfully!`, 'success');
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                showToast('Email already in use. Delete the existing agent first or use a different email.', 'error');
            } else {
                showToast('Error: ' + error.message, 'error');
            }
        }
    }

    async function handleDelete(agent) {
        const confirmed = await showConfirm(
            `Delete agent "${agent.name}"?\n\nThis will remove from Firestore.\nYou must also manually delete from:\nFirebase Console → Authentication`
        );

        if (!confirmed) return;

        try {
            // Delete from agents collection
            await deleteDoc(doc(db, 'agents', agent.id));

            // Delete from users collection
            await deleteDoc(doc(db, 'users', agent.uid));

            showToast(`Agent "${agent.name}" deleted from Firestore`, 'success');
            showToast('⚠️ Remember to delete from Firebase Console → Authentication → Users', 'warning');
            loadAgents();
        } catch (error) {
            showToast('Error deleting agent: ' + error.message, 'error');
        }
    }

    return (
        <Layout title="Agent Management" role="admin">
            <div className={styles.header}>
                <h2>All Agents ({agents.length})</h2>
                <button onClick={() => setShowForm(!showForm)} className={styles.addBtn}>
                    {showForm ? 'Cancel' : '+ Add Agent'}
                </button>
            </div>

            {showForm && (
                <div className={styles.formCard}>
                    <h3>Add New Agent</h3>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.inputGroup}>
                            <label>Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Password</label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    minLength="6"
                                />
                                <button
                                    type="button"
                                    className={styles.togglePassword}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Skills (comma-separated)</label>
                            <input
                                type="text"
                                value={formData.skills}
                                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                placeholder="Excel, Office 365, Outlook"
                            />
                        </div>
                        <button type="submit" className={styles.submitBtn}>Create Agent</button>
                    </form>
                </div>
            )}

            <div className={styles.grid}>
                {agents.map(agent => (
                    <div key={agent.id} className={styles.agentCard}>
                        <button
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(agent)}
                            title="Delete agent"
                        >
                            ✕
                        </button>
                        <div className={styles.avatar}>
                            {agent.name?.charAt(0).toUpperCase()}
                        </div>
                        <h3>{agent.name}</h3>
                        <p className={styles.email}>{agent.email}</p>
                        <div className={styles.skills}>
                            {agent.skills?.map((skill, i) => (
                                <span key={i} className={styles.skillTag}>{skill}</span>
                            ))}
                        </div>
                        <div className={styles.stats}>
                            <div>
                                <div className={styles.statValue}>{ticketCounts[agent.uid] || 0}</div>
                                <div className={styles.statLabel}>Active Tickets</div>
                            </div>
                            <div>
                                <span className={(agent.isAvailable || agent.available) ? styles.available : styles.unavailable}>
                                    {(agent.isAvailable || agent.available) ? '🟢 Available' : '🔴 Busy'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Layout>
    );
}
