import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Layout.module.css';

export default function Layout({ children, title, role }) {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    async function handleLogout() {
        await logout();
        navigate('/login');
    }

    const adminNav = [
        { path: '/admin', label: 'Dashboard', icon: '📊' },
        { path: '/admin/agents', label: 'Agents', icon: '👥' },
        { path: '/admin/tickets', label: 'Tickets', icon: '🎫' },
        { path: '/admin/create-ticket', label: 'Create Ticket', icon: '➕' },
        { path: '/admin/kb-files', label: 'KB Files', icon: '📚' },
    ];

    const agentNav = [
        { path: '/agent/tickets', label: 'My Tickets', icon: '🎫' },
    ];

    const navItems = role === 'admin' ? adminNav : agentNav;

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                <div className={styles.logo}>
                    <h2>hurAI</h2>
                    <span className={styles.badge}>{role}</span>
                </div>

                <nav className={styles.nav}>
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={location.pathname === item.path ? styles.activeLink : styles.link}
                        >
                            <span className={styles.icon}>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.user}>
                    <div className={styles.userInfo}>
                        <div className={styles.avatar}>
                            {currentUser?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className={styles.userName}>{currentUser?.email}</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        Logout
                    </button>
                </div>
            </aside>

            <main className={styles.main}>
                <header className={styles.header}>
                    <h1>{title}</h1>
                </header>
                <div className={styles.content}>
                    {children}
                </div>
            </main>
        </div>
    );
}
