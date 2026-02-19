import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';
import { showToast } from '../../components/Toast';
import { showConfirm } from '../../components/ConfirmDialog';
import styles from './TicketDetail.module.css';

export default function AgentTicketDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [agentName, setAgentName] = useState('');
    const [response, setResponse] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    useEffect(() => {
        loadTicket();
        loadAgentInfo();
    }, [id]);

    // Real-time conversation listener
    useEffect(() => {
        if (!ticket?.conversationId) return;
        const messagesRef = collection(db, 'conversations', ticket.conversationId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
        });
        return () => unsubscribe();
    }, [ticket?.conversationId]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function loadTicket() {
        const docRef = doc(db, 'tickets', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setTicket({ id: docSnap.id, ...docSnap.data() });
        }
    }

    async function loadAgentInfo() {
        try {
            const agentsSnap = await getDoc(doc(db, 'agents', currentUser.uid));
            if (agentsSnap.exists()) {
                setAgentName(agentsSnap.data().name || 'Agent');
            }
        } catch (error) {
            console.error('Error loading agent info:', error);
        }
    }

    async function handleSendResponse() {
        if (!response.trim() || !ticket?.conversationId) return;
        setLoading(true);

        try {
            // Send agent message to conversation (appears in user's chat in real-time)
            await fetch(`${API_URL}/api/conversation/${ticket.conversationId}/agent-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId: currentUser.uid,
                    agentName: agentName || 'Support Agent',
                    message: response.trim()
                })
            });

            // Update ticket status
            await updateDoc(doc(db, 'tickets', id), {
                status: 'in-progress',
                updatedAt: new Date()
            });

            setResponse('');
            showToast('Response sent!', 'success');
        } catch (error) {
            showToast('Error sending response: ' + error.message, 'error');
        } finally {
            setLoading(false);
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

            // Also resolve the conversation
            if (ticket?.conversationId) {
                try {
                    await fetch(`${API_URL}/api/conversation/${ticket.conversationId}/resolve`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (e) { console.error('Error resolving conversation:', e); }
            }

            showToast('Ticket resolved!', 'success');
            navigate('/agent/tickets');
        } catch (error) {
            showToast('Error: ' + error.message, 'error');
        }
    }

    function handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendResponse();
        }
    }

    function formatTime(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    if (!ticket) {
        return <Layout title="Loading..." role="agent"><p>Loading ticket...</p></Layout>;
    }

    const isResolved = ticket.status === 'resolved';

    return (
        <Layout title={`Ticket #${id.slice(0, 8)}`} role="agent">
            <div className={styles.container}>
                {/* Left: Live Chat */}
                <div className={styles.chatPanel}>
                    <div className={styles.chatHeader}>
                        <div className={styles.chatHeaderLeft}>
                            <h3>💬 Live Conversation</h3>
                            <span className={`${styles.statusBadge} ${styles['status' + ticket.status.replace('-', '')]}`}>
                                {ticket.status}
                            </span>
                        </div>
                        <button
                            onClick={handleResolve}
                            className={styles.resolveBtn}
                            disabled={isResolved}
                        >
                            {isResolved ? '✅ Resolved' : 'Mark Resolved'}
                        </button>
                    </div>

                    {/* Messages */}
                    <div className={styles.chatMessages}>
                        {messages.length === 0 && (
                            <div className={styles.noMessages}>
                                <p>No conversation messages yet.</p>
                                {!ticket.conversationId && (
                                    <p className={styles.hint}>This ticket was created manually (no linked conversation).</p>
                                )}
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`${styles.chatBubbleRow} ${msg.role === 'agent' ? styles.chatRight : styles.chatLeft
                                    }`}
                            >
                                <div className={`${styles.chatBubble} ${msg.role === 'user' ? styles.userChatBubble :
                                        msg.role === 'agent' ? styles.agentChatBubble :
                                            styles.botChatBubble
                                    }`}>
                                    <div className={styles.chatRole}>
                                        {msg.role === 'user' ? '👤 Customer' :
                                            msg.role === 'agent' ? `🧑‍💼 ${msg.agentName || 'Agent'}` :
                                                '🤖 Bot'}
                                    </div>
                                    <div className={styles.chatText}>{msg.content}</div>
                                    <div className={styles.chatTime}>{formatTime(msg.timestamp)}</div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Reply input */}
                    {!isResolved && ticket.conversationId && (
                        <div className={styles.chatInput}>
                            <textarea
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your reply to the customer..."
                                rows="2"
                                disabled={loading}
                            />
                            <button
                                onClick={handleSendResponse}
                                disabled={!response.trim() || loading}
                                className={styles.sendBtn}
                            >
                                {loading ? '⏳' : '📤'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Right: Ticket Info */}
                <div className={styles.infoPanel}>
                    <h3>📋 Ticket Info</h3>
                    <div className={styles.infoItem}>
                        <label>Status</label>
                        <span className={`${styles.statusBadge} ${styles['status' + ticket.status.replace('-', '')]}`}>
                            {ticket.status}
                        </span>
                    </div>
                    <div className={styles.infoItem}>
                        <label>Category</label>
                        <span>{ticket.category || 'General'}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <label>Priority</label>
                        <span>{ticket.priority || 'Normal'}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <label>Channel</label>
                        <span>{ticket.channel || 'Web'}</span>
                    </div>

                    <div className={styles.infoSection}>
                        <h4>Original Query</h4>
                        <p className={styles.queryText}>{ticket.query || 'No query recorded'}</p>
                    </div>

                    {ticket.conversationId && (
                        <div className={styles.infoSection}>
                            <h4>Conversation ID</h4>
                            <p className={styles.convId}>{ticket.conversationId}</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
