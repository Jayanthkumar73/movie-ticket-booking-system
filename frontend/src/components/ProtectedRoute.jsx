import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, roles } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return <Navigate to="/" />;
    }
  }

  return children;
};

export default ProtectedRoute;
