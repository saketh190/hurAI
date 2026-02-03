import { useState, useEffect } from 'react';
import styles from './Toast.module.css';

let showToastCallback = null;
let toastIdCounter = 0;

export function Toast() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        showToastCallback = (message, type = 'success') => {
            const id = ++toastIdCounter; // Use incrementing counter instead of Date.now()
            setToasts(prev => [...prev, { id, message, type }]);

            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 4000);
        };

        return () => {
            showToastCallback = null;
        };
    }, []);

    return (
        <div className={styles.toastContainer}>
            {toasts.map(toast => (
                <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
                    <span className={styles.icon}>
                        {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠' : 'ℹ'}
                    </span>
                    <span className={styles.message}>{toast.message}</span>
                </div>
            ))}
        </div>
    );
}

export function showToast(message, type = 'success') {
    if (showToastCallback) {
        showToastCallback(message, type);
    }
}
