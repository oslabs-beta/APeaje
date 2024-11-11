import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext'; 

const ProtectedRoute: React.FC = () => {
  const { isAuth, username, role } = useAuth(); 
  const location = useLocation();

  // If the user is not authenticated, redirect to the login page
  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
