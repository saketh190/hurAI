import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import Layout from '../../components/Layout';
import { showToast } from '../../components/Toast';
import { showConfirm } from '../../components/ConfirmDialog';
import styles from './KBFiles.module.css';

export default function AdminKBFiles() {
    const [drafts, setDrafts] = useState([]);
    const [selectedDraft, setSelectedDraft] = useState(null);
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        loadDrafts();
    }, []);

    async function loadDrafts() {
        try {
            // Load pending drafts from Firestore
            const q = query(collection(db, 'kb_drafts'), where('status', '==', 'pending'));
            const snapshot = await getDocs(q);
            setDrafts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error('Error loading drafts:', error);
            // If collection doesn't exist, just show empty
            setDrafts([]);
        }
    }

    function handleSelectDraft(draft) {
        setSelectedDraft(draft);
        setEditContent(draft.content || '');
    }

    async function handleApprove() {
        try {
            await updateDoc(doc(db, 'kb_drafts', selectedDraft.id), {
                status: 'approved',
                content: editContent,
                approvedAt: new Date()
            });
            showToast('Draft approved and saved to KB!', 'success');
            setSelectedDraft(null);
            loadDrafts();
        } catch (error) {
            showToast('Error approving draft: ' + error.message, 'error');
        }
    }

    async function handleReject() {
        const confirmed = await showConfirm('Are you sure you want to reject this draft?');
        if (!confirmed) return;

        try {
            await deleteDoc(doc(db, 'kb_drafts', selectedDraft.id));
            showToast('Draft rejected and removed', 'warning');
            setSelectedDraft(null);
            loadDrafts();
        } catch (error) {
            showToast('Error rejecting draft: ' + error.message, 'error');
        }
    }

    return (
        <Layout title="KB File Management" role="admin">
            <div className={styles.container}>
                <div className={styles.sidebar}>
                    <h3>Pending Drafts ({drafts.length})</h3>
                    {drafts.length === 0 ? (
                        <p className={styles.empty}>No pending drafts</p>
                    ) : (
                        <div className={styles.draftList}>
                            {drafts.map(draft => (
                                <div
                                    key={draft.id}
                                    className={selectedDraft?.id === draft.id ? styles.activeDraft : styles.draft}
                                    onClick={() => handleSelectDraft(draft)}
                                >
                                    <div className={styles.draftTitle}>{draft.title || 'Untitled'}</div>
                                    <div className={styles.draftMeta}>
                                        From Ticket #{draft.ticketId?.slice(0, 8)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.editor}>
                    {selectedDraft ? (
                        <>
                            <div className={styles.editorHeader}>
                                <h3>{selectedDraft.title || 'Untitled Draft'}</h3>
                                <div className={styles.actions}>
                                    <button onClick={handleReject} className={styles.rejectBtn}>
                                        Reject
                                    </button>
                                    <button onClick={handleApprove} className={styles.approveBtn}>
                                        Approve & Publish
                                    </button>
                                </div>
                            </div>

                            <textarea
                                className={styles.textarea}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                placeholder="Edit draft content..."
                            />

                            <div className={styles.info}>
                                <p><strong>Source Ticket:</strong> #{selectedDraft.ticketId}</p>
                                <p><strong>Generated:</strong> {new Date(selectedDraft.createdAt?.seconds * 1000).toLocaleString()}</p>
                            </div>
                        </>
                    ) : (
                        <div className={styles.placeholder}>
                            <p>Select a draft to review and edit</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
