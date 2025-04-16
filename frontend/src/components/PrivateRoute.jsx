import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { notify } from '../config/toastConfig';

/**
 * PrivateRoute component that checks if user is authenticated
 * If not authenticated, redirects to login page
 */
const PrivateRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check for token in localStorage
    const token = localStorage.getItem('clickhouse_token');
    
    if (!token) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }
    
    // Simple token validation (could be expanded with JWT expiry check)
    try {
      // Here we're just checking if token exists
      // In a real app, you might want to validate the token or check expiry
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Invalid token:', error);
      localStorage.removeItem('clickhouse_token');
      notify.error('Your session has expired. Please log in again.');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login page, preserving the attempted URL
  if (!isAuthenticated) {
    return <Navigate to="/connect" state={{ from: location }} replace />;
  }

  // If authenticated, render the protected component
  return children;
};

export default PrivateRoute; 