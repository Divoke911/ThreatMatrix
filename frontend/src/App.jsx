import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AlertsPage from './pages/AlertsPage';
import IncidentsPage from './pages/IncidentsPage';
import IncidentDetailsPage from './pages/IncidentDetailsPage';
import Layout from './components/Layout';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';

// ProtectedRoute Wrapper Component
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading, isAuthenticated } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-base text-accent-cyan font-mono text-xs tracking-widest uppercase">
        Initializing Security Core...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const roleStr = user.role?.value || user.role;
  if (roles && !roles.includes(roleStr)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Portal */}
          <Route path="/login" element={<LoginPage />} />

          {/* Secure Workspace Areas */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/alerts" element={
            <ProtectedRoute>
              <AlertsPage />
            </ProtectedRoute>
          } />
          <Route path="/incidents" element={
            <ProtectedRoute>
              <IncidentsPage />
            </ProtectedRoute>
          } />
          <Route path="/incidents/:id" element={
            <ProtectedRoute>
              <IncidentDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute roles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />

          {/* Catch-all Redirection */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
