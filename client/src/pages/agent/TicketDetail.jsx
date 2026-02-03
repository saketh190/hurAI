import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Layout from '../../components/Layout';
import { showToast } from '../../components/Toast';
import { showConfirm } from '../../components/ConfirmDialog';
import styles from './TicketDetail.module.css';

export default function AgentTicketDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [response, setResponse] = useState('');
    const [showAssistant, setShowAssistant] = useState(false);
    const [assistantQuery, setAssistantQuery] = useState('');
    const [assistantResponse, setAssistantResponse] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTicket();
    }, [id]);

    async function loadTicket() {
        const docRef = doc(db, 'tickets', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setTicket({ id: docSnap.id, ...docSnap.data() });
        }
    }

    async function handleSubmitResponse() {
        if (!response.trim()) return;

        try {
            await updateDoc(doc(db, 'tickets', id), {
                response: response,
                status: 'in-progress',
                updatedAt: new Date()
            });
            showToast('Response sent!', 'success');
            loadTicket();
            setResponse('');
        } catch (error) {
            showToast('Error sending response: ' + error.message, 'error');
        }
    }

    async function handleResolve() {
        const confirmed = await showConfirm('Mark this ticket as resolved?');
        if (!confirmed) return;

        try {
            await updateDoc(doc(db, 'tickets', id), {
                status: 'resolved',
                resolvedAt: new Date()
            });

            showToast('Ticket resolved successfully!', 'success');
            navigate('/agent/tickets');
        } catch (error) {
            showToast('Error resolving ticket: ' + error.message, 'error');
        }
    }

    async function handleAskAssistant() {
        if (!assistantQuery.trim()) return;

        setLoading(true);
        // TODO: Implement LLM backend when available
        // For now, show a helpful message
        setAssistantResponse('LLM Assistant is not yet connected. Backend API needed for /api/llm-assist/query');
        showToast('LLM Assistant requires backend API (coming soon)', 'warning');
        setLoading(false);
    }

    if (!ticket) {
        return <Layout title="Loading..." role="agent"><p>Loading ticket...</p></Layout>;
    }

    return (
        <Layout title={`Ticket #${id.slice(0, 8)}`} role="agent">
            <div className={styles.container}>
                <div className={styles.ticketContent}>
                    <div className={styles.statusBar}>
                        <span className={`${styles.statusBadge} ${styles['status' + ticket.status]}`}>
                            {ticket.status}
                        </span>
                        <button onClick={handleResolve} className={styles.resolveBtn}>
                            Mark as Resolved
                        </button>
                    </div>

                    <div className={styles.section}>
                        <h3>Customer Query</h3>
                        <p className={styles.query}>{ticket.query}</p>
                    </div>

                    <div className={styles.section}>
                        <h3>Your Response</h3>
                        <textarea
                            className={styles.textarea}
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            placeholder="Type your response to the customer..."
                            rows="8"
                        />
                        <button onClick={handleSubmitResponse} className={styles.submitBtn}>
                            Send Response
                        </button>
                    </div>

                    {ticket.response && (
                        <div className={styles.section}>
                            <h3>Previous Response</h3>
                            <p className={styles.previousResponse}>{ticket.response}</p>
                        </div>
                    )}
                </div>

                <div className={showAssistant ? styles.assistantOpen : styles.assistantClosed}>
                    <div className={styles.assistantHeader} onClick={() => setShowAssistant(!showAssistant)}>
                        <h3>🤖 LLM Assistant</h3>
                        <button className={styles.toggleBtn}>
                            {showAssistant ? '→' : '←'}
                        </button>
                    </div>

                    {showAssistant && (
                        <div className={styles.assistantContent}>
                            <div className={styles.assistantInput}>
                                <textarea
                                    value={assistantQuery}
                                    onChange={(e) => setAssistantQuery(e.target.value)}
                                    placeholder="Ask the LLM for help with this ticket..."
                                    rows="3"
                                />
                                <button onClick={handleAskAssistant} disabled={loading}>
                                    {loading ? 'Thinking...' : 'Ask'}
                                </button>
                            </div>

                            {assistantResponse && (
                                <div className={styles.assistantResponse}>
                                    <h4>Response:</h4>
                                    <p>{assistantResponse}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
