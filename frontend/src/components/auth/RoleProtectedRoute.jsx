import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader } from 'lucide-react';

const RoleProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader className="h-12 w-12 animate-spin text-purple-600"/>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.includes(user.role)) {
        return <Outlet />;
    } else {
        // 4. If the user's role is not allowed, redirect them to their default page.
        const redirectTo = user.role === 'driver' ? '/driver/dashboard' : '/bookings';
        return <Navigate to={redirectTo} replace />;
    }
};

export default RoleProtectedRoute;