import { useState, useEffect } from 'react';
import styles from './ConfirmDialog.module.css';

let dialogResolver = null;
let openDialog = null;

export function ConfirmDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Set global function on mount
        openDialog = (msg) => {
            setMessage(msg);
            setIsOpen(true);
        };

        return () => {
            openDialog = null;
        };
    }, []);

    function handleConfirm() {
        setIsOpen(false);
        if (dialogResolver) {
            dialogResolver(true);
            dialogResolver = null;
        }
    }

    function handleCancel() {
        setIsOpen(false);
        if (dialogResolver) {
            dialogResolver(false);
            dialogResolver = null;
        }
    }

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={handleCancel}>
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                <h3>Confirm Action</h3>
                <p className={styles.message}>{message}</p>
                <div className={styles.buttons}>
                    <button onClick={handleCancel} className={styles.cancelBtn}>
                        Cancel
                    </button>
                    <button onClick={handleConfirm} className={styles.confirmBtn}>
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

export function showConfirm(message) {
    // Use native confirm if dialog not mounted (more reliable)
    if (!openDialog) {
        return Promise.resolve(window.confirm(message));
    }

    return new Promise((resolve) => {
        dialogResolver = resolve;
        openDialog(message);
    });
}
