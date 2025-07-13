import React from 'react';
import { Navigate } from 'react-router-dom';

const TenantProtectedRoute = ({ children }) => {
  const tenantToken = localStorage.getItem('tenantToken');

  // A more robust check in the future could decode the JWT 
  // to check for expiration, but for now, checking for its
  // existence is sufficient.
  if (!tenantToken) {
    // If no token, redirect to the tenant login page
    return <Navigate to="/tenant-login" replace />;
  }

  // If a token exists, render the child component (the protected page)
  return children;
};

export default TenantProtectedRoute;