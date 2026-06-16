import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function ProtectedRoute({ children, allowedTypes = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(user.user_type)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

export default ProtectedRoute;