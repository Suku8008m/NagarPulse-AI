import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import LoginModal from './components/common/LoginModal';
import PublicMapPage from './pages/PublicMapPage';
import CitizenPortalPage from './pages/CitizenPortalPage';
import OperatorPortalPage from './pages/OperatorPortalPage';
import AdminPortalPage from './pages/AdminPortalPage';
import PortalLoginPage from './pages/PortalLoginPage';
import { useGrievances } from './hooks/useGrievances';

// Role-based route guard
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-mono">Verifying authorization credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return children;
}

function MainLayout() {
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  const {
    grievances,
    stats,
    isLoading,
    upvote,
    updateGrievanceLocally,
    refetch,
  } = useGrievances();

  const handleGrievanceCreated = (newGrievance) => {
    updateGrievanceLocally(newGrievance);
    refetch();
  };

  const handleGrievanceUpdated = (updatedGrievance) => {
    updateGrievanceLocally(updatedGrievance);
    refetch();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white text-slate-900">
      {/* 64px Sticky Role-Aware Navbar */}
      <Navbar />

      {/* Main Page View Routes */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <Routes>
          {/* Public Live Map & KPI Strip */}
          <Route
            path="/"
            element={
              <PublicMapPage
                grievances={grievances}
                stats={stats}
                onUpvote={upvote}
                selectedGrievance={selectedGrievance}
                onSelectGrievance={setSelectedGrievance}
                isLoading={isLoading}
              />
            }
          />

          {/* Citizen Portal (Report Hazard + My Complaints) */}
          <Route
            path="/citizen"
            element={
              <CitizenPortalPage
                grievances={grievances}
                onGrievanceCreated={handleGrievanceCreated}
              />
            }
          />

          {/* Dedicated Gateway / Login Page */}
          <Route path="/login" element={<PortalLoginPage />} />

          {/* Protected Field Operator Desk */}
          <Route
            path="/operator"
            element={
              <ProtectedRoute allowedRoles={['operator', 'admin']}>
                <OperatorPortalPage
                  grievances={grievances}
                  onGrievanceUpdated={handleGrievanceUpdated}
                  isLoading={isLoading}
                />
              </ProtectedRoute>
            }
          />

          {/* Protected Municipal Command Center */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPortalPage
                  grievances={grievances}
                  onGrievanceUpdated={handleGrievanceUpdated}
                />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirects to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Modal for quick auth actions */}
      <LoginModal />

      {/* Footer with personal signature and judge quick links */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
