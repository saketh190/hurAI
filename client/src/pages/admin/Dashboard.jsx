import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../../firebase';
import Layout from '../../components/Layout';
import styles from './Dashboard.module.css';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalAgents: 0,
        openTickets: 0,
        inProgressTickets: 0,
        resolvedTickets: 0
    });

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        try {
            // Get total agents
            const agentsSnap = await getDocs(collection(db, 'agents'));
            const totalAgents = agentsSnap.size;

            // Get all tickets
            const ticketsSnap = await getDocs(collection(db, 'tickets'));
            const allTickets = ticketsSnap.docs.map(doc => doc.data());

            const openTickets = allTickets.filter(t => t.status === 'open' || t.status === 'assigned').length;
            const inProgressTickets = allTickets.filter(t => t.status === 'in-progress').length;
            const resolvedTickets = allTickets.filter(t => t.status === 'resolved').length;

            setStats({
                totalAgents,
                openTickets,
                inProgressTickets,
                resolvedTickets
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    return (
        <Layout title="Dashboard" role="admin">
            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>👥</span>
                        <h3>Agents</h3>
                    </div>
                    <div className={styles.stat}>{stats.totalAgents}</div>
                    <p className={styles.label}>Active agents</p>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🎫</span>
                        <h3>Open Tickets</h3>
                    </div>
                    <div className={styles.stat}>{stats.openTickets}</div>
                    <p className={styles.label}>Pending resolution</p>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>⚙️</span>
                        <h3>In Progress</h3>
                    </div>
                    <div className={styles.stat}>{stats.inProgressTickets}</div>
                    <p className={styles.label}>Being handled</p>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>✅</span>
                        <h3>Resolved</h3>
                    </div>
                    <div className={styles.stat}>{stats.resolvedTickets}</div>
                    <p className={styles.label}>Total resolved</p>
                </div>
            </div>

            <div className={styles.section}>
                <h2>Quick Links</h2>
                <div className={styles.linkGrid}>
                    <Link to="/admin/agents" className={styles.linkCard}>
                        <span className={styles.linkIcon}>👥</span>
                        <div>
                            <h4>Manage Agents</h4>
                            <p>Add, edit, or remove agents</p>
                        </div>
                    </Link>
                    <Link to="/admin/tickets" className={styles.linkCard}>
                        <span className={styles.linkIcon}>🎫</span>
                        <div>
                            <h4>View Tickets</h4>
                            <p>Monitor all support tickets</p>
                        </div>
                    </Link>
                    <Link to="/admin/create-ticket" className={styles.linkCard}>
                        <span className={styles.linkIcon}>➕</span>
                        <div>
                            <h4>Create Ticket</h4>
                            <p>Add new support ticket</p>
                        </div>
                    </Link>
                </div>
            </div>
        </Layout>
    );
}
