import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import styles from './Tickets.module.css';

export default function AgentTickets() {
    const [tickets, setTickets] = useState([]);
    const { currentUser } = useAuth();

    useEffect(() => {
        loadMyTickets();
    }, [currentUser]);

    async function loadMyTickets() {
        try {
            const q = query(
                collection(db, 'tickets'),
                where('assignedAgentId', '==', currentUser.uid)
            );
            const snapshot = await getDocs(q);
            setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error('Error loading tickets:', error);
            setTickets([]);
        }
    }

    function getStatusClass(status) {
        switch (status) {
            case 'open': return styles.statusOpen;
            case 'assigned': return styles.statusOpen;
            case 'in-progress': return styles.statusInProgress;
            case 'resolved': return styles.statusResolved;
            default: return '';
        }
    }

    return (
        <Layout title="My Tickets" role="agent">
            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{tickets.filter(t => t.status === 'open' || t.status === 'assigned').length}</div>
                    <div className={styles.statLabel}>Open</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{tickets.filter(t => t.status === 'in-progress').length}</div>
                    <div className={styles.statLabel}>In Progress</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{tickets.filter(t => t.status === 'resolved').length}</div>
                    <div className={styles.statLabel}>Resolved</div>
                </div>
            </div>

            {tickets.length === 0 ? (
                <div className={styles.empty}>
                    <p>No tickets assigned to you</p>
                </div>
            ) : (
                <div className={styles.list}>
                    {tickets.map(ticket => (
                        <Link
                            key={ticket.id}
                            to={`/agent/tickets/${ticket.id}`}
                            className={styles.ticketCard}
                        >
                            <div className={styles.ticketHeader}>
                                <div>
                                    <span className={styles.ticketId}>#{ticket.id.slice(0, 8)}</span>
                                    <span className={`${styles.status} ${getStatusClass(ticket.status)}`}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <div className={styles.category}>{ticket.category || 'General'}</div>
                            </div>

                            <h3 className={styles.ticketTitle}>{ticket.query}</h3>

                            <div className={styles.ticketMeta}>
                                <span>📅 {new Date(ticket.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </Layout>
    );
}
