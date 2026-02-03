import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toast } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminAgents from './pages/admin/Agents';
import AdminTickets from './pages/admin/Tickets';
import AdminKBFiles from './pages/admin/KBFiles';
import AdminCreateTicket from './pages/admin/CreateTicket';
import AgentDashboard from './pages/agent/Dashboard';
import AgentTickets from './pages/agent/Tickets';
import AgentTicketDetail from './pages/agent/TicketDetail';
import Unauthorized from './pages/Unauthorized';

function App() {
    return (
        <AuthProvider>
            <Toast />
            <ConfirmDialog />
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />

                    {/* Admin Routes */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/agents"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminAgents />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/tickets"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminTickets />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/create-ticket"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminCreateTicket />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/kb-files"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminKBFiles />
                            </ProtectedRoute>
                        }
                    />

                    {/* Agent Routes */}
                    <Route
                        path="/agent"
                        element={
                            <ProtectedRoute requiredRole="agent">
                                <AgentDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/agent/tickets"
                        element={
                            <ProtectedRoute requiredRole="agent">
                                <AgentTickets />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/agent/tickets/:id"
                        element={
                            <ProtectedRoute requiredRole="agent">
                                <AgentTicketDetail />
                            </ProtectedRoute>
                        }
                    />

                    {/* Default */}
                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
