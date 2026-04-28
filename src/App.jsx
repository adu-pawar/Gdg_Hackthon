import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Layout
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Unauthorized from './pages/Unauthorized';
import Appointments from './pages/Appointments';
import Inventory from './pages/Inventory';
import Wellness from './pages/Wellness';
import Alerts from './pages/Alerts';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole } = useAuth();
  
  console.log('ProtectedRoute Check:', { 
    path: window.location.pathname, 
    userRole, 
    allowedRoles,
    isAllowed: allowedRoles ? allowedRoles.includes(userRole) : true 
  });

  if (!currentUser) return <Navigate to="/login" />;
  
  // Admins always have access to everything
  if (userRole === 'admin') return children;
  
  if (allowedRoles && !allowedRoles.includes(userRole)) return <Navigate to="/unauthorized" />;
  
  return children;
};

const AppRoutes = () => {
  const { currentUser } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      {/* Protected Routes enclosed in Layout */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        <Route path="dashboard" element={
          <ProtectedRoute allowedRoles={['admin', 'doctor', 'patient', 'pharmacist']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="appointments" element={
          <ProtectedRoute allowedRoles={['admin', 'doctor', 'patient']}>
            <Appointments />
          </ProtectedRoute>
        } />
        <Route path="inventory" element={
          <ProtectedRoute allowedRoles={['admin', 'doctor', 'pharmacist']}>
            <Inventory />
          </ProtectedRoute>
        } />
        <Route path="wellness" element={
          <ProtectedRoute allowedRoles={['admin', 'doctor', 'patient']}>
            <Wellness />
          </ProtectedRoute>
        } />
        <Route path="alerts" element={
          <ProtectedRoute allowedRoles={['admin', 'doctor', 'pharmacist']}>
            <Alerts />
          </ProtectedRoute>
        } />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check user preference or system preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

  // Expose toggle globally for the Navbar
  window.toggleDarkMode = toggleDarkMode;
  window.isDarkMode = darkMode;

  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
