import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import Layout from '../../components/Layout';
import { showToast } from '../../components/Toast';
import styles from './CreateTicket.module.css';

export default function CreateTicket() {
    const [agents, setAgents] = useState([]);
    const [formData, setFormData] = useState({
        query: '',
        category: 'General',
        priority: 'medium',
        assignedAgentId: '',
        status: 'open'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadAgents();
    }, []);

    async function loadAgents() {
        const snapshot = await getDocs(collection(db, 'agents'));
        setAgents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {
            const ticketData = {
                query: formData.query,
                category: formData.category,
                priority: formData.priority,
                status: formData.status,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            };

            // Add assigned agent if selected
            if (formData.assignedAgentId) {
                ticketData.assignedAgentId = formData.assignedAgentId;
                ticketData.status = 'assigned';
                ticketData.assignedAt = Timestamp.now();
            }

            const docRef = await addDoc(collection(db, 'tickets'), ticketData);

            showToast(`Ticket #${docRef.id.slice(0, 8)} created successfully!`, 'success');

            // Reset form
            setFormData({
                query: '',
                category: 'General',
                priority: 'medium',
                assignedAgentId: '',
                status: 'open'
            });
        } catch (error) {
            console.error('Error creating ticket:', error);
            showToast('Error creating ticket: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Layout title="Create Test Ticket" role="admin">
            <div className={styles.container}>
                <div className={styles.card}>
                    <h2>🎫 Create Test Ticket</h2>
                    <p className={styles.subtitle}>
                        Create tickets to test the agent workflow
                    </p>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.field}>
                            <label>Customer Query *</label>
                            <textarea
                                value={formData.query}
                                onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                                placeholder="e.g., How do I reset my password in Outlook?"
                                rows={4}
                                required
                            />
                        </div>

                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>Category *</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                >
                                    <option value="General">General</option>
                                    <option value="Office 365">Office 365</option>
                                    <option value="Email">Email</option>
                                    <option value="Excel">Excel</option>
                                    <option value="Outlook">Outlook</option>
                                    <option value="Teams">Teams</option>
                                    <option value="Technical">Technical</option>
                                </select>
                            </div>

                            <div className={styles.field}>
                                <label>Priority</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label>Assign to Agent (Optional)</label>
                            <select
                                value={formData.assignedAgentId}
                                onChange={(e) => setFormData({ ...formData, assignedAgentId: e.target.value })}
                            >
                                <option value="">-- Leave Unassigned --</option>
                                {agents.map(agent => (
                                    <option key={agent.id} value={agent.uid}>
                                        {agent.name} ({agent.email})
                                    </option>
                                ))}
                            </select>
                            <small>Leave blank to create an unassigned ticket</small>
                        </div>

                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={loading}
                        >
                            {loading ? '⏳ Creating...' : '✨ Create Ticket'}
                        </button>
                    </form>

                    <div className={styles.info}>
                        <h3>📋 Testing Workflow:</h3>
                        <ol>
                            <li>Create an unassigned ticket (status: "open")</li>
                            <li>Or assign directly to an agent (status: "assigned")</li>
                            <li>Login as agent to see assigned tickets</li>
                            <li>Agent can update status to "in-progress" or "resolved"</li>
                        </ol>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
