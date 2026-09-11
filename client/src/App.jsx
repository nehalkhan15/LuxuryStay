import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import HousekeepingDashboard from './pages/HousekeepingDashboard';
import MaintenanceDashboard from './pages/MaintenanceDashboard';
import GuestDashboard from './pages/GuestDashboard';
import CheckInPage from './pages/CheckInPage';
import CheckOutPage from './pages/CheckOutPage';
import BillingPage from './pages/BillingPage';
import InvoicesPage from './pages/InvoicesPage';
import InvoiceDetailsPage from './pages/InvoiceDetailsPage';
import ReservationsPage from './pages/ReservationsPage';
import ReservationDetailsPage from './pages/ReservationDetailsPage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailsPage from './pages/RoomDetailsPage';
import GuestsPage from './pages/GuestsPage';
import GuestProfilePage from './pages/GuestProfilePage';
import AnalyticsPage from './pages/AnalyticsPage';

// Flexible Role-Protected Route Guard
function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-luxury-blue-light border-t-luxury-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    if (user.role === 'Admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'Manager') return <Navigate to="/manager/dashboard" replace />;
    if (user.role === 'Receptionist') return <Navigate to="/reception/dashboard" replace />;
    if (user.role === 'Housekeeping') return <Navigate to="/housekeeping/dashboard" replace />;
      if (user.role === 'Maintenance') return <Navigate to="/maintenance/dashboard" replace />;
    return <Navigate to="/guest/portal" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-luxury-bg text-luxury-navy flex flex-col font-sans selection:bg-luxury-blue-light selection:text-luxury-navy">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Authentication */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* 1. Admin Environment */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute roles={['Admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* 2. Manager Environment */}
            <Route 
              path="/manager/*" 
              element={
                <ProtectedRoute roles={['Manager', 'Admin']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              } 
            />

            {/* 3. Receptionist Environment */}
            <Route 
              path="/reception/*" 
              element={
                <ProtectedRoute roles={['Receptionist', 'Manager', 'Admin']}>
                  <ReceptionistDashboard />
                </ProtectedRoute>
              } 
            />

            {/* 4. Housekeeping Environment */}
            <Route 
              path="/housekeeping/*" 
              element={
                <ProtectedRoute roles={['Housekeeping', 'Admin']}>
                  <HousekeepingDashboard />
                </ProtectedRoute>
              } 
            />

            {/* 5. Maintenance Environment */}
            <Route
              path="/maintenance/*"
              element={
                <ProtectedRoute roles={['Maintenance']}>
                  <MaintenanceDashboard />
                </ProtectedRoute>
              }
            />

            {/* 6. Guest Environment */}
                            roles={['Guest']}
                            roles={['Guest']}
            <Route 
              path="/guest/*" 
              element={
                <ProtectedRoute roles={['Guest', 'Admin', 'Manager', 'Receptionist', 'Housekeeping']}>
                  <GuestDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user/profile" 
              element={
                <ProtectedRoute roles={['Guest', 'Admin', 'Manager', 'Receptionist', 'Housekeeping']}>
                  <GuestDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Operational Deep-Link Routes */}
            <Route 
              path="/check-in" 
              element={
                <ProtectedRoute roles={['Receptionist', 'Manager', 'Admin']}>
                  <CheckInPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/check-out" 
              element={
                <ProtectedRoute roles={['Receptionist', 'Manager', 'Admin']}>
                  <CheckOutPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/billing" 
              element={
                <ProtectedRoute roles={['Receptionist', 'Manager', 'Admin']}>
                  <BillingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/invoices" 
              element={
                <ProtectedRoute roles={['Receptionist', 'Manager', 'Admin', 'Guest']}>
                  <InvoicesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/invoices/:id" 
              element={
                <ProtectedRoute roles={['Receptionist', 'Manager', 'Admin', 'Guest']}>
                  <InvoiceDetailsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reservations" 
              element={
                <ProtectedRoute roles={['Receptionist', 'Manager', 'Admin', 'Guest']}>
                  <ReservationsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reservations/:id" 
              element={
                <ProtectedRoute roles={['Receptionist', 'Manager', 'Admin', 'Guest']}>
                  <ReservationDetailsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/rooms" 
              element={
                <ProtectedRoute roles={['Admin', 'Manager', 'Receptionist', 'Housekeeping', 'Guest']}>
                  <RoomsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/rooms/:id" 
              element={
                <ProtectedRoute roles={['Admin', 'Manager', 'Receptionist', 'Housekeeping', 'Guest']}>
                  <RoomDetailsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/guests" 
              element={
                <ProtectedRoute roles={['Receptionist', 'Manager', 'Admin']}>
                  <GuestsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/guests/:id" 
              element={
                <ProtectedRoute roles={['Receptionist', 'Manager', 'Admin']}>
                  <GuestProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute roles={['Manager', 'Admin']}>
                  <AnalyticsPage />
                </ProtectedRoute>
              } 
            />

            {/* Wildcard Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
