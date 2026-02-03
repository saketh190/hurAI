import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children, requiredRole }) {
    const { currentUser, userRole, loading } = useAuth();

    // CRITICAL: Wait for auth to finish loading before checking
    if (loading) {
        return <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontSize: '18px',
            color: '#667eea'
        }}>Loading...</div>;
    }

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    if (requiredRole && userRole !== requiredRole) {
        console.error('❌ Access denied. Required:', requiredRole, 'Got:', userRole);
        return <Navigate to="/unauthorized" />;
    }

    return children;
}
