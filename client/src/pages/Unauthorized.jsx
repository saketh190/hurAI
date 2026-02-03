import styles from './Unauthorized.module.css';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1>⚠️ Access Denied</h1>
                <p>You don't have permission to access this page.</p>
                <Link to="/login" className={styles.link}>Back to Login</Link>
            </div>
        </div>
    );
}
