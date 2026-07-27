import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
    const { token } = useAuth();

    // If there is no token, redirect them to login page
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // If authenticated, render the child route components via Outlet
    return <Outlet />;
};

export default ProtectedRoute;
