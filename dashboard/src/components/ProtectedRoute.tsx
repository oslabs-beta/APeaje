import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext'; 

const ProtectedRoute: React.FC = () => {
  const { isAuth, loading, username, role } = useAuth(); 
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>
  }

  // If the user is not authenticated, redirect to the login page
  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
