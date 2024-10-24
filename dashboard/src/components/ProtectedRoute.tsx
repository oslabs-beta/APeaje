import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext'; // Assuming you have an AuthContext for managing auth state

const ProtectedRoute: React.FC = () => {
  const { user } = useAuth(); // Assuming useAuth() gives access to auth state
  const location = useLocation();

  // If the user is not authenticated, redirect to the login page
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
