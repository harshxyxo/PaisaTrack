// Testing CodeRabbit Automated Review
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Layout from './components/Layout';

// Pages
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import Analytics from './pages/Analytics';
import BudgetGoals from './pages/BudgetGoals';
import SplitBills from './pages/SplitBills';
import Profile from './pages/Profile';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return (
    <div className="h-screen w-screen bg-[#080e1d] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#bd9dff] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return <>{children}</>;
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  
  // FIX: We rely on whether the user is authenticated to route them, 
  // not a buggy local storage flag for onboarding.

  return (
    <Routes>
      {/* Onboarding is always accessible if you type it, but normally only hit after Register */}
      <Route path="/onboarding" element={<Onboarding />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
      
      {/* Root Route: Go to Dashboard if logged in, else Login */}
      <Route path="/" element={
        isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
      } />

      {/* Protected App Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/add" element={<ProtectedRoute><Layout><AddTransaction /></Layout></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
      <Route path="/goals" element={<ProtectedRoute><Layout><BudgetGoals /></Layout></ProtectedRoute>} />
      <Route path="/splits" element={<ProtectedRoute><Layout><SplitBills /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: '#131B2C',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '1rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }
          }}
        />
      </AuthProvider>
    </Router>
  );
}

export default App;