import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import Layout from '../../components/Layout';
import styles from './Tickets.module.css';

export default function AdminTickets() {
    const [tickets, setTickets] = useState([]);
    const [agents, setAgents] = useState({});
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        // Load agents first
        const agentsSnap = await getDocs(collection(db, 'agents'));
        const agentsMap = {};
        agentsSnap.docs.forEach(doc => {
            const data = doc.data();
            agentsMap[data.uid] = data.name;
        });
        setAgents(agentsMap);

        // Load tickets
        const ticketsSnap = await getDocs(collection(db, 'tickets'));
        setTickets(ticketsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }

    const filteredTickets = filter === 'all'
        ? tickets
        : tickets.filter(t => t.status === filter);

    function getStatusClass(status) {
        switch (status) {
            case 'open': return styles.statusOpen;
            case 'assigned': return styles.statusInProgress;
            case 'in-progress': return styles.statusInProgress;
            case 'resolved': return styles.statusResolved;
            default: return '';
        }
    }

    return (
        <Layout title="Ticket Management" role="admin">
            <div className={styles.header}>
                <div className={styles.filters}>
                    <button
                        className={filter === 'all' ? styles.activeFilter : styles.filter}
                        onClick={() => setFilter('all')}
                    >
                        All ({tickets.length})
                    </button>
                    <button
                        className={filter === 'open' ? styles.activeFilter : styles.filter}
                        onClick={() => setFilter('open')}
                    >
                        Open ({tickets.filter(t => t.status === 'open').length})
                    </button>
                    <button
                        className={filter === 'assigned' ? styles.activeFilter : styles.filter}
                        onClick={() => setFilter('assigned')}
                    >
                        Assigned ({tickets.filter(t => t.status === 'assigned').length})
                    </button>
                    <button
                        className={filter === 'in-progress' ? styles.activeFilter : styles.filter}
                        onClick={() => setFilter('in-progress')}
                    >
                        In Progress ({tickets.filter(t => t.status === 'in-progress').length})
                    </button>
                    <button
                        className={filter === 'resolved' ? styles.activeFilter : styles.filter}
                        onClick={() => setFilter('resolved')}
                    >
                        Resolved ({tickets.filter(t => t.status === 'resolved').length})
                    </button>
                </div>
            </div>

            {filteredTickets.length === 0 ? (
                <div className={styles.empty}>
                    <p>No tickets found</p>
                </div>
            ) : (
                <div className={styles.list}>
                    {filteredTickets.map(ticket => (
                        <div key={ticket.id} className={styles.ticketCard}>
                            <div className={styles.ticketHeader}>
                                <div>
                                    <span className={styles.ticketId}>#{ticket.id.slice(0, 8)}</span>
                                    <span className={`${styles.status} ${getStatusClass(ticket.status)}`}>
                                        {ticket.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className={styles.category}>{ticket.category || 'General'}</div>
                            </div>

                            <h3 className={styles.ticketTitle}>{ticket.query}</h3>

                            <div className={styles.ticketMeta}>
                                <span>👤 {ticket.assignedAgentId ? agents[ticket.assignedAgentId] || 'Unknown Agent' : 'Unassigned'}</span>
                                <span>📅 {new Date(ticket.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Layout>
    );
}
