import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import styles from './ChannelSimulator.module.css';

const CHANNELS = [
    { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: '#25D366' },
    { id: 'email', name: 'Email', icon: '📧', color: '#EA4335' },
    { id: 'slack', name: 'Slack', icon: '💼', color: '#4A154B' }
];

export default function ChannelSimulator() {
    const [selectedChannel, setSelectedChannel] = useState('whatsapp');
    const [conversationId, setConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    // 'active' = bot helping | 'escalated' = talking to agent | 'resolved' = done
    const [sessionState, setSessionState] = useState('active');
    const [ticketId, setTicketId] = useState(null);
    const [actedMessageId, setActedMessageId] = useState(null);
    const messagesEndRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    useEffect(() => { startConversation(); }, []);

    useEffect(() => {
        if (!conversationId) return;
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
            setIsTyping(false);
        });
        return () => unsubscribe();
    }, [conversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    async function startConversation(retries = 3) {
        try {
            const response = await fetch(`${API_URL}/api/conversation/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channel: selectedChannel })
            });
            const data = await response.json();
            if (data.success) setConversationId(data.conversation.id);
        } catch (error) {
            if (retries > 0) {
                setTimeout(() => startConversation(retries - 1), 2000);
            } else {
                console.error('Error starting conversation:', error);
            }
        }
    }

    async function sendMessage() {
        if (!inputMessage.trim() || !conversationId || loading) return;
        // Resolved = no more messages
        if (sessionState === 'resolved') return;

        const userMessage = inputMessage.trim();
        setInputMessage('');
        setLoading(true);

        if (sessionState === 'escalated') {
            // After escalation: send directly to conversation (no LLM)
            try {
                await fetch(`${API_URL}/api/conversation/${conversationId}/user-message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: userMessage })
                });
            } catch (error) {
                console.error('Error sending direct message:', error);
            } finally {
                setLoading(false);
            }
        } else {
            // Normal: send through LLM router
            setIsTyping(true);
            try {
                const response = await fetch(`${API_URL}/api/conversation/${conversationId}/message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: userMessage })
                });
                const data = await response.json();
                if (data.type === 'escalation') {
                    setSessionState('escalated');
                    setTicketId(data.ticket?.id);
                }
            } catch (error) {
                console.error('Error sending message:', error);
                setIsTyping(false);
            } finally {
                setLoading(false);
            }
        }
    }

    async function handleResolved(msgId) {
        if (!conversationId) return;
        setActedMessageId(msgId);
        try {
            await fetch(`${API_URL}/api/conversation/${conversationId}/resolve`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }
            });
            setSessionState('resolved');
        } catch (error) { console.error('Error resolving:', error); }
    }

    async function handleNeedHelp(msgId) {
        if (!conversationId) return;
        setActedMessageId(msgId);
        try {
            const response = await fetch(`${API_URL}/api/conversation/${conversationId}/escalate`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            setSessionState('escalated');
            setTicketId(data.ticket?.id);
        } catch (error) { console.error('Error escalating:', error); }
    }

    function handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    }

    function formatTime(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    const lastBotMsg = [...messages].reverse().find(m => m.role === 'assistant');
    const showActionFor = (msg) =>
        sessionState === 'active' &&
        msg.role === 'assistant' &&
        msg.id === lastBotMsg?.id &&
        actedMessageId !== msg.id &&
        !isTyping && !loading;

    const currentChannel = CHANNELS.find(c => c.id === selectedChannel);
    const isInputDisabled = loading || sessionState === 'resolved';

    return (
        <div className={styles.container}>
            <div className={styles.simulator} style={{ borderColor: currentChannel.color }}>
                {/* Header */}
                <div className={styles.header} style={{ backgroundColor: currentChannel.color }}>
                    <div className={styles.channelTabs}>
                        {CHANNELS.map(channel => (
                            <button
                                key={channel.id}
                                className={selectedChannel === channel.id ? styles.activeTab : styles.tab}
                                onClick={() => setSelectedChannel(channel.id)}
                                disabled={conversationId !== null}
                            >
                                <span className={styles.channelIcon}>{channel.icon}</span>
                                {channel.name}
                            </button>
                        ))}
                    </div>
                    <div className={styles.headerInfo}>
                        <span className={styles.headerTitle}>HurAI Support</span>
                        <span className={styles.headerStatus}>
                            {sessionState === 'active' ? '● Online' :
                                sessionState === 'resolved' ? '✅ Resolved' :
                                    '👤 Talking to Agent'}
                        </span>
                    </div>
                </div>

                {/* Messages */}
                <div className={styles.messages}>
                    {messages.length === 0 && (
                        <div className={styles.welcomeMessage}>
                            <h3>👋 Welcome to HurAI Support</h3>
                            <p>Ask me anything! I'm here to help you with your questions.</p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div key={msg.id}>
                            <div className={`${styles.messageRow} ${msg.role === 'user' ? styles.messageRowRight : styles.messageRowLeft
                                }`}>
                                <div className={`${styles.messageBubble} ${msg.role === 'user' ? styles.userBubble :
                                        msg.role === 'agent' ? styles.agentBubble : styles.botBubble
                                    }`}>
                                    {msg.role === 'agent' && (
                                        <div className={styles.agentLabel}>
                                            👤 {msg.agentName || 'Support Agent'}
                                        </div>
                                    )}
                                    <div className={styles.messageText}>{msg.content}</div>
                                    <div className={styles.messageTime}>
                                        {formatTime(msg.timestamp)}
                                        {msg.role === 'assistant' && msg.basedOnKB && (
                                            <span className={styles.kbBadge}> · 📚 KB</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {showActionFor(msg) && (
                                <div className={styles.actionRow}>
                                    <span className={styles.actionLabel}>Did this help?</span>
                                    <button className={styles.resolvedBtn} onClick={() => handleResolved(msg.id)}>
                                        ✅ Yes, solved!
                                    </button>
                                    <button className={styles.needHelpBtn} onClick={() => handleNeedHelp(msg.id)}>
                                        🙋 Need more help
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {isTyping && (
                        <div className={`${styles.messageRow} ${styles.messageRowLeft}`}>
                            <div className={`${styles.messageBubble} ${styles.botBubble}`}>
                                <div className={styles.typingIndicator}>
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        </div>
                    )}

                    {sessionState === 'resolved' && (
                        <div className={styles.resolvedBanner}>
                            🎉 Great! Glad we could help. This conversation is now closed.
                        </div>
                    )}
                    {sessionState === 'escalated' && messages.filter(m => m.role === 'agent').length === 0 && (
                        <div className={styles.escalatedBanner}>
                            🎫 Ticket created{ticketId && <strong> (#{ticketId.slice(0, 8)})</strong>}.
                            You can continue chatting — an agent will join shortly.
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input — active during 'active' and 'escalated', disabled only when 'resolved' */}
                <div className={styles.inputArea}>
                    <textarea
                        className={styles.input}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={
                            sessionState === 'resolved' ? 'Conversation resolved.' :
                                sessionState === 'escalated' ? 'Message the agent...' :
                                    'Type your message...'
                        }
                        rows="2"
                        disabled={isInputDisabled}
                    />
                    <button
                        className={styles.sendButton}
                        onClick={sendMessage}
                        disabled={!inputMessage.trim() || isInputDisabled}
                        style={{ backgroundColor: sessionState !== 'resolved' ? currentChannel.color : '#ccc' }}
                    >
                        {loading ? '⏳' : '📤'}
                    </button>
                </div>

                {conversationId && (
                    <div className={styles.footer}>
                        Session: {conversationId.slice(0, 20)}...
                    </div>
                )}
            </div>
        </div>
    );
}
